import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const js=fs.readFileSync(path,'utf8'),css=fs.readFileSync('apps/control-web/public/sana-v3-review-workspace.css','utf8'),sw=fs.readFileSync('apps/control-web/public/sana-v3-sw.js','utf8');
for(const re of [/REVIEW WORKSPACE V90/,/rwStage/,/selectedEntry/,/data-review-workspace-stage/,/data-review-workspace-inspector-close/,/SELECTED_STAGE ≠ VERIFIED_STAGE ≠ COMPLETED_STAGE/,/DETAIL_PANEL ≠ SOURCE_DOCUMENT/,/SOURCE_REFERENCE ≠ EXTERNAL_VERIFICATION/,/sourceSchema/])assert.match(js,re);
for(const re of [/\.review-inspector\b/,/\.review-inspector-grid\b/,/\.review-stage\.is-selected/,/\.review-stage-button/])assert.match(css,re);
assert.match(js,/const UX_BASELINE='REVIEW WORKSPACE V88'/);assert(sw.includes("'/sana-v3-review-workspace.css'"));assert(!/fetch\s*\(|storage\s*(\?\.|\.)|openModal\s*\(/.test(js));
const full=(id,capital='CAP-T',lot='T',missing=[])=>({id,capitalCaseRef:capital,lot,schema:`SCHEMA_${id}`,events:[{observedAt:'2026-08-18T13:00:00-05:00'},{observedAt:'2026-08-18T14:00:00-05:00'}],semantics:{missingInternalReferences:missing},closures:[]});
const source=(schema,id)=>({schema,cases:()=>[full(id)]});
const window={
  __SANA_ACCESS__:{role:'admin'},
  __SANA_DATAROOM_REVIEW_CASE__:source('SANA_DATAROOM_REVIEW_CASE_V1','CASE-T'),
  __SANA_DATAROOM_REVIEW_HANDOFF__:source('SANA_DATAROOM_REVIEW_HANDOFF_V1','HANDOFF-T'),
  __SANA_DATAROOM_REVIEW_FEEDBACK__:source('SANA_DATAROOM_REVIEW_FEEDBACK_V1','FEEDBACK-T'),
  __SANA_DATAROOM_REVIEW_RESPONSE__:source('SANA_DATAROOM_REVIEW_RESPONSE_V1','RESPONSE-T'),
  __SANA_DATAROOM_REVIEW_DISPOSITION__:source('SANA_DATAROOM_REVIEW_DISPOSITION_V1','DISP-T'),
  __SANA_DATAROOM_REVIEW_ROUND__:source('SANA_DATAROOM_REVIEW_ROUND_V1','ROUND-T')
};
const ctx={window,views:{dataroom:()=>'<header class="page-head"></header><footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),location:{search:'?rwCapital=CAP-T&rwLot=T&rwStage=CASE',href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwStage=CASE#dataroom'},history:{replaceState:()=>{}},URLSearchParams,URL,console};window.window=window;vm.createContext(ctx);vm.runInContext(js,ctx,{filename:path});
const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;assert(api);const s=api.state();assert.equal(s.chains.length,1);const f=api.readFocus();assert.equal(f.capital,'CAP-T');assert.equal(f.lot,'T');assert.equal(f.focus,'ALL');assert.equal(f.stage,'CASE');const e=api.selectedEntry(s.chains,f);assert(e);assert.equal(e.id,'CASE-T');assert.equal(e.stage,'CASE');assert.equal(e.sourceSchema,'SANA_DATAROOM_REVIEW_CASE_V1');assert.equal(e.eventCount,2);assert.equal(e.firstObservedAt,'2026-08-18T13:00:00-05:00');assert.equal(e.lastObservedAt,'2026-08-18T14:00:00-05:00');assert.equal(api.selectedEntry(s.chains,{capital:'ALL',lot:'ALL',focus:'ALL',stage:'ALL'}),null);for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(s.summary[k],0);
console.log('SANA Data Room review workspace v90 inspector validation: OK');
