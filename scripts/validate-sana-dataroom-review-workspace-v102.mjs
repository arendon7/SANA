import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const workspacePath='apps/control-web/public/sana-v3-dataroom-review-workspace.js';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8');
const workspace=fs.readFileSync(workspacePath,'utf8');
const sw=fs.readFileSync(swPath,'utf8');

// V102 is additive presentation. The certified V101 workspace engine remains the source projection.
assert.match(workspace,/BIDIRECTIONAL_NAVIGATION_BASELINE='REVIEW WORKSPACE V101'/);
assert.match(workspace,/DATA ROOM · REVIEW WORKSPACE V101/);
assert.doesNotMatch(workspace,/CONTEXT_SUMMARY_BASELINE='REVIEW WORKSPACE V102'/);
assert.match(entry,/__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__/);
assert.match(entry,/reviewContextSummary/);
assert.match(entry,/injectReviewContextSummary/);
assert.match(entry,/data-review-context-summary/);
for(const marker of [
  'CONTEXT_SUMMARY ≠ SOURCE_VERIFICATION',
  'ACTIVE_SELECTOR ≠ REVIEW_PRIORITY',
  'CONTEXT_ISSUE_COUNT ≠ RISK_SCORE',
  'SUMMARY_VIEW ≠ PERSISTED_STATE',
  'REVIEW_CONTEXT_VIEW ≠ SOURCE_LEDGER',
  'READ_ONLY',
  'NO_SOURCE_MUTATION'
]) assert(entry.includes(marker),`missing V102 boundary: ${marker}`);
assert(sw.includes("const CACHE='sana-v3-demo-shell-v102';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v101';"));
assert(!/localStorage\.(?:setItem|removeItem|clear)\s*\(/.test(entry));
assert(!/sessionStorage\s*(?:\.|\[)/.test(entry));
assert(!/fetch\s*\(|openModal\s*\(/.test(entry));
assert(!/\b(?:riskScores|dueDiligenceApprovals|investmentDecisions|externalActions)\s*:/.test(entry));

const chain={key:'CAP-T|T',capitalCaseRef:'CAP-T',lot:'T',stageCount:6,missingStages:[],missingInternalReferences:[]};
const state={
  chains:[chain],
  summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}
};
const focus={capital:'CAP-T',lot:'T',focus:'ALL',stage:'CASE',event:'CASE-T-E1',ref:'REF-T'};
let unresolved=false;
const workspaceApi={
  state:()=>state,
  readFocus:()=>({...focus}),
  contextIntegrity:()=>unresolved
    ? {requested:true,resolved:false,issues:[{key:'rwEvent',value:'STALE-EVENT',detail:'Evento no resuelto'}]}
    : {requested:true,resolved:true,issues:[]},
  visibleChains:(chains)=>chains
};
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls" aria-label="Filtros del workspace">FILTROS</div><div class="grid metrics review-workspace-metrics">METRICAS</div></div></section><footer class="footer"></footer>';
const views={home:()=>'<header class="page-head"></header><footer class="footer"></footer>',dataroom:baseDataRoom};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:{role:'admin'}};
window.window=window;
const ctx={
  window,
  views,
  metric:()=>'',
  esc:v=>String(v),
  localStorage:{getItem:()=>null},
  console
};
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:entryPath});

const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;
assert(api);
const before=JSON.stringify(state);
const summary=api.summary();
assert.equal(summary.capital,'CAP-T');
assert.equal(summary.lot,'T');
assert.equal(summary.focus,'ALL');
assert.equal(summary.stage,'CASE');
assert.equal(summary.stageLabel,'Expediente');
assert.equal(summary.event,'CASE-T-E1');
assert.equal(summary.ref,'REF-T');
assert.equal(summary.resolved,true);
assert.equal(summary.issueCount,0);
assert.equal(summary.visibleChains,1);
assert.equal(JSON.stringify(state),before,'V102 summary must not mutate workspace state');

const rendered=views.dataroom();
assert(rendered.includes('data-review-context-summary'));
assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V102'));
assert(rendered.includes('Circuito de revisión, con contexto operativo visible'));
assert(rendered.includes('Contexto resuelto'));
assert(rendered.includes('RESOLVED'));
const controlsAt=rendered.indexOf('review-workspace-controls');
const summaryAt=rendered.indexOf('data-review-context-summary');
const metricsAt=rendered.indexOf('review-workspace-metrics');
assert(controlsAt>=0&&summaryAt>controlsAt&&metricsAt>summaryAt,'V102 summary must sit after filters and before metrics');
assert.equal((rendered.match(/data-review-context-summary/g)||[]).length,1);
assert.equal(api.inject(rendered),rendered,'V102 injection must be idempotent');
assert.equal(JSON.stringify(state),before,'V102 render must not mutate workspace state');

unresolved=true;
const stale=api.summary();
assert.equal(stale.resolved,false);
assert.equal(stale.issueCount,1);
assert.equal(stale.stageLabel,'Expediente');
const staleRendered=views.dataroom();
assert(staleRendered.includes('Contexto con selectores no resueltos'));
assert(staleRendered.includes('UNRESOLVED'));
assert(staleRendered.includes('1 incidencia(s) de contexto'));
assert.equal(JSON.stringify(state),before,'unresolved URL context must not mutate workspace state');
for(const k of ['riskScores','dueDiligenceApprovals','investmentDecisions','externalActions'])assert.equal(state.summary[k],0);

console.log('SANA Data Room review workspace v102 additive context summary validation: OK');
