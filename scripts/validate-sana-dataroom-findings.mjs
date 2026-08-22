import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const path='apps/control-web/public/sana-v3-dataroom-findings-ledger.js';
const code=fs.readFileSync(path,'utf8');
const storage={records:[]};
const ctx={window:{__SANA_ACCESS__:{role:'admin'}},storage,DEMO:{lots:[{id:'CAF-A1',crop:'Café'},{id:'CAC-B1',crop:'Cacao'}]},views:{dataroom:()=>'<footer class="footer"></footer>',capital:()=>'<footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),openModal:()=>{},document:{addEventListener:()=>{}},console};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(code,ctx,{filename:path});
const api=ctx.window.__SANA_DATAROOM_FINDINGS__;assert(api);assert.equal(api.schema,'SANA_DATAROOM_REVIEW_FINDINGS_V1');
const s=api.summary();assert.equal(s.cases,2);assert.equal(s.findings,2);assert.equal(s.openFindings,1);assert.equal(s.clarifications,2);assert.equal(s.responses,1);for(const f of ['dueDiligenceApprovals','riskRatings','riskScores','eligibilityDecisions','investmentSignals','investmentOffers','investmentRecommendations','executionActions','fundingExecuted'])assert.equal(s[f],0,`${f} must remain 0`);
const caf=api.cases().find(c=>c.id==='RV-CAF-01'),cac=api.cases().find(c=>c.id==='RV-CAC-01');assert(caf&&cac);assert.deepEqual([...caf.openFindingRefs],[]);assert.equal(caf.responses.length,1);assert.equal(caf.assessments.length,1);assert.equal(caf.statuses.length,1);assert.equal(caf.dueDiligenceApprovals,0);assert.equal(caf.riskRatings,0);assert.equal(caf.riskScores,0);assert.deepEqual([...caf.semantics.findingWithoutReview],[]);assert.deepEqual([...caf.semantics.clarificationWithoutFinding],[]);assert.deepEqual([...caf.semantics.responseWithoutClarification],[]);assert.deepEqual([...caf.semantics.unresolvedEvidence],[]);assert.deepEqual([...cac.openFindingRefs],['FIND-CAC-DEMO-01']);assert.equal(cac.responses.length,0);assert.equal(cac.riskRatings,0);assert.equal(cac.investmentSignals,0);

storage.records.push(
  {id:'BAD-F',type:'dataroom-review-finding',lot:'BAD',createdAt:'2026-08-18T10:00:00-05:00',values:{caseId:'RV-BAD',kind:'FINDING_RECORDED',findingRef:'F-BAD',reviewRef:'R-MISSING'}},
  {id:'BAD-Q',type:'dataroom-review-finding',lot:'BAD',createdAt:'2026-08-18T10:01:00-05:00',values:{caseId:'RV-BAD',kind:'CLARIFICATION_REQUESTED',findingRef:'F-MISSING',clarificationRef:'Q-BAD'}},
  {id:'BAD-R',type:'dataroom-review-finding',lot:'BAD',createdAt:'2026-08-18T10:02:00-05:00',values:{caseId:'RV-BAD',kind:'RESPONSE_REFERENCE',findingRef:'F-BAD',clarificationRef:'Q-MISSING',responseRef:'RESP-BAD'}},
  {id:'BAD-E',type:'dataroom-review-finding',lot:'BAD',createdAt:'2026-08-18T10:03:00-05:00',values:{caseId:'RV-BAD',kind:'EVIDENCE_REFERENCE',findingRef:'F-MISSING',evidenceRef:'E-BAD',supports:'NO-EVENT'}},
  {id:'BAD-A',type:'dataroom-review-finding',lot:'BAD',createdAt:'2026-08-18T10:04:00-05:00',values:{caseId:'RV-BAD',kind:'HUMAN_ASSESSMENT',findingRef:'F-MISSING',assessmentRef:'A-BAD'}},
  {id:'BAD-S',type:'dataroom-review-finding',lot:'BAD',createdAt:'2026-08-18T10:05:00-05:00',values:{caseId:'RV-BAD',kind:'FINDING_STATUS_CHANGED',findingRef:'F-MISSING',statusRef:'S-BAD'}},
  {id:'BAD-C',type:'dataroom-review-finding',lot:'BAD',createdAt:'2026-08-18T10:06:00-05:00',values:{caseId:'RV-BAD',kind:'REVIEW_CLOSED',reviewRef:'R-MISSING',closureRef:'C-BAD'}}
);
const bad=api.cases().find(c=>c.id==='RV-BAD');assert(bad);assert.deepEqual([...bad.semantics.findingWithoutReview],['BAD-F']);assert.deepEqual([...bad.semantics.clarificationWithoutFinding],['BAD-Q']);assert.deepEqual([...bad.semantics.responseWithoutClarification],['BAD-R']);assert.deepEqual([...bad.semantics.evidenceWithoutFinding],['BAD-E']);assert.deepEqual([...bad.semantics.assessmentWithoutFinding],['BAD-A']);assert.deepEqual([...bad.semantics.statusWithoutFinding],['BAD-S']);assert.deepEqual([...bad.semantics.closedWithoutReview],['BAD-C']);assert.deepEqual([...bad.semantics.unresolvedEvidence],['NO-EVENT']);
for(const re of [/FINDING_RECORDED ≠ DEFECT_FACT ≠ NONCOMPLIANCE/,/FINDING_CLASS ≠ RISK_RATING/,/ATTENTION_CLASS ≠ RISK_SCORE/,/CLARIFICATION_REQUESTED ≠ NONCOMPLIANCE/,/RESPONSE_REFERENCE ≠ VERIFIED_RESPONSE/,/HUMAN_ASSESSMENT ≠ OBJECTIVE_FACT ≠ INVESTMENT_DECISION/,/FINDING_OPEN ≠ INVESTMENT_RISK/,/FINDING_CLOSED ≠ DUE_DILIGENCE_APPROVAL/,/REVIEW_CLOSED ≠ DUE_DILIGENCE_APPROVAL/,/FINDING_COUNT ≠ SCORE/,/NO_AUTOMATIC_SCORING/])assert.match(api.integrity,re);
assert(!/productionExecutionAvailable\s*=\s*true|productionActivationAllowed\s*=\s*true|canonicalMutated\s*=\s*true/.test(code));assert(!/fetch\s*\(/.test(code));
console.log('SANA Data Room human review findings v71 validation: OK');
