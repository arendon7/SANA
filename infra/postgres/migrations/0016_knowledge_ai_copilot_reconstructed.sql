BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_knowledge;
CREATE SCHEMA IF NOT EXISTS agroway_ai;

CREATE TABLE IF NOT EXISTS agroway_knowledge.knowledge_document (
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  title text NOT NULL,
  authority text NOT NULL CHECK(authority IN ('CANONICAL','TECHNICAL','EXPERIMENTAL','HISTORICAL')),
  source_kind text NOT NULL,
  lifecycle text NOT NULL DEFAULT 'DRAFT' CHECK(lifecycle IN ('DRAFT','PUBLISHED','DEPRECATED')),
  current_revision integer NOT NULL DEFAULT 0 CHECK(current_revision>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,document_id)
);
CREATE TABLE IF NOT EXISTS agroway_knowledge.knowledge_revision (
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  revision integer NOT NULL CHECK(revision>=1),
  canonical_text text NOT NULL CHECK(length(btrim(canonical_text))>0),
  content_sha256 char(64) NOT NULL CHECK(content_sha256 ~ '^[0-9a-f]{64}$'),
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple',canonical_text)) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  PRIMARY KEY(tenant_id,document_id,revision),
  FOREIGN KEY(tenant_id,document_id) REFERENCES agroway_knowledge.knowledge_document(tenant_id,document_id)
);
CREATE INDEX IF NOT EXISTS knowledge_revision_search_gin ON agroway_knowledge.knowledge_revision USING gin(search_vector);

CREATE TABLE IF NOT EXISTS agroway_ai.model_policy (
  tenant_id uuid NOT NULL,
  policy_id text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  allowed_modes text[] NOT NULL CHECK(allowed_modes <@ ARRAY['READ','EXPLAIN','COMPARE','DRAFT']::text[]),
  store_provider_data boolean NOT NULL DEFAULT false CHECK(store_provider_data=false),
  structured_outputs boolean NOT NULL DEFAULT false,
  max_output_tokens integer NOT NULL CHECK(max_output_tokens>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,policy_id)
);
CREATE TABLE IF NOT EXISTS agroway_ai.request_audit (
  tenant_id uuid NOT NULL,
  request_id text NOT NULL,
  policy_id text NOT NULL,
  actor_id text NOT NULL,
  mode text NOT NULL CHECK(mode IN ('READ','EXPLAIN','COMPARE','DRAFT')),
  idempotency_key text NOT NULL,
  context_hash_sha256 char(64) NOT NULL CHECK(context_hash_sha256 ~ '^[0-9a-f]{64}$'),
  evidence_ids jsonb NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,request_id),
  UNIQUE(tenant_id,idempotency_key),
  FOREIGN KEY(tenant_id,policy_id) REFERENCES agroway_ai.model_policy(tenant_id,policy_id)
);
CREATE TABLE IF NOT EXISTS agroway_ai.response_audit (
  tenant_id uuid NOT NULL,
  request_id text NOT NULL,
  response_digest_sha256 char(64) NOT NULL CHECK(response_digest_sha256 ~ '^[0-9a-f]{64}$'),
  cited_evidence_ids jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,request_id),
  FOREIGN KEY(tenant_id,request_id) REFERENCES agroway_ai.request_audit(tenant_id,request_id)
);
CREATE TABLE IF NOT EXISTS agroway_ai.copilot_suggestion (
  tenant_id uuid NOT NULL,
  suggestion_id text NOT NULL,
  request_id text NOT NULL,
  context_hash_sha256 char(64) NOT NULL CHECK(context_hash_sha256 ~ '^[0-9a-f]{64}$'),
  state text NOT NULL DEFAULT 'DRAFT_SUGGESTION' CHECK(state='DRAFT_SUGGESTION'),
  requires_human_approval boolean NOT NULL DEFAULT true CHECK(requires_human_approval),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,suggestion_id),
  FOREIGN KEY(tenant_id,request_id) REFERENCES agroway_ai.request_audit(tenant_id,request_id)
);

DO $$ DECLARE s text; t text; BEGIN
 FOR s,t IN SELECT * FROM (VALUES
   ('agroway_knowledge','knowledge_document'),('agroway_knowledge','knowledge_revision'),
   ('agroway_ai','model_policy'),('agroway_ai','request_audit'),('agroway_ai','response_audit'),('agroway_ai','copilot_suggestion')
 ) AS x(s,t) LOOP
   EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',s,t);
   EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY',s,t);
   IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=s AND tablename=t AND policyname=t||'_tenant_rls') THEN
     EXECUTE format('CREATE POLICY %I ON %I.%I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',t||'_tenant_rls',s,t);
   END IF;
 END LOOP;
END $$;
COMMENT ON SCHEMA agroway_knowledge IS 'v0.16R reconstruction: governed knowledge; PostgreSQL FTS is canonical retrieval V1; embeddings optional.';
COMMENT ON SCHEMA agroway_ai IS 'v0.16R reconstruction: AI Gateway audit and advisory Copilot only. No domain-command authority.';
COMMIT;
