import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-inventory-ledger.js','utf8');
const bridge=fs.readFileSync('apps/control-web/public/sana-v3-inventory-activity-bridge.js','utf8');
const cycle=fs.readFileSync('apps/control-web/public/sana-v3-cycle-inventory-provenance.js','utf8');

globalThis.window={};
globalThis.storage={records:[{id:'M1',type:'inventory-movement',createdAt:'2026-08-15',values:{itemId:'INV-001',movement:'SALIDA',qty:'5',lot:'CAF-A1',activityId:'T-105',evidence:'Registro de actividad',owner:'Operario'}}]};
globalThis.identity={displayName:'Tester'};
globalThis.DEMO={
  inventory:[
    {id:'INV-001',name:'2Grow líquido',group:'Agroinsumo',linked:'CAF-A1 / AGU-A2'},
    {id:'INV-002',name:'2Feed Triple 7',group:'Agroinsumo',linked:'CAF-A1'},
    {id:'INV-003',name:'Bioinsumo K',group:'Agroinsumo',linked:'AGU-A2'},
    {id:'INV-004',name:'Cal agrícola',group:'Enmienda',linked:'CAC-B1'}
  ],
  plans:[{id:'PL-CF-04',lot:'CAF-A1',version:4},{id:'PL-AG-03',lot:'AGU-A2',version:3}],
  lots:[{id:'CAF-A1'},{id:'AGU-A2'},{id:'CAC-B1'}]
};
globalThis.views={inventory:()=>'<footer class="footer"></footer>',nutrition:()=>'<footer class="footer"></footer>',economics:()=>'<footer class="footer"></footer>',passport:()=>'<footer class="footer"></footer>',field:()=>'<footer class="footer"></footer>',cycle:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=(a,b,c)=>`${a}:${b}:${c}`;
globalThis.localStorage={getItem:()=>null};

vm.runInThisContext(source,{filename:'sana-v3-inventory-ledger.js'});
const api=window.__SANA_INVENTORY_LEDGER__;
assert.ok(api);
assert.equal(api.schema,'SANA_INVENTORY_LEDGER_V1');

const inv1=api.forItem('INV-001')[0];
assert.equal(inv1.latestCount.quantity,340);
assert.equal(inv1.reservations.length,1);
assert.equal(inv1.reservedComparable,60);
assert.equal(inv1.rollForward,340,'reservation must not change roll-forward balance');
assert.equal(inv1.consumptions.length,0);

const inv2=api.forItem('INV-002')[0];
assert.equal(inv2.latestCount.quantity,480);
assert.equal(inv2.consumptions.length,1);
assert.equal(inv2.consumptions[0].nutritionEventRef,'NUT-EV-005');
assert.equal(api.forNutritionEvent('NUT-EV-005').length,1);
assert.equal(inv2.rollForward,480,'consumption before latest count must not be subtracted again');

const inv3=api.forItem('INV-003')[0];
assert.equal(inv3.latestCount.quantity,82);
assert.equal(inv3.requests.length,1);
assert.equal(inv3.requests[0].quantity,50);
assert.equal(inv3.receipts.length,0);
assert.equal(inv3.rollForward,82,'purchase request must not change balance');

const summary=api.summary();
assert.equal(summary.purchaseRequests,1);
assert.equal(summary.receipts,0);
assert.equal(summary.automaticPurchaseOrders,0);
assert.equal(summary.automaticPayments,0);
assert.equal(api.explicitCostLinks().length,0,'inventory must not infer costs from receipt/request/consumption');
assert.equal(api.legacy().length,1,'legacy movement must stay separate from V1 semantic cases');
assert.match(api.integrity,/PHYSICAL_COUNT ≠ THEORETICAL_STOCK/);
assert.match(api.integrity,/RESERVATION ≠ CONSUMPTION/);
assert.match(api.integrity,/PURCHASE_REQUEST ≠ PURCHASE_ORDER/);
assert.match(api.integrity,/RECEIPT ≠ INVOICE ≠ PAYMENT/);
assert.match(api.integrity,/CONSUMPTION ≠ AGRONOMIC_APPLICATION/);

vm.runInThisContext(bridge,{filename:'sana-v3-inventory-activity-bridge.js'});
assert.equal(window.__SANA_INVENTORY_ACTIVITY_BRIDGE__.linked().length,1,'only V1 explicit activity link should be projected');
assert.match(window.__SANA_INVENTORY_ACTIVITY_BRIDGE__.integrity,/ACTIVITY_COMPLETION ≠ INVENTORY_MOVEMENT/);

window.__SANA_CYCLE_CLOSURE__={selectedPlan:()=>DEMO.plans[0]};
vm.runInThisContext(cycle,{filename:'sana-v3-cycle-inventory-provenance.js'});
const projected=window.__SANA_CYCLE_INVENTORY__.forPlan('PL-CF-04');
assert.equal(projected.valid,true);
assert.ok(projected.cases.length>=2);
assert.match(projected.integrity,/INVENTORY_PROVENANCE ≠ CYCLE_GATE/);
assert.match(projected.integrity,/PURCHASE_REQUEST ≠ RECEIPT/);

for(const text of [source,bridge,cycle]){
  assert.equal(text.includes('fetch('),false);
  assert.equal(text.includes('productionExecutionAvailable=true'),false);
  assert.equal(text.includes('canonicalMutated=true'),false);
  assert.equal(text.includes('purchaseOrderCreated=true'),false);
  assert.equal(text.includes('paymentExecuted=true'),false);
}
console.log('inventory ledger contract OK · count/reservation/consumption/request/receipt remain separate and read-only');
