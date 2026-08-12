BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_supply; CREATE TABLE IF NOT EXISTS agroway_supply.inventory_item(tenant_id uuid NOT NULL,item_id uuid NOT NULL,name text NOT NULL,unit text NOT NULL,on_hand numeric NOT NULL DEFAULT 0,reserved numeric NOT NULL DEFAULT 0,PRIMARY KEY(tenant_id,item_id));
COMMIT;
