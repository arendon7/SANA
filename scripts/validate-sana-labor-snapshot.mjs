import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-labor.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-labor-history.js','utf8');

globalThis.window={__SANA_LABOR_LEDGER__:{cases:()=>[
  {id:'L1',personRef:'P-SECRET',personLabel:'Nombre Secreto',role:'Operario',lot:'LOT-1',activityId:'T-1',assignments:[{}],attendance:[],worked:[{}],results:[{}],evidence:[{}],rates:[],costs:[],payments:[],hours:4,declaredCost:0,costUnit:'',semantics:{paymentCaptured:0,unsupportedWorked:[],unresolvedCostBasis:[]},events:[{id:'W1',kind:'WORKED_TIME',observedAt:'2026-08-17T08:00',lot:'LOT-1',activityId:'T-1',role:'Operario',hours:4,method:'Registro',owner:'Nombre Secreto',provenance:'DEMO'},{id:'E1',kind:'EVIDENCE',observedAt:'2026-08-17T12:00',lot:'LOT-1',activityId:'T-1',role:'Operario',evidenceRef:'EV-1',supports:['W1'],owner:'Nombre Secreto',provenance:'DEMO'}]},
  {id:'L2',personRef:'P2',personLabel:'Otra Persona',role:'Agrónoma',lot:'LOT-2',activityId:'T-2',assignments:[],attendance:[],worked:[{}],results:[],evidence:[],rates:[{}],costs:[{}],payments:[{paymentState:'NOT_CAPTURED'}],hours:2,declaredCost:60,costUnit:'kCOP',semantics:{paymentCaptured:0,unsupportedWorked:['W2'],unresolvedCostBasis:[]},events:[{id:'W2',kind:'WORKED_TIME',observedAt:'2026-08-17T09:00',lot:'LOT-2',activityId:'T-2',role:'Agrónoma',hours:2,owner:'Otra Persona',provenance:'DEMO'},{id:'C2',kind:'LABOR_COST',observedAt:'2026-08-17T11:00',lot:'LOT-2',activityId:'T-2',role:'Agrónoma',amount:60,currencyUnit:'kCOP',basisRefs:['W2'],costRef:'COST-2',owner:'Admin Nombre',provenance:'DEMO'},{id:'P2',kind:'PAYMENT_STATUS',observedAt:'2026-08-17T11:05',lot:'LOT-2',activityId:'T-2',role:'Agrónoma',paymentState:'NOT_CAPTURED',owner:'Admin Nombre',provenance:'DEMO'}]}
]}};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction=null;
globalThis.queueMicrotask=fn=>fn();
vm.runInThisContext(snapshotSource,{filename:'sana-v3-report-snapshot-labor.js'});
const api=window.__SANA_REPORT_SNAPSHOT_LABOR__;
assert.ok(api);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F1'}};
api.enrichLabor(manifest);
assert.ok(manifest.labor);
assert.equal(manifest.labor.caseCount,2);
assert.equal(manifest.labor.workedHours,6);
assert.equal(manifest.labor.paymentCapturedCount,0);
assert.equal(manifest.labor.privacyLeakCount,0);
const serialized=JSON.stringify(manifest.labor);
for(const forbidden of ['Nombre Secreto','Otra Persona','Admin Nombre','P-SECRET','"personLabel"','"personRef"','"owner"'])assert.equal(serialized.includes(forbidden),false,forbidden);
assert.equal(manifest.labor.cases[0].privacyState,'IDENTITY_REDACTED');
assert.match(manifest.labor.integrity,/NO_IDENTITY_FIELDS/);
assert.match(manifest.labor.integrity,/NO_HR_SCORING/);
assert.equal(snapshotSource.includes('fetch('),false);

const old={id:'S1',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};
const current={id:'S2',reportType:'RPT-DD',cutoff:'2026-08-17',manifest};
window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[old,current]};
window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'S1',target:'S2'})};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=(a,b,c)=>`${a}:${b}:${c}`;
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-labor-history.js'});
const hist=window.__SANA_DATAROOM_LABOR_HISTORY__;
assert.ok(hist);
assert.equal(hist.state().state,'CAPTURED');
const partial=hist.diff(old,current);
assert.equal(partial.state,'PARTIAL_GRANULARITY');
assert.match(partial.integrity,/CHANGE ≠ IMPROVEMENT/);
assert.match(partial.integrity,/PERFORMANCE_RATING/);
assert.equal(historySource.includes('__SANA_LABOR_LEDGER__'),false,'history must be snapshot-only');
assert.equal(historySource.includes('storage.'),false);
assert.equal(historySource.includes('personLabel'),false,'history code must not depend on worker names');
assert.equal(historySource.includes('personRef'),false,'history code must not depend on worker ids');
console.log('labor snapshot/history contract OK · identity redacted, snapshot-only, no performance inference');
