# SANA Data Room Executive V179

## Exact Claim Evidence Remediation Round History

**Version:** V179  
**Schema:** `SANA_DATAROOM_EXECUTIVE_EXACT_REMEDIATION_ROUND_HISTORY_V1`  
**Parent:** V178  
**Exact parent SHA:** `b65c1219d97492e31570e34a8cb086b3465ac796`  
**Issue:** #146

---

## 1. Purpose

V179 adds an explicit historical binding layer for claim-specific documentary remediation rounds.

The problem is narrow but important.

V177 can materialize multiple human evidence-sufficiency review records identified by `reviewRef`.

V178 can materialize multiple evidence request/response events identified by `requestRef`, `eventRef` and `responseRef`.

Before V179 there is no explicit contract saying which V177 review opened which V178 request, which V178 responses belong to that remediation round, and which later V177 review belongs to the same round.

V179 adds that missing relationship without inventing chronology, current state, latest state, truth, sufficiency, resolution or approval.

---

## 2. Architecture

The chain becomes:

```text
V173 controlled claim
  ↓
V174 claim envelope
  ↓
V175 exact attestation reference
  ↓
V176 exact external-verification reference
  ↓
V177 evidence-sufficiency review references
  ↓
V178 exact evidence request / response handoff
  ↓
V179 explicit remediation round history binding
```

V179 does not replace V177 or V178.

It references their source records.

It does not copy their substantive conclusion into a second source of truth.

---

## 3. Source contract

New source schema:

```text
SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND_V1
```

Global:

```text
__SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND__
```

Factory:

```text
__SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND_V179_FACTORY__
```

Baseline records:

```text
0
```

Therefore:

```text
CONTRACT_AVAILABLE != ROUND_EXISTS
```

---

## 4. Round binding fields

A normalized round record contains reference fields only:

- `roundRef`
- `claimId`
- `claimEnvelopeRef`
- `locatorKeys`
- `lotId`
- `openingReviewRef`
- `requestRef`
- `responseRefs[]`
- `followupReviewRef`
- `observedAt`
- provenance

It deliberately does not contain an authoritative `current`, `latest`, `closed`, `resolved`, `approved`, `eligible`, `financed` or score field.

Malicious or accidental input fields with those names are not promoted into the normalized contract.

---

## 5. What V179 binds

A V179 round has an exact reference topology:

```text
openingReviewRef
      │
      ▼
V177 ADDITIONAL_EVIDENCE_REQUIRED_REFERENCE_ONLY
      │
      ▼
requestRef
      │
      ▼
V178 EVIDENCE_REQUEST_REFERENCE_ONLY
      │
      ├─────────────┐
      ▼             ▼
responseRef A   responseRef B ...
      │
      ▼
V178 EVIDENCE_RESPONSE_REFERENCE_ONLY
      │
      ▼ optional
followupReviewRef
      │
      ▼
V177 review reference
```

Every edge is checked by exact ID equality.

---

## 6. Opening review rule

`openingReviewRef` must resolve uniquely to the V177 review source contract.

The record must match:

- exact `claimId`;
- exact `claimEnvelopeRef`;
- compatible declared lot;
- locator subset;
- exact review state:

```text
ADDITIONAL_EVIDENCE_REQUIRED_REFERENCE_ONLY
```

A review that says `SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY` cannot open a remediation round.

This is a structural consistency rule, not a negative conclusion about the project.

---

## 7. Request rule

`requestRef` must resolve uniquely to a V178 request event with kind:

```text
EVIDENCE_REQUEST_REFERENCE_ONLY
```

It must belong to the same claim and envelope.

If the request record declares `reviewRef`, it must equal the round's `openingReviewRef`.

This prevents a request created for one review from being silently attached to another review simply because lot, date, reviewer or context looks similar.

---

## 8. Response rule

Every `responseRef` explicitly listed in a round must resolve uniquely to a V178 response event with kind:

```text
EVIDENCE_RESPONSE_REFERENCE_ONLY
```

The response must have:

- exact same claim;
- exact same envelope;
- exact `requestRef` of the round;
- compatible lot;
- locator subset.

V179 does not assume that every response in V178 must be listed in a round binding.

Therefore a list of round `responseRefs` is an explicit reference set, not a completeness assertion.

---

## 9. Follow-up review rule

A round may declare `followupReviewRef`.

When present:

1. at least one explicit `responseRef` is required;
2. follow-up review must differ from opening review;
3. it must resolve uniquely in V177;
4. claim and envelope must match;
5. lot and locator boundaries must match;
6. its V177 review state must be one of the two valid V177 states.

The follow-up may therefore say either:

```text
SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY
```

or:

```text
ADDITIONAL_EVIDENCE_REQUIRED_REFERENCE_ONLY
```

V179 records that reference without converting it into system authority.

---

## 10. Historical stages

V179 derives only a categorical reference stage from explicit links.

### Request only

```text
REQUEST_ROUND_REFERENCE_ONLY
```

### Request plus one or more responses

```text
REQUEST_RESPONSE_ROUND_REFERENCE_ONLY
```

### Request, response and follow-up review

```text
REQUEST_RESPONSE_FOLLOWUP_REVIEW_ROUND_REFERENCE_ONLY
```

These are topology states.

They are not completion, resolution, quality or readiness states.

---

## 11. Envelope states

Only three envelope-level V179 states exist:

```text
NO_EXPLICIT_REMEDIATION_ROUND
REMEDIATION_ROUND_REFERENCES_ONLY
REMEDIATION_ROUND_CONFLICT
```

`REMEDIATION_ROUND_REFERENCES_ONLY` means one or more exact round bindings were validated.

It does not mean the issue is remediated.

---

## 12. Multiple rounds are valid

V179 intentionally permits multiple valid remediation rounds for one claim.

Example:

```text
ROUND-A
  opening review: additional evidence required
  request A
  response A
  follow-up review: additional evidence required

ROUND-B
  opening review: additional evidence required
  request B
  response B
  follow-up review: sufficient for declared review scope
```

Both can coexist.

V179 does not collapse them into one state.

This is the main structural reason V179 exists.

---

## 13. No current/latest inference

V179 always emits:

```text
currentRoundRef = null
latestRoundRef = null
currentRoundDetermined = false
latestRoundDetermined = false
chronologyDetermined = false
```

This remains true even when there are multiple rounds.

V179 does not infer current/latest from:

- `observedAt`;
- request dates;
- response dates;
- review dates;
- source array order;
- lexical `roundRef` order;
- numeric-looking IDs;
- number of responses;
- number of review events;
- follow-up conclusion;
- same reviewer;
- same lot.

---

## 14. Display sorting is not chronology

The read-only surface sorts valid round cards by `roundRef` for deterministic rendering.

That sorting is explicitly labeled:

```text
ROUND_REF_STABLE_SORT_ONLY_NOT_CHRONOLOGY
```

The first or last displayed card has no semantic priority.

---

## 15. Timestamp policy

`observedAt` remains provenance metadata only.

V179 does not use timestamps to establish:

- causal order;
- latest round;
- current round;
- supersession;
- completion;
- validity;
- priority.

An explicit sequence binding is still not equivalent to independently verified chronological truth.

```text
EXPLICIT_SEQUENCE_BINDING != CHRONOLOGICAL_TRUTH
```

---

## 16. Conflict policy

V179 fails closed at the claim layer when any exact-claim round candidate contradicts the contract.

Examples:

- wrong round record schema;
- wrong claim;
- wrong envelope;
- locator outside claim;
- cross-lot record;
- duplicate `roundRef`;
- duplicate opening-review/request binding;
- missing or ambiguous opening review;
- opening review does not require additional evidence;
- missing or ambiguous request;
- request points to a different review;
- missing or ambiguous response;
- response belongs to another request;
- follow-up equals opening review;
- follow-up exists without a response;
- missing or ambiguous follow-up review;
- malformed review dependency source;
- malformed handoff dependency source.

In a conflict, V179 does not publish a partial subset as a valid round history for the claim.

---

## 17. Dependency contract integrity

V179 independently reads `records()` from:

### V177

```text
SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY_REVIEW_V1
```

### V178

```text
SANA_DATAROOM_CLAIM_EVIDENCE_HANDOFF_V1
```

### V179

```text
SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND_V1
```

It validates exact schema identity before trusting any of them.

A source-provided `forClaim()` helper cannot bypass these checks.

---

## 18. Source states

Each dependency is modeled categorically:

```text
AVAILABLE
MISSING
SCHEMA_MISMATCH
INVALID_API
```

If round bindings exist but the V177 or V178 dependency cannot be validated, V179 exposes a dependency conflict rather than guessing.

---

## 19. Truth and evidence boundaries

V179 never changes these flags to true:

```text
claimTruthVerified = false
evidenceAccepted = false
evidentiarySufficiencyDetermined = false
findingResolved = false
decisionAuthority = false
```

A linked response remains only a response reference.

A linked follow-up review remains only a human review reference.

---

## 20. Human review boundary

Even when a follow-up review states:

```text
SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY
```

V179 does not emit:

```text
evidentiarySufficiencyDetermined = true
```

The review conclusion belongs to the human review source contract.

The executive read model does not convert that statement into system authority.

---

## 21. Negative-conclusion boundary

A follow-up that again says additional evidence is required does not imply:

- project failure;
- bad investment;
- credit rejection;
- DD rejection;
- financing rejection;
- noncompliance;
- fraud;
- evidence falsity.

Likewise, a sufficient-for-scope reference is not a universal guarantee.

---

## 22. Authority matrix

V179 keeps the following authorities false:

| Authority | V179 |
|---|---|
| Canonical mutation | false |
| Financial mutation | false |
| Remediation-round authority | false |
| Current-round authority | false |
| Latest-round authority | false |
| Chronology authority | false |
| Claim truth | false |
| Evidence acceptance | false |
| Evidence sufficiency | false |
| Finding resolution | false |
| Reviewer identity | false |
| Recipient identity | false |
| Response provider identity | false |
| Certification | false |
| DD approval | false |
| Eligibility | false |
| Financing approval | false |
| Investment decision | false |
| Custody | false |
| Payment | false |
| Disbursement | false |

AI remains:

```text
ADVISORY_ONLY
```

---

## 23. No score

V179 uses categorical counts for inspection only.

It does not compute:

- risk score;
- credit score;
- investment score;
- project score;
- weighted remediation score;
- percentage completeness;
- evidence quality ratio;
- round performance ratio.

```text
COUNTS_ONLY != SCORE
```

---

## 24. Baseline behavior

Because the V179 source baseline contains zero round bindings, the production/demo baseline shows:

```text
NO_EXPLICIT_REMEDIATION_ROUND
```

for every claim until an explicit round binding source is provided.

It does not create rounds automatically from V177 additional-evidence reviews or V178 handoff events.

---

## 25. Read-only surface

Surface:

```text
/sana-v3-dataroom-executive-v179.html
```

It displays:

- lot filter;
- section filter;
- round-reference counts;
- source contract states;
- conflict diagnostics;
- exact round stages;
- opening review refs/states;
- request refs/event refs;
- response refs/event refs;
- follow-up review refs/states;
- explicit current/latest/chronology=false boundaries.

The right pane remains the existing same-origin Data Room source view.

There are no forms or writes.

---

## 26. Adversarial validation

The V179 validator tests:

- exact request-only round;
- exact request + response round;
- exact request + response + follow-up review round;
- two valid historical rounds for the same claim;
- different follow-up conclusions across those rounds;
- deliberately inverted-looking timestamps;
- deterministic display sorting without chronology inference;
- current/latest remaining null/false;
- sufficient-for-scope opening review rejection;
- request-review mismatch;
- unknown response;
- response under the wrong request;
- unknown follow-up review;
- follow-up without response;
- follow-up equal to opening review;
- wrong envelope;
- locator outside claim;
- cross-lot round;
- wrong claim isolation;
- duplicate round ref;
- duplicate round binding;
- wrong round source schema;
- malformed round source API;
- wrong V177 dependency schema;
- wrong V178 dependency schema;
- malicious `forClaim()` helper;
- malicious current/latest/closed/resolved/approved/score-like input;
- immutability;
- frozen output;
- deterministic output;
- no score fields;
- preservation of the V164–V169 provenance gap.

---

## 27. Regression chain

V179 CI runs the complete executive sequence:

```text
V170
V171
V172
V173
V174
V175
V176
V177
V178
V179
```

This keeps the stacked development line auditable.

---

## 28. Provenance gap

V179 does not reconstruct missing Git history.

V164–V169 remain:

```text
NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE
```

Policy remains:

```text
DO_NOT_RECONSTRUCT_MISSING_HISTORY
```

---

## 29. What V179 deliberately does not solve

V179 does **not** answer:

> Which remediation round is currently authoritative for review?

It also does not answer:

> Which round supersedes another round?

Those questions require an explicit pointer/supersession contract.

They must not be solved with a heuristic.

---

## 30. Natural next boundary

A future slice may define an explicit claim-specific current-round pointer, for example:

```text
claimId
claimEnvelopeRef
currentRoundRef
pointerRef
observedAt
REFERENCE_ONLY
```

Such a contract would need to validate `currentRoundRef` against V179 exact round history and would still remain a pointer reference rather than approval or truth.

Until such a contract exists:

```text
currentRoundRef = null
latestRoundRef = null
```

is the correct behavior.

---

## 31. Final semantic contract

```text
REMEDIATION_ROUND_REFERENCE
  != CURRENT_ROUND
  != LATEST_ROUND

MULTIPLE_ROUNDS
  != LATEST_ROUND_DETERMINED

EXPLICIT_SEQUENCE_BINDING
  != CHRONOLOGICAL_TRUTH

REQUEST_RESPONSE_REFERENCE
  != EVIDENCE_ACCEPTED
  != SUFFICIENT_EVIDENCE
  != FINDING_RESOLVED

FOLLOWUP_REVIEW_REFERENCE
  != SYSTEM_SUFFICIENCY_DETERMINATION

ROUND_HISTORY
  != CERTIFICATION
  != DUE_DILIGENCE_APPROVAL
  != ELIGIBILITY
  != FINANCING_APPROVAL
  != INVESTMENT_DECISION

CAPITAL_READY
  != FINANCING_APPROVAL

COUNTS_ONLY
  != SCORE
```

V179 therefore adds historical round integrity without silently adding decision authority.