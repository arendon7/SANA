# SANA Capital Platform Business Model v1

Status: `STRATEGIC_CANON_DRAFT`

Owner boundary: SANA Strategy / Product / Capital & Markets / Agronomy & Knowledge / Impact & Trust / GREENATICS ecosystem.

This document synthesizes the historical AGROWAY/SANA investment-platform and SANA Coin business-model work into the current SANA Capital architecture.

It does **not** replace `SANA_CAPITAL_ARCHITECTURE_V1`, the pilot financial model, the Hass pilot Data Pack, or the partner-selection framework. It adds the missing long-term platform and business-model layer.

The central design decision is:

> SANA should evolve from a productive-intelligence service into a multi-sided agricultural capital platform only after its field, evidence, partner and pilot foundations are real.

The historical thesis remains valuable, but the implementation sequence changes.

---

## 1. What the historical model adds

The historical AGROWAY/SANA work contained a broader ambition than a conventional agricultural SaaS:

- connect third-party capital with real productive agricultural projects;
- finance crops/producers through transparent productive structures;
- use AGROWAY to observe what capital actually enabled in the field;
- connect projects with inputs, technical accompaniment and markets;
- create a repeat loop where a successful cycle improves access to the next cycle;
- make agricultural investment understandable to actors who normally cannot monitor field execution;
- link productive returns with measurable social/environmental outcomes;
- ultimately permit smaller/fractional participation in diversified productive opportunities;
- use the GREENATICS ecosystem to generate, improve and support real projects.

The useful philosophy was:

`capital + real productive project + technology + traceability + sustainability + market + learning`.

The historical implementation also explored token/crypto/DAO/staking/liquidity-pool/blockchain concepts. Those mechanisms are **not** the current product thesis and remain deferred unless a future independent use case justifies them.

---

## 2. Strategic platform thesis

SANA is not merely software and is not merely finance.

The mature platform can connect four economic systems:

```text
PRODUCTIVE PROJECTS / PRODUCERS
            │
            │ productive opportunity
            ↓
          SANA
   project intelligence
   readiness / matching
   monitoring / evidence
            │
     ┌──────┼────────┐
     ↓      ↓        ↓
 CAPITAL   MARKET   KNOWLEDGE / INPUTS
 FUNDERS   BUYERS   TECHNICAL ECOSYSTEM
```

AGROWAY is the operating/evidence layer underneath this network.

The long-term flywheel remains:

```text
FINANCE
  ↓
CULTIVATE
  ↓
TRACE
  ↓
COMMERCIALIZE
  ↓
MEASURE
  ↓
REGENERATE
  ↓
LEARN
  ↓
REINVEST
```

The platform does not become defensible because it has a marketplace page. It becomes defensible when each side receives information and workflow value that is difficult to reproduce without the longitudinal productive record.

---

## 3. Multi-sided platform architecture

### Side A — Productive supply

Actors:

- individual producers;
- agricultural companies;
- associations/cooperatives;
- technical operators;
- GREENATICS-originated projects;
- institutional or territorial programs;
- future approved project originators.

They contribute:

- productive capacity;
- farms/lots/crop cycles;
- operating knowledge;
- labor/execution;
- project opportunity;
- historical and current evidence.

They seek:

- working/productive capital;
- technical assistance;
- market access;
- lower information friction;
- repeat financeability;
- improved productive outcomes.

### Side B — Capital demand for opportunities / funders

Actors may include, according to the legally implemented structure:

- institutional capital;
- impact-oriented capital;
- development/blended-finance actors;
- sophisticated private capital;
- corporate/buyer capital;
- lenders/fintech partners;
- later, potentially, retail/micro participants through an appropriate partner structure.

They contribute:

- committed capital;
- mandate/eligibility criteria;
- risk appetite;
- time horizon;
- reporting requirements.

They seek:

- understandable productive opportunities;
- evidence-backed monitoring;
- clear risk/uncertainty;
- controlled deployment;
- transparent realized outcomes;
- optional impact evidence.

### Side C — Market / buyers / offtakers

Actors:

- exporters;
- processors;
- wholesalers;
- retailers;
- industrial buyers;
- aggregators;
- institutional buyers.

They contribute:

- demand visibility;
- quality specifications;
- price mechanisms;
- purchase history;
- buyer intent/offtake where applicable;
- collections/settlement evidence.

They seek:

- reliable supply;
- production visibility;
- quality/traceability;
- predictable delivery;
- reduced sourcing uncertainty.

### Infrastructure side — SANA / AGROWAY / ecosystem

SANA provides:

- diagnostic/readiness;
- project structuring support;
- matching intelligence;
- monitoring;
- productive risk visibility;
- evidence/reporting;
- Impact;
- Control Tower;
- knowledge/learning.

AGROWAY provides the operational system of record.

GREENATICS/WONDERGREEN may provide technical, circularity and commercial inputs under explicit neutrality/conflict controls.

---

## 4. The economic unit remains the productive project

The historical idea of making agriculture investable should **not** revert to simplistic constructs such as:

- “buy one tree”;
- “invest in one person”;
- an unbounded farm account;
- a token detached from a productive/legal structure.

The canonical economic subject remains:

`ProductiveInvestmentProject`.

It binds:

```text
Producer
→ Farm
→ Lots
→ CropCycles
→ ProductivePlanVersion
→ BudgetVersion
→ CapitalNeed
→ MarketPathway
→ Risks
→ EvidenceRequirements
→ Harvest
→ Sales
→ Settlement
→ Outcome
→ Learning
```

A producer can participate in many projects over time.

A farm can host multiple projects/cycles.

An investor/funder may have exposure to multiple projects.

The project is therefore the atomic unit for readiness, monitoring, evidence and financial reconstruction.

---

## 5. Fractional/microinvestment without corrupting the domain

The long-term platform may support smaller or fractional participation, but SANA should not model the productive project itself as a token.

Instead separate three concepts.

### 5.1 FundingOpportunity

SANA-side discoverable project projection.

```text
FundingOpportunity
├── opportunityId
├── productiveInvestmentProjectId
├── projectVersion
├── capitalNeed
├── currency
├── fundingWindow
├── minimumReadinessState
├── marketPathwayState
├── riskProfileVersion
├── evidenceCoverage
├── impactHypothesis
├── partnerProgramRef
├── visibility
└── publicationState
```

This is information about an opportunity. It is not itself a legal financial instrument.

### 5.2 FundingAllocationIntent

A SANA-side record that a qualified funder is interested in an amount/exposure.

```text
FundingAllocationIntent
├── opportunityId
├── funderMandateId
├── requestedAllocation
├── currency
├── state
├── createdAt
└── partnerHandoffRef
```

Potential states:

`DRAFT → ELIGIBILITY_CHECK → PARTNER_HANDOFF → PARTNER_DECISION_PENDING → ACCEPTED / REJECTED / EXPIRED`.

It does not move money.

### 5.3 InstrumentPositionRef

Reference to the actual position/contract/account/instrument created under the legally selected partner structure.

SANA stores a scoped reference and monitoring metadata only when contractually/data-governance appropriate.

Invariant:

```text
FundingOpportunity
!= financial instrument

FundingAllocationIntent
!= investment execution

InstrumentPositionRef
!= SANA custody
```

This separation allows a future microinvestment UX without forcing AGROWAY to become a wallet, exchange, issuer or custody system.

---

## 6. Investor/funder mandate model

A real platform should not show every project to every capital provider.

Define:

```text
FunderMandate
├── mandateId
├── funder/partner scope
├── eligible crops
├── geography
├── project stage
├── ticket min/max
├── duration preference
├── instrument constraints
├── risk exclusions
├── buyer/offtake requirements
├── evidence minimums
├── impact preferences
├── concentration limits
├── liquidity/settlement constraints
└── validity/version
```

The matching engine compares a `FundingOpportunity` with a `FunderMandate`.

Output:

```text
MATCH
POSSIBLE_WITH_GAPS
NOT_ELIGIBLE
REVIEW_REQUIRED
```

Every match reason is explainable.

AI may rank or summarize candidates but cannot create a financial approval.

---

## 7. Matching engine

Matching should occur in stages.

### M1 Hard eligibility

Reject incompatible project/funder combinations using deterministic policy.

Examples:

- geography exclusion;
- crop exclusion;
- ticket mismatch;
- missing mandatory market evidence;
- inadequate readiness;
- prohibited project state;
- missing partner/legal compatibility.

### M2 Productive fit

Compare:

- crop/context;
- cycle duration;
- productive stage;
- management maturity;
- evidence coverage;
- market visibility;
- known risks.

### M3 Portfolio fit

Avoid concentrating a funder in the same:

- producer;
- farm;
- geography;
- crop;
- buyer;
- harvest window;
- material risk factor.

### M4 Impact fit

Only compare impact preferences against explicit impact plans/baselines.

Projected impact can never be treated as realized impact.

### M5 Human/partner decision

The output is a qualified opportunity set, not an investment recommendation or execution.

---

## 8. From single transaction to relationship capital

The strongest historical idea is not one-time microinvestment. It is **repeat productive history**.

A first successful financed cycle should improve the information available for the next cycle.

```text
Cycle 1
capital + execution + evidence + harvest + sale + settlement
                     ↓
            verified history
                     ↓
Cycle 2 readiness
                     ↓
less unknowns / faster diligence / better matching
```

Potential long-term producer states:

```text
NO_FINANCED_HISTORY
FIRST_PROJECT_READY
FIRST_PROJECT_ACTIVE
FIRST_PROJECT_CLOSED
REPEAT_READY
MULTI_CYCLE_TRACK_RECORD
PORTFOLIO_ELIGIBLE
```

These states are descriptive, not a consumer credit score.

The product objective is:

> create a portable, evidence-backed productive history that makes good producers progressively easier to understand and finance.

---

## 9. Reinvestment loop

The investor/funder side should also become longitudinal.

```text
Mandate
→ Project match
→ Position/commitment via partner
→ Monitoring
→ Harvest/commercialization
→ Settlement/outcome
→ Portfolio learning
→ Reinvestment decision
```

Measure:

- repeat funder rate;
- reinvestment rate;
- average number of cycles funded;
- time from settlement to new allocation;
- mandate expansion/contraction;
- realized outcome by cohort;
- evidence/monitoring satisfaction.

A mature platform creates **relationship capital**, not merely transaction volume.

---

## 10. Buyer/offtake as the third economic side

Historical thinking about marketplace/market access should be upgraded from a generic “marketplace” into an explicit buyer/offtake layer.

Why this matters:

Capital alone does not solve the agricultural project.

The economic loop is stronger when it connects:

```text
CAPITAL
  ↓
PRODUCTION
  ↓
QUALITY / HARVEST
  ↓
BUYER
  ↓
COLLECTION
  ↓
SETTLEMENT
```

The platform can eventually match three mandates simultaneously:

```text
productive project requirements
∩ funder mandate
∩ buyer demand/quality window
```

This creates a stronger system than a two-sided investment marketplace.

---

## 11. Buyer-backed and blended structures

The architecture should remain instrument-independent but support metadata for structures such as:

- buyer advances;
- pre-purchase/prepayment;
- supplier credit;
- institutional productive finance;
- blended capital;
- guarantees/insurance/first-loss support supplied by external parties;
- partner-structured debt or participation mechanisms.

SANA models the productive and evidence relationships.

The legal/financial partner determines the actual instrument, rights, obligations and fund flow.

---

## 12. Historical SANA Coin — what survives

The SANA Coin concept contained several useful ideas beneath its original crypto implementation:

1. capital should circulate through real productive projects;
2. value should be linked to observable activity rather than pure speculation;
3. successful cycles should enable reinvestment;
4. platform participants should be able to see how their capital relates to productive outcomes;
5. impact/circularity should be measurable rather than decorative storytelling.

Those ideas survive.

The following mechanisms do **not** belong in the current core:

- proprietary cryptocurrency;
- DAO governance;
- staking;
- liquidity pools;
- speculative token appreciation;
- blockchain as mandatory system of record;
- tokenizing individual trees/plants as the default financing unit.

Future reconsideration requires a standalone product case answering:

- what user problem cannot be solved with conventional rails?
- what legal/economic right does the digital asset represent?
- who issues/custodies/redeems it?
- what risk does it add?
- why is blockchain materially superior for this use case?

Until then:

`SANA Coin = historical concept / deferred mechanism`, not product roadmap commitment.

---

## 13. Platform trust layer

The platform's core differentiator is the relationship between money and productive reality.

Target lineage:

```text
Capital Commitment
→ Deployment Evidence
→ Purchase / Expense / Labor
→ Inventory / Service
→ Activity / Application
→ Lot / CropCycle
→ Evidence
→ Productive State
→ Harvest
→ Sale
→ Collection
→ Settlement
```

This becomes a **SANA Assurance Layer** in the commercial sense of observability and control.

It must never be described as a legal guarantee unless an actual guarantee instrument/party exists.

---

## 14. Exception-driven capital operations

Reuse GREENATICS CONTROL rather than building a parallel capital-alert engine.

Capital exceptions can be projected from deterministic facts.

Examples:

```text
CAPITAL_READINESS_GAP
MILESTONE_EVIDENCE_MISSING
DEPLOYMENT_WITHOUT_PRODUCTIVE_LINEAGE
BUDGET_VARIANCE
UNAPPROVED_USE_OF_FUNDS
PRODUCTIVE_DELAY
HARVEST_VARIANCE
BUYER_CONCENTRATION_CHANGE
COLLECTION_DELAY
SETTLEMENT_MISMATCH
IMPACT_EVIDENCE_GAP
```

Target flow:

```text
Deterministic capital/productive fact
→ ControlTowerException
→ ExceptionResolutionCase
→ Owner + RootCause + Evidence
→ HUMAN action
→ Resolution / escalation
```

AI remains explanation/summarization/advisory only.

This makes capital monitoring consistent with the operational Control Tower already emerging in the repository.

---

## 15. Project origination network

A scalable platform cannot depend only on SANA staff finding every project.

Potential approved originators:

- GREENATICS field network;
- agronomists;
- technical-assistance firms;
- associations/cooperatives;
- municipalities/program operators;
- buyers/exporters;
- future verified partners.

Define future object:

```text
ProjectOriginator
├── identity
├── organization
├── permitted geographies/crops
├── validation state
├── conflict disclosures
├── project history
├── evidence quality history
└── quality/performance metrics
```

Origination is not automatic approval.

Every project must pass the same readiness and evidence gates regardless of who originated it.

---

## 16. GREENATICS as project generator

Historical architecture positioned GREENATICS as a generator/enabler of real projects.

That remains strategically useful.

GREENATICS may contribute:

- existing producer relationships;
- technical diagnostics;
- circular-input solutions;
- municipal/territorial projects;
- productive protocols;
- field teams;
- residue-to-input circularity opportunities.

But SANA must preserve commercial transparency.

Invariant:

```text
technical need
→ intervention strategy
→ compatible product
→ product/SKU
```

not:

```text
project receives capital
→ must buy WONDERGREEN
```

If WONDERGREEN is selected, the commercial relationship and technical basis must be traceable.

---

## 17. Platform-enabled input commerce

The historical idea that AGROWAY can strengthen GREENATICS/WONDERGREEN commercial reach should be preserved carefully.

A financed project naturally creates an approved productive budget and input plan.

SANA can support:

```text
AgronomicRequirement
→ ApprovedIntervention
→ CompatibleProducts[]
→ ProcurementRequirement
→ SupplierOffer(s)
→ Purchase
→ InventoryLot
→ Application
→ Outcome
```

WONDERGREEN may be one supplier/product family.

The platform becomes valuable to GREENATICS because it creates **qualified, contextualized demand**, not because it hides a sales channel inside agronomic advice.

---

## 18. Regenerative capital loop

The broader SANA thesis combines three loops.

### Productive loop

```text
Plan → Cultivate → Harvest → Sell → Learn → Next cycle
```

### Capital loop

```text
Capital → Productive deployment → Income → Settlement → Reinvestment
```

### Regenerative/circular loop

```text
Residue → GREENATICS transformation → agricultural input → Soil/Crop → Biomass/Residue
```

SANA/AGROWAY sit across them as:

`trace → accompany → measure → learn`.

Impact is not assumed because the loop exists; it must be measured with appropriate baselines/evidence.

---

## 19. Producer as productive partner

The platform should avoid framing campesinos/producers as beneficiaries receiving charity.

They are productive counterparties who may contribute:

- land/access;
- labor;
- knowledge;
- infrastructure;
- cash/in-kind resources;
- operational execution;
- commercial relationships.

SANA's social mission is strongest when it increases:

- access to productive capital;
- ability to demonstrate productive history;
- technical capability;
- market access;
- resilience;
- retained producer economics;
- ability to obtain repeat capital under better-understood conditions.

---

## 20. Business-model layers

SANA Capital should not depend on one fee.

### Layer 1 — Project readiness

Potential revenue:

- Diagnóstico SANA;
- Capital Readiness assessment;
- project structuring/setup;
- data normalization/onboarding.

Payer may be producer, program, funder, buyer or institutional sponsor depending on project design.

### Layer 2 — Product / operating infrastructure

Potential revenue:

- AGROWAY Pro/Network/Enterprise;
- implementation;
- integrations;
- data/reporting infrastructure.

### Layer 3 — Monitoring / Assurance

Potential revenue:

- financed-project monitoring fee;
- Control Tower subscription;
- evidence/Capital Passport reporting;
- portfolio reporting/API.

### Layer 4 — Technical management

Potential revenue:

- SANA Gestión;
- agronomic accompaniment;
- exception review/escalation services.

### Layer 5 — Impact

Potential revenue:

- baseline design;
- impact measurement;
- circularity reporting;
- institutional impact reports.

### Layer 6 — Origination/transaction support

Potential future revenue, only under an appropriate contractual/legal structure:

- project origination/structuring fees;
- partner integration fees;
- transaction-linked service fees;
- buyer/market coordination services.

The platform should not assume that transaction-linked compensation is always permissible or desirable.

### Layer 7 — Ecosystem commerce

Potential revenue indirectly or separately through GREENATICS/WONDERGREEN:

- validated input/product sales;
- technical products/services;
- circularity solutions.

Commercial conflicts must be disclosed and technically governed.

---

## 21. Who should pay

A key platform decision is that the smallest producer should not necessarily bear the whole cost of the digital/monitoring infrastructure.

Value recipients may include:

- producer;
- funder;
- buyer/offtaker;
- association;
- development program;
- municipality/public project;
- insurer/guarantee program;
- corporate sustainability program;
- GREENATICS commercial ecosystem.

Use value-based payer allocation.

Example:

```text
Producer pays:      productive service he directly consumes
Funder pays:        monitoring / portfolio visibility
Buyer pays:         sourcing/traceability value when contracted
Program pays:       inclusion/technical infrastructure
SANA/Greenatics:    may subsidize onboarding when strategic CAC justifies it
```

Do not create opaque cross-subsidies that distort project economics.

---

## 22. Unit economics

For project `p`:

```text
SANA_Project_Revenue_p =
    ReadinessRevenue
  + SoftwareRevenue
  + MonitoringRevenue
  + TechnicalServiceRevenue
  + ImpactRevenue
  + EligibleStructuringRevenue
  + OtherContractedRevenue
```

```text
SANA_Project_Cost_p =
    OnboardingCost
  + TechnicalHours
  + FieldVisits
  + SupportCost
  + CloudAndDataCost
  + AIUsageCost
  + PartnerIntegrationCost
  + ReportingCost
  + ImpactMeasurementCost
  + AllocatedOpsCost
```

```text
ProjectContributionMargin =
    SANA_Project_Revenue_p - SANA_Project_Cost_p
```

Track separately:

- commercial revenue earned by GREENATICS/WONDERGREEN;
- producer project economics;
- funder financial outcome;
- impact outcome.

Never combine them into one “ecosystem return”.

---

## 23. Platform network effects

### Data network effect

More closed crop cycles create more context/outcome history.

### Productive-history effect

Repeat producers accumulate evidence that can reduce future unknowns.

### Capital network effect

More qualified projects make the platform more useful to funders; more capital mandates make it more useful to projects.

### Buyer network effect

More production visibility improves sourcing; more buyer demand improves market visibility for projects.

### Knowledge network effect

Observed interventions/outcomes improve SANA's comparable-case and technical-learning capability.

### Trust network effect

A history of transparent exceptions, corrections and realized outcomes makes the platform more credible than a marketplace showing only forecasts.

---

## 24. Platform moat

The moat is not “we have investors”.

It is the longitudinal graph:

```text
Producer
↔ ProductiveProject
↔ Farm/Lot/CropCycle
↔ Plan
↔ CapitalDeployment
↔ ProductiveUse
↔ Evidence
↔ AgronomicState
↔ Harvest
↔ Buyer
↔ Sale
↔ Collection
↔ Settlement
↔ Impact
↔ Learning
↔ NextProject
```

This graph can support future underwriting/decision-support models only after sufficient validated history exists.

---

## 25. Marketplace architecture

A mature marketplace should have three distinct surfaces.

### Project marketplace

Qualified/authorized opportunities.

### Capital mandate marketplace

Funder mandates and partner programs.

### Buyer demand marketplace

Demand/quality/delivery opportunities.

SANA matching creates intersections.

Do not launch a generic public “browse farms and invest” UI before evidence and partner foundations are ready.

---

## 26. Future investor experience

Potential mature journey:

```text
Profile / mandate
→ eligible opportunities
→ project dossier / Capital Passport
→ risk + evidence + scenario view
→ allocation intent
→ partner onboarding/execution
→ funded position reference
→ Control Tower monitoring
→ exception notifications
→ milestone evidence
→ harvest / sale / collection
→ settlement outcome
→ impact report
→ reinvest / diversify
```

A small/micro participant may eventually receive a simplified version, but the underlying authority and evidence model remains the same.

---

## 27. Diversification

Historical microinvestment logic becomes safer conceptually when the user can understand portfolio exposure rather than emotionally “adopt” one plant/farmer.

Future portfolio dimensions:

- crop;
- geography;
- producer;
- buyer;
- harvest window;
- project stage;
- instrument/partner;
- material risk factor.

SANA can visualize concentration and scenarios.

It should not claim that diversification removes risk.

---

## 28. Platform reputation without a black-box score

Long term, maintain explainable reputational histories for:

### Producer/project

- execution completeness;
- evidence quality;
- budget discipline;
- incident handling;
- realized productive outcomes;
- sale/collection history when available.

### Originator

- project quality;
- readiness accuracy;
- evidence completeness;
- exception rate.

### Buyer

- purchase/acceptance history;
- payment timeliness;
- quality dispute history.

### Partner/funder program

- decision time;
- deployment timeliness;
- reporting quality;
- exception handling;
- settlement-data availability.

These are domain histories, not opaque public ratings by default.

---

## 29. Impact-business thesis

The platform may create a double-result proposition:

1. financial/productive activity;
2. social/environmental outcomes supported by evidence.

Measure separately:

### Social/economic

- producers with new productive-capital access;
- repeat financed cycles;
- productive-history depth;
- producer retained economics;
- market-access improvements;
- management maturity;
- resilience indicators where method exists.

### Environmental/regenerative

- physical circular material flows;
- soil/agronomic indicators;
- input efficiency;
- water/biodiversity where method exists;
- carbon only under a defensible methodology.

Impact cannot be used to camouflage a weak financial/productive result.

---

## 30. Growth loop

The platform growth loop can become:

```text
1. SANA/partners originate a good project
2. Diagnostic structures it
3. AGROWAY creates the operating record
4. Capital partner/funder finances it
5. SANA monitors it
6. Buyer closes commercial pathway
7. Project closes with realized evidence
8. Producer gains productive history
9. Funder gains confidence/history
10. Case attracts new projects/capital/buyers
11. Next cycle requires less information reconstruction
```

Growth quality is measured by **closed evidence-backed cycles**, not merely registered users or capital shown on the platform.

---

## 31. Acquisition channels for the capital platform

### Producer/project acquisition

- SANA diagnostics;
- GREENATICS client network;
- agronomists/technical operators;
- associations;
- buyers/exporters;
- territorial programs.

### Capital acquisition

- financial partners;
- impact funds;
- corporate/buyer programs;
- institutional/development actors;
- sophisticated private networks;
- later authorized retail/micro channels.

### Buyer acquisition

- exporters;
- processors;
- sourcing programs;
- existing commercial networks.

The platform should first solve real bilateral/institutional workflows before optimizing public marketplace CAC.

---

## 32. Product naming boundary

For now:

- `SANA Capital` = strategic capability/product family;
- `AGROWAY Invest / Control Tower` = underlying technical substrate where relevant;
- `Capital Passport` = governed project projection;
- `FundingOpportunity` = project opportunity projection;
- `FunderMandate` = capital-side eligibility/matching object.

Do not create additional logos/subbrands for each concept.

Historical `SANA Coin` remains archived/deferred terminology and should not appear in public product navigation.

---

## 33. Public website boundary

The current public SANA website should **not** present:

- “Invierte ahora”;
- public project offerings;
- expected return cards;
- token/coin mechanics;
- “SANA guarantees your investment”;
- “regulated investment platform” unless independently true;
- carbon-return claims.

Current/future-safe narrative:

> SANA busca ayudar a convertir mejores operaciones agrícolas en proyectos más trazables, medibles y preparados para conectarse con capital y mercado mediante aliados especializados.

The mature capital experience can be introduced only when the corresponding partner, product and operational gates are real.

---

## 34. Platform-readiness gates

Before a public/microinvestment experience, require at minimum:

### Product

- FIELD full-cycle operational;
- real producer usability;
- evidence/replay quality;
- harvest-sale-settlement closure;
- Control Tower exception workflow;
- Capital Passport private/institutional validated.

### Operations

- repeatable project origination/readiness;
- monitoring cost known;
- exception ownership/SLA;
- support model;
- producer reporting burden acceptable.

### Capital/partner

- selected contractual/financial partner structure;
- identity/onboarding/fund-flow responsibilities explicit;
- instrument-specific disclosures/terms handled by the responsible party;
- failure/recovery/continuity procedures.

### Market

- credible buyer/offtake pathway for target pilots;
- collection evidence;
- quality/delivery workflow.

### Evidence

- at least several completed financed cycles;
- realized vs forecast outcome history;
- no unresolved critical trust gaps;
- methodology for published impact claims.

Public scale is blocked while a critical gate is missing.

---

## 35. Updated SANA Capital roadmap interpretation

The existing `CAPITAL-0 → CAPITAL-5` roadmap remains valid.

This synthesis clarifies the intended end-state.

### CAPITAL-0 — Canon & integrity

Current.

### CAPITAL-1 — Project readiness

Build project/readiness/productive-risk information.

### CAPITAL-2 — Monitored financed pilot

One/few funders and partner-led structure. Prove capital-use/evidence/harvest/sale/settlement lineage.

### CAPITAL-3 — Institutional Control Tower

Scale portfolios, exceptions, reporting, APIs and repeat project cohorts.

### CAPITAL-4 — Partner marketplace / matching

Add:

- `FundingOpportunity`;
- `FunderMandate`;
- deterministic matching;
- allocation intent;
- partner handoff;
- buyer-demand intersections;
- reinvestment workflows.

### CAPITAL-5 — Micro/fractional experience + advanced structures

Only when gates permit:

- smaller participant UX;
- diversified portfolio views;
- partner-issued position references;
- advanced/blended structures;
- validated risk models.

Token/blockchain is **not** implied by CAPITAL-5.

---

## 36. Platform metrics

### Productive supply

- projects discovered;
- projects reaching SANA_READY;
- projects reaching CAPITAL_READY;
- readiness conversion rate;
- median time to readiness;
- blocking gaps/project.

### Capital

- capital mandates available;
- matched capital;
- committed/deployed capital;
- time to partner decision;
- time commitment→deployment;
- repeat funder rate;
- reinvestment rate.

### Market

- projects with buyer identified;
- projects with purchase history/offtake evidence;
- buyer concentration;
- collection timeliness;
- repeat buyer rate.

### Trust

- capital traceability ratio;
- verified traceability ratio;
- exception rate;
- exception resolution time;
- milestone evidence completeness;
- realized-vs-forecast variance transparency.

### Producer

- first-time productive capital access;
- repeat capital readiness;
- financed cycles/producer;
- productive history depth;
- producer retained economics where measurable.

### Platform

- closed financed cycles;
- matched projects/funder mandate;
- monitoring cost/project;
- revenue/project;
- contribution margin/project;
- multi-sided repeat rate.

Mature north-star candidate:

`VERIFIED_PRODUCTIVE_CAPITAL_RECYCLED`.

---

## 37. Key strategic modification from the historical review

The historical work does **not** make us abandon the disciplined current plan.

It changes the interpretation of the destination.

Before:

> SANA Capital could look like a monitoring layer attached to financed projects.

After synthesis:

> SANA Capital is intended to become a multi-sided agricultural capital-and-market orchestration platform whose trust advantage comes from AGROWAY's longitudinal productive evidence.

But sequence matters:

```text
GOOD AGRICULTURAL OPERATING SYSTEM
→ GOOD PRODUCTIVE PROJECTS
→ GOOD EVIDENCE
→ MONITORED FINANCED PILOTS
→ REPEATABLE CAPITAL/BUSINESS WORKFLOW
→ INSTITUTIONAL PLATFORM
→ MATCHING/MARKETPLACE
→ MICRO/FRACTIONAL EXPERIENCE
```

Not:

```text
TOKEN / MARKETPLACE
→ hope the productive system catches up later
```

---

## 38. Strategic statement

> **SANA conecta capital, conocimiento y mercado con producción agrícola verificable. AGROWAY preserva la evidencia de lo que ocurre en el campo para que cada proyecto pueda ser entendido, acompañado, medido y mejorado.**

And the broader mission:

> **Hacer visible el valor de cultivar mejor y convertir esa evidencia en mejores decisiones, mejores mercados y, progresivamente, mejor acceso a capital.**

---

## 39. Immediate execution consequence

No new public marketplace should be built now.

The immediate work remains:

1. collect one real Hass Data Pack;
2. parameterize the first real pilot financial model;
3. select/diligence a suitable capital/financial partner role;
4. close FIELD/Control runtime integrity gaps;
5. prove one monitored financed project end to end;
6. reuse Control Tower exceptions for capital readiness/monitoring;
7. only then materialize `FundingOpportunity` / `FunderMandate` / matching as runtime domain work.

This preserves current execution discipline while restoring the full historical business-model ambition.