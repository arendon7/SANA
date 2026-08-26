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
assert.doesNotMatch(workspace,/REVIEW_QUESTION|reviewRoleStageGuide|data-review-human-guide/);
for(const marker of [
  'REVIEW_QUESTION ≠ REQUIREMENT ≠ DECISION',
  'QUESTION_SET ≠ SCORECARD',
  'STAGE_GUIDANCE ≠ AUTOMATIC_FINDING',
  'QUESTION_ORDER ≠ PRIORITY',
  'GUIDE_VIEW ≠ SOURCE_MUTATION'
]) assert(entry.includes(marker),`missing V106 boundary: ${marker}`);
for(const marker of ['REVIEW_STAGE_GUIDES','reviewRoleStageGuide','reviewHumanGuideHtml','data-review-human-guide','HUMAN ONLY','REVIEW_V105_COMPAT'])assert(entry.includes(marker),`missing V106 marker: ${marker}`);
assert(sw.includes("const CACHE='sana-v3-demo-shell-v106';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v105';"));
assert(!/rwGuide|reviewGuide=/.test(entry),'human guide must not create URL state');
assert(!/localStorage\.(?:setItem|removeItem|clear)\s*\(/.test(entry));
assert(!/sessionStorage\s*(?:\.|\[)/.test(entry));
assert(!/fetch\s*\(|openModal\s*\(/.test(entry));
assert(!/data-review-guide-(?:answer|complete|score|priority)|type=["']checkbox["']/i.test(entry),'guide must not create answer/completion/score controls');
assert(!/\b(?:riskScores|dueDiligenceApprovals|investmentDecisions|externalActions)\s*:/.test(entry));

const stages=['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND'];
const meta=stage=>({stage,present:true,ambiguous:false,entry:{id:`${stage}-T`},sourceState:'AVAILABLE',sourceSchemaState:'MATCH',sourcePayloadState:'VALID'});
const chain={key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:6,missingStages:[],missingInternalReferences:[],stages:stages.map(meta)};
const state={chains:[chain],summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}};
const focus={capital:'CAP-T',lot:'T',focus:'MISSING_INTERNAL_REFERENCE',stage:'CASE',event:'CASE-E1',ref:'REF-T'};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({requested:true,resolved:true,issues:[]}),visibleChains:(chains)=>chains};
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div><div class="grid metrics review-workspace-metrics">METRICAS</div></div></section><footer class="footer"></footer>';
const views={home:()=>'<header class="page-head"></header><footer class="footer"></footer>',dataroom:baseDataRoom};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin'}};window.window=window;
const ctx={window,views,metric:()=>'',esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location:{href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwFocus=MISSING_INTERNAL_REFERENCE&rwStage=CASE&rwEvent=CASE-E1&rwRef=REF-T#dataroom'},history:{replaceState:()=>{}},render:()=>{},console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.stageGuide);

const roles=['admin','technical','investor','producer','visitor','new_user'];
const guideStages=['ALL',...stages];
const before=JSON.stringify(state);
for(const role of roles){
  for(const stage of guideStages){
    const guide=api.stageGuide(role,stage);
    assert.equal(guide.role,role);
    assert.equal(guide.stage,stage);
    assert.equal(guide.questions.length,3);
    assert(guide.questions.every(q=>typeof q==='string'&&q.length>20));
    assert.equal(guide.answerMode,'HUMAN_ONLY');
    assert.equal(guide.required,false);
    assert.equal(guide.scoreEffect,'NONE');
    assert.equal(guide.priorityEffect,'NONE');
    assert.equal(guide.findingEffect,'NONE');
    assert.equal(guide.permissionEffect,'NONE');
    assert.equal(JSON.stringify(state),before);
  }
}
assert.equal(api.stageGuide('unknown-role','UNKNOWN').role,'new_user');
assert.equal(api.stageGuide('unknown-role','UNKNOWN').stage,'ALL');
assert.notDeepEqual(api.stageGuide('admin','CASE').questions,api.stageGuide('technical','CASE').questions);
assert.notDeepEqual(api.stageGuide('admin','CASE').questions,api.stageGuide('admin','ROUND').questions);

const contextSnapshots=[];
for(const role of roles){
  window.__SANA_ACCESS__.role=role;
  const summary=api.summary();
  contextSnapshots.push({capital:summary.capital,lot:summary.lot,focus:summary.focus,stage:summary.stage,event:summary.event,ref:summary.ref,visibleChains:summary.visibleChains,permalink:summary.permalink.href,stages:summary.stageNavigation.items.map(x=>`${x.stage}:${x.state}:${x.navigable}`)});
  assert.equal(summary.humanGuide.role,role);
  assert.equal(summary.humanGuide.stage,'CASE');
  assert.equal(summary.humanGuide.answerMode,'HUMAN_ONLY');
  assert.equal(summary.humanGuide.required,false);
  assert.equal(JSON.stringify(state),before);
}
for(const snap of contextSnapshots.slice(1))assert.deepEqual(snap,contextSnapshots[0],'guide/role must not alter context, evidence visibility, stage navigation or permalink');

window.__SANA_ACCESS__.role='technical';
const rendered=views.dataroom();
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V106'));
assert(rendered.includes('Circuito de revisión, con guía humana por rol y etapa'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V105'));
assert(rendered.includes('Circuito de revisión, con lente por rol y contexto reproducible'));
assert(rendered.includes('data-review-human-guide'));
assert(rendered.includes('data-review-guide-role="technical"'));
assert(rendered.includes('data-review-guide-stage="CASE"'));
assert(rendered.includes('GUÍA DE REVISIÓN HUMANA · Expediente'));
assert(rendered.includes('HUMAN ONLY'));
assert(rendered.includes('No son requisitos, checklist de cierre ni hallazgos automáticos.'));
assert(!/<input\b|type=["']checkbox["']/i.test(rendered));
assert.equal(JSON.stringify(state),before);
for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(state.summary[k],0);

console.log('SANA Data Room review workspace v106 human review guide validation: OK');
