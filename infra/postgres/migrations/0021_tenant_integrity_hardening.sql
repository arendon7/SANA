BEGIN;

-- v0.20.1 hardening: tenant-aware relational integrity + defense-in-depth RLS.
-- Existing ids remain globally unique, but every tenant-owned relationship is
-- additionally constrained by tenant_id so a hidden cross-tenant parent cannot
-- be referenced through a foreign key.

-- ---------------------------------------------------------------------------
-- External data
-- ---------------------------------------------------------------------------
ALTER TABLE agroway_external.provider
  ADD CONSTRAINT provider_tenant_provider_uq UNIQUE (tenant_id, provider_id);
ALTER TABLE agroway_external.source
  ADD CONSTRAINT source_tenant_source_uq UNIQUE (tenant_id, source_id);
ALTER TABLE agroway_external.device
  ADD CONSTRAINT device_tenant_device_uq UNIQUE (tenant_id, device_id);
ALTER TABLE agroway_external.raw_ingestion_record
  ADD CONSTRAINT raw_ingestion_tenant_ingestion_uq UNIQUE (tenant_id, ingestion_id);
ALTER TABLE agroway_external.observation
  ADD CONSTRAINT observation_tenant_observation_uq UNIQUE (tenant_id, observation_id);
ALTER TABLE agroway_external.agronomic_rule
  ADD CONSTRAINT agronomic_rule_tenant_rule_version_uq UNIQUE (tenant_id, rule_id, version);

ALTER TABLE agroway_external.source
  DROP CONSTRAINT IF EXISTS source_provider_id_fkey,
  ADD CONSTRAINT source_tenant_provider_fk
    FOREIGN KEY (tenant_id, provider_id)
    REFERENCES agroway_external.provider (tenant_id, provider_id);

ALTER TABLE agroway_external.device
  DROP CONSTRAINT IF EXISTS device_source_id_fkey,
  ADD CONSTRAINT device_tenant_source_fk
    FOREIGN KEY (tenant_id, source_id)
    REFERENCES agroway_external.source (tenant_id, source_id);

ALTER TABLE agroway_external.raw_ingestion_record
  DROP CONSTRAINT IF EXISTS raw_ingestion_record_source_id_fkey,
  ADD CONSTRAINT raw_ingestion_tenant_source_fk
    FOREIGN KEY (tenant_id, source_id)
    REFERENCES agroway_external.source (tenant_id, source_id);

ALTER TABLE agroway_external.observation
  DROP CONSTRAINT IF EXISTS observation_source_id_fkey,
  DROP CONSTRAINT IF EXISTS observation_device_id_fkey,
  DROP CONSTRAINT IF EXISTS observation_ingestion_id_fkey,
  ADD CONSTRAINT observation_tenant_source_fk
    FOREIGN KEY (tenant_id, source_id)
    REFERENCES agroway_external.source (tenant_id, source_id),
  ADD CONSTRAINT observation_tenant_device_fk
    FOREIGN KEY (tenant_id, device_id)
    REFERENCES agroway_external.device (tenant_id, device_id),
  ADD CONSTRAINT observation_tenant_ingestion_fk
    FOREIGN KEY (tenant_id, ingestion_id)
    REFERENCES agroway_external.raw_ingestion_record (tenant_id, ingestion_id);

ALTER TABLE agroway_external.measurement
  DROP CONSTRAINT IF EXISTS measurement_observation_id_fkey,
  ADD CONSTRAINT measurement_tenant_observation_fk
    FOREIGN KEY (tenant_id, observation_id)
    REFERENCES agroway_external.observation (tenant_id, observation_id),
  ADD CONSTRAINT measurement_tenant_source_fk
    FOREIGN KEY (tenant_id, source_id)
    REFERENCES agroway_external.source (tenant_id, source_id),
  ADD CONSTRAINT measurement_tenant_device_fk
    FOREIGN KEY (tenant_id, device_id)
    REFERENCES agroway_external.device (tenant_id, device_id);

ALTER TABLE agroway_external.remote_sensing_scene
  DROP CONSTRAINT IF EXISTS remote_sensing_scene_source_id_fkey,
  ADD CONSTRAINT remote_scene_tenant_source_fk
    FOREIGN KEY (tenant_id, source_id)
    REFERENCES agroway_external.source (tenant_id, source_id);

ALTER TABLE agroway_external.agronomic_alert
  ADD CONSTRAINT agronomic_alert_tenant_rule_fk
    FOREIGN KEY (tenant_id, rule_id, rule_version)
    REFERENCES agroway_external.agronomic_rule (tenant_id, rule_id, version);

CREATE OR REPLACE VIEW agroway_external.canonical_fact_v
WITH (security_invoker = true) AS
SELECT measurement_id AS fact_id, tenant_id, source_id, field_id, plot_id,
       metric, value, unit, observed_at, quality_level, measurement_id
FROM agroway_external.measurement
WHERE quality_level IN ('GOOD','DEGRADED');

-- ---------------------------------------------------------------------------
-- Invest + Control Tower
-- ---------------------------------------------------------------------------
ALTER TABLE agroway_invest.project
  ADD CONSTRAINT project_tenant_project_uq UNIQUE (tenant_id, project_id);
ALTER TABLE agroway_invest.capital_commitment
  ADD CONSTRAINT commitment_tenant_commitment_uq UNIQUE (tenant_id, commitment_id);
ALTER TABLE agroway_invest.budget_version
  ADD CONSTRAINT budget_version_tenant_project_version_uq UNIQUE (tenant_id, project_id, version);

ALTER TABLE agroway_invest.capital_commitment
  DROP CONSTRAINT IF EXISTS capital_commitment_project_id_fkey,
  ADD CONSTRAINT commitment_tenant_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id);

ALTER TABLE agroway_invest.capital_deployment
  DROP CONSTRAINT IF EXISTS capital_deployment_project_id_fkey,
  DROP CONSTRAINT IF EXISTS capital_deployment_commitment_id_fkey,
  ADD CONSTRAINT deployment_tenant_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id),
  ADD CONSTRAINT deployment_tenant_commitment_fk
    FOREIGN KEY (tenant_id, commitment_id)
    REFERENCES agroway_invest.capital_commitment (tenant_id, commitment_id);

ALTER TABLE agroway_invest.capital_recovery
  DROP CONSTRAINT IF EXISTS capital_recovery_project_id_fkey,
  ADD CONSTRAINT recovery_tenant_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id);

ALTER TABLE agroway_invest.budget_version
  DROP CONSTRAINT IF EXISTS budget_version_project_id_fkey,
  ADD CONSTRAINT budget_version_tenant_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id);

ALTER TABLE agroway_invest.budget_line
  DROP CONSTRAINT IF EXISTS budget_line_project_id_version_fkey,
  ADD CONSTRAINT budget_line_tenant_budget_version_fk
    FOREIGN KEY (tenant_id, project_id, version)
    REFERENCES agroway_invest.budget_version (tenant_id, project_id, version);

ALTER TABLE agroway_invest.risk
  DROP CONSTRAINT IF EXISTS risk_project_id_fkey,
  ADD CONSTRAINT risk_tenant_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id);

ALTER TABLE agroway_invest.evidence_link
  DROP CONSTRAINT IF EXISTS evidence_link_project_id_fkey,
  ADD CONSTRAINT evidence_link_tenant_project_fk
    FOREIGN KEY (tenant_id, project_id)
    REFERENCES agroway_invest.project (tenant_id, project_id);

-- ---------------------------------------------------------------------------
-- Copilot + Knowledge evidence
-- ---------------------------------------------------------------------------
ALTER TABLE agroway_copilot.session
  ADD CONSTRAINT session_tenant_session_uq UNIQUE (tenant_id, session_id);
ALTER TABLE agroway_copilot.inquiry
  ADD CONSTRAINT inquiry_tenant_request_uq UNIQUE (tenant_id, request_id);
ALTER TABLE agroway_copilot.evidence_bundle
  ADD CONSTRAINT evidence_bundle_tenant_bundle_uq UNIQUE (tenant_id, bundle_id);
ALTER TABLE agroway_copilot.response
  ADD CONSTRAINT response_tenant_response_uq UNIQUE (tenant_id, response_id);

ALTER TABLE agroway_copilot.inquiry
  DROP CONSTRAINT IF EXISTS inquiry_session_id_fkey,
  ADD CONSTRAINT inquiry_tenant_session_fk
    FOREIGN KEY (tenant_id, session_id)
    REFERENCES agroway_copilot.session (tenant_id, session_id);

ALTER TABLE agroway_copilot.policy_evaluation
  DROP CONSTRAINT IF EXISTS policy_evaluation_request_id_fkey,
  ADD CONSTRAINT policy_evaluation_tenant_request_fk
    FOREIGN KEY (tenant_id, request_id)
    REFERENCES agroway_copilot.inquiry (tenant_id, request_id);

ALTER TABLE agroway_copilot.evidence_bundle
  DROP CONSTRAINT IF EXISTS evidence_bundle_request_id_fkey,
  ADD CONSTRAINT evidence_bundle_tenant_request_fk
    FOREIGN KEY (tenant_id, request_id)
    REFERENCES agroway_copilot.inquiry (tenant_id, request_id);

ALTER TABLE agroway_copilot.evidence_item
  DROP CONSTRAINT IF EXISTS evidence_item_bundle_id_fkey,
  ADD CONSTRAINT evidence_item_tenant_bundle_fk
    FOREIGN KEY (tenant_id, bundle_id)
    REFERENCES agroway_copilot.evidence_bundle (tenant_id, bundle_id);

ALTER TABLE agroway_copilot.response
  DROP CONSTRAINT IF EXISTS response_request_id_fkey,
  ADD CONSTRAINT response_tenant_request_fk
    FOREIGN KEY (tenant_id, request_id)
    REFERENCES agroway_copilot.inquiry (tenant_id, request_id);

ALTER TABLE agroway_copilot.citation
  DROP CONSTRAINT IF EXISTS citation_response_id_fkey,
  ADD CONSTRAINT citation_tenant_response_fk
    FOREIGN KEY (tenant_id, response_id)
    REFERENCES agroway_copilot.response (tenant_id, response_id);

ALTER TABLE agroway_copilot.draft_suggestion
  DROP CONSTRAINT IF EXISTS draft_suggestion_response_id_fkey,
  ADD CONSTRAINT draft_suggestion_tenant_response_fk
    FOREIGN KEY (tenant_id, response_id)
    REFERENCES agroway_copilot.response (tenant_id, response_id);

ALTER TABLE agroway_copilot.feedback
  DROP CONSTRAINT IF EXISTS feedback_response_id_fkey,
  ADD CONSTRAINT feedback_tenant_response_fk
    FOREIGN KEY (tenant_id, response_id)
    REFERENCES agroway_copilot.response (tenant_id, response_id);

-- ---------------------------------------------------------------------------
-- Certified pilot
-- ---------------------------------------------------------------------------
ALTER TABLE agroway_pilot.enrollment
  ADD CONSTRAINT enrollment_tenant_pilot_uq UNIQUE (tenant_id, pilot_id);
ALTER TABLE agroway_pilot.certification_decision
  ADD CONSTRAINT certification_decision_tenant_pilot_digest_uq
    UNIQUE (tenant_id, pilot_id, decision_digest_sha256);

ALTER TABLE agroway_pilot.evidence
  DROP CONSTRAINT IF EXISTS evidence_pilot_id_fkey,
  ADD CONSTRAINT pilot_evidence_tenant_enrollment_fk
    FOREIGN KEY (tenant_id, pilot_id)
    REFERENCES agroway_pilot.enrollment (tenant_id, pilot_id);

ALTER TABLE agroway_pilot.stage_evaluation
  DROP CONSTRAINT IF EXISTS stage_evaluation_pilot_id_fkey,
  ADD CONSTRAINT stage_evaluation_tenant_enrollment_fk
    FOREIGN KEY (tenant_id, pilot_id)
    REFERENCES agroway_pilot.enrollment (tenant_id, pilot_id);

ALTER TABLE agroway_pilot.certification_decision
  DROP CONSTRAINT IF EXISTS certification_decision_pilot_id_fkey,
  ADD CONSTRAINT certification_decision_tenant_enrollment_fk
    FOREIGN KEY (tenant_id, pilot_id)
    REFERENCES agroway_pilot.enrollment (tenant_id, pilot_id);

ALTER TABLE agroway_pilot.certificate
  DROP CONSTRAINT IF EXISTS certificate_pilot_id_fkey,
  ADD CONSTRAINT certificate_tenant_enrollment_fk
    FOREIGN KEY (tenant_id, pilot_id)
    REFERENCES agroway_pilot.enrollment (tenant_id, pilot_id),
  ADD CONSTRAINT certificate_tenant_decision_fk
    FOREIGN KEY (tenant_id, pilot_id, decision_digest_sha256)
    REFERENCES agroway_pilot.certification_decision
      (tenant_id, pilot_id, decision_digest_sha256);

ALTER TABLE agroway_pilot.replay_audit
  DROP CONSTRAINT IF EXISTS replay_audit_pilot_id_fkey,
  ADD CONSTRAINT replay_audit_tenant_enrollment_fk
    FOREIGN KEY (tenant_id, pilot_id)
    REFERENCES agroway_pilot.enrollment (tenant_id, pilot_id);

DO $$
DECLARE sch text; t text;
BEGIN
  FOR sch,t IN SELECT * FROM (VALUES
    ('agroway_external','provider'),('agroway_external','source'),('agroway_external','device'),
    ('agroway_external','raw_ingestion_record'),('agroway_external','observation'),('agroway_external','measurement'),
    ('agroway_external','remote_sensing_scene'),('agroway_external','agronomic_rule'),('agroway_external','agronomic_alert'),
    ('agroway_invest','project'),('agroway_invest','capital_commitment'),('agroway_invest','capital_deployment'),
    ('agroway_invest','capital_recovery'),('agroway_invest','budget_version'),('agroway_invest','budget_line'),
    ('agroway_invest','risk'),('agroway_invest','evidence_link'),
    ('agroway_control','snapshot'),('agroway_control','exception'),('agroway_control','projector_checkpoint'),
    ('agroway_copilot','session'),('agroway_copilot','inquiry'),('agroway_copilot','policy_evaluation'),
    ('agroway_copilot','evidence_bundle'),('agroway_copilot','evidence_item'),('agroway_copilot','response'),
    ('agroway_copilot','citation'),('agroway_copilot','draft_suggestion'),('agroway_copilot','feedback'),
    ('agroway_pilot','enrollment'),('agroway_pilot','evidence'),('agroway_pilot','stage_evaluation'),
    ('agroway_pilot','certification_decision'),('agroway_pilot','certificate'),('agroway_pilot','replay_audit')
  ) AS x(schema_name,table_name)
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', sch, t);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', sch, t);
  END LOOP;
END $$;

REVOKE ALL ON agroway_external.raw_ingestion_record FROM PUBLIC;

COMMENT ON VIEW agroway_external.canonical_fact_v IS
  'Tenant-scoped canonical external facts. security_invoker=true ensures underlying RLS is evaluated for the caller.';
COMMENT ON CONSTRAINT certificate_tenant_decision_fk ON agroway_pilot.certificate IS
  'A certificate must reference an existing eligibility decision for the same tenant and pilot using the exact decision digest.';

COMMIT;
