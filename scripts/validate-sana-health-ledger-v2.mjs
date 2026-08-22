import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-health-ledger.js','utf8');
const records=[
  {id:'V2-OBS',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-18T08:00:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',projectionVersion:'V2',eventKind:'OBSERVATION',caseId:'SAN-V2-1',lot:'LOT-1',observedAt:'2026-08-18',presenceStatus:'PRESENCE_OBSERVED',detail:'Presencia observada',author:'QA'}},
  {id:'V2-FIND',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-18T08:05:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',projectionVersion:'V2',eventKind:'FINDING',caseId:'SAN-V2-1',lot:'LOT-1',observedAt:'2026-08-18',findingClass:'PLAGA',diagnosisStatus:'CONFIRMED_HUMAN_DEMO',detail:'Diagnóstico humano',author:'QA'}},
  {id:'V2-REC',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-18T08:10:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',projectionVersion:'V2',eventKind:'RECOMMENDATION',caseId:'SAN-V2-1',lot:'LOT-1',observedAt:'2026-08-18',basis:'Protocolo QA',detail:'Recomendación humana',author:'QA'}},
  {id:'V2-LINK',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-18T08:15:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',projectionVersion:'V2',eventKind:'ACTIVITY_LINK',caseId:'SAN-V2-1',lot:'LOT-1',observedAt:'2026-08-18',activityId:'ACT-1',detail:'Vínculo explícito',author:'QA',provenance:'ACTIVITY_RELATION_DEMO'}},
  {id:'V2-ACT',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-18T09:00:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',projectionVersion:'V2',eventKind:'ACTION',caseId:'SAN-V2-1',lot:'LOT-1',observedAt:'2026-08-18',activityId:'ACT-1',actionType:'CULTURAL_CONTROL',detail:'Acción ejecutada',author:'QA'}},
  {id:'V2-EVID',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-18T09:10:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',projectionVersion:'V2',eventKind:'EVIDENCE',caseId:'SAN-V2-1',lot:'LOT-1',observedAt:'2026-08-18',evidenceRef:'EV-1',detail:'Evidencia',author:'QA'}},
  {id:'V2-FOLLOW',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-19T08:00:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',projectionVersion:'V2',eventKind:'FOLLOW_UP',caseId:'SAN-V2-1',lot:'LOT-1',observedAt:'2026-08-19',followUpClass:'FOLLOW_UP_PERFORMED',compareBasis:'Misma muestra QA',detail:'Seguimiento realizado',author:'QA'}},
  {id:'V2-RESULT',type:'phytosanitary-event',lot:'LOT-1',createdAt:'2026-08-19T08:10:00Z',values:{healthSchema:'SANA_PHYTOSANITARY_LEDGER_V1',projectionVersion:'V2',eventKind:'RESULT',caseId:'SAN-V2-1',lot:'LOT-1',observedAt:'2026-08-19',resultClass:'CONDITION_CHANGED_OBSERVED',effectivenessObserved:'IMPROVEMENT_OBSERVED',compareBasis:'Misma muestra QA',detail:'Mejoría observada sin atribución causal',author:'QA'}}
];

globalThis.window={__SANA_PLAN_FIELD_WORKFLOW__:{findActivity:id=>id==='ACT-1'?{id:'ACT-1',lot:'LOT-1',state:{label:'Completada'}}:id==='T-103'?{id:'T-103',lot:'CAC-B1',state:{label:'Abierta'}}:null,forLot:lot=>lot==='LOT-1'?[{id:'ACT-1',lot:'LOT-1',title:'Actividad QA'}]:[]}};
globalThis.storage={records};
globalThis.identity={displayName:'QA'};
globalThis.DEMO={lots:[{id:'LOT-1',crop:'Café'},{id:'CAC-B1',crop:'Cacao'}],incidents:[]};
globalThis.views={health:()=>'<footer class="footer-note"></footer>',passport:()=>'<footer class="footer"></footer>'};
globalThis.localStorage={getItem:()=> 'LOT-1'};
globalThis.document={addEventListener:()=>{}};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
globalThis.openModal=()=>{};

vm.runInThisContext(source,{filename:'sana-v3-health-ledger.js'});
const api=window.__SANA_PHYTOSANITARY_LEDGER__;
assert.ok(api);
assert.equal(api.schema,'SANA_PHYTOSANITARY_LEDGER_V1');
assert.equal(api.projection,'SANA_PHYTOSANITARY_CHAIN_V2');
assert.equal(api.projectionVersion,'V2');
assert.deepEqual(api.stages.map(x=>x.id),['OBSERVATION','FINDING','RECOMMENDATION','ACTIVITY_LINK','ACTION','EVIDENCE','FOLLOW_UP','RESULT']);

const historical=api.forCase('SAN-CAC-001');
assert.equal(historical.stageCoverage.percent,100,'V1 compatibility coverage remains unchanged');
assert.equal(historical.chainCoverage.percent,75,'embedded V1 relation/result must not be promoted into V2 stages');
assert.equal(historical.activityLinks.length,0);
assert.equal(historical.results.length,0);
assert.equal(historical.semantics.embeddedActivityLinksV1,1);
assert.equal(historical.semantics.embeddedResultsV1,1);

const v2=api.forCase('SAN-V2-1');
assert.equal(v2.stageCoverage.percent,100);
assert.equal(v2.chainCoverage.percent,100);
assert.equal(v2.activityLinks.length,1);
assert.equal(v2.activityLinks[0].activityLink.status,'LINKED');
assert.equal(v2.actions.length,1);
assert.equal(v2.results.length,1);
assert.equal(v2.followups.length,1);
assert.equal(v2.latestFollowUp.resultClass,'','follow-up must not carry the V2 result');
assert.equal(v2.latestResult.resultClass,'CONDITION_CHANGED_OBSERVED');
assert.equal(v2.semantics.explicitResultEfficacyObservations,1);
assert.equal(v2.semantics.embeddedResultsV1,0);
assert.match(v2.integrity,/ACTIVITY_LINK_EVENT ≠ ACTION/);
assert.match(v2.integrity,/FOLLOW_UP ≠ RESULT/);
assert.match(v2.integrity,/RESULT ≠ CAUSAL_ATTRIBUTION/);
assert.match(api.integrity,/EMBEDDED_V1_RELATION ≠ V2_STAGE/);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('canonicalMutated=true'),false);
assert.equal(source.includes('productionExecutionAvailable=true'),false);

console.log('phytosanitary chain v2 OK · activity link and result are explicit stages · V1 semantics not promoted retroactively');
