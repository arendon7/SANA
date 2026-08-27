# SANA Data Room Executive V177

## Claim Evidence Sufficiency Review Contract

Issue: #141

Parent branch: `demo/sana-dataroom-executive-v176`

Exact parent SHA: `af6d36e0af3ffb104e1bf5faca546c3de71c5f20`

V177 adds an exact claim-specific human evidence-sufficiency review reference layer on top of V176.

It does **not** add a system determination of truth or sufficiency.

## Why V177 exists

V173 established controlled provenance claims.

V174 wrapped each claim and proved that generic review/assurance context could not safely be inferred as claim-specific attestation or verification.

V175 added an explicit claim-specific attestation reference contract.

V176 added an explicit claim-specific external-verification reference contract with no `VERIFIED` state.

V177 addresses the next missing distinction: a human reviewer may need to state whether the currently referenced material is sufficient **for a declared review scope**, or whether more evidence is required.

That human review conclusion must remain separate from:

- claim truth;
- universal evidentiary sufficiency;
- reviewer identity or qualification verification;
- external verification;
- certification;
- due-diligence approval;
- eligibility;
- financing approval;
- investment recommendation or decision.

## Source contract

Schema:

`SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY_REVIEW_V1`

Global:

`__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY__`

Factory:

`__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY_V177_FACTORY__`

Baseline records: **0**.

This is deliberate:

`CONTRACT_AVAILABLE ≠ REVIEW_EXISTS`

## Allowed source states

Only two states exist:

1. `SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY`
2. `ADDITIONAL_EVIDENCE_REQUIRED_REFERENCE_ONLY`

The source contract contains no `VERIFIED`, `APPROVED`, `ELIGIBLE` or `INVESTABLE` state.

### Sufficient for declared review scope

This means only that an explicit human review reference records that conclusion for the declared review scope.

It does not mean:

- the claim is true;
- all evidence that could ever be relevant exists;
- another reviewer or review scope would reach the same conclusion;
- the project passed due diligence;
- the project is eligible for capital;
- financing is approved.

### Additional evidence required

This means only that the referenced human review indicates additional evidence is required for that review scope.

It does not mean:

- the claim is false;
- the project is defective;
- the project has elevated investment risk;
- due diligence failed;
- the project is ineligible;
- financing must be denied.

## Source record shape

A normalized source record can carry:

- `reviewRef`;
- `claimId`;
- `claimEnvelopeRef`;
- `locatorKeys`;
- `lotId`;
- `reviewerRef`;
- `reviewCaseRef`;
- `reviewScopeRef`;
- `requestedEvidenceRefs`;
- `observedAt`;
- `reviewState`;
- provenance.

The source record permanently carries false authority/truth fields, including:

- `claimTruthVerified=false`;
- `reviewerIdentityVerified=false`;
- `reviewerQualificationVerified=false`;
- `reviewerIndependenceVerified=false`;
- `evidentiarySufficiencyDetermined=false`;
- `externalVerificationVerified=false`;
- `certificationValidityVerified=false`;
- `dueDiligenceApproved=false`;
- `eligible=false`;
- `financingApproved=false`;
- `decisionAuthority=false`.

Unknown input fields such as `approved:true`, `verified:true`, `eligible:true` or `score:100` are not promoted into the normalized contract.

## Executive adapter

Schema:

`SANA_DATAROOM_EXECUTIVE_EXACT_EVIDENCE_SUFFICIENCY_REVIEW_V1`

Rule:

`CLAIM_EVIDENCE_SUFFICIENCY_EXACT_V1`

The adapter composes directly over V176.

A source record may affect an envelope only when all required exact relation conditions hold:

- source schema exact;
- `claimId` exact;
- `claimEnvelopeRef` exact;
- allowed review state;
- each declared locator belongs to the parent claim locator set;
- declared lot, when present, matches the selected lot;
- all exact-claim candidates use one review state;
- no exact-claim candidate is contradictory.

The adapter reads `records()` directly and does not trust a source-provided `forClaim()` helper.

## Executive mapping

Source state:

`SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY`

maps to:

`SUFFICIENCY_REVIEW_REFERENCE_ONLY`

Source state:

`ADDITIONAL_EVIDENCE_REQUIRED_REFERENCE_ONLY`

maps to:

`ADDITIONAL_EVIDENCE_REQUIRED_AT_REVIEW`

No exact source record or unavailable source maps to:

`NOT_DETERMINED`

## Critical design choice

Even after a valid sufficient-for-declared-scope review reference is linked:

`evidentiarySufficiencyDetermined=false`

This field remains false because V177 does not give the software system authority to determine evidentiary sufficiency.

The human conclusion is carried separately in `evidenceSufficiencyReview.state`.

That prevents a human reference from silently becoming automated decision authority.

## Conflict handling

V177 fails closed when any exact-claim candidate is contradictory.

Examples:

- wrong envelope reference;
- locator outside the claim;
- lot contradiction;
- disallowed state;
- duplicate `reviewRef`;
- mixed sufficient/additional-evidence states;
- valid plus contradictory exact-claim records.

The resulting envelope remains:

`evidenceSufficiencyReview.state = NOT_DETERMINED`

and exposes:

`CLAIM_EVIDENCE_SUFFICIENCY_CANDIDATE_CONFLICT`

with categorical conflict reasons.

No numeric conflict severity or score is produced.

## Preservation of previous layers

V177 must preserve V175 attestation references and V176 external-verification references exactly.

A V177 review conclusion does not replace, reinterpret or promote either layer.

The chain is now:

`V173 controlled claim`

→ `V174 immutable claim envelope`

→ `V175 exact attestation reference`

→ `V176 exact external-verification reference / explicitly-not-verified state`

→ `V177 exact evidence-sufficiency review reference`

Each layer has its own semantics and authority boundary.

## Authority model

V177 keeps the following authorities false:

- canonical mutation;
- financial mutation;
- evidence-sufficiency review authority;
- evidentiary sufficiency authority;
- claim truth authority;
- reviewer identity authority;
- reviewer qualification authority;
- reviewer independence authority;
- external verification authority;
- provider accreditation authority;
- certification authority;
- due-diligence approval authority;
- eligibility authority;
- financing approval authority;
- decision authority;
- offer / solicitation / brokerage;
- custody / payment / disbursement.

AI remains `ADVISORY_ONLY`.

## Summary semantics

Counts are categorical only:

- sufficient-for-declared-scope references;
- additional-evidence-required references;
- not determined;
- conflicts;
- explicit review references.

They are explicitly:

`NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE`

No aggregate investment, project, credit, readiness or evidence score is created.

## Read-only review surface

`/sana-v3-dataroom-executive-v177.html`

shows:

- lot filter;
- section filter;
- review-state filter;
- source-contract state and record count;
- V175 attestation state;
- V176 external-verification state;
- V177 evidence-sufficiency review state;
- exact review refs;
- reviewer/case/scope refs;
- requested evidence refs;
- fail-closed diagnostics.

The page has no forms, storage writes, network writes or canonical mutation path.

## Adversarial validation

The validator includes:

- exact sufficient-for-scope positive case;
- exact additional-evidence-required case;
- rejection of `VERIFIED`, `APPROVED`, `ELIGIBLE`, `INVESTABLE` states;
- wrong claim decoy with similar context;
- wrong source schema;
- invalid source API;
- malicious `forClaim()` helper;
- wrong envelope;
- locator outside claim;
- cross-lot contradiction;
- mixed states;
- duplicate review references;
- malicious approval/verification/eligibility/score-like input fields;
- V175 and V176 preservation;
- deterministic output;
- frozen output;
- source fixture immutability;
- V164–V169 provenance-gap preservation.

CI also runs V170 through V176 regression validators before V177 validation.

## Provenance gap

V177 does not reconstruct missing historical versions.

V164–V169 remain:

`NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE`

Instruction preserved:

`DO_NOT_RECONSTRUCT_MISSING_HISTORY`

## Core integrity statements

`SUFFICIENCY_REVIEW_REFERENCE ≠ CLAIM_TRUTH`

`SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE ≠ UNIVERSALLY_SUFFICIENT_EVIDENCE`

`ADDITIONAL_EVIDENCE_REQUIRED_AT_REVIEW ≠ NEGATIVE_PROJECT_CONCLUSION`

`REVIEWER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_INDEPENDENCE`

`REVIEW_SCOPE_REFERENCE ≠ AUTHORITY_GRANTED`

`REVIEW_CONCLUSION ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION`

`REVIEW_CONCLUSION ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ FINANCING_APPROVAL ≠ INVESTMENT_DECISION`

`CAPITAL_READY ≠ FINANCING_APPROVAL`

`COUNTS_ONLY ≠ SCORE`

## Delivery policy

V177 is an additive stacked slice on V176.

It must remain Draft until human review.

Do not merge automatically.

Do not touch `main`.