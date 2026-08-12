BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_harvest; CREATE TABLE IF NOT EXISTS agroway_harvest.harvest_lot(tenant_id uuid NOT NULL,harvest_lot_id uuid NOT NULL,crop_cycle_id uuid NOT NULL,quantity numeric NOT NULL CHECK(quantity>0),unit text NOT NULL,harvested_at timestamptz NOT NULL,PRIMARY KEY(tenant_id,harvest_lot_id));
COMMIT;
