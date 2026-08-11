BEGIN;
CREATE TABLE IF NOT EXISTS agroway_impact.snapshot(tenant_id uuid NOT NULL,snapshot_id uuid NOT NULL,scope_ref text NOT NULL,digest_sha256 char(64) NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(tenant_id,snapshot_id));
COMMIT;
