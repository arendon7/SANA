import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const paths={
  snapshot:'apps/control-web/public/sana-v3-report-snapshot-capital-governance-references.js',
  dataroom:'apps/control-web/public/sana-v3-dataroom-capital-governance-references.js',
  cycle:'apps/control-web/public/sana-v3-cycle-capital-governance-references.js',
  dd:'apps/control-web/public/sana-v3-due-diligence-capital-governance-reference-gaps.js'
};
const src=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,read(p)]));

const capCases=[
  {
    id:'CAP1',lot:'L1',referenceState:'CAPTURED_V150',referenceVersion:'V150',referenceSemanticsVersion:'V150',
    referenceCoverage:{linked:1,total:2,percent:50},referenceIssues:1,
    referenceRows:[
      {sourceEventId:'E1',sourceKind:'EVIDENCE',kind:'CAPITAL_SUPPORT_REF',refId:'T1',origin:'DECLARED_CAPITAL_EVENT',temporalPolicy:'WHEN_BOTH_TIMESTAMPS_PARSE',reference:{status:'LINKED',domain:'CAPITAL_GOVERNANCE_EVENT',targetId:'T1',targetKind:'TERM_SHEET_REFERENCE',targetLot:'L1'}},
      {sourceEventId:'E2',sourceKind:'EVIDENCE',kind:'CAPITAL_SUPPORT_REF',refId:'X1',origin:'DECLARED_CAPITAL_EVENT',temporalPolicy:'WHEN_BOTH_TIMESTAMPS_PARSE',reference:{status:'CROSS_SCOPE_REFERENCE',domain:'CAPITAL_GOVERNANCE_EVENT',targetId:'X1',targetKind:'COMMITMENT_REFERENCE',targetLot:'L9'}}
    ],
    declaredReferenceRows:[
      {sourceEventId:'T1',sourceKind:'TERM_SHEET_REFERENCE',kind:'TERM_SHEET_REF_DECLARED',field:'termSheetRef',status:'DECLARED_NON_CANONICAL_REFERENCE',valueExposed:false,secretValue:'TS-SECRET'},
      {sourceEventId:'F1',sourceKind:'FUNDING_STATUS_DECLARED',kind:'FUNDING_REF_DECLARED',field:'fundingRef',status:'DECLARED_NON_CANONICAL_REFERENCE',valueExposed:false,secretValue:'FUND-SECRET'}
    ],
    declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED',
    counterpartyRef:'CP-SECRET',amount:999999,currency:'COP',useOfFunds:'SECRET USE'
  },
  {id:'CAP2',lot:'L2',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceVersion:'',referenceSemanticsVersion:'V150',referenceCoverage:{linked:0,total:0,percent:null},referenceIssues:0,referenceRows:[],declaredReferenceRows:[{kind:'COUNTERPARTY_REF_DECLARED',valueExposed:false,secretValue:'CP2-SECRET'}],declaredReferenceValuePolicy:'COUNT_AND_KIND_ONLY · VALUE_NOT_EXPOSED'}
];
const capitalApi={referenceVersion:'V150',referenceSemanticsVersion:'V150',cases:()=>capCases.map(c=>structuredClone(c))};
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FARM1'}};
const snapshotSandbox={
  window:{__SANA_CAPITAL_GOVERNANCE__:capitalApi,__SANA_REPORT_SNAPSHOT_CAPITAL_GOVERNANCE__:{enrichCapitalGovernance:m=>(m.capitalGovernance={legacyRichBlock:true},m)}},
  document:{addEventListener:()=>{},getElementById:()=>null},queueMicrotask:fn=>fn(),structuredClone,console,Date,Object,Array,Number,String,Math,Set,Map
};
vm.createContext(snapshotSandbox);vm.runInContext(src.snapshot,snapshotSandbox);
snapshotSandbox.window.__SANA_REPORT_SNAPSHOT_CAPITAL_GOVERNANCE_REFERENCES__.enrichCapitalGovernanceReferences(manifest);
const refs=manifest.capitalGovernanceReferences;
assert.ok(refs);assert.equal(refs.sourceReferenceVersion,'V150');assert.equal(refs.capturedCount,1);assert.equal(refs.legacyCount,1);assert.equal(refs.linked,1);assert.equal(refs.expected,2);assert.equal(refs.issueCount,1);assert.equal(refs.declaredNonCanonicalCount,2);assert.equal(refs.contentLeakCount,0);
assert.equal(refs.cases[0].declaredReferenceCounts.TERM_SHEET_REF_DECLARED,1);assert.equal(refs.cases[0].declaredReferenceCounts.FUNDING_REF_DECLARED,1);
const serialized=JSON.stringify(refs);
for(const secret of ['TS-SECRET','FUND-SECRET','CP-SECRET','999999','SECRET USE'])assert.ok(!serialized.includes(secret),`leaked ${secret}`);
for(const forbidden of ['counterpartyRef','termSheetRef','fundingRef','amount','currency','useOfFunds'])assert.ok(!serialized.includes(`"${forbidden}"`),forbidden);
assert.equal(refs.cases[0].rows[1].targetLot,'L9');

const snapA={id:'S1',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(manifest)};
const snapB=structuredClone(snapA);snapB.id='S2';snapB.cutoff='2026-08-02';snapB.manifest.capitalGovernanceReferences.cases[0].rows[0].status='MISSING_TARGET';snapB.manifest.capitalGovernanceReferences.cases[0].declaredReferenceCounts.TERM_SHEET_REF_DECLARED=2;snapB.manifest.capitalGovernanceReferences.cases[0].declaredNonCanonicalCount=3;
const drSandbox={window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[snapB,snapA]}},views:{dataroom:()=>''},esc:v=>String(v??''),metric:()=>'',console,Date,Map,Set,Object,Array,Number,String,Math,JSON};
vm.createContext(drSandbox);vm.runInContext(src.dataroom,drSandbox);
const diff=drSandbox.window.__SANA_DATAROOM_CAPITAL_GOVERNANCE_REFERENCES__.diff(snapA,snapB);
assert.equal(diff.valid,true);assert.equal(diff.state,'CAPTURED_BOTH');assert.equal(diff.rowChanges,2);assert.ok(diff.declaredCountChanges>=1);assert.ok(diff.changes.some(c=>c.changeKind==='REFERENCE_ROW_REMOVED'));assert.ok(diff.changes.some(c=>c.changeKind==='REFERENCE_ROW_ADDED'));
const oldSnap={id:'OLD',reportType:'RPT-DD',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};assert.equal(drSandbox.window.__SANA_DATAROOM_CAPITAL_GOVERNANCE_REFERENCES__.diff(oldSnap,snapB).state,'PARTIAL_GRANULARITY');

const cycleSandbox={window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[snapA]},__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'P1',lot:'L1'})}},DEMO:{plans:[{id:'P1',lot:'L1'},{id:'P2',lot:'L2'}]},views:{cycle:()=>''},esc:v=>String(v??''),metric:()=>'',console,Date,Object,Array,Number,String,Math,Set,Map};
vm.createContext(cycleSandbox);vm.runInContext(src.cycle,cycleSandbox);
const cyc=cycleSandbox.window.__SANA_CYCLE_CAPITAL_GOVERNANCE_REFERENCES__.forPlan('P1');
assert.equal(cyc.state,'CAPTURED');assert.equal(cyc.cases.length,1);assert.equal(cyc.cases[0].caseId,'CAP1');assert.equal(cyc.summary.foreignTargets,1);assert.equal(cyc.summary.linked,1);assert.equal(cyc.summary.expected,2);
const cyc2=cycleSandbox.window.__SANA_CYCLE_CAPITAL_GOVERNANCE_REFERENCES__.forPlan('P2');assert.equal(cyc2.cases.length,1);assert.equal(cyc2.cases[0].referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');

const ddBase={schema:'BASE',latest:()=>snapA,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:snapA,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
const ddSandbox={window:{__SANA_DUE_DILIGENCE_GAPS__:ddBase},views:{reports:()=>''},esc:v=>String(v??''),console,Date,Object,Array,Number,String,Math,Set,Map};
vm.createContext(ddSandbox);vm.runInContext(src.dd,ddSandbox);
const gaps=ddSandbox.window.__SANA_DD_CAPITAL_GOVERNANCE_REFERENCE_GAPS__.derive(snapA);
assert.equal(gaps.length,1);assert.match(gaps[0].condition,/CROSS_SCOPE_REFERENCE/);assert.equal(gaps[0].severity,'ALTA');
const noRef={...snapA,manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};assert.equal(ddSandbox.window.__SANA_DD_CAPITAL_GOVERNANCE_REFERENCE_GAPS__.derive(noRef).length,0);
const leak=structuredClone(snapA);leak.manifest.capitalGovernanceReferences.contentLeakCount=1;assert.equal(ddSandbox.window.__SANA_DD_CAPITAL_GOVERNANCE_REFERENCE_GAPS__.derive(leak).length,2);

for(const consumer of ['dataroom','cycle','dd']){
  assert.ok(!src[consumer].includes('__SANA_CAPITAL_GOVERNANCE__'),`${consumer} live capital fallback`);
  assert.ok(!src[consumer].includes('localStorage'),`${consumer} localStorage fallback`);
  assert.ok(!src[consumer].includes('storage?.records'),`${consumer} storage fallback`);
}
assert.match(src.cycle,/NON_WEIGHTED/);assert.match(src.cycle,/SOURCE CASE LOT DEFINES CYCLE MEMBERSHIP/);assert.match(src.dd,/NOT_CAPTURED_OR_LEGACY ≠ GAP/);assert.match(src.dd,/DECLARED_NON_CANONICAL_REFERENCE ≠ GAP/);assert.match(src.dataroom,/ROW_LEVEL_STRUCTURAL_DIFF/);assert.match(src.dataroom,/REFERENCE_CHANGE ≠ CAPITAL_FACT_CHANGE/);
console.log('capital governance reference provenance V151: ok');
