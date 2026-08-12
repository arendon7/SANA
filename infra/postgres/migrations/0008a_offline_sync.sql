BEGIN;
CREATE TABLE IF NOT EXISTS agroway_field.offline_change(tenant_id uuid NOT NULL,change_id uuid NOT NULL,device_id text NOT NULL,sequence_no bigint NOT NULL,payload jsonb NOT NULL,synced_at timestamptz,PRIMARY KEY(tenant_id,change_id),UNIQUE(tenant_id,device_id,sequence_no));
COMMIT;
