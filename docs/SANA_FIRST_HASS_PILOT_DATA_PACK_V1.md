# SANA First Hass Pilot Data Pack v1

Status: `PILOT_PREPARATION_CANON_DRAFT`

Owner boundary: SANA Product / Agronomy & Knowledge / Capital & Markets / Impact & Trust.

Purpose: define the minimum data, evidence, consent and quality package required to turn a real Hass producer/crop context into a `ProductiveInvestmentProject` that can be evaluated under SANA Capital Readiness and, if appropriate, handed to a financial partner. This pack does **not** approve credit, investment, funding or return.

## 1. Collection principles

1. Reuse canonical AGROWAY data before asking the producer to report it again.
2. Every material field retains source, date, scope, verification state and provenance.
3. Unknowns are explicit; missing P0 data never silently defaults to zero, false or PASS.
4. Producer reporting burden must remain proportional to the decision value of the data.
5. Private, partner-shared and public/storytelling data are separate consent scopes.
6. Financial-partner-specific KYC/AML data is collected by or for the responsible partner under the applicable legal basis; SANA does not silently become the regulated onboarding authority.
7. Forecasts, estimates and producer-reported values are not represented as verified facts.

## 2. Data state vocabulary

Knowledge state:

- `KNOWN`
- `UNKNOWN`
- `NOT_APPLICABLE`
- `ESTIMATED`

Source:

- `USER_REPORTED`
- `DOCUMENT`
- `PHOTO`
- `LAB_RESULT`
- `SENSOR`
- `AGROWAY_EVENT`
- `TECHNICAL_OBSERVATION`
- `CALCULATED`
- `PARTNER_RECORD`
- `BUYER_RECORD`

Verification:

- `VERIFIED`
- `SUPPORTED`
- `ESTIMATED`
- `UNVERIFIED`
- `OUTDATED`
- `REJECTED`
- `SUPERSEDED`

Requirement class:

- `REQUIRED_FOR_SANA_READY`
- `REQUIRED_FOR_CAPITAL_READY`
- `PARTNER_REQUIRED`
- `CONDITIONAL`
- `FUTURE`

## 3. Producer / productive organization

Minimum fields:

- canonical producer/organization ID;
- legal/display name;
- person vs productive organization;
- primary contact and authorized representative where applicable;
- role in the productive operation;
- operating experience and crop experience;
- relationship to the farm/land and authority to operate;
- prior documented crop cycles;
- current technical/operational team;
- consent and data-sharing preferences.

Evidence examples:

- identity/legal documents where legitimately required;
- organization certificate/registry where applicable;
- operating/tenure evidence;
- historical AGROWAY records;
- technical interview/observation.

Do not collect unnecessary sensitive personal information merely because a future financial partner might request it.

## 4. Farm / productive asset

Required:

- farm ID and name;
- municipality/department/country;
- geolocation at appropriate precision;
- farm area and productive area;
- lot IDs, boundaries and hectares;
- tenure/right-to-operate evidence appropriate to the case;
- access/logistics constraints;
- irrigation/water infrastructure;
- relevant storage, packing or productive infrastructure;
- material environmental/legal constraints known to SANA.

A project cannot pass G2 if the financed productive asset cannot be unambiguously scoped.

## 5. Crop and current cycle

Required:

- crop: Hass avocado;
- variety/rootstock where known;
- planting date or age estimate;
- plant count/density;
- phenological/current productive stage;
- current `CropCycle` ID(s);
- expected harvest window(s), clearly labeled forecast;
- historical harvests by cycle where available;
- historical quality/grade/packout where available;
- current material incidents and constraints.

Historical producer recollection must remain `USER_REPORTED` unless supported by records.

## 6. Agronomic baseline

Capture or reference:

- soil analysis + sampling date/location;
- water analysis where relevant;
- nutrition/fertigation baseline;
- irrigation/water management;
- plant-health status;
- pest/disease incidents;
- phenology/development observations;
- monitoring facts and freshness;
- climate/exposure information available;
- active agronomic findings/hypotheses;
- technical unknowns requiring resolution.

Do not force every project to have every laboratory test. The technical reviewer defines what is material for the current crop/context and readiness decision.

## 7. Productive plan

Reference a versioned plan containing:

- plan version/status;
- activity/action;
- productive purpose;
- lot/cycle scope;
- planned date/window;
- responsible role;
- dependencies;
- material input/service requirements;
- evidence requirement;
- criticality/milestone relevance;
- human technical approval where required.

Capital readiness uses this plan; it does not create a parallel capital-only agronomy plan.

## 8. Budget and sources & uses

Required for Capital Ready:

- exact budget version;
- currency;
- line category;
- productive-plan linkage where possible;
- quantity/unit/unit cost;
- planned month/date;
- supplier/quote evidence when material;
- labor;
- nutrition/inputs;
- plant-health activities;
- irrigation/infrastructure if in scope;
- technical services;
- harvest/packing/logistics;
- contingency;
- taxes/fees that materially affect cash need;
- SANA fees shown explicitly;
- capital-partner/transaction costs shown explicitly when known.

Sources:

- producer cash contribution;
- producer in-kind contribution (reported separately from liquidity);
- buyer/offtaker advance;
- grant/cooperation/non-repayable contribution;
- supplier credit;
- other committed sources;
- external capital required.

Invariant:

`total productive uses = identified sources + funding gap`, subject to explicit contingency/version policy.

## 9. Monthly productive cash-flow inputs

Collect/derive:

- opening available productive cash where relevant;
- monthly productive uses;
- producer cash contribution schedule;
- expected external deployment schedule;
- buyer advances;
- other inflows;
- expected harvest timing;
- expected invoicing timing;
- expected collection timing;
- minimum operational liquidity need;
- seasonality and known cash troughs.

Do not equate project profitability with liquidity sufficiency.

## 10. Inventory / supplier evidence

Where material:

- current stock by product/SKU/batch;
- unit/canonical quantity;
- supplier;
- quotes/pro-formas;
- expected lead time;
- substitution risk;
- planned activity linkage.

Existing AGROWAY Supply records take precedence over repeated manual entry.

## 11. Market / buyer / offtake

Required fields:

- channel;
- identified buyer/offtaker where applicable;
- buyer contact/organization reference;
- evidence strength;
- historical buyer relationship;
- expected volume;
- quality/grade requirements;
- delivery window;
- price mechanism, not merely a single optimistic price;
- payment/collection terms;
- buyer concentration;
- logistics requirements;
- fallback market/channel.

Evidence classes may include:

- `OPEN_MARKET`
- `BUYER_IDENTIFIED`
- `PURCHASE_HISTORY`
- `BUYER_INTENT`
- `OFFTAKE_AGREEMENT`
- `PURCHASE_ORDER`

These classes are not equivalent. A named buyer is not guaranteed demand.

## 12. Harvest and commercialization assumptions

For the financial model, capture separately:

- expected harvest quantity by window;
- expected grade/quality mix;
- packout assumptions;
- pre-harvest loss assumptions;
- post-harvest loss assumptions;
- packing costs;
- commissions;
- transport/logistics;
- invoice timing;
- receivable/collection timing;
- buyer collection risk.

Every forecast input stores rationale/source and scenario ownership.

## 13. Financing request package

SANA-side productive fields:

- requested amount;
- currency;
- required-by date;
- productive purpose;
- requested/expected duration;
- proposed deployment milestones;
- own contribution;
- other sources;
- existing productive obligations known to SANA when legitimately collected;
- proposed partner/instrument placeholder.

Partner-specific fields such as KYC/AML, formal credit assessment, guarantees/collateral and suitability remain `PARTNER_REQUIRED` unless a specific lawful workflow assigns SANA a documented role.

## 14. Productive Risk Profile input set

At minimum support evidence for:

- management maturity;
- information coverage;
- traceability quality;
- execution history;
- agronomic state and uncertainty;
- productive/cost history;
- market visibility;
- buyer concentration;
- climate exposure;
- operating dependencies;
- capital-use history when available;
- unresolved incidents;
- legal/land/operating constraints material to the project.

Every risk dimension keeps state and confidence separate.

## 15. Traceability / evidence readiness

Required:

- Organization → Producer → Farm → Lot → CropCycle hierarchy active;
- current plan linked;
- responsible roles known;
- evidence capture route operational;
- critical activity evidence policy defined;
- historical evidence coverage measured;
- offline/sync limitations disclosed;
- evidence owner/reviewer identified;
- provenance/digest available for material evidence.

Target output is an `EvidenceManifest`, not a folder of unclassified files.

## 16. Social impact baseline

Only collect what is relevant, proportionate and consented. Potential fields:

- previous access to productive capital;
- repeat-financing history;
- productive management maturity;
- market access baseline;
- technical-assistance baseline;
- employment directly linked to the productive activity;
- inclusion dimensions only where ethically and contractually appropriate.

Do not convert poverty, gender, ethnicity, household information or personal stories into marketing attributes without a legitimate purpose and explicit consent.

## 17. Environmental / circularity baseline

Potential project-level data:

- relevant soil variables;
- water metrics where measured;
- input use where comparable;
- circular material flows;
- waste/by-product flows;
- source → transformation → product/batch → lot/application lineage;
- biodiversity only where a defensible methodology exists;
- carbon only when boundary, method, factor provenance and uncertainty are defined.

No carbon-neutral / closed-carbon-cycle claim follows merely from using an organic input.

## 18. Consent and sharing matrix

At onboarding define independently:

- `PRODUCER_PRIVATE`;
- `SANA_INTERNAL`;
- `CAPITAL_PARTNER_SHARED`;
- `FUNDER_SHARED`;
- `AUDITOR_SHARED`;
- `AGGREGATED_DEIDENTIFIED`;
- `PUBLIC_SUMMARY`;
- `STORY_PHOTO_MARKETING_CONSENT`.

Public storytelling consent must not be bundled into technical-service or financing consent.

## 19. Unknown-to-action conversion

Every material unknown has:

```text
InformationGap
→ requiredForGate
→ remediationAction
→ responsible
→ dueDate
→ requiredEvidence
→ review
→ RESOLVED / UNRESOLVED / ACCEPTED_CONDITION
```

Examples:

- soil analysis outdated;
- buyer intent not supported;
- contingency not approved;
- lot boundary uncertain;
- harvest history unavailable.

## 20. P0 first-pilot acceptance package

A project cannot be handed to the financial process without, at minimum:

1. `Producer` identity/operating authority;
2. `Farm`;
3. financed `Lot[]`;
4. `CropCycle[]`;
5. current `Diagnostic`;
6. versioned productive `Plan`;
7. approved `BudgetVersion`;
8. `CapitalNeed`;
9. `MarketPathway`;
10. `ProductiveRiskProfile`;
11. `EvidenceManifest`;
12. `ImpactPlan`;
13. consent/sharing profile;
14. current `ReadinessAssessment` G1–G9;
15. blocking gaps = 0 for the defined Capital Ready policy, subject to documented non-blocking conditions.

`CAPITAL_READY` still does not mean the capital partner has approved the transaction.

## 21. Collection workflow

Recommended first-pilot operating flow:

```text
pre-call / existing-record review
→ producer consent + data boundary
→ document/data upload
→ on-site or remote Diagnostic
→ AGROWAY hierarchy verification
→ agronomic baseline
→ productive-plan workshop
→ budget/sources & uses workshop
→ market/buyer verification
→ risk review
→ evidence review
→ gap remediation
→ Readiness Assessment
→ human Capital Ready review
→ partner handoff if eligible
```

## 22. Producer burden rule

Before asking a producer for data, SANA checks in order:

1. is it already canonical in AGROWAY?
2. can it be derived from existing evidence?
3. can SANA/technical staff observe it during normal service?
4. does the decision materially depend on it?
5. does the producer need to provide it personally?

The pilot should explicitly measure producer reporting minutes/hours.

## 23. First real Hass model data priority

### P0 before modeling

- exact farms/lots/area;
- plant count/age/stage;
- current crop-cycle status;
- current productive plan;
- real line-item budget;
- producer contribution;
- external capital need and timing;
- current production/harvest evidence;
- historical yield/quality records available;
- market/buyer evidence;
- payment terms;
- current critical agronomic risks;
- evidence coverage;
- consent/data-sharing status.

### P1 before funding decision

- validated scenario assumptions;
- contingency policy;
- milestone evidence requirements;
- partner-specific financial/KYC package;
- collection/settlement mechanism;
- Impact baseline sufficient for intended claims.

## 24. Pilot metrics generated by this pack

- data completeness;
- verified evidence coverage;
- unknown count and resolution rate;
- time to Capital Ready;
- producer reporting burden;
- analyst/agronomist hours;
- stale/outdated evidence rate;
- number/type of blocking gaps;
- percentage of fields reused from AGROWAY vs manually recollected.

## 25. Acceptance statement

The Data Pack is complete enough when SANA can answer, with provenance:

> Who is producing, where, what is being cultivated, what will be done, how much it costs, what capital is actually needed, where the product may be sold, what material risks/unknowns exist, what evidence supports those statements, what may be shared, and what remains for the financial partner to decide?
