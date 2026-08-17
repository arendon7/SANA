import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-snapshot-compare.js','utf8');

globalThis.window={};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
globalThis.document={addEventListener:()=>{}};
globalThis.views={reports:()=>'<header></header>'};
globalThis.esc=value=>String(value??'');
globalThis.metric=()=>'';
globalThis.render=()=>{};

vm.runInThisContext(source,{filename:'sana-v3-snapshot-compare.js'});

const api=window.__SANA_SNAPSHOT_COMPARE__;
assert.ok(api,'snapshot compare API must be exposed');
assert.equal(api.schema,'SANA_DUE_DILIGENCE_SNAPSHOT_V1');

function snap(id,manifest){return {id,reportType:'RPT-DD',cutoff:'2026-08-17',reviewer:'QA',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',...manifest}}}

const base=snap('A',{
  plans:[{id:'P1',version:1,phase:'Floración',lot:'L1'}],
  cycles:[{planId:'P1',planVersion:1,completeness:60,evidenceGaps:3,openActivities:2,readyForArchive:false,reviewStatus:'SIN_REVISIÓN'}],
  passport:[{lot:'L1',integrity:70}],
  economics:[{lotId:'L1',budget:1000,baseRecorded:500,baseRecordedProvenance:'BASELINE_DEMO',localRecorded:100,observedStatus:'SIN_RESULTADO'}],
  sources:[{id:'S1',scope:'L1',version:'v1',cut:'2026-08-01',state:'REFERENCE_ONLY',externalId:'EXT-1'}],
  impact:{overallQuality:70,humanReviewed:false,reviewer:'',reviewedAt:null,internallyVerified:2,externallyVerified:0,externallyUnverified:3,estimated:1},
  capital:{readiness:45,gates:{operations:{score:50,state:'gap'}}}
});

const target=snap('B',{
  plans:[{id:'P1',version:2,phase:'Cuajado',lot:'L1'}],
  cycles:[{planId:'P1',planVersion:2,completeness:80,evidenceGaps:1,openActivities:0,readyForArchive:true,reviewStatus:'REVISADO DEMO'}],
  passport:[{lot:'L1',integrity:82}],
  economics:[{lotId:'L1',budget:1200,baseRecorded:500,baseRecordedProvenance:'BASELINE_DEMO',localRecorded:180,observedStatus:'LOCAL_ONLY',explicitCostCount:4,supportedExplicitCount:3,supportCoverage:75,mismatchCount:1,unallocatedCount:2,provenanceGranularity:'ADDITIVE_V1 · LOCAL_ONLY_COST_LINKS'}],
  sources:[{id:'S1',scope:'L1',version:'v2',cut:'2026-08-15',state:'REFERENCE_ONLY',externalId:'EXT-1'}],
  impact:{overallQuality:78,humanReviewed:true,reviewer:'Técnico QA',reviewedAt:'2026-08-17T10:00:00Z',internallyVerified:2,externallyVerified:0,externallyUnverified:3,estimated:1,methodologyGranularity:'ADDITIVE_V1 · IMPACT_LEDGER',indicators:[{id:'water',baseline:4200,current:3444,unit:'m³/ha·ciclo',calculation:'-18.0%',estimated:true,estimationType:'ESTIMADO',quality:'ESTIMADO',qualityScore:58,verification:'NO_VERIFICADO_EXTERNO',method:'IoT + registros DEMO',source:'IoT + bitácora',frequency:'Ciclo',boundaryPeriod:'Ciclo',temporalState:'SNAPSHOT_CAPTURED_FROM_LIVE_METHOD'}]},
  capital:{readiness:58,gates:{operations:{score:72,state:'review'}}}
});

const result=api.compare(base,target);
assert.equal(result.valid,true);
assert.ok(result.total>0);
for(const domain of ['Plan','Cierre de ciclo','Passport','Economía','Fuentes','Impacto','Readiness'])assert.ok(result.domains.includes(domain),`missing domain ${domain}`);
assert.ok(result.changes.some(c=>c.kind==='ECONOMICO'));
assert.ok(result.changes.some(c=>c.kind==='METODOLOGICO'));
assert.ok(result.changes.some(c=>c.domain==='Readiness'&&c.field==='Readiness compuesto %'));

const supportDelta=result.changes.find(c=>c.domain==='Economía'&&c.field==='Cobertura de soporte %');
assert.ok(supportDelta,'support coverage delta must be visible');
assert.equal(supportDelta.kind,'PROCEDENCIA');
assert.equal(supportDelta.before,'—');
assert.equal(supportDelta.after,'75');
for(const field of ['Costos explícitos vinculados','Costos explícitos con soporte','Vínculos económicos inconsistentes','Costos no asignados a ciclo','Granularidad de procedencia']){
  assert.ok(result.changes.some(c=>c.domain==='Economía'&&c.field===field&&c.kind==='PROCEDENCIA'),`missing additive provenance field ${field}`);
}
const impactLedgerAdded=result.changes.find(c=>c.domain==='Impacto'&&c.entity==='water'&&c.field==='Registro');
assert.ok(impactLedgerAdded,'legacy → enriched V1 must expose added Impact indicator granularity');
assert.equal(impactLedgerAdded.before,'—');
assert.equal(impactLedgerAdded.after,'AGREGADO');

const indicatorBase=snap('I1',{impact:{overallQuality:70,indicators:[{id:'water',baseline:4200,current:3600,unit:'m³/ha·ciclo',calculation:'-14.3%',estimated:true,estimationType:'ESTIMADO',quality:'ESTIMADO',qualityScore:58,verification:'NO_VERIFICADO_EXTERNO',method:'Método A',source:'IoT + bitácora',frequency:'Ciclo',boundaryPeriod:'Ciclo',temporalState:'SNAPSHOT_CAPTURED_FROM_LIVE_METHOD'}]}});
const indicatorTarget=snap('I2',{impact:{overallQuality:70,indicators:[{id:'water',baseline:4200,current:3444,unit:'m³/ha·ciclo',calculation:'-18.0%',estimated:true,estimationType:'ESTIMADO',quality:'ESTIMADO',qualityScore:58,verification:'NO_VERIFICADO_EXTERNO',method:'Método A',source:'IoT + bitácora',frequency:'Ciclo',boundaryPeriod:'Ciclo',temporalState:'SNAPSHOT_CAPTURED_FROM_LIVE_METHOD'}]}});
const indicatorDiff=api.compare(indicatorBase,indicatorTarget);
assert.equal(indicatorDiff.valid,true);
assert.ok(indicatorDiff.changes.some(c=>c.domain==='Impacto'&&c.entity==='water'&&c.field==='Observación capturada'&&c.before==='3.600'&&c.after==='3.444'));
assert.equal(indicatorDiff.changes.some(c=>c.field==='Estado de verificación'),false,'unchanged verification must not generate a delta');
assert.equal('recommendation' in indicatorDiff,false);
assert.equal('improvement' in indicatorDiff,false);

const identical=api.compare(base,base);
assert.equal(identical.valid,true);
assert.equal(identical.total,0);
assert.deepEqual(identical.domains,[]);

const legacyCopy=snap('A2',structuredClone(base.manifest));
const legacyResult=api.compare(base,legacyCopy);
assert.equal(legacyResult.valid,true);
assert.equal(legacyResult.total,0,'two legacy V1 snapshots must not invent additive provenance deltas');

const incompatible={...target,manifest:{...target.manifest,schema:'OTHER_SCHEMA'}};
const rejected=api.compare(base,incompatible);
assert.equal(rejected.valid,false);
assert.equal(rejected.reason,'SCHEMA_INCOMPATIBLE');
assert.equal(rejected.changes.length,0);

console.log(`snapshot compare contract OK · ${result.total} synthetic changes · additive economics + Impact ledger provenance covered`);
