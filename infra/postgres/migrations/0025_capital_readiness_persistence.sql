BEGIN;

-- CAPITAL_READINESS INT1.6A
-- Additive persistence for human-reviewed readiness facts and append-only
-- lifecycle history. Evidence/risk/package/CONTROL outputs remain rebuildable.
-- This migration creates no financial authority, wallet, custody, payment,
-- disbursement, investment recommendation or AI decision path.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION agroway_invest.readiness_reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'READINESS_APPEND_ONLY:%:%', TG_TABLE_SCHEMA, TG_TABLE_NAME
    USING ERRCODE = '55000';
END;
$$;

CREATE OR REPLACE FUNCTION agroway_invest.assert_intake_version_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  previous_created_at timestamptz;
  superseded_version integer;
BEGIN
  IF NEW.intake_version = 1 THEN
    IF EXISTS (
      SELECT 1 FROM agroway_invest.capital_pilot_intake
      WHERE tenant_id = NEW.tenant_id AND project_id = NEW.project_id
    ) THEN
      RAISE EXCEPTION 'INTAKE_VERSION_CHAIN_EXPECTED_NEXT_VERSION'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    SELECT created_at INTO previous_created_at
    FROM agroway_invest.capital_pilot_intake
    WHERE tenant_id = NEW.tenant_id
      AND project_id = NEW.project_id
      AND intake_version = NEW.intake_version - 1;

    IF previous_created_at IS NULL THEN
      RAISE EXCEPTION 'INTAKE_VERSION_CHAIN_PREVIOUS_MISSING'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.created_at < previous_created_at THEN
      RAISE EXCEPTION 'INTAKE_VERSION_TIME_REGRESSION'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.supersedes_intake_id IS NOT NULL THEN
    SELECT intake_version INTO superseded_version
    FROM agroway_invest.capital_pilot_intake
    WHERE tenant_id = NEW.tenant_id
      AND project_id = NEW.project_id
      AND intake_id = NEW.supersedes_intake_id;

    IF superseded_version IS NULL OR superseded_version >= NEW.intake_version THEN
      RAISE EXCEPTION 'INTAKE_SUPERSESSION_MUST_REFERENCE_PRIOR_VERSION'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION agroway_invest.assert_intake_transition_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prior_sequence integer;
  prior_to_state text;
  prior_occurred_at timestamptz;
  paused_from_state text;
  intake_created_at timestamptz;
  legal boolean := false;
BEGIN
  SELECT created_at INTO intake_created_at
  FROM agroway_invest.capital_pilot_intake
  WHERE tenant_id = NEW.tenant_id
    AND project_id = NEW.project_id
    AND intake_id = NEW.intake_id
    AND intake_version = NEW.intake_version;

  IF intake_created_at IS NULL THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_PARENT_MISSING'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.occurred_at < intake_created_at THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_BEFORE_INTAKE_CREATION'
      USING ERRCODE = '23514';
  END IF;

  SELECT sequence, to_state, occurred_at
  INTO prior_sequence, prior_to_state, prior_occurred_at
  FROM agroway_invest.capital_pilot_intake_transition
  WHERE tenant_id = NEW.tenant_id
    AND project_id = NEW.project_id
    AND intake_id = NEW.intake_id
  ORDER BY sequence DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    IF NEW.sequence <> 0 OR NEW.from_state IS NOT NULL OR NEW.to_state <> 'CREATED' THEN
      RAISE EXCEPTION 'INTAKE_INITIAL_TRANSITION_MUST_BE_NULL_TO_CREATED_SEQUENCE_0'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.sequence <> prior_sequence + 1 THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_SEQUENCE_NOT_CONTIGUOUS'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.from_state IS DISTINCT FROM prior_to_state THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_FROM_STATE_STALE'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.occurred_at < prior_occurred_at THEN
    RAISE EXCEPTION 'INTAKE_TRANSITION_TIME_REGRESSION'
      USING ERRCODE = '23514';
  END IF;

  IF prior_to_state = 'WITHDRAWN' THEN
    RAISE EXCEPTION 'WITHDRAWN_INTAKE_IS_TERMINAL'
      USING ERRCODE = '23514';
  END IF;

  IF prior_to_state = 'PAUSED' THEN
    IF NEW.to_state = 'WITHDRAWN' THEN
      legal := true;
    ELSE
      SELECT to_state INTO paused_from_state
      FROM agroway_invest.capital_pilot_intake_transition
      WHERE tenant_id = NEW.tenant_id
        AND project_id = NEW.project_id
        AND intake_id = NEW.intake_id
        AND sequence = prior_sequence - 1;

      IF NOT FOUND OR NEW.to_state IS DISTINCT FROM paused_from_state THEN
        RAISE EXCEPTION 'INVALID_INTAKE_RESUME_TARGET'
          USING ERRCODE = '23514';
      END IF;
      legal := true;
    END IF;
  ELSE
    legal := CASE prior_to_state
      WHEN 'CREATED' THEN NEW.to_state IN ('CANONICAL_REUSE_SCAN','PAUSED','WITHDRAWN')
      WHEN 'CANONICAL_REUSE_SCAN' THEN NEW.to_state IN ('DATA_COMPLETION','PAUSED','WITHDRAWN')
      WHEN 'DATA_COMPLETION' THEN NEW.to_state IN ('EVIDENCE_VALIDATION','PAUSED','WITHDRAWN')
      WHEN 'EVIDENCE_VALIDATION' THEN NEW.to_state IN ('DATA_COMPLETION','ASSESSMENT_READY','PAUSED','WITHDRAWN')
      WHEN 'ASSESSMENT_READY' THEN NEW.to_state IN ('UNDER_ASSESSMENT','PAUSED','WITHDRAWN')
      WHEN 'UNDER_ASSESSMENT' THEN NEW.to_state IN ('GAP_REMEDIATION','HUMAN_REVIEW','PAUSED','WITHDRAWN')
      WHEN 'GAP_REMEDIATION' THEN NEW.to_state IN ('EVIDENCE_VALIDATION','UNDER_ASSESSMENT','HUMAN_REVIEW','PAUSED','WITHDRAWN')
      WHEN 'HUMAN_REVIEW' THEN NEW.to_state IN ('CAPITAL_READY','READY_WITH_CONDITIONS','NOT_READY','REASSESSMENT_REQUIRED','GAP_REMEDIATION','PAUSED','WITHDRAWN')
      WHEN 'CAPITAL_READY' THEN NEW.to_state IN ('REASSESSMENT_REQUIRED','PAUSED','WITHDRAWN')
      WHEN 'READY_WITH_CONDITIONS' THEN NEW.to_state IN ('GAP_REMEDIATION','REASSESSMENT_REQUIRED','PAUSED','WITHDRAWN')
      WHEN 'NOT_READY' THEN NEW.to_state IN ('GAP_REMEDIATION','REASSESSMENT_REQUIRED','WITHDRAWN')
      WHEN 'REASSESSMENT_REQUIRED' THEN NEW.to_state IN ('DATA_COMPLETION','EVIDENCE_VALIDATION','UNDER_ASSESSMENT','PAUSED','WITHDRAWN')
      ELSE false
    END;
  END IF;

  IF NOT legal THEN
    RAISE EXCEPTION 'INVALID_INTAKE_TRANSITION:%:%', prior_to_state, NEW.to_state
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION agroway_invest.assert_assessment_version_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  previous_reviewed_at timestamptz;
  intake_state text;
BEGIN
  IF NEW.version = 1 THEN
    IF EXISTS (
      SELECT 1 FROM agroway_invest.readiness_assessment
      WHERE tenant_id = NEW.tenant_id AND project_id = NEW.project_id
    ) THEN
      RAISE EXCEPTION 'READINESS_VERSION_CHAIN_EXPECTED_NEXT_VERSION'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    SELECT reviewed_at INTO previous_reviewed_at
    FROM agroway_invest.readiness_assessment
    WHERE tenant_id = NEW.tenant_id
      AND project_id = NEW.project_id
      AND version = NEW.version - 1;

    IF previous_reviewed_at IS NULL THEN
      RAISE EXCEPTION 'READINESS_VERSION_CHAIN_PREVIOUS_MISSING'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.reviewed_at < previous_reviewed_at THEN
      RAISE EXCEPTION 'READINESS_REVIEW_TIME_REGRESSION'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  SELECT t.to_state INTO intake_state
  FROM agroway_invest.capital_pilot_intake_transition t
  WHERE t.tenant_id = NEW.tenant_id
    AND t.project_id = NEW.project_id
    AND t.intake_id = NEW.intake_id
    AND t.intake_version = NEW.intake_version
    AND t.occurred_at <= NEW.reviewed_at
  ORDER BY t.occurred_at DESC, t.sequence DESC
  LIMIT 1;

  IF intake_state IS DISTINCT FROM 'HUMAN_REVIEW' THEN
    RAISE EXCEPTION 'READINESS_FINAL_REVIEW_REQUIRES_HUMAN_REVIEW_INTAKE_STATE'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION agroway_invest.reject_child_insert_after_assessment_finalized()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM agroway_invest.readiness_assessment a
    WHERE a.tenant_id = NEW.tenant_id
      AND a.project_id = NEW.project_id
      AND a.assessment_id = NEW.assessment_id
      AND a.version = NEW.assessment_version
  ) THEN
    RAISE EXCEPTION 'READINESS_ASSESSMENT_ALREADY_FINALIZED'
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION agroway_invest.assert_gap_transition_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prior_sequence integer;
  prior_to_state text;
  prior_occurred_at timestamptz;
  gap_opened_at timestamptz;
  legal boolean := false;
BEGIN
  SELECT opened_at INTO gap_opened_at
  FROM agroway_invest.readiness_gap
  WHERE tenant_id = NEW.tenant_id
    AND project_id = NEW.project_id
    AND assessment_id = NEW.assessment_id
    AND assessment_version = NEW.assessment_version
    AND gap_id = NEW.gap_id;

  IF gap_opened_at IS NULL THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_PARENT_MISSING'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.occurred_at < gap_opened_at THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_BEFORE_OPENED'
      USING ERRCODE = '23514';
  END IF;

  SELECT sequence, to_state, occurred_at
  INTO prior_sequence, prior_to_state, prior_occurred_at
  FROM agroway_invest.readiness_gap_transition
  WHERE tenant_id = NEW.tenant_id
    AND project_id = NEW.project_id
    AND assessment_id = NEW.assessment_id
    AND assessment_version = NEW.assessment_version
    AND gap_id = NEW.gap_id
  ORDER BY sequence DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    IF NEW.sequence <> 0 OR NEW.from_state IS NOT NULL OR NEW.to_state <> 'OPEN' THEN
      RAISE EXCEPTION 'READINESS_GAP_INITIAL_TRANSITION_MUST_BE_NULL_TO_OPEN_SEQUENCE_0'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.sequence <> prior_sequence + 1 THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_SEQUENCE_NOT_CONTIGUOUS'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.from_state IS DISTINCT FROM prior_to_state THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_FROM_STATE_STALE'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.occurred_at < prior_occurred_at THEN
    RAISE EXCEPTION 'READINESS_GAP_TRANSITION_TIME_REGRESSION'
      USING ERRCODE = '23514';
  END IF;

  IF prior_to_state IN ('RESOLVED','WAIVED','SUPERSEDED') THEN
    RAISE EXCEPTION 'READINESS_GAP_TERMINAL_STATE'
      USING ERRCODE = '23514';
  END IF;

  legal := CASE prior_to_state
    WHEN 'OPEN' THEN NEW.to_state IN ('IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED')
    WHEN 'IN_REMEDIATION' THEN NEW.to_state IN ('EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED')
    WHEN 'EVIDENCE_SUBMITTED' THEN NEW.to_state IN ('IN_REMEDIATION','RESOLVED','WAIVED','SUPERSEDED')
    ELSE false
  END;

  IF NOT legal THEN
    RAISE EXCEPTION 'INVALID_READINESS_GAP_TRANSITION:%:%', prior_to_state, NEW.to_state
      USING ERRCODE = '23514';
  END IF;

  IF NEW.to_state = 'RESOLVED' THEN
    IF cardinality(NEW.resolution_evidence_refs) = 0 OR NEW.note IS NULL OR length(btrim(NEW.note)) = 0 THEN
      RAISE EXCEPTION 'READINESS_GAP_RESOLUTION_REQUIRES_EVIDENCE_AND_NOTE'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.to_state = 'WAIVED' THEN
    IF NEW.note IS NULL OR length(btrim(NEW.note)) = 0 THEN
      RAISE EXCEPTION 'READINESS_GAP_WAIVER_REQUIRES_NOTE'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Canonical readiness tables
-- ---------------------------------------------------------------------------

CREATE TABLE agroway_invest.capital_pilot_intake (
  intake_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  intake_version integer NOT NULL CHECK (intake_version > 0),
  source_type text NOT NULL CHECK (source_type IN (
    'PRODUCER_DIRECT','SANA_DIAGNOSTIC','OFFTAKER','FINANCIAL_PARTNER',
    'COOPERATION_PROGRAM','PUBLIC_PROGRAM','INTERNAL_PIPELINE'
  )),
  source_ref text NOT NULL CHECK (length(btrim(source_ref)) > 0),
  originator_ref text CHECK (originator_ref IS NULL OR length(btrim(originator_ref)) > 0),
  consent_set_ref text CHECK (consent_set_ref IS NULL OR length(btrim(consent_set_ref)) > 0),
  data_pack_version text NOT NULL CHECK (length(btrim(data_pack_version)) > 0),
  supersedes_intake_id uuid,
  created_at timestamptz NOT NULL,

  CONSTRAINT capital_pilot_intake_tenant_project_version_uq
    UNIQUE (tenant_id, project_id, intake_version),
  CONSTRAINT capital_pilot_intake_tenant_project_intake_uq
    UNIQUE (tenant_id, project_id, intake_id),
  CONSTRAINT capital_pilot_intake_tenant_project_intake_version_uq
    UNIQUE (tenant_id, project_id, intake_id, intake_version),
  CONSTRAINT capital_pilot_intake_tenant_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id),
  CONSTRAINT capital_pilot_intake_supersedes_fk
    FOREIGN KEY (tenant_id, project_id, supersedes_intake_id)
    REFERENCES agroway_invest.capital_pilot_intake (tenant_id, project_id, intake_id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE agroway_invest.capital_pilot_intake_transition (
  transition_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  intake_id uuid NOT NULL,
  intake_version integer NOT NULL CHECK (intake_version > 0),
  sequence integer NOT NULL CHECK (sequence >= 0),
  from_state text CHECK (from_state IS NULL OR from_state IN (
    'CREATED','CANONICAL_REUSE_SCAN','DATA_COMPLETION','EVIDENCE_VALIDATION',
    'ASSESSMENT_READY','UNDER_ASSESSMENT','GAP_REMEDIATION','HUMAN_REVIEW',
    'CAPITAL_READY','READY_WITH_CONDITIONS','NOT_READY','REASSESSMENT_REQUIRED',
    'PAUSED','WITHDRAWN'
  )),
  to_state text NOT NULL CHECK (to_state IN (
    'CREATED','CANONICAL_REUSE_SCAN','DATA_COMPLETION','EVIDENCE_VALIDATION',
    'ASSESSMENT_READY','UNDER_ASSESSMENT','GAP_REMEDIATION','HUMAN_REVIEW',
    'CAPITAL_READY','READY_WITH_CONDITIONS','NOT_READY','REASSESSMENT_REQUIRED',
    'PAUSED','WITHDRAWN'
  )),
  actor_ref text NOT NULL CHECK (length(btrim(actor_ref)) > 0),
  reason text CHECK (reason IS NULL OR length(btrim(reason)) > 0),
  occurred_at timestamptz NOT NULL,

  CONSTRAINT capital_pilot_intake_transition_sequence_uq
    UNIQUE (tenant_id, project_id, intake_id, sequence),
  CONSTRAINT capital_pilot_intake_transition_parent_fk
    FOREIGN KEY (tenant_id, project_id, intake_id, intake_version)
    REFERENCES agroway_invest.capital_pilot_intake
      (tenant_id, project_id, intake_id, intake_version)
);

CREATE TABLE agroway_invest.readiness_assessment (
  assessment_id text PRIMARY KEY CHECK (length(btrim(assessment_id)) > 0),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  intake_id uuid NOT NULL,
  intake_version integer NOT NULL CHECK (intake_version > 0),
  policy_version text NOT NULL CHECK (length(btrim(policy_version)) > 0),
  methodology_version text NOT NULL CHECK (length(btrim(methodology_version)) > 0),
  project_snapshot_ref text NOT NULL CHECK (length(btrim(project_snapshot_ref)) > 0),
  approved_budget_version integer CHECK (approved_budget_version IS NULL OR approved_budget_version > 0),
  evidence_manifest_as_of timestamptz NOT NULL,
  risk_profile_as_of timestamptz NOT NULL,
  evidence_manifest_digest_sha256 char(64) NOT NULL
    CHECK (btrim(evidence_manifest_digest_sha256) ~ '^[a-f0-9]{64}$'),
  risk_profile_digest_sha256 char(64) NOT NULL
    CHECK (btrim(risk_profile_digest_sha256) ~ '^[a-f0-9]{64}$'),
  source_risk_digest_sha256 char(64) NOT NULL
    CHECK (btrim(source_risk_digest_sha256) ~ '^[a-f0-9]{64}$'),
  evidence_coverage_bps integer NOT NULL CHECK (evidence_coverage_bps BETWEEN 0 AND 10000),
  decision text NOT NULL CHECK (decision IN (
    'NOT_CAPITAL_READY','CAPITAL_READY_WITH_CONDITIONS','CAPITAL_READY','REASSESSMENT_REQUIRED'
  )),
  deterministic_maximum_decision text NOT NULL CHECK (deterministic_maximum_decision IN (
    'NOT_CAPITAL_READY','CAPITAL_READY_WITH_CONDITIONS','CAPITAL_READY'
  )),
  rationale text NOT NULL CHECK (length(btrim(rationale)) > 0),
  reviewer_ref text NOT NULL CHECK (length(btrim(reviewer_ref)) > 0),
  reviewed_at timestamptz NOT NULL,
  digest_sha256 char(64) NOT NULL CHECK (btrim(digest_sha256) ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT readiness_assessment_source_time_ck CHECK (
    reviewed_at >= evidence_manifest_as_of
    AND reviewed_at >= risk_profile_as_of
    AND created_at >= reviewed_at
  ),
  CONSTRAINT readiness_assessment_decision_ceiling_ck CHECK (
    (deterministic_maximum_decision = 'NOT_CAPITAL_READY'
      AND decision IN ('NOT_CAPITAL_READY','REASSESSMENT_REQUIRED'))
    OR
    (deterministic_maximum_decision = 'CAPITAL_READY_WITH_CONDITIONS'
      AND decision IN ('NOT_CAPITAL_READY','CAPITAL_READY_WITH_CONDITIONS','REASSESSMENT_REQUIRED'))
    OR
    (deterministic_maximum_decision = 'CAPITAL_READY'
      AND decision IN ('NOT_CAPITAL_READY','CAPITAL_READY','REASSESSMENT_REQUIRED'))
  ),
  CONSTRAINT readiness_assessment_tenant_project_version_uq
    UNIQUE (tenant_id, project_id, version),
  CONSTRAINT readiness_assessment_tenant_project_id_version_uq
    UNIQUE (tenant_id, project_id, assessment_id, version),
  CONSTRAINT readiness_assessment_tenant_project_digest_uq
    UNIQUE (tenant_id, project_id, digest_sha256),
  CONSTRAINT readiness_assessment_tenant_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id),
  CONSTRAINT readiness_assessment_intake_fk
    FOREIGN KEY (tenant_id, project_id, intake_id, intake_version)
    REFERENCES agroway_invest.capital_pilot_intake
      (tenant_id, project_id, intake_id, intake_version),
  CONSTRAINT readiness_assessment_budget_fk
    FOREIGN KEY (tenant_id, project_id, approved_budget_version)
    REFERENCES agroway_invest.budget_version (tenant_id, project_id, version)
    DEFERRABLE INITIALLY IMMEDIATE
);

CREATE TABLE agroway_invest.readiness_gate_assessment (
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  assessment_id text NOT NULL,
  assessment_version integer NOT NULL CHECK (assessment_version > 0),
  gate_id text NOT NULL CHECK (gate_id IN (
    'G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK',
    'G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'
  )),
  result text NOT NULL CHECK (result IN (
    'PASS','PASS_WITH_CONDITIONS','INCOMPLETE','BLOCKED','NOT_APPLICABLE'
  )),
  rationale text NOT NULL CHECK (length(btrim(rationale)) > 0),
  evidence_refs text[] NOT NULL DEFAULT '{}'::text[]
    CHECK (array_position(evidence_refs, NULL) IS NULL),
  confidence_bps integer NOT NULL CHECK (confidence_bps BETWEEN 0 AND 10000),
  assessed_at timestamptz NOT NULL,
  assessed_by text NOT NULL CHECK (length(btrim(assessed_by)) > 0),
  method_version text NOT NULL CHECK (length(btrim(method_version)) > 0),

  PRIMARY KEY (tenant_id, project_id, assessment_id, gate_id),
  CONSTRAINT readiness_gate_assessment_parent_key_uq
    UNIQUE (tenant_id, project_id, assessment_id, assessment_version, gate_id),
  CONSTRAINT readiness_gate_assessment_parent_fk
    FOREIGN KEY (tenant_id, project_id, assessment_id, assessment_version)
    REFERENCES agroway_invest.readiness_assessment
      (tenant_id, project_id, assessment_id, version)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE agroway_invest.readiness_gap (
  gap_id text PRIMARY KEY CHECK (length(btrim(gap_id)) > 0),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  assessment_id text NOT NULL,
  assessment_version integer NOT NULL CHECK (assessment_version > 0),
  gate_id text NOT NULL CHECK (gate_id IN (
    'G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK',
    'G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'
  )),
  code text NOT NULL CHECK (length(btrim(code)) > 0),
  severity text NOT NULL CHECK (severity IN ('INFO','WARNING','CRITICAL')),
  blocking boolean NOT NULL,
  description text NOT NULL CHECK (length(btrim(description)) > 0),
  source_ref text NOT NULL CHECK (length(btrim(source_ref)) > 0),
  owner_ref text CHECK (owner_ref IS NULL OR length(btrim(owner_ref)) > 0),
  due_at timestamptz,
  required_evidence_roles text[] NOT NULL DEFAULT '{}'::text[]
    CHECK (array_position(required_evidence_roles, NULL) IS NULL),
  opened_at timestamptz NOT NULL,

  CONSTRAINT readiness_gap_due_after_open_ck CHECK (due_at IS NULL OR due_at >= opened_at),
  CONSTRAINT readiness_gap_gate_code_uq
    UNIQUE (tenant_id, project_id, assessment_id, gate_id, code),
  CONSTRAINT readiness_gap_parent_key_uq
    UNIQUE (tenant_id, project_id, assessment_id, assessment_version, gap_id),
  CONSTRAINT readiness_gap_gate_fk
    FOREIGN KEY (tenant_id, project_id, assessment_id, assessment_version, gate_id)
    REFERENCES agroway_invest.readiness_gate_assessment
      (tenant_id, project_id, assessment_id, assessment_version, gate_id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE agroway_invest.readiness_gap_transition (
  transition_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  assessment_id text NOT NULL,
  assessment_version integer NOT NULL CHECK (assessment_version > 0),
  gap_id text NOT NULL,
  sequence integer NOT NULL CHECK (sequence >= 0),
  from_state text CHECK (from_state IS NULL OR from_state IN (
    'OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED'
  )),
  to_state text NOT NULL CHECK (to_state IN (
    'OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED'
  )),
  actor_ref text NOT NULL CHECK (length(btrim(actor_ref)) > 0),
  resolution_evidence_refs text[] NOT NULL DEFAULT '{}'::text[]
    CHECK (array_position(resolution_evidence_refs, NULL) IS NULL),
  note text CHECK (note IS NULL OR length(btrim(note)) > 0),
  occurred_at timestamptz NOT NULL,

  CONSTRAINT readiness_gap_transition_sequence_uq
    UNIQUE (tenant_id, project_id, assessment_id, assessment_version, gap_id, sequence),
  CONSTRAINT readiness_gap_transition_parent_fk
    FOREIGN KEY (tenant_id, project_id, assessment_id, assessment_version, gap_id)
    REFERENCES agroway_invest.readiness_gap
      (tenant_id, project_id, assessment_id, assessment_version, gap_id)
);

-- ---------------------------------------------------------------------------
-- Final assessment integrity
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION agroway_invest.assert_readiness_assessment_complete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  gate_count integer;
  wrong_method_count integer;
  gate_record record;
  blocking_count integer;
  condition_count integer;
  total_gap_count integer;
  missing_initial_gap_transition_count integer;
BEGIN
  SELECT count(*) INTO gate_count
  FROM agroway_invest.readiness_gate_assessment g
  WHERE g.tenant_id = NEW.tenant_id
    AND g.project_id = NEW.project_id
    AND g.assessment_id = NEW.assessment_id
    AND g.assessment_version = NEW.version;

  IF gate_count <> 9 THEN
    RAISE EXCEPTION 'READINESS_ASSESSMENT_REQUIRES_EXACTLY_NINE_GATES:%', gate_count
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO wrong_method_count
  FROM agroway_invest.readiness_gate_assessment g
  WHERE g.tenant_id = NEW.tenant_id
    AND g.project_id = NEW.project_id
    AND g.assessment_id = NEW.assessment_id
    AND g.assessment_version = NEW.version
    AND g.method_version IS DISTINCT FROM NEW.methodology_version;

  IF wrong_method_count <> 0 THEN
    RAISE EXCEPTION 'READINESS_GATE_METHOD_VERSION_MISMATCH'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM agroway_invest.readiness_gate_assessment g
    WHERE g.tenant_id = NEW.tenant_id
      AND g.project_id = NEW.project_id
      AND g.assessment_id = NEW.assessment_id
      AND g.assessment_version = NEW.version
      AND g.assessed_at > NEW.reviewed_at
  ) THEN
    RAISE EXCEPTION 'READINESS_GATE_ASSESSED_AFTER_FINAL_REVIEW'
      USING ERRCODE = '23514';
  END IF;

  FOR gate_record IN
    SELECT g.*
    FROM agroway_invest.readiness_gate_assessment g
    WHERE g.tenant_id = NEW.tenant_id
      AND g.project_id = NEW.project_id
      AND g.assessment_id = NEW.assessment_id
      AND g.assessment_version = NEW.version
  LOOP
    SELECT
      count(*) FILTER (WHERE gap.blocking),
      count(*) FILTER (WHERE NOT gap.blocking),
      count(*)
    INTO blocking_count, condition_count, total_gap_count
    FROM agroway_invest.readiness_gap gap
    WHERE gap.tenant_id = NEW.tenant_id
      AND gap.project_id = NEW.project_id
      AND gap.assessment_id = NEW.assessment_id
      AND gap.assessment_version = NEW.version
      AND gap.gate_id = gate_record.gate_id;

    IF gate_record.result = 'PASS' AND total_gap_count <> 0 THEN
      RAISE EXCEPTION 'READINESS_PASS_GATE_CANNOT_HAVE_GAPS:%', gate_record.gate_id
        USING ERRCODE = '23514';
    ELSIF gate_record.result = 'PASS_WITH_CONDITIONS'
      AND (blocking_count <> 0 OR condition_count = 0) THEN
      RAISE EXCEPTION 'READINESS_CONDITIONAL_GATE_REQUIRES_NONBLOCKING_GAP:%', gate_record.gate_id
        USING ERRCODE = '23514';
    ELSIF gate_record.result = 'BLOCKED' AND blocking_count = 0 THEN
      RAISE EXCEPTION 'READINESS_BLOCKED_GATE_REQUIRES_BLOCKING_GAP:%', gate_record.gate_id
        USING ERRCODE = '23514';
    ELSIF gate_record.result = 'NOT_APPLICABLE'
      AND (total_gap_count <> 0 OR cardinality(gate_record.evidence_refs) <> 0) THEN
      RAISE EXCEPTION 'READINESS_NOT_APPLICABLE_GATE_CANNOT_HAVE_GAPS_OR_EVIDENCE:%', gate_record.gate_id
        USING ERRCODE = '23514';
    ELSIF gate_record.result = 'INCOMPLETE' AND blocking_count <> 0 THEN
      RAISE EXCEPTION 'READINESS_INCOMPLETE_GATE_CANNOT_HIDE_BLOCKING_GAP:%', gate_record.gate_id
        USING ERRCODE = '23514';
    END IF;
  END LOOP;

  SELECT
    count(*) FILTER (WHERE blocking),
    count(*) FILTER (WHERE NOT blocking),
    count(*)
  INTO blocking_count, condition_count, total_gap_count
  FROM agroway_invest.readiness_gap gap
  WHERE gap.tenant_id = NEW.tenant_id
    AND gap.project_id = NEW.project_id
    AND gap.assessment_id = NEW.assessment_id
    AND gap.assessment_version = NEW.version;

  IF EXISTS (
    SELECT 1 FROM agroway_invest.readiness_gap gap
    WHERE gap.tenant_id = NEW.tenant_id
      AND gap.project_id = NEW.project_id
      AND gap.assessment_id = NEW.assessment_id
      AND gap.assessment_version = NEW.version
      AND gap.opened_at > NEW.reviewed_at
  ) THEN
    RAISE EXCEPTION 'READINESS_GAP_OPENED_AFTER_FINAL_REVIEW'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO missing_initial_gap_transition_count
  FROM agroway_invest.readiness_gap gap
  WHERE gap.tenant_id = NEW.tenant_id
    AND gap.project_id = NEW.project_id
    AND gap.assessment_id = NEW.assessment_id
    AND gap.assessment_version = NEW.version
    AND NOT EXISTS (
      SELECT 1 FROM agroway_invest.readiness_gap_transition t
      WHERE t.tenant_id = gap.tenant_id
        AND t.project_id = gap.project_id
        AND t.assessment_id = gap.assessment_id
        AND t.assessment_version = gap.assessment_version
        AND t.gap_id = gap.gap_id
        AND t.sequence = 0
        AND t.from_state IS NULL
        AND t.to_state = 'OPEN'
    );

  IF missing_initial_gap_transition_count <> 0 THEN
    RAISE EXCEPTION 'READINESS_GAP_INITIAL_TRANSITION_MISSING'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.decision = 'CAPITAL_READY' THEN
    IF NEW.deterministic_maximum_decision <> 'CAPITAL_READY'
      OR total_gap_count <> 0
      OR EXISTS (
        SELECT 1 FROM agroway_invest.readiness_gate_assessment g
        WHERE g.tenant_id = NEW.tenant_id
          AND g.project_id = NEW.project_id
          AND g.assessment_id = NEW.assessment_id
          AND g.assessment_version = NEW.version
          AND g.result IN ('BLOCKED','INCOMPLETE','PASS_WITH_CONDITIONS')
      ) THEN
      RAISE EXCEPTION 'READINESS_CAPITAL_READY_INCONSISTENT'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.decision = 'CAPITAL_READY_WITH_CONDITIONS' THEN
    IF NEW.deterministic_maximum_decision <> 'CAPITAL_READY_WITH_CONDITIONS'
      OR blocking_count <> 0
      OR condition_count = 0
      OR NOT EXISTS (
        SELECT 1 FROM agroway_invest.readiness_gate_assessment g
        WHERE g.tenant_id = NEW.tenant_id
          AND g.project_id = NEW.project_id
          AND g.assessment_id = NEW.assessment_id
          AND g.assessment_version = NEW.version
          AND g.result = 'PASS_WITH_CONDITIONS'
      ) THEN
      RAISE EXCEPTION 'READINESS_CONDITIONAL_DECISION_INCONSISTENT'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER capital_pilot_intake_version_chain_bi
BEFORE INSERT ON agroway_invest.capital_pilot_intake
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_intake_version_chain();

CREATE TRIGGER capital_pilot_intake_transition_chain_bi
BEFORE INSERT ON agroway_invest.capital_pilot_intake_transition
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_intake_transition_chain();

CREATE TRIGGER readiness_assessment_version_chain_bi
BEFORE INSERT ON agroway_invest.readiness_assessment
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_assessment_version_chain();

CREATE TRIGGER readiness_gate_before_finalized_bi
BEFORE INSERT ON agroway_invest.readiness_gate_assessment
FOR EACH ROW EXECUTE FUNCTION agroway_invest.reject_child_insert_after_assessment_finalized();

CREATE TRIGGER readiness_gap_before_finalized_bi
BEFORE INSERT ON agroway_invest.readiness_gap
FOR EACH ROW EXECUTE FUNCTION agroway_invest.reject_child_insert_after_assessment_finalized();

CREATE TRIGGER readiness_gap_transition_chain_bi
BEFORE INSERT ON agroway_invest.readiness_gap_transition
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_gap_transition_chain();

CREATE CONSTRAINT TRIGGER readiness_assessment_complete_ct
AFTER INSERT ON agroway_invest.readiness_assessment
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_readiness_assessment_complete();

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'capital_pilot_intake',
    'capital_pilot_intake_transition',
    'readiness_assessment',
    'readiness_gate_assessment',
    'readiness_gap',
    'readiness_gap_transition'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON agroway_invest.%I FOR EACH ROW EXECUTE FUNCTION agroway_invest.readiness_reject_mutation()',
      table_name || '_append_only_bud', table_name
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Tenant isolation: explicit FORCE RLS on all new readiness tables.
-- The production app role must be a non-owner deployment principal.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'capital_pilot_intake',
    'capital_pilot_intake_transition',
    'readiness_assessment',
    'readiness_gate_assessment',
    'readiness_gap',
    'readiness_gap_transition'
  ]
  LOOP
    EXECUTE format('ALTER TABLE agroway_invest.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE agroway_invest.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON agroway_invest.%I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      table_name || '_tenant_rls', table_name
    );
    EXECUTE format('REVOKE ALL ON TABLE agroway_invest.%I FROM PUBLIC', table_name);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Comments / authority boundary
-- ---------------------------------------------------------------------------

COMMENT ON TABLE agroway_invest.capital_pilot_intake IS
  'Canonical immutable Capital Readiness intake identity/version. Current state is derived from append-only transitions.';
COMMENT ON TABLE agroway_invest.capital_pilot_intake_transition IS
  'Append-only Capital Readiness intake lifecycle. No financial authority.';
COMMENT ON TABLE agroway_invest.readiness_assessment IS
  'Immutable final human-reviewed SANA readiness decision. CAPITAL_READY is not financing approval, investment advice, disbursement authority or guarantee.';
COMMENT ON TABLE agroway_invest.readiness_gate_assessment IS
  'Immutable G1-G9 decision basis for a final readiness assessment.';
COMMENT ON TABLE agroway_invest.readiness_gap IS
  'Immutable blocker/condition definition for one final readiness assessment. Lifecycle is append-only in readiness_gap_transition.';
COMMENT ON TABLE agroway_invest.readiness_gap_transition IS
  'Append-only readiness-gap remediation lifecycle. WAIVED/RESOLVED are human-governed states; no AI authority is implied.';
COMMENT ON COLUMN agroway_invest.readiness_assessment.source_risk_digest_sha256 IS
  'Digest of the canonical source-risk set used to build the ProductiveRiskProfile; the full profile remains rebuildable.';

COMMIT;
