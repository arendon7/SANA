import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ledgerPath='apps/control-web/public/sana-v3-commercial-ledger.js';
const cyclePath='apps/control-web/public/sana-v3-cycle-commercial-provenance.js';
const ledgerCode=fs.readFileSync(ledgerPath,'utf8');
const cycleCode=fs.readFileSync(cyclePath,'utf8');

const harvestCases=[{id:'HR-CAF-01',lot:'CAF-A1',handoffs:[{id:'HR-CAF-D1',quantity:4.5,unit:'t'}],sales:[{id:'HR-CAF-S1',quantity:4.5,unit:'t',commercialRef:'SALE-DEMO-CAF-01'}]},{id:'HR-AGU-01',lot:'AGU-A2',handoffs:[],sales:[]}];
const econCases=[{id:'ECON-CAF-A1',lot:'CAF-A1',events:[{id:'E-SALE-1',kind:'SALE_DECLARATION'},{id:'E-INV-1',kind:'INVOICE_REFERENCE'},{id:'E-PAY-1',kind:'PAYMENT_STATUS_DECLARED'}]}];
const context={
  window:{
    __SANA_HARVEST_LEDGER__:{forLot:lot=>structuredClone(harvestCases.filter(c=>c.lot===lot))},
    __SANA_ECONOMIC_RECONCILIATION__:{forLot:lot=>structuredClone(econCases.filter(c=>c.lot===lot))},
    __SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-CF-04',version:4,lot:'CAF-A1'})}
  },
  storage:{records:[
    {id:'COM-LOCAL-PAY',type:'commercial-ledger-event',lot:'CAF-A1',createdAt:'2026-08-16',values:{caseId:'COM-CAF-01',lot:'CAF-A1',buyerRef:'BUYER-DEMO-01',kind:'PAYMENT_STATUS_DECLARED',observedAt:'2026-08-16',paymentState:'DECLARED_PAID',detail:'Declaración DEMO; no ejecución'}}
  ]},
  DEMO:{lots:[{id:'CAF-A1',crop:'Café'},{id:'AGU-A2',crop:'Aguacate'}]},
  views:{results:()=>'',economics:()=>'',passport:()=>'',cycle:()=>''},
  metric:()=>'',esc:v=>String(v),openModal:()=>{},document:{addEventListener:()=>{}},localStorage:{getItem:()=>null},console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(ledgerCode,context,{filename:ledgerPath});
const api=context.window.__SANA_COMMERCIAL_LEDGER__;
assert(api,'commercial ledger API missing');
assert.equal(api.schema,'SANA_COMMERCIAL_OFFTAKE_LEDGER_V1');
const caf=api.forLot('CAF-A1')[0];
assert(caf,'CAF commercial case missing');
assert.equal(caf.offers.length,1);
assert.equal(caf.interests.length,1);
assert.equal(caf.agreements.length,1);
assert.equal(caf.deliveries.length,1);
assert.equal(caf.paymentStates.length,1,'local payment declaration should be visible');
assert.equal(caf.verifiedContracts,0,'agreement reference must never become verified contract');
assert.equal(caf.verifiedInvoices,0);
assert.equal(caf.paymentsExecuted,0,'payment declaration must never become execution');
assert.equal(caf.bankSettlementsVerified,0);
assert.equal(caf.guaranteedRevenue,0);
assert.equal(caf.automaticOrderActions,0);
assert.equal(caf.crossDomainRefs.length,5,'harvest + economics are provenance references only');
const agu=api.forLot('AGU-A2')[0];
assert(agu,'AGU commercial case missing');
assert.equal(agu.interests.length,1);
assert.equal(agu.agreements.length,0,'buyer interest must not infer agreement');
assert.equal(agu.deliveries.length,0);
assert.equal(agu.semantics.interestWithoutAgreement,true);
assert.equal(api.summary().verifiedContracts,0);
assert.equal(api.summary().paymentsExecuted,0);
assert.equal(api.summary().guaranteedRevenue,0);
assert.match(api.integrity,/BUYER_INTEREST ≠ OFFTAKE_AGREEMENT/);
assert.match(api.integrity,/OFFTAKE_AGREEMENT_REFERENCE ≠ VERIFIED_CONTRACT/);
assert.match(api.integrity,/PAYMENT_STATUS_DECLARED ≠ PAYMENT_EXECUTED/);
assert.match(api.integrity,/OFFTAKE_REFERENCE ≠ GUARANTEED_REVENUE/);

vm.runInContext(cycleCode,context,{filename:cyclePath});
const cycle=context.window.__SANA_CYCLE_COMMERCIAL__;
assert(cycle,'cycle commercial API missing');
const selected=cycle.selected();
assert.equal(selected.valid,true);
assert.equal(selected.plan.id,'PL-CF-04');
assert.equal(selected.cases.length,1);
assert.equal(selected.cases[0].agreementReferences,1);
assert.equal(selected.cases[0].verifiedContracts,0);
assert.equal(selected.cases[0].paymentsExecuted,0);
assert.equal(selected.cases[0].guaranteedRevenue,0);
assert(!('completeness' in selected));
assert(!('readyForArchive' in selected));
assert.match(cycle.integrity,/COMMERCIAL_PROVENANCE ≠ CYCLE_GATE/);

for(const code of [ledgerCode,cycleCode]){
  assert(!/fetch\s*\(/.test(code));
  assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
  assert(!/canonicalMutated\s*=\s*true/.test(code));
  assert(!/paymentsExecuted\s*:\s*[1-9]/.test(code));
  assert(!/verifiedContracts\s*:\s*[1-9]/.test(code));
}
console.log('SANA commercial offtake v59 validation: OK');
