import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-inventory-gaps.js','utf8');
globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>null,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]}),current:()=>({valid:false})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(source,{filename:'sana-v3-due-diligence-inventory-gaps.js'});
const api=window.__SANA_DD_INVENTORY_GAPS__;
assert.ok(api);

const clean={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',inventory:{itemCount:2,legacyCount:0,items:[
  {itemId:'I1',itemName:'A',latestPhysicalCount:{quantity:100,unit:'L'},rollForward:100,reservedComparable:90,reservationCount:1,consumptionCount:0,purchaseRequestCount:1,receiptCount:0,adjustmentCount:0,unsupported:[],unitConflicts:[],negativeRollForward:false,overReserved:false,events:[{id:'R1',kind:'RESERVATION',quantity:90,unit:'L'},{id:'Q1',kind:'PURCHASE_REQUEST',quantity:50,unit:'L',requestState:'REQUESTED_HUMAN_REVIEW'}]},
  {itemId:'I2',itemName:'B',latestPhysicalCount:{quantity:20,unit:'kg'},rollForward:20,reservedComparable:0,reservationCount:0,consumptionCount:0,purchaseRequestCount:0,receiptCount:0,adjustmentCount:0,unsupported:[],unitConflicts:[],negativeRollForward:false,overReserved:false,events:[]}
]}}};
assert.equal(api.derive(clean).length,0,'pending request/reservation and low quantity are not documentary gaps by themselves');

const broken={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',inventory:{itemCount:2,legacyCount:0,items:[
  {itemId:'I3',itemName:'C',latestPhysicalCount:null,rollForward:null,reservedComparable:0,reservationCount:0,consumptionCount:1,purchaseRequestCount:0,receiptCount:1,adjustmentCount:0,unsupported:['C1','RC1'],unitConflicts:['RC1'],negativeRollForward:false,overReserved:false,events:[{id:'C1',kind:'CONSUMPTION',quantity:0,unit:''},{id:'RC1',kind:'RECEIPT',quantity:10,unit:'kg',supplierRef:''}]},
  {itemId:'I4',itemName:'D',latestPhysicalCount:{quantity:5,unit:'L'},rollForward:-2,reservedComparable:10,reservationCount:1,consumptionCount:1,purchaseRequestCount:0,receiptCount:0,adjustmentCount:0,unsupported:[],unitConflicts:[],negativeRollForward:true,overReserved:true,events:[{id:'C2',kind:'CONSUMPTION',quantity:7,unit:'L'}]}
]}}};
const gaps=api.derive(broken);const ids=new Set(gaps.map(g=>g.id));
for(const id of ['inventory:I3:count','inventory:I3:C1:quantity','inventory:I3:C1:unit','inventory:I3:RC1:supplier','inventory:I3:C1:evidence','inventory:I3:RC1:evidence','inventory:I3:units','inventory:I4:negative-roll-forward','inventory:I4:over-reserved'])assert.ok(ids.has(id),id);
assert.ok(gaps.every(g=>g.status==='OPEN_AT_SNAPSHOT'));
assert.match(api.integrity,/LOW_STOCK_OR_PENDING_REQUEST ≠ GAP/);
assert.equal(source.includes('__SANA_INVENTORY_LEDGER__'),false,'DD inventory must be snapshot-only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('creditApproved'),false);
assert.equal(source.includes('investmentApproved'),false);
console.log('inventory DD gap contract OK · only documentary inconsistencies become gaps');
