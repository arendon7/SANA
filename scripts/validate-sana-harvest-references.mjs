import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=fs.readFileSync('apps/control-web/public/sana-v3-harvest-references.js','utf8');
for(const t of ['V135','MISSING_REFERENCE','MISSING_TARGET','KIND_MISMATCH','CROSS_CASE_REFERENCE','CROSS_LOT_REFERENCE','FORWARD_REFERENCE','LINKED','LEGACY_REFERENCE_NOT_CAPTURED','QUANTITY_MATCH ≠ EVENT_REFERENCE','REFERENCE ≠ SALE_VALIDITY','REFERENCE ≠ PAYMENT','REFERENCE ≠ PROFITABILITY','REFERENCE ≠ CAUSALITY'])assert.ok(src.includes(t),t);
const E=[
{id:'H1',caseId:'C1',lot:'L1',kind:'HARVEST',observedAt:'2026-08-01T08:00:00-05:00'},
{id:'Q1',caseId:'C1',lot:'L1',kind:'CLASSIFICATION',observedAt:'2026-08-01T09:00:00-05:00'},
{id:'L1',caseId:'C1',lot:'L1',kind:'LOSS',observedAt:'2026-08-01T10:00:00-05:00'},
{id:'D1',caseId:'C1',lot:'L1',kind:'HANDOFF',observedAt:'2026-08-01T11:00:00-05:00'},
{id:'S1',caseId:'C1',lot:'L1',kind:'SALE_DECLARATION',observedAt:'2026-08-01T12:00:00-05:00'},
{id:'E1',caseId:'C1',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-01T13:00:00-05:00',supports:['H1','Q1']},
{id:'QMISS',caseId:'C1',lot:'L1',kind:'CLASSIFICATION',observedAt:'2026-08-02T09:00:00-05:00'},
{id:'QKIND',caseId:'C1',lot:'L1',kind:'CLASSIFICATION',observedAt:'2026-08-02T10:00:00-05:00'},
{id:'QCROSS',caseId:'C1',lot:'L1',kind:'CLASSIFICATION',observedAt:'2026-08-02T11:00:00-05:00'},
{id:'H3',caseId:'C1',lot:'L2',kind:'HARVEST',observedAt:'2026-08-02T08:00:00-05:00'},
{id:'QLOT',caseId:'C1',lot:'L1',kind:'CLASSIFICATION',observedAt:'2026-08-02T12:00:00-05:00'},
{id:'HF',caseId:'C1',lot:'L1',kind:'HARVEST',observedAt:'2026-08-05T08:00:00-05:00'},
{id:'QFWD',caseId:'C1',lot:'L1',kind:'CLASSIFICATION',observedAt:'2026-08-03T09:00:00-05:00'},
{id:'SEMPTY',caseId:'C1',lot:'L1',kind:'SALE_DECLARATION',observedAt:'2026-08-03T10:00:00-05:00'},
{id:'QLEG',caseId:'C1',lot:'L1',kind:'CLASSIFICATION',observedAt:'2026-08-03T11:00:00-05:00'},
{id:'H2',caseId:'C2',lot:'L2',kind:'HARVEST',observedAt:'2026-08-01T08:00:00-05:00'}];
const meta={Q1:'H1',L1:'Q1',D1:'H1',S1:'D1',E1:'',QMISS:'NOPE',QKIND:'D1',QCROSS:'H2',QLOT:'H3',QFWD:'HF',SEMPTY:''};
globalThis.storage={records:Object.entries(meta).map(([sourceEventId,basisEventId])=>({id:`M-${sourceEventId}`,type:'harvest-reference-meta',values:{harvestSchema:'SANA_HARVEST_RESULTS_LEDGER_V1',referenceVersion:'V135',sourceEventId,basisEventId}}))};
globalThis.identity={displayName:'QA'};globalThis.views={results:()=>'<footer class="footer"></footer>'};globalThis.document={addEventListener:()=>{}};globalThis.esc=v=>String(v??'');globalThis.metric=()=>'';globalThis.openModal=()=>{};
const baseCase=id=>({id,lot:id==='C1'?'L1':'L2',events:E.filter(e=>e.caseId===id),classifications:[],losses:[],handoffs:[],sales:[],evidence:[],quantities:{},semantics:{unsupportedExecution:[],saleWithoutHandoff:[],soldExceedsHarvest:false,lossExceedsHarvest:false,paymentCaptured:0},stageCoverage:{covered:[],total:6},integrity:'BASE'});
globalThis.window={__SANA_HARVEST_LEDGER__:Object.freeze({schema:'SANA_HARVEST_RESULTS_LEDGER_V1',events:()=>E,cases:()=>[baseCase('C1'),baseCase('C2')],forLot:lot=>[baseCase('C1'),baseCase('C2')].filter(c=>c.lot===lot),summary:()=>({schema:'SANA_HARVEST_RESULTS_LEDGER_V1',integrity:'BASE'}),integrity:'BASE'})};
vm.runInThisContext(src);
const api=window.__SANA_HARVEST_LEDGER__,by=id=>api.events().find(e=>e.id===id);
assert.equal(api.reference(by('Q1'),'H1').status,'LINKED');
assert.equal(api.reference(by('QMISS'),'NOPE').status,'MISSING_TARGET');
assert.equal(api.reference(by('QKIND'),'D1').status,'KIND_MISMATCH');
assert.equal(api.reference(by('QCROSS'),'H2').status,'CROSS_CASE_REFERENCE');
assert.equal(api.reference(by('QLOT'),'H3').status,'CROSS_LOT_REFERENCE');
assert.equal(api.reference(by('QFWD'),'HF').status,'FORWARD_REFERENCE');
assert.equal(api.reference(by('QLEG'),'H1').status,'LEGACY_REFERENCE_NOT_CAPTURED');
const c=api.referenceCoverage('C1');
assert.equal(c.total,12);assert.equal(c.linked,6);assert.equal(c.issues,6);
assert.equal(c.rows.find(r=>r.event.id==='SEMPTY').reference.status,'MISSING_REFERENCE');
console.log('SANA harvest semantic references V135: OK');
