import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-dd-next-cut.js','utf8');

function boot({gapState,items=[],canSnapshot=false}={}){
  globalThis.window={
    __SANA_DUE_DILIGENCE_GAPS__:{current:()=>gapState},
    __SANA_DUE_DILIGENCE_REMEDIATION__:{forSnapshot:()=>items},
    __SANA_SNAPSHOT_FRESHNESS__:{state:()=>({state:'CHANGED_SINCE_SNAPSHOT'})},
    __SANA_ACCESS__:{canAction:type=>type==='report-snapshot'&&canSnapshot}
  };
  globalThis.views={reports:()=>'<footer class="footer"></footer>'};
  globalThis.esc=v=>String(v??'');
  globalThis.metric=()=>'';
  vm.runInThisContext(source,{filename:'sana-v3-dd-next-cut.js'});
  return window.__SANA_DD_NEXT_CUT__;
}

let api=boot({gapState:{valid:false}});
let state=api.state();
assert.equal(state.valid,false);
assert.equal(state.state,'NO_SNAPSHOT');
assert.equal(state.readyForHumanReview,false);

const snapshot={id:'SNAP-1'};
const high={id:'G-HIGH',severity:'ALTA',domain:'Ciclo',entity:'P-1',condition:'Evidencia faltante',owner:'Técnico'};
const medium={id:'G-MED',severity:'MEDIA',domain:'Economía',entity:'L-1',condition:'Soporte parcial',owner:'Administración'};
const gapState={valid:true,snapshot,gaps:[high,medium]};

api=boot({gapState,items:[{gapId:'G-HIGH',status:'EN_CURSO',createdAt:'2026-08-17T20:00:00Z'},{gapId:'G-MED',status:'LISTO_PARA_NUEVO_CORTE',createdAt:'2026-08-17T20:00:00Z'}]});
state=api.state();
assert.equal(state.state,'NOT_READY_FOR_NEW_CUT');
assert.equal(state.readyForHumanReview,false);
assert.equal(state.highPrepared,0);
assert.equal(state.active,1);

api=boot({gapState,items:[{gapId:'G-HIGH',status:'LISTO_PARA_NUEVO_CORTE',createdAt:'2026-08-17T21:00:00Z'},{gapId:'G-MED',status:'NO_APLICA_JUSTIFICADO',createdAt:'2026-08-17T21:00:00Z'}],canSnapshot:true});
state=api.state();
assert.equal(state.state,'READY_FOR_HUMAN_CUT_REVIEW');
assert.equal(state.readyForHumanReview,true);
assert.equal(state.highPrepared,1);
assert.equal(state.withoutPlan,0);

api=boot({gapState:{valid:true,snapshot,gaps:[]},items:[]});
state=api.state();
assert.equal(state.state,'NO_GAPS_AT_SNAPSHOT');
assert.equal(state.readyForHumanReview,true);

assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('openModal('),false);
assert.equal(source.includes('saveModal'),false);
assert.equal(source.includes('currentManifest'),false);
assert.match(api.integrity,/READY_FOR_HUMAN_REVIEW ≠ SNAPSHOT_CREATED ≠ GAP_RESOLVED ≠ INVESTMENT_READY/);

console.log('next-cut preparation contract OK · no auto snapshot or gap resolution');
