import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-commercial-references.js','utf8');
const commercialCases=[
  {id:'COM-GOOD',lot:'L1',events:[
    {id:'O1',kind:'OFFER_REGISTERED',observedAt:'2026-08-01T08:00:00Z',buyerRef:'BUYER-DECL',priceRef:10},
    {id:'A1',kind:'OFFTAKE_AGREEMENT_REFERENCE',observedAt:'2026-08-01T09:00:00Z',buyerRef:'BUYER-DECL',agreementRef:'AGR-DECL'},
    {id:'D1',kind:'DELIVERY_DECLARATION',observedAt:'2026-08-02T10:00:00Z',buyerRef:'BUYER-DECL',deliveryRef:'HR-D1'},
    {id:'E1',kind:'EVIDENCE',observedAt:'2026-08-02T11:00:00Z',evidenceRef:'DOC-DECL',supports:['A1','D1']},
    {id:'I1',kind:'INVOICE_REFERENCE',invoiceRef:'INV-DECL'},
    {id:'P1',kind:'PAYMENT_STATUS_DECLARED',paymentState:'DECLARED_PAID'},
    {id:'R1',kind:'CASH_RECEIPT_DECLARATION',receiptRef:'REC-DECL'}
  ],crossDomainRefs:[
    {id:'XH1',kind:'HARVEST_HANDOFF_REFERENCE',sourceDomain:'HARVEST',sourceRef:'HR-D1'},
    {id:'XS1',kind:'HARVEST_SALE_DECLARATION_REFERENCE',sourceDomain:'HARVEST',sourceRef:'HR-S1',commercialRef:'SALE-COM-DECL'},
    {id:'XE1',kind:'ECONOMIC_EVENT_REFERENCE',sourceDomain:'ECONOMICS',sourceRef:'EC-S1',sourceKind:'SALE_DECLARATION'}
  ],integrity:'BASE'},
  {id:'COM-BAD',lot:'L1',events:[
    {id:'BD1',kind:'DELIVERY_DECLARATION',observedAt:'2026-08-02T10:00:00Z',deliveryRef:'HR-S1'},
    {id:'BE1',kind:'EVIDENCE',observedAt:'2026-08-01T07:00:00Z',supports:['NOPE']}
  ],crossDomainRefs:[
    {id:'BXH',kind:'HARVEST_HANDOFF_REFERENCE',sourceDomain:'HARVEST',sourceRef:'NO-HR'},
    {id:'BXE',kind:'ECONOMIC_EVENT_REFERENCE',sourceDomain:'ECONOMICS',sourceRef:'EC-S1',sourceKind:'INVOICE_REFERENCE'}
  ],integrity:'BASE'},
  {id:'COM-LEGACY',lot:'L1',events:[{id:'L-O',kind:'OFFER_REGISTERED',buyerRef:'B'}],crossDomainRefs:[],integrity:'BASE'}
];
const base={schema:'SANA_COMMERCIAL_OFFTAKE_LEDGER_V1',cases:()=>structuredClone(commercialCases),forLot:lot=>commercialCases.filter(c=>c.lot===lot),summary:()=>({schema:'SANA_COMMERCIAL_OFFTAKE_LEDGER_V1',cases:commercialCases.length,integrity:'BASE'}),integrity:'BASE'};
const meta=['COM-GOOD','COM-BAD'].map((id,i)=>({id:`M${i}`,type:'commercial-reference-meta',values:{sourceSchema:base.schema,caseId:id,referenceVersion:'V147'}}));
const sandbox={window:{
  __SANA_COMMERCIAL_LEDGER__:base,
  __SANA_HARVEST_LEDGER__:{cases:()=>[{id:'HR-C',lot:'L1',events:[{id:'HR-D1',kind:'HANDOFF',lot:'L1',observedAt:'2026-08-02T09:00:00Z'},{id:'HR-S1',kind:'SALE_DECLARATION',lot:'L1',observedAt:'2026-08-02T12:00:00Z'}]}]},
  __SANA_ECONOMIC_RECONCILIATION__:{cases:()=>[{id:'EC-C',lot:'L1',events:[{id:'EC-S1',kind:'SALE_DECLARATION',lot:'L1'}]}]}
},storage:{records:meta},views:{results:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},esc:v=>String(v??''),metric:()=>'',openModal:()=>{},structuredClone,console,Date,Set,Map,Object,Array,Number,String,Math};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_COMMERCIAL_LEDGER__;
assert.equal(api.referenceVersion,'V147');
const good=api.forCase('COM-GOOD');
assert.equal(good.referenceCoverage.total,6);
assert.equal(good.referenceCoverage.linked,6);
assert.equal(good.referenceIssues,0);
for(const kind of ['COMMERCIAL_SUPPORT_REF','HARVEST_DELIVERY_REF','CROSS_DOMAIN_REF'])assert.ok(good.referenceRows.some(r=>r.kind===kind),kind);
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='BUYER_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='AGREEMENT_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='PRICE_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='INVOICE_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='PAYMENT_STATE_DECLARED'));
assert.ok(good.declaredReferenceRows.some(r=>r.kind==='RECEIPT_REF_DECLARED'));
assert.ok(good.declaredReferenceRows.every(r=>r.status==='DECLARED_NON_CANONICAL_REFERENCE'));
const bad=api.forCase('COM-BAD');
assert.equal(bad.referenceCoverage.total,4);
assert.equal(bad.referenceIssues,4);
assert.ok(bad.referenceRows.some(r=>r.kind==='HARVEST_DELIVERY_REF'&&r.reference.status==='KIND_MISMATCH'));
assert.ok(bad.referenceRows.some(r=>r.kind==='COMMERCIAL_SUPPORT_REF'&&r.reference.status==='MISSING_TARGET'));
assert.ok(bad.referenceRows.some(r=>r.sourceEventId==='BXH'&&r.reference.status==='MISSING_TARGET'));
assert.ok(bad.referenceRows.some(r=>r.sourceEventId==='BXE'&&r.reference.status==='KIND_MISMATCH'));
const legacy=api.forCase('COM-LEGACY');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(legacy.referenceCoverage.total,0);
const sum=api.summary();
assert.equal(sum.referenceCaptured,2);assert.equal(sum.legacyReferenceNotCaptured,1);assert.equal(sum.referenceExpected,10);assert.equal(sum.referenceLinked,6);assert.equal(sum.referenceIssues,4);
assert.match(api.integrity,/BUYER_REF ≠ BUYER_IDENTITY_VERIFIED/);
assert.match(api.integrity,/AGREEMENT_REFERENCE_DECLARED ≠ VERIFIED_CONTRACT/);
assert.match(api.integrity,/REFERENCE ≠ GUARANTEED_REVENUE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL/);
console.log('commercial references V147: ok');
