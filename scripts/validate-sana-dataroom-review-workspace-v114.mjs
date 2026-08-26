import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['SOURCE_STAGE_NAVIGATION ≠ SOURCE_VERIFICATION','PANEL_TARGET ≠ API_AVAILABLE','TECHNICAL_DRILLDOWN ≠ REVIEW_PRIORITY','REVIEW_V114_COMPAT','reviewSourcePanelNavigation','focusReviewSourcePanel','data-review-source-panel-nav'])assert(entry.includes(marker),`missing V114 marker: ${marker}`);
assert(css.includes('V114 · Source integrity drilldown'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v114';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v113';"));
assert(!/rwSourcePanel|rwTechnicalDrilldown|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)|fetch\s*\(|openModal\s*\(/.test(entry));

const targets={CASE:'dataroom-review-case-panel',HANDOFF:'dataroom-review-handoff-panel',FEEDBACK:'dataroom-review-feedback-panel',RESPONSE:'dataroom-review-response-panel',DISPOSITION:'dataroom-review-disposition-panel',ROUND:'dataroom-review-round-panel'};
const source=(stage,state='AVAILABLE',schemaState='MATCH',payloadState='VALID',extra={})=>({stage,label:stage,state,schemaState,payloadState,caseCount:1,validCaseCount:1,invalidCaseCount:0,...extra});
const zeroAuthority={riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0};
const state={chains:[],sources:[source('CASE','UNAVAILABLE','UNKNOWN','UNKNOWN',{caseCount:0,validCaseCount:0}),source('HANDOFF'),source('FEEDBACK'),source('RESPONSE'),source('DISPOSITION'),source('ROUND')],summary:{...zeroAuthority,unavailableSources:1,sourceReadErrors:0,schemaMismatches:0,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:0,sourcesWithInvalidPayload:0}};
const focus={capital:'ALL',lot:'ALL',focus:'ALL',stage:'ALL',event:'',ref:''};
const context={requested:false,resolved:true,issues:[],chainKey:'',capitalKnown:true,lotKnown:true};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({...context}),visibleChains:()=>[],sourcePanelTarget:stage=>targets[stage]||''};
const views={home:()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>',dataroom:()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>'};
const calls={history:0,render:0,focus:0,scroll:0};
const panelNodes=Object.fromEntries(Object.values(targets).map(id=>[id,{scrollIntoView:()=>calls.scroll++,focus:()=>calls.focus++}]));
const sourceIntegrityNode={scrollIntoView:()=>{},focus:()=>{}};
const document={addEventListener:()=>{},getElementById:id=>panelNodes[id]||null,querySelector:selector=>selector==='[data-review-source-integrity]'?sourceIntegrityNode:null};
const location={href:'https://demo.test/sana-v3?foo=keep#dataroom',search:'?foo=keep'};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin',canView:view=>view==='dataroom'}};window.window=window;
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history:{replaceState:()=>calls.history++},render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.sourcePanelNavigation&&api?.focusSourcePanel&&api?.sourceIntegrity);
const before=JSON.stringify(state);

let nav=api.sourcePanelNavigation('CASE');assert.equal(nav.navigable,true);assert.equal(nav.target,'dataroom-review-case-panel');assert.equal(nav.stage,'CASE');
nav=api.sourcePanelNavigation('UNKNOWN');assert.equal(nav.navigable,false);assert.equal(nav.target,'');
const rendered=views.dataroom();assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V114'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V113'));assert(rendered.includes('data-review-source-panel-nav="CASE"'));assert(rendered.includes('aria-controls="dataroom-review-case-panel"'));assert(rendered.includes('API · UNAVAILABLE'));assert(rendered.includes('Ir al panel fuente'));
assert.equal(api.focusSourcePanel('CASE'),true);assert.equal(calls.scroll,1);assert.equal(calls.focus,1);assert.equal(api.focusSourcePanel('UNKNOWN'),false);assert.equal(calls.history,0);assert.equal(calls.render,0);
assert.equal(JSON.stringify(state),before);for(const k of Object.keys(zeroAuthority))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v114 source integrity drilldown validation: OK');
