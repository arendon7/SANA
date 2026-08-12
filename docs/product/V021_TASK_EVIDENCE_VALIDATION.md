# AGROWAY v0.21.0-alpha3 — TASK_EVIDENCE_CAPTURE validation

Status: **READY_FOR_PRODUCT_APPROVAL**

## Product QA

- Task-evidence structural checks: **20/20 PASS**.
- Chromium interaction/layout QA: **37/37 PASS**.
- FIELD_HOME regression: **14/14 PASS**.
- CROP_CYCLE regression: **18/18 PASS**.
- Mandatory viewports: **1440×900** and **390×844**.
- Browser console errors: **0**.
- Horizontal overflow: **0**.
- Task → evidence execution routing: PASS.
- Required measurement + notes: PASS.
- Photo capture contract: PASS.
- SHA-256 metadata contract: PASS.
- Local outbox context binding: PASS.
- Outbox contains no blob bytes: PASS.
- Task completion and event-time activity projection: PASS.
- Crop-cycle history projection: PASS.

## Storage/runtime boundary

Production code uses IndexedDB for blobs and WebCrypto `SHA-256`. The administrator policy forces browser QA through an opaque inline origin, where IndexedDB and WebCrypto subtle are denied. D9 therefore exercises the same user flow with an explicitly labeled `MEMORY_FALLBACK_QA_ONLY` storage fallback and bounded SHA harness shim. Native IndexedDB/WebCrypto runtime remains pending a navigable HTTP(S) browser environment and is **not** represented as PASS.

## Repository regression

- offline package-lock + `npm ci`: PASS.
- Design governance/preflight: PASS.
- TypeScript strict: PASS.
- PostgreSQL structural lint: **102/102 PASS**.
- Existing spec compatibility: **23/23 PASS**.
- cumulative guardrails: PASS.

## Human gate

D10 Human Product Approval: **PENDING**.
