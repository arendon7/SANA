BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_pilot;
CREATE TABLE IF NOT EXISTS agroway_pilot.enrollment (
  pilot_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, name text NOT NULL, farm_ref text NOT NULL,
  plot_refs jsonb NOT NULL, cycle_refs jsonb NOT NULL, policy_version text NOT NULL,
  status text NOT NULL CHECK(status IN ('ENROLLED','RUNNING','ELIGIBLE_FOR_CERTIFICATION','CERTIFIED','FAILED','CLOSED')),
  enrolled_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS agroway_pilot.evidence (
  pilot_id uuid NOT NULL REFERENCES agroway_pilot.enrollment(pilot_id), tenant_id uuid NOT NULL, evidence_id text NOT NULL,
  stage text NOT NULL, kind text NOT NULL, source_ref text NOT NULL, provenance_ref text NOT NULL,
  source_digest_sha256 char(64) NOT NULL CHECK(source_digest_sha256 ~ '^[a-f0-9]{64}$'), observed_at timestamptz NOT NULL,
  outcome text NOT NULL CHECK(outcome IN ('PASS','FAIL','INFO')), note text, PRIMARY KEY(pilot_id,evidence_id)
);
CREATE TABLE IF NOT EXISTS agroway_pilot.stage_evaluation (
  pilot_id uuid NOT NULL REFERENCES agroway_pilot.enrollment(pilot_id), tenant_id uuid NOT NULL, stage text NOT NULL,
  status text NOT NULL CHECK(status IN ('PASS','FAIL')), accepted_evidence_ids jsonb NOT NULL, rejected_evidence_ids jsonb NOT NULL,
  reason_codes jsonb NOT NULL, evaluated_at timestamptz NOT NULL, PRIMARY KEY(pilot_id,stage,evaluated_at)
);
CREATE TABLE IF NOT EXISTS agroway_pilot.certification_decision (
  pilot_id uuid NOT NULL REFERENCES agroway_pilot.enrollment(pilot_id), tenant_id uuid NOT NULL, policy_version text NOT NULL,
  status text NOT NULL CHECK(status IN ('ELIGIBLE_FOR_CERTIFICATION','REJECTED')), evidence_digest_sha256 char(64) NOT NULL CHECK(evidence_digest_sha256 ~ '^[a-f0-9]{64}$'),
  decision_digest_sha256 char(64) NOT NULL CHECK(decision_digest_sha256 ~ '^[a-f0-9]{64}$'), reason_codes jsonb NOT NULL,
  evaluated_at timestamptz NOT NULL, PRIMARY KEY(pilot_id,decision_digest_sha256)
);
CREATE TABLE IF NOT EXISTS agroway_pilot.certificate (
  certificate_id text PRIMARY KEY, pilot_id uuid NOT NULL REFERENCES agroway_pilot.enrollment(pilot_id), tenant_id uuid NOT NULL,
  policy_version text NOT NULL, decision_digest_sha256 char(64) NOT NULL CHECK(decision_digest_sha256 ~ '^[a-f0-9]{64}$'),
  issued_by_actor_id uuid NOT NULL, issued_at timestamptz NOT NULL, human_attestation boolean NOT NULL CHECK(human_attestation=true),
  state text NOT NULL CHECK(state IN ('ACTIVE','REVOKED'))
);
CREATE TABLE IF NOT EXISTS agroway_pilot.replay_audit (
  audit_id uuid PRIMARY KEY, pilot_id uuid NOT NULL REFERENCES agroway_pilot.enrollment(pilot_id), tenant_id uuid NOT NULL,
  status text NOT NULL CHECK(status IN ('PASS','FAIL')), event_count integer NOT NULL CHECK(event_count>=0),
  replay_digest_sha256 char(64) NOT NULL CHECK(replay_digest_sha256 ~ '^[a-f0-9]{64}$'), reason_codes jsonb NOT NULL, audited_at timestamptz NOT NULL
);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['enrollment','evidence','stage_evaluation','certification_decision','certificate','replay_audit']
  LOOP
    EXECUTE format('ALTER TABLE agroway_pilot.%I ENABLE ROW LEVEL SECURITY',t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='agroway_pilot' AND tablename=t AND policyname=t||'_tenant_rls') THEN
      EXECUTE format('CREATE POLICY %I ON agroway_pilot.%I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)', t||'_tenant_rls',t);
    END IF;
  END LOOP;
END $$;
COMMENT ON TABLE agroway_pilot.certificate IS 'Final certification requires an explicit human attestation over a deterministic eligibility decision. AI cannot issue certificates.';
COMMIT;
