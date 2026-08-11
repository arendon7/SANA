#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const required = [
  'infra/postgres/migrations/0021_tenant_integrity_hardening.sql',
  'infra/postgres/tests/v0201_tenant_integrity_runtime.sql',
  'infra/postgres/tests/v0201_rls_runtime.sql',
  'infra/postgres/tests/run-v0201-db-tests.sh',
  'infra/dev/docker-compose.integration.yml',
  'scripts/guardrail-v0201.mjs',
  'scripts/run-private-ci-v0201.mjs',
  '.github/workflows/agroway-v0201-integration.yml'
];
const failures = [];
for (const rel of required) if (!fs.existsSync(path.join(root, rel))) failures.push(`missing ${rel}`);

const sqlPath = path.join(root, required[0]);
if (fs.existsSync(sqlPath)) {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const digest = crypto.createHash('sha256').update(sql).digest('hex');
  if (!/^[a-f0-9]{64}$/.test(digest)) failures.push('invalid migration SHA-256');
  const begin = (sql.match(/\bBEGIN;/g) || []).length;
  const commit = (sql.match(/\bCOMMIT;/g) || []).length;
  if (begin !== 1 || commit !== 1) failures.push(`migration transaction boundary invalid BEGIN=${begin} COMMIT=${commit}`);
  if (!sql.includes('security_invoker = true')) failures.push('canonical_fact_v is not security_invoker');
  if (!sql.includes('certificate_tenant_decision_fk')) failures.push('certificate digest relational binding missing');
}

const workflowPath = path.join(root, '.github/workflows/agroway-v0201-integration.yml');
if (fs.existsSync(workflowPath)) {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  for (const marker of ['postgis/postgis:', 'npm ci', 'run-private-ci-v0201.mjs --runtime --build', 'guardrail:v0201']) {
    if (!workflow.includes(marker)) failures.push(`workflow missing ${marker}`);
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'PASS', validator: 'v0.20.1 integration readiness', requiredFiles: required.length }, null, 2));
