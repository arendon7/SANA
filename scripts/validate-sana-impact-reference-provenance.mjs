import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotSrc=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-impact-references.js','utf8');
const dataroomSrc=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-impact-references.js','utf8');
const cycleSrc=fs.readFileSync('apps/control-web/public/sana-v3-cycle-impact-references.js','utf8');
const ddSrc=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-impact-reference-gaps.js','utf8');

const impactRows=[
  {id:'IMP-1',name:'Indicador sensible',layer:'AMBIENTAL',baseline:{value:10,unit:'kg'},observation:{value:20,unit:'kg'},calculation:{value:99,method:'SECRET_METHOD'},provenance:{source:'PRIVATE SOURCE',quality:'ALTA',qualityScore:91},verification:{state:'NOT_EXTERNALLY_VERIFIED'},boundary:{unit:'FARM'},navigation:[{view:'impact'}],referenceVersion:'V158',referenceState:'CAPTURED',referenceCoverage:{linked:1,total:1,percent:100},referenceIssues:0,referenceRows:[{sourceIndicatorId:'IMP-1',kind:'IMPACT_SOURCE_REF',refId:'SRC-1',origin:'HUMAN_DECLARED_SOURCE_REGISTRY_REFERENCE',reference:{status:'LINKED',domain:'SOURCE_REGISTRY',target:{id:'SRC-1',scope:'FARM',version:'v1',cut:'2026-08-01',state:'REFERENCE_ONLY'}}}],declaredReferenceRows:[{sourceIndicatorId:'IMP-1',kind:'PROVENANCE_LABEL_DECLARED',field:'provenance.source',status:'DECLARED_NON_CANONICAL_REFERENCE'},{sourceIndicatorId:'IMP-1',kind:'NAVIGATION_HINT_DERIVED',field:'navigation.view',status:'DECLARED_NON_CANONICAL_REFERENCE'}]},
  {id:'IMP-2',name:'Legacy',baseline:{value:1},observation:{value:2},provenance:{source:'LEGACY SOURCE'},referenceVersion:'',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked:0,total:0,percent:null},referenceIssues:0,referenceRows:[],declaredReferenceRows:[{sourceIndicatorId:'IMP-2',kind:'PROVENANCE_LABEL_DECLARED',field:'provenance.source',status:'DECLARED_NON_CANONICAL_REFERENCE'}]}
];
const impactApi={referenceVersion:'V158',rows:()=>structuredClone(impactRows),summary:()=>({verificationCreatedByReferences:0,certificationCreatedByReferences:0,externallyVerified:0})};
const document={addEventListener:()=>{},getElementById:()=>null};
const sandbox={window:{__SANA_IMPACT_LEDGER__:impactApi},document,modalAction:'',queueMicrotask:fn=>fn(),structuredClone,Date,console};
vm.createContext(sandbox);vm.runInContext(snapshotSrc,sandbox);
const api=sandbox.window.__SANA_REPORT_SNAPSHOT_IMPACT_REFERENCES__;
assert.ok(api,'snapshot impact reference api exposed');
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',impact:{indicators:[{id:'IMP-1',baseline:10,current:20,method:'RICH'}],humanReviewed:true,externallyVerified:0}};
api.enrichImpactReferences(manifest);
assert.ok(manifest.impactReferences,'impactReferences captured');
assert.equal(manifest.impactReferences.sourceReferenceVersion,'V158');
assert.equal(manifest.impactReferences.capturedCount,1);
assert.equal(manifest.impactReferences.legacyCount,1);
assert.equal(manifest.impactReferences.linked,1);
assert.equal(manifest.impactReferences.expected,1);
assert.equal(manifest.impactReferences.issueCount,0);
assert.equal(manifest.impactReferences.declaredNonCanonicalCount,2);
assert.equal(manifest.impactReferences.contentLeakCount,0);
assert.equal(manifest.impact.indicators[0].baseline,10,'rich impact block remains intact');
const serialized=JSON.stringify(manifest.impactReferences);
for(const secret of ['Indicador sensible','SECRET_METHOD','PRIVATE SOURCE','ALTA','NOT_EXTERNALLY_VERIFIED'])assert.ok(!serialized.includes(secret),`impact reference block leaked ${secret}`);
const row=manifest.impactReferences.indicators.find(x=>x.indicatorId==='IMP-1');
assert.deepEqual(JSON.parse(JSON.stringify(row.rows[0])),{sourceIndicatorId:'IMP-1',kind:'IMPACT_SOURCE_REF',refId:'SRC-1',status:'LINKED',domain:'SOURCE_REGISTRY',targetId:'SRC-1',targetScope:'FARM',targetVersion:'v1',targetCut:'2026-08-01',targetState:'REFERENCE_ONLY'});
const legacy=manifest.impactReferences.indicators.find(x=>x.indicatorId==='IMP-2');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(legacy.total,0);

for(const [name,src] of [['dataroom',dataroomSrc],['cycle',cycleSrc],['dd',ddSrc]]){
  assert.ok(!/__SANA_IMPACT_LEDGER__|__SANA_DOCUMENT_SOURCES__|storage\?*\.?records|localStorage/.test(src),`${name} must be snapshot-only`);
}
assert.match(cycleSrc,/NON_WEIGHTED/);
assert.match(cycleSrc,/no modifica completitud, readyForArchive, metodología ni gates/);
assert.match(ddSrc,/NOT_CAPTURED_OR_LEGACY ≠ GAP/);
assert.match(ddSrc,/DECLARED_NON_CANONICAL_REFERENCE ≠ GAP/);
assert.ok(!/baseline|observation|calculation\?\.|provenance\?\.|qualityScore|externallyVerified/.test(snapshotSrc.split('function snapshotIndicator')[1].split('function forbiddenPaths')[0]),'snapshotIndicator must not copy rich impact values');
assert.match(snapshotSrc,/COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED/);
assert.match(dataroomSrc,/REFERENCE_CHANGE ≠ IMPACT_CHANGE ≠ METHODOLOGY_CHANGE/);
assert.match(ddSrc,/REFERENCE_GAP ≠ METHODOLOGY_FAILURE ≠ EXTERNAL_VERIFICATION_FAILURE/);
console.log('impact reference provenance V159: ok');
