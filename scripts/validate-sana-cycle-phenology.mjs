import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-cycle-phenology-provenance.js','utf8');
globalThis.window={
  __SANA_PHENOLOGY_SERIES__:{
    summary:lot=>lot==='LOT-1'?{latestStage:{stage:'Floración',progress:60,sourceClass:'OBSERVED_DEMO',quality:'OBSERVED_DEMO',observedAt:'2026-08-17'},stages:[{}],measurements:[{},{}],interpretations:[{}],evidence:[{}],variables:['Altura'],legacy:[]}:null,
    series:(lot,variable)=>({lot,variable,rows:[{value:120},{value:123}],units:['cm'],comparable:true,delta:3,direction:'INCREASE'})
  },
  __SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-1',version:2,lot:'LOT-1'})}
};
globalThis.DEMO={plans:[{id:'PL-1',version:2,lot:'LOT-1'}]};
globalThis.views={cycle:()=>'<section>base</section><footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';

vm.runInThisContext(source,{filename:'sana-v3-cycle-phenology-provenance.js'});
const api=window.__SANA_CYCLE_PHENOLOGY__;
assert.ok(api);
const state=api.forPlan('PL-1');
assert.equal(state.valid,true);
assert.equal(state.summary.latestStage.stage,'Floración');
assert.equal(state.summary.measurementCount,2);
assert.equal(state.summary.series[0].delta,3);
assert.equal(state.summary.series[0].direction,'INCREASE');
assert.match(api.integrity,/PHENOLOGY_PROVENANCE ≠ PLAN_PHASE ≠ CYCLE_GATE/);
assert.match(api.integrity,/MEASUREMENT ≠ MANAGEMENT_DECISION/);
assert.match(api.integrity,/TREND ≠ PERFORMANCE ≠ CAUSALITY/);
assert.equal(source.includes('completeness='),false);
assert.equal(source.includes('readyForArchive='),false);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('openModal('),false);
assert.equal(source.includes('fetch('),false);

console.log('cycle phenology provenance OK · read-only · non-weighted · trend not performance');
