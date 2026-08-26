# SANA Data Room Executive · V172 Evidence Drill-down

## Purpose

V172 turns the V171 typed source registry into a bounded, read-only source locator.

The objective is simple: from an executive section, identify the exact reference that can be inspected in SANA — snapshot, case, event or bounded entity — without claiming that the reference is true, sufficient, externally verified or decision-grade.

## Stack

- parent: V171 / Draft PR #130
- parent exact head: `979e7de4981acff4f1c45cd5032a8cda53a0a3e7`
- branch: `demo/sana-dataroom-executive-v172`
- issue: #131

V172 consumes the V171 registry. It does not create another source registry.

## Runtime contract

Schema: `SANA_DATAROOM_EXECUTIVE_LOCATOR_V1`

Version: `V172`

Locator kinds:

- `SNAPSHOT_REF`
- `CASE_REF`
- `EVENT_REF`
- `ENTITY_REF`
- `SOURCE_ONLY`

Every locator contains:

- executive section ID;
- V171 source relation ID;
- source global, repository file and SANA source view;
- V171 strategy and scope quality;
- reference ID;
- parent reference when applicable;
- explicitly declared lot when available;
- observed/cut/as-of timestamp when available;
- source/locator limitations;
- `referenceOnly=true`;
- `verificationState=NOT_VERIFIED_BY_LOCATOR`;
- immutable authority boundary.

## Extraction is bounded

V172 does not recursively crawl arbitrary source objects.

The only state collections inspected are:

- `rows`
- `lots`
- `cases`
- `gaps`
- `indicators`

Only records with an explicit identifier are emitted. Recognized explicit identifiers are bounded to known reference keys such as `id`, `caseId`, `eventId`, `lotId`, `materialId`, `planId`, `findingRef`, `reviewRef` and `gapId`.

Unknown nested structures are not interpreted.

## Strategy behavior

### SNAPSHOTS

Uses the registered `snapshots()` accessor and emits only snapshots with an explicit ID. A lot lens does not turn a snapshot reference into lot-exact history.

### STATE / CURRENT

Uses only the exact V171 accessor. It may emit:

1. the explicit `snapshot`/`latest` reference;
2. explicit IDs from the bounded top-level collections above.

Under a lot lens, bounded entity references with an explicit different lot are excluded. Matching an entity's declared lot within a snapshot remains `SNAPSHOT_GLOBAL`, with the limitation:

`DECLARED_ENTITY_LOT_FILTER_WITHIN_SNAPSHOT_NOT_LOT_EXACT`.

### FOR_LOT_CASES

When a lot lens is active, V172 uses the official V171 source `forLot(lot)` accessor. It emits explicit case IDs and event IDs contained in those returned cases.

These references may carry `LOT_EXACT` scope quality because the underlying source API supports official lot filtering. This still does not verify identity, evidence quality or outcome.

### CASES_EVENTS

Uses `cases()` and may filter by each case's explicitly declared lot. The scope remains `REFERENCE_CASE`; it is never promoted to `LOT_EXACT`.

### Unavailable / incompatible source

V172 emits a `SOURCE_ONLY` locator with the explicit limitation instead of manufacturing a case, event or snapshot reference.

## Determinism

Each locator has a deterministic key:

`sourceId :: kind :: parentRef :: referenceId`

Results are sorted deterministically. Returned structures are deeply frozen.

## Semantics

V172 preserves these separations:

- `LOCATOR != EVIDENCE_VERIFICATION`
- `SOURCE_REFERENCE != VERIFIED_FACT`
- `CASE_OR_EVENT_ID != VERIFIED_IDENTITY`
- `SNAPSHOT != LIVE_STATE`
- `RECORD_PRESENCE != COMPLETENESS`
- `EVIDENCE_COUNT != ASSURANCE`
- `REVIEW_EVENT != APPROVAL`
- `CAPITAL_READY != FINANCING_APPROVAL`

A localizable reference is only a stronger navigation primitive, not a stronger truth claim.

## Authority

Hard-coded:

- `canonicalMutationAvailable=false`
- `financialMutationAvailable=false`
- `locatorChangesAuthority=false`
- `verificationAuthority=false`
- `aiAuthority=ADVISORY_ONLY`
- no offer authority
- no solicitation authority
- no brokerage authority
- no custody authority
- no payment authority
- no disbursement authority.

V172 adds no persistence, external request, upload, submission or write route.

## Review surface

`/sana-v3-dataroom-executive-v172.html`

The left pane supports filters by:

- lot lens;
- executive section;
- locator kind.

Each card shows the exact reference ID, parent reference, declared lot, date/cut, source file, scope quality and limitations. `Abrir vista fuente` changes only the hash/view of the existing same-origin SANA application in the right pane.

No hidden record-level deep link is claimed because the source application does not expose a universal anchor contract for every record.

## Validation

The V172 adversarial validator proves:

- exact schema/version and dependency on V171;
- no parallel source registry;
- bounded collection contract;
- no generic recursive object interpretation;
- no network/storage mutation primitive;
- all locators are reference-only and not verified;
- snapshot references remain snapshot-global;
- bounded snapshot entity filtering never becomes lot-exact;
- official `forLot` sources cannot leak another lot;
- reference-case events remain reference-case;
- missing Nutrition V2 remains `SOURCE_ONLY` / unavailable;
- Due Diligence gap entities retain their snapshot parent;
- section/source slices are deterministic;
- source fixtures are not mutated;
- V170 and V171 regression validators still pass.

## Exit

V172 is reviewable only after its exact-head workflow is green. Passing the locator slice does not mean the evidence is verified, the project is approved, Capital is approved, or SANA is Product Approved / D10 / Production Ready.

## Recommended V173

**Executive Evidence Chain / Claim-to-Reference Matrix**: define explicit executive claims as read-only statements and attach only the V172 locator keys that support their provenance. The next improvement should make the relationship `executive statement → source references → limitations` explicit, without automated truth scoring or decision authority.
