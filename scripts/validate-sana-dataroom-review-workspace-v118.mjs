import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['TECHNICAL_COUNT ≠ SEVERITY','SOURCE_COUNT ≠ REVIEW_SCORE','NONMATCH_COUNT ≠ RISK','COUNT_AGGREGATION ≠ PRIORITY','OVERVIEW ≠ DUE_DILIGENCE','INVALID_CASE_COUNT ≠ DOCUMENT_FAILURE','REVIEW_V118_COMPAT','reviewSourceIntegrityOverview','data-review-source-overview'])assert(entry.includes(marker),`missing V118 marker: ${marker}`);
assert(css.includes('V118 · Source integrity overview'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v118';"));assert(sw.includes("const CACHE='sana-v3-demo-shell-v117';"));
assert(!/rwSourceOverview|rwTechnicalCount|data-review-source-overview-state|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)/.test(entry));

const zeroAuthority={riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0};
const sources=[
  {stage:'CASE',label:'Expediente',state:'UNAVAILABLE',schemaState:'UNKNOWN',payloadState:'UNKNOWN',caseCount:0,validCaseCount:0,invalidCaseCount:0},
  {stage:'HANDOFF',label:'Handoff',state:'AVAILABLE',schemaState:'MISMATCH',payloadState:'UNKNOWN',caseCount:0,validCaseCount:0,invalidCaseCount:0},
  {stage:'FEEDBACK',label:'Feedback',state:'AVAILABLE',schemaState:'MATCH',payloadState:'INVALID',caseCount:2,validCaseCount:0,invalidCaseCount:2},
  {stage:'RESPONSE',label:'Respuesta',state:'AVAILABLE',schemaState:'MATCH',payloadState:'PARTIAL_INVALID',caseCount:3,validCaseCount:2,invalidCaseCount:1},
  {stage:'DISPOSITION',label:'Disposición',state:'READ_ERROR',schemaState:'MATCH',payloadState:'UNKNOWN',caseCount:0,validCaseCount:0,invalidCaseCount:0},
  {stage:'ROUND',label:'Ronda',state:'AVAILABLE',schemaState:'MATCH',payloadState:'VALID',caseCount:1,validCaseCount:1,invalidCaseCount:0}
];
const state={chains:[],sources,summary:{...zeroAuthority,unavailableSources:1,sourceReadErrors:1,schemaMismatches:1,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:3,sourcesWithInvalidPayload:2}};
const focus={capital:'ALL',lot:'ALL',focus:'ALL',stage:'ALL',event:'',ref:''};
const context={requested:false,resolved:true,issues:[],chainKey:'',capitalKnown:true,lotKnown:true};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({...context}),visibleChains:()=>[],sourcePanelTarget:stage=>`panel-${stage.toLowerCase()}`};
const views={home:()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>',dataroom:()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>'};
const calls={history:0,render:0};
const document={addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null};
const location={href:'https://demo.test/sana-v3?foo=keep#dataroom',search:'?foo=keep'};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'technical',canView:view=>view==='dataroom'}};window.window=window;
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history:{replaceState:()=>calls.history++},render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.sourceOverview);
const tech=api.sourceIntegrity(state),overview=api.sourceOverview(tech);
assert.equal(overview.total,6);assert.deepEqual({...overview.api},{available:4,unavailable:1,readError:1});assert.deepEqual({...overview.schema},{match:4,missing:0,mismatch:1,unknown:1});assert.deepEqual({...overview.payload},{valid:1,partialInvalid:1,invalid:1,unknown:3});assert.deepEqual({...overview.cases},{total:6,valid:3,invalid:3});
const before=JSON.stringify(state),rendered=views.dataroom();assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V118'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V117'));assert(rendered.includes('data-review-source-overview'));assert(rendered.includes('6 available')===false);assert(rendered.includes('4 available'));assert(rendered.includes('1 unavailable · 1 read error'));assert(rendered.includes('4 match'));assert(rendered.includes('1 mismatch'));assert(rendered.includes('1 valid'));assert(rendered.includes('1 partial invalid · 1 invalid · 3 unknown'));assert(rendered.includes('3/6 estructuralmente válidos'));assert(rendered.includes('3 inválidos estructurales'));
const overviewHtml=rendered.slice(rendered.indexOf('data-review-source-overview'),rendered.indexOf('review-technical-glossary'));
assert(!/%|data-score=|aria-valuenow=|role="progressbar"|class="[^"]*(?:severity|risk|priority)/i.test(overviewHtml));assert(!/\b(?:HIGH|MEDIUM|LOW|CRITICAL)\b/.test(overviewHtml));
assert.equal(calls.history,0);assert.equal(calls.render,0);assert.equal(JSON.stringify(state),before);for(const k of Object.keys(zeroAuthority))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v118 source integrity overview validation: OK');
