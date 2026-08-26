import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=fs.readFileSync('apps/control-web/public/sana-v3-inventory-references.js','utf8');
for(const t of ['V137','LEGACY_REFERENCE_NOT_CAPTURED','MISSING_REFERENCE','MISSING_TARGET','KIND_MISMATCH','CROSS_CASE_REFERENCE','CROSS_LOT_REFERENCE','ITEM_MISMATCH','FORWARD_REFERENCE','LINKED','STRING_REFERENCE ≠ VALIDATED_REFERENCE','SUPPLIER_REF/COST_REF ≠ CANONICALLY_VERIFIED'])assert.ok(src.includes(t),t);
const events=[
{id:'R1',caseId:'C1',itemId:'I1',kind:'RESERVATION',lot:'L1',activityId:'A1',observedAt:'2026-08-10T08:00:00-05:00'},
{id:'RBAD',caseId:'C1',itemId:'I1',kind:'RESERVATION',lot:'L1',activityId:'A2',observedAt:'2026-08-10T08:10:00-05:00'},
{id:'RMISS',caseId:'C1',itemId:'I1',kind:'RESERVATION',lot:'L1',activityId:'NOPE',observedAt:'2026-08-10T08:20:00-05:00'},
{id:'RLEG',caseId:'C1',itemId:'I1',kind:'RESERVATION',lot:'L1',activityId:'A1',observedAt:'2026-08-10T08:30:00-05:00'},
{id:'C1E',caseId:'C2',itemId:'I2',kind:'CONSUMPTION',lot:'L1',nutritionEventRef:'NAPP',observedAt:'2026-08-11T10:00:00-05:00'},
{id:'CKIND',caseId:'C2',itemId:'I2',kind:'CONSUMPTION',lot:'L1',nutritionEventRef:'NREC',observedAt:'2026-08-11T10:10:00-05:00'},
{id:'CFWD',caseId:'C2',itemId:'I2',kind:'CONSUMPTION',lot:'L1',nutritionEventRef:'NFUT',observedAt:'2026-08-11T10:20:00-05:00'},
{id:'CMISSING',caseId:'C2',itemId:'I2',kind:'CONSUMPTION',lot:'L1',nutritionEventRef:'',observedAt:'2026-08-11T10:30:00-05:00'},
{id:'P1',caseId:'C3',itemId:'I3',kind:'PURCHASE_REQUEST',lot:'L2',forecastRef:'F1',observedAt:'2026-08-12T09:00:00-05:00'},
{id:'PITEM',caseId:'C3',itemId:'I3',kind:'PURCHASE_REQUEST',lot:'L2',forecastRef:'F2',observedAt:'2026-08-12T09:10:00-05:00'},
{id:'PLOT',caseId:'C3',itemId:'I3',kind:'PURCHASE_REQUEST',lot:'L2',forecastRef:'F3',observedAt:'2026-08-12T09:20:00-05:00'},
{id:'CNT4',caseId:'C4',itemId:'I4',kind:'COUNT',lot:'L4',observedAt:'2026-08-09T07:00:00-05:00'},
{id:'EFUTT',caseId:'C4',itemId:'I4',kind:'COUNT',lot:'L4',observedAt:'2026-08-15T07:00:00-05:00'},
{id:'E1',caseId:'C4',itemId:'I4',kind:'EVIDENCE',lot:'L4',supports:['CNT4'],observedAt:'2026-08-13T07:00:00-05:00'},
{id:'EFWD',caseId:'C4',itemId:'I4',kind:'EVIDENCE',lot:'L4',supports:['EFUTT'],observedAt:'2026-08-13T07:10:00-05:00'},
{id:'EMISS',caseId:'C4',itemId:'I4',kind:'EVIDENCE',lot:'L4',supports:[],observedAt:'2026-08-13T07:20:00-05:00'},
{id:'CNT5',caseId:'C5',itemId:'I5',kind:'COUNT',lot:'L5',observedAt:'2026-08-09T07:00:00-05:00'},
{id:'ECROSS',caseId:'C4',itemId:'I4',kind:'EVIDENCE',lot:'L4',supports:['CNT5'],observedAt:'2026-08-13T07:30:00-05:00'}
];
const marked=['R1','RBAD','RMISS','C1E','CKIND','CFWD','CMISSING','P1','PITEM','PLOT','E1','EFWD','EMISS','ECROSS'];
globalThis.storage={records:marked.map(sourceEventId=>({id:`M-${sourceEventId}`,type:'inventory-reference-meta',values:{inventorySchema:'SANA_INVENTORY_LEDGER_V1',referenceVersion:'V137',sourceEventId}}))};
globalThis.identity={displayName:'QA'};globalThis.views={inventory:()=>'<footer class="footer"></footer>'};globalThis.document={addEventListener:()=>{}};globalThis.esc=v=>String(v??'');globalThis.metric=()=>'';globalThis.openModal=()=>{};
const caseIds=['C1','C2','C3','C4','C5'];
const baseCase=id=>({id,itemId:events.find(e=>e.caseId===id)?.itemId||'',item:{name:id},events:events.filter(e=>e.caseId===id),counts:[],reservations:[],consumptions:[],requests:[],receipts:[],adjustments:[],evidence:[],semantics:{},integrity:'BASE'});
globalThis.window={
__SANA_PLAN_FIELD_WORKFLOW__:{findActivity:id=>({A1:{id:'A1',lot:'L1'},A2:{id:'A2',lot:'L2'}}[id]||null)},
__SANA_NUTRITION_LEDGER__:{events:()=>[{id:'NAPP',eventKind:'APPLICATION',lot:'L1',observedAt:'2026-08-10T10:00:00-05:00'},{id:'NREC',eventKind:'RECOMMENDATION',lot:'L1',observedAt:'2026-08-10T10:00:00-05:00'},{id:'NFUT',eventKind:'APPLICATION',lot:'L1',observedAt:'2026-08-20T10:00:00-05:00'}]},
__SANA_FORECAST_LEDGER__:{cases:()=>[{id:'F1',itemId:'I3',lot:'L2'},{id:'F2',itemId:'OTHER',lot:'L2'},{id:'F3',itemId:'I3',lot:'OTHER'}]},
__SANA_INVENTORY_LEDGER__:Object.freeze({schema:'SANA_INVENTORY_LEDGER_V1',cases:()=>caseIds.map(baseCase),summary:()=>({schema:'SANA_INVENTORY_LEDGER_V1',integrity:'BASE'}),integrity:'BASE'})};
vm.runInThisContext(src);
const api=window.__SANA_INVENTORY_LEDGER__,by=id=>api.cases().flatMap(c=>c.events).find(e=>e.id===id);
assert.equal(api.reference(by('R1'),'A1').status,'LINKED');
assert.equal(api.reference(by('RBAD'),'A2').status,'CROSS_LOT_REFERENCE');
assert.equal(api.reference(by('RMISS'),'NOPE').status,'MISSING_TARGET');
assert.equal(api.reference(by('RLEG'),'A1').status,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(api.reference(by('C1E'),'NAPP').status,'LINKED');
assert.equal(api.reference(by('CKIND'),'NREC').status,'KIND_MISMATCH');
assert.equal(api.reference(by('CFWD'),'NFUT').status,'FORWARD_REFERENCE');
assert.equal(api.reference(by('CMISSING'),'').status,'MISSING_REFERENCE');
assert.equal(api.reference(by('P1'),'F1').status,'LINKED');
assert.equal(api.reference(by('PITEM'),'F2').status,'ITEM_MISMATCH');
assert.equal(api.reference(by('PLOT'),'F3').status,'CROSS_LOT_REFERENCE');
assert.equal(api.reference(by('E1'),'CNT4').status,'LINKED');
assert.equal(api.reference(by('EFWD'),'EFUTT').status,'FORWARD_REFERENCE');
assert.equal(api.reference(by('ECROSS'),'CNT5').status,'CROSS_CASE_REFERENCE');
assert.equal(api.referenceCoverage('C4').rows.find(r=>r.event.id==='EMISS').reference.status,'MISSING_REFERENCE');
console.log('SANA inventory cross-domain references V137: OK');
