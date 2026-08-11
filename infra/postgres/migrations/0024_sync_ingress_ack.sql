BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_sync;
CREATE TABLE IF NOT EXISTS agroway_sync.ingress_envelope(
  tenant_id uuid NOT NULL,
  envelope_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  kind text NOT NULL,
  event_time timestamptz NOT NULL,
  received_time timestamptz NOT NULL DEFAULT now(),
  payload_json jsonb NOT NULL,
  payload_sha256 text NOT NULL CHECK(payload_sha256 ~ '^[a-f0-9]{64}$'),
  state text NOT NULL CHECK(state IN ('ACCEPTED','CONFLICT','REJECTED')),
  assessment_code text NOT NULL,
  canonical_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,envelope_id),
  CONSTRAINT sync_ingress_tenant_idempotency_uq UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS agroway_sync.ack(
  tenant_id uuid NOT NULL,
  ack_id uuid NOT NULL,
  envelope_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  event_time timestamptz NOT NULL,
  received_time timestamptz NOT NULL,
  canonical_version text NOT NULL,
  payload_sha256 text NOT NULL CHECK(payload_sha256 ~ '^[a-f0-9]{64}$'),
  ack_sha256 text NOT NULL CHECK(ack_sha256 ~ '^[a-f0-9]{64}$'),
  state text NOT NULL CHECK(state='ACCEPTED'),
  PRIMARY KEY(tenant_id,ack_id),
  CONSTRAINT sync_ack_ingress_fk FOREIGN KEY(tenant_id,envelope_id) REFERENCES agroway_sync.ingress_envelope(tenant_id,envelope_id),
  CONSTRAINT sync_ack_tenant_idempotency_uq UNIQUE(tenant_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS sync_ingress_received_idx ON agroway_sync.ingress_envelope(tenant_id,received_time DESC);
CREATE INDEX IF NOT EXISTS sync_ack_received_idx ON agroway_sync.ack(tenant_id,received_time DESC);
ALTER TABLE agroway_sync.ingress_envelope ENABLE ROW LEVEL SECURITY;
ALTER TABLE agroway_sync.ingress_envelope FORCE ROW LEVEL SECURITY;
ALTER TABLE agroway_sync.ack ENABLE ROW LEVEL SECURITY;
ALTER TABLE agroway_sync.ack FORCE ROW LEVEL SECURITY;
CREATE POLICY sync_ingress_tenant_rls ON agroway_sync.ingress_envelope USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sync_ack_tenant_rls ON agroway_sync.ack USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
REVOKE ALL ON agroway_sync.ingress_envelope FROM PUBLIC;
REVOKE ALL ON agroway_sync.ack FROM PUBLIC;
COMMENT ON SCHEMA agroway_sync IS 'Server-side idempotent sync ingress and ACK persistence boundary.';
COMMENT ON TABLE agroway_sync.ingress_envelope IS 'Preserves event-time and server received-time. Conflict/rejected rows are retained for audit.';
COMMENT ON TABLE agroway_sync.ack IS 'Server ACK emitted only after ACCEPTED ingress. Duplicate idempotency keys resolve to the existing ACK.';
COMMIT;
