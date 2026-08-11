BEGIN;
CREATE INDEX IF NOT EXISTS finance_entry_cycle_idx ON agroway_finance.entry(tenant_id,crop_cycle_id,occurred_at);
COMMIT;
