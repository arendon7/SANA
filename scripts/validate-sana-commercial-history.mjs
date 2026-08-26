import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotPath='apps/control-web/public/sana-v3-report-snapshot-commercial.js';
const historyPath='apps/control-web/public/sana-v3-dataroom-commercial-history.js';
const gapsPath='apps/control-web/public/sana-v3-due-diligence-commercial-gaps.js';
const snapshotCode=fs.readFileSync(snapshotPath,'utf8');
const historyCode=fs.readFileSync(historyPath,'utf8');
const gapsCode=fs.readFileSync(gapsPath,'utf8');

const live=[
  {id:'COM-CAF-01',lot:'CAF-A1',buyerRefs:['BUYER-DEMO-01'],offers:[{id:'O1'}],interests:[{id:'I1'}],negotiations:[],agreements:[{id:'A1'}],commitments:[],deliveries:[{id:'D1'}],acceptances:[],invoices:[],paymentStates:[],cashReceipts:[],evidence:[{id:'E1'}],crossDomainRefs:[{id:'X1',kind:'HARVEST_HANDOFF_REFERENCE',sourceDomain:'HARVEST',sourceRef:'HR-CAF-D1',quantity:4.5,unit:'t',provenance:'EXPLICIT_CROSS_DOMAIN_REFERENCE'}],events:[
    {id:'O1',kind:'OFFER_REGISTERED',observedAt:'2026-07-28',buyerRef:'BUYER-DEMO-01',quantity:4.5,unit:'t',priceRef:12.4,priceUnit:'M COP/t',provenance:'BASELINE_DEMO',detail:'DO_NOT_COPY'},
    {id:'I1',kind:'BUYER_INTEREST',observedAt:'2026-07-28',buyerRef:'BUYER-DEMO-01',quantity:4.5,unit:'t',provenance:'BASELINE_DEMO'},
    {id:'A1',kind:'OFFTAKE_AGREEMENT_REFERENCE',observedAt:'2026-07-29',buyerRef:'BUYER-DEMO-01',quantity:4.5,unit:'t',agreementRef:'OFFTAKE-DEMO-1',provenance:'BASELINE_DEMO'},
    {id:'D1',kind:'DELIVERY_DECLARATION',observedAt:'2026-07-29',buyerRef:'BUYER-DEMO-01',quantity:4.5,unit:'t',deliveryRef:'HR-CAF-D1',provenance:'BASELINE_DEMO'},
    {id:'E1',kind:'EVIDENCE',observedAt:'2026-07-29',buyerRef:'BUYER-DEMO-01',evidenceRef:'EV-COM-1',supports:['A1','D1'],provenance:'BASELINE_DEMO'}
  ],verifiedContracts:0,verifiedInvoices:0,paymentsExecuted:0,bankSettlementsVerified:0,guaranteedRevenue:0,automaticOrderActions:0},
  {id:'COM-AGU-01',lot:'AGU-A2',buyerRefs:['BUYER-DEMO-02'],offers:[{id:'AO1'}],interests:[{id:'AI1'}],negotiations:[],agreements:[],commitments:[],deliveries:[],acceptances:[],invoices:[],paymentStates:[],cashReceipts:[],evidence:[],crossDomainRefs:[],events:[
    {id:'AO1',kind:'OFFER_REGISTERED',observedAt:'2026-08-03',buyerRef:'BUYER-DEMO-02',quantity:20,unit:'t',priceRef:6.1,priceUnit:'M COP/t',provenance:'BASELINE_DEMO'},
    {id:'AI1',kind:'BUYER_INTEREST',observedAt:'2026-08-03',buyerRef:'BUYER-DEMO-02',quantity:15,unit:'t',provenance:'BASELINE_DEMO'}
  ],verifiedContracts:0,verifiedInvoices:0,paymentsExecuted:0,bankSettlementsVerified:0,guaranteedRevenue:0,automaticOrderActions:0}
];
const baseManifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FIN-LE-001',name:'Finca'}};
const context={window:{__SANA_COMMERCIAL_LEDGER__:{cases:()=>structuredClone(live)}},views:{reports:()=>'<footer class="footer"></footer>',dataroom:()=>'<footer class="footer"></footer>'},document:{addEventListener:()=>{},getElementById:()=>null},metric:()=>'',esc:v=>String(v),console};
vm.createContext(context);
vm.runInContext(snapshotCode,context,{filename:snapshotPath});
const snap=context.window.__SANA_REPORT_SNAPSHOT_COMMERCIAL__;
assert(snap,'commercial snapshot API missing');
const manifest=structuredClone(baseManifest);snap.enrichCommercial(manifest);
assert(manifest.commercial,'manifest.commercial missing');
assert.equal(manifest.commercial.rowCount,2);
assert.equal(manifest.commercial.buyerInterestCount,2);
assert.equal(manifest.commercial.agreementReferenceCount,1);
assert.equal(manifest.commercial.deliveryCount,1);
assert.equal(manifest.commercial.verifiedContracts,0);
assert.equal(manifest.commercial.paymentsExecuted,0);
assert.equal(manifest.commercial.guaranteedRevenue,0);
assert.equal(manifest.commercial.rows[1].agreementReferenceCount,0,'interest-only case must remain without agreement');
assert(!JSON.stringify(manifest.commercial).includes('DO_NOT_COPY'),'free-form commercial detail must not be copied into DD snapshot');
assert.match(manifest.commercial.integrity,/BUYER_REF_ONLY/);
assert.match(manifest.commercial.integrity,/NO_LIVE_FALLBACK/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(baseManifest),createdAt:'2026-08-01'};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:structuredClone(manifest),createdAt:'2026-08-17'};
context.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[oldSnapshot,newSnapshot]};
context.window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'OLD',target:'NEW'})};
vm.runInContext(historyCode,context,{filename:historyPath});
const hist=context.window.__SANA_DATAROOM_COMMERCIAL_HISTORY__;
assert(hist,'commercial history API missing');
assert.equal(hist.state().state,'CAPTURED');
assert.equal(hist.diff(oldSnapshot,newSnapshot).state,'PARTIAL_GRANULARITY');
assert(!/__SANA_COMMERCIAL_LEDGER__/.test(historyCode),'history must not read live commercial ledger');
assert(!/__SANA_HARVEST_LEDGER__/.test(historyCode),'history must not read live harvest ledger');
assert(!/__SANA_ECONOMIC_RECONCILIATION__/.test(historyCode),'history must not read live economics');
assert(!/storage\./.test(historyCode),'history must not read mutable storage');
assert.match(hist.integrity,/NO_LIVE_FALLBACK/);

const baseDd={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>newSnapshot,derive:snapshot=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:newSnapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
context.window.__SANA_DUE_DILIGENCE_GAPS__=baseDd;
vm.runInContext(gapsCode,context,{filename:gapsPath});
const dd=context.window.__SANA_DD_COMMERCIAL_GAPS__;
assert(dd,'commercial gaps API missing');
assert.equal(dd.derive(newSnapshot).length,0,'non-binding interest without agreement/delivery/invoice/payment/cash must not create DD gaps by itself');

const problematic=structuredClone(newSnapshot);
const bad=problematic.manifest.commercial.rows[0];
bad.caseId='';bad.lot='';bad.events.push(
  {id:'BAD-OFFER',kind:'OFFER_REGISTERED',buyerRef:'',quantity:null,unit:''},
  {id:'BAD-AGREE',kind:'OFFTAKE_AGREEMENT_REFERENCE',buyerRef:'',quantity:1,unit:'',agreementRef:''},
  {id:'BAD-DELIVERY',kind:'DELIVERY_DECLARATION',buyerRef:'',quantity:1,unit:'t',deliveryRef:''},
  {id:'BAD-INVOICE',kind:'INVOICE_REFERENCE',buyerRef:'',invoiceRef:''},
  {id:'BAD-PAYMENT',kind:'PAYMENT_STATUS_DECLARED',buyerRef:'',paymentState:''},
  {id:'BAD-CASH',kind:'CASH_RECEIPT_DECLARATION',buyerRef:'',receiptRef:''},
  {id:'BAD-EVID',kind:'EVIDENCE',evidenceRef:'',supports:['MISSING-EVENT']}
);bad.crossDomainRefs.push({id:'BAD-X',sourceDomain:'',sourceRef:''});bad.verifiedContracts=1;bad.verifiedInvoices=1;bad.paymentsExecuted=1;bad.bankSettlementsVerified=1;bad.guaranteedRevenue=1;bad.automaticOrderActions=1;
const issues=dd.derive(problematic);const text=issues.map(x=>x.condition).join(' | ');
assert.match(text,/sin caseId/);
assert.match(text,/sin lote/);
assert.match(text,/sin buyerRef/);
assert.match(text,/sin cantidad válida/);
assert.match(text,/cantidad sin unidad/);
assert.match(text,/acuerdo sin agreementRef/);
assert.match(text,/Entrega declarada sin deliveryRef/);
assert.match(text,/factura sin invoiceRef/);
assert.match(text,/Estado de pago declarado sin estado/);
assert.match(text,/Recaudo declarado sin receiptRef/);
assert.match(text,/Evidencia comercial sin evidenceRef/);
assert.match(text,/evento no resuelto/);
assert.match(text,/dominio fuente/);
assert.match(text,/sourceRef/);
assert.match(text,/contrato verificado/);
assert.match(text,/factura verificada/);
assert.match(text,/pago ejecutado/);
assert.match(text,/liquidación bancaria/);
assert.match(text,/ingreso garantizado/);
assert.match(text,/ejecución automática de orden/);
assert.match(dd.integrity,/NO_BUYER_INTEREST ≠ GAP/);
assert.match(dd.integrity,/NO_AGREEMENT ≠ GAP/);
assert.match(dd.integrity,/BUYER_INTEREST_WITHOUT_AGREEMENT ≠ GAP/);
assert.match(dd.integrity,/COMMERCIAL_GAP ≠ MARKET_DEMAND/);

for(const code of [snapshotCode,historyCode,gapsCode]){assert(!/fetch\s*\(/.test(code));assert(!/productionExecutionAvailable\s*=\s*true/.test(code));assert(!/canonicalMutated\s*=\s*true/.test(code));}
console.log('SANA commercial history v60 validation: OK');
