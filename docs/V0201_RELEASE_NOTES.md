# AGROWAY v0.20.1-rc1 — Integration hardening

## Security/integrity fixes

- Tenant-owned parent-child relationships introduced in v0.17-v0.20 are constrained by `tenant_id` in addition to entity ids.
- `agroway_external.canonical_fact_v` uses PostgreSQL `security_invoker=true`.
- All 35 tenant-owned tables are set to `FORCE ROW LEVEL SECURITY`.
- Pilot certificates have a relational FK to the exact `(tenant_id, pilot_id, decision_digest_sha256)` eligibility decision.
- Raw external provider payload access remains revoked from `PUBLIC` and is explicitly covered by guardrails.

## Integration tooling prepared

- Disposable PostGIS integration database configuration.
- Runtime SQL tests for cross-tenant FK rejection, RLS filtering/write rejection, FORCE RLS, raw-data boundary and certificate digest binding.
- GitHub Actions integration workflow definition in the v0.20.1 cumulative patch.
- Unified private CI runner for guardrails, validators, TypeScript, Vitest, DB tests and builds/Graphify when scripts exist.

## Domain delta

- Domain Events: **+0** — remains **218 conceptual**.
- Workspaces: **+0** — remains **12 cumulative additions over v0.16**.

## Current limitation

The exact v0.16 source ZIP is not currently mounted/recoverable. Positive overlay and full repository runtime therefore remain pending and must not be reported as PASS until the approved base is recovered and verified by SHA-256.
