import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotPath='apps/control-web/public/sana-v3-report-snapshot-economic-reconciliation.js';
const historyPath='apps/control-web/public/sana-v3-dataroom-economic-reconciliation-history.js';
const gapsPath='apps/control-web/public/sana-v3-due-diligence-economic-reconciliation-gaps.js';
const snapshotCode=fs.readFileSync(snapshotPath,'utf8');
const historyCode=fs.readFileSync(historyPath,'utf8');
const gapsCode=fs.readFileSync(gapsPath,'utf8');

const live=[{
  id:'ECON-CAF-A1',lot:'CAF-A1',crop:'Café',budget:18400000,baselineAggregateCost:15950000,declaredLocalCost:500000,
  declaredCosts:[{id:'COST-1'}],evidence:[{id:'EVID-1'}],invoices:[{id:'INV-E1'}],paymentStates:[{id:'PAY-E1'}],sales:[],cashReceipts:[],crossDomainRefs:[{id:'X1'}],
  harvestReference:null,
  scenario:{id:'SCN-CAF-A1',kind:'COMMERCIAL_SCENARIO',volume:5.82,unit:'t',priceScenario:13800000,grossScenario:80316000,grossMarginScenario:63866000,provenance:'SCENARIO_DEMO'},
  events:[
    {id:'COST-1',kind:'COST_DECLARED',observedAt:'2026-08-14',amount:500000,currency:'COP',costRef:'COST-LOCAL-1',activityId:'T-105',provenance:'LOCAL_ONLY'},
    {id:'EVID-1',kind:'EVIDENCE_REFERENCE',observedAt:'2026-08-14',evidenceRef:'EV-COST-1',supports:['COST-1'],provenance:'LOCAL_ONLY_REFERENCE'},
    {id:'INV-E1',kind:'INVOICE_REFERENCE',observedAt:'2026-08-15',amount:500000,currency:'COP',invoiceRef:'INV-REF-001',provenance:'USER_DEMO_LOCAL'},
    {id:'PAY-E1',kind:'PAYMENT_STATUS_DECLARED',observedAt:'2026-08-15',amount:500000,currency:'COP',paymentState:'DECLARED_PAID',provenance:'USER_DEMO_LOCAL'},
    {id:'X1',kind:'CROSS_DOMAIN_COST_REFERENCE',observedAt:'2026-08-14',sourceDomain:'LABOR',sourceRef:'COST-LAB-DEMO',provenance:'EXPLICIT_CROSS_DOMAIN_REFERENCE'}
  ],
  accountingEntries:0,verifiedExpenses:0,verifiedInvoices:0,paymentsExecuted:0,realizedRevenue:0,realizedMargin:null,
  semantics:{supportedDeclaredCostCount:1,crossDomainRefCount:1,invoiceReferenceCount:1,paymentStatusDeclarationCount:1,saleDeclarationCount:0,cashReceiptDeclarationCount:0}
}];
const baseManifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FIN-LE-001',name:'Finca'}};
const context={window:{__SANA_ECONOMIC_RECONCILIATION__:{cases:()=>structuredClone(live)}},views:{reports:()=>'<footer class="footer"></footer>',dataroom:()=>'<footer class="footer"></footer>'},document:{addEventListener:()=>{},getElementById:()=>null},metric:()=>'',esc:v=>String(v),console};
vm.createContext(context);
vm.runInContext(snapshotCode,context,{filename:snapshotPath});
const snap=context.window.__SANA_REPORT_SNAPSHOT_ECONOMIC_RECONCILIATION__;
assert(snap,'economic snapshot API missing');
const manifest=structuredClone(baseManifest);snap.enrichEconomicReconciliation(manifest);
assert(manifest.economicReconciliation,'manifest.economicReconciliation missing');
assert.equal(manifest.economicReconciliation.rowCount,1);
assert.equal(manifest.economicReconciliation.declaredCostCount,1);
assert.equal(manifest.economicReconciliation.invoiceReferenceCount,1);
assert.equal(manifest.economicReconciliation.paymentStatusDeclarationCount,1);
assert.equal(manifest.economicReconciliation.paymentsExecuted,0);
assert.equal(manifest.economicReconciliation.realizedRevenue,0);
const row=manifest.economicReconciliation.rows[0];
assert.equal(row.declaredLocalCost,500000);
assert.equal(row.accountingEntries,0);
assert.equal(row.verifiedExpenses,0);
assert.equal(row.verifiedInvoices,0);
assert.equal(row.paymentsExecuted,0);
assert.equal(row.realizedRevenue,0);
assert.equal(row.realizedMargin,null);
assert.match(manifest.economicReconciliation.integrity,/NO_LIVE_FALLBACK/);
assert.match(manifest.economicReconciliation.integrity,/PAYMENT_STATUS_DECLARED ≠ PAYMENT_EXECUTED/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(baseManifest),createdAt:'2026-08-01'};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:structuredClone(manifest),createdAt:'2026-08-17'};
context.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[oldSnapshot,newSnapshot]};
context.window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'OLD',target:'NEW'})};
vm.runInContext(historyCode,context,{filename:historyPath});
const hist=context.window.__SANA_DATAROOM_ECONOMIC_RECONCILIATION_HISTORY__;
assert(hist,'economic history API missing');
assert.equal(hist.state().state,'CAPTURED');
assert.equal(hist.diff(oldSnapshot,newSnapshot).state,'PARTIAL_GRANULARITY');
assert(!/__SANA_ECONOMIC_RECONCILIATION__/.test(historyCode),'history must not read live reconciliation');
assert(!/__SANA_ECONOMICS__/.test(historyCode),'history must not read legacy economics');
assert(!/storage\./.test(historyCode),'history must not read mutable storage');
assert.match(hist.integrity,/NO_LIVE_FALLBACK/);

const baseDd={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>newSnapshot,derive:snapshot=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:newSnapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
context.window.__SANA_DUE_DILIGENCE_GAPS__=baseDd;
vm.runInContext(gapsCode,context,{filename:gapsPath});
const dd=context.window.__SANA_DD_ECONOMIC_RECONCILIATION_GAPS__;
assert(dd,'economic gaps API missing');
assert.equal(dd.derive(newSnapshot).length,0,'budget variance, declared paid, no sale/cash or scenario margin must not create DD gaps by themselves');

const problematic=structuredClone(newSnapshot);
const bad=problematic.manifest.economicReconciliation.rows[0];
bad.lot='';bad.events.push(
  {id:'BAD-COST',kind:'COST_DECLARED',amount:null,currency:'',provenance:''},
  {id:'BAD-INV',kind:'INVOICE_REFERENCE',invoiceRef:''},
  {id:'BAD-PAY',kind:'PAYMENT_STATUS_DECLARED',paymentState:''},
  {id:'BAD-SALE',kind:'SALE_DECLARATION',amount:100,currency:'',saleRef:''},
  {id:'BAD-CASH',kind:'CASH_RECEIPT_DECLARATION',amount:100,currency:'',receiptRef:''},
  {id:'BAD-X',kind:'CROSS_DOMAIN_COST_REFERENCE',sourceDomain:'',sourceRef:''}
);
bad.accountingEntries=1;bad.verifiedExpenses=1;bad.verifiedInvoices=1;bad.paymentsExecuted=1;bad.realizedRevenue=1;bad.realizedMargin=10;
const issues=dd.derive(problematic);const text=issues.map(x=>x.condition).join(' | ');
assert.match(text,/sin lote/);
assert.match(text,/Costo declarado sin monto/);
assert.match(text,/sin moneda/);
assert.match(text,/sin procedencia/);
assert.match(text,/factura sin invoiceRef/);
assert.match(text,/Estado de pago declarado sin estado/);
assert.match(text,/Venta declarada sin saleRef/);
assert.match(text,/Recaudo declarado sin receiptRef/);
assert.match(text,/dominio fuente/);
assert.match(text,/sourceRef/);
assert.match(text,/accountingEntries/);
assert.match(text,/gasto verificado/);
assert.match(text,/factura verificada/);
assert.match(text,/pago ejecutado/);
assert.match(text,/ingreso realizado/);
assert.match(text,/margen realizado/);
assert.match(dd.integrity,/BUDGET_VARIANCE ≠ GAP/);
assert.match(dd.integrity,/NO_PAYMENT ≠ GAP/);
assert.match(dd.integrity,/NEGATIVE_MARGIN_SCENARIO ≠ GAP/);

for(const code of [snapshotCode,historyCode,gapsCode]){assert(!/fetch\s*\(/.test(code));assert(!/productionExecutionAvailable\s*=\s*true/.test(code));assert(!/canonicalMutated\s*=\s*true/.test(code));}
console.log('SANA economic reconciliation history v58 validation: OK');
