# SANA Capital Architecture v1

Status: `STRATEGIC_CANON_DRAFT`

Owner boundary: SANA product / AGROWAY platform / Capital & Markets / Impact & Trust.

This document defines the target product architecture for connecting productive agricultural projects with capital while preserving technical, financial, agronomic, regulatory and data-governance boundaries.

## 1. Strategic thesis

SANA seeks to make agricultural production more understandable, traceable, governable and therefore more financeable.

The product thesis is not that SANA removes agricultural or investment risk. It is that SANA can reduce information asymmetry by preserving the relationship between:

`capital → budget → productive decision → agricultural execution → evidence → harvest → sale → settlement → outcome`.

The long-term flywheel is:

`finance → cultivate → trace → commercialize → measure → regenerate → learn → reinvest`.

SANA Capital is therefore an agricultural capital-intelligence and monitoring layer, not by default a regulated investment marketplace, broker, fund manager, lender or guarantor.

## 2. Existing AGROWAY foundations

The reconstructed AGROWAY development baseline already preserves documented capabilities relevant to this architecture:

- finance ledger;
- harvest and settlement;
- Impact & Circularity Ledger;
- Traceability Passport;
- ProductManifest / ProductVersion / SKU governance;
- AGROWAY Invest + Control Tower as the modern mapping for historical investment / market access;
- domain-integrity hardening for investment tenant/project/currency/budget relationships.

These are reusable foundations. They are **not** evidence that a production-ready investment product, regulated capital marketplace or real financed pilot already exists.

## 3. Operating principles

1. **Producer dignity** — producers are productive counterparties, not passive beneficiaries.
2. **Evidence before claims** — investment, impact and agronomic statements retain provenance and uncertainty.
3. **Capital authority ≠ agronomic authority** — a funder cannot override technical safety or agronomic approval.
4. **AI authority ≠ human authority** — AI may analyze/draft; it does not approve investment, credit, disbursement, technical treatment or irreversible actions.
5. **SANA monitoring ≠ financial guarantee** — traceability and accompaniment improve visibility but do not guarantee return or repayment.
6. **Partner-led regulated activity** — where financing/intermediation is regulated, SANA integrates with the appropriate authorized party rather than silently assuming that role.
7. **No hidden cross-tenant learning** — private project/investor/producer data remains tenant-scoped; aggregation requires explicit governance and de-identification.
8. **No impact washing** — social/environmental outcomes are separate from financial performance and require their own evidence/methodology.
9. **No mission drift by capital** — financial pressure cannot override product integrity, producer rights, agronomy, environmental exclusions or truthful reporting.
10. **Outcome-linked learning** — every financed cycle should improve the future ability to evaluate productive execution and risk.

## 4. Core actors

### Producer / Productive Organization

Owns or operates the productive activity. Contributes land/access, labor, knowledge, execution capability and operational risk.

### SANA

Provides diagnosis, project structuring support, technical/operational accompaniment, data architecture, monitoring, evidence, impact measurement and product intelligence.

### AGROWAY

Provides the canonical digital operating record: producer, farm, lot, cycle, plan, tasks, applications, inventory, costs, evidence, harvest, sales/settlement and traceability lineage.

### Capital Partner

Authorized / contractually responsible party for activities that SANA should not perform by default, such as regulated fundraising/intermediation, investor onboarding, KYC/AML, custody/segregation, issuance, lending or investment-account administration when applicable.

### Funder / Investor

Provides capital under the instrument and legal structure defined by the capital partner / transaction documentation.

### Buyer / Offtaker

Provides demand visibility, purchase intent, contract/offtake or commercialization pathway.

### Technical Reviewer

Human authority for sensitive agronomic decisions.

### Impact Reviewer

Human/methodology authority for published impact claims.

### Auditor / External Reviewer

Scoped read access to authorized evidence and reports.

## 5. Unit of financing: Productive Investment Project

The financing unit should be a specific productive project, not an abstract person or generic farm account.

Conceptual object:

```text
ProductiveInvestmentProject
├── tenantId
├── producerId
├── farms[]
├── lots[]
├── cropCycles[]
├── crop / variety / context signature
├── productionPlanVersion
├── capitalNeed
├── currency
├── fundingStructure
├── approvedBudgetVersion
├── milestones[]
├── commitments[]
├── deployments[]
├── useOfFunds[]
├── productiveRisks[]
├── buyers / offtake[]
├── expectedProduction
├── harvests[]
├── sales[]
├── settlements[]
├── recoveries[]
├── impactPlan
├── evidenceCoverage
└── closure / learnings
```

All money-bearing objects must be bound to the same tenant/project/currency and the exact approved budget/version where required.

## 6. Project lifecycle

```text
DISCOVERED
→ SCREENING
→ DIAGNOSTIC_ACTIVE
→ DILIGENCE
→ SANA_READY
→ CAPITAL_READY
→ INVESTMENT_READY
→ FUNDING_OPEN      [only if the legal/partner model permits]
→ FUNDED
→ ACTIVE
→ MILESTONE_REVIEW
→ HARVESTING
→ COMMERCIALIZING
→ SETTLING
→ CLOSED
→ LEARNING
```

Alternate terminal states:

`REJECTED`, `WITHDRAWN`, `CANCELLED`, `DEFAULTED/IMPAIRED` (financial structure dependent), `TECHNICALLY_SUSPENDED`.

No state transition may erase the previous state or its evidence.

## 7. Eligibility model

A project cannot become `INVESTMENT_READY` based only on social desirability or projected return.

### G1 Productive actor

Identity, operating responsibility, experience and required permissions/documentation.

### G2 Productive asset

Farm/lots are identifiable, scoped and traceable.

### G3 Agronomic viability

Crop/context/plan has a defensible technical basis and known limitations.

### G4 Budget viability

Versioned budget, funding need, use-of-funds and contingency logic exist.

### G5 Market pathway

Buyer, market channel, off-take signal or credible commercialization strategy exists.

### G6 Risk visibility

Material agronomic, climatic, operating, financial, market, logistics and regulatory risks are identified.

### G7 Traceability readiness

AGROWAY can capture the minimum required operational evidence.

### G8 Impact hypothesis

Intended social/environmental outcomes are explicit and not represented as achieved.

### G9 Financial-structure fit

The proposed transaction can be implemented under the selected partner/instrument and legal framework.

Failure of a critical gate blocks investment-readiness.

## 8. Productive Risk Profile

The first product should be an explainable profile, **not** a black-box credit score.

Dimensions may include:

- productive management maturity;
- information coverage;
- traceability quality;
- execution history;
- agronomic state and uncertainty;
- productive/cost history;
- market visibility;
- buyer concentration;
- climatic exposure;
- operating dependencies;
- capital-use history;
- incident/outcome history.

Every dimension stores:

`state + evidence + confidence + date + scope + method/version`.

Output example:

```text
Management maturity      MANAGED / confidence high
Data coverage            78%
Traceability              STRONG
Agronomic risk            ELEVATED / confidence medium
Market visibility         MODERATE
Capital-use history       INSUFFICIENT_HISTORY
```

Do not collapse these into a single consumer-facing score until sufficient validated data, methodology and governance exist.

## 9. Capital ledger architecture

### Budget

Defines the approved allocation plan.

```text
BudgetVersion
├── projectId
├── currency
├── status
├── lines[]
├── contingency
├── approvedBy
├── approvedAt
└── supersedes
```

### Commitment

Represents capital committed to the exact project/currency.

### Deployment / Disbursement evidence

Represents capital made available under the financial structure. SANA may record/receive evidence of deployment without necessarily being the legal disbursing party.

### Use of Funds

Links deployed capital to productive expenditure and, when possible, to inventory/activity/evidence.

Target lineage:

`Commitment → Deployment → Purchase/Expense → Inventory/Service → Activity/Application → Lot/Cycle → Evidence`.

### Recovery / Repayment / Distribution

Represents the financial outcome defined by the instrument. It must not be inferred from a sale unless the settlement logic explicitly supports it.

## 10. Milestone financing

A milestone can govern whether a capital partner may consider a subsequent deployment.

Conceptual object:

```text
FundingMilestone
├── projectId
├── type
├── targetDate
├── conditions[]
├── requiredEvidence[]
├── productiveStateRequirements[]
├── budgetStateRequirements[]
├── status
├── reviewedBy
├── reviewedAt
└── decisionReference
```

Status:

`PLANNED → EVIDENCE_PENDING → REVIEW_REQUIRED → SATISFIED / NOT_SATISFIED / WAIVED_BY_AUTHORITY`.

AI may prepare a milestone evidence summary. It may not release capital.

## 11. Producer journey

```text
invitation / discovery
→ diagnostic
→ productive baseline
→ project and budget construction
→ eligibility gaps
→ capital-ready preparation
→ funding structure / partner handoff
→ onboarding into funded cycle
→ simple field execution
→ evidence capture
→ milestone reviews
→ harvest / sale
→ settlement
→ project closure
→ productive history / next-cycle readiness
```

The producer UX remains operationally simple. The producer should not be forced to manually produce investor reporting if the same information can be generated from canonical field events.

## 12. Investor / funder journey

```text
mandate/profile
→ eligible project universe
→ project detail
→ risk/evidence view
→ legal/financial partner journey
→ funded position
→ portfolio monitoring
→ exception/risk updates
→ milestone evidence
→ harvest/commercialization
→ settlement/recovery
→ impact report
→ reinvestment / new project
```

Investor-facing UI must separate:

- facts vs forecasts;
- measured vs calculated vs estimated vs reported;
- expected return vs realized return;
- operational progress vs financial performance;
- impact hypothesis vs verified impact.

## 13. Capital Passport

A Capital Passport is a governed projection, not a duplicate database.

Potential sections:

1. project identity;
2. producer / organization (subject to consent/privacy);
3. farms/lots/cycles;
4. capital structure summary;
5. approved use-of-funds;
6. milestone status;
7. operational execution;
8. evidence coverage;
9. production / harvest;
10. commercialization;
11. financial settlement where authorized;
12. impact metrics;
13. risks/incidents;
14. methodology/provenance;
15. version / publication status.

Visibility:

`PRIVATE`, `PARTNER`, `INVESTOR`, `AUDITOR`, `PUBLIC_SUMMARY`.

Public access is never the default.

## 14. Buyer / Offtake layer

Conceptual objects:

```text
BuyerIntent
OfftakeAgreement
PurchaseOrder
QualityRequirement
DeliveryWindow
PriceMechanism
Delivery
Settlement
```

The existence of a buyer improves market visibility but must not be represented as guaranteed demand unless a legally binding agreement supports that statement.

## 15. Control Tower / Portfolio view

The Control Tower becomes the portfolio-level monitoring surface.

Primary dimensions:

- capital committed / deployed / recovered;
- projects by stage;
- geography;
- crop;
- producer type;
- vintage/cycle;
- buyer/offtaker exposure;
- execution health;
- evidence coverage;
- productive risks;
- market risks;
- expected vs realized production;
- expected vs realized financial outcomes;
- social/environmental impact metrics;
- unresolved incidents.

Portfolio aggregation must reject cross-currency arithmetic unless explicitly normalized under an approved FX policy and calculation record.

No JavaScript-safe-integer overflow or lossy money representation is permitted for financial totals.

## 16. Impact integration

Each project has an explicit `ImpactPlan` before claims are made.

### Social domains

- productive capital access;
- repeat financing / capital mobility;
- productive income / margin where measurable;
- technical capability / management maturity;
- market access;
- productive-history creation;
- inclusion dimensions when contractually and ethically appropriate.

### Environmental domains

- soil variables;
- nutrient/input efficiency;
- water where measurable;
- circular material flows;
- biodiversity where methodology exists;
- carbon only with a defensible boundary/methodology.

Financial performance and impact performance remain distinct ledgers/views.

## 17. Circularity and Greenatics/Wondergreen

SANA may link productive projects to circular resource flows:

`organic residue → Greenatics transformation → product/bioinput → farm/lot application → agronomic outcome`.

The technical recommendation layer remains neutral:

`technical need → intervention strategy → compatible product → SKU → application → outcome`.

Commercial relationships with Greenatics/Wondergreen must be disclosed where relevant. SANA must be able to recommend alternatives when technically superior.

## 18. Authority separation

### Agronomic authority

Technical Lead / approved agronomic role.

### Capital authority

Capital partner / contractually designated financial authority.

### Product/data authority

Tenant-scoped authorized users and SANA operational roles.

### Impact-claim authority

Impact reviewer / authorized publisher.

### AI authority

Advisory only.

Invariant:

`CAPITAL_AUTHORITY != AGRONOMIC_AUTHORITY != AI_AUTHORITY`.

No funding condition may force a prohibited or technically unsafe agronomic intervention.

## 19. Permissions

Illustrative permission families:

```text
capital.project.view
capital.project.manage
capital.budget.draft
capital.budget.approve
capital.commitment.view
capital.commitment.record
capital.deployment.view
capital.milestone.review
capital.portfolio.view
capital.passport.share
capital.financial-outcome.view
capital.risk.review
impact.claim.review
```

Permissions are always tenant/project scoped and do not weaken existing RLS/domain boundaries.

## 20. Data/privacy boundaries

Separate:

- Producer Private Data;
- Investor Private Data;
- Financial Partner Restricted Data;
- Project Shared Data;
- Aggregated/De-identified Portfolio Data;
- Public Passport Data.

SANA does not expose one investor's or producer's identifiable information to another tenant without explicit authorization.

Producer storytelling requires consent and cannot be a condition for technical service unless explicitly agreed.

## 21. Audit requirements

Critical events must be auditable:

- eligibility decisions;
- budget approvals/version changes;
- commitments;
- milestone reviews;
- deployment evidence;
- use-of-funds corrections;
- risk state changes;
- investor/public disclosures;
- settlement/recovery records;
- impact claims;
- model/AI outputs used in decision support.

Critical records should be corrected by amendment/supersession, not silent overwrite.

## 22. Claims and language boundaries

Prohibited unless separately substantiated:

- “guaranteed return”;
- “SANA guarantees the investment”;
- “risk-free agriculture”;
- “carbon neutral / closes the carbon cycle” without a valid methodology;
- “verified impact” when only projected;
- “credit score” before validated risk-model governance;
- “regulated investment platform” unless that status is actually obtained.

Preferred language:

- “traceable productive project”;
- “monitored with AGROWAY”;
- “evidence coverage”;
- “productive risk profile”;
- “expected / realized”;
- “partner-led financing”;
- “impact hypothesis / measured impact”.

## 23. Business model hypotheses

SANA may eventually monetize:

- productive diagnosis / project readiness;
- implementation/setup;
- AGROWAY license;
- monitoring fee;
- technical accompaniment;
- Impact reporting;
- portfolio / Control Tower subscription;
- API / Enterprise integration;
- project structuring/origination fees when legally and contractually appropriate;
- data/reporting services for institutional capital partners.

Do not depend on charging the full software/service cost to the small producer. Funder, buyer, development-program or institutional budgets may finance the digital/technical infrastructure when they receive material monitoring value.

## 24. Pilot architecture

Do not begin with public micro-crowdfunding.

Recommended first pilot:

- 5–10 producers maximum;
- one or two crop contexts;
- concentrated geography;
- known technical partner/team;
- identifiable buyer/market pathway;
- real capital need;
- capital from one or a small number of sophisticated/partner actors;
- financial/legal structure reviewed before funds move;
- AGROWAY full-cycle traceability;
- explicit success and failure criteria.

### Pilot questions

1. Can SANA correctly determine readiness gaps before capital is deployed?
2. Can the project preserve budget → use-of-funds → activity evidence lineage?
3. Does milestone evidence reduce manual monitoring effort?
4. Does the funder report lower information uncertainty?
5. Can the producer operate AGROWAY without excessive reporting burden?
6. Can we close harvest → sale → settlement deterministically?
7. Can we distinguish projected vs realized impact without claim inflation?
8. What is the true SANA delivery cost per financed project?
9. What causes delay/default/underperformance?
10. Does a successful cycle improve next-cycle capital readiness?

## 25. Metrics

### Capital

- capital requested;
- capital approved/committed;
- capital deployed;
- capital recovered/recycled;
- deployment by milestone;
- average project ticket;
- time to capital readiness;
- time from commitment to productive deployment.

### Product / traceability

- funded active crop cycles;
- evidence coverage;
- % use-of-funds linked to canonical productive records;
- milestone evidence completeness;
- full-cycle closure rate;
- unknown resolution rate.

### Producer

- repeat financing eligibility;
- productive-history depth;
- management maturity change;
- market access / repeat buyer where measurable.

### Financial

- realized outcomes by instrument (partner data permitting);
- impairment/default/delay classification;
- portfolio concentration;
- monitoring cost/project.

### Impact

- impact metrics with valid baselines;
- claim verification rate;
- circular material traced;
- social/economic outcomes with evidence.

North-star candidates for the mature capital layer:

`VERIFIED_PRODUCTIVE_CAPITAL_DEPLOYED`

and later:

`VERIFIED_PRODUCTIVE_CAPITAL_RECYCLED`.

## 26. Delivery roadmap

### CAPITAL-0 — Canon & integrity

- this architecture;
- verify existing Invest / Control Tower domain against it;
- preserve tenant/project/currency/budget invariants;
- no public product launch.

### CAPITAL-1 — Project readiness

- ProductiveInvestmentProject;
- eligibility/readiness workflow;
- Productive Risk Profile;
- budget/version linkage;
- buyer/offtake evidence;
- internal SANA capital-readiness view.

### CAPITAL-2 — Monitored financed pilot

- commitments / deployment evidence;
- milestone evidence;
- use-of-funds lineage;
- producer + funder scoped views;
- Capital Passport private;
- harvest/sale/settlement closure.

### CAPITAL-3 — Institutional Control Tower

- portfolio aggregation;
- concentration/exposure;
- risk/exception management;
- portfolio impact;
- reporting/API;
- financial-partner integration.

### CAPITAL-4 — Partner marketplace / microinvestment experience

Only after legal/regulatory architecture, partner agreement, pilot evidence and operational readiness.

Potential capabilities:

- project discovery;
- investor mandate matching;
- partner handoff/onboarding;
- investment-position views;
- recurring/reinvestment flows.

### CAPITAL-5 — Advanced risk / blended finance

- validated risk models;
- comparable historical cohorts;
- blended-finance structures;
- first-loss / catalytic support metadata;
- external insurer/lender/fintech integrations.

## 27. Priority boundary

SANA Capital is strategically important but must not displace the current product gates for:

1. core agricultural operation;
2. field usability;
3. offline/deferred sync;
4. traceability replay;
5. harvest → economics → closure;
6. real design-partner validation.

Capital implementation moves forward when it reuses those capabilities or when a real financed pilot creates a concrete requirement.

## 28. Product truth statement

The long-term SANA proposition is:

> SANA makes visible what is usually invisible in agricultural finance: who produces, how capital is used, what is executed in the field, what is harvested, what is sold, what risks appeared, what impact can be proven and what the next cycle should learn.

The trust contract is:

> **What do we know? What is its source? What is uncertain? Who reviewed it? What action followed? What result occurred?**
