import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-cycle-nutrition-provenance.js','utf8');

globalThis.window={
  __SANA_NUTRITION_LEDGER__:{forLot:lot=>lot==='LOT-1'?[{id:'NUT-1',lot:'LOT-1',objective:'Fertirriego',stageCoverage:{percent:67},programs:[{}],preflight:[{}],decisions:[{}],applications:[],evidence:[],responses:[],semantics:{approvedDecisions:0,deferredDecisions:1,relationIssues:0,causalClaims:0},latestResponse:null}]:[]},
  __SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-1',version:2,lot:'LOT-1'})}
};
globalThis.DEMO={plans:[{id:'PL-1',version:2,lot:'LOT-1'}]};
globalThis.views={cycle:()=>'<section>base</section><footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';

vm.runInThisContext(source,{filename:'sana-v3-cycle-nutrition-provenance.js'});
const api=window.__SANA_CYCLE_NUTRITION__;
assert.ok(api,'cycle nutrition API must exist');
const state=api.forPlan('PL-1');
assert.equal(state.valid,true);
assert.equal(state.cases.length,1);
assert.equal(state.cases[0].stageCoverage,67);
assert.equal(state.cases[0].deferredDecisions,1);
assert.equal(state.cases[0].applications,0,'deferred program must remain non-executed in cycle projection');
assert.match(api.integrity,/NUTRITION_PROVENANCE ≠ CYCLE_GATE/);
assert.match(api.integrity,/APPLICATION_AUTHORIZATION/);
assert.match(api.integrity,/INVENTORY_DISPATCH/);
assert.match(api.integrity,/CAUSAL_EFFECT/);
assert.equal(source.includes('completeness='),false,'nutrition provenance must not redefine cycle completeness');
assert.equal(source.includes('readyForArchive='),false,'nutrition provenance must not redefine archive readiness');
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('openModal('),false);
assert.equal(source.includes('fetch('),false);

console.log('cycle nutrition provenance OK · read-only · non-weighted · program remains distinct from execution');
