import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const path='apps/control-web/public/sana-v3-capital-governance.js';
const code=fs.readFileSync(path,'utf8');
let completeness=82;
let ddGaps=5;
let commercialInterest=2;
const context={
  window:{
    __SANA_CAPITAL_READINESS__:{gateData:()=>({identity:{score:80}}),overall:()=>completeness},
    __SANA_COMMERCIAL_LEDGER__:{forLot:()=>[{interests:Array.from({length:commercialInterest},(_,i)=>({id:`I${i}`})),agreements:[{id:'A1'}]}]},
    __SANA_ECONOMIC_RECONCILIATION__:{forLot:()=>[{declaredCosts:[{id:'C1'}]}]},
    __SANA_DUE_DILIGENCE_GAPS__:{current:()=>({snapshot:{id:'SNAP-1'},gaps:Array.from({length:ddGaps},(_,i)=>({id:`G${i}`})),counts:{ALTA:2}})}
  },
  storage:{records:[
    {id:'CAP-LOCAL-F1',type:'capital-governance-event',lot:'CAF-A1',createdAt:'2026-08-17',values:{caseId:'CAP-CAF-01',lot:'CAF-A1',counterpartyRef:'INVESTOR-DEMO-01',kind:'FUNDING_STATUS_DECLARED',observedAt:'2026-08-17',fundingRef:'FUND-DEMO-1',fundingState:'FUNDED_DECLARED_DEMO',detail:'Declaración local; no desembolso'}},
    {id:'CAP-LOCAL-C1',type:'capital-governance-event',lot:'CAF-A1',createdAt:'2026-08-17',values:{caseId:'CAP-CAF-01',lot:'CAF-A1',counterpartyRef:'INVESTOR-DEMO-01',kind:'COMMITMENT_REFERENCE',observedAt:'2026-08-17',commitmentRef:'COMMIT-DEMO-1',commitmentState:'REFERENCE_ONLY'}}
  ]},
  DEMO:{lots:[{id:'CAF-A1',crop:'Café'},{id:'AGU-A2',crop:'Aguacate'}]},
  views:{capital:()=>'<span>Readiness</span><strong>82%</strong><h2>Readiness compuesto</h2><footer class="footer"></footer>'},
  metric:()=>'',esc:v=>String(v),openModal:()=>{},document:{addEventListener:()=>{}},structuredClone,console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(code,context,{filename:path});
const api=context.window.__SANA_CAPITAL_GOVERNANCE__;
assert(api,'capital governance API missing');
assert.equal(api.schema,'SANA_CAPITAL_GOVERNANCE_LEDGER_V1');
assert.equal(api.documentCompleteness(),82);
const caf=api.forLot('CAF-A1')[0];
assert(caf,'CAF capital case missing');
assert.equal(caf.interests.length,1);
assert.equal(caf.ddRequests.length,1);
assert.equal(caf.commitments.length,1,'local commitment reference should remain visible');
assert.equal(caf.funding.length,1,'local funding status declaration should remain visible');
assert.equal(caf.verifiedTermSheets,0);
assert.equal(caf.verifiedCommitments,0,'commitment reference must not become verified commitment');
assert.equal(caf.legalClosingsVerified,0);
assert.equal(caf.fundingExecuted,0,'funding status declaration must not execute funding');
assert.equal(caf.custodyAmount,0);
assert.equal(caf.eligibilityDecision,null,'document completeness must not create eligibility');
assert.equal(caf.creditScore,null);
assert.equal(caf.investmentRecommendation,null);
assert.equal(caf.automaticInvestmentActions,0);
assert.equal(caf.context.commercial.verifiedContracts,0);
assert.equal(caf.context.commercial.guaranteedRevenue,0);
assert.equal(caf.context.economic.paymentsExecuted,0);
assert.equal(caf.context.economic.realizedRevenue,0);
assert.equal(caf.context.dueDiligence.decisionAuthority,false);
const agu=api.forLot('AGU-A2')[0];
assert(agu,'AGU capital case missing');
assert.equal(agu.terms.length,1);
assert.equal(agu.commitments.length,0,'term sheet reference must not infer commitment');
assert.equal(agu.semantics.termReferenceWithoutCommitment,true);
assert.equal(agu.verifiedTermSheets,0,'term sheet reference must not become verified/signed term sheet');
assert.equal(agu.fundingExecuted,0);

const before=api.documentCompleteness();
ddGaps=999;commercialInterest=99;
const after=api.documentCompleteness();
assert.equal(before,after,'commercial/DD context must not change document completeness score');
const changedContext=api.contextForLot('CAF-A1');
assert.equal(changedContext.commercial.buyerInterestCount,99);
assert.equal(changedContext.dueDiligence.openGaps,999);
assert.match(changedContext.integrity,/NOT_WEIGHTED/);

const s=api.summary();
assert.equal(s.documentCompleteness,82);
assert.equal(s.verifiedCommitments,0);
assert.equal(s.fundingExecuted,0);
assert.equal(s.custodyAmount,0);
assert.equal(s.eligibilityDecisions,0);
assert.equal(s.creditScores,0);
assert.equal(s.investmentRecommendations,0);
assert.equal(s.automaticInvestmentActions,0);
assert.match(api.integrity,/DOCUMENT_COMPLETENESS ≠ ELIGIBILITY/);
assert.match(api.integrity,/COUNTERPARTY_INTEREST ≠ COMMITMENT/);
assert.match(api.integrity,/TERM_SHEET_REFERENCE ≠ SIGNED_TERM_SHEET/);
assert.match(api.integrity,/FUNDING_STATUS_DECLARED ≠ DISBURSEMENT/);
assert.match(api.integrity,/NO_SOLICITATION/);
assert.match(api.integrity,/NO_CUSTODY/);
assert.match(api.integrity,/NO_INVESTMENT_RECOMMENDATION/);

const rendered=context.views.capital();
assert(rendered.includes('Completitud documental'));
assert(!rendered.includes('<span>Readiness</span>'));
assert(rendered.includes('Completitud documental compuesta'));

assert(!/fetch\s*\(/.test(code));
assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
assert(!/productionActivationAllowed\s*=\s*true/.test(code));
assert(!/canonicalMutated\s*=\s*true/.test(code));
console.log('SANA capital governance v61 validation: OK');
