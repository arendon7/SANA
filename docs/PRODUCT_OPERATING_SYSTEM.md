# SANA / AGROWAY Product Operating System v1

Status: **CANONICAL PRODUCT GOVERNANCE DRAFT**  
Scope: business ↔ product ↔ design ↔ engineering ↔ release  
Repository: `arendon7/SANA`

> This document governs product decisions. It does not override security, domain-integrity, data-provenance, migration, or release-safety invariants already enforced by the repository.

## 1. Product truth

### SANA

SANA is the master ecosystem and commercial/technical intelligence layer. It combines agronomy, technology, data, measurement and continuous improvement.

Working promise:

> **Entender la tierra para cultivarla mejor.**

Core cycle:

`ENTENDER → DECIDIR → ACTUAR → MEDIR → APRENDER → DEMOSTRAR → ENTENDER`

### AGROWAY

AGROWAY is the agricultural operations and traceability product inside SANA.

Product role:

> **La memoria digital del cultivo.**

Canonical operational hierarchy:

`Organization → Producer → Farm → Lot → CropCycle`

Canonical operating loop:

`Plan → Activity → Execution → Evidence → Observation/Incident → Intervention → Harvest → Result → Closure → Learning`

### Product boundary

AGROWAY must remain useful without AI, IoT, advanced impact, marketplace, investment or enterprise extensions. The core product must independently provide excellent agricultural operation and traceability.

SANA Intelligence interprets; AGROWAY records. Human technical authority approves sensitive agronomic decisions.

## 2. Commercial product architecture

| Product | Primary buyer | Value | Commercial model |
|---|---|---|---|
| Diagnóstico SANA | Producer / agricultural company | Baseline, gaps, priorities, 90-day plan | One-time service |
| SANA Gestión | Agricultural company | Continuous technical management and improvement | Recurring service |
| AGROWAY Campo | Producer | Core field operation and traceability | SaaS |
| AGROWAY Pro | Agricultural company | Management, economics, analytics, Passport | SaaS |
| AGROWAY Network | Association / operator | Multi-producer / multi-farm coordination | SaaS, base + active producer |
| AGROWAY Enterprise | Agroindustry / institution | Governance, integrations and scale | Annual contract |
| SANA Impact | Company / institution | Evidence-backed productive/economic/environmental change | Project + recurring |
| SANA Proyectos | Institution / cooperation / agroindustry | Integrated implementation at program scale | Project contract |

Internal/future capabilities such as SANA Intelligence, Knowledge Registry, Lab, Trace, Academy or Network are capabilities first; they are not automatically new public sub-brands.

## 3. Customer and UX truth

### Primary initial ICP

Technified agricultural organizations with multiple lots, technical staff and a real need for traceability, operational control or evidence. Initial GTM focus: export-oriented Hass avocado operations in Antioquia, then selected network and banana/plantain contexts after core validation.

### Role-specific experience

- **Field operator:** today's tasks → instructions → execute → evidence → complete.
- **Supervisor:** team, exceptions, overdue work, incidents and execution quality.
- **Agronomist:** crop-cycle workspace, observations, agronomic context, recommendations and follow-up.
- **Manager:** production, costs, risk, trends and exceptions.
- **Network administrator:** producers, farms, technicians, permissions and aggregated indicators.
- **External viewer/auditor:** authorized traceability and Passport only.

The product must not expose the same dashboard and complexity to every role.

## 4. Product north star

Primary product metric:

> **Active traced agricultural cycles.**

Supporting metrics:

- closed agricultural cycles;
- % activities with traceable evidence;
- % applications with full lineage;
- time to first value;
- active organizations;
- unknown-resolution rate;
- % recommendations with measured outcomes;
- retention and expansion.

Registered users alone are not a north-star metric.

## 5. Product evidence model

SANA / AGROWAY separates:

1. **Maturity** — how well the system is managed.
2. **Coverage** — how much reliable information exists.
3. **Agronomic state** — what is happening in the crop.
4. **Performance** — what productive/economic results are obtained.
5. **Impact** — what changed relative to a defensible baseline.
6. **Learning** — what should change in the next cycle.

These concepts must not be collapsed into one arbitrary sustainability/health score.

### Knowledge states

Core information states:

`KNOWN | UNKNOWN | ESTIMATED | NOT_APPLICABLE`

Important evidence must retain provenance. Estimates, modelled values and user-reported values must never be displayed as measured facts.

## 6. SANA Intelligence authority boundary

Canonical reasoning chain:

`Data → Observation → Finding → Hypothesis → Information Gap → Recommendation Draft → Human Review → Approval → Action → Outcome → Learning`

AI may summarize, retrieve knowledge, identify gaps, detect patterns, formulate hypotheses and draft recommendations.

AI must not autonomously approve or execute sensitive agronomic actions.

Knowledge hierarchy:

`CANONICAL → TECHNICAL → EXPERIMENTAL → HISTORICAL`

Historical or superseded knowledge must not silently override current canonical knowledge.

## 7. Product prioritization rule

Every proposed feature must answer all of the following:

1. What real user problem does it solve?
2. Who uses it?
3. Who pays for the value it creates?
4. Which commercial product does it improve?
5. What structured data does it generate?
6. What context/decision/outcome relationship does it capture?
7. How will we know it works in real agricultural operation?
8. Is it verified in materialized runtime or only conceptual/prepared?

If these cannot be answered, the feature is not ready for `NOW`.

Classification labels:

`CORE | PRO | NETWORK | ENTERPRISE | SANA_INTELLIGENCE | SANA_IMPACT | ADD_ON | INTERNAL`

Timing labels:

`NOW | NEXT | LATER | DO_NOT_BUILD_YET`

Commercial labels:

`MONETIZABLE_NOW | STRATEGIC_LATER`

## 8. NOW / NEXT / LATER

### NOW — prove and harden the operating product

1. Materialized/reproducible runtime and full technical gate.
2. Historical-core preservation and acceptance.
3. Tenant/RBAC/domain integrity.
4. Canonical organization → producer → farm → lot → cycle hierarchy.
5. Planning, workforce, task execution and evidence.
6. Irrigation, nutrition, pest/disease and incident workflows.
7. Inventory lineage and productive costs.
8. Offline/deferred synchronization with explicit conflict handling.
9. Deterministic crop-cycle replay.
10. Role-specific field UX and real-device validation.

### NEXT — close the agricultural business cycle

1. Harvest.
2. Quality.
3. Availability.
4. Order / sale.
5. Payment / settlement.
6. Crop-cycle economics.
7. Plan vs actual.
8. Formal cycle closure.
9. Learning capture.
10. Diagnóstico SANA as structured baseline → findings → priorities → actions.
11. Passport projection.
12. Contextual Intelligence UX.
13. Impact Basic.

### LATER — scale after real product evidence

- Network expansion and benchmarks;
- Enterprise SSO/API/SLA policies;
- advanced IoT/provider adapters;
- advanced forecasting;
- richer Impact methodologies;
- specialist knowledge packs;
- institutional scale programs.

### DO NOT BUILD YET

- generic marketplace;
- blockchain for its own sake;
- autonomous agronomic execution;
- full accounting ERP;
- broad consumer product;
- custom one-client forks;
- proprietary hardware-first strategy;
- speculative tokenization/financialization as GTM focus.

Existing prepared capabilities are preserved even when not prioritized commercially.

## 9. Release outcome model

Engineering versions are not product outcomes.

Release states:

`DEVELOPMENT → INTEGRATION_READY → TECHNICALLY_VERIFIED → DESIGN_PARTNER_READY → PILOT_VALIDATED → PRODUCTION_READY`

A green static/build gate does not imply a real agricultural pilot is certified.

Outcome milestones:

- **TECHNICALLY_MATERIALIZED** — reproducible runtime + technical gate.
- **CORE_ACCEPTED** — historical/core agricultural journeys verified.
- **DESIGN_PARTNER_READY** — real field UX capable of replacing parallel manual recording for pilot use.
- **FULL_CYCLE_OPERATIONAL** — cycle can be reconstructed from planning through economic closure.
- **PILOT_VALIDATED** — real agricultural evidence from named design partners.

## 10. Current repository truth

The repository currently governs an AGROWAY v0.20.2 release-candidate line with reconstructed historical layers and accumulated hardening/design-engineering work. The repository itself is authoritative for exact artifact SHA values, migration heads, domain-event counts, validation results and pending runtime gates.

Do not copy such volatile values into product decisions when a canonical repository status file already exists.

The current design-engineering lifecycle distinguishes `Product Approved` from `Production Approved`; this Product Operating System adopts that distinction.

## 11. Design governance

Product design follows the repository Design Engineering System:

`D0_TRUTH → D1_ARCHITECTURE → D2_DIRECTION → D3_SYSTEM → D4_BUILD → D5_MOTION → D6_AUDIT → D7_VISUAL_QA → D8_PRODUCT_APPROVED → D9_DELIVERY → D10_PRODUCTION_APPROVED`

Brand canon outranks generic visual taste or agent recommendations.

Major surfaces must be designed around agricultural workflows, not enterprise-module navigation alone.

The Crop Cycle Workspace is the primary agronomic work surface.

## 12. Engineering workflow

Target workflow:

`Issue → Branch → Implement → Tests → Draft PR → Review → Required Gates → Squash Merge → main → RC Artifact → Release Evidence → Field Validation`

### Branch naming

Examples:

- `feat/R1-05-offline-sync`
- `fix/R1-10-inventory-lineage`
- `security/R1-01-tenant-isolation`
- `test/R1-12-traceability-replay`
- `docs/product-operating-system`

One branch should normally have one clear purpose.

### Main

`main` represents the best integrated state that can be defended with evidence. It is not a scratchpad.

Direct feature development on `main` should cease once branch protection/PR governance is enabled.

### Merge

Preferred default: squash merge.

Meaningful final commit prefixes:

`feat | fix | security | test | docs | refactor | perf | chore`

## 13. Pull-request contract

Every material PR should state:

- problem;
- linked issue;
- scope;
- explicit out-of-scope;
- domain invariants;
- data/migration implications;
- tenant/security implications;
- tests executed;
- acceptance scenario;
- evidence;
- rollback/forward-fix strategy.

Changes to IAM/RLS, migrations, agronomic authority, canonical knowledge or impact claims require the corresponding specialist review.

## 14. Definition of Done

Code presence is not Done.

A material capability is Done only when applicable requirements are satisfied:

- domain implementation;
- tests;
- permissions/RLS;
- audit/provenance;
- failure/recovery states;
- migration strategy;
- offline behavior where relevant;
- documentation;
- realistic acceptance scenario;
- historical-regression protection;
- design/accessibility evidence for UI;
- product approval;
- runtime evidence before production approval.

## 15. Safety and trust non-negotiables

- No cross-tenant data leakage.
- No silent history rewriting for material events.
- No important data without provenance where provenance is available/required.
- No estimation represented as measurement.
- No AI hypothesis represented as confirmed diagnosis.
- No sensitive AI recommendation executed without required human authority.
- No environmental/impact claim without methodology, baseline and evidence.
- No silent weakening of certification or approval policy.
- No release PASS for tests that were not actually executed.
- No loss of historical AGROWAY core capabilities during modernization.

## 16. Product feedback taxonomy

Every request should be classified before entering roadmap:

`BUG | UX | CORE_GAP | SEGMENT_REQUEST | CLIENT_CUSTOM | STRATEGIC`

Custom development enters product only when it is reusable, sufficiently funded, strategically unlocks an important segment, or becomes a general platform capability.

## 17. Product decision hierarchy

When signals conflict, use this order:

1. Safety / security / legal constraints.
2. Domain integrity and historical truth.
3. Real user evidence.
4. Product strategy and commercial fit.
5. Data/learning value.
6. UX quality.
7. Implementation convenience.

A technically easy feature must not outrank a more important agricultural workflow solely because it is easy to build.

## 18. Design-partner gate

Do not call the product design-partner ready until at minimum:

- tenant isolation is verified;
- core field flows work end to end;
- offline field operation is real, not simulated;
- evidence preserves context;
- crop-cycle replay is deterministic;
- role-specific mobile UX is usable;
- backup/export/recovery expectations are defined;
- AI is optional to core operation;
- no S0/S1 release blockers remain.

Pilot certification remains a separate evidence gate.

## 19. Product-learning loop

Every closed cycle should maximize this relationship:

`Context + Observation + Decision + Intervention + Evidence + Outcome`

This is the primary long-term data/knowledge moat. Data volume without relational context is not sufficient.

Learning candidates do not automatically become canonical knowledge.

## 20. Governance of this document

This document should change only through reviewable repository history.

Any change that alters product boundaries, authority rules, NOW priorities or release gates should explain:

- why the canon changed;
- what evidence changed;
- what existing roadmap/implementation is affected.

Exact runtime/release facts remain in their dedicated repository status, lock and runbook files rather than being duplicated here.
