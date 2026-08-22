import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-data-trust-gaps.js','utf8');
globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>null,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]}),current:()=>({valid:false})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');

vm.runInThisContext(source,{filename:'sana-v3-due-diligence-data-trust-gaps.js'});
const api=window.__SANA_DD_DATA_TRUST_GAPS__;
assert.ok(api);

const clean={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',dataTrust:{lots:[{lotId:'LOT-1',readings:[
  {id:'A',unit:'%',method:'Manual',observedAt:'2026-08-17T10:00',sourceClass:'MANUAL_DEMO',sourceRef:'OP',ackState:'NO_RECORD_ACK',ackRef:'',conflictState:'NONE',candidateCount:0,validationState:'UNVALIDATED',hardwareVerification:'NOT_APPLICABLE'},
  {id:'B',unit:'%',method:'Sensor',observedAt:'2026-08-17T09:00',sourceClass:'SENSOR_DEMO',sourceRef:'SEN-1',ackState:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'ACK-B',conflictState:'NONE',candidateCount:0,validationState:'UNVALIDATED',hardwareVerification:'HARDWARE_NOT_VERIFIED'}
]}]}}};
assert.equal(api.derive(clean).length,0,'NO_RECORD_ACK, UNVALIDATED and HARDWARE_NOT_VERIFIED are not gaps by themselves');

const broken={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',dataTrust:{lots:[{lotId:'LOT-2',readings:[
  {id:'C',unit:'',method:'',observedAt:'',sourceClass:'SENSOR_DEMO',sourceRef:'',ackState:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'',conflictState:'CONFLICT_REVIEW_REQUIRED',candidateCount:1},
  {id:'D',unit:'pH',method:'Sonda',observedAt:'2026-08-17T08:00',sourceClass:'MANUAL_DEMO',sourceRef:'',ackState:'NO_RECORD_ACK',ackRef:'',conflictState:'NONE',candidateCount:2}
]}]}}};
const gaps=api.derive(broken);
const ids=new Set(gaps.map(g=>g.id));
for(const expected of ['data-trust:C:unit','data-trust:C:method','data-trust:C:time','data-trust:C:source-ref','data-trust:C:ack-ref','data-trust:C:conflict-candidates','data-trust:D:conflict-state'])assert.ok(ids.has(expected),expected);
assert.ok(gaps.every(g=>g.status==='OPEN_AT_SNAPSHOT'));
assert.match(api.integrity,/READING_OR_NO_ACK ≠ GAP/);
assert.match(api.integrity,/HARDWARE_NOT_VERIFIED ≠ GAP/);
assert.equal(source.includes('__SANA_DATA_TRUST__'),false,'DD must be snapshot-only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('creditApproved'),false);
assert.equal(source.includes('investmentApproved'),false);
console.log('data trust DD gap contract OK · only documentary inconsistencies become gaps');
