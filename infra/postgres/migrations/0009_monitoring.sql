BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_monitoring; CREATE TABLE IF NOT EXISTS agroway_monitoring.observation(tenant_id uuid NOT NULL,observation_id uuid NOT NULL,crop_cycle_id uuid NOT NULL,kind text NOT NULL,observed_at timestamptz NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(tenant_id,observation_id));
COMMIT;
