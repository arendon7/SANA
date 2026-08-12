# AGROWAY v0.21 runtime closure — alpha10

Status: **RUNTIME_CORE_AND_NATIVE_BROWSER_PASS_WITH_PRODUCT_APPROVAL_PENDING**

## GitHub Actions evidence

Workflow: `AGROWAY FIELD v0.21 alpha runtime`

Validated on Node 22, `postgis/postgis:16-3.4`, Vitest 4.1.7 and Playwright 1.57.0.

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
- Isolated CI package manager: `pnpm@10.15.0` via Corepack.
- Runtime: `vitest/4.1.7` on Node 22.
- Test files: **12/12 PASS**.
- Tests: **28/28 PASS**.

The initial npm installation attempt failed inside npm Arborist before test execution. The runtime was isolated from npm using pinned pnpm; no product code or tests were weakened.

Boundary: this proves real Vitest for the exact observed reconstructed test closure. It is not yet a claim that every one of the 41 workspaces is directly persisted and tested from the canonical root lockfile in GitHub.

### Native Chromium → real FIELD HTTP server

**PASS — Playwright 1.57.0 / Chromium**

Public alpha10 bundle SHA-256:

`1ea29026ccf160dfebc15b24f6f27408a8bff459be4c422e0791775520dcf00b`

Native browser checks: **42/42 PASS**.

The browser navigates the real `http://127.0.0.1:4173` FIELD server and verifies:

- HTTP 200 and security headers (`nosniff`, `DENY`, `no-referrer`);
- localhost secure context;
- real manifest delivery;
- Service Worker registration and activation;
- native browser `localStorage`;
- invitation submitted by browser fetch and persisted by `LOCAL_DEV_BACKEND_NOT_PRODUCTION`;
- invitation server received-time and `NOT_SENT_DEV` delivery boundary;
- full-tenant export only becomes READY after a real development artifact and SHA-256 exist;
- real HTTP export bytes and `X-AGROWAY-SHA256` match the UI digest;
- real Chromium `<a download>` bytes match the same SHA-256;
- local outbox envelope reaches the real sync endpoint;
- queue clears only after accepted server ACK;
- event-time is preserved and received-time is server-generated;
- ACK SHA-256 exists;
- server persists sync receipt and ACK;
- desktop 1440×900 and mobile 390×844 have no horizontal overflow;
- mobile primary target is >=44×44;
- zero browser console errors;
- zero page errors.

Evidence artifact SHA-256:

`c205f62ba29dbaf9a32da7d6866d6024c42f0d4051ab3bda47be2eb4667a48d7`

Boundary: this proves native browser transport against `LOCAL_DEV_BACKEND_NOT_PRODUCTION`; it is not a claim of production authentication, production object storage or production canonical sync.

## Direct-source migration started

The review branch now also contains the reconstructed alpha10 root `package.json`, `package-lock.json`, root `tsconfig.json`, compatibility type shim, and the first directly readable application workspaces. This is an incremental migration away from SHA-locked transitional bundles/slices.

Do not claim the full 41-workspace monorepo is directly persisted until the remaining packages/services have been materialized and root `npm ci + tsc` passes from the branch itself.

## Still pending

- direct readable persistence of the remaining reconstructed monorepo source in GitHub;
- root workspace `npm ci + tsc` from the directly persisted branch;
- production-grade web/mobile build pipeline;
- production authentication/authorization integration;
- real invitation delivery;
- production object storage/export worker;
- production canonical sync handlers;
- D10 Human Product Approval;
- real agricultural pilot evidence and named human signer.

AI remains advisory-only and certification remains human-only.
