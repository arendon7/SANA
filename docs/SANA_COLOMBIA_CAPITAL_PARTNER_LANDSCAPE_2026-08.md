# SANA Colombia Capital Partner Landscape — 2026-08

Status: `CURRENT_RESEARCH_SNAPSHOT`

Research date: `2026-08-11` Colombia time.

Owner boundary: SANA Capital & Markets / Legal / Impact & Trust.

Purpose: identify the most relevant **partner routes** for SANA's first financed agricultural pilot and later platform stages. This is not a recommendation to invest, borrow, contract, or launch a public offering. Regulatory/operating status must be re-verified immediately before any transaction.

---

## 1. Executive conclusion

For the **first monitored pilot**, the best architectural route is not public micro-crowdfunding.

Prioritize a modular stack:

```text
PRODUCTIVE PROJECT / PRODUCER
        │
        ├── SANA + AGROWAY
        │   readiness / monitoring / evidence
        │
        ├── AGRICULTURAL CREDIT / CAPITAL PROVIDER
        │
        ├── FINAGRO / FAG layer where applicable
        │
        ├── FIDUCIARY / CONTROLLED-PAYMENT layer where economics justify it
        │
        └── BUYER / OFFTAKER
```

For the **future public/fractional platform**, a2censo/BVC is the most obvious currently evidenced collaborative-financing route to diligence first, while keeping SANA as project/evidence infrastructure rather than regulated intermediation.

Bloom should be treated as `DO_NOT_USE_NOW` while the SFC intervention/takeover process remains unresolved.

---

## 2. Role taxonomy

A partner landscape is not a list of fintech logos. Separate roles:

```text
CAPITAL_PROVIDER
AGRICULTURAL_LENDER
DEVELOPMENT_FINANCE / REDISCOUNT
GUARANTEE_PROVIDER
FIDUCIARY / ADMINISTRATION & PAYMENTS
COLLABORATIVE_FINANCING_PLATFORM
PAYMENT / COLLECTION RAIL
BUYER / OFFTAKER
INSURER
IMPACT / BLENDED-FINANCE SPONSOR
```

One institution may cover more than one role, but role-specific diligence remains mandatory.

---

## 3. Status labels

Use:

`FIRST_PILOT_FIT`
`FUTURE_PLATFORM_FIT`
`NEEDS_DILIGENCE`
`DO_NOT_USE_NOW`
`ENABLING_INFRASTRUCTURE`

No status means contractual approval.

---

## 4. Candidate route A — Banco Agrario de Colombia

### Role

`AGRICULTURAL_LENDER`

Potential supporting role:

`PAYMENT/COLLECTION RAIL` according to final structure.

### Current official evidence

Banco Agrario currently publishes agricultural working-capital credit products and 2026 requirements for agricultural borrowers.

It also publishes a FINAGRO revolving-credit line for `Agricultura por Contrato`, designed for rural/agricultural working capital, usable through total or partial disbursements, with access to the Fondo Agropecuario de Garantías (FAG), and tied to a commercialization contract horizon.

Official sources:

- https://www.bancoagrario.gov.co/personas/productor-agropecuario/credito-capital-trabajo-agropecuario
- https://www.bancoagrario.gov.co/linea-de-credito-rotativo-finagro
- https://www.bancoagrario.gov.co/formatos-electronicos

### Why it fits SANA

Strong agricultural context.

Potentially compatible with:

- small/medium producers;
- productive working capital;
- contract/offtake-linked structures;
- FINAGRO/FAG support;
- existing formal credit rails.

SANA could provide:

- structured project dossier;
- productive budget;
- lot/cycle evidence;
- buyer/offtake evidence;
- monitored milestone information;
- post-disbursement productive evidence.

### Important limitation

SANA cannot assume the bank will accept AGROWAY evidence as underwriting, control-of-investment or risk-reduction evidence without an explicit bank agreement/process.

### Status

`FIRST_PILOT_FIT` for exploration.

### Diligence questions

1. Can one pilot borrower be evaluated under existing agricultural products without bespoke public fundraising?
2. Can the project use partial/milestone-like disbursement structures?
3. What borrower type/size and security/guarantee requirements apply?
4. Can external AGROWAY monitoring be incorporated into reporting or covenant workflows?
5. Can a buyer/offtake relationship materially support the route?
6. What data-sharing/API/file-exchange process is feasible?
7. What collection/settlement structure can be used?

---

## 5. Candidate route B — FINAGRO + FAG

### Role

`DEVELOPMENT_FINANCE / REDISCOUNT`

and

`GUARANTEE_PROVIDER` through FAG where applicable.

### Current official evidence

FINAGRO publishes 2026 CNCA resolutions covering credit-fomento, incentives/subsidies and agricultural-risk programs, including current FAG-related provisions.

Official source:

- https://www.finagro.com.co/transparencia-acceso-informacion-publica/normativa/resoluciones-cnca/cnca

Banco Agrario's current Agricultura por Contrato page explicitly states access to FAG for that product route.

### Why it fits SANA

FINAGRO/FAG may help SANA avoid reinventing a risk-sharing mechanism.

Potential value:

- established agricultural-finance policy infrastructure;
- guarantee support where eligible;
- connection to formal lenders;
- compatibility with rural/productive-credit policy.

### Important limitation

FINAGRO is not equivalent to a SANA marketplace or direct retail investment platform.

SANA must work through eligible financial intermediaries/program structures.

### Status

`ENABLING_INFRASTRUCTURE` and `FIRST_PILOT_FIT` through an eligible lender route.

### Diligence questions

- Which current FINAGRO destination/product best fits the selected Hass project?
- Is the producer eligible for FAG coverage and under what conditions?
- What documentation overlaps with the SANA Data Pack?
- Can SANA reduce duplicate evidence collection for the intermediary?
- What monitoring requirements already exist in the chosen product?

---

## 6. Candidate route C — Fiduagraria

### Role

`FIDUCIARY / ADMINISTRATION & PAYMENTS`

Potential subroles:

- controlled use-of-funds administration;
- associative-credit resource administration;
- payment waterfall/administration;
- project-specific fiduciary structures subject to contract/legal design.

### Current official evidence

Fiduagraria publicly offers:

- fiduciary administration arrangements;
- administration and payment structures;
- a specific `Recursos de Créditos Asociativos` scheme described as providing transparency for financial-credit resources used by groups of producers, with payments linked to project investment plans.

Official sources:

- https://www.fiduagraria.gov.co/recursos-de-creditos-asociativos/
- https://www.fiduagraria.gov.co/index.php/fiducia-de-administracion.html
- https://www.fiduagraria.gov.co/index.php/oficial/negocios-fiduciarios/fiducia-de-administracion-y-pagos.html

### Why it fits SANA

This is structurally close to SANA's desired:

`approved budget → controlled payment → productive use → AGROWAY evidence`.

It may be especially useful for:

- associative/cohort pilots;
- institutional/blended-finance projects;
- larger tickets where fiduciary cost is justified;
- multi-party controlled settlement.

### Important limitation

A fiduciary structure may be economically excessive for one small pilot project.

The first pilot should compare the governance benefit with setup/administration cost and transaction complexity.

### Status

`FIRST_PILOT_FIT` for a cohort/association or institutional pilot; `NEEDS_DILIGENCE` for a small single-producer pilot.

### Diligence questions

1. Minimum viable ticket/structure?
2. Setup and recurring fiduciary fees?
3. Can payments be conditioned on approved project budget/instructions?
4. Can transaction exports/reconciliation feed AGROWAY?
5. Can collection from buyers flow through the structure?
6. What KYC/onboarding burden applies to producer/supplier/buyer actors?

---

## 7. Candidate route D — a2censo / Bolsa de Valores de Colombia

### Role

`COLLABORATIVE_FINANCING_PLATFORM`

Primary future role:

- public/qualified-funder distribution;
- project financing through regulated collaborative-financing infrastructure;
- investor onboarding/position lifecycle under its approved rules.

### Current official evidence

The Superintendencia Financiera's 2025 resolutions approved changes to the a2censo regulation, including project-classification changes and expanded eligible participant structures. The SFC records a2censo as the collaborative-financing platform administered by BVC.

In April 2026 BVC reported an active a2censo campaign and described the platform as SFC-supervised. BVC reported more than 15,000 investors, more than 220 successful campaigns and approximately COP 122 billion financed at that time.

Official sources:

- https://www.superfinanciera.gov.co/publicaciones/10115461/resoluciones-2025/
- https://www.superfinanciera.gov.co/publicaciones/10115847/boletin-minhacienda-capitulo-superintendencia-financiera-octubre-2025/
- https://www.bvc.com.co/noticias/birreria-macha-lanza-campana-de-acciones-en-a2censo-para-impulsar-su-expansion-en-bogota-cmnqby2jg123l07isojj7h60l

### Why it fits SANA

This is the strongest currently evidenced route for a future `CAPITAL-4/5` public/fractional SANA experience.

Potential integration:

```text
SANA FundingOpportunity
→ qualification/readiness
→ partner handoff to a2censo/BVC process
→ legally implemented investor onboarding/funding
→ InstrumentPositionRef in SANA
→ AGROWAY monitoring
→ Capital Passport / Control Tower
```

### Important limitations

Do **not** assume from current research that:

- a natural-person agricultural producer can be onboarded today under the exact SANA target model;
- a small Hass working-capital project meets current a2censo admission economics/criteria;
- SANA can display or intermediate a2censo investment positions without contract/integration approval;
- SANA can advertise returns or execute orders.

Those points require direct current diligence with BVC/a2censo and legal review.

### Status

`FUTURE_PLATFORM_FIT`.

For first pilot:

`NEEDS_DILIGENCE`, not preferred as the default route.

### Diligence questions

1. Current eligible recipient structures after Decreto 34/2025 and current platform rules?
2. Minimum/typical project size?
3. Agricultural/project-product eligibility?
4. Debt vs equity/other supported structures for target recipients?
5. Admission and due-diligence timeline/cost?
6. API/partner/integration capabilities?
7. Can SANA supply monitoring/evidence after funding?
8. Data ownership and investor/project reporting interfaces?
9. Default/recovery responsibilities and data access?

---

## 8. Candidate route E — Bloom Crowdfunding

### Role

Historically:

`COLLABORATIVE_FINANCING_PLATFORM`.

### Current official evidence

The SFC ordered immediate takeover of Bloom Crowdfunding S.A. on 13 April 2026. The SFC stated it would determine whether the entity could be restored to adequate operation or would require liquidation. In June 2026 the SFC extended the decision period.

Official sources:

- https://www.superfinanciera.gov.co/publicaciones/10116086/superfinanciera-ordena-la-toma-de-posesion-de-bloom-crowdfunding-sa-sociedad-de-financiacion-colaborativa/
- https://www.superfinanciera.gov.co/publicaciones/10116160/boletin-minhacienda-capitulo-superintendencia-financiera-junio-2026/

### Status

`DO_NOT_USE_NOW`.

Reason:

Current intervention/takeover status creates an unacceptable trust/regulatory uncertainty for a new SANA pilot.

Revisit only after a definitive SFC outcome and fresh diligence.

---

## 9. Candidate route F — sophisticated/private capital

### Role

`CAPITAL_PROVIDER`.

Examples conceptually:

- family office;
- impact-oriented private investor;
- corporate strategic investor;
- closed investment vehicle/fund acting through counsel/administrator;
- development/cooperation capital.

### Why it may be optimal for first pilot

A first proof should validate SANA's evidence/monitoring architecture, not investor-acquisition UX.

One sophisticated capital provider can permit:

- one negotiated instrument;
- limited onboarding complexity;
- clear reporting requirements;
- controlled experiment size;
- faster learning.

### Limitations

The specific legal structure still requires Colombian legal/financial review.

SANA cannot casually collect multiple passive investors' money outside a valid framework.

### Status

`FIRST_PILOT_FIT` as a route type.

Specific candidates remain `NEEDS_DILIGENCE` until identified and verified.

---

## 10. Candidate route G — buyer/offtaker-backed capital

### Role

`BUYER / OFFTAKER`

plus possible:

`CAPITAL_PROVIDER`, `BUYER_ADVANCE`, or credit-support role depending on contract.

### Why it fits

For Hass/export production, buyer linkage can improve:

- demand visibility;
- quality definition;
- harvest window;
- price mechanism clarity;
- collection pathway;
- financing structure.

Potential model:

```text
Buyer/offtaker intent or contract
+ producer contribution
+ lender/capital
+ SANA monitoring
→ production
→ delivery
→ buyer collection
→ settlement
```

### Status

`FIRST_PILOT_FIT` as a design requirement.

Specific buyer candidates require commercial sourcing and diligence.

---

## 11. Comparative first-pilot matrix

| Route | Agricultural fit | Capital access | Controlled funds | Public investors | First-pilot complexity | SANA fit |
|---|---|---|---|---|---|---|
| Banco Agrario | High | Credit | Medium | No | Medium | High |
| FINAGRO/FAG | High | Enabling | N/A | No | Medium | High as infrastructure |
| Fiduagraria | High/institutional | No direct credit by itself | High | No | Medium/High | High for controlled flows |
| a2censo/BVC | Medium until agricultural fit confirmed | High marketplace potential | Partner-defined | Yes/qualified framework | High | High future fit |
| Bloom | Unknown/currently intervened | Not acceptable now | — | — | Unacceptable now | Do not use now |
| Private sophisticated capital | Depends on provider | High for pilot | Structure-dependent | No | Low/Medium | Very high pilot fit |
| Buyer-backed | High if real buyer | Partial/indirect | Contract-dependent | No | Medium | Very high strategic fit |

---

## 12. Recommended first-pilot stacks

### Stack P1 — simplest controlled learning

```text
1 sophisticated funder
+ 1–3 productive projects
+ SANA/AGROWAY monitoring
+ identified buyer/offtaker
+ normal banking/payment rails
```

Use when legal counsel confirms a straightforward private transaction structure.

Why:

Fastest way to test `capital → use → field → harvest → sale → settlement` without marketplace complexity.

### Stack P2 — agricultural-credit route

```text
Banco Agrario / eligible lender
+ FINAGRO/FAG where applicable
+ SANA/AGROWAY evidence
+ buyer/offtake pathway
```

Why:

Tests whether SANA can improve project preparation/monitoring inside existing agricultural-finance rails.

### Stack P3 — controlled cohort/institutional route

```text
Capital provider / lender
+ Fiduagraria administration/payments
+ association/cohort
+ SANA/AGROWAY
+ buyer/offtaker
```

Why:

Strong for multi-producer cohorts where budget-controlled fund flow and settlement transparency justify fiduciary cost.

### Stack P4 — future public/fractional route

```text
SANA FundingOpportunity
+ a2censo/BVC or other then-authorized partner
+ partner investor onboarding/fund flow
+ AGROWAY monitoring
+ Capital Passport
```

Why:

Potential CAPITAL-4/5 architecture after monitored pilots.

---

## 13. Recommended order of outreach

### 1. Buyer/offtaker discovery

Before financing outreach, identify the real Hass market route.

### 2. Banco Agrario / agricultural lender conversation

Test:

- pilot eligibility;
- what underwriting/project data they need;
- whether SANA evidence has operational value;
- FINAGRO/FAG route.

### 3. Fiduagraria discovery

Test economic feasibility for:

- cohort funds;
- controlled administration;
- supplier payments;
- buyer collection/settlement.

### 4. One sophisticated/private capital source

Structure a small monitored pilot if legally suitable.

### 5. a2censo/BVC strategic conversation

Not necessarily to finance pilot #1.

Objective:

learn future admission/integration requirements now so SANA's data model does not diverge from a future regulated marketplace path.

---

## 14. Partner diligence knockout gates

Reject/hold any partner route if:

- legal/regulatory status cannot be verified;
- role/responsibility is ambiguous;
- SANA is expected to perform regulated authority informally;
- fund location/custody is unclear;
- KYC/AML owner is unclear;
- fees are materially opaque;
- no default/recovery process exists;
- transaction exports/reconciliation cannot be obtained;
- agriculture timing is incompatible;
- partner cannot distinguish forecasts from realized outcomes;
- partner requires misleading “guaranteed” claims;
- data-sharing rights are incompatible with producer privacy/governance.

---

## 15. Current regulatory watchlist

### SFC supervised entities

The SFC maintains a current list of supervised entities and specifically includes the category `Sociedades de Financiación Colaborativa`.

Official source:

- https://www.superfinanciera.gov.co/publicaciones/13067/industrias-supervisadas/entidades-vigiladas-por-la-superintendencia-financiera-de-colombia-13067/

### Collaborative-financing instructions

As of this research date, the SFC's 2026 regulatory-project page still lists `Proyecto de Circular Externa 07-2026`, concerning special instructions for collaborative financing through securities, as a project.

Official sources:

- https://www.superfinanciera.gov.co/publicaciones/10082380/normativaproyectos-de-normatividadproyectos-de-norma-10082380/
- https://www.superfinanciera.gov.co/publicaciones/10116104/proyecto-de-circular-externa-07-2026/

Therefore:

> collaborative-financing transaction design must be re-verified at execution date.

---

## 16. Architecture consequence for SANA

SANA should implement partner abstraction, not partner-specific core logic.

```text
CapitalPartnerProgram
├── partnerRef
├── partnerType
├── permittedRecipientTypes
├── permittedProjectTypes
├── geography
├── currency
├── min/max ticket
├── requiredDocuments
├── requiredEvidence
├── risk/eligibility policy ref
├── KYC owner
├── fundFlow owner
├── settlement owner
├── default/recovery owner
├── integration mode
├── reporting SLA
├── currentVerificationDate
└── currentStatus
```

A project matching one partner must remain portable to another route where contractually feasible.

---

## 17. First outreach dossier

Before speaking with a partner, SANA should carry:

1. one anonymized/representative Hass `ProductiveInvestmentProject`;
2. G1–G9 readiness framework;
3. Productive Risk Profile example;
4. budget + monthly cash-flow structure;
5. capital traceability model;
6. milestone evidence model;
7. AGROWAY FIELD screenshots only where Product Approved / correctly labeled;
8. Control Tower exception concept;
9. Capital Readiness Package example;
10. exact boundary of what SANA does **not** do.

Core pitch:

> SANA is not asking the partner to trust a black box. SANA can supply a structured agricultural project, versioned budget, productive context, evidence lineage, exception monitoring and deterministic closure data while the partner retains its own financial/regulatory authority.

---

## 18. Research limitations

This snapshot is not exhaustive.

It deliberately prioritizes official current sources and first-pilot role fit over a broad list of fintechs.

Before selection, perform:

- direct institutional outreach;
- current SFC/other supervisor verification;
- legal due diligence;
- commercial terms review;
- API/data review;
- security/privacy review;
- default/recovery review;
- pilot economics comparison.

---

## 19. Recommendation

Do not choose “the platform” first.

Choose the **first pilot architecture** first.

Recommended sequence:

```text
REAL HASS PROJECT
→ REAL BUYER PATHWAY
→ CAPITAL READINESS
→ compare PRIVATE CAPITAL vs AGRICULTURAL CREDIT
→ decide whether fiduciary controlled flows add enough value
→ execute one monitored pilot
→ learn
→ institutional Control Tower
→ later connect to collaborative-financing distribution
```

This preserves SANA's long-term investment-platform ambition while optimizing the first experiment for learning, safety and product truth.