import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['TECHNICAL_LABEL ≠ SEVERITY','GLOSSARY_ENTRY ≠ REVIEW_FINDING','STATE_DESCRIPTION ≠ REMEDIATION_INSTRUCTION','GLOSSARY_DISCLOSURE ≠ PERSISTED_STATE','STRUCTURAL_VALIDITY ≠ DOCUMENT_VERIFICATION','REVIEW_V117_COMPAT','reviewTechnicalStateGlossary','data-review-technical-glossary'])assert(entry.includes(marker),`missing V117 marker: ${marker}`);
assert(css.includes('V117 · Technical state glossary'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v117';"));assert(sw.includes("const CACHE='sana-v3-demo-shell-v116';"));
assert(!/rwGlossary|rwTechnicalState|data-review-technical-glossary-state|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)/.test(entry));

const zeroAuthority={riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0};
const sources=[
  {stage:'CASE',label:'Expediente',state:'UNAVAILABLE',schemaState:'UNKNOWN',payloadState:'UNKNOWN',caseCount:0,validCaseCount:0,invalidCaseCount:0},
  {stage:'HANDOFF',label:'Handoff',state:'AVAILABLE',schemaState:'MISMATCH',payloadState:'UNKNOWN',caseCount:0,validCaseCount:0,invalidCaseCount:0},
  {stage:'FEEDBACK',label:'Feedback',state:'AVAILABLE',schemaState:'MATCH',payloadState:'INVALID',caseCount:1,validCaseCount:0,invalidCaseCount:1},
  {stage:'RESPONSE',label:'Respuesta',state:'AVAILABLE',schemaState:'MATCH',payloadState:'VALID',caseCount:1,validCaseCount:1,invalidCaseCount:0}
];
const state={chains:[],sources,summary:{...zeroAuthority,unavailableSources:1,sourceReadErrors:0,schemaMismatches:1,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:1,sourcesWithInvalidPayload:1}};
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
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.technicalGlossary);
const glossary=api.technicalGlossary();assert.equal(glossary.groups.length,4);assert(glossary.groups.some(g=>g.items.some(([term])=>term==='UNAVAILABLE')));assert(glossary.groups.some(g=>g.items.some(([term])=>term==='MISMATCH')));assert(glossary.groups.some(g=>g.items.some(([term])=>term==='PARTIAL_INVALID')));assert(glossary.groups.some(g=>g.items.some(([term])=>term==='VÁLIDO')));
const validMeaning=glossary.groups.flatMap(g=>g.items).find(([term])=>term==='VÁLIDO')[1];assert(validMeaning.includes('no implica evidencia verificada'));assert(validMeaning.includes('completa'));assert(validMeaning.includes('suficiente'));assert(validMeaning.includes('aprobada'));
const before=JSON.stringify(state);const rendered=views.dataroom();
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V117'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V116'));assert(rendered.includes('data-review-source-integrity'));assert(rendered.includes('data-review-technical-glossary'));
const sourceStart=rendered.indexOf('data-review-source-integrity'),glossaryStart=rendered.indexOf('<details data-review-technical-glossary',sourceStart),gridStart=rendered.indexOf('review-source-integrity-grid',sourceStart);assert(sourceStart>=0&&glossaryStart>sourceStart&&gridStart>glossaryStart);
const openTag=rendered.slice(glossaryStart,rendered.indexOf('>',glossaryStart)+1);assert(!/\sopen(?:\s|=|>)/.test(openTag));
for(const term of ['AVAILABLE','UNAVAILABLE','READ_ERROR','MATCH','MISSING','MISMATCH','VALID','PARTIAL_INVALID','INVALID','UNKNOWN','VÁLIDO'])assert(rendered.includes(term),`missing glossary term ${term}`);
assert(rendered.includes('Válido significa estructura mínima compatible; no implica evidencia verificada, completa, suficiente ni aprobada.'));
assert.equal(calls.history,0);assert.equal(calls.render,0);assert.equal(JSON.stringify(state),before);for(const k of Object.keys(zeroAuthority))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v117 technical state glossary validation: OK');
