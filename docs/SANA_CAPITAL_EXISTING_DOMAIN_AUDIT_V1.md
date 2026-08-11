# SANA Capital — Existing AGROWAY Domain Audit v1

Status: `EVIDENCE_BASED_PRELIMINARY_AUDIT`

Parent canon: `docs/SANA_CAPITAL_ARCHITECTURE_V1.md`.

Linked issue: `#7`.

## 1. Purpose

Audit the reconstructed AGROWAY foundations against the SANA Capital v1 target architecture without confusing historical intent, reconstructed development evidence, focal runtime checks and production-ready capability.

This audit answers four questions:

1. What useful capital/investment infrastructure already exists and should be preserved?
2. What exists only partially or with older semantics?
3. What is genuinely missing for a monitored financed pilot?
4. What must remain future work rather than displacing the agricultural FIELD/core roadmap?

## 2. Evidence boundary

The current Git `main` is primarily a control repository containing locks, runbooks, reconstruction evidence and product-governance documents. It does **not** expose the complete 41-workspace reconstructed source tree as normal browsable source on `main`.

Current documented reconstructed baseline:

- 41 workspaces;
- 218 conceptual Domain Events;
- 28 delivered PostgreSQL migrations;
- finance ledger;
- harvest + settlement;
- Impact & Circularity Ledger;
- Traceability Passport;
- AGROWAY Invest + Control Tower;
- focal Invest/Pilot/Replay runtime reported as 13/13 PASS in rc4;
- TypeScript/guardrail/structural checks reported green in the current reconstructed baseline.

Current unresolved runtime boundary:

- real Vitest runtime;
- PostgreSQL/PostGIS migrations 0001–0022 runtime;
- adversarial cross-tenant RLS execution;
- Vite/Expo production builds;
- Graphify real regeneration;
- real agricultural pilot certification.

Therefore this document is an **evidence-based domain audit**, not an exhaustive source-code certification.

## 3. Classification

- `EXISTS_DOCUMENTED` — explicitly preserved in reconstructed/historical evidence, but not promoted to production runtime proof.
- `EXISTS_FOCAL_RUNTIME` — explicit focal reconstructed runtime evidence exists.
- `PARTIAL` — useful foundation exists but does not yet satisfy SANA Capital v1 semantics.
- `MISSING` — no sufficient evidence of an equivalent capability.
- `WRONG_SEMANTICS` — implementation may exist but should not be reused without semantic correction.
- `FUTURE` — intentionally not required for the first financed pilot.
- `SOURCE_AUDIT_REQUIRED` — documentary evidence exists but the inspectable materialized source/runtime is required before making a stronger statement.

## 4. Executive result

The existing AGROWAY investment domain is **not a blank slate**.

The strongest reusable foundation is the combination of:

`tenant/project integrity + commitments/deployments/recoveries + currency integrity + approved budget linkage + finance ledger + harvest/settlement + impact/circularity + passport + Control Tower concepts`.

The largest gaps are not basic accounting objects. They are the new product semantics required to turn those components into a trustworthy capital-access system for producers:

- Productive Investment Project as the explicit financing unit;
- readiness/eligibility workflow;
- explainable Productive Risk Profile;
- capital milestone evidence;
- direct use-of-funds → productive execution/evidence lineage;
- partner-regulated boundary and handoff;
- capital-specific Passport semantics;
- producer/investor role/privacy model;
- social-impact and productive-history layer;
- explicit authority separation between capital, agronomy, impact and AI.

Conclusion:

> Reuse the existing financial/investment integrity substrate. Do not rebuild it. Add a new SANA Capital product layer that binds it to the agricultural operating graph.

## 5. Capability matrix

| Target capability | Status | Current evidence | Gap / action |
|---|---|---|---|
| Product / project tenant scope | `EXISTS_FOCAL_RUNTIME` | v0.20.2 hardening binds investment commands to exact tenant/project scope | Preserve; rerun in real PostgreSQL/RLS runtime |
| Commitment same-project rule | `EXISTS_FOCAL_RUNTIME` | deployments can only use commitments from same tenant/project | Preserve as hard invariant |
| Project/commitment/deployment/recovery currency integrity | `EXISTS_FOCAL_RUNTIME` | relational binding explicitly documented | Preserve; add approved FX normalization only for portfolio reporting |
| Approved budget version linked to project | `EXISTS_FOCAL_RUNTIME` | exact project budget version existence enforced | Preserve; expand into SANA BudgetVersion semantics |
| Portfolio money overflow protection | `EXISTS_FOCAL_RUNTIME` | JS safe-integer overflow rejection documented | Preserve; verify money representation end-to-end |
| Finance ledger | `EXISTS_DOCUMENTED` | reconstructed v0.15R-full baseline | Source-audit ledger semantics before extending |
| Investment domain / AGROWAY Invest | `EXISTS_DOCUMENTED` | historical investment/market access maps to v0.18 Invest | Treat as reusable infrastructure, not current product proof |
| Control Tower | `EXISTS_DOCUMENTED` | historical map and reconstructed architecture | Audit projections/aggregations against institutional portfolio target |
| Commitment object | `EXISTS_FOCAL_RUNTIME` | hardening explicitly refers to commitments | Inspect source/events and preserve canonical naming if sound |
| Deployment object | `EXISTS_FOCAL_RUNTIME` | hardening explicitly refers to deployments | Reframe as deployment/disbursement evidence where SANA is not legal disbursing party |
| Recovery object | `EXISTS_FOCAL_RUNTIME` | currency relationship explicitly includes recovery | Inspect semantics: recovery vs repayment vs distribution |
| Budget object/version | `EXISTS_FOCAL_RUNTIME` | project/budget/version invariants documented | Extend with lines, contingencies, approval/supersession metadata if absent |
| ProductiveInvestmentProject | `PARTIAL` | generic investment project foundation exists | Add explicit producer/farm/lot/cycle/plan/market/impact bindings |
| Project readiness lifecycle | `MISSING` | no evidence of DISCOVERED→SANA_READY→CAPITAL_READY→INVESTMENT_READY semantics | CAPITAL-1 |
| Eligibility gates G1–G9 | `MISSING` | no explicit evidence | CAPITAL-1 |
| Productive Risk Profile | `MISSING` | no explicit explainable multidimensional profile | CAPITAL-1; no black-box score |
| Producer productive-history profile | `PARTIAL` | crop-cycle, finance, harvest and traceability foundations exist | Add longitudinal financed-cycle projection |
| Investor/funder identity/role | `PARTIAL` | investment domain implied; exact RBAC semantics not evidenced | Source audit + role/scoped-view design |
| Capital Partner role | `MISSING` | no explicit regulated-partner boundary evidenced | Add partner role + handoff integration contract |
| KYC/AML | `FUTURE` | should be partner-led, not silently rebuilt in SANA | Integrate external partner when pilot requires it |
| Public crowdfunding marketplace | `FUTURE` | intentionally excluded | CAPITAL-4 only after legal/partner/pilot proof |
| Investor mandate matching | `FUTURE` | no current requirement for first pilot | CAPITAL-4/5 |
| Buyer/commercialization base | `EXISTS_DOCUMENTED` | commercialization/market linkage + harvest/settlement preserved historically | Reuse; inspect buyer/order/sale object semantics |
| Offtake Agreement | `PARTIAL` | commercialization does not prove formal offtake semantics | Add BuyerIntent/OfftakeAgreement when real transaction needs it |
| Harvest | `EXISTS_DOCUMENTED` | reconstructed baseline explicitly preserves harvest | Reuse and runtime-certify |
| Sale / commercialization | `EXISTS_DOCUMENTED` | historical capability and baseline commerce flow | Reuse; bind to financed project |
| Settlement | `EXISTS_DOCUMENTED` | reconstructed baseline explicitly preserves settlement | Inspect exact financial semantics |
| Recovery / repayment / distribution | `PARTIAL` | recovery object evidenced, settlement exists | Do not infer repayment from sale; model instrument-specific outcome |
| Impact & Circularity Ledger | `EXISTS_DOCUMENTED` | reconstructed baseline explicit | Reuse; bind metrics to ProductiveInvestmentProject/ImpactPlan |
| Social-impact metrics | `MISSING` | existing impact foundation does not prove capital-access/social mobility semantics | Add productive capital access, maturity, productive-history, repeat-finance metrics |
| Carbon methodology governance | `PARTIAL` | Impact foundation exists | Keep carbon gated by methodology/baseline/uncertainty |
| Traceability Passport | `EXISTS_DOCUMENTED` | reconstructed baseline explicit | Reuse projection engine; create Capital Passport view rather than duplicate DB |
| Capital Passport | `PARTIAL` | Passport substrate exists | Add capital/budget/milestones/risk/financial-outcome visibility scopes |
| Evidence/provenance | `EXISTS_DOCUMENTED` | field/certification architecture strongly provenance-oriented | Bind capital use/milestones to evidence IDs/digests |
| Use-of-funds → expense | `PARTIAL` | finance ledger + budget/deployment exist | Source audit required |
| Expense → inventory/service | `PARTIAL` | inventory/supply + finance exist independently | Add/verify relational lineage |
| Inventory/service → activity/application | `PARTIAL` | FIELD alpha4 explicitly links inventory lot→task→cycle→operator→evidence locally | Canonical backend linkage/runtime still pending |
| End-to-end use-of-funds → field evidence | `MISSING` | no evidence of a canonical complete chain | P0 for financed pilot |
| Funding milestones | `MISSING` | no evidenced capital milestone object | CAPITAL-2 |
| Milestone evidence review | `MISSING` | generic evidence/certification exists, not financing semantics | Add FundingMilestone + human capital authority |
| Capital authority | `PARTIAL` | investment commands exist but product authority separation not evidenced | Add explicit CapitalAuthority policy |
| Agronomic authority | `EXISTS_DOCUMENTED` | deterministic agronomy + human review boundaries established | Preserve; funder must not override |
| AI cannot approve/release capital | `PARTIAL` | Copilot is advisory globally | Add capital-specific no-approve/no-disburse invariant/tests |
| Impact claim authority | `PARTIAL` | impact/governance foundations exist conceptually | Add explicit capital-publication review |
| Capital audit trail | `PARTIAL` | general audit/provenance orientation exists | Ensure eligibility, budget approval, milestone review, disclosure, recovery are auditable |
| Producer private-data boundary | `PARTIAL` | multi-tenant/RBAC/data portability foundations exist | Add capital-sharing scopes/consent model |
| Investor private-data boundary | `SOURCE_AUDIT_REQUIRED` | no explicit current evidence | Add explicit data classification and scoped views |
| Public project disclosure scope | `MISSING` | Passport supports projection concept, but capital sharing policy new | Add PRIVATE/PARTNER/INVESTOR/AUDITOR/PUBLIC_SUMMARY |
| Portfolio aggregation by crop/geography/vintage | `PARTIAL` | Control Tower exists conceptually | Audit query model and add exposure dimensions |
| Cross-currency portfolio aggregation | `PARTIAL` | unsafe direct aggregation already blocked | Add versioned FX policy/calculation record when needed |
| Portfolio concentration / exposure | `MISSING` | no explicit evidence | CAPITAL-3 |
| Expected vs realized production | `PARTIAL` | forecast + harvest foundations documented | Bind to financed project, preserve forecast status |
| Expected vs realized financial outcome | `PARTIAL` | finance/settlement foundations exist | Add explicit forecast vs realized status and instrument semantics |
| Financed-project incidents / impairment | `MISSING` | agricultural incident domain exists; investment impairment semantics not evidenced | CAPITAL-2/3 |
| Reinvestment / recycled capital | `PARTIAL` | recovery foundation exists | Add next-cycle linkage only after real settlement evidence |
| Blended finance metadata | `FUTURE` | not first-pilot requirement | CAPITAL-5 |
| Insurer/lender/fintech adapters | `FUTURE` | no need now | CAPITAL-5 |

## 6. What should be reused

The following should be treated as **preservation targets**, not redesign-from-zero targets:

### 6.1 Investment integrity core

Preserve:

- tenant/project command binding;
- commitment→deployment same-project constraint;
- project/commitment/deployment/recovery/budget currency constraints;
- exact approved budget version relationship;
- safe portfolio money aggregation.

These are strong foundations for SANA Capital and should remain lower-level invariants beneath the new product vocabulary.

### 6.2 Finance ledger

Do not replace with a second SANA Capital ledger unless the existing semantics are fundamentally incompatible.

Preferred model:

`existing finance ledger` = canonical financial operational substrate

`SANA Capital` = project/readiness/monitoring/projection layer.

### 6.3 Harvest / commercialization / settlement

These are essential because SANA Capital must close the productive and financial loops from actual outcomes, not create a disconnected fintech island.

### 6.4 Traceability Passport

Capital Passport should be implemented as a governed projection over existing canonical records, not as a duplicated parallel data store.

### 6.5 Impact & Circularity

Reuse the existing Impact/Circularity Ledger and add capital-project linkage plus social-capital-access metrics.

### 6.6 FIELD evidence chain

The v0.21 FIELD product work is strategically important to Capital:

- task context;
- evidence IDs/SHA;
- inventory batch/SKU;
- activity/application;
- crop cycle;
- operator;
- local/canonical trust distinction.

This is the future last mile of capital assurance. Capital work should depend on this field layer rather than create a separate reporting workflow for producers.

## 7. What should not be reused blindly

### 7.1 Historical investor/market semantics

Historical investment intent is evidence of direction, not proof that the old domain model matches the new social-purpose, partner-led and impact-governed thesis.

### 7.2 Generic project concept

If the current Invest `Project` is only a financial container, do not rename it and pretend it is a `ProductiveInvestmentProject`.

The SANA object must bind productive reality explicitly.

### 7.3 Generic portfolio totals

Control Tower totals without provenance, currency policy, scope and expected/realized distinction are insufficient for institutional capital.

### 7.4 Existing settlement

Do not assume `sale settled = investor repaid`.

Recovery/repayment/distribution depends on the legal instrument.

## 8. P0 integrity gaps before any financed pilot

The first real financed project must not start until these are closed or explicitly handled outside SANA by contract/partner:

### P0-CAP-01 — Inspectable materialized source

Recover/mount the exact current reconstructed rc6 materialized source for Invest, finance, commerce, Impact, Passport and DB migrations so the documentary audit can become source-level.

### P0-CAP-02 — Real PostgreSQL/PostGIS/RLS execution

Structural SQL checks are insufficient for capital-bearing data.

Required:

- migrations 0001–0022 runtime;
- tenant isolation;
- same-project constraints;
- currency constraints;
- budget version constraints;
- adversarial cross-tenant references.

### P0-CAP-03 — End-to-end use-of-funds lineage

Prove:

`Deployment → Expense/Purchase → Inventory/Service → Activity/Application → CropCycle → Evidence`.

If the full chain does not exist, implement the minimum canonical links before pilot.

### P0-CAP-04 — Authority policy

Implement/test:

`CAPITAL_AUTHORITY != AGRONOMIC_AUTHORITY != AI_AUTHORITY`.

AI cannot approve investment, credit, milestone satisfaction or capital release.

Capital authority cannot force unsafe agronomic action.

### P0-CAP-05 — Partner/legal boundary

Before money moves, record which actor legally performs:

- investor/funder onboarding;
- KYC/AML where applicable;
- custody/segregation;
- lending/issuance/intermediation;
- disbursement;
- repayment/distribution.

SANA records evidence and project state only within its authorized role.

### P0-CAP-06 — Expected vs realized semantics

Every investor-facing financial/productive/impact value must expose status:

`EXPECTED | OBSERVED | MEASURED | CALCULATED | ESTIMATED | REPORTED | REALIZED` as appropriate.

No forecast can silently become a fact.

### P0-CAP-07 — Private sharing scopes

Capital Passport / investor access requires explicit project-scoped authorization and producer privacy controls.

## 9. CAPITAL-1 executable backlog

Do not implement all of SANA Capital. Build only project-readiness capability first.

### C1-01 ProductiveInvestmentProject adapter

Bind existing investment project to:

`producer + farm + lot(s) + cropCycle(s) + productionPlanVersion + budgetVersion + market pathway + ImpactPlan`.

Prefer adapter/composition over destructive migration if the existing project object is broadly used.

### C1-02 Readiness state machine

Add:

`DISCOVERED → SCREENING → DIAGNOSTIC_ACTIVE → DILIGENCE → SANA_READY → CAPITAL_READY → INVESTMENT_READY`.

No funding flow required yet.

### C1-03 Eligibility gates

Implement explicit G1–G9 with evidence/gap status.

### C1-04 Productive Risk Profile

Explainable projection over existing operational data.

No single score.

### C1-05 Budget view

Expose existing approved budget/version integrity in the productive project context.

### C1-06 Market pathway

Capture buyer intent / commercialization pathway without claiming guaranteed demand.

### C1-07 Internal Capital Readiness workspace

SANA internal UI only:

`identity → readiness gaps → productive context → budget → market → risks → evidence coverage → next action`.

No investor marketplace UI.

### C1-08 Capital audit events

Audit readiness decisions, budget approval/version selection and risk review.

## 10. CAPITAL-2 minimum pilot backlog

Only after C1 and core FIELD/full-cycle readiness:

1. commitment projection;
2. deployment evidence;
3. FundingMilestone;
4. human milestone review;
5. canonical use-of-funds linkage;
6. private funder view;
7. private Capital Passport;
8. harvest→sale→settlement→instrument outcome adapter;
9. project close + learning;
10. repeat-capital-readiness assessment.

## 11. Required source-level audit when the materialized tree is available

Search the actual rc6/next materialized source for:

- workspace/package names for Invest and Control Tower;
- investment commands/services;
- project/commitment/deployment/recovery entities;
- domain event names and payloads;
- finance ledger schemas;
- budget/version schemas;
- migrations/FKs/RLS policies;
- Control Tower projection/calculation code;
- money representation;
- harvest/sale/settlement bindings;
- Passport project references;
- Impact/Circularity project references;
- RBAC permissions;
- audit log emission;
- tests and fixtures.

For each current object/event, classify:

`KEEP | ADAPT | SUPERSEDE | DEPRECATE | REJECT`.

Do not create replacement event names until this source audit is complete.

## 12. Event design rule

SANA Capital should not add dozens of events simply because the product vocabulary changed.

First map existing events to target semantics.

Only add a new event when an independently meaningful business fact is missing.

Likely future facts, subject to source audit:

- productive project readiness changed;
- eligibility gate reviewed;
- productive risk profile issued/versioned;
- funding milestone created/reviewed;
- capital deployment evidence recorded;
- use-of-funds linked to productive execution;
- Capital Passport published/revoked;
- financed project closed;
- next-cycle capital readiness assessed.

These are candidate facts, **not approved canonical event names**.

## 13. Product priority conclusion

SANA Capital remains strategically important, but the audit reinforces the earlier priority boundary:

> FIELD execution and full-cycle agricultural closure are dependencies of trustworthy capital monitoring.

Therefore:

- continue FIELD Product Approval work;
- close canonical sync/runtime gates;
- finish harvest→economics→closure;
- in parallel, complete CAPITAL-0 source audit and CAPITAL-1 readiness design;
- do not build public microinvestment yet.

## 14. Final audit statement

Current state:

`REUSABLE INVESTMENT INTEGRITY SUBSTRATE + INCOMPLETE CAPITAL PRODUCT SEMANTICS`.

The correct evolution is:

`preserve financial integrity → bind to productive graph → add readiness/risk/evidence semantics → validate one financed pilot → build institutional portfolio layer → only then consider microinvestment marketplace`.

No current evidence supports describing SANA/AGROWAY as a production-ready investment platform or financial guarantor.
