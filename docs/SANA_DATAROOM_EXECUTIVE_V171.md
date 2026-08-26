# SANA Data Room Executive · V171 Source Coverage Hardening

## Purpose

V171 hardens the V170 executive dossier by making source coverage explicit and typed. It answers four distinct questions for every executive section:

1. **Does the source API exist?**
2. **Which exact accessor is expected?**
3. **What scope can that source honestly sustain?**
4. **Which existing SANA view/file is the inspection source?**

It deliberately does not answer “how good is the project?” and introduces no score.

## Stack

- parent: V170 / Draft PR #128
- parent exact head: `755ac2500cdb1038eda526f29f277de708875632`
- V171 branch: `demo/sana-dataroom-executive-v171`
- issue: #129

V171 is stacked development. It does not imply V170 is merged or approved.

## Typed strategies

The registry uses explicit adapter strategies:

- `STATE`: snapshot/history API exposes `state()`.
- `SNAPSHOTS`: Due Diligence snapshot API exposes `snapshots()`.
- `CURRENT`: Due Diligence gaps exposes `current()` over latest compatible snapshot.
- `FOR_LOT_CASES`: API exposes both `cases()` and official `forLot(lot)`.
- `CASES_EVENTS`: reference-case API exposes `cases()`; a lot lens may filter by each case's declared lot, but that remains `REFERENCE_CASE`, not `LOT_EXACT`.
- `NONE`: expected source was referenced by V170 but is not materialized in the exact application source.

An existing API without the accessor required by its registered strategy is `PARTIAL`/adapter mismatch. It is never silently `AVAILABLE`.

## Scope quality

V171 separates availability from scope quality:

- `LOT_EXACT`: official source API supports `forLot(lot)`.
- `SNAPSHOT_GLOBAL`: historical snapshot state applies to the snapshot/cut, not to a newly fabricated lot-specific history.
- `GLOBAL`: unscoped all-case reading.
- `REFERENCE_CASE`: cases carry declared lot references and may be filtered for reading, but the lot reference is not a verified identity/authority fact.
- `UNAVAILABLE`: source not materialized or API missing.

Important invariant:

`LOT_LENS != LOT_EXACT_UNLESS_ADAPTER_SUPPORTS_IT`.

Selecting a lot never changes a snapshot-global history into lot-exact history.

## Exact audit findings incorporated

### Snapshot histories

The audited phenology, labor, health and health-lifecycle modules expose `state()` and explicitly preserve no-live-fallback semantics. V171 classifies these as `STATE / SNAPSHOT_GLOBAL`.

The same typed pattern is registered for the other existing `dataroom-*-history.js` modules and is statically verified in CI against each materialized source file/export.

### Due Diligence Gaps

`__SANA_DUE_DILIGENCE_GAPS__` exposes `current()` and `derive(snapshot)`. It is therefore registered as `CURRENT / SNAPSHOT_GLOBAL`, not as a generic state source.

### Exact lot APIs

`__SANA_CAPITAL_GOVERNANCE__`, `__SANA_CAPITAL_REVIEW__` and `__SANA_DATAROOM_FINDINGS__` expose official `forLot(lot)` paths and are eligible for `LOT_EXACT` when a lot lens is selected.

### Review governance/circuit

Review governance and the review circuit are reference-case ledgers. V171 uses their `cases()` output and declared case lot for reading. That is `REFERENCE_CASE`, not verified lot identity or access authority.

### Nutrition V2 expectation

V170 registered `__SANA_DATAROOM_NUTRITION_V2_HISTORY__` as a possible source, but the exact materialized application does not load a `sana-v3-dataroom-nutrition-v2-history.js` module. V171 preserves this as:

- `materialized=false`
- strategy `NONE`
- scope `UNAVAILABLE`
- limitation `REGISTRY_DECLARED_SOURCE_NOT_MATERIALIZED`

No module, history or data is invented to make the coverage matrix green.

## Coverage semantics

V171 reports only counts by categorical state/scope:

- source count;
- available/partial/unavailable/read-error count;
- lot-exact/snapshot-global/global/reference-case/unavailable count;
- section available/partial/unavailable count.

There is no percentage, weighting or scalar composite.

`SOURCE_AVAILABILITY != DATA_QUALITY != RISK != READINESS != SCORE`.

## Source navigation

Every registry relation carries:

- source global;
- exact repository file path;
- expected read strategy;
- scope capability;
- existing SANA source view (`dataroom`, `reports`, `capital`, `health`, `nutrition`, `phenology`, etc.).

The V171 review surface uses only view/hash navigation in the same-origin source iframe. Navigation does not invoke a command or write route.

## Security and authority

V171 preserves:

- `canonicalMutationAvailable=false`
- `financialMutationAvailable=false`
- `lensChangesAuthority=false`
- `aiAuthority=ADVISORY_ONLY`
- no offer / solicitation / brokerage / custody / disbursement authority
- no network mutation primitive
- no storage mutation primitive
- no persistence migration
- no project/credit/investment score.

## Validation

The V171 adversarial validator performs two layers of proof.

### Repository-level source audit

For every `materialized=true` registry relation it checks:

- source file exists;
- declared global export exists in that file;
- registered method family is evidenced (`state`, `snapshots`, `current`, `forLot/cases`, or `cases`);
- deterministic source view is declared.

It additionally checks that the Nutrition V2 history file is not materialized while its registry entry remains explicit.

### Runtime adversarial model

It proves:

- snapshot histories remain `SNAPSHOT_GLOBAL` under a lot lens;
- official `forLot` sources become `LOT_EXACT` and cannot leak another lot;
- reference-case ledgers remain `REFERENCE_CASE`;
- API present but missing expected accessor becomes `PARTIAL`;
- the unmaterialized Nutrition V2 expectation remains `UNAVAILABLE`;
- Due Diligence Gaps uses `CURRENT`;
- timeline does not leak another declared lot;
- lenses reorder but do not change facts;
- source fixtures remain immutable;
- returned structures are frozen;
- coverage has no score/percentage semantics.

## Review surface

`/sana-v3-dataroom-executive-v171.html`

Left: typed source coverage per executive section.

Right: existing SANA application as source inspector.

The surface is read-only and contains no form/fetch/storage write path.

## Exit

V171 can be proposed for review only after:

1. V170 regression PASS;
2. V171 static source audit PASS;
3. V171 runtime adversarial PASS;
4. read-only HTML boundary PASS;
5. authority boundary PASS.

Passing V171 does not mean V170/V171 are merged, Product Approved, D10 or Production Ready.

## Recommended V172

**Executive Evidence Drill-down / Source Locator**: move from section-level navigation to exact record/reference drill-down (snapshot ID, case ID, event/reference ID and historical cut) while preserving the same no-verification/no-authority semantics. The goal should be “from executive statement to exact evidence location in one interaction”, not new scoring or automation.
