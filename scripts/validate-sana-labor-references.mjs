import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-labor-references.js','utf8');
const cases=[
  {id:'C1',lot:'L1',role:'Operario',activityId:'A1',events:[
    {id:'A-EV',caseId:'C1',kind:'ASSIGNMENT',lot:'L1',activityId:'A1',observedAt:'2026-08-14T06:00:00-05:00'},
    {id:'RATE-EV',caseId:'C1',kind:'RATE_REFERENCE',lot:'L1',activityId:'A1',observedAt:'2026-08-14T07:00:00-05:00',sourceRef:'RATE-DECL'},
    {id:'W-EV',caseId:'C1',kind:'WORKED_TIME',lot:'L1',activityId:'A1',observedAt:'2026-08-14T10:00:00-05:00'},
    {id:'R-EV',caseId:'C1',kind:'TASK_RESULT',lot:'L1',activityId:'A1',observedAt:'2026-08-14T10:05:00-05:00'},
    {id:'E-EV',caseId:'C1',kind:'EVIDENCE',lot:'L1',activityId:'A1',observedAt:'2026-08-14T10:10:00-05:00',evidenceRef:'DOC1',supports:['W-EV','R-EV']},
    {id:'C-EV',caseId:'C1',kind:'LABOR_COST',lot:'L1',activityId:'A1',observedAt:'2026-08-14T10:20:00-05:00',basisRefs:['W-EV','RATE-EV'],costRef:'COST-DECL'},
    {id:'P-EV',caseId:'C1',kind:'PAYMENT_STATUS',lot:'L1',activityId:'A1',observedAt:'2026-08-14T10:30:00-05:00',paymentRef:'PAY-DECL'}
  ],assignments:[{}],attendance:[],worked:[{}],results:[{}],evidence:[{}],rates:[{}],costs:[{}],payments:[{}],hours:3,declaredCost:90,costUnit:'kCOP',semantics:{paymentCaptured:1,unsupportedWorked:[],unresolvedCostBasis:[]},integrity:'BASE'},
  {id:'C2',lot:'L1',role:'Técnico',activityId:'A1',events:[
    {id:'W2',caseId:'C2',kind:'WORKED_TIME',lot:'L1',activityId:'A2',observedAt:'2026-08-14T09:00:00-05:00'},
    {id:'E2',caseId:'C2',kind:'EVIDENCE',lot:'L1',activityId:'A1',observedAt:'2026-08-14T09:10:00-05:00',evidenceRef:'NO-DOC',supports:['W-EV']},
    {id:'C2COST',caseId:'C2',kind:'LABOR_COST',lot:'L1',activityId:'A1',observedAt:'2026-08-14T10:00:00-05:00',basisRefs:['E2','W3']},
    {id:'W3',caseId:'C2',kind:'WORKED_TIME',lot:'L1',activityId:'A1',observedAt:'2026-08-14T11:00:00-05:00'}
  ],assignments:[],attendance:[],worked:[{},{}],results:[],evidence:[{}],rates:[],costs:[{}],payments:[],hours:2,declaredCost:20,costUnit:'kCOP',semantics:{paymentCaptured:0,unsupportedWorked:[],unresolvedCostBasis:[]},integrity:'BASE'},
  {id:'C3',lot:'L1',role:'Legacy',activityId:'A1',events:[{id:'LEG-W',caseId:'C3',kind:'WORKED_TIME',lot:'L1',activityId:'A1',observedAt:'2026-08-14T08:00:00-05:00'}],assignments:[],attendance:[],worked:[{}],results:[],evidence:[],rates:[],costs:[],payments:[],hours:1,declaredCost:0,costUnit:'',semantics:{paymentCaptured:0,unsupportedWorked:[],unresolvedCostBasis:[]},integrity:'BASE'}
];
const base={schema:'SANA_LABOR_LEDGER_V1',cases:()=>cases.map(c=>({...c,events:c.events.map(e=>({...e}))})),forLot:l=>cases.filter(c=>c.lot===l),forActivity:a=>cases.filter(c=>c.activityId===a),summary:()=>({schema:'SANA_LABOR_LEDGER_V1',cases:cases.length,integrity:'BASE'}),integrity:'BASE'};
const sandbox={window:{__SANA_LABOR_LEDGER__:base,__SANA_PLAN_FIELD_WORKFLOW__:{findActivity:id=>id==='A1'?{id:'A1',lot:'L1'}:id==='A2'?{id:'A2',lot:'L2'}:null}},DEMO:{evidence:[{id:'DOC1',lot:'L1'}]},storage:{records:[{id:'M1',type:'labor-reference-meta',values:{laborSchema:'SANA_LABOR_LEDGER_V1',caseId:'C1',referenceVersion:'V141'}},{id:'M2',type:'labor-reference-meta',values:{laborSchema:'SANA_LABOR_LEDGER_V1',caseId:'C2',referenceVersion:'V141'}}]},views:{team:()=>''},document:{addEventListener:()=>{}},identity:{displayName:'QA'},esc:v=>String(v??''),metric:()=>'',openModal:()=>{},console};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_LABOR_LEDGER__;
assert.equal(api.referenceVersion,'V141');
assert.equal(api.forCase('C3').referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(api.forCase('C3').referenceCoverage.total,0);
assert.equal(api.forCase('C1').referenceIssues,0);
assert.equal(api.forCase('C1').referenceCoverage.linked,12);
assert.equal(api.forCase('C1').declaredNonCanonicalReferences.length,3);
const bad=api.forCase('C2').referenceRows;
assert.ok(bad.some(r=>r.kind==='ACTIVITY'&&r.reference.status==='CROSS_LOT_REFERENCE'));
assert.ok(bad.some(r=>r.kind==='EVIDENCE_REF'&&r.reference.status==='MISSING_TARGET'));
assert.ok(bad.some(r=>r.kind==='SUPPORTS'&&r.reference.status==='CROSS_CASE_REFERENCE'));
assert.ok(bad.some(r=>r.kind==='COST_BASIS'&&r.reference.status==='KIND_MISMATCH'));
assert.ok(bad.some(r=>r.kind==='COST_BASIS'&&r.reference.status==='FORWARD_REFERENCE'));
assert.equal(api.summary().referenceCaptured,2);
assert.equal(api.summary().legacyReferenceNotCaptured,1);
assert.match(api.integrity,/NO_HR_SCORE|HR_SCORE/);
assert.match(api.integrity,/PAYROLL_AUTHORITY/);
console.log('labor references V141: ok');
