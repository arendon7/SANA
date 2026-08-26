import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const p171='apps/control-web/public/sana-v3-dataroom-executive-v171.js';
const p172='apps/control-web/public/sana-v3-dataroom-executive-v172.js';
const p173='apps/control-web/public/sana-v3-dataroom-executive-v173.js';
const s171=fs.readFileSync(p171,'utf8'),s172=fs.readFileSync(p172,'utf8'),src=fs.readFileSync(p173,'utf8');

for(const [pattern,label] of [
  [/\bVERSION\s*=\s*['"]V173['"]/, 'VERSION=V173'],
  [/\bSCHEMA\s*=\s*['"]SANA_DATAROOM_EXECUTIVE_CLAIMS_V1['"]/, 'claims schema'],
  [/CLAIM_TEMPLATES_V1/, 'controlled templates'],
  [/V171_FACTORY_REQUIRED/, 'V171 dependency'],[/V172_FACTORY_REQUIRED/, 'V172 dependency'],
  [/truthVerificationAuthority\s*:\s*false/, 'truth authority false'],[/sufficiencyAuthority\s*:\s*false/, 'sufficiency authority false'],[/decisionAuthority\s*:\s*false/, 'decision authority false'],
  [/CLAIM_COUNT ≠ SCORE/, 'claim count boundary'],[/NO_LLM_CLAIM_GENERATION/, 'no LLM claims']
])assert.ok(pattern.test(src),`missing V173 invariant: ${label}`);
for(const forbidden of ['fetch(','XMLHttpRequest','localStorage.setItem','sessionStorage.setItem','indexedDB.open','canonicalMutationAvailable:true','financialMutationAvailable:true','truthVerificationAuthority:true','sufficiencyAuthority:true','decisionAuthority:true','riskScore:','investmentScore:','overallScore:'])assert.ok(!src.includes(forbidden),`forbidden V173 token: ${forbidden}`);
assert.ok(!src.includes('const R=')&&!src.includes('const REGISTRY='),'V173 must not create a source registry');
assert.ok(src.includes("SOURCE_REFERENCE_PRESENT")&&src.includes("SOURCE_REFERENCE_UNAVAILABLE")&&src.includes("SNAPSHOT_REFERENCE_PRESENT")&&src.includes("CASE_REFERENCE_PRESENT")&&src.includes("EVENT_REFERENCE_PRESENT")&&src.includes("ENTITY_REFERENCE_PRESENT"),'bounded claim vocabulary incomplete');

const context={window:{},structuredClone,console};context.globalThis=context;
vm.runInNewContext(s171,context,{filename:p171});vm.runInNewContext(s172,context,{filename:p172});vm.runInNewContext(src,context,{filename:p173});
const factory=context.window.__SANA_DATAROOM_EXECUTIVE_V173_FACTORY__;
assert.ok(factory?.create,'V173 factory missing');assert.equal(factory.schema,'SANA_DATAROOM_EXECUTIVE_CLAIMS_V1');assert.equal(factory.version,'V173');

const data={
  snapshots:[{id:'SNAP-A',reportType:'RPT-DD',cutoff:'2026-08-20',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}}],
  state:{valid:true,state:'CAPTURED',snapshot:{id:'SNAP-A',cutoff:'2026-08-20'},rows:[{id:'ROW-A',lotId:'LOT-A'},{id:'ROW-B',lotId:'LOT-B'}],integrity:'SNAPSHOT_ONLY'},
  capital:[{id:'CAP-A',lot:'LOT-A',events:[{id:'CAP-A-E1',lot:'LOT-A',kind:'REVIEW_STARTED',observedAt:'2026-08-20T10:00:00-05:00'}]},{id:'CAP-B',lot:'LOT-B',events:[{id:'CAP-B-E1',lot:'LOT-B',kind:'REVIEW_STARTED',observedAt:'2026-08-20T11:00:00-05:00'}]}],
  refs:[{id:'RG-A',lot:'LOT-A',events:[{id:'RG-A-E1',lot:'LOT-A',kind:'REVIEW_SCOPE_DECLARED'}]},{id:'RG-B',lot:'LOT-B',events:[{id:'RG-B-E1',lot:'LOT-B',kind:'REVIEW_SCOPE_DECLARED'}]}]
};
const before=JSON.stringify(data),state=()=>data.state;
const host={
  DEMO:{lots:[{id:'LOT-A'},{id:'LOT-B'}]},
  __SANA_DATAROOM_360__:{state},__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>data.snapshots},
  __SANA_CAPITAL_REVIEW__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},__SANA_CAPITAL_GOVERNANCE__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},__SANA_DATAROOM_FINDINGS__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},
  __SANA_DUE_DILIGENCE_GAPS__:{current:()=>({valid:true,state:'CAPTURED',snapshot:data.state.snapshot,gaps:[{id:'GAP-A',lot:'LOT-A'},{id:'GAP-B',lot:'LOT-B'}]})},
  __SANA_DATAROOM_PHENOLOGY_HISTORY__:{state},__SANA_DATAROOM_LABOR_HISTORY__:{state},__SANA_DATAROOM_HEALTH_HISTORY__:{state},__SANA_DATAROOM_HEALTH_LIFECYCLE__:{state},__SANA_DATAROOM_NUTRITION_HISTORY__:{state},__SANA_DATAROOM_FORECAST_HISTORY__:{state},__SANA_DATAROOM_HARVEST_HISTORY__:{state},__SANA_DATAROOM_INVENTORY_HISTORY__:{state},__SANA_DATAROOM_ECONOMIC_RECONCILIATION_HISTORY__:{state},__SANA_DATAROOM_COMMERCIAL_HISTORY__:{state},__SANA_DATAROOM_DATA_TRUST_HISTORY__:{state},__SANA_DATAROOM_CAPTURE_SYNC_HISTORY__:{state},__SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__:{state},__SANA_DATAROOM_CIRCULARITY_HISTORY__:{state},__SANA_DATAROOM_MATERIAL_HISTORY__:{state},__SANA_DATAROOM_IMPACT_HISTORY__:{state},__SANA_DATAROOM_CAPITAL_GOVERNANCE_HISTORY__:{state},__SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__:{state},__SANA_DATAROOM_FINDINGS_HISTORY__:{state},
  __SANA_DATAROOM_REVIEW_GOVERNANCE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_CASE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_HANDOFF__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_FEEDBACK__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_RESPONSE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_DISPOSITION__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_ROUND__:{cases:()=>data.refs}
};

const api=factory.create(host),result=api.build({lot:'LOT-A'}),locatorApi=context.window.__SANA_DATAROOM_EXECUTIVE_V172_FACTORY__.create(host),locators=locatorApi.build({lot:'LOT-A'}).locators,locatorMap=new Map(locators.map(l=>[l.locatorKey,l]));
assert.equal(result.scope.lot,'LOT-A');assert.equal(result.authority.truthVerificationAuthority,false);assert.equal(result.authority.sufficiencyAuthority,false);assert.equal(result.authority.decisionAuthority,false);assert.equal(result.authority.aiAuthority,'ADVISORY_ONLY');
assert.equal(result.summary.truthVerified,0);assert.equal(result.summary.sufficiencyDetermined,0);assert.equal(result.summary.decisionAuthority,0);assert.equal(result.summary.semantics,'CLAIM_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE');
assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.claims)&&Object.isFrozen(result.authority));
assert.equal(new Set(result.claims.map(c=>c.claimId)).size,result.claims.length,'claim IDs must be unique');
assert.ok(result.claims.every(c=>c.truthVerified===false&&c.sufficiencyDetermined===false&&c.decisionAuthority===false&&c.referenceOnly===true));
assert.ok(result.claims.every(c=>['SOURCE_REFERENCE_PRESENT','SOURCE_REFERENCE_UNAVAILABLE','SNAPSHOT_REFERENCE_PRESENT','CASE_REFERENCE_PRESENT','EVENT_REFERENCE_PRESENT','ENTITY_REFERENCE_PRESENT'].includes(c.claimClass)));
for(const claim of result.claims){
  for(const key of claim.locatorKeys)assert.ok(locatorMap.has(key),`claim points outside V172 result: ${key}`);
  if(claim.supportState==='REFERENCED_ONLY')assert.ok(claim.locatorKeys.length>0&&claim.locatorKeys.every(k=>locatorMap.get(k).kind!=='SOURCE_ONLY'),'referenced claim must use explicit non-source-only locators');
  if(claim.supportState==='UNAVAILABLE_OR_PARTIAL')assert.ok(claim.locatorKeys.every(k=>locatorMap.get(k).kind==='SOURCE_ONLY'),'unavailable claim must use only SOURCE_ONLY locators');
}
const capitalClaim=result.claims.find(c=>c.sourceId==='CAPITAL_REVIEW'&&c.claimClass==='SOURCE_REFERENCE_PRESENT');assert.ok(capitalClaim,'capital source claim missing');assert.ok(capitalClaim.locatorKeys.every(k=>{const l=locatorMap.get(k);return !l.declaredLot||l.declaredLot==='LOT-A'}),'capital claim inherited cross-lot locator');
const eventClaim=result.claims.find(c=>c.sourceId==='CAPITAL_REVIEW'&&c.claimClass==='EVENT_REFERENCE_PRESENT');assert.ok(eventClaim&&eventClaim.locatorKeys.some(k=>locatorMap.get(k).referenceId==='CAP-A-E1'));assert.ok(!eventClaim.locatorKeys.some(k=>locatorMap.get(k).referenceId==='CAP-B-E1'));
const refClaim=result.claims.find(c=>c.sourceId==='REVIEW_GOVERNANCE'&&c.claimClass==='EVENT_REFERENCE_PRESENT');assert.ok(refClaim);assert.ok(refClaim.scopeQualities.every(x=>x==='REFERENCE_CASE'),'reference-case claim scope promoted incorrectly');
const nutrition=result.claims.find(c=>c.sourceId==='NUTRITION_V2_HISTORY_EXPECTED');assert.ok(nutrition);assert.equal(nutrition.claimClass,'SOURCE_REFERENCE_UNAVAILABLE');assert.equal(nutrition.supportState,'UNAVAILABLE_OR_PARTIAL');
const first=JSON.stringify(api.build({lot:'LOT-A'}).claims.map(c=>({id:c.claimId,keys:Array.from(c.locatorKeys),statement:c.statement})));const second=JSON.stringify(api.build({lot:'LOT-A'}).claims.map(c=>({id:c.claimId,keys:Array.from(c.locatorKeys),statement:c.statement})));assert.equal(first,second,'claims are not deterministic');
const capSection=api.forSection('CAPITAL_READINESS',{lot:'LOT-A'});assert.ok(capSection.claims.length>0&&capSection.claims.every(c=>c.sectionId==='CAPITAL_READINESS'));const capSource=api.forSource('CAPITAL_REVIEW',{lot:'LOT-A'});assert.ok(capSource.claims.length>0&&capSource.claims.every(c=>c.sourceId==='CAPITAL_REVIEW'));
assert.equal(JSON.stringify(data),before,'V173 mutated sources');assert.equal(result.provenance.parent,'V172');assert.equal(result.provenance.parentSha,'61a9eb5df8dffdc536bc107f886dcdf195d7c258');assert.equal(result.provenance.sourceRegistry,'V171_TYPED_REGISTRY');assert.equal(result.provenance.templates,'CLAIM_TEMPLATES_V1');

console.log(`SANA Data Room Executive V173 validation: PASS · ${result.claims.length} claims`);
