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
assert.doesNotMatch(workspace,/CONTEXT_LINK/);
for(const marker of [
  'CONTEXT_LINK ≠ SOURCE_SNAPSHOT',
  'COPIED_LINK ≠ VERIFIED_CONTEXT',
  'CLIPBOARD_COPY ≠ EXTERNAL_DELIVERY',
  'SHAREABLE_URL ≠ REVIEW_APPROVAL',
  'LINK_REOPEN ≠ CONTEXT_VERIFICATION',
  'URL_CONTEXT ≠ PERSISTED_SOURCE_STATE'
]) assert(entry.includes(marker),`missing V104 boundary: ${marker}`);
assert.match(entry,/REVIEW_CONTEXT_KEYS/);
assert.match(entry,/reviewContextPermalink/);
assert.match(entry,/copyReviewContextPermalink/);
assert.match(entry,/data-review-context-link/);
assert.match(entry,/data-review-context-copy/);
assert.match(entry,/REVIEW_V102_COMPAT/);
assert.match(entry,/REVIEW_V103_COMPAT/);
assert(sw.includes("const CACHE='sana-v3-demo-shell-v104';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v103';"));
assert(!/localStorage\.(?:setItem|removeItem|clear)\s*\(/.test(entry));
assert(!/sessionStorage\s*(?:\.|\[)/.test(entry));
assert(!/fetch\s*\(|openModal\s*\(/.test(entry));
assert(!/\b(?:riskScores|dueDiligenceApprovals|investmentDecisions|externalActions)\s*:/.test(entry));

const meta=stage=>({stage,present:true,ambiguous:false,entry:{id:`${stage}-T`},sourceState:'AVAILABLE',sourceSchemaState:'MATCH',sourcePayloadState:'VALID'});
const chain={key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:6,missingStages:[],missingInternalReferences:[],stages:['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND'].map(meta)};
const state={chains:[chain],summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}};
const focus={capital:'CAP-T',lot:'T',focus:'ALL',stage:'CASE',event:'CASE-E1',ref:'REF-T'};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({requested:true,resolved:true,issues:[]}),visibleChains:(chains)=>chains};
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div><div class="grid metrics review-workspace-metrics">METRICAS</div></div></section><footer class="footer"></footer>';
const views={home:()=>'<header class="page-head"></header><footer class="footer"></footer>',dataroom:baseDataRoom};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin'}};window.window=window;
let copied='';
const navigator={clipboard:{writeText:async value=>{copied=value}}};
const ctx={
  window,views,metric:()=>'',esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator,
  location:{href:'https://demo.test/sana-v3?foo=bar&rwCapital=CAP-T&rwLot=T&rwFocus=ALL&rwStage=CASE&rwEvent=CASE-E1&rwRef=REF-T&junk=1#other'},
  history:{replaceState:()=>{}},render:()=>{},console
};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api);
const before=JSON.stringify(state);
const link=api.permalink();assert(link);
const parsed=new URL(link.href);
assert.equal(parsed.origin,'https://demo.test');
assert.equal(parsed.pathname,'/sana-v3');
assert.equal(parsed.hash,'#dataroom');
assert.equal(parsed.searchParams.get('rwCapital'),'CAP-T');
assert.equal(parsed.searchParams.get('rwLot'),'T');
assert.equal(parsed.searchParams.get('rwStage'),'CASE');
assert.equal(parsed.searchParams.get('rwEvent'),'CASE-E1');
assert.equal(parsed.searchParams.get('rwRef'),'REF-T');
assert.equal(parsed.searchParams.has('rwFocus'),false,'default ALL focus must be omitted from canonical link');
assert.equal(parsed.searchParams.has('foo'),false);
assert.equal(parsed.searchParams.has('junk'),false);
assert.deepEqual([...link.keys],['rwCapital','rwLot','rwFocus','rwStage','rwEvent','rwRef']);
assert.equal(JSON.stringify(state),before);

const summary=api.summary();
assert.equal(summary.permalink.href,link.href);
const rendered=views.dataroom();
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V104'));
assert(rendered.includes('Circuito de revisión, con contexto reproducible y navegación de etapas'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V103'));
assert(rendered.includes('Circuito de revisión, con contexto operativo y navegación de etapas'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V102'));
assert(rendered.includes('Circuito de revisión, con contexto operativo visible'));
assert(rendered.includes('data-review-context-link'));
assert(rendered.includes('data-review-context-copy'));
assert(rendered.includes('ENLACE DE CONTEXTO · CANÓNICO'));
assert(rendered.includes('Solo reproduce selectores URL; no congela ni verifica fuentes.'));

const result=await api.copyPermalink();
assert.equal(result.copied,true);
assert.equal(result.reason,'COPIED_LOCAL_CLIPBOARD');
assert.equal(result.href,link.href);
assert.equal(copied,link.href);
assert.equal(JSON.stringify(state),before,'clipboard copy must not mutate workspace state');
for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(state.summary[k],0);

console.log('SANA Data Room review workspace v104 context permalink validation: OK');
