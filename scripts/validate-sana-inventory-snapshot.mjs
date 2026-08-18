import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-inventory.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-inventory-history.js','utf8');

globalThis.window={__SANA_INVENTORY_LEDGER__:{
  cases:()=>[
    {id:'C1',itemId:'INV-1',item:{name:'Insumo A',group:'Agroinsumo'},latestCount:{id:'CNT1',kind:'COUNT',observedAt:'2026-08-13T07:00',quantity:100,unit:'L',method:'Conteo',location:'Bodega'},rollForward:100,rollForwardUnit:'L',reservedComparable:20,reservations:[{id:'R1',kind:'RESERVATION',observedAt:'2026-08-14',quantity:20,unit:'L',lot:'LOT-1'}],consumptions:[],requests:[],receipts:[],adjustments:[],evidence:[],events:[],semantics:{unsupported:[],requestWithoutForecast:[],receiptWithoutSupplier:[],explicitCostLinks:0}},
    {id:'C2',itemId:'INV-2',item:{name:'Insumo B',group:'Agroinsumo'},latestCount:{id:'CNT2',kind:'COUNT',observedAt:'2026-08-13T07:10',quantity:82,unit:'L',method:'Conteo',location:'Bodega'},rollForward:82,rollForwardUnit:'L',reservedComparable:0,reservations:[],consumptions:[],requests:[{id:'Q1',kind:'PURCHASE_REQUEST',observedAt:'2026-08-14',quantity:50,unit:'L',lot:'LOT-2',forecastRef:'F1',requestState:'REQUESTED_HUMAN_REVIEW'}],receipts:[],adjustments:[],evidence:[],events:[],semantics:{unsupported:[],requestWithoutForecast:[],receiptWithoutSupplier:[],explicitCostLinks:0}}
  ],
  legacy:()=>[]
}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction=null;
globalThis.queueMicrotask=fn=>fn();
vm.runInThisContext(snapshotSource,{filename:'sana-v3-report-snapshot-inventory.js'});
const api=window.__SANA_REPORT_SNAPSHOT_INVENTORY__;
assert.ok(api);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F1'}};
api.enrichInventory(manifest);
assert.ok(manifest.inventory);
assert.equal(manifest.inventory.itemCount,2);
assert.equal(manifest.inventory.physicalCountItems,2);
assert.equal(manifest.inventory.reservationCount,1);
assert.equal(manifest.inventory.purchaseRequestCount,1);
assert.equal(manifest.inventory.receiptCount,0);
assert.equal(manifest.inventory.negativeRollForwardCount,0);
assert.match(manifest.inventory.integrity,/NO_REQUEST_TO_ORDER_OR_RECEIPT_INFERENCE/);
assert.match(manifest.inventory.integrity,/NO_RECEIPT_TO_INVOICE_OR_PAYMENT_INFERENCE/);
assert.equal(snapshotSource.includes('fetch('),false);
assert.equal(snapshotSource.includes('canonicalMutated=true'),false);

const old={id:'S1',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F1'}}};
const current={id:'S2',reportType:'RPT-DD',cutoff:'2026-08-17',manifest};
window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[old,current]};
window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'S1',target:'S2'})};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=(a,b,c)=>`${a}:${b}:${c}`;
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-inventory-history.js'});
const hist=window.__SANA_DATAROOM_INVENTORY_HISTORY__;
assert.ok(hist);
assert.equal(hist.state().state,'CAPTURED');
const partial=hist.diff(old,current);
assert.equal(partial.valid,true);
assert.equal(partial.state,'PARTIAL_GRANULARITY');
assert.match(partial.integrity,/CHANGE ≠ IMPROVEMENT/);
assert.equal(historySource.includes('__SANA_INVENTORY_LEDGER__'),false,'history must be snapshot-only');
assert.equal(historySource.includes('storage.'),false,'history must not read mutable storage');
assert.equal(historySource.includes('fetch('),false);
console.log('inventory snapshot/history contract OK · additive capture with no live fallback');
