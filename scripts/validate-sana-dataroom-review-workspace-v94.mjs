import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const js=fs.readFileSync(path,'utf8'),css=fs.readFileSync('apps/control-web/public/sana-v3-review-workspace.css','utf8'),sw=fs.readFileSync('apps/control-web/public/sana-v3-sw.js','utf8');
for(const re of [/REVIEW WORKSPACE V94/,/contextIntegrity/,/data-review-workspace-context-clear/,/URL_CONTEXT_UNRESOLVED ≠ SOURCE_MISSING ≠ REVIEW_FAILURE/,/CONTEXT_RESOLUTION ≠ SOURCE_VERIFICATION/,/CONTEXT_CLEAR ≠ SOURCE_MUTATION/])assert.match(js,re);
for(const re of [/\.review-context-integrity\b/,/\.review-context-issue\b/,/\.review-context-integrity-head\b/])assert.match(css,re);
for(const marker of ['REVIEW WORKSPACE V88','REVIEW WORKSPACE V89','REVIEW WORKSPACE V90','REVIEW WORKSPACE V91','REVIEW WORKSPACE V92','REVIEW WORKSPACE V93'])assert(js.includes(marker));
assert(sw.includes("'/sana-v3-review-workspace.css'"));assert(!/fetch\s*\(|storage\s*(\?\.|\.)|openModal\s*\(/.test(js));
const evt=(id,kind,observedAt,extra={})=>({id,kind,observedAt,provenance:'TEST',...extra});
const item=(id,events)=>({id,capitalCaseRef:'CAP-T',lot:'T',events,semantics:{missingInternalReferences:[]},closures:[]});
const source=(schema,primary)=>({schema,cases:()=>[primary]});
const window={
  __SANA_ACCESS__:{role:'admin'},
  __SANA_DATAROOM_REVIEW_CASE__:source('SANA_DATAROOM_REVIEW_CASE_V1',item('CASE-T',[evt('CASE-E1','CASE','2026-08-18T11:00:00-05:00',{evidenceRef:'REF-SHARED'})])),
  __SANA_DATAROOM_REVIEW_HANDOFF__:source('SANA_DATAROOM_REVIEW_HANDOFF_V1',item('HANDOFF-T',[evt('HANDOFF-E1','HANDOFF','2026-08-18T11:10:00-05:00',{handoffRef:'REF-2'})])),
  __SANA_DATAROOM_REVIEW_FEEDBACK__:source('SANA_DATAROOM_REVIEW_FEEDBACK_V1',item('FEEDBACK-T',[evt('FEEDBACK-E1','FEEDBACK','2026-08-18T11:20:00-05:00',{reviewCaseRef:'REF-SHARED'})])),
  __SANA_DATAROOM_REVIEW_RESPONSE__:source('SANA_DATAROOM_REVIEW_RESPONSE_V1',item('RESPONSE-T',[evt('RESPONSE-E1','RESPONSE','2026-08-18T11:30:00-05:00',{responseRef:'REF-3'})])),
  __SANA_DATAROOM_REVIEW_DISPOSITION__:source('SANA_DATAROOM_REVIEW_DISPOSITION_V1',item('DISP-T',[evt('DISP-E1','DISPOSITION','2026-08-18T11:40:00-05:00',{dispositionRef:'REF-4'})])),
  __SANA_DATAROOM_REVIEW_ROUND__:source('SANA_DATAROOM_REVIEW_ROUND_V1',item('ROUND-T',[evt('ROUND-E1','ROUND','2026-08-18T11:50:00-05:00',{roundRef:'REF-5'})]))
};
const ctx={window,views:{dataroom:()=>'<header class="page-head"></header><footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),location:{search:'?rwCapital=CAP-T&rwLot=T&rwStage=CASE&rwEvent=CASE-E1&rwRef=REF-SHARED',href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwStage=CASE&rwEvent=CASE-E1&rwRef=REF-SHARED#dataroom'},history:{replaceState:()=>{}},URLSearchParams,URL,console};window.window=window;vm.createContext(ctx);vm.runInContext(js,ctx,{filename:path});
const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;assert(api);const s=api.state(),f=api.readFocus();const before=JSON.stringify(s);const resolved=api.contextIntegrity(s.chains,f);assert.equal(resolved.resolved,true);assert.equal(resolved.issues.length,0);assert.equal(resolved.chainKey,'CAP-T|T');
const staleEvent=api.contextIntegrity(s.chains,{...f,event:'STALE-EVENT'});assert.equal(staleEvent.resolved,false);assert.deepEqual([...staleEvent.issues.map(x=>x.key)],['rwEvent']);assert.equal(staleEvent.issues[0].semantics,'URL_CONTEXT_UNRESOLVED');
const staleRef=api.contextIntegrity(s.chains,{...f,ref:'STALE-REF'});assert.equal(staleRef.resolved,false);assert.deepEqual([...staleRef.issues.map(x=>x.key)],['rwRef']);
const stalePair=api.contextIntegrity(s.chains,{...f,capital:'CAP-Z',lot:'Z',stage:'CASE',event:'CASE-E1',ref:'REF-SHARED'});assert.equal(stalePair.resolved,false);assert(stalePair.issues.some(x=>x.key==='rwCapital'));assert(stalePair.issues.some(x=>x.key==='rwLot'));assert(stalePair.issues.some(x=>x.key==='rwStage'));assert(stalePair.issues.some(x=>x.key==='rwEvent'));assert(stalePair.issues.some(x=>x.key==='rwRef'));
assert.equal(JSON.stringify(s),before);for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(s.summary[k],0);
console.log('SANA Data Room review workspace v94 context integrity validation: OK');
