import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-data-trust.js','utf8');

globalThis.window={__SANA_CLOUD_STATE__:{describe:()=>({status:'SYNCED',connected:true,conflict:false,revision:7,dirty:false})}};
globalThis.storage={
  records:[{id:'REC-1',type:'sensor',lot:'LOT-1',createdAt:'2026-08-17T12:00:00Z',localOnly:true,values:{lot:'LOT-1',variable:'Humedad suelo',value:'49',unit:'%',observedAt:'2026-08-17T11:55',point:'P2',source:'Sensor DEMO',deviceRef:'SEN-X',method:'Sensor capacitivo',calibration:'CALIBRATION_NOT_CAPTURED',quality:'OBSERVADO DEMO'}}],
  queue:[{id:'Q-1',recordId:'REC-1',type:'sensor',lot:'LOT-1'}]
};
globalThis.views={iot:()=>'<footer class="footer-note"></footer>',passport:()=>'<footer class="footer-note"></footer>'};
globalThis.localStorage={getItem:()=> 'LOT-1'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';

vm.runInThisContext(source,{filename:'sana-v3-data-trust.js'});
const api=window.__SANA_DATA_TRUST__;
assert.ok(api);
assert.equal(api.schema,'SANA_DATA_TRUST_V1');

const rows=api.rows();
const manual=rows.find(r=>r.id==='DTR-AGU-MAN-01');
assert.equal(manual.captureState,'CAPTURED_LOCAL');
assert.equal(manual.ackState,'NO_RECORD_ACK');
assert.equal(manual.decisionUse,'HUMAN_CONTEXT_ONLY');

const sensor=rows.find(r=>r.id==='DTR-AGU-SEN-02');
assert.equal(sensor.ackState,'SERVER_ACK_DEMO_EXPLICIT');
assert.equal(sensor.hardwareVerification,'HARDWARE_NOT_VERIFIED');
assert.equal(sensor.validationState,'UNVALIDATED');
assert.equal(sensor.decisionUse,'HUMAN_CONTEXT_ONLY');

const conflict=rows.find(r=>r.id==='DTR-CAC-CONFLICT-03');
assert.equal(conflict.conflictState,'CONFLICT_REVIEW_REQUIRED');
assert.equal(conflict.value,null);
assert.equal(conflict.candidates.length,2);
assert.deepEqual(conflict.candidates.map(x=>x.value),[68,76]);
assert.ok(conflict.reviewFlags.includes('CONFLICT_REVIEW_REQUIRED'));

const user=rows.find(r=>r.id==='REC-1');
assert.equal(user.accountCloudStatus,'SYNCED','account context may be synced');
assert.equal(user.ackState,'NO_RECORD_ACK','account sync must not become record ACK');
assert.equal(user.queueState,'QUEUED_EXPLICIT_RECORD_LINK');
assert.equal(user.hardwareVerification,'HARDWARE_NOT_VERIFIED');
assert.equal(user.validationState,'UNVALIDATED');
assert.equal(user.canonicalWrite,false);
assert.equal(user.productionAuthority,false);

const summary=api.summary();
assert.equal(summary.automaticDecisions,0);
assert.ok(summary.conflicts>=1);
assert.match(api.integrity,/CAPTURED ≠ SYNCED/);
assert.match(api.integrity,/SYNC_ATTEMPT ≠ SERVER_ACK/);
assert.match(api.integrity,/SERVER_ACK ≠ HARDWARE_VERIFIED/);
assert.match(api.integrity,/SOURCE_LABEL ≠ SOURCE_AUTHENTICITY/);
assert.match(api.integrity,/READING ≠ VALIDATED_MEASUREMENT/);
assert.match(api.integrity,/VALIDATED_MEASUREMENT ≠ MANAGEMENT_DECISION/);
assert.match(api.integrity,/NETWORK_ONLINE ≠ RECORD_SYNCED/);
assert.match(api.integrity,/LOCAL_PERSISTENCE ≠ CANONICAL_WRITE/);
assert.match(api.integrity,/CONFLICT ≠ DATA_LOSS/);

assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('XMLHttpRequest'),false);
assert.equal(source.includes('WebSocket'),false);
assert.equal(source.includes('canonicalMutated=true'),false);
assert.equal(source.includes('productionExecutionAvailable=true'),false);
assert.equal(source.includes('autoIrrigation'),false);
assert.equal(source.includes('autoFertigation'),false);

console.log('data trust contract OK · account sync does not become record ACK · conflicts preserved · human decision retained');
