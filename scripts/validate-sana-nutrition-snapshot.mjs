import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const syncSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-sync.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-nutrition-history.js','utf8');

const nutritionCases=[
  {id:'NUT-1',lot:'LOT-1',objective:'Aplicación QA',openedAt:'2026-08-17',stageCoverage:{percent:100,covered:6,total:6},events:[{},{},{},{},{},{}],programs:[{}],preflight:[{}],decisions:[{}],applications:[{id:'APP-1',observedAt:'2026-08-17',product:'Producto QA',itemId:'INV-1',appliedDose:'1 L/ha',quantityApplied:'2',quantityUnit:'L',activityId:'ACT-1',activityLink:{status:'LINKED'},inventoryRelation:{status:'LINKED'}}],evidence:[{}],responses:[{}],semantics:{approvedDecisions:1,deferredDecisions:0,relationIssues:0,causalClaims:0},latestResponse:{responseClass:'IMPROVEMENT_OBSERVED',causalAttribution:'NO_CAUSAL_ATTRIBUTION'}},
  {id:'NUT-2',lot:'LOT-2',objective:'Programa aplazado',openedAt:'2026-08-17',stageCoverage:{percent:50,covered:3,total:6},events:[{},{},{}],programs:[{}],preflight:[{}],decisions:[{}],applications:[],evidence:[],responses:[],semantics:{approvedDecisions:0,deferredDecisions:1,relationIssues:0,causalClaims:0},latestResponse:null}
];

globalThis.window={__SANA_NUTRITION_LEDGER__:{cases:()=>nutritionCases}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction='';
vm.runInThisContext(syncSource,{filename:'sana-v3-report-snapshot-sync.js'});
const sync=window.__SANA_REPORT_SNAPSHOT_SYNC__;
assert.ok(sync?.enrichNutrition);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};
sync.enrichNutrition(manifest);
assert.equal(manifest.nutrition.caseCount,2);
const applied=manifest.nutrition.lots.flatMap(l=>l.cases).find(c=>c.caseId==='NUT-1');
const deferred=manifest.nutrition.lots.flatMap(l=>l.cases).find(c=>c.caseId==='NUT-2');
assert.equal(applied.applicationCount,1);
assert.equal(applied.evidenceCount,1);
assert.equal(applied.applications[0].inventoryRelation,'LINKED');
assert.equal(applied.latestAttribution,'NO_CAUSAL_ATTRIBUTION');
assert.equal(deferred.deferredDecisionCount,1);
assert.equal(deferred.applicationCount,0,'deferred program must remain non-executed in snapshot');
assert.match(manifest.nutrition.integrity,/NO_LIVE_FALLBACK/);
assert.match(manifest.nutrition.integrity,/NO_PROGRAM_TO_APPLICATION_INFERENCE/);
assert.match(manifest.nutrition.integrity,/NO_INVENTORY_MOVEMENT_INFERENCE/);
assert.match(manifest.nutrition.integrity,/NO_CAUSAL_RESPONSE/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',nutrition:manifest.nutrition}};
globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[oldSnapshot,newSnapshot]},__SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'OLD',target:'NEW'})}};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-nutrition-history.js'});
const history=window.__SANA_DATAROOM_NUTRITION_HISTORY__;
assert.ok(history);
assert.equal(history.state().state,'CAPTURED');
assert.equal(history.state().rows.length,2);
const partial=history.diff(oldSnapshot,newSnapshot);
assert.equal(partial.valid,true);
assert.equal(partial.state,'PARTIAL_GRANULARITY');
assert.match(partial.integrity,/CHANGE ≠ IMPROVEMENT/);
assert.match(partial.integrity,/APPLICATION_CAUSALITY/);
assert.match(partial.integrity,/RESPONSE_CAUSALITY/);
assert.equal(historySource.includes('__SANA_NUTRITION_LEDGER__'),false,'history must not read live nutrition ledger');
assert.equal(historySource.includes('storage.'),false,'history must not read mutable local records');
assert.equal(historySource.includes('fetch('),false);
assert.equal(syncSource.includes('manifest.nutrition='),true);

console.log('nutrition snapshot history contract OK · additive capture · no live fallback · no program-to-application inference');
