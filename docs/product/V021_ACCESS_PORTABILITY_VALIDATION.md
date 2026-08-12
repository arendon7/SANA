# AGROWAY v0.21.0-alpha9 — ACCESS_PORTABILITY validation

Status: **READY_FOR_PRODUCT_APPROVAL**

- Access/portability static validator: **34/34 PASS**.
- Chromium QA: **50/50 PASS**.
- Mandatory viewports 1440×900 and 390×844: PASS.
- Role escalation (`OPERATOR` + `identity:admin`) rejected and not persisted.
- Valid invitation remains `PENDING`, `localOnly=true`, and emits only a local outbox envelope.
- Demo subscription exposes 6 capability decisions: 4 enabled and 2 `NO_ENTITLED`.
- Local JSON and CSV payload generation: PASS.
- SHA-256 integrity: PASS, including pure-JS fallback standard vector `abc -> ba7816bf...15ad`.
- Full-tenant export remains `REQUESTED` with no fake artifact/digest.
- TypeScript strict: PASS.
- PostgreSQL structural lint: **29 migrations / 112 checks PASS**.
- Existing repository specs through node:test Vitest-compat: **12 files / 28 tests PASS** (not real Vitest).
- `verify:offline`: PASS, including all 9 FIELD vertical validators.
- Private CI: **PASS_WITH_PENDING**.
- Canonical Domain Events added: **0**.
- Workspaces added: **0**.
- Migration added: **0023_access_entitlements_portability.sql**.

## Runtime boundary

Actual browser download transport is not claimed as PASS because this environment blocks Chromium navigation to localhost. Inline Chromium executed payload generation, SHA-256 and download-link intent. Real invitation delivery, complete tenant export backend, Vitest runtime and PostgreSQL/PostGIS execution remain pending.

D10 Human Product Approval: **PENDING**.
