BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_agronomy; CREATE TABLE IF NOT EXISTS agroway_agronomy.plan(tenant_id uuid NOT NULL,plan_id uuid NOT NULL,crop_cycle_id uuid NOT NULL,version integer NOT NULL,state text NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(tenant_id,plan_id,version));
COMMIT;
