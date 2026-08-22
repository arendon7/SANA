import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-capital-governance-references.js','utf8');
const cases=[
  {id:'CAP-GOOD',lot:'L1',events:[
    {id:'N1',kind:'CAPITAL_NEED_DECLARED',observedAt:'2026-08-01T08:00:00Z',counterpartyRef:'CP-DECL'},
    {id:'T1',kind:'TERM_SHEET_REFERENCE',observedAt:'2026-08-01T09:00:00Z',termSheetRef:'TS-DECL'},
    {id:'D1',kind:'HUMAN_DECISION_REFERENCE',observedAt:'2026-08-01T10:00:00Z',decisionRef:'DEC-DECL'},
    {id:'E1',kind:'EVIDENCE',observedAt:'2026-08-01T11:00:00Z',evidenceRef:'EV-DECL',supports:['T1','D1']}
  ],integrity:'BASE'},
  {id:'CAP-BAD',lot:'L1',events:[
    {id:'FUT',kind:'COMMITMENT_REFERENCE',observedAt:'2026-08-03T10:00:00Z',commitmentRef:'COM-DECL'},
    {id:'BE-KIND',kind:'EVIDENCE',observedAt:'2026-08-02T08:00:00Z',evidenceRef:'BAD-EV-TARGET',supports:['N1']},
    {id:'BE-MISSING-REF',kind:'EVIDENCE',observedAt:'2026-08-02T09:00:00Z',supports:[]},
    {id:'BE-MISSING-TARGET',kind:'EVIDENCE',observedAt:'2026-08-02T10:00:00Z',supports:['NOPE']},
    {id:'BE-CROSS',kind:'EVIDENCE',observedAt:'2026-08-02T11:00:00Z',supports:['OTHER1']},
    {id:'BE-KIND2',kind:'EVIDENCE',observedAt:'2026-08-02T12:00:00Z',supports:['BE-KIND']},
    {id:'BE-FWD',kind:'EVIDENCE',observedAt:'2026-08-02T13:00:00Z',supports:['FUT']},
    {id:'B-FUND',kind:'FUNDING_STATUS_DECLARED',observedAt:'2026-08-04T10:00:00Z',fundingRef:'FUND-DECL',closingRef:'CLOSE-DECL',requestRef:'REQ-DECL'}
  ],integrity:'BASE'},
  {id:'CAP-OTHER',lot:'L2',events:[{id:'OTHER1',kind:'USE_OF_FUNDS_DECLARED',observedAt:'2026-08-01T08:30:00Z'}],integrity:'BASE'},
  {id:'CAP-LEGACY',lot:'L3',events:[{id:'L1',kind:'DUE_DILIGENCE_REQUEST',observedAt:'2026-08-01T08:00:00Z',requestRef:'LEGACY-REQ'}],integrity:'BASE'}
];
const base={schema:'SANA_CAPITAL_GOVERNANCE_LEDGER_V1',cases:()=>cases.map(c=>({...c,events:c.events.map(e=>({...e,supports:e.supports?[...e.supports]:undefined}))})),forLot:lot=>cases.filter(c=>c.lot===lot),summary:()=>({schema:'SANA_CAPITAL_GOVERNANCE_LEDGER_V1',cases:cases.length,verifiedCommitments:0,fundingExecuted:0,custodyAmount:0,eligibilityDecisions:0,creditScores:0,investmentRecommendations:0,automaticInvestmentActions:0,integrity:'BASE'}),integrity:'BASE'};
const meta=['CAP-GOOD','CAP-BAD'].map((caseId,i)=>({id:`M${i}`,type:'capital-governance-reference-meta',values:{sourceSchema:base.schema,caseId,referenceVersion:'V149'}}));
const sandbox={window:{__SANA_CAPITAL_GOVERNANCE__:base},storage:{records:meta},views:{capital:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},esc:v=>String(v??''),metric:()=>'',openModal:()=>{},console,Date,Set,Map,Object,Array,Number,String,Math};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_CAPITAL_GOVERNANCE__;
assert.equal(api.referenceVersion,'V149');
const good=api.forCase('CAP-GOOD');
assert.equal(good.referenceState,'CAPTURED_V149');
assert.equal(good.referenceCoverage.total,2);assert.equal(good.referenceCoverage.linked,2);assert.equal(good.referenceIssues,0);
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='COUNTERPARTY_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='TERM_SHEET_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='DECISION_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='EVIDENCE_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.every(r=>r.status==='DECLARED_NON_CANONICAL_REFERENCE'));
const bad=api.forCase('CAP-BAD');
assert.equal(bad.referenceCoverage.total,5);assert.equal(bad.referenceCoverage.linked,0);assert.equal(bad.referenceIssues,5);
for(const status of ['MISSING_REFERENCE','MISSING_TARGET','CROSS_CASE_REFERENCE','KIND_MISMATCH','FORWARD_REFERENCE'])assert.ok(bad.referenceRows.some(r=>r.reference.status===status),status);
for(const kind of ['COMMITMENT_REF_DECLARED','FUNDING_REF_DECLARED','CLOSING_REF_DECLARED','DD_REQUEST_REF_DECLARED','EVIDENCE_REF_DECLARED'])assert.ok(bad.declaredReferenceRows.some(r=>r.kind===kind),kind);
const legacy=api.forCase('CAP-LEGACY');assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');assert.equal(legacy.referenceCoverage.total,0);
const other=api.forCase('CAP-OTHER');assert.equal(other.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
const sum=api.summary();assert.equal(sum.referenceCaptured,2);assert.equal(sum.referenceExpected,7);assert.equal(sum.referenceLinked,2);assert.equal(sum.referenceIssues,5);assert.equal(sum.legacyReferenceNotCaptured,2);
assert.match(api.integrity,/DOCUMENT_COMPLETENESS ≠ ELIGIBILITY ≠ CREDIT_SCORE/);
assert.match(api.integrity,/TERM_SHEET_REF_DECLARED ≠ SIGNED_OR_VERIFIED_TERM_SHEET/);
assert.match(api.integrity,/COMMITMENT_REF_DECLARED ≠ VERIFIED_COMMITMENT_OR_FUNDING/);
assert.match(api.integrity,/REFERENCE ≠ OFFER ≠ SOLICITATION ≠ BROKERAGE ≠ CUSTODY ≠ INVESTMENT_RECOMMENDATION/);
console.log('capital governance references V149: ok');
