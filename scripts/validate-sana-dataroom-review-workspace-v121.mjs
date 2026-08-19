import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// V121 retrigger: structural issue glossary contract remains unchanged.
const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['ISSUE_DESCRIPTION ≠ SEVERITY','STRUCTURAL_CODE ≠ DOCUMENT_FINDING','GLOSSARY_MEANING ≠ REMEDIATION_INSTRUCTION','UNKNOWN_CODE ≠ REVIEW_FAILURE','ISSUE_GLOSSARY ≠ EVIDENCE_ASSESSMENT','REVIEW_V121_COMPAT','reviewStructuralIssueGlossary','data-review-structural-issue-glossary'])assert(entry.includes(marker),`missing V121 marker: ${marker}`);
assert(css.includes('V121 · Structural issue glossary'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v121';"));assert(sw.includes("const CACHE='sana-v3-demo-shell-v120';"));
assert(!/rwStructuralGlossary|rwIssueGlossary|data-review-structural-issue-glossary-state|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)/.test(entry));

const zeroAuthority={riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0};
const source={stage:'CASE',label:'Expediente',state:'AVAILABLE',schemaState:'MATCH',payloadState:'PARTIAL_INVALID',caseCount:3,validCaseCount:1,invalidCaseCount:2,invalidCases:[{index:0,id:'BAD-1',issues:['EVENTS_NOT_ARRAY','CASE_ID_INVALID']},{index:2,id:'',issues:['EVENTS_NOT_ARRAY','UNKNOWN_SHAPE_CODE']}],privatePayload:'DO_NOT_PROJECT'};
const state={chains:[],sources:[source],summary:{...zeroAuthority,unavailableSources:0,sourceReadErrors:0,schemaMismatches:0,missingSourceSchemas:0,ambiguousStageReferences:0,invalidSourceCases:2,sourcesWithInvalidPayload:1}};
const focus={capital:'ALL',lot:'ALL',focus:'ALL',stage:'ALL',event:'',ref:''};
const context={requested:false,resolved:true,issues:[],chainKey:'',capitalKnown:true,lotKnown:true};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({...context}),visibleChains:()=>[],sourcePanelTarget:stage=>`panel-${stage.toLowerCase()}`};
const views={home:()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>',dataroom:()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>'};
const calls={history:0,render:0};const document={addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null};const location={href:'https://demo.test/sana-v3?foo=keep#dataroom',search:'?foo=keep'};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'technical',canView:view=>view==='dataroom'}};window.window=window;
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history:{replaceState:()=>calls.history++},render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.structuralIssueGlossary);
const projected=api.sourceIntegrity(state).sources[0],glossary=api.structuralIssueGlossary(projected);
assert.equal(glossary.entries.length,3);assert.deepEqual(glossary.entries.map(x=>x.code),['EVENTS_NOT_ARRAY','CASE_ID_INVALID','UNKNOWN_SHAPE_CODE']);
assert(glossary.entries.find(x=>x.code==='EVENTS_NOT_ARRAY').meaning.includes('events'));
assert(glossary.entries.find(x=>x.code==='CASE_ID_INVALID').meaning.includes('id'));
assert(glossary.entries.find(x=>x.code==='UNKNOWN_SHAPE_CODE').meaning.includes('no reconocido'));
const before=JSON.stringify(state),rendered=views.dataroom();assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V121'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V120'));assert(rendered.includes('data-review-structural-issue-glossary="CASE"'));assert(rendered.includes('Qué significan estos códigos'));assert(rendered.includes('EVENTS_NOT_ARRAY'));assert(rendered.includes('UNKNOWN_SHAPE_CODE'));assert(!rendered.includes('DO_NOT_PROJECT'));
const start=rendered.indexOf('<details data-review-structural-issue-glossary="CASE"'),openTag=rendered.slice(start,rendered.indexOf('>',start)+1);assert(start>=0);assert(!/\sopen(?:\s|=|>)/.test(openTag));
assert.equal(calls.history,0);assert.equal(calls.render,0);assert.equal(JSON.stringify(state),before);for(const k of Object.keys(zeroAuthority))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v121 structural issue glossary validation: OK');
