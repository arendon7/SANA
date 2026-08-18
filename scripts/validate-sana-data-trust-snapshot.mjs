import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-data-trust.js','utf8');
globalThis.window={__SANA_DATA_TRUST__:{
  rows:()=>[
    {id:'R1',lot:'LOT-1',variable:'Humedad',value:45,unit:'%',observedAt:'2026-08-17T10:00',capturedAt:'2026-08-17T10:01',point:'P1',method:'Manual',sourceClass:'MANUAL_DEMO',sourceRef:'OP-1',qualityClaim:'OBSERVED_DEMO',hardwareVerification:'NOT_APPLICABLE',calibrationState:'METHOD_NOT_VERIFIED',locationIntegrity:'LOT_AND_POINT_DECLARED',timeIntegrity:'CLIENT_TIME_DECLARED',captureState:'CAPTURED_LOCAL',queueState:'QUEUED_DEMO_NO_ACK',syncAttemptState:'NOT_CAPTURED_AT_RECORD_LEVEL',ackState:'NO_RECORD_ACK',ackRef:'',validationState:'UNVALIDATED',conflictState:'NONE',humanReview:'REQUIRED',provenance:'BASELINE_DEMO',decisionUse:'HUMAN_CONTEXT_ONLY',reviewFlags:['NO_RECORD_ACK'],candidates:[]},
    {id:'R2',lot:'LOT-1',variable:'Humedad',value:46,unit:'%',observedAt:'2026-08-17T09:00',capturedAt:'2026-08-17T09:01',point:'S1',method:'Sensor',sourceClass:'SENSOR_DEMO',sourceRef:'SEN-1',qualityClaim:'OBSERVED_DEMO',hardwareVerification:'HARDWARE_NOT_VERIFIED',calibrationState:'CALIBRATION_NOT_CAPTURED',locationIntegrity:'LOT_AND_POINT_DECLARED',timeIntegrity:'DEVICE_TIME_NOT_VERIFIED',captureState:'CAPTURED_DEMO',queueState:'NOT_QUEUED',syncAttemptState:'SYNC_ATTEMPTED_DEMO',ackState:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'ACK-2',validationState:'UNVALIDATED',conflictState:'NONE',humanReview:'REQUIRED',provenance:'BASELINE_DEMO',decisionUse:'HUMAN_CONTEXT_ONLY',reviewFlags:['HARDWARE_NOT_VERIFIED'],candidates:[]}
  ],
  cloudContext:()=>({status:'SYNCED',connected:true,conflict:false,revision:9,dirty:false})
}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction=null;
globalThis.queueMicrotask=fn=>fn();

vm.runInThisContext(source,{filename:'sana-v3-report-snapshot-data-trust.js'});
const api=window.__SANA_REPORT_SNAPSHOT_DATA_TRUST__;
assert.ok(api);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F1'}};
api.enrichDataTrust(manifest);
assert.ok(manifest.dataTrust);
assert.equal(manifest.dataTrust.readingCount,2);
assert.equal(manifest.dataTrust.noRecordAckCount,1);
assert.equal(manifest.dataTrust.demoAckCount,1);
assert.equal(manifest.dataTrust.unvalidatedCount,2);
assert.equal(manifest.dataTrust.hardwareNotVerifiedCount,1);
assert.equal(manifest.dataTrust.accountContext.status,'SYNCED');
const rows=manifest.dataTrust.lots[0].readings;
assert.equal(rows.find(r=>r.id==='R1').ackState,'NO_RECORD_ACK');
assert.equal(rows.find(r=>r.id==='R2').hardwareVerification,'HARDWARE_NOT_VERIFIED');
assert.match(manifest.dataTrust.integrity,/NO_ACCOUNT_STATUS_TO_RECORD_ACK_INFERENCE/);
assert.match(manifest.dataTrust.integrity,/NO_ACK_TO_HARDWARE_VERIFICATION_INFERENCE/);
assert.match(manifest.dataTrust.integrity,/NO_READING_TO_VALIDATION_INFERENCE/);
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('canonicalMutated=true'),false);
console.log('data trust snapshot contract OK · record-level states captured without live fallback or promotion');
