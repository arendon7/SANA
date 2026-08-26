import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-source-evidence-references.js','utf8');
const cases=[
  {id:'SRC-001',name:'Plan source',scope:'CAF-A1',events:[{id:'U1',kind:'USE_DECLARED',useType:'PLAN_CONTEXT',targetRef:'PL-CF-04'}],uses:[{id:'U1',kind:'USE_DECLARED',useType:'PLAN_CONTEXT',targetRef:'PL-CF-04'}],evidence:[],integrity:'BASE'},
  {id:'SRC-002',name:'Input source',scope:'AGU-A2',events:[{id:'U2',kind:'USE_DECLARED',useType:'INPUT_CONTEXT',targetRef:'PRY-AG-01'}],uses:[{id:'U2',kind:'USE_DECLARED',useType:'INPUT_CONTEXT',targetRef:'PRY-AG-01'}],evidence:[],integrity:'BASE'},
  {id:'SRC-003',name:'Health source',scope:'CAC-B1',events:[{id:'U3',kind:'USE_DECLARED',useType:'HEALTH_CONTEXT',targetRef:'CAC-B1'},{id:'E3',kind:'EVIDENCE',evidenceRef:'EV-CAC'}],uses:[{id:'U3',kind:'USE_DECLARED',useType:'HEALTH_CONTEXT',targetRef:'CAC-B1'}],evidence:[{id:'E3',kind:'EVIDENCE',evidenceRef:'EV-CAC'}],integrity:'BASE'},
  {id:'SRC-004',name:'Farm source',scope:'FIN-LE-001',events:[{id:'U4',kind:'USE_DECLARED',useType:'FARM_BASELINE_CONTEXT',targetRef:'FIN-LE-001'},{id:'E4',kind:'EVIDENCE',evidenceRef:'EV-CAF'}],uses:[{id:'U4',kind:'USE_DECLARED',useType:'FARM_BASELINE_CONTEXT',targetRef:'FIN-LE-001'}],evidence:[{id:'E4',kind:'EVIDENCE',evidenceRef:'EV-CAF'}],integrity:'BASE'},
  {id:'SRC-BAD',name:'Bad source',scope:'CAF-A1',events:[
    {id:'UB1',kind:'USE_DECLARED',useType:'PLAN_CONTEXT',targetRef:'PL-MISSING'},
    {id:'UB2',kind:'USE_DECLARED',useType:'UNKNOWN_CONTEXT',targetRef:'X-1'},
    {id:'EB1',kind:'EVIDENCE',evidenceRef:'EV-AGU'},
    {id:'EB2',kind:'EVIDENCE',evidenceRef:'EV-MISSING'}
  ],uses:[],evidence:[],integrity:'BASE'},
  {id:'SRC-LEGACY',name:'Legacy',scope:'CAF-A1',events:[{id:'UL',kind:'USE_DECLARED',useType:'PLAN_CONTEXT',targetRef:'PL-CF-04'}],uses:[],evidence:[],integrity:'BASE'}
];
const base={schema:'SANA_SOURCE_EVIDENCE_LEDGER_V1',cases:()=>cases.map(c=>structuredClone(c)),forScope:s=>cases.filter(c=>c.scope===s),forTarget:r=>cases.filter(c=>(c.uses||[]).some(u=>u.targetRef===r)),summary:()=>({schema:'SANA_SOURCE_EVIDENCE_LEDGER_V1',total:cases.length,integrity:'BASE'}),integrity:'BASE'};
const meta=['SRC-001','SRC-002','SRC-003','SRC-004','SRC-BAD'].map((id,i)=>({id:`M${i}`,type:'source-evidence-reference-meta',values:{sourceSchema:'SANA_SOURCE_EVIDENCE_LEDGER_V1',sourceId:id,referenceVersion:'V143'}}));
const sandbox={window:{__SANA_SOURCE_EVIDENCE_LEDGER__:base,__SANA_INPUT_FORECAST__:{rows:()=>[{id:'PRY-AG-01',lot:'AGU-A2'}]}},DEMO:{farm:{id:'FIN-LE-001'},lots:[{id:'CAF-A1'},{id:'AGU-A2'},{id:'CAC-B1'}],plans:[{id:'PL-CF-04',lot:'CAF-A1'}],evidence:[{id:'EV-CAC',lot:'CAC-B1'},{id:'EV-CAF',lot:'CAF-A1'},{id:'EV-AGU',lot:'AGU-A2'}]},storage:{records:meta},views:{sources:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},esc:v=>String(v??''),metric:()=>'',openModal:()=>{},structuredClone,console};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_SOURCE_EVIDENCE_LEDGER__;
assert.equal(api.referenceVersion,'V143');
for(const id of ['SRC-001','SRC-002','SRC-003','SRC-004'])assert.equal(api.forCase(id).referenceIssues,0,id);
assert.equal(api.forCase('SRC-001').referenceRows[0].reference.domain,'PLAN');
assert.equal(api.forCase('SRC-002').referenceRows[0].reference.domain,'FORECAST');
assert.equal(api.forCase('SRC-003').referenceRows.find(r=>r.kind==='USE_TARGET').reference.domain,'LOT');
assert.equal(api.forCase('SRC-004').referenceRows.find(r=>r.kind==='USE_TARGET').reference.domain,'FARM');
assert.equal(api.forCase('SRC-004').referenceRows.find(r=>r.kind==='EVIDENCE_REF').reference.status,'LINKED','farm scope may support lot evidence');
const bad=api.forCase('SRC-BAD').referenceRows;
assert.ok(bad.some(r=>r.kind==='USE_TARGET'&&r.reference.status==='MISSING_TARGET'));
assert.ok(bad.some(r=>r.kind==='USE_TARGET'&&r.reference.status==='UNSUPPORTED_USE_TYPE'));
assert.ok(bad.some(r=>r.kind==='EVIDENCE_REF'&&r.refId==='EV-AGU'&&r.reference.status==='CROSS_SCOPE_REFERENCE'));
assert.ok(bad.some(r=>r.kind==='EVIDENCE_REF'&&r.refId==='EV-MISSING'&&r.reference.status==='MISSING_TARGET'));
assert.equal(api.forCase('SRC-LEGACY').referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(api.forCase('SRC-LEGACY').referenceCoverage.total,0);
assert.equal(api.summary().referenceCaptured,5);
assert.equal(api.summary().legacyReferenceNotCaptured,1);
assert.match(api.integrity,/TARGET_EXISTS ≠ SOURCE_CONTENT_CORRECT/);
assert.match(api.integrity,/NO_EXTERNAL_FETCH/);
assert.match(api.integrity,/NO_CERTIFICATION/);
console.log('source evidence references V143: ok');
