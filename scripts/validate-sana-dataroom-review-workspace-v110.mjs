import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8');
const css=fs.readFileSync(cssPath,'utf8');
const sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['CONTEXT_RECOVERY ≠ DATA_REMEDIATION','URL_ISSUE_CLEAR ≠ SOURCE_ISSUE_RESOLUTION','URL_SELECTOR_CLEAR ≠ SOURCE_MUTATION','RECOVERY_CHOICE ≠ REVIEW_DECISION','COMPOSITE_CONTEXT_RESET ≠ SOURCE_LOSS','REVIEW_V110_COMPAT','REVIEW_RECOVERY_RULES','reviewRecoveryPlan','applyReviewRecovery','data-review-context-recover'])assert(entry.includes(marker),`missing V110 marker: ${marker}`);
assert(css.includes('V110 · Context recovery'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v110';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v109';"));
assert(!/rwRecovery|rwRecover|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)|fetch\s*\(|openModal\s*\(/.test(entry));

const issues=[
  {key:'rwCapital',value:'OLD-CAP',detail:'capital stale'},
  {key:'rwLot',value:'OLD-LOT',detail:'lot stale'},
  {key:'rwContext',value:'OLD-CAP|OLD-LOT',detail:'combo stale'},
  {key:'rwStage',value:'HANDOFF',detail:'stage stale'},
  {key:'rwEvent',value:'EV-X',detail:'event stale'},
  {key:'rwRef',value:'REF-X',detail:'ref stale'}
];
const stages=['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND'];
const chain={key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:6,missingStages:[],missingInternalReferences:[],stages:stages.map(stage=>({stage,present:true,ambiguous:false,entry:{id:`${stage}-T`},sourceState:'AVAILABLE',sourceSchemaState:'MATCH',sourcePayloadState:'VALID'}))};
const state={chains:[chain],summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}};
const focus={capital:'OLD-CAP',lot:'OLD-LOT',focus:'MISSING_STAGE_REFERENCE',stage:'HANDOFF',event:'EV-X',ref:'REF-X'};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({requested:true,resolved:false,issues,chainKey:'',capitalKnown:false,lotKnown:false}),visibleChains:()=>[]};
const baseHome=()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>';
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>';
const views={home:baseHome,dataroom:baseDataRoom};
const access={role:'admin',canView:view=>view==='dataroom'};
const calls={history:[],render:0,focus:0};
const workspaceNode={scrollIntoView:()=>{},focus:()=>calls.focus++};
const document={addEventListener:()=>{},getElementById:id=>id==='review-workspace'?workspaceNode:null,querySelector:()=>null};
const location={href:'https://demo.test/sana-v3?foo=keep&rwCapital=OLD-CAP&rwLot=OLD-LOT&rwFocus=MISSING_STAGE_REFERENCE&rwStage=HANDOFF&rwEvent=EV-X&rwRef=REF-X#dataroom',search:'?foo=keep&rwCapital=OLD-CAP&rwLot=OLD-LOT&rwFocus=MISSING_STAGE_REFERENCE&rwStage=HANDOFF&rwEvent=EV-X&rwRef=REF-X'};
const history={replaceState:(_a,_b,url)=>calls.history.push(url)};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:access};window.window=window;
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history,render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.recoveryPlan&&api?.recoverContext);
const beforeState=JSON.stringify(state);
const plan=api.recoveryPlan([...issues,issues[3]]);assert.equal(plan.length,6);
const byKey=Object.fromEntries(plan.map(x=>[x.issueKey,x]));
assert.deepEqual([...byKey.rwCapital.keys],['rwCapital']);
assert.deepEqual([...byKey.rwLot.keys],['rwLot']);
assert.deepEqual([...byKey.rwStage.keys],['rwStage','rwEvent']);
assert.deepEqual([...byKey.rwEvent.keys],['rwEvent']);
assert.deepEqual([...byKey.rwRef.keys],['rwRef']);
assert.deepEqual([...byKey.rwContext.keys],['rwCapital','rwLot','rwStage','rwEvent','rwRef']);

const rendered=views.dataroom();
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V110'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V109'));
assert(rendered.includes('data-review-context-recovery'));
assert(rendered.includes('data-review-context-recover="rwStage"'));
assert(rendered.includes('data-review-context-recover="rwContext"'));
assert(rendered.includes('data-review-context-recover="ALL"'));

let result=api.recoverContext('rwStage');assert.equal(result.applied,true);assert.deepEqual([...result.cleared],['rwStage','rwEvent']);
let u=new URL(`https://demo.test${calls.history.at(-1)}`);assert.equal(u.searchParams.get('foo'),'keep');assert.equal(u.searchParams.get('rwCapital'),'OLD-CAP');assert.equal(u.searchParams.get('rwLot'),'OLD-LOT');assert.equal(u.searchParams.get('rwFocus'),'MISSING_STAGE_REFERENCE');assert.equal(u.searchParams.get('rwRef'),'REF-X');assert.equal(u.searchParams.has('rwStage'),false);assert.equal(u.searchParams.has('rwEvent'),false);

result=api.recoverContext('rwContext');assert.equal(result.applied,true);u=new URL(`https://demo.test${calls.history.at(-1)}`);assert.equal(u.searchParams.get('foo'),'keep');assert.equal(u.searchParams.get('rwFocus'),'MISSING_STAGE_REFERENCE');for(const key of ['rwCapital','rwLot','rwStage','rwEvent','rwRef'])assert.equal(u.searchParams.has(key),false);
result=api.recoverContext('ALL');assert.equal(result.applied,true);u=new URL(`https://demo.test${calls.history.at(-1)}`);assert.equal(u.searchParams.get('foo'),'keep');for(const key of ['rwCapital','rwLot','rwFocus','rwStage','rwEvent','rwRef'])assert.equal(u.searchParams.has(key),false);
assert.equal(api.recoverContext('UNKNOWN').applied,false);
assert.equal(calls.render,3);assert.equal(calls.focus,3);assert.equal(JSON.stringify(state),beforeState);for(const k of Object.keys(state.summary))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v110 context recovery validation: OK');
