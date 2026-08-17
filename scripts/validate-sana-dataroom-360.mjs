import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-360.js','utf8');
const schema='SANA_DUE_DILIGENCE_SNAPSHOT_V1';

function snap(id,cutoff,overrides={}){
  return {id,reportType:'RPT-DD',cutoff,reviewer:'QA humano',manifest:{
    schema,
    plans:[{id:'P1',version:1,lot:'L1',phase:'Floración'}],
    cycles:[{planId:'P1',completeness:70,evidenceGaps:2,openActivities:1,readyForArchive:false}],
    passport:[{lot:'L1',integrity:76}],
    economics:[{lotId:'L1',budget:1000,baseRecorded:400,localRecorded:200,explicitCostCount:2,supportCoverage:50,mismatchCount:0,unallocatedCount:1}],
    sources:[{id:'S1',state:'REFERENCE_ONLY'}],
    impact:{humanReviewed:false,externallyVerified:0},
    capital:{readiness:52,gates:{}},
    ...overrides
  }};
}

function boot({snapshots=[],gaps=[],remediation=[],nextCut=null,diff=null,role='investor'}={}){
  globalThis.window={
    __SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>snapshots},
    __SANA_DUE_DILIGENCE_GAPS__:{derive:()=>({valid:true,gaps,counts:{ALTA:gaps.filter(g=>g.severity==='ALTA').length,MEDIA:gaps.filter(g=>g.severity==='MEDIA').length,BAJA:gaps.filter(g=>g.severity==='BAJA').length},domains:[...new Set(gaps.map(g=>g.domain))]})},
    __SANA_DUE_DILIGENCE_REMEDIATION__:{forSnapshot:()=>remediation},
    __SANA_DD_NEXT_CUT__:{state:()=>nextCut},
    __SANA_SNAPSHOT_COMPARE__:{compare:()=>diff},
    __SANA_ACCESS__:{role}
  };
  globalThis.views={};
  globalThis.esc=v=>String(v??'');
  globalThis.metric=()=>'';
  globalThis.head=()=>'';
  globalThis.footer=()=>'';
  vm.runInThisContext(source,{filename:'sana-v3-dataroom-360.js'});
  return window.__SANA_DATAROOM_360__;
}

let api=boot();
let state=api.state();
assert.equal(state.valid,false);
assert.equal(state.state,'NO_SNAPSHOT');

const older=snap('SNAP-A','2026-08-01');
const latest=snap('SNAP-B','2026-08-17',{
  cycles:[{planId:'P1',completeness:85,evidenceGaps:1,openActivities:0,readyForArchive:true}],
  passport:[{lot:'L1',integrity:88}],
  economics:[{lotId:'L1',budget:1200,baseRecorded:400,localRecorded:350,explicitCostCount:3,supportCoverage:67,mismatchCount:0,unallocatedCount:0}],
  impact:{humanReviewed:true,externallyVerified:0},
  capital:{readiness:61,gates:{}}
});
const gaps=[
  {id:'g1',domain:'Economía',entity:'L1',condition:'Cobertura de soporte 67%',severity:'ALTA',owner:'Productor'},
  {id:'g2',domain:'Impacto',entity:'SANA Impact',condition:'Sin verificación externa',severity:'MEDIA',owner:'Técnico'}
];
let remediation=[
  {id:'R1',gapId:'g1',status:'LISTO_PARA_NUEVO_CORTE',owner:'Productor',createdAt:'2026-08-17T10:00:00Z'},
  {id:'R2',gapId:'g2',status:'EN_CURSO',owner:'Técnico',createdAt:'2026-08-17T11:00:00Z'}
];
const diff={valid:true,total:4,domains:['Economía','Impacto'],changes:[],counts:{}};
api=boot({snapshots:[latest,older],gaps,remediation,nextCut:{state:'NOT_READY_FOR_NEW_CUT',readyForHumanReview:false},diff});
state=api.state();
assert.equal(state.valid,true);
assert.equal(state.latest.id,'SNAP-B');
assert.equal(state.previous.id,'SNAP-A');
assert.equal(state.historical.cycleCompleteness,85);
assert.equal(state.historical.passportIntegrity,88);
assert.equal(state.historical.localRecorded,350);
assert.equal(state.historical.supportCoverage,67);
assert.equal(state.gaps.total,2);
assert.equal(state.postCut.withPlan,2);
assert.equal(state.postCut.prepared,1);
assert.equal(state.postCut.openWork,1);
assert.equal(state.diff.total,4);

const frozenHistorical=JSON.stringify(state.historical);
remediation=[
  {id:'R3',gapId:'g1',status:'LISTO_PARA_NUEVO_CORTE',owner:'Productor',createdAt:'2026-08-17T12:00:00Z'},
  {id:'R4',gapId:'g2',status:'LISTO_PARA_NUEVO_CORTE',owner:'Técnico',createdAt:'2026-08-17T12:01:00Z'}
];
api=boot({snapshots:[latest,older],gaps,remediation,nextCut:{state:'READY_FOR_HUMAN_CUT_REVIEW',readyForHumanReview:true},diff});
state=api.state();
assert.equal(JSON.stringify(state.historical),frozenHistorical,'post-cut remediation must not rewrite snapshot-derived history');
assert.equal(state.postCut.prepared,2);
assert.match(api.integrity,/SNAPSHOT_HISTORY ≠ POST_CUT_REMEDIATION/);
assert.match(api.integrity,/INVESTMENT_DECISION/);

console.log('Data Room 360 contract OK · snapshot history isolated from post-cut remediation');
