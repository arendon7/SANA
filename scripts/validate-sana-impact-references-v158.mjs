import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-impact-references.js','utf8');
const rows=[
  {id:'soil-om',name:'Materia orgánica',layer:'Suelo',boundary:{unit:'FIN-LE-001',scope:'Suelo',period:'Semestral'},provenance:{source:'Análisis DEMO'},verification:{state:'VERIFICADO_EXTERNO',external:true},navigation:[{view:'territory'},{view:'passport'}],integrity:'BASE'},
  {id:'water',name:'Uso de agua',layer:'Agua',boundary:{unit:'FIN-LE-001',scope:'Agua',period:'Ciclo'},provenance:{source:'IoT + bitácora'},verification:{state:'NO_VERIFICADO_EXTERNO',external:false},navigation:[],integrity:'BASE'},
  {id:'legacy',name:'Indicador legacy',layer:'Gestión',boundary:{unit:'FIN-LE-001',scope:'Gestión',period:'Semanal'},provenance:{source:'Label legacy'},verification:{state:'INTERNO',external:false},navigation:[{view:'field'}],integrity:'BASE'}
];
const base={rows:()=>rows.map(r=>structuredClone(r)),summary:()=>({indicators:rows.length,externallyVerified:1,integrity:'BASE'}),integrity:'BASE'};
const sourceRows=[
  {id:'SRC-FARM',scope:'FIN-LE-001',version:'v1',cut:'2026-08-01',state:'REFERENCE_ONLY',provider:'SHAREPOINT',externalId:'SECRET-EXT-FARM'},
  {id:'SRC-FARM-2',scope:'FIN-LE-001',version:'v2',cut:'2026-08-10',state:'REFERENCE_ONLY',provider:'SHAREPOINT',externalId:'SECRET-EXT-FARM2'},
  {id:'SRC-LOT',scope:'CAF-A1',version:'v1',cut:'2026-08-01',state:'REFERENCE_ONLY',provider:'SHAREPOINT',externalId:'SECRET-EXT-LOT'},
  {id:'SRC-FUTURE',scope:'FIN-LE-001',version:'v2',cut:'2026-09-01',state:'REFERENCE_ONLY',provider:'SHAREPOINT',externalId:'SECRET-EXT-FUTURE'}
];
const records=[
  {id:'M0',type:'impact-reference-meta',createdAt:'2026-08-20T09:00:00-05:00',values:{sourceSchema:'SANA_IMPACT_LEDGER_V1',referenceVersion:'V158',indicatorId:'soil-om',sourceRefs:'SRC-LOT'}},
  {id:'M1',type:'impact-reference-meta',createdAt:'2026-08-25T09:00:00-05:00',values:{sourceSchema:'SANA_IMPACT_LEDGER_V1',referenceVersion:'V158',indicatorId:'soil-om',sourceRefs:'SRC-FARM, SRC-FARM, SRC-FARM-2'}},
  {id:'M2',type:'impact-reference-meta',createdAt:'2026-08-25T09:00:00-05:00',values:{sourceSchema:'SANA_IMPACT_LEDGER_V1',referenceVersion:'V158',indicatorId:'water',sourceRefs:'SRC-LOT, SRC-FUTURE, SRC-MISSING'}}
];
const sandbox={window:{__SANA_IMPACT_LEDGER__:base,__SANA_DOCUMENT_SOURCES__:{rows:()=>sourceRows.map(r=>structuredClone(r))}},storage:{records},views:{impact:()=>'<footer class="footer"></footer>'},document:{addEventListener:()=>{}},identity:{displayName:'QA'},openModal:()=>{},esc:v=>String(v??''),metric:()=>'',structuredClone,console,Date};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_IMPACT_LEDGER__;
assert.equal(api.schema,'SANA_IMPACT_LEDGER_V1');
assert.equal(api.referenceVersion,'V158');

const good=api.forIndicator('soil-om');
assert.equal(good.referenceState,'CAPTURED');
assert.equal(good.referenceCoverage.total,2); // duplicate SRC-FARM is deduplicated
assert.equal(good.referenceCoverage.linked,2);
assert.equal(good.referenceCoverage.percent,100);
assert.equal(good.referenceIssues,0);
assert.deepEqual([...good.referenceRows.map(r=>r.refId)],['SRC-FARM','SRC-FARM-2']); // latest metadata replaces M0
assert.equal(good.verification.state,'VERIFICADO_EXTERNO'); // base verification is preserved, not overwritten by refs
assert.ok(good.referenceRows.every(r=>r.reference.status==='LINKED'));
for(const r of good.referenceRows){assert.equal('externalId' in r.reference.target,false);assert.equal('provider' in r.reference.target,false)}
assert.equal(good.declaredReferenceRows.length,3);
assert.ok(good.declaredReferenceRows.every(r=>r.status==='DECLARED_NON_CANONICAL_REFERENCE'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='PROVENANCE_LABEL_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='NAVIGATION_HINT_DERIVED'));

const bad=api.forIndicator('water');
assert.equal(bad.referenceState,'CAPTURED');
assert.equal(bad.referenceCoverage.total,3);
assert.equal(bad.referenceCoverage.linked,0);
assert.equal(bad.referenceIssues,3);
assert.ok(bad.referenceRows.some(r=>r.refId==='SRC-LOT'&&r.reference.status==='CROSS_SCOPE_REFERENCE'));
assert.ok(bad.referenceRows.some(r=>r.refId==='SRC-FUTURE'&&r.reference.status==='FORWARD_REFERENCE'));
assert.ok(bad.referenceRows.some(r=>r.refId==='SRC-MISSING'&&r.reference.status==='MISSING_TARGET'));

const legacy=api.forIndicator('legacy');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(legacy.referenceCoverage.total,0);
assert.equal(legacy.referenceIssues,0);

const summary=api.summary();
assert.equal(summary.externallyVerified,1); // inherited ledger truth remains visible
assert.equal(summary.verificationCreatedByReferences,0);
assert.equal(summary.certificationCreatedByReferences,0);
assert.equal(summary.referenceCaptured,2);
assert.equal(summary.referenceExpected,5);
assert.equal(summary.referenceLinked,2);
assert.equal(summary.referenceIssues,3);
assert.equal(summary.legacyReferenceNotCaptured,1);
assert.equal(summary.declaredNonCanonical,4);
assert.match(api.integrity,/SOURCE_REFERENCE ≠ INDICATOR_VALIDITY/);
assert.match(api.integrity,/SOURCE_REFERENCE ≠ CAUSALITY/);
assert.match(api.integrity,/SOURCE_REGISTRY_REFERENCE ≠ EXTERNAL_VERIFICATION/);
assert.match(api.integrity,/REFERENCE ≠ CERTIFICATION ≠ IMPACT_VERIFICATION/);
console.log('impact source references V158: ok');
