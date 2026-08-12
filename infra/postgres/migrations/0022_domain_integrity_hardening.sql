BEGIN;

-- v0.20.2: database-level integrity for invariants that must survive direct
-- writes, retries, adapter defects and compromised/incorrect application code.

-- ---------------------------------------------------------------------------
-- External data lifecycle / quality
-- ---------------------------------------------------------------------------
ALTER TABLE agroway_external.source
  ADD CONSTRAINT source_freshness_slo_positive_ck CHECK (freshness_slo_minutes > 0) NOT VALID;
ALTER TABLE agroway_external.raw_ingestion_record
  ADD CONSTRAINT raw_ingestion_payload_sha256_ck CHECK (btrim(payload_sha256) ~ '^[a-f0-9]{64}$') NOT VALID,
  ADD CONSTRAINT raw_ingestion_quarantine_reason_ck CHECK (
    (state = 'QUARANTINED' AND quarantine_reason IS NOT NULL AND length(btrim(quarantine_reason)) > 0)
    OR (state <> 'QUARANTINED' AND quarantine_reason IS NULL)
  ) NOT VALID;
ALTER TABLE agroway_external.observation
  ADD CONSTRAINT observation_normalized_after_observed_ck CHECK (normalized_at >= observed_at) NOT VALID;
ALTER TABLE agroway_external.remote_sensing_scene
  ADD CONSTRAINT remote_scene_cloud_cover_ck CHECK (cloud_cover_pct IS NULL OR (cloud_cover_pct >= 0 AND cloud_cover_pct <= 100)) NOT VALID;
ALTER TABLE agroway_external.agronomic_alert
  ADD CONSTRAINT agronomic_alert_severity_ck CHECK (severity IN ('INFO','WARNING','CRITICAL')) NOT VALID;

ALTER TABLE agroway_external.source VALIDATE CONSTRAINT source_freshness_slo_positive_ck;
ALTER TABLE agroway_external.raw_ingestion_record VALIDATE CONSTRAINT raw_ingestion_payload_sha256_ck;
ALTER TABLE agroway_external.raw_ingestion_record VALIDATE CONSTRAINT raw_ingestion_quarantine_reason_ck;
ALTER TABLE agroway_external.observation VALIDATE CONSTRAINT observation_normalized_after_observed_ck;
ALTER TABLE agroway_external.remote_sensing_scene VALIDATE CONSTRAINT remote_scene_cloud_cover_ck;
ALTER TABLE agroway_external.agronomic_alert VALIDATE CONSTRAINT agronomic_alert_severity_ck;

-- ---------------------------------------------------------------------------
-- Investment ledger: scope, project/commitment relationship and currency
-- ---------------------------------------------------------------------------
ALTER TABLE agroway_invest.project
  ADD CONSTRAINT project_currency_ck CHECK (currency ~ '^[A-Z]{3}$') NOT VALID,
  ADD CONSTRAINT project_tenant_project_currency_uq UNIQUE (tenant_id, project_id, currency);
ALTER TABLE agroway_invest.project VALIDATE CONSTRAINT project_currency_ck;

ALTER TABLE agroway_invest.capital_commitment
  ADD CONSTRAINT commitment_tenant_project_commitment_uq UNIQUE (tenant_id, project_id, commitment_id),
  ADD CONSTRAINT commitment_project_currency_fk
    FOREIGN KEY (tenant_id, project_id, currency)
    REFERENCES agroway_invest.project (tenant_id, project_id, currency);

ALTER TABLE agroway_invest.capital_deployment
  DROP CONSTRAINT IF EXISTS deployment_tenant_commitment_fk,
  ADD CONSTRAINT deployment_tenant_project_commitment_fk
    FOREIGN KEY (tenant_id, project_id, commitment_id)
    REFERENCES agroway_invest.capital_commitment (tenant_id, project_id, commitment_id),
  ADD CONSTRAINT deployment_project_currency_fk
    FOREIGN KEY (tenant_id, project_id, currency)
    REFERENCES agroway_invest.project (tenant_id, project_id, currency);

ALTER TABLE agroway_invest.capital_recovery
  ADD CONSTRAINT recovery_project_currency_fk
    FOREIGN KEY (tenant_id, project_id, currency)
    REFERENCES agroway_invest.project (tenant_id, project_id, currency);

ALTER TABLE agroway_invest.budget_version
  ADD CONSTRAINT budget_version_project_currency_fk
    FOREIGN KEY (tenant_id, project_id, currency)
    REFERENCES agroway_invest.project (tenant_id, project_id, currency);

ALTER TABLE agroway_invest.project
  ADD CONSTRAINT project_approved_budget_fk
    FOREIGN KEY (tenant_id, project_id, approved_budget_version)
    REFERENCES agroway_invest.budget_version (tenant_id, project_id, version)
    DEFERRABLE INITIALLY IMMEDIATE;

-- ---------------------------------------------------------------------------
-- Copilot responses must bind to the exact evidence context used to generate
-- them. REFUSED pre-model responses may legitimately have no context hash.
-- ---------------------------------------------------------------------------
ALTER TABLE agroway_copilot.response
  ADD CONSTRAINT response_context_hash_ck CHECK (
    context_hash_sha256 IS NULL OR btrim(context_hash_sha256) ~ '^[a-f0-9]{64}$'
  ) NOT VALID,
  ADD CONSTRAINT response_model_context_required_ck CHECK (
    status = 'REFUSED' OR context_hash_sha256 IS NOT NULL
  ) NOT VALID,
  ADD CONSTRAINT response_tenant_evidence_context_fk
    FOREIGN KEY (tenant_id, request_id, context_hash_sha256)
    REFERENCES agroway_copilot.evidence_bundle (tenant_id, request_id, context_hash_sha256);
ALTER TABLE agroway_copilot.response VALIDATE CONSTRAINT response_context_hash_ck;
ALTER TABLE agroway_copilot.response VALIDATE CONSTRAINT response_model_context_required_ck;

-- ---------------------------------------------------------------------------
-- Certified pilot: canonical stage/kind vocabulary and eligible-decision bind.
-- ---------------------------------------------------------------------------
ALTER TABLE agroway_pilot.evidence
  ADD CONSTRAINT pilot_evidence_stage_ck CHECK (stage IN (
    'IDENTITY_LAND','CROP_CYCLE','AGRONOMY_PLAN','SUPPLY_READINESS','INVESTMENT_CONTROL','MOBILE_OFFLINE_SYNC',
    'FIELD_EXECUTION','MEASUREMENTS_DECISIONS','HARVEST_SALE_SETTLEMENT','TRACEABILITY_IMPACT','CONTROL_TOWER_REBUILD','COPILOT_BOUNDARY'
  )) NOT VALID,
  ADD CONSTRAINT pilot_evidence_kind_ck CHECK (kind IN (
    'TENANT_ISOLATION','CANONICAL_ENTITY','AGRONOMIC_PLAN','SUPPLY_SNAPSHOT','INVEST_CONTROL','OFFLINE_SYNC','FIELD_EVIDENCE',
    'CANONICAL_EXTERNAL_FACT','AGRONOMIC_DECISION','HARVEST_SETTLEMENT','TRACEABILITY_PASSPORT','IMPACT_SNAPSHOT','PROJECTOR_REBUILD','COPILOT_BOUNDARY'
  )) NOT VALID;
ALTER TABLE agroway_pilot.stage_evaluation
  ADD CONSTRAINT pilot_stage_evaluation_stage_ck CHECK (stage IN (
    'IDENTITY_LAND','CROP_CYCLE','AGRONOMY_PLAN','SUPPLY_READINESS','INVESTMENT_CONTROL','MOBILE_OFFLINE_SYNC',
    'FIELD_EXECUTION','MEASUREMENTS_DECISIONS','HARVEST_SALE_SETTLEMENT','TRACEABILITY_IMPACT','CONTROL_TOWER_REBUILD','COPILOT_BOUNDARY'
  )) NOT VALID;
ALTER TABLE agroway_pilot.certification_decision
  ADD CONSTRAINT certification_eligible_reasons_ck CHECK (
    status <> 'ELIGIBLE_FOR_CERTIFICATION' OR jsonb_array_length(reason_codes) = 0
  ) NOT VALID,
  ADD CONSTRAINT certification_decision_eligible_bind_uq
    UNIQUE (tenant_id, pilot_id, decision_digest_sha256, policy_version, status);
ALTER TABLE agroway_pilot.certificate
  ADD COLUMN decision_status text NOT NULL DEFAULT 'ELIGIBLE_FOR_CERTIFICATION',
  ADD CONSTRAINT certificate_decision_status_ck CHECK (decision_status = 'ELIGIBLE_FOR_CERTIFICATION') NOT VALID,
  DROP CONSTRAINT IF EXISTS certificate_tenant_decision_fk,
  ADD CONSTRAINT certificate_tenant_eligible_decision_fk
    FOREIGN KEY (tenant_id, pilot_id, decision_digest_sha256, policy_version, decision_status)
    REFERENCES agroway_pilot.certification_decision
      (tenant_id, pilot_id, decision_digest_sha256, policy_version, status);
ALTER TABLE agroway_pilot.replay_audit
  ADD CONSTRAINT replay_pass_requires_events_ck CHECK (status <> 'PASS' OR event_count > 0) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS pilot_one_active_certificate_uq
  ON agroway_pilot.certificate(tenant_id,pilot_id)
  WHERE state='ACTIVE';

ALTER TABLE agroway_pilot.evidence VALIDATE CONSTRAINT pilot_evidence_stage_ck;
ALTER TABLE agroway_pilot.evidence VALIDATE CONSTRAINT pilot_evidence_kind_ck;
ALTER TABLE agroway_pilot.stage_evaluation VALIDATE CONSTRAINT pilot_stage_evaluation_stage_ck;
ALTER TABLE agroway_pilot.certification_decision VALIDATE CONSTRAINT certification_eligible_reasons_ck;
ALTER TABLE agroway_pilot.certificate VALIDATE CONSTRAINT certificate_decision_status_ck;
ALTER TABLE agroway_pilot.replay_audit VALIDATE CONSTRAINT replay_pass_requires_events_ck;

COMMENT ON CONSTRAINT deployment_tenant_project_commitment_fk ON agroway_invest.capital_deployment IS
  'A deployment commitment must belong to the same tenant AND same investment project.';
COMMENT ON CONSTRAINT response_tenant_evidence_context_fk ON agroway_copilot.response IS
  'A model-backed response is bound to the exact deterministic evidence context hash resolved for its inquiry.';
COMMENT ON CONSTRAINT certificate_tenant_eligible_decision_fk ON agroway_pilot.certificate IS
  'A certificate can reference only an ELIGIBLE_FOR_CERTIFICATION decision with the same tenant, pilot, policy and exact digest.';

COMMIT;
