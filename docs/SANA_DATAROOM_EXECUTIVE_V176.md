# SANA Data Room Executive V176 — Exact External Verification Reference Contract

## Status

V176 is an additive, read-only evolution over V175.

- Executive schema: `SANA_DATAROOM_EXECUTIVE_EXACT_EXTERNAL_VERIFICATION_LINK_V1`
- Source-contract schema: `SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION_REFERENCE_V1`
- Version: `V176`
- Parent: `V175`
- Exact parent SHA: `917d14463a187b54559c2306b145e4c5427092f0`
- Source contract: `apps/control-web/public/sana-v3-dataroom-claim-external-verification-v176.js`
- Executive adapter: `apps/control-web/public/sana-v3-dataroom-executive-v176.js`
- Review surface: `apps/control-web/public/sana-v3-dataroom-executive-v176.html`
- Validator: `scripts/validate-sana-dataroom-executive-v176.mjs`

V176 does not create a verified truth state. It does not verify a provider, result, document, certification, due-diligence conclusion, financing eligibility or investment decision. It does not mutate canonical agricultural or financial state.

## Why V176 exists

V174 separated controlled claims from attestation and external verification. V175 then materialized the first exact claim-attestation reference contract. The remaining structural gap was external verification: there was still no claim-specific contract capable of distinguishing an external result reference from an explicit statement that a claim was not verified at the source.

V176 solves that representational problem without creating verification authority.

The chain is now:

`V173 controlled claim → V174 envelope → V175 exact attestation reference → V176 exact external-verification reference`

Each layer remains reference/provenance infrastructure, not factual or financial authority.

## Source contract

Schema:

`SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION_REFERENCE_V1`

Global baseline:

`__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION__`

Factory:

`__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION_V176_FACTORY__`

### Allowed source states

Only two source states exist:

- `RESULT_REFERENCE_ONLY`
- `EXPLICITLY_NOT_VERIFIED`

There is deliberately no `VERIFIED` state.

`NO_VERIFIED_STATE`

A source record using `VERIFIED` or any other unrecognized state is rejected as:

`EXTERNAL_VERIFICATION_STATE_NOT_ALLOWED`

### Zero baseline records

The baseline contains zero external-verification records.

`ZERO_BASELINE_RECORDS`

Therefore:

`CONTRACT_AVAILABLE ≠ VERIFICATION_EXISTS`

Materializing the schema does not imply that any claim has been externally checked.

### Required relation

An accepted record requires:

- non-empty `verificationRef`;
- non-empty `claimId`;
- non-empty `claimEnvelopeRef`;
- exact `claimEnvelopeRef === ENV::<claimId>`;
- one of the two allowed source states.

When the source state is `RESULT_REFERENCE_ONLY`, `resultRef` is also required.

Optional reference metadata includes:

- `locatorKeys`;
- `lotId`;
- `providerRef`;
- `resultRef` for `EXPLICITLY_NOT_VERIFIED` if a source wishes to preserve a reference;
- `observedAt`;
- provenance.

Duplicate `verificationRef` values are rejected.

## Source-level boundaries

Every accepted source record states:

- `claimTruthVerified = false`;
- `verifiedResult = false`;
- `providerIdentityVerified = false`;
- `providerQualificationVerified = false`;
- `providerAccreditationVerified = false`;
- `documentAuthenticityVerified = false`;
- `evidentiarySufficiencyDetermined = false`;
- `certificationValidityVerified = false`;
- `decisionAuthority = false`.

Core semantics:

`EXTERNAL_VERIFICATION_REFERENCE ≠ VERIFIED_RESULT`

`PROVIDER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_ACCREDITATION`

`RESULT_REFERENCE ≠ DOCUMENT_AUTHENTICITY`

`EXPLICITLY_NOT_VERIFIED ≠ NEGATIVE_PROJECT_CONCLUSION`

`EXTERNAL_VERIFICATION_REFERENCE ≠ CLAIM_TRUTH ≠ EVIDENTIARY_SUFFICIENCY ≠ CERTIFICATION_VALIDITY`

`EXTERNAL_VERIFICATION_REFERENCE ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ INVESTMENT_DECISION`

## Exact executive rule

V176 materializes one typed rule:

`CLAIM_EXTERNAL_VERIFICATION_EXACT_V1`

The adapter requires:

1. exact source schema;
2. exact `claimId` equality;
3. exact `claimEnvelopeRef` equality;
4. allowed source state;
5. `resultRef` when the state is `RESULT_REFERENCE_ONLY`;
6. every declared locator key is a subset of the parent claim locator keys;
7. any declared lot equals the selected envelope lot;
8. all exact-claim candidates use one consistent source state;
9. no contradictory exact-claim candidate.

No heuristic keys are configured:

`heuristics = []`

The adapter reads `records()` and performs its own exact filtering. A source-provided `forClaim()` helper cannot bypass the rule.

## Executive mapping

### Result reference

Source:

`RESULT_REFERENCE_ONLY`

maps to:

`EXTERNAL_VERIFICATION_REFERENCE_ONLY`

The executive envelope may carry:

- `explicitRefs`;
- `providerRefs`;
- `resultRefs`;
- `sourceVerificationState`.

It still states:

- `verifiedResult = false`;
- provider identity/qualification/accreditation unverified;
- document authenticity unverified;
- certification validity unverified;
- claim truth unverified;
- evidentiary sufficiency undetermined;
- decision authority false.

### Explicitly not verified

Source:

`EXPLICITLY_NOT_VERIFIED`

maps to:

`EXPLICITLY_NOT_VERIFIED_AT_SOURCE`

This mapping is literal and narrow. It means only that the exact source record says verification was not established.

It does **not** mean:

- the claim is false;
- the project is deficient;
- the company is ineligible;
- due diligence failed;
- financing should be denied;
- an investment should be rejected.

`EXPLICITLY_NOT_VERIFIED_AT_SOURCE ≠ NEGATIVE_PROJECT_CONCLUSION`

### Missing candidate

If no exact candidate exists, V176 preserves the parent state:

`NOT_DETERMINED`

Missing evidence is not converted into `EXPLICITLY_NOT_VERIFIED_AT_SOURCE`.

## Conflict policy

If an exact-claim candidate violates the contract, the envelope fails closed and preserves the parent external-verification state.

Diagnostic:

`CLAIM_EXTERNAL_VERIFICATION_CANDIDATE_CONFLICT`

Conflict examples:

- wrong envelope reference;
- locator outside parent claim;
- cross-lot contradiction;
- disallowed source state;
- missing result reference for `RESULT_REFERENCE_ONLY`;
- duplicate verification reference;
- record schema mismatch;
- mixed `RESULT_REFERENCE_ONLY` and `EXPLICITLY_NOT_VERIFIED` candidates for one claim.

State consistency rule:

`ALL_EXACT_CLAIM_CANDIDATES_MUST_USE_ONE_STATE`

Conflict policy:

`ANY_EXACT_CLAIM_CANDIDATE_CONTRADICTION_FAILS_CLOSED`

A valid candidate cannot mask a contradictory candidate for the same claim.

## Preservation of V175 attestation

V176 composes over V175 rather than recreating attestation state.

An existing `ATTESTATION_REFERENCE_ONLY` envelope remains attestation-linked after V176 adds an external-verification reference.

V176 does not reinterpret attestation as external verification and does not require attestation to infer external verification.

`ATTESTATION_REFERENCE ≠ EXTERNAL_VERIFICATION_REFERENCE`

## Capability vs authority

V176 exposes narrow representational capabilities:

- `exactExternalVerificationReferenceLinking = true`;
- `explicitNotVerifiedRepresentation = true`;
- `verifiedResultRepresentation = false`;
- `heuristicLinking = false`.

All verification and decision authorities remain false, including:

- external-verification authority;
- result-verification authority;
- claim-truth authority;
- provider identity authority;
- provider qualification authority;
- provider accreditation authority;
- document-authenticity authority;
- evidentiary-sufficiency authority;
- certification authority;
- due-diligence approval authority;
- eligibility authority;
- decision authority;
- canonical/financial mutation availability;
- offer, solicitation, brokerage, custody, payment and disbursement authority.

`REFERENCE CAPABILITY ≠ VERIFICATION AUTHORITY`

## Malicious or non-contract fields

Fields outside the contract cannot elevate state or authority. The adversarial tests include records carrying:

- `verified: true`;
- `certified: true`;
- `providerAccredited: true`;
- `claimTruthVerified: true`.

A valid exact record containing those extra fields can still only map to the bounded reference state. The output resets authoritative interpretations to false.

## Source availability states

Categorical only:

- `AVAILABLE`
- `MISSING`
- `SCHEMA_MISMATCH`
- `INVALID_API`

These are adapter diagnostics, not quality, risk, credit or investment signals.

## Summary semantics

V176 reports categorical counts only:

- result-reference envelopes;
- explicitly-not-verified envelopes;
- not-determined envelopes;
- conflicts;
- explicit verification references.

Semantics:

`EXACT_EXTERNAL_VERIFICATION_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE`

No count is a confidence score, assurance score, credit score, risk score, project score, investment score or financing recommendation.

## Review surface

`/sana-v3-dataroom-executive-v176.html`

The read-only surface shows:

- lot and section filters;
- external-verification state filter;
- source-contract state and record count;
- exact rule ID and source states;
- V175 attestation state preserved alongside V176 external verification;
- verification/provider/result refs when present;
- categorical conflicts;
- `verifiedResult=false` and certification false;
- truth/sufficiency/decision false.

With the real zero-record baseline, the expected state is:

- source contract `AVAILABLE`;
- record count `0`;
- all envelopes `NOT_DETERMINED` for external verification.

That is the correct current representation.

## Adversarial validation

The validator proves:

- exact result reference accepted;
- exact explicitly-not-verified record mapped literally;
- `VERIFIED` state rejected by the source contract;
- result reference without `resultRef` rejected;
- wrong claim context does not link;
- wrong schema fails closed;
- missing source fails closed;
- invalid API fails closed;
- malicious `forClaim()` cannot bypass `records()`;
- wrong envelope conflicts;
- locator outside claim conflicts;
- cross-lot record conflicts;
- disallowed state conflicts;
- malicious verification/certification/accreditation flags cannot elevate authority;
- mixed result/not-verified candidates conflict;
- valid + contradictory candidate fails the whole claim closed;
- V175 attestation remains unchanged;
- V175 statement and locator identity remain unchanged;
- output is frozen and deterministic;
- source fixtures remain immutable;
- V164–V169 provenance gap remains preserved.

## Provenance gap

V176 preserves:

`V164–V169 = NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE`

Instruction:

`DO_NOT_RECONSTRUCT_MISSING_HISTORY`

No missing version is fabricated.

## Core integrity semantics

`EXTERNAL_VERIFICATION_REFERENCE_ONLY ≠ VERIFIED_RESULT`

`PROVIDER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_ACCREDITATION`

`RESULT_REFERENCE ≠ DOCUMENT_AUTHENTICITY`

`EXPLICITLY_NOT_VERIFIED_AT_SOURCE ≠ NEGATIVE_PROJECT_CONCLUSION`

`EXTERNAL_VERIFICATION_REFERENCE ≠ CLAIM_TRUTH ≠ EVIDENTIARY_SUFFICIENCY ≠ CERTIFICATION_VALIDITY`

`EXACT_LINK ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ INVESTMENT_DECISION`

`CONTRACT_AVAILABLE ≠ VERIFICATION_EXISTS`

`NO_VERIFIED_STATE`

`CONFLICT_FAILS_CLOSED`

`NO_HEURISTIC_LINKING`

`COUNTS_ONLY ≠ SCORE`

`NO_MUTATION · READ_ONLY`
