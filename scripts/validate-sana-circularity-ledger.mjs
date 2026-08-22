import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-circularity-ledger.js','utf8');
const records=[
  {id:'CIR-L-OPEN',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:00:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'CASE_OPEN',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',material:'Residuo QA',detail:'Caso QA',author:'QA'}},
  {id:'CIR-L-GEN',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:01:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'GENERATION',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',material:'Residuo QA',sourceActivity:'Actividad QA',generationClass:'ORGANIC_DEMO',detail:'Generado',author:'QA'}},
  {id:'CIR-L-CLS',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:02:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'CLASSIFICATION',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',classification:'ORGANIC_DEMO',classificationAuthority:'INTERNAL_DEMO',detail:'Clasificado',author:'QA'}},
  {id:'CIR-L-QTY',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:03:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'QUANTIFICATION',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',quantity:'50',unit:'kg',quantityBasis:'MEASURED_DEMO',method:'Pesaje QA',detail:'Cuantificado',author:'QA'}},
  {id:'CIR-L-SEG',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:04:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'SEGREGATION',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',storage:'Zona QA',segregationState:'SEGREGATED_DEMO',detail:'Segregado',author:'QA'}},
  {id:'CIR-L-PLAN',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:05:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'DESTINATION_PLAN',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',plannedDestination:'Compost QA',plannedTreatment:'INTERNAL_COMPOSTING_DEMO',detail:'Plan',author:'QA'}},
  {id:'CIR-L-EXEC',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:06:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'EXECUTION',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',executionType:'INTERNAL_TREATMENT_INPUT',actualDestination:'Compost QA',handledQuantity:'50',unit:'kg',receiverRef:'QA-1',detail:'Ingreso a tratamiento',author:'QA'}},
  {id:'CIR-L-EV',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:07:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'EVIDENCE',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',evidenceRef:'EV-QA',supports:'CIR-L-EXEC',detail:'Evidencia',author:'QA'}},
  {id:'CIR-L-OUT',type:'circularity-ledger-event',lot:'LOT-1',createdAt:'2026-08-17T08:08:00Z',values:{circularitySchema:'SANA_CIRCULARITY_LEDGER_V1',eventKind:'OUTCOME',caseId:'CIR-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',outcomeClass:'RECOVERY_RECORDED_DEMO',recoveredQuantity:'35',unit:'kg',detail:'Recuperación explícita DEMO',author:'QA'}},
  {id:'OLD-CIR',type:'circularity',lot:'LOT-1',createdAt:'2026-08-10T10:00:00Z',values:{lot:'LOT-1',quantity:'10',unit:'kg',destination:'Compostaje',detail:'Captura previa'}}
];

globalThis.window={};
globalThis.storage={records};
globalThis.identity={displayName:'QA'};
globalThis.DEMO={lots:[{id:'LOT-1',crop:'Café'},{id:'CAF-A1',crop:'Café'},{id:'AGU-A2',crop:'Aguacate'}]};
globalThis.views={circularity:()=>'<footer class="footer"></footer>',passport:()=>'<footer class="footer"></footer>'};
globalThis.localStorage={getItem:()=> 'LOT-1'};
globalThis.document={addEventListener:()=>{}};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
globalThis.openModal=()=>{};

vm.runInThisContext(source,{filename:'sana-v3-circularity-ledger.js'});
const api=window.__SANA_CIRCULARITY_LEDGER__;
assert.ok(api);
assert.equal(api.schema,'SANA_CIRCULARITY_LEDGER_V1');

const caf=api.forCase('CIR-CAF-001');
assert.ok(caf);
assert.equal(caf.stageCoverage.percent,100);
assert.equal(caf.quantities.explicitGenerated,120);
assert.equal(caf.quantities.explicitHandled,120);
assert.equal(caf.quantities.handledCoverage,100);
assert.equal(caf.quantities.explicitRecovered,0,'input to treatment must not become recovered output');
assert.equal(caf.semantics.recoveryDeclared,false);

const agu=api.forCase('CIR-AGU-001');
assert.ok(agu);
assert.equal(agu.plans.length,1);
assert.equal(agu.executions.length,0,'planned external destination must not become execution');
assert.equal(agu.semantics.plannedButNotExecuted,true);
assert.equal(agu.quantities.explicitGenerated,18);
assert.equal(agu.quantities.handledCoverage,null);

const local=api.forCase('CIR-LOCAL-1');
assert.equal(local.stageCoverage.percent,100);
assert.equal(local.quantities.explicitGenerated,50);
assert.equal(local.quantities.explicitHandled,50);
assert.equal(local.quantities.explicitRecovered,35);
assert.equal(local.quantities.handledCoverage,100);
assert.equal(local.semantics.recoveryDeclared,true);
assert.equal(local.semantics.unresolvedEvidenceRefs,0);

const legacy=api.forLot('LOT-1').legacy;
assert.equal(legacy.length,1);
assert.match(legacy[0].semanticState,/GENERATED_NOT_INFERRED/);
assert.match(legacy[0].semanticState,/RECOVERY_NOT_INFERRED/);
assert.match(legacy[0].semanticState,/EXTERNAL_DISPOSITION_NOT_VERIFIED/);
assert.match(api.integrity,/GENERATED ≠ RECOVERED/);
assert.match(api.integrity,/DESTINATION_PLAN ≠ EXECUTION/);
assert.match(api.integrity,/EXTERNAL_HANDOFF ≠ VERIFIED_DISPOSITION/);
assert.match(api.integrity,/HANDLED_COVERAGE ≠ CIRCULARITY_RATE/);
assert.match(api.integrity,/EVIDENCE ≠ ENVIRONMENTAL_IMPACT/);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('productionExecutionAvailable=true'),false);
assert.equal(source.includes('canonicalMutated=true'),false);

console.log('circularity ledger contract OK · generated != recovered · planned destination != execution · handled coverage not circularity rate');
