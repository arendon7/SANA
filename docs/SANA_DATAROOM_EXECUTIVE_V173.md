# SANA Data Room Executive · V173 Claim-to-Reference Matrix

## Purpose

V173 introduces a controlled provenance-claim layer over V172. Its responsibility is not to decide whether a project, crop, financial case, impact statement or review outcome is true or good. Its only responsibility is to make an auditable chain between a bounded statement about source availability and the exact V172 locator keys that support that statement.

The matrix is therefore:

`controlled statement → V172 locator keys → V171 source relation → source limitations`

## Stack

- parent: V172 / Draft PR #132
- parent exact head: `61a9eb5df8dffdc536bc107f886dcdf195d7c258`
- branch: `demo/sana-dataroom-executive-v173`
- issue: #133

V173 consumes both V171 and V172. It creates no additional source registry or locator engine.

## Schema

`SANA_DATAROOM_EXECUTIVE_CLAIMS_V1`

Version: `V173`

## Controlled claim vocabulary

Only six claim classes exist in this slice:

- `SOURCE_REFERENCE_PRESENT`
- `SOURCE_REFERENCE_UNAVAILABLE`
- `SNAPSHOT_REFERENCE_PRESENT`
- `CASE_REFERENCE_PRESENT`
- `EVENT_REFERENCE_PRESENT`
- `ENTITY_REFERENCE_PRESENT`

No LLM-generated claim wording is permitted. Claim statements come from `CLAIM_TEMPLATES_V1` and interpolate only the registered source label and selected lot scope.

## Claim contract

Each claim contains:

- deterministic claim ID;
- executive section ID;
- V171 source relation ID;
- source global, repository file and SANA view;
- fixed claim class;
- deterministic controlled statement;
- support state;
- explicit V172 locator keys;
- categorical locator-kind counts;
- selected lot lens;
- inherited scope qualities and limitations;
- `truthVerified=false`;
- `sufficiencyDetermined=false`;
- `decisionAuthority=false`;
- `referenceOnly=true`.

Deterministic claim ID:

`CLM :: sourceId :: claimClass :: selectedLot|GLOBAL`

## Support states

### REFERENCED_ONLY

The claim must reference at least one V172 locator that is not `SOURCE_ONLY`.

This means only that the relevant source has an explicit localizable reference under V172's bounded rules.

It does **not** mean:

- verified fact;
- validated evidence;
- complete dossier;
- sufficient evidence;
- approved review;
- causal proof;
- financial eligibility;
- investment quality.

### UNAVAILABLE_OR_PARTIAL

The source has no explicit non-`SOURCE_ONLY` locator for the selected scope. The claim may reference only the V172 `SOURCE_ONLY` locators that explain the limitation.

This state is not a negative conclusion about the project.

## Locator-key integrity

V173 first builds the current V172 result for the same selected lot lens. Every claim locator key is validated against that exact V172 result.

A claim cannot reference:

- a locator from another V172 execution;
- a made-up locator key;
- a locator from another lot leaked through an official lot-scoped source;
- a source relation that is not in the V171 registry.

If a claim key is outside the parent V172 result, runtime construction fails closed with `LOCATOR_KEY_OUTSIDE_PARENT`.

## Scope semantics

V173 inherits scope semantics from V172 rather than redefining them.

- `LOT_EXACT` remains available only where V171/V172 support official `forLot(lot)`.
- `SNAPSHOT_GLOBAL` remains snapshot-global even when entity references inside that snapshot match a selected lot.
- `REFERENCE_CASE` remains reference-only and is never promoted to verified lot identity.

A claim may contain multiple scope qualities only when its supporting locators legitimately do so. No weighted scope quality or composite score is computed.

## Counts

V173 exposes categorical counts only:

- claim total;
- count by claim class;
- count by support state;
- `truthVerified=0`;
- `sufficiencyDetermined=0`;
- `decisionAuthority=0`.

Semantic invariant:

`CLAIM_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE`

Multiple locators do not increase a truth score because no truth score exists.

## Authority

Hard-coded:

- `canonicalMutationAvailable=false`
- `financialMutationAvailable=false`
- `truthVerificationAuthority=false`
- `sufficiencyAuthority=false`
- `decisionAuthority=false`
- `aiAuthority=ADVISORY_ONLY`
- no offer authority
- no solicitation authority
- no brokerage authority
- no custody authority
- no payment authority
- no disbursement authority.

## Semantics

V173 explicitly preserves:

- `CLAIM_STATEMENT != VERIFIED_FACT`
- `LOCATOR_SUPPORT != EVIDENTIARY_SUFFICIENCY`
- `MULTIPLE_LOCATORS != STRONGER_TRUTH`
- `SOURCE_PRESENT != COMPLETE_DOSSIER`
- `SOURCE_UNAVAILABLE != NEGATIVE_PROJECT_CONCLUSION`
- `REFERENCE_CHAIN != CAUSAL_PROOF`
- `CLAIM_COUNT != SCORE`

## Review surface

`/sana-v3-dataroom-executive-v173.html`

Filters:

- selected lot lens;
- executive section;
- claim class.

Each claim card displays:

- claim/source identity;
- controlled statement;
- support state;
- exact locator keys;
- inherited scope quality and limitations;
- explicit false truth/sufficiency/decision flags;
- navigation only to the V171 registered SANA source view.

The page contains no form, network write or persistence mutation.

## Validation

The V173 validator proves:

- exact schema/version;
- fixed claim vocabulary;
- controlled template marker;
- dependency on V171 + V172;
- no parallel source registry;
- no network/storage mutation primitives;
- no risk/credit/investment scoring fields;
- all claim locator keys exist in the exact current V172 result;
- `REFERENCED_ONLY` claims use only non-`SOURCE_ONLY` locators;
- unavailable claims use only `SOURCE_ONLY` locators;
- Capital Review claims under LOT-A cannot inherit LOT-B locators;
- reference governance claims preserve `REFERENCE_CASE` scope;
- missing Nutrition V2 remains an unavailable claim;
- repeated builds are deterministic;
- source fixtures remain unchanged;
- V170/V171/V172 regression suites stay green.

## Exit

V173 is reviewable only after its exact-head workflow is green. It does not establish truth verification, evidentiary sufficiency, eligibility, approval, financing, investment recommendation, Product Approved, D10 or Production Ready.

## Recommended V174

**Executive Claim Envelope / Human Attestation Boundary**: add a read-only envelope that distinguishes three separate things without merging them: controlled provenance claim, optional human attestation reference, and external verification state. The next slice should still avoid evaluating the truth of the claim; it should only model who/what has asserted or verified it and with which explicit reference.