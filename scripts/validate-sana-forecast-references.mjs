import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-forecast-references.js','utf8');
const rows=[
  {id:'F1',lot:'L1',planId:'PL-1',item:'Input 1',itemId:'I1',basisRefs:['PL-1','NUT-1'],activityRefs:['A1'],humanReview:{evidenceRef:'E1'},integrity:'BASE'},
  {id:'F2',lot:'L1',planId:'PL-2',item:'Input 2',itemId:'I2',basisRefs:['PL-2'],activityRefs:[],humanReview:null,integrity:'BASE'},
  {id:'F3',lot:'L1',planId:'PL-1',item:'Input 3',itemId:'I3',basisRefs:['UNKNOWN-1'],activityRefs:[],humanReview:null,integrity:'BASE'},
  {id:'F4',lot:'L1',planId:'PL-1',item:'Input 4',itemId:'I4',basisRefs:['PL-1'],activityRefs:['NOPE'],humanReview:null,integrity:'BASE'},
  {id:'F5',lot:'L1',planId:'PL-1',item:'Legacy',itemId:'I5',basisRefs:['PL-1'],activityRefs:[],humanReview:null,integrity:'BASE'}
];
const meta=['F1','F2','F3','F4'].map((id,i)=>({id:`M${i}`,type:'forecast-reference-meta',values:{forecastSchema:'SANA_INPUT_FORECAST_LEDGER_V1',forecastId:id,referenceVersion:'V139'}}));
const base={schema:'SANA_INPUT_FORECAST_LEDGER_V1',cases:()=>rows.map(x=>({...x})),forLot:l=>rows.filter(x=>x.lot===l),forItem:i=>rows.filter(x=>x.itemId===i),forActivity:a=>rows.filter(x=>x.activityRefs.includes(a)),summary:()=>({schema:'SANA_INPUT_FORECAST_LEDGER_V1',cases:rows.length,integrity:'BASE'}),integrity:'BASE'};
const sandbox={
  window:{
    __SANA_FORECAST_LEDGER__:base,
    __SANA_NUTRITION_LEDGER__:{events:()=>[{id:'NUT-1',lot:'L1',eventKind:'APPLICATION'}]},
    __SANA_PLAN_FIELD_WORKFLOW__:{findActivity:id=>id==='A1'?{id:'A1',lot:'L1'}:null}
  },
  DEMO:{plans:[{id:'PL-1',lot:'L1'},{id:'PL-2',lot:'L2'}],evidence:[{id:'E1',lot:'L1'}]},
  storage:{records:meta},views:{forecast:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},
  esc:v=>String(v??''),metric:()=>'',openModal:()=>{},console
};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_FORECAST_LEDGER__;
assert.equal(api.referenceVersion,'V139');
assert.equal(api.forCase('F5').referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(api.forCase('F5').referenceCoverage.total,0);
assert.equal(api.forCase('F1').referenceIssues,0);
assert.equal(api.forCase('F1').referenceCoverage.linked,5);
assert.ok(api.forCase('F2').referenceRows.some(r=>r.reference.status==='CROSS_LOT_REFERENCE'));
assert.ok(api.forCase('F3').referenceRows.some(r=>r.reference.status==='UNSUPPORTED_REFERENCE_KIND'));
assert.ok(api.forCase('F4').referenceRows.some(r=>r.reference.status==='MISSING_TARGET'));
assert.equal(api.summary().referenceCaptured,4);
assert.equal(api.summary().legacyReferenceNotCaptured,1);
assert.match(api.integrity,/NO_AUTOMATIC_PROCUREMENT/);
console.log('forecast references V139: ok');
