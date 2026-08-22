import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotSrc=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-labor-references.js','utf8');
const dataroomSrc=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-labor-references.js','utf8');
const cycleSrc=fs.readFileSync('apps/control-web/public/sana-v3-cycle-labor-references.js','utf8');
const ddSrc=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-labor-reference-gaps.js','utf8');

const laborCases=[
  {id:'C1',role:'Operario',lot:'L1',activityId:'A1',referenceState:'CAPTURED_V141',referenceVersion:'V141',referenceCoverage:{linked:2,total:2,percent:100},referenceIssues:0,referenceRows:[
    {sourceEventId:'W1',sourceKind:'WORKED_TIME',kind:'ACTIVITY',refId:'A1',reference:{status:'LINKED',domain:'ACTIVITY',target:{id:'A1',lot:'L1',personRef:'SHOULD_NOT_LEAK'}}},
    {sourceEventId:'E1',sourceKind:'EVIDENCE',kind:'EVIDENCE_REF',refId:'EV1',reference:{status:'LINKED',domain:'EVIDENCE',target:{id:'EV1',lot:'L1',owner:'SHOULD_NOT_LEAK'}}}
  ],declaredNonCanonicalReferences:[{kind:'PAYMENT_REF',refId:'PAY-X'}]},
  {id:'C2',role:'Técnico',lot:'L1',activityId:'A2',referenceState:'CAPTURED_V141',referenceVersion:'V141',referenceCoverage:{linked:1,total:2,percent:50},referenceIssues:1,referenceRows:[
    {sourceEventId:'W2',sourceKind:'WORKED_TIME',kind:'ACTIVITY',refId:'A2',reference:{status:'LINKED',domain:'ACTIVITY',target:{id:'A2',lot:'L1'}}},
    {sourceEventId:'E2',sourceKind:'EVIDENCE',kind:'EVIDENCE_REF',refId:'MISSING',reference:{status:'MISSING_TARGET',domain:'EVIDENCE',target:null}}
  ],declaredNonCanonicalReferences:[{kind:'RATE_SOURCE_REF',refId:'RATE-X'}]},
  {id:'C3',role:'Legacy',lot:'L2',activityId:'A3',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:'',referenceCoverage:{linked:0,total:0,percent:null},referenceIssues:0,referenceRows:[],declaredNonCanonicalReferences:[]}
];

const views={dataroom:()=>'',cycle:()=>'',reports:()=>''};
const sandbox={window:{
  __SANA_LABOR_LEDGER__:{referenceVersion:'V141',cases:()=>laborCases.map(c=>structuredClone(c))},
  __SANA_REPORT_SNAPSHOT_LABOR__:{enrichLabor:m=>{m.labor={privacyState:'IDENTITY_REDACTED',cases:[]};return m}}
},document:{addEventListener:()=>{},getElementById:()=>null},views,DEMO:{plans:[{id:'P1',lot:'L1',version:1}]},modalAction:null,queueMicrotask:fn=>fn(),esc:v=>String(v??''),metric:()=>'',console,Date,JSON,structuredClone};
vm.createContext(sandbox);vm.runInContext(snapshotSrc,sandbox);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F1'}};
sandbox.window.__SANA_REPORT_SNAPSHOT_LABOR_REFERENCES__.enrichLaborReferences(manifest);
assert.ok(manifest.laborReferences);
assert.equal(manifest.laborReferences.capturedCount,2);
assert.equal(manifest.laborReferences.legacyCount,1);
assert.equal(manifest.laborReferences.linked,3);
assert.equal(manifest.laborReferences.expected,4);
assert.equal(manifest.laborReferences.issueCount,1);
assert.equal(manifest.laborReferences.declaredNonCanonicalReferenceCount,2);
assert.equal(manifest.laborReferences.privacyLeakCount,0);
const serialized=JSON.stringify(manifest.laborReferences);
for(const forbidden of ['personRef','personLabel','owner','reviewer','SHOULD_NOT_LEAK','PAY-X','RATE-X'])assert.equal(serialized.includes(forbidden),false,`privacy/noncanonical leak: ${forbidden}`);
assert.equal(manifest.laborReferences.cases.find(c=>c.caseId==='C3').total,0);

const snap={id:'S1',reportType:'RPT-DD',cutoff:'2026-08-20',manifest};
sandbox.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[snap]};
sandbox.window.__SANA_CYCLE_CLOSURE__={selectedPlan:()=>({id:'P1'})};
vm.runInContext(dataroomSrc,sandbox);
assert.equal(sandbox.window.__SANA_DATAROOM_LABOR_REFERENCES__.state().state,'CAPTURED');
vm.runInContext(cycleSrc,sandbox);
const cycle=sandbox.window.__SANA_CYCLE_LABOR_REFERENCES__.selected();
assert.equal(cycle.state,'CAPTURED');
assert.equal(cycle.summary.issues,1);
assert.equal(cycle.summary.expected,4);

const baseDD={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snap,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:snap,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
sandbox.window.__SANA_DUE_DILIGENCE_GAPS__=baseDD;
vm.runInContext(ddSrc,sandbox);
const extra=sandbox.window.__SANA_DD_LABOR_REFERENCE_GAPS__.derive(snap);
assert.equal(extra.length,1);
assert.match(extra[0].condition,/MISSING_TARGET/);
assert.equal(sandbox.window.__SANA_DD_LABOR_REFERENCE_GAPS__.derive({manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}}).length,0);
assert.match(sandbox.window.__SANA_CYCLE_LABOR_REFERENCES__.integrity,/NON_WEIGHTED/);
assert.match(sandbox.window.__SANA_DATAROOM_LABOR_REFERENCES__.integrity,/NO_LIVE_FALLBACK/);
console.log('labor reference provenance V142: ok');
