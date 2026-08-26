import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-nutrition-lifecycle.js','utf8');
for(const token of ['V131','COMPLETED_REVIEWED','CLOSED_NOT_EXECUTED','NON_TERMINAL_DECISION','MISSING_CLOSURE_REFERENCE','MISSING_CLOSURE_TARGET','CROSS_CASE_CLOSURE_REFERENCE','CLOSURE_KIND_MISMATCH','FORWARD_CLOSURE_REFERENCE','RESPONSE ≠ CASE_CLOSURE','CASE_CLOSED_HUMAN ≠ NUTRITION_OBJECTIVE_ACHIEVED','CASE_CLOSE ≠ APPLICATION_SUCCESS','CASE_CLOSE ≠ INVENTORY_RECONCILED','DEFERRED_HUMAN ≠ TERMINAL_CLOSURE']) assert.ok(src.includes(token),token);

const E=[
{id:'R1',caseId:'C1',eventKind:'RESPONSE',lot:'L1',observedAt:'2026-08-05'},
{id:'CL1',caseId:'C1',eventKind:'CASE_CLOSE',lot:'L1',observedAt:'2026-08-06'},
{id:'D2',caseId:'C2',eventKind:'DECISION',decision:'REJECTED_HUMAN',lot:'L2',observedAt:'2026-08-03'},
{id:'CL2',caseId:'C2',eventKind:'CASE_CLOSE',lot:'L2',observedAt:'2026-08-04'},
{id:'D3',caseId:'C3',eventKind:'DECISION',decision:'DEFERRED_HUMAN',lot:'L3',observedAt:'2026-08-03'},
{id:'CL3',caseId:'C3',eventKind:'CASE_CLOSE',lot:'L3',observedAt:'2026-08-04'}];
const meta={CL1:{lifecycleVersion:'V131',closureClass:'COMPLETED_REVIEWED',basisEventId:'R1'},CL2:{lifecycleVersion:'V131',closureClass:'CLOSED_NOT_EXECUTED',basisEventId:'D2'},CL3:{lifecycleVersion:'V131',closureClass:'CLOSED_NOT_EXECUTED',basisEventId:'D3'}};
globalThis.storage={records:Object.entries(meta).map(([id,v])=>({id,type:'nutrition-ledger-event',values:{nutritionSchema:'SANA_NUTRITION_LEDGER_V1',...v}}))};
globalThis.identity={displayName:'QA'};globalThis.views={nutrition:()=>'<footer class="footer"></footer>'};globalThis.document={readyState:'loading',addEventListener:()=>{}};globalThis.esc=v=>String(v??'');globalThis.metric=()=>'';globalThis.openModal=()=>{};
const ids=['C1','C2','C3'];
const row=id=>({id,lot:`L${id.slice(1)}`,objective:'QA',events:E.filter(e=>e.caseId===id),stageCoverage:{percent:100},chainCoverage:{percent:100},referenceCoverage:{percent:100},responses:E.filter(e=>e.caseId===id&&e.eventKind==='RESPONSE'),decisions:E.filter(e=>e.caseId===id&&e.eventKind==='DECISION'),semantics:{},integrity:'BASE'});
globalThis.window={addEventListener:()=>{},__SANA_NUTRITION_LEDGER__:Object.freeze({schema:'SANA_NUTRITION_LEDGER_V1',projection:'SANA_NUTRITION_CHAIN_V2',integrity:'BASE',events:()=>E,cases:()=>ids.map(row),forCase:row,forLot:lot=>ids.map(row).filter(c=>c.lot===lot)})};
vm.runInThisContext(src);
const api=window.__SANA_NUTRITION_LEDGER__;
assert.equal(api.forCase('C1').lifecycle.state,'CLOSED_HUMAN');
assert.equal(api.forCase('C2').lifecycle.state,'CLOSED_HUMAN');
assert.equal(api.forCase('C3').lifecycle.state,'OPEN');
assert.equal(api.forCase('C3').closureRows[0].reference.status,'NON_TERMINAL_DECISION');
assert.equal(api.forCase('C3').closureCandidates.length,0);
assert.equal(api.forCase('C1').chainCoverage.percent,100);
assert.equal(api.forCase('C1').referenceCoverage.percent,100);
console.log('SANA nutrition lifecycle V131 contract: OK');
