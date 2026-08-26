# SANA Data Room Executive 360 · V170

## 1. Purpose

V170 is the executive reading layer over the already-materialized SANA Data Room substrate. It does **not** replace `sana-v3-dataroom-360.js`, domain histories, Due Diligence snapshots, review ledgers or canonical operational sources.

Its job is to answer one question quickly: **what does the current dossier contain, where does each fact come from, what is missing or partial, and where should a human go to inspect the source?**

## 2. Exact provenance

- Git source branch: `demo/sana-capital-review-v163`
- exact source commit: `00e6a04693dad2e19cfd53a7c61ff3fc8c1b0136`
- latest inspectable Capital Human Review reference semantics at the base: V162
- conversational continuity reported V169, but V164–V169 are not currently materialized as inspectable Git history
- policy: `DO_NOT_RECONSTRUCT_MISSING_HISTORY`

V170 records that gap explicitly. It must never present V164–V169 as recovered source or silently infer their content.

## 3. Existing substrate reused

The base already includes:

- RPT-DD snapshot-driven Data Room 360;
- snapshot comparison, freshness, gaps, remediation and next-cut preparation;
- material, health, nutrition, phenology, circularity, Data Trust, harvest, inventory, labor, forecast, capture/sync, source evidence, economics, commercial, impact and capital histories;
- Data Room access, exchange, assurance and findings ledgers;
- review governance, case, handoff, feedback, response, disposition and round;
- review workspace/guided entry;
- Capital Governance and Capital Human Review, including V162 internal reference integrity.

V170 only indexes and composes those projections.

## 4. Executive contract

Schema: `SANA_DATAROOM_EXECUTIVE_360_V1`

Version: `V170`

Canonical section order:

1. `IDENTITY_SCOPE`
2. `PLAN_EXECUTION`
3. `CROP_HEALTH_NUTRITION`
4. `PRODUCTION_HARVEST`
5. `COMMERCIAL_ECONOMIC`
6. `TRACEABILITY_DATA_TRUST`
7. `CIRCULARITY_IMPACT`
8. `CAPITAL_READINESS`
9. `EXCEPTIONS_GAPS`
10. `DECISION_TIMELINE`

Each section contains:

- stable section ID and title;
- status;
- registered source APIs;
- source scope/read mode;
- source as-of metadata when available;
- compact structural summary;
- limitations;
- source integrity string;
- immutable authority boundary.

## 5. Status model

Allowed section/source states:

- `AVAILABLE`
- `PARTIAL`
- `UNAVAILABLE`
- `SCOPE_MISMATCH`
- `SCHEMA_MISMATCH`
- `STALE_REFERENCE`

Missing or pre-ledger snapshot granularity remains missing/partial. V170 does not use live state to fabricate historical coverage.

## 6. Scope semantics

V170 supports an optional lot selector. Sources with a real `forLot`, `cases` or `events` accessor can be filtered by lot. Snapshot/global sources remain explicitly marked as global or snapshot-scoped and carry `GLOBAL_OR_SNAPSHOT_SCOPE_NOT_LOT_FILTERED` when a lot lens is active.

A lot filter is a **reading scope**, not a canonical project selector and not an authorization boundary.

## 7. Role lenses

- `EXECUTIVE`
- `PRODUCER`
- `AGRONOMIST`
- `CAPITAL_REVIEWER`
- `AUDITOR`

A lens only reorders the same section fact set. It cannot mutate source data, hide a canonical defect, grant access, change a readiness state or create authority.

Invariant: `SAME_FACT_SET_ACROSS_LENSES`.

## 8. Human review timeline

V170 can assemble a read-only chronology from available review APIs:

`Capital Review → Review Case → Handoff → Feedback → Response → Disposition → Round`.

The timeline is a reference chronology only:

- round closed ≠ Capital Review completed;
- Review completed ≠ approval;
- disposition ≠ verified document;
- review event count ≠ risk score;
- timeline ≠ underwriting;
- human reference ≠ verified identity;
- no event creates investment or execution authority.

## 9. Authority boundary

The V170 runtime hard-codes:

- `canonicalMutationAvailable=false`
- `financialMutationAvailable=false`
- `lensChangesAuthority=false`
- `aiAuthority=ADVISORY_ONLY`
- no offer authority
- no solicitation authority
- no brokerage authority
- no custody authority
- no disbursement authority

It introduces no POST/fetch path, no storage write and no persistence migration.

## 10. Financial / impact semantics

V170 preserves the existing semantic separations:

- `CAPITAL_READY != FINANCING_APPROVAL`
- `TRACEABILITY != GUARANTEE`
- `FORECAST != REALIZED_OUTCOME`
- `HARVEST != SALE != PAYMENT`
- `BUDGET != COST != ACCOUNTING_ENTRY != REALIZED_REVENUE`
- `REVIEW != APPROVAL`
- `REFERENCE != VERIFIED_FACT`
- `IMPACT_ESTIMATE != VERIFIED_IMPACT_OR_CARBON_CREDIT`
- `CHANGE != IMPROVEMENT != CAUSALITY`

There is deliberately no universal project score, credit score or investment recommendation.

## 11. Review surface

`/sana-v3-dataroom-executive-v170.html` is an isolated review surface. It embeds the current SANA demo in a same-origin iframe and reads its already-loaded public APIs through the V170 factory. The left pane shows the executive dossier; the right pane remains the source application.

Opening a source changes only the source iframe view/hash. The V170 surface contains no form and no write route.

## 12. Validation

`scripts/validate-sana-dataroom-executive-v170.mjs` checks:

- exact schema/version;
- all ten sections;
- five role lenses;
- immutable authority flags;
- explicit V164–V169 provenance gap;
- missing sources remain explicit;
- lot-scoped review chronology does not leak another lot;
- lenses preserve the same facts;
- source fixtures are not mutated;
- returned dossier objects are frozen;
- no opaque score is introduced;
- no browser/storage/network mutation primitive is present in the V170 composer.

## 13. Exit criteria

V170 is ready for human review when its exact-head workflow is green and the Draft PR shows only additive files. It is **not** Product Approved, D10 or Production Ready by virtue of passing this slice.

## 14. Next slice

After V170 review, the preferred V171 direction is **Executive Source Coverage Hardening**: inspect every registered domain history API, replace generic source probes with exact typed adapters, add scope-quality diagnostics, and make source-to-section navigation exact without expanding authority.
