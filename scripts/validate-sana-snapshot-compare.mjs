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

function snap(id,manifest){return {id,cutoff:'2026-08-17',reviewer:'QA',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',...manifest}}}

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
  economics:[{lotId:'L1',budget:1200,baseRecorded:500,baseRecordedProvenance:'BASELINE_DEMO',localRecorded:180,observedStatus:'LOCAL_ONLY'}],
  sources:[{id:'S1',scope:'L1',version:'v2',cut:'2026-08-15',state:'REFERENCE_ONLY',externalId:'EXT-1'}],
  impact:{overallQuality:78,humanReviewed:true,reviewer:'Técnico QA',reviewedAt:'2026-08-17T10:00:00Z',internallyVerified:2,externallyVerified:0,externallyUnverified:3,estimated:1},
  capital:{readiness:58,gates:{operations:{score:72,state:'review'}}}
});

const result=api.compare(base,target);
assert.equal(result.valid,true);
assert.ok(result.total>0);
for(const domain of ['Plan','Cierre de ciclo','Passport','Economía','Fuentes','Impacto','Readiness'])assert.ok(result.domains.includes(domain),`missing domain ${domain}`);
assert.ok(result.changes.some(c=>c.kind==='ECONOMICO'));
assert.ok(result.changes.some(c=>c.kind==='METODOLOGICO'));
assert.ok(result.changes.some(c=>c.domain==='Readiness'&&c.field==='Readiness compuesto %'));
assert.equal('recommendation' in result,false);
assert.equal('improvement' in result,false);

const identical=api.compare(base,base);
assert.equal(identical.valid,true);
assert.equal(identical.total,0);
assert.deepEqual(identical.domains,[]);

const incompatible={...target,manifest:{...target.manifest,schema:'OTHER_SCHEMA'}};
const rejected=api.compare(base,incompatible);
assert.equal(rejected.valid,false);
assert.equal(rejected.reason,'SCHEMA_INCOMPATIBLE');
assert.equal(rejected.changes.length,0);

console.log(`snapshot compare contract OK · ${result.total} synthetic changes · ${result.domains.length} domains`);
