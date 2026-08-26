import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const files={
  snapshot:'apps/control-web/public/sana-v3-report-snapshot-circularity-references.js',
  dataroom:'apps/control-web/public/sana-v3-dataroom-circularity-references.js',
  cycle:'apps/control-web/public/sana-v3-cycle-circularity-references.js',
  dd:'apps/control-web/public/sana-v3-due-diligence-circularity-reference-gaps.js'
};
const src=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));

for(const k of ['dataroom','cycle','dd']){
  assert.doesNotMatch(src[k],/__SANA_CIRCULARITY_LEDGER__/);
  assert.doesNotMatch(src[k],/storage\.?|localStorage/);
  assert.match(src[k],/NO_LIVE_FALLBACK/);
}
assert.match(src.cycle,/NON_WEIGHTED/);
assert.doesNotMatch(src.cycle,/completeness\s*=|readyForArchive\s*=/);
assert.match(src.dd,/NOT_CAPTURED_OR_LEGACY ≠ GAP/);
assert.match(src.dd,/DECLARED_NON_CANONICAL_REFERENCE ≠ GAP/);
assert.match(src.snapshot,/NO_RETROFILL/);
assert.match(src.snapshot,/COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED/);
assert.match(src.dataroom,/ROW_LEVEL_STRUCTURAL_DIFF/);
assert.match(src.dataroom,/REFERENCE_CHANGE ≠ CIRCULARITY_CHANGE ≠ RECOVERY_CHANGE ≠ ENVIRONMENTAL_IMPACT_CHANGE/);

const fakeCase={
  id:'CIRC-1',lot:'L1',material:'FORBIDDEN-MATERIAL',referenceState:'CAPTURED_V154',referenceVersion:'V154',
  referenceCoverage:{linked:1,total:2,percent:50},referenceIssues:1,
  referenceRows:[
    {sourceEventId:'EV-1',sourceKind:'EVIDENCE',kind:'CIRCULARITY_SUPPORT_REF',refId:'EX-1',origin:'DECLARED_CIRCULARITY_EVENT',temporalPolicy:'ENFORCED_WHEN_COMPARABLE',reference:{status:'LINKED',domain:'CIRCULARITY_EVENT',target:{id:'EX-1',eventKind:'EXECUTION',lot:'L1',actualDestination:'FORBIDDEN-DEST'}}},
    {sourceEventId:'EV-1',sourceKind:'EVIDENCE',kind:'CIRCULARITY_SUPPORT_REF',refId:'MISSING',origin:'DECLARED_CIRCULARITY_EVENT',temporalPolicy:'ENFORCED_WHEN_COMPARABLE',reference:{status:'MISSING_TARGET',domain:'CIRCULARITY_EVENT',target:null}}
  ],
  declaredReferenceRows:[
    {kind:'EVIDENCE_REF_DECLARED',field:'evidenceRef',refId:'SECRET-EVIDENCE-REF',status:'DECLARED_NON_CANONICAL_REFERENCE'},
    {kind:'RECEIVER_REF_DECLARED',field:'receiverRef',refId:'SECRET-RECEIVER',status:'DECLARED_NON_CANONICAL_REFERENCE'},
    {kind:'SOURCE_ACTIVITY_DECLARED',field:'sourceActivity',refId:'SECRET-ACTIVITY',status:'DECLARED_NON_CANONICAL_REFERENCE'}
  ],
  quantity:999,detail:'FORBIDDEN-DETAIL'
};
const sandbox={window:{
  __SANA_CIRCULARITY_LEDGER__:{referenceVersion:'V154',cases:()=>[structuredClone(fakeCase)]},
  __SANA_REPORT_SNAPSHOT_CIRCULARITY__:{enrichCircularity:m=>{m.circularity={richV1Preserved:true};return m}}
},document:{addEventListener:()=>{},getElementById:()=>null},queueMicrotask:()=>{},structuredClone,console,Date};
vm.createContext(sandbox);vm.runInContext(src.snapshot,sandbox);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};
sandbox.window.__SANA_REPORT_SNAPSHOT_CIRCULARITY_REFERENCES__.enrichCircularityReferences(manifest);
assert.equal(manifest.circularity.richV1Preserved,true);
assert.ok(manifest.circularityReferences);
assert.equal(manifest.circularityReferences.sourceReferenceVersion,'V154');
assert.equal(manifest.circularityReferences.capturedCount,1);
assert.equal(manifest.circularityReferences.issueCount,1);
assert.equal(manifest.circularityReferences.declaredNonCanonicalCount,3);
assert.equal(manifest.circularityReferences.contentLeakCount,0);
const c=manifest.circularityReferences.cases[0];
assert.equal(c.referenceState,'CAPTURED_V154');
assert.equal(c.rows[0].targetEventId,'EX-1');
assert.equal(c.rows[0].targetKind,'EXECUTION');
assert.equal(c.declaredReferenceCounts.EVIDENCE_REF_DECLARED,1);
assert.equal(c.declaredReferenceCounts.RECEIVER_REF_DECLARED,1);
assert.equal(c.declaredReferenceCounts.SOURCE_ACTIVITY_DECLARED,1);
assert.equal(c.declaredReferenceValuePolicy,'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED');
const serialized=JSON.stringify(manifest.circularityReferences);
for(const forbidden of ['SECRET-EVIDENCE-REF','SECRET-RECEIVER','SECRET-ACTIVITY','FORBIDDEN-MATERIAL','FORBIDDEN-DEST','FORBIDDEN-DETAIL'])assert.ok(!serialized.includes(forbidden),forbidden);
for(const key of ['evidenceRef','receiverRef','sourceActivity','material','quantity','actualDestination','detail'])assert.ok(!Object.prototype.hasOwnProperty.call(c,key),key);

const old={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',circularity:{richV1Preserved:true}};
const noRefSandbox={window:{__SANA_REPORT_SNAPSHOT_CIRCULARITY__:{enrichCircularity:m=>m}},document:{addEventListener:()=>{},getElementById:()=>null},queueMicrotask:()=>{},console,Date};
vm.createContext(noRefSandbox);vm.runInContext(src.snapshot,noRefSandbox);
noRefSandbox.window.__SANA_REPORT_SNAPSHOT_CIRCULARITY_REFERENCES__.enrichCircularityReferences(old);
assert.equal(old.circularity.richV1Preserved,true);
assert.equal(old.circularityReferences,undefined);

for(const text of Object.values(src)){
  assert.doesNotMatch(text,/canonicalMutated\s*[:=]\s*true|productionExecutionAvailable\s*[:=]\s*true|verifiedDisposition\s*[:=]\s*true|certifiedRecovery\s*[:=]\s*true|environmentalImpactVerified\s*[:=]\s*true|regulatoryClassificationVerified\s*[:=]\s*true|creditApproved|eligibilityApproved|investmentApproved/i);
}
console.log('circularity reference provenance V155: ok');
