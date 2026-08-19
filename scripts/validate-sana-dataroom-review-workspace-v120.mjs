import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['STRUCTURAL_INDEX ≠ CASE_IDENTITY','INVALID_COUNT ≠ SEVERITY','DIAGNOSTIC_FOCUS ≠ REVIEW_FINDING','DIAGNOSTIC_NAVIGATION ≠ REMEDIATION','DISCLOSURE_OPEN ≠ PERSISTED_STATE','REVIEW_V120_COMPAT','reviewStructuralDiagnosticsIndex','focusReviewStructuralDiagnostics','data-review-structural-index'])assert(entry.includes(marker),`missing V120 marker: ${marker}`);
assert(css.includes('V120 · Structural diagnostics index'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v120';"));assert(sw.includes("const CACHE='sana-v3-demo-shell-v119';"));
assert(!/rwStructuralIndex|rwDiagnosticIndex|data-review-structural-index-state|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)/.test(entry));

const zeroAuthority={riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0};
const sources=[
  {stage:'CASE',label:'Expediente',state:'AVAILABLE',schemaState:'MATCH',payloadState:'PARTIAL_INVALID',caseCount:3,validCaseCount:1,invalidCaseCount:2,invalidCases:[{index:0,id:'BAD-1',issues:['EVENTS_NOT_ARRAY']},{index:2,id:'',issues:['CASE_ID_INVALID']}]},
  {stage:'HANDOFF',label:'Handoff',state:'AVAILABLE',schemaState:'MATCH',payloadState:'VALID',caseCount:1,validCaseCount:1,invalidCaseCount:0,invalidCases:[]},
  {stage:'FEEDBACK',label:'Feedback',state:'AVAILABLE',schemaState:'MATCH',payloadState:'PARTIAL_INVALID',caseCount:2,validCaseCount:1,invalidCaseCount:1,invalidCases:[{index:1,id:'BAD-FB',issues:['CLOSURES_NOT_ARRAY']}]}];
const state={chains:[],sources,summary:{...zeroAuthority,unavailableSources:0,sourceReadErrors:0,schemaMismatches:0,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:3,sourcesWithInvalidPayload:2}};
const focusState={capital:'ALL',lot:'ALL',focus:'ALL',stage:'ALL',event:'',ref:''};
const context={requested:false,resolved:true,issues:[],chainKey:'',capitalKnown:true,lotKnown:true};
const workspaceApi={state:()=>state,readFocus:()=>({...focusState}),contextIntegrity:()=>({...context}),visibleChains:()=>[],sourcePanelTarget:stage=>`panel-${stage.toLowerCase()}`};
const views={home:()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>',dataroom:()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>'};
const calls={history:0,render:0,scroll:0,focus:0};
const makeDetails=()=>({open:false,scrollIntoView:()=>calls.scroll++,querySelector:sel=>sel==='summary'?{focus:()=>calls.focus++}:null});
const caseDetails=makeDetails(),feedbackDetails=makeDetails();
const document={addEventListener:()=>{},getElementById:()=>null,querySelector:selector=>selector==='[data-review-structural-diagnostics="CASE"]'?caseDetails:selector==='[data-review-structural-diagnostics="FEEDBACK"]'?feedbackDetails:null};
const location={href:'https://demo.test/sana-v3?foo=keep#dataroom',search:'?foo=keep'};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'technical',canView:view=>view==='dataroom'}};window.window=window;
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history:{replaceState:()=>calls.history++},render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.structuralDiagnosticsIndex);assert(api?.focusStructuralDiagnostics);
const projected=api.sourceIntegrity(state),index=api.structuralDiagnosticsIndex(projected);
assert.equal(index.totalInvalid,3);assert.equal(index.items.length,2);assert.deepEqual(index.items.map(item=>item.stage),['CASE','FEEDBACK']);assert.deepEqual(index.items.map(item=>item.count),[2,1]);assert(!index.items.some(item=>item.stage==='HANDOFF'));
const before=JSON.stringify(state),rendered=views.dataroom();assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V120'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V119'));assert(rendered.includes('data-review-structural-index'));assert(rendered.includes('data-review-structural-index-nav="CASE"'));assert(rendered.includes('data-review-structural-index-nav="FEEDBACK"'));assert(rendered.includes('id="review-structural-diagnostics-case"'));assert(rendered.includes('id="review-structural-diagnostics-feedback"'));
assert.equal(api.focusStructuralDiagnostics('CASE'),true);assert.equal(caseDetails.open,true);assert.equal(feedbackDetails.open,false);assert.equal(calls.scroll,1);assert.equal(calls.focus,1);
assert.equal(api.focusStructuralDiagnostics('ROUND'),false);assert.equal(calls.scroll,1);assert.equal(calls.focus,1);
assert.equal(calls.history,0);assert.equal(calls.render,0);assert.equal(JSON.stringify(state),before);for(const k of Object.keys(zeroAuthority))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v120 structural diagnostics index validation: OK');
