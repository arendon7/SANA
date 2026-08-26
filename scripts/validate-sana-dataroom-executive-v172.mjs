import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const v171Path='apps/control-web/public/sana-v3-dataroom-executive-v171.js';
const v172Path='apps/control-web/public/sana-v3-dataroom-executive-v172.js';
const v171src=fs.readFileSync(v171Path,'utf8');
const src=fs.readFileSync(v172Path,'utf8');

for(const [pattern,label] of [
  [/\bVERSION\s*=\s*['"]V172['"]/, 'VERSION=V172'],
  [/\bSCHEMA\s*=\s*['"]SANA_DATAROOM_EXECUTIVE_LOCATOR_V1['"]/, 'locator schema'],
  [/V171_FACTORY_REQUIRED/, 'V171 dependency'],
  [/BOUNDED_EXPLICIT_FIELDS_ONLY/, 'bounded extraction'],
  [/LOCATOR ≠ EVIDENCE_VERIFICATION/, 'locator verification boundary'],
  [/verificationAuthority\s*:\s*false/, 'verification authority false'],
  [/financialMutationAvailable\s*:\s*false/, 'financial mutation false'],
  [/aiAuthority\s*:\s*['"]ADVISORY_ONLY['"]/, 'AI advisory only']
])assert.ok(pattern.test(src),`missing V172 semantic invariant: ${label}`);
for(const forbidden of ['fetch(','XMLHttpRequest','localStorage.setItem','sessionStorage.setItem','indexedDB.open','canonicalMutationAvailable:true','financialMutationAvailable:true','verificationAuthority:true','riskScore:','investmentScore:','overallScore:'])assert.ok(!src.includes(forbidden),`forbidden V172 token: ${forbidden}`);
assert.ok(src.includes("const COLLECTIONS=Object.freeze(['rows','lots','cases','gaps','indicators'])"),'bounded top-level collection contract missing');
assert.ok(!/Object\.entries\s*\(\s*value\s*\)/.test(src),'arbitrary object crawler introduced');
assert.ok(!/Object\.values\s*\(\s*value\s*\)/.test(src),'arbitrary object crawler introduced');
assert.ok(!src.includes('const R=')&&!src.includes('const REGISTRY='),'V172 must consume V171 registry, not create a parallel registry');

const context={window:{},structuredClone,console};context.globalThis=context;
vm.runInNewContext(v171src,context,{filename:v171Path});
vm.runInNewContext(src,context,{filename:v172Path});
const factory=context.window.__SANA_DATAROOM_EXECUTIVE_V172_FACTORY__;
assert.ok(factory?.create,'V172 factory missing');
assert.equal(factory.schema,'SANA_DATAROOM_EXECUTIVE_LOCATOR_V1');
assert.equal(factory.version,'V172');

const data={
  snapshots:[
    {id:'SNAP-A',reportType:'RPT-DD',cutoff:'2026-08-20',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}},
    {id:'SNAP-B',reportType:'RPT-DD',cutoff:'2026-08-10',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}}
  ],
  state:{valid:true,state:'CAPTURED',snapshot:{id:'SNAP-A',cutoff:'2026-08-20'},rows:[{id:'ROW-A',lotId:'LOT-A',observedAt:'2026-08-19'},{id:'ROW-B',lotId:'LOT-B',observedAt:'2026-08-19'},{lotId:'LOT-A'}],integrity:'SNAPSHOT_ONLY'},
  capital:[
    {id:'CAP-A',lot:'LOT-A',observedAt:'2026-08-20',events:[{id:'CAP-A-E1',lot:'LOT-A',kind:'REVIEW_STARTED',observedAt:'2026-08-20T10:00:00-05:00'}]},
    {id:'CAP-B',lot:'LOT-B',observedAt:'2026-08-20',events:[{id:'CAP-B-E1',lot:'LOT-B',kind:'REVIEW_STARTED',observedAt:'2026-08-20T11:00:00-05:00'}]}
  ],
  refs:[
    {id:'RG-A',lot:'LOT-A',events:[{id:'RG-A-E1',lot:'LOT-A',kind:'REVIEW_SCOPE_DECLARED',observedAt:'2026-08-20T12:00:00-05:00'}]},
    {id:'RG-B',lot:'LOT-B',events:[{id:'RG-B-E1',lot:'LOT-B',kind:'REVIEW_SCOPE_DECLARED',observedAt:'2026-08-20T13:00:00-05:00'}]}
  ]
};
const before=JSON.stringify(data);
const snapshotState=()=>data.state;
const host={
  DEMO:{lots:[{id:'LOT-A'},{id:'LOT-B'}]},
  __SANA_DATAROOM_360__:{state:snapshotState},
  __SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>data.snapshots},
  __SANA_CAPITAL_REVIEW__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot),integrity:'REVIEW_ONLY'},
  __SANA_CAPITAL_GOVERNANCE__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot),integrity:'CAPITAL_ONLY'},
  __SANA_DATAROOM_FINDINGS__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot),integrity:'FINDINGS_ONLY'},
  __SANA_DUE_DILIGENCE_GAPS__:{current:()=>({valid:true,state:'CAPTURED',snapshot:data.state.snapshot,gaps:[{id:'GAP-A',lot:'LOT-A',createdAt:'2026-08-20'},{id:'GAP-B',lot:'LOT-B',createdAt:'2026-08-20'}],integrity:'GAPS_ONLY'})},
  __SANA_DATAROOM_PHENOLOGY_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_LABOR_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_HEALTH_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_HEALTH_LIFECYCLE__:{state:snapshotState},
  __SANA_DATAROOM_NUTRITION_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_FORECAST_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_HARVEST_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_INVENTORY_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_ECONOMIC_RECONCILIATION_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_COMMERCIAL_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_DATA_TRUST_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_CAPTURE_SYNC_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_CIRCULARITY_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_MATERIAL_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_IMPACT_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_CAPITAL_GOVERNANCE_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_FINDINGS_HISTORY__:{state:snapshotState},
  __SANA_DATAROOM_REVIEW_GOVERNANCE__:{cases:()=>data.refs},
  __SANA_DATAROOM_REVIEW_CASE__:{cases:()=>data.refs},
  __SANA_DATAROOM_REVIEW_HANDOFF__:{cases:()=>data.refs},
  __SANA_DATAROOM_REVIEW_FEEDBACK__:{cases:()=>data.refs},
  __SANA_DATAROOM_REVIEW_RESPONSE__:{cases:()=>data.refs},
  __SANA_DATAROOM_REVIEW_DISPOSITION__:{cases:()=>data.refs},
  __SANA_DATAROOM_REVIEW_ROUND__:{cases:()=>data.refs}
};

const api=factory.create(host);
const lotA=api.build({lot:'LOT-A'});
assert.equal(lotA.scope.lot,'LOT-A');
assert.equal(lotA.authority.canonicalMutationAvailable,false);
assert.equal(lotA.authority.financialMutationAvailable,false);
assert.equal(lotA.authority.verificationAuthority,false);
assert.equal(lotA.authority.aiAuthority,'ADVISORY_ONLY');
assert.equal(lotA.summary.verifiedByLocator,0);
assert.equal(lotA.summary.semantics,'LOCATOR_COUNTS_ONLY · NOT_SCORE · NOT_ASSURANCE');
assert.ok(Object.isFrozen(lotA)&&Object.isFrozen(lotA.locators)&&Object.isFrozen(lotA.authority));
assert.ok(lotA.locators.every(x=>x.referenceOnly===true&&x.verificationState==='NOT_VERIFIED_BY_LOCATOR'));
assert.ok(lotA.locators.every(x=>['SNAPSHOT_REF','CASE_REF','EVENT_REF','ENTITY_REF','SOURCE_ONLY'].includes(x.kind)));
assert.equal(new Set(lotA.locators.map(x=>x.locatorKey)).size,lotA.locators.length,'locator keys must be deterministic/unique per source reference');

const ddSnapshots=lotA.locators.filter(x=>x.sourceId==='DUE_DILIGENCE_SNAPSHOT'&&x.kind==='SNAPSHOT_REF');
assert.deepEqual(ddSnapshots.map(x=>x.referenceId).sort(),['SNAP-A','SNAP-B']);
assert.ok(ddSnapshots.every(x=>x.scopeQuality==='SNAPSHOT_GLOBAL'));

const stateRows=lotA.locators.filter(x=>x.sourceId==='DATAROOM_360'&&x.kind==='ENTITY_REF');
assert.ok(stateRows.some(x=>x.referenceId==='ROW-A'));
assert.ok(!stateRows.some(x=>x.referenceId==='ROW-B'),'snapshot entity filter leaked other declared lot');
assert.ok(stateRows.every(x=>x.scopeQuality==='SNAPSHOT_GLOBAL'),'filtered snapshot entities must not become LOT_EXACT');
assert.ok(stateRows.some(x=>x.limitations.some(v=>v==='DECLARED_ENTITY_LOT_FILTER_WITHIN_SNAPSHOT_NOT_LOT_EXACT')));

const capitalCases=lotA.locators.filter(x=>x.sourceId==='CAPITAL_REVIEW'&&x.kind==='CASE_REF');
const capitalEvents=lotA.locators.filter(x=>x.sourceId==='CAPITAL_REVIEW'&&x.kind==='EVENT_REF');
assert.ok(capitalCases.some(x=>x.referenceId==='CAP-A'));
assert.ok(capitalEvents.some(x=>x.referenceId==='CAP-A-E1'&&x.parentRef==='CAP-A'));
assert.ok(!lotA.locators.some(x=>x.referenceId==='CAP-B'||x.referenceId==='CAP-B-E1'),'official lot-exact source leaked LOT-B');
assert.ok(capitalCases.every(x=>x.scopeQuality==='LOT_EXACT'));

const refEvents=lotA.locators.filter(x=>x.sourceId==='REVIEW_GOVERNANCE'&&x.kind==='EVENT_REF');
assert.ok(refEvents.some(x=>x.referenceId==='RG-A-E1'));
assert.ok(!refEvents.some(x=>x.referenceId==='RG-B-E1'));
assert.ok(refEvents.every(x=>x.scopeQuality==='REFERENCE_CASE'));
assert.ok(refEvents.every(x=>x.limitations.some(v=>v==='REFERENCE_CASE_EVENT_NOT_VERIFIED')));

const missingNutrition=lotA.locators.filter(x=>x.sourceId==='NUTRITION_V2_HISTORY_EXPECTED');
assert.equal(missingNutrition.length,1);
assert.equal(missingNutrition[0].kind,'SOURCE_ONLY');
assert.ok(missingNutrition[0].limitations.includes('SOURCE_UNAVAILABLE'));

const gaps=lotA.locators.filter(x=>x.sourceId==='DUE_DILIGENCE_GAPS'&&x.kind==='ENTITY_REF');
assert.ok(gaps.some(x=>x.referenceId==='GAP-A'));
assert.ok(!gaps.some(x=>x.referenceId==='GAP-B'));
assert.ok(gaps.every(x=>x.parentRef==='SNAP-A'));

const onlyCapital=api.forSection('CAPITAL_READINESS',{lot:'LOT-A'});
assert.ok(onlyCapital.locators.length>0&&onlyCapital.locators.every(x=>x.sectionId==='CAPITAL_READINESS'));
const sourceSlice=api.forSource('CAPITAL_REVIEW',{lot:'LOT-A'});
assert.ok(sourceSlice.locators.length>0&&sourceSlice.locators.every(x=>x.sourceId==='CAPITAL_REVIEW'));
assert.equal(JSON.stringify(data),before,'V172 mutated source fixtures');
assert.equal(lotA.provenance.parent,'V171');
assert.equal(lotA.provenance.parentSha,'979e7de4981acff4f1c45cd5032a8cda53a0a3e7');
assert.equal(lotA.provenance.sourceRegistry,'V171_TYPED_REGISTRY');
assert.equal(lotA.provenance.extraction,'BOUNDED_EXPLICIT_FIELDS_ONLY');

console.log(`SANA Data Room Executive V172 validation: PASS · ${lotA.locators.length} locators`);
