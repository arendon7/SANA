import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-health-gaps.js','utf8');
const snapshot={id:'SNAP-1',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},health:{lots:[{lotId:'LOT-1',cases:[
  {caseId:'SAN-GOOD',lot:'LOT-1',stageCoverage:100,observedPresence:1,confirmedDiagnosis:1,actionCount:1,evidenceCount:1,followUpCount:1,efficacyObservationCount:1,actionLinkIssues:0},
  {caseId:'SAN-BAD',lot:'LOT-1',stageCoverage:40,observedPresence:0,confirmedDiagnosis:1,actionCount:1,evidenceCount:0,followUpCount:0,efficacyObservationCount:0,actionLinkIssues:1}
],legacy:[{id:'LEG-1',lot:'LOT-1'}]}]}}};
const v2Snapshot={id:'SNAP-V2',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},health:{projectionVersion:'V2',chainGranularity:'ADDITIVE_V2 · PHYTOSANITARY_CHAIN',lots:[{lotId:'LOT-2',cases:[
  {caseId:'SAN-V2-COMPAT',lot:'LOT-2',stageCoverage:100,chainCoverage:75,observedPresence:0,confirmedDiagnosis:0,recommendationCount:1,activityLinkEventCount:0,embeddedActivityLinkCount:1,actionCount:1,evidenceCount:1,followUpCount:1,resultEventCount:0,embeddedResultCount:1,efficacyObservationCount:0,explicitResultEfficacyObservationCount:0,actionLinkIssues:0},
  {caseId:'SAN-V2-GOOD',lot:'LOT-2',stageCoverage:100,chainCoverage:100,observedPresence:1,confirmedDiagnosis:1,recommendationCount:1,activityLinkEventCount:1,embeddedActivityLinkCount:0,actionCount:1,evidenceCount:1,followUpCount:1,resultEventCount:1,embeddedResultCount:0,efficacyObservationCount:1,explicitResultEfficacyObservationCount:1,actionLinkIssues:0},
  {caseId:'SAN-V2-ORPHAN-RESULT',lot:'LOT-2',stageCoverage:100,chainCoverage:87,observedPresence:1,confirmedDiagnosis:1,recommendationCount:1,activityLinkEventCount:1,embeddedActivityLinkCount:0,actionCount:1,evidenceCount:1,followUpCount:0,resultEventCount:1,embeddedResultCount:0,efficacyObservationCount:1,explicitResultEfficacyObservationCount:1,actionLinkIssues:0},
  {caseId:'SAN-V2-EFFECT-NO-ACTION',lot:'LOT-2',stageCoverage:100,chainCoverage:87,observedPresence:1,confirmedDiagnosis:1,recommendationCount:1,activityLinkEventCount:1,embeddedActivityLinkCount:0,actionCount:0,evidenceCount:1,followUpCount:1,resultEventCount:1,embeddedResultCount:0,efficacyObservationCount:1,explicitResultEfficacyObservationCount:1,actionLinkIssues:0}
],legacy:[]} ]}}};
const legacyOnly={id:'SNAP-LEG',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},health:{lots:[{lotId:'LOT-1',cases:[],legacy:[{id:'LEG-1'}]}]}}};
const preHealth={id:'SNAP-OLD',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'}}};

globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snapshot,derive:s=>({valid:true,snapshot:s,gaps:[{id:'base',domain:'Base',entity:'X',condition:'base',source:'base',severity:'BAJA'}],counts:{ALTA:0,MEDIA:0,BAJA:1},domains:['Base']}),current:()=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(source,{filename:'sana-v3-due-diligence-health-gaps.js'});
const api=window.__SANA_DD_HEALTH_GAPS__;
assert.ok(api);
assert.equal(api.coverageOf({stageCoverage:100}).version,'V1');
assert.equal(api.coverageOf({stageCoverage:100,chainCoverage:null}).version,'V1','null V2 coverage must not coerce to 0% V2');
assert.equal(api.coverageOf({stageCoverage:100,chainCoverage:''}).version,'V1','blank V2 coverage must not coerce to 0% V2');
assert.equal(api.coverageOf({stageCoverage:null,chainCoverage:null}).value,null,'absent coverage must stay absent');
assert.equal(api.coverageOf({stageCoverage:100,chainCoverage:75}).version,'V2');
assert.equal(api.coverageOf({stageCoverage:100,chainCoverage:75}).value,75);

const good=api.derive(snapshot).filter(g=>g.entity.includes('SAN-GOOD'));
assert.equal(good.length,0,'observed disease/treatment/effect alone must not be a gap');
const bad=api.derive(snapshot).filter(g=>g.entity.includes('SAN-BAD'));
assert.ok(bad.some(g=>g.id.includes('stages-high')));
assert.ok(bad.some(g=>g.id.includes('activity-link')));
assert.ok(bad.some(g=>g.id.includes('action-evidence')));
assert.ok(bad.some(g=>g.id.includes('follow-up')));
assert.ok(bad.some(g=>g.id.includes('diagnosis-presence')));

const v2=api.derive(v2Snapshot);
const compat=v2.filter(g=>g.entity.includes('SAN-V2-COMPAT'));
assert.ok(compat.some(g=>g.id.includes(':stages')),'V2 chain coverage must take precedence over V1 compatibility coverage');
assert.ok(compat.some(g=>g.id.includes('activity-link-v2')),'embedded V1 activity link must not complete ACTIVITY_LINK V2');
assert.ok(compat.some(g=>g.id.includes('result-v2')),'embedded V1 result must not complete RESULT V2');
assert.ok(compat.every(g=>/document|procedencia|v2|actividad|resultado/i.test(`${g.condition} ${g.detail}`)),'V2 compatibility gaps must remain documentary/provenance statements');
const v2Good=v2.filter(g=>g.entity.includes('SAN-V2-GOOD'));
assert.equal(v2Good.length,0,'fully explicit V2 chain with an observed effect must not be a gap by itself');
const orphan=v2.filter(g=>g.entity.includes('SAN-V2-ORPHAN-RESULT'));
assert.ok(orphan.some(g=>g.id.includes('result-follow-up')),'RESULT without FOLLOW_UP must remain a provenance gap');
const effectNoAction=v2.filter(g=>g.entity.includes('SAN-V2-EFFECT-NO-ACTION'));
assert.ok(effectNoAction.some(g=>g.id.includes('efficacy-action-v2')),'observed V2 effect without captured action requires provenance review');
assert.ok(effectNoAction.some(g=>g.severity==='ALTA'));

const legacyGaps=api.derive(legacyOnly);
assert.equal(legacyGaps.length,1);
assert.equal(legacyGaps[0].severity,'BAJA');
const old=api.derive(preHealth);
assert.equal(old.length,1);
assert.equal(old[0].severity,'BAJA');
assert.match(api.integrity,/PRESENCE_OR_TREATMENT ≠ GAP/);
assert.match(api.integrity,/V1_EMBEDDED ≠ V2_STAGE/);
assert.match(api.integrity,/NO_CAUSALITY_OR_CREDIT_INFERENCE/);
assert.equal(source.includes('__SANA_PHYTOSANITARY_LEDGER__'),false,'gap derivation must use snapshots only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('creditApproved'),false);
assert.equal(source.includes('investmentApproved'),false);
const merged=window.__SANA_DUE_DILIGENCE_GAPS__.current();
assert.ok(merged.gaps.some(g=>g.domain==='Sanidad vegetal'));
assert.match(merged.integrity,/AGRONOMIC_SEVERITY ≠ CREDIT_RISK/);
assert.match(merged.integrity,/V1_EMBEDDED ≠ V2_STAGE/);

console.log('health gaps v2 contract OK · null/blank V2 coverage remains absent · snapshot-only documentary provenance');
