# AGROWAY v0.21.0-alpha1 — FIELD_HOME validation

Status: **READY_FOR_PRODUCT_APPROVAL**

## Passed

- Field-specific structural guardrail: **14/14 PASS**.
- Chromium browser QA: **17/17 PASS**.
- Viewports: **1440×900** and **390×844**.
- No horizontal overflow.
- No browser console errors in inline-render QA.
- Mobile 48×48 primary capture target.
- Keyboard focus present.
- Task completion mutation: PASS.
- Local offline queue creation: PASS.
- Local activity capture: PASS.
- Copilot evidence dialog + DRAFT_SUGGESTION boundary: PASS.
- Raw provider payload boundary visible in UI: PASS.
- `prefers-reduced-motion`: PASS.
- `transition: all`: absent.
- generic gradient anti-pattern: absent.
- root TypeScript strict: PASS.
- PostgreSQL structural lint: **102/102 PASS**.
- existing spec compatibility suite: **23/23 PASS**.
- design governance gate: PASS.

## Browser QA limitation

The runtime administrator policy blocks Chromium navigation to localhost and file URLs. Browser QA therefore uses a real Chromium executable with Playwright `set_content()` (`PLAYWRIGHT_INLINE_RENDER`). Local storage is replaced only inside that QA harness because opaque inline documents cannot access browser `localStorage`.

The production application retains native `localStorage` and service-worker code. Service-worker runtime remains pending a navigable browser environment; its shell cache contract passes static validation.

## Human gate

D10 Human Product Approval: **PENDING**.

The interface must not be labeled Product Approved or made the canonical visual baseline until a human explicitly approves it.
