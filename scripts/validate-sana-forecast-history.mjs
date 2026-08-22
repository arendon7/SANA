import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotPath='apps/control-web/public/sana-v3-report-snapshot-forecast.js';
const historyPath='apps/control-web/public/sana-v3-dataroom-forecast-history.js';
const gapsPath='apps/control-web/public/sana-v3-due-diligence-forecast-gaps.js';
const snapshotCode=fs.readFileSync(snapshotPath,'utf8');
const historyCode=fs.readFileSync(historyPath,'utf8');
const gapsCode=fs.readFileSync(gapsPath,'utf8');

const liveCases=[
  {id:'PRY-AG-01',lot:'AGU-A2',planId:'PL-AG-03',phase:'Cuajado',itemId:'INV-003',item:'Bioinsumo K',unit:'L',horizon:'21 días',estimate:118,estimateProvenance:'LEGACY_FORECAST_BASELINE',basisRefs:['PL-AG-03'],basisClass:'PLAN_SCENARIO',activityRefs:[],legacyStockAssumption:9999,legacyStockState:'LEGACY_FORECAST_STOCK_ASSUMPTION',inventory:{state:'COMPARABLE_PLANNING_REFERENCE',physicalCount:82,rollForward:82,reserved:0,planningAvailable:82,unit:'L',caseId:'INVCASE-003',observedAt:'2026-08-13'},forecastGap:36,decisionState:'NEED_CONFIRMED',confirmedNeed:50,humanReview:{observedAt:'2026-08-14',decision:'NEED_CONFIRMED',confirmedQuantity:50,unit:'L',reviewer:'Camila Torres',evidenceRef:'',provenance:'HUMAN_REVIEW_DEMO'},requests:[{id:'Q1'}],receipts:[],reservations:[],consumptions:[],linkedRequestQuantity:50,linkedReceiptQuantity:0,linkedReservationQuantity:0,linkedConsumptionQuantity:0,automaticPurchaseOrders:0,automaticPayments:0},
  {id:'PRY-CF-01',lot:'CAF-A1',planId:'PL-CF-04',phase:'Llenado de fruto',itemId:'INV-002',item:'2Feed Triple 7',unit:'kg',horizon:'30 días',estimate:310,estimateProvenance:'LEGACY_FORECAST_BASELINE',basisRefs:['PL-CF-04','NUT-EV-005'],basisClass:'PLAN_PLUS_HISTORICAL_USE',activityRefs:[],legacyStockAssumption:480,legacyStockState:'LEGACY_FORECAST_STOCK_ASSUMPTION',inventory:{state:'COMPARABLE_PLANNING_REFERENCE',physicalCount:480,rollForward:480,reserved:0,planningAvailable:480,unit:'kg',caseId:'INVCASE-002',observedAt:'2026-08-13'},forecastGap:0,decisionState:'NO_ACTION_REQUIRED',confirmedNeed:0,humanReview:{observedAt:'2026-08-14',decision:'NO_ACTION_REQUIRED',confirmedQuantity:0,unit:'kg',reviewer:'Laura Mejía',evidenceRef:'',provenance:'HUMAN_REVIEW_DEMO'},requests:[],receipts:[],reservations:[],consumptions:[],linkedRequestQuantity:0,linkedReceiptQuantity:0,linkedReservationQuantity:0,linkedConsumptionQuantity:0,automaticPurchaseOrders:0,automaticPayments:0}
];

const baseManifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FIN-LE-001',name:'Finca La Esperanza'}};
const context={
  window:{__SANA_FORECAST_LEDGER__:{cases:()=>liveCases.map(c=>structuredClone(c))}},
  views:{reports:()=>'<footer class="footer"></footer>',dataroom:()=>'<footer class="footer"></footer>'},
  document:{addEventListener:()=>{},getElementById:()=>null},
  metric:()=>'',esc:v=>String(v),console
};
vm.createContext(context);
vm.runInContext(snapshotCode,context,{filename:snapshotPath});
const snapApi=context.window.__SANA_REPORT_SNAPSHOT_FORECAST__;
assert(snapApi,'forecast snapshot API missing');
const manifest=structuredClone(baseManifest);
snapApi.enrichForecast(manifest);
assert(manifest.forecast,'manifest.forecast missing');
assert.equal(manifest.forecast.rowCount,2);
assert.equal(manifest.forecast.forecastGapCount,1);
assert.equal(manifest.forecast.purchaseRequestCount,1);
const snapAgu=manifest.forecast.rows.find(r=>r.forecastId==='PRY-AG-01');
assert.equal(snapAgu.legacyStockAssumption,9999);
assert.equal(snapAgu.inventory.physicalCount,82);
assert.equal(snapAgu.inventory.planningAvailable,82);
assert.equal(snapAgu.forecastGap,36);
assert.equal(snapAgu.confirmedNeed,50);
assert.equal(snapAgu.humanReview.reviewerRedacted,true);
assert(!('reviewer' in snapAgu.humanReview),'reviewer identity must not be persisted in snapshot');
assert.match(manifest.forecast.integrity,/NO_LIVE_FALLBACK/);
assert.match(manifest.forecast.integrity,/REVIEWER_IDENTITY_REDACTED/);

const oldSnapshot={id:'S-OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(baseManifest),createdAt:'2026-08-01'};
const newSnapshot={id:'S-NEW',reportType:'RPT-DD',cutoff:'2026-08-15',manifest:structuredClone(manifest),createdAt:'2026-08-15'};
context.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[oldSnapshot,newSnapshot]};
context.window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'S-OLD',target:'S-NEW'})};
vm.runInContext(historyCode,context,{filename:historyPath});
const hist=context.window.__SANA_DATAROOM_FORECAST_HISTORY__;
assert(hist,'forecast history API missing');
assert.equal(hist.state().state,'CAPTURED');
const partial=hist.diff(oldSnapshot,newSnapshot);
assert.equal(partial.valid,true);
assert.equal(partial.state,'PARTIAL_GRANULARITY');
assert.match(hist.integrity,/NO_LIVE_FALLBACK/);
assert(!/__SANA_FORECAST_LEDGER__/.test(historyCode),'history module must not read live forecast ledger');
assert(!/__SANA_INVENTORY_LEDGER__/.test(historyCode),'history module must not read live inventory ledger');

const baseDd={
  schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',
  latest:()=>newSnapshot,
  derive:snapshot=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),
  current:()=>({valid:true,snapshot:newSnapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})
};
context.window.__SANA_DUE_DILIGENCE_GAPS__=baseDd;
vm.runInContext(gapsCode,context,{filename:gapsPath});
const dd=context.window.__SANA_DD_FORECAST_GAPS__;
assert(dd,'forecast gaps API missing');
assert.equal(dd.derive(newSnapshot).length,0,'valid gap, confirmed need and pending request must not create DD gaps by themselves');

const problematic=structuredClone(newSnapshot);
const row=problematic.manifest.forecast.rows[0];
row.itemId='';row.unit='';row.horizon='';row.basisRefs=[];row.inventory.state='NOT_COMPARABLE';row.humanReview.reviewerRedacted=false;row.automaticPurchaseOrders=1;row.automaticPayments=1;
const issues=dd.derive(problematic);
const text=issues.map(x=>x.condition).join(' | ');
assert.match(text,/itemId/);
assert.match(text,/sin unidad/);
assert.match(text,/horizonte/);
assert.match(text,/referencias de base/);
assert.match(text,/no comparable/);
assert.match(text,/identidad de revisor/);
assert.match(text,/orden de compra automática/);
assert.match(text,/pago automático/);
assert.match(dd.integrity,/FORECAST_GAP_OR_PENDING_REVIEW ≠ GAP/);
assert.match(dd.integrity,/MISSING_PURCHASE_ORDER ≠ GAP/);

for(const code of [snapshotCode,historyCode,gapsCode]){
  assert(!/fetch\s*\(/.test(code));
  assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
  assert(!/canonicalMutated\s*=\s*true/.test(code));
}
console.log('SANA forecast history v52 validation: OK');
