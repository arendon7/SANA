import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['SOURCE_GUIDANCE ≠ SOURCE_REMEDIATION','GUIDANCE_LINK ≠ SOURCE_VERIFICATION','PROJECTION_PREREQUISITE ≠ REVIEW_REQUIREMENT','SOURCE_NAVIGATION ≠ REVIEW_PRIORITY','REVIEW_V113_COMPAT','reviewEmptyGuidance','reviewSourceIntegrity','focusReviewSourceIntegrity','data-review-empty-source-nav','data-review-source-integrity'])assert(entry.includes(marker),`missing V113 marker: ${marker}`);
assert(css.includes('V113 · Empty-state guidance'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v113';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v112';"));
assert(!/rwGuidance|rwSourceIntegrity|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)|fetch\s*\(|openModal\s*\(/.test(entry));

const source=(stage,state='AVAILABLE',schemaState='MATCH',payloadState='VALID',extra={})=>({stage,label:stage,state,schemaState,payloadState,caseCount:1,validCaseCount:1,invalidCaseCount:0,...extra});
const zeroAuthority={riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0};
const state={
  chains:[],
  sources:[
    source('CASE','UNAVAILABLE','UNKNOWN','UNKNOWN',{caseCount:0,validCaseCount:0}),
    source('HANDOFF','AVAILABLE','MISMATCH','UNKNOWN',{caseCount:0,validCaseCount:0}),
    source('FEEDBACK','AVAILABLE','MATCH','INVALID',{caseCount:1,validCaseCount:0,invalidCaseCount:1}),
    source('RESPONSE'),source('DISPOSITION'),source('ROUND')
  ],
  summary:{...zeroAuthority,unavailableSources:1,sourceReadErrors:0,schemaMismatches:1,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:1,sourcesWithInvalidPayload:1}
};
const focus={capital:'ALL',lot:'ALL',focus:'ALL',stage:'ALL',event:'',ref:''};
const context={requested:false,resolved:true,issues:[],chainKey:'',capitalKnown:true,lotKnown:true};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({...context}),visibleChains:()=>[]};
const views={home:()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>',dataroom:()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>'};
const calls={history:0,render:0,focus:0,scroll:0};
const integrityNode={scrollIntoView:()=>calls.scroll++,focus:()=>calls.focus++};
const document={addEventListener:()=>{},getElementById:()=>null,querySelector:selector=>selector==='[data-review-source-integrity]'?integrityNode:null};
const location={href:'https://demo.test/sana-v3?foo=keep#dataroom',search:'?foo=keep'};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin',canView:view=>view==='dataroom'}};window.window=window;
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history:{replaceState:()=>calls.history++},render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.emptyState&&api?.emptyGuidance&&api?.sourceIntegrity&&api?.focusSourceIntegrity);
const before=JSON.stringify(state);

let empty=api.emptyState(state,focus,context,[]);assert.equal(empty.kind,'SOURCE_INDETERMINATE');
let guidance=api.emptyGuidance(empty,state);assert.equal(guidance.kind,'SOURCE_INDETERMINATE');assert.equal(guidance.navigable,true);assert.equal(guidance.items.length,3);assert.equal(guidance.sourceIntegrity.sources.length,6);
const tech=api.sourceIntegrity(state);assert.equal(tech.sources[0].state,'UNAVAILABLE');assert.equal(tech.sources[1].schemaState,'MISMATCH');assert.equal(tech.sources[2].payloadState,'INVALID');assert.equal(tech.sources[2].invalidCaseCount,1);

const rendered=views.dataroom();assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V113'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V112'));assert(rendered.includes('data-review-empty-state="SOURCE_INDETERMINATE"'));assert(rendered.includes('data-review-empty-guidance="SOURCE_INDETERMINATE"'));assert(rendered.includes('data-review-empty-source-nav'));assert(rendered.includes('data-review-source-integrity'));assert(rendered.includes('API · UNAVAILABLE'));assert(rendered.includes('Schema · MISMATCH'));assert(rendered.includes('Payload · INVALID'));assert(rendered.includes('TECHNICAL ONLY'));
assert.equal(api.focusSourceIntegrity(),true);assert.equal(calls.scroll,1);assert.equal(calls.focus,1);assert.equal(calls.history,0);assert.equal(calls.render,0);

const emptyState={chains:[],sources:[],summary:{...zeroAuthority,unavailableSources:0,sourceReadErrors:0,schemaMismatches:0,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:0,sourcesWithInvalidPayload:0}};
empty=api.emptyState(emptyState,focus,context,[]);assert.equal(empty.kind,'WORKSPACE_EMPTY');guidance=api.emptyGuidance(empty,emptyState);assert.equal(guidance.kind,'WORKSPACE_EMPTY');assert.equal(guidance.navigable,false);assert.equal(guidance.sourceIntegrity,null);assert.equal(guidance.items.length,4);assert(guidance.items.some(x=>x.includes('schema compatible')));assert(guidance.items.some(x=>x.includes('no prueba ausencia de evidencia')));

assert.equal(JSON.stringify(state),before);for(const k of Object.keys(zeroAuthority))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v113 empty-state guidance validation: OK');
