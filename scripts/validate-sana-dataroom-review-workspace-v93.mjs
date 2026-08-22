import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const js=fs.readFileSync(path,'utf8'),css=fs.readFileSync('apps/control-web/public/sana-v3-review-workspace.css','utf8'),sw=fs.readFileSync('apps/control-web/public/sana-v3-sw.js','utf8');
for(const re of [/REVIEW WORKSPACE V93/,/rwEvent/,/selectedTimelineEvent/,/data-review-workspace-event/,/data-review-workspace-occurrence-event/,/SELECTED_EVENT ≠ VERIFIED_EVENT/,/EVENT_FOCUS ≠ EVENT_PRIORITY ≠ REVIEW_PROGRESS/,/EVENT_ID_MATCH ≠ ENTITY_IDENTITY/,/URL_EVENT ≠ PERSISTED_STATE/,/EVENT_NAVIGATION ≠ SOURCE_MUTATION/,/FOCUSED_OCCURRENCE ≠ REFERENCE_VERIFICATION/])assert.match(js,re);
for(const re of [/\.review-event\.is-focused\b/,/\.review-event-focus\b/,/\.review-event-focus-panel\b/,/\.review-occurrence-focus\b/])assert.match(css,re);
for(const marker of ['REVIEW WORKSPACE V88','REVIEW WORKSPACE V89','REVIEW WORKSPACE V90','REVIEW WORKSPACE V91','REVIEW WORKSPACE V92'])assert(js.includes(marker));
assert(sw.includes("'/sana-v3-review-workspace.css'"));assert(!/fetch\s*\(|storage\s*(\?\.|\.)|openModal\s*\(/.test(js));
const evt=(id,kind,observedAt,extra={})=>({id,kind,observedAt,provenance:'TEST',...extra});
const item=(id,events)=>({id,capitalCaseRef:'CAP-T',lot:'T',events,semantics:{missingInternalReferences:[]},closures:[]});
const source=(schema,primary)=>({schema,cases:()=>[primary]});
const duplicate='DUP-EVENT';
const window={
  __SANA_ACCESS__:{role:'admin'},
  __SANA_DATAROOM_REVIEW_CASE__:source('SANA_DATAROOM_REVIEW_CASE_V1',item('CASE-T',[evt('CASE-E1','CASE_FIRST','2026-08-18T11:00:00-05:00',{evidenceRef:'REF-1'}),evt(duplicate,'CASE_DUPLICATE_ID','2026-08-18T11:05:00-05:00',{evidenceRef:'SHARED'})])),
  __SANA_DATAROOM_REVIEW_HANDOFF__:source('SANA_DATAROOM_REVIEW_HANDOFF_V1',item('HANDOFF-T',[evt('HANDOFF-E1','HANDOFF','2026-08-18T11:10:00-05:00',{handoffRef:'REF-2'})])),
  __SANA_DATAROOM_REVIEW_FEEDBACK__:source('SANA_DATAROOM_REVIEW_FEEDBACK_V1',item('FEEDBACK-T',[evt(duplicate,'FEEDBACK_DUPLICATE_ID','2026-08-18T11:20:00-05:00',{reviewCaseRef:'SHARED'})])),
  __SANA_DATAROOM_REVIEW_RESPONSE__:source('SANA_DATAROOM_REVIEW_RESPONSE_V1',item('RESPONSE-T',[evt('RESPONSE-E1','RESPONSE','2026-08-18T11:30:00-05:00',{responseRef:'REF-3'})])),
  __SANA_DATAROOM_REVIEW_DISPOSITION__:source('SANA_DATAROOM_REVIEW_DISPOSITION_V1',item('DISP-T',[evt('DISP-E1','DISPOSITION','2026-08-18T11:40:00-05:00',{dispositionRef:'REF-4'})])),
  __SANA_DATAROOM_REVIEW_ROUND__:source('SANA_DATAROOM_REVIEW_ROUND_V1',item('ROUND-T',[evt('ROUND-E1','ROUND','2026-08-18T11:50:00-05:00',{roundRef:'REF-5'})]))
};
const ctx={window,views:{dataroom:()=>'<header class="page-head"></header><footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),location:{search:`?rwCapital=CAP-T&rwLot=T&rwStage=CASE&rwEvent=${duplicate}&rwRef=SHARED`,href:`https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwStage=CASE&rwEvent=${duplicate}&rwRef=SHARED#dataroom`},history:{replaceState:()=>{}},URLSearchParams,URL,console};window.window=window;vm.createContext(ctx);vm.runInContext(js,ctx,{filename:path});
const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;assert(api);const s=api.state(),f=api.readFocus();assert.equal(f.event,duplicate);const caseEntry=api.selectedEntry(s.chains,f);assert.equal(caseEntry.stage,'CASE');const caseEvent=api.selectedTimelineEvent(caseEntry,f);assert(caseEvent);assert.equal(caseEvent.kind,'CASE_DUPLICATE_ID');assert.equal(caseEvent.id,duplicate);const feedbackFocus={...f,stage:'FEEDBACK'},feedbackEntry=api.selectedEntry(s.chains,feedbackFocus),feedbackEvent=api.selectedTimelineEvent(feedbackEntry,feedbackFocus);assert.equal(feedbackEvent.kind,'FEEDBACK_DUPLICATE_ID');assert.notEqual(caseEvent.kind,feedbackEvent.kind);assert.equal(api.selectedTimelineEvent(caseEntry,{...f,event:'UNKNOWN'}),null);const hits=api.referenceOccurrences(s.chains,f,'SHARED');assert.equal(hits.length,2);assert.deepEqual([...hits.map(h=>h.stage)],['CASE','FEEDBACK']);for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(s.summary[k],0);
console.log('SANA Data Room review workspace v93 event focus validation: OK');
