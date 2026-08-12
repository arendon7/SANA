BEGIN;
CREATE SCHEMA IF NOT EXISTS agroway_identity; CREATE TABLE IF NOT EXISTS agroway_identity.membership(tenant_id uuid NOT NULL,actor_id text NOT NULL,roles text[] NOT NULL,active boolean NOT NULL DEFAULT true,PRIMARY KEY(tenant_id,actor_id));
COMMIT;
