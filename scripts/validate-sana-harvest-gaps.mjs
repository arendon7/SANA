import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-harvest-gaps.js','utf8');
globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>null,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]}),current:()=>({valid:false})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(source,{filename:'sana-v3-due-diligence-harvest-gaps.js'});
const api=window.__SANA_DD_HARVEST_GAPS__;
assert.ok(api);

const clean={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',harvestResults:{cases:[
  {caseId:'A',lot:'L1',unsupportedExecution:[],saleWithoutHandoff:[],soldExceedsHarvest:false,lossExceedsHarvest:false,events:[{id:'H',kind:'HARVEST',quantity:10,unit:'t',observedAt:'2026-08-17T10:00'},{id:'S',kind:'SALE_DECLARATION',quantity:7,unit:'t',commercialRef:'SALE-A',paymentState:'NOT_CAPTURED'}]},
  {caseId:'B',lot:'L2',unsupportedExecution:[],saleWithoutHandoff:[],soldExceedsHarvest:false,lossExceedsHarvest:false,events:[{id:'H2',kind:'HARVEST',quantity:5,unit:'t',observedAt:'2026-08-17T11:00'},{id:'L',kind:'LOSS',quantity:1,unit:'t'}]}
]}}};
assert.equal(api.derive(clean).length,0,'no sale, payment not captured, declared loss or yield state are not gaps by themselves');

const broken={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',harvestResults:{cases:[{caseId:'C',lot:'L3',unsupportedExecution:['H3','S3'],saleWithoutHandoff:['S3'],soldExceedsHarvest:true,lossExceedsHarvest:true,events:[{id:'H3',kind:'HARVEST',quantity:null,unit:'',observedAt:''},{id:'S3',kind:'SALE_DECLARATION',quantity:null,unit:'',commercialRef:'',paymentState:'NOT_CAPTURED'}]}]}}};
const gaps=api.derive(broken);const ids=new Set(gaps.map(g=>g.id));
for(const expected of ['harvest:C:evidence','harvest:C:handoff','harvest:C:sold-quantity','harvest:C:loss-quantity','harvest:C:H3:quantity','harvest:C:H3:time','harvest:C:S3:commercial-ref','harvest:C:S3:sale-quantity'])assert.ok(ids.has(expected),expected);
assert.ok(gaps.every(g=>g.status==='OPEN_AT_SNAPSHOT'));
assert.match(api.integrity,/HARVEST_OR_NO_SALE ≠ GAP/);
assert.match(api.integrity,/PAYMENT_NOT_CAPTURED ≠ GAP/);
assert.match(api.integrity,/LOSS_DECLARED ≠ GAP/);
assert.equal(source.includes('__SANA_HARVEST_LEDGER__'),false,'DD must be snapshot-only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('creditApproved'),false);
assert.equal(source.includes('investmentApproved'),false);
console.log('harvest DD gap contract OK · only documentary discontinuities become gaps');
