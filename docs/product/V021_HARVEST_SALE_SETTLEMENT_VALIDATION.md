# AGROWAY v0.21.0-alpha7 — HARVEST_SALE_SETTLEMENT_WORKSPACE validation

Status: **READY_FOR_PRODUCT_APPROVAL**

- Static: **29/29 PASS**.
- Chromium QA: **85/85 PASS**.
- Accumulated browser QA alpha1-alpha7: **299/299 PASS**.
- Product-specific static checks alpha1-alpha7: **142/142 PASS**.
- 1440×900 and 390×844: PASS; console errors 0; horizontal overflow 0.
- 420 kg harvest -> 420000 integer grams, exact cycle/evidence binding: PASS.
- 500 kg sale against 420 kg: BLOCKED.
- 300 kg × COP 14,500/kg -> 435000000 minor units / COP 4,350,000 display: PASS.
- local sellable balance 120 kg; subsequent 130 kg sale: BLOCKED.
- settlement inherits exact sale amount/COP; duplicate local settlement blocked: PASS.
- local envelopes explicitly set canonical mutation false.
- local harvest => Passport LOCAL_PENDING and not human-certification eligible.
- accepted canonical harvest snapshot can complete Passport section but never emits certificate.
- TypeScript strict: PASS; PostgreSQL structural 102/102; spec compatibility 23/23 (not real Vitest).
- release readiness: `READY_FOR_PRODUCT_DEVELOPMENT_WITH_RUNTIME_PENDING`.
- private CI: `PASS_WITH_PENDING`.

Production/Commerce canonical acceptance, payment reconciliation, real Vitest and PostgreSQL/PostGIS runtime remain **PENDING**.
D10 Human Product Approval: **PENDING**.
