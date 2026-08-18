import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotPath='apps/control-web/public/sana-v3-report-snapshot-capture-sync.js';
const historyPath='apps/control-web/public/sana-v3-dataroom-capture-sync-history.js';
const gapsPath='apps/control-web/public/sana-v3-due-diligence-capture-sync-gaps.js';
const snapshotCode=fs.readFileSync(snapshotPath,'utf8');
const historyCode=fs.readFileSync(historyPath,'utf8');
const gapsCode=fs.readFileSync(gapsPath,'utf8');

const liveCases=[
  {id:'SYNC-A',recordRef:'REC-A',lot:'AGU-A2',recordType:'sensor',sourceClass:'SENSOR_DEMO',state:'PENDING_SERVER',captureRecorded:true,queueRecorded:true,syncAttemptRecorded:false,ackRecorded:false,ackRef:'',conflictRecorded:false,resolutionRecorded:false,sourceVerified:false,calibratedMeasurement:false,automaticResolution:false,legacyUnlinked:false,events:[{id:'A1',kind:'CAPTURED_LOCAL',observedAt:'2026-08-17T20:00:00-05:00',provenance:'USER_DEMO_LOCAL'},{id:'A2',kind:'QUEUED_LOCAL',observedAt:'2026-08-17T20:00:01-05:00',provenance:'USER_DEMO_LOCAL'}]},
  {id:'SYNC-B',recordRef:'REC-B',lot:'CAC-B1',recordType:'import',sourceClass:'IMPORTED_DEMO',state:'CONFLICT_REVIEW_REQUIRED',captureRecorded:true,queueRecorded:false,syncAttemptRecorded:false,ackRecorded:false,ackRef:'',conflictRecorded:true,resolutionRecorded:false,sourceVerified:false,calibratedMeasurement:false,automaticResolution:false,legacyUnlinked:false,events:[{id:'B1',kind:'CAPTURED_LOCAL',observedAt:'2026-08-17T20:01:00-05:00',provenance:'USER_DEMO_LOCAL'},{id:'B2',kind:'CONFLICT_DETECTED',observedAt:'2026-08-17T20:01:05-05:00',candidateRefs:['X','Y'],provenance:'USER_DEMO_LOCAL'}]},
  {id:'SYNC-C',recordRef:'REC-C',lot:'CAF-A1',recordType:'import',sourceClass:'IMPORTED_DEMO',state:'HUMAN_RESOLUTION_RECORDED',captureRecorded:true,queueRecorded:false,syncAttemptRecorded:false,ackRecorded:false,ackRef:'',conflictRecorded:true,resolutionRecorded:true,sourceVerified:false,calibratedMeasurement:false,automaticResolution:false,legacyUnlinked:false,events:[{id:'C1',kind:'CAPTURED_LOCAL',observedAt:'2026-08-17T20:02:00-05:00',provenance:'USER_DEMO_LOCAL'},{id:'C2',kind:'CONFLICT_DETECTED',observedAt:'2026-08-17T20:02:05-05:00',candidateRefs:['A','B'],provenance:'USER_DEMO_LOCAL'},{id:'C3',kind:'HUMAN_RESOLUTION_RECORDED',observedAt:'2026-08-17T20:03:00-05:00',resolution:'KEEP_BOTH',provenance:'USER_DEMO_LOCAL'}]}
];
const baseManifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FIN-LE-001',name:'Finca La Esperanza'}};
const context={window:{__SANA_CAPTURE_SYNC_LEDGER__:{cases:()=>structuredClone(liveCases)}},views:{reports:()=>'<footer class="footer"></footer>',dataroom:()=>'<footer class="footer"></footer>'},document:{addEventListener:()=>{},getElementById:()=>null},metric:()=>'',esc:v=>String(v),console};
vm.createContext(context);
vm.runInContext(snapshotCode,context,{filename:snapshotPath});
const snap=context.window.__SANA_REPORT_SNAPSHOT_CAPTURE_SYNC__;
assert(snap,'capture sync snapshot API missing');
const manifest=structuredClone(baseManifest);snap.enrichCaptureSync(manifest);
assert(manifest.captureSync,'manifest.captureSync missing');
assert.equal(manifest.captureSync.rowCount,3);
assert.equal(manifest.captureSync.queueCount,1);
assert.equal(manifest.captureSync.ackCount,0);
assert.equal(manifest.captureSync.openConflictCount,1);
assert.equal(manifest.captureSync.humanResolutionCount,1);
assert.equal(manifest.captureSync.automaticResolutionCount,0);
assert.equal(manifest.captureSync.rows[0].contentState,'CONTENT_MINIMIZED_NOT_COPIED');
assert(!('label' in manifest.captureSync.rows[0]),'snapshot must not copy record content label');
assert.match(manifest.captureSync.integrity,/CONTENT_MINIMIZED/);
assert.match(manifest.captureSync.integrity,/NO_LIVE_FALLBACK/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(baseManifest),createdAt:'2026-08-01'};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:structuredClone(manifest),createdAt:'2026-08-17'};
context.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[oldSnapshot,newSnapshot]};
context.window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'OLD',target:'NEW'})};
vm.runInContext(historyCode,context,{filename:historyPath});
const hist=context.window.__SANA_DATAROOM_CAPTURE_SYNC_HISTORY__;
assert(hist,'capture sync history API missing');
assert.equal(hist.state().state,'CAPTURED');
assert.equal(hist.diff(oldSnapshot,newSnapshot).state,'PARTIAL_GRANULARITY');
assert(!/__SANA_CAPTURE_SYNC_LEDGER__/.test(historyCode),'history must not use live capture sync ledger');
assert(!/storage\./.test(historyCode),'history must not use mutable storage');
assert.match(hist.integrity,/NO_LIVE_FALLBACK/);

const baseDd={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>newSnapshot,derive:snapshot=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:newSnapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
context.window.__SANA_DUE_DILIGENCE_GAPS__=baseDd;
vm.runInContext(gapsCode,context,{filename:gapsPath});
const dd=context.window.__SANA_DD_CAPTURE_SYNC_GAPS__;
assert(dd,'capture sync DD API missing');
assert.equal(dd.derive(newSnapshot).length,0,'pending server, no ACK, open conflict or human resolution must not be gaps by themselves');

const problematic=structuredClone(newSnapshot);
problematic.manifest.captureSync.rows.push({caseId:'LEGACY-Q',recordRef:'',lot:'RES-01',recordType:'legacy-queue',state:'PENDING_SERVER',captureRecorded:false,queueRecorded:true,syncAttemptRecorded:false,ackRecorded:false,ackRef:'',conflictRecorded:false,resolutionRecorded:false,sourceVerified:false,automaticResolution:false,legacyUnlinked:true,events:[{id:'Q1',kind:'QUEUED_LOCAL',observedAt:'2026-08-13'}]});
problematic.manifest.captureSync.rows.push({caseId:'BAD',recordRef:'REC-BAD',lot:'CAF-A1',recordType:'',state:'BAD',captureRecorded:false,queueRecorded:true,syncAttemptRecorded:true,ackRecorded:true,ackRef:'',conflictRecorded:false,resolutionRecorded:true,sourceVerified:true,automaticResolution:true,legacyUnlinked:false,events:[{id:'E1',kind:'',observedAt:''}]});
const issues=dd.derive(problematic);const text=issues.map(x=>x.condition).join(' | ');
assert.match(text,/legacy sin recordRef/);
assert.match(text,/Cola enlazada sin captura/);
assert.match(text,/Intento de sincronización sin captura/);
assert.match(text,/ACK explícito sin referencia/);
assert.match(text,/Resolución humana registrada sin conflicto/);
assert.match(text,/fuente verificada/);
assert.match(text,/resolución automática/);
assert.match(text,/sin tipo de registro/);
assert.match(text,/sin tipo/);
assert.match(text,/sin fecha\/hora/);
assert.match(dd.integrity,/PENDING_SERVER ≠ GAP/);
assert.match(dd.integrity,/NO_RECORD_ACK ≠ GAP/);
assert.match(dd.integrity,/CONFLICT_REVIEW_REQUIRED ≠ GAP/);

for(const code of [snapshotCode,historyCode,gapsCode]){assert(!/fetch\s*\(/.test(code));assert(!/productionExecutionAvailable\s*=\s*true/.test(code));assert(!/canonicalMutated\s*=\s*true/.test(code));}
console.log('SANA capture sync history v54 validation: OK');
