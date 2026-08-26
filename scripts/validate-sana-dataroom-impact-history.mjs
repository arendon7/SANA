import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-impact-history.js','utf8');
const schema='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

function boot(snapshots=[]){
  globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>snapshots}};
  globalThis.views={dataroom:()=>'<main>ROOM</main><footer class="footer">FOOT</footer>'};
  globalThis.esc=v=>String(v??'');
  globalThis.metric=()=>'';
  vm.runInThisContext(source,{filename:'sana-v3-dataroom-impact-history.js'});
  return {api:window.__SANA_DATAROOM_IMPACT_HISTORY__,html:views.dataroom()};
}

const legacy={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema,impact:{overallQuality:70}}};
let out=boot([legacy]);
let state=out.api.state();
assert.equal(state.valid,true);
assert.equal(state.state,'NOT_CAPTURED_IN_SNAPSHOT');
assert.equal(state.indicators.length,0);
assert.match(out.html,/Granularidad por indicador no capturada/);
assert.match(out.html,/Sin fallback/);

const enriched={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:{schema,impact:{methodologyGranularity:'ADDITIVE_V1 · IMPACT_LEDGER',ledgerCapturedAt:'2026-08-17T10:00:00Z',indicators:[
  {id:'water',layer:'Agua',name:'Uso de agua',baseline:4200,current:3444,unit:'m³/ha·ciclo',calculation:'-18.0%',estimated:true,quality:'ESTIMADO',qualityScore:58,verification:'NO_VERIFICADO_EXTERNO'},
  {id:'circular',layer:'Circularidad',name:'Insumos circulares',baseline:38,current:62,unit:'%',calculation:'+63.2%',estimated:false,quality:'TRAZABLE_DEMO',qualityScore:88,verification:'INTERNO'}
]}}};
out=boot([legacy,enriched]);
state=out.api.state();
assert.equal(state.snapshot.id,'NEW');
assert.equal(state.state,'CAPTURED');
assert.equal(state.indicators.length,2);
assert.equal(state.estimated,1);
assert.equal(state.externallyVerified,0);
assert.match(out.html,/Ledger metodológico capturado en el corte/);
assert.match(out.html,/ESTIMADO/);
assert.match(out.html,/NO_VERIFICADO_EXTERNO/);
assert.match(out.api.integrity,/NO_LIVE_FALLBACK/);
assert.match(out.api.integrity,/NO_EXTERNAL_VERIFICATION_INFERENCE/);

out=boot([]);
state=out.api.state();
assert.equal(state.valid,false);
assert.equal(state.state,'NO_SNAPSHOT');

assert.doesNotMatch(source,/__SANA_IMPACT_LEDGER__/,'historical Data Room extension must not read live Impact ledger');
assert.doesNotMatch(source,/currentManifest/,'historical Data Room extension must not read live manifest');

console.log('Data Room Impact history contract OK · legacy no-fill · enriched snapshot ledger only');
