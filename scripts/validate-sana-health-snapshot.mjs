import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const syncSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-sync.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-health-history.js','utf8');

const healthCases=[{id:'SAN-1',lot:'LOT-1',scope:'BIOTIC_RISK',openedAt:'2026-08-16',stageCoverage:{percent:100,covered:6,total:6},events:[{},{},{}],semantics:{observedPresence:1,confirmedDiagnosis:1,efficacyObservations:0,actionLinkIssues:0},recommendations:[{}],actions:[{}],evidence:[{}],followups:[{resultClass:'SURVEILLANCE_CONTINUES',effectivenessObserved:'NO_EFFICACY_ASSESSMENT'}],latestFollowUp:{resultClass:'SURVEILLANCE_CONTINUES',effectivenessObserved:'NO_EFFICACY_ASSESSMENT'}}];
const legacy=[{id:'LEG-1',sourceId:'INC-1',lot:'LOT-1',date:'2026-08-10',summary:'Resumen legacy',severity:'Media',status:'Cerrado',semanticState:'DIAGNOSIS_NOT_INFERRED · TREATMENT_NOT_INFERRED · EFFICACY_NOT_INFERRED'}];

globalThis.window={__SANA_PHYTOSANITARY_LEDGER__:{cases:()=>healthCases,legacy:()=>legacy}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction='';
vm.runInThisContext(syncSource,{filename:'sana-v3-report-snapshot-sync.js'});
const sync=window.__SANA_REPORT_SNAPSHOT_SYNC__;
assert.ok(sync?.enrichHealth);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};
sync.enrichHealth(manifest);
assert.equal(manifest.health.caseCount,1);
assert.equal(manifest.health.legacyCount,1);
assert.equal(manifest.health.lots[0].cases[0].observedPresence,1);
assert.equal(manifest.health.lots[0].cases[0].confirmedDiagnosis,1);
assert.equal(manifest.health.lots[0].cases[0].latestEffect,'NO_EFFICACY_ASSESSMENT');
assert.match(manifest.health.integrity,/NO_LIVE_FALLBACK/);
assert.match(manifest.health.integrity,/NO_RETROACTIVE_DIAGNOSIS/);
assert.match(manifest.health.integrity,/NO_TREATMENT_OR_EFFICACY_INFERENCE/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',health:manifest.health}};
globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[oldSnapshot,newSnapshot]},__SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'OLD',target:'NEW'})}};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-health-history.js'});
const history=window.__SANA_DATAROOM_HEALTH_HISTORY__;
assert.ok(history);
assert.equal(history.state().state,'CAPTURED');
assert.equal(history.state().rows.length,1);
const partial=history.diff(oldSnapshot,newSnapshot);
assert.equal(partial.valid,true);
assert.equal(partial.state,'PARTIAL_GRANULARITY');
assert.match(partial.integrity,/CHANGE ≠ IMPROVEMENT/);
assert.match(partial.integrity,/TREATMENT_EFFICACY/);
assert.equal(historySource.includes('__SANA_PHYTOSANITARY_LEDGER__'),false,'history must not read live health ledger');
assert.equal(historySource.includes('storage.'),false,'history must not read mutable local records');
assert.equal(historySource.includes('fetch('),false);
assert.equal(syncSource.includes('manifest.health='),true);

console.log('health snapshot history contract OK · additive capture · no live fallback · no retroactive diagnosis');
