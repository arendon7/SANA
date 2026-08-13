BEGIN;

-- CAPITAL_READINESS UX2B-1A
-- Immutable metadata receipt for server-validated evidence objects.
-- File bytes remain outside PostgreSQL. This migration does not expose any
-- browser upload route and does not grant financing/payment/custody authority.

CREATE TABLE agroway_invest.readiness_evidence_receipt (
  receipt_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  assessment_id text NOT NULL CHECK (length(btrim(assessment_id)) > 0),
  assessment_version integer NOT NULL CHECK (assessment_version > 0),
  gap_id text NOT NULL CHECK (length(btrim(gap_id)) > 0),
  evidence_ref text NOT NULL CHECK (length(btrim(evidence_ref)) > 0),
  object_ref text NOT NULL CHECK (length(btrim(object_ref)) > 0),
  digest_sha256 char(64) NOT NULL CHECK (btrim(digest_sha256) ~ '^[a-f0-9]{64}$'),
  content_type text NOT NULL CHECK (content_type ~ '^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$'),
  byte_length bigint NOT NULL CHECK (byte_length > 0),
  evidence_role text NOT NULL CHECK (length(btrim(evidence_role)) > 0),
  submitted_by_actor_ref text NOT NULL CHECK (length(btrim(submitted_by_actor_ref)) > 0),
  submitted_at timestamptz NOT NULL,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  correlation_id text NOT NULL CHECK (length(btrim(correlation_id)) > 0),
  validation_state text NOT NULL CHECK (validation_state='VALIDATED'),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT readiness_evidence_receipt_gap_fk
    FOREIGN KEY (tenant_id,project_id,assessment_id,assessment_version,gap_id)
    REFERENCES agroway_invest.readiness_gap
      (tenant_id,project_id,assessment_id,assessment_version,gap_id),
  CONSTRAINT readiness_evidence_receipt_tenant_evidence_uq
    UNIQUE (tenant_id,evidence_ref),
  CONSTRAINT readiness_evidence_receipt_tenant_idempotency_uq
    UNIQUE (tenant_id,idempotency_key),
  CONSTRAINT readiness_evidence_receipt_scope_receipt_uq
    UNIQUE (tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id)
);

-- Submitted evidence refs belong to the transition event, not to the immutable
-- gap definition. Existing pre-UX2B-1A rows receive an empty array. New
-- EVIDENCE_SUBMITTED transitions are enforced by the trigger below.
ALTER TABLE agroway_invest.readiness_gap_transition
  ADD COLUMN IF NOT EXISTS submitted_evidence_refs text[] NOT NULL DEFAULT '{}'::text[]
  CHECK (array_position(submitted_evidence_refs,NULL) IS NULL);

CREATE OR REPLACE FUNCTION agroway_invest.assert_readiness_evidence_receipt()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  required_roles text[];
BEGIN
  SELECT required_evidence_roles INTO required_roles
  FROM agroway_invest.readiness_gap
  WHERE tenant_id=NEW.tenant_id
    AND project_id=NEW.project_id
    AND assessment_id=NEW.assessment_id
    AND assessment_version=NEW.assessment_version
    AND gap_id=NEW.gap_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_GAP_NOT_FOUND'
      USING ERRCODE='23503';
  END IF;

  IF cardinality(required_roles)=0 OR NOT (NEW.evidence_role = ANY(required_roles)) THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_ROLE_NOT_REQUIRED:%', NEW.evidence_role
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER readiness_evidence_receipt_validate_bi
BEFORE INSERT ON agroway_invest.readiness_evidence_receipt
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_readiness_evidence_receipt();

CREATE TRIGGER readiness_evidence_receipt_append_only_bud
BEFORE UPDATE OR DELETE ON agroway_invest.readiness_evidence_receipt
FOR EACH ROW EXECUTE FUNCTION agroway_invest.readiness_reject_mutation();

CREATE OR REPLACE FUNCTION agroway_invest.assert_readiness_evidence_submission()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  accepted_count integer;
BEGIN
  IF NEW.to_state <> 'EVIDENCE_SUBMITTED' THEN
    IF cardinality(NEW.submitted_evidence_refs) <> 0 THEN
      RAISE EXCEPTION 'READINESS_NON_SUBMISSION_TRANSITION_CANNOT_LINK_SUBMITTED_EVIDENCE'
        USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  IF cardinality(NEW.submitted_evidence_refs)=0 THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_SUBMISSION_REQUIRES_RECEIPT'
      USING ERRCODE='23514';
  END IF;

  IF cardinality(NEW.submitted_evidence_refs) <>
     (SELECT count(DISTINCT ref) FROM unnest(NEW.submitted_evidence_refs) AS ref) THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_SUBMISSION_DUPLICATE_REF'
      USING ERRCODE='23514';
  END IF;

  SELECT count(*) INTO accepted_count
  FROM agroway_invest.readiness_evidence_receipt r
  WHERE r.tenant_id=NEW.tenant_id
    AND r.project_id=NEW.project_id
    AND r.assessment_id=NEW.assessment_id
    AND r.assessment_version=NEW.assessment_version
    AND r.gap_id=NEW.gap_id
    AND r.validation_state='VALIDATED'
    AND r.submitted_by_actor_ref=NEW.actor_ref
    AND r.submitted_at <= NEW.occurred_at
    AND r.evidence_ref = ANY(NEW.submitted_evidence_refs);

  IF accepted_count <> cardinality(NEW.submitted_evidence_refs) THEN
    RAISE EXCEPTION 'READINESS_EVIDENCE_SUBMISSION_RECEIPT_SET_MISMATCH'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$$;

-- PostgreSQL fires same-timing triggers alphabetically. Prefix this proof
-- trigger with `zz_` so the already-certified lifecycle/sequence trigger runs
-- first and keeps its historical stale/sequence error precedence. Evidence
-- proof is an additional gate, never a replacement for lifecycle integrity.
CREATE TRIGGER zz_readiness_gap_evidence_submission_bi
BEFORE INSERT ON agroway_invest.readiness_gap_transition
FOR EACH ROW EXECUTE FUNCTION agroway_invest.assert_readiness_evidence_submission();

ALTER TABLE agroway_invest.readiness_evidence_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE agroway_invest.readiness_evidence_receipt FORCE ROW LEVEL SECURITY;
CREATE POLICY readiness_evidence_receipt_tenant_rls
  ON agroway_invest.readiness_evidence_receipt
  USING (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
REVOKE ALL ON TABLE agroway_invest.readiness_evidence_receipt FROM PUBLIC;

COMMENT ON TABLE agroway_invest.readiness_evidence_receipt IS
  'Immutable metadata receipt for a server-validated evidence object bound to one Capital Readiness gap. PostgreSQL stores no file bytes. Receipt existence is not gap resolution or financing approval.';
COMMENT ON COLUMN agroway_invest.readiness_gap_transition.submitted_evidence_refs IS
  'Validated readiness_evidence_receipt evidence refs used only when transitioning to EVIDENCE_SUBMITTED. Distinct from final resolution evidence semantics.';

COMMIT;
