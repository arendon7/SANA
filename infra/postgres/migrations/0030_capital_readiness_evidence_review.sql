BEGIN;

-- CAPITAL_READINESS UX2B-2
-- Canonical HUMAN-only review history for validated evidence receipts.
-- A clean scan and an EVIDENCE_SUBMITTED transition are transport/provenance
-- facts only. They cannot resolve a gap until a distinct human reviewer has
-- explicitly accepted the evidence for that exact gap.

CREATE TABLE agroway_invest.readiness_evidence_review (
  decision_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  assessment_id text NOT NULL CHECK (length(btrim(assessment_id)) > 0),
  assessment_version integer NOT NULL CHECK (assessment_version > 0),
  gap_id text NOT NULL CHECK (length(btrim(gap_id)) > 0),
  receipt_id uuid NOT NULL,
  evidence_ref text NOT NULL CHECK (length(btrim(evidence_ref)) > 0),
  receipt_digest_sha256 char(64) NOT NULL CHECK (btrim(receipt_digest_sha256) ~ '^[a-f0-9]{64}$'),
  sequence integer NOT NULL CHECK (sequence >= 0),
  action text NOT NULL CHECK (action IN ('ACCEPTED_FOR_GAP_REVIEW','REJECTED','REFRESH_REQUIRED')),
  reviewer_ref text NOT NULL CHECK (length(btrim(reviewer_ref)) > 0),
  rationale text NOT NULL CHECK (length(btrim(rationale)) > 0),
  reviewed_at timestamptz NOT NULL,
  previous_decision_digest_sha256 char(64)
    CHECK (previous_decision_digest_sha256 IS NULL OR btrim(previous_decision_digest_sha256) ~ '^[a-f0-9]{64}$'),
  decision_digest_sha256 char(64) NOT NULL CHECK (btrim(decision_digest_sha256) ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT readiness_evidence_review_gap_fk
    FOREIGN KEY (tenant_id,project_id,assessment_id,assessment_version,gap_id)
    REFERENCES agroway_invest.readiness_gap
      (tenant_id,project_id,assessment_id,assessment_version,gap_id),
  CONSTRAINT readiness_evidence_review_receipt_fk
    FOREIGN KEY (receipt_id)
    REFERENCES agroway_invest.readiness_evidence_receipt(receipt_id),
  CONSTRAINT readiness_evidence_review_receipt_sequence_uq
    UNIQUE (tenant_id,receipt_id,sequence),
  CONSTRAINT readiness_evidence_review_tenant_digest_uq
    UNIQUE (tenant_id,decision_digest_sha256)
);

CREATE OR REPLACE FUNCTION agroway_invest.assert_readiness_evidence_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  receipt_tenant uuid;
  receipt_project uuid;
  receipt_assessment text;
  receipt_assessment_version integer;
  receipt_gap text;
  receipt_evidence_ref text;
  receipt_digest char(64);
  receipt_submitter text;
  receipt_submitted_at timestamptz;
  receipt_state text;
  latest_gap_state text;
  prior_sequence integer;
  prior_digest char(64);
  prior_reviewed_at timestamptz;
BEGIN
  SELECT tenant_id,project_id,assessment_id,assessment_version,gap_id,evidence_ref,digest_sha256,
         submitted_by_actor_ref,submitted_at,validation_state
    INTO receipt_tenant,receipt_project,receipt_assessment,receipt_assessment_version,receipt_gap,
         receipt_evidence_ref,receipt_digest,receipt_submitter,receipt_submitted_at,receipt_state
  FROM agroway_invest.readiness_evidence_receipt
  WHERE receipt_id=NEW.receipt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_RECEIPT_NOT_FOUND'
      USING ERRCODE='23503';
  END IF;

  IF receipt_tenant IS DISTINCT FROM NEW.tenant_id
    OR receipt_project IS DISTINCT FROM NEW.project_id
    OR receipt_assessment IS DISTINCT FROM NEW.assessment_id
    OR receipt_assessment_version IS DISTINCT FROM NEW.assessment_version
    OR receipt_gap IS DISTINCT FROM NEW.gap_id
    OR receipt_evidence_ref IS DISTINCT FROM NEW.evidence_ref THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_RECEIPT_SCOPE_MISMATCH'
      USING ERRCODE='23514';
  END IF;

  IF receipt_state IS DISTINCT FROM 'VALIDATED' THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_RECEIPT_NOT_VALIDATED'
      USING ERRCODE='23514';
  END IF;

  IF btrim(receipt_digest) IS DISTINCT FROM btrim(NEW.receipt_digest_sha256) THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_RECEIPT_DIGEST_MISMATCH'
      USING ERRCODE='23514';
  END IF;

  IF receipt_submitter IS NOT DISTINCT FROM NEW.reviewer_ref THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_SEPARATION_OF_DUTIES_REQUIRED'
      USING ERRCODE='23514';
  END IF;

  IF NEW.reviewed_at < receipt_submitted_at THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_BEFORE_RECEIPT_SUBMISSION'
      USING ERRCODE='23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM agroway_invest.readiness_gap_transition t
    WHERE t.tenant_id=NEW.tenant_id
      AND t.project_id=NEW.project_id
      AND t.assessment_id=NEW.assessment_id
      AND t.assessment_version=NEW.assessment_version
      AND t.gap_id=NEW.gap_id
      AND t.to_state='EVIDENCE_SUBMITTED'
      AND t.actor_ref=receipt_submitter
      AND t.occurred_at <= NEW.reviewed_at
      AND NEW.evidence_ref = ANY(t.submitted_evidence_refs)
  ) THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_REQUIRES_SUBMISSION_PROOF'
      USING ERRCODE='23514';
  END IF;

  SELECT t.to_state INTO latest_gap_state
  FROM agroway_invest.readiness_gap_transition t
  WHERE t.tenant_id=NEW.tenant_id
    AND t.project_id=NEW.project_id
    AND t.assessment_id=NEW.assessment_id
    AND t.assessment_version=NEW.assessment_version
    AND t.gap_id=NEW.gap_id
    AND t.occurred_at <= NEW.reviewed_at
  ORDER BY t.sequence DESC
  LIMIT 1;

  IF latest_gap_state IS DISTINCT FROM 'EVIDENCE_SUBMITTED' THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_REQUIRES_EVIDENCE_SUBMITTED_STATE'
      USING ERRCODE='23514';
  END IF;

  SELECT sequence,decision_digest_sha256,reviewed_at
    INTO prior_sequence,prior_digest,prior_reviewed_at
  FROM agroway_invest.readiness_evidence_review
  WHERE tenant_id=NEW.tenant_id AND receipt_id=NEW.receipt_id
  ORDER BY sequence DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    IF NEW.sequence <> 0 OR NEW.previous_decision_digest_sha256 IS NOT NULL THEN
      RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_INITIAL_CHAIN_INVALID'
        USING ERRCODE='23514';
    END IF;
  ELSE
    IF NEW.sequence <> prior_sequence + 1 THEN
      RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_SEQUENCE_NOT_CONTIGUOUS'
        USING ERRCODE='23514';
    END IF;
    IF btrim(NEW.previous_decision_digest_sha256) IS DISTINCT FROM btrim(prior_digest) THEN
      RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_PREDECESSOR_DIGEST_MISMATCH'
        USING ERRCODE='23514';
    END IF;
    IF NEW.reviewed_at < prior_reviewed_at THEN
      RAISE EXCEPTION 'READINESS_EVIDENCE_REVIEW_TIME_REGRESSION'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER readiness_evidence_review_validate_bi
BEFORE INSERT ON agroway_invest.readiness_evidence_review
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_readiness_evidence_review();

CREATE TRIGGER readiness_evidence_review_append_only_bud
BEFORE UPDATE OR DELETE ON agroway_invest.readiness_evidence_review
FOR EACH ROW EXECUTE FUNCTION agroway_invest.readiness_reject_mutation();

CREATE OR REPLACE FUNCTION agroway_invest.assert_readiness_resolution_human_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  accepted_count integer;
BEGIN
  IF NEW.to_state <> 'RESOLVED' THEN
    RETURN NEW;
  END IF;

  IF cardinality(NEW.resolution_evidence_refs)=0 THEN
    RAISE EXCEPTION 'READINESS_RESOLUTION_REVIEW_EVIDENCE_REQUIRED'
      USING ERRCODE='23514';
  END IF;

  IF cardinality(NEW.resolution_evidence_refs) <>
     (SELECT count(DISTINCT ref) FROM unnest(NEW.resolution_evidence_refs) AS ref) THEN
    RAISE EXCEPTION 'READINESS_RESOLUTION_REVIEW_EVIDENCE_DUPLICATE'
      USING ERRCODE='23514';
  END IF;

  SELECT count(*) INTO accepted_count
  FROM unnest(NEW.resolution_evidence_refs) AS refs(evidence_ref)
  JOIN agroway_invest.readiness_evidence_receipt r
    ON r.tenant_id=NEW.tenant_id
   AND r.project_id=NEW.project_id
   AND r.assessment_id=NEW.assessment_id
   AND r.assessment_version=NEW.assessment_version
   AND r.gap_id=NEW.gap_id
   AND r.evidence_ref=refs.evidence_ref
  JOIN LATERAL (
    SELECT d.action
    FROM agroway_invest.readiness_evidence_review d
    WHERE d.tenant_id=r.tenant_id
      AND d.project_id=r.project_id
      AND d.assessment_id=r.assessment_id
      AND d.assessment_version=r.assessment_version
      AND d.gap_id=r.gap_id
      AND d.receipt_id=r.receipt_id
      AND d.reviewed_at <= NEW.occurred_at
    ORDER BY d.sequence DESC
    LIMIT 1
  ) latest ON latest.action='ACCEPTED_FOR_GAP_REVIEW';

  IF accepted_count <> cardinality(NEW.resolution_evidence_refs) THEN
    RAISE EXCEPTION 'READINESS_RESOLUTION_REQUIRES_LATEST_HUMAN_ACCEPTED_EVIDENCE'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger ordering is deliberate. The certified lifecycle trigger runs first,
-- then UX2B-1A submission proof, then this additional resolution-review proof.
CREATE TRIGGER zzz_readiness_gap_resolution_review_bi
BEFORE INSERT ON agroway_invest.readiness_gap_transition
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_readiness_resolution_human_review();

ALTER TABLE agroway_invest.readiness_evidence_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE agroway_invest.readiness_evidence_review FORCE ROW LEVEL SECURITY;
CREATE POLICY readiness_evidence_review_tenant_rls
  ON agroway_invest.readiness_evidence_review
  USING (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
REVOKE ALL ON TABLE agroway_invest.readiness_evidence_review FROM PUBLIC;

COMMENT ON TABLE agroway_invest.readiness_evidence_review IS
  'Append-only HUMAN evidence review ledger for Capital Readiness. ACCEPTED_FOR_GAP_REVIEW is required before evidence may prove RESOLVED, but review itself does not resolve a gap or approve financing.';
COMMENT ON COLUMN agroway_invest.readiness_evidence_review.receipt_digest_sha256 IS
  'Immutable binding to the exact validated readiness_evidence_receipt digest reviewed by the human actor.';
COMMENT ON COLUMN agroway_invest.readiness_evidence_review.decision_digest_sha256 IS
  'Application-computed SHA-256 decision-chain digest; predecessor continuity is enforced by PostgreSQL.';

COMMIT;
