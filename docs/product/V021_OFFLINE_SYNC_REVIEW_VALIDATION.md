# AGROWAY v0.21.0-alpha8 — OFFLINE_SYNC_CONFLICT_REVIEW validation

Status: **READY_FOR_PRODUCT_APPROVAL**

- Static: **28/28 PASS**.
- Chromium QA: **70/70 PASS**.
- Accumulated FIELD browser QA alpha1-alpha8: **369/369 PASS**.
- Accumulated product-specific static checks alpha1-alpha8: **170/170 PASS**.
- Mandatory 1440×900 + 390×844: PASS.
- 4-envelope adversarial queue classified deterministically: 1 ready, 2 review-required, 1 duplicate ACK demo.
- Supply consumption 5 L vs demo canonical availability 4 L => `SERVER_REVALIDATION_REQUIRED`.
- incident resolution based on v1 vs demo canonical v2 => `CANONICAL_VERSION_CHANGED`.
- known idempotency key => `DUPLICATE_ACK_MATCH`.
- original queue remains logically intact after all review actions.
- every review action: `localOnly=true`, `canonicalMutated=false`, `envelopeRemoved=false`.
- received-time remains `PENDING_SERVER`; event-time preserved.
- no force-overwrite control and no `SYNCED` claim without real ACK.
- TypeScript strict: PASS.
- PostgreSQL structural lint: **102/102 PASS**.
- spec compatibility: **23/23 PASS_NOT_REAL_VITEST**.
- release readiness: `READY_FOR_PRODUCT_DEVELOPMENT_WITH_RUNTIME_PENDING`.
- private CI: `PASS_WITH_PENDING`.

Real server submission/ACK, canonical revalidation, PostgreSQL/PostGIS runtime and real Vitest remain **PENDING**.
D10 Human Product Approval: **PENDING**.
