import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const syncSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-sync.js','utf8');
const historySource=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-phenology-history.js','utf8');

const summaries={
  'LOT-1':{lot:'LOT-1',latestStage:{id:'ST-1',stage:'Floración',progress:60,observedAt:'2026-08-17',method:'Visual QA',sampleScope:'10 puntos',sourceClass:'OBSERVED_DEMO',quality:'OBSERVED_DEMO',author:'QA'},stages:[{id:'ST-1',stage:'Floración',progress:60,observedAt:'2026-08-17',method:'Visual QA',sampleScope:'10 puntos',sourceClass:'OBSERVED_DEMO',quality:'OBSERVED_DEMO',author:'QA'}],measurements:[{id:'ME-1',variable:'Altura',value:120,unit:'cm',observedAt:'2026-08-17',method:'Cinta QA',point:'P1',sourceClass:'MEASURED_DEMO',quality:'OBSERVED_DEMO',author:'QA'},{id:'ME-2',variable:'Altura',value:123,unit:'cm',observedAt:'2026-08-18',method:'Cinta QA',point:'P1',sourceClass:'MEASURED_DEMO',quality:'OBSERVED_DEMO',author:'QA'}],interpretations:[{id:'INT-1',basisRefs:['ME-1','ME-2'],interpretationClass:'HUMAN_REVIEW',observedAt:'2026-08-18',sourceClass:'HUMAN_INTERPRETATION_DEMO',quality:'HUMAN_REVIEW',author:'QA',detail:'Interpretación humana'}],evidence:[{id:'EV-1',evidenceRef:'REF-1',supports:['ST-1'],observedAt:'2026-08-17',sourceClass:'EVIDENCE_DEMO',quality:'DOCUMENTAL_DEMO',author:'QA'}],variables:['Altura'],legacy:[]},
  'LOT-2':{lot:'LOT-2',latestStage:null,stages:[],measurements:[],interpretations:[],evidence:[],variables:[],legacy:[{id:'LEG-1',kind:'LEGACY_SENSOR_CAPTURE',observedAt:'2026-08-01',summary:'Legacy',semanticState:'HARDWARE_NOT_VERIFIED'}]}
};
const explicit={
  'LOT-1':{entries:[...summaries['LOT-1'].stages,...summaries['LOT-1'].measurements,...summaries['LOT-1'].interpretations,...summaries['LOT-1'].evidence]},
  'LOT-2':{entries:[]}
};

globalThis.window={
  DEMO:{lots:[{id:'LOT-1'},{id:'LOT-2'}]},
  __SANA_PHENOLOGY_SERIES__:{
    summary:lot=>summaries[lot]||{lot,latestStage:null,stages:[],measurements:[],interpretations:[],evidence:[],variables:[],legacy:[]},
    forLot:lot=>explicit[lot]||{entries:[]},
    series:(lot,variable)=>({lot,variable,rows:[{value:120},{value:123}],units:['cm'],comparable:true,delta:3,direction:'INCREASE',integrity:'DESCRIPTIVE_TREND_ONLY'})
  }
};
globalThis.document={addEventListener:()=>{},getElementById:()=>null};
globalThis.modalAction='';
vm.runInThisContext(syncSource,{filename:'sana-v3-report-snapshot-sync.js'});
const sync=window.__SANA_REPORT_SNAPSHOT_SYNC__;
assert.ok(sync?.enrichPhenology);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'};
sync.enrichPhenology(manifest);
assert.equal(manifest.phenology.lotCount,2);
assert.equal(manifest.phenology.stageObservationCount,1);
assert.equal(manifest.phenology.measurementCount,2);
const lot1=manifest.phenology.lots.find(x=>x.lotId==='LOT-1');
assert.equal(lot1.latestStage.stage,'Floración');
assert.equal(lot1.series[0].delta,3);
assert.equal(lot1.series[0].direction,'INCREASE');
assert.equal(lot1.missingMeasurementMetadata,0);
assert.equal(lot1.unresolvedReferences,0);
assert.equal(lot1.unitConflictCount,0);
const lot2=manifest.phenology.lots.find(x=>x.lotId==='LOT-2');
assert.equal(lot2.legacyCount,1);
assert.match(manifest.phenology.integrity,/NO_LIVE_FALLBACK/);
assert.match(manifest.phenology.integrity,/NO_STAGE_TO_PLAN_PHASE_INFERENCE/);
assert.match(manifest.phenology.integrity,/NO_TREND_TO_CAUSALITY_INFERENCE/);
assert.match(manifest.phenology.integrity,/NO_AUTOMATIC_MANAGEMENT/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-18',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',phenology:manifest.phenology}};
globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[oldSnapshot,newSnapshot]},__SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'OLD',target:'NEW'})}};
globalThis.views={dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(historySource,{filename:'sana-v3-dataroom-phenology-history.js'});
const history=window.__SANA_DATAROOM_PHENOLOGY_HISTORY__;
assert.ok(history);
assert.equal(history.state().state,'CAPTURED');
assert.equal(history.state().lots.length,2);
const partial=history.diff(oldSnapshot,newSnapshot);
assert.equal(partial.valid,true);
assert.equal(partial.state,'PARTIAL_GRANULARITY');
assert.match(partial.integrity,/CHANGE ≠ IMPROVEMENT/);
assert.match(partial.integrity,/PHASE_TRANSITION/);
assert.match(partial.integrity,/TREND_CAUSALITY/);
assert.equal(historySource.includes('__SANA_PHENOLOGY_SERIES__'),false,'history must not read live phenology series');
assert.equal(historySource.includes('storage.'),false);
assert.equal(historySource.includes('fetch('),false);
assert.equal(syncSource.includes('manifest.phenology='),true);

console.log('phenology snapshot history contract OK · additive capture · no live fallback · no stage/trend inference');
