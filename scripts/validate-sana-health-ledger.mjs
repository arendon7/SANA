import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-health-ledger.js','utf8');
const records=[
  {id:'LOC-OPEN',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-16T08:00:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',eventKind:'CASE_OPEN',caseId:'SAN-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-16',scope:'BIOTIC_RISK',detail:'Caso local',author:'QA'}},
  {id:'LOC-OBS',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-16T08:05:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',eventKind:'OBSERVATION',caseId:'SAN-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-16',presenceStatus:'PRESENCE_OBSERVED',detail:'Presencia observada en muestra',author:'QA'}},
  {id:'LOC-DIAG',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-16T08:10:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',eventKind:'FINDING',caseId:'SAN-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-16',findingClass:'PLAGA',diagnosisStatus:'CONFIRMED_HUMAN_DEMO',detail:'Confirmación humana DEMO',author:'QA'}},
  {id:'LOC-REC',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-16T08:15:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',eventKind:'RECOMMENDATION',caseId:'SAN-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-16',detail:'Recomendación humana',author:'QA'}},
  {id:'LOC-ACT',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-16T09:00:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',eventKind:'ACTION',caseId:'SAN-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-16',activityId:'ACT-1',actionType:'MONITORING',detail:'Acción registrada',author:'QA'}},
  {id:'LOC-EV',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-16T09:10:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',eventKind:'EVIDENCE',caseId:'SAN-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-16',activityId:'ACT-1',evidenceRef:'E-1',detail:'Evidencia explícita',author:'QA'}},
  {id:'LOC-FU',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-17T09:00:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',eventKind:'FOLLOW_UP',caseId:'SAN-LOCAL-1',lot:'LOT-1',observedAt:'2026-08-17',resultClass:'CONDITION_PERSISTS_OBSERVED',effectivenessObserved:'NO_CHANGE_OBSERVED',compareBasis:'Misma muestra DEMO',detail:'Sin cambio observado',author:'QA'}},
  {id:'OLD-HEALTH',type:'health',lot:'LOT-1',createdAt:'2026-08-12T10:00:00Z',values:{lot:'LOT-1',result:'Vigilancia',severity:'Media',detail:'Captura previa no estructurada'}}
];

globalThis.window={__SANA_PLAN_FIELD_WORKFLOW__:{findActivity:id=>id==='ACT-1'?{id:'ACT-1',lot:'LOT-1',state:{label:'Completada'}}:id==='T-103'?{id:'T-103',lot:'CAC-B1',state:{label:'Abierta'}}:null,forLot:lot=>lot==='LOT-1'?[{id:'ACT-1',lot:'LOT-1',title:'Actividad QA'}]:[]}};
globalThis.storage={records};
globalThis.identity={displayName:'QA'};
globalThis.DEMO={lots:[{id:'LOT-1',crop:'Café'},{id:'CAC-B1',crop:'Cacao'}],incidents:[{id:'INC-LEG',lot:'LOT-1',date:'2026-08-10',finding:'Resumen legacy',severity:'Media',status:'Cerrada con evidencia',owner:'QA'}]};
globalThis.views={health:()=>'<footer class="footer-note"></footer>',passport:()=>'<footer class="footer"></footer>'};
globalThis.localStorage={getItem:()=> 'LOT-1'};
globalThis.document={addEventListener:()=>{}};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
globalThis.openModal=()=>{};

vm.runInThisContext(source,{filename:'sana-v3-health-ledger.js'});
const api=window.__SANA_PHYTOSANITARY_LEDGER__;
assert.ok(api,'phytosanitary ledger API must exist');
assert.equal(api.schema,'SANA_PHYTOSANITARY_LEDGER_V1');

const baseline=api.forCase('SAN-CAC-001');
assert.ok(baseline);
assert.equal(baseline.stageCoverage.percent,100);
assert.equal(baseline.semantics.observedPresence,0,'risk condition must not infer observed disease presence');
assert.equal(baseline.semantics.confirmedDiagnosis,0,'risk condition must not infer diagnosis');
assert.equal(baseline.actions.length,1);
assert.equal(baseline.actions[0].activityLink.status,'LINKED');
assert.equal(baseline.semantics.efficacyObservations,0,'monitoring follow-up must not invent treatment efficacy');

const local=api.forCase('SAN-LOCAL-1');
assert.equal(local.stageCoverage.percent,100);
assert.equal(local.semantics.observedPresence,1);
assert.equal(local.semantics.confirmedDiagnosis,1);
assert.equal(local.actions[0].activityLink.status,'LINKED');
assert.equal(local.semantics.efficacyObservations,1);
assert.equal(local.latestFollowUp.effectivenessObserved,'NO_CHANGE_OBSERVED');

const legacy=api.forLot('LOT-1').legacy;
assert.equal(legacy.length,2);
assert.ok(legacy.every(x=>x.semanticState.includes('DIAGNOSIS_NOT_INFERRED')));
assert.ok(legacy.every(x=>x.semanticState.includes('EFFICACY_NOT_INFERRED')));
assert.match(api.integrity,/LEGACY_INCIDENT_SUMMARY ≠ OBSERVED_PRESENCE ≠ DIAGNOSIS ≠ TREATMENT ≠ EFFICACY/);
assert.match(api.integrity,/FOLLOW_UP ≠ CAUSAL_ATTRIBUTION/);
assert.equal(source.includes('storage.records.push'),false,'ledger read model must not directly mutate storage');
assert.equal(source.includes('fetch('),false,'ledger must not perform external I/O');
assert.equal(source.includes('canonicalMutated=true'),false);
assert.equal(source.includes('productionExecutionAvailable=true'),false);

console.log('phytosanitary ledger contract OK · observation, diagnosis, recommendation, action and observed follow-up remain distinct');
