BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_field; CREATE TABLE IF NOT EXISTS agroway_field.task(tenant_id uuid NOT NULL,task_id uuid NOT NULL,crop_cycle_id uuid NOT NULL,plot_id uuid NOT NULL,kind text NOT NULL,scheduled_at timestamptz NOT NULL,state text NOT NULL,PRIMARY KEY(tenant_id,task_id));
COMMIT;
