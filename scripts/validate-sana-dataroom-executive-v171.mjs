import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const runtimePath='apps/control-web/public/sana-v3-dataroom-executive-v171.js';
const src=fs.readFileSync(runtimePath,'utf8');
const html=fs.readFileSync('apps/control-web/public/sana-v3.html','utf8');

for(const token of [
  "const VERSION='V171'","const SCHEMA='SANA_DATAROOM_EXECUTIVE_SOURCE_COVERAGE_V1'",'LOT_EXACT','SNAPSHOT_GLOBAL','REFERENCE_CASE','API_PRESENT_WITHOUT_EXPECTED_ACCESSOR','COUNTS_ONLY · NOT_WEIGHTED · NOT_SCORE','lensChangesAuthority:false','financialMutationAvailable:false',"aiAuthority:'ADVISORY_ONLY'"
])assert.ok(src.includes(token),`missing V171 invariant: ${token}`);
for(const forbidden of ['fetch(','XMLHttpRequest','localStorage.setItem','sessionStorage.setItem','indexedDB.open','canonicalMutationAvailable:true','financialMutationAvailable:true','riskScore:','investmentScore:','overallScore:'])assert.ok(!src.includes(forbidden),`forbidden V171 token: ${forbidden}`);

const context={window:{},structuredClone,console};context.globalThis=context;
vm.runInNewContext(src,context,{filename:runtimePath});
const factory=context.window.__SANA_DATAROOM_EXECUTIVE_V171_FACTORY__;
assert.ok(factory?.create,'V171 factory missing');
assert.equal(factory.schema,'SANA_DATAROOM_EXECUTIVE_SOURCE_COVERAGE_V1');
assert.equal(factory.version,'V171');
const registry=Array.from(factory.registry);
assert.ok(registry.length>=40,`expected broad registry, got ${registry.length}`);

const expectedGlobals=[
'__SANA_DATAROOM_360__','__SANA_DUE_DILIGENCE_SNAPSHOT__','__SANA_CAPITAL_REVIEW__','__SANA_DATAROOM_PHENOLOGY_HISTORY__','__SANA_DATAROOM_LABOR_HISTORY__','__SANA_DATAROOM_HEALTH_HISTORY__','__SANA_DATAROOM_HEALTH_LIFECYCLE__','__SANA_DATAROOM_NUTRITION_HISTORY__','__SANA_DATAROOM_NUTRITION_V2_HISTORY__','__SANA_DATAROOM_FORECAST_HISTORY__','__SANA_DATAROOM_HARVEST_HISTORY__','__SANA_DATAROOM_INVENTORY_HISTORY__','__SANA_DATAROOM_ECONOMIC_RECONCILIATION_HISTORY__','__SANA_DATAROOM_COMMERCIAL_HISTORY__','__SANA_DATAROOM_DATA_TRUST_HISTORY__','__SANA_DATAROOM_CAPTURE_SYNC_HISTORY__','__SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__','__SANA_DATAROOM_CIRCULARITY_HISTORY__','__SANA_DATAROOM_MATERIAL_HISTORY__','__SANA_DATAROOM_IMPACT_HISTORY__','__SANA_DATAROOM_CAPITAL_GOVERNANCE_HISTORY__','__SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__','__SANA_CAPITAL_GOVERNANCE__','__SANA_DATAROOM_REVIEW_GOVERNANCE__','__SANA_DUE_DILIGENCE_GAPS__','__SANA_DATAROOM_FINDINGS__','__SANA_DATAROOM_FINDINGS_HISTORY__','__SANA_DATAROOM_REVIEW_CASE__','__SANA_DATAROOM_REVIEW_HANDOFF__','__SANA_DATAROOM_REVIEW_FEEDBACK__','__SANA_DATAROOM_REVIEW_RESPONSE__','__SANA_DATAROOM_REVIEW_DISPOSITION__','__SANA_DATAROOM_REVIEW_ROUND__'
];
const registered=new Set(registry.map(x=>x.globalName));
for(const name of expectedGlobals)assert.ok(registered.has(name),`V170 source global not covered by V171 registry: ${name}`);

for(const def of registry.filter(x=>x.materialized)){
  assert.ok(def.file&&fs.existsSync(def.file),`materialized source file missing: ${def.id} -> ${def.file}`);
  const text=fs.readFileSync(def.file,'utf8');
  assert.ok(text.includes(def.globalName),`global export not found in ${def.file}: ${def.globalName}`);
  if(def.strategy==='STATE')assert.ok(/\bstate\s*:/.test(text),`STATE adapter not evidenced in ${def.file}`);
  if(def.strategy==='SNAPSHOTS')assert.ok(/\bsnapshots\b/.test(text),`SNAPSHOTS adapter not evidenced in ${def.file}`);
  if(def.strategy==='CURRENT')assert.ok(/\bcurrent\b/.test(text),`CURRENT adapter not evidenced in ${def.file}`);
  if(def.strategy==='FOR_LOT_CASES')assert.ok(/\bforLot\b/.test(text)&&/\bcases\b/.test(text),`FOR_LOT_CASES adapter not evidenced in ${def.file}`);
  if(def.strategy==='CASES_EVENTS')assert.ok(/\bcases\b/.test(text),`CASES_EVENTS adapter not evidenced in ${def.file}`);
  assert.ok(def.view&&typeof def.view==='string','source view missing');
}
const nutritionV2=registry.find(x=>x.globalName==='__SANA_DATAROOM_NUTRITION_V2_HISTORY__');
assert.ok(nutritionV2&&!nutritionV2.materialized&&nutritionV2.strategy==='NONE','nutrition V2 expectation must be explicitly unmaterialized');
assert.ok(!html.includes('sana-v3-dataroom-nutrition-v2-history.js'),'validator found a materialized nutrition V2 history script; registry must be updated');

const data={
  snapshots:[{id:'S1',reportType:'RPT-DD',cutoff:'2026-08-20',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}}],
  capital:[{id:'CAP-A',lot:'LOT-A',events:[{id:'CAP-A-1',lot:'LOT-A',kind:'REVIEW_STARTED',observedAt:'2026-08-20T10:00:00-05:00'}]},{id:'CAP-B',lot:'LOT-B',events:[{id:'CAP-B-1',lot:'LOT-B',kind:'REVIEW_STARTED',observedAt:'2026-08-20T11:00:00-05:00'}]}],
  findings:[{id:'F-A',lot:'LOT-A',events:[{id:'F-A-1',lot:'LOT-A',kind:'FINDING_RECORDED',observedAt:'2026-08-20T12:00:00-05:00'}]},{id:'F-B',lot:'LOT-B',events:[{id:'F-B-1',lot:'LOT-B',kind:'FINDING_RECORDED',observedAt:'2026-08-20T13:00:00-05:00'}]}],
  governance:[{id:'RG-A',lot:'LOT-A',events:[{id:'RG-A-1',lot:'LOT-A',kind:'REVIEW_SCOPE_DECLARED',observedAt:'2026-08-20T14:00:00-05:00'}]},{id:'RG-B',lot:'LOT-B',events:[{id:'RG-B-1',lot:'LOT-B',kind:'REVIEW_SCOPE_DECLARED',observedAt:'2026-08-20T15:00:00-05:00'}]}]
};
const before=JSON.stringify(data);
const state=()=>({valid:true,state:'CAPTURED',snapshot:data.snapshots[0],integrity:'SNAPSHOT_ONLY'});
const host={
  DEMO:{lots:[{id:'LOT-A'},{id:'LOT-B'}]},
  __SANA_DATAROOM_360__:{state},
  __SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>data.snapshots},
  __SANA_CAPITAL_REVIEW__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot),integrity:'REVIEW_ONLY'},
  __SANA_CAPITAL_GOVERNANCE__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot),integrity:'CAPITAL_ONLY'},
  __SANA_DATAROOM_FINDINGS__:{cases:()=>data.findings,forLot:lot=>data.findings.filter(x=>x.lot===lot),integrity:'FINDINGS_ONLY'},
  __SANA_DATAROOM_REVIEW_GOVERNANCE__:{cases:()=>data.governance,integrity:'REFERENCE_CASES'},
  __SANA_DUE_DILIGENCE_GAPS__:{current:()=>({valid:true,state:'CAPTURED',snapshot:data.snapshots[0],gaps:[],integrity:'GAPS_ONLY'})},
  __SANA_DATAROOM_PHENOLOGY_HISTORY__: {},
  __SANA_DATAROOM_HARVEST_HISTORY__:{state},
  __SANA_DATAROOM_IMPACT_HISTORY__:{state},
  __SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__:{state},
  __SANA_DATAROOM_REVIEW_CASE__:{cases:()=>data.governance},
  __SANA_DATAROOM_REVIEW_HANDOFF__:{cases:()=>data.governance},
  __SANA_DATAROOM_REVIEW_FEEDBACK__:{cases:()=>data.governance},
  __SANA_DATAROOM_REVIEW_RESPONSE__:{cases:()=>data.governance},
  __SANA_DATAROOM_REVIEW_DISPOSITION__:{cases:()=>data.governance},
  __SANA_DATAROOM_REVIEW_ROUND__:{cases:()=>data.governance}
};
const api=factory.create(host);
const lotA=api.compose({lot:'LOT-A'});
assert.equal(lotA.scope.lot,'LOT-A');
assert.equal(lotA.authority.canonicalMutationAvailable,false);
assert.equal(lotA.authority.financialMutationAvailable,false);
assert.equal(lotA.authority.lensChangesAuthority,false);
assert.equal(lotA.authority.aiAuthority,'ADVISORY_ONLY');
assert.equal(lotA.coverage.semantics,'COUNTS_ONLY · NOT_WEIGHTED · NOT_SCORE');
assert.ok(!('score' in lotA.coverage)&&!('percent' in lotA.coverage),'coverage became a score/percentage');

const identity=lotA.sections.find(x=>x.id==='IDENTITY_SCOPE');
const snapshotSource=identity.sources.find(x=>x.globalName==='__SANA_DATAROOM_360__');
assert.equal(snapshotSource.scopeQuality,'SNAPSHOT_GLOBAL');
assert.equal(snapshotSource.scopeMatch,'SNAPSHOT_GLOBAL_NOT_LOT_EXACT');
assert.ok(snapshotSource.limitations.includes('LOT_LENS_DOES_NOT_CHANGE_SNAPSHOT_SCOPE'));
const capitalSource=identity.sources.find(x=>x.globalName==='__SANA_CAPITAL_REVIEW__');
assert.equal(capitalSource.scopeQuality,'LOT_EXACT');
assert.equal(capitalSource.scopeMatch,'OFFICIAL_FOR_LOT');
assert.ok(capitalSource.records.every(x=>x.lot==='LOT-A'));

const gaps=lotA.sections.find(x=>x.id==='EXCEPTIONS_GAPS');
const findingSource=gaps.sources.find(x=>x.globalName==='__SANA_DATAROOM_FINDINGS__');
assert.equal(findingSource.scopeQuality,'LOT_EXACT');
assert.ok(findingSource.records.every(x=>x.lot==='LOT-A'));
const ddSource=gaps.sources.find(x=>x.globalName==='__SANA_DUE_DILIGENCE_GAPS__');
assert.equal(ddSource.strategy,'CURRENT');
assert.equal(ddSource.scopeQuality,'SNAPSHOT_GLOBAL');

const health=lotA.sections.find(x=>x.id==='CROP_HEALTH_NUTRITION');
const broken=health.sources.find(x=>x.globalName==='__SANA_DATAROOM_PHENOLOGY_HISTORY__');
assert.equal(broken.status,'PARTIAL','API present without expected STATE accessor must fail closed as PARTIAL');
assert.ok(broken.limitations.some(x=>x.includes('EXPECTED_ACCESSOR_MISSING')||x.includes('API_PRESENT_WITHOUT_EXPECTED_ACCESSOR')));
const missingNutrition=health.sources.find(x=>x.globalName==='__SANA_DATAROOM_NUTRITION_V2_HISTORY__');
assert.equal(missingNutrition.status,'UNAVAILABLE');
assert.equal(missingNutrition.scopeQuality,'UNAVAILABLE');
assert.ok(missingNutrition.limitations.includes('REGISTRY_DECLARED_SOURCE_NOT_MATERIALIZED'));

const timeline=lotA.timeline;
assert.ok(timeline.length>0);
assert.ok(timeline.every(x=>!x.lot||x.lot==='LOT-A'),'cross-lot review event leaked into lot lens');
assert.ok(!timeline.some(x=>x.id==='RG-B-1'));
assert.ok(timeline.some(x=>x.scopeQuality==='REFERENCE_CASE'),'reference-case scope quality missing from timeline');

const exec=api.forLens('EXECUTIVE',{lot:'LOT-A'}),audit=api.forLens('AUDITOR',{lot:'LOT-A'});
assert.notEqual(exec.sections[0].id,audit.sections[0].id);
const facts=v=>Object.fromEntries(v.sections.map(s=>[s.id,JSON.stringify({status:s.status,coverage:s.scopeCoverage,sources:s.sources.map(x=>({id:x.id,status:x.status,scopeQuality:x.scopeQuality,scopeMatch:x.scopeMatch,file:x.file,view:x.view,payloadSummary:x.payloadSummary}))})]));
assert.deepEqual(facts(exec),facts(audit),'role lens changed source facts');
assert.equal(JSON.stringify(data),before,'source inputs mutated');
assert.ok(Object.isFrozen(lotA)&&Object.isFrozen(lotA.registry)&&Object.isFrozen(lotA.coverage));
assert.equal(lotA.provenance.parent,'V170');
assert.equal(lotA.provenance.parentSha,'755ac2500cdb1038eda526f29f277de708875632');

console.log(`SANA Data Room Executive V171 validation: PASS · ${registry.length} registry relations`);
