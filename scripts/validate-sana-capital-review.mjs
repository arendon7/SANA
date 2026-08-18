import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const path='apps/control-web/public/sana-v3-capital-review-ledger.js';
const code=fs.readFileSync(path,'utf8');
const context={
  window:{},
  storage:{records:[]},
  DEMO:{lots:[{id:'CAF-A1',crop:'Café'},{id:'AGU-A2',crop:'Aguacate'}]},
  views:{capital:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'},
  metric:()=>'',esc:v=>String(v),openModal:()=>{},document:{addEventListener:()=>{}},console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(code,context,{filename:path});
const api=context.window.__SANA_CAPITAL_REVIEW__;
assert(api,'capital human review API missing');
assert.equal(api.schema,'SANA_CAPITAL_HUMAN_REVIEW_LEDGER_V1');
const caf=api.cases().find(c=>c.id==='CR-CAF-01');
const agu=api.cases().find(c=>c.id==='CR-AGU-01');
assert(caf&&agu,'baseline review cases missing');
assert.equal(caf.requests.length,1);
assert.equal(caf.starts.length,1);
assert.equal(caf.completions.length,1);
assert.equal(caf.semantics.reviewOpen,false);
assert.equal(caf.approvalsVerified,0,'completed review must not become approval');
assert.equal(caf.eligibilityDecision,null);
assert.equal(caf.creditScore,null);
assert.equal(caf.investmentRecommendation,null);
assert.equal(caf.executionActions,0);
assert.equal(caf.fundingExecuted,0);
assert.equal(caf.reviewerIdentitiesVerified,0,'reviewerRef must not become verified identity');
assert.equal(agu.requests.length,1);
assert.equal(agu.starts.length,1);
assert.equal(agu.completions.length,0);
assert.equal(agu.semantics.reviewOpen,true,'started review without completion must remain open');
assert.equal(api.summary().openReviews,1);
assert.equal(api.summary().approvalsVerified,0);
assert.equal(api.summary().eligibilityDecisions,0);
assert.equal(api.summary().creditScores,0);
assert.equal(api.summary().investmentRecommendations,0);
assert.match(api.integrity,/REVIEW_COMPLETED ≠ APPROVAL/);
assert.match(api.integrity,/ASSESSMENT_REFERENCE ≠ CREDIT_SCORE ≠ INVESTMENT_RECOMMENDATION/);
assert.match(api.integrity,/HUMAN_DECISION_REFERENCE ≠ EXECUTION/);
assert.match(api.integrity,/SNAPSHOT_REFERENCE ≠ LIVE_STATE/);
assert.match(api.integrity,/REVIEWER_REF ≠ VERIFIED_IDENTITY/);

context.storage.records.push(
  {id:'LOCAL-DEC',type:'capital-review-event',lot:'CAF-A1',createdAt:'2026-08-18',values:{caseId:'CR-LOCAL-DEC',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-LOCAL-01',kind:'HUMAN_DECISION_REFERENCE',observedAt:'2026-08-18T10:00',reviewerRef:'REVIEWER-LOCAL',decisionRef:'DEC-LOCAL-01',decisionState:'REFERENCE_ONLY'}},
  {id:'LOCAL-START',type:'capital-review-event',lot:'CAF-A1',createdAt:'2026-08-18',values:{caseId:'CR-LOCAL-BADSEQ',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-LOCAL-02',kind:'REVIEW_STARTED',observedAt:'2026-08-18T11:00',reviewerRef:'REVIEWER-LOCAL',reviewState:'IN_REVIEW'}}
);
const localDecision=api.cases().find(c=>c.id==='CR-LOCAL-DEC');
assert(localDecision,'local decision reference case missing');
assert.equal(localDecision.decisions.length,1);
assert.equal(localDecision.executionActions,0,'decision reference must never execute');
assert.equal(localDecision.eligibilityDecision,null,'decision reference must not become eligibility');
assert.equal(localDecision.investmentRecommendation,null,'decision reference must not become investment recommendation');
const badSeq=api.cases().find(c=>c.id==='CR-LOCAL-BADSEQ');
assert.deepEqual([...badSeq.semantics.startedWithoutRequest],['LOCAL-START'],'sequence issue should be observable without auto-decision');
assert.equal(badSeq.semantics.reviewOpen,true);

assert(!/fetch\s*\(/.test(code));
assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
assert(!/productionActivationAllowed\s*=\s*true/.test(code));
assert(!/canonicalMutated\s*=\s*true/.test(code));
assert(!/approvalsVerified\s*:\s*[1-9]/.test(code));
assert(!/fundingExecuted\s*:\s*[1-9]/.test(code));
console.log('SANA capital human review v63 validation: OK');
