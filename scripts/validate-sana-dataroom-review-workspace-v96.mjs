import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const js=fs.readFileSync(path,'utf8'),css=fs.readFileSync('apps/control-web/public/sana-v3-review-workspace.css','utf8'),sw=fs.readFileSync('apps/control-web/public/sana-v3-sw.js','utf8');
for(const re of [/REVIEW WORKSPACE V96/,/expectedSchema/,/sourceSchemaState/,/schemaMismatches/,/missingSourceSchemas/,/SOURCE_SCHEMA_MISSING ≠ SOURCE_EMPTY ≠ STAGE_NOT_REFERENCED/,/SOURCE_SCHEMA_MISMATCH ≠ REVIEW_FAILURE/,/SCHEMA_MATCH ≠ DOCUMENT_VERIFICATION ≠ SOURCE_TRUST/,/SCHEMA_BLOCK ≠ SOURCE_MUTATION/])assert.match(js,re);
for(const re of [/\.review-stage\.is-schema-unresolved\b/,/\.review-source-schema\b/])assert.match(css,re);
for(const marker of ['REVIEW WORKSPACE V88','REVIEW WORKSPACE V89','REVIEW WORKSPACE V90','REVIEW WORKSPACE V91','REVIEW WORKSPACE V92','REVIEW WORKSPACE V93','REVIEW WORKSPACE V94','REVIEW WORKSPACE V95'])assert(js.includes(marker));
assert(sw.includes("'/sana-v3-review-workspace.css'"));assert(!/fetch\s*\(|storage\s*(\?\.|\.)|openModal\s*\(/.test(js));
const evt=(id,kind,observedAt,extra={})=>({id,kind,observedAt,provenance:'TEST',...extra});
const item=(id,events)=>({id,capitalCaseRef:'CAP-T',lot:'T',events,semantics:{missingInternalReferences:[]},closures:[]});
const ok=(schema,id,kind,refField)=>({schema,cases:()=>[item(id,[evt(`${id}-E1`,kind,'2026-08-18T11:00:00-05:00',{[refField]:'REF-1'})])]});
const blocked=()=>{throw new Error('schema-blocked source must not be read')};
const window={
  __SANA_ACCESS__:{role:'admin'},
  __SANA_DATAROOM_REVIEW_CASE__:ok('SANA_DATAROOM_REVIEW_CASE_V1','CASE-T','CASE','evidenceRef'),
  __SANA_DATAROOM_REVIEW_HANDOFF__:ok('SANA_DATAROOM_REVIEW_HANDOFF_V1','HANDOFF-T','HANDOFF','handoffRef'),
  __SANA_DATAROOM_REVIEW_FEEDBACK__:{schema:'SANA_DATAROOM_REVIEW_FEEDBACK_V999',cases:blocked},
  __SANA_DATAROOM_REVIEW_RESPONSE__:ok('SANA_DATAROOM_REVIEW_RESPONSE_V1','RESPONSE-T','RESPONSE','responseRef'),
  __SANA_DATAROOM_REVIEW_DISPOSITION__:ok('SANA_DATAROOM_REVIEW_DISPOSITION_V1','DISP-T','DISPOSITION','dispositionRef'),
  __SANA_DATAROOM_REVIEW_ROUND__:{cases:blocked}
};
const ctx={window,views:{dataroom:()=>'<header class="page-head"></header><footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),location:{search:'?rwCapital=CAP-T&rwLot=T&rwStage=CASE',href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwStage=CASE#dataroom'},history:{replaceState:()=>{}},URLSearchParams,URL,console};window.window=window;vm.createContext(ctx);vm.runInContext(js,ctx,{filename:path});
const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;assert(api);const s=api.state(),before=JSON.stringify(s);const byStage=Object.fromEntries(s.sources.map(x=>[x.stage,x]));assert.equal(byStage.CASE.schemaState,'MATCH');assert.equal(byStage.FEEDBACK.state,'AVAILABLE');assert.equal(byStage.FEEDBACK.schemaState,'MISMATCH');assert.equal(byStage.FEEDBACK.expectedSchema,'SANA_DATAROOM_REVIEW_FEEDBACK_V1');assert.equal(byStage.ROUND.state,'AVAILABLE');assert.equal(byStage.ROUND.schemaState,'MISSING');assert.equal(byStage.ROUND.expectedSchema,'SANA_DATAROOM_REVIEW_ROUND_V1');assert.equal(s.summary.schemaMismatches,1);assert.equal(s.summary.missingSourceSchemas,1);assert.equal(s.summary.sourceReadErrors,0);assert.equal(s.summary.unavailableSources,0);const chain=s.chains.find(c=>c.capitalCaseRef==='CAP-T'&&c.lot==='T');assert(chain);const stages=Object.fromEntries(chain.stages.map(x=>[x.stage,x]));assert.equal(stages.FEEDBACK.present,false);assert.equal(stages.FEEDBACK.sourceSchemaState,'MISMATCH');assert.equal(stages.ROUND.present,false);assert.equal(stages.ROUND.sourceSchemaState,'MISSING');assert.deepEqual([...chain.indeterminateStages],['FEEDBACK','ROUND']);assert.deepEqual([...chain.missingStages],[]);assert.equal(s.summary.missingStageReferences,0);assert.equal(JSON.stringify(s),before);for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(s.summary[k],0);
console.log('SANA Data Room review workspace v96 schema integrity validation: OK');
