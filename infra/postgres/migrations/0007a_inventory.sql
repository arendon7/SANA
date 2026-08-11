BEGIN;
CREATE TABLE IF NOT EXISTS agroway_supply.inventory_movement(tenant_id uuid NOT NULL,movement_id uuid NOT NULL,item_id uuid NOT NULL,quantity numeric NOT NULL,kind text NOT NULL,occurred_at timestamptz NOT NULL,PRIMARY KEY(tenant_id,movement_id));
COMMIT;
