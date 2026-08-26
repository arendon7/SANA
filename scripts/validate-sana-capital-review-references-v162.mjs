import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-capital-review-references.js','utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const cases=[
  {id:'CR-GOOD',capitalCaseRef:'CAP-GOOD',lot:'L1',events:[
    {id:'RG1',kind:'REVIEW_REQUESTED',lot:'L1',snapshotRef:'SNAP-GOOD',reviewerRef:'REV-1',requestRef:'REQ-1',observedAt:'2026-08-01T10:00:00Z'},
    {id:'CG1',kind:'REVIEW_COMPLETED',lot:'L1',snapshotRef:'SNAP-GOOD',reviewerRef:'REV-1',outcomeRef:'OUT-1',observedAt:'2026-08-02T10:00:00Z'},
    {id:'EG1',kind:'EVIDENCE',lot:'L1',snapshotRef:'SNAP-GOOD',reviewerRef:'REV-1',evidenceRef:'EV-1',supports:['CG1'],observedAt:'2026-08-03T10:00:00Z'}
  ],integrity:'BASE'},
  {id:'CR-BAD',capitalCaseRef:'CAP-BAD-SCOPE',lot:'L1',events:[
    {id:'RB1',kind:'REVIEW_STARTED',lot:'L1',snapshotRef:'SNAP-FUTURE',reviewerRef:'REV-2',observedAt:'2026-08-01T10:00:00Z'},
    {id:'EB1',kind:'EVIDENCE',lot:'L1',snapshotRef:'SNAP-FUTURE',reviewerRef:'REV-2',evidenceRef:'EV-2',supports:['NO-TARGET'],observedAt:'2026-08-02T10:00:00Z'}
  ],integrity:'BASE'},
  {id:'CR-SCHEMA',capitalCaseRef:'CAP-GOOD',lot:'L1',events:[
    {id:'RS1',kind:'REVIEW_STARTED',lot:'L1',snapshotRef:'SNAP-WRONG-SCHEMA',reviewerRef:'REV-3',observedAt:'2026-08-01T10:00:00Z'}
  ],integrity:'BASE'},
  {id:'CR-LEGACY',capitalCaseRef:'CAP-GOOD',lot:'L1',events:[
    {id:'RL1',kind:'REVIEW_REQUESTED',lot:'L1',snapshotRef:'SNAP-GOOD',reviewerRef:'REV-L',observedAt:'2026-08-01T10:00:00Z'}
  ],integrity:'BASE'}
];
const base={
  schema:'SANA_CAPITAL_HUMAN_REVIEW_LEDGER_V1',
  cases:()=>cases.map(clone),
  forLot:lot=>cases.filter(c=>c.lot===lot).map(clone),
  summary:()=>({schema:'SANA_CAPITAL_HUMAN_REVIEW_LEDGER_V1',cases:cases.length,integrity:'BASE'}),
  integrity:'BASE'
};
const governanceCases=[
  {id:'CAP-GOOD',lot:'L1',events:[{id:'CAP-E1',kind:'CAPITAL_NEED_DECLARED',lot:'L1',observedAt:'2026-07-20T10:00:00Z'}]},
  {id:'CAP-BAD-SCOPE',lot:'L2',events:[{id:'CAP-E2',kind:'CAPITAL_NEED_DECLARED',lot:'L2',observedAt:'2026-07-20T10:00:00Z'}]}
];
const snapshots=[
  {id:'SNAP-GOOD',reportType:'RPT-DD',createdAt:'2026-07-31T10:00:00Z',cutoff:'2026-07-31',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',secret:'MUST_NOT_LEAK'}},
  {id:'SNAP-FUTURE',reportType:'RPT-DD',createdAt:'2026-08-05T10:00:00Z',cutoff:'2026-08-05',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}},
  {id:'SNAP-WRONG-SCHEMA',reportType:'RPT-DD',createdAt:'2026-07-31T10:00:00Z',manifest:{schema:'OTHER_SCHEMA'}}
];
const meta=['CR-GOOD','CR-BAD','CR-SCHEMA'].map((caseId,i)=>({id:`M${i}`,type:'capital-review-reference-meta',values:{sourceSchema:base.schema,caseId,referenceVersion:'V162'}}));
const sandbox={window:{
  __SANA_CAPITAL_REVIEW__:base,
  __SANA_CAPITAL_GOVERNANCE__:{schema:'SANA_CAPITAL_GOVERNANCE_LEDGER_V1',referenceVersion:'V150',cases:()=>governanceCases.map(clone)},
  __SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>snapshots.map(clone)}
},storage:{records:meta},views:{capital:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},esc:v=>String(v??''),metric:()=>'',openModal:()=>{},console,Date,setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_CAPITAL_REVIEW__;
assert.equal(api.referenceVersion,'V162');

const good=api.forCase('CR-GOOD');
assert.equal(good.referenceState,'CAPTURED_V162');
assert.equal(good.referenceCoverage.total,3);
assert.equal(good.referenceCoverage.linked,3);
assert.equal(good.referenceIssues,0);
for(const kind of ['CAPITAL_CASE_REF','SNAPSHOT_REF','REVIEW_SUPPORT_REF'])assert.ok(good.referenceRows.some(r=>r.kind===kind),kind);
assert.ok(good.declaredReferenceRows.length>0);
assert.ok(good.declaredReferenceRows.every(r=>r.status==='DECLARED_NON_CANONICAL_REFERENCE'&&r.valueExposed===false&&!Object.hasOwn(r,'value')));
const snapshotRow=good.referenceRows.find(r=>r.kind==='SNAPSHOT_REF');
assert.equal(snapshotRow.reference.targetId,'SNAP-GOOD');
assert.equal(Object.hasOwn(snapshotRow.reference,'manifest'),false);
assert.equal(JSON.stringify(snapshotRow).includes('MUST_NOT_LEAK'),false);

const bad=api.forCase('CR-BAD');
assert.equal(bad.referenceCoverage.total,3);
assert.equal(bad.referenceCoverage.linked,0);
assert.equal(bad.referenceIssues,3);
assert.ok(bad.referenceRows.some(r=>r.kind==='CAPITAL_CASE_REF'&&r.reference.status==='CROSS_SCOPE_REFERENCE'));
assert.ok(bad.referenceRows.some(r=>r.kind==='SNAPSHOT_REF'&&r.reference.status==='FORWARD_REFERENCE'));
assert.ok(bad.referenceRows.some(r=>r.kind==='REVIEW_SUPPORT_REF'&&r.reference.status==='MISSING_TARGET'));

const schema=api.forCase('CR-SCHEMA');
assert.equal(schema.referenceCoverage.total,2);
assert.ok(schema.referenceRows.some(r=>r.kind==='SNAPSHOT_REF'&&r.reference.status==='SCHEMA_MISMATCH'));

const legacy=api.forCase('CR-LEGACY');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(legacy.referenceCoverage.total,0);
assert.equal(legacy.referenceIssues,0);

const summary=api.summary();
assert.equal(summary.referenceCaptured,3);
assert.equal(summary.referenceExpected,8);
assert.equal(summary.referenceLinked,4);
assert.equal(summary.referenceIssues,4);
assert.equal(summary.legacyReferenceNotCaptured,1);
assert.equal(summary.declaredReferenceValuePolicy,'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED');
assert.match(api.integrity,/SNAPSHOT_REFERENCE ≠ CONTENT_CORRECTNESS/);
assert.match(api.integrity,/REVIEWER_REF_DECLARED ≠ VERIFIED_IDENTITY/);
assert.match(api.integrity,/ASSESSMENT_REF_DECLARED ≠ CREDIT_SCORE ≠ INVESTMENT_RECOMMENDATION/);
assert.match(api.integrity,/REFERENCE ≠ OFFER ≠ SOLICITATION ≠ BROKERAGE ≠ CUSTODY ≠ DISBURSEMENT/);
console.log('capital review references V162: ok');
