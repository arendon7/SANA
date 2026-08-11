# Historical AGROWAY source map

This document records historical product evidence used to validate the modern SANA / AGROWAY architecture. Historical material is evidence of intent/capability, **not a canonical runtime contract**.

## 1. AGROWAY IA — technical proposal / project formulation

Google Drive source: `Propuesta Técnica del Proyecto`

Drive file id: `1aEScdD2ZHaea9ge7L6aD-d7bEBftF8_qSH5T5S5bYEQ`

Historically documented capabilities include:

- SaaS modular architecture.
- Offline field operation and deferred synchronization.
- Plot/lote management and georeferenced field data.
- Crop inventory, crop plans, input inventory, costs and operators.
- Environmental monitoring and crop-cycle visualization.
- IoT integration for soil/environmental variables, including humidity, temperature and pH.
- Central datalogger/history visualization after synchronization.
- Traceability and access to differentiated markets/certification.
- Agronomic virtual assistance with recommendations and early alerts.
- Multilayer data: climatic, edaphic, phytosanitary, microbiological and socioeconomic.
- Historical pilots cited for blueberries, cannabis and sugar cane.
- Cacao as a later target crop for field validation and TRL progression.
- Soil microbiome/metagenomic data as an enrichment source for agronomic recommendations.
- Commercialization/market linkage identified as an important product capability.

### Modern mapping

| Historical capability | Modern SANA / AGROWAY boundary |
|---|---|
| Offline field capture | existing mobile/offline sync domain; must be runtime-certified in S10 |
| IoT + datalogger | v0.17 External Data Gateway |
| Humidity/temperature/pH | canonical Measurement / Observation |
| Alerts | v0.17 deterministic Agronomic Alerts |
| Agronomic virtual assistant | v0.19 Copilot + Knowledge Engine |
| Traceability | canonical lifecycle + S10 replay/certification |
| Investment/market access | v0.18 AGROWAY Invest + Control Tower |
| Environmental/soil data | canonical external facts + knowledge evidence |
| Microbiome/metagenomics | future provider/source adapter; not hard-coded into v0.17 |
| Real field validation | v0.20 Certified Real Pilot harness |

## 2. AGROWAY IA Resumen

Google Drive source: `AGROWAY IA Resumen.docx`

Drive file id: `1HjV-c38tsYajLB61jOHOYNOAC-9yaeQT`

The summary explicitly describes:

- complete agricultural production traceability;
- technical recommendations based on real data;
- an `Agrónomo Virtual`;
- front-end and back-end validation;
- crop inventory, crop plans, input inventory, costs, alerts and productive impact;
- ecological/environmental data and bioinputs;
- field validation with producers;
- IoT validation;
- certified traceability as an enabler for markets/investors;
- SaaS as the sustainability model.

These statements reinforce the v0.17-v0.20 roadmap but do not override modern domain contracts or security boundaries.

## 3. Pineal software-development evidence

Google Drive source: `Contrato Prestación de Servicios Desarrollo PINEAL DEF.docx`

Drive file id: `1Ljlq-C9YzG6UYOQMB-XSFRvbdMx9LKXv`

The contract documents software development, maintenance/troubleshooting, solution architecture/design collaboration, technical documentation, testing/quality control and AGROWAY-related intellectual property activity.

### Critical boundary

The reviewed contract does **not** establish a canonical Pineal sensor payload, device protocol, calibration schema or telemetry API. Therefore:

- `PINEAL` remains an external provider adapter in v0.17;
- provider payloads remain raw/non-canonical;
- source/device identity, calibration, freshness and quality are resolved before normalization;
- Copilot never consumes Pineal raw payloads;
- any future recovered Pineal protocol must enter through provider-specific mapping tests rather than changing canonical Measurement/Observation semantics.

## 4. AgroWayAPP — 2021 field-operations UX evidence

Google Drive source: `AgroWayAPP.pdf`

Drive file id: `1Asufh0P5nI2lqAlbxfdHkDSvOdRjUMV0`

The historical prototype shows that AGROWAY already treated field operations as a first-class product surface, including:

- login/account verification plus network, permissions and location checks;
- operator lists and operator profiles;
- calendar and hourly task scheduling;
- lot-specific tasks and follow-up;
- irrigation, nutrition and pest/disease work queues;
- questions/doubts as an operational communication channel;
- task execution and comments;
- irrigation history by crop/lot;
- crop stage, humidity, plants, tank, ml/plant and irrigation-time capture;
- field guides/resources attached to tasks;
- inventory and useful-life/expiry tracking.

### Product invariant recovered from the prototype

SANA / AGROWAY must remain an **agricultural operating system**, not merely an AI assistant or sensor dashboard. AI, IoT, Control Tower and certification are layers over the operational field model; they do not replace operators, tasks, lots, execution evidence, inventory or agronomic work history.

## 5. SaaS contract — tenant, access and portability evidence

Google Drive source: `CONTRATO SaaS SOFTWARE AGROWAY 030523.docx`

Drive file id: `1mMmmIrUyGJDpHGNVdF9KyWsBrVM_Qd0Z`

Historical contractual behavior includes:

- AGROWAY defined as a crop traceability and administration SaaS for small/medium organizations;
- subscriber-controlled access levels for invited users;
- accounts constrained by authorized users/modules/companies;
- subscription/module-based service boundaries;
- customer responsibility for activity performed with its accounts;
- data entered under the customer's authority;
- ability to download/export information when service ends so customer data is not lost.

### Modern invariants recovered from the SaaS contract

- tenant isolation and RBAC are product requirements, not optional infrastructure details;
- invited/delegated users must remain attributable to the subscriber/tenant;
- module entitlements must not weaken domain authorization;
- data export/portability must be preserved in the modern platform;
- cross-tenant references must be impossible at both RLS and relational-integrity layers;
- account/subscription state must never rewrite historical traceability records.

## 6. Provenance rule

Historical Drive documents are classified as `HISTORICAL_PRODUCT_EVIDENCE`.

They may be used to:

- validate roadmap intent;
- recover terminology and product requirements;
- build migration fixtures;
- identify missing adapters or UX capabilities.

They must **not** be used to:

- bypass current authorization/security policy;
- infer undocumented provider schemas;
- certify a real pilot;
- mutate canonical records;
- replace the exact v0.16 source artifact required for repository materialization.
