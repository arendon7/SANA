import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const entryPath='apps/control-web/public/sana-v3-dataroom-entry.js';
const cssPath='apps/control-web/public/sana-v3-review-workspace.css';
const swPath='apps/control-web/public/sana-v3-sw.js';
const entry=fs.readFileSync(entryPath,'utf8');
const css=fs.readFileSync(cssPath,'utf8');
const sw=fs.readFileSync(swPath,'utf8');
for(const marker of ['RECOVERY_PREVIEW ≠ RECOVERY_EXECUTION','PREVIEW_PATH ≠ SOURCE_STATE','SELECTOR_IMPACT ≠ DATA_IMPACT','DETAILS_OPEN ≠ REVIEW_DECISION','PRESERVED_SELECTOR ≠ VERIFIED_CONTEXT','REVIEW_V111_COMPAT','reviewRecoveryPreview','data-review-context-recovery-preview','data-review-recovery-preview-body'])assert(entry.includes(marker),`missing V111 marker: ${marker}`);
assert(css.includes('V111 · Recovery preview'));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v111';"));
assert(sw.includes("const CACHE='sana-v3-demo-shell-v110';"));
assert(!/rwPreview|rwRecoveryPreview|localStorage\.(?:setItem|removeItem|clear)\s*\(|sessionStorage\s*(?:\.|\[)|fetch\s*\(|openModal\s*\(/.test(entry));

const issues=[
  {key:'rwCapital',value:'OLD-CAP',detail:'capital stale'},
  {key:'rwLot',value:'OLD-LOT',detail:'lot stale'},
  {key:'rwContext',value:'OLD-CAP|OLD-LOT',detail:'combo stale'},
  {key:'rwStage',value:'HANDOFF',detail:'stage stale'},
  {key:'rwEvent',value:'EV-X',detail:'event stale'},
  {key:'rwRef',value:'REF-X',detail:'ref stale'}
];
const state={chains:[],summary:{riskScores:0,dueDiligenceApprovals:0,investmentDecisions:0,externalActions:0}};
const focus={capital:'OLD-CAP',lot:'OLD-LOT',focus:'MISSING_STAGE_REFERENCE',stage:'HANDOFF',event:'EV-X',ref:'REF-X'};
const workspaceApi={state:()=>state,readFocus:()=>({...focus}),contextIntegrity:()=>({requested:true,resolved:false,issues,chainKey:'',capitalKnown:false,lotKnown:false}),visibleChains:()=>[]};
const baseHome=()=>'<header class="page-head"></header><main>HOME</main><footer class="footer"></footer>';
const baseDataRoom=()=>'<header class="page-head"></header><section id="review-workspace" class="card review-workspace"><div class="card-head"><div><p class="kicker">DATA ROOM · REVIEW WORKSPACE V101</p><h2>Circuito de revisión, con navegación bidireccional al caso fuente</h2></div></div><div class="card-body"><div class="review-workspace-controls">FILTROS</div></div></section><footer class="footer"></footer>';
const views={home:baseHome,dataroom:baseDataRoom};
const access={role:'admin',canView:view=>view==='dataroom'};
const calls={history:0,render:0,focus:0};
const location={href:'https://demo.test/sana-v3?foo=keep&mode=demo&rwCapital=OLD-CAP&rwLot=OLD-LOT&rwFocus=MISSING_STAGE_REFERENCE&rwStage=HANDOFF&rwEvent=EV-X&rwRef=REF-X#dataroom',search:'?foo=keep&mode=demo&rwCapital=OLD-CAP&rwLot=OLD-LOT&rwFocus=MISSING_STAGE_REFERENCE&rwStage=HANDOFF&rwEvent=EV-X&rwRef=REF-X'};
const window={__SANA_DATAROOM_REVIEW_WORKSPACE__:workspaceApi,__SANA_ACCESS__:access};window.window=window;
const document={addEventListener:()=>{},getElementById:()=>({focus:()=>calls.focus++,scrollIntoView:()=>{}}),querySelector:()=>null};
const ctx={window,views,metric:(a,b,c)=>`<i>${a}:${b}:${c}</i>`,esc:v=>String(v),localStorage:{getItem:()=>null},URL,navigator:{clipboard:{writeText:async()=>{}}},location,history:{replaceState:()=>calls.history++},render:()=>calls.render++,document,queueMicrotask:fn=>fn(),console};
vm.createContext(ctx);vm.runInContext(entry,ctx,{filename:entryPath});
const api=window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__;assert(api?.recoveryPreview&&api?.recoveryPlan&&api?.recoverContext);
const beforeState=JSON.stringify(state),beforeHref=location.href,beforeSearch=location.search;

let p=api.recoveryPreview('rwStage');
assert.equal(p.valid,true);assert.deepEqual([...p.clears],['rwStage','rwEvent']);assert.deepEqual([...p.preserves],['rwCapital','rwLot','rwFocus','rwRef']);assert.deepEqual([...p.unrelatedPreserved],['foo','mode']);assert.equal(p.sourceEffect,'NONE');
let u=new URL(`https://demo.test${p.afterPath}`);assert.equal(u.searchParams.has('rwStage'),false);assert.equal(u.searchParams.has('rwEvent'),false);assert.equal(u.searchParams.get('rwFocus'),'MISSING_STAGE_REFERENCE');assert.equal(u.searchParams.get('foo'),'keep');assert.equal(u.searchParams.get('mode'),'demo');

p=api.recoveryPreview('rwContext');assert.equal(p.valid,true);assert.deepEqual([...p.clears],['rwCapital','rwLot','rwStage','rwEvent','rwRef']);assert.deepEqual([...p.preserves],['rwFocus']);u=new URL(`https://demo.test${p.afterPath}`);assert.equal(u.searchParams.get('rwFocus'),'MISSING_STAGE_REFERENCE');for(const key of ['rwCapital','rwLot','rwStage','rwEvent','rwRef'])assert.equal(u.searchParams.has(key),false);

p=api.recoveryPreview('ALL');assert.equal(p.valid,true);assert.deepEqual([...p.clears],['rwCapital','rwLot','rwFocus','rwStage','rwEvent','rwRef']);assert.deepEqual([...p.preserves],[]);assert.deepEqual([...p.unrelatedPreserved],['foo','mode']);u=new URL(`https://demo.test${p.afterPath}`);assert.equal(u.searchParams.get('foo'),'keep');assert.equal(u.searchParams.get('mode'),'demo');for(const key of ['rwCapital','rwLot','rwFocus','rwStage','rwEvent','rwRef'])assert.equal(u.searchParams.has(key),false);
assert.equal(api.recoveryPreview('UNKNOWN').valid,false);

const plan=api.recoveryPlan(issues);assert.equal(plan.length,6);assert(plan.every(action=>action.preview?.valid));assert.deepEqual([...plan.find(x=>x.issueKey==='rwStage').preview.clears],['rwStage','rwEvent']);
const rendered=views.dataroom();assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V111'));assert(rendered.includes('DATA ROOM · REVIEW WORKSPACE V110'));assert(rendered.includes('<details data-review-context-recovery-preview="rwStage"'));assert(rendered.includes('<details data-review-context-recovery-preview="ALL"'));assert(rendered.includes('Ruta resultante:'));assert(rendered.includes('Queries ajenas preservadas:'));assert(rendered.includes('data-review-context-recover="rwStage"'));assert(rendered.includes('data-review-context-recover="ALL"'));
assert.equal(calls.history,0);assert.equal(calls.render,0);assert.equal(calls.focus,0);assert.equal(location.href,beforeHref);assert.equal(location.search,beforeSearch);assert.equal(JSON.stringify(state),beforeState);for(const k of Object.keys(state.summary))assert.equal(state.summary[k],0);
console.log('SANA Data Room review workspace v111 recovery preview validation: OK');
