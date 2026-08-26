import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-cycle-circularity-provenance.js','utf8');
globalThis.window={
  __SANA_CIRCULARITY_LEDGER__:{forLot:lot=>lot==='LOT-1'?{cases:[{id:'CIR-1',lot:'LOT-1',material:'Residuo QA',stageCoverage:{percent:75},quantities:{explicitGenerated:50,explicitHandled:0,explicitRecovered:0,units:['kg'],handledCoverage:null},semantics:{plannedDestination:true,executionRecorded:false,plannedButNotExecuted:true,unresolvedEvidenceRefs:0,recoveryDeclared:false},evidence:[],outcomes:[]}],legacy:[]}:{cases:[],legacy:[]}},
  __SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-1',version:2,lot:'LOT-1'})}
};
globalThis.DEMO={plans:[{id:'PL-1',version:2,lot:'LOT-1'}]};
globalThis.views={cycle:()=>'<section>base</section><footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';

vm.runInThisContext(source,{filename:'sana-v3-cycle-circularity-provenance.js'});
const api=window.__SANA_CYCLE_CIRCULARITY__;
assert.ok(api);
const state=api.forPlan('PL-1');
assert.equal(state.valid,true);
assert.equal(state.cases.length,1);
assert.equal(state.cases[0].plannedButNotExecuted,true);
assert.equal(state.cases[0].handledQuantity,0);
assert.equal(state.cases[0].recoveredQuantity,0);
assert.equal(state.cases[0].handledCoverage,null);
assert.match(api.integrity,/CIRCULARITY_PROVENANCE ≠ CYCLE_GATE/);
assert.match(api.integrity,/GENERATED ≠ RECOVERED/);
assert.match(api.integrity,/DESTINATION_PLAN ≠ EXECUTION/);
assert.match(api.integrity,/HANDLED_COVERAGE ≠ CIRCULARITY_RATE/);
assert.equal(source.includes('completeness='),false);
assert.equal(source.includes('readyForArchive='),false);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('openModal('),false);
assert.equal(source.includes('fetch('),false);

console.log('cycle circularity provenance OK · read-only · non-weighted · planned destination remains non-executed');
