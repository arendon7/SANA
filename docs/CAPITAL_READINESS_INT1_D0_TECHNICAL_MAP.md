# CAPITAL_READINESS INT-1 — D0/D1 Technical Map

Status: `READY_FOR_D0_REVIEW`  
Issue: `#22`  
Rebuilt after: `#24` / PR `#28`  
Runtime source: `feature/control-v022-alpha8`  
Runtime head inspected: `42bb7ae64416b1bf4211fff33dc10f720ec6b559`  
Direct-root acceptance evidence: workflow run `31568156251` / run #45, exact pre-merge head `684aac547174719b8637e214d4d128216a117c60`  
Document classification: `TECHNICAL_DESIGN_CANON_CANDIDATE`  
Implementation authority: **none yet**; this document does not authorize a migration, new Domain Event, financial execution, or production claim.

---

## 0. Executive decision

Capital Readiness INT-1 is **not a new application, not a new finance ledger, not a new agricultural master and not a new workspace**.

It is an additive capability inside the already-materialized Invest bounded context, projected into the existing GREENATICS CONTROL exception/read model.

The runtime architecture for INT-1 should be:

```text
FIELD / LAND / AGRONOMY / HARVEST / IMPACT canonical truth
                         │
                         ▼
                InvestmentProject
                         │
              existing Invest records
     budget / risk / evidence / capital facts
                         │
                         ▼
             CAPITAL READINESS INT-1
     intake → evidence → G1–G9 → gaps → decision
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
 ProductiveRiskProfile          EvidenceManifest
   deterministic view          deterministic view
          └──────────────┬──────────────┘
                         ▼
              CapitalReadinessPackage
                 versioned projection
                         │
                         ▼
              ControlTowerException
               derived/rebuildable
                         │
                         ▼
             ExceptionResolutionCase
                 human workflow
```

The architectural anti-pattern is:

```text
new Capital app
+ new producer/farm database
+ new crop-cycle database
+ new alert engine
+ new task manager
+ new money ledger
+ AI approval
```

That anti-pattern would duplicate current sources of truth, increase operational risk and make future partner integration harder.

### INT-1 design conclusion

`NEW_WORKSPACE_REQUIRED = NO`

Preferred future additive layout, only after D0 approval:

```text
packages/invest-control-contracts/src/
├── model.ts                  existing
├── commands.ts               existing
├── events.ts                 existing
├── readiness.ts              NEW, additive contract/pure vocabulary
└── index.ts                  export readiness

services/investment-portfolio/src/
└── index.ts                  EXTEND with deterministic readiness rules

services/control-tower-projector/src/
└── index.ts                  EXTEND with derived readiness exceptions

apps/control-web/src/
├── exception-resolution-model.ts existing
└── capital-readiness-model.ts    NEW projection/view model later
```

No migration is created in D0.

---

# 1. D0 truth: what is physically materialized now

Issue #24 is no longer a blocker. PR #28 reconstructed and persisted the declared 41-workspace root and the exact direct-root CI is green.

Current materialized source includes, among other things:

- `packages/invest-control-contracts/src/model.ts`
- `packages/invest-control-contracts/src/commands.ts`
- `packages/invest-control-contracts/src/events.ts`
- `services/investment-portfolio/src/index.ts`
- `services/control-tower-projector/src/index.ts`
- `packages/finance-contracts/src/index.ts`
- `services/finance-ledger/src/index.ts`
- `apps/control-web/src/exception-resolution-model.ts`
- `infra/postgres/migrations/0018_invest_control_tower.sql`
- `infra/postgres/migrations/0022_domain_integrity_hardening.sql`
- FIELD / land / agronomy / monitoring / harvest / impact / traceability contracts and services
- Copilot knowledge/evidence boundaries
- pilot certification/replay boundaries.

This changes one important statement from the earlier D0 draft:

> Capital Readiness is no longer blocked by an unmaterialized declared workspace graph.

It does **not** mean Capital Readiness is implemented. It means the substrate on which it can be implemented is now materially inspectable and typecheckable.

---

# 2. Existing Invest aggregate is the productive-capital project anchor

Current `InvestmentProject` already contains:

```text
InvestmentProject
├── projectId
├── tenantId
├── code
├── name
├── state
├── eligibility
├── productionRef
│   ├── producerId
│   ├── farmId
│   ├── plotIds[]
│   └── cropCycleIds[]
├── currency
├── requiredMinor
├── committedMinor
├── deployedMinor
├── recoveredMinor
├── approvedBudgetVersion?
├── createdAt
└── updatedAt
```

The PostgreSQL table comment is explicit: `agroway_invest.project` is an **investment twin referencing canonical AGROWAY producer/farm/plot/crop-cycle identities; not an agronomic master**.

That is exactly the correct boundary for the strategic SANA Capital thesis.

### Decision

Strategic concept:

`ProductiveInvestmentProject`

Current runtime anchor:

`InvestmentProject`

For INT-1, **reuse `InvestmentProject` as-is**. Do not rename it, duplicate it, or create `CapitalProject` beside it.

If the public product later uses a different commercial label, that does not justify a breaking domain rename now.

---

# 3. Existing capital facts already cover the financial-control spine

Current Invest contracts and service already materialize:

```text
Capital requirement
Capital commitment
Capital commitment cancellation
Capital deployment record
Capital recovery record
Budget version
Budget line
Budget approval
Investment risk
Project evidence link
Impact snapshot link
Eligibility result
Portfolio project summary
Control Tower capital totals
```

Current service rules already enforce, among other things:

- project/tenant scope;
- project currency scope;
- positive safe minor-unit amounts;
- committed capital cannot exceed required capital;
- deployment cannot exceed active commitment;
- project deployment cannot exceed committed capital;
- explicit project lifecycle transitions;
- approval requires existing coarse `ELIGIBLE` state;
- activation requires deployed capital;
- versioned budgets;
- one current approved budget in the returned model;
- risk mitigation evidence for mitigated/accepted states;
- project evidence links;
- impact snapshot links;
- deterministic current eligibility evaluation.

### Critical terminology

`CapitalDeployment` in AGROWAY is an evidence-bearing domain fact.

It is **not**:

- a bank transfer;
- custody;
- a wallet balance;
- a payment instruction;
- authority to release money;
- proof that SANA is the regulated financial intermediary.

INT-1 must preserve that distinction.

---

# 4. Database invariants that Capital Readiness must not weaken

Migration `0018_invest_control_tower.sql` already establishes:

- tenant-scoped Invest and Control schemas;
- non-negative project totals;
- `committed <= required`;
- `deployed <= committed`;
- positive commitment/deployment/recovery rows;
- one approved budget index per project;
- budget-line relationships;
- tenant RLS on Invest/Control tables;
- active exception fingerprint uniqueness;
- Control Tower snapshot/checkpoint structures;
- explicit statement that Control Tower snapshot is rebuildable, not transactional truth.

Migration `0022_domain_integrity_hardening.sql` adds fail-closed integrity:

- three-letter uppercase project currency;
- tenant/project/currency uniqueness anchor;
- commitment → project same tenant/project/currency;
- deployment → commitment same tenant/project;
- deployment/recovery/budget → project same tenant/project/currency;
- approved budget version → exact project/tenant/version FK.

### INT-1 database rule

Any future readiness persistence must reference the existing project using **tenant + project identity**, and must never weaken the current capital integrity constraints.

---

# 5. Finance ledger vs Invest ledger: do not merge the meanings

`packages/finance-contracts` currently defines a small operational `FinancialEntry`:

```text
kind = INCOME | EXPENSE | COMMITMENT
money
cropCycleId?
evidenceRef?
```

`services/finance-ledger` calculates crop/business net values from those entries.

This is **not** the same bounded concern as Invest capital commitments/deployments/recoveries.

### Decision

- operational crop economics remain in `finance-ledger`;
- productive-capital project facts remain in `agroway_invest` / `investment-portfolio`;
- readiness may reference both through evidence/projection;
- INT-1 must not force them into one universal ledger;
- no investor balance or partner account balance is stored in either one.

This prevents double counting and prevents an operational expense ledger from becoming an accidental financial-custody subsystem.

---

# 6. Current Control boundary is suitable for readiness exceptions

`ControlTowerException` already contains:

```text
exceptionId
 tenantId
 code
 severity
 state
 subjectRef
 reason
 fingerprint
 openedAt
 updatedAt
```

`ExceptionResolutionCase` already adds:

- domain classification;
- owner;
- SLA;
- root cause;
- evidence;
- timeline;
- optional AI draft suggestion;
- human-only commands;
- resolution evidence requirement;
- fail-closed critical suppression rule;
- `canonicalMutated = false`;
- `localOnly = true`.

`domainForException()` already classifies codes containing `PROJECT`, `INVESTMENT`, `LEDGER` or `CAPITAL` as `INVESTMENT`.

### Decision

Readiness alerts/exceptions must reuse `ControlTowerException`.

Do **not** introduce:

- `CapitalAlert`;
- `ReadinessAlertService`;
- `ReadinessExceptionEngine`;
- a parallel notification truth.

---

# 7. Source-of-truth hierarchy

INT-1 must make five layers explicit.

## Layer A — Agricultural truth

Canonical existing AGROWAY/FIELD/land/agronomy/harvest/impact entities.

Examples:

- producer;
- farm;
- plot;
- crop cycle;
- plan/activity;
- field evidence;
- monitoring facts;
- harvest;
- sale/settlement evidence;
- impact facts.

Capital Readiness references these. It does not recreate them.

## Layer B — Productive-capital project truth

Current Invest domain:

- InvestmentProject;
- requirement;
- budget;
- commitments;
- deployment records;
- recovery records;
- investment risks;
- evidence links;
- impact snapshot links.

## Layer C — Readiness canonical decision state

New additive semantics proposed for INT-1:

- CapitalPilotIntake;
- ReadinessAssessment;
- GateAssessment;
- ReadinessGap;
- readiness decision and decision digest.

These are business-decision records, not UI state.

## Layer D — Readiness projections

Rebuildable:

- EvidenceManifest;
- ProductiveRiskProfile;
- CapitalReadinessPackage;
- Control Tower readiness exceptions;
- portfolio/readiness dashboards.

## Layer E — UI workflow

Current CONTROL local resolution and future approved command bridge.

Resolving a UI case must not silently mutate canonical readiness state while the current `localOnly` boundary remains active.

---

# 8. REUSE / EXTEND / NEW_PROJECTION / DEFER / DO_NOT_TOUCH matrix

| Concept | Decision | Target | Reason |
|---|---|---|---|
| ProductiveInvestmentProject | `REUSE_AS_IS` | `InvestmentProject` | Existing productive-capital anchor |
| Producer/farm/plot/cycle | `REUSE_AS_IS` | canonical FIELD/land | No duplicate agricultural master |
| Capital requirement | `REUSE_AS_IS` | `requiredMinor` | Already modeled |
| Capital commitment | `REUSE_AS_IS` | `CapitalCommitment` | Already modeled |
| Capital deployment fact | `REUSE_AS_IS` | `CapitalDeployment` | Evidence fact, not payment rail |
| Capital recovery fact | `REUSE_AS_IS` | `CapitalRecovery` | Existing outcome evidence |
| Budget | `REUSE_AS_IS` | `InvestmentBudgetVersion` | Versioned and integrity-bound |
| Base risk item | `REUSE_AS_IS` | `InvestmentRisk` | Existing canonical project risk primitive |
| Existing evidence link | `REUSE_AS_IS` | `ProjectEvidenceLink` | General evidence relation |
| Existing coarse eligibility | `REUSE_AS_IS`, do not redefine | `EligibilityState` | Current project lifecycle dependency |
| CapitalPilotIntake | `EXTEND` | Invest bounded context | Canonical intake workflow metadata |
| GateAssessment G1–G9 | `EXTEND` | Invest bounded context | Canonical decision evidence/rationale |
| ReadinessAssessment | `EXTEND` | Invest bounded context | Versioned human business decision |
| ReadinessGap | `EXTEND` | Invest bounded context | Canonical actionable blocker/condition |
| ReadinessEvidenceRef | `EXTEND` | readiness contract | Gate-specific quality/provenance wrapper |
| ProductiveRiskProfile | `NEW_PROJECTION` | investment-portfolio | Multi-dimensional explanatory view |
| EvidenceManifest | `NEW_PROJECTION` | investment-portfolio | Rebuildable accepted/rejected evidence view |
| CapitalReadinessPackage | `NEW_PROJECTION` | export/package projection | Immutable assessment package projection |
| Readiness exceptions | `NEW_PROJECTION` | control-tower-projector | Existing Control exception engine |
| Exception case UX | `REUSE_AS_IS` initially | control-web | Existing human workflow |
| Canonical exception → gap command bridge | `DEFER` until authority approval | adapter/service later | Current UI is local-only |
| KYC/AML | `DEFER/EXTERNAL_REF` | financial partner | Not SANA INT-1 authority |
| Financial instrument | `DEFER/EXTERNAL_REF` | partner | Not readiness core |
| Disbursement authorization | `DO_NOT_TOUCH` | financial partner | SANA evidence cannot move money |
| Wallet/custody | `DO_NOT_TOUCH` | none | Out of scope |
| Public investor marketplace | `DEFER` | later regulated partner capability | Not INT-1 |
| Automated investment recommendation | `DO_NOT_TOUCH` | none | Human/regulated boundary |
| Universal credit score | `DO_NOT_TOUCH` | none | Use explanatory vector instead |
| Tokenization | `DO_NOT_TOUCH` | none | No current product need |
| Carbon token/credit | `DO_NOT_TOUCH` | none | Separate methodology/regulatory domain |

---

# 9. Why no new workspace

`NEW_WORKSPACE_REQUIRED = NO` for INT-1.

Reasons:

1. Readiness belongs semantically to the existing Invest bounded context.
2. Invest contracts already own project/budget/risk/evidence/eligibility vocabulary.
3. `investment-portfolio` is now physically materialized and is the natural deterministic service surface.
4. `control-tower-projector` is physically materialized and is the natural projection surface.
5. CONTROL already owns exception workflow.
6. New workspace would create orchestration/versioning overhead before real pilot evidence justifies a separate bounded context.
7. The architecture should earn a split through scale, not predict one prematurely.

A later dedicated SANA Capital application can still exist as a **surface** without creating a duplicate domain source of truth.

---

# 10. CapitalPilotIntake

Proposed canonical type:

```text
CapitalPilotIntake
├── intakeId
├── tenantId
├── projectId
├── intakeVersion
├── sourceType
├── sourceRef
├── originatorRef?
├── consentSetRef?
├── dataPackVersion
├── state
├── createdAt
├── updatedAt
└── supersedesIntakeId?
```

Suggested `sourceType`:

```text
PRODUCER_DIRECT
SANA_DIAGNOSTIC
OFFTAKER
FINANCIAL_PARTNER
COOPERATION_PROGRAM
PUBLIC_PROGRAM
INTERNAL_PIPELINE
```

Suggested state machine:

```text
CREATED
  ↓
CANONICAL_REUSE_SCAN
  ↓
DATA_COMPLETION
  ↓
EVIDENCE_VALIDATION
  ↓
ASSESSMENT_READY
  ↓
UNDER_ASSESSMENT
  ↓
GAP_REMEDIATION ─────┐
  ↓                  │
HUMAN_REVIEW         │
  ├─ CAPITAL_READY   │
  ├─ READY_WITH_CONDITIONS
  ├─ NOT_READY       │
  └─ REASSESSMENT_REQUIRED ─┘

Any non-terminal phase may also become PAUSED or WITHDRAWN.
```

### Important

Do not put producer/farm/plot/cycle copies in this record. Resolve productive context from `InvestmentProject.productionRef`.

---

# 11. ReadinessAssessment

Proposed canonical, versioned business-decision record:

```text
ReadinessAssessment
├── assessmentId
├── tenantId
├── projectId
├── version
├── intakeVersion
├── projectSnapshotRef
├── productivePlanRef/version?
├── approvedBudgetVersion
├── evidenceManifestDigest
├── riskProfileDigest
├── gates[]
├── blockingGapRefs[]
├── conditionGapRefs[]
├── evidenceCoverageBps
├── decision
├── rationale
├── reviewerRef
├── reviewedAt
├── methodologyVersion
└── digestSha256
```

Decision vocabulary:

```text
NOT_CAPITAL_READY
CAPITAL_READY_WITH_CONDITIONS
CAPITAL_READY
REASSESSMENT_REQUIRED
```

### Hard boundary

`CAPITAL_READY` means:

> the productive project has passed SANA's defined readiness policy at a specific evidence/version point.

It does **not** mean:

- financing approved;
- investment recommended;
- funds committed;
- funds disbursed;
- repayment guaranteed;
- return guaranteed.

---

# 12. Readiness is not the same as current EligibilityState

Current runtime has:

```text
EligibilityState = NOT_EVALUATED | ELIGIBLE | INELIGIBLE
```

`InvestmentProject.state = APPROVED` currently requires `eligibility === ELIGIBLE`.

INT-1 must **not silently redefine** that existing semantic.

### Compatibility strategy

Phase INT-1A:

- keep existing eligibility untouched;
- calculate readiness independently;
- no readiness decision automatically mutates `InvestmentProject.eligibility`.

Phase INT-1B, only after explicit policy approval:

```text
ReadinessAssessment
        ↓ explicit policy adapter
EligibilityResult
        ↓ existing applyEligibility()
InvestmentProject.eligibility
```

The adapter must be explicit, versioned and tested. No hidden coupling.

---

# 13. G1–G9 readiness gates

Canonical gate identifiers:

```text
G1_ACTOR
G2_ASSET
G3_AGRONOMY
G4_BUDGET
G5_MARKET
G6_RISK
G7_TRACEABILITY
G8_IMPACT
G9_FINANCIAL_STRUCTURE
```

Gate result vocabulary:

```text
PASS
PASS_WITH_CONDITIONS
INCOMPLETE
BLOCKED
NOT_APPLICABLE
```

Each gate must produce:

```text
GateAssessment
├── gateId
├── result
├── rationale
├── evidenceRefs[]
├── confidence
├── blockingGapRefs[]
├── conditionGapRefs[]
├── assessedAt
├── assessedBy
└── methodVersion
```

## G1 — Actor / execution capacity

Question:

> Is there an identifiable producer/organization with sufficient authority and execution capacity for the proposed project?

Potential evidence:

- canonical organization/producer identity;
- roles/responsibilities;
- operational history;
- prior cycle execution evidence;
- legal/contractual identity reference when required;
- technical responsible party.

INT-1 is not KYC/AML. Regulated identity checks remain a partner responsibility where applicable.

## G2 — Productive asset / farm scope

Question:

> Is the productive asset identifiable, scoped and linked to canonical farm/plot/cycle records?

Evidence:

- producer/farm/plot/cycle canonical references;
- geospatial/land evidence already supported by AGROWAY;
- productive area;
- tenure/use evidence reference when materially necessary.

No second land registry is created.

## G3 — Agronomic logic

Question:

> Is there a technically coherent productive plan for the crop/context?

Evidence may include:

- current crop cycle;
- agronomic plan;
- soil/water/nutrition/health findings;
- known constraints;
- technical review;
- relevant monitoring facts.

AI may summarize or draft; human agronomic authority remains authoritative.

## G4 — Budget and use of funds

Question:

> Is there an approved, internally coherent budget linked to the productive plan and capital requirement?

Reuse:

- `InvestmentBudgetVersion`;
- approved budget version;
- `requiredMinor`;
- project currency.

Future readiness may also require budget-line ↔ productive-purpose traceability, but INT-1 should not create a payment rail.

## G5 — Market pathway

Question:

> Is there a plausible route from production to buyer/market?

Evidence:

- buyer intent;
- commercial history;
- purchase order/offtake reference when available;
- quality specification;
- delivery window;
- price mechanism evidence;
- market-risk explanation.

A buyer reference mitigates uncertainty; it does not guarantee a sale.

## G6 — Risk

Question:

> Are material productive, agronomic, climate, operational, financial, market and compliance risks identified and managed to the readiness policy threshold?

Reuse `InvestmentRisk` for canonical project risks.

The ProductiveRiskProfile is a projection over these and other evidence, not a new risk ledger.

## G7 — Traceability

Question:

> Can SANA/AGROWAY trace the relevant relationship between project, plan, activities, evidence and outcomes?

Evidence:

- canonical productive scope;
- activity/evidence coverage;
- inventory/application lineage where relevant;
- traceability replay/passport evidence;
- data quality/provenance.

## G8 — Impact

Question:

> Is there a defensible impact hypothesis and baseline/measurement plan appropriate to the project?

Evidence:

- impact baseline/snapshot;
- metric definitions;
- methodology/version;
- evidence confidence;
- social/environmental objectives.

A compelling impact story never compensates for productive inviability.

## G9 — Financial structure compatibility

Question:

> Is the project information structured enough to be presented to the intended partner/instrument without SANA pretending to be that regulated financial rail?

Evidence may include:

- capital requirement;
- budget;
- timing/milestones;
- expected productive cash-flow assumptions;
- partner/instrument reference;
- repayment/revenue-share logic reference if applicable;
- required partner data completeness.

INT-1 does not execute or approve an instrument.

---

# 14. ReadinessGap

A readiness gap must be canonical because it can change the readiness decision and drive real remediation work.

Proposed:

```text
ReadinessGap
├── gapId
├── tenantId
├── projectId
├── assessmentVersion
├── gateId
├── code
├── severity
├── blocking
├── state
├── description
├── sourceRef
├── ownerRef?
├── dueAt?
├── requiredEvidenceKinds[]
├── resolutionEvidenceRefs[]
├── openedAt
├── resolvedAt?
├── resolvedBy?
└── resolutionNote?
```

Suggested gap state:

```text
OPEN
IN_REMEDIATION
EVIDENCE_SUBMITTED
RESOLVED
WAIVED
SUPERSEDED
```

`WAIVED` must require an explicit human authority and rationale; it cannot be an AI action.

---

# 15. Remediation work must reuse FIELD tasks where possible

Do not build a new Capital task manager.

If a gap requires field action, the preferred relationship is:

```text
ReadinessGap
   ↓ remediationRef
existing AGROWAY activity/task
   ↓ execution
field evidence
   ↓
readiness reassessment
```

For non-field work, a lightweight action reference may be needed later, but not a parallel generic workflow system in INT-1.

---

# 16. ReadinessEvidenceRef

Current `ProjectEvidenceLink` intentionally uses broad evidence kinds:

```text
AGRONOMIC
FINANCIAL
MARKET
LEGAL
FIELD
IMPACT
```

That is useful and should remain stable.

G1–G9 need richer evidence metadata without breaking that primitive.

Proposed readiness wrapper/projection:

```text
ReadinessEvidenceRef
├── evidenceRef
├── sourceKind
├── gateIds[]
├── role
├── observedAt?
├── validAt?
├── provenanceRef
├── digestSha256?
├── quality
├── confidence
├── freshness
├── accepted
└── rejectionReason?
```

Suggested `quality`:

```text
VERIFIED
SUPPORTED
ESTIMATED
UNVERIFIED
```

Suggested source nature:

```text
USER_REPORTED
DOCUMENT
PHOTO
LAB_RESULT
SENSOR
AGROWAY_EVENT
TECHNICAL_OBSERVATION
CALCULATED
PARTNER_REFERENCE
```

This preserves the established SANA evidence philosophy: evidence quality and uncertainty stay visible.

---

# 17. EvidenceManifest is a projection, not another evidence database

`EvidenceManifest` should be rebuilt from canonical references and readiness evidence rules.

Proposed:

```text
EvidenceManifest
├── manifestId
├── tenantId
├── projectId
├── assessmentVersion
├── asOf
├── methodologyVersion
├── accepted[]
├── rejected[]
├── coverageByGate
├── totalCoverageBps
├── limitations[]
└── digestSha256
```

Important:

- accepted/rejected evidence must be explicit;
- stale evidence must not silently count;
- cross-tenant evidence must fail closed;
- digest binds the exact evidence context;
- raw provider credentials/payloads are not part of the manifest;
- a missing fact remains a gap, not an invented estimate.

The existing Copilot evidence boundary provides a strong pattern for provenance/freshness/digest discipline, but INT-1 should not make readiness depend on AI.

---

# 18. ProductiveRiskProfile is a vector, not a magic score

Do not create `SANA Credit Score` in INT-1.

Proposed dimensions:

```text
PRODUCER
OPERATION
AGRONOMY
DATA
FINANCIAL
MARKET
CLIMATE
TRACEABILITY
MANAGEMENT
```

Each dimension:

```text
RiskDimension
├── dimension
├── state
├── severity
├── trend
├── evidenceRefs[]
├── confidence
├── principalDrivers[]
├── mitigations[]
├── unresolvedRiskRefs[]
└── asOf
```

Possible `state`:

```text
FAVORABLE
WATCH
LIMITING
CRITICAL
INDETERMINATE
```

The profile may eventually expose a summary tier, but the canonical value is the explanatory vector and its evidence.

A financer can understand *why* risk exists instead of trusting a black-box number.

---

# 19. CapitalReadinessPackage

This is the core portable output of INT-1.

It should answer:

1. Who/what is the productive project?
2. What productive scope is being financed?
3. How much capital is required and for what?
4. What evidence supports the plan?
5. What are the principal risks?
6. What is missing?
7. Is the project SANA-ready under the selected policy/version?
8. What market route exists?
9. What impact hypothesis/baseline exists?
10. What limitations and uncertainty remain?

Proposed projection:

```text
CapitalReadinessPackage
├── packageId
├── tenantId
├── projectId
├── assessmentId/version
├── generatedAt
├── projectSummary
├── productionScopeRefs
├── capitalRequirement
├── approvedBudgetRef
├── evidenceManifestRef/digest
├── productiveRiskProfileRef/digest
├── gates[]
├── openConditions[]
├── marketSummary
├── impactSummary
├── financialStructureSummary
├── decision
├── limitations[]
├── provenance[]
└── packageDigestSha256
```

It is a **versioned projection**. If a project changes materially, create a new package version/digest; do not mutate history invisibly.

---

# 20. Capital Passport relationship

Strategic `SANA Capital Passport` should initially be the permissioned presentation of `CapitalReadinessPackage` plus later monitoring/settlement evidence.

INT-1 does not need a separate Passport database.

Conceptually:

```text
CapitalReadinessPackage
        ↓ authorized projection
Capital Passport — readiness phase
        ↓ later project execution
Capital Passport — active monitoring phase
        ↓ later closure
Capital Passport — settlement/impact/learning phase
```

The existing AGROWAY traceability/passport architecture should be reused for projection patterns and access discipline, not duplicated.

---

# 21. Control Tower readiness exceptions

Readiness gaps become derived Control exceptions.

Canonical truth:

`ReadinessGap`

Derived projection:

`ControlTowerException`

Example:

```text
ReadinessGap(
  gate = G5_MARKET,
  code = MARKET_PATHWAY_INCOMPLETE,
  blocking = true
)
       ↓
ControlTowerException(
  code = CAPITAL_READINESS_G5_MARKET_BLOCKED,
  subjectRef = project:<projectId>,
  severity = CRITICAL,
  fingerprint = tenant:code:project
)
```

Suggested exception families:

```text
CAPITAL_READINESS_G1_ACTOR_*
CAPITAL_READINESS_G2_ASSET_*
CAPITAL_READINESS_G3_AGRONOMY_*
CAPITAL_READINESS_G4_BUDGET_*
CAPITAL_READINESS_G5_MARKET_*
CAPITAL_READINESS_G6_RISK_*
CAPITAL_READINESS_G7_TRACEABILITY_*
CAPITAL_READINESS_G8_IMPACT_*
CAPITAL_READINESS_G9_FINANCIAL_STRUCTURE_*
CAPITAL_READINESS_EVIDENCE_STALE
CAPITAL_READINESS_REASSESSMENT_REQUIRED
```

No new exception table is needed.

---

# 22. Exception resolution cannot yet mutate readiness canon

Current `ExceptionResolutionCase` deliberately sets:

```text
canonicalMutated = false
localOnly = true
```

Therefore a user clicking RESOLVE in current CONTROL can resolve the local case representation, but INT-1 must not interpret that as a canonical `ReadinessGap` resolution.

Future safe flow:

```text
Control case
  ↓ human adds evidence/root cause
command bridge
  ↓ explicit permission
ResolveReadinessGap / SubmitGapEvidence
  ↓ Invest domain
new/revised ReadinessAssessment
  ↓ projector
Control exception closes/reopens deterministically
```

That bridge is a **later authority slice**, not D0.

---

# 23. AI authority boundary

INT-1 may use AI only for advisory work such as:

- summarize accepted evidence;
- identify missing information candidates;
- compare project versions;
- draft an investment/readiness memo;
- explain a risk driver;
- draft remediation options.

AI may not:

- set `CAPITAL_READY` as final authority;
- approve an InvestmentProject;
- approve a budget;
- register a capital commitment as if money exists;
- deploy capital;
- release a partner disbursement;
- waive a blocking gap;
- suppress a critical readiness exception;
- certify impact;
- recommend an investment as regulated advice;
- issue a pilot certificate.

Existing Copilot `DRAFT_SUGGESTION + requiresHumanApproval` remains the correct pattern.

---

# 24. Financial-partner boundary

INT-1 prepares and monitors productive evidence. It does not become the financial rail.

Future partner integration should use references such as:

```text
FinancialPartnerRef
KycStatusRef
InstrumentRef
CommitmentRef
DisbursementRef
SettlementRef
```

SANA/AGROWAY should store the minimum necessary partner references and signed identifiers, not raw banking/payment credentials.

Financial partner authority:

- KYC/AML where applicable;
- investor/funder onboarding;
- instrument formalization;
- legal commitment;
- custody/collection where applicable;
- disbursement authority;
- settlement execution.

SANA authority:

- productive diagnostic;
- agronomic/operational evidence;
- readiness assessment under SANA methodology;
- monitoring;
- traceability;
- impact measurement under defined methodology;
- project information package.

---

# 25. Proposed canonical events — candidate only

Current Invest event names remain unchanged.

The following are **candidate** future events; D0 does not add them:

```text
CapitalPilotIntakeCreated
CapitalPilotIntakeStateChanged
CapitalReadinessAssessmentStarted
CapitalReadinessGateEvaluated
CapitalReadinessGapOpened
CapitalReadinessGapStateChanged
CapitalReadinessDecisionRecorded
CapitalReadinessReassessmentRequired
CapitalReadinessPackageProjected
```

### Canonical-event rule

Use a Domain Event only when the fact is:

- business-significant;
- durable;
- auditable;
- consumed by another bounded process;
- semantically stable enough to version.

Do **not** create events for every UI click, temporary score calculation or rendered card.

`EvidenceManifestProjected`, `ProductiveRiskProfileProjected`, and dashboard recomputations can remain projection/audit events unless later integration needs justify canonical semantics.

---

# 26. Future command candidates — not implemented in D0

Potential future commands:

```text
CreateCapitalPilotIntake
ChangeCapitalPilotIntakeState
StartReadinessAssessment
EvaluateReadinessGate
OpenReadinessGap
SubmitReadinessGapEvidence
ResolveReadinessGap
WaiveReadinessGap
RecordReadinessDecision
RequireReadinessReassessment
```

Human authority must be explicit on:

- final gate overrides;
- waiver;
- final readiness decision;
- any adapter into existing eligibility/project approval.

---

# 27. Persistence strategy after D0 approval

No migration is added now.

If persistence is approved, use the **next available migration number at implementation time**. Do not pre-reserve a number in this document.

Candidate additive tables under `agroway_invest`:

```text
capital_pilot_intake
readiness_assessment
readiness_gate_assessment
readiness_gap
readiness_package_manifest   optional, only if package persistence is needed
```

Prefer append-only/versioned assessment records.

Suggested integrity requirements:

- RLS on every table;
- tenant + project composite FKs;
- assessment version uniqueness per project;
- gate uniqueness per assessment/gateId;
- gap belongs to same tenant/project/assessment;
- valid state vocabularies;
- blocking/waiver consistency;
- SHA-256 digest constraints where stored;
- reviewedAt/reviewer required for final decisions;
- `CAPITAL_READY` impossible with unresolved blocking gaps;
- no package can bind to a non-final assessment;
- no readiness row can create a new producer/farm/plot/cycle identity.

---

# 28. Data contract strategy

Preferred future `readiness.ts` should contain only:

- stable readiness vocabulary;
- immutable interfaces;
- deterministic input/output contracts;
- no database adapter;
- no UI strings;
- no provider SDK objects;
- no payment objects.

`investment-portfolio` should implement pure/deterministic rules first.

This allows INT-1 to be tested before persistence and prevents database design from becoming the product definition.

---

# 29. Evidence coverage

Do not confuse `readiness` with `coverage`.

A project can have:

- favorable known facts but poor evidence coverage;
- strong documentation but serious productive risk;
- incomplete evidence with no evidence of failure.

Therefore retain separate measures:

```text
Gate result
Evidence coverage
Evidence quality/confidence
Risk state
```

Suggested overall coverage:

```text
coverageBps = accepted required evidence weight / total required evidence weight
```

Exact weights must be policy/version specific; do not hard-code universal weights in D0.

---

# 30. Productive Risk Profile and current InvestmentRisk relationship

`InvestmentRisk` is a canonical item:

```text
riskId
code
title
severity
state
mitigation
ownerRef
```

`ProductiveRiskProfile` is a projection:

```text
many canonical risks
+ agronomic facts
+ data coverage
+ market facts
+ management history
+ traceability
→ explanatory risk vector
```

The profile must never create a second copy of each risk.

If a profile identifies a material new risk, a human-approved flow may later register an `InvestmentRisk` through the existing Invest domain.

---

# 31. Market/offtake relationship

INT-1 should not create a full marketplace.

Minimum D0 semantic need is a market-pathway evidence reference.

Later canonical entities may include:

```text
BuyerIntentRef
OfftakeAgreementRef
PurchaseOrderRef
QualityRequirementRef
PriceMechanismRef
DeliveryWindowRef
```

Whether those become AGROWAY contracts or external-partner references should be decided from the first pilot's real data, not invented now.

---

# 32. Impact relationship

Current Invest already supports `InvestmentImpactSnapshotLink`.

INT-1 should reuse it.

G8 should ask whether the project has an appropriate impact baseline/plan, not create a one-number impact score.

The readiness package may show:

```text
People
Production
Economics
Land/soil
Circularity
Water
Carbon — only where methodology supports it
```

Each material claim needs baseline, methodology, confidence and evidence.

Impact evidence never guarantees financial return.

---

# 33. Circularity/carbon boundary

Capital Readiness may reference future circularity or carbon evidence, but INT-1 does not create carbon credits/tokens.

Preferred evidence progression:

```text
physical material flow
→ measured application/use
→ outcome
→ defensible environmental calculation
→ claim review
```

Carbon calculations remain methodology/version/evidence bound.

---

# 34. Permissions / minimum necessary access

Existing identity roles include an investor-facing read pattern in the broader runtime, but INT-1 should define access by purpose, not by exposing all farm data.

Future principle:

- producer: own project/readiness/evidence;
- agronomist: productive context and required capital-readiness evidence, not unnecessary investor identity;
- SANA reviewer: assessment/gates/gaps;
- financial partner: authorized readiness/financial package and partner-required details;
- investor/funder viewer: authorized project/portfolio projection, not unrestricted producer private data;
- auditor: immutable evidence/provenance access as authorized;
- Impact reviewer: required impact evidence;
- AI: only evidence the actor is already authorized to access.

Story/photo/public consent must be separate from financing/readiness data authorization.

---

# 35. Portable productive history

INT-1 should strengthen, not trap, the producer's evidence history.

Long-term portable asset:

```text
Verified Productive History
├── cycles
├── plan/execution history
├── evidence coverage
├── production
├── cost/economic history
├── incidents/responses
├── commercialization
├── capital-use evidence
└── impact evidence where applicable
```

Readiness packages should reference this history through canonical sources.

Do not create a SANA-only black-box reputation score that the producer cannot understand.

---

# 36. First INT-1 vertical slice

Use one realistic Hass avocado productive project fixture before network/portfolio complexity.

Scenario:

```text
1 tenant
1 producer organization
1 farm
2 plots
1 active crop cycle per plot
1 InvestmentProject
1 declared capital requirement
1 approved budget
several existing InvestmentRisk items
existing project evidence links
1 impact snapshot link
market evidence reference
```

Expected flow:

```text
1. Reuse canonical project/production refs
2. Create intake
3. Build evidence manifest
4. Evaluate G1–G9 deterministically
5. Open blocking/conditional gaps
6. Build ProductiveRiskProfile
7. Human records final readiness decision
8. Build CapitalReadinessPackage
9. Project blocking gaps to ControlTowerException
10. Rebuild projection and obtain same deterministic result
```

No capital is actually moved.

---

# 37. Example acceptance outcome

Example only; not production policy:

```text
G1 ACTOR                 PASS
G2 ASSET                 PASS
G3 AGRONOMY              PASS_WITH_CONDITIONS
G4 BUDGET                PASS
G5 MARKET                INCOMPLETE
G6 RISK                  PASS_WITH_CONDITIONS
G7 TRACEABILITY          PASS
G8 IMPACT                PASS_WITH_CONDITIONS
G9 FINANCIAL_STRUCTURE   INCOMPLETE

blocking gaps:
- G5 buyer/market pathway evidence incomplete
- G9 partner instrument/data requirements incomplete

decision:
NOT_CAPITAL_READY
```

After new evidence and reassessment, a new assessment version may become `CAPITAL_READY_WITH_CONDITIONS`.

History is preserved rather than overwritten.

---

# 38. Test gates for the first implementation

INT-1 implementation should not be considered complete unless all applicable gates pass.

## Structural

- root 41-workspace persistence gate PASS;
- root `npm ci --ignore-scripts --offline` PASS;
- root strict TypeScript PASS;
- no new workspace unless architecture is explicitly reopened.

## Domain

- no duplicate agricultural master;
- project/tenant/currency fail closed;
- readiness versioning deterministic;
- `CAPITAL_READY` impossible with blocking gaps;
- coarse existing eligibility semantics unchanged;
- no hidden readiness → approval transition.

## Evidence

- cross-tenant evidence rejected;
- malformed/stale evidence handled explicitly;
- accepted vs rejected evidence visible;
- manifest digest deterministic;
- missing evidence produces a gap, not a fabricated value.

## Risk

- risk profile vector deterministic;
- no universal scalar required;
- critical unresolved risk blocks according to versioned policy.

## Control

- same canonical gaps rebuild the same active exception fingerprints;
- Control remains projection;
- current local resolution does not mutate canonical readiness.

## AI

- core readiness works with AI disabled;
- AI cannot finalize readiness;
- AI suggestions remain draft/human-reviewed;
- citations/evidence context required for AI explanation.

## Financial authority

- no wallet;
- no custody;
- no payment execution;
- no automated disbursement;
- no investment recommendation authority.

---

# 39. INT-1 implementation sequence after D0 approval

Do not jump directly to DB/UI.

Recommended sequence:

### INT1.1 — Contract vocabulary

Add `readiness.ts` with:

- gate vocabulary;
- intake contract;
- gap contract;
- assessment contract;
- evidence wrapper;
- risk profile projection contract;
- package projection contract.

No migration.

### INT1.2 — Deterministic domain rules

Extend `investment-portfolio` with pure functions:

- intake validation;
- evidence-manifest builder;
- gate evaluation policy interface;
- gap derivation;
- final decision guard;
- risk profile builder;
- readiness package builder.

### INT1.3 — Test fixture

Implement the Hass fixture and failure cases.

### INT1.4 — Control projection

Extend `control-tower-projector` to derive readiness exceptions from canonical gap snapshots.

### INT1.5 — Read-only CONTROL model

Add a read-only readiness model/workspace only after deterministic domain tests are green.

### INT1.6 — Persistence proposal

Only then draft migration/schema changes and adversarial RLS/integrity tests.

### INT1.7 — Canonical command bridge

Only after authority design is approved, connect approved human CONTROL actions back to Invest readiness commands.

---

# 40. What D0 explicitly defers

Not part of INT-1 D0:

- public retail fundraising;
- crowdfunding UI;
- investor wallet;
- custody;
- payment initiation;
- KYC/AML engine;
- tokenization;
- securities issuance;
- automatic partner disbursement;
- automatic investment recommendation;
- portfolio optimization using opaque AI;
- universal producer credit score;
- carbon credit issuance;
- financial partner adapter implementation;
- production-readiness claim.

---

# 41. Decision rights

For the future implementation, keep authorities separate.

```text
Agronomic authority
  → technical/agronomic decisions

Readiness reviewer authority
  → G1–G9/final SANA readiness decision

Impact authority
  → material impact claim approval

Financial partner authority
  → regulated instrument / money movement

Data/security authority
  → access, tenant isolation, provenance

AI
  → advisory only
```

`Capital Authority ≠ Agronomic Authority` remains a hard governance rule.

---

# 42. D0 acceptance matrix against Issue #22

| Issue #22 acceptance | D0 result |
|---|---|
| REUSE/EXTEND/NEW_PROJECTION/DEFER/DO_NOT_TOUCH matrix | `SATISFIED_IN_DESIGN` |
| Locate CapitalPilotIntake | existing Invest bounded context, additive contract | 
| Locate ReadinessAssessment | existing Invest bounded context, additive canonical record |
| Locate ReadinessGap | existing Invest bounded context, canonical blocker/condition |
| Locate EvidenceManifest | deterministic projection |
| Locate ProductiveRiskProfile | deterministic explanatory projection |
| Locate CapitalReadinessPackage | versioned deterministic projection/export |
| Avoid duplicate agricultural masters | `HARD_INVARIANT` |
| Decide new workspace | `NO` |
| Decide event semantics | candidate canonical events separated from projection/audit events |
| Map to ControlTowerException | derived projection from canonical gaps |
| Preserve local-review/canonical boundary | `YES`; current `localOnly/canonicalMutated=false` retained |
| Define migration strategy | additive future migration only after D0 approval |
| Identify persistence blocker | blocker #24 resolved by PR #28; root now materially green |
| Define INT-1 vertical slice/gates | Hass fixture + structural/domain/evidence/risk/control/AI/authority gates defined |

---

# 43. D0 approval statement candidate

If this map is approved, the approved technical statement should be:

> CAPITAL_READINESS INT-1 will be implemented additively inside the existing AGROWAY Invest bounded context, reusing InvestmentProject, budget, risk, evidence and Control Tower primitives. Readiness introduces versioned G1–G9 assessment/gap semantics and deterministic evidence/risk/package projections without creating a new agricultural master, new workspace, new alert engine, payment rail, custody layer, or AI decision authority. Existing eligibility/project-state semantics remain unchanged until a separately approved compatibility policy exists.

Approval of this statement authorizes **INT1.1 contract/pure-rule implementation only**, not database migration, financial partner integration, money movement, or production release.

---

# 44. Final D0 conclusion

The correct next engineering move is now clear.

We do **not** need to invent SANA Capital from zero.

The existing AGROWAY runtime already has the strongest underlying primitives:

```text
productive identities
+ crop-cycle execution
+ finance/economic facts
+ Invest project
+ budget
+ risk
+ evidence
+ impact link
+ Control Tower
+ human exception workflow
+ provenance-aware Copilot boundary
```

INT-1 should add the missing connective tissue:

```text
INTAKE
→ EVIDENCE MANIFEST
→ G1–G9
→ READINESS GAPS
→ PRODUCTIVE RISK PROFILE
→ HUMAN READINESS DECISION
→ CAPITAL READINESS PACKAGE
→ CONTROL EXCEPTIONS
```

The moat is not a financing button.

It is the ability to make a productive project legible through a traceable relationship between:

```text
PERSON / ORGANIZATION
↔ FARM / PLOT / CYCLE
↔ PLAN / BUDGET
↔ ACTIVITY / EVIDENCE
↔ RISK
↔ MARKET
↔ IMPACT
↔ CAPITAL FACTS
↔ OUTCOME
```

That is the technical foundation for SANA's longer-term thesis of **agricultura financiable por evidencia**, while preserving the critical statement:

> SANA reduce la asimetría de información y mejora la trazabilidad del proyecto; no elimina el riesgo agrícola ni financiero y no sustituye la autoridad del socio financiero regulado.
