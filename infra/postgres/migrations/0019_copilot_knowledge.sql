BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_copilot;
CREATE TABLE IF NOT EXISTS agroway_copilot.session (
  session_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, actor_id uuid NOT NULL, opened_at timestamptz NOT NULL, closed_at timestamptz
);
CREATE TABLE IF NOT EXISTS agroway_copilot.inquiry (
  request_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, session_id uuid REFERENCES agroway_copilot.session(session_id), actor_id uuid NOT NULL,
  mode text NOT NULL CHECK(mode IN ('READ','EXPLAIN','COMPARE','DRAFT')), question text NOT NULL CHECK(length(question)>0), subject_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  requested_at timestamptz NOT NULL, UNIQUE(tenant_id,request_id)
);
CREATE TABLE IF NOT EXISTS agroway_copilot.policy_evaluation (
  evaluation_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, request_id uuid NOT NULL REFERENCES agroway_copilot.inquiry(request_id), allowed boolean NOT NULL,
  reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb, evaluated_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS agroway_copilot.evidence_bundle (
  bundle_id text PRIMARY KEY, tenant_id uuid NOT NULL, request_id uuid NOT NULL REFERENCES agroway_copilot.inquiry(request_id), as_of timestamptz NOT NULL,
  context_hash_sha256 char(64) NOT NULL CHECK(context_hash_sha256 ~ '^[a-f0-9]{64}$'), accepted_evidence_ids jsonb NOT NULL, rejected_evidence_ids jsonb NOT NULL,
  UNIQUE(tenant_id,request_id,context_hash_sha256)
);
CREATE TABLE IF NOT EXISTS agroway_copilot.evidence_item (
  bundle_id text NOT NULL REFERENCES agroway_copilot.evidence_bundle(bundle_id), tenant_id uuid NOT NULL, evidence_id text NOT NULL, source_kind text NOT NULL,
  source_ref text NOT NULL, provenance_ref text NOT NULL, source_digest_sha256 char(64) NOT NULL CHECK(source_digest_sha256 ~ '^[a-f0-9]{64}$'),
  freshness text NOT NULL CHECK(freshness IN ('FRESH','STALE','UNKNOWN')), accepted boolean NOT NULL, rejection_reason text,
  PRIMARY KEY(bundle_id,evidence_id)
);
CREATE TABLE IF NOT EXISTS agroway_copilot.response (
  response_id text PRIMARY KEY, tenant_id uuid NOT NULL, request_id uuid NOT NULL REFERENCES agroway_copilot.inquiry(request_id),
  status text NOT NULL CHECK(status IN ('COMPLETE','PARTIAL','REFUSED')), answer text NOT NULL, limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  context_hash_sha256 char(64), created_at timestamptz NOT NULL, UNIQUE(tenant_id,request_id)
);
CREATE TABLE IF NOT EXISTS agroway_copilot.citation (
  response_id text NOT NULL REFERENCES agroway_copilot.response(response_id), tenant_id uuid NOT NULL, evidence_id text NOT NULL,
  source_kind text NOT NULL, source_ref text NOT NULL, provenance_ref text NOT NULL, PRIMARY KEY(response_id,evidence_id)
);
CREATE TABLE IF NOT EXISTS agroway_copilot.draft_suggestion (
  suggestion_id text PRIMARY KEY, tenant_id uuid NOT NULL, response_id text NOT NULL REFERENCES agroway_copilot.response(response_id), kind text NOT NULL,
  state text NOT NULL DEFAULT 'DRAFT_SUGGESTION' CHECK(state='DRAFT_SUGGESTION'), title text NOT NULL, body text NOT NULL, proposed_actions jsonb NOT NULL,
  requires_human_approval boolean NOT NULL DEFAULT true CHECK(requires_human_approval=true), created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS agroway_copilot.feedback (
  feedback_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, response_id text NOT NULL REFERENCES agroway_copilot.response(response_id), actor_id uuid NOT NULL,
  rating smallint CHECK(rating BETWEEN -1 AND 1), comment text, recorded_at timestamptz NOT NULL
);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['session','inquiry','policy_evaluation','evidence_bundle','evidence_item','response','citation','draft_suggestion','feedback']
  LOOP
    EXECUTE format('ALTER TABLE agroway_copilot.%I ENABLE ROW LEVEL SECURITY',t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='agroway_copilot' AND tablename=t AND policyname=t||'_tenant_rls') THEN
      EXECUTE format('CREATE POLICY %I ON agroway_copilot.%I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)', t||'_tenant_rls',t);
    END IF;
  END LOOP;
END $$;
COMMENT ON TABLE agroway_copilot.evidence_item IS 'Provenance metadata only. Raw provider payloads and provider credentials are forbidden.';
COMMENT ON TABLE agroway_copilot.draft_suggestion IS 'AI output is permanently draft-only; approval/execution lives in authorized deterministic domain services.';
COMMIT;
