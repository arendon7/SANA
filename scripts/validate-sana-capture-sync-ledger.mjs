import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ledgerPath='apps/control-web/public/sana-v3-capture-sync-ledger.js';
const cyclePath='apps/control-web/public/sana-v3-cycle-capture-sync-provenance.js';
const ledgerCode=fs.readFileSync(ledgerPath,'utf8');
const cycleCode=fs.readFileSync(cyclePath,'utf8');

const storage={
  records:[
    {id:'REC-1',type:'sensor',title:'Humedad suelo',lot:'AGU-A2',values:{variable:'Humedad suelo'},createdAt:'2026-08-17T20:00:00-05:00',localOnly:true},
    {id:'REC-2',type:'fieldRecord',title:'Observación',lot:'CAF-A1',values:{},createdAt:'2026-08-17T20:01:00-05:00',localOnly:true},
    {id:'LIFE-1',type:'sync-lifecycle-event',lot:'REC-1',values:{recordRef:'REC-1',lot:'AGU-A2',kind:'SYNC_ATTEMPTED_DEMO',observedAt:'2026-08-17T20:02:00-05:00'},createdAt:'2026-08-17T20:02:00-05:00',localOnly:true},
    {id:'LIFE-2',type:'sync-lifecycle-event',lot:'REC-2',values:{recordRef:'REC-2',lot:'CAF-A1',kind:'CONFLICT_DETECTED',observedAt:'2026-08-17T20:03:00-05:00',candidateRefs:'A,B'},createdAt:'2026-08-17T20:03:00-05:00',localOnly:true},
    {id:'LIFE-3',type:'sync-lifecycle-event',lot:'REC-2',values:{recordRef:'REC-2',lot:'CAF-A1',kind:'HUMAN_RESOLUTION_RECORDED',observedAt:'2026-08-17T20:04:00-05:00',resolution:'KEEP_BOTH'},createdAt:'2026-08-17T20:04:00-05:00',localOnly:true}
  ],
  queue:[
    {id:'Q-NEW',recordId:'REC-1',type:'sensor',lot:'AGU-A2',createdAt:'2026-08-17T20:00:01-05:00',state:'PENDING_SERVER'},
    {id:'Q-LEGACY',type:'Evidencia fotográfica',lot:'RES-01',created:'13 ago · 17:06'}
  ]
};
const context={
  window:{__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-AG-03',version:3,lot:'AGU-A2'})}},
  storage,
  DEMO:{plans:[{id:'PL-AG-03',version:3,lot:'AGU-A2'},{id:'PL-CF-04',version:4,lot:'CAF-A1'}]},
  views:{field:()=>'',iot:()=>'',passport:()=>'',cycle:()=>''},
  metric:()=>'',esc:v=>String(v),localStorage:{getItem:()=>null},console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(ledgerCode,context,{filename:ledgerPath});
const api=context.window.__SANA_CAPTURE_SYNC_LEDGER__;
assert(api,'capture sync ledger API missing');
assert.equal(api.schema,'SANA_CAPTURE_SYNC_LEDGER_V1');
const rows=api.cases();

const localSensor=rows.find(c=>c.recordRef==='REC-1');
assert(localSensor,'linked local sensor case missing');
assert.equal(localSensor.captureRecorded,true);
assert.equal(localSensor.queueRecorded,true,'new offline queue must link by recordId');
assert.equal(localSensor.syncAttemptRecorded,true);
assert.equal(localSensor.ackRecorded,false,'sync attempt must not infer ACK');
assert.equal(localSensor.sourceVerified,false);

const localField=rows.find(c=>c.recordRef==='REC-2');
assert(localField,'local field case missing');
assert.equal(localField.conflictRecorded,true);
assert.equal(localField.resolutionRecorded,true);
assert.equal(localField.resolution,'KEEP_BOTH');
assert.equal(localField.sourceVerified,false,'human conflict resolution must not verify source');
assert.equal(localField.automaticResolution,false);

const legacy=rows.find(c=>c.legacyUnlinked);
assert(legacy,'legacy unlinked queue case missing');
assert.equal(legacy.recordRef,'');
assert.equal(legacy.queueRecorded,true);
assert.equal(legacy.captureRecorded,false,'legacy queue must not invent capture relation');

const ackCase=rows.find(c=>c.id==='SYNC-AGU-SEN-02');
assert(ackCase,'baseline explicit ACK case missing');
assert.equal(ackCase.syncAttemptRecorded,true);
assert.equal(ackCase.ackRecorded,true);
assert.equal(ackCase.ackRef,'ACK-DEMO-DTR-002');
assert.equal(ackCase.sourceVerified,false,'ACK must not verify hardware/source');
assert.equal(ackCase.calibratedMeasurement,false);

const resolved=rows.find(c=>c.id==='SYNC-RESOLVED-DEMO-04');
assert.equal(resolved.conflictRecorded,true);
assert.equal(resolved.resolutionRecorded,true);
assert.equal(resolved.sourceVerified,false);
assert.equal(resolved.automaticResolution,false);

const summary=api.summary();
assert.equal(summary.automaticResolutions,0);
assert.equal(summary.canonicalWrites,0);
assert.equal(summary.unlinkedLegacyQueue,1);
assert.match(api.integrity,/ONLINE ≠ VERIFIED_SYNC/);
assert.match(api.integrity,/QUEUE_EMPTY ≠ DATA_COMPLETE/);
assert.match(api.integrity,/CONFLICT_RESOLVED ≠ SOURCE_VERIFIED/);
assert.match(api.integrity,/DEVICE_ID ≠ CERTIFIED_INSTRUMENT/);

vm.runInContext(cycleCode,context,{filename:cyclePath});
const cycle=context.window.__SANA_CYCLE_CAPTURE_SYNC__;
assert(cycle,'cycle capture sync API missing');
const selected=cycle.selected();
assert.equal(selected.valid,true);
assert.equal(selected.plan.id,'PL-AG-03');
assert(selected.cases.some(c=>c.recordRef==='REC-1'));
assert(selected.cases.every(c=>c.sourceVerified===false));
assert(selected.cases.every(c=>c.automaticResolution===false));
assert(!('completeness' in selected));
assert(!('readyForArchive' in selected));
assert.match(cycle.integrity,/CAPTURE_SYNC_PROVENANCE ≠ CYCLE_GATE/);

for(const code of [ledgerCode,cycleCode]){
  assert(!/fetch\s*\(/.test(code),'capture sync modules must not perform network writes');
  assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
  assert(!/canonicalMutated\s*=\s*true/.test(code));
}
console.log('SANA capture sync ledger v53 validation: OK');
