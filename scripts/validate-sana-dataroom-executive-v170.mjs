import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const path='apps/control-web/public/sana-v3-dataroom-executive-v170.js';
const src=fs.readFileSync(path,'utf8');

for(const token of [
  "const VERSION='V170'","const SCHEMA='SANA_DATAROOM_EXECUTIVE_360_V1'",'canonicalMutationAvailable:false','financialMutationAvailable:false',"aiAuthority:'ADVISORY_ONLY'",'lensChangesAuthority:false',
  'CAPITAL_READY ≠ FINANCING_APPROVAL','TRACEABILITY ≠ GUARANTEE','FORECAST ≠ REALIZED_OUTCOME','REVIEW ≠ APPROVAL','IMPACT_ESTIMATE ≠ VERIFIED_IMPACT_OR_CARBON_CREDIT','DO_NOT_RECONSTRUCT_MISSING_HISTORY'
])assert.ok(src.includes(token),`missing static invariant: ${token}`);
for(const forbidden of ['localStorage.setItem','sessionStorage.setItem','indexedDB.open','fetch(','XMLHttpRequest','canonicalMutationAvailable:true','financialMutationAvailable:true','offerAuthority:true','custodyAuthority:true','disbursementAuthority:true'])assert.ok(!src.includes(forbidden),`forbidden mutation/authority token: ${forbidden}`);

const sourceObjects={
  ddSnapshot:{snapshots:[{id:'SNAP-1',reportType:'RPT-DD',cutoff:'2026-08-20',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}}]},
  capitalCases:[
    {id:'CR-A',lot:'LOT-A',events:[{id:'E-A1',lot:'LOT-A',kind:'REVIEW_STARTED',observedAt:'2026-08-20T10:00:00-05:00'}]},
    {id:'CR-B',lot:'LOT-B',events:[{id:'E-B1',lot:'LOT-B',kind:'REVIEW_STARTED',observedAt:'2026-08-20T11:00:00-05:00'}]}
  ],
  rounds:[{id:'RND-A',lot:'LOT-A',events:[{id:'R-A1',lot:'LOT-A',kind:'ROUND_OPENED',observedAt:'2026-08-21T10:00:00-05:00'}]}],
  harvest:{valid:true,state:'CAPTURED',snapshot:{id:'SNAP-1',cutoff:'2026-08-20'},harvest:{caseCount:1}},
  impact:{valid:true,state:'CAPTURED',snapshot:{id:'SNAP-1',cutoff:'2026-08-20'},indicators:[{id:'I1',estimated:true}]},
  capitalHistory:{valid:true,state:'CAPTURED',snapshot:{id:'SNAP-1',cutoff:'2026-08-20'},rows:[{caseId:'CR-A'}]}
};
const before=JSON.stringify(sourceObjects);
const host={
  DEMO:{lots:[{id:'LOT-A'},{id:'LOT-B'}]},
  __SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>sourceObjects.ddSnapshot.snapshots},
  __SANA_DATAROOM_360__:{state:()=>({valid:true,state:'READY',latest:sourceObjects.ddSnapshot.snapshots[0],gaps:{total:2},postCut:{prepared:1,total:2},integrity:'READ_ONLY'})},
  __SANA_DATAROOM_HARVEST_HISTORY__:{state:()=>sourceObjects.harvest,integrity:'SNAPSHOT_ONLY'},
  __SANA_DATAROOM_IMPACT_HISTORY__:{state:()=>sourceObjects.impact,integrity:'SNAPSHOT_ONLY'},
  __SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__:{state:()=>sourceObjects.capitalHistory,integrity:'REVIEW_ONLY'},
  __SANA_CAPITAL_REVIEW__:{cases:()=>sourceObjects.capitalCases,events:()=>sourceObjects.capitalCases.flatMap(c=>c.events),forLot:lot=>sourceObjects.capitalCases.filter(c=>c.lot===lot),integrity:'REVIEW ≠ APPROVAL'},
  __SANA_DATAROOM_REVIEW_ROUND__:{cases:()=>sourceObjects.rounds,events:()=>sourceObjects.rounds.flatMap(c=>c.events),integrity:'ROUND ≠ DECISION'}
};
const context={window:host,structuredClone,console};
context.globalThis=context;
vm.runInNewContext(src,context,{filename:path});
const factory=host.__SANA_DATAROOM_EXECUTIVE_V170_FACTORY__;
assert.ok(factory?.create,'V170 factory not exposed');
const api=factory.create(host);
assert.equal(api.schema,'SANA_DATAROOM_EXECUTIVE_360_V1');
assert.equal(api.version,'V170');
assert.deepEqual(Array.from(api.canonicalOrder),[
  'IDENTITY_SCOPE','PLAN_EXECUTION','CROP_HEALTH_NUTRITION','PRODUCTION_HARVEST','COMMERCIAL_ECONOMIC','TRACEABILITY_DATA_TRUST','CIRCULARITY_IMPACT','CAPITAL_READINESS','EXCEPTIONS_GAPS','DECISION_TIMELINE'
]);
assert.equal(api.canonicalOrder.length,10);
assert.deepEqual(Array.from(api.lenses).sort(),['AGRONOMIST','AUDITOR','CAPITAL_REVIEWER','EXECUTIVE','PRODUCER'].sort());
assert.deepEqual(Array.from(api.lots()),['LOT-A','LOT-B']);

const all=api.compose();
assert.equal(all.sections.length,10);
assert.equal(all.authority.canonicalMutationAvailable,false);
assert.equal(all.authority.financialMutationAvailable,false);
assert.equal(all.authority.aiAuthority,'ADVISORY_ONLY');
assert.equal(all.authority.lensChangesAuthority,false);
assert.equal(all.provenance.sourceCommit,'00e6a04693dad2e19cfd53a7c61ff3fc8c1b0136');
assert.equal(all.provenance.materializedSemanticHead,'V162');
assert.deepEqual(Array.from(all.provenance.gitContinuityGap),['V164','V165','V166','V167','V168','V169']);
assert.equal(all.provenance.policy,'DO_NOT_RECONSTRUCT_MISSING_HISTORY');
assert.ok(all.latestSnapshot?.id==='SNAP-1');
assert.ok(all.sections.some(s=>s.status==='PARTIAL'||s.status==='UNAVAILABLE'),'missing sources must remain explicit');
for(const section of all.sections){assert.ok(['AVAILABLE','PARTIAL','UNAVAILABLE','SCOPE_MISMATCH','SCHEMA_MISMATCH','STALE_REFERENCE'].includes(section.status));assert.ok(Array.isArray(section.sources));assert.ok(Array.isArray(section.limitations));}

const lotA=api.compose({lot:'LOT-A'});
assert.equal(lotA.scope.lot,'LOT-A');
assert.ok(lotA.timeline.length>=2,'lot timeline should include review + round events');
assert.ok(lotA.timeline.every(e=>!e.lot||e.lot==='LOT-A'),'cross-lot review event leaked into scoped timeline');
assert.ok(!lotA.timeline.some(e=>e.id==='E-B1'),'LOT-B event leaked into LOT-A');
const capitalSection=lotA.sections.find(s=>s.id==='CAPITAL_READINESS');
const capitalSource=capitalSection.sources.find(s=>s.globalName==='__SANA_CAPITAL_REVIEW__');
assert.ok(capitalSource.records.every(r=>r.lot==='LOT-A'),'forLot source leaked cross-scope records');

const executive=api.forLens('EXECUTIVE',{lot:'LOT-A'});
const auditor=api.forLens('AUDITOR',{lot:'LOT-A'});
assert.equal(executive.sections.length,10);
assert.equal(auditor.sections.length,10);
assert.notEqual(executive.sections[0].id,auditor.sections[0].id,'lenses should change presentation order');
const facts=v=>Object.fromEntries(v.sections.map(s=>[s.id,JSON.stringify({status:s.status,sources:s.sources.map(x=>({name:x.globalName,status:x.status,summary:x.summary}))})]));
assert.deepEqual(facts(executive),facts(auditor),'lens changed source facts');
assert.equal(executive.authority.lensChangesAuthority,false);

assert.equal(JSON.stringify(sourceObjects),before,'source inputs were mutated');
assert.ok(Object.isFrozen(all));
assert.ok(Object.isFrozen(all.sections));
assert.ok(Object.isFrozen(all.authority));
assert.ok(!('score' in all)&&!('overallScore' in all)&&!('investmentScore' in all),'opaque score introduced');

console.log('SANA Data Room Executive V170 validation: PASS');
