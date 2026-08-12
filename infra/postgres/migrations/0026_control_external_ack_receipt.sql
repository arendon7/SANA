BEGIN;

CREATE TABLE IF NOT EXISTS agroway_core.control_external_ack_receipt (
  receipt_id text PRIMARY KEY CHECK(length(receipt_id) BETWEEN 1 AND 256),
  tenant_id uuid NOT NULL,
  packet_id text NOT NULL CHECK(length(packet_id) BETWEEN 1 AND 256),
  proposal_id text NOT NULL CHECK(length(proposal_id) BETWEEN 1 AND 256),
  project_id text NULL CHECK(project_id IS NULL OR length(project_id) BETWEEN 1 AND 256),
  destination text NOT NULL CHECK(destination IN ('FUTURE_DOMAIN_ADAPTER','FIELD_OPERATION_ADAPTER','FINANCE_ADAPTER','SUPPLY_ADAPTER')),
  provider_id text NOT NULL CHECK(length(provider_id) BETWEEN 1 AND 256),
  provider_key_id text NOT NULL CHECK(length(provider_key_id) BETWEEN 1 AND 128),
  request_id text NOT NULL CHECK(length(request_id) BETWEEN 1 AND 256),
  idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 16 AND 160),
  packet_digest_sha256 char(64) NOT NULL CHECK(packet_digest_sha256 ~ '^[A-Fa-f0-9]{64}$'),
  request_digest_sha256 char(64) NOT NULL CHECK(request_digest_sha256 ~ '^[A-Fa-f0-9]{64}$'),
  ack_receipt_digest_sha256 char(64) NOT NULL CHECK(ack_receipt_digest_sha256 ~ '^[A-Fa-f0-9]{64}$'),
  outcome text NOT NULL CHECK(outcome IN ('ACCEPTED','REJECTED')),
  external_reference text NOT NULL CHECK(length(external_reference) BETWEEN 1 AND 256),
  acknowledged_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  verification_state text NOT NULL CHECK(verification_state='VERIFIED_EXTERNAL_ACK'),
  execution_state text NOT NULL CHECK(execution_state='NOT_EXECUTED'),
  canonical_mutated boolean NOT NULL CHECK(canonical_mutated=false),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT control_external_ack_tenant_packet_uq UNIQUE(tenant_id,packet_id),
  CONSTRAINT control_external_ack_tenant_idempotency_uq UNIQUE(tenant_id,idempotency_key),
  CONSTRAINT control_external_ack_provider_reference_uq UNIQUE(provider_id,external_reference)
);

CREATE INDEX IF NOT EXISTS control_external_ack_tenant_received_idx
  ON agroway_core.control_external_ack_receipt(tenant_id,received_at DESC);

ALTER TABLE agroway_core.control_external_ack_receipt ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='agroway_core'
      AND tablename='control_external_ack_receipt'
      AND policyname='control_external_ack_receipt_tenant_rls'
  ) THEN
    CREATE POLICY control_external_ack_receipt_tenant_rls ON agroway_core.control_external_ack_receipt
      USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
  END IF;
END $$;

COMMENT ON TABLE agroway_core.control_external_ack_receipt IS
  'Verified, idempotent external acknowledgement receipts for CONTROL submission handoffs. Receipts are operational evidence only and never imply canonical execution.';

COMMIT;
