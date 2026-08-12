# SANA Capital Platform — Pilot Data Delta v1

Status: `STRATEGIC_CANON_DRAFT`

Purpose: preserve a small set of platform-relevant data in the **first real Hass pilot** so SANA can later add matching, repeat financing, buyer integration and project origination without redesigning the productive record.

This document does **not** authorize marketplace/public investment functionality.

---

## 1. Principle

Design the data now; build the marketplace later.

The first pilot should remain operationally simple, but it should not discard information that becomes expensive to reconstruct after project closure.

---

## 2. Add to ProductiveInvestmentProject metadata

```text
originatorRef?                 // who introduced/structured the opportunity
originatorType?                // SANA | GREENATICS | PRODUCER | ASSOCIATION | BUYER | TECHNICAL_PARTNER | PROGRAM | OTHER
priorProductiveProjectRefs[]   // known prior SANA/AGROWAY project/cycle history
priorFinancedProjectRefs[]     // only verified financed-history references
repeatProjectIntent?           // UNKNOWN | YES | NO
marketPathwayRefs[]
capitalPartnerProgramRef?
```

None of these fields creates eligibility by itself.

---

## 3. Add originator evidence

For the first pilot capture:

```text
ProjectOriginationRecord
├── projectId
├── originatorType
├── originatorIdentityRef
├── relationshipToProducer
├── introducedAt
├── declaredCommercialInterest
├── conflictDisclosure
└── evidenceRef
```

Why now:

A future origination network needs to distinguish project quality from referral volume and preserve conflicts from the beginning.

---

## 4. Strengthen buyer/market data

The Hass Data Pack already requires a market pathway. Preserve enough granularity for later buyer-demand matching.

```text
BuyerMarketProfile
├── buyerRef
├── product / variety
├── quality requirements
├── expected volume range
├── delivery windows
├── price mechanism
├── payment terms
├── evidence state
├── purchase history refs[]
├── buyer intent/offtake refs[]
└── collection history refs[]
```

Evidence states remain distinct:

`OPEN_MARKET`, `BUYER_IDENTIFIED`, `PURCHASE_HISTORY`, `BUYER_INTENT`, `OFFTAKE_AGREEMENT`, `PURCHASE_ORDER`, `ACTUAL_SALE`, `ACTUAL_COLLECTION`.

Do not infer guaranteed demand.

---

## 5. Preserve repeat-financing history

Do not create a credit score.

Capture verified history as facts:

```text
ProductiveCapitalHistory
├── producerId
├── projectId
├── cycleId
├── financingOccurred
├── externalCapitalAmount?     // if sharing/contract allows
├── partnerRef?
├── deploymentCompletion
├── capitalTraceabilityRatio
├── projectClosureState
├── realizedFinancialOutcomeRef?
├── exceptionCount
├── unresolvedCriticalExceptions
└── closedAt
```

This enables future `REPEAT_READY` assessments without rewriting old project history.

---

## 6. Preserve future funder-matching inputs

Do **not** ask the producer to complete an investor questionnaire.

Derive matching attributes from canonical project data where possible:

```text
ProjectMatchingProjection
├── crop
├── geography
├── productiveStage
├── capitalNeed
├── currency
├── expectedDurationRange
├── readinessState
├── evidenceCoverage
├── marketPathwayState
├── buyerConcentration
├── riskProfileVersion
├── impactPlanVersion
└── updatedAt
```

This is a projection, not a second database.

---

## 7. Preserve funding-opportunity publication controls

Even during the first private pilot store an explicit publication state.

```text
FundingOpportunityPublication
├── projectId
├── state
├── visibility
├── approvedAudience
├── approvedFields
├── consentRef
├── reviewedBy
└── reviewedAt
```

States:

`NOT_ELIGIBLE`, `PRIVATE_INTERNAL`, `PARTNER_ONLY`, `QUALIFIED_FUNDER_ONLY`, `PUBLIC_NOT_ENABLED`.

For the first pilot, default:

`PRIVATE_INTERNAL` or `PARTNER_ONLY`.

Public is not enabled by this schema.

---

## 8. Separate data-sharing consent

Do not treat one general consent as permission to publish a producer/project to future investors.

Capture separate scopes:

```text
TECHNICAL_SERVICE
CAPITAL_PARTNER_DILIGENCE
AUTHORIZED_FUNDER_VIEW
AUDITOR_VIEW
AGGREGATED_DEIDENTIFIED_LEARNING
CASE_STUDY_PUBLICATION
PUBLIC_OPPORTUNITY_PUBLICATION   // not enabled in first pilot
```

Each scope has:

`status + grantedAt + revokedAt? + policyVersion + evidenceRef`.

---

## 9. Add platform-relevant exception categories

Reuse Control Tower projection patterns.

Initial private pilot categories:

```text
CAPITAL_READINESS_GAP
MILESTONE_EVIDENCE_MISSING
DEPLOYMENT_LINEAGE_GAP
BUDGET_VARIANCE
PRODUCTIVE_DELAY
HARVEST_VARIANCE
BUYER_PATHWAY_DEGRADED
COLLECTION_DELAY
SETTLEMENT_DATA_GAP
IMPACT_EVIDENCE_GAP
```

Do not create a new alert engine.

---

## 10. Minimal first-Hass collection delta

The actual extra burden on the producer should be small.

Collect/confirm only:

1. who originated/introduced the project;
2. whether there is prior financed productive history and evidence for it;
3. whether the producer intends another cycle/project if this one succeeds;
4. buyer/market evidence at document-level granularity;
5. explicit data-sharing permissions for partner/funder views;
6. known conflicts/commercial relationships relevant to the project.

Everything else should be derived from the existing SANA/AGROWAY Data Pack.

---

## 11. What not to collect yet

Do not add:

- wallet addresses;
- token balances;
- blockchain keys;
- public-investor marketing profile;
- retail investor suitability data;
- public expected-return cards;
- social-media storytelling consent bundled with financing consent;
- speculative asset fields.

---

## 12. Acceptance

The first Hass project can close with enough structured information to later answer:

- who originated it?
- what productive history existed before funding?
- what buyer/market pathway was actually present?
- what capital/evidence exceptions occurred?
- what data could authorized capital actors see?
- what happened at closure?
- is there evidence for a repeat financed project?
- could the project have been matched to a future funder mandate without recollecting the whole operation?

This is the minimum future-proofing required by the platform business-model synthesis.