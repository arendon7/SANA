BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_impact; CREATE TABLE IF NOT EXISTS agroway_impact.metric(tenant_id uuid NOT NULL,metric_id uuid NOT NULL,scope_ref text NOT NULL,code text NOT NULL,value numeric NOT NULL,unit text NOT NULL,method_ref text NOT NULL,measured_at timestamptz NOT NULL,PRIMARY KEY(tenant_id,metric_id));
COMMIT;
