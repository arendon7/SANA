import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const syncSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-sync.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-health-history.js','utf8');
const cycleSource=fs.readFileSync('apps/control-web/public/sana-v3-cycle-health-provenance.js','utf8');
const gapsSource=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-health-gaps.js','utf8');

const refRows=['FINDING','RECOMMENDATION','ACTIVITY_LINK','ACTION','EVIDENCE','FOLLOW_UP','RESULT'].map((kind,i)=>({event:{id:`EV-${i+2}`,eventKind:kind,basisEventId:`EV-${i+1}`},reference:{expectedKind:i===0?'OBSERVATION':['FINDING','RECOMMENDATION','ACTIVITY_LINK','ACTION','EVIDENCE','FOLLOW_UP'][i-1],status:'LINKED',target:{id:`EV-${i+1}`,eventKind:i===0?'OBSERVATION':['FINDING','RECOMMENDATION','ACTIVITY_LINK','ACTION','EVIDENCE','FOLLOW_UP'][i-1],caseId:'SAN-REF'}}}));
const healthCase={
  id:'SAN-REF',lot:'LOT-1',scope:'BIOTIC_RISK',openedAt:'2026-08-18',projectionVersion:'V2',
  stageCoverage:{percent:100,covered:6,total:6},chainCoverage:{percent:100,covered:8,total:8},referenceCoverage:{percent:100,linked:7,total:7},referenceIssues:0,referenceRows:refRows,
  events:new Array(8).fill({}),recommendations:[{}],activityLinks:[{}],actions:[{}],evidence:[{}],followups:[{}],results:[{resultClass:'CONDITION_CHANGED_OBSERVED',effectivenessObserved:'IMPROVEMENT_OBSERVED'}],
  semantics:{observedPresence:1,confirmedDiagnosis:1,efficacyObservations:1,explicitResultEfficacyObservations:1,embeddedActivityLinksV1:0,embeddedResultsV1:0,actionLinkIssues:0,referenceIssues:0},latestFollowUp:{},latestResult:{resultClass:'CONDITION_CHANGED_OBSERVED',effectivenessObserved:'IMPROVEMENT_OBSERVED'}
};
const legacy=[];

globalThis.window={__SANA_PHYTOSANITARY_LEDGER__:{projectionVersion:'V2',cases:()=>[healthCase],legacy:()=>legacy}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction='';
vm.runInThisContext(syncSource,{filename:'sana-v3-report-snapshot-sync.js'});
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};
window.__SANA_REPORT_SNAPSHOT_SYNC__.enrichHealth(manifest);
assert.equal(manifest.health.referenceGranularity,'ADDITIVE_V2 · EXPLICIT_PREDECESSOR_REFERENCES');
const captured=manifest.health.lots[0].cases[0];
assert.equal(captured.referenceCoverage,100);
assert.equal(captured.referenceLinkedCount,7);
assert.equal(captured.referenceExpectedCount,7);
assert.equal(captured.referenceIssueCount,0);
assert.equal(captured.referenceRows.length,7);
assert.equal(captured.referenceRows[0].eventKind,'FINDING');
assert.equal(captured.referenceRows[0].expectedKind,'OBSERVATION');
assert.equal(captured.referenceRows[0].status,'LINKED');
assert.match(manifest.health.integrity,/NO_RETROACTIVE_REFERENCE_FILL/);
assert.match(captured.integrity,/REFERENCE ≠ CAUSALITY/);

const oldHealth={lots:[{lotId:'LOT-1',cases:[{...captured,referenceCoverage:null,referenceLinkedCount:0,referenceExpectedCount:0,referenceIssueCount:0,referenceRows:[]}],legacy:[]}],caseCount:1,legacyCount:0,granularity:'ADDITIVE_V1 · PHYTOSANITARY_LEDGER',chainGranularity:'ADDITIVE_V2 · PHYTOSANITARY_CHAIN'};
const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-18',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',health:oldHealth}};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-19',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',health:manifest.health}};
globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[oldSnapshot,newSnapshot]},__SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'OLD',target:'NEW'})}};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-health-history.js'});
const history=window.__SANA_DATAROOM_HEALTH_HISTORY__;
assert.equal(history.state().referenceGranularity,'ADDITIVE_V2 · EXPLICIT_PREDECESSOR_REFERENCES');
const delta=history.diff(oldSnapshot,newSnapshot);
assert.ok(delta.changes.some(c=>c.field==='Cobertura referencias V2 %'));
assert.ok(delta.changes.some(c=>c.field==='Referencias V2 enlazadas'));
assert.ok(delta.changes.some(c=>c.field==='Referencias V2 esperadas'));
assert.match(delta.integrity,/REFERENCE ≠ CAUSALITY/);
assert.equal(historySource.includes('__SANA_PHYTOSANITARY_LEDGER__'),false);
assert.equal(historySource.includes('storage.'),false);

const cycleCase={...healthCase};
globalThis.window={__SANA_PHYTOSANITARY_LEDGER__:{forLot:()=>({explicit:[cycleCase],legacy:[]})},__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-1',version:2,lot:'LOT-1'})}};
globalThis.DEMO={plans:[{id:'PL-1',version:2,lot:'LOT-1'}]};
globalThis.views={cycle:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(cycleSource,{filename:'sana-v3-cycle-health-provenance.js'});
const cycle=window.__SANA_CYCLE_HEALTH__.forPlan('PL-1');
assert.equal(cycle.explicit[0].referenceCoverage,100);
assert.equal(cycle.explicit[0].referenceLinkedCount,7);
assert.equal(cycle.explicit[0].referenceExpectedCount,7);
assert.equal(cycle.explicit[0].referenceIssues,0);
assert.match(window.__SANA_CYCLE_HEALTH__.integrity,/CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE/);
assert.match(window.__SANA_CYCLE_HEALTH__.integrity,/REFERENCE ≠ CAUSALITY/);
assert.equal(cycleSource.includes('completeness='),false);
assert.equal(cycleSource.includes('readyForArchive='),false);

const badSnapshot={id:'BAD',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},health:{lots:[{lotId:'LOT-1',cases:[{...captured,caseId:'SAN-BAD-REF',referenceCoverage:71,referenceLinkedCount:5,referenceExpectedCount:7,referenceIssueCount:2,referenceRows:[{eventId:'EV-6',eventKind:'FOLLOW_UP',basisEventId:'BAD',expectedKind:'EVIDENCE',status:'KIND_MISMATCH'},{eventId:'EV-7',eventKind:'RESULT',basisEventId:'MISSING',expectedKind:'FOLLOW_UP',status:'MISSING_TARGET'}]}],legacy:[]}]}}};
globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>badSnapshot,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]}),current:()=>({valid:true,snapshot:badSnapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(gapsSource,{filename:'sana-v3-due-diligence-health-gaps.js'});
const gapApi=window.__SANA_DD_HEALTH_GAPS__;
const refs=gapApi.referenceState(badSnapshot.manifest.health.lots[0].cases[0]);
assert.equal(refs.captured,true);
assert.equal(refs.expected,7);
assert.equal(refs.linked,5);
assert.equal(refs.issues,2);
const refGaps=gapApi.derive(badSnapshot).filter(g=>g.id.includes('predecessor-reference'));
assert.equal(refGaps.length,1);
assert.equal(refGaps[0].severity,'MEDIA');
assert.match(refGaps[0].detail,/KIND_MISMATCH/);
assert.match(refGaps[0].detail,/MISSING_TARGET/);
assert.match(refGaps[0].detail,/REFERENCE ≠ CAUSALITY/);
assert.equal(gapsSource.includes('__SANA_PHYTOSANITARY_LEDGER__'),false);
assert.equal(gapsSource.includes('storage.'),false);
assert.equal(gapsSource.includes('creditApproved'),false);
assert.equal(gapsSource.includes('investmentApproved'),false);

console.log('health reference provenance OK · snapshot + Data Room + Cycle + DD preserve explicit predecessor integrity without causal inference');
