import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8');
const css=fs.readFileSync(cssPath,'utf8');
const sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['FOCUS_CONTINUITY ≠ REVIEW_PROGRESS','LIVE_ANNOUNCEMENT ≠ REVIEW_OUTCOME','RESTORED_FOCUS ≠ SOURCE_MUTATION','ANNOUNCED_CONTEXT ≠ CONTEXT_VERIFICATION','KEYBOARD_FOCUS ≠ REVIEW_PRIORITY','REVIEW_V109_COMPAT','reviewLiveContext','focusReviewStage','data-review-context-live','aria-live="polite"','aria-atomic="true"'])assert(entry.includes(marker),`missing V109 marker: ${marker}`);
assert(css.includes('V109 · Focus continuity & live context'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v109';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v108';"));
assert(!/rwLive|rwFocusReturn|rwAnnounce|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)|fetch\s*\(|openModal\s*\(/.test(entry));

const stages=['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND'];
const chain={key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:6,missingStages:[],missingInternalReferences:[],stages:stages.map(stage=>({stage,present:true,ambiguous:false,entry:{id:`${stage}-T`},sourceState:'AVAILABLE',sourceSchemaState:'MATCH',sourcePayloadState:'VALID'}))};
const state={chains:[chain],summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}};
const focus={capital:'CAP-T',lot:'T',focus:'ALL',stage:'CASE',event:'',ref:''};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({requested:true,resolved:true,issues:[]}),visibleChains:chains=>chains};
const baseHome=()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>';
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>';
const views={home:baseHome,dataroom:baseDataRoom};
const access={role:'admin',canView:view=>view==='dataroom'};
const calls={go:[],scroll:0,workspaceFocus:0,stageFocus:[],render:0,history:[]};
const workspaceNode={scrollIntoView:()=>calls.scroll++,focus:()=>calls.workspaceFocus++};
const stageNodes=Object.fromEntries(stages.map(stage=>[stage,{disabled:false,focus:()=>calls.stageFocus.push(stage)}]));
const listeners={};
const document={
  addEventListener:(type,fn)=>{listeners[type]=fn},
  getElementById:id=>id==='review-workspace'?workspaceNode:null,
  querySelector:selector=>{const m=selector.match(/data-review-context-stage="([A-Z]+)"/);return m?stageNodes[m[1]]||null:null}
};
const location={href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwStage=CASE#dataroom',search:'?rwCapital=CAP-T&rwLot=T&rwStage=CASE'};
const history={replaceState:(_a,_b,url)=>calls.history.push(url)};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:access};window.window=window;window.go=view=>calls.go.push(view);
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history,render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.focusStage&&api?.liveContext&&api?.focusWorkspace&&api?.selectStage);
const beforeState=JSON.stringify(state),beforeHref=location.href,beforeSearch=location.search;

const live=api.liveContext({stage:'CASE',stageLabel:'Expediente',resolved:true,issueCount:0,visibleChains:1});
assert.equal(live,'Contexto de revisión: Expediente; contexto resuelto; 1 circuito(s) visible(s).');
const unresolved=api.liveContext({stage:'ALL',stageLabel:'Todas',resolved:false,issueCount:2,visibleChains:0});
assert.equal(unresolved,'Contexto de revisión: Todas las etapas; contexto con 2 selector(es) no resuelto(s); 0 circuito(s) visible(s).');
const rendered=views.dataroom();
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V109'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V108'));
assert(rendered.includes('data-review-context-live'));
assert(rendered.includes('role="status" aria-live="polite" aria-atomic="true"'));
assert(rendered.includes('Contexto de revisión: Expediente; contexto resuelto; 1 circuito(s) visible(s).'));

assert.equal(api.focusStage('CASE'),true);assert.deepEqual(calls.stageFocus,['CASE']);
assert.equal(api.selectStage('HANDOFF'),true);assert.equal(calls.render,1);assert(calls.history.at(-1).includes('rwStage=HANDOFF'));assert.equal(calls.stageFocus.at(-1),'HANDOFF');

const targetFor=kind=>({dataset:kind==='rail'?{reviewWorkspaceStage:'FEEDBACK'}:{},closest:selector=>{
  if(kind==='rail'&&selector==='[data-review-workspace-stage]')return targetFor.rail;
  if(kind==='close'&&selector==='[data-review-workspace-inspector-close]')return targetFor.close;
  if(kind==='return'&&selector==='[data-review-source-return]')return targetFor.return;
  return null;
}});
targetFor.rail=targetFor('rail');targetFor.close=targetFor('close');targetFor.return=targetFor('return');
listeners.click({target:targetFor.rail});assert.equal(calls.stageFocus.at(-1),'FEEDBACK');
const beforeWorkspace=calls.workspaceFocus;listeners.click({target:targetFor.close});assert.equal(calls.workspaceFocus,beforeWorkspace+1);
listeners.click({target:targetFor.return});assert.equal(calls.workspaceFocus,beforeWorkspace+2);

assert.equal(location.href,beforeHref);assert.equal(location.search,beforeSearch);assert.equal(JSON.stringify(state),beforeState);
for(const k of Object.keys(state.summary))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v109 focus continuity/live context validation: OK');
