import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const target=process.argv[2];if(!target)throw new Error('COMPILED_PILOT_CERTIFIER_INDEX_REQUIRED');
const api=await import(pathToFileURL(path.resolve(target)).href);
const {CONTROL_D10_APPROVAL_PROTOCOL,ControlProductionReadinessOrchestrator,computeD10ApprovalDigest,validateControlReleaseCandidate}=api;
const candidate={version:'0.22.0-alpha18',headSha:'a'.repeat(40),reviewBundleSha256:'b'.repeat(64)};
const initialRcCandidate={...candidate,version:'0.22.0-initial-rc1'};
const fixedNow=()=>new Date('2026-08-12T21:00:00.000Z');
let passed=0;const check=(name,value)=>{assert.ok(value,name);passed++;console.log(`PASS ${name}`)};
const goodIdentity=()=>({state:'JWKS_CONNECTED_READ_ONLY_PROBE',realTokenVerified:false,canonicalMutated:false,executionState:'NOT_EXECUTED'});
const goodPostgres=()=>({state:'CONNECTED_READ_ONLY_PROBE',tlsRequired:true,canonicalWriteExecuted:false});
const goodAck=()=>({state:'EXTERNAL_ACK_PROVIDER_METADATA_CONNECTED_READ_ONLY_PROBE',realExternalAckObserved:false,canonicalMutated:false,executionState:'NOT_EXECUTED'});
function ports(overrides={}){const calls={identity:0,postgres:0,externalAck:0};return {calls,value:{identity:{async verifyConnectivity(){calls.identity++;if(overrides.identityError)throw new Error('SECRET_MUST_NOT_ESCAPE');return overrides.identity??goodIdentity()}},postgres:{async verifyConnectivity(){calls.postgres++;if(overrides.postgresError)throw new Error('DB_SECRET_MUST_NOT_ESCAPE');return overrides.postgres??goodPostgres()}},externalAck:{async verifyConnectivity(){calls.externalAck++;if(overrides.ackError)throw new Error('ACK_SECRET_MUST_NOT_ESCAPE');return overrides.externalAck??goodAck()}}}}}
function approval(fields={}){const base={protocol:CONTROL_D10_APPROVAL_PROTOCOL,decision:'APPROVED',actorType:'HUMAN',approverId:'human:release-owner-01',approvalRecordId:'d10:control-alpha18-001',approvalNote:'Human product approval for the exact reviewed release candidate.',approvedAt:'2026-08-12T20:55:00.000Z',candidate,...fields};return {...base,approvalDigestSha256:computeD10ApprovalDigest(base)}}
{
 const p=ports();const o=new ControlProductionReadinessOrchestrator(p.value,candidate,fixedNow);const r=await o.assess();
 check('preflight-only:ready-for-d10',r.state==='READY_FOR_D10_HUMAN_REVIEW');check('preflight-only:all-connectivity-pass',r.checks.slice(0,3).every(x=>x.status==='PASS'));check('preflight-only:d10-pending',r.checks[3].status==='PENDING');check('preflight-only:each-port-once',Object.values(p.calls).every(x=>x===1));check('preflight-only:no-execution',r.productionExecutionEnabled===false&&r.canonicalWritePermitted===false&&r.browserActivationAllowed===false&&r.canonicalMutated===false);check('preflight-only:no-real-token-or-ack',r.realProductionTokenVerified===false&&r.realExternalAckObserved===false);check('preflight-only:digest',/^[a-f0-9]{64}$/.test(r.assessmentDigestSha256));
 const r2=await o.assess();check('deterministic:fixed-input-digest',r2.assessmentDigestSha256===r.assessmentDigestSha256);
}
{
 const p=ports();const o=new ControlProductionReadinessOrchestrator(p.value,candidate,fixedNow);const r=await o.assess(approval());
 check('d10-valid:activation-review-only',r.state==='READY_FOR_EXPLICIT_ACTIVATION_REVIEW');check('d10-valid:all-four-pass',r.checks.every(x=>x.status==='PASS'));check('d10-valid:still-no-execution',r.productionExecutionEnabled===false&&r.canonicalWritePermitted===false&&r.browserActivationAllowed===false);
}
for(const [name,mutate] of [
 ['ai-actor',a=>({...a,actorType:'AI'})],
 ['candidate-sha-drift',a=>({...a,candidate:{...a.candidate,headSha:'c'.repeat(40)}})],
 ['bundle-digest-drift',a=>({...a,candidate:{...a.candidate,reviewBundleSha256:'d'.repeat(64)}})],
 ['approval-digest-tamper',a=>({...a,approvalDigestSha256:'e'.repeat(64)})],
 ['approval-note-empty',a=>({...a,approvalNote:'short'})],
 ['future-approval',a=>{const x={...a,approvedAt:'2026-08-12T21:10:01.000Z'};return {...x,approvalDigestSha256:computeD10ApprovalDigest({...x,approvalDigestSha256:undefined})}}]
]){
 const p=ports();const o=new ControlProductionReadinessOrchestrator(p.value,candidate,fixedNow);let a=approval();a=mutate(a);if(name!=='approval-digest-tamper'&&!['candidate-sha-drift','bundle-digest-drift','ai-actor','approval-note-empty'].includes(name)&&a.approvalDigestSha256===undefined)throw new Error('TEST_SETUP_INVALID');const r=await o.assess(a);check(`d10-invalid:${name}`,r.state==='BLOCKED_INVALID_D10_EVIDENCE'&&r.checks[3].status==='FAIL'&&r.productionExecutionEnabled===false);
}
for(const [name,opts] of [
 ['identity-error',{identityError:true}],['postgres-error',{postgresError:true}],['ack-error',{ackError:true}],
 ['identity-evidence-drift',{identity:{...goodIdentity(),realTokenVerified:true}}],
 ['postgres-write-observed',{postgres:{...goodPostgres(),canonicalWriteExecuted:true}}],
 ['ack-real-observed',{externalAck:{...goodAck(),realExternalAckObserved:true}}]
]){
 const p=ports(opts);const o=new ControlProductionReadinessOrchestrator(p.value,candidate,fixedNow);const r=await o.assess();check(`prerequisite:${name}:blocked`,r.state==='BLOCKED_PRODUCTION_PREREQUISITES');check(`prerequisite:${name}:no-execution`,r.productionExecutionEnabled===false&&r.canonicalWritePermitted===false&&r.canonicalMutated===false);
}
validateControlReleaseCandidate(initialRcCandidate);check('candidate:initial-rc-valid',true);
const initialRcOrchestrator=new ControlProductionReadinessOrchestrator(ports().value,initialRcCandidate,fixedNow);const initialRcAssessment=await initialRcOrchestrator.assess();check('candidate:initial-rc-reaches-d10-review',initialRcAssessment.state==='READY_FOR_D10_HUMAN_REVIEW');
for(const bad of [
 {...candidate,version:'0.22.0'},
 {...candidate,version:'0.22.0-initial-rc0'},
 {...candidate,version:'0.22.0-rc1'},
 {...candidate,headSha:'not-a-sha'},
 {...candidate,reviewBundleSha256:'bad'}
])assert.throws(()=>new ControlProductionReadinessOrchestrator(ports().value,bad,fixedNow),/PRODUCTION_READINESS_/);
check('candidate:strict-binding',true);
console.log(`PASS_CONTROL_PRODUCTION_READINESS_RUNTIME ${passed}/${passed}`);
