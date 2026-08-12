# SANA First Pilot Intake Workflow v1

Status: `STRATEGIC_CANON_DRAFT`

Owner boundary: SANA Product / Agronomy & Knowledge / Capital & Markets / Impact & Trust / AGROWAY Platform.

Purpose: define the operational intake workflow that converts one real Hass producer/project into a versioned SANA Capital Readiness assessment without duplicating AGROWAY data, overloading the producer, or implying financial approval.

---

## 1. Product objective

The intake must answer:

> What do we already know about this productive project, what is still unknown, what evidence is missing, who must resolve each gap, and is the project sufficiently structured to advance to a financial partner process?

The workflow ends at:

`CAPITAL_READY` or `NOT_CAPITAL_READY`.

It does not end at:

`FINANCING_APPROVED`, `FUNDED`, `INVESTED`, or `DISBURSED`.

---

## 2. Entry points

Supported entry paths:

1. `FROM_SANA_DIAGNOSTIC` — preferred.
2. `FROM_EXISTING_AGROWAY_ORG` — existing producer/farm/lot/cycle already in the system.
3. `FROM_GREENATICS_ORIGINATED_PROJECT` — originated through GREENATICS/project network.
4. `FROM_ASSOCIATION_OR_PROGRAM` — association, cooperative, public/cooperation project.
5. `MANUAL_INTERNAL` — exception path only.

Rule:

> Before asking a producer for any field, query the canonical SANA/AGROWAY record first.

---

## 3. Intake lifecycle

```text
INTAKE_CREATED
→ CANONICAL_REUSE_SCAN
→ PRODUCER_CONFIRMATION
→ TECHNICAL_COMPLETION
→ CAPITAL_DATA_COMPLETION
→ EVIDENCE_VALIDATION
→ READINESS_ASSESSMENT
→ GAP_REMEDIATION
→ HUMAN_REVIEW
→ CAPITAL_READY / NOT_CAPITAL_READY
```

Alternate states:

`PAUSED`, `WITHDRAWN`, `STALE_REASSESSMENT_REQUIRED`.

Every transition is versioned/auditable.

---

## 4. Canonical reuse scan

The system first attempts to populate:

```text
Organization
Producer
Farm
Lots
CropCycle
ProductivePlanVersion
Task/Activity history
Evidence
Inventory/application history
Costs
Harvest history
Sales/settlement history
Diagnostic findings
Unknowns
Impact baselines
Existing risk observations
Existing buyer/market evidence
```

Each field receives:

```text
REUSED_CANONICAL
REUSED_NEEDS_CONFIRMATION
MISSING
STALE
CONFLICTING
NOT_APPLICABLE
```

A producer is not asked to re-enter `REUSED_CANONICAL` data unless confirmation is materially required.

---

## 5. Intake record

```text
CapitalPilotIntake
├── intakeId
├── tenantId
├── organizationId
├── producerId
├── sourceType
├── sourceRef
├── originatorRef?
├── createdAt
├── createdBy
├── currentState
├── currentDataPackVersion
├── currentReadinessAssessmentVersion?
├── consentSetVersion
└── auditDigest
```

The intake is orchestration metadata; it does not duplicate the agricultural system of record.

---

## 6. Producer-facing workflow

The producer should see only what requires action.

### Step A — Confirm identity/project

Confirm:

- producer/organization;
- farm;
- lots;
- crop/cycle;
- project contact;
- relationship/authority to operate.

### Step B — Confirm capital need

Simple questions:

- What productive need requires capital?
- Approximate external capital needed?
- By what date?
- What contribution can the producer make?
- Has this project/cycle received financing before?

### Step C — Complete missing market facts

Examples:

- current buyer(s);
- historical buyer(s);
- purchase history;
- current intent/offtake evidence;
- expected sale window.

### Step D — Complete explicit missing evidence

Examples:

- quotation;
- analysis;
- buyer document;
- farm authority document;
- budget support;
- photo/evidence tied to a lot/cycle.

### Step E — Consent

Separate scopes:

`TECHNICAL_SERVICE`
`CAPITAL_PARTNER_DILIGENCE`
`AUTHORIZED_FUNDER_VIEW`
`AUDITOR_VIEW`
`AGGREGATED_DEIDENTIFIED_LEARNING`
`CASE_STUDY_PUBLICATION`

No public storytelling or future public investment publication is bundled into financing consent.

---

## 7. Analyst-facing workflow

The SANA analyst works from exceptions, not a giant form.

Workspace order:

```text
PROJECT CONTEXT
↓
KNOWN / UNKNOWN / STALE / CONFLICTING
↓
BLOCKING GAPS
↓
G1–G9
↓
RISK / EVIDENCE
↓
CAPITAL NEED / BUDGET
↓
MARKET PATHWAY
↓
IMPACT PLAN
↓
CONSENT / SHARING
↓
REVIEW HISTORY
```

Primary question:

> What prevents this project from becoming Capital Ready?

---

## 8. Data quality states

Reuse SANA epistemic quality patterns.

Knowledge state:

`KNOWN`, `UNKNOWN`, `NOT_APPLICABLE`, `ESTIMATED`.

Source:

`USER_REPORTED`, `DOCUMENT`, `PHOTO`, `LAB_RESULT`, `SENSOR`, `AGROWAY_EVENT`, `TECHNICAL_OBSERVATION`, `CALCULATED`.

Verification:

`VERIFIED`, `SUPPORTED`, `ESTIMATED`, `UNVERIFIED`.

Freshness:

`CURRENT`, `REVIEW_DUE`, `STALE`, `INVALIDATED`.

No missing field silently becomes zero, positive, PASS or favorable.

---

## 9. Unknown → remediation workflow

```text
UNKNOWN / MISSING / STALE
→ ReadinessGap
→ RemediationAction
→ Owner
→ Due date
→ RequiredEvidence
→ EvidenceSubmitted
→ Review
→ RESOLVED / UNRESOLVED / REJECTED
```

`ReadinessGap`:

```text
ReadinessGap
├── gapId
├── projectId
├── gate
├── severity
├── blocking
├── description
├── source
├── ownerRole
├── dueAt?
├── requiredEvidence[]
├── state
└── resolutionRef?
```

---

## 10. Reuse GREENATICS CONTROL

Do not build a separate readiness-alert engine.

Project deterministic readiness facts into Control Tower patterns.

Initial categories:

```text
CAPITAL_READINESS_GAP
CAPITAL_DATA_STALE
BUDGET_INCOMPLETE
BUDGET_VERSION_INVALIDATED
MARKET_EVIDENCE_MISSING
BUYER_PATHWAY_DEGRADED
TRACEABILITY_COVERAGE_INSUFFICIENT
RISK_REVIEW_REQUIRED
CONSENT_SCOPE_MISSING
IMPACT_BASELINE_MISSING
```

Target flow:

```text
Deterministic readiness fact
→ ControlTowerException
→ ExceptionResolutionCase
→ owner + root cause + evidence + timeline
→ human resolution
```

AI remains `DRAFT_SUGGESTION / ADVISORY_ONLY`.

---

## 11. G1–G9 computation

### G1 — Productive actor

Requires:

- identity/reference;
- operating responsibility;
- authority/permissions where needed;
- basic experience/capability evidence.

### G2 — Productive asset

Requires:

- farm identified;
- lots identified;
- productive area/scope;
- geospatial/operational traceability sufficient for pilot policy.

### G3 — Agronomic viability

Requires:

- crop/cycle identified;
- current productive state;
- defensible plan;
- material technical limitations documented;
- no unresolved technical blocker under pilot policy.

### G4 — Budget viability

Requires:

- versioned productive budget;
- external capital need;
- producer/other contribution separated;
- time-phased use-of-funds;
- contingency treatment;
- approval state.

### G5 — Market pathway

Requires:

- explicit channel/buyer route;
- evidence type;
- expected volume/window;
- payment/collection assumptions;
- concentration visibility.

### G6 — Risk visibility

Requires:

- productive risk profile reviewed;
- material agronomic/climate/operating/market/financial dependencies identified;
- unknown high-severity risks converted to gaps.

### G7 — Traceability readiness

Requires:

- farm/lot/cycle relationship;
- plan/activity/evidence workflow usable;
- minimum evidence coverage policy;
- no critical canonical data conflict.

### G8 — Impact hypothesis

Requires:

- explicit impact objectives;
- baseline or baseline gap;
- method/data type;
- no projected outcome represented as achieved.

### G9 — Financial-structure fit

For Capital Readiness this requires:

- intended financing route/partner role identified at least conceptually;
- project/instrument incompatibility not known;
- legal/financial authority is external/explicit;
- no assumption that SANA itself will custody/intermediate.

---

## 12. Gate result model

Each gate outputs:

```text
PASS
PASS_WITH_CONDITIONS
INCOMPLETE
BLOCKED
NOT_APPLICABLE
```

Plus:

```text
GateAssessment
├── gateId
├── state
├── rationale
├── evidenceRefs[]
├── confidence
├── blockingGapRefs[]
├── conditionRefs[]
├── assessedAt
├── assessedBy
└── methodVersion
```

No manual green/red flag is authoritative without the underlying assessment.

---

## 13. Productive Risk Profile intake

The first pilot stores explainable dimensions, not a credit score.

Minimum dimensions:

- management maturity;
- data coverage;
- traceability;
- agronomic state/uncertainty;
- execution history;
- productive economics/history;
- market visibility;
- buyer concentration;
- climate exposure;
- operational dependencies;
- capital-use history.

Every dimension stores:

`state + confidence + evidence + scope + date + methodVersion`.

---

## 14. Originator and conflict data

Capture the Platform Data Delta fields:

```text
ProjectOriginationRecord
├── originatorType
├── originatorIdentityRef
├── relationshipToProducer
├── introducedAt
├── declaredCommercialInterest
├── conflictDisclosure
└── evidenceRef
```

If GREENATICS/WONDERGREEN has a commercial role, disclose it.

Financing never implies mandatory WONDERGREEN purchase.

---

## 15. Market data for future matching

Capture/reuse:

```text
buyerRef
product/variety
qualityRequirements
expectedVolumeRange
expectedDeliveryWindow
priceMechanism
paymentTerms
purchaseHistoryRefs[]
buyerIntent/offtakeRefs[]
collectionHistoryRefs[]
```

This supports future `FunderMandate ∩ Project ∩ BuyerDemand` matching without re-collecting the project.

---

## 16. Capital Need screen

Show:

```text
Total productive cost
Producer cash contribution
Producer in-kind contribution [separate]
Buyer advance
Grant/program support
Other source
External capital required
Funding gap
```

Do not mix in-kind contribution with liquidity.

No expected investor return belongs in intake.

---

## 17. Evidence manifest

The assessment outputs a manifest:

```text
EvidenceManifest
├── projectId
├── version
├── items[]
│   ├── evidenceRef
│   ├── category
│   ├── scope
│   ├── sourceType
│   ├── verificationState
│   ├── freshness
│   ├── gateRefs[]
│   └── restrictedVisibility
├── coverage
├── verifiedCoverage
└── generatedAt
```

Coverage is not a risk score.

---

## 18. ReadinessAssessment

```text
ReadinessAssessment
├── assessmentId
├── projectId
├── version
├── dataPackVersion
├── productivePlanVersion
├── budgetVersion
├── riskProfileVersion
├── marketPathwayVersion
├── impactPlanVersion
├── consentSetVersion
├── gates[9]
├── blockingGaps[]
├── conditions[]
├── evidenceCoverage
├── decision
├── rationale
├── reviewer
├── reviewedAt
└── digest
```

Decisions:

`NOT_CAPITAL_READY`
`CAPITAL_READY_WITH_CONDITIONS`
`CAPITAL_READY`
`REASSESSMENT_REQUIRED`.

---

## 19. Human review

`CAPITAL_READY` requires a named human reviewer.

The review pack shows:

- identity/scope;
- G1–G9;
- blocking gaps;
- conditions;
- Productive Risk Profile;
- budget/capital need;
- market pathway;
- traceability/evidence;
- impact plan;
- consent/scopes;
- originator/conflicts;
- changes since previous assessment.

AI cannot finalize the decision.

---

## 20. CapitalReadinessPackage

After `CAPITAL_READY`, produce a structured handoff package:

```text
CapitalReadinessPackage
├── projectIdentity
├── readinessAssessmentRef
├── riskProfileRef
├── approvedBudgetRef
├── capitalNeedRef
├── marketPathwayRef
├── evidenceManifestRef
├── impactPlanRef
├── consent/sharing policy
├── originator/conflict disclosures
├── conditions
├── provenanceDigest
└── generatedAt
```

Output channels may later include UI, PDF and API.

The package state is:

`READY_FOR_FINANCIAL_PROCESS`.

Not `FINANCING_APPROVED`.

---

## 21. Staleness / invalidation

Trigger reassessment when a material input changes:

- productive plan superseded;
- budget superseded;
- cycle changed;
- buyer pathway materially degraded;
- critical incident;
- material agronomic change;
- evidence expired;
- consent revoked;
- financial-partner route changes materially;
- scope/farm/lot changes.

State becomes:

`REASSESSMENT_REQUIRED`.

Previous assessment remains immutable history.

---

## 22. First Hass vertical acceptance scenario

### Initial state

- producer + farm already exist;
- 2 lots;
- active Hass cycle;
- plan exists;
- budget incomplete;
- prior buyer history exists;
- no current buyer intent;
- one technical evidence item is stale;
- traceability coverage below pilot policy;
- no public-sharing consent.

Expected first assessment:

```text
G1 PASS
G2 PASS
G3 PASS_WITH_CONDITIONS
G4 BLOCKED
G5 INCOMPLETE
G6 PASS_WITH_CONDITIONS
G7 INCOMPLETE
G8 PASS_WITH_CONDITIONS
G9 INCOMPLETE

Decision = NOT_CAPITAL_READY
```

### Remediation

- budget approved;
- buyer evidence added;
- stale technical evidence replaced;
- FIELD evidence coverage completed;
- financing route/partner role identified;
- capital-partner sharing consent granted.

Expected second assessment:

`CAPITAL_READY` or `CAPITAL_READY_WITH_CONDITIONS` according to policy.

The first assessment must remain reconstructable.

---

## 23. Telemetry

Track:

```text
capital_intake_created
canonical_data_reused
producer_confirmation_completed
readiness_gap_created
readiness_gap_resolved
readiness_assessment_completed
capital_ready_review_requested
capital_ready_decision_recorded
capital_readiness_invalidated
capital_readiness_package_generated
```

Metrics:

- time to Capital Ready;
- producer-entered fields vs reused fields;
- blocking gaps/project;
- unknown resolution rate;
- analyst hours/project;
- agronomy review hours/project;
- producer reporting burden;
- evidence coverage;
- reassessment rate.

---

## 24. UX principle

Producer UX:

> Tell me only what I need to do next.

Analyst UX:

> Show me what prevents readiness.

Reviewer UX:

> Show me the evidence and changes material to the decision.

Partner UX:

> Show me a governed package; do not pretend SANA already made my financial decision.

---

## 25. Build sequence

Do not build all screens at once.

### INT-1

Canonical reuse scan + project identity + missing-data rail.

### INT-2

G1–G9 engine + ReadinessGap/RemediationAction.

### INT-3

Evidence manifest + Productive Risk Profile.

### INT-4

Human review + versioned ReadinessAssessment.

### INT-5

CapitalReadinessPackage + partner-scoped export.

### INT-6

Control Tower exception projection.

No funding execution belongs in these slices.

---

## 26. Product truth boundary

The first operational claim after this workflow is real should be:

> SANA can structure a productive agricultural project, identify what is known and unknown, resolve evidence gaps, and determine whether the project is sufficiently prepared to advance to an external financial process.

Do not claim:

- financing approved;
- guaranteed investment;
- guaranteed repayment;
- creditworthiness certified;
- regulated investment-platform status.