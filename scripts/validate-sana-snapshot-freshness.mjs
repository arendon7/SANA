import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-snapshot-freshness.js','utf8');

function boot({snapshots=[],liveManifest=null,compareImpl=null,canAction=false}={}){
  globalThis.window={
    __SANA_DUE_DILIGENCE_SNAPSHOT__:{
      snapshots:()=>snapshots,
      currentManifest:()=>liveManifest
    },
    __SANA_SNAPSHOT_COMPARE__:{
      compare:compareImpl||(()=>({valid:true,total:0,domains:[]}))
    },
    __SANA_ACCESS__:{canAction:()=>canAction}
  };
  globalThis.views={reports:()=>'<header></header>'};
  globalThis.esc=v=>String(v??'');
  globalThis.metric=()=>'';
  vm.runInThisContext(source,{filename:'sana-v3-snapshot-freshness.js'});
  return window.__SANA_SNAPSHOT_FRESHNESS__;
}

const schema='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
const manifest={schema,reportType:'RPT-DD',plans:[]};
const registered={id:'SNAP-1',reportType:'RPT-DD',cutoff:'2026-08-17',manifest};

let api=boot({snapshots:[],liveManifest:manifest});
let state=api.state();
assert.equal(state.state,'NO_SNAPSHOT');
assert.equal(state.comparable,false);

api=boot({snapshots:[registered],liveManifest:manifest,compareImpl:()=>({valid:true,total:0,domains:[]})});
state=api.state();
assert.equal(state.state,'ALIGNED_WITH_SNAPSHOT');
assert.equal(state.changes,0);
assert.deepEqual(state.domains,[]);
assert.equal(state.comparable,true);

api=boot({snapshots:[registered],liveManifest:{...manifest,plans:[{id:'P1'}]},compareImpl:()=>({valid:true,total:3,domains:['Plan','Readiness']})});
state=api.state();
assert.equal(state.state,'CHANGED_SINCE_SNAPSHOT');
assert.equal(state.changes,3);
assert.deepEqual(state.domains,['Plan','Readiness']);
assert.equal(state.comparable,true);

api=boot({snapshots:[registered],liveManifest:manifest,compareImpl:()=>({valid:false,reason:'SCHEMA_INCOMPATIBLE',total:0,domains:[]})});
state=api.state();
assert.equal(state.state,'SCHEMA_MISMATCH');
assert.equal(state.comparable,false);

api=boot({snapshots:[registered],liveManifest:null});
state=api.state();
assert.equal(state.state,'UNAVAILABLE');
assert.equal(state.comparable,false);

assert.match(api.integrity,/LIVE_STATE ≠ SNAPSHOT ≠ HISTORICAL_EVIDENCE/);
assert.match(api.integrity,/NO_INVESTMENT_SIGNAL/);

console.log('snapshot freshness contract OK · 5 states validated');
