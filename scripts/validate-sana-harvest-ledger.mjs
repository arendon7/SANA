import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-harvest-ledger.js','utf8');
globalThis.window={};
globalThis.storage={records:[]};
globalThis.identity={displayName:'Tester'};
globalThis.DEMO={lots:[{id:'CAF-A1',area:3.2},{id:'AGU-A2',area:2.8},{id:'CAC-B1',area:2.1}]};
globalThis.views={results:()=>'<footer class="footer-note"></footer>',passport:()=>'<footer class="footer-note"></footer>'};
globalThis.localStorage={getItem:()=> 'CAF-A1'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';

vm.runInThisContext(source,{filename:'sana-v3-harvest-ledger.js'});
const api=window.__SANA_HARVEST_LEDGER__;
assert.ok(api);
assert.equal(api.schema,'SANA_HARVEST_RESULTS_LEDGER_V1');
const cases=api.cases();
assert.equal(cases.length,3);

const caf=cases.find(c=>c.lot==='CAF-A1');
assert.equal(caf.quantities.harvestQuantity,5.82);
assert.equal(caf.quantities.handoffQuantity,4.5);
assert.equal(caf.quantities.soldQuantity,4.5);
assert.equal(caf.quantities.observedYield,1.82);
assert.equal(caf.sales.length,1);
assert.equal(caf.semantics.paymentCaptured,0,'sale declaration must not become payment');
assert.equal(caf.semantics.saleWithoutHandoff.length,0);
assert.equal(caf.semantics.soldExceedsHarvest,false);

const agu=cases.find(c=>c.lot==='AGU-A2');
assert.equal(agu.quantities.harvestQuantity,26.32);
assert.equal(agu.sales.length,0,'harvest must not imply sale');
assert.equal(agu.handoffs.length,0,'harvest must not imply handoff');

const cac=cases.find(c=>c.lot==='CAC-B1');
assert.equal(cac.quantities.lossQuantity,0.08);
assert.equal(cac.semantics.lossExceedsHarvest,false);

const summary=api.summary();
assert.equal(summary.saleDeclarations,1);
assert.equal(summary.paymentRecords,0);
assert.equal(summary.automaticFinancialActions,0);
for(const marker of ['HARVEST ≠ SALE','HANDOFF ≠ SALE','SALE_DECLARATION ≠ PAYMENT','PRICE_REFERENCE ≠ REALIZED_PRICE','EXPECTED_REVENUE ≠ REALIZED_REVENUE','QUALITY_CLASSIFICATION ≠ CERTIFICATION','LOSS_DECLARED ≠ PROCESS_FAILURE','YIELD ≠ PROFITABILITY','RESULT ≠ CAUSALITY'])assert.match(api.integrity,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
for(const forbidden of ['executePayment','authorizePayment','capturePayment','paymentApproved=true','productionExecutionAvailable=true','canonicalMutated=true','fetch(','XMLHttpRequest','WebSocket'])assert.equal(source.includes(forbidden),false,forbidden);
console.log('harvest ledger contract OK · harvest != sale · sale declaration != payment · yield descriptive only');
