# AGROWAY v0.21.0-alpha6 — TRACEABILITY_PASSPORT_ASSEMBLY validation

Status: **READY_FOR_PRODUCT_APPROVAL**

## Product QA

- Passport static checks: **23/23 PASS**.
- Chromium browser QA: **36/36 PASS**.
- Mandatory viewports: **1440×900** and **390×844**.
- Browser console errors: **0**.
- Horizontal overflow: **0**.
- Default missing harvest/output blocks eligibility: PASS.
- All evidence available with local-pending sections => `ASSEMBLY_READY`, review disabled: PASS.
- All six canonical demo snapshots => `ELIGIBLE_FOR_HUMAN_CERTIFICATION`, review enabled: PASS.
- Review action issues no certificate and does not change eligibility to `CERTIFIED`: PASS.
- `CERTIFIED` is forbidden as a FIELD UI state.
- Human signer remains unassigned and certification decision digest remains `PENDING_SERVER`.

## Runtime boundary

WebCrypto SHA-256 can be unavailable on the administrator-enforced opaque inline QA origin. In that case the UI displays a human-readable pending state and does not invent a digest. Native HTTP(S) digest execution remains pending a navigable secure origin.

Real certification persistence, production evidence validation, named signer and server decision digest are **PENDING/OUTSIDE THIS UI**, never represented as PASS.

D10 Human Product Approval: **PENDING**.
