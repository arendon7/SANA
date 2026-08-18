import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-circularity-gaps.js','utf8');
const snapshot={id:'SNAP-1',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},circularity:{lots:[
  {lotId:'LOT-1',cases:[
    {caseId:'CIR-GOOD',lot:'LOT-1',stageCoverage:100,quantificationCount:1,executionCount:1,evidenceCount:1,outcomeCount:1,missingQuantificationMetadata:0,missingExecutionMetadata:0,externalHandoffMissingReceiver:0,unresolvedEvidenceRefs:0,unsupportedExecutionCount:0,unsupportedRecoveryCount:0,crossUnitConflict:0,recoveredExceedsHandled:0,recoveryDeclared:true,plannedButNotExecuted:false},
    {caseId:'CIR-PENDING',lot:'LOT-1',stageCoverage:63,quantificationCount:1,executionCount:0,evidenceCount:0,outcomeCount:0,missingQuantificationMetadata:0,missingExecutionMetadata:0,externalHandoffMissingReceiver:0,unresolvedEvidenceRefs:0,unsupportedExecutionCount:0,unsupportedRecoveryCount:0,crossUnitConflict:0,recoveredExceedsHandled:0,recoveryDeclared:false,plannedButNotExecuted:true}
  ]},
  {lotId:'LOT-2',cases:[
    {caseId:'CIR-BAD',lot:'LOT-2',stageCoverage:38,quantificationCount:0,executionCount:1,evidenceCount:0,outcomeCount:1,missingQuantificationMetadata:1,missingExecutionMetadata:1,externalHandoffMissingReceiver:1,unresolvedEvidenceRefs:1,unsupportedExecutionCount:1,unsupportedRecoveryCount:1,crossUnitConflict:1,recoveredExceedsHandled:1,recoveryDeclared:true,plannedButNotExecuted:false}
  ]}
]}}};
const oldSnapshot={id:'OLD',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'}}};

globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snapshot,derive:s=>({valid:true,snapshot:s,gaps:[{id:'base',domain:'Base',entity:'X',condition:'base',source:'base',severity:'BAJA'}],counts:{ALTA:0,MEDIA:0,BAJA:1},domains:['Base']}),current:()=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(source,{filename:'sana-v3-due-diligence-circularity-gaps.js'});
const api=window.__SANA_DD_CIRCULARITY_GAPS__;
assert.ok(api);
assert.equal(api.derive(snapshot).filter(g=>g.entity.includes('CIR-GOOD')).length,0,'fully traced circular case must not be a gap');
const pending=api.derive(snapshot).filter(g=>g.entity.includes('CIR-PENDING'));
assert.ok(pending.every(g=>g.id.includes('stages')),'pending destination itself must not be a gap');
const bad=api.derive(snapshot).filter(g=>g.entity.includes('CIR-BAD'));
assert.ok(bad.some(g=>g.id.includes('stages-high')));
assert.ok(bad.some(g=>g.id.includes('quantification-metadata')));
assert.ok(bad.some(g=>g.id.includes('execution-metadata')));
assert.ok(bad.some(g=>g.id.includes('external-receiver')));
assert.ok(bad.some(g=>g.id.includes('evidence-ref')));
assert.ok(bad.some(g=>g.id.includes('execution-evidence')));
assert.ok(bad.some(g=>g.id.includes('recovery-evidence')));
assert.ok(bad.some(g=>g.id.includes('units')));
assert.ok(bad.some(g=>g.id.includes('mass-balance')));
assert.ok(bad.some(g=>g.id.includes('execution-without-quantity')));
const old=api.derive(oldSnapshot);
assert.equal(old.length,1);
assert.equal(old[0].severity,'BAJA');
assert.match(api.integrity,/GENERATED_OR_PENDING_DESTINATION ≠ GAP/);
assert.match(api.integrity,/NO_ENVIRONMENTAL_PERFORMANCE_OR_CREDIT_INFERENCE/);
assert.equal(source.includes('__SANA_CIRCULARITY_LEDGER__'),false,'gap derivation must use snapshots only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
const merged=window.__SANA_DUE_DILIGENCE_GAPS__.current();
assert.ok(merged.gaps.some(g=>g.domain==='Circularidad / residuos'));
assert.match(merged.integrity,/CIRCULARITY_RATE ≠ ENVIRONMENTAL_PERFORMANCE/);

console.log('circularity gaps contract OK · provenance gaps only · generated/pending destination are not gaps by themselves');
