# SANA Data Room Executive V174 — Claim Envelope and Verification Boundaries

## Status

V174 is an additive, read-only layer over the V173 Claim-to-Reference Provenance Matrix.

- Schema: `SANA_DATAROOM_EXECUTIVE_CLAIM_ENVELOPE_V1`
- Version: `V174`
- Parent: `V173`
- Exact parent SHA: `0ff67fe5c768c4e1aa50760eef683ce88bcb1d33`
- Runtime: `apps/control-web/public/sana-v3-dataroom-executive-v174.js`
- Review surface: `apps/control-web/public/sana-v3-dataroom-executive-v174.html`
- Validator: `scripts/validate-sana-dataroom-executive-v174.mjs`

V174 does not mutate canonical agricultural, financial or Data Room state. It does not create approvals, eligibility, offers, payments, custody, disbursement, certifications, risk scores or investment scores.

## Objective

V173 can state only controlled provenance claims such as “a source contains an explicit case reference.” V174 wraps every V173 claim in an explicit boundary envelope so that downstream consumers cannot silently reinterpret that claim as:

- a human attestation;
- a verified reviewer identity or qualification;
- an external verification result;
- a verified document;
- evidentiary sufficiency;
- certification validity;
- due-diligence approval;
- financing approval; or
- an investment decision.

The key chain is therefore:

`V173 controlled claim → V174 claim envelope → explicit absence or exact contracted link`

At V174 there is no exact contracted claim-specific link, so the implementation fails closed.

## Pre-implementation contract audit

V174 inspected the materialized source contracts rather than inferring semantics from names or UI labels.

### Document Assurance

File: `sana-v3-dataroom-assurance-ledger.js`

Global: `__SANA_DATAROOM_ASSURANCE__`

Schema: `SANA_DATAROOM_DOCUMENT_ASSURANCE_V1`

The contract exposes case, capital case, exchange case, snapshot, document, request, verifier, result and evidence references. It explicitly preserves boundaries including:

`RESULT_REFERENCE ≠ VERIFIED_RESULT ≠ VERIFIED_DOCUMENT`

and reports zero authoritative verified verifier identities, checks, evidence, results, documents, DD approvals, eligibility decisions, investment signals and funding execution.

It does not expose a V173 `claimId`, V172 `locatorKey`, or another materialized claim-specific relation.

### Document Assurance History

File: `sana-v3-dataroom-assurance-history.js`

Global: `__SANA_DATAROOM_ASSURANCE_HISTORY__`

Schema: `SANA_DUE_DILIGENCE_SNAPSHOT_V1`

The snapshot history remains reference-only and explicitly states that assurance deltas do not prove a verified result, verified document, current validity, DD approval or eligibility. It does not expose a claim-specific relation.

### Review Governance

File: `sana-v3-dataroom-review-governance.js`

Global: `__SANA_DATAROOM_REVIEW_GOVERNANCE__`

Schema: `SANA_DATAROOM_REVIEW_GOVERNANCE_V1`

The contract exposes reviewer assignment, scope, conflict declaration, recusation and governance references. It explicitly states:

`REVIEWER_ASSIGNMENT_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION`

Its authoritative reviewer identity and qualification counters remain zero. It does not expose a V173 claim-specific relation.

### Source Evidence History

File: `sana-v3-dataroom-source-evidence-history.js`

Schema: `SANA_DUE_DILIGENCE_SNAPSHOT_V1`

Fields such as `humanReviewRecorded`, `reviewOutcome`, `externalVerificationStatus` and `externalVerificationClaimed` are snapshot provenance. The contract explicitly separates a declared status or claim from source verification and authenticity. Those fields cannot be promoted to V173 claim verification.

### Impact History

File: `sana-v3-dataroom-impact-history.js`

Schema: `SANA_DUE_DILIGENCE_SNAPSHOT_V1`

Impact snapshot labels and indicator states are historical/read-model context. They do not create a claim-specific external verification relationship.

## Link-policy result

The V174 typed link-rule set is intentionally empty:

`LINK_RULES = []`

Audit result:

- `claimSpecificLinkContracts = 0`
- `outcome = CLAIM_SPECIFIC_LINK_NOT_FOUND`
- `policy = FAIL_CLOSED_WITHOUT_EXACT_CONTRACTED_LINK`
- `heuristicLinking = false`
- `acceptedExactLinkFields = []`

This is not a missing implementation. It is the correct representation of the current source contracts.

V174 MUST NOT create a link because two records share:

- a lot;
- a timestamp;
- a source name;
- a case reference not defined as a claim relation;
- reviewer activity;
- an assurance case;
- `PASS_REFERENCE_ONLY`;
- a verification-like label such as `VERIFICADO_EXTERNO`;
- `humanReviewRecorded`;
- `evidenceAccepted`;
- a record count; or
- an arbitrary field that happens to be named `claimId` outside a canonical contracted schema.

## Envelope model

Every V173 claim produces exactly one deterministic envelope:

`ENV::<V173 claimId>`

Core states at V174:

### Attestation

`NO_EXPLICIT_ATTESTATION_LINK`

with:

- zero explicit references;
- `reviewerIdentityVerified = false`;
- `reviewerQualificationVerified = false`;
- `claimTruthAttested = false`.

`ATTESTATION_REFERENCE_ONLY` exists in the bounded vocabulary for future exact contracts but cannot be produced by the current V174 link-rule set.

### External verification

`NOT_DETERMINED`

with:

- zero explicit references;
- `verifiedResult = false`;
- `certificationValidityVerified = false`.

`EXTERNAL_VERIFICATION_REFERENCE_ONLY` and `EXPLICITLY_NOT_VERIFIED_AT_SOURCE` exist in the bounded vocabulary but are not produced without an exact contracted relation.

### Truth, sufficiency and decision authority

Always at V174:

- `claimTruthVerified = false`
- `evidentiarySufficiencyDetermined = false`
- `decisionAuthority = false`

These booleans are authority boundaries, not negative conclusions about a farm, project, company or financing opportunity.

## Documentary assurance context

Each envelope contains:

- `state = NOT_CLAIM_LINKED`
- `refs = []`
- `claimSpecific = false`
- `doesNotAttestClaimTruth = true`

V174 intentionally does not copy same-lot assurance cases into this field. Doing so would create an undocumented semantic relation.

## Summary semantics

The summary is categorical counts only:

`ENVELOPE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE`

No count may be converted into an assurance score, project score, credit score, risk score, investment score or financing recommendation.

## Adversarial validation

The validator creates decoy records containing combinations of:

- the same lot;
- the same timestamp;
- the same source;
- a copied V173-looking `claimId`;
- reviewer references and a fake qualification boolean;
- `PASS_REFERENCE_ONLY`;
- `VERIFICADO_EXTERNO`;
- `humanReviewRecorded`;
- `evidenceAccepted`;
- `verified: true`.

None may create an attestation or external-verification link because none is accepted by a materialized source contract.

The validator also checks:

- one envelope per V173 claim;
- preservation of V173 locator keys;
- deterministic IDs and output;
- no cross-layer mutation;
- frozen structures;
- zero truth/sufficiency/decision authority;
- zero explicit link references;
- exact parent provenance;
- categorical counts only; and
- preservation of the V164–V169 provenance gap.

## Provenance gap

V174 preserves the verified Git-lineage discrepancy for V164–V169:

`NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE`

Instruction:

`DO_NOT_RECONSTRUCT_MISSING_HISTORY`

No missing version is reconstructed, renamed or implied by V174.

## Integrity semantics

The runtime preserves these boundaries:

`CLAIM ≠ ATTESTATION`

`ATTESTATION_REFERENCE ≠ VERIFIED_REVIEWER_IDENTITY ≠ VERIFIED_REVIEWER_QUALIFICATION`

`HUMAN_REVIEW_ACTIVITY ≠ ATTESTATION_TO_CLAIM_TRUTH`

`DOCUMENT_ASSURANCE ≠ EXTERNAL_VERIFICATION_OF_CLAIM`

`RESULT_REFERENCE ≠ VERIFIED_RESULT`

`VERIFICATION_LABEL ≠ CLAIM_VERIFICATION`

`EXTERNAL_VERIFICATION_REFERENCE ≠ CERTIFICATION_VALIDITY`

`NO_EXPLICIT_LINK ≠ NEGATIVE_PROJECT_CONCLUSION`

`COUNTS_ONLY ≠ SCORE`

`NO_AUTOMATIC_APPROVAL`

`NO_MUTATION · READ_ONLY`
