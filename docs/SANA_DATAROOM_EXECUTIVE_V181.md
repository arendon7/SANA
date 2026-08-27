# SANA Data Room Executive V181

## Exact Current-Pointer Predecessor Lineage

**Version:** V181  
**Schema:** `SANA_DATAROOM_EXECUTIVE_EXACT_CURRENT_POINTER_LINEAGE_V1`  
**Parent:** V180  
**Exact parent SHA:** `8d7e51747d6618372654e42e4a0105f649da516a`  
**Issue:** #150

---

## 1. Purpose

V181 adds an explicit history layer for the remediation-round pointer introduced in V180.

V180 can answer:

> Which validated V179 round does the explicit current pointer reference?

V180 deliberately cannot answer:

> What pointer came before it?

V181 adds that missing predecessor-reference lineage without inferring chronology or authoritative supersession.

---

## 2. Architecture

The chain now becomes:

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
V180 explicit current-round pointer
  ↓
V181 explicit pointer predecessor lineage
```

V181 does not replace V180.

It validates a history against the already validated V180 current pointer.

---

## 3. Source contract

New source schema:

```text
SANA_DATAROOM_CLAIM_CURRENT_POINTER_HISTORY_V1
```

Global:

```text
__SANA_DATAROOM_CLAIM_CURRENT_POINTER_HISTORY__
```

Factory:

```text
__SANA_DATAROOM_CLAIM_CURRENT_POINTER_HISTORY_V181_FACTORY__
```

Allowed event state only:

```text
CURRENT_POINTER_HISTORY_REFERENCE_ONLY
```

---

## 4. Baseline

Baseline history records:

```text
0
```

Therefore:

```text
CONTRACT_AVAILABLE != HISTORY_EXISTS
```

A valid V180 pointer does not auto-create V181 history.

---

## 5. Source event fields

A normalized history event contains:

- `pointerEventRef`
- `pointerRef`
- `claimId`
- `claimEnvelopeRef`
- `currentRoundRef`
- `predecessorPointerRef`
- `eventState`
- `locatorKeys`
- `lotId`
- `observedAt`
- provenance

`predecessorPointerRef` is nullable only for the declared root.

---

## 6. Source semantics

The source record says only:

> pointer X explicitly references pointer Y as its predecessor.

It does **not** say:

- Y occurred at a verified earlier time;
- X legally superseded Y;
- X was approved over Y;
- Y became invalid;
- the round referenced by X is newer or better.

```text
POINTER_PREDECESSOR_REFERENCE
  != CHRONOLOGICAL_TRUTH
  != AUTHORITATIVE_SUPERSESSION
```

---

## 7. Source-level normalization

The normalized record always keeps:

```text
supersessionAuthority = false
chronologyDetermined = false
latestPointerDetermined = false
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
superseded: true
latest: true
authoritative: true
approved: true
score: 100
```

are not promoted into the normalized contract.

---

## 8. Source duplicate integrity

The source factory rejects duplicate:

```text
pointerEventRef
```

with:

```text
DUPLICATE_POINTER_EVENT_REF
```

and duplicate:

```text
pointerRef
```

with:

```text
DUPLICATE_POINTER_REF
```

The same pointer cannot occupy two independent positions in the normalized source history.

---

## 9. Self predecessor rejection

A pointer cannot name itself as predecessor.

```text
pointerRef == predecessorPointerRef
```

is rejected as:

```text
SELF_PREDECESSOR_NOT_ALLOWED
```

---

## 10. Executive exact-lineage rule

Typed rule:

```text
CLAIM_CURRENT_POINTER_LINEAGE_EXACT_V1
```

It validates:

- exact source schema;
- exact claim;
- exact envelope;
- exact event state;
- locator subset;
- lot consistency;
- pointer/event uniqueness;
- predecessor existence;
- one root;
- no cycles;
- no branching successors;
- exact V179 round existence;
- exact V180 current-pointer consistency;
- terminal current pointer;
- total reachability from current back to root.

---

## 11. Exact predecessor relation

For every non-root event:

```text
predecessorPointerRef
```

must resolve to exactly one pointer history record for the same claim envelope.

Missing predecessor:

```text
PREDECESSOR_POINTER_REF_NOT_FOUND
```

fails the claim's V181 lineage closed.

---

## 12. Exactly one root

A valid non-empty lineage has exactly one history event with:

```text
predecessorPointerRef = null
```

Zero roots fail as:

```text
POINTER_HISTORY_ROOT_NOT_FOUND
```

More than one root fails as:

```text
MULTIPLE_POINTER_HISTORY_ROOTS
```

V181 does not choose one root by time or array position.

---

## 13. No branching successor selection

A predecessor pointer may not have more than one successor in a valid V181 chain.

Example:

```text
P1 → P2
P1 → P3
```

is not resolved by choosing P2 or P3.

It fails as:

```text
POINTER_HISTORY_BRANCH_NOT_ALLOWED
```

This prevents an implicit branch-ranking algorithm.

---

## 14. Cycle rejection

Explicit predecessor links must be acyclic.

Example:

```text
P2 predecessor = P3
P3 predecessor = P2
```

fails as:

```text
POINTER_HISTORY_CYCLE
```

A cycle cannot be transformed into an ordered history by timestamp.

---

## 15. Exact V179 round validation

Every history event contains:

```text
currentRoundRef
```

That round ref must resolve to exactly one validated round in the envelope's V179 history.

Unknown round:

```text
HISTORY_ROUND_REF_NOT_FOUND
```

Ambiguous round:

```text
HISTORY_ROUND_REF_AMBIGUOUS
```

The pointer-history layer does not materialize new remediation rounds.

---

## 16. Exact V180 current-pointer consistency

For a V181 lineage to be accepted, V180 must already expose:

```text
CURRENT_ROUND_REFERENCE_ONLY
```

with:

```text
currentRoundReferenceDetermined = true
```

Exactly one V181 history event must match both:

```text
pointerRef == V180.pointerRef
currentRoundRef == V180.currentRoundRef
```

Otherwise lineage fails closed.

---

## 17. Current pointer must be terminal

No history event may declare the V180 current pointer as its predecessor.

If another event says:

```text
predecessorPointerRef = V180.currentPointerRef
```

then the V180 pointer is not the terminal node of the declared chain.

V181 returns:

```text
V180_CURRENT_POINTER_NOT_TERMINAL
```

It does not silently replace the V180 current pointer.

---

## 18. Full reachability

Starting at the exact V180 current pointer and following explicit predecessor references backward must reach every history record for the claim.

If any record is disconnected:

```text
POINTER_HISTORY_DISCONNECTED_FROM_CURRENT
```

The lineage fails closed.

---

## 19. Successful lineage state

When all checks pass, V181 exposes:

```text
CURRENT_POINTER_LINEAGE_REFERENCES_ONLY
```

The lineage array is constructed from root to the V180 current pointer by following explicit predecessor references.

---

## 20. Other envelope states

V181 exposes only:

```text
NO_EXPLICIT_POINTER_HISTORY
CURRENT_POINTER_LINEAGE_REFERENCES_ONLY
CURRENT_POINTER_LINEAGE_CONFLICT
```

These are lineage integrity states.

They are not project, DD, financing or evidence-quality statuses.

---

## 21. Sequence index meaning

A valid lineage node receives a deterministic:

```text
sequenceIndex
```

The index is derived exclusively from the explicit predecessor chain.

It is not derived from `observedAt`.

```text
SEQUENCE_INDEX_DERIVED_FROM_EXPLICIT_PREDECESSOR_CHAIN_NOT_TIMESTAMP
```

---

## 22. Timestamp policy

`observedAt` remains source provenance metadata.

It does not determine:

- predecessor;
- successor;
- root;
- current pointer;
- latest pointer;
- supersession;
- chronology authority.

The adversarial tests deliberately reverse timestamps to prove this boundary.

---

## 23. Source-order policy

The source array may arrive in any order.

V181 reconstructs the lineage only from exact predecessor refs.

Array position has no authority.

---

## 24. Pointer-ref lexical order policy

Pointer IDs may look sortable:

```text
P1
P2
P3
```

or not.

V181 never uses lexical or numeric pointer IDs to infer sequence.

---

## 25. Current consistency versus latest

V181 may establish:

```text
currentPointerHistoryConsistencyDetermined = true
```

because the explicit predecessor chain terminates at the explicit V180 current pointer.

Yet V181 always keeps:

```text
latestPointerRef = null
latestPointerDetermined = false
latestPointerAuthority = false
```

```text
V180_CURRENT_POINTER_CONSISTENCY
  != LATEST_POINTER_DETERMINATION
```

---

## 26. Supersession boundary

V181 does not grant supersession authority.

Always:

```text
supersessionAuthority = false
```

A predecessor relationship is a declared reference topology.

It is not a legal, governance, audit or financial supersession decision.

---

## 27. Chronology boundary

Always:

```text
chronologyDetermined = false
chronologyAuthority = false
```

Even a complete root→current chain is not independently verified event chronology.

```text
ROOT_TO_CURRENT_EXPLICIT_CHAIN
  != INDEPENDENTLY_VERIFIED_EVENT_CHRONOLOGY
```

---

## 28. Referenced V179 stage preservation

Each V181 node exposes the exact V179 round stage referenced by that pointer event.

Possible stages include:

```text
REQUEST_ROUND_REFERENCE_ONLY
REQUEST_RESPONSE_ROUND_REFERENCE_ONLY
REQUEST_RESPONSE_FOLLOWUP_REVIEW_ROUND_REFERENCE_ONLY
```

The lineage does not upgrade or downgrade those stages.

---

## 29. Pointer transition does not resolve a round

Moving from a predecessor pointer to a successor pointer does not mean:

- predecessor round completed;
- successor round completed;
- evidence was accepted;
- finding was resolved;
- review was approved.

```text
POINTER_TRANSITION
  != ROUND_COMPLETION
  != FINDING_RESOLUTION
```

---

## 30. Evidence boundaries

Always:

```text
claimTruthVerified = false
evidenceAccepted = false
evidentiarySufficiencyDetermined = false
findingResolved = false
```

Pointer lineage is administrative/provenance structure, not evidence authority.

---

## 31. Financial and DD boundaries

V181 never establishes:

- due diligence approval;
- project eligibility;
- financing approval;
- investment recommendation;
- investment decision;
- disbursement.

```text
POINTER_HISTORY
  != DUE_DILIGENCE_APPROVAL
  != ELIGIBILITY
  != FINANCING_APPROVAL
  != INVESTMENT_DECISION
```

---

## 32. Authority matrix

| Authority | V181 |
|---|---|
| Canonical mutation | false |
| Financial mutation | false |
| Supersession authority | false |
| Current-round authority | false |
| Latest-pointer authority | false |
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

## 33. No score

V181 computes categorical counts only.

It does not create:

- lineage confidence score;
- pointer trust score;
- chronology confidence;
- remediation score;
- DD score;
- investment score;
- weighted transition score.

```text
COUNTS_ONLY != SCORE
```

---

## 34. Read-only surface

Surface:

```text
/sana-v3-dataroom-executive-v181.html
```

The review surface shows:

- lot and section filters;
- lineage count;
- pointer-history reference count;
- conflicts;
- source state;
- exact rule;
- root pointer;
- current pointer;
- each explicit predecessor link;
- referenced V179 round and stage;
- `observedAt` as metadata;
- current-pointer consistency;
- explicit no-authority boundaries.

No forms or writes exist.

---

## 35. Adversarial fixtures

The validator builds a complete real fixture chain through V180 and three V179 round stages.

It then tests pointer histories of:

- one node;
- two nodes;
- three nodes.

---

## 36. Reversed timestamp test

The three-node valid chain deliberately uses timestamps that contradict intuitive chronological sorting.

Example conceptually:

```text
P1 observedAt = year 3000
P2 observedAt = year 1000
P3 observedAt = year 1800
```

Explicit predecessor refs still define:

```text
P1 → P2 → P3
```

for lineage rendering.

V181 still keeps:

```text
chronologyDetermined = false
```

---

## 37. Branch adversarial test

The validator injects:

```text
P1 → P2
P1 → P3
```

The result must include:

```text
POINTER_HISTORY_BRANCH_NOT_ALLOWED
```

No branch is selected by timestamp.

---

## 38. Cycle adversarial test

The validator injects a predecessor cycle.

The result must expose:

```text
POINTER_HISTORY_CYCLE
```

No topological order is fabricated.

---

## 39. Multiple-root adversarial test

Two root records for one claim fail as:

```text
MULTIPLE_POINTER_HISTORY_ROOTS
```

V181 does not choose the root whose date appears earlier.

---

## 40. Missing predecessor test

A non-root record that references an unknown pointer fails as:

```text
PREDECESSOR_POINTER_REF_NOT_FOUND
```

---

## 41. Current-not-terminal test

The validator adds a successor after the V180 current pointer.

V181 must fail with:

```text
V180_CURRENT_POINTER_NOT_TERMINAL
```

It does not change V180's current pointer.

---

## 42. Unknown-round test

A pointer-history event referencing a round absent from V179 fails as:

```text
HISTORY_ROUND_REF_NOT_FOUND
```

No round is inferred from nearby IDs or dates.

---

## 43. Parent-current-pointer dependency

If V180 does not expose a valid explicit current pointer, V181 history cannot be accepted as current-pointer lineage.

It fails with:

```text
PARENT_CURRENT_POINTER_NOT_VALID
```

---

## 44. Parent-round-history dependency

If V179 remediation history is itself invalid/conflicted, V181 cannot bypass it.

It exposes:

```text
PARENT_REMEDIATION_ROUND_HISTORY_NOT_VALID
```

---

## 45. Helper bypass protection

V181 reads source `records()` directly.

A source `forClaim()` helper that returns extra history cannot bypass the exact contract.

---

## 46. Source states

Categorical source states remain:

```text
AVAILABLE
MISSING
SCHEMA_MISMATCH
INVALID_API
```

Missing history is not a negative project conclusion.

---

## 47. Determinism and freezing

Validation confirms:

- input fixtures remain unchanged;
- source records are frozen;
- lineage nodes are frozen;
- executive output is frozen;
- repeated builds serialize equivalently.

---

## 48. Summary semantics

V181 summary may count:

- envelopes with lineage;
- no-history envelopes;
- conflicts;
- pointer-history references;
- consistency-determined references.

It always reports zero authority for supersession, chronology, latest-pointer, truth, evidence, sufficiency, resolution, DD, eligibility, financing and decision.

---

## 49. Regression chain

V181 CI executes:

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
V181
```

V181 must preserve every prior boundary.

---

## 50. Provenance gap

The historical Git lineage discrepancy remains explicit:

```text
V164–V169 = NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE
```

Policy remains:

```text
DO_NOT_RECONSTRUCT_MISSING_HISTORY
```

Pointer lineage cannot be used to reconstruct missing Git history.

---

## 51. What V181 does not solve

V181 does not prove that the declared predecessor relation was authorized.

It also does not prove:

- why a pointer changed;
- who approved the change;
- whether the predecessor was formally revoked;
- when the change legally became effective;
- whether the successor has governance authority.

Those are separate governance semantics.

---

## 52. Natural next boundary

A future version could define an explicit pointer-change governance reference contract, containing fields such as:

```text
transitionRef
predecessorPointerRef
successorPointerRef
governanceCaseRef
dispositionRef
REFERENCE_ONLY
```

Such a layer would still have to distinguish governance-reference presence from verified authorization and decision authority.

---

## 53. Final semantic contract

```text
POINTER_PREDECESSOR_REFERENCE
  != CHRONOLOGICAL_TRUTH
  != AUTHORITATIVE_SUPERSESSION

ROOT_TO_CURRENT_EXPLICIT_CHAIN
  != INDEPENDENTLY_VERIFIED_EVENT_CHRONOLOGY

V180_CURRENT_POINTER_CONSISTENCY
  != LATEST_POINTER_DETERMINATION

POINTER_TRANSITION
  != ROUND_COMPLETION
  != FINDING_RESOLUTION

POINTER_HISTORY
  != EVIDENCE_ACCEPTANCE
  != EVIDENCE_SUFFICIENCY

POINTER_HISTORY
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

V181 therefore establishes exact predecessor-lineage integrity without silently granting supersession authority, chronology authority, latest-pointer authority or financial decision power.