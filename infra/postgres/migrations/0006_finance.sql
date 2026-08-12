BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_finance; CREATE TABLE IF NOT EXISTS agroway_finance.entry(tenant_id uuid NOT NULL,entry_id uuid NOT NULL,crop_cycle_id uuid,kind text NOT NULL,currency char(3) NOT NULL,amount_minor bigint NOT NULL,occurred_at timestamptz NOT NULL,PRIMARY KEY(tenant_id,entry_id));
COMMIT;
