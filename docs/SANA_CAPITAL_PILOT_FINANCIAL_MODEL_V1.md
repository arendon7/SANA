# SANA Capital Pilot Financial Model v1

Status: `STRATEGIC_CANON_DRAFT`

Owner boundary: SANA Product / Capital & Markets / Agronomy & Knowledge / Impact & Trust / Finance.

This document defines the financial-model architecture for the first real SANA Capital pilot. It is deliberately parameterized: it does **not** prescribe or advertise an investor return, interest rate, credit score, public crowdfunding offer, or financial instrument.

The purpose is to make one agricultural project and a small pilot cohort financially reconstructable from:

`capital need → approved budget → deployment → use of funds → field execution → harvest → sale → collection → settlement → financial outcome → productive outcome → impact outcome`.

---

## 1. Core principle

SANA Capital must separate three results at all times:

1. `FINANCIAL_RETURN` — what happened to the capital under the contractual instrument;
2. `PRODUCTIVE_RETURN` — what productive capacity/output the capital helped create;
3. `IMPACT_RETURN` — what social/environmental changes can be supported by evidence.

These ledgers may be related, but they are never interchangeable.

A positive impact claim does not imply financial safety. A positive financial outcome does not imply regenerative impact. Operational traceability does not guarantee repayment.

---

## 2. Pilot purpose

The first financed pilot should answer five questions:

1. Can SANA correctly estimate and version the productive capital need before funds move?
2. Can AGROWAY preserve sufficient lineage from deployed capital to productive use and field evidence?
3. Can milestone evidence reduce monitoring uncertainty without imposing excessive reporting burden on the producer?
4. Can harvest, commercialization, collection and settlement be reconstructed deterministically?
5. Can SANA deliver the service with viable unit economics while preserving meaningful producer economics?

The pilot is not successful merely because one investor receives a return. It must prove the operating and evidence architecture.

---

## 3. Initial cohort architecture

Recommended first cohort:

- `5–10` producers maximum;
- one concentrated geography;
- preferably one crop context for the first cohort;
- productive or near-productive assets rather than greenfield long-duration establishment;
- identifiable buyer/market pathway;
- real external capital need;
- one or a small number of sophisticated/partner funders;
- legal/financial partner structure resolved before money moves;
- AGROWAY full-cycle evidence requirements defined before first deployment.

The cohort model aggregates project-level models. It must never hide weak projects behind portfolio averages.

---

## 4. Model layers

The model has six layers.

### L1 — Productive model

Crop, area, stage, productive plan, expected activities, harvest windows, yield/quality assumptions.

### L2 — Cost and capital model

Productive costs, producer contribution, other non-repayable/third-party support, external capital need, contingency.

### L3 — Deployment model

Commitments, milestone eligibility, deployments/disbursement evidence, use of funds.

### L4 — Commercial model

Harvest, grade/quality, price, buyer, delivery, sales, collections.

### L5 — Financial outcome model

Instrument-specific obligations, settlement, recovery, delay, impairment, restructuring and realized funder/producer outcomes.

### L6 — SANA economics + impact

SANA revenue/cost-to-serve, capital traceability, productive learning, social/environmental metrics.

---

## 5. Project-level model identity

Every financial model version is bound to:

```text
FinancialModelVersion
├── tenantId
├── projectId
├── producerId
├── farmIds[]
├── lotIds[]
├── cropCycleIds[]
├── currency
├── productivePlanVersion
├── budgetVersion
├── readinessAssessmentVersion
├── riskProfileVersion
├── marketPathwayVersion
├── impactPlanVersion
├── instrumentTermVersion (when known)
├── createdAt
├── createdBy
└── supersedes
```

A model cannot silently switch project, currency, budget or crop-cycle scope.

---

## 6. Sources and uses

### Sources

Parameterize at minimum:

```text
ProducerContribution
ExternalCapital
BuyerAdvance
GrantOrNonRepayableSupport
ProgramContribution
SupplierCredit
OtherApprovedSource
```

### Uses

Use the approved productive budget taxonomy, for example:

```text
Labor
Nutrition
PlantHealth
WaterIrrigation
EquipmentOrServices
Harvest
PostHarvest
Logistics
QualityCompliance
Insurance
Contingency
OtherApprovedUse
```

### Core equations

```text
TotalSources = Σ ApprovedFundingSources
TotalUses = Σ ApprovedBudgetUses

ExternalCapitalNeed =
    TotalUses
    - ProducerContribution
    - BuyerAdvance
    - GrantOrNonRepayableSupport
    - OtherNonExternalCapitalSources

FundingGap = TotalUses - TotalSources
```

Invariant:

`INVESTMENT_READY` requires `FundingGap = 0` or an explicitly approved funding-gap treatment.

---

## 7. Producer contribution

Producer contribution is not limited to cash. The model may record separately:

- cash contribution;
- documented labor contribution;
- owned inputs already available;
- productive infrastructure used by the project;
- other approved in-kind contribution.

However, in-kind contribution must **not** be mixed with cash liquidity.

Use separate fields:

```text
ProducerCashContribution
ProducerInKindContributionValue
ProducerContributionMethodology
```

No inflated in-kind valuation may be used to make the financing appear safer.

---

## 8. Budget versioning

No financing model may reference an unversioned budget.

```text
BudgetVersion
├── lines[]
│   ├── category
│   ├── amount
│   ├── plannedMonth/dateWindow
│   ├── productivePlanReference
│   ├── criticality
│   └── contingencyEligible
├── contingency
├── total
├── approvalState
├── approvedBy
└── approvedAt
```

If a material budget revision occurs after `CAPITAL_READY`, the previous readiness/financial model may become `REASSESSMENT_REQUIRED`.

---

## 9. Monthly productive cash flow

The pilot model should use monthly buckets initially, with event-level ledgers beneath them.

For month `t`:

```text
OpeningCash_t
+ ProducerCashIn_t
+ ExternalDeployment_t
+ BuyerAdvance_t
+ OtherApprovedCashIn_t
- ProductiveCashUses_t
- FinancingCashCosts_t
- SANAFeesPaidByProject_t
- Partner/PaymentFees_t
= ClosingCash_t
```

The model must show negative liquidity before it occurs.

A project cannot be considered viable merely because total annual revenue exceeds total annual cost if working-capital timing causes a material cash deficit.

---

## 10. Milestone deployment model

External capital should be modeled as a sequence of potential deployments rather than one undifferentiated amount.

```text
FundingMilestone
├── milestoneId
├── projectId
├── plannedWindow
├── maximumEligibleDeployment
├── requiredProductiveState
├── requiredEvidence
├── requiredBudgetState
├── blockingRisks
├── status
└── authorityDecision
```

Financial-model variables:

```text
CommittedCapital
EligibleForDeployment_t
ActualDeployment_t
UndeployedCommitment_t
```

Invariant:

`ActualDeployment_t <= EligibleForDeployment_t` unless an authorized exception is explicitly recorded under the selected financial structure.

SANA/AGROWAY may establish evidence that a milestone is satisfied. The financial authority executes or withholds the actual movement of funds.

---

## 11. Use-of-funds lineage

The target financial lineage is:

```text
Commitment
→ Deployment
→ Cash/Payment Record
→ Purchase / Expense / Labor Cost
→ Inventory Lot / Service
→ Field Activity / Application / Task
→ Lot / Crop Cycle
→ Evidence
```

Each project calculates:

```text
TraceableDeployedCapital = Σ deployment value with acceptable productive lineage

CapitalTraceabilityRatio =
    TraceableDeployedCapital / TotalDeployedCapital
```

Also maintain a stricter metric:

```text
VerifiedTraceableCapital =
    Σ deployed value whose productive lineage includes evidence meeting verification policy

VerifiedCapitalTraceabilityRatio =
    VerifiedTraceableCapital / TotalDeployedCapital
```

Do not treat `CapitalTraceabilityRatio = 100%` as proof that the project is profitable or low-risk.

---

## 12. Productive assumptions

The first real model must parameterize rather than hard-code:

```text
ProductiveArea
PlantCountOrEquivalentUnit
CropStage
HarvestWindows[]
ExpectedYieldByWindow
ExpectedQualityMix
LossBeforeHarvest
PostHarvestLoss
MarketableVolume
```

Every assumption stores:

```text
value
unit
source
sourceDate
method
confidence
assumptionType = REPORTED | MEASURED | CALCULATED | ESTIMATED | MODELLED
```

Forecasts can never overwrite actual harvest facts.

---

## 13. Revenue model

Revenue is modeled at the lowest useful commercial granularity.

For sale line `i`:

```text
GrossSale_i = SaleQuantity_i × UnitPrice_i
```

Project forecast:

```text
ExpectedGrossSales = Σ ExpectedSaleQuantity_i × ExpectedUnitPrice_i
```

Realized:

```text
InvoicedSales = Σ actual sale documents
CollectedSales = Σ actual collections
```

`InvoicedSales != CollectedSales` by default.

The model must separately represent receivable risk and collection delay.

---

## 14. Market / buyer assumptions

Parameterize:

```text
BuyerId
BuyerEvidenceType
ExpectedVolumeByBuyer
QualityRequirements
ExpectedPriceMechanism
PaymentTermDays
CollectionProbabilityOrStatus
BuyerConcentration
OfftakeStatus
```

Evidence states may include:

```text
OPEN_MARKET
BUYER_IDENTIFIED
PURCHASE_HISTORY
BUYER_INTENT
OFFTAKE_AGREEMENT
PURCHASE_ORDER
ACTUAL_SALE
ACTUAL_COLLECTION
```

The system must not represent a buyer intent as a guaranteed sale.

---

## 15. Pricing and return assumptions

The financial model must support an instrument-term adapter rather than assume one financing structure.

Potential future structures include debt, revenue-share, buyer advance, supplier financing, blended finance or other legally reviewed arrangements.

Canonical interface:

```text
InstrumentTerms
├── instrumentType
├── principalOrCommittedAmount
├── pricingMethod
├── rateOrParticipationParameters
├── term
├── gracePeriod
├── paymentSchedule
├── fees
├── securityOrGuarantees
├── defaultDefinition
├── restructuringRules
├── prepaymentRules
└── legalPartnerReference
```

No default `rate`, `IRR`, `APR`, `expectedReturn` or `targetReturn` belongs in SANA product canon.

Those values must come from the actual legally reviewed transaction/partner terms and applicable limits at execution time.

---

## 16. Instrument-independent settlement engine

The model should calculate a generic cash waterfall first, then apply instrument-specific rules.

### Cash available for settlement

```text
GrossCollections
- BuyerAdjustmentsOrRefunds
- ApprovedSellingCosts
- ApprovedHarvestAndLogisticsCostsDueAtCollection
- ApplicableTaxesWithholdingsOrTransactionItems
= NetCollectedCashBeforeFinancingSettlement
```

Taxes/withholdings are parameters supplied by the actual accounting/legal treatment. SANA must not infer them generically.

### Generic allocation categories

```text
SettlementAvailableCash
→ mandatory external payment obligations
→ approved reserves / remaining productive obligations
→ instrument-specific funder distributions/repayment
→ producer residual cash
```

The exact priority order is **not canonical** until the selected instrument and contracts define it.

---

## 17. Producer economic viability

SANA must model the producer as an economic counterparty, not merely a source of repayment.

Minimum producer fields:

```text
ProducerCashContribution
ProducerInKindContribution
ProducerOperatingIncomeBeforeFinancing
ProducerFinancingPayments
ProducerResidualCash
ProducerMarginAfterFinancing
ProducerCashTiming
```

Potential viability gates, all parameterized:

```text
ProducerResidualCash >= MinimumAcceptableProducerResidual
ProducerMarginAfterFinancing >= MinimumAcceptableProducerMargin
ProducerCashBalance_t >= ApprovedMinimumLiquidityBuffer
```

No universal numeric thresholds are defined in this document.

Any structure that leaves the productive project unable to fund essential agronomic work or leaves the producer with an economically incoherent residual must be flagged for redesign.

---

## 18. Financial outcome states

Project outcome states must represent failure and delay explicitly.

```text
PERFORMING
DELAYED
PARTIALLY_PAID
RESTRUCTURING_REQUIRED
RESTRUCTURED
IMPAIRED
DEFAULTED_IF_APPLICABLE_TO_INSTRUMENT
RECOVERY_IN_PROGRESS
RECOVERED_PARTIALLY
RECOVERED_FULLY
SETTLED
CLOSED_WITH_LOSS
CLOSED
```

Do not infer `DEFAULTED` solely from an agronomic problem. It is an instrument/contractual state.

---

## 19. Delay and restructuring

The model must support:

```text
HarvestDelayMonths
CollectionDelayDays
PaymentDelayDays
RestructuredTerm
RestructuredPaymentSchedule
AdditionalApprovedWorkingCapital
```

A delay changes cash timing even when total production eventually remains similar.

Therefore NPV/IRR-type outputs, if later shown to authorized financial users, must use actual dated cash flows and clearly distinguish forecast from realized results.

---

## 20. Loss model

Potential loss sources should remain decomposed:

```text
AgronomicLoss
ClimateLoss
QualityDiscount
MarketPriceLoss
PostHarvestLoss
BuyerDefaultOrCollectionLoss
FraudOrMisuseLoss
LogisticsLoss
OtherApprovedLossCategory
```

Do not collapse all underperformance into `crop loss`.

This decomposition is necessary for future underwriting learning.

---

## 21. Scenario architecture

Every project should have at least four named scenarios:

```text
BASE_CASE
DOWNSIDE
SEVERE_DOWNSIDE
UPSIDE
```

These are **containers**, not fixed values.

Each scenario must explicitly define its parameter changes and evidence/source.

Example sensitivity parameters:

```text
YieldFactor
QualityMixFactor
PriceFactor
CostInflationFactor
InputCostFactor
LaborCostFactor
HarvestDelayMonths
CollectionDelayDays
BuyerCollectionFactor
PreHarvestLossFactor
PostHarvestLossFactor
UnexpectedCapitalNeed
InsuranceRecoveryIfApplicable
```

No scenario may be described as probable without a defensible statistical or expert basis.

---

## 22. Base case discipline

`BASE_CASE` does not mean “optimistic expected result”.

It must be constructed from the best currently supportable productive/commercial assumptions and explicitly disclose uncertainty.

Required metadata:

```text
BaseCaseAsOfDate
AssumptionSources[]
KeyUnknowns[]
ConfidenceByVariable
Reviewer
```

---

## 23. Stress tests

Before a financed pilot, run at minimum:

1. yield reduction stress;
2. sale-price reduction stress;
3. simultaneous yield + price stress;
4. cost-overrun stress;
5. harvest-delay stress;
6. collection-delay stress;
7. buyer non-payment/partial-payment stress;
8. additional working-capital requirement;
9. milestone withholding/delay;
10. combined severe downside.

Output should answer:

- Does the project run out of liquidity?
- Can critical agronomic activities still be executed?
- Is the financing obligation still serviceable under the instrument?
- What producer residual remains?
- What additional capital would be required?
- Which risk caused the failure?

---

## 24. Break-even analysis

The model should expose several break-even points, not one.

### Productive break-even

Minimum marketable volume required for operating revenue to cover defined productive costs.

### Cash break-even

Point where cumulative project cash no longer remains negative under the modeled funding schedule.

### Financing break-even

Minimum cash available to meet the contractual financing obligations.

### Producer viability break-even

Minimum economic outcome that still leaves the producer above the approved residual/margin threshold.

These thresholds depend on the actual instrument and project economics.

---

## 25. Funder outcome

For authorized financial analysis, calculate from actual dated funder cash flows:

```text
FunderCashFlow[] =
    commitments/deployments as negative cash flow
    + repayments/distributions/recoveries as positive cash flow
```

Potential metrics after instrument validation:

- principal recovery;
- cash multiple;
- realized return;
- delay;
- impairment/loss;
- IRR/XIRR if appropriate to the instrument and audience.

These metrics must never be labeled guaranteed or expected unless contract/methodology supports the exact claim.

---

## 26. SANA revenue model

SANA economics are separate from both producer economics and funder economics.

Potential revenue lines:

```text
ReadinessFee
ImplementationFee
AGROWAYMonitoringSubscription
TechnicalAccompanimentFee
ImpactMeasurementFee
InstitutionalControlTowerFee
APIOrIntegrationFee
PartnerReportingFee
LegallyPermittedStructuringOrOriginationFee
```

Do not assume all apply to every pilot.

A financing-linked fee requires explicit legal/contractual review before activation.

---

## 27. SANA variable delivery costs

Track by project:

```text
DiagnosticHours
AgronomistHours
AnalystHours
FieldVisitHours
FieldTravelCost
OnboardingHours
SupportHours
EvidenceReviewHours
ImpactReviewHours
DataInfrastructureCost
AIUsageCost
StorageCost
PaymentOrPartnerIntegrationCost
ThirdPartyVerificationCost
```

### Contribution margin

```text
SANAProjectRevenue = Σ project-attributable SANA revenue

SANAVariableDeliveryCost = Σ project-attributable variable delivery costs

SANAProjectContribution =
    SANAProjectRevenue - SANAVariableDeliveryCost

SANAProjectContributionMargin =
    SANAProjectContribution / SANAProjectRevenue
```

The pilot must measure actual hours rather than rely on planned staffing assumptions.

---

## 28. Who pays SANA

The model must allow multi-payer economics:

```text
Producer
Funder
CapitalPartner
Buyer/Offtaker
DevelopmentProgram
Government/Cooperation
OtherInstitutionalSponsor
```

A small producer should not automatically bear the full cost of infrastructure that materially benefits funders, buyers or programs.

Each fee stores:

```text
payer
beneficiary
service
amount
currency
dueDate
paidStatus
legalBasis/reference
```

---

## 29. Impact economics remain separate

Impact metrics can inform investment mandates but must not be used to hide financial losses.

Examples:

```text
CapitalAccessCreated
RepeatCapitalReadiness
ProductiveHistoryDepth
ManagementMaturityChange
MarketAccessChange
CircularMaterialTraced
SoilMetricChange
WaterMetricChange
CarbonMetricOnlyIfMethodologicallyValid
```

For every impact metric:

`baseline + method + data type + evidence + confidence + current value`.

---

## 30. Circularity flow

Where relevant:

```text
Source residue/material
→ Greenatics transformation
→ Product/bioinput batch
→ Purchase/transfer
→ Farm inventory
→ Lot/cycle application
→ Evidence
→ Agronomic outcome
```

Financial value and physical circularity quantity are separate fields.

Do not infer carbon benefit from circularity quantity alone.

---

## 31. Insurance adapter

Insurance is optional in the first model but structurally supported.

```text
InsurancePolicy
├── insurer
├── coverage
├── insuredValue
├── exclusions
├── trigger
├── premium
├── claimStatus
└── payout
```

Do not assume insurance recovery in the base case unless a valid policy covers the event and the model explicitly defines the expected-treatment methodology.

Actual payout is recorded only when realized.

---

## 32. Cohort model

For pilot cohort `C`:

```text
CohortCapitalNeed = Σ ProjectExternalCapitalNeed
CohortDeployedCapital = Σ ProjectDeployedCapital
CohortCollectedSales = Σ ProjectCollectedSales
CohortRecoveredCapital = Σ applicable realized recovery/repayment
```

Also aggregate:

- projects by status;
- capital by project;
- capital by producer;
- buyer exposure;
- geography exposure;
- crop exposure;
- maturity/vintage;
- evidence coverage;
- traceability ratios;
- losses/delays by cause;
- SANA cost-to-serve;
- impact metrics only when definitions are comparable.

Never add currencies without an explicit, versioned FX conversion policy.

---

## 33. Concentration metrics

At minimum expose:

```text
LargestProjectShare
LargestBuyerShare
LargestProducerShare
LargestGeographyShare
LargestCropShare
```

For larger cohorts, concentration indices may be added after methodology review.

The first pilot should favor operational simplicity over artificial diversification.

---

## 34. Portfolio scenario behavior

A portfolio scenario is calculated from project scenarios; do not apply one blanket percentage to every producer unless explicitly chosen as a stress test.

Projects may respond differently to:

- price change;
- weather;
- harvest delay;
- quality variation;
- buyer concentration;
- logistics disruption.

Future correlation modeling requires actual historical evidence and remains out of scope for the first pilot.

---

## 35. Pilot success metrics

### Capital & financial

- capital requested;
- capital committed;
- capital deployed;
- capital settled/recovered under the selected instrument;
- capital deployment timing;
- delay/impairment states;
- cash-flow forecast error.

### Traceability

- Capital Traceability Ratio;
- Verified Capital Traceability Ratio;
- evidence coverage;
- % productive expenses linked to budget line;
- % productive expenses linked to crop-cycle activity;
- unknown-resolution rate.

### Producer

- producer reporting burden;
- producer residual economics;
- management maturity change;
- repeat Capital Readiness;
- productive-history depth.

### SANA

- analyst hours/project;
- agronomist hours/project;
- field visits/project;
- cost-to-serve;
- project contribution margin;
- monitoring exceptions/project;
- time to close monthly reporting.

### Partner/funder

- time to review milestone;
- number of manual evidence requests;
- unresolved information gaps;
- partner-reported monitoring usefulness;
- time to reconstruct project status.

### Impact

- valid baseline coverage;
- verified impact metrics;
- circular flows traced;
- unsupported claims blocked.

---

## 36. Pilot stop conditions

The pilot should pause new capital deployments if any P0 condition occurs, for example:

- project/tenant/currency integrity breach;
- material unexplained use-of-funds discrepancy;
- inability to reconstruct deployment ownership;
- evidence tampering or provenance failure;
- material agronomic safety concern;
- unauthorized capital/AI authority action;
- legal/partner structure uncertainty affecting fund movement;
- producer consent/privacy violation;
- inability to separate forecast from realized financial values;
- settlement cannot be deterministically reconciled.

These are stronger than ordinary underperformance.

---

## 37. Pilot review cadence

Recommended model cadence:

### Before funding

- model v1;
- downside review;
- budget/market/risk validation;
- producer viability review.

### Before each deployment

- milestone evidence;
- updated liquidity forecast;
- material risk changes;
- no stale readiness decision.

### Monthly

- plan vs actual costs;
- cash position;
- traceability ratios;
- productive state;
- market changes;
- SANA delivery cost.

### Harvest/commercialization

- actual harvest;
- quality mix;
- sale terms;
- receivables;
- collections.

### Closure

- full financial reconciliation;
- producer economics;
- funder outcome;
- SANA economics;
- impact outcomes;
- lessons for next underwriting/readiness cycle.

---

## 38. Colombia regulatory boundary

SANA Capital must be architected so regulated activity can be partner-led.

Current Colombian financing-collaboration rules include productive/agricultural projects and permit eligible persons under specified modalities; financing-collaboration entities have defined functions around project publication, transaction tooling, collection through supervised entities and segregation of project resources.

The regulatory framework continues to evolve. Before any real offer, issuance, collection, investor onboarding or financing-linked fee, legal counsel and the selected regulated partner must verify the rules and Superintendencia Financiera instructions in force on the transaction date.

SANA does not infer from its monitoring role that it may:

- solicit public investment;
- intermediate securities;
- custody investor money;
- perform regulated investor onboarding;
- offer guaranteed returns;
- set a legally compliant interest rate generically;
- execute collections or distributions outside the chosen authorized structure.

---

## 39. Data required for the first real Hass model

Before filling any return scenario, collect the following from one actual candidate project.

### Productive asset

- producer identity/organization;
- farm and lot IDs;
- area;
- plant count/density where applicable;
- age/stage;
- variety/rootstock where relevant;
- productive history by lot/cycle.

### Agronomy

- current state;
- production plan;
- activity calendar;
- nutrition plan;
- plant-health plan;
- water/irrigation requirements;
- known constraints;
- expected harvest windows with source/confidence.

### Costs

- labor by activity/month;
- inputs by product/quantity/month;
- services;
- irrigation/water/energy;
- equipment;
- harvest;
- post-harvest;
- logistics;
- certification/quality;
- contingency;
- historical actual costs if available.

### Producer contribution

- cash available;
- existing inventory;
- committed labor/resources;
- other approved sources.

### Market

- buyers;
- historical sales;
- quality mix;
- price history/source;
- current buyer evidence;
- payment terms;
- collection history;
- off-take/purchase-order evidence if any.

### Capital

- exact external capital need;
- date required;
- milestone timing;
- instrument proposed by partner;
- term/pricing/fees only when supplied by the actual partner;
- guarantees/security if any;
- payment/settlement rules.

### Legal/accounting

- contracting party;
- fund-flow structure;
- tax/withholding treatment;
- accounting treatment;
- insurance if applicable;
- partner/custody/payment roles.

### SANA economics

- planned diagnostic hours;
- agronomist hours;
- visits/travel;
- monitoring frequency;
- support burden;
- data/AI/storage cost;
- impact-review work;
- payer for each SANA service.

### Impact baseline

- social baseline;
- productive maturity baseline;
- circularity baseline;
- soil/water baseline where relevant;
- carbon only if methodology is selected and required data exist.

---

## 40. First spreadsheet/workbook structure

When an actual Hass case is selected, the computational workbook should contain at least:

```text
00_README_AND_TRUST
01_PROJECT_INPUTS
02_PRODUCTIVE_PLAN
03_BUDGET_SOURCES_USES
04_MONTHLY_CASHFLOW
05_MILESTONE_DEPLOYMENTS
06_HARVEST_AND_SALES
07_COLLECTIONS_SETTLEMENT
08_INSTRUMENT_TERMS
09_PRODUCER_ECONOMICS
10_FUNDER_OUTCOME
11_SANA_UNIT_ECONOMICS
12_SCENARIOS
13_SENSITIVITY
14_TRACEABILITY_METRICS
15_IMPACT
16_COHORT
17_AUDIT_AND_VERSIONS
```

All forecast cells must be visually/semantically distinguishable from actuals and record their source/method.

---

## 41. Minimum model outputs

For each project, the model must answer:

1. What is the total productive cost?
2. How much is contributed by the producer/other sources?
3. How much external capital is actually required and when?
4. What budget line/productive activity is each deployment intended to fund?
5. What is the monthly liquidity position?
6. What productive and market assumptions drive revenue?
7. What happens under downside stresses?
8. What remains economically for the producer after financing?
9. What actual cash flows did the funder experience?
10. What did SANA earn and spend to service the project?
11. How much deployed capital is traceable to productive execution?
12. What impact was actually measured rather than projected?

---

## 42. Model approval gates

A model may move from `DRAFT` to `READY_FOR_FINANCIAL_PROCESS` only if:

- productive plan is versioned;
- budget is approved/versioned;
- capital need reconciles to sources/uses;
- no hidden funding gap;
- market assumptions have source/confidence;
- base and downside scenarios exist;
- producer economics are visible;
- funder return parameters are either explicitly `PENDING_PARTNER_TERMS` or supplied from a reviewed instrument;
- taxes/withholdings/fees are not guessed;
- SANA fees are explicit;
- impact forecast and financial forecast are separated;
- reviewer authorities are recorded.

---

## 43. Model trust states

Use:

```text
DRAFT
DATA_INCOMPLETE
READY_FOR_SCENARIO_REVIEW
READY_FOR_PARTNER_TERMS
READY_FOR_FINANCIAL_PROCESS
FUNDED_MODEL_LOCKED
ACTUALS_IN_PROGRESS
SETTLEMENT_RECONCILED
CLOSED_AND_LEARNED
```

No model version is overwritten after money has moved; new information produces a superseding version while realized ledger facts remain immutable/auditable.

---

## 44. What remains future

Do not build yet:

- public expected-return cards;
- automated investment recommendations;
- retail investor suitability scoring;
- pooled-fund optimization;
- portfolio VaR;
- Monte Carlo claims without sufficient distributions/data;
- secondary market;
- tokenization/blockchain;
- automatic credit pricing;
- automatic financing approval;
- SANA custody/wallet.

These require substantially more evidence, legal structure and runtime maturity.

---

## 45. Pilot financial-product truth statement

The first SANA Capital financial model exists to prove:

> **We can understand how much productive capital is required, when it is required, what it is used for, what the agricultural system produced, what cash was actually collected, how the contractual settlement occurred, what remained for the producer, what happened to the funder capital, what SANA cost to operate, and what impact can genuinely be supported by evidence.**

Until those questions can be answered with real data and a closed cycle, SANA must not market projected agricultural returns as a proven investment product.
