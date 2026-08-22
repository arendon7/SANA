import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-cycle-harvest-provenance.js','utf8');
globalThis.window={
  __SANA_HARVEST_LEDGER__:{forLot:lot=>lot==='CAF-A1'?[{id:'HR-1',lot:'CAF-A1',quantities:{harvestQuantity:5.82,harvestUnit:'t',lossQuantity:null,lossUnit:'',handoffQuantity:4.5,handoffUnit:'t',soldQuantity:4.5,soldUnit:'t',observedYield:1.82,yieldUnit:'t/ha'},classifications:[{}],evidence:[{}],sales:[{paymentState:'NOT_CAPTURED'}],semantics:{paymentCaptured:0,unsupportedExecution:['S1'],saleWithoutHandoff:[],soldExceedsHarvest:false,lossExceedsHarvest:false}}]:[]},
  __SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-CF-04'})}
};
globalThis.DEMO={plans:[{id:'PL-CF-04',lot:'CAF-A1',version:4}]};
globalThis.views={cycle:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';

vm.runInThisContext(source,{filename:'sana-v3-cycle-harvest-provenance.js'});
const api=window.__SANA_CYCLE_HARVEST__;
assert.ok(api);
const state=api.forPlan('PL-CF-04');
assert.equal(state.valid,true);
assert.equal(state.cases.length,1);
assert.equal(state.cases[0].harvestQuantity,5.82);
assert.equal(state.cases[0].soldQuantity,4.5);
assert.equal(state.cases[0].paymentCaptured,0);
assert.equal(state.cases[0].observedYield,1.82);
for(const marker of ['HARVEST_PROVENANCE ≠ CYCLE_GATE','HARVEST ≠ SALE','HANDOFF ≠ SALE','SALE_DECLARATION ≠ PAYMENT','QUALITY_CLASSIFICATION ≠ CERTIFICATION','YIELD ≠ PROFITABILITY','RESULT ≠ CAUSALITY'])assert.ok(api.integrity.includes(marker),marker);
assert.equal(source.includes('completeness='),false);
assert.equal(source.includes('readyForArchive='),false);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('executePayment'),false);
assert.equal(source.includes('openModal('),false);
console.log('cycle harvest provenance OK · read-only/non-weighted · no financial execution');
