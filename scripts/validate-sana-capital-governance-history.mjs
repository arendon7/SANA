import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotPath='apps/control-web/public/sana-v3-report-snapshot-capital-governance.js';
const historyPath='apps/control-web/public/sana-v3-dataroom-capital-governance-history.js';
const gapsPath='apps/control-web/public/sana-v3-due-diligence-capital-governance-gaps.js';
const snapshotCode=fs.readFileSync(snapshotPath,'utf8');
const historyCode=fs.readFileSync(historyPath,'utf8');
const gapsCode=fs.readFileSync(gapsPath,'utf8');

const live=[
  {
    id:'CAP-CAF-01',lot:'CAF-A1',counterpartyRefs:['INVESTOR-DEMO-01'],documentCompleteness:82,
    needs:[{id:'CAP-CAF-N1'}],uses:[{id:'CAP-CAF-U1'}],reviews:[],interests:[{id:'CAP-CAF-I1'}],ddRequests:[{id:'CAP-CAF-DD1'}],terms:[],decisions:[],commitments:[],closings:[],funding:[],evidence:[{id:'CAP-CAF-E1'}],
    events:[
      {id:'CAP-CAF-N1',kind:'CAPITAL_NEED_DECLARED',observedAt:'2026-08-10',amount:48000000,currency:'COP',horizon:'10 meses',provenance:'BASELINE_DEMO'},
      {id:'CAP-CAF-U1',kind:'USE_OF_FUNDS_DECLARED',observedAt:'2026-08-10',useOfFunds:'Operación técnico-productiva DEMO',provenance:'BASELINE_DEMO'},
      {id:'CAP-CAF-I1',kind:'COUNTERPARTY_INTEREST',observedAt:'2026-08-15',counterpartyRef:'INVESTOR-DEMO-01',interestState:'NON_BINDING_INTEREST',instrumentType:'UNSPECIFIED_DEMO',provenance:'BASELINE_DEMO'},
      {id:'CAP-CAF-DD1',kind:'DUE_DILIGENCE_REQUEST',observedAt:'2026-08-15',counterpartyRef:'INVESTOR-DEMO-01',requestRef:'DD-REQ-CAP-DEMO-01',requestState:'REQUESTED_DEMO',provenance:'BASELINE_DEMO'},
      {id:'CAP-CAF-E1',kind:'EVIDENCE',observedAt:'2026-08-15',evidenceRef:'EV-CAP-CAF-DEMO',supports:['CAP-CAF-I1','CAP-CAF-DD1'],provenance:'BASELINE_DEMO'}
    ],
    verifiedTermSheets:0,verifiedCommitments:0,legalClosingsVerified:0,fundingExecuted:0,custodyAmount:0,eligibilityDecision:null,creditScore:null,investmentRecommendation:null,automaticInvestmentActions:0,
    context:{commercial:{buyerInterestCount:99},economic:{realizedRevenue:0},dueDiligence:{openGaps:99}}
  },
  {
    id:'CAP-AGU-01',lot:'AGU-A2',counterpartyRefs:['INVESTOR-DEMO-02'],documentCompleteness:67,
    needs:[{id:'CAP-AGU-N1'}],uses:[],reviews:[],interests:[{id:'CAP-AGU-I1'}],ddRequests:[],terms:[{id:'CAP-AGU-T1'}],decisions:[{id:'CAP-AGU-D1'}],commitments:[],closings:[],funding:[],evidence:[],
    events:[
      {id:'CAP-AGU-N1',kind:'CAPITAL_NEED_DECLARED',observedAt:'2026-08-12',amount:36000000,currency:'COP',horizon:'8 meses',provenance:'BASELINE_DEMO'},
      {id:'CAP-AGU-I1',kind:'COUNTERPARTY_INTEREST',observedAt:'2026-08-16',counterpartyRef:'INVESTOR-DEMO-02',interestState:'NON_BINDING_INTEREST',instrumentType:'UNSPECIFIED_DEMO',provenance:'BASELINE_DEMO'},
      {id:'CAP-AGU-T1',kind:'TERM_SHEET_REFERENCE',observedAt:'2026-08-16',counterpartyRef:'INVESTOR-DEMO-02',termSheetRef:'TS-DEMO-AGU-01',termSheetState:'REFERENCE_ONLY_NOT_VERIFIED',provenance:'BASELINE_DEMO'},
      {id:'CAP-AGU-D1',kind:'HUMAN_DECISION_REFERENCE',observedAt:'2026-08-16',counterpartyRef:'INVESTOR-DEMO-02',decisionRef:'DEC-DEMO-AGU-01',decisionState:'UNDER_REVIEW',provenance:'BASELINE_DEMO'}
    ],
    verifiedTermSheets:0,verifiedCommitments:0,legalClosingsVerified:0,fundingExecuted:0,custodyAmount:0,eligibilityDecision:null,creditScore:null,investmentRecommendation:null,automaticInvestmentActions:0,
    context:{commercial:{buyerInterestCount:5},economic:{realizedRevenue:0},dueDiligence:{openGaps:2}}
  }
];

const baseManifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FIN-LE-001',name:'Finca'}};
const context={
  window:{__SANA_CAPITAL_GOVERNANCE__:{cases:()=>structuredClone(live)}},
  views:{reports:()=>'<footer class="footer"></footer>',dataroom:()=>'<footer class="footer"></footer>'},
  document:{addEventListener:()=>{},getElementById:()=>null},
  metric:()=>'',esc:v=>String(v),queueMicrotask:fn=>fn(),Date,structuredClone,console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(snapshotCode,context,{filename:snapshotPath});
const snap=context.window.__SANA_REPORT_SNAPSHOT_CAPITAL_GOVERNANCE__;
assert(snap,'capital governance snapshot API missing');
const manifest=structuredClone(baseManifest);snap.enrichCapitalGovernance(manifest);
assert(manifest.capitalGovernance,'manifest.capitalGovernance missing');
assert.equal(manifest.capitalGovernance.rowCount,2);
assert.equal(manifest.capitalGovernance.counterpartyInterestCount,2);
assert.equal(manifest.capitalGovernance.termSheetReferenceCount,1);
assert.equal(manifest.capitalGovernance.commitmentReferenceCount,0);
assert.equal(manifest.capitalGovernance.fundingExecuted,0);
assert.equal(manifest.capitalGovernance.custodyAmount,0);
assert.equal(manifest.capitalGovernance.eligibilityDecisions,0);
assert.equal(manifest.capitalGovernance.creditScores,0);
assert.equal(manifest.capitalGovernance.investmentRecommendations,0);
const caf=manifest.capitalGovernance.rows.find(r=>r.caseId==='CAP-CAF-01');
assert(caf,'CAF capital snapshot row missing');
assert.equal(caf.documentCompleteness,82);
assert.deepEqual([...caf.counterpartyRefs],['INVESTOR-DEMO-01']);
assert(!('context' in caf),'live commercial/economic/DD context must not be copied into capital snapshot');
assert(!caf.events.some(e=>'detail' in e),'free-form detail must not be copied into capital snapshot');
assert.equal(caf.eligibilityDecision,null);
assert.equal(caf.creditScore,null);
assert.equal(caf.investmentRecommendation,null);
assert.match(manifest.capitalGovernance.integrity,/COUNTERPARTY_REF_ONLY/);
assert.match(manifest.capitalGovernance.integrity,/NO_LIVE_CONTEXT_COPY/);
assert.match(manifest.capitalGovernance.integrity,/DOCUMENT_COMPLETENESS ≠ ELIGIBILITY/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(baseManifest),createdAt:'2026-08-01'};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-18',manifest:structuredClone(manifest),createdAt:'2026-08-18'};
context.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[oldSnapshot,newSnapshot]};
context.window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'OLD',target:'NEW'})};
vm.runInContext(historyCode,context,{filename:historyPath});
const hist=context.window.__SANA_DATAROOM_CAPITAL_GOVERNANCE_HISTORY__;
assert(hist,'capital governance history API missing');
assert.equal(hist.state().state,'CAPTURED');
assert.equal(hist.diff(oldSnapshot,newSnapshot).state,'PARTIAL_GRANULARITY');
assert(!/__SANA_CAPITAL_GOVERNANCE__/.test(historyCode),'history must not read live capital governance');
assert(!/__SANA_CAPITAL_READINESS__/.test(historyCode),'history must not read legacy readiness');
assert(!/__SANA_COMMERCIAL_LEDGER__/.test(historyCode),'history must not read live commercial');
assert(!/__SANA_ECONOMIC_RECONCILIATION__/.test(historyCode),'history must not read live economics');
assert(!/storage\./.test(historyCode),'history must not read mutable storage');
assert.match(hist.integrity,/NO_LIVE_FALLBACK/);
assert.match(hist.integrity,/CHANGE ≠ IMPROVEMENT/);

const laterSnapshot=structuredClone(newSnapshot);laterSnapshot.id='LATER';laterSnapshot.cutoff='2026-08-19';laterSnapshot.manifest.capitalGovernance.rows[0].documentCompleteness=93;
const completenessDiff=hist.diff(newSnapshot,laterSnapshot);
assert(completenessDiff.changes.some(c=>c.field==='Completitud documental'&&c.before==='82'&&c.after==='93'));
assert.match(completenessDiff.integrity,/ELIGIBILITY/,'completeness delta must remain non-decisional');

const baseDd={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>newSnapshot,derive:snapshot=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:newSnapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
context.window.__SANA_DUE_DILIGENCE_GAPS__=baseDd;
vm.runInContext(gapsCode,context,{filename:gapsPath});
const dd=context.window.__SANA_DD_CAPITAL_GOVERNANCE_GAPS__;
assert(dd,'capital governance gaps API missing');
assert.equal(dd.derive(newSnapshot).length,0,'interest or term sheet without commitment/funding must not create a gap by itself');
const lowCompleteness=structuredClone(newSnapshot);lowCompleteness.manifest.capitalGovernance.rows.forEach(r=>r.documentCompleteness=20);
assert.equal(dd.derive(lowCompleteness).length,0,'low document completeness must not become a DD gap by itself');

const problematic=structuredClone(newSnapshot);
const bad=problematic.manifest.capitalGovernance.rows[0];
bad.caseId='';bad.lot='';bad.documentCompleteness=140;
bad.events.push(
  {id:'BAD-NEED',kind:'CAPITAL_NEED_DECLARED',amount:null,currency:'',horizon:'',provenance:''},
  {id:'BAD-USE',kind:'USE_OF_FUNDS_DECLARED',useOfFunds:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-I',kind:'COUNTERPARTY_INTEREST',counterpartyRef:'',interestState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-DD',kind:'DUE_DILIGENCE_REQUEST',counterpartyRef:'',requestRef:'',requestState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-TERM',kind:'TERM_SHEET_REFERENCE',counterpartyRef:'',termSheetRef:'',termSheetState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-DEC',kind:'HUMAN_DECISION_REFERENCE',decisionRef:'',decisionState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-COMMIT',kind:'COMMITMENT_REFERENCE',counterpartyRef:'',commitmentRef:'',commitmentState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-CLOSE',kind:'CLOSING_STATUS_DECLARED',closingRef:'',closingState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-FUND',kind:'FUNDING_STATUS_DECLARED',fundingRef:'',fundingState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-EVID',kind:'EVIDENCE',evidenceRef:'',supports:['MISSING-EVENT'],provenance:'DECLARED_DEMO'}
);
bad.verifiedTermSheets=1;bad.verifiedCommitments=1;bad.legalClosingsVerified=1;bad.fundingExecuted=1;bad.custodyAmount=100;bad.eligibilityDecision='APPROVED';bad.creditScore=900;bad.investmentRecommendation='INVEST';bad.automaticInvestmentActions=1;
problematic.manifest.capitalGovernance.verifiedCommitments=1;problematic.manifest.capitalGovernance.fundingExecuted=1;problematic.manifest.capitalGovernance.custodyAmount=100;problematic.manifest.capitalGovernance.eligibilityDecisions=1;problematic.manifest.capitalGovernance.creditScores=1;problematic.manifest.capitalGovernance.investmentRecommendations=1;
const issues=dd.derive(problematic);const text=issues.map(x=>x.condition).join(' | ');
assert.match(text,/sin caseId/);
assert.match(text,/sin lote/);
assert.match(text,/fuera de rango/);
assert.match(text,/Necesidad de capital declarada sin monto válido/);
assert.match(text,/Necesidad de capital sin horizonte/);
assert.match(text,/Uso de fondos declarado sin detalle/);
assert.match(text,/Interés de contraparte sin counterpartyRef/);
assert.match(text,/Solicitud DD sin requestRef/);
assert.match(text,/term sheet sin termSheetRef/);
assert.match(text,/decisión humana sin decisionRef/);
assert.match(text,/commitment sin commitmentRef/);
assert.match(text,/cierre declarado sin closingRef/);
assert.match(text,/funding declarado sin fundingRef/);
assert.match(text,/evento no resuelto/);
assert.match(text,/term sheet verificado fuera de autoridad/);
assert.match(text,/commitment verificado fuera de autoridad/);
assert.match(text,/cierre legal verificado fuera de autoridad/);
assert.match(text,/funding ejecutado fuera de autoridad/);
assert.match(text,/monto bajo custodia fuera de autoridad/);
assert.match(text,/decisión de elegibilidad fuera de autoridad/);
assert.match(text,/credit score fuera de autoridad/);
assert.match(text,/recomendación de inversión fuera de autoridad/);
assert.match(text,/acción automática de inversión fuera de autoridad/);
assert.match(dd.integrity,/NO_COUNTERPARTY_INTEREST ≠ GAP/);
assert.match(dd.integrity,/LOW_DOCUMENT_COMPLETENESS ≠ GAP/);
assert.match(dd.integrity,/CAPITAL_GAP ≠ ELIGIBILITY/);

for(const code of [snapshotCode,historyCode,gapsCode]){
  assert(!/fetch\s*\(/.test(code));
  assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
  assert(!/productionActivationAllowed\s*=\s*true/.test(code));
  assert(!/canonicalMutated\s*=\s*true/.test(code));
}
console.log('SANA capital governance history v62 validation: OK');
