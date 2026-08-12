# GREENATICS CONTROL v0.22.0-alpha1 — Control Tower Home

Status: **READY_FOR_PRODUCT_APPROVAL**

## Direction

Control Tower is a **network decision workbench**, not a generic KPI-card dashboard.

Reading order:

`network context → deterministic exceptions → capital/projects → agronomy → operations → supply/demand → impact/traceability → recent activity`

## Local validation

- static Control guardrail: **26/26 PASS**;
- native Chromium QA: **29/29 PASS**;
- desktop 1440×900: PASS;
- mobile 390×844: PASS;
- horizontal overflow: 0;
- browser console/page errors: 0;
- project filter: PASS;
- exception/evidence dialog: PASS;
- local review persistence: PASS;
- local review invariants: `localOnly=true`, `canonicalMutated=false`;
- Agrónomo Virtual: `DRAFT_SUGGESTION` only;
- Copilot has no close-alert / execute-irrigation / purchase / disburse / certify action;
- PWA manifest + Service Worker: PASS;
- root offline `npm ci`: PASS;
- root strict TypeScript: PASS;
- existing PostgreSQL/Vitest/FIELD runtime foundation remains unchanged.

## CI gate

The stacked PR has an independent CONTROL workflow that repeats:

1. root offline workspace install;
2. root strict TypeScript;
3. Control static guardrail;
4. executable JS syntax;
5. Playwright 1.57.0 / Chromium native browser QA at 1440×900 and 390×844;
6. evidence upload.

A green workflow means **ready for human product review**, not Product Approved.

## Trust boundary

The surface is `DEMO_RECONSTRUCTED`. Deterministic exceptions are representative of canonical Control Tower behavior but are not live production facts. Raw provider payloads are not exposed. Local review never mutates canonical state. AI remains advisory-only.

The scoped `conic-gradient` is permitted only for the agronomy-health data ring. Generic decorative gradients remain disallowed.

## Human gate

D10 Human Product Approval: **PENDING**.

Do not merge or establish GREENATICS CONTROL v0.22-alpha1 as the canonical product direction until explicit human approval.
