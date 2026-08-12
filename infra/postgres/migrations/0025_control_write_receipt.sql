BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS invest_project_tenant_project_uq
  ON agroway_invest.project(tenant_id,project_id);

CREATE TABLE IF NOT EXISTS agroway_invest.control_write_receipt (
  receipt_id text PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  operation_id text NOT NULL CHECK(length(operation_id) BETWEEN 1 AND 256),
  idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 16 AND 128),
  authorization_context_digest_sha256 char(64) NOT NULL CHECK(authorization_context_digest_sha256 ~ '^[A-Fa-f0-9]{64}$'),
  command_kind text NOT NULL CHECK(command_kind='DECLARE_CAPITAL_REQUIREMENT'),
  state text NOT NULL CHECK(state='COMMITTED_TO_CANONICAL_PORT'),
  canonical_mutated boolean NOT NULL CHECK(canonical_mutated=true),
  outbox_appended boolean NOT NULL CHECK(outbox_appended=true),
  committed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT control_write_receipt_project_fk FOREIGN KEY(tenant_id,project_id)
    REFERENCES agroway_invest.project(tenant_id,project_id),
  CONSTRAINT control_write_receipt_tenant_idempotency_uq UNIQUE(tenant_id,idempotency_key),
  CONSTRAINT control_write_receipt_tenant_operation_uq UNIQUE(tenant_id,operation_id)
);

ALTER TABLE agroway_invest.control_write_receipt ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='agroway_invest'
      AND tablename='control_write_receipt'
      AND policyname='control_write_receipt_tenant_rls'
  ) THEN
    CREATE POLICY control_write_receipt_tenant_rls ON agroway_invest.control_write_receipt
      USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
  END IF;
END $$;

COMMENT ON TABLE agroway_invest.control_write_receipt IS
  'Idempotency and durable receipt boundary for human-authorized canonical CONTROL writes. Mutation, outbox and receipt commit atomically.';

COMMIT;
