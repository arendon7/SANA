import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-nutrition-references.js','utf8');
assert.match(source,/REFERENCE_VERSION='V129'/);
assert.match(source,/PREFLIGHT:'PROGRAM'/);
assert.match(source,/DECISION:'PREFLIGHT'/);
assert.match(source,/ACTIVITY_LINK:'DECISION'/);
assert.match(source,/APPLICATION:'ACTIVITY_LINK'/);
assert.match(source,/EVIDENCE:'APPLICATION'/);
assert.match(source,/RESPONSE:'EVIDENCE'/);
assert.match(source,/MISSING_REFERENCE/);
assert.match(source,/MISSING_TARGET/);
assert.match(source,/KIND_MISMATCH/);
assert.match(source,/CROSS_CASE_REFERENCE/);
assert.match(source,/FORWARD_REFERENCE/);
assert.match(source,/LEGACY_REFERENCE_NOT_CAPTURED/);
assert.match(source,/CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE/);
assert.match(source,/REFERENCE ≠ APPLICATION_AUTHORITY/);
assert.match(source,/REFERENCE ≠ INVENTORY_MOVEMENT/);
assert.match(source,/REFERENCE ≠ CAUSALITY/);

const events=[
  {id:'P1',caseId:'C1',eventKind:'PROGRAM',lot:'L1',observedAt:'2026-08-01',detail:'Programa'},
  {id:'PF1',caseId:'C1',eventKind:'PREFLIGHT',lot:'L1',observedAt:'2026-08-02',detail:'Preflight'},
  {id:'D1',caseId:'C1',eventKind:'DECISION',lot:'L1',observedAt:'2026-08-03',detail:'Decisión'},
  {id:'A1',caseId:'C1',eventKind:'ACTIVITY_LINK',lot:'L1',observedAt:'2026-08-04',detail:'Link'},
  {id:'APP1',caseId:'C1',eventKind:'APPLICATION',lot:'L1',observedAt:'2026-08-05',detail:'Aplicación'},
  {id:'E1',caseId:'C1',eventKind:'EVIDENCE',lot:'L1',observedAt:'2026-08-06',detail:'Evidencia'},
  {id:'R1',caseId:'C1',eventKind:'RESPONSE',lot:'L1',observedAt:'2026-08-07',detail:'Respuesta'},
  {id:'MISS',caseId:'C1',eventKind:'DECISION',lot:'L1',observedAt:'2026-08-08',detail:'Sin ref'},
  {id:'TARGET',caseId:'C1',eventKind:'EVIDENCE',lot:'L1',observedAt:'2026-08-08',detail:'Target missing'},
  {id:'KIND',caseId:'C1',eventKind:'RESPONSE',lot:'L1',observedAt:'2026-08-08',detail:'Wrong kind'},
  {id:'P2',caseId:'C2',eventKind:'PROGRAM',lot:'L2',observedAt:'2026-08-01',detail:'Programa otro caso'},
  {id:'CROSS',caseId:'C1',eventKind:'PREFLIGHT',lot:'L1',observedAt:'2026-08-08',detail:'Cross'},
  {id:'PF-FUT',caseId:'C1',eventKind:'PREFLIGHT',lot:'L1',observedAt:'2026-08-10',detail:'Futuro'},
  {id:'FWD',caseId:'C1',eventKind:'DECISION',lot:'L1',observedAt:'2026-08-09',detail:'Forward'},
  {id:'LEGACY',caseId:'C1',eventKind:'DECISION',lot:'L1',observedAt:'2026-08-01',detail:'Legacy'}
];
const refs={PF1:'P1',D1:'PF1',A1:'D1',APP1:'A1',E1:'APP1',R1:'E1',MISS:'',TARGET:'NOPE',KIND:'APP1',CROSS:'P2','PF-FUT':'P1',FWD:'PF-FUT'};
const records=Object.entries(refs).map(([id,basisEventId])=>({id,type:'nutrition-ledger-event',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',referenceVersion:'V129',projectionVersion:'V2',basisEventId}}));

globalThis.storage={records};
globalThis.identity={displayName:'QA'};
globalThis.DEMO={inventory:[]};
globalThis.views={nutrition:()=>'<footer class="footer"></footer>'};
globalThis.document={addEventListener:()=>{}};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
globalThis.openModal=()=>{};
globalThis.window={
  addEventListener:()=>{},
  __SANA_PLAN_FIELD_WORKFLOW__:{forLot:()=>[]},
  __SANA_NUTRITION_LEDGER__:Object.freeze({
    schema:'SANA_NUTRITION_LEDGER_V1',
    projection:'SANA_NUTRITION_CHAIN_V2',
    projectionVersion:'V2',
    integrity:'BASE',
    events:()=>events,
    cases:()=>[{id:'C1',lot:'L1'},{id:'C2',lot:'L2'}],
    forCase:id=>({id,lot:id==='C2'?'L2':'L1',objective:'QA',integrity:'BASE',events:events.filter(e=>e.caseId===id),stageCoverage:{covered:6,total:6,percent:100},chainCoverage:{covered:7,total:7,percent:100},semantics:{}}),
    forLot:lot=>[]
  })
};

vm.runInThisContext(source,{filename:'sana-v3-nutrition-references.js'});
const api=window.__SANA_NUTRITION_LEDGER__;
assert.equal(api.referenceVersion,'V129');
const c=api.forCase('C1');
const statuses=new Map(c.referenceRows.map(r=>[r.event.id,r.reference.status]));
assert.equal(statuses.get('PF1'),'LINKED');
assert.equal(statuses.get('D1'),'LINKED');
assert.equal(statuses.get('A1'),'LINKED');
assert.equal(statuses.get('APP1'),'LINKED');
assert.equal(statuses.get('E1'),'LINKED');
assert.equal(statuses.get('R1'),'LINKED');
assert.equal(statuses.get('MISS'),'MISSING_REFERENCE');
assert.equal(statuses.get('TARGET'),'MISSING_TARGET');
assert.equal(statuses.get('KIND'),'KIND_MISMATCH');
assert.equal(statuses.get('CROSS'),'CROSS_CASE_REFERENCE');
assert.equal(statuses.get('FWD'),'FORWARD_REFERENCE');
const legacy=api.events().find(e=>e.id==='LEGACY');
assert.equal(api.eventReference(legacy,api.forCase('C1').events).status,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(c.referenceCoverage.total,12);
assert.equal(c.referenceCoverage.linked,7,'PF-FUT also has a valid PROGRAM predecessor');
assert.equal(c.referenceIssues,5,'MISS, TARGET, KIND, CROSS and FWD must remain documentary reference issues');

assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|WebSocket/);
assert.doesNotMatch(source,/productionExecutionAvailable\s*=\s*true|canonicalMutated\s*=\s*true/i);
console.log('SANA nutrition predecessor references V129 contract: OK');
