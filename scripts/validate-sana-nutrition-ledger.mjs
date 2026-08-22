import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-nutrition-ledger.js','utf8');
const records=[
  {id:'NUT-L-OPEN',type:'nutrition-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:00:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'CASE_OPEN',caseId:'NUT-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',objective:'Aplicación local QA',detail:'Caso QA',author:'QA'}},
  {id:'NUT-L-PROG',type:'nutrition-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:01:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'PROGRAM',caseId:'NUT-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',product:'Producto QA',itemId:'INV-QA',plannedDose:'1 L/ha',detail:'Programa',author:'QA'}},
  {id:'NUT-L-PREF',type:'nutrition-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:02:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'PREFLIGHT',caseId:'NUT-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',preflightState:'CONDITIONS_REVIEWED',activityId:'ACT-QA',detail:'Preflight',author:'QA'}},
  {id:'NUT-L-DEC',type:'nutrition-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:03:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'DECISION',caseId:'NUT-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',decision:'APPROVED_HUMAN_DEMO',detail:'Decisión humana',author:'QA'}},
  {id:'NUT-L-APP',type:'nutrition-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:04:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'APPLICATION',caseId:'NUT-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',activityId:'ACT-QA',product:'Producto QA',itemId:'INV-QA',appliedDose:'1 L/ha',quantityApplied:'2',quantityUnit:'L',detail:'Aplicación explícita',author:'QA'}},
  {id:'NUT-L-EV',type:'nutrition-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:05:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'EVIDENCE',caseId:'NUT-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',evidenceRef:'EV-QA',detail:'Evidencia',author:'QA'}},
  {id:'NUT-L-RSP',type:'nutrition-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:06:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'RESPONSE',caseId:'NUT-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',responseClass:'IMPROVEMENT_OBSERVED',causalAttribution:'NO_CAUSAL_ATTRIBUTION',detail:'Mejoría observada sin atribución',author:'QA'}},
  {id:'NUT-BAD-OPEN',type:'nutrition-ledger-event',lot:'LOT-2',createdAt:'2026-08-17T09:00:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'CASE_OPEN',caseId:'NUT-LOCAL-BAD',lot:'LOT-2',observedAt:'2026-08-17',objective:'QA relación faltante',detail:'Caso',author:'QA'}},
  {id:'NUT-BAD-APP',type:'nutrition-ledger-event',lot:'LOT-2',createdAt:'2026-08-17T09:01:00Z',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',eventKind:'APPLICATION',caseId:'NUT-LOCAL-BAD',lot:'LOT-2',observedAt:'2026-08-17',activityId:'ACT-BAD',itemId:'INV-QA',product:'Producto QA',appliedDose:'1 L/ha',detail:'Aplicación sin movimiento',author:'QA'}}
];

globalThis.window={
  __SANA_PLAN_FIELD_WORKFLOW__:{
    findActivity:id=>id==='ACT-QA'?{id,lot:'LOT-1',title:'Aplicación QA'}:id==='ACT-BAD'?{id,lot:'LOT-2',title:'Aplicación QA 2'}:id==='T-101'?{id,lot:'AGU-A2',title:'Verificar humedad'}:null,
    forLot:()=>[]
  },
  __SANA_INVENTORY__:{
    forActivity:id=>id==='ACT-QA'?[{id:'MOV-1',activityId:'ACT-QA',itemId:'INV-QA',movement:'SALIDA',qty:'2'}]:[]
  }
};
globalThis.storage={records};
globalThis.identity={displayName:'QA'};
globalThis.DEMO={lots:[{id:'LOT-1',crop:'Café'},{id:'LOT-2',crop:'Cacao'},{id:'CAF-A1',crop:'Café'},{id:'AGU-A2',crop:'Aguacate'}],inventory:[{id:'INV-QA',name:'Producto QA',group:'Agroinsumo'}]};
globalThis.views={nutrition:()=>'<footer class="footer-note"></footer>',passport:()=>'<footer class="footer"></footer>'};
globalThis.localStorage={getItem:()=> 'LOT-1'};
globalThis.document={addEventListener:()=>{}};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
globalThis.openModal=()=>{};

vm.runInThisContext(source,{filename:'sana-v3-nutrition-ledger.js'});
const api=window.__SANA_NUTRITION_LEDGER__;
assert.ok(api,'nutrition ledger API must exist');
assert.equal(api.schema,'SANA_NUTRITION_LEDGER_V1');

const caf=api.forCase('NUT-CAF-001');
assert.ok(caf);
assert.equal(caf.stageCoverage.percent,100);
assert.equal(caf.programs.length,1);
assert.equal(caf.applications.length,1);
assert.equal(caf.evidence.length,1);
assert.equal(caf.responses.length,1);
assert.equal(caf.latestResponse.causalAttribution,'NO_CAUSAL_ATTRIBUTION');
assert.equal(caf.applications[0].inventoryRelation.status,'NO_EXPLICIT_RELATION','historical application without explicit activity must not fabricate inventory movement');

const agu=api.forCase('NUT-AGU-001');
assert.ok(agu);
assert.equal(agu.programs.length,1);
assert.equal(agu.preflight.length,1);
assert.equal(agu.decisions.length,1);
assert.equal(agu.semantics.deferredDecisions,1);
assert.equal(agu.applications.length,0,'planned fertigation must not become an application');
assert.equal(agu.stageCoverage.covered,3);

const local=api.forCase('NUT-LOCAL-1');
assert.equal(local.stageCoverage.percent,100);
assert.equal(local.applications[0].activityLink.status,'LINKED');
assert.equal(local.applications[0].inventoryRelation.status,'LINKED');
assert.equal(local.semantics.relationIssues,0);
assert.equal(local.semantics.causalClaims,0);

const bad=api.forCase('NUT-LOCAL-BAD');
assert.equal(bad.applications[0].activityLink.status,'LINKED');
assert.equal(bad.applications[0].inventoryRelation.status,'MOVEMENT_NOT_CAPTURED');
assert.equal(bad.semantics.relationIssues,1);

assert.match(api.integrity,/PROGRAM ≠ APPLICATION/);
assert.match(api.integrity,/PREFLIGHT ≠ AUTHORIZATION/);
assert.match(api.integrity,/HUMAN_DECISION_REQUIRED/);
assert.match(api.integrity,/INVENTORY_MOVEMENT_EXPLICIT_ONLY/);
assert.match(api.integrity,/RESPONSE ≠ CAUSAL_EFFECT/);
assert.equal(source.includes('storage.records.push'),false,'ledger must not directly mutate storage');
assert.equal(source.includes('fetch('),false,'ledger must not perform external I/O');
assert.equal(source.includes('productionExecutionAvailable=true'),false);
assert.equal(source.includes('canonicalMutated=true'),false);

console.log('nutrition ledger contract OK · program != application · inventory relation explicit-only · response non-causal');
