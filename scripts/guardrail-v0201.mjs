#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const migrationRel = 'infra/postgres/migrations/0021_tenant_integrity_hardening.sql';
if (!fs.existsSync(path.join(root, migrationRel))) {
  console.error(`v0.20.1 guardrail FAIL: missing ${migrationRel}`);
  process.exit(1);
}
const sql = read(migrationRel);
const fail = (msg) => { console.error(`v0.20.1 guardrail FAIL: ${msg}`); process.exitCode = 1; };
const requireToken = (token, label = token) => { if (!sql.includes(token)) fail(`missing ${label}`); };

const requiredCompositeConstraints = [
  'source_tenant_provider_fk','device_tenant_source_fk','raw_ingestion_tenant_source_fk',
  'observation_tenant_source_fk','observation_tenant_device_fk','observation_tenant_ingestion_fk',
  'measurement_tenant_observation_fk','measurement_tenant_source_fk','measurement_tenant_device_fk',
  'remote_scene_tenant_source_fk','agronomic_alert_tenant_rule_fk','commitment_tenant_project_fk',
  'deployment_tenant_project_fk','deployment_tenant_commitment_fk','recovery_tenant_project_fk',
  'budget_version_tenant_project_fk','budget_line_tenant_budget_version_fk','risk_tenant_project_fk',
  'evidence_link_tenant_project_fk','inquiry_tenant_session_fk','policy_evaluation_tenant_request_fk',
  'evidence_bundle_tenant_request_fk','evidence_item_tenant_bundle_fk','response_tenant_request_fk',
  'citation_tenant_response_fk','draft_suggestion_tenant_response_fk','feedback_tenant_response_fk',
  'pilot_evidence_tenant_enrollment_fk','stage_evaluation_tenant_enrollment_fk',
  'certification_decision_tenant_enrollment_fk','certificate_tenant_enrollment_fk',
  'certificate_tenant_decision_fk','replay_audit_tenant_enrollment_fk'
];
for (const name of requiredCompositeConstraints) requireToken(name, `constraint ${name}`);

requireToken('WITH (security_invoker = true)', 'security_invoker canonical fact view');
requireToken('FORCE ROW LEVEL SECURITY', 'FORCE RLS hardening');
requireToken('FOREIGN KEY (tenant_id, pilot_id, decision_digest_sha256)', 'certificate exact decision digest FK');
requireToken('REFERENCES agroway_pilot.certification_decision', 'certificate decision reference');
requireToken('REVOKE ALL ON agroway_external.raw_ingestion_record FROM PUBLIC', 'raw payload PUBLIC revoke');

const tenantTableMarkers = [
  "('agroway_external','provider')", "('agroway_external','raw_ingestion_record')",
  "('agroway_invest','project')", "('agroway_control','snapshot')",
  "('agroway_copilot','session')", "('agroway_pilot','certificate')"
];
for (const marker of tenantTableMarkers) requireToken(marker, `FORCE RLS table marker ${marker}`);

const migrationFiles = [17,18,19,20,21].map((n) => {
  const prefix = String(n).padStart(4, '0');
  const dir = path.join(root, 'infra/postgres/migrations');
  if (!fs.existsSync(dir)) { fail('missing migrations directory'); return ''; }
  const match = fs.readdirSync(dir).find((name) => name.startsWith(prefix + '_'));
  if (!match) { fail(`missing migration ${prefix}`); return ''; }
  return read(path.join('infra/postgres/migrations', match));
}).join('\n');

const forbiddenRawGrant = /GRANT\s+[^;]*\bON\s+(?:TABLE\s+)?agroway_external\.raw_ingestion_record\s+TO\s+(?:PUBLIC|[^;]*(?:copilot|ai))/i;
if (forbiddenRawGrant.test(migrationFiles)) fail('raw_ingestion_record is granted to PUBLIC/AI/Copilot');
if (/(?:CREATE|ALTER)\s+ROLE[^;]*\bBYPASSRLS\b/i.test(sql)) fail('migration must not grant BYPASSRLS');

if (!process.exitCode) {
  console.log(JSON.stringify({
    status: 'PASS',
    guardrail: 'v0.20.1 tenant-integrity-hardening',
    compositeTenantForeignKeys: requiredCompositeConstraints.length,
    canonicalFactSecurityInvoker: true,
    forceRls: true,
    certificateDecisionDigestBinding: true
  }, null, 2));
}
