import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotSrc=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-source-evidence-references.js','utf8');
const dataroomSrc=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-source-evidence-references.js','utf8');
const cycleSrc=fs.readFileSync('apps/control-web/public/sana-v3-cycle-source-evidence-references.js','utf8');
const ddSrc=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-source-evidence-reference-gaps.js','utf8');

const sourceCases=[
  {id:'SRC-1',provider:'SHOULD_NOT_LEAK',name:'SHOULD_NOT_LEAK',externalId:'SHOULD_NOT_LEAK',scope:'L1',fingerprint:'SHOULD_NOT_LEAK',reviewOutcome:'SHOULD_NOT_LEAK',reviewerRole:'SHOULD_NOT_LEAK',referenceState:'CAPTURED_V143',referenceVersion:'V143',referenceCoverage:{linked:2,total:2,percent:100},referenceIssues:0,referenceRows:[
    {sourceEventId:'U1',sourceKind:'USE_DECLARED',kind:'USE_TARGET',useType:'PLAN_CONTEXT',refId:'P1',reference:{status:'LINKED',domain:'PLAN',target:{id:'P1',lot:'L1',name:'SHOULD_NOT_LEAK'},targetScope:'L1'}},
    {sourceEventId:'E1',sourceKind:'EVIDENCE',kind:'EVIDENCE_REF',useType:'',refId:'EV1',reference:{status:'LINKED',domain:'EVIDENCE',target:{id:'EV1',lot:'L1',detail:'SHOULD_NOT_LEAK'},targetScope:'L1'}}
  ]},
  {id:'SRC-2',provider:'SHOULD_NOT_LEAK',name:'SHOULD_NOT_LEAK',scope:'L1',referenceState:'CAPTURED_V143',referenceVersion:'V143',referenceCoverage:{linked:0,total:1,percent:0},referenceIssues:1,referenceRows:[
    {sourceEventId:'U2',sourceKind:'USE_DECLARED',kind:'USE_TARGET',useType:'INPUT_CONTEXT',refId:'MISSING',reference:{status:'MISSING_TARGET',domain:'FORECAST',target:null,targetScope:''}}
  ]},
  {id:'SRC-3',provider:'SHOULD_NOT_LEAK',name:'SHOULD_NOT_LEAK',scope:'L2',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:'',referenceCoverage:{linked:0,total:0,percent:null},referenceIssues:0,referenceRows:[]}
];

const views={dataroom:()=>'',cycle:()=>'',reports:()=>''};
const sandbox={window:{
  __SANA_SOURCE_EVIDENCE_LEDGER__:{referenceVersion:'V143',cases:()=>sourceCases.map(c=>structuredClone(c))},
  __SANA_REPORT_SNAPSHOT_SOURCE_EVIDENCE__:{enrichSourceEvidence:m=>{m.sourceEvidence={rows:[],rowCount:0,contentState:'CONTENT_NOT_COPIED_REFERENCE_METADATA_ONLY'};return m}}
},document:{addEventListener:()=>{},getElementById:()=>null},views,DEMO:{plans:[{id:'P1',lot:'L1',version:1}],farm:{id:'F1'}},modalAction:null,queueMicrotask:fn=>fn(),esc:v=>String(v??''),metric:()=>'',console,Date,JSON,structuredClone};
vm.createContext(sandbox);vm.runInContext(snapshotSrc,sandbox);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F1'}};
sandbox.window.__SANA_REPORT_SNAPSHOT_SOURCE_EVIDENCE_REFERENCES__.enrichSourceEvidenceReferences(manifest);
assert.ok(manifest.sourceEvidenceReferences);
assert.equal(manifest.sourceEvidenceReferences.capturedCount,2);
assert.equal(manifest.sourceEvidenceReferences.legacyCount,1);
assert.equal(manifest.sourceEvidenceReferences.linked,2);
assert.equal(manifest.sourceEvidenceReferences.expected,3);
assert.equal(manifest.sourceEvidenceReferences.issueCount,1);
assert.equal(manifest.sourceEvidenceReferences.contentLeakCount,0);
const serialized=JSON.stringify(manifest.sourceEvidenceReferences);
for(const forbidden of ['provider','externalId','fingerprint','reviewOutcome','reviewerRole','SHOULD_NOT_LEAK'])assert.equal(serialized.includes(forbidden),false,`content leak: ${forbidden}`);
assert.equal(manifest.sourceEvidenceReferences.cases.find(c=>c.sourceId==='SRC-3').total,0);

const snap={id:'S1',reportType:'RPT-DD',cutoff:'2026-08-20',manifest};
sandbox.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[snap]};
sandbox.window.__SANA_CYCLE_CLOSURE__={selectedPlan:()=>({id:'P1'})};
vm.runInContext(dataroomSrc,sandbox);
assert.equal(sandbox.window.__SANA_DATAROOM_SOURCE_EVIDENCE_REFERENCES__.state().state,'CAPTURED');
vm.runInContext(cycleSrc,sandbox);
const cycle=sandbox.window.__SANA_CYCLE_SOURCE_EVIDENCE_REFERENCES__.selected();
assert.equal(cycle.state,'CAPTURED');
assert.equal(cycle.summary.issues,1);
assert.equal(cycle.summary.expected,3);

const baseDD={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snap,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:snap,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
sandbox.window.__SANA_DUE_DILIGENCE_GAPS__=baseDD;
vm.runInContext(ddSrc,sandbox);
const extra=sandbox.window.__SANA_DD_SOURCE_EVIDENCE_REFERENCE_GAPS__.derive(snap);
assert.equal(extra.length,1);
assert.match(extra[0].condition,/MISSING_TARGET/);
assert.equal(sandbox.window.__SANA_DD_SOURCE_EVIDENCE_REFERENCE_GAPS__.derive({manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}}).length,0);
assert.match(sandbox.window.__SANA_CYCLE_SOURCE_EVIDENCE_REFERENCES__.integrity,/NON_WEIGHTED/);
assert.match(sandbox.window.__SANA_DATAROOM_SOURCE_EVIDENCE_REFERENCES__.integrity,/NO_LIVE_FALLBACK/);
assert.equal(dataroomSrc.includes('__SANA_SOURCE_EVIDENCE_LEDGER__'),false);
assert.equal(cycleSrc.includes('__SANA_SOURCE_EVIDENCE_LEDGER__'),false);
assert.equal(ddSrc.includes('__SANA_SOURCE_EVIDENCE_LEDGER__'),false);
console.log('source evidence reference provenance V144: ok');
