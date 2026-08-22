import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ledgerSource=fs.readFileSync('apps/control-web/public/sana-v3-impact-ledger.js','utf8');
const syncSource=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-sync.js','utf8');

const impactRows=[
  {id:'soil-om',layer:'Suelo',name:'Materia orgánica',baseline:2.8,current:3.4,unit:'%',method:'Comparación DEMO',source:'Análisis DEMO',frequency:'Semestral',quality:'EVIDENCE_DEMO',qualityScore:78,verification:'NO_VERIFICADO_EXTERNO',delta:{d:.6,pct:21.4}},
  {id:'water',layer:'Agua',name:'Uso de agua',baseline:4200,current:3444,unit:'m³/ha·ciclo',method:'IoT + registros DEMO',source:'IoT + bitácora',frequency:'Ciclo',quality:'ESTIMADO',qualityScore:58,verification:'NO_VERIFICADO_EXTERNO',delta:{d:-756,pct:-18}},
  {id:'circular',layer:'Circularidad',name:'Insumos circulares',baseline:38,current:62,unit:'%',method:'Participación registrada',source:'Inventario + aplicaciones',frequency:'Mensual',quality:'TRAZABLE_DEMO',qualityScore:88,verification:'INTERNO',delta:{d:24,pct:63.2}},
  {id:'evidence',layer:'Gestión',name:'Actividades con evidencia',baseline:68,current:92,unit:'%',method:'Evidencia / eventos',source:'AGROWAY + Passport',frequency:'Semanal',quality:'TRAZABLE_DEMO',qualityScore:88,verification:'INTERNO',delta:{d:24,pct:35.3}},
  {id:'restoration',layer:'Biodiversidad',name:'Área restauración',baseline:0,current:3.9,unit:'ha',method:'Área DEMO',source:'Territorio + Passport',frequency:'Trimestral',quality:'EVIDENCE_DEMO',qualityScore:78,verification:'NO_VERIFICADO_EXTERNO',delta:{d:3.9,pct:null}}
];

globalThis.window={__SANA_IMPACT__:{rows:()=>impactRows}};
globalThis.views={impact:()=>'<footer class="footer">FOOT</footer>'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
vm.runInThisContext(ledgerSource,{filename:'sana-v3-impact-ledger.js'});

const ledger=window.__SANA_IMPACT_LEDGER__;
assert.ok(ledger);
const rows=ledger.rows();
assert.equal(rows.length,5);
const water=rows.find(r=>r.id==='water');
assert.equal(water.estimation.explicit,true);
assert.equal(water.estimation.type,'ESTIMADO');
assert.equal(water.verification.external,false);
assert.equal(water.verification.state,'NO_VERIFICADO_EXTERNO');
assert.equal(rows.find(r=>r.id==='circular').verification.state,'INTERNO');
assert.equal(rows.find(r=>r.id==='circular').verification.external,false,'internal verification must not become external');
for(const row of rows){
  assert.ok(row.baseline);
  assert.ok(row.observation);
  assert.ok(row.calculation);
  assert.ok(row.estimation);
  assert.ok(row.verification);
  assert.match(row.integrity,/LIVE_METHOD_DEMO/);
}
assert.match(ledger.integrity,/LIVE_METHOD ≠ SNAPSHOT_HISTORY ≠ EXTERNAL_VERIFICATION/);

const documentStub={addEventListener:()=>{},getElementById:()=>null};
globalThis.document=documentStub;
globalThis.modalAction=null;
window.__SANA_ECONOMICS__=undefined;
vm.runInThisContext(syncSource,{filename:'sana-v3-report-snapshot-sync.js'});
const sync=window.__SANA_REPORT_SNAPSHOT_SYNC__;
assert.ok(sync);

const legacy={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',impact:{overallQuality:74,humanReviewed:false}};
const savedLedger=window.__SANA_IMPACT_LEDGER__;
delete window.__SANA_IMPACT_LEDGER__;
const untouched=sync.enrichImpact(structuredClone(legacy));
assert.equal('indicators' in untouched.impact,false,'legacy V1 without ledger must remain valid and unfilled');
window.__SANA_IMPACT_LEDGER__=savedLedger;

const enriched=sync.enrichImpact(structuredClone(legacy));
assert.equal(enriched.schema,'SANA_DUE_DILIGENCE_SNAPSHOT_V1');
assert.equal(enriched.impact.indicators.length,5);
assert.equal(enriched.impact.methodologyGranularity,'ADDITIVE_V1 · IMPACT_LEDGER');
const capturedWater=enriched.impact.indicators.find(i=>i.id==='water');
assert.equal(capturedWater.estimated,true);
assert.equal(capturedWater.verification,'NO_VERIFICADO_EXTERNO');
assert.equal(capturedWater.temporalState,'SNAPSHOT_CAPTURED_FROM_LIVE_METHOD');
assert.equal(enriched.impact.indicators.find(i=>i.id==='circular').verification,'INTERNO');
assert.match(sync.integrity,/ECONOMICS_AND_IMPACT/);
assert.match(sync.integrity,/NO_EXTERNAL_WRITE/);

console.log('Impact ledger contract OK · 5 indicators · live method separated from additive snapshot history');
