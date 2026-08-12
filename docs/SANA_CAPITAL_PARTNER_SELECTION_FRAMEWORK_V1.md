# SANA Capital Partner Selection Framework v1

Status: `PILOT_PARTNER_DILIGENCE_CANON_DRAFT`

Owner boundary: SANA Capital & Markets / Impact & Trust / Legal & Compliance / Product & Technology.

Purpose: define how SANA selects, diligences and governs the partner(s) that perform financial, regulated, custody/collection, investor-onboarding or related functions that SANA should not silently assume. This framework does not designate a partner and does not certify any entity as suitable without current evidence.

## 1. Core principle

SANA provides agricultural project intelligence, readiness, agronomic/operational accompaniment, traceability, monitoring and impact evidence.

Where a transaction requires regulated or contractually specialized financial activity, that activity is performed by the responsible partner under the applicable legal framework.

Invariant:

`SANA_PRODUCTIVE_AUTHORITY != CAPITAL_PARTNER_FINANCIAL_AUTHORITY != AGRONOMIC_AUTHORITY != AI_AUTHORITY`.

## 2. Partner roles are modular

One institution does not need to perform every role. The first pilot may use different entities for:

- capital provider / funder;
- regulated financing/intermediation platform;
- lender/fintech/bank;
- fiduciary/trust/custody/segregation;
- payment/collection/settlement;
- buyer/offtaker financing;
- insurance;
- cooperation/blended-finance support;
- institutional reporting/API integration.

SANA must model the responsibility split explicitly rather than assuming a single all-purpose "financial partner".

## 3. Candidate status lifecycle

```text
IDENTIFIED
→ DESK_RESEARCH
→ DILIGENCE
→ CONDITIONS_REQUIRED
→ CONDITIONALLY_APPROVED
→ APPROVED_FOR_PILOT
→ ACTIVE_PILOT
→ PERIODIC_REVIEW
```

Negative states:

- `REJECTED`
- `SUSPENDED`
- `TERMINATED`
- `REASSESSMENT_REQUIRED`

Approval is role-specific. An entity can be approved as a capital provider while not being approved for regulated intermediation or custody.

## 4. Hard knockout criteria

Reject or block a candidate if any material criterion applies:

1. current legal/regulatory standing cannot be independently evidenced for the role claimed;
2. proposed structure requires SANA to perform a regulated activity informally or without the necessary status;
3. custody/segregation/collection responsibilities are unclear where relevant;
4. data/privacy terms are materially unclear or incompatible with producer/investor rights;
5. fees or economic deductions are opaque;
6. agricultural timing/cash-flow characteristics cannot be supported;
7. no credible delinquency/default/restructuring/recovery policy exists where applicable;
8. project/transaction data cannot be exported or reconciled;
9. the partner insists on unsupported guaranteed-return, impact or green claims;
10. conflicts of interest cannot be disclosed/governed;
11. business continuity or operational solvency risk is unacceptably high for the proposed role;
12. partner cannot identify the legal entity actually receiving/holding/moving funds.

A knockout overrides the numeric score.

## 5. Weighted diligence dimensions

Initial recommended weights are configurable policy, not immutable truth:

| Dimension | Weight |
|---|---:|
| Regulatory standing & trust | 25 |
| Agricultural / productive-project fit | 15 |
| Fund flow, custody & settlement | 15 |
| Risk, delinquency & recovery | 10 |
| Integration, security & data | 10 |
| Commercial economics / fee transparency | 10 |
| Social / impact alignment | 10 |
| Operational SLA & support | 5 |

Total: 100.

No score can compensate for a hard knockout or missing critical evidence.

## 6. Regulatory standing & trust

Evaluate with current primary-source evidence:

- exact legal entity and registration;
- authorization/license/registration required for the proposed role;
- supervisor/competent authority;
- current status and material restrictions;
- ownership/control where relevant;
- audited financial statements or equivalent evidence where available;
- material enforcement/intervention/administrative history;
- governance and responsible officers;
- AML/KYC policies for applicable roles;
- complaints/incidents material to operational continuity;
- business continuity and wind-down arrangements.

Regulatory status must be re-verified immediately before any live transaction because it is temporally unstable.

## 7. Agricultural / productive-project fit

Assess whether the partner can support:

- productive agricultural projects rather than generic consumer credit only;
- seasonal/cycle-based cash flows;
- delayed harvest/collection realities;
- small/medium producers or natural persons where the target pilot requires them;
- farm/crop/project-level underwriting inputs;
- milestone-based deployment or evidence review where legally/operationally possible;
- off-taker/buyer-linked structures;
- partial/restructured outcomes rather than binary payment assumptions;
- multiple future crop/territory contexts.

A partner with an excellent generic lending product may still be a poor SANA pilot partner if it cannot understand agricultural timing.

## 8. Fund flow, custody and settlement

Map exactly:

```text
Funder
→ collection/commitment account
→ legal holder/custodian
→ project deployment
→ producer/supplier/authorized payee
→ buyer payment/receivable
→ collection
→ settlement
→ repayment/distribution/residual
```

Required questions:

- who legally holds funds at every state?
- are project/investor funds segregated where required?
- who instructs deployments?
- what evidence supports each transfer?
- can payments go directly to approved suppliers/services where the instrument allows it?
- how is buyer collection reconciled?
- how are partial collections handled?
- what is the settlement priority/waterfall?
- who owns/exports the transaction ledger?
- how are corrections/reversals represented?

AGROWAY/SANA may mirror/trace financial facts without claiming custody if a partner controls the funds.

## 9. KYC / AML / onboarding responsibility

For each participant type define responsibility for:

- producer/receptor onboarding;
- investor/funder onboarding;
- beneficial ownership;
- sanctions/PEP checks where applicable;
- source-of-funds requirements;
- ongoing monitoring;
- document retention;
- consent/legal notices;
- rejection/escalation.

SANA should exchange only the minimum necessary data under a documented role and legal basis.

## 10. Risk, delinquency and recovery

Evaluate:

- underwriting process;
- treatment of SANA Productive Risk Profile/evidence;
- instrument approval authority;
- late-payment definition;
- grace/restructuring rules;
- agricultural-force-majeure treatment;
- insurance interaction;
- collection/recovery process;
- default reporting;
- loss allocation;
- investor communication;
- producer protection/fair treatment;
- dispute handling.

SANA must be able to record outcomes such as `DELAYED`, `RESTRUCTURED`, `IMPAIRED` and `CLOSED_WITH_LOSS` without the partner forcing a falsely successful project state.

## 11. Integration, security and data

Minimum desired capabilities:

- documented API or robust export mechanism;
- stable participant/project/transaction identifiers;
- project-level commitment/deployment/collection/settlement records;
- idempotency or reconciliation strategy;
- timestamps and currency preserved;
- webhook/event capability where available, but integration must also tolerate pull/reconciliation models;
- error/retry semantics;
- audit trail;
- access controls;
- encryption/security documentation;
- incident notification commitments;
- retention/deletion policy;
- data residency/processor roles where material;
- portability at termination.

SANA must never depend on an opaque dashboard as the only source of financial truth.

## 12. Evidence / milestone interoperability

Ideal pilot partner can consume a structured SANA package such as:

```text
ProductiveInvestmentProject
+ ReadinessAssessment
+ ProductiveRiskProfile
+ BudgetVersion
+ FundingMilestone
+ EvidenceManifest
+ ImpactPlan
```

and return structured financial facts such as:

```text
PartnerDecision
Commitment
Deployment
Collection
Settlement
Recovery
```

Partner acceptance of SANA evidence does not transfer financial approval authority to SANA.

## 13. Commercial economics

Document transparently:

- onboarding/setup fees;
- transaction/origination fees;
- platform fees;
- payment/custody/fiduciary fees;
- servicing/monitoring fees;
- investor-side fees;
- producer-side fees;
- late/default/recovery fees;
- API/integration fees;
- minimum volumes/tickets;
- exclusivity;
- termination costs;
- revenue-share expectations.

Every fee must map to the pilot financial model. Hidden deductions fail diligence.

## 14. Impact / social-purpose alignment

Assess whether the partner is compatible with:

- producer dignity and fair treatment;
- transparent risk communication;
- no poverty marketing;
- measurable rather than decorative impact;
- data rights and consent;
- small/medium producer access where targeted;
- repeat financing/capital mobility rather than dependency;
- environmental claim discipline;
- blended-finance/cooperation structures where useful;
- willingness to report negative as well as positive outcomes.

Impact alignment cannot substitute for financial/regulatory competence.

## 15. Operational SLA / support

Evaluate:

- dedicated pilot owner;
- onboarding turnaround;
- deployment turnaround;
- incident support;
- reconciliation support;
- escalation path;
- response to failed payments;
- availability during harvest/settlement windows;
- change-management communication;
- ability to support a 5–10 producer pilot without enterprise-scale minimums.

## 16. Due-diligence evidence pack

Collect, as applicable:

- regulator/official registry evidence;
- corporate/legal entity records;
- license/authorization evidence;
- audited or reliable financial information;
- terms/contracts and product documents;
- pricing/fee schedule;
- KYC/AML policy summary;
- custody/segregation/settlement documentation;
- default/recovery policy;
- privacy/data-processing terms;
- security materials;
- API/export documentation;
- business continuity/wind-down information;
- references/current clients where lawful/useful;
- material adverse event/enforcement history;
- insurance/indemnity information where relevant.

Evidence stores source/date and must be refreshed according to risk.

## 17. Diligence scoring states

Per criterion:

- `PASS_VERIFIED`
- `PASS_SUPPORTED`
- `CONDITION_REQUIRED`
- `INCOMPLETE`
- `FAIL`
- `NOT_APPLICABLE`

Partner-level decision:

- `APPROVED_FOR_PILOT`
- `CONDITIONALLY_APPROVED`
- `MORE_INFORMATION_REQUIRED`
- `REJECTED`

No automated AI partner approval.

## 18. Minimum requirements for the first pilot

The first live partner architecture should support:

1. COP-denominated project accounting unless another currency is deliberately selected;
2. closed, small cohort of approximately 5–10 producers/projects;
3. clear producer/receptor onboarding responsibility;
4. clear funder onboarding responsibility;
5. legally valid funding/instrument structure;
6. project-level commitments and deployments;
7. ability to reconcile milestone/evidence references even if the partner does not automate them;
8. buyer collection/settlement pathway defined;
9. partial payment/delay/restructuring handling;
10. transaction and status export;
11. transparent fees;
12. responsibility matrix signed/agreed before funds move.

Public retail microinvestment is not required for the first pilot.

## 19. Pilot RACI

### SANA

Responsible/accountable for the SANA scope:

- producer/project discovery;
- Diagnóstico SANA;
- agronomic/productive readiness;
- ProductiveInvestmentProject data architecture;
- AGROWAY traceability;
- evidence coverage;
- productive monitoring;
- SANA Impact methodology/claims within scope;
- reporting inputs;
- escalation of productive exceptions.

### Capital / regulated partner

As applicable:

- financial-product/instrument design and approval;
- regulated fundraising/intermediation;
- investor/funder onboarding;
- KYC/AML;
- custody/segregation;
- financial deployment authority;
- collection and settlement;
- delinquency/default/recovery;
- required financial disclosures.

### Producer

- truthful productive information;
- consent within agreed scope;
- operation/execution;
- evidence capture/cooperation;
- contractual productive/financial obligations.

### Buyer/offtaker

- commercial terms;
- quality/acceptance;
- delivery confirmation;
- payment/collection according to contract.

### Funder/investor

- capital commitment;
- own onboarding/KYC requirements;
- acceptance of disclosed instrument/project risk;
- no agronomic operating authority unless separately and validly assigned.

## 20. Conflict-of-interest controls

Explicitly disclose and govern when:

- SANA receives a financing-linked fee;
- Greenatics/Wondergreen sells inputs into the financed project;
- buyer/offtaker also funds the project;
- partner/funder has influence over supplier selection;
- SANA recommends a related-party solution;
- one entity acts in multiple financial roles.

Technical recommendation remains:

`need → intervention → compatible product → SKU → application`, not related-party product first.

## 21. Periodic partner monitoring

After approval, monitor:

- current regulatory standing;
- financial/operational health;
- incident history;
- SLA performance;
- reconciliation quality;
- data/API stability;
- producer complaints;
- default/recovery behavior;
- fee changes;
- contract/policy changes;
- impact/claim discipline.

Any material change may trigger `REASSESSMENT_REQUIRED` or `SUSPENDED`.

## 22. Termination / continuity plan

Before pilot launch define:

- how active projects continue if partner exits;
- who retains ledger/evidence copies;
- how funds/receivables are handled;
- data export format;
- participant communication responsibility;
- replacement-partner handoff;
- outstanding dispute/default ownership;
- impact/reporting continuity.

SANA should avoid a single point of failure where losing access to a partner dashboard destroys the project financial history.

## 23. Candidate comparison output

Each candidate review should produce:

```text
PartnerCandidate
├── legalEntity
├── proposedRole[]
├── regulatoryEvidence
├── knockoutCheck
├── dimensionScores
├── evidenceQuality
├── conditions[]
├── integrationFit
├── economics
├── risks
├── conflicts
├── recommendation
└── reviewedAt / reviewExpiry
```

The comparison should include qualitative trade-offs, not only a league table.

## 24. Research protocol for real Colombian candidates

Because regulatory status, products, financial health and company operations change over time, every real candidate search must use current sources. Priority:

1. Colombian regulator / official registry / legal sources;
2. candidate's official legal/product/API/security documents;
3. audited financial or official filings;
4. reliable independent reporting for material incidents/context.

Do not rely on historical memory to assert that a company is currently licensed, active, solvent or accepting agricultural projects.

## 25. Acceptance statement

A partner is ready for a live SANA pilot only when SANA can answer, with current evidence:

> What exact legal entity performs each financial role, under what authority and contract, where funds sit, who can move them, how the project/investor/producer are onboarded, how transactions and defaults are handled, what data SANA receives, what it costs, how conflicts are governed, and how the pilot continues if the partner fails or exits?
