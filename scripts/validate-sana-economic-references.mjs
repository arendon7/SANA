import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-economic-references.js','utf8');
const cases=[
  {id:'ECON-L1',lot:'L1',events:[
    {id:'C1',kind:'COST_DECLARED',observedAt:'2026-08-01',planId:'P1',planVersion:1,activityId:'A1',amount:100,currency:'COP'},
    {id:'E1',kind:'EVIDENCE_REFERENCE',observedAt:'2026-08-02',evidenceRef:'soporte-texto.pdf',supports:['C1']},
    {id:'HREF1',kind:'HARVEST_REFERENCE',sourceRef:'H1'},
    {id:'XL1',kind:'CROSS_DOMAIN_COST_REFERENCE',sourceDomain:'LABOR',sourceRef:'LAB-COST'},
    {id:'XI1',kind:'CROSS_DOMAIN_COST_REFERENCE',sourceDomain:'INVENTORY',sourceRef:'INV-COST'},
    {id:'INVREF',kind:'INVOICE_REFERENCE',invoiceRef:'FAC-DECL'},
    {id:'PAY',kind:'PAYMENT_STATUS_DECLARED',paymentState:'DECLARED_PAID'},
    {id:'SALE',kind:'SALE_DECLARATION',saleRef:'SALE-DECL'},
    {id:'REC',kind:'CASH_RECEIPT_DECLARATION',receiptRef:'REC-DECL'}
  ],integrity:'BASE'},
  {id:'ECON-BAD',lot:'L1',events:[
    {id:'C2',kind:'COST_DECLARED',observedAt:'2026-08-01',planId:'P-MISSING',planVersion:9,activityId:'A2'},
    {id:'E2',kind:'EVIDENCE_REFERENCE',observedAt:'2026-08-02',supports:['NO-COST']},
    {id:'HREF2',kind:'HARVEST_REFERENCE',sourceRef:'H-MISSING'},
    {id:'XBAD',kind:'CROSS_DOMAIN_COST_REFERENCE',sourceDomain:'OTHER',sourceRef:'X'}
  ],integrity:'BASE'},
  {id:'ECON-LEGACY',lot:'L1',events:[{id:'CL',kind:'COST_DECLARED',planId:'P1',planVersion:1,activityId:'A1'}],integrity:'BASE'}
];
const base={schema:'SANA_ECONOMIC_RECONCILIATION_LEDGER_V1',cases:()=>cases.map(c=>structuredClone(c)),forLot:lot=>cases.filter(c=>c.lot===lot),forActivity:id=>cases.filter(c=>c.events.some(e=>e.activityId===id)),summary:()=>({schema:'SANA_ECONOMIC_RECONCILIATION_LEDGER_V1',cases:cases.length,integrity:'BASE'}),integrity:'BASE'};
const meta=['ECON-L1','ECON-BAD'].map((id,i)=>({id:`M${i}`,type:'economic-reference-meta',values:{sourceSchema:base.schema,caseId:id,referenceVersion:'V145'}}));
const activities={A1:{id:'A1',lot:'L1',planId:'P1',planVersion:1},A2:{id:'A2',lot:'L2',planId:'P2',planVersion:1}};
const sandbox={window:{
  __SANA_ECONOMIC_RECONCILIATION__:base,
  __SANA_PLAN_FIELD_WORKFLOW__:{findActivity:id=>activities[id]||null,activities:()=>Object.values(activities)},
  __SANA_HARVEST_LEDGER__:{cases:()=>[{id:'H1',lot:'L1'}]},
  __SANA_LABOR_LEDGER__:{cases:()=>[{id:'LAB1',lot:'L1',costs:[{id:'LC1',costRef:'LAB-COST'}],events:[]}]},
  __SANA_INVENTORY_LEDGER__:{cases:()=>[{id:'INV1',lot:'L1',events:[{id:'IE1',lot:'L1',costRef:'INV-COST'}]}]}
},DEMO:{plans:[{id:'P1',lot:'L1',version:1},{id:'P2',lot:'L2',version:1}]},storage:{records:meta},views:{economics:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},esc:v=>String(v??''),metric:()=>'',openModal:()=>{},structuredClone,console,Date};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_ECONOMIC_RECONCILIATION__;
assert.equal(api.referenceVersion,'V145');
const good=api.forCase('ECON-L1');
assert.equal(good.referenceIssues,0);
assert.equal(good.referenceCoverage.total,6);
assert.equal(good.referenceCoverage.linked,6);
assert.equal(good.declaredReferenceRows.length,5);
assert.ok(good.declaredReferenceRows.every(r=>r.status==='DECLARED_NON_CANONICAL_REFERENCE'));
for(const kind of ['PLAN_REF','ACTIVITY_REF','COST_SUPPORT_REF','HARVEST_REF','CROSS_DOMAIN_COST_REF'])assert.ok(good.referenceRows.some(r=>r.kind===kind),kind);
const bad=api.forCase('ECON-BAD');
assert.equal(bad.referenceCoverage.total,5);
assert.equal(bad.referenceIssues,5);
assert.ok(bad.referenceRows.some(r=>r.kind==='PLAN_REF'&&r.reference.status==='MISSING_TARGET'));
assert.ok(bad.referenceRows.some(r=>r.kind==='ACTIVITY_REF'&&r.reference.status==='CROSS_SCOPE_REFERENCE'));
assert.ok(bad.referenceRows.some(r=>r.kind==='COST_SUPPORT_REF'&&r.reference.status==='MISSING_TARGET'));
assert.ok(bad.referenceRows.some(r=>r.kind==='HARVEST_REF'&&r.reference.status==='MISSING_TARGET'));
assert.ok(bad.referenceRows.some(r=>r.kind==='CROSS_DOMAIN_COST_REF'&&r.reference.status==='UNSUPPORTED_SOURCE_DOMAIN'));
const legacy=api.forCase('ECON-LEGACY');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(legacy.referenceCoverage.total,0);
const summary=api.summary();
assert.equal(summary.referenceCaptured,2);
assert.equal(summary.legacyReferenceNotCaptured,1);
assert.equal(summary.referenceExpected,11);
assert.equal(summary.referenceLinked,6);
assert.equal(summary.referenceIssues,5);
assert.equal(summary.declaredNonCanonical,5);
assert.match(api.integrity,/ECONOMIC_REFERENCE ≠ ACCOUNTING_ENTRY/);
assert.match(api.integrity,/INVOICE_REFERENCE_DECLARED ≠ INVOICE_VERIFIED/);
assert.match(api.integrity,/REFERENCE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL/);
console.log('economic references V145: ok');
