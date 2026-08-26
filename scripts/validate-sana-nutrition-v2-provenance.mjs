import fs from 'node:fs';
import assert from 'node:assert/strict';

const files={
  snapshot:'apps/control-web/public/sana-v3-report-snapshot-nutrition-v2.js',
  history:'apps/control-web/public/sana-v3-dataroom-nutrition-v2-history.js',
  cycle:'apps/control-web/public/sana-v3-cycle-nutrition-v2-provenance.js',
  gaps:'apps/control-web/public/sana-v3-due-diligence-nutrition-v2-gaps.js'
};
const src=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));

for(const [name,text] of Object.entries(src)){
  assert.ok(text.length>100,`${name} must not be empty`);
  assert.doesNotMatch(text,/productionExecutionAvailable\s*=\s*true|canonicalMutated\s*=\s*true|creditApproved|investmentApproved/i);
}

assert.match(src.snapshot,/ADDITIVE_V2 · NUTRITION_CHAIN/);
assert.match(src.snapshot,/EXPLICIT_PREDECESSOR_REFERENCES/);
assert.match(src.snapshot,/chainCoverage/);
assert.match(src.snapshot,/activityLinkEventCount/);
assert.match(src.snapshot,/embeddedActivityLinkCount/);
assert.match(src.snapshot,/referenceCoverage/);
assert.match(src.snapshot,/referenceRows/);
assert.match(src.snapshot,/NO_V1_TO_V2_STAGE_PROMOTION/);
assert.match(src.snapshot,/NO_RETROACTIVE_REFERENCE_FILL/);
assert.match(src.snapshot,/queueMicrotask\(sync\)/);

assert.match(src.history,/SNAPSHOT_NUTRITION_V2_ONLY/);
assert.match(src.history,/NO_LIVE_FALLBACK/);
assert.match(src.history,/V2_NOT_CAPTURED/);
assert.match(src.history,/PARTIAL_V2_GRANULARITY/);
assert.match(src.history,/NO_RETROACTIVE_REFERENCE_FILL/);
assert.doesNotMatch(src.history,/__SANA_NUTRITION_LEDGER__/);
assert.doesNotMatch(src.history,/storage\./);

assert.match(src.cycle,/__SANA_CYCLE_NUTRITION_V2__/);
assert.match(src.cycle,/NUTRITION_V2_PROVENANCE ≠ CYCLE_GATE/);
assert.match(src.cycle,/No modifica completeness ni readyForArchive/);
assert.doesNotMatch(src.cycle,/completeness\s*=/);
assert.doesNotMatch(src.cycle,/readyForArchive\s*=/);
assert.doesNotMatch(src.cycle,/storage\.records\.push|openModal\(/);

assert.match(src.gaps,/function coverageOf/);
assert.match(src.gaps,/version:'V2'/);
assert.match(src.gaps,/version:'V1'/);
assert.match(src.gaps,/function referenceState/);
assert.match(src.gaps,/removeSupersededV1Coverage/);
assert.match(src.gaps,/activity-link-legacy/);
assert.match(src.gaps,/activity-link-missing/);
assert.match(src.gaps,/predecessor-reference/);
assert.match(src.gaps,/PROGRAM_OR_APPLICATION ≠ GAP/);
assert.match(src.gaps,/REFERENCE ≠ APPLICATION_AUTHORITY ≠ INVENTORY_MOVEMENT ≠ CAUSALITY/);
assert.doesNotMatch(src.gaps,/__SANA_NUTRITION_LEDGER__/);
assert.doesNotMatch(src.gaps,/storage\./);

const v1={stageCoverage:100};
const v2={stageCoverage:100,chainCoverage:71};
function coverage(row){
  const hasV2=row.chainCoverage!==undefined&&row.chainCoverage!==null&&row.chainCoverage!=='';
  const n=Number(row.chainCoverage);
  if(hasV2&&Number.isFinite(n))return {value:n,version:'V2'};
  const old=Number(row.stageCoverage);return {value:Number.isFinite(old)?old:null,version:'V1'};
}
assert.deepEqual(coverage(v1),{value:100,version:'V1'},'old snapshot must retain V1 interpretation');
assert.deepEqual(coverage(v2),{value:71,version:'V2'},'captured V2 snapshot must prefer chainCoverage');
assert.equal(coverage({stageCoverage:100,chainCoverage:null}).version,'V1','null V2 must not coerce to 0%');

console.log('SANA nutrition V2 historical provenance V130 contract: OK');
