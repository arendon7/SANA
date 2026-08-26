import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-capital-governance-references.js','utf8');
const cases=[
  {id:'CAP-GOOD',lot:'L1',events:[
    {id:'N1',caseId:'CAP-GOOD',lot:'L1',kind:'CAPITAL_NEED_DECLARED',observedAt:'2026-08-01T08:00:00Z',counterpartyRef:'CP-DECL'},
    {id:'T1',caseId:'CAP-GOOD',lot:'L1',kind:'TERM_SHEET_REFERENCE',observedAt:'2026-08-01T09:00:00Z',termSheetRef:'TS-DECL'},
    {id:'D1',caseId:'CAP-GOOD',lot:'L1',kind:'HUMAN_DECISION_REFERENCE',observedAt:'2026-08-01T10:00:00Z',decisionRef:'DEC-DECL'},
    {id:'E1',caseId:'CAP-GOOD',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-01T11:00:00Z',evidenceRef:'EV-DECL',supports:['T1','D1']}
  ],integrity:'BASE'},
  {id:'CAP-BAD',lot:'L1',events:[
    {id:'FUT',caseId:'CAP-BAD',lot:'L1',kind:'COMMITMENT_REFERENCE',observedAt:'2026-08-03T10:00:00Z',commitmentRef:'COM-DECL'},
    {id:'SCOPE1',caseId:'CAP-BAD',lot:'L9',kind:'USE_OF_FUNDS_DECLARED',observedAt:'2026-08-01T07:00:00Z'},
    {id:'BE-KIND',caseId:'CAP-BAD',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-02T08:00:00Z',evidenceRef:'BAD-EV-TARGET',supports:['NOPE-KIND-SOURCE']},
    {id:'BE-MISSING-REF',caseId:'CAP-BAD',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-02T09:00:00Z',supports:[]},
    {id:'BE-MISSING-TARGET',caseId:'CAP-BAD',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-02T10:00:00Z',supports:['NOPE']},
    {id:'BE-CROSS',caseId:'CAP-BAD',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-02T11:00:00Z',supports:['OTHER1']},
    {id:'BE-KIND2',caseId:'CAP-BAD',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-02T12:00:00Z',supports:['BE-KIND']},
    {id:'BE-SCOPE',caseId:'CAP-BAD',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-02T12:30:00Z',supports:['SCOPE1']},
    {id:'BE-FWD',caseId:'CAP-BAD',lot:'L1',kind:'EVIDENCE',observedAt:'2026-08-02T13:00:00Z',supports:['FUT']},
    {id:'B-FUND',caseId:'CAP-BAD',lot:'L1',kind:'FUNDING_STATUS_DECLARED',observedAt:'2026-08-04T10:00:00Z',fundingRef:'FUND-DECL',closingRef:'CLOSE-DECL',requestRef:'REQ-DECL'}
  ],integrity:'BASE'},
  {id:'CAP-OTHER',lot:'L2',events:[{id:'OTHER1',caseId:'CAP-OTHER',lot:'L2',kind:'USE_OF_FUNDS_DECLARED',observedAt:'2026-08-01T08:30:00Z'}],integrity:'BASE'},
  {id:'CAP-LEGACY',lot:'L3',events:[{id:'L1',caseId:'CAP-LEGACY',lot:'L3',kind:'DUE_DILIGENCE_REQUEST',observedAt:'2026-08-01T08:00:00Z',requestRef:'LEGACY-REQ'}],integrity:'BASE'}
];
const clone=c=>({...c,events:c.events.map(e=>({...e,supports:e.supports?[...e.supports]:undefined}))});
const base={schema:'SANA_CAPITAL_GOVERNANCE_LEDGER_V1',cases:()=>cases.map(clone),forLot:lot=>cases.filter(c=>c.lot===lot).map(clone),summary:()=>({schema:'SANA_CAPITAL_GOVERNANCE_LEDGER_V1',cases:cases.length,verifiedCommitments:0,fundingExecuted:0,custodyAmount:0,eligibilityDecisions:0,creditScores:0,investmentRecommendations:0,automaticInvestmentActions:0,integrity:'BASE'}),integrity:'BASE'};
const meta=['CAP-GOOD','CAP-BAD'].map((caseId,i)=>({id:`M${i}`,type:'capital-governance-reference-meta',values:{sourceSchema:base.schema,caseId,referenceVersion:'V150'}}));
const sandbox={window:{__SANA_CAPITAL_GOVERNANCE__:base},storage:{records:meta},views:{capital:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},esc:v=>String(v??''),metric:()=>'',openModal:()=>{},console,Date,Set,Map,Object,Array,Number,String,Math};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_CAPITAL_GOVERNANCE__;
assert.equal(api.referenceVersion,'V150');
assert.equal(api.referenceSemanticsVersion,'V150');
const good=api.forCase('CAP-GOOD');
assert.equal(good.referenceState,'CAPTURED_V150');
assert.equal(good.referenceCoverage.total,2);assert.equal(good.referenceCoverage.linked,2);assert.equal(good.referenceIssues,0);
for(const kind of ['COUNTERPARTY_REF_DECLARED','TERM_SHEET_REF_DECLARED','DECISION_REF_DECLARED','EVIDENCE_REF_DECLARED'])assert.ok(good.declaredReferenceRows.some(r=>r.kind===kind),kind);
assert.ok(good.declaredReferenceRows.every(r=>r.status==='DECLARED_NON_CANONICAL_REFERENCE'&&r.valueExposed===false));
assert.ok(good.declaredReferenceRows.every(r=>!Object.hasOwn(r,'refId')&&!Object.hasOwn(r,'value')));
const bad=api.forCase('CAP-BAD');
assert.equal(bad.referenceCoverage.total,7);assert.equal(bad.referenceCoverage.linked,0);assert.equal(bad.referenceIssues,7);
for(const status of ['MISSING_REFERENCE','MISSING_TARGET','CROSS_CASE_REFERENCE','CROSS_SCOPE_REFERENCE','KIND_MISMATCH','FORWARD_REFERENCE'])assert.ok(bad.referenceRows.some(r=>r.reference.status===status),status);
for(const kind of ['COMMITMENT_REF_DECLARED','FUNDING_REF_DECLARED','CLOSING_REF_DECLARED','DD_REQUEST_REF_DECLARED','EVIDENCE_REF_DECLARED'])assert.ok(bad.declaredReferenceRows.some(r=>r.kind===kind),kind);
assert.ok(bad.declaredReferenceRows.every(r=>r.valueExposed===false&&!Object.hasOwn(r,'refId')));
const legacy=api.forCase('CAP-LEGACY');assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');assert.equal(legacy.referenceCoverage.total,0);
const other=api.forCase('CAP-OTHER');assert.equal(other.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
const sum=api.summary();assert.equal(sum.referenceCaptured,2);assert.equal(sum.referenceExpected,9);assert.equal(sum.referenceLinked,2);assert.equal(sum.referenceIssues,7);assert.equal(sum.legacyReferenceNotCaptured,2);
assert.equal(sum.declaredReferenceValuePolicy,'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED');
assert.match(api.integrity,/REFERENCE_TARGET ≠ CASE_MEMBERSHIP/);
assert.match(api.integrity,/DOCUMENT_COMPLETENESS ≠ ELIGIBILITY ≠ CREDIT_SCORE/);
assert.match(api.integrity,/TERM_SHEET_REF_DECLARED ≠ SIGNED_OR_VERIFIED_TERM_SHEET/);
assert.match(api.integrity,/COMMITMENT_REF_DECLARED ≠ VERIFIED_COMMITMENT_OR_FUNDING/);
assert.match(api.integrity,/REFERENCE ≠ OFFER ≠ SOLICITATION ≠ BROKERAGE ≠ CUSTODY ≠ INVESTMENT_RECOMMENDATION/);
console.log('capital governance references V150: ok');
