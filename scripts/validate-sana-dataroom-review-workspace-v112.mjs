import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['EMPTY_VIEW ≠ EMPTY_EVIDENCE','FILTER_EMPTY ≠ REVIEW_GAP','CONTEXT_EMPTY ≠ SOURCE_MISSING','SOURCE_INDETERMINATE ≠ SOURCE_ABSENT','FILTER_RECOVERY ≠ SOURCE_MUTATION','EMPTY_STATE ≠ REVIEW_OUTCOME','REVIEW_V112_COMPAT','reviewEmptyState','applyReviewFilterRecovery','data-review-empty-recover'])assert(entry.includes(marker),`missing V112 marker: ${marker}`);
assert(css.includes('V112 · Empty state and filter recovery'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v112';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v111';"));
assert(!/rwEmpty|rwNoResults|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)|fetch\s*\(|openModal\s*\(/.test(entry));

const stages=['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND'];
const chain={key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:6,missingStages:[],missingInternalReferences:[],stages:stages.map(stage=>({stage,present:true,ambiguous:false,entry:{id:`${stage}-T`},sourceState:'AVAILABLE',sourceSchemaState:'MATCH',sourcePayloadState:'VALID'}))};
const zeroSummary={riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0,unavailableSources:0,sourceReadErrors:0,schemaMismatches:0,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:0,sourcesWithInvalidPayload:0};
const state={chains:[chain],summary:{...zeroSummary}};
const focus={capital:'CAP-T',lot:'T',focus:'MISSING_STAGE_REFERENCE',stage:'CASE',event:'EV-1',ref:'REF-1'};
const context={requested:true,resolved:true,issues:[],chainKey:'CAP-T|T',capitalKnown:true,lotKnown:true};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({...context}),visibleChains:()=>[]};
const views={home:()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>',dataroom:()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>'};
const calls={history:[],render:0,focus:0};
const workspaceNode={scrollIntoView:()=>{},focus:()=>calls.focus++};
const document={addEventListener:()=>{},getElementById:id=>id==='review-workspace'?workspaceNode:null,querySelector:()=>null};
const location={href:'https://demo.test/sana-v3?foo=keep&rwCapital=CAP-T&rwLot=T&rwFocus=MISSING_STAGE_REFERENCE&rwStage=CASE&rwEvent=EV-1&rwRef=REF-1#dataroom',search:'?foo=keep&rwCapital=CAP-T&rwLot=T&rwFocus=MISSING_STAGE_REFERENCE&rwStage=CASE&rwEvent=EV-1&rwRef=REF-1'};
const history={replaceState:(_a,_b,url)=>calls.history.push(url)};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin',canView:view=>view==='dataroom'}};window.window=window;
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history,render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.emptyState&&api?.recoverEmptyFilter);
const before=JSON.stringify(state);

let e=api.emptyState(state,focus,context,[]);assert.equal(e.kind,'FILTER_EMPTY');assert.equal(e.canRecover,true);assert.deepEqual([...e.clears],['rwFocus']);
e=api.emptyState(state,focus,{...context,resolved:false,issues:[{key:'rwStage'}]},[]);assert.equal(e.kind,'CONTEXT_EMPTY');assert.equal(e.canRecover,false);
e=api.emptyState({chains:[],summary:{...zeroSummary,unavailableSources:1}},focus,context,[]);assert.equal(e.kind,'SOURCE_INDETERMINATE');assert.equal(e.canRecover,false);assert.equal(e.technicalSignals,1);
e=api.emptyState({chains:[],summary:{...zeroSummary}},focus,context,[]);assert.equal(e.kind,'WORKSPACE_EMPTY');assert.equal(e.canRecover,false);
e=api.emptyState(state,focus,context,[chain]);assert.equal(e.kind,'NONE');assert.equal(e.visible,true);

const rendered=views.dataroom();assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V112'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V111'));assert(rendered.includes('data-review-empty-state="FILTER_EMPTY"'));assert(rendered.includes('data-review-empty-recover="CLEAR_FOCUS"'));assert(rendered.includes('Mostrar todos los circuitos'));
let result=api.recoverEmptyFilter('CLEAR_FOCUS');assert.equal(result.applied,true);assert.deepEqual([...result.cleared],['rwFocus']);
let u=new URL(`https://demo.test${calls.history.at(-1)}`);assert.equal(u.searchParams.get('foo'),'keep');assert.equal(u.searchParams.get('rwCapital'),'CAP-T');assert.equal(u.searchParams.get('rwLot'),'T');assert.equal(u.searchParams.get('rwStage'),'CASE');assert.equal(u.searchParams.get('rwEvent'),'EV-1');assert.equal(u.searchParams.get('rwRef'),'REF-1');assert.equal(u.searchParams.has('rwFocus'),false);
assert.equal(api.recoverEmptyFilter('UNKNOWN').applied,false);assert.equal(calls.render,1);assert.equal(calls.focus,1);assert.equal(JSON.stringify(state),before);for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v112 empty-state validation: OK');
