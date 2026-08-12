# AGROWAY v0.21 runtime closure — alpha10

Status: **RUNTIME_CORE_PASS_WITH_PRODUCT_APPROVAL_PENDING**

## GitHub Actions evidence

Workflow: `AGROWAY FIELD v0.21 alpha runtime`

Validated on Node 22 and `postgis/postgis:16-3.4`.

### Reconstructed PostgreSQL/PostGIS cumulative runtime

**PASS**

- 30 physical migration files are persisted in the review branch.
- The chain executes from `0001_extensions.sql` through `0024_sync_ingress_ack.sql` on a clean PostGIS database.
- `ON_ERROR_STOP=1` is enforced.
- Historical/reconstructed runtime suites and the v0.21 access/sync adversarial suites run after migration.
- Tenant RLS, tenant-aware FK hardening, pilot/certificate constraints, Copilot evidence binding, external-data integrity, access/entitlements and sync ACK constraints remain fail-closed.

Boundary: this proves the **reconstructed** migration chain. It does not claim byte identity with the lost historical v0.15 artifact.

### Real Vitest runtime

**PASS — Vitest 4.1.7**

- Source closure: 12 observed `.spec.ts` files across 14 workspaces.
- Slice archive SHA-256: `ab07db7f86535fc029ad2e9bc80a8007ac10e7b0dfef73c0c45e1087c13b5b60`.
- Root TypeScript configuration is semantically locked with canonical JSON SHA-256 `dce31da9205b8cdd604349bff4945ad23b315735b8db522837a854140d808b90`.
- Package manager used only for the isolated CI slice: `pnpm@10.15.0` via Corepack.
- Runtime: `vitest/4.1.7` on Node 22.
- Test files: **12/12 PASS**.
- Tests: **28/28 PASS**.

The initial npm installation attempt failed inside npm Arborist before test execution. The runtime was therefore isolated from npm using pinned pnpm; no product code or tests were weakened.

Boundary: this proves real Vitest for the exact observed reconstructed test closure. It is not yet a claim that every one of the 41 workspaces is directly persisted and tested from a canonical root lockfile in GitHub.

## Still pending

- direct readable persistence of the remaining reconstructed monorepo source in GitHub;
- production-grade web/mobile build pipeline;
- native browser-to-HTTP(S) Playwright proof against the actual FIELD server;
- production authentication/authorization integration;
- real invitation delivery;
- production object storage/export worker;
- production canonical sync handlers;
- D10 Human Product Approval;
- real agricultural pilot evidence and named human signer.

AI remains advisory-only and certification remains human-only.
