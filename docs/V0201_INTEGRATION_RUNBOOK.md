# AGROWAY v0.20.1 integration runbook

v0.20.1 is a hardening/integration release. It adds **no domain events and no product workspaces**.

## What it closes

1. Tenant-aware foreign keys for v0.17-v0.20 tables.
2. `FORCE ROW LEVEL SECURITY` on all 35 tenant-owned tables added by v0.17-v0.20.
3. `security_invoker=true` for `agroway_external.canonical_fact_v`.
4. Certificate relational binding to the exact `(tenant_id, pilot_id, decision_digest_sha256)` eligibility decision.
5. Executable PostgreSQL/PostGIS RLS and cross-tenant tests.
6. One CI runner for guardrails, TypeScript, Vitest, PostgreSQL/PostGIS, builds and Graphify when present.

## Required base

`AGROWAY_REPO_BOOTSTRAP_v0.16.0-rc1.zip`

SHA-256:

`12f33aed9b60cfe4a0f97e65a65d35dd665cfa3cfeb9e218934a1b056d943d8d`

The materializer must fail closed for any other base.

## Private repository execution

After applying the cumulative patch to the exact approved v0.16 ZIP:

```bash
npm ci
npm run guardrail:v0201
```

Local database option:

```bash
docker compose -f infra/dev/docker-compose.integration.yml up -d
export DATABASE_URL=postgresql://postgres:agroway_ci@localhost:55432/agroway_ci
node scripts/run-private-ci-v0201.mjs --runtime --build
```

Then stop the disposable database:

```bash
docker compose -f infra/dev/docker-compose.integration.yml down -v
```

GitHub Actions runs the equivalent flow through `.github/workflows/agroway-v0201-integration.yml` once the complete source tree is materialized.

## Certification boundary

Passing CI proves technical integration of the certification machinery. It does **not** convert the synthetic golden fixture into a real certified agricultural pilot. Real certification requires real field evidence and a named human signer over the exact deterministic decision digest.
