import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-phenology-series.js','utf8');
const records=[
  {id:'PHE-L-1',type:'phenology-series-event',lot:'LOT-1',createdAt:'2026-08-17T08:00:00Z',values:{phenologySchema:'SANA_PHENOLOGY_SERIES_V1',eventKind:'STAGE_OBSERVATION',lot:'LOT-1',observedAt:'2026-08-17T08:00',stage:'Floración',progress:'60',sourceClass:'OBSERVED_DEMO',quality:'OBSERVED_DEMO',method:'Visual QA',sampleScope:'10 puntos',detail:'Etapa observada',author:'QA'}},
  {id:'PHE-L-2',type:'phenology-series-event',lot:'LOT-1',createdAt:'2026-08-17T08:05:00Z',values:{phenologySchema:'SANA_PHENOLOGY_SERIES_V1',eventKind:'VARIABLE_MEASUREMENT',lot:'LOT-1',observedAt:'2026-08-17T08:05',variable:'Altura',value:'120',unit:'cm',sourceClass:'MEASURED_DEMO',quality:'OBSERVED_DEMO',method:'Cinta QA',point:'P1',detail:'Medición 1',author:'QA'}},
  {id:'PHE-L-3',type:'phenology-series-event',lot:'LOT-1',createdAt:'2026-08-18T08:05:00Z',values:{phenologySchema:'SANA_PHENOLOGY_SERIES_V1',eventKind:'VARIABLE_MEASUREMENT',lot:'LOT-1',observedAt:'2026-08-18T08:05',variable:'Altura',value:'123',unit:'cm',sourceClass:'MEASURED_DEMO',quality:'OBSERVED_DEMO',method:'Cinta QA',point:'P1',detail:'Medición 2',author:'QA'}},
  {id:'OLD-PH',type:'phenology',lot:'LOT-1',createdAt:'2026-08-10T10:00:00Z',values:{lot:'LOT-1',stage:'Vegetativo',vigor:'Alto',detail:'Captura antigua'}},
  {id:'OLD-SEN',type:'sensor',lot:'LOT-1',createdAt:'2026-08-10T11:00:00Z',values:{lot:'LOT-1',variable:'Humedad suelo',value:'50',unit:'%',source:'Lectura manual DEMO',quality:'OBSERVADO DEMO'}}
];

globalThis.window={};
globalThis.storage={records};
globalThis.identity={displayName:'QA'};
globalThis.DEMO={lots:[{id:'LOT-1',crop:'Café'},{id:'CAF-A1',crop:'Café'},{id:'AGU-A2',crop:'Aguacate'},{id:'CAC-B1',crop:'Cacao'},{id:'VIV-01',crop:'Vivero'}]};
globalThis.views={phenology:()=>'<footer class="footer"></footer>',passport:()=>'<footer class="footer"></footer>'};
globalThis.localStorage={getItem:()=> 'LOT-1'};
globalThis.document={addEventListener:()=>{}};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
globalThis.openModal=()=>{};

vm.runInThisContext(source,{filename:'sana-v3-phenology-series.js'});
const api=window.__SANA_PHENOLOGY_SERIES__;
assert.ok(api);
assert.equal(api.schema,'SANA_PHENOLOGY_SERIES_V1');

const agu=api.series('AGU-A2','Humedad suelo');
assert.equal(agu.rows.length,3);
assert.equal(agu.comparable,true);
assert.equal(agu.delta,-4);
assert.equal(agu.direction,'DECREASE');
assert.match(agu.integrity,/DESCRIPTIVE_TREND_ONLY/);
assert.match(agu.integrity,/TREND ≠ CAUSALITY/);

const local=api.summary('LOT-1');
assert.equal(local.latestStage.stage,'Floración');
assert.equal(local.latestStage.progress,60);
assert.equal(local.measurements.length,2);
assert.equal(local.legacy.length,2);
const height=api.series('LOT-1','Altura');
assert.equal(height.delta,3);
assert.equal(height.direction,'INCREASE');
assert.equal(height.units[0],'cm');
assert.ok(local.legacy.some(x=>x.kind==='LEGACY_PHENOLOGY_CAPTURE'));
assert.ok(local.legacy.some(x=>x.kind==='LEGACY_SENSOR_CAPTURE'));
assert.ok(local.legacy.every(x=>x.semanticState.includes('PLAN_PHASE_NOT_MUTATED')||x.semanticState.includes('HARDWARE_NOT_VERIFIED')));

const caf=api.summary('CAF-A1');
assert.equal(caf.latestStage.stage,'Llenado de fruto');
assert.equal(caf.latestStage.progress,72);
assert.equal(caf.evidence.length,1);
const cac=api.summary('CAC-B1');
assert.equal(cac.latestStage.sampleScope,'18 puntos');
assert.equal(cac.interpretations.length,1);

assert.match(api.integrity,/OBSERVED_STAGE ≠ PLAN_PHASE/);
assert.match(api.integrity,/MEASUREMENT ≠ INTERPRETATION/);
assert.match(api.integrity,/TREND ≠ CAUSALITY/);
assert.match(api.integrity,/FLAG ≠ HUMAN_DECISION/);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('DEMO.lots.find'),false,'series must not mutate lot stage');
assert.equal(source.includes('productionExecutionAvailable=true'),false);
assert.equal(source.includes('canonicalMutated=true'),false);

console.log('phenology series contract OK · observed stage does not mutate plan phase · trends descriptive-only');
