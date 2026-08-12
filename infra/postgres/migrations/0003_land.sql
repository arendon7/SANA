BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_land; CREATE TABLE IF NOT EXISTS agroway_land.producer(tenant_id uuid NOT NULL,producer_id uuid NOT NULL,name text NOT NULL,PRIMARY KEY(tenant_id,producer_id)); CREATE TABLE IF NOT EXISTS agroway_land.farm(tenant_id uuid NOT NULL,farm_id uuid NOT NULL,producer_id uuid NOT NULL,name text NOT NULL,PRIMARY KEY(tenant_id,farm_id));
COMMIT;
