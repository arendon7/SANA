# SANA Data Room Executive V184

## Exact Governance Cross-Source Structural Consistency

V184 checks explicit relational consistency among governance objects whose identifiers were resolved by V183.

It is a read-only structural check. It does not verify source truth, legal validity, authority, compliance, sufficiency or financial eligibility.

## Stack

- Parent: V183
- Parent branch: `demo/sana-dataroom-executive-v183`
- Exact parent SHA: `79357fe12cba9abf02780d56c201516734405d95`
- Parent schema: `SANA_DATAROOM_EXECUTIVE_EXACT_GOVERNANCE_REFERENCE_RESOLUTION_V1`
- Issue: #156

V164–V169 remain `NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE` and must not be reconstructed.

## No new source of truth

V184 adds no source contract.

It reuses the same existing review APIs inspected by V183:

- `SANA_DATAROOM_REVIEW_GOVERNANCE_V1`
- `SANA_DATAROOM_REVIEW_DISPOSITION_V1`
- `SANA_DATAROOM_REVIEW_ROUND_V1`

The adapter reads `cases()` directly. Helper methods cannot override structural matching.

## Executive schema

`SANA_DATAROOM_EXECUTIVE_EXACT_GOVERNANCE_STRUCTURAL_CONSISTENCY_V1`

Rule:

`GOVERNANCE_CROSS_SOURCE_STRUCTURAL_CONSISTENCY_EXACT_V1`

## Structural checks

V184 evaluates only these closed relations.

### 1. Governance ↔ Disposition capital case

When the governance case and disposition case are both resolved and both declare non-empty `capitalCaseRef`:

`governanceCase.capitalCaseRef === dispositionCase.capitalCaseRef`

A missing field is not inferred.

### 2. Governance ↔ Review Round capital case

When both resolved objects declare non-empty `capitalCaseRef`:

`governanceCase.capitalCaseRef === reviewRound.capitalCaseRef`

### 3. Disposition ↔ Review Round capital case

When both resolved objects declare non-empty `capitalCaseRef`:

`dispositionCase.capitalCaseRef === reviewRound.capitalCaseRef`

### 4. Disposition case membership in Review Round

When both a disposition and a review round are declared and resolved:

`reviewRound.dispositionCaseRefs[]` must contain the exact resolved disposition case `id`.

This is membership of identifiers only.

It does not verify the disposition itself or establish that a review was completed.

## Relation sub-states

A structural relation can be:

- `MATCH_EXACT`
- `CONFLICT`
- `NOT_COMPARABLE_FIELD_MISSING`
- `NOT_EVALUABLE_OBJECT_MISSING`
- `NOT_APPLICABLE`

No approximate relation exists.

## Per-governance-reference states

- `STRUCTURALLY_CONSISTENT_EXACT_REFERENCES_ONLY`
- `STRUCTURALLY_PARTIAL_EXACT_REFERENCES_ONLY`
- `STRUCTURE_NOT_EVALUABLE_FROM_CURRENT_REFERENCES`
- `STRUCTURAL_REFERENCE_CONFLICT`

### Structurally consistent

All applicable relations are explicitly comparable and match exactly.

This means structural reference consistency only.

### Structurally partial

At least one explicit relation matches, while another applicable relation cannot be compared because a source field is absent.

V184 does not fill missing fields from context.

### Not evaluable

Examples include:

- required V183 identifier unresolved;
- V183 identifier ambiguous/conflicting;
- declared source object cannot be uniquely rehydrated;
- source schema/API unavailable;
- no cross-source relation exists to compare.

Not evaluable is not a negative project conclusion.

### Structural conflict

A structurally comparable explicit relation contradicts, for example:

- two non-empty `capitalCaseRef` values differ;
- a resolved disposition case ID is absent from the resolved round's `dispositionCaseRefs[]`.

A structural conflict is a reference-graph inconsistency. It is not automatically:

- fraud;
- invalidity;
- noncompliance;
- project risk;
- investment risk;
- DD rejection.

## Envelope states

- `NO_GOVERNANCE_REFERENCES_TO_EVALUATE`
- `GOVERNANCE_STRUCTURALLY_CONSISTENT_EXACT_REFERENCES_ONLY`
- `GOVERNANCE_STRUCTURALLY_PARTIAL_EXACT_REFERENCES_ONLY`
- `GOVERNANCE_STRUCTURE_NOT_EVALUABLE`
- `GOVERNANCE_STRUCTURAL_REFERENCE_CONFLICT`

These labels are categorical only.

No score, ratio, percentage or weighting is calculated.

## Parent preservation

V184 preserves:

- V182 pointer-transition governance reference coverage;
- V183 identifier-resolution states.

For example, V182 may remain `POINTER_TRANSITION_GOVERNANCE_REFERENCES_COMPLETE` while V184 reports a structural conflict. That does not contradict V182: V182 states that references cover all transitions; V184 separately checks explicit relations among the referenced objects.

Similarly, V183 `RESOLVED_EXACTLY` means an identifier exists exactly, not that its relations are internally consistent.

## Critical semantics

`STRUCTURAL_CONSISTENCY ≠ SOURCE_TRUTH`

`STRUCTURAL_CONSISTENCY ≠ REFERENCE_VERIFICATION`

`STRUCTURAL_CONSISTENCY ≠ CASE_VALIDITY`

`SAME_CAPITAL_CASE_REF ≠ AUTHORIZATION`

`DISPOSITION_CASE_MEMBER_OF_ROUND ≠ VALID_DISPOSITION`

`DISPOSITION_CASE_MEMBER_OF_ROUND ≠ REVIEW_COMPLETED`

`STRUCTURAL_CONSISTENCY ≠ GOVERNANCE_SUFFICIENCY`

`STRUCTURAL_CONSISTENCY ≠ COMPLIANCE`

`STRUCTURAL_CONSISTENCY ≠ LEGAL_EFFECT`

`STRUCTURAL_CONFLICT ≠ NEGATIVE_PROJECT_CONCLUSION`

`STRUCTURAL_CONFLICT ≠ INVESTMENT_RISK`

`COUNTS_ONLY ≠ SCORE`

`CAPITAL_READY ≠ FINANCING_APPROVAL`

## Authority boundaries

Always false:

- structural-truth authority;
- reference-verification authority;
- case-validity authority;
- reviewer identity/qualification/authority;
- governance authority;
- transition authorization/approval;
- compliance authority;
- legal-effect authority;
- supersession authority;
- chronology authority;
- claim-truth authority;
- evidence acceptance;
- evidentiary sufficiency;
- finding resolution;
- certification;
- DD approval;
- eligibility;
- financing approval;
- decision authority;
- canonical mutation;
- financial mutation;
- custody/payment/disbursement.

AI remains `ADVISORY_ONLY`.

## Read-only review surface

`/sana-v3-dataroom-executive-v184.html`

It shows:

- envelope categorical state;
- each exact pointer transition;
- each structural relation and its sub-state;
- explicit false truth/verification/authorization/compliance/legal-effect flags;
- no mutation form or external write path.

## Adversarial validation

`scripts/validate-sana-dataroom-executive-v184.mjs` proves:

- four exact relations can all match;
- capital-case mismatch becomes structural conflict;
- disposition membership mismatch becomes structural conflict;
- missing comparable fields yield partial/not-evaluable rather than inference;
- governance+disposition alone can be structurally consistent when their explicit relation matches;
- governance-only reference is not evaluable as a cross-source relation;
- unresolved V183 identifiers are not promoted to consistency;
- wrong source schema/malformed API remain non-positive;
- source helper cannot bypass `cases()`;
- malicious verified/authorized/approved/compliant/effective/score-like input does not elevate output;
- V182 and V183 states remain preserved;
- output remains frozen;
- V164–V169 provenance gap remains preserved.

## CI

Workflow V184 runs:

- JavaScript syntax check;
- V170→V183 regression chain;
- V184 adversarial validation;
- V184 read-only surface gates;
- structural/authority boundary gates.

An exact head is considered green only when the workflow for that same SHA succeeds.

## Delivery policy

V184 is additive and stacked on V183.

No previous review module is mutated or granted new authority.

No wallet, custody, payment, disbursement, brokerage, solicitation, credit decision, automated approval or investment decision is introduced.
