# AGROWAY v0.21.0-alpha2 — CROP_CYCLE_WORKSPACE validation

Status: **READY_FOR_PRODUCT_APPROVAL**

## Product QA

- Crop-cycle structural checks: **18/18 PASS**.
- Chromium interaction/layout QA: **29/29 PASS**.
- FIELD_HOME regression: **14/14 PASS**.
- Mandatory evidence viewports: **1440×900** and **390×844**.
- Browser console errors: **0**.
- Horizontal overflow: **0** at both mandatory viewports.
- Keyboard tab navigation: PASS.
- Mobile lot navigation touch target: PASS (>=44 px).
- Local plan evidence mutation: PASS.
- Offline queue event `CYCLE_PLAN_EVIDENCE_RECORDED`: PASS.
- Event-time history includes newly captured local evidence: PASS.
- Copilot evidence + `DRAFT_SUGGESTION` authority boundary: PASS.
- Passport preview refuses real certification claim: PASS.
- Home attention → lot monitoring contextual route: PASS.

## Repository regression

- `npm install --package-lock-only --offline --ignore-scripts`: PASS.
- `npm ci --offline --ignore-scripts`: PASS.
- Design governance: PASS.
- Design preflight: PASS.
- TypeScript strict: PASS.
- PostgreSQL structural lint: **102/102 PASS** across 28 migrations.
- Existing spec compatibility: **23/23 PASS** across 11 specs.
- Cumulative v0.15R–v0.20.2 guardrail/validator chain: PASS.
- Private CI without external runtime requirement: **PASS_WITH_PENDING**.

## Runtime pending

- real Vitest package/runtime;
- PostgreSQL/PostGIS runtime + cross-tenant adversarial execution;
- service-worker runtime in a browser environment allowed to navigate localhost/file URLs.

These remain pending rather than being represented as PASS.

## Human gate

D10 Human Product Approval: **PENDING**.

The crop-cycle workspace must not be declared the canonical Product Approved interface or merged as such until explicitly approved by a human.
