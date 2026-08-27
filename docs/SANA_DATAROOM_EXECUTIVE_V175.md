# SANA Data Room Executive V175 — Exact Claim Attestation Reference Contract

## Status

V175 is an additive, read-only evolution over V174.

- Executive schema: `SANA_DATAROOM_EXECUTIVE_EXACT_ATTESTATION_LINK_V1`
- Source-contract schema: `SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1`
- Version: `V175`
- Parent: `V174`
- Exact parent SHA: `cd4717c33b64584eeff538a8097f6c8740fb6e16`
- Source contract: `apps/control-web/public/sana-v3-dataroom-claim-attestation-v175.js`
- Executive adapter: `apps/control-web/public/sana-v3-dataroom-executive-v175.js`
- Review surface: `apps/control-web/public/sana-v3-dataroom-executive-v175.html`
- Validator: `scripts/validate-sana-dataroom-executive-v175.mjs`

V175 does not mutate canonical agricultural, financial or Data Room transaction state. It does not create claim truth, reviewer verification, external verification, certification, due-diligence approval, financing approval, eligibility, investment recommendation, investment decision, offer, custody, payment or disbursement authority.

## Why V175 exists

V174 proved an important negative fact about the materialized architecture: Data Room Document Assurance, Review Governance, Source Evidence History and Impact History did not expose an exact V173/V174 claim-specific relation.

For that reason V174 correctly implemented:

`LINK_RULES = []`

and failed closed.

V175 does not weaken that conclusion. Instead, it materializes the first narrow source contract whose explicit purpose is to carry a claim-attestation **reference relation**. The contract creates a machine-checkable path that future human-review workflows can use without relying on same-lot, same-date, same-reviewer or other heuristics.

The structural chain becomes:

`V173 controlled claim → V174 claim envelope → V175 exact attestation-reference contract → V175 exact adapter`

The final state remains reference-only.

## Source contract

Schema:

`SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1`

Global baseline:

`__SANA_DATAROOM_CLAIM_ATTESTATION__`

Factory:

`__SANA_DATAROOM_CLAIM_ATTESTATION_V175_FACTORY__`

### Zero baseline records

The production/demo baseline intentionally contains zero attestation records.

`ZERO_BASELINE_RECORDS`

This is a critical semantic property:

`CONTRACT_AVAILABLE ≠ ATTESTATION_EXISTS`

The source contract is materialized now so that references can be represented explicitly when a real workflow creates them later. V175 does not invent a reviewer action merely to demonstrate the adapter.

### Required record relation

An accepted source record requires:

- non-empty `attestationRef`;
- non-empty `claimId`;
- non-empty `claimEnvelopeRef`;
- exact `claimEnvelopeRef === ENV::<claimId>`;
- exact `attestationState === REFERENCE_ONLY`.

Optional reference metadata includes:

- `locatorKeys`;
- `lotId`;
- `reviewerRef`;
- `reviewCaseRef`;
- `observedAt`;
- provenance.

The source contract normalizes reference arrays and rejects duplicate `attestationRef` values.

### Source-level authority boundaries

Every accepted record still states:

- `claimTruthVerified = false`;
- `reviewerIdentityVerified = false`;
- `reviewerQualificationVerified = false`;
- `reviewerIndependenceVerified = false`;
- `evidentiarySufficiencyDetermined = false`;
- `externalVerificationDetermined = false`;
- `certificationValidityVerified = false`;
- `decisionAuthority = false`.

Therefore:

`ATTESTATION_REFERENCE ≠ CLAIM_TRUTH`

`REVIEWER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_INDEPENDENCE`

`LOCATOR_REFERENCE ≠ VERIFIED_EVIDENCE`

`ATTESTATION_REFERENCE ≠ EVIDENTIARY_SUFFICIENCY`

`ATTESTATION_REFERENCE ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION`

`ATTESTATION_REFERENCE ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ INVESTMENT_DECISION`

## Executive exact-link rule

V175 materializes exactly one typed rule:

`CLAIM_ATTESTATION_EXACT_V1`

The rule requires:

1. source global `__SANA_DATAROOM_CLAIM_ATTESTATION__`;
2. exact source schema `SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1`;
3. exact record state `REFERENCE_ONLY`;
4. exact `record.claimId === envelope.claimId`;
5. exact `record.claimEnvelopeRef === envelope.envelopeId`;
6. every declared locator key must be a subset of the envelope's V173/V172 locator keys;
7. if the source record declares `lotId`, it must equal the selected envelope lot;
8. any contradiction among exact-claim candidates fails the entire envelope closed.

No heuristic fields are configured:

`heuristics = []`

`NO_HEURISTIC_LINKING`

The adapter deliberately reads `records()` and performs its own exact filtering. It does not trust a source-provided `forClaim()` helper, which prevents a malicious or buggy helper from bypassing the link contract.

## Source-contract states

The executive adapter uses categorical source states only:

- `AVAILABLE`
- `MISSING`
- `SCHEMA_MISMATCH`
- `INVALID_API`

If the source is missing, has the wrong schema, has no valid `records()` API, or the API fails, V175 preserves the V174 no-link state.

These states are diagnostics, not project-quality or financing signals.

## Envelope outcomes

### No exact candidate

The envelope remains:

`NO_EXPLICIT_ATTESTATION_LINK`

Diagnostic:

`NO_EXACT_CANDIDATE`

### Exact valid candidate(s)

The envelope becomes:

`ATTESTATION_REFERENCE_ONLY`

and carries only explicit reference arrays such as:

- `explicitRefs`;
- `reviewerRefs`;
- `reviewCaseRefs`.

Even in this state:

- reviewer identity remains unverified;
- reviewer qualification remains unverified;
- reviewer independence remains unverified;
- claim truth remains unverified;
- evidentiary sufficiency remains undetermined;
- external verification remains `NOT_DETERMINED`;
- certification validity remains unverified;
- decision authority remains false.

### Candidate contradiction

If any record with the exact claim ID contradicts the envelope contract, the envelope is not partially linked.

Diagnostic:

`CLAIM_ATTESTATION_CANDIDATE_CONFLICT`

Policy:

`ANY_EXACT_CLAIM_CANDIDATE_CONTRADICTION_FAILS_CLOSED`

Examples include:

- wrong envelope reference;
- locator outside the V173 claim;
- cross-lot contradiction;
- state other than `REFERENCE_ONLY`;
- duplicate attestation reference among exact-claim candidates;
- record-level schema mismatch.

This prevents a valid record from masking a contradictory record for the same claim.

## Capability vs authority

V175 exposes a capability:

`exactAttestationReferenceLinking = true`

It does **not** convert that capability into decision or verification authority.

The executive authority block keeps false:

- attestation authority;
- claim-truth authority;
- reviewer identity authority;
- reviewer qualification authority;
- reviewer independence authority;
- evidentiary-sufficiency authority;
- external-verification authority;
- certification authority;
- due-diligence approval authority;
- eligibility authority;
- decision authority;
- canonical and financial mutation availability;
- offer, solicitation, brokerage, custody, payment and disbursement authority.

`EXACT_LINK != AUTHORITY`

## External verification boundary

V175 does not introduce a source contract for external verification.

Every linked claim continues to carry the V174 external-verification state:

`NOT_DETERMINED`

The following fields in arbitrary input records are ignored for authority purposes:

- `verified: true`;
- `reviewerQualified: true`;
- `externalVerificationStatus: VERIFICADO_EXTERNO`;
- `evidenceAccepted: true`.

They are not part of the exact V175 contract and cannot promote truth, reviewer qualification, external verification or decision authority.

## Review surface

`/sana-v3-dataroom-executive-v175.html`

The review surface is read-only and shows:

- selected lot;
- section;
- attestation state;
- source contract state and record count;
- exact rule ID and match policy;
- linked reference counts;
- conflicts;
- claim and envelope IDs;
- exact locator keys;
- explicit attestation/reviewer/review-case refs when present;
- external verification state;
- false truth/sufficiency/decision flags.

With the real V175 zero-record baseline, the page should normally show:

- source contract `AVAILABLE`;
- record count `0`;
- exact linked `0`;
- all envelopes in `NO_EXPLICIT_ATTESTATION_LINK`.

That is the expected current state, not an error.

## Adversarial validation

The V175 validator proves both positive and negative behavior.

### Positive exact link

A controlled fixture is accepted only when it has:

- exact schema;
- exact claim ID;
- exact envelope ID;
- `REFERENCE_ONLY` state;
- locator subset;
- matching lot.

The resulting envelope becomes `ATTESTATION_REFERENCE_ONLY` and carries the exact attestation reference while all truth/reviewer/external-verification/decision boundaries remain false or undetermined.

### Rejected / fail-closed cases

The validator tests:

- same lot/date/source/reviewer context with wrong claim ID;
- wrong source schema;
- source missing;
- invalid source API;
- malicious `forClaim()` helper;
- exact claim with wrong envelope ID;
- exact claim with locator outside the parent claim;
- exact claim with cross-lot mismatch;
- exact claim with wrong attestation state;
- malicious flags such as `verified:true` and `VERIFICADO_EXTERNO`;
- mixed valid + contradictory candidates for the same claim.

It also verifies:

- parent statement and locator preservation;
- source fixture immutability;
- deterministic output;
- frozen structures;
- categorical counts only;
- no network/storage/canonical/financial mutation;
- no risk, credit, project or investment score;
- exact V174 parent provenance.

## Summary semantics

All summary fields are categorical counts only:

`EXACT_LINK_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE`

A count of linked attestation references cannot be transformed into:

- a confidence percentage;
- a quality score;
- a risk score;
- a credit score;
- an investment score;
- a financing recommendation;
- a capital-readiness approval.

## Provenance gap

V175 inherits and preserves the verified Git-lineage gap:

- V164
- V165
- V166
- V167
- V168
- V169

State:

`NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE`

Instruction:

`DO_NOT_RECONSTRUCT_MISSING_HISTORY`

V175 does not recreate or imply those missing Git versions.

## Core integrity semantics

`EXACT_CLAIM_LINK ≠ CLAIM_TRUTH`

`ATTESTATION_REFERENCE_ONLY ≠ VERIFIED_REVIEWER_IDENTITY ≠ VERIFIED_REVIEWER_QUALIFICATION ≠ VERIFIED_REVIEWER_INDEPENDENCE`

`EXACT_LOCATOR_REFERENCE ≠ VERIFIED_EVIDENCE`

`ATTESTATION_REFERENCE ≠ EVIDENTIARY_SUFFICIENCY`

`ATTESTATION_REFERENCE ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION_VALIDITY`

`EXACT_LINK ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ INVESTMENT_DECISION`

`CONTRACT_AVAILABLE ≠ ATTESTATION_EXISTS`

`CONFLICT_FAILS_CLOSED`

`NO_HEURISTIC_LINKING`

`COUNTS_ONLY ≠ SCORE`

`NO_MUTATION · READ_ONLY`
