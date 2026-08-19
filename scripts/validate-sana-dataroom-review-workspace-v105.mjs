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
assert.doesNotMatch(workspace,/ROLE_LENS/);
for(const marker of [
  'ROLE_LENS ≠ ACCESS_CONTROL',
  'ROLE_EMPHASIS ≠ FILTER ≠ REVIEW_PRIORITY',
  'ROLE_GUIDANCE ≠ REVIEW_OUTCOME',
  'ROLE_LENS ≠ SOURCE_MUTATION',
  'SAME_EVIDENCE_SET_ACROSS_ROLES'
]) assert(entry.includes(marker),`missing V105 boundary: ${marker}`);
for(const marker of ['REVIEW_ROLE_LENSES','reviewRoleLens','reviewRoleLensHtml','data-review-role-lens','EMPHASIS ONLY','REVIEW_V104_COMPAT'])assert(entry.includes(marker),`missing V105 marker: ${marker}`);
assert(sw.includes("const CACHE='sana-v3-demo-shell-v105';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v104';"));
assert(!/localStorage\.(?:setItem|removeItem|clear)\s*\(/.test(entry));
assert(!/sessionStorage\s*(?:\.|\[)/.test(entry));
assert(!/fetch\s*\(|openModal\s*\(/.test(entry));
assert(!/\b(?:riskScores|dueDiligenceApprovals|investmentDecisions|externalActions)\s*:/.test(entry));
assert(!/rwRole|reviewRole=/.test(entry),'role lens must not create URL state');

const meta=stage=>({stage,present:true,ambiguous:false,entry:{id:`${stage}-T`},sourceState:'AVAILABLE',sourceSchemaState:'MATCH',sourcePayloadState:'VALID'});
const chain={key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:6,missingStages:[],missingInternalReferences:[],stages:['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND'].map(meta)};
const state={chains:[chain],summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}};
const focus={capital:'CAP-T',lot:'T',focus:'MISSING_INTERNAL_REFERENCE',stage:'CASE',event:'CASE-E1',ref:'REF-T'};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({requested:true,resolved:true,issues:[]}),visibleChains:(chains)=>chains};
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div><div class="grid metrics review-workspace-metrics">METRICAS</div></div></section><footer class="footer"></footer>';
const views={home:()=>'<header class="page-head"></header><footer class="footer"></footer>',dataroom:baseDataRoom};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin'}};window.window=window;
const ctx={window,views,metric:()=>'',esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location:{href:'https://demo.test/sana-v3?rwCapital=CAP-T&rwLot=T&rwFocus=MISSING_INTERNAL_REFERENCE&rwStage=CASE&rwEvent=CASE-E1&rwRef=REF-T#dataroom'},history:{replaceState:()=>{}},render:()=>{},console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.roleLens);

const roles=['admin','technical','investor','producer','visitor','new_user'];
const lenses=roles.map(role=>api.roleLens(role));
assert.deepEqual(lenses.map(x=>x.role),roles);
for(const lens of lenses){
  assert.equal(lens.evidenceScope,'UNCHANGED');
  assert.equal(lens.permissionEffect,'NONE');
  assert.equal(lens.filterEffect,'NONE');
  assert.equal(lens.cues.length,3);
}
assert.notEqual(api.roleLens('admin').headline,api.roleLens('technical').headline);
assert.notEqual(api.roleLens('technical').headline,api.roleLens('investor').headline);
assert.equal(api.roleLens('unknown-role').role,'new_user');

const before=JSON.stringify(state);
const snapshots=[];
for(const role of roles){
  window.__SANA_ACCESS__.role=role;
  const summary=api.summary();
  snapshots.push({role:summary.roleLens.role,capital:summary.capital,lot:summary.lot,focus:summary.focus,stage:summary.stage,event:summary.event,ref:summary.ref,visibleChains:summary.visibleChains,permalink:summary.permalink.href,stages:summary.stageNavigation.items.map(x=>`${x.stage}:${x.state}:${x.navigable}`)});
  assert.equal(summary.roleLens.role,role);
  assert.equal(summary.roleLens.evidenceScope,'UNCHANGED');
  assert.equal(summary.roleLens.permissionEffect,'NONE');
  assert.equal(summary.roleLens.filterEffect,'NONE');
  assert.equal(JSON.stringify(state),before);
}
const baseline={...snapshots[0],role:undefined};
for(const snap of snapshots.slice(1))assert.deepEqual({...snap,role:undefined},baseline,'role lens must not alter context, navigation, evidence visibility or permalink');

window.__SANA_ACCESS__.role='investor';
const rendered=views.dataroom();
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V105'));
assert(rendered.includes('Circuito de revisión, con lente por rol y contexto reproducible'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V104'));
assert(rendered.includes('Circuito de revisión, con contexto reproducible y navegación de etapas'));
assert(rendered.includes('data-review-role-lens'));
assert(rendered.includes('data-review-role="investor"'));
assert(rendered.includes('LENTE DE LECTURA · Contraparte'));
assert(rendered.includes('EMPHASIS ONLY'));
assert(rendered.includes('SAME_EVIDENCE_SET_ACROSS_ROLES'));
assert.equal(JSON.stringify(state),before);
for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(state.summary[k],0);

console.log('SANA Data Room review workspace v105 role lens validation: OK');
