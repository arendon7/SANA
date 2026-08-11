BEGIN;
CREATE TABLE IF NOT EXISTS agroway_land.plot(tenant_id uuid NOT NULL,plot_id uuid NOT NULL,farm_id uuid NOT NULL,name text NOT NULL,area_ha numeric NOT NULL CHECK(area_ha>0),geom geometry(Polygon,4326),PRIMARY KEY(tenant_id,plot_id));
COMMIT;
