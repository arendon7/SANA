import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-phenology-gaps.js','utf8');
const snapshot={id:'SNAP-1',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'},phenology:{lots:[
  {lotId:'LOT-GOOD',stageCount:1,measurementCount:2,interpretationCount:1,evidenceCount:1,legacyCount:0,missingMeasurementMetadata:0,missingStageMetadata:0,unresolvedReferences:0,unitConflictCount:0,latestStage:{stage:'Floración',progress:60},series:[{variable:'Altura',count:2,units:['cm'],comparable:true,delta:3,direction:'INCREASE'}]},
  {lotId:'LOT-BAD',stageCount:1,measurementCount:2,interpretationCount:1,evidenceCount:0,legacyCount:0,missingMeasurementMetadata:2,missingStageMetadata:1,unresolvedReferences:2,unitConflictCount:1,latestStage:{stage:'Cuajado',progress:50},series:[{variable:'Humedad',count:2,units:['%','kPa'],comparable:false,delta:null,direction:'NOT_COMPARABLE'}]},
  {lotId:'LOT-TREND',stageCount:1,measurementCount:3,interpretationCount:1,evidenceCount:0,legacyCount:0,missingMeasurementMetadata:0,missingStageMetadata:0,unresolvedReferences:0,unitConflictCount:0,latestStage:{stage:'Llenado',progress:80},series:[{variable:'Humedad',count:3,units:['%'],comparable:true,delta:-8,direction:'DECREASE'}]}
]}}};
const oldSnapshot={id:'OLD',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'F-1'}}};

globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snapshot,derive:s=>({valid:true,snapshot:s,gaps:[{id:'base',domain:'Base',entity:'X',condition:'base',source:'base',severity:'BAJA'}],counts:{ALTA:0,MEDIA:0,BAJA:1},domains:['Base']}),current:()=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(source,{filename:'sana-v3-due-diligence-phenology-gaps.js'});
const api=window.__SANA_DD_PHENOLOGY_GAPS__;
assert.ok(api);
assert.equal(api.derive(snapshot).filter(g=>g.entity==='LOT-GOOD').length,0,'complete phenology provenance should have no gap');
assert.equal(api.derive(snapshot).filter(g=>g.entity==='LOT-TREND').length,0,'stage/progress/trend alone must not be a gap');
const bad=api.derive(snapshot).filter(g=>g.entity==='LOT-BAD');
assert.equal(bad.length,4);
assert.ok(bad.some(g=>g.id.includes('measurement-metadata')));
assert.ok(bad.some(g=>g.id.includes('stage-metadata')));
assert.ok(bad.some(g=>g.id.includes('references')));
assert.ok(bad.some(g=>g.id.includes('units')));
const old=api.derive(oldSnapshot);
assert.equal(old.length,1);
assert.equal(old[0].severity,'BAJA');
assert.match(api.integrity,/STAGE_OR_TREND ≠ GAP/);
assert.match(api.integrity,/NO_CAUSALITY_OR_CREDIT_INFERENCE/);
assert.equal(source.includes('__SANA_PHENOLOGY_SERIES__'),false,'gap derivation must use snapshots only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
const merged=window.__SANA_DUE_DILIGENCE_GAPS__.current();
assert.ok(merged.gaps.some(g=>g.domain==='Fenología / variables'));
assert.match(merged.integrity,/PHENOLOGICAL_ADVANCE ≠ AGRONOMIC_PERFORMANCE/);

console.log('phenology gaps contract OK · provenance gaps only · stage/trend are not gaps by themselves');
