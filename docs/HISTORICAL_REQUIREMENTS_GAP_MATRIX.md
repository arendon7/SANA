# Historical requirements → modern architecture gap matrix

Purpose: prevent the SANA / AGROWAY modernization from losing capabilities that existed in historical product designs, pilots or SaaS commitments.

Status values:

- `COVERED_POST_V016`: explicitly implemented by v0.17-v0.20.1.
- `VERIFY_IN_V016`: expected to belong to the pre-v0.17 core and must be proven from the exact v0.16 source/runtime.
- `VERIFY_OR_ADD_AFTER_INTEGRATION`: historical requirement is valid, but current isolated patches do not prove complete implementation.
- `FUTURE_PROVIDER_ADAPTER`: preserve canonical model and add provider-specific integration later.

| Historical requirement | Evidence source | Modern owner | Status | Materialization acceptance test |
|---|---|---|---|---|
| Crop/lot traceability | SaaS contract + AGROWAY IA | Core / Field / Traceability | VERIFY_IN_V016 | create crop cycle → field activity → harvest lineage → passport/replay |
| Multi-tenant subscriber model | SaaS contract | Core / IAM | VERIFY_IN_V016 | tenant A cannot read/write/reference tenant B |
| Invited users / delegated access | SaaS contract | IAM / RBAC | VERIFY_IN_V016 | invited actor has scoped permissions and full attribution |
| Module/subscription entitlements | SaaS contract | IAM / Commercial | VERIFY_OR_ADD_AFTER_INTEGRATION | disabled module is inaccessible without weakening domain authorization |
| Customer data export/portability | SaaS contract | Platform / Data export | VERIFY_OR_ADD_AFTER_INTEGRATION | tenant export is complete, scoped and machine-readable |
| Offline field operation | Technical proposal | Mobile / Sync | VERIFY_IN_V016 | airplane-mode activity creation + deterministic later sync |
| Conflict-safe deferred sync | Technical proposal | Mobile / Sync | VERIFY_IN_V016 | concurrent edits produce explicit deterministic resolution/audit |
| Georeferenced field data | Technical proposal | Field / PostGIS | VERIFY_IN_V016 | coordinates/geometry survive offline sync and tenant boundaries |
| Operators / field workers | 2021 AgroWayAPP | Field / Workforce | VERIFY_IN_V016 | operator assignment, identity, task execution attribution |
| Calendar/hourly tasks | 2021 AgroWayAPP | Field / Planning | VERIFY_IN_V016 | schedule → execute → evidence → completion history |
| Irrigation workflow | 2021 AgroWayAPP | Agronomy / Field | VERIFY_IN_V016 | prescribed task → execution values → history by lot/cycle |
| Nutrition workflow | 2021 AgroWayAPP | Agronomy / Field | VERIFY_IN_V016 | recommendation/task → application evidence → traceability |
| Pest/disease workflow | 2021 AgroWayAPP | Agronomy / Field | VERIFY_IN_V016 | observation → diagnosis/control task → follow-up |
| Questions / agronomic communication | 2021 AgroWayAPP | Collaboration / Agronomy | VERIFY_OR_ADD_AFTER_INTEGRATION | field question linked to plot/cycle/evidence and responsible responder |
| Guides/resources attached to tasks | 2021 AgroWayAPP | Knowledge / Field | VERIFY_OR_ADD_AFTER_INTEGRATION | canonical knowledge resource can be linked/read offline where permitted |
| Inventory / expiry / useful life | 2021 AgroWayAPP + AGROWAY IA | Supply / Inventory | VERIFY_IN_V016 | receipt → stock → issue/application → lot/cycle lineage |
| Cost tracking | AGROWAY IA | Finance / Field | VERIFY_IN_V016 | activity/input/labor cost rolls into crop/project economics |
| Environmental/soil IoT | Technical proposal | External Data Gateway | COVERED_POST_V016 | provider raw → identity → quality → canonical observation/measurement |
| Weather provider ingestion | modern extension | External Data Gateway | COVERED_POST_V016 | provider payload never reaches Copilot raw |
| Remote sensing | modern extension | External Data Gateway | COVERED_POST_V016 | scene → quality/provenance → canonical fact |
| Deterministic agronomic alerts | AGROWAY IA | Agronomic Alerts | COVERED_POST_V016 | same canonical facts/rules produce same alert |
| Agrónomo Virtual / Copilot | AGROWAY IA | Copilot + Knowledge | COVERED_POST_V016 | read/explain/compare/draft only; citations required |
| AI cannot approve/execute | modern safety boundary | AI Gateway / Authority | COVERED_POST_V016 | transactional intent blocked before model invocation |
| Certified traceability | AGROWAY IA | Pilot certification / Passport | COVERED_POST_V016 | deterministic eligibility + exact digest + human signer |
| Investor/market linkage | AGROWAY IA | Invest / Control Tower | COVERED_POST_V016 | project capital and demand projections reference canonical operations |
| Commercialization/sales workflow | AGROWAY IA proposal | Commercial / Supply / Finance | VERIFY_IN_V016 | harvest/availability → order/sale → settlement → traceability |
| Productive/environmental impact | AGROWAY IA | Impact / Control Tower | VERIFY_IN_V016 | impact facts reconstruct from canonical events, not mutable dashboard values |
| Soil microbiome/metagenomics | Technical proposal | External Data + Knowledge | FUTURE_PROVIDER_ADAPTER | laboratory result mapping with provenance/quality without altering canonical semantics |
| Pineal telemetry protocol | Pineal historical relationship | External Data Gateway | FUTURE_PROVIDER_ADAPTER | only implement after real protocol/sample recovery |
| Crop-specific configuration | historical pilots/cacao proposal | Agronomy / Product Master | VERIFY_OR_ADD_AFTER_INTEGRATION | crop pack is configuration/versioned knowledge, not forked application code |
| Real field pilot certification | Technical proposal | S10 Pilot Harness | COVERED_POST_V016 | synthetic fixture cannot be promoted; real evidence + named human signer required |

## Release gate created by this matrix

A future `v0.20.1 MATERIALIZED` tag must not be created only because TypeScript/DB CI is green. It also requires the `VERIFY_IN_V016` rows above to be exercised against the recovered exact base.

Rows marked `VERIFY_OR_ADD_AFTER_INTEGRATION` may become a post-materialization backlog, but must be explicitly accepted rather than silently lost.

## Source provenance

Historical evidence currently used:

- `AgroWayAPP.pdf` — Drive id `1Asufh0P5nI2lqAlbxfdHkDSvOdRjUMV0`.
- `CONTRATO SaaS SOFTWARE AGROWAY 030523.docx` — Drive id `1mMmmIrUyGJDpHGNVdF9KyWsBrVM_Qd0Z`.
- `AGROWAY IA Resumen.docx` — Drive id `1HjV-c38tsYajLB61jOHOYNOAC-9yaeQT`.
- `Propuesta Técnica del Proyecto` — Drive id `1aEScdD2ZHaea9ge7L6aD-d7bEBftF8_qSH5T5S5bYEQ`.
- `Contrato Prestación de Servicios Desarrollo PINEAL DEF.docx` — Drive id `1Ljlq-C9YzG6UYOQMB-XSFRvbdMx9LKXv`.
