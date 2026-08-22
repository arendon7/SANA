import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root='apps/control-web/public/';
const snap=fs.readFileSync(root+'sana-v3-report-snapshot-commercial-references.js','utf8');
const data=fs.readFileSync(root+'sana-v3-dataroom-commercial-references.js','utf8');
const cycle=fs.readFileSync(root+'sana-v3-cycle-commercial-references.js','utf8');
const dd=fs.readFileSync(root+'sana-v3-due-diligence-commercial-reference-gaps.js','utf8');
for(const [n,s] of [['snapshot',snap],['dataroom',data],['cycle',cycle],['dd',dd]])new vm.Script(s,{filename:n});
assert.match(data,/NO_LIVE_FALLBACK/);assert.doesNotMatch(data,/__SANA_COMMERCIAL_LEDGER__|localStorage|storage\?\.records/);
assert.match(cycle,/NON_WEIGHTED/);assert.match(cycle,/NO_LIVE_FALLBACK/);assert.doesNotMatch(cycle,/__SANA_COMMERCIAL_LEDGER__|localStorage|storage\?\.records/);
assert.match(dd,/NOT_CAPTURED_OR_LEGACY ≠ GAP/);assert.match(dd,/DECLARED_NON_CANONICAL_REFERENCE ≠ GAP/);assert.doesNotMatch(dd,/__SANA_COMMERCIAL_LEDGER__|localStorage|storage\?\.records/);
const context={console,Date,JSON,Object,Array,Number,String,Math,Map,Set,queueMicrotask:f=>f(),window:{__SANA_REPORT_SNAPSHOT_COMMERCIAL__:{enrichCommercial:m=>{m.commercial={rows:[]}}},__SANA_COMMERCIAL_LEDGER__:{referenceVersion:'V147',cases:()=>[
 {id:'COM-A',lot:'L1',referenceVersion:'V147',referenceState:'CAPTURED_V147',referenceCoverage:{linked:2,total:3,percent:67},referenceIssues:1,declaredReferenceRows:[{kind:'BUYER_REF_DECLARED',refId:'SECRET-BUYER'},{kind:'INVOICE_REF_DECLARED',refId:'SECRET-INVOICE'}],referenceRows:[
  {sourceEventId:'E1',sourceKind:'EVIDENCE',kind:'COMMERCIAL_SUPPORT_REF',refId:'A1',reference:{status:'LINKED',domain:'COMMERCIAL_EVENT',target:{id:'A1',kind:'OFFTAKE_AGREEMENT_REFERENCE',lot:'L1',buyerRef:'SECRET-BUYER'}}},
  {sourceEventId:'D1',sourceKind:'DELIVERY_DECLARATION',kind:'HARVEST_DELIVERY_REF',refId:'HR-D1',reference:{status:'LINKED',domain:'HARVEST',target:{id:'HR-D1',kind:'HANDOFF',lot:'L1'}}},
  {sourceEventId:'X1',sourceKind:'ECONOMIC_EVENT_REFERENCE',kind:'CROSS_DOMAIN_REF',refId:'NOPE',sourceDomain:'ECONOMICS',sourceKindExpected:'SALE_DECLARATION',reference:{status:'MISSING_TARGET',domain:'ECONOMICS',target:null}}
 ]},
 {id:'COM-L',lot:'L2',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked:0,total:0,percent:null},referenceIssues:0,declaredReferenceRows:[],referenceRows:[]}
]}} ,document:{addEventListener:()=>{},getElementById:()=>null},modalAction:null};
vm.createContext(context);vm.runInContext(snap,context);const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};context.window.__SANA_REPORT_SNAPSHOT_COMMERCIAL_REFERENCES__.enrichCommercialReferences(manifest);const d=manifest.commercialReferences;
assert.equal(d.capturedCount,1);assert.equal(d.legacyCount,1);assert.equal(d.linked,2);assert.equal(d.expected,3);assert.equal(d.issueCount,1);assert.equal(d.declaredNonCanonicalCount,2);assert.equal(d.contentLeakCount,0);assert.equal(d.cases[0].rows[0].targetId,'A1');
const serialized=JSON.stringify(d);for(const forbidden of ['SECRET-BUYER','SECRET-INVOICE','"buyerRef"','"agreementRef"','"priceRef"','"invoiceRef"','"paymentState"','"receiptRef"','"evidenceRef"','"commercialRef"'])assert.equal(serialized.includes(forbidden),false,`forbidden V148 payload leaked: ${forbidden}`);
const ddContext={console,Object,Array,Number,String,Math,Set,window:{__SANA_DUE_DILIGENCE_GAPS__:{schema:'BASE',latest:()=>({manifest}),derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:{manifest},gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})}},views:{reports:()=>''},esc:String};vm.createContext(ddContext);vm.runInContext(dd,ddContext);const gaps=ddContext.window.__SANA_DD_COMMERCIAL_REFERENCE_GAPS__.derive({manifest});assert.equal(gaps.length,1);assert.match(gaps[0].condition,/MISSING_TARGET/);assert.equal(gaps.some(g=>g.id.includes('legacy')),false);
console.log('SANA Commercial Reference Provenance V148: OK');
