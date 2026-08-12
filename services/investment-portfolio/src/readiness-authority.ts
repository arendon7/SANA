import type {
  AdvanceCapitalReadinessIntake,
  AdvanceReadinessGapRemediation,
  CapitalPilotIntake,
  CapitalPilotIntakeState,
  FinalizeCapitalReadinessDecision,
  InvestmentProject,
  PauseCapitalReadinessIntake,
  ReadinessGap,
  RequestCapitalReadinessReassessment,
  ResolveReadinessGap,
  ResumeCapitalReadinessIntake,
  StartCapitalReadinessIntake,
  SubmitCapitalReadinessForHumanReview,
  WaiveReadinessGap,
  WithdrawCapitalReadinessIntake,
} from '@agroway/invest-control-contracts';
import {createCapitalPilotIntake,transitionCapitalPilotIntake} from './readiness.js';
import {
  appendPersistedCapitalPilotIntakeTransition,
  appendPersistedReadinessGapTransition,
  createPersistedCapitalPilotIntake,
  loadPersistedCapitalReadinessSnapshot,
  persistFinalReadinessAssessment,
  type CapitalReadinessSqlExecutor,
  type CapitalReadinessSqlTransaction,
  type PersistFinalReadinessAssessmentInput,
  type PersistedCapitalReadinessSnapshot,
} from './readiness-persistence.js';

export const CAPITAL_READINESS_AUTHORITY_PERMISSIONS=Object.freeze({
  READ:'invest:read',
  INTAKE:'invest:readiness:intake',
  OPERATE:'invest:readiness:operate',
  REVIEW:'invest:readiness:review',
  FINALIZE:'invest:readiness:finalize',
  REMEDIATE:'invest:readiness:remediate',
  WAIVE:'invest:readiness:waive',
  REASSESS:'invest:readiness:reassess',
  WITHDRAW:'invest:readiness:withdraw',
} as const);

export type CapitalReadinessAuthorityPermission=typeof CAPITAL_READINESS_AUTHORITY_PERMISSIONS[keyof typeof CAPITAL_READINESS_AUTHORITY_PERMISSIONS];

/**
 * This context must be created from an authenticated membership by the access
 * service. The authority layer never accepts caller-controlled actorRef values.
 */
export interface CapitalReadinessAuthorityContext {
  tenantId:string;
  actorId:string;
  require(permission:CapitalReadinessAuthorityPermission):void;
}

const DIRECT_OPERATION_FORBIDDEN_TARGETS=new Set<CapitalPilotIntakeState>([
  'HUMAN_REVIEW','CAPITAL_READY','READY_WITH_CONDITIONS','NOT_READY','REASSESSMENT_REQUIRED','WITHDRAWN',
]);
const SENSITIVE_STATES=new Set<CapitalPilotIntakeState>(['HUMAN_REVIEW','CAPITAL_READY','READY_WITH_CONDITIONS','NOT_READY','REASSESSMENT_REQUIRED']);

function nonBlank(value:string,code:string):string{const normalized=value.trim();if(!normalized)throw new Error(code);return normalized;}
function validIso(value:string):string{if(!Number.isFinite(Date.parse(value)))throw new Error('INVALID_ISO_DATETIME');return value;}
function sameScope(tenantId:string,projectId:string,otherTenantId:string,otherProjectId:string,code:string):void{if(tenantId!==otherTenantId||projectId!==otherProjectId)throw new Error(code);}
function authorize(authority:CapitalReadinessAuthorityContext,tenantId:string,permission:CapitalReadinessAuthorityPermission):void{
  if(authority.tenantId!==tenantId)throw new Error('READINESS_AUTHORITY_TENANT_MISMATCH');
  nonBlank(authority.actorId,'READINESS_AUTHORITY_ACTOR_REQUIRED');
  authority.require(permission);
}
function sameIntakeIdentity(current:CapitalPilotIntake,command:Readonly<{tenantId:string;projectId:string;intakeId:string;intakeVersion:number}>):void{
  sameScope(current.tenantId,current.projectId,command.tenantId,command.projectId,'READINESS_COMMAND_SCOPE_MISMATCH');
  if(current.intakeId!==command.intakeId||current.intakeVersion!==command.intakeVersion)throw new Error('READINESS_COMMAND_INTAKE_IDENTITY_MISMATCH');
}
function assertGapIdentity(gap:ReadinessGap,command:Readonly<{tenantId:string;projectId:string;assessmentVersion:number;gapId:string;fromState:string}>):void{
  sameScope(gap.tenantId,gap.projectId,command.tenantId,command.projectId,'READINESS_GAP_COMMAND_SCOPE_MISMATCH');
  if(gap.assessmentVersion!==command.assessmentVersion||gap.gapId!==command.gapId)throw new Error('READINESS_GAP_COMMAND_IDENTITY_MISMATCH');
  if(gap.state!==command.fromState)throw new Error('READINESS_GAP_COMMAND_STATE_STALE');
}
function permissionForSensitiveState(state:CapitalPilotIntakeState):CapitalReadinessAuthorityPermission{
  if(state==='HUMAN_REVIEW')return CAPITAL_READINESS_AUTHORITY_PERMISSIONS.REVIEW;
  if(state==='CAPITAL_READY'||state==='READY_WITH_CONDITIONS'||state==='NOT_READY')return CAPITAL_READINESS_AUTHORITY_PERMISSIONS.FINALIZE;
  if(state==='REASSESSMENT_REQUIRED')return CAPITAL_READINESS_AUTHORITY_PERMISSIONS.REASSESS;
  return CAPITAL_READINESS_AUTHORITY_PERMISSIONS.OPERATE;
}
async function persistTransition(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  current:CapitalPilotIntake,
  next:CapitalPilotIntake,
  transitionId:string,
  reason?:string,
):Promise<CapitalPilotIntake>{
  await appendPersistedCapitalPilotIntakeTransition(executor,current,next,{transitionId:nonBlank(transitionId,'READINESS_TRANSITION_ID_REQUIRED'),actorRef:authority.actorId,reason});
  return next;
}

export async function startAuthorizedCapitalReadinessIntake(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  project:InvestmentProject,
  command:StartCapitalReadinessIntake,
):Promise<CapitalPilotIntake>{
  authorize(authority,command.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.INTAKE);
  sameScope(project.tenantId,project.projectId,command.tenantId,command.projectId,'READINESS_START_PROJECT_SCOPE_MISMATCH');
  if(command.intakeVersion<=0||!Number.isSafeInteger(command.intakeVersion))throw new Error('INVALID_INTAKE_VERSION');
  const intake=createCapitalPilotIntake({
    intakeId:command.intakeId,
    project,
    intakeVersion:command.intakeVersion,
    sourceType:command.sourceType,
    sourceRef:command.sourceRef,
    originatorRef:authority.actorId,
    ...(command.consentSetRef?.trim()?{consentSetRef:command.consentSetRef.trim()}:{}),
    dataPackVersion:command.dataPackVersion,
    createdAt:validIso(command.createdAt),
    ...(command.supersedesIntakeId?{supersedesIntakeId:command.supersedesIntakeId}:{}),
  });
  await createPersistedCapitalPilotIntake(executor,{intake,initialTransitionId:command.initialTransitionId,actorRef:authority.actorId,reason:command.reason});
  return intake;
}

export async function advanceAuthorizedCapitalReadinessIntake(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  current:CapitalPilotIntake,
  command:AdvanceCapitalReadinessIntake,
):Promise<CapitalPilotIntake>{
  authorize(authority,current.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.OPERATE);
  sameIntakeIdentity(current,command);
  const runtimeTarget=command.target as CapitalPilotIntakeState;
  if(DIRECT_OPERATION_FORBIDDEN_TARGETS.has(runtimeTarget))throw new Error(`READINESS_DIRECT_SENSITIVE_TRANSITION_FORBIDDEN:${runtimeTarget}`);
  if(current.state==='PAUSED')throw new Error('READINESS_PAUSED_INTAKE_REQUIRES_RESUME_COMMAND');
  if(runtimeTarget==='PAUSED')throw new Error('READINESS_PAUSE_REQUIRES_PAUSE_COMMAND');
  const next=transitionCapitalPilotIntake(current,runtimeTarget,validIso(command.at));
  return persistTransition(executor,authority,current,next,command.transitionId,command.reason);
}

export async function submitAuthorizedCapitalReadinessForHumanReview(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  current:CapitalPilotIntake,
  command:SubmitCapitalReadinessForHumanReview,
):Promise<CapitalPilotIntake>{
  authorize(authority,current.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.REVIEW);
  sameIntakeIdentity(current,command);
  const next=transitionCapitalPilotIntake(current,'HUMAN_REVIEW',validIso(command.at));
  return persistTransition(executor,authority,current,next,command.transitionId,nonBlank(command.reason,'READINESS_REVIEW_REASON_REQUIRED'));
}

export async function pauseAuthorizedCapitalReadinessIntake(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  current:CapitalPilotIntake,
  command:PauseCapitalReadinessIntake,
):Promise<CapitalPilotIntake>{
  sameIntakeIdentity(current,command);
  authorize(authority,current.tenantId,SENSITIVE_STATES.has(current.state)?permissionForSensitiveState(current.state):CAPITAL_READINESS_AUTHORITY_PERMISSIONS.OPERATE);
  const next=transitionCapitalPilotIntake(current,'PAUSED',validIso(command.at));
  return persistTransition(executor,authority,current,next,command.transitionId,nonBlank(command.reason,'READINESS_PAUSE_REASON_REQUIRED'));
}

export async function resumeAuthorizedCapitalReadinessIntake(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  current:CapitalPilotIntake,
  command:ResumeCapitalReadinessIntake,
):Promise<CapitalPilotIntake>{
  sameIntakeIdentity(current,command);
  if(current.state!=='PAUSED'||!current.pausedFromState)throw new Error('READINESS_INTAKE_NOT_PAUSED');
  authorize(authority,current.tenantId,permissionForSensitiveState(current.pausedFromState));
  const next=transitionCapitalPilotIntake(current,current.pausedFromState,validIso(command.at));
  return persistTransition(executor,authority,current,next,command.transitionId,nonBlank(command.reason,'READINESS_RESUME_REASON_REQUIRED'));
}

export async function withdrawAuthorizedCapitalReadinessIntake(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  current:CapitalPilotIntake,
  command:WithdrawCapitalReadinessIntake,
):Promise<CapitalPilotIntake>{
  authorize(authority,current.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.WITHDRAW);
  sameIntakeIdentity(current,command);
  const next=transitionCapitalPilotIntake(current,'WITHDRAWN',validIso(command.at));
  return persistTransition(executor,authority,current,next,command.transitionId,nonBlank(command.reason,'READINESS_WITHDRAW_REASON_REQUIRED'));
}

export async function requestAuthorizedCapitalReadinessReassessment(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  current:CapitalPilotIntake,
  command:RequestCapitalReadinessReassessment,
):Promise<CapitalPilotIntake>{
  authorize(authority,current.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.REASSESS);
  sameIntakeIdentity(current,command);
  const next=transitionCapitalPilotIntake(current,'REASSESSMENT_REQUIRED',validIso(command.at));
  return persistTransition(executor,authority,current,next,command.transitionId,nonBlank(command.reason,'READINESS_REASSESS_REASON_REQUIRED'));
}

function finalStateForDecision(decision:PersistFinalReadinessAssessmentInput['assessment']['decision']):CapitalPilotIntakeState{
  if(decision==='CAPITAL_READY')return 'CAPITAL_READY';
  if(decision==='CAPITAL_READY_WITH_CONDITIONS')return 'READY_WITH_CONDITIONS';
  if(decision==='NOT_CAPITAL_READY')return 'NOT_READY';
  if(decision==='REASSESSMENT_REQUIRED')return 'REASSESSMENT_REQUIRED';
  throw new Error(`INVALID_READINESS_FINAL_DECISION:${String(decision)}`);
}

/**
 * Commits the immutable final assessment and the corresponding canonical intake
 * decision in one outer transaction. The nested executor deliberately reuses
 * the same SQL transaction so INT1.6 persistence functions cannot partially
 * commit finalization.
 */
export async function finalizeAuthorizedCapitalReadiness(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  current:CapitalPilotIntake,
  command:FinalizeCapitalReadinessDecision,
  persistence:PersistFinalReadinessAssessmentInput,
):Promise<CapitalPilotIntake>{
  authorize(authority,current.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.FINALIZE);
  sameIntakeIdentity(current,command);
  if(current.state!=='HUMAN_REVIEW')throw new Error('READINESS_FINALIZATION_REQUIRES_HUMAN_REVIEW_STATE');
  const assessment=persistence.assessment;
  sameScope(current.tenantId,current.projectId,assessment.tenantId,assessment.projectId,'READINESS_FINAL_ASSESSMENT_SCOPE_MISMATCH');
  if(assessment.intakeId!==current.intakeId||assessment.intakeVersion!==current.intakeVersion)throw new Error('READINESS_FINAL_ASSESSMENT_INTAKE_MISMATCH');
  if(command.assessmentId!==assessment.assessmentId||command.assessmentVersion!==assessment.version)throw new Error('READINESS_FINAL_ASSESSMENT_IDENTITY_MISMATCH');
  if(command.decision!==assessment.decision)throw new Error('READINESS_FINAL_DECISION_MISMATCH');
  if(assessment.reviewerRef!==authority.actorId)throw new Error('READINESS_FINALIZER_MUST_BE_RECORDED_REVIEWER');
  if(assessment.decision==='REASSESSMENT_REQUIRED')authorize(authority,current.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.REASSESS);
  const next=transitionCapitalPilotIntake(current,finalStateForDecision(assessment.decision),validIso(assessment.reviewedAt));
  const transitionId=nonBlank(command.transitionId,'READINESS_FINAL_TRANSITION_ID_REQUIRED');
  const reason=nonBlank(command.reason,'READINESS_FINAL_REASON_REQUIRED');
  await executor.transaction(async tx=>{
    const sameTransactionExecutor:CapitalReadinessSqlExecutor={transaction:async<T>(work:(nested:CapitalReadinessSqlTransaction)=>Promise<T>)=>work(tx)};
    await persistFinalReadinessAssessment(sameTransactionExecutor,persistence);
    await appendPersistedCapitalPilotIntakeTransition(sameTransactionExecutor,current,next,{transitionId,actorRef:authority.actorId,reason});
  });
  return next;
}

export async function advanceAuthorizedReadinessGapRemediation(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  gap:ReadinessGap,
  command:AdvanceReadinessGapRemediation,
):Promise<void>{
  authorize(authority,gap.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.REMEDIATE);
  assertGapIdentity(gap,command);
  const target=command.target as string;
  if(target!=='IN_REMEDIATION')throw new Error(`READINESS_GAP_DIRECT_SENSITIVE_TRANSITION_FORBIDDEN:${target}`);
  await appendPersistedReadinessGapTransition(executor,{
    transitionId:command.transitionId,tenantId:command.tenantId,projectId:command.projectId,assessmentId:command.assessmentId,assessmentVersion:command.assessmentVersion,gapId:command.gapId,
    fromState:command.fromState,toState:'IN_REMEDIATION',actorRef:authority.actorId,occurredAt:validIso(command.at),note:command.note,
  });
}

export async function resolveAuthorizedReadinessGap(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  gap:ReadinessGap,
  command:ResolveReadinessGap,
):Promise<void>{
  authorize(authority,gap.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.REMEDIATE);
  assertGapIdentity(gap,command);
  if(command.resolutionEvidenceRefs.length===0)throw new Error('READINESS_GAP_RESOLUTION_EVIDENCE_REQUIRED');
  await appendPersistedReadinessGapTransition(executor,{
    transitionId:command.transitionId,tenantId:command.tenantId,projectId:command.projectId,assessmentId:command.assessmentId,assessmentVersion:command.assessmentVersion,gapId:command.gapId,
    fromState:command.fromState,toState:'RESOLVED',actorRef:authority.actorId,occurredAt:validIso(command.at),resolutionEvidenceRefs:command.resolutionEvidenceRefs,note:nonBlank(command.note,'READINESS_GAP_RESOLUTION_NOTE_REQUIRED'),
  });
}

export async function waiveAuthorizedReadinessGap(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  gap:ReadinessGap,
  command:WaiveReadinessGap,
):Promise<void>{
  authorize(authority,gap.tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.WAIVE);
  assertGapIdentity(gap,command);
  await appendPersistedReadinessGapTransition(executor,{
    transitionId:command.transitionId,tenantId:command.tenantId,projectId:command.projectId,assessmentId:command.assessmentId,assessmentVersion:command.assessmentVersion,gapId:command.gapId,
    fromState:command.fromState,toState:'WAIVED',actorRef:authority.actorId,occurredAt:validIso(command.at),note:nonBlank(command.note,'READINESS_GAP_WAIVER_NOTE_REQUIRED'),
  });
}

export async function loadAuthorizedPersistedCapitalReadinessSnapshot(
  executor:CapitalReadinessSqlExecutor,
  authority:CapitalReadinessAuthorityContext,
  tenantId:string,
  projectId:string,
  assessmentVersion:number,
):Promise<PersistedCapitalReadinessSnapshot>{
  authorize(authority,tenantId,CAPITAL_READINESS_AUTHORITY_PERMISSIONS.READ);
  return loadPersistedCapitalReadinessSnapshot(executor,tenantId,projectId,assessmentVersion);
}

export const CAPITAL_READINESS_APPLICATION_AUTHORITY_BOUNDARY=Object.freeze({
  actorIdentityCallerControlled:false,
  explicitPermissionRequired:true,
  humanFinalizerRequired:true,
  waiverRequiresExplicitPermission:true,
  evidenceSubmissionUsesDedicatedAuthority:true,
  genericRemediationCanSubmitEvidence:false,
  readinessFinalizationAtomic:true,
  directOperationalFinalization:false,
  directOperationalWaiver:false,
  controlToInvestMutationBridge:false,
  aiFinalReadinessAuthority:false,
  investorMutationAuthority:false,
  projectEligibilityMutation:false,
  projectStateMutation:false,
  financingApproval:false,
  investmentRecommendation:false,
  custody:false,
  paymentExecution:false,
  disbursementAuthority:false,
} as const);
