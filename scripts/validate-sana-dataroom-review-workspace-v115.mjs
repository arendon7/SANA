import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['SOURCE_INTEGRITY_RETURN ≠ REVIEW_STATE_CHANGE','RETURN_TARGET ≠ SOURCE_VERIFICATION','INTEGRITY_RETURN ≠ REMEDIATION','FOCUS_RETURN ≠ REVIEW_PRIORITY','REVIEW_V115_COMPAT','decorateSourceIntegrityReturns','data-review-source-integrity-return','review-workspace-source-integrity'])assert(entry.includes(marker),`missing V115 marker: ${marker}`);
assert(sw.includes("const CACHE='sana-v3-demo-shell-v115';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v114';"));
assert(!/rwIntegrityReturn|rwSourceReturn|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)|fetch\s*\(/.test(entry));

const targets={CASE:'dataroom-review-case-panel',HANDOFF:'dataroom-review-handoff-panel',FEEDBACK:'dataroom-review-feedback-panel',RESPONSE:'dataroom-review-response-panel',DISPOSITION:'dataroom-review-disposition-panel',ROUND:'dataroom-review-round-panel'};
const zeroAuthority={riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0};
const source=(stage,state='AVAILABLE')=>({stage,label:stage,state,schemaState:state==='AVAILABLE'?'MATCH':'UNKNOWN',payloadState:state==='AVAILABLE'?'VALID':'UNKNOWN',caseCount:state==='AVAILABLE'?1:0,validCaseCount:state==='AVAILABLE'?1:0,invalidCaseCount:0});
const state={chains:[],sources:[source('CASE','UNAVAILABLE'),source('HANDOFF'),source('FEEDBACK'),source('RESPONSE'),source('DISPOSITION'),source('ROUND')],summary:{...zeroAuthority,unavailableSources:1,sourceReadErrors:0,schemaMismatches:0,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:0,sourcesWithInvalidPayload:0}};
const focus={capital:'ALL',lot:'ALL',focus:'ALL',stage:'ALL',event:'',ref:''};
const context={requested:false,resolved:true,issues:[],chainKey:'',capitalKnown:true,lotKnown:true};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({...context}),visibleChains:()=>[],sourcePanelTarget:stage=>targets[stage]||''};
const sourcePanels=Object.entries(targets).map(([stage,id])=>`<section id="${id}" data-review-source-panel="${stage}"><button type="button" class="btn ghost" data-review-source-return aria-controls="review-workspace">Volver al workspace</button></section>`).join('');
const baseDataRoom=()=>`<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section>${sourcePanels}<footer class="footer"></footer>`;
const views={home:()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>',dataroom:baseDataRoom};
const calls={history:0,render:0,focus:0,scroll:0};
const integrityNode={scrollIntoView:()=>calls.scroll++,focus:()=>calls.focus++};
let clickHandler=null;
const document={addEventListener:(type,fn)=>{if(type==='click')clickHandler=fn},getElementById:()=>null,querySelector:selector=>selector==='[data-review-source-integrity]'?integrityNode:null};
const location={href:'https://demo.test/sana-v3?foo=keep#dataroom',search:'?foo=keep'};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin',canView:view=>view==='dataroom'}};window.window=window;
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history:{replaceState:()=>calls.history++},render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.decorateSourceIntegrityReturns&&api?.focusSourceIntegrity);
const before=JSON.stringify(state);

const undecorated=api.decorateSourceIntegrityReturns(baseDataRoom(),false);assert.equal((undecorated.match(/data-review-source-integrity-return/g)||[]).length,0);
const decorated=api.decorateSourceIntegrityReturns(baseDataRoom(),true);assert.equal((decorated.match(/data-review-source-integrity-return/g)||[]).length,6);assert.equal((decorated.match(/Volver al workspace/g)||[]).length,6);assert.equal((decorated.match(/Volver a integridad/g)||[]).length,6);
const rendered=views.dataroom();assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V115'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V114'));assert(rendered.includes('id="review-workspace-source-integrity"'));assert.equal((rendered.match(/data-review-source-integrity-return/g)||[]).length,6);

assert(clickHandler);const returnTarget={closest:selector=>selector==='[data-review-source-integrity-return]'?returnTarget:null};clickHandler({target:returnTarget});assert.equal(calls.scroll,1);assert.equal(calls.focus,1);assert.equal(calls.history,0);assert.equal(calls.render,0);
assert.equal(JSON.stringify(state),before);for(const k of Object.keys(zeroAuthority))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v115 source-integrity return validation: OK');
