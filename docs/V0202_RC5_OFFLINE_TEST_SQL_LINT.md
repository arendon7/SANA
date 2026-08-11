# AGROWAY v0.20.2-rc5 — Offline Test + SQL Structural Hardening

## Scope

rc5 does not add product modules or Domain Events. It strengthens verification of the reconstructed full repository while real Vitest and PostgreSQL/PostGIS runtimes remain unavailable in the current environment.

## Same-spec compatibility execution

`npm run test:compat`

- discovers the repository's existing `services/*/test/*.spec.ts` files;
- refuses to shadow a real/existing Vitest unless explicitly forced;
- creates a temporary `vitest` adapter backed by Node `node:test` + `assert/strict`;
- supports only the assertion API subset actually observed in the current specs;
- executes TypeScript through the available `ts-node` ESM loader;
- deletes the temporary adapter after execution.

Validated result:

- spec files: 11/11 PASS
- tests: 23/23 PASS
- label: `NODE_TEST_VITEST_COMPAT_PASS`

This is not reported as real Vitest runtime.

## PostgreSQL structural lint

`npm run lint:postgres`

Validated result:

- migrations: 28
- checks: 102
- lexical/parenthesis/transaction structure: PASS
- valid dynamic tenant-setting expressions: 10/10
- malformed tenant-setting patterns: rejected
- tenant-aware FKs in v0.20.1 hardening: 33
- `FORCE ROW LEVEL SECURITY` list: 35 tenant-owned tables
- `canonical_fact_v security_invoker=true`: present
- raw ingestion `PUBLIC` revoke: present
- deployment same-project commitment binding: present
- Copilot exact evidence-context FK: present
- certificate exact eligible-decision binding: present
- replay PASS requires events: present
- SHA-256 payload constraint: present

The linter is deliberately structural and does not claim to replace PostgreSQL's parser/runtime.

## Unified offline gate

`npm run verify:offline`

Runs:

1. full root strict TypeScript;
2. PostgreSQL structural lint;
3. same-spec Node test compatibility suite.

`run-private-ci-v0202.mjs` also runs the two rc5 layers and still leaves `vitest-real` and `postgres-postgis-domain-integrity` as explicit pending/required gates depending on invocation mode.

## Trust

Build trust remains `RECONSTRUCTED_V015R_FULL_NOT_HISTORICAL_SHA`. rc5 does not change the historical provenance boundary or claim equivalence to the lost v0.15 ZIP.
