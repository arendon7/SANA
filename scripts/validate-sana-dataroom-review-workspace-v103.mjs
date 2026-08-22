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
assert.doesNotMatch(workspace,/STAGE_SWITCH/);
for(const marker of [
  'STAGE_SWITCH ≠ REVIEW_PROGRESS',
  'STAGE_ORDER ≠ REQUIRED_SEQUENCE',
  'NAVIGABLE_STAGE ≠ COMPLETE_STAGE',
  'DISABLED_STAGE ≠ REVIEW_FAILURE',
  'URL_STAGE_CHANGE ≠ SOURCE_MUTATION',
  'STAGE_BUTTON_STATUS ≠ REVIEW_OUTCOME'
]) assert(entry.includes(marker),`missing V103 boundary: ${marker}`);
assert.match(entry,/REVIEW_STAGE_ORDER/);
assert.match(entry,/data-review-stage-switcher/);
assert.match(entry,/data-review-context-stage/);
assert.match(entry,/selectReviewStage/);
assert.match(entry,/REVIEW_V102_COMPAT/);
assert(sw.includes("const CACHE='sana-v3-demo-shell-v103';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v102';"));
assert(!/localStorage\.(?:setItem|removeItem|clear)\s*\(/.test(entry));
assert(!/sessionStorage\s*(?:\.|\[)/.test(entry));
assert(!/fetch\s*\(|openModal\s*\(/.test(entry));
assert(!/\b(?:riskScores|dueDiligenceApprovals|investmentDecisions|externalActions)\s*:/.test(entry));

const meta=(stage,{present=false,ambiguous=false,sourceState='AVAILABLE',sourceSchemaState='MATCH',sourcePayloadState='VALID'}={})=>({stage,present,ambiguous,entry:present?{id:`${stage}-T`}:null,sourceState,sourceSchemaState,sourcePayloadState});
const chain={
  key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:3,missingStages:['FEEDBACK'],missingInternalReferences:[],
  stages:[
    meta('CASE',{present:true}),
    meta('HANDOFF',{present:true}),
    meta('FEEDBACK'),
    meta('RESPONSE',{sourceState:'UNAVAILABLE',sourceSchemaState:'UNKNOWN',sourcePayloadState:'UNKNOWN'}),
    meta('DISPOSITION',{ambiguous:true}),
    meta('ROUND',{present:true})
  ]
};
const state={chains:[chain],summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}};
const focus={capital:'CAP-T',lot:'T',focus:'ALL',stage:'CASE',event:'CASE-E1',ref:'REF-T'};
const workspaceApi={
  state:()=>state,
  readFocus:()=>({...focus}),
  contextIntegrity:()=>({requested:true,resolved:true,issues:[]}),
  visibleChains:(chains)=>chains
};
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div><div class="grid metrics review-workspace-metrics">METRICAS</div></div></section><footer class="footer"></footer>';
const views={home:()=>'<header class="page-head"></header><footer class="footer"></footer>',dataroom:baseDataRoom};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin'}};window.window=window;
let replaced='',renderCount=0;
const ctx={
  window,views,metric:()=>'',esc:v=>String(v),localStorage:{getItem:()=>null},URL,
  location:{href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwFocus=ALL&rwStage=CASE&rwEvent=CASE-E1&rwRef=REF-T#dataroom'},
  history:{replaceState:(_a,_b,value)=>{replaced=value}},
  render:()=>{renderCount++},console
};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api);
const before=JSON.stringify(state);
const summary=api.summary();
assert.equal(summary.stage,'CASE');
assert.equal(summary.stageNavigation.contextReady,true);
assert.deepEqual([...summary.stageNavigation.items.map(x=>x.stage)],['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND']);
const byStage=Object.fromEntries(summary.stageNavigation.items.map(x=>[x.stage,x]));
assert.equal(byStage.CASE.active,true);assert.equal(byStage.CASE.navigable,true);assert.equal(byStage.CASE.state,'REFERENCED');
assert.equal(byStage.HANDOFF.active,false);assert.equal(byStage.HANDOFF.navigable,true);assert.equal(byStage.HANDOFF.state,'REFERENCED');
assert.equal(byStage.FEEDBACK.navigable,false);assert.equal(byStage.FEEDBACK.state,'NOT_REFERENCED');
assert.equal(byStage.RESPONSE.navigable,false);assert.equal(byStage.RESPONSE.state,'SOURCE_UNAVAILABLE');
assert.equal(byStage.DISPOSITION.navigable,false);assert.equal(byStage.DISPOSITION.state,'AMBIGUOUS');
assert.equal(byStage.ROUND.navigable,true);assert.equal(byStage.ROUND.state,'REFERENCED');
assert.equal(JSON.stringify(state),before);

const rendered=views.dataroom();
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V103'));
assert(rendered.includes('Circuito de revisión, con contexto operativo y navegación de etapas'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V102'));
assert(rendered.includes('Circuito de revisión, con contexto operativo visible'));
assert(rendered.includes('data-review-stage-switcher'));
assert(rendered.includes('data-review-context-stage="HANDOFF"'));
assert(rendered.includes('NOT_REFERENCED'));
assert(rendered.includes('SOURCE_UNAVAILABLE'));
assert(rendered.includes('AMBIGUOUS'));
assert.equal((rendered.match(/data-review-context-summary/g)||[]).length,1);

assert.equal(api.selectStage('CASE'),false,'active stage must not clear event/ref');
assert.equal(replaced,'');assert.equal(renderCount,0);
assert.equal(api.selectStage('FEEDBACK'),false,'missing stage must not become navigable');
assert.equal(api.selectStage('RESPONSE'),false,'unavailable source must not become navigable');
assert.equal(api.selectStage('DISPOSITION'),false,'ambiguous stage must not become navigable');
assert.equal(replaced,'');assert.equal(renderCount,0);
assert.equal(api.selectStage('HANDOFF'),true);
assert.equal(renderCount,1);
const moved=new URL(replaced,'https://demo.test');
assert.equal(moved.searchParams.get('rwCapital'),'CAP-T');
assert.equal(moved.searchParams.get('rwLot'),'T');
assert.equal(moved.searchParams.get('rwFocus'),'ALL');
assert.equal(moved.searchParams.get('rwStage'),'HANDOFF');
assert.equal(moved.searchParams.has('rwEvent'),false);
assert.equal(moved.searchParams.has('rwRef'),false);
assert.equal(moved.hash,'#dataroom');
assert.equal(JSON.stringify(state),before,'stage navigation must not mutate workspace state');
for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(state.summary[k],0);

console.log('SANA Data Room review workspace v103 stage switcher validation: OK');
