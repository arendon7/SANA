import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-health-ledger.js','utf8');
const schema='SANA_PHYTOSANITARY_LEDGER_V1';
const event=(id,eventKind,observedAt,basisEventId='',caseId='SAN-LIFE-1',extra={})=>({
  id,type:'phytosanitary-event',lot:'LOT-1',createdAt:`${observedAt}T10:00:00Z`,values:{healthSchema:schema,projectionVersion:'V2',eventKind,caseId,lot:'LOT-1',observedAt,basisEventId,author:'QA',detail:`${eventKind} ${id}`,...extra}
});
const chain=(caseId,prefix)=>[
  event(`${prefix}-OPEN`,'CASE_OPEN','2026-08-18','',caseId),
  event(`${prefix}-OBS`,'OBSERVATION','2026-08-18','',caseId,{presenceStatus:'PRESENCE_OBSERVED'}),
  event(`${prefix}-FIND`,'FINDING','2026-08-18',`${prefix}-OBS`,caseId,{findingClass:'PLAGA',diagnosisStatus:'CONFIRMED_HUMAN_DEMO'}),
  event(`${prefix}-REC`,'RECOMMENDATION','2026-08-18',`${prefix}-FIND`,caseId),
  event(`${prefix}-LINK`,'ACTIVITY_LINK','2026-08-18',`${prefix}-REC`,caseId,{activityId:'ACT-1'}),
  event(`${prefix}-ACT`,'ACTION','2026-08-18',`${prefix}-LINK`,caseId,{activityId:'ACT-1',actionType:'CULTURAL_CONTROL'}),
  event(`${prefix}-EVID`,'EVIDENCE','2026-08-19',`${prefix}-ACT`,caseId,{evidenceRef:'EV-1'}),
  event(`${prefix}-FOLLOW`,'FOLLOW_UP','2026-08-19',`${prefix}-EVID`,caseId,{followUpClass:'FOLLOW_UP_PERFORMED'}),
  event(`${prefix}-RESULT`,'RESULT','2026-08-19',`${prefix}-FOLLOW`,caseId,{resultClass:'CONDITION_CHANGED_OBSERVED',effectivenessObserved:'IMPROVEMENT_OBSERVED'})
];
const records=[
  ...chain('SAN-LIFE-1','OK'),
  event('OK-CLOSE','CASE_CLOSE','2026-08-20','OK-RESULT','SAN-LIFE-1',{closureClass:'MONITORING_COMPLETE',provenance:'HUMAN_CASE_CLOSURE_DEMO'}),
  ...chain('SAN-LIFE-BAD','BAD'),
  event('BAD-CLOSE','CASE_CLOSE','2026-08-20','BAD-FIND','SAN-LIFE-BAD',{closureClass:'NO_FURTHER_ACTION_CURRENTLY',provenance:'HUMAN_CASE_CLOSURE_DEMO'}),
  ...chain('SAN-LIFE-MISSING','MISS'),
  event('MISS-CLOSE','CASE_CLOSE','2026-08-20','','SAN-LIFE-MISSING',{closureClass:'OTHER_HUMAN_CLOSURE',provenance:'HUMAN_CASE_CLOSURE_DEMO'}),
  ...chain('SAN-LIFE-OPEN','OPEN')
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
globalThis.toast=()=>{};

vm.runInThisContext(source,{filename:'sana-v3-health-ledger.js'});
const api=window.__SANA_PHYTOSANITARY_LEDGER__;
assert.ok(api);
assert.equal(api.lifecyclePredecessorKinds.CASE_CLOSE,'RESULT');

const closed=api.forCase('SAN-LIFE-1');
assert.equal(closed.chainCoverage.percent,100);
assert.equal(closed.chainCoverage.total,8,'CASE_CLOSE must not alter the 8-stage denominator');
assert.equal(closed.referenceCoverage.total,7,'CASE_CLOSE must not alter chain predecessor denominator');
assert.equal(closed.referenceCoverage.linked,7);
assert.equal(closed.caseState,'CLOSED_HUMAN');
assert.equal(closed.closures.length,1);
assert.equal(closed.closureIssues,0);
assert.equal(closed.closedAt,'2026-08-20');
assert.equal(closed.latestClosure.id,'OK-CLOSE');
assert.equal(closed.latestClosure.closureClass,'MONITORING_COMPLETE');
assert.equal(api.eventReference(closed.latestClosure,closed.events).expectedKind,'RESULT');
assert.equal(api.eventReference(closed.latestClosure,closed.events).status,'LINKED');

const bad=api.forCase('SAN-LIFE-BAD');
assert.equal(bad.chainCoverage.percent,100);
assert.equal(bad.caseState,'OPEN','invalid closure reference must not close case');
assert.equal(bad.closureIssues,1);
assert.equal(api.eventReference(bad.closures[0],bad.events).status,'KIND_MISMATCH');

const missing=api.forCase('SAN-LIFE-MISSING');
assert.equal(missing.caseState,'OPEN');
assert.equal(missing.closureIssues,1);
assert.equal(api.eventReference(missing.closures[0],missing.events).status,'MISSING_REFERENCE');

const open=api.forCase('SAN-LIFE-OPEN');
assert.equal(open.caseState,'OPEN');
assert.equal(open.closures.length,0);
assert.equal(open.closureIssues,0);

const historical=api.forCase('SAN-CAC-001');
assert.equal(historical.caseState,'OPEN','legacy incident status must not be promoted into explicit CASE_CLOSE');
assert.equal(historical.closures.length,0);
assert.equal(historical.chainCoverage.percent,75);

assert.match(api.integrity,/RESULT ≠ CASE_CLOSURE/);
assert.match(api.integrity,/CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED/);
assert.match(api.integrity,/CASE_CLOSURE ≠ TREATMENT_EFFICACY/);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('canonicalMutated=true'),false);
assert.equal(source.includes('productionExecutionAvailable=true'),false);

console.log('phytosanitary case lifecycle OK · CASE_CLOSE references RESULT · closure is outside 8-stage coverage · closure does not imply resolution or efficacy');
