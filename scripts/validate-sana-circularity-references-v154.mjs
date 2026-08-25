import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-circularity-references.js','utf8');
const cases=[
  {id:'C1',lot:'L1',events:[
    {id:'G1',eventKind:'GENERATION',lot:'L1',observedAt:'2026-08-01',sourceActivity:'Actividad textual'},
    {id:'X1',eventKind:'EXECUTION',lot:'L1',observedAt:'2026-08-02',receiverRef:'RECEIVER-DECL'},
    {id:'E1',eventKind:'EVIDENCE',lot:'L1',observedAt:'2026-08-03',evidenceRef:'EV-DECL',supports:['X1']}
  ],integrity:'BASE'},
  {id:'C2',lot:'L2',events:[
    {id:'E2',eventKind:'EVIDENCE',lot:'L2',observedAt:'2026-08-04',supports:['X1']}
  ],integrity:'BASE'},
  {id:'C3',lot:'L3',events:[
    {id:'E3',eventKind:'EVIDENCE',lot:'L3',observedAt:'2026-08-01',supports:['X3']},
    {id:'X3',eventKind:'OUTCOME',lot:'L3',observedAt:'2026-08-05'}
  ],integrity:'BASE'},
  {id:'C4',lot:'L4',events:[
    {id:'E4A',eventKind:'EVIDENCE',lot:'L4',observedAt:'2026-08-01',supports:[]},
    {id:'E4B',eventKind:'EVIDENCE',lot:'L4',observedAt:'2026-08-02',supports:['E4A']}
  ],integrity:'BASE'},
  {id:'C5',lot:'L5',events:[
    {id:'E5',eventKind:'EVIDENCE',lot:'L5',observedAt:'2026-08-02',supports:[]}
  ],integrity:'BASE'},
  {id:'C6',lot:'L6',events:[
    {id:'X6',eventKind:'EXECUTION',lot:'L9',observedAt:'2026-08-01'},
    {id:'E6',eventKind:'EVIDENCE',lot:'L6',observedAt:'2026-08-02',supports:['X6']}
  ],integrity:'BASE'},
  {id:'LEG',lot:'L7',events:[{id:'XL',eventKind:'EXECUTION',lot:'L7',observedAt:'2026-08-01'}],integrity:'BASE'}
];
const base={
  schema:'SANA_CIRCULARITY_LEDGER_V1',
  cases:()=>cases.map(c=>structuredClone(c)),
  forCase:id=>cases.find(c=>c.id===id)?structuredClone(cases.find(c=>c.id===id)):null,
  forLot:lot=>({cases:cases.filter(c=>c.lot===lot).map(c=>structuredClone(c)),legacy:lot==='L7'?[{id:'OLD'}]:[]}),
  summary:()=>({schema:'SANA_CIRCULARITY_LEDGER_V1',cases:cases.length,integrity:'BASE'}),
  integrity:'BASE'
};
const metas=['C1','C2','C3','C4','C5','C6'].map((id,i)=>({id:`M${i}`,type:'circularity-reference-meta',createdAt:`2026-08-${10+i}`,values:{sourceSchema:base.schema,caseId:id,referenceVersion:'V154',reviewer:'QA'}}));
const sandbox={
  window:{__SANA_CIRCULARITY_LEDGER__:base},
  storage:{records:metas},
  views:{circularity:()=>'<footer class="footer"></footer>'},
  document:{addEventListener:()=>{}},
  identity:{displayName:'QA'},
  openModal:()=>{},
  esc:v=>String(v??''),metric:()=>'',structuredClone,console,Date,Object,Array,Number,String,Math,Set,Map,JSON
};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_CIRCULARITY_LEDGER__;
assert.equal(api.referenceVersion,'V154');

const good=api.forCase('C1');
assert.equal(good.referenceState,'CAPTURED_V154');
assert.deepEqual(JSON.parse(JSON.stringify(good.referenceCoverage)),{linked:1,total:1,percent:100});
assert.equal(good.referenceIssues,0);
assert.equal(good.referenceRows[0].kind,'CIRCULARITY_SUPPORT_REF');
assert.equal(good.referenceRows[0].reference.status,'LINKED');
assert.equal(good.declaredReferenceRows.length,3);
assert.ok(good.declaredReferenceRows.every(r=>r.status==='DECLARED_NON_CANONICAL_REFERENCE'));
assert.deepEqual(new Set(good.declaredReferenceRows.map(r=>r.kind)),new Set(['SOURCE_ACTIVITY_DECLARED','RECEIVER_REF_DECLARED','EVIDENCE_REF_DECLARED']));

assert.equal(api.forCase('C2').referenceRows[0].reference.status,'CROSS_CASE_REFERENCE');
assert.equal(api.forCase('C3').referenceRows[0].reference.status,'FORWARD_REFERENCE');
assert.equal(api.forCase('C4').referenceRows[0].reference.status,'MISSING_REFERENCE');
assert.equal(api.forCase('C4').referenceRows[1].reference.status,'KIND_MISMATCH');
assert.equal(api.forCase('C5').referenceRows[0].reference.status,'MISSING_REFERENCE');
assert.equal(api.forCase('C6').referenceRows[0].reference.status,'CROSS_SCOPE_REFERENCE');

const legacy=api.forCase('LEG');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(legacy.referenceCoverage.total,0);
assert.equal(api.forLot('L7').legacy.length,1,'legacy circularity history must remain visible');

const summary=api.summary();
assert.equal(summary.referenceCaptured,6);
assert.equal(summary.referenceLinked,1);
assert.equal(summary.referenceExpected,7);
assert.equal(summary.referenceIssues,6);
assert.equal(summary.declaredNonCanonical,3);
assert.equal(summary.legacyReferenceNotCaptured,1);
assert.match(api.integrity,/SUPPORT_REFERENCE ≠ EVIDENCE_VERIFIED/);
assert.match(api.integrity,/RECEIVER_REFERENCE_DECLARED ≠ RECEIVER_IDENTITY_VERIFIED/);
assert.match(api.integrity,/EXECUTION ≠ RECOVERY/);
assert.match(api.integrity,/EXTERNAL_HANDOFF ≠ VERIFIED_DISPOSITION/);
assert.match(api.integrity,/REFERENCE ≠ CIRCULARITY_RATE ≠ ENVIRONMENTAL_IMPACT/);

for(const forbidden of ['verifiedDisposition=true','certifiedRecovery=true','environmentalImpactVerified=true','regulatoryClassificationVerified=true','canonicalMutated=true','productionExecutionAvailable=true','creditApproved','investmentApproved'])assert.equal(src.includes(forbidden),false,forbidden);
console.log('circularity references V154: ok');
