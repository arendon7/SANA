import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-nutrition-gaps.js','utf8');
const snapshot={id:'SNAP-1',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},nutrition:{lots:[
  {lotId:'LOT-1',cases:[
    {caseId:'NUT-GOOD',lot:'LOT-1',stageCoverage:100,programCount:1,decisionCount:1,approvedDecisionCount:1,deferredDecisionCount:0,applicationCount:1,evidenceCount:1,responseCount:1,relationIssues:0,causalClaims:0},
    {caseId:'NUT-DEFER',lot:'LOT-1',stageCoverage:50,programCount:1,decisionCount:1,approvedDecisionCount:0,deferredDecisionCount:1,applicationCount:0,evidenceCount:0,responseCount:0,relationIssues:0,causalClaims:0}
  ]},
  {lotId:'LOT-2',cases:[
    {caseId:'NUT-BAD',lot:'LOT-2',stageCoverage:40,programCount:0,decisionCount:0,approvedDecisionCount:0,deferredDecisionCount:0,applicationCount:1,evidenceCount:0,responseCount:1,relationIssues:1,causalClaims:1}
  ]}
]}}};
const preNutrition={id:'SNAP-OLD',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'}}};

globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snapshot,derive:s=>({valid:true,snapshot:s,gaps:[{id:'base',domain:'Base',entity:'X',condition:'base',source:'base',severity:'BAJA'}],counts:{ALTA:0,MEDIA:0,BAJA:1},domains:['Base']}),current:()=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(source,{filename:'sana-v3-due-diligence-nutrition-gaps.js'});
const api=window.__SANA_DD_NUTRITION_GAPS__;
assert.ok(api);
const good=api.derive(snapshot).filter(g=>g.entity.includes('NUT-GOOD'));
assert.equal(good.length,0,'fully traced application/response must not be a gap by itself');
const deferred=api.derive(snapshot).filter(g=>g.entity.includes('NUT-DEFER'));
assert.equal(deferred.filter(g=>!g.id.includes('stages')).length,0,'deferred program without application is not a gap by itself');
const bad=api.derive(snapshot).filter(g=>g.entity.includes('NUT-BAD'));
assert.ok(bad.some(g=>g.id.includes('stages-high')));
assert.ok(bad.some(g=>g.id.includes('relations')));
assert.ok(bad.some(g=>g.id.includes('application-evidence')));
assert.ok(bad.some(g=>g.id.includes('program')));
assert.ok(bad.some(g=>g.id.includes('decision')));
assert.ok(bad.some(g=>g.id.includes('causal-language')));
const old=api.derive(preNutrition);
assert.equal(old.length,1);
assert.equal(old[0].severity,'BAJA');
assert.match(api.integrity,/PROGRAM_OR_APPLICATION ≠ GAP/);
assert.match(api.integrity,/NO_CAUSALITY_OR_CREDIT_INFERENCE/);
assert.equal(source.includes('__SANA_NUTRITION_LEDGER__'),false,'gap derivation must use snapshots only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
const merged=window.__SANA_DUE_DILIGENCE_GAPS__.current();
assert.ok(merged.gaps.some(g=>g.domain==='Nutrición / fertirriego'));
assert.match(merged.integrity,/AGRONOMIC_PERFORMANCE ≠ CREDIT_RISK/);

console.log('nutrition gaps contract OK · documentary gaps only · deferred program/application are not gaps by themselves');
