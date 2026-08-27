# SANA Data Room Executive V178

## Exact Claim Evidence Request / Response Handoff

Canonical issue: #144

Parent branch: `demo/sana-dataroom-executive-v177`

Exact parent SHA: `46a5e5c3cd7d1c395f9aabba643610a467eaf0ed`

V178 makes documentary remediation operationally traceable without turning it into workflow automation, evidence acceptance, sufficiency determination, finding resolution, DD approval, eligibility or financing authority.

## Why V178 exists

V177 can represent a human review conclusion that additional evidence is required.

That conclusion must **not** automatically create a task or request.

V178 therefore introduces a separate explicit source contract for a real claim-specific evidence request and its explicit response.

The critical separation is:

`ADDITIONAL_EVIDENCE_REQUIRED_AT_REVIEW ≠ AUTO_REQUEST_CREATION`

## Source contract

Schema:

`SANA_DATAROOM_CLAIM_EVIDENCE_HANDOFF_V1`

Global:

`__SANA_DATAROOM_CLAIM_EVIDENCE_HANDOFF__`

Factory:

`__SANA_DATAROOM_CLAIM_EVIDENCE_HANDOFF_V178_FACTORY__`

Baseline events: **0**.

`CONTRACT_AVAILABLE ≠ REQUEST_EXISTS`

## Allowed event kinds

Only:

- `EVIDENCE_REQUEST_REFERENCE_ONLY`
- `EVIDENCE_RESPONSE_REFERENCE_ONLY`

There is no source event kind equivalent to:

- ACCEPTED;
- SUFFICIENT;
- RESOLVED;
- CLOSED;
- APPROVED;
- ELIGIBLE;
- FINANCED.

## Request records

An evidence request record requires:

- `eventRef`;
- `requestRef`;
- `claimId`;
- `claimEnvelopeRef`;
- kind `EVIDENCE_REQUEST_REFERENCE_ONLY`;
- at least one `requestedEvidenceRef`.

It may additionally reference:

- claim locator keys;
- lot;
- V177 review reference;
- reviewer;
- request recipient;
- declared due date;
- observed time;
- provenance.

A request reference does not prove task assignment, recipient identity, responsibility acceptance or deadline enforcement.

## Response records

A response record requires:

- `eventRef`;
- `requestRef`;
- `responseRef`;
- `claimId`;
- `claimEnvelopeRef`;
- kind `EVIDENCE_RESPONSE_REFERENCE_ONLY`;
- at least one `responseEvidenceRef`.

A response is accepted into the source contract only when its exact request relation exists in the same claim envelope event set.

## Exact pairing

The only request/response pairing rule is:

`response.requestRef === request.requestRef`

for the same exact claim envelope.

Same lot, date, reviewer, provider, source name or semantic similarity is insufficient.

The executive rule is:

`CLAIM_EVIDENCE_HANDOFF_EXACT_V1`

and declares:

`requestResponseMatch = EXACT_REQUEST_REF`

## Executive states

V178 exposes only categorical handoff states:

- `NO_EXPLICIT_EVIDENCE_HANDOFF`
- `EVIDENCE_REQUEST_REFERENCE_ONLY`
- `EVIDENCE_REQUEST_AND_RESPONSE_REFERENCE_ONLY`
- `EVIDENCE_HANDOFF_CONFLICT`

### Request only

`EVIDENCE_REQUEST_REFERENCE_ONLY` means an explicit request exists.

It does not mean:

- a verified person is responsible;
- the recipient accepted responsibility;
- a due date is enforceable;
- missing evidence is material to project eligibility;
- financing is blocked.

### Request + response

`EVIDENCE_REQUEST_AND_RESPONSE_REFERENCE_ONLY` means an explicit response references an explicit request by exact `requestRef`.

It does not mean:

- evidence was accepted;
- evidence is authentic;
- every requested item was supplied;
- supplied evidence is sufficient;
- the V177 review conclusion changed;
- a finding is resolved;
- DD passed;
- eligibility exists;
- financing is approved.

## Permanent false fields

Even after request/response pairing:

- `evidenceAccepted=false`;
- `evidentiarySufficiencyDetermined=false`;
- `findingResolved=false`;
- `claimTruthVerified=false`;
- `recipientIdentityVerified=false`;
- `responseProviderIdentityVerified=false`;
- `deadlineEnforced=false`;
- `decisionAuthority=false`.

## Conflict model

V178 fails closed for exact-claim contradictions, including:

- wrong record schema;
- wrong claim;
- wrong envelope;
- locator outside claim;
- lot mismatch;
- unsupported event kind;
- missing request/event/response references;
- missing requested evidence references;
- missing response evidence references;
- duplicate event refs;
- duplicate request refs for request events;
- response to an unknown request ref;
- malformed source API.

The executive conflict state is:

`EVIDENCE_HANDOFF_CONFLICT`

with diagnostic:

`CLAIM_EVIDENCE_HANDOFF_CANDIDATE_CONFLICT`

No severity score is produced.

## Preservation of earlier layers

V178 composes on V177 and preserves:

- V175 attestation;
- V176 external verification reference / explicitly-not-verified state;
- V177 evidence-sufficiency review conclusion.

A V178 response does not mutate V177 back to “sufficient”. A new explicit V177 review record would be required to represent a new human sufficiency conclusion.

## Authority boundaries

V178 keeps false:

- canonical mutation authority;
- financial mutation authority;
- evidence request authority;
- evidence acceptance authority;
- evidentiary sufficiency authority;
- finding resolution authority;
- reviewer identity authority;
- recipient identity authority;
- response provider identity authority;
- certification authority;
- DD approval authority;
- eligibility authority;
- financing approval authority;
- decision authority;
- offer / solicitation / brokerage authority;
- custody / payment / disbursement authority.

AI remains `ADVISORY_ONLY`.

## Capabilities are not authorities

V178 may represent:

- an exact request reference;
- an exact response reference;
- exact request/response pairing.

It explicitly cannot:

- auto-create a request from V177;
- accept evidence;
- determine sufficiency;
- resolve findings;
- enforce deadlines;
- fuzzy-match request/response records.

## Read-only review surface

`/sana-v3-dataroom-executive-v178.html`

shows:

- V175 attestation state;
- V176 external verification state;
- V177 sufficiency-review state;
- V178 request/response state;
- explicit request refs;
- explicit response refs;
- exact paired request refs;
- requested evidence refs;
- response evidence refs;
- categorical conflicts.

It contains no form and no network/storage mutation path.

## Adversarial validation

The V178 validator proves:

- V177 additional-evidence-required does not create a request;
- exact request is represented request-only;
- exact response pairs only via exact requestRef;
- response never sets evidence accepted, sufficient or finding resolved;
- orphan response is rejected by the source contract;
- malicious direct source orphan response fails closed in the executive adapter;
- same contextual claim data with a different requestRef does not pair;
- unsupported event kinds are rejected;
- wrong claim/schema/envelope/locator/lot fail closed;
- duplicate event refs conflict;
- duplicate request refs conflict;
- malicious accepted/complete/resolved/approved/score-like fields do not elevate normalized authority;
- V175, V176 and V177 states are preserved;
- deterministic/frozen output is preserved;
- V164–V169 provenance gap is preserved.

CI runs V170 through V177 regression validation before V178.

## Provenance

V164–V169 remain:

`NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE`

Instruction:

`DO_NOT_RECONSTRUCT_MISSING_HISTORY`

## Core semantics

`EVIDENCE_REQUEST_REFERENCE ≠ AUTO_CREATED_TASK`

`DECLARED_DUE_AT ≠ DEADLINE_ENFORCEMENT`

`EVIDENCE_RESPONSE_REFERENCE ≠ EVIDENCE_ACCEPTED`

`RESPONSE ≠ REQUEST_COMPLETE ≠ SUFFICIENT_EVIDENCE ≠ FINDING_RESOLVED`

`EXACT_REQUEST_RESPONSE_PAIR ≠ CLAIM_TRUTH`

`ADDITIONAL_EVIDENCE_REQUIRED_AT_REVIEW ≠ AUTO_REQUEST_CREATION`

`RECIPIENT_OR_PROVIDER_REFERENCE ≠ VERIFIED_IDENTITY_OR_RESPONSIBILITY`

`HANDOFF ≠ CERTIFICATION ≠ DD_APPROVAL ≠ ELIGIBILITY ≠ FINANCING_APPROVAL ≠ INVESTMENT_DECISION`

`CAPITAL_READY ≠ FINANCING_APPROVAL`

`COUNTS_ONLY ≠ SCORE`

## Delivery

V178 is additive and stacked on V177.

Keep the PR Draft.

Do not merge automatically.

Do not touch `main`.