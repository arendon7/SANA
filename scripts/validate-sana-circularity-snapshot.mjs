import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const syncSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-circularity.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-circularity-history.js','utf8');

const cases=[
  {id:'CIR-1',lot:'LOT-1',material:'Residuo QA',openedAt:'2026-08-17',stageCoverage:{percent:100,covered:8,total:8},generation:[{id:'G-1'}],classification:[{id:'C-1'}],quantification:[{id:'Q-1',observedAt:'2026-08-17',quantity:50,unit:'kg',quantityBasis:'MEASURED_DEMO',method:'Pesaje QA',provenance:'MEASURED_DEMO'}],segregation:[{id:'S-1'}],plans:[{id:'P-1',plannedDestination:'Compost QA',plannedTreatment:'INTERNAL_COMPOSTING_DEMO',provenance:'HUMAN_PLAN_DEMO'}],executions:[{id:'X-1',observedAt:'2026-08-17',executionType:'INTERNAL_TREATMENT_INPUT',actualDestination:'Compost QA',handledQuantity:50,unit:'kg',receiverRef:'CMP-1',provenance:'EXECUTION_DEMO'}],evidence:[{id:'E-1',observedAt:'2026-08-17',evidenceRef:'EV-1',supports:['X-1','O-1'],unresolvedSupports:[],provenance:'EVIDENCE_DEMO'}],outcomes:[{id:'O-1',observedAt:'2026-08-18',outcomeClass:'RECOVERY_RECORDED_DEMO',recoveredQuantity:35,unit:'kg',provenance:'FOLLOW_UP_DEMO'}],quantities:{explicitGenerated:50,explicitHandled:50,explicitRecovered:35,units:['kg'],comparable:true,handledCoverage:100},semantics:{plannedButNotExecuted:false,recoveryDeclared:true,unresolvedEvidenceRefs:0}},
  {id:'CIR-2',lot:'LOT-2',material:'Empaque QA',openedAt:'2026-08-17',stageCoverage:{percent:63,covered:5,total:8},generation:[{id:'G-2'}],classification:[{id:'C-2'}],quantification:[{id:'Q-2',observedAt:'2026-08-17',quantity:10,unit:'kg',quantityBasis:'ESTIMATED_DEMO',method:'Estimación QA',provenance:'ESTIMATED_DEMO'}],segregation:[{id:'S-2'}],plans:[{id:'P-2',plannedDestination:'Gestor pendiente',plannedTreatment:'EXTERNAL_HANDOFF_PENDING',provenance:'HUMAN_PLAN_DEMO'}],executions:[],evidence:[],outcomes:[],quantities:{explicitGenerated:10,explicitHandled:0,explicitRecovered:0,units:['kg'],comparable:false,handledCoverage:null},semantics:{plannedButNotExecuted:true,recoveryDeclared:false,unresolvedEvidenceRefs:0}}
];
const legacy=[{id:'LEG-1',sourceId:'OLD-1',lot:'LOT-1',observedAt:'2026-08-01',summary:'Legacy',quantity:5,unit:'kg',destination:'Compostaje',semanticState:'LEGACY_CIRCULARITY_CAPTURE'}];

globalThis.window={__SANA_CIRCULARITY_LEDGER__:{cases:()=>cases,legacy:()=>legacy}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction='';
globalThis.queueMicrotask=fn=>fn();
vm.runInThisContext(syncSource,{filename:'sana-v3-report-snapshot-circularity.js'});
const sync=window.__SANA_REPORT_SNAPSHOT_CIRCULARITY__;
assert.ok(sync?.enrichCircularity);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};
sync.enrichCircularity(manifest);
assert.equal(manifest.circularity.caseCount,2);
assert.equal(manifest.circularity.legacyCount,1);
const row1=manifest.circularity.lots.flatMap(l=>l.cases).find(c=>c.caseId==='CIR-1');
const row2=manifest.circularity.lots.flatMap(l=>l.cases).find(c=>c.caseId==='CIR-2');
assert.equal(row1.generatedQuantity,50);
assert.equal(row1.handledQuantity,50);
assert.equal(row1.recoveredQuantity,35);
assert.equal(row1.executionEvidenceCount,1);
assert.equal(row1.recoveryEvidenceCount,1);
assert.equal(row1.unsupportedExecutionCount,0);
assert.equal(row1.unsupportedRecoveryCount,0);
assert.equal(row1.recoveredExceedsHandled,0);
assert.equal(row2.plannedButNotExecuted,true);
assert.equal(row2.executionCount,0,'planned destination must remain non-executed in snapshot');
assert.equal(row2.recoveredQuantity,0);
assert.match(manifest.circularity.integrity,/NO_PLAN_TO_EXECUTION_INFERENCE/);
assert.match(manifest.circularity.integrity,/NO_EXECUTION_TO_RECOVERY_INFERENCE/);
assert.match(manifest.circularity.integrity,/NO_CIRCULARITY_RATE_INFERENCE/);
assert.match(manifest.circularity.integrity,/NO_ENVIRONMENTAL_IMPACT_INFERENCE/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-18',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',circularity:manifest.circularity}};
globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[oldSnapshot,newSnapshot]},__SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'OLD',target:'NEW'})}};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-circularity-history.js'});
const history=window.__SANA_DATAROOM_CIRCULARITY_HISTORY__;
assert.ok(history);
assert.equal(history.state().state,'CAPTURED');
assert.equal(history.state().rows.length,2);
const partial=history.diff(oldSnapshot,newSnapshot);
assert.equal(partial.valid,true);
assert.equal(partial.state,'PARTIAL_GRANULARITY');
assert.match(partial.integrity,/CHANGE ≠ IMPROVEMENT/);
assert.match(partial.integrity,/VERIFIED_DISPOSITION/);
assert.match(partial.integrity,/CIRCULARITY_RATE/);
assert.match(partial.integrity,/ENVIRONMENTAL_IMPACT/);
assert.equal(historySource.includes('__SANA_CIRCULARITY_LEDGER__'),false,'history must not read live circularity ledger');
assert.equal(historySource.includes('storage.'),false);
assert.equal(historySource.includes('fetch('),false);

console.log('circularity snapshot history contract OK · additive capture · no live fallback · no plan/recovery/impact inference');
