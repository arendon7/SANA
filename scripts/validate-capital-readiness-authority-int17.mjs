import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-authority-int17';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/identity-access/src/index.ts',
  'services/investment-portfolio/src/readiness.ts',
  'services/investment-portfolio/src/readiness-persistence.ts',
  'services/investment-portfolio/src/readiness-authority.ts',
  '--ignoreConfig','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--strict','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_INT17_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await writeFile(`${tmp}/package.json`,JSON.stringify({type:'module'}));
const importCompiled=async path=>import(`${pathToFileURL(resolve(tmp,path)).href}?v=${Date.now()}-${Math.random()}`);
const access=await importCompiled('services/identity-access/src/index.js');
const authority=await importCompiled('services/investment-portfolio/src/readiness-authority.js');

function assert(condition,message){if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)}
function pass(name){console.log(`PASS ${name}`)}
async function expectReject(work,code){let threw=false;try{await work()}catch(error){threw=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(threw,`EXPECTED_REJECT_${code}`)}
function membership(role,grants,{tenantId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',actorId=`actor:${role.toLowerCase()}`,active=true}={}){return Object.freeze({tenantId,actorId,roles:Object.freeze([role]),grantedPermissions:Object.freeze([...grants]),active})}

const P=access.CAPITAL_READINESS_PERMISSIONS;
assert(JSON.stringify(P)===JSON.stringify(authority.CAPITAL_READINESS_AUTHORITY_PERMISSIONS),'PERMISSION_IDENTIFIER_PARITY');
pass('PERMISSION_IDENTIFIER_PARITY');

const all=Object.values(P);
const owner=membership('OWNER',all);
const admin=membership('ADMIN',all,{actorId:'human:reviewer'});
const agronomist=membership('AGRONOMIST',all,{actorId:'human:agronomist'});
const operator=membership('OPERATOR',all);
const viewer=membership('VIEWER',all);
const investor=membership('INVESTOR',all,{actorId:'investor:read-only'});

assert(all.every(permission=>access.effectivePermissions(owner).includes(permission)),'OWNER_ALL_READINESS_PERMISSIONS');
assert(all.every(permission=>access.effectivePermissions(admin).includes(permission)),'ADMIN_ALL_READINESS_PERMISSIONS');
assert(JSON.stringify(access.effectivePermissions(agronomist).filter(p=>p.startsWith('invest:')))===JSON.stringify([P.READ,P.OPERATE,P.REMEDIATE].sort()),'AGRONOMIST_LIMITED_READINESS_PERMISSIONS');
assert(access.effectivePermissions(operator).filter(p=>p.startsWith('invest:')).length===0,'OPERATOR_NO_READINESS_PERMISSION');
assert(access.effectivePermissions(viewer).filter(p=>p.startsWith('invest:')).length===0,'VIEWER_NO_READINESS_PERMISSION');
assert(JSON.stringify(access.effectivePermissions(investor).filter(p=>p.startsWith('invest:')))===JSON.stringify([P.READ]),'INVESTOR_READ_ONLY');
pass('ROLE_PERMISSION_CEILINGS');

const adminNoGrant=membership('ADMIN',[],{actorId:'human:no-grant'});
const adminNoGrantAuth=access.createMembershipPermissionAuthorizer(adminNoGrant);
await expectReject(async()=>adminNoGrantAuth.require(P.FINALIZE),'PERMISSION_DENIED');
const inactiveOwner=membership('OWNER',all,{active:false,actorId:'human:inactive'});
await expectReject(async()=>access.createMembershipPermissionAuthorizer(inactiveOwner).require(P.READ),'MEMBERSHIP_INACTIVE');
pass('EXPLICIT_GRANT_AND_ACTIVE_MEMBERSHIP_REQUIRED');

class RecordingExecutor{
  constructor(responder=()=>({rows:[],rowCount:1})){this.responder=responder;this.calls=[];this.transactions=0;this.commits=0;this.rollbacks=0;}
  async transaction(work){
    this.transactions++;
    const tx={query:async(sql,params=[])=>{const call={sql,params:[...params]};this.calls.push(call);return this.responder(sql,params,this.calls.length-1)}};
    try{const result=await work(tx);this.commits++;return result}catch(error){this.rollbacks++;throw error}
  }
}
const marker=call=>call.sql.match(/\/\* capital-readiness:([^*]+) \*\//)?.[1]?.trim()??'unknown';
const tenantId=owner.tenantId;
const projectId='11111111-1111-4111-8111-111111111111';
const intakeId='22222222-2222-4222-8222-222222222222';
const project=Object.freeze({
  projectId,tenantId,code:'HASS-INT17-001',name:'Hass INT1.7',state:'UNDER_REVIEW',eligibility:'NOT_EVALUATED',
  productionRef:Object.freeze({producerId:'producer:1',farmId:'farm:1',plotIds:Object.freeze(['plot:1']),cropCycleIds:Object.freeze(['cycle:1'])}),
  currency:'COP',requiredMinor:10_000_000,committedMinor:0,deployedMinor:0,recoveredMinor:0,approvedBudgetVersion:1,createdAt:'2026-08-12T09:00:00.000Z',updatedAt:'2026-08-12T09:00:00.000Z',
});

const ownerAuth=access.createMembershipPermissionAuthorizer(owner);
const adminAuth=access.createMembershipPermissionAuthorizer(admin);
const agroAuth=access.createMembershipPermissionAuthorizer(agronomist);
const investorAuth=access.createMembershipPermissionAuthorizer(investor);

// Intake creation derives actor identity from authenticated authority context.
const startExec=new RecordingExecutor();
const started=await authority.startAuthorizedCapitalReadinessIntake(startExec,ownerAuth,project,{
  intakeId,tenantId,projectId,intakeVersion:1,sourceType:'SANA_DIAGNOSTIC',sourceRef:'diagnostic:int17',consentSetRef:'consent:v1',dataPackVersion:'v1',createdAt:'2026-08-12T09:10:00.000Z',initialTransitionId:'transition:intake:0',reason:'start readiness',
});
assert(started.originatorRef===owner.actorId,'START_ORIGINATOR_DERIVED_FROM_AUTHENTICATED_ACTOR');
assert(startExec.calls.map(marker).join('|')==='tenant-context|create-intake|create-intake-transition','START_ATOMIC_PERSISTENCE_ORDER');
assert(startExec.calls.some(call=>call.params.includes(owner.actorId)),'AUTHENTICATED_ACTOR_PERSISTED');
pass('AUTHORIZED_INTAKE_CREATION_DERIVES_ACTOR');

const wrongTenantAuth=Object.freeze({...ownerAuth,tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'});
await expectReject(()=>authority.startAuthorizedCapitalReadinessIntake(new RecordingExecutor(),wrongTenantAuth,project,{
  intakeId:'33333333-3333-4333-8333-333333333333',tenantId,projectId,intakeVersion:2,sourceType:'SANA_DIAGNOSTIC',sourceRef:'x',dataPackVersion:'v2',createdAt:'2026-08-12T09:20:00.000Z',initialTransitionId:'t0',
}),'READINESS_AUTHORITY_TENANT_MISMATCH');
pass('CROSS_TENANT_AUTHORITY_FAILS_CLOSED');

// Agronomist may operate normal workflow but cannot cross into sensitive states.
const created=Object.freeze({...started,state:'CREATED',updatedAt:started.createdAt});
const operateExec=new RecordingExecutor(sql=>sql.includes('latest-intake-transition')?{rows:[{transitionId:'i0',tenantId,projectId,intakeId,intakeVersion:1,sequence:0,fromState:null,toState:'CREATED',actorRef:owner.actorId,reason:null,occurredAt:started.createdAt}],rowCount:1}:{rows:[],rowCount:1});
const scanned=await authority.advanceAuthorizedCapitalReadinessIntake(operateExec,agroAuth,created,{tenantId,projectId,intakeId,intakeVersion:1,target:'CANONICAL_REUSE_SCAN',transitionId:'i1',at:'2026-08-12T09:15:00.000Z'});
assert(scanned.state==='CANONICAL_REUSE_SCAN','AGRONOMIST_NORMAL_OPERATION_ALLOWED');
await expectReject(()=>authority.advanceAuthorizedCapitalReadinessIntake(new RecordingExecutor(),adminAuth,Object.freeze({...created,state:'HUMAN_REVIEW',updatedAt:'2026-08-12T10:30:00.000Z'}),{
  tenantId,projectId,intakeId,intakeVersion:1,target:'CAPITAL_READY',transitionId:'spoof-final',at:'2026-08-12T11:00:00.000Z',
}),'READINESS_DIRECT_SENSITIVE_TRANSITION_FORBIDDEN');
pass('DIRECT_FINAL_STATE_SPOOF_BLOCKED_AT_RUNTIME');

// Human review requires the dedicated permission; agronomist ceiling rejects it.
const underAssessment=Object.freeze({...created,state:'UNDER_ASSESSMENT',updatedAt:'2026-08-12T10:20:00.000Z'});
const reviewResponder=sql=>sql.includes('latest-intake-transition')?{rows:[{transitionId:'i5',tenantId,projectId,intakeId,intakeVersion:1,sequence:5,fromState:'ASSESSMENT_READY',toState:'UNDER_ASSESSMENT',actorRef:'human:x',reason:null,occurredAt:underAssessment.updatedAt}],rowCount:1}:{rows:[],rowCount:1};
await expectReject(()=>authority.submitAuthorizedCapitalReadinessForHumanReview(new RecordingExecutor(reviewResponder),agroAuth,underAssessment,{tenantId,projectId,intakeId,intakeVersion:1,transitionId:'i6',at:'2026-08-12T10:30:00.000Z',reason:'ready for review'}),'PERMISSION_DENIED');
const humanReview=await authority.submitAuthorizedCapitalReadinessForHumanReview(new RecordingExecutor(reviewResponder),adminAuth,underAssessment,{tenantId,projectId,intakeId,intakeVersion:1,transitionId:'i6',at:'2026-08-12T10:30:00.000Z',reason:'ready for review'});
assert(humanReview.state==='HUMAN_REVIEW','ADMIN_REVIEW_TRANSITION_ALLOWED');
pass('HUMAN_REVIEW_DEDICATED_AUTHORITY');

// Investor and operator-style users cannot mutate even when they try to request a mutation.
await expectReject(()=>authority.advanceAuthorizedCapitalReadinessIntake(new RecordingExecutor(),investorAuth,created,{tenantId,projectId,intakeId,intakeVersion:1,target:'CANONICAL_REUSE_SCAN',transitionId:'bad-investor',at:'2026-08-12T09:15:00.000Z'}),'PERMISSION_DENIED');
pass('INVESTOR_MUTATION_DENIED');

// Sensitive pause/resume cannot be performed with only operational authority.
const ready=Object.freeze({...humanReview,state:'CAPITAL_READY',updatedAt:'2026-08-12T11:00:00.000Z'});
await expectReject(()=>authority.pauseAuthorizedCapitalReadinessIntake(new RecordingExecutor(),agroAuth,ready,{tenantId,projectId,intakeId,intakeVersion:1,transitionId:'pause-ready',at:'2026-08-12T11:05:00.000Z',reason:'pause'}),'PERMISSION_DENIED');
pass('SENSITIVE_PAUSE_REQUIRES_SENSITIVE_AUTHORITY');

// Reassessment is a dedicated ADMIN/OWNER authority path.
const reassessExec=new RecordingExecutor(sql=>sql.includes('latest-intake-transition')?{rows:[{transitionId:'i7',tenantId,projectId,intakeId,intakeVersion:1,sequence:7,fromState:'HUMAN_REVIEW',toState:'CAPITAL_READY',actorRef:admin.actorId,reason:'final',occurredAt:ready.updatedAt}],rowCount:1}:{rows:[],rowCount:1});
await expectReject(()=>authority.requestAuthorizedCapitalReadinessReassessment(new RecordingExecutor(),agroAuth,ready,{tenantId,projectId,intakeId,intakeVersion:1,transitionId:'reassess',at:'2026-08-12T11:10:00.000Z',reason:'new material fact'}),'PERMISSION_DENIED');
const reassessed=await authority.requestAuthorizedCapitalReadinessReassessment(reassessExec,adminAuth,ready,{tenantId,projectId,intakeId,intakeVersion:1,transitionId:'reassess',at:'2026-08-12T11:10:00.000Z',reason:'new material fact'});
assert(reassessed.state==='REASSESSMENT_REQUIRED','ADMIN_REASSESSMENT_ALLOWED');
pass('REASSESSMENT_DEDICATED_AUTHORITY');

// Gap remediation: agronomist may remediate/resolve with evidence, but cannot waive.
const gap=Object.freeze({gapId:'gap:g8:1',tenantId,projectId,assessmentVersion:1,gateId:'G8_IMPACT',code:'IMPACT_BASELINE_PARTIAL',severity:'WARNING',blocking:false,state:'OPEN',description:'Complete impact baseline',sourceRef:'gate:G8',requiredEvidenceRoles:Object.freeze(['IMPACT_BASELINE']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T10:40:00.000Z'});
const gapResponder=sql=>sql.includes('latest-gap-transition')?{rows:[{transitionId:'g0',tenantId,projectId,assessmentId:'assessment:1',assessmentVersion:1,gapId:gap.gapId,sequence:0,fromState:null,toState:'OPEN',actorRef:admin.actorId,resolutionEvidenceRefs:[],note:null,occurredAt:gap.openedAt}],rowCount:1}:{rows:[],rowCount:1};
await authority.advanceAuthorizedReadinessGapRemediation(new RecordingExecutor(gapResponder),agroAuth,gap,{tenantId,projectId,assessmentId:'assessment:1',assessmentVersion:1,gapId:gap.gapId,fromState:'OPEN',target:'IN_REMEDIATION',transitionId:'g1',at:'2026-08-12T11:00:00.000Z'});
await authority.resolveAuthorizedReadinessGap(new RecordingExecutor(gapResponder),agroAuth,gap,{tenantId,projectId,assessmentId:'assessment:1',assessmentVersion:1,gapId:gap.gapId,fromState:'OPEN',transitionId:'g-resolve',at:'2026-08-12T11:01:00.000Z',resolutionEvidenceRefs:Object.freeze(['evidence:impact-baseline']),note:'Baseline verified'});
await expectReject(()=>authority.waiveAuthorizedReadinessGap(new RecordingExecutor(gapResponder),agroAuth,gap,{tenantId,projectId,assessmentId:'assessment:1',assessmentVersion:1,gapId:gap.gapId,fromState:'OPEN',transitionId:'g-waive',at:'2026-08-12T11:02:00.000Z',note:'waive'}),'PERMISSION_DENIED');
await authority.waiveAuthorizedReadinessGap(new RecordingExecutor(gapResponder),adminAuth,gap,{tenantId,projectId,assessmentId:'assessment:1',assessmentVersion:1,gapId:gap.gapId,fromState:'OPEN',transitionId:'g-waive',at:'2026-08-12T11:02:00.000Z',note:'Explicit human waiver rationale'});
await expectReject(()=>authority.advanceAuthorizedReadinessGapRemediation(new RecordingExecutor(gapResponder),agroAuth,gap,{tenantId,projectId,assessmentId:'assessment:1',assessmentVersion:1,gapId:gap.gapId,fromState:'OPEN',target:'WAIVED',transitionId:'spoof-gap',at:'2026-08-12T11:03:00.000Z'}),'READINESS_GAP_DIRECT_SENSITIVE_TRANSITION_FORBIDDEN');
pass('GAP_REMEDIATION_AND_WAIVER_SEPARATION');

// Resolution proof is validated before any SQL write.
const noEvidenceExec=new RecordingExecutor(gapResponder);
await expectReject(()=>authority.resolveAuthorizedReadinessGap(noEvidenceExec,agroAuth,gap,{tenantId,projectId,assessmentId:'assessment:1',assessmentVersion:1,gapId:gap.gapId,fromState:'OPEN',transitionId:'g-no-proof',at:'2026-08-12T11:04:00.000Z',resolutionEvidenceRefs:Object.freeze([]),note:'no evidence'}),'READINESS_GAP_RESOLUTION_EVIDENCE_REQUIRED');
assert(noEvidenceExec.calls.length===0,'NO_SQL_BEFORE_RESOLUTION_PROOF');
pass('RESOLUTION_PROOF_FAILS_BEFORE_SQL');

// Finalization fixture with zero gaps avoids ambiguity: all G1-G9 PASS -> CAPITAL_READY.
const gateIds=['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'];
const digestA='a'.repeat(64),digestB='b'.repeat(64),digestC='c'.repeat(64),digestD='d'.repeat(64);
const gates=Object.freeze(gateIds.map(gateId=>Object.freeze({gateId,result:'PASS',rationale:`${gateId} pass`,evidenceRefs:Object.freeze([`evidence:${gateId}`]),confidenceBps:9500,blockingGapRefs:Object.freeze([]),conditionGapRefs:Object.freeze([]),assessedAt:'2026-08-12T10:50:00.000Z',assessedBy:admin.actorId,methodVersion:'method-v1'})));
const assessment=Object.freeze({assessmentId:'assessment:int17:1',tenantId,projectId,version:1,intakeId,intakeVersion:1,policyVersion:'policy-v1',methodologyVersion:'method-v1',projectSnapshotRef:'snapshot:v1',approvedBudgetVersion:1,evidenceManifestDigestSha256:digestA,riskProfileDigestSha256:digestB,gates,blockingGapRefs:Object.freeze([]),conditionGapRefs:Object.freeze([]),evidenceCoverageBps:10000,decision:'CAPITAL_READY',deterministicMaximumDecision:'CAPITAL_READY',rationale:'Human final readiness decision',reviewerRef:admin.actorId,reviewedAt:'2026-08-12T11:00:00.000Z',digestSha256:digestC});
const persistence=Object.freeze({assessment,gaps:Object.freeze([]),proof:Object.freeze({evidenceManifestAsOf:'2026-08-12T10:40:00.000Z',riskProfileAsOf:'2026-08-12T10:40:00.000Z',sourceRiskDigestSha256:digestD,persistedAt:'2026-08-12T11:00:30.000Z'}),initialGapTransitionIds:Object.freeze({})});
const finalCurrent=Object.freeze({...humanReview,state:'HUMAN_REVIEW',updatedAt:'2026-08-12T10:30:00.000Z'});
const finalResponder=sql=>sql.includes('latest-intake-transition')?{rows:[{transitionId:'i6',tenantId,projectId,intakeId,intakeVersion:1,sequence:6,fromState:'UNDER_ASSESSMENT',toState:'HUMAN_REVIEW',actorRef:admin.actorId,reason:'review',occurredAt:finalCurrent.updatedAt}],rowCount:1}:{rows:[],rowCount:1};

await expectReject(()=>authority.finalizeAuthorizedCapitalReadiness(new RecordingExecutor(finalResponder),agroAuth,finalCurrent,{tenantId,projectId,intakeId,intakeVersion:1,assessmentId:assessment.assessmentId,assessmentVersion:1,decision:'CAPITAL_READY',transitionId:'i7',reason:'final'},persistence),'PERMISSION_DENIED');
const proxyAssessment=Object.freeze({...assessment,reviewerRef:'human:someone-else'});
await expectReject(()=>authority.finalizeAuthorizedCapitalReadiness(new RecordingExecutor(finalResponder),adminAuth,finalCurrent,{tenantId,projectId,intakeId,intakeVersion:1,assessmentId:proxyAssessment.assessmentId,assessmentVersion:1,decision:'CAPITAL_READY',transitionId:'i7',reason:'final'},{...persistence,assessment:proxyAssessment}),'READINESS_FINALIZER_MUST_BE_RECORDED_REVIEWER');
pass('FINALIZER_PERMISSION_AND_HUMAN_IDENTITY_BINDING');

const finalExec=new RecordingExecutor(finalResponder);
const finalized=await authority.finalizeAuthorizedCapitalReadiness(finalExec,adminAuth,finalCurrent,{tenantId,projectId,intakeId,intakeVersion:1,assessmentId:assessment.assessmentId,assessmentVersion:1,decision:'CAPITAL_READY',transitionId:'i7',reason:'human final decision'},persistence);
assert(finalized.state==='CAPITAL_READY','FINALIZATION_MAPS_DECISION_TO_INTAKE_STATE');
assert(finalExec.transactions===1&&finalExec.commits===1&&finalExec.rollbacks===0,'FINALIZATION_ONE_OUTER_TRANSACTION');
const finalMarkers=finalExec.calls.map(marker);
assert(finalMarkers.filter(x=>x==='tenant-context').length===2,'NESTED_ADAPTERS_REUSE_TRANSACTION_WITH_TENANT_REBIND');
assert(finalMarkers.indexOf('insert-final-assessment-parent-last')<finalMarkers.indexOf('latest-intake-transition'),'ASSESSMENT_AND_TRANSITION_ORDERED_IN_ONE_TRANSACTION');
assert(finalMarkers.at(-1)==='append-intake-transition','FINAL_INTAKE_TRANSITION_LAST');
pass('ATOMIC_FINALIZATION_COMPOSITION');

const rollbackExec=new RecordingExecutor((sql)=>{
  if(sql.includes('latest-intake-transition'))return {rows:[{transitionId:'i6',tenantId,projectId,intakeId,intakeVersion:1,sequence:6,fromState:'UNDER_ASSESSMENT',toState:'HUMAN_REVIEW',actorRef:admin.actorId,reason:'review',occurredAt:finalCurrent.updatedAt}],rowCount:1};
  if(sql.includes('append-intake-transition'))throw new Error('SIMULATED_FINAL_TRANSITION_FAILURE');
  return {rows:[],rowCount:1};
});
await expectReject(()=>authority.finalizeAuthorizedCapitalReadiness(rollbackExec,adminAuth,finalCurrent,{tenantId,projectId,intakeId,intakeVersion:1,assessmentId:assessment.assessmentId,assessmentVersion:1,decision:'CAPITAL_READY',transitionId:'i7',reason:'human final decision'},persistence),'SIMULATED_FINAL_TRANSITION_FAILURE');
assert(rollbackExec.transactions===1&&rollbackExec.commits===0&&rollbackExec.rollbacks===1,'FINALIZATION_FAILURE_ROLLS_BACK_OUTER_TRANSACTION');
pass('FINALIZATION_PARTIAL_COMMIT_PATH_ELIMINATED');

// A reassessment final decision additionally requires the dedicated reassess permission.
const finalizeOnlyMembership=membership('ADMIN',[P.FINALIZE],{actorId:admin.actorId});
const finalizeOnlyAuth=access.createMembershipPermissionAuthorizer(finalizeOnlyMembership);
const reassessmentAssessment=Object.freeze({...assessment,decision:'REASSESSMENT_REQUIRED',deterministicMaximumDecision:'CAPITAL_READY',rationale:'Material evidence requires reassessment'});
await expectReject(()=>authority.finalizeAuthorizedCapitalReadiness(new RecordingExecutor(finalResponder),finalizeOnlyAuth,finalCurrent,{tenantId,projectId,intakeId,intakeVersion:1,assessmentId:assessment.assessmentId,assessmentVersion:1,decision:'REASSESSMENT_REQUIRED',transitionId:'i7-r',reason:'reassess'},{...persistence,assessment:reassessmentAssessment}),'PERMISSION_DENIED');
pass('FINAL_REASSESSMENT_REQUIRES_REASSESS_PERMISSION');

const boundary=authority.CAPITAL_READINESS_APPLICATION_AUTHORITY_BOUNDARY;
assert(boundary.actorIdentityCallerControlled===false,'ACTOR_NOT_CALLER_CONTROLLED');
assert(boundary.controlToInvestMutationBridge===false,'NO_CONTROL_MUTATION_BRIDGE');
assert(boundary.aiFinalReadinessAuthority===false,'NO_AI_FINAL_AUTHORITY');
assert(boundary.investorMutationAuthority===false,'NO_INVESTOR_MUTATION_AUTHORITY');
assert(boundary.projectEligibilityMutation===false&&boundary.projectStateMutation===false,'NO_PROJECT_STATE_AUTHORITY');
assert(boundary.financingApproval===false&&boundary.investmentRecommendation===false,'NO_FINANCIAL_DECISION_AUTHORITY');
assert(boundary.custody===false&&boundary.paymentExecution===false&&boundary.disbursementAuthority===false,'NO_MONEY_MOVEMENT_AUTHORITY');
pass('INT17_AUTHORITY_TRUST_BOUNDARY');

console.log(JSON.stringify({
  status:'PASS',
  slice:'CAPITAL_READINESS_INT1.7',
  roleCeilings:true,
  explicitGrant:true,
  tenantBound:true,
  actorDerived:true,
  runtimeSensitiveTargetGuards:true,
  humanFinalizer:true,
  atomicFinalization:true,
  agronomistCanRemediateButCannotWaiveOrFinalize:true,
  investorReadOnly:true,
  financialAuthority:'NONE',
},null,2));
