import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-capture-sync-references.js','utf8');

const cases=[
  {id:'SYNC-GOOD',recordRef:'DTR-G1',lot:'L1',recordType:'sensor',events:[
    {id:'G-CAP',kind:'CAPTURED_LOCAL',observedAt:'2026-08-20T10:00:00Z'},
    {id:'G-ATT',kind:'SYNC_ATTEMPTED_DEMO',observedAt:'2026-08-20T10:01:00Z'},
    {id:'G-ACK',kind:'SERVER_ACK_DEMO_EXPLICIT',observedAt:'2026-08-20T10:02:00Z',ackRef:'ACK-G1'},
    {id:'G-EV',kind:'EVIDENCE',observedAt:'2026-08-20T10:03:00Z',evidenceRef:'EVIDENCE-DECLARED-ONLY'}
  ],integrity:'BASE'},
  {id:'SYNC-CONFLICT',recordRef:'DTR-C1',lot:'L2',recordType:'import',events:[
    {id:'C-CAP',kind:'CAPTURED_LOCAL',observedAt:'2026-08-20T11:00:00Z'},
    {id:'C-CON',kind:'CONFLICT_DETECTED',observedAt:'2026-08-20T11:01:00Z',candidateRefs:['IMPORT-A','IMPORT-B']}
  ],integrity:'BASE'},
  {id:'SYNC-BAD',recordRef:'DTR-MISSING',lot:'L1',recordType:'sensor',events:[
    {id:'B-ACK',kind:'SERVER_ACK_DEMO_EXPLICIT',observedAt:'2026-08-20T12:00:00Z',ackRef:'ACK-X'},
    {id:'B-CON',kind:'CONFLICT_DETECTED',observedAt:'2026-08-20T12:01:00Z',candidateRefs:['NOPE']}
  ],integrity:'BASE'},
  {id:'SYNC-BADTYPE',recordRef:'DTR-C1',lot:'L2',recordType:'sensor',events:[
    {id:'T-CAP',kind:'CAPTURED_LOCAL',observedAt:'2026-08-20T13:00:00Z'}
  ],integrity:'BASE'},
  {id:'SYNC-LEGACY',recordRef:'DTR-G1',lot:'L1',recordType:'sensor',events:[
    {id:'L-CAP',kind:'CAPTURED_LOCAL',observedAt:'2026-08-20T09:00:00Z'}
  ],integrity:'BASE'}
];

const trustRows=[
  {id:'DTR-G1',lot:'L1',sourceClass:'SENSOR_DEMO',observedAt:'2026-08-20T09:59:00Z',capturedAt:'2026-08-20T10:00:00Z',ackState:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'ACK-G1',conflictState:'NONE',candidates:[]},
  {id:'DTR-C1',lot:'L2',sourceClass:'IMPORTED_DEMO',observedAt:'2026-08-20T10:59:00Z',capturedAt:'2026-08-20T11:00:00Z',ackState:'NO_RECORD_ACK',ackRef:'',conflictState:'CONFLICT_REVIEW_REQUIRED',candidates:[
    {candidateId:'A',sourceRef:'IMPORT-A',capturedAt:'2026-08-20T11:00:10Z'},
    {candidateId:'B',sourceRef:'IMPORT-B',capturedAt:'2026-08-20T11:00:20Z'}
  ]}
];

const base={
  schema:'SANA_CAPTURE_SYNC_LEDGER_V1',
  cases:()=>cases.map(c=>structuredClone(c)),
  forLot:lot=>cases.filter(c=>c.lot===lot).map(c=>structuredClone(c)),
  forRecord:recordRef=>cases.filter(c=>c.recordRef===recordRef).map(c=>structuredClone(c)),
  summary:()=>({schema:'SANA_CAPTURE_SYNC_LEDGER_V1',total:cases.length,integrity:'BASE'}),
  integrity:'BASE'
};
const meta=['SYNC-GOOD','SYNC-CONFLICT','SYNC-BAD','SYNC-BADTYPE'].map((caseId,i)=>({id:`META-${i}`,type:'capture-sync-reference-meta',values:{sourceSchema:base.schema,caseId,referenceVersion:'V150'}}));

const sandbox={
  window:{
    __SANA_CAPTURE_SYNC_LEDGER__:base,
    __SANA_DATA_TRUST__:{rows:()=>trustRows.map(r=>structuredClone(r))}
  },
  storage:{records:meta},
  views:{iot:()=>''},
  document:{addEventListener:()=>{}},
  identity:{displayName:'QA'},
  openModal:()=>{},
  esc:v=>String(v??''),
  metric:()=>'',
  structuredClone,
  console,
  Date
};
vm.createContext(sandbox);
vm.runInContext(src,sandbox);

const api=sandbox.window.__SANA_CAPTURE_SYNC_LEDGER__;
assert.equal(api.referenceVersion,'V150');

const good=api.forCase('SYNC-GOOD');
assert.equal(good.referenceState,'CAPTURED_V150');
assert.deepEqual(good.referenceCoverage,{linked:2,total:2,percent:100});
assert.equal(good.referenceIssues,0);
assert.equal(good.declaredReferenceRows.length,1);
assert.equal(good.declaredReferenceRows[0].status,'DECLARED_NON_CANONICAL_REFERENCE');
assert.ok(good.referenceRows.some(r=>r.kind==='RECORD_REF'&&r.reference.status==='LINKED'));
assert.ok(good.referenceRows.some(r=>r.kind==='ACK_COHERENCE_REF'&&r.reference.status==='LINKED'));

const conflict=api.forCase('SYNC-CONFLICT');
assert.deepEqual(conflict.referenceCoverage,{linked:3,total:3,percent:100});
assert.equal(conflict.referenceIssues,0);
assert.equal(conflict.referenceRows.filter(r=>r.kind==='CONFLICT_CANDIDATE_REF'&&r.reference.status==='LINKED').length,2);

const bad=api.forCase('SYNC-BAD');
assert.equal(bad.referenceCoverage.total,3);
assert.equal(bad.referenceIssues,3);
assert.ok(bad.referenceRows.some(r=>r.kind==='RECORD_REF'&&r.reference.status==='MISSING_TARGET'));
assert.ok(bad.referenceRows.some(r=>r.kind==='ACK_COHERENCE_REF'&&r.reference.status==='MISSING_RECORD_TARGET'));
assert.ok(bad.referenceRows.some(r=>r.kind==='CONFLICT_CANDIDATE_REF'&&r.reference.status==='MISSING_RECORD_TARGET'));

const badType=api.forCase('SYNC-BADTYPE');
assert.equal(badType.referenceCoverage.total,1);
assert.equal(badType.referenceIssues,1);
assert.equal(badType.referenceRows[0].reference.status,'KIND_MISMATCH');

const legacy=api.forCase('SYNC-LEGACY');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(legacy.referenceCoverage.total,0);
assert.equal(legacy.referenceIssues,0);

const summary=api.summary();
assert.equal(summary.referenceCaptured,4);
assert.equal(summary.legacyReferenceNotCaptured,1);
assert.equal(summary.referenceExpected,9);
assert.equal(summary.referenceLinked,5);
assert.equal(summary.referenceIssues,4);
assert.equal(summary.declaredNonCanonical,1);
assert.match(api.integrity,/ACK_REFERENCE_COHERENCE ≠ SERVER_VERIFICATION/);
assert.match(api.integrity,/CANDIDATE_REFERENCE ≠ SOURCE_VERIFICATION/);
assert.match(api.integrity,/REFERENCE ≠ DATA_COMPLETENESS ≠ AGRONOMIC_DECISION ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL/);
console.log('capture sync references V150 core: ok');
