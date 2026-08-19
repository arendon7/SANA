import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const syncSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-sync.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-health-history.js','utf8');
const cycleSource=fs.readFileSync('apps/control-web/public/sana-v3-cycle-health-provenance.js','utf8');

const v2Case={
  id:'SAN-V2-1',lot:'LOT-1',scope:'BIOTIC_RISK',openedAt:'2026-08-18',projectionVersion:'V2',
  stageCoverage:{percent:100,covered:6,total:6},chainCoverage:{percent:100,covered:8,total:8},
  events:[{},{},{},{},{},{},{},{}],recommendations:[{}],activityLinks:[{}],actions:[{}],evidence:[{}],followups:[{resultClass:'',effectivenessObserved:''}],results:[{resultClass:'CONDITION_CHANGED_OBSERVED',effectivenessObserved:'IMPROVEMENT_OBSERVED'}],
  semantics:{observedPresence:1,confirmedDiagnosis:1,efficacyObservations:1,explicitResultEfficacyObservations:1,embeddedActivityLinksV1:0,embeddedResultsV1:0,actionLinkIssues:0},
  latestFollowUp:{resultClass:'',effectivenessObserved:''},latestResult:{resultClass:'CONDITION_CHANGED_OBSERVED',effectivenessObserved:'IMPROVEMENT_OBSERVED'}
};
const legacy=[{id:'LEG-1',sourceId:'INC-1',lot:'LOT-1',date:'2026-08-10',summary:'Resumen legacy',severity:'Media',status:'Cerrado',semanticState:'DIAGNOSIS_NOT_INFERRED · TREATMENT_NOT_INFERRED · EFFICACY_NOT_INFERRED'}];

globalThis.window={__SANA_PHYTOSANITARY_LEDGER__:{projectionVersion:'V2',cases:()=>[v2Case],legacy:()=>legacy}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction='';
vm.runInThisContext(syncSource,{filename:'sana-v3-report-snapshot-sync.js'});
const sync=window.__SANA_REPORT_SNAPSHOT_SYNC__;
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};
sync.enrichHealth(manifest);
assert.equal(manifest.health.projectionVersion,'V2');
assert.equal(manifest.health.chainGranularity,'ADDITIVE_V2 · PHYTOSANITARY_CHAIN');
const captured=manifest.health.lots[0].cases[0];
assert.equal(captured.stageCoverage,100);
assert.equal(captured.chainCoverage,100);
assert.equal(captured.activityLinkEventCount,1);
assert.equal(captured.resultEventCount,1);
assert.equal(captured.embeddedActivityLinkCount,0);
assert.equal(captured.embeddedResultCount,0);
assert.equal(captured.latestResult,'','V1 compatibility field must not be populated from V2 RESULT');
assert.equal(captured.latestV2Result,'CONDITION_CHANGED_OBSERVED');
assert.equal(captured.latestV2Effect,'IMPROVEMENT_OBSERVED');
assert.match(manifest.health.integrity,/NO_V1_TO_V2_STAGE_PROMOTION/);

const oldHealth={lots:[{lotId:'LOT-1',cases:[{caseId:'SAN-V2-1',lot:'LOT-1',stageCoverage:100,eventCount:6,observedPresence:1,confirmedDiagnosis:1,recommendationCount:1,actionCount:1,evidenceCount:1,followUpCount:1,efficacyObservationCount:0,actionLinkIssues:0,latestResult:'SURVEILLANCE_CONTINUES',latestEffect:'NO_EFFICACY_ASSESSMENT',temporalState:'SNAPSHOT_CAPTURED_FROM_PHYTOSANITARY_LEDGER'}],legacy:[]}],caseCount:1,legacyCount:0,granularity:'ADDITIVE_V1 · PHYTOSANITARY_LEDGER'};
const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',health:oldHealth}};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-19',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',health:manifest.health}};
globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[oldSnapshot,newSnapshot]},__SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'OLD',target:'NEW'})}};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-health-history.js'});
const history=window.__SANA_DATAROOM_HEALTH_HISTORY__;
assert.equal(history.state().projectionVersion,'V2');
const delta=history.diff(oldSnapshot,newSnapshot);
assert.equal(delta.valid,true);
assert.equal(delta.state,'CAPTURED_BOTH');
assert.ok(delta.changes.some(c=>c.field==='Cobertura cadena V2 %'));
assert.ok(delta.changes.some(c=>c.field==='Vínculos Activity V2'));
assert.ok(delta.changes.some(c=>c.field==='Resultados V2'));
assert.match(delta.integrity,/V1_EMBEDDED ≠ V2_STAGE/);
assert.equal(historySource.includes('__SANA_PHYTOSANITARY_LEDGER__'),false,'history must remain snapshot-only');
assert.equal(historySource.includes('storage.'),false);
assert.equal(historySource.includes('fetch('),false);

const cycleCase={...v2Case,activityLinks:[{}],results:[{}]};
globalThis.window={__SANA_PHYTOSANITARY_LEDGER__:{forLot:lot=>lot==='LOT-1'?{explicit:[cycleCase],legacy:[]}:{explicit:[],legacy:[]}},__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-1',version:2,lot:'LOT-1'})}};
globalThis.DEMO={plans:[{id:'PL-1',version:2,lot:'LOT-1'}]};
globalThis.views={cycle:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(cycleSource,{filename:'sana-v3-cycle-health-provenance.js'});
const cycle=window.__SANA_CYCLE_HEALTH__.forPlan('PL-1');
assert.equal(cycle.valid,true);
assert.equal(cycle.explicit[0].stageCoverage,100);
assert.equal(cycle.explicit[0].chainCoverage,100);
assert.equal(cycle.explicit[0].activityLinks,1);
assert.equal(cycle.explicit[0].results,1);
assert.equal(cycle.explicit[0].latestV2Result,'CONDITION_CHANGED_OBSERVED');
assert.match(window.__SANA_CYCLE_HEALTH__.integrity,/ACTIVITY_LINK ≠ EXECUTION/);
assert.match(window.__SANA_CYCLE_HEALTH__.integrity,/FOLLOW_UP ≠ RESULT/);
assert.match(window.__SANA_CYCLE_HEALTH__.integrity,/V1_EMBEDDED ≠ V2_STAGE/);
assert.equal(cycleSource.includes('completeness='),false);
assert.equal(cycleSource.includes('readyForArchive='),false);
assert.equal(cycleSource.includes('storage.records.push'),false);
assert.equal(cycleSource.includes('fetch('),false);

console.log('phytosanitary v2 provenance OK · snapshot + history + cycle preserve V1/V2 boundaries without live fallback');
