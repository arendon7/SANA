import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-labor-ledger.js','utf8');
const cycleSource=fs.readFileSync('apps/control-web/public/sana-v3-cycle-labor-provenance.js','utf8');

globalThis.window={};
globalThis.storage={records:[]};
globalThis.DEMO={plans:[{id:'PL-CF-04',lot:'CAF-A1',version:4},{id:'PL-AG-03',lot:'AGU-A2',version:3},{id:'PL-CC-02',lot:'CAC-B1',version:2}]};
globalThis.views={team:()=>'<footer class="footer"></footer>',field:()=>'<footer class="footer"></footer>',economics:()=>'<footer class="footer"></footer>',passport:()=>'<footer class="footer"></footer>',cycle:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=(a,b,c)=>`${a}:${b}:${c}`;
globalThis.localStorage={getItem:()=>null};

vm.runInThisContext(source,{filename:'sana-v3-labor-ledger.js'});
const api=window.__SANA_LABOR_LEDGER__;
assert.ok(api);
assert.equal(api.schema,'SANA_LABOR_LEDGER_V1');

const caf=api.forLot('CAF-A1')[0];
assert.equal(caf.assignments.length,1);
assert.equal(caf.attendance.length,1);
assert.equal(caf.hours,5.5);
assert.equal(caf.results.length,1);
assert.equal(caf.evidence.length,1);
assert.equal(caf.costs.length,0);
assert.equal(caf.semantics.paymentCaptured,0);

const agu=api.forLot('AGU-A2')[0];
assert.equal(agu.assignments.length,1);
assert.equal(agu.attendance.length,0,'worked-time does not imply attendance event');
assert.equal(agu.hours,3);
assert.equal(agu.results[0].resultClass,'TECHNICAL_REVIEW_RECORDED');
assert.notEqual(agu.results[0].resultClass,'TASK_COMPLETED');

const cac=api.forLot('CAC-B1')[0];
assert.equal(cac.hours,2.5);
assert.equal(cac.rates.length,1);
assert.equal(cac.rates[0].rate,30);
assert.equal(cac.costs.length,1);
assert.equal(cac.declaredCost,75);
assert.equal(cac.payments.length,1);
assert.equal(cac.payments[0].paymentState,'NOT_CAPTURED');
assert.equal(cac.semantics.paymentCaptured,0,'declared labor cost must not imply payment');
assert.equal(api.explicitCosts().length,1);

const publicRows=api.publicLotSummary('CAF-A1');
assert.equal(publicRows.length,1);
assert.equal('personLabel' in publicRows[0],false,'Passport/public projection must not expose worker names');
assert.equal('personRef' in publicRows[0],false,'Passport/public projection must not expose worker identifiers');
assert.equal(publicRows[0].role,'Operario');

const summary=api.summary();
assert.equal(summary.performanceScores,0);
assert.equal(summary.automaticPayrollActions,0);
assert.equal(summary.paymentRecords,0);
assert.match(api.integrity,/ASSIGNMENT ≠ ATTENDANCE/);
assert.match(api.integrity,/WORKED_TIME ≠ TASK_COMPLETION/);
assert.match(api.integrity,/TASK_COMPLETION ≠ QUALITY/);
assert.match(api.integrity,/RATE_REFERENCE ≠ LABOR_COST/);
assert.match(api.integrity,/LABOR_COST ≠ PAYMENT/);
assert.match(api.integrity,/PRODUCTIVITY ≠ PERFORMANCE_RATING/);

window.__SANA_CYCLE_CLOSURE__={selectedPlan:()=>DEMO.plans[0]};
vm.runInThisContext(cycleSource,{filename:'sana-v3-cycle-labor-provenance.js'});
const projected=window.__SANA_CYCLE_LABOR__.forPlan('PL-CF-04');
assert.equal(projected.valid,true);
assert.equal(projected.cases.length,1);
assert.equal(projected.cases[0].personRefRedacted,true);
assert.equal('personLabel' in projected.cases[0],false);
assert.equal('personRef' in projected.cases[0],false);
assert.match(projected.integrity,/LABOR_PROVENANCE ≠ CYCLE_GATE/);
assert.match(projected.integrity,/PRIVACY_MINIMIZED/);

for(const text of [source,cycleSource]){
  assert.equal(text.includes('fetch('),false);
  assert.equal(text.includes('productionExecutionAvailable=true'),false);
  assert.equal(text.includes('canonicalMutated=true'),false);
  assert.equal(text.includes('payrollExecuted=true'),false);
  assert.equal(text.includes('performanceScore='),false);
}
console.log('labor ledger contract OK · assignment/attendance/time/result/cost/payment remain separate with privacy-minimized read models');
