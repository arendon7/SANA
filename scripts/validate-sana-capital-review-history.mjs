import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotPath='apps/control-web/public/sana-v3-report-snapshot-capital-review.js';
const historyPath='apps/control-web/public/sana-v3-dataroom-capital-review-history.js';
const gapsPath='apps/control-web/public/sana-v3-due-diligence-capital-review-gaps.js';
const snapshotCode=fs.readFileSync(snapshotPath,'utf8');
const historyCode=fs.readFileSync(historyPath,'utf8');
const gapsCode=fs.readFileSync(gapsPath,'utf8');

const live=[
  {
    id:'CR-CAF-01',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',reviewerRefs:['REVIEWER-DEMO-01'],snapshotRefs:['SNAP-DEMO-CAP-CAF-01'],
    requests:[{id:'RQ1'}],starts:[{id:'ST1'}],documentRequests:[],notes:[{id:'N1'}],assessments:[{id:'A1'}],completions:[{id:'C1'}],decisions:[],evidence:[{id:'E1'}],
    semantics:{reviewOpen:false,startedWithoutRequest:[],completedWithoutStart:[],decisionWithoutCompletedReview:[],unresolvedEvidence:[],unsupportedCompletion:[]},
    events:[
      {id:'RQ1',kind:'REVIEW_REQUESTED',observedAt:'2026-08-16',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-DEMO-CAP-CAF-01',reviewerRef:'REVIEWER-DEMO-01',scopeRef:'CAPITAL_GOVERNANCE_DOCUMENTARY_REVIEW',requestRef:'REV-REQ-1',reviewState:'REQUESTED',provenance:'BASELINE_DEMO',detail:'MUST NOT COPY'},
      {id:'ST1',kind:'REVIEW_STARTED',observedAt:'2026-08-16',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-DEMO-CAP-CAF-01',reviewerRef:'REVIEWER-DEMO-01',reviewState:'IN_REVIEW',provenance:'BASELINE_DEMO'},
      {id:'N1',kind:'REVIEW_NOTE_REFERENCE',observedAt:'2026-08-16',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-DEMO-CAP-CAF-01',reviewerRef:'REVIEWER-DEMO-01',noteRef:'NOTE-1',noteState:'REFERENCE_ONLY',provenance:'BASELINE_DEMO'},
      {id:'A1',kind:'ASSESSMENT_REFERENCE',observedAt:'2026-08-16',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-DEMO-CAP-CAF-01',reviewerRef:'REVIEWER-DEMO-01',assessmentRef:'ASSESS-1',assessmentState:'DOCUMENTARY_ONLY',provenance:'BASELINE_DEMO'},
      {id:'C1',kind:'REVIEW_COMPLETED',observedAt:'2026-08-16',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-DEMO-CAP-CAF-01',reviewerRef:'REVIEWER-DEMO-01',reviewState:'COMPLETED_DOCUMENTARY_ONLY',outcomeRef:'OUTCOME-1',outcomeState:'NO_ELIGIBILITY_DECISION',provenance:'BASELINE_DEMO'},
      {id:'E1',kind:'EVIDENCE',observedAt:'2026-08-16',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-DEMO-CAP-CAF-01',reviewerRef:'REVIEWER-DEMO-01',evidenceRef:'EV-1',supports:['C1'],provenance:'BASELINE_DEMO'}
    ],reviewerIdentitiesVerified:0,approvalsVerified:0,eligibilityDecision:null,creditScore:null,investmentRecommendation:null,executionActions:0,fundingExecuted:0,
    reviewerIdentity:{name:'MUST NOT COPY',email:'private@example.com'}
  },
  {
    id:'CR-AGU-01',capitalCaseRef:'CAP-AGU-01',lot:'AGU-A2',reviewerRefs:['REVIEWER-DEMO-02'],snapshotRefs:['SNAP-DEMO-CAP-AGU-01'],
    requests:[{id:'RQ2'}],starts:[{id:'ST2'}],documentRequests:[],notes:[],assessments:[],completions:[],decisions:[],evidence:[],
    semantics:{reviewOpen:true,startedWithoutRequest:[],completedWithoutStart:[],decisionWithoutCompletedReview:[],unresolvedEvidence:[],unsupportedCompletion:[]},
    events:[
      {id:'RQ2',kind:'REVIEW_REQUESTED',observedAt:'2026-08-17',capitalCaseRef:'CAP-AGU-01',lot:'AGU-A2',snapshotRef:'SNAP-DEMO-CAP-AGU-01',reviewerRef:'REVIEWER-DEMO-02',requestRef:'REV-REQ-2',reviewState:'REQUESTED',provenance:'BASELINE_DEMO'},
      {id:'ST2',kind:'REVIEW_STARTED',observedAt:'2026-08-17',capitalCaseRef:'CAP-AGU-01',lot:'AGU-A2',snapshotRef:'SNAP-DEMO-CAP-AGU-01',reviewerRef:'REVIEWER-DEMO-02',reviewState:'IN_REVIEW',provenance:'BASELINE_DEMO'}
    ],reviewerIdentitiesVerified:0,approvalsVerified:0,eligibilityDecision:null,creditScore:null,investmentRecommendation:null,executionActions:0,fundingExecuted:0
  }
];
const baseManifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FIN-LE-001',name:'Finca'}};
const context={window:{__SANA_CAPITAL_REVIEW__:{cases:()=>structuredClone(live)}},views:{reports:()=>'<footer class="footer"></footer>',dataroom:()=>'<footer class="footer"></footer>'},document:{addEventListener:()=>{},getElementById:()=>null},metric:()=>'',esc:v=>String(v),queueMicrotask:fn=>fn(),Date,structuredClone,console};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(snapshotCode,context,{filename:snapshotPath});
const snap=context.window.__SANA_REPORT_SNAPSHOT_CAPITAL_REVIEW__;
assert(snap,'capital review snapshot API missing');
const manifest=structuredClone(baseManifest);snap.enrichCapitalReview(manifest);
assert(manifest.capitalReview,'manifest.capitalReview missing');
assert.equal(manifest.capitalReview.rowCount,2);
assert.equal(manifest.capitalReview.reviewCompletedCount,1);
assert.equal(manifest.capitalReview.openReviewCount,1);
assert.equal(manifest.capitalReview.approvalsVerified,0);
assert.equal(manifest.capitalReview.eligibilityDecisions,0);
assert.equal(manifest.capitalReview.creditScores,0);
assert.equal(manifest.capitalReview.investmentRecommendations,0);
assert.equal(manifest.capitalReview.executionActions,0);
assert.equal(manifest.capitalReview.fundingExecuted,0);
const caf=manifest.capitalReview.rows.find(r=>r.caseId==='CR-CAF-01');
assert(caf,'CAF review row missing');
assert.deepEqual([...caf.reviewerRefs],['REVIEWER-DEMO-01']);
assert.deepEqual([...caf.snapshotRefs],['SNAP-DEMO-CAP-CAF-01']);
assert(!('reviewerIdentity' in caf),'reviewer identity must not be copied');
assert(!caf.events.some(e=>'detail' in e),'free-form review detail must not be copied');
assert.equal(caf.approvalsVerified,0);
assert.equal(caf.eligibilityDecision,null);
assert.match(manifest.capitalReview.integrity,/REVIEWER_REF_ONLY/);
assert.match(manifest.capitalReview.integrity,/NO_REVIEWER_IDENTITY/);
assert.match(manifest.capitalReview.integrity,/NO_FREEFORM_NOTE_COPY/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(baseManifest),createdAt:'2026-08-01'};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-18',manifest:structuredClone(manifest),createdAt:'2026-08-18'};
context.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[oldSnapshot,newSnapshot]};
context.window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'OLD',target:'NEW'})};
vm.runInContext(historyCode,context,{filename:historyPath});
const hist=context.window.__SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__;
assert(hist,'capital review history API missing');
assert.equal(hist.state().state,'CAPTURED');
assert.equal(hist.diff(oldSnapshot,newSnapshot).state,'PARTIAL_GRANULARITY');
assert(!/__SANA_CAPITAL_REVIEW__/.test(historyCode),'history must not read live review ledger');
assert(!/__SANA_CAPITAL_GOVERNANCE__/.test(historyCode),'history must not read live governance');
assert(!/storage\./.test(historyCode),'history must not read mutable storage');
assert.match(hist.integrity,/NO_LIVE_FALLBACK/);
assert.match(hist.integrity,/CHANGE ≠ IMPROVEMENT/);

const later=structuredClone(newSnapshot);later.id='LATER';later.cutoff='2026-08-19';const agu=later.manifest.capitalReview.rows.find(r=>r.caseId==='CR-AGU-01');agu.reviewOpen=false;agu.reviewCompletedCount=1;
const d=hist.diff(newSnapshot,later);assert(d.changes.some(c=>c.field==='Revisiones cerradas'));assert.match(d.integrity,/APPROVAL/,'closing a review must remain non-approval');

const baseDd={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>newSnapshot,derive:snapshot=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:newSnapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
context.window.__SANA_DUE_DILIGENCE_GAPS__=baseDd;
vm.runInContext(gapsCode,context,{filename:gapsPath});
const dd=context.window.__SANA_DD_CAPITAL_REVIEW_GAPS__;
assert(dd,'capital review gaps API missing');
assert.equal(dd.derive(newSnapshot).length,0,'open or completed review without approval/decision must not be a gap by itself');
const noReviews=structuredClone(newSnapshot);noReviews.manifest.capitalReview.rows=[];noReviews.manifest.capitalReview.rowCount=0;assert.equal(dd.derive(noReviews).length,0,'absence of reviews must not be a gap by itself');

const problematic=structuredClone(newSnapshot);const bad=problematic.manifest.capitalReview.rows[0];bad.caseId='';bad.capitalCaseRef='';bad.lot='';bad.startedWithoutRequest=['BAD-ST'];bad.completedWithoutStart=['BAD-C'];bad.decisionWithoutCompletedReview=['BAD-D'];bad.unresolvedEvidence=['MISSING'];bad.unsupportedCompletion=['BAD-C'];bad.events.push(
  {id:'BAD-RQ',kind:'REVIEW_REQUESTED',snapshotRef:'',reviewerRef:'',requestRef:'',reviewState:'',provenance:''},
  {id:'BAD-DOC',kind:'DOCUMENT_REQUEST',snapshotRef:'',reviewerRef:'',documentRequestRef:'',documentRequestState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-NOTE',kind:'REVIEW_NOTE_REFERENCE',snapshotRef:'',reviewerRef:'',noteRef:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-A',kind:'ASSESSMENT_REFERENCE',snapshotRef:'',reviewerRef:'',assessmentRef:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-C',kind:'REVIEW_COMPLETED',snapshotRef:'',reviewerRef:'',outcomeRef:'',reviewState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-D',kind:'HUMAN_DECISION_REFERENCE',snapshotRef:'',reviewerRef:'',decisionRef:'',decisionState:'',provenance:'DECLARED_DEMO'},
  {id:'BAD-E',kind:'EVIDENCE',evidenceRef:'',supports:['MISSING-2'],provenance:'DECLARED_DEMO'}
);bad.reviewerIdentitiesVerified=1;bad.approvalsVerified=1;bad.eligibilityDecision='APPROVED';bad.creditScore=850;bad.investmentRecommendation='INVEST';bad.executionActions=1;bad.fundingExecuted=1;
problematic.manifest.capitalReview.reviewerIdentitiesVerified=1;problematic.manifest.capitalReview.approvalsVerified=1;problematic.manifest.capitalReview.eligibilityDecisions=1;problematic.manifest.capitalReview.creditScores=1;problematic.manifest.capitalReview.investmentRecommendations=1;problematic.manifest.capitalReview.executionActions=1;problematic.manifest.capitalReview.fundingExecuted=1;
const issues=dd.derive(problematic);const text=issues.map(x=>x.condition).join(' | ');
assert.match(text,/sin caseId/);assert.match(text,/sin capitalCaseRef/);assert.match(text,/sin lote/);assert.match(text,/iniciada sin solicitud/);assert.match(text,/cerrada sin inicio/);assert.match(text,/Decisión humana referenciada sin revisión cerrada/);assert.match(text,/no resuelto/);assert.match(text,/cerrada sin soporte/);assert.match(text,/sin reviewerRef/);assert.match(text,/sin snapshotRef/);assert.match(text,/sin requestRef/);assert.match(text,/Requerimiento documental sin documentRequestRef/);assert.match(text,/nota sin noteRef/);assert.match(text,/assessment sin assessmentRef/);assert.match(text,/cerrada sin outcomeRef/);assert.match(text,/sin decisionRef/);assert.match(text,/identidad de revisor verificada fuera de autoridad/);assert.match(text,/aprobación verificada fuera de autoridad/);assert.match(text,/elegibilidad fuera de autoridad/);assert.match(text,/credit score fuera de autoridad/);assert.match(text,/recomendación de inversión fuera de autoridad/);assert.match(text,/acción de ejecución fuera de autoridad/);assert.match(text,/funding ejecutado fuera de autoridad/);
assert.match(dd.integrity,/NO_REVIEW ≠ GAP/);assert.match(dd.integrity,/REVIEW_OPEN ≠ GAP/);assert.match(dd.integrity,/HUMAN_DECISION_REFERENCE ≠ GAP/);
for(const code of [snapshotCode,historyCode,gapsCode]){assert(!/fetch\s*\(/.test(code));assert(!/productionExecutionAvailable\s*=\s*true/.test(code));assert(!/productionActivationAllowed\s*=\s*true/.test(code));assert(!/canonicalMutated\s*=\s*true/.test(code));}
console.log('SANA capital human review history v64 validation: OK');
