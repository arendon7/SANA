import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const js=fs.readFileSync(path,'utf8'),css=fs.readFileSync('apps/control-web/public/sana-v3-review-workspace.css','utf8'),sw=fs.readFileSync('apps/control-web/public/sana-v3-sw.js','utf8');
for(const re of [/REVIEW WORKSPACE V98/,/caseShapeIssues/,/payloadState/,/invalidCaseCount/,/validCaseCount/,/invalidSourceCases/,/sourcesWithInvalidPayload/,/SOURCE_PAYLOAD_INVALID ≠ SOURCE_EMPTY ≠ STAGE_NOT_REFERENCED/,/PARTIAL_PAYLOAD ≠ VERIFIED_COMPLETENESS/,/PAYLOAD_BLOCK ≠ SOURCE_MUTATION/])assert.match(js,re);
for(const re of [/\.review-stage\.is-payload-invalid\b/,/\.review-source-payload\b/])assert.match(css,re);
for(const marker of ['REVIEW WORKSPACE V88','REVIEW WORKSPACE V89','REVIEW WORKSPACE V90','REVIEW WORKSPACE V91','REVIEW WORKSPACE V92','REVIEW WORKSPACE V93','REVIEW WORKSPACE V94','REVIEW WORKSPACE V95','REVIEW WORKSPACE V96','REVIEW WORKSPACE V97'])assert(js.includes(marker));
assert(sw.includes("'/sana-v3-review-workspace.css'"));assert(!/fetch\s*\(|storage\s*(\?\.|\.)|openModal\s*\(/.test(js));
const evt=(id,kind,t)=>({id,kind,observedAt:t,provenance:'TEST'});
const item=(id,kind,t)=>({id,capitalCaseRef:'CAP-T',lot:'T',events:[evt(`${id}-E1`,kind,t)],semantics:{missingInternalReferences:[]},closures:[]});
const source=(schema,items)=>({schema,cases:()=>items});
const window={
  __SANA_ACCESS__:{role:'admin'},
  __SANA_DATAROOM_REVIEW_CASE__:source('SANA_DATAROOM_REVIEW_CASE_V1',[item('CASE-T','CASE','2026-08-18T10:00:00-05:00'),{id:'CASE-BAD',capitalCaseRef:'CAP-T',lot:'T',events:{bad:true},semantics:{missingInternalReferences:[]},closures:[]}]),
  __SANA_DATAROOM_REVIEW_HANDOFF__:source('SANA_DATAROOM_REVIEW_HANDOFF_V1',[item('HANDOFF-T','HANDOFF','2026-08-18T10:10:00-05:00')]),
  __SANA_DATAROOM_REVIEW_FEEDBACK__:source('SANA_DATAROOM_REVIEW_FEEDBACK_V1',[{id:'FEEDBACK-BAD',capitalCaseRef:'CAP-T',lot:'T',events:'not-an-array',semantics:{missingInternalReferences:[]},closures:[]}]),
  __SANA_DATAROOM_REVIEW_RESPONSE__:source('SANA_DATAROOM_REVIEW_RESPONSE_V1',[item('RESPONSE-T','RESPONSE','2026-08-18T10:30:00-05:00')]),
  __SANA_DATAROOM_REVIEW_DISPOSITION__:source('SANA_DATAROOM_REVIEW_DISPOSITION_V1',[item('DISP-T','DISPOSITION','2026-08-18T10:40:00-05:00')]),
  __SANA_DATAROOM_REVIEW_ROUND__:source('SANA_DATAROOM_REVIEW_ROUND_V1',[item('ROUND-T','ROUND','2026-08-18T10:50:00-05:00')])
};
const ctx={window,views:{dataroom:()=>'<header class="page-head"></header><footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),location:{search:'?rwCapital=CAP-T&rwLot=T',href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T#dataroom'},history:{replaceState:()=>{}},URLSearchParams,URL,console};window.window=window;vm.createContext(ctx);vm.runInContext(js,ctx,{filename:path});
const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;assert(api);const s=api.state(),byStage=Object.fromEntries(s.sources.map(x=>[x.stage,x]));assert.equal(byStage.CASE.payloadState,'PARTIAL_INVALID');assert.equal(byStage.CASE.validCaseCount,1);assert.equal(byStage.CASE.invalidCaseCount,1);assert.equal(byStage.FEEDBACK.payloadState,'INVALID');assert.equal(byStage.FEEDBACK.validCaseCount,0);assert.equal(byStage.FEEDBACK.invalidCaseCount,1);assert.equal(s.summary.invalidSourceCases,2);assert.equal(s.summary.sourcesWithInvalidPayload,2);const chain=s.chains.find(c=>c.capitalCaseRef==='CAP-T'&&c.lot==='T');assert(chain);const stages=Object.fromEntries(chain.stages.map(x=>[x.stage,x]));assert.equal(stages.CASE.present,true);assert.equal(stages.CASE.sourcePayloadState,'PARTIAL_INVALID');assert.equal(stages.FEEDBACK.present,false);assert.equal(stages.FEEDBACK.sourcePayloadState,'INVALID');assert.deepEqual([...chain.indeterminateStages],['FEEDBACK']);assert.deepEqual([...chain.missingStages],[]);assert.equal(chain.stageCount,5);assert.equal(s.summary.missingStageReferences,0);for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(s.summary[k],0);
console.log('SANA Data Room review workspace v98 payload integrity validation: OK');
