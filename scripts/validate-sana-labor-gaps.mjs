import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-labor-gaps.js','utf8');
globalThis.window={__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>null,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]}),current:()=>({valid:false})}};
globalThis.views={reports:()=>'<footer class="footer"></footer>'};
globalThis.esc=v=>String(v??'');
vm.runInThisContext(source,{filename:'sana-v3-due-diligence-labor-gaps.js'});
const api=window.__SANA_DD_LABOR_GAPS__;
assert.ok(api);

const clean={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',labor:{cases:[
  {caseId:'L1',role:'Operario',lot:'LOT-1',activityId:'T-1',assignmentCount:0,attendanceCount:0,workedTimeCount:1,workedHours:4,resultCount:1,evidenceCount:0,rateReferenceCount:0,costDeclarationCount:0,declaredCost:0,paymentStatusCount:0,paymentCaptured:0,unsupportedWorked:[],unresolvedCostBasis:[],privacyState:'IDENTITY_REDACTED',events:[{id:'W1',kind:'WORKED_TIME',hours:4,role:'Operario',lot:'LOT-1',activityId:'T-1'},{id:'R1',kind:'TASK_RESULT',resultClass:'USER_RESULT_DECLARATION',activityId:'T-1'}]},
  {caseId:'L2',role:'Técnica',lot:'LOT-2',activityId:'T-2',assignmentCount:1,attendanceCount:0,workedTimeCount:1,workedHours:2,resultCount:0,evidenceCount:0,rateReferenceCount:0,costDeclarationCount:0,declaredCost:0,paymentStatusCount:1,paymentCaptured:0,unsupportedWorked:[],unresolvedCostBasis:[],privacyState:'IDENTITY_REDACTED',events:[{id:'P2',kind:'PAYMENT_STATUS',paymentState:'NOT_CAPTURED',paymentRef:''}]}
]}}};
assert.equal(api.derive(clean).length,0,'no attendance/cost/payment must not become gaps by themselves');

const broken={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',labor:{cases:[
  {caseId:'B1',role:'',lot:'',activityId:'',personLabel:'Leak Name',assignmentCount:0,attendanceCount:0,workedTimeCount:1,workedHours:0,resultCount:1,evidenceCount:1,rateReferenceCount:0,costDeclarationCount:1,declaredCost:10,paymentStatusCount:1,paymentCaptured:1,unsupportedWorked:[],unresolvedCostBasis:['MISSING'],privacyState:'LEAK',events:[{id:'E1',kind:'EVIDENCE',evidenceRef:''},{id:'P1',kind:'PAYMENT_STATUS',paymentState:'PAID_DECLARED',paymentRef:''}]}
]}}};
const gaps=api.derive(broken);const ids=new Set(gaps.map(g=>g.id));
for(const id of ['labor:privacy-leak','labor:B1:hours','labor:B1:role','labor:B1:scope','labor:B1:result-activity','labor:B1:cost-basis','labor:B1:E1:evidence-ref','labor:B1:P1:payment-ref'])assert.ok(ids.has(id),id);
assert.ok(gaps.every(g=>g.status==='OPEN_AT_SNAPSHOT'));
assert.match(api.integrity,/PRIVACY_MINIMIZED/);
assert.match(api.integrity,/NO_HR_SCORING_OR_CREDIT_INFERENCE/);
assert.equal(source.includes('__SANA_LABOR_LEDGER__'),false,'DD labor must be snapshot-only');
assert.equal(source.includes('storage.'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('creditApproved'),false);
assert.equal(source.includes('investmentApproved'),false);
console.log('labor DD gap contract OK · documentary/privacy inconsistencies only, no attendance or performance scoring');
