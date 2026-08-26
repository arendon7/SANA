import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const paths={
  snapshot:'apps/control-web/public/sana-v3-report-snapshot-material-references.js',
  cycle:'apps/control-web/public/sana-v3-cycle-material-references.js',
  dd:'apps/control-web/public/sana-v3-due-diligence-material-reference-gaps.js',
  dataroom:'apps/control-web/public/sana-v3-dataroom-material-references.js'
};
const src=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
for(const [k,s] of Object.entries(src))assert.ok(s.length>100,`${k} source missing`);
for(const k of ['cycle','dd','dataroom']){
  assert.doesNotMatch(src[k],/__SANA_MATERIAL_CHAIN__/i,`${k} must not read live material chain`);
  assert.doesNotMatch(src[k],/localStorage|storage\?*\.?records|storage\.records/i,`${k} must not read live storage`);
}
assert.match(src.cycle,/NON_WEIGHTED/);
assert.match(src.cycle,/ORPHAN_SOURCE_NEVER_ASSIGNED_BY_TARGET/);
assert.match(src.dd,/NOT_CAPTURED_OR_LEGACY ≠ GAP/);
assert.match(src.dd,/DECLARED_NON_CANONICAL_REFERENCE ≠ GAP/);
assert.match(src.dataroom,/ROW_LEVEL_STRUCTURAL_DIFF/);
assert.match(src.dataroom,/REFERENCE_CHANGE ≠ MATERIAL_CHANGE ≠ GENETIC_CHANGE ≠ PHYTOSANITARY_CHANGE/);
assert.match(src.snapshot,/CONTENT_MINIMIZED/);
assert.match(src.snapshot,/NO_NONCANONICAL_VALUES/);
assert.match(src.snapshot,/NO_RICH_MATERIAL_PAYLOAD/);

const chainCaptured={identity:{id:'M1',targetLot:'L1',species:'SECRET-SPECIES',origin:'SECRET-ORIGIN'},target:'L1',referenceState:'CAPTURED',referenceVersion:'V156',referenceCoverage:{linked:2,total:3,percent:67},referenceIssues:1,declaredReferenceRows:[{kind:'SOURCE_REFERENCE_DECLARED',valueCaptured:true,status:'DECLARED_NON_CANONICAL_REFERENCE',value:'SECRET-SOURCE'},{kind:'EVIDENCE_REFERENCE_DECLARED',valueCaptured:true,status:'DECLARED_NON_CANONICAL_REFERENCE',value:'SECRET-EVIDENCE'}],referenceRows:[{source:{id:'R1',type:'material-lifecycle-event',materialId:'M1',observedAt:'SECRET-TIME'},kind:'DESTINATION_LOT_REF',targetId:'L1',status:'LINKED',target:{id:'L1',kind:'DEMO_LOT',materialId:'',lot:'L1'}},{source:{id:'C1',type:'economics-cost',materialId:'M1'},kind:'COST_MATERIAL_EVENT_REF',targetId:'E1',status:'LINKED',target:{id:'E1',kind:'MATERIAL_EVENT',materialId:'M1',lot:'L1'}},{source:{id:'I1',type:'inventory-movement',materialId:'M1'},kind:'INVENTORY_MATERIAL_EVENT_REF',targetId:'E2',status:'CROSS_MATERIAL_REFERENCE',target:{id:'E2',kind:'MATERIAL_EVENT',materialId:'M2',lot:'L2'}}],quantities:{declaredLoss:9,latestSurvivalRate:12},relations:{costAmount:999999},evidence:{coverage:77}};
const chainLegacy={identity:{id:'M2',targetLot:'L2',origin:'LEGACY-ORIGIN'},target:'L2',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:'V156',referenceCoverage:{linked:0,total:0,percent:100},referenceIssues:0,declaredReferenceRows:[],referenceRows:[]};
const orphan=[{source:{id:'O1',type:'inventory-movement',materialId:'M9',observedAt:'SECRET'},kind:'MATERIAL_ID_REF',targetId:'M9',status:'MISSING_TARGET',target:null,orphanSource:true},{source:{id:'O2',type:'inventory-movement',materialId:'M9'},kind:'INVENTORY_MATERIAL_EVENT_REF',targetId:'E1',status:'SOURCE_MATERIAL_MISSING',target:{id:'E1',kind:'MATERIAL_EVENT',materialId:'M1',lot:'L1'},orphanSource:true}];
const api={referenceVersion:'V156',all:()=>structuredClone([chainCaptured,chainLegacy]),orphanReferenceRows:()=>structuredClone(orphan),summary:()=>({orphanSourceCount:2,declaredNonCanonical:2})};
const sandbox={window:{__SANA_MATERIAL_CHAIN__:api},document:{addEventListener:()=>{},getElementById:()=>null},queueMicrotask,structuredClone,console,Date};
vm.createContext(sandbox);vm.runInContext(src.snapshot,sandbox);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',material:{rich:'KEEP_ME',origin:'RICH_ORIGIN',costAmount:12345}};
const original=structuredClone(manifest.material);
sandbox.window.__SANA_REPORT_SNAPSHOT_MATERIAL_REFERENCES__.enrichMaterialReferences(manifest);
assert.deepEqual(manifest.material,original,'rich material block must remain untouched');
const d=manifest.materialReferences;
assert.ok(d,'materialReferences missing');
assert.equal(d.sourceReferenceVersion,'V156');
assert.equal(d.capturedCount,1);
assert.equal(d.legacyCount,1);
assert.equal(d.orphanSourceCount,2);
assert.equal(d.expected,5);
assert.equal(d.linked,2);
assert.equal(d.issueCount,3);
assert.equal(d.declaredNonCanonicalCount,2);
assert.equal(d.contentLeakCount,0);
assert.equal(d.chains[0].declaredReferenceCounts.SOURCE_REFERENCE_DECLARED,1);
assert.equal(d.chains[0].declaredReferenceCounts.EVIDENCE_REFERENCE_DECLARED,1);
assert.equal(d.orphanRows.length,2);
assert.equal(d.orphanRows[0].orphanSource,true);
const json=JSON.stringify(d);
for(const secret of ['SECRET-SPECIES','SECRET-ORIGIN','SECRET-SOURCE','SECRET-EVIDENCE','SECRET-TIME','999999'])assert.ok(!json.includes(secret),`leak: ${secret}`);
for(const forbidden of ['sourceRef','evidenceRef','latestSurvivalRate','declaredLoss','costAmount','species','origin','observedAt'])assert.ok(!Object.keys(d).includes(forbidden));
assert.match(d.integrity,/REFERENCE_CHANGE ≠ MATERIAL\/GENETIC\/PHYTOSANITARY_CHANGE/);
console.log('material reference history V157: ok');
