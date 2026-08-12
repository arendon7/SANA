BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_traceability; CREATE TABLE IF NOT EXISTS agroway_traceability.passport(tenant_id uuid NOT NULL,passport_id uuid NOT NULL,crop_cycle_id uuid NOT NULL,event_digest_sha256 char(64) NOT NULL,issued_at timestamptz NOT NULL,PRIMARY KEY(tenant_id,passport_id));
COMMIT;
