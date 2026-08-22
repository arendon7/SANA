import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-cycle-health-provenance.js','utf8');

globalThis.window={
  __SANA_PHYTOSANITARY_LEDGER__:{forLot:lot=>lot==='LOT-1'?{explicit:[{id:'SAN-1',lot:'LOT-1',scope:'BIOTIC_RISK',stageCoverage:{percent:83},semantics:{observedPresence:1,confirmedDiagnosis:1,efficacyObservations:0,actionLinkIssues:0},actions:[{}],evidence:[{}],followups:[{}],latestFollowUp:{resultClass:'SURVEILLANCE_CONTINUES',effectivenessObserved:'NO_EFFICACY_ASSESSMENT'}}],legacy:[{id:'LEG-1',sourceId:'INC-1',summary:'Legacy',status:'Cerrada',semanticState:'DIAGNOSIS_NOT_INFERRED'}]}:{explicit:[],legacy:[]}},
  __SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-1',version:2,lot:'LOT-1'})}
};
globalThis.DEMO={plans:[{id:'PL-1',version:2,lot:'LOT-1'}]};
globalThis.views={cycle:()=>'<section>base</section><footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';

vm.runInThisContext(source,{filename:'sana-v3-cycle-health-provenance.js'});
const api=window.__SANA_CYCLE_HEALTH__;
assert.ok(api,'cycle health API must exist');
const state=api.forPlan('PL-1');
assert.equal(state.valid,true);
assert.equal(state.explicit.length,1);
assert.equal(state.explicit[0].stageCoverage,83);
assert.equal(state.explicit[0].observedPresence,1);
assert.equal(state.explicit[0].confirmedDiagnosis,1);
assert.equal(state.legacy.length,1);
assert.match(api.integrity,/PHYTOSANITARY_PROVENANCE ≠ CYCLE_GATE/);
assert.match(api.integrity,/≠ CAUSAL_EFFICACY/);
assert.equal(source.includes('completeness='),false,'health provenance must not redefine cycle completeness');
assert.equal(source.includes('readyForArchive='),false,'health provenance must not redefine archive readiness');
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('openModal('),false);
assert.equal(source.includes('fetch('),false);

console.log('cycle phytosanitary provenance OK · read-only and non-weighted');
