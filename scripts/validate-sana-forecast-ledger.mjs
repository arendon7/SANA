import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ledgerPath='apps/control-web/public/sana-v3-forecast-ledger.js';
const cyclePath='apps/control-web/public/sana-v3-cycle-forecast-provenance.js';
const ledgerCode=fs.readFileSync(ledgerPath,'utf8');
const cycleCode=fs.readFileSync(cyclePath,'utf8');

const legacyRows=[
  {id:'PRY-CF-01',lot:'CAF-A1',plan:'PL-CF-04',phase:'Llenado de fruto',item:'2Feed Triple 7',unit:'kg',planned:310,stock:480,horizon:'30 días',basis:'plan',adjusted:false},
  {id:'PRY-CF-02',lot:'CAF-A1',plan:'PL-CF-04',phase:'Llenado de fruto',item:'2Grow líquido',unit:'L',planned:190,stock:340,horizon:'30 días',basis:'plan',adjusted:false},
  {id:'PRY-AG-01',lot:'AGU-A2',plan:'PL-AG-03',phase:'Cuajado',item:'Bioinsumo K',unit:'L',planned:118,stock:9999,horizon:'21 días',basis:'plan',adjusted:false},
  {id:'PRY-CA-01',lot:'CAC-B1',plan:'PL-CA-02',phase:'Floración',item:'Cal agrícola',unit:'kg',planned:140,stock:260,horizon:'45 días',basis:'plan',adjusted:false}
];
const inventoryCases=[
  {id:'INVCASE-001',itemId:'INV-001',latestCount:{quantity:340,unit:'L',observedAt:'2026-08-13'},rollForward:340,rollForwardUnit:'L',reservedComparable:60,events:[{id:'R1',kind:'RESERVATION',quantity:60,unit:'L',lot:'CAF-A1',activityId:'T-105'}]},
  {id:'INVCASE-002',itemId:'INV-002',latestCount:{quantity:480,unit:'kg',observedAt:'2026-08-13'},rollForward:480,rollForwardUnit:'kg',reservedComparable:0,events:[{id:'C1',kind:'CONSUMPTION',quantity:576,unit:'kg',nutritionEventRef:'NUT-EV-005'}]},
  {id:'INVCASE-003',itemId:'INV-003',latestCount:{quantity:82,unit:'L',observedAt:'2026-08-13'},rollForward:82,rollForwardUnit:'L',reservedComparable:0,events:[{id:'Q1',kind:'PURCHASE_REQUEST',quantity:50,unit:'L',lot:'AGU-A2',forecastRef:'PRY-AG-01',requestState:'REQUESTED_HUMAN_REVIEW'}]},
  {id:'INVCASE-004',itemId:'INV-004',latestCount:{quantity:260,unit:'kg',observedAt:'2026-08-13'},rollForward:260,rollForwardUnit:'kg',reservedComparable:0,events:[]}
];

const context={
  window:{
    __SANA_INPUT_FORECAST__:{rows:()=>legacyRows.map(x=>({...x}))},
    __SANA_INVENTORY_LEDGER__:{cases:()=>inventoryCases.map(c=>({...c,events:c.events.map(e=>({...e}))}))},
    __SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-AG-03',version:3,lot:'AGU-A2'})}
  },
  storage:{records:[]},identity:{displayName:'Tester'},
  DEMO:{plans:[{id:'PL-CF-04',version:4,lot:'CAF-A1'},{id:'PL-AG-03',version:3,lot:'AGU-A2'},{id:'PL-CA-02',version:2,lot:'CAC-B1'}]},
  views:{forecast:()=>'',inventory:()=>'',field:()=>'',nutrition:()=>'',passport:()=>'',cycle:()=>''},
  head:()=>'',metric:()=>'',footer:()=>'',esc:v=>String(v),openModal:()=>{},
  document:{addEventListener:()=>{}},localStorage:{getItem:()=>null},console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(ledgerCode,context,{filename:ledgerPath});

const api=context.window.__SANA_FORECAST_LEDGER__;
assert(api,'forecast ledger API missing');
assert.equal(api.schema,'SANA_INPUT_FORECAST_LEDGER_V1');
const rows=api.cases();
assert.equal(rows.length,4);

const agu=rows.find(x=>x.id==='PRY-AG-01');
assert.equal(agu.legacyStockAssumption,9999,'legacy stock assumption must be preserved only as legacy provenance');
assert.equal(agu.inventory.physicalCount,82);
assert.equal(agu.inventory.rollForward,82);
assert.equal(agu.inventory.planningAvailable,82,'v51 planning reference must come from inventory ledger, not legacy forecast stock');
assert.equal(agu.forecastGap,36);
assert.equal(agu.decisionState,'NEED_CONFIRMED');
assert.equal(agu.confirmedNeed,50,'human confirmed need may differ from model gap');
assert.equal(agu.linkedRequestQuantity,50);
assert.equal(agu.requests.length,1);
assert.equal(agu.receipts.length,0);
assert.equal(agu.consumptions.length,0);
assert.equal(agu.automaticPurchaseOrders,0);
assert.equal(agu.automaticPayments,0);

const grow=rows.find(x=>x.id==='PRY-CF-02');
assert.equal(grow.inventory.physicalCount,340);
assert.equal(grow.inventory.reserved,60);
assert.equal(grow.inventory.planningAvailable,280,'reservation may reduce planning availability but must not mutate physical count');
assert.equal(grow.forecastGap,0);
assert.equal(grow.activityRefs[0],'T-105');
assert.equal(grow.linkedReservationQuantity,0,'item/lot similarity must not create a forecast relation without forecastRef');

const feed=rows.find(x=>x.id==='PRY-CF-01');
assert(feed.basisRefs.includes('NUT-EV-005'));
assert.equal(feed.linkedConsumptionQuantity,0,'historical nutrition reference must not be reinterpreted as forecast-linked actual consumption');

assert.equal(api.summary().automaticPurchaseOrders,0);
assert.match(api.integrity,/FORECAST_GAP ≠ PURCHASE_AUTHORIZATION/);
assert.match(api.integrity,/MODEL_ESTIMATE ≠ HUMAN_DECISION/);
assert.match(api.integrity,/NO_AUTOMATIC_PROCUREMENT/);

vm.runInContext(cycleCode,context,{filename:cyclePath});
const cycle=context.window.__SANA_CYCLE_FORECAST__;
assert(cycle,'cycle forecast API missing');
const selected=cycle.selected();
assert.equal(selected.valid,true);
assert.equal(selected.plan.id,'PL-AG-03');
assert.equal(selected.cases.length,1);
assert.equal(selected.cases[0].forecastGap,36);
assert.equal(selected.cases[0].confirmedNeed,50);
assert.equal(selected.cases[0].purchaseRequestCount,1);
assert.equal(selected.cases[0].automaticPurchaseOrders,0);
assert(!('completeness' in selected));
assert(!('readyForArchive' in selected));
assert.match(cycle.integrity,/FORECAST_PROVENANCE ≠ CYCLE_GATE/);

for(const code of [ledgerCode,cycleCode]){
  assert(!/fetch\s*\(/.test(code),'forecast modules must not perform network writes');
  assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
  assert(!/canonicalMutated\s*=\s*true/.test(code));
}

console.log('SANA forecast ledger v51 semantic validation: OK');
