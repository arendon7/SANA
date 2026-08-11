BEGIN;
CREATE TABLE IF NOT EXISTS agroway_core.outbox(event_id uuid PRIMARY KEY,tenant_id uuid NOT NULL,event_name text NOT NULL,aggregate_id text NOT NULL,payload jsonb NOT NULL,occurred_at timestamptz NOT NULL,published_at timestamptz);
COMMIT;
