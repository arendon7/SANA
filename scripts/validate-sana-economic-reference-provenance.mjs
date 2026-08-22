import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root='apps/control-web/public/';
const snap=fs.readFileSync(root+'sana-v3-report-snapshot-economic-references.js','utf8');
const data=fs.readFileSync(root+'sana-v3-dataroom-economic-references.js','utf8');
const cycle=fs.readFileSync(root+'sana-v3-cycle-economic-references.js','utf8');
const dd=fs.readFileSync(root+'sana-v3-due-diligence-economic-reference-gaps.js','utf8');

for(const [name,src] of [['snapshot',snap],['dataroom',data],['cycle',cycle],['dd',dd]])new vm.Script(src,{filename:name});
assert.match(data,/NO_LIVE_FALLBACK/);assert.doesNotMatch(data,/__SANA_ECONOMIC_RECONCILIATION__|localStorage|storage\?\.records/);
assert.match(cycle,/NON_WEIGHTED/);assert.match(cycle,/NO_LIVE_FALLBACK/);assert.doesNotMatch(cycle,/__SANA_ECONOMIC_RECONCILIATION__|localStorage|storage\?\.records/);
assert.match(dd,/NOT_CAPTURED_OR_LEGACY ≠ GAP/);assert.match(dd,/DECLARED_NON_CANONICAL_REFERENCE ≠ GAP/);assert.doesNotMatch(dd,/__SANA_ECONOMIC_RECONCILIATION__|localStorage|storage\?\.records/);

const listeners={};
const context={
  console,Date,JSON,Object,Array,Number,String,Math,Map,Set,
  queueMicrotask:fn=>fn(),
  window:{
    __SANA_REPORT_SNAPSHOT_ECONOMIC_RECONCILIATION__:{enrichEconomicReconciliation:m=>{m.economicReconciliation={rows:[]}}},
    __SANA_ECONOMIC_RECONCILIATION__:{
      referenceVersion:'V145',
      cases:()=>[
        {id:'ECON-A',lot:'LOT-A',referenceVersion:'V145',referenceState:'CAPTURED_V145',referenceCoverage:{linked:2,total:3,percent:67},referenceIssues:1,declaredReferenceRows:[{kind:'INVOICE_REF_DECLARED',refId:'SECRET-INVOICE'}],referenceRows:[
          {sourceEventId:'C1',sourceKind:'COST_DECLARED',kind:'PLAN_REF',refId:'PL-1',reference:{status:'LINKED',domain:'PLAN',target:{id:'PL-1',lot:'LOT-A',detail:'must-not-leak'}}},
          {sourceEventId:'C1',sourceKind:'COST_DECLARED',kind:'ACTIVITY_REF',refId:'ACT-1',reference:{status:'LINKED',domain:'ACTIVITY',target:{id:'ACT-1',lot:'LOT-A'}}},
          {sourceEventId:'E1',sourceKind:'EVIDENCE_REFERENCE',kind:'COST_SUPPORT_REF',refId:'MISSING',reference:{status:'MISSING_TARGET',domain:'ECONOMIC_EVENT',target:null}}
        ],amount:999,currency:'COP',invoiceRef:'SECRET-INVOICE'},
        {id:'ECON-LEGACY',lot:'LOT-B',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked:0,total:0,percent:null},referenceIssues:0,declaredReferenceRows:[],referenceRows:[]}
      ]
    }
  },
  document:{addEventListener:(type,fn)=>{listeners[type]=fn},getElementById:()=>null},
  modalAction:null
};
vm.createContext(context);vm.runInContext(snap,context);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};
context.window.__SANA_REPORT_SNAPSHOT_ECONOMIC_REFERENCES__.enrichEconomicReferences(manifest);
const d=manifest.economicReferences;
assert.equal(d.capturedCount,1);assert.equal(d.legacyCount,1);assert.equal(d.linked,2);assert.equal(d.expected,3);assert.equal(d.issueCount,1);assert.equal(d.declaredNonCanonicalCount,1);assert.equal(d.contentLeakCount,0);
assert.equal(d.cases[0].declaredNonCanonicalCount,1);assert.equal(d.cases[0].rows.length,3);
assert.equal(d.cases[0].rows[0].targetId,'PL-1');
const serialized=JSON.stringify(d);
for(const forbidden of ['SECRET-INVOICE','must-not-leak','"amount"','"currency"','"invoiceRef"','"paymentState"','"saleRef"','"receiptRef"','"evidenceRef"'])assert.equal(serialized.includes(forbidden),false,`forbidden payload leaked: ${forbidden}`);
assert.ok(serialized.includes('REFERENCE_STRUCTURE_ONLY'));

const ddContext={console,Object,Array,Number,String,Math,Set,window:{__SANA_DUE_DILIGENCE_GAPS__:{schema:'BASE',latest:()=>({manifest}),derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:{manifest},gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})}},views:{reports:()=>''},esc:String};
vm.createContext(ddContext);vm.runInContext(dd,ddContext);
const gaps=ddContext.window.__SANA_DD_ECONOMIC_REFERENCE_GAPS__.derive({manifest});
assert.equal(gaps.length,1);assert.match(gaps[0].condition,/MISSING_TARGET/);
assert.equal(gaps.some(g=>g.id.includes('legacy')),false);

console.log('SANA Economic Reference Provenance V146: OK');
