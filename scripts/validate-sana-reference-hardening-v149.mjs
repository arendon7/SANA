import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root='apps/control-web/public/';
const liveSrc=fs.readFileSync(root+'sana-v3-commercial-references.js','utf8');
const snapshotSrc=fs.readFileSync(root+'sana-v3-report-snapshot-commercial-references.js','utf8');
const dataroomSrc=fs.readFileSync(root+'sana-v3-dataroom-commercial-references.js','utf8');
const cycleCommercialSrc=fs.readFileSync(root+'sana-v3-cycle-commercial-references.js','utf8');
const cycleEconomicSrc=fs.readFileSync(root+'sana-v3-cycle-economic-references.js','utf8');
const ddSrc=fs.readFileSync(root+'sana-v3-due-diligence-commercial-reference-gaps.js','utf8');
const plain=v=>JSON.parse(JSON.stringify(v));

for(const [name,src] of [['live',liveSrc],['snapshot',snapshotSrc],['dataroom',dataroomSrc],['cycle-commercial',cycleCommercialSrc],['cycle-economic',cycleEconomicSrc],['dd',ddSrc]])new vm.Script(src,{filename:name});

const commercialCases=[
  {id:'COM-GOOD',lot:'L1',events:[
    {id:'O1',kind:'OFFER_REGISTERED',observedAt:'2026-08-01T08:00:00Z',buyerRef:'BUYER-SECRET',priceRef:10},
    {id:'A1',kind:'OFFTAKE_AGREEMENT_REFERENCE',observedAt:'2026-08-01T09:00:00Z',agreementRef:'AGR-SECRET'},
    {id:'D1',kind:'DELIVERY_DECLARATION',observedAt:'2026-08-02T10:00:00Z',deliveryRef:'HR-H1'},
    {id:'E1',kind:'EVIDENCE',observedAt:'2026-08-02T11:00:00Z',evidenceRef:'EVIDENCE-SECRET',supports:['A1','D1']},
    {id:'I1',kind:'INVOICE_REFERENCE',invoiceRef:'INV-SECRET'},
    {id:'P1',kind:'PAYMENT_STATUS_DECLARED',paymentState:'DECLARED_PAID'},
    {id:'R1',kind:'CASH_RECEIPT_DECLARATION',receiptRef:'REC-SECRET'}
  ],crossDomainRefs:[
    {id:'XH1',kind:'HARVEST_HANDOFF_REFERENCE',sourceDomain:'HARVEST',sourceRef:'HR-H1'},
    {id:'XS1',kind:'HARVEST_SALE_DECLARATION_REFERENCE',sourceDomain:'HARVEST',sourceRef:'HR-S1',commercialRef:'COMMERCIAL-SECRET'},
    {id:'XE1',kind:'ECONOMIC_EVENT_REFERENCE',sourceDomain:'ECONOMICS',sourceRef:'EC-S1',sourceKind:'SALE_DECLARATION'}
  ],integrity:'BASE'},
  {id:'COM-FORWARD',lot:'L1',events:[
    {id:'O-FUT',kind:'OFFER_REGISTERED',observedAt:'2026-08-05T09:00:00Z'},
    {id:'D-FWD',kind:'DELIVERY_DECLARATION',observedAt:'2026-08-05T08:00:00Z',deliveryRef:'HR-FUT'},
    {id:'E-FWD',kind:'EVIDENCE',observedAt:'2026-08-05T07:00:00Z',supports:['O-FUT']}
  ],crossDomainRefs:[
    {id:'XE-NOKIND',kind:'ECONOMIC_EVENT_REFERENCE',sourceDomain:'ECONOMICS',sourceRef:'EC-S1'},
    {id:'X-OTHER',kind:'OTHER_REFERENCE',sourceDomain:'OTHER',sourceRef:'OTHER-1'}
  ],integrity:'BASE'},
  {id:'COM-CROSS',lot:'L2',events:[
    {id:'D-CROSS',kind:'DELIVERY_DECLARATION',observedAt:'2026-08-06T12:00:00Z',deliveryRef:'HR-H1'},
    {id:'E-CROSS',kind:'EVIDENCE',observedAt:'2026-08-06T13:00:00Z',supports:['A1']}
  ],crossDomainRefs:[
    {id:'XH-CROSS',kind:'HARVEST_HANDOFF_REFERENCE',sourceDomain:'HARVEST',sourceRef:'HR-H1'},
    {id:'XE-CROSS',kind:'ECONOMIC_EVENT_REFERENCE',sourceDomain:'ECONOMICS',sourceRef:'EC-S1',sourceKind:'SALE_DECLARATION'},
    {id:'XE-MISMATCH',kind:'ECONOMIC_EVENT_REFERENCE',sourceDomain:'ECONOMICS',sourceRef:'EC-S2',sourceKind:'INVOICE_REFERENCE'}
  ],integrity:'BASE'},
  {id:'COM-LEGACY',lot:'L3',events:[{id:'L1',kind:'OFFER_REGISTERED'}],crossDomainRefs:[],integrity:'BASE'}
];

const base={schema:'SANA_COMMERCIAL_OFFTAKE_LEDGER_V1',cases:()=>structuredClone(commercialCases),forLot:lot=>structuredClone(commercialCases.filter(c=>c.lot===lot)),summary:()=>({schema:'SANA_COMMERCIAL_OFFTAKE_LEDGER_V1',cases:commercialCases.length,integrity:'BASE'}),integrity:'BASE'};
const meta=['COM-GOOD','COM-FORWARD','COM-CROSS'].map((id,i)=>({id:`META-${i}`,type:'commercial-reference-meta',createdAt:`2026-08-10T0${i}:00:00Z`,values:{sourceSchema:base.schema,caseId:id,referenceVersion:'V147'}}));
const harvestCases=[{id:'HR-L1',lot:'L1',events:[
  {id:'HR-H1',kind:'HANDOFF',lot:'L1',observedAt:'2026-08-02T09:00:00Z'},
  {id:'HR-S1',kind:'SALE_DECLARATION',lot:'L1',observedAt:'2026-08-02T12:00:00Z'},
  {id:'HR-FUT',kind:'HANDOFF',lot:'L1',observedAt:'2026-08-05T10:00:00Z'}
]}];
const economicCases=[
  {id:'EC-L1',lot:'L1',events:[{id:'EC-S1',kind:'SALE_DECLARATION',lot:'L1',observedAt:'2026-08-02T14:00:00Z'}]},
  {id:'EC-L2',lot:'L2',events:[{id:'EC-S2',kind:'SALE_DECLARATION',lot:'L2',observedAt:'2026-08-06T14:00:00Z'}]}
];

const liveContext={window:{__SANA_COMMERCIAL_LEDGER__:base,__SANA_HARVEST_LEDGER__:{cases:()=>structuredClone(harvestCases)},__SANA_ECONOMIC_RECONCILIATION__:{cases:()=>structuredClone(economicCases)}},storage:{records:meta},views:{results:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},esc:v=>String(v??''),metric:()=>'',openModal:()=>{},structuredClone,console,Date,Set,Map,Object,Array,Number,String,Math};
vm.createContext(liveContext);vm.runInContext(liveSrc,liveContext);
const api=liveContext.window.__SANA_COMMERCIAL_LEDGER__;
assert.equal(api.referenceVersion,'V147');
assert.equal(api.referenceSemanticsVersion,'V149');

const good=api.forCase('COM-GOOD');
assert.equal(good.referenceCoverage.total,6);
assert.equal(good.referenceCoverage.linked,6);
assert.deepEqual(plain(good.declaredReferenceCoverage),{linked:3,total:3,percent:100,issues:0});
assert.deepEqual(plain(good.derivedCrossDomainCoverage),{linked:3,total:3,percent:100,issues:0});
assert.ok(good.referenceRows.filter(r=>r.origin==='DECLARED_COMMERCIAL_EVENT').every(r=>r.temporalPolicy==='ENFORCED_WHEN_COMPARABLE'));
assert.ok(good.referenceRows.filter(r=>r.origin==='DERIVED_CROSS_DOMAIN_PROJECTION').every(r=>r.temporalPolicy==='NOT_APPLICABLE_NO_DECLARATION_TIMESTAMP'));

const forward=api.forCase('COM-FORWARD');
assert.ok(forward.referenceRows.some(r=>r.sourceEventId==='D-FWD'&&r.reference.status==='FORWARD_REFERENCE'&&r.origin==='DECLARED_COMMERCIAL_EVENT'));
assert.ok(forward.referenceRows.some(r=>r.sourceEventId==='E-FWD'&&r.reference.status==='FORWARD_REFERENCE'&&r.origin==='DECLARED_COMMERCIAL_EVENT'));
assert.ok(forward.referenceRows.some(r=>r.sourceEventId==='XE-NOKIND'&&r.reference.status==='MISSING_EXPECTED_KIND'&&r.origin==='DERIVED_CROSS_DOMAIN_PROJECTION'));
assert.ok(forward.referenceRows.some(r=>r.sourceEventId==='X-OTHER'&&r.reference.status==='UNSUPPORTED_SOURCE_DOMAIN'));

const cross=api.forCase('COM-CROSS');
assert.ok(cross.referenceRows.some(r=>r.sourceEventId==='D-CROSS'&&r.reference.status==='CROSS_SCOPE_REFERENCE'));
assert.ok(cross.referenceRows.some(r=>r.sourceEventId==='E-CROSS'&&r.reference.status==='CROSS_CASE_REFERENCE'));
assert.ok(cross.referenceRows.some(r=>r.sourceEventId==='XH-CROSS'&&r.reference.status==='CROSS_SCOPE_REFERENCE'&&r.origin==='DERIVED_CROSS_DOMAIN_PROJECTION'));
assert.ok(cross.referenceRows.some(r=>r.sourceEventId==='XE-CROSS'&&r.reference.status==='CROSS_SCOPE_REFERENCE'));
assert.ok(cross.referenceRows.some(r=>r.sourceEventId==='XE-MISMATCH'&&r.reference.status==='KIND_MISMATCH'));
assert.equal(api.forCase('COM-LEGACY').referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.match(api.integrity,/DECLARED_COMMERCIAL_REFERENCE ≠ DERIVED_CROSS_DOMAIN_PROJECTION/);
assert.match(api.integrity,/DERIVED_REFERENCE_HAS_NO_DECLARATION_TIMESTAMP/);

const snapshotContext={console,Date,JSON,Object,Array,Number,String,Math,Map,Set,queueMicrotask:f=>f(),window:{__SANA_REPORT_SNAPSHOT_COMMERCIAL__:{enrichCommercial:m=>{m.commercial={rows:[]}}},__SANA_COMMERCIAL_LEDGER__:api},document:{addEventListener:()=>{},getElementById:()=>null},modalAction:null};
vm.createContext(snapshotContext);vm.runInContext(snapshotSrc,snapshotContext);
const manifest1={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F1'}};
snapshotContext.window.__SANA_REPORT_SNAPSHOT_COMMERCIAL_REFERENCES__.enrichCommercialReferences(manifest1);
const captured1=plain(manifest1.commercialReferences);
assert.equal(captured1.referenceSemanticsVersion,'V149');
assert.equal(captured1.granularity,'ADDITIVE_V149 · COMMERCIAL_REFERENCE_PROVENANCE_HARDENED');
assert.ok(captured1.cases.flatMap(c=>c.rows).some(r=>r.origin==='DECLARED_COMMERCIAL_EVENT'));
assert.ok(captured1.cases.flatMap(c=>c.rows).some(r=>r.origin==='DERIVED_CROSS_DOMAIN_PROJECTION'));
assert.equal(captured1.contentLeakCount,0);
const serialized=JSON.stringify(captured1);
for(const forbidden of ['BUYER-SECRET','AGR-SECRET','EVIDENCE-SECRET','INV-SECRET','DECLARED_PAID','REC-SECRET','COMMERCIAL-SECRET','"buyerRef"','"agreementRef"','"invoiceRef"','"paymentState"','"receiptRef"','"evidenceRef"','"commercialRef"'])assert.equal(serialized.includes(forbidden),false,`forbidden payload leaked: ${forbidden}`);

snapshotContext.window.__SANA_COMMERCIAL_LEDGER__={...api,cases:()=>[]};
assert.deepEqual(plain(manifest1.commercialReferences),captured1);

const manifest2=structuredClone(manifest1);
const rowToSwap=manifest2.commercialReferences.cases.find(c=>c.caseId==='COM-GOOD').rows.find(r=>r.kind==='HARVEST_DELIVERY_REF');
rowToSwap.refId='HR-H2';rowToSwap.targetId='HR-H2';
const snapA={id:'S1',reportType:'RPT-DD',cutoff:'2026-08-10',manifest:manifest1};
const snapB={id:'S2',reportType:'RPT-DD',cutoff:'2026-08-11',manifest:manifest2};
const dataContext={window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[snapA,snapB]}},views:{dataroom:()=>''},esc:String,metric:()=>'',console,JSON,Object,Array,Number,String,Math,Map,Set};
vm.createContext(dataContext);vm.runInContext(dataroomSrc,dataContext);
const dataDiff=dataContext.window.__SANA_DATAROOM_COMMERCIAL_REFERENCES__.diff(snapA,snapB);
assert.equal(dataDiff.valid,true);assert.equal(dataDiff.state,'CAPTURED_BOTH');assert.ok(dataDiff.rowChanges>=2,'target swap must produce row remove/add deltas');
assert.ok(dataDiff.changes.some(c=>c.changeKind==='REFERENCE_ROW_REMOVED'));
assert.ok(dataDiff.changes.some(c=>c.changeKind==='REFERENCE_ROW_ADDED'));

const scopeManifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',commercialReferences:{cases:[
  {caseId:'C-L1',lot:'L1',linked:0,total:1,issues:1,declaredCanonicalLinked:0,declaredCanonicalTotal:1,derivedCrossDomainLinked:0,derivedCrossDomainTotal:0,declaredNonCanonicalCount:0,rows:[{targetLot:'L2'}]},
  {caseId:'C-L2',lot:'L2',linked:0,total:1,issues:1,declaredCanonicalLinked:0,declaredCanonicalTotal:1,derivedCrossDomainLinked:0,derivedCrossDomainTotal:0,declaredNonCanonicalCount:0,rows:[{targetLot:'L1'}]}
],contentLeakCount:0},economicReferences:{cases:[
  {caseId:'E-L1',lot:'L1',linked:0,total:1,issues:1,declaredNonCanonicalCount:0,rows:[{refId:'P2',targetLot:'L2'}]},
  {caseId:'E-L2',lot:'L2',linked:0,total:1,issues:1,declaredNonCanonicalCount:0,rows:[{refId:'P1',targetLot:'L1'}]}
],contentLeakCount:0}};
const scopeSnapshot={id:'SS',reportType:'RPT-DD',cutoff:'2026-08-12',manifest:scopeManifest};
const cycleCommon={DEMO:{plans:[{id:'P1',lot:'L1'},{id:'P2',lot:'L2'}]},views:{cycle:()=>''},esc:String,metric:()=>'',console,Object,Array,Number,String,Math,Set,Map};
const cc={...cycleCommon,window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[scopeSnapshot]},__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'P1',lot:'L1'})}}};
vm.createContext(cc);vm.runInContext(cycleCommercialSrc,cc);
const cp1=cc.window.__SANA_CYCLE_COMMERCIAL_REFERENCES__.forPlan('P1');
assert.deepEqual(plain(cp1.cases.map(c=>c.caseId)),['C-L1']);assert.equal(cp1.summary.foreignTargets,1);
assert.deepEqual(plain(cc.window.__SANA_CYCLE_COMMERCIAL_REFERENCES__.forPlan('P2').cases.map(c=>c.caseId)),['C-L2']);
const ec={...cycleCommon,window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[scopeSnapshot]},__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'P1',lot:'L1'})}}};
vm.createContext(ec);vm.runInContext(cycleEconomicSrc,ec);
assert.deepEqual(plain(ec.window.__SANA_CYCLE_ECONOMIC_REFERENCES__.forPlan('P1').cases.map(c=>c.caseId)),['E-L1']);
assert.deepEqual(plain(ec.window.__SANA_CYCLE_ECONOMIC_REFERENCES__.forPlan('P2').cases.map(c=>c.caseId)),['E-L2']);

const ddManifest=structuredClone(manifest1);
const fwdCase=ddManifest.commercialReferences.cases.find(c=>c.caseId==='COM-FORWARD');
assert.ok(fwdCase.rows.some(r=>r.origin==='DECLARED_COMMERCIAL_EVENT'&&r.status==='FORWARD_REFERENCE'));
assert.ok(fwdCase.rows.some(r=>r.origin==='DERIVED_CROSS_DOMAIN_PROJECTION'&&r.status==='MISSING_EXPECTED_KIND'));
const ddContext={console,Object,Array,Number,String,Math,Set,window:{__SANA_DUE_DILIGENCE_GAPS__:{schema:'BASE',latest:()=>({manifest:ddManifest}),derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:{manifest:ddManifest},gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})}},views:{reports:()=>''},esc:String};
vm.createContext(ddContext);vm.runInContext(ddSrc,ddContext);
const gaps=ddContext.window.__SANA_DD_COMMERCIAL_REFERENCE_GAPS__.derive({manifest:ddManifest});
assert.ok(gaps.some(g=>/FORWARD_REFERENCE/.test(g.condition)&&/REFERENCIA DECLARADA/.test(g.detail)));
assert.ok(gaps.some(g=>/MISSING_EXPECTED_KIND/.test(g.condition)&&/PROYECCIÓN CROSS-DOMAIN DERIVADA/.test(g.detail)));
assert.equal(gaps.some(g=>g.id.includes('COM-LEGACY')),false);

assert.doesNotMatch(cycleCommercialSrc,/targetLot===plan\.lot|\.some\([^\n]*targetLot/);
assert.doesNotMatch(cycleEconomicSrc,/targetLot===plan\.lot|refId===plan\.id|\.some\([^\n]*targetLot/);
assert.match(cycleCommercialSrc,/SOURCE CASE LOT DEFINES CYCLE MEMBERSHIP/);
assert.match(cycleEconomicSrc,/SOURCE CASE LOT DEFINES CYCLE MEMBERSHIP/);
assert.match(dataroomSrc,/ROW_LEVEL_STRUCTURAL_DIFF/);
assert.doesNotMatch(dataroomSrc,/__SANA_COMMERCIAL_LEDGER__|localStorage|storage\?\.records/);
assert.doesNotMatch(cycleCommercialSrc,/__SANA_COMMERCIAL_LEDGER__|localStorage|storage\?\.records/);
assert.doesNotMatch(cycleEconomicSrc,/__SANA_ECONOMIC_RECONCILIATION__|localStorage|storage\?\.records/);

console.log('SANA Reference Scope & Historical Delta Hardening V149: OK');
