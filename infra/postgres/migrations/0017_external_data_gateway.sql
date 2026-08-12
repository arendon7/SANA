BEGIN;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS agroway_external;

CREATE TABLE IF NOT EXISTS agroway_external.provider (
  provider_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, provider_key text NOT NULL, kind text NOT NULL CHECK(kind IN ('WEATHER','IOT','REMOTE_SENSING')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','DEGRADED','DISABLED')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,provider_key)
);
CREATE TABLE IF NOT EXISTS agroway_external.source (
  source_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, provider_id uuid NOT NULL REFERENCES agroway_external.provider(provider_id), external_source_key text NOT NULL,
  field_id uuid, plot_id uuid, status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','DEGRADED','DISABLED')), freshness_slo_minutes integer NOT NULL DEFAULT 180,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,provider_id,external_source_key)
);
CREATE TABLE IF NOT EXISTS agroway_external.device (
  device_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, source_id uuid NOT NULL REFERENCES agroway_external.source(source_id), external_device_key text NOT NULL,
  field_id uuid, plot_id uuid, location geometry(Point,4326), identity_confidence text NOT NULL CHECK(identity_confidence IN ('EXACT','MAPPED','HEURISTIC','UNRESOLVED')),
  calibration_status text NOT NULL CHECK(calibration_status IN ('VALID','DUE_SOON','EXPIRED','NOT_APPLICABLE','UNKNOWN')), calibration_due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,source_id,external_device_key)
);
CREATE TABLE IF NOT EXISTS agroway_external.raw_ingestion_record (
  ingestion_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, source_id uuid NOT NULL REFERENCES agroway_external.source(source_id), provider_event_id text NOT NULL,
  external_device_key text, received_at timestamptz NOT NULL, observed_at timestamptz, content_type text NOT NULL, payload_sha256 char(64) NOT NULL,
  payload jsonb NOT NULL, state text NOT NULL DEFAULT 'RECEIVED' CHECK(state IN ('RECEIVED','PROCESSED','QUARANTINED')), quarantine_reason text,
  UNIQUE(tenant_id,source_id,provider_event_id,payload_sha256)
);
CREATE TABLE IF NOT EXISTS agroway_external.observation (
  observation_id text PRIMARY KEY, tenant_id uuid NOT NULL, source_id uuid NOT NULL REFERENCES agroway_external.source(source_id), device_id uuid REFERENCES agroway_external.device(device_id),
  field_id uuid, plot_id uuid, observed_at timestamptz NOT NULL, normalized_at timestamptz NOT NULL, quality_level text NOT NULL CHECK(quality_level IN ('GOOD','DEGRADED','REJECTED')),
  quality_score smallint NOT NULL CHECK(quality_score BETWEEN 0 AND 100), ingestion_id uuid NOT NULL REFERENCES agroway_external.raw_ingestion_record(ingestion_id)
);
CREATE TABLE IF NOT EXISTS agroway_external.measurement (
  measurement_id text PRIMARY KEY, tenant_id uuid NOT NULL, observation_id text NOT NULL REFERENCES agroway_external.observation(observation_id), source_id uuid NOT NULL,
  device_id uuid, field_id uuid, plot_id uuid, metric text NOT NULL, value double precision NOT NULL, unit text NOT NULL, observed_at timestamptz NOT NULL,
  quality_level text NOT NULL CHECK(quality_level IN ('GOOD','DEGRADED')), quality_score smallint NOT NULL CHECK(quality_score BETWEEN 0 AND 100), lineage jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS agroway_external.remote_sensing_scene (
  scene_id text PRIMARY KEY, tenant_id uuid NOT NULL, source_id uuid NOT NULL REFERENCES agroway_external.source(source_id), provider_scene_id text NOT NULL,
  acquired_at timestamptz NOT NULL, cloud_cover_pct numeric(5,2), footprint geometry(Polygon,4326) NOT NULL, field_id uuid, plot_id uuid,
  UNIQUE(tenant_id,source_id,provider_scene_id)
);
CREATE TABLE IF NOT EXISTS agroway_external.agronomic_rule (
  rule_id uuid NOT NULL, tenant_id uuid NOT NULL, version integer NOT NULL, name text NOT NULL, field_id uuid, plot_id uuid,
  severity text NOT NULL CHECK(severity IN ('INFO','WARNING','CRITICAL')), enabled boolean NOT NULL DEFAULT true, condition jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(rule_id,version)
);
CREATE TABLE IF NOT EXISTS agroway_external.agronomic_alert (
  alert_id text PRIMARY KEY, tenant_id uuid NOT NULL, rule_id uuid NOT NULL, rule_version integer NOT NULL, fingerprint text NOT NULL, severity text NOT NULL,
  state text NOT NULL CHECK(state IN ('OPEN','ACKNOWLEDGED','RESOLVED','SUPPRESSED')), field_id uuid, plot_id uuid, fact_ids jsonb NOT NULL,
  reason text NOT NULL, opened_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS agronomic_alert_active_fingerprint_uq ON agroway_external.agronomic_alert(tenant_id,fingerprint) WHERE state IN ('OPEN','ACKNOWLEDGED');
CREATE INDEX IF NOT EXISTS measurement_tenant_field_metric_time_idx ON agroway_external.measurement(tenant_id,field_id,metric,observed_at DESC);
CREATE INDEX IF NOT EXISTS raw_ingestion_source_time_idx ON agroway_external.raw_ingestion_record(tenant_id,source_id,received_at DESC);
CREATE INDEX IF NOT EXISTS remote_scene_footprint_gix ON agroway_external.remote_sensing_scene USING gist(footprint);

CREATE OR REPLACE VIEW agroway_external.canonical_fact_v AS
SELECT measurement_id AS fact_id, tenant_id, source_id, field_id, plot_id, metric, value, unit, observed_at, quality_level, measurement_id
FROM agroway_external.measurement WHERE quality_level IN ('GOOD','DEGRADED');

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['provider','source','device','raw_ingestion_record','observation','measurement','remote_sensing_scene','agronomic_rule','agronomic_alert'] LOOP
    EXECUTE format('ALTER TABLE agroway_external.%I ENABLE ROW LEVEL SECURITY',t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='agroway_external' AND tablename=t AND policyname=t||'_tenant_rls') THEN
      EXECUTE format('CREATE POLICY %I ON agroway_external.%I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)', t||'_tenant_rls',t);
    END IF;
  END LOOP;
END $$;

REVOKE ALL ON agroway_external.raw_ingestion_record FROM PUBLIC;
COMMENT ON TABLE agroway_external.raw_ingestion_record IS 'Raw provider boundary. Never exposed to Knowledge Registry, AI Gateway or Agronomy Copilot.';
COMMENT ON VIEW agroway_external.canonical_fact_v IS 'Only normalized non-rejected facts may cross into Field/Control/Knowledge/Copilot.';
COMMIT;
