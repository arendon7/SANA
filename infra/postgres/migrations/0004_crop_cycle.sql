BEGIN;
CREATE TABLE IF NOT EXISTS agroway_land.crop_cycle(tenant_id uuid NOT NULL,crop_cycle_id uuid NOT NULL,plot_id uuid NOT NULL,crop text NOT NULL,state text NOT NULL,started_at timestamptz,PRIMARY KEY(tenant_id,crop_cycle_id));
COMMIT;
