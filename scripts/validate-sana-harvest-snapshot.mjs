import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-harvest.js','utf8');
globalThis.window={__SANA_HARVEST_LEDGER__:{cases:()=>[
  {id:'HR-A',lot:'LOT-1',quantities:{harvestQuantity:10,harvestUnit:'t',lossQuantity:1,lossUnit:'t',handoffQuantity:7,handoffUnit:'t',soldQuantity:7,soldUnit:'t',observedYield:2,yieldUnit:'t/ha'},classifications:[{}],evidence:[{}],sales:[{}],semantics:{paymentCaptured:0,unsupportedExecution:['S1'],saleWithoutHandoff:[],soldExceedsHarvest:false,lossExceedsHarvest:false},events:[{id:'H1',kind:'HARVEST',observedAt:'2026-08-17T10:00',quantity:10,unit:'t',method:'Pesaje',source:'OBSERVED_DEMO',owner:'QA',provenance:'BASELINE_DEMO'},{id:'S1',kind:'SALE_DECLARATION',observedAt:'2026-08-18T10:00',quantity:7,unit:'t',commercialRef:'SALE-1',paymentState:'NOT_CAPTURED',source:'DECLARED_DEMO'}]},
  {id:'HR-B',lot:'LOT-2',quantities:{harvestQuantity:5,harvestUnit:'t',lossQuantity:null,lossUnit:'',handoffQuantity:null,handoffUnit:'',soldQuantity:null,soldUnit:'',observedYield:1,yieldUnit:'t/ha'},classifications:[],evidence:[],sales:[],semantics:{paymentCaptured:0,unsupportedExecution:[],saleWithoutHandoff:[],soldExceedsHarvest:false,lossExceedsHarvest:false},events:[{id:'H2',kind:'HARVEST',observedAt:'2026-08-17T11:00',quantity:5,unit:'t',method:'Pesaje',source:'OBSERVED_DEMO'}]}
]}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction=null;
globalThis.queueMicrotask=fn=>fn();

vm.runInThisContext(source,{filename:'sana-v3-report-snapshot-harvest.js'});
const api=window.__SANA_REPORT_SNAPSHOT_HARVEST__;
assert.ok(api);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F1'}};
api.enrichHarvest(manifest);
assert.ok(manifest.harvestResults);
assert.equal(manifest.harvestResults.caseCount,2);
assert.equal(manifest.harvestResults.harvestCaseCount,2);
assert.equal(manifest.harvestResults.saleDeclarationCount,1);
assert.equal(manifest.harvestResults.paymentCapturedCount,0,'sale declaration must not infer payment');
assert.equal(manifest.harvestResults.unsupportedExecutionCount,1);
const a=manifest.harvestResults.cases.find(c=>c.caseId==='HR-A');
assert.equal(a.soldQuantity,7);
assert.equal(a.events.find(e=>e.kind==='SALE_DECLARATION').paymentState,'NOT_CAPTURED');
assert.match(manifest.harvestResults.integrity,/NO_HARVEST_TO_SALE_INFERENCE/);
assert.match(manifest.harvestResults.integrity,/NO_SALE_TO_PAYMENT_INFERENCE/);
assert.match(manifest.harvestResults.integrity,/NO_YIELD_TO_PROFITABILITY_INFERENCE/);
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('canonicalMutated=true'),false);
console.log('harvest snapshot contract OK · harvest, sale, payment and yield remain semantically separate');
