import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const js=fs.readFileSync(path,'utf8'),css=fs.readFileSync('apps/control-web/public/sana-v3-review-workspace.css','utf8'),sw=fs.readFileSync('apps/control-web/public/sana-v3-sw.js','utf8');
for(const re of [/REVIEW WORKSPACE V89/,/URL_FOCUS ≠ PERSISTED_STATE/,/FILTER_MATCH ≠ RISK ≠ PRIORITY/,/rwCapital/,/rwLot/,/rwFocus/,/history\.replaceState/,/data-review-workspace-filter/,/data-review-workspace-clear/])assert.match(js,re);
for(const re of [/\.review-workspace-controls/,/\.review-workspace-controls select/,/@media\(max-width:620px\)/])assert.match(css,re);
assert.match(js,/const UX_BASELINE='REVIEW WORKSPACE V88'/);assert(sw.includes("'/sana-v3-review-workspace.css'"));assert(!/fetch\s*\(|storage\s*(\?\.|\.)|openModal\s*\(/.test(js));
const full=(id,capital='CAP-T',lot='T',missing=[])=>({id,capitalCaseRef:capital,lot,events:[{observedAt:'2026-08-18T13:00:00-05:00'}],semantics:{missingInternalReferences:missing},closures:[]});
const window={
  __SANA_ACCESS__:{role:'admin'},
  __SANA_DATAROOM_REVIEW_CASE__:{cases:()=>[full('CASE-T'),full('CASE-M','CAP-M','M',['missing:doc'])]},
  __SANA_DATAROOM_REVIEW_HANDOFF__:{cases:()=>[full('HANDOFF-T')]},
  __SANA_DATAROOM_REVIEW_FEEDBACK__:{cases:()=>[full('FEEDBACK-T')]},
  __SANA_DATAROOM_REVIEW_RESPONSE__:{cases:()=>[full('RESPONSE-T')]},
  __SANA_DATAROOM_REVIEW_DISPOSITION__:{cases:()=>[full('DISP-T')]},
  __SANA_DATAROOM_REVIEW_ROUND__:{cases:()=>[full('ROUND-T')]}
};
const ctx={window,views:{dataroom:()=>'<header class="page-head"></header><footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),document:{addEventListener:()=>{}},location:{search:'?rwCapital=CAP-M&rwLot=M&rwFocus=MISSING_STAGE_REFERENCE',href:'https://demo.test/sana-v3?rwCapital=CAP-M&rwLot=M&rwFocus=MISSING_STAGE_REFERENCE#dataroom'},history:{replaceState:()=>{}},URLSearchParams,URL,console};window.window=window;vm.createContext(ctx);vm.runInContext(js,ctx,{filename:path});
const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;assert(api);const s=api.state();assert.equal(s.chains.length,2);const t=s.chains.find(c=>c.capitalCaseRef==='CAP-T'),m=s.chains.find(c=>c.capitalCaseRef==='CAP-M');assert(t&&m);assert.equal(t.stageCount,6);assert.equal(t.stageCompletenessLabel,'6/6 PRESENT');assert.equal(m.stageCount,1);assert.equal(m.missingStages.length,5);assert.equal(m.missingInternalReferences.length,1);
const focus=api.readFocus();assert.equal(focus.capital,'CAP-M');assert.equal(focus.lot,'M');assert.equal(focus.focus,'MISSING_STAGE_REFERENCE');assert.deepEqual(api.visibleChains(s.chains,focus).map(c=>c.capitalCaseRef),['CAP-M']);assert.deepEqual(api.visibleChains(s.chains,{capital:'ALL',lot:'ALL',focus:'MISSING_INTERNAL_REFERENCE'}).map(c=>c.capitalCaseRef),['CAP-M']);assert.equal(api.visibleChains(s.chains,{capital:'CAP-T',lot:'T',focus:'MISSING_STAGE_REFERENCE'}).length,0);assert.equal(api.visibleChains(s.chains,{capital:'CAP-T',lot:'T',focus:'ALL'}).length,1);
for(const f of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(s.summary[f],0);
console.log('SANA Data Room review workspace v89 focus validation: OK');
