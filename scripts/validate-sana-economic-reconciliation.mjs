import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ledgerPath='apps/control-web/public/sana-v3-economics-ledger.js';
const cyclePath='apps/control-web/public/sana-v3-cycle-economic-reconciliation.js';
const ledgerCode=fs.readFileSync(ledgerPath,'utf8');
const cycleCode=fs.readFileSync(cyclePath,'utf8');

const econRows=[{lot:{id:'CAF-A1',name:'Café Norte',crop:'Café'},lotId:'CAF-A1',budget:18400000,baseRecorded:15950000,baseRecordedProvenance:'BASELINE_DEMO',localRecorded:500000,recorded:16450000,priceScenario:13800000,volume:5.82,unit:'t',grossScenario:80316000,grossMarginScenario:63866000,observed:{quantity:5.82,unit:'t',source:'BASELINE_DEMO'}}];
const costs=[{id:'COST-LOCAL-1',lot:'CAF-A1',activityId:'T-105',planId:'PL-CF-04',planVersion:4,linkIntegrity:'OK',category:'inputs',concept:'Insumo DEMO',amount:500000,date:'2026-08-14',evidence:'EV-COST-1',supported:true,provenance:'LOCAL_ONLY'}];
const laborCases=[{id:'LAB-CAF-01',lot:'CAF-A1',activityId:'T-105',costs:[{id:'LAB-COST-1',kind:'LABOR_COST',amount:75,currencyUnit:'kCOP',costRef:'COST-LAB-CAC-DEMO',observedAt:'2026-08-14'}]}];
const inventoryCases=[{id:'INVCASE-1',events:[{id:'INV-E1',lot:'CAF-A1',kind:'CONSUMPTION',costRef:'COST-INVENTORY-REF',activityId:'T-105',observedAt:'2026-08-14'}]}];
const context={
  window:{
    __SANA_ECONOMICS__:{rows:()=>structuredClone(econRows),forLot:lot=>lot==='CAF-A1'?structuredClone(costs):[]},
    __SANA_LABOR_LEDGER__:{forLot:lot=>lot==='CAF-A1'?structuredClone(laborCases):[]},
    __SANA_INVENTORY_LEDGER__:{cases:()=>structuredClone(inventoryCases)},
    __SANA_HARVEST_LEDGER__:{forLot:()=>[]},
    __SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-CF-04',version:4,lot:'CAF-A1'})}
  },
  storage:{records:[
    {id:'FIN-1',type:'economics-ledger-event',lot:'CAF-A1',createdAt:'2026-08-15',values:{lot:'CAF-A1',kind:'INVOICE_REFERENCE',observedAt:'2026-08-15',invoiceRef:'INV-REF-001',amount:'500000',currency:'COP'}},
    {id:'PAY-1',type:'economics-ledger-event',lot:'CAF-A1',createdAt:'2026-08-15',values:{lot:'CAF-A1',kind:'PAYMENT_STATUS_DECLARED',observedAt:'2026-08-15',paymentState:'DECLARED_PAID',amount:'500000',currency:'COP'}},
    {id:'SALE-1',type:'economics-ledger-event',lot:'CAF-A1',createdAt:'2026-08-16',values:{lot:'CAF-A1',kind:'SALE_DECLARATION',observedAt:'2026-08-16',saleRef:'SALE-DEMO-1',amount:'1000000',currency:'COP'}}
  ]},
  DEMO:{plans:[{id:'PL-CF-04',version:4,lot:'CAF-A1'}]},
  views:{economics:()=>'',passport:()=>'',cycle:()=>''},
  metric:()=>'',esc:v=>String(v),openModal:()=>{},document:{addEventListener:()=>{}},localStorage:{getItem:()=>null},console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(ledgerCode,context,{filename:ledgerPath});
const api=context.window.__SANA_ECONOMIC_RECONCILIATION__;
assert(api,'economic reconciliation API missing');
assert.equal(api.schema,'SANA_ECONOMIC_RECONCILIATION_LEDGER_V1');
const c=api.forLot('CAF-A1')[0];
assert(c,'CAF case missing');
assert.equal(c.budget,18400000);
assert.equal(c.baselineAggregateCost,15950000);
assert.equal(c.declaredLocalCost,500000,'only economics-cost declarations may count as local declared cost');
assert.equal(c.declaredCosts.length,1);
assert.equal(c.semantics.supportedDeclaredCostCount,1);
assert.equal(c.crossDomainRefs.length,2,'labor and inventory refs must be provenance only');
assert.equal(c.invoices.length,1);
assert.equal(c.paymentStates.length,1);
assert.equal(c.sales.length,1);
assert.equal(c.cashReceipts.length,0);
assert.equal(c.accountingEntries,0);
assert.equal(c.verifiedExpenses,0);
assert.equal(c.verifiedInvoices,0);
assert.equal(c.paymentsExecuted,0,'declared payment state must never become execution');
assert.equal(c.realizedRevenue,0,'sale declaration must never become realized revenue');
assert.equal(c.realizedMargin,null);
assert.equal(api.summary().paymentsExecuted,0);
assert.equal(api.summary().realizedRevenue,0);
assert.match(api.integrity,/COST_DECLARED ≠ VERIFIED_EXPENSE/);
assert.match(api.integrity,/PAYMENT_STATUS_DECLARED ≠ PAYMENT_EXECUTED/);
assert.match(api.integrity,/COMMERCIAL_SCENARIO ≠ SALE/);
assert.match(api.integrity,/HARVEST_RESULT ≠ SALE_VOLUME/);
assert.match(api.integrity,/CROSS_DOMAIN_COST_REF ≠ ACCOUNTING_ENTRY/);

vm.runInContext(cycleCode,context,{filename:cyclePath});
const cycle=context.window.__SANA_CYCLE_ECONOMIC_RECONCILIATION__;
assert(cycle,'cycle economic reconciliation API missing');
const selected=cycle.selected();
assert.equal(selected.valid,true);
assert.equal(selected.plan.id,'PL-CF-04');
assert.equal(selected.cases.length,1);
assert.equal(selected.cases[0].declaredLocalCost,500000);
assert.equal(selected.cases[0].crossDomainRefCount,2);
assert.equal(selected.cases[0].paymentsExecuted,0);
assert.equal(selected.cases[0].realizedRevenue,0);
assert.equal(selected.cases[0].realizedMargin,null);
assert(!('completeness' in selected));
assert(!('readyForArchive' in selected));
assert.match(cycle.integrity,/ECONOMIC_PROVENANCE ≠ CYCLE_GATE/);

for(const code of [ledgerCode,cycleCode]){
  assert(!/fetch\s*\(/.test(code));
  assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
  assert(!/canonicalMutated\s*=\s*true/.test(code));
  assert(!/paymentsExecuted\s*:\s*[1-9]/.test(code));
}
console.log('SANA economic reconciliation v57 validation: OK');
