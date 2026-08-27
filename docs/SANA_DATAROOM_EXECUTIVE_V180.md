# SANA Data Room Executive V180

## Exact Current Remediation Round Pointer Reference

**Version:** V180  
**Schema:** `SANA_DATAROOM_EXECUTIVE_EXACT_CURRENT_REMEDIATION_ROUND_POINTER_V1`  
**Parent:** V179  
**Exact parent SHA:** `01b48db1a035256ad82ec58bfe8f69b318240f63`  
**Issue:** #148

---

## 1. Purpose

V180 introduces the first explicit claim-specific reference that can identify one V179 remediation round as the **referenced current round**.

It does so only through an explicit pointer contract.

V180 deliberately does not infer the current round from:

- timestamps;
- array order;
- lexical or numeric `roundRef` order;
- number of requests or responses;
- follow-up review conclusion;
- lot;
- reviewer;
- evidence count.

This is the architectural answer to the boundary preserved by V179:

```text
V179 history alone cannot determine current/latest.
```

V180 adds an explicit pointer-reference layer instead of weakening that rule.

---

## 2. Position in the chain

```text
V173 controlled claim
  ↓
V174 claim envelope
  ↓
V175 attestation reference
  ↓
V176 external-verification reference
  ↓
V177 evidence-sufficiency review
  ↓
V178 evidence request / response handoff
  ↓
V179 remediation round history
  ↓
V180 explicit current-round pointer reference
```

V180 composes over V179.

It does not rewrite V179 history.

---

## 3. Source contract

New source schema:

```text
SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND_POINTER_V1
```

Global:

```text
__SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND__
```

Factory:

```text
__SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND_V180_FACTORY__
```

Allowed pointer state only:

```text
CURRENT_ROUND_REFERENCE_ONLY
```

There is no authoritative current-round state.

---

## 4. Baseline

The materialized baseline contains zero pointer records.

Therefore:

```text
CONTRACT_AVAILABLE != CURRENT_POINTER_EXISTS
```

If no explicit pointer exists, V180 remains:

```text
NO_EXPLICIT_CURRENT_ROUND_POINTER
```

It does not inspect V179 history and choose one implicitly.

---

## 5. Pointer fields

A normalized source record contains only the minimum reference contract:

- `pointerRef`
- `claimId`
- `claimEnvelopeRef`
- `currentRoundRef`
- `pointerState`
- `locatorKeys`
- `lotId`
- `observedAt`
- provenance

The source layer does not validate whether `currentRoundRef` really exists in V179.

That dependency validation belongs to the executive adapter.

---

## 6. Source normalization boundaries

The source contract always normalizes:

```text
currentRoundReferenceValidated = false
currentRoundAuthority = false
latestRoundReferenceDetermined = false
latestRoundAuthority = false
chronologyDetermined = false
chronologyAuthority = false
claimTruthVerified = false
evidenceAccepted = false
evidentiarySufficiencyDetermined = false
findingResolved = false
dueDiligenceApproved = false
eligible = false
financingApproved = false
decisionAuthority = false
```

Input fields such as:

```text
latest: true
authoritative: true
approved: true
resolved: true
score: 100
```

are not promoted into the normalized contract.

---

## 7. One accepted pointer per claim envelope

The source contract permits at most one accepted pointer for a claim envelope.

Two accepted candidates are not ranked.

They are rejected as:

```text
MULTIPLE_CURRENT_POINTERS_FOR_CLAIM
```

This prevents timestamp or input order from silently deciding which pointer wins.

---

## 8. Duplicate pointer references

Duplicate `pointerRef` values are rejected explicitly:

```text
DUPLICATE_POINTER_REF
```

A duplicate ID cannot be interpreted as confirmation or stronger evidence.

---

## 9. Executive exact-link rule

Typed rule:

```text
CLAIM_CURRENT_REMEDIATION_ROUND_POINTER_EXACT_V1
```

A pointer links only when all of these conditions hold:

1. exact source schema;
2. exact `claimId`;
3. exact `claimEnvelopeRef`;
4. exact `CURRENT_ROUND_REFERENCE_ONLY` state;
5. non-empty `currentRoundRef`;
6. every declared locator is a subset of the parent claim locators;
7. any declared lot equals the selected lot;
8. exactly one pointer candidate exists for the claim;
9. V179 parent history is valid;
10. exactly one V179 round has `roundRef === currentRoundRef`.

No fuzzy or contextual matching exists.

---

## 10. V179 dependency

V180 does not read the V179 round source directly to recreate history.

It consumes the V179 executive parent output.

The parent envelope must contain:

```text
evidenceRemediationHistory.state = REMEDIATION_ROUND_REFERENCES_ONLY
```

The referenced round must already have survived V179's cross-contract validation against V177 and V178.

This preserves layering.

---

## 11. Executive states

V180 exposes only three pointer states:

```text
NO_EXPLICIT_CURRENT_ROUND_POINTER
CURRENT_ROUND_REFERENCE_ONLY
CURRENT_ROUND_POINTER_CONFLICT
```

These are pointer-resolution states, not project statuses.

---

## 12. Successful pointer output

When an exact pointer resolves, V180 exposes:

- `pointerRef`;
- `currentRoundRef`;
- referenced V179 round stage;
- opening review ref;
- request ref;
- response refs;
- follow-up review ref;
- follow-up review state;
- pointer `observedAt` metadata.

And separately:

```text
currentRoundReferenceDetermined = true
```

This is deliberately not named `currentRoundDetermined`.

---

## 13. Reference determination versus authority

A central V180 distinction is:

```text
currentRoundReferenceDetermined = true
currentRoundAuthority = false
```

The software can establish that an explicit pointer references a valid V179 round.

It cannot establish that the pointer is legally, commercially, audit-wise or financially authoritative.

---

## 14. V179 history remains untouched

Even after V180 resolves an explicit pointer, the inherited V179 history remains:

```text
evidenceRemediationHistory.currentRoundRef = null
evidenceRemediationHistory.currentRoundDetermined = false
```

This is intentional.

V179 means:

> the history contract itself does not infer a current round.

V180 means:

> a separate explicit pointer contract references one validated historical round.

These are compatible statements.

---

## 15. No latest-round inference

V180 does not determine a latest round.

Always:

```text
latestRoundRef = null
latestRoundReferenceDetermined = false
latestRoundAuthority = false
```

The explicit current pointer is not automatically the latest round.

```text
CURRENT_ROUND_POINTER_REFERENCE != LATEST_ROUND
```

---

## 16. No chronology inference

Always:

```text
chronologyDetermined = false
chronologyAuthority = false
```

The pointer may contain `observedAt`, but:

```text
POINTER_OBSERVED_AT != PRIORITY
POINTER_OBSERVED_AT != CHRONOLOGICAL_TRUTH
```

V180 does not compare pointer timestamps with review, response or round timestamps.

---

## 17. Pointer to any V179 stage

A valid pointer may reference any validated V179 round stage:

```text
REQUEST_ROUND_REFERENCE_ONLY
REQUEST_RESPONSE_ROUND_REFERENCE_ONLY
REQUEST_RESPONSE_FOLLOWUP_REVIEW_ROUND_REFERENCE_ONLY
```

V180 preserves the referenced stage exactly.

It does not upgrade a request-only round because the pointer calls it current.

---

## 18. Follow-up review semantics remain unchanged

If the pointed round has a follow-up review:

```text
SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY
```

V180 still keeps:

```text
evidentiarySufficiencyDetermined = false
```

Likewise, if the pointed round's follow-up says more evidence is required, that does not imply project failure.

---

## 19. Evidence and resolution boundaries

A current pointer never changes these values:

```text
evidenceAccepted = false
evidentiarySufficiencyDetermined = false
findingResolved = false
claimTruthVerified = false
```

The pointer answers only:

> Which validated historical round does this explicit pointer reference?

It does not answer:

> Is that round resolved, sufficient, true or approved?

---

## 20. Conflict behavior

V180 fails closed for:

- wrong source schema;
- malformed source API;
- wrong claim;
- wrong envelope;
- wrong pointer state;
- missing current round ref;
- locator outside claim;
- cross-lot pointer;
- multiple candidates for the same claim;
- parent V179 history not valid;
- current round ref absent from V179 history;
- ambiguous matching V179 round.

No partial pointer is published as valid after conflict.

---

## 21. Multiple pointer candidates

Even if one pointer has a later timestamp than another:

```text
P-A observedAt = 2026-08-01
P-B observedAt = 2026-09-01
```

V180 does not choose P-B.

The result is conflict.

```text
MULTIPLE_POINTERS_FAIL_CLOSED
```

---

## 22. No helper bypass

The executive adapter reads the source `records()` contract directly.

A malicious or inconsistent `forClaim()` helper cannot insert a pointer that is absent from `records()`.

---

## 23. Source states

The pointer source is modeled categorically:

```text
AVAILABLE
MISSING
SCHEMA_MISMATCH
INVALID_API
```

A missing pointer source is not a negative project conclusion.

It means only that an explicit pointer is not available through this contract.

---

## 24. Authority matrix

| Authority | V180 |
|---|---|
| Canonical mutation | false |
| Financial mutation | false |
| Current-round authority | false |
| Latest-round authority | false |
| Chronology authority | false |
| Claim truth | false |
| Evidence acceptance | false |
| Evidence sufficiency | false |
| Finding resolution | false |
| Certification | false |
| DD approval | false |
| Eligibility | false |
| Financing approval | false |
| Investment decision | false |
| Offer / solicitation | false |
| Brokerage | false |
| Custody | false |
| Payment | false |
| Disbursement | false |

AI remains:

```text
ADVISORY_ONLY
```

---

## 25. No score

V180 computes categorical counts only.

It does not calculate:

- risk score;
- credit score;
- project score;
- investment score;
- current-round confidence score;
- pointer confidence percentage;
- round priority weight.

```text
COUNTS_ONLY != SCORE
```

---

## 26. Summary semantics

The V180 summary may count:

- envelopes;
- exact current pointer references;
- conflicts;
- explicit pointer refs.

It also explicitly reports zero for:

- current-round authority;
- latest-round determination;
- chronology determination;
- truth;
- acceptance;
- sufficiency;
- resolution;
- DD approval;
- eligibility;
- financing approval;
- decision authority.

Counts do not produce a rating.

---

## 27. Read-only surface

Surface:

```text
/sana-v3-dataroom-executive-v180.html
```

The left pane displays:

- lot/section filters;
- pointer counts;
- conflict counts;
- pointer source state;
- exact pointer rule;
- pointer ref;
- current round ref;
- referenced V179 stage;
- opening/request/response/follow-up refs;
- V179 history's untouched current-round fields;
- authority boundaries.

The right pane keeps the existing same-origin Data Room view.

There are no forms or writes.

---

## 28. Adversarial validation

The V180 validator constructs a real stacked fixture with:

- V175 attestation;
- V176 external-verification reference;
- V177 reviews;
- V178 handoffs;
- V179 three validated round stages;
- V180 pointer candidates.

It tests pointers to:

1. request-only round;
2. request-response round;
3. request-response-follow-up round.

The pointed V179 stage must remain unchanged.

---

## 29. Multiple-pointer adversarial case

The validator injects two direct pointer records for the same claim envelope.

Even when their refs or timestamps could be ordered, the result must be:

```text
CURRENT_ROUND_POINTER_CONFLICT
```

with:

```text
MULTIPLE_CURRENT_POINTERS_FOR_CLAIM
```

No winner is selected.

---

## 30. Unknown-round adversarial case

A pointer to a round not present in validated V179 history fails closed:

```text
CURRENT_ROUND_REF_NOT_FOUND_IN_PARENT
```

V180 never materializes a phantom round.

---

## 31. Parent-history conflict

If V179 history itself is in conflict, a V180 pointer cannot bypass it.

V180 exposes:

```text
PARENT_REMEDIATION_ROUND_HISTORY_NOT_VALID
```

A pointer does not repair or override parent integrity failure.

---

## 32. Determinism and immutability

V180 validation confirms:

- input fixtures remain unchanged;
- normalized records are frozen;
- executive output is frozen;
- repeated builds with the same contracts produce equivalent serialized output.

No mutable hidden state is introduced.

---

## 33. Regression chain

V180 CI runs:

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
V180
```

The new slice must not weaken prior boundaries.

---

## 34. Provenance gap

V180 preserves the verified Git lineage statement:

```text
V164–V169 = NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE
```

Policy:

```text
DO_NOT_RECONSTRUCT_MISSING_HISTORY
```

No current-pointer feature is allowed to rewrite historical Git provenance.

---

## 35. What V180 does not solve

V180 does not define pointer history or pointer supersession.

If a pointer changes from ROUND-A to ROUND-B over time, V180's snapshot contract alone does not establish:

- predecessor pointer;
- successor pointer;
- supersession reason;
- who authorized the pointer change;
- chronological order of pointer versions.

Those require another explicit contract.

---

## 36. Natural next boundary

A future version may define pointer-history integrity using exact references such as:

```text
pointerEventRef
claimId
claimEnvelopeRef
predecessorPointerRef
successorPointerRef
fromRoundRef
toRoundRef
REFERENCE_ONLY
```

That layer must still avoid automatic authority or chronology unless the contract explicitly represents those semantics.

---

## 37. Final semantic contract

```text
CURRENT_ROUND_REFERENCE_ONLY
  != CURRENT_ROUND_AUTHORITY
  != LATEST_ROUND

EXPLICIT_CURRENT_POINTER
  != CHRONOLOGICAL_TRUTH

POINTER_OBSERVED_AT
  != PRIORITY

CURRENT_POINTER
  != ROUND_COMPLETION
  != FINDING_RESOLUTION

CURRENT_POINTER
  != EVIDENCE_ACCEPTED
  != EVIDENCE_SUFFICIENCY

POINTER_TO_SUFFICIENT_FOR_SCOPE_REVIEW
  != UNIVERSAL_SUFFICIENCY

POINTER_TO_ADDITIONAL_EVIDENCE_ROUND
  != NEGATIVE_PROJECT_CONCLUSION

CURRENT_POINTER
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

V180 therefore adds explicit current-round **reference selection** without silently introducing current-round authority, latest-round inference, chronology, approval or financial decision power.