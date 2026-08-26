import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-health-lifecycle.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-health-lifecycle.js','utf8');
const cycleSource=fs.readFileSync('apps/control-web/public/sana-v3-cycle-health-lifecycle.js','utf8');
const gapsSource=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-health-lifecycle-gaps.js','utf8');

const closedCase={id:'SAN-CLOSED',lot:'LOT-1',caseState:'CLOSED_HUMAN',chainCoverage:{percent:100},closures:[{id:'CLOSE-1'}],closureIssues:0,closedAt:'2026-08-20',latestClosure:{id:'CLOSE-1',eventKind:'CASE_CLOSE',observedAt:'2026-08-20',basisEventId:'RESULT-1',closureClass:'MONITORING_COMPLETE',provenance:'HUMAN_CASE_CLOSURE_DEMO'},closureRows:[{event:{id:'CLOSE-1',eventKind:'CASE_CLOSE',observedAt:'2026-08-20',basisEventId:'RESULT-1',closureClass:'MONITORING_COMPLETE',provenance:'HUMAN_CASE_CLOSURE_DEMO'},reference:{expectedKind:'RESULT',status:'LINKED',target:{id:'RESULT-1',eventKind:'RESULT',caseId:'SAN-CLOSED'}}}]};
const openCase={id:'SAN-OPEN',lot:'LOT-1',caseState:'OPEN',chainCoverage:{percent:100},closures:[],closureIssues:0,closedAt:null,latestClosure:null,closureRows:[]};
const badCase={id:'SAN-BAD-CLOSE',lot:'LOT-1',caseState:'OPEN',chainCoverage:{percent:100},closures:[{id:'CLOSE-BAD'}],closureIssues:1,closedAt:null,latestClosure:null,closureRows:[{event:{id:'CLOSE-BAD',eventKind:'CASE_CLOSE',observedAt:'2026-08-20',basisEventId:'FIND-1',closureClass:'NO_FURTHER_ACTION_CURRENTLY',provenance:'HUMAN_CASE_CLOSURE_DEMO'},reference:{expectedKind:'RESULT',status:'KIND_MISMATCH',target:{id:'FIND-1',eventKind:'FINDING',caseId:'SAN-BAD-CLOSE'}}}]};
const liveCases=[closedCase,openCase,badCase];

function baseManifest(){return {schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',health:{lots:[{lotId:'LOT-1',cases:[{caseId:'SAN-CLOSED',lot:'LOT-1'},{caseId:'SAN-OPEN',lot:'LOT-1'},{caseId:'SAN-BAD-CLOSE',lot:'LOT-1'}],legacy:[]}],caseCount:3,legacyCount:0,granularity:'ADDITIVE_V1 · PHYTOSANITARY_LEDGER'}}}

globalThis.window={__SANA_PHYTOSANITARY_LEDGER__:{cases:()=>liveCases}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction='';
globalThis.queueMicrotask=fn=>fn();
vm.runInThisContext(snapshotSource,{filename:'sana-v3-report-snapshot-health-lifecycle.js'});
const snapshotApi=window.__SANA_REPORT_SNAPSHOT_HEALTH_LIFECYCLE__;
const targetManifest=baseManifest();snapshotApi.enrichLifecycle(targetManifest);
assert.equal(targetManifest.health.lifecycleGranularity,'ADDITIVE_V2 · HUMAN_CASE_LIFECYCLE');
assert.equal(targetManifest.health.closedCaseCount,1);
assert.equal(targetManifest.health.lifecycleIssueCount,1);
const targetRows=targetManifest.health.lots[0].cases;
const closed=targetRows.find(r=>r.caseId==='SAN-CLOSED');const open=targetRows.find(r=>r.caseId==='SAN-OPEN');const bad=targetRows.find(r=>r.caseId==='SAN-BAD-CLOSE');
assert.equal(closed.caseState,'CLOSED_HUMAN');assert.equal(closed.closureCount,1);assert.equal(closed.closureIssueCount,0);assert.equal(closed.latestClosureBasisResultId,'RESULT-1');assert.equal(closed.closureRows[0].status,'LINKED');
assert.equal(open.caseState,'OPEN');assert.equal(open.closureCount,0);assert.equal(open.closureIssueCount,0);
assert.equal(bad.caseState,'OPEN');assert.equal(bad.closureCount,1);assert.equal(bad.closureIssueCount,1);assert.equal(bad.closureRows[0].status,'KIND_MISMATCH');
assert.match(targetManifest.health.integrity,/NO_RETROACTIVE_CLOSURE_FILL/);assert.match(snapshotApi.integrity,/CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED/);

const baseManifestLifecycle=structuredClone(targetManifest);const baseClosed=baseManifestLifecycle.health.lots[0].cases.find(r=>r.caseId==='SAN-CLOSED');baseClosed.caseState='OPEN';baseClosed.closureCount=0;baseClosed.closureIssueCount=0;baseClosed.closedAt='';baseClosed.latestClosureEventId='';baseClosed.latestClosureClass='';baseClosed.latestClosureBasisResultId='';baseClosed.closureRows=[];baseManifestLifecycle.health.closedCaseCount=0;
const snapA={id:'SNAP-A',reportType:'RPT-DD',cutoff:'2026-08-19',manifest:baseManifestLifecycle};const snapB={id:'SNAP-B',reportType:'RPT-DD',cutoff:'2026-08-20',manifest:targetManifest};
globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[snapA,snapB]},__SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'SNAP-A',target:'SNAP-B'})}};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};globalThis.esc=v=>String(v??'');globalThis.metric=()=>'';
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-health-lifecycle.js'});
const history=window.__SANA_DATAROOM_HEALTH_LIFECYCLE__;assert.equal(history.state().state,'CAPTURED');const diff=history.diff(snapA,snapB);assert.equal(diff.valid,true);assert.equal(diff.state,'CAPTURED_BOTH');assert.ok(diff.changes.some(c=>c.field==='Estado humano del caso'));assert.ok(diff.changes.some(c=>c.field==='RESULT referenciado por cierre'));assert.match(diff.integrity,/CASE_STATE_CHANGE ≠ CONDITION_CHANGE/);assert.equal(historySource.includes('__SANA_PHYTOSANITARY_LEDGER__'),false);assert.equal(historySource.includes('storage.'),false);

const liveForCycle=[closedCase,openCase,badCase];globalThis.window={__SANA_PHYTOSANITARY_LEDGER__:{forLot:lot=>lot==='LOT-1'?{explicit:liveForCycle,legacy:[]}:{explicit:[],legacy:[]}},__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-1',version:3,lot:'LOT-1'})}};globalThis.DEMO={plans:[{id:'PL-1',version:3,lot:'LOT-1'}]};globalThis.views={cycle:()=>'<footer class="footer"></footer>'};globalThis.esc=v=>String(v??'');globalThis.metric=()=>'';
vm.runInThisContext(cycleSource,{filename:'sana-v3-cycle-health-lifecycle.js'});const cycle=window.__SANA_CYCLE_HEALTH_LIFECYCLE__.forPlan('PL-1');assert.equal(cycle.valid,true);assert.equal(cycle.rows.find(r=>r.caseId==='SAN-CLOSED').caseState,'CLOSED_HUMAN');assert.equal(cycle.rows.find(r=>r.caseId==='SAN-BAD-CLOSE').closureIssues,1);assert.match(cycle.integrity,/CASE_CLOSURE ≠ CYCLE_GATE/);assert.equal(cycleSource.includes('completeness='),false);assert.equal(cycleSource.includes('readyForArchive='),false);assert.equal(cycleSource.includes('storage.records.push'),false);assert.equal(cycleSource.includes('fetch('),false);

globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snapB,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]}),current:()=>({valid:true,snapshot:snapB,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]})}};
vm.runInThisContext(gapsSource,{filename:'sana-v3-due-diligence-health-lifecycle-gaps.js'});const gapsApi=window.__SANA_DD_HEALTH_LIFECYCLE_GAPS__;const lifecycleGaps=gapsApi.derive(snapB);assert.equal(lifecycleGaps.filter(g=>g.entity.includes('SAN-CLOSED')).length,0,'valid human closure must not be a DD gap');assert.equal(lifecycleGaps.filter(g=>g.entity.includes('SAN-OPEN')).length,0,'open case must not be a DD gap by itself');assert.ok(lifecycleGaps.some(g=>g.entity.includes('SAN-BAD-CLOSE')&&g.id.includes('case-lifecycle')),'malformed closure reference must be a documentary gap');assert.ok(lifecycleGaps.every(g=>g.severity==='MEDIA'));
const inconsistent=structuredClone(snapB);const inconsistentClosed=inconsistent.manifest.health.lots[0].cases.find(r=>r.caseId==='SAN-CLOSED');inconsistentClosed.caseState='CLOSED_HUMAN';inconsistentClosed.closureCount=0;inconsistentClosed.latestClosureBasisResultId='';const inconsistentGaps=gapsApi.derive(inconsistent);assert.ok(inconsistentGaps.some(g=>g.id.includes('closed-without-closure')));assert.match(gapsApi.integrity,/OPEN_CASE ≠ GAP/);assert.match(gapsApi.integrity,/CLOSED_HUMAN ≠ RESOLVED/);assert.equal(gapsSource.includes('__SANA_PHYTOSANITARY_LEDGER__'),false);assert.equal(gapsSource.includes('storage.'),false);assert.equal(gapsSource.includes('creditApproved'),false);assert.equal(gapsSource.includes('investmentApproved'),false);

console.log('health lifecycle provenance OK · snapshot-only history · cycle non-weighted · open case is not a DD gap · human closure never implies resolution or efficacy');
