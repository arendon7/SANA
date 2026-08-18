import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const js=fs.readFileSync(path,'utf8'),css=fs.readFileSync('apps/control-web/public/sana-v3-review-workspace.css','utf8'),sw=fs.readFileSync('apps/control-web/public/sana-v3-sw.js','utf8');
for(const re of [/REVIEW WORKSPACE V97/,/candidateCount/,/candidateIds/,/ambiguousStages/,/duplicateStageReferences/,/MULTIPLE_STAGE_REFERENCES ≠ MULTIPLE_REVIEWS ≠ REVIEW_CONFLICT/,/AMBIGUOUS_STAGE ≠ MISSING_STAGE/,/UNIQUE_STAGE_PROJECTION ≠ SOURCE_VERIFICATION/])assert.match(js,re);
for(const re of [/\.review-stage\.is-ambiguous\b/,/\.review-stage-candidates\b/])assert.match(css,re);
for(const marker of ['REVIEW WORKSPACE V88','REVIEW WORKSPACE V89','REVIEW WORKSPACE V90','REVIEW WORKSPACE V91','REVIEW WORKSPACE V92','REVIEW WORKSPACE V93','REVIEW WORKSPACE V94','REVIEW WORKSPACE V95','REVIEW WORKSPACE V96'])assert(js.includes(marker));
assert(sw.includes("'/sana-v3-review-workspace.css'"));assert(!/fetch\s*\(|storage\s*(\?\.|\.)|openModal\s*\(/.test(js));
const evt=(id,kind,t,ref)=>({id,kind,observedAt:t,provenance:'TEST',evidenceRef:ref});
const item=(id,kind,t,ref)=>({id,capitalCaseRef:'CAP-T',lot:'T',events:[evt(`${id}-E1`,kind,t,ref)],semantics:{missingInternalReferences:[]},closures:[]});
const source=(schema,items)=>({schema,cases:()=>items});
const window={
  __SANA_ACCESS__:{role:'admin'},
  __SANA_DATAROOM_REVIEW_CASE__:source('SANA_DATAROOM_REVIEW_CASE_V1',[item('CASE-A','CASE','2026-08-18T10:00:00-05:00','REF-A'),item('CASE-B','CASE','2026-08-18T10:01:00-05:00','REF-B')]),
  __SANA_DATAROOM_REVIEW_HANDOFF__:source('SANA_DATAROOM_REVIEW_HANDOFF_V1',[item('HANDOFF-T','HANDOFF','2026-08-18T10:10:00-05:00','REF-H')]),
  __SANA_DATAROOM_REVIEW_FEEDBACK__:source('SANA_DATAROOM_REVIEW_FEEDBACK_V1',[item('FEEDBACK-T','FEEDBACK','2026-08-18T10:20:00-05:00','REF-F')]),
  __SANA_DATAROOM_REVIEW_RESPONSE__:source('SANA_DATAROOM_REVIEW_RESPONSE_V1',[item('RESPONSE-T','RESPONSE','2026-08-18T10:30:00-05:00','REF-R')]),
  __SANA_DATAROOM_REVIEW_DISPOSITION__:source('SANA_DATAROOM_REVIEW_DISPOSITION_V1',[item('DISP-T','DISPOSITION','2026-08-18T10:40:00-05:00','REF-D')]),
  __SANA_DATAROOM_REVIEW_ROUND__:source('SANA_DATAROOM_REVIEW_ROUND_V1',[item('ROUND-T','ROUND','2026-08-18T10:50:00-05:00','REF-O')])
};
const ctx={window,views:{dataroom:()=>'<header class="page-head"></header><footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),location:{search:'?rwCapital=CAP-T&rwLot=T&rwStage=CASE',href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwStage=CASE#dataroom'},history:{replaceState:()=>{}},URLSearchParams,URL,console};window.window=window;vm.createContext(ctx);vm.runInContext(js,ctx,{filename:path});
const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;assert(api);const s=api.state(),chain=s.chains[0];assert(chain);assert.equal(s.summary.entries,7);assert.equal(s.summary.ambiguousStageReferences,1);assert.equal(s.summary.duplicateStageReferences,1);assert.equal(s.summary.missingStageReferences,0);const caseStage=chain.stages.find(x=>x.stage==='CASE');assert(caseStage);assert.equal(caseStage.referenced,true);assert.equal(caseStage.present,false);assert.equal(caseStage.ambiguous,true);assert.equal(caseStage.candidateCount,2);assert.deepEqual([...caseStage.candidateIds],['CASE-A','CASE-B']);assert.deepEqual([...chain.ambiguousStages],['CASE']);assert.deepEqual([...chain.indeterminateStages],['CASE']);assert.deepEqual([...chain.missingStages],[]);assert.equal(chain.stageCount,5);const focus=api.readFocus();assert.equal(api.selectedEntry(s.chains,focus),null);const integrity=api.contextIntegrity(s.chains,focus);assert.equal(integrity.resolved,false);assert(integrity.issues.some(x=>x.key==='rwStage'));for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(s.summary[k],0);
console.log('SANA Data Room review workspace v97 stage multiplicity validation: OK');
