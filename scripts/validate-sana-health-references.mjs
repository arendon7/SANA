import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-health-ledger.js','utf8');
const schema='SANA_PHYTOSANITARY_LEDGER_V1';
const event=(id,eventKind,observedAt,basisEventId='',caseId='SAN-REF-1',extra={})=>({
  id,type:'phytosanitary-event',lot:'LOT-1',createdAt:`${observedAt}T10:00:00Z`,values:{
    healthSchema:schema,projectionVersion:'V2',eventKind,caseId,lot:'LOT-1',observedAt,basisEventId,author:'QA',detail:`${eventKind} ${id}`,...extra
  }
});
const records=[
  event('REF-OPEN','CASE_OPEN','2026-08-18'),
  event('REF-OBS','OBSERVATION','2026-08-18','', 'SAN-REF-1',{presenceStatus:'PRESENCE_OBSERVED'}),
  event('REF-FIND','FINDING','2026-08-18','REF-OBS','SAN-REF-1',{findingClass:'PLAGA',diagnosisStatus:'CONFIRMED_HUMAN_DEMO'}),
  event('REF-REC','RECOMMENDATION','2026-08-18','REF-FIND'),
  event('REF-LINK','ACTIVITY_LINK','2026-08-18','REF-REC','SAN-REF-1',{activityId:'ACT-1'}),
  event('REF-ACT','ACTION','2026-08-18','REF-LINK','SAN-REF-1',{activityId:'ACT-1',actionType:'CULTURAL_CONTROL'}),
  event('REF-EVID','EVIDENCE','2026-08-19','REF-ACT','SAN-REF-1',{evidenceRef:'EV-1'}),
  event('REF-FOLLOW','FOLLOW_UP','2026-08-19','REF-EVID','SAN-REF-1',{followUpClass:'FOLLOW_UP_PERFORMED'}),
  event('REF-RESULT','RESULT','2026-08-19','REF-FOLLOW','SAN-REF-1',{resultClass:'CONDITION_CHANGED_OBSERVED',effectivenessObserved:'IMPROVEMENT_OBSERVED'}),

  event('MISS-OPEN','CASE_OPEN','2026-08-18','', 'SAN-MISSING'),
  event('MISS-OBS','OBSERVATION','2026-08-18','', 'SAN-MISSING'),
  event('MISS-FIND','FINDING','2026-08-18','', 'SAN-MISSING'),

  event('KIND-OPEN','CASE_OPEN','2026-08-18','', 'SAN-KIND'),
  event('KIND-OBS','OBSERVATION','2026-08-18','', 'SAN-KIND'),
  event('KIND-FIND','FINDING','2026-08-18','KIND-OBS','SAN-KIND'),
  event('KIND-REC','RECOMMENDATION','2026-08-18','KIND-OBS','SAN-KIND'),

  event('CROSS-OPEN','CASE_OPEN','2026-08-18','', 'SAN-CROSS'),
  event('CROSS-OBS','OBSERVATION','2026-08-18','', 'SAN-CROSS'),
  event('CROSS-FIND','FINDING','2026-08-18','REF-OBS','SAN-CROSS'),

  event('FWD-OPEN','CASE_OPEN','2026-08-18','', 'SAN-FWD'),
  event('FWD-OBS','OBSERVATION','2026-08-20','', 'SAN-FWD'),
  event('FWD-FIND','FINDING','2026-08-19','FWD-OBS','SAN-FWD')
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
assert.deepEqual(api.predecessorKinds,{FINDING:'OBSERVATION',RECOMMENDATION:'FINDING',ACTIVITY_LINK:'RECOMMENDATION',ACTION:'ACTIVITY_LINK',EVIDENCE:'ACTION',FOLLOW_UP:'EVIDENCE',RESULT:'FOLLOW_UP'});

const linked=api.forCase('SAN-REF-1');
assert.equal(linked.chainCoverage.percent,100);
assert.equal(linked.referenceCoverage.total,7);
assert.equal(linked.referenceCoverage.linked,7);
assert.equal(linked.referenceCoverage.percent,100);
assert.equal(linked.referenceIssues,0);
assert.ok(linked.referenceRows.every(r=>r.reference.status==='LINKED'));
assert.equal(api.eventReference(linked.findings[0],linked.events).expectedKind,'OBSERVATION');
assert.equal(api.eventReference(linked.results[0],linked.events).expectedKind,'FOLLOW_UP');

const missing=api.forCase('SAN-MISSING');
assert.equal(api.eventReference(missing.findings[0],missing.events).status,'MISSING_REFERENCE');
assert.equal(missing.referenceIssues,1);
assert.equal(missing.chainCoverage.covered,2,'reference issue must not rewrite stage coverage');

const wrongKind=api.forCase('SAN-KIND');
assert.equal(api.eventReference(wrongKind.recommendations[0],wrongKind.events).status,'KIND_MISMATCH');
assert.ok(wrongKind.referenceIssues>=1);

const cross=api.forCase('SAN-CROSS');
assert.equal(api.eventReference(cross.findings[0],cross.events).status,'CROSS_CASE_REFERENCE');

const forward=api.forCase('SAN-FWD');
assert.equal(api.eventReference(forward.findings[0],forward.events).status,'FORWARD_REFERENCE');

const historical=api.forCase('SAN-CAC-001');
assert.equal(historical.referenceCoverage.total,0,'historical V1 events must stay outside V2 reference denominator');
assert.equal(historical.referenceCoverage.linked,0);
assert.equal(historical.referenceCoverage.percent,null);
assert.equal(historical.referenceIssues,0);
const historicalFinding=historical.findings[0];
assert.equal(api.eventReference(historicalFinding,historical.events).status,'LEGACY_NOT_CAPTURED');
assert.equal(historical.chainCoverage.percent,75,'reference model must not promote or alter V1/V2 stage semantics');

assert.match(api.integrity,/CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE/);
assert.match(api.integrity,/REFERENCE ≠ CAUSALITY/);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('canonicalMutated=true'),false);
assert.equal(source.includes('productionExecutionAvailable=true'),false);

console.log('phytosanitary V2 references OK · 7/7 predecessor links · legacy excluded · reference integrity independent from stage coverage');
