import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const workspacePath='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8');
const workspace=fs.readFileSync(workspacePath,'utf8');
const sw=fs.readFileSync(swPath,'utf8');

assert.match(workspace,/BIDIRECTIONAL_NAVIGATION_BASELINE='REVIEW WORKSPACE V101'/);
assert.doesNotMatch(workspace,/GUIDED_ENTRY|openGuidedReview|data-review-guided-entry/);
for(const marker of [
  'GUIDED_ENTRY ≠ ACCESS_GRANT',
  'ENTRY_ROUTE ≠ REVIEW_PRIORITY',
  'WORKSPACE_ENTRY ≠ REVIEW_DECISION',
  'ENTRY_SCROLL ≠ SOURCE_MUTATION',
  'ENTRY_CONTEXT_PRESERVED ≠ CONTEXT_VERIFICATION'
]) assert(entry.includes(marker),`missing V107 boundary: ${marker}`);
for(const marker of ['reviewGuidedEntry','openGuidedReview','data-review-guided-entry','REVIEW_V106_COMPAT'])assert(entry.includes(marker),`missing V107 marker: ${marker}`);
assert(sw.includes("const CACHE='sana-v3-demo-shell-v107';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v106';"));
assert(!/rwEntry|reviewEntry=/.test(entry),'guided entry must not create URL state');
assert(!/localStorage\.(?:setItem|removeItem|clear)\s*\(/.test(entry));
assert(!/sessionStorage\s*(?:\.|\[)/.test(entry));
assert(!/fetch\s*\(|openModal\s*\(/.test(entry));

const stages=['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND'];
const meta=stage=>({stage,present:true,ambiguous:false,entry:{id:`${stage}-T`},sourceState:'AVAILABLE',sourceSchemaState:'MATCH',sourcePayloadState:'VALID'});
const chain={key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:6,missingStages:[],missingInternalReferences:[],stages:stages.map(meta)};
const state={chains:[chain],summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}};
const focus={capital:'CAP-T',lot:'T',focus:'MISSING_INTERNAL_REFERENCE',stage:'CASE',event:'CASE-E1',ref:'REF-T'};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({requested:true,resolved:true,issues:[]}),visibleChains:chains=>chains};
const baseHome=()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>';
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div><div class="grid metrics review-workspace-metrics">METRICAS</div></div></section><footer class="footer"></footer>';
const views={home:baseHome,dataroom:baseDataRoom};
const allowedRoles=new Set(['admin','technical','producer','investor']);
const access={role:'admin',canView:view=>view==='dataroom'&&allowedRoles.has(access.role)};
const calls={go:[],scroll:0,access:[]};
const originalCanView=access.canView;access.canView=view=>{calls.access.push([access.role,view]);return originalCanView(view)};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:access};window.window=window;
const location={href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwFocus=MISSING_INTERNAL_REFERENCE&rwStage=CASE&rwEvent=CASE-E1&rwRef=REF-T&other=KEEP#home',search:'?rwCapital=CAP-T&rwLot=T&rwFocus=MISSING_INTERNAL_REFERENCE&rwStage=CASE&rwEvent=CASE-E1&rwRef=REF-T&other=KEEP'};
window.go=view=>calls.go.push(view);
const document={addEventListener:()=>{},getElementById:id=>id==='review-workspace'?{scrollIntoView:()=>{calls.scroll++}}:null};
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history:{replaceState:()=>{}},render:()=>{},document,console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.guidedEntry&&api?.openGuidedReview);

const beforeHref=location.href,beforeSearch=location.search,beforeState=JSON.stringify(state);
for(const role of ['admin','technical','producer','investor']){
  access.role=role;calls.go.length=0;calls.scroll=0;
  const info=api.guidedEntry(role);
  assert.equal(info.role,role);
  assert.equal(info.allowed,true);
  assert.equal(info.view,'dataroom');
  assert.equal(info.target,'review-workspace');
  assert.equal(info.preservesContext,true);
  assert.equal(info.accessEffect,'NONE');
  assert.equal(info.filterEffect,'NONE');
  assert.equal(info.priorityEffect,'NONE');
  assert.equal(api.openGuidedReview(),true);
  assert.deepEqual(calls.go,['dataroom']);
  assert.equal(calls.scroll,1);
  assert.equal(location.href,beforeHref);
  assert.equal(location.search,beforeSearch);
  assert.equal(JSON.stringify(state),beforeState);
  const home=views.home();
  assert(home.includes('data-review-guided-entry'));
  assert(home.includes('GUIDED_ENTRY ≠ ACCESS_GRANT'));
}
for(const role of ['visitor','new_user']){
  access.role=role;calls.go.length=0;calls.scroll=0;
  const info=api.guidedEntry(role);
  assert.equal(info.allowed,false);
  assert.equal(api.openGuidedReview(),false);
  assert.deepEqual(calls.go,[]);
  assert.equal(calls.scroll,0);
  assert.equal(location.href,beforeHref);
  assert.equal(location.search,beforeSearch);
  assert.equal(views.home(),baseHome());
}
assert(calls.access.every(([,view])=>view==='dataroom'));

access.role='admin';
const rendered=views.dataroom();
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V107'));
assert(rendered.includes('Circuito de revisión, con entrada guiada y contexto humano'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V106'));
assert(rendered.includes('Circuito de revisión, con guía humana por rol y etapa'));
assert.equal(JSON.stringify(state),beforeState);
for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(state.summary[k],0);

console.log('SANA Data Room review workspace v107 guided entry validation: OK');
