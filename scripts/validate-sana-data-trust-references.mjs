import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-data-trust-references.js','utf8');
const dataRows=[
  {id:'DTR-GOOD-ACK',lot:'L1',sourceClass:'SENSOR_DEMO',sourceRef:'DEVICE-DECLARED',capturedAt:'2026-08-20T10:00:00Z',observedAt:'2026-08-20T09:59:00Z',ackState:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'ACK-1',conflictState:'NONE',candidates:[],integrity:'BASE'},
  {id:'DTR-GOOD-CONFLICT',lot:'L1',sourceClass:'IMPORTED_DEMO',sourceRef:'IMPORT-DECLARED',capturedAt:'2026-08-20T11:00:00Z',observedAt:'2026-08-20T10:59:00Z',ackState:'NO_RECORD_ACK',ackRef:'',conflictState:'CONFLICT_REVIEW_REQUIRED',candidates:[{candidateId:'A',sourceRef:'SRC-A',capturedAt:'2026-08-20T11:00:01Z'}],integrity:'BASE'},
  {id:'DTR-BAD-SCOPE',lot:'L1',sourceClass:'SENSOR_DEMO',sourceRef:'DEVICE-BAD',capturedAt:'2026-08-20T12:00:00Z',observedAt:'2026-08-20T11:59:00Z',ackState:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'ACK-BAD',conflictState:'CONFLICT_REVIEW_REQUIRED',candidates:[{candidateId:'B',sourceRef:'SRC-B',capturedAt:'2026-08-20T12:00:01Z'}],integrity:'BASE'},
  {id:'DTR-LEGACY',lot:'L1',sourceClass:'MANUAL_DEMO',sourceRef:'OPERADOR',capturedAt:'2026-08-20T13:00:00Z',observedAt:'2026-08-20T12:59:00Z',ackState:'NO_RECORD_ACK',ackRef:'',conflictState:'NONE',candidates:[],integrity:'BASE'}
];
const syncCases=[
  {id:'SYNC-ACK',recordRef:'DTR-GOOD-ACK',lot:'L1',events:[{id:'SYNC-E1',kind:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'ACK-1',observedAt:'2026-08-20T10:00:02Z'}]},
  {id:'SYNC-CONFLICT',recordRef:'DTR-GOOD-CONFLICT',lot:'L1',events:[{id:'SYNC-E2',kind:'CONFLICT_DETECTED',candidateRefs:['SRC-A'],observedAt:'2026-08-20T11:00:02Z'}]},
  {id:'SYNC-BAD',recordRef:'DTR-BAD-SCOPE',lot:'L2',events:[{id:'SYNC-E3',kind:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'ACK-BAD',observedAt:'2026-08-20T12:00:02Z'},{id:'SYNC-E4',kind:'CONFLICT_DETECTED',candidateRefs:['SRC-B'],observedAt:'2026-08-20T12:00:02Z'}]}
];
const base={schema:'SANA_DATA_TRUST_V1',rows:()=>dataRows.map(x=>structuredClone(x)),forLot:lot=>dataRows.filter(x=>x.lot===lot).map(x=>structuredClone(x)),summary:()=>({schema:'SANA_DATA_TRUST_V1',total:dataRows.length,integrity:'BASE'}),integrity:'BASE'};
const meta=['DTR-GOOD-ACK','DTR-GOOD-CONFLICT','DTR-BAD-SCOPE'].map((readingId,i)=>({id:`M${i}`,type:'data-trust-reference-meta',values:{sourceSchema:base.schema,readingId,referenceVersion:'V160'}}));
const sandbox={window:{__SANA_DATA_TRUST__:base,__SANA_CAPTURE_SYNC_LEDGER__:{schema:'SANA_CAPTURE_SYNC_LEDGER_V1',cases:()=>structuredClone(syncCases)}},storage:{records:meta},views:{iot:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},openModal:()=>{},esc:v=>String(v??''),metric:()=>'',structuredClone,console,Date};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_DATA_TRUST__;
assert.equal(api.referenceVersion,'V160');
const ack=api.forReading('DTR-GOOD-ACK');
assert.equal(ack.referenceCoverage.total,1);assert.equal(ack.referenceCoverage.linked,1);assert.equal(ack.referenceIssues,0);assert.equal(ack.referenceRows[0].kind,'ACK_COHERENCE_REF');assert.equal(ack.referenceRows[0].reference.status,'LINKED');
const conflict=api.forReading('DTR-GOOD-CONFLICT');
assert.equal(conflict.referenceCoverage.total,1);assert.equal(conflict.referenceCoverage.linked,1);assert.equal(conflict.referenceIssues,0);assert.equal(conflict.referenceRows[0].kind,'CONFLICT_CANDIDATE_COHERENCE_REF');assert.equal(conflict.referenceRows[0].reference.status,'LINKED');
const bad=api.forReading('DTR-BAD-SCOPE');
assert.equal(bad.referenceCoverage.total,2);assert.equal(bad.referenceCoverage.linked,0);assert.equal(bad.referenceIssues,2);assert.ok(bad.referenceRows.every(r=>r.reference.status==='CROSS_SCOPE_REFERENCE'));
const legacy=api.forReading('DTR-LEGACY');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');assert.equal(legacy.referenceCoverage.total,0);assert.equal(legacy.referenceIssues,0);
const summary=api.summary();
assert.equal(summary.referenceCaptured,3);assert.equal(summary.referenceExpected,4);assert.equal(summary.referenceLinked,2);assert.equal(summary.referenceIssues,2);assert.equal(summary.declaredNonCanonical,3);assert.equal(summary.legacyReferenceNotCaptured,1);
for(const r of api.rows().filter(x=>x.referenceState==='CAPTURED_V160')){assert.ok(r.declaredReferenceRows.every(x=>x.status==='DECLARED_NON_CANONICAL_REFERENCE'));assert.ok(r.declaredReferenceRows.every(x=>x.valueExposed===false))}
assert.match(api.integrity,/ACK_COHERENCE ≠ SERVER_VERIFICATION/);assert.match(api.integrity,/CONFLICT_CANDIDATE_COHERENCE ≠ SOURCE_AUTHENTICITY ≠ TRUTH/);assert.match(api.integrity,/REFERENCE ≠ DATA_QUALITY_SCORE ≠ AGRONOMIC_DECISION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL/);
console.log('data trust references V160: ok');
