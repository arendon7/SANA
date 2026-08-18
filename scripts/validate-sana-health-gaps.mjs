import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-health-gaps.js','utf8');
const snapshot={id:'SNAP-1',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},health:{lots:[{lotId:'LOT-1',cases:[
  {caseId:'SAN-GOOD',lot:'LOT-1',stageCoverage:100,observedPresence:1,confirmedDiagnosis:1,actionCount:1,evidenceCount:1,followUpCount:1,efficacyObservationCount:1,actionLinkIssues:0},
  {caseId:'SAN-BAD',lot:'LOT-1',stageCoverage:40,observedPresence:0,confirmedDiagnosis:1,actionCount:1,evidenceCount:0,followUpCount:0,efficacyObservationCount:0,actionLinkIssues:1}
],legacy:[{id:'LEG-1',lot:'LOT-1'}]}]}}};
const legacyOnly={id:'SNAP-LEG',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},health:{lots:[{lotId:'LOT-1',cases:[],legacy:[{id:'LEG-1'}]}]}}};
const preHealth={id:'SNAP-OLD',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'}}};

globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snapshot,derive:s=>({valid:true,snapshot:s,gaps:[{id:'base',domain:'Base',entity:'X',condition:'base',source:'base',severity:'BAJA'}],counts:{ALTA:0,MEDIA:0,BAJA:1},domains:['Base']}),current:()=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(source,{filename:'sana-v3-due-diligence-health-gaps.js'});
const api=window.__SANA_DD_HEALTH_GAPS__;
assert.ok(api);
const good=api.derive(snapshot).filter(g=>g.entity.includes('SAN-GOOD'));
assert.equal(good.length,0,'observed disease/treatment/effect alone must not be a gap');
const bad=api.derive(snapshot).filter(g=>g.entity.includes('SAN-BAD'));
assert.ok(bad.some(g=>g.id.includes('stages-high')));
assert.ok(bad.some(g=>g.id.includes('activity-link')));
assert.ok(bad.some(g=>g.id.includes('action-evidence')));
assert.ok(bad.some(g=>g.id.includes('follow-up')));
assert.ok(bad.some(g=>g.id.includes('diagnosis-presence')));
const legacyGaps=api.derive(legacyOnly);
assert.equal(legacyGaps.length,1);
assert.equal(legacyGaps[0].severity,'BAJA');
const old=api.derive(preHealth);
assert.equal(old.length,1);
assert.equal(old[0].severity,'BAJA');
assert.match(api.integrity,/PRESENCE_OR_TREATMENT ≠ GAP/);
assert.match(api.integrity,/NO_CAUSALITY_OR_CREDIT_INFERENCE/);
assert.equal(source.includes('__SANA_PHYTOSANITARY_LEDGER__'),false,'gap derivation must use snapshots only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
const merged=window.__SANA_DUE_DILIGENCE_GAPS__.current();
assert.ok(merged.gaps.some(g=>g.domain==='Sanidad vegetal'));
assert.match(merged.integrity,/AGRONOMIC_SEVERITY ≠ CREDIT_RISK/);

console.log('health gaps contract OK · traceability gaps only · presence/treatment are not gaps by themselves');
