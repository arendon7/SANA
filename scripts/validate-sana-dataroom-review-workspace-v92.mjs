import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const js=fs.readFileSync(path,'utf8'),css=fs.readFileSync('apps/control-web/public/sana-v3-review-workspace.css','utf8'),sw=fs.readFileSync('apps/control-web/public/sana-v3-sw.js','utf8');
for(const re of [/REVIEW WORKSPACE V92/,/rwRef/,/referenceOccurrences/,/data-review-workspace-ref/,/REFERENCE_MATCH ≠ ENTITY_MATCH ≠ EXTERNAL_VERIFICATION/,/CROSS_STAGE_OCCURRENCE ≠ CAUSALITY/,/REFERENCE_REUSE ≠ ISSUE_RESOLUTION/,/REFERENCE_COUNT ≠ SIGNIFICANCE ≠ RISK/,/URL_REFERENCE ≠ PERSISTED_STATE/])assert.match(js,re);
for(const re of [/\.review-ref-token\b/,/\.review-reference-explorer\b/,/\.review-reference-hit\b/,/\.review-reference-list\b/])assert.match(css,re);
for(const marker of ['REVIEW WORKSPACE V88','REVIEW WORKSPACE V89','REVIEW WORKSPACE V90','REVIEW WORKSPACE V91'])assert(js.includes(marker));
assert(sw.includes("'/sana-v3-review-workspace.css'"));assert(!/fetch\s*\(|storage\s*(\?\.|\.)|openModal\s*\(/.test(js));
const evt=(id,kind,observedAt,extra={})=>({id,kind,observedAt,provenance:'TEST',...extra});
const item=(id,events,capital='CAP-T',lot='T')=>({id,capitalCaseRef:capital,lot,events,semantics:{missingInternalReferences:[]},closures:[]});
const source=(schema,primary,extra=[])=>({schema,cases:()=>[primary,...extra]});
const shared='SHARED-REF';
const alt=item('CASE-X',[evt('CASE-X-E1','ALT','2026-08-18T10:00:00-05:00',{evidenceRef:shared})],'CAP-X','X');
const window={
  __SANA_ACCESS__:{role:'admin'},
  __SANA_DATAROOM_REVIEW_CASE__:source('SANA_DATAROOM_REVIEW_CASE_V1',item('CASE-T',[evt('CASE-E1','CASE_REF','2026-08-18T11:00:00-05:00',{evidenceRef:shared})]),[alt]),
  __SANA_DATAROOM_REVIEW_HANDOFF__:source('SANA_DATAROOM_REVIEW_HANDOFF_V1',item('HANDOFF-T',[evt('HANDOFF-E1','HANDOFF_REF','2026-08-18T11:10:00-05:00',{handoffRef:'OTHER-1'})])),
  __SANA_DATAROOM_REVIEW_FEEDBACK__:source('SANA_DATAROOM_REVIEW_FEEDBACK_V1',item('FEEDBACK-T',[evt('FEEDBACK-E1','FEEDBACK_REF','2026-08-18T11:20:00-05:00',{reviewCaseRef:shared})])),
  __SANA_DATAROOM_REVIEW_RESPONSE__:source('SANA_DATAROOM_REVIEW_RESPONSE_V1',item('RESPONSE-T',[evt('RESPONSE-E1','RESPONSE_REF','2026-08-18T11:30:00-05:00',{responseRef:'OTHER-2'})])),
  __SANA_DATAROOM_REVIEW_DISPOSITION__:source('SANA_DATAROOM_REVIEW_DISPOSITION_V1',item('DISP-T',[evt('DISP-E1','DISPOSITION_REF','2026-08-18T11:40:00-05:00',{dispositionRef:'OTHER-3'})])),
  __SANA_DATAROOM_REVIEW_ROUND__:source('SANA_DATAROOM_REVIEW_ROUND_V1',item('ROUND-T',[evt('ROUND-E1','ROUND_REF','2026-08-18T11:50:00-05:00',{roundRef:'OTHER-4',privateNote:shared})]))
};
const ctx={window,views:{dataroom:()=>'<header class="page-head"></header><footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),location:{search:`?rwCapital=CAP-T&rwLot=T&rwStage=CASE&rwRef=${shared}`,href:`https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwStage=CASE&rwRef=${shared}#dataroom`},history:{replaceState:()=>{}},URLSearchParams,URL,console};window.window=window;vm.createContext(ctx);vm.runInContext(js,ctx,{filename:path});
const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;assert(api);const s=api.state(),f=api.readFocus();assert.equal(f.ref,shared);const hits=api.referenceOccurrences(s.chains,f,f.ref);assert.equal(hits.length,2);assert.deepEqual([...hits.map(h=>h.stage)],['CASE','FEEDBACK']);assert.deepEqual([...hits.map(h=>h.field)],['evidenceRef','reviewCaseRef']);assert(hits.every(h=>h.ref===shared));assert(!hits.some(h=>h.stage==='ROUND'));assert(!hits.some(h=>h.sourceId==='CASE-X'));assert.equal(api.referenceOccurrences(s.chains,f,'UNKNOWN').length,0);assert.equal(api.referenceOccurrences(s.chains,{...f,capital:'ALL'},shared).length,0);assert.equal(api.referenceOccurrences(s.chains,{...f,lot:'ALL'},shared).length,0);for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(s.summary[k],0);
console.log('SANA Data Room review workspace v92 reference explorer validation: OK');
