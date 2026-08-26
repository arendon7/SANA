import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const paths={
  snapshot:'apps/control-web/public/sana-v3-report-snapshot-capture-sync-references.js',
  dataroom:'apps/control-web/public/sana-v3-dataroom-capture-sync-references.js',
  cycle:'apps/control-web/public/sana-v3-cycle-capture-sync-references.js',
  dd:'apps/control-web/public/sana-v3-due-diligence-capture-sync-reference-gaps.js'
};
const src=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,read(p)]));

const syncCases=[
  {
    id:'SYNC1',lot:'L1',recordType:'sensor',referenceState:'CAPTURED_V152',referenceVersion:'V152',referenceSemanticsVersion:'V152',
    referenceCoverage:{linked:1,total:2,percent:50},referenceIssues:1,
    referenceRows:[
      {sourceEventId:'CASE',sourceKind:'CASE',kind:'RECORD_REF',refId:'DTR1',origin:'DECLARED_CAPTURE_SYNC_CASE',temporalPolicy:'NOT_APPLICABLE',reference:{status:'LINKED',domain:'DATA_TRUST',targetId:'DTR1',targetLot:'L1',targetClass:'SENSOR_DEMO',targetAckState:'SERVER_ACK_DEMO_EXPLICIT',targetConflictState:'NONE'}},
      {sourceEventId:'ACK1',sourceKind:'SERVER_ACK_DEMO_EXPLICIT',kind:'ACK_COHERENCE_REF',refId:'ACK-X',origin:'DECLARED_CAPTURE_SYNC_EVENT',temporalPolicy:'WHEN_BOTH_TIMESTAMPS_PARSE',reference:{status:'CROSS_SCOPE_REFERENCE',domain:'DATA_TRUST_ACK',targetId:'DTR9',targetLot:'L9',targetClass:'SENSOR_DEMO',targetAckState:'SERVER_ACK_DEMO_EXPLICIT',targetConflictState:'NONE'}}
    ],
    declaredReferenceRows:[{sourceEventId:'EV1',sourceKind:'EVIDENCE',kind:'EVIDENCE_REF_DECLARED',field:'evidenceRef',status:'DECLARED_NON_CANONICAL_REFERENCE',valueExposed:false,secretValue:'EV-SECRET'}],
    declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',
    value:999,measurement:88,sourceRef:'PRIVATE-SOURCE',candidateRefs:['PRIVATE-CANDIDATE'],detail:'PRIVATE-DETAIL'
  },
  {id:'SYNC2',lot:'L2',recordType:'import',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:'',referenceSemanticsVersion:'V152',referenceCoverage:{linked:0,total:0,percent:null},referenceIssues:0,referenceRows:[],declaredReferenceRows:[],declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED'}
];
const syncApi={referenceVersion:'V152',referenceSemanticsVersion:'V152',cases:()=>syncCases.map(c=>structuredClone(c))};
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FARM1'}};
const snapshotSandbox={
  window:{__SANA_CAPTURE_SYNC_LEDGER__:syncApi,__SANA_REPORT_SNAPSHOT_CAPTURE_SYNC__:{enrichCaptureSync:m=>(m.captureSync={legacyRichBlock:true},m)}},
  document:{addEventListener:()=>{},getElementById:()=>null},queueMicrotask:fn=>fn(),structuredClone,console,Date,Object,Array,Number,String,Math,Set,Map,JSON
};
vm.createContext(snapshotSandbox);vm.runInContext(src.snapshot,snapshotSandbox);
snapshotSandbox.window.__SANA_REPORT_SNAPSHOT_CAPTURE_SYNC_REFERENCES__.enrichCaptureSyncReferences(manifest);
const refs=manifest.captureSyncReferences;
assert.ok(manifest.captureSync?.legacyRichBlock);
assert.ok(refs);assert.equal(refs.sourceReferenceVersion,'V152');assert.equal(refs.capturedCount,1);assert.equal(refs.legacyCount,1);assert.equal(refs.linked,1);assert.equal(refs.expected,2);assert.equal(refs.issueCount,1);assert.equal(refs.declaredNonCanonicalCount,1);assert.equal(refs.contentLeakCount,0);
assert.equal(refs.cases[0].declaredReferenceCounts.EVIDENCE_REF_DECLARED,1);
assert.equal(refs.cases[0].rows[1].targetLot,'L9');
assert.equal(refs.cases[0].rows[0].targetClass,'SENSOR_DEMO');
const serialized=JSON.stringify(refs);
for(const secret of ['EV-SECRET','PRIVATE-SOURCE','PRIVATE-CANDIDATE','PRIVATE-DETAIL','999','"measurement"','"sourceRef"','"candidateRefs"','"evidenceRef"'])assert.ok(!serialized.includes(secret),`leaked ${secret}`);

const snapA={id:'S1',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(manifest)};
const snapB=structuredClone(snapA);snapB.id='S2';snapB.cutoff='2026-08-02';snapB.manifest.captureSyncReferences.cases[0].rows[0].status='MISSING_TARGET';snapB.manifest.captureSyncReferences.cases[0].declaredReferenceCounts.EVIDENCE_REF_DECLARED=2;snapB.manifest.captureSyncReferences.cases[0].declaredNonCanonicalCount=2;
const drSandbox={window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[snapB,snapA]}},views:{dataroom:()=>''},esc:v=>String(v??''),metric:()=>'',console,Date,Map,Set,Object,Array,Number,String,Math,JSON};
vm.createContext(drSandbox);vm.runInContext(src.dataroom,drSandbox);
const diff=drSandbox.window.__SANA_DATAROOM_CAPTURE_SYNC_REFERENCES__.diff(snapA,snapB);
assert.equal(diff.valid,true);assert.equal(diff.state,'CAPTURED_BOTH');assert.equal(diff.rowChanges,2);assert.ok(diff.declaredCountChanges>=1);assert.ok(diff.changes.some(c=>c.changeKind==='REFERENCE_ROW_REMOVED'));assert.ok(diff.changes.some(c=>c.changeKind==='REFERENCE_ROW_ADDED'));
const oldSnap={id:'OLD',reportType:'RPT-DD',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};assert.equal(drSandbox.window.__SANA_DATAROOM_CAPTURE_SYNC_REFERENCES__.diff(oldSnap,snapB).state,'PARTIAL_GRANULARITY');

const cycleSandbox={window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[snapA]},__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'P1',lot:'L1'})}},DEMO:{plans:[{id:'P1',lot:'L1'},{id:'P2',lot:'L2'}]},views:{cycle:()=>''},esc:v=>String(v??''),metric:()=>'',console,Date,Object,Array,Number,String,Math,Set,Map};
vm.createContext(cycleSandbox);vm.runInContext(src.cycle,cycleSandbox);
const cyc=cycleSandbox.window.__SANA_CYCLE_CAPTURE_SYNC_REFERENCES__.forPlan('P1');
assert.equal(cyc.state,'CAPTURED');assert.equal(cyc.cases.length,1);assert.equal(cyc.cases[0].caseId,'SYNC1');assert.equal(cyc.summary.foreignTargets,1);assert.equal(cyc.summary.linked,1);assert.equal(cyc.summary.expected,2);
const cyc2=cycleSandbox.window.__SANA_CYCLE_CAPTURE_SYNC_REFERENCES__.forPlan('P2');assert.equal(cyc2.cases.length,1);assert.equal(cyc2.cases[0].referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');

const ddBase={schema:'BASE',latest:()=>snapA,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:snapA,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
const ddSandbox={window:{__SANA_DUE_DILIGENCE_GAPS__:ddBase},views:{reports:()=>''},esc:v=>String(v??''),console,Date,Object,Array,Number,String,Math,Set,Map};
vm.createContext(ddSandbox);vm.runInContext(src.dd,ddSandbox);
const gaps=ddSandbox.window.__SANA_DD_CAPTURE_SYNC_REFERENCE_GAPS__.derive(snapA);
assert.equal(gaps.length,1);assert.match(gaps[0].condition,/CROSS_SCOPE_REFERENCE/);assert.equal(gaps[0].severity,'ALTA');
const noRef={...snapA,manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};assert.equal(ddSandbox.window.__SANA_DD_CAPTURE_SYNC_REFERENCE_GAPS__.derive(noRef).length,0);
const leak=structuredClone(snapA);leak.manifest.captureSyncReferences.contentLeakCount=1;assert.equal(ddSandbox.window.__SANA_DD_CAPTURE_SYNC_REFERENCE_GAPS__.derive(leak).length,2);

for(const consumer of ['dataroom','cycle','dd']){
  assert.ok(!src[consumer].includes('__SANA_CAPTURE_SYNC_LEDGER__'),`${consumer} live capture sync fallback`);
  assert.ok(!src[consumer].includes('__SANA_DATA_TRUST__'),`${consumer} live data trust fallback`);
  assert.ok(!src[consumer].includes('localStorage'),`${consumer} localStorage fallback`);
  assert.ok(!src[consumer].includes('storage?.records'),`${consumer} storage fallback`);
}
assert.match(src.cycle,/NON_WEIGHTED/);assert.match(src.cycle,/SOURCE CASE LOT DEFINES CYCLE MEMBERSHIP/);assert.match(src.dd,/NOT_CAPTURED_OR_LEGACY ≠ GAP/);assert.match(src.dd,/DECLARED_NON_CANONICAL_REFERENCE ≠ GAP/);assert.match(src.dataroom,/ROW_LEVEL_STRUCTURAL_DIFF/);assert.match(src.dataroom,/REFERENCE_CHANGE ≠ SYNC_CHANGE ≠ SOURCE_TRUTH_CHANGE/);
console.log('capture sync reference provenance V153: ok');
