import { sha256Canonical } from './hash.js';
import {
  CONTROL_D10_APPROVAL_PROTOCOL,
  CONTROL_PRODUCTION_READINESS_PROTOCOL,
  computeProductionReadinessAssessmentDigest,
  validateControlReleaseCandidate,
  validateD10HumanProductApproval,
  type ControlReleaseCandidate,
  type D10HumanProductApproval,
  type ProductionReadinessAssessment,
  type ProductionReadinessAssessmentMaterial
} from './control-production-readiness.js';

export const CONTROL_PRODUCTION_BINDING_EVIDENCE_PROTOCOL='AGROWAY_CONTROL_PRODUCTION_BINDING_EVIDENCE_V1' as const;
export const CONTROL_PRODUCTION_ACTIVATION_REQUEST_PROTOCOL='AGROWAY_CONTROL_PRODUCTION_ACTIVATION_REQUEST_V1' as const;
export const CONTROL_PRODUCTION_ACTIVATION_APPROVAL_PROTOCOL='AGROWAY_CONTROL_PRODUCTION_ACTIVATION_APPROVAL_V1' as const;
export const CONTROL_PRODUCTION_ACTIVATION_AUTHORIZATION_PROTOCOL='AGROWAY_CONTROL_PRODUCTION_ACTIVATION_AUTHORIZATION_V1' as const;

export type ProductionBindingEvidence=Readonly<{
  protocol:typeof CONTROL_PRODUCTION_BINDING_EVIDENCE_PROTOCOL;
  environment:'PRODUCTION';
  candidate:ControlReleaseCandidate;
  identityProviderBound:true;
  identityProviderConnectivityCertified:true;
  postgresSecretsBound:true;
  postgresConnectivityCertified:true;
  externalAckProviderBound:true;
  externalAckProviderConnectivityCertified:true;
  observedAt:string;
  evidenceDigestSha256:string;
}>;

export type ProductionActivationRequest=Readonly<{
  protocol:typeof CONTROL_PRODUCTION_ACTIVATION_REQUEST_PROTOCOL;
  actorType:'HUMAN';
  requesterId:string;
  reason:string;
  candidate:ControlReleaseCandidate;
  readinessAssessmentDigestSha256:string;
  d10ApprovalDigestSha256:string;
  bindingEvidenceDigestSha256:string;
  requestedAt:string;
  expiresAt:string;
  requestDigestSha256:string;
}>;

export type ProductionActivationApproval=Readonly<{
  protocol:typeof CONTROL_PRODUCTION_ACTIVATION_APPROVAL_PROTOCOL;
  actorType:'HUMAN';
  decision:'APPROVED';
  approverId:string;
  approvalNote:string;
  requestDigestSha256:string;
  approvedAt:string;
  approvalDigestSha256:string;
}>;

export type ProductionActivationAuthorization=Readonly<{
  protocol:typeof CONTROL_PRODUCTION_ACTIVATION_AUTHORIZATION_PROTOCOL;
  state:'PRODUCTION_RUNTIME_GATE_OPEN';
  candidate:ControlReleaseCandidate;
  readinessAssessmentDigestSha256:string;
  d10ApprovalDigestSha256:string;
  bindingEvidenceDigestSha256:string;
  activationRequestDigestSha256:string;
  activationApprovalDigestSha256:string;
  requesterId:string;
  approverId:string;
  issuedAt:string;
  validUntil:string;
  leaseId:string;
  authorizationDigestSha256:string;
  executionAuthorization:'RUNTIME_GATE_ONLY';
  canonicalWriteExecuted:false;
  externalAckSent:false;
  productionSessionCreated:false;
  browserActivationAllowed:false;
}>;

export type ProductionActivationDecision=Readonly<{
  state:'BLOCKED_READINESS_ASSESSMENT'|'BLOCKED_D10'|'BLOCKED_REAL_BINDINGS'|'BLOCKED_ACTIVATION_CEREMONY'|'PRODUCTION_RUNTIME_GATE_OPEN';
  authorization?:ProductionActivationAuthorization;
  canonicalWriteExecuted:false;
  externalAckSent:false;
  productionSessionCreated:false;
  browserActivationAllowed:false;
}>;

const SHA256=/^[a-f0-9]{64}$/;
const SAFE_ID=/^[A-Za-z0-9][A-Za-z0-9_.:@/-]{2,127}$/;
const MAX_BINDING_AGE_MS=10*60*1000;
const MAX_ACTIVATION_REQUEST_TTL_MS=10*60*1000;
const MAX_ACTIVATION_LEASE_MS=5*60*1000;
const CLOCK_SKEW_MS=60*1000;

function sameCandidate(a:ControlReleaseCandidate,b:ControlReleaseCandidate):boolean {
  return a.version===b.version&&a.headSha===b.headSha&&a.reviewBundleSha256===b.reviewBundleSha256;
}
function parseTime(value:string,error:string):number {
  const n=Date.parse(value);if(!Number.isFinite(n))throw new Error(error);return n;
}
function assertSafeHumanId(value:string,error:string):void { if(!SAFE_ID.test(value))throw new Error(error); }
function assertDigest(value:string,error:string):void { if(!SHA256.test(value))throw new Error(error); }

function bindingMaterial(value:Omit<ProductionBindingEvidence,'evidenceDigestSha256'>):unknown {
  return value;
}
export function computeProductionBindingEvidenceDigest(value:Omit<ProductionBindingEvidence,'evidenceDigestSha256'>):string {
  return sha256Canonical(bindingMaterial(value));
}
export function validateProductionBindingEvidence(value:ProductionBindingEvidence,candidate:ControlReleaseCandidate,now:Date):void {
  validateControlReleaseCandidate(candidate);
  if(value.protocol!==CONTROL_PRODUCTION_BINDING_EVIDENCE_PROTOCOL||value.environment!=='PRODUCTION')throw new Error('PRODUCTION_BINDING_EVIDENCE_PROTOCOL_INVALID');
  if(!sameCandidate(value.candidate,candidate))throw new Error('PRODUCTION_BINDING_CANDIDATE_MISMATCH');
  if(value.identityProviderBound!==true||value.identityProviderConnectivityCertified!==true)throw new Error('PRODUCTION_IDENTITY_BINDING_REQUIRED');
  if(value.postgresSecretsBound!==true||value.postgresConnectivityCertified!==true)throw new Error('PRODUCTION_POSTGRES_BINDING_REQUIRED');
  if(value.externalAckProviderBound!==true||value.externalAckProviderConnectivityCertified!==true)throw new Error('PRODUCTION_EXTERNAL_ACK_BINDING_REQUIRED');
  const observedAt=parseTime(value.observedAt,'PRODUCTION_BINDING_OBSERVED_AT_INVALID');
  if(observedAt>now.getTime()+CLOCK_SKEW_MS)throw new Error('PRODUCTION_BINDING_EVIDENCE_FUTURE');
  if(now.getTime()-observedAt>MAX_BINDING_AGE_MS)throw new Error('PRODUCTION_BINDING_EVIDENCE_STALE');
  assertDigest(value.evidenceDigestSha256,'PRODUCTION_BINDING_EVIDENCE_DIGEST_INVALID');
  const expected=computeProductionBindingEvidenceDigest({protocol:value.protocol,environment:value.environment,candidate:value.candidate,identityProviderBound:value.identityProviderBound,identityProviderConnectivityCertified:value.identityProviderConnectivityCertified,postgresSecretsBound:value.postgresSecretsBound,postgresConnectivityCertified:value.postgresConnectivityCertified,externalAckProviderBound:value.externalAckProviderBound,externalAckProviderConnectivityCertified:value.externalAckProviderConnectivityCertified,observedAt:value.observedAt});
  if(value.evidenceDigestSha256!==expected)throw new Error('PRODUCTION_BINDING_EVIDENCE_DIGEST_MISMATCH');
}

function requestMaterial(value:Omit<ProductionActivationRequest,'requestDigestSha256'>):unknown { return value; }
export function computeProductionActivationRequestDigest(value:Omit<ProductionActivationRequest,'requestDigestSha256'>):string { return sha256Canonical(requestMaterial(value)); }
function approvalMaterial(value:Omit<ProductionActivationApproval,'approvalDigestSha256'>):unknown { return value; }
export function computeProductionActivationApprovalDigest(value:Omit<ProductionActivationApproval,'approvalDigestSha256'>):string { return sha256Canonical(approvalMaterial(value)); }

function validateReadinessAssessment(value:ProductionReadinessAssessment,candidate:ControlReleaseCandidate):void {
  if(value.protocol!==CONTROL_PRODUCTION_READINESS_PROTOCOL||value.state!=='READY_FOR_EXPLICIT_ACTIVATION_REVIEW')throw new Error('PRODUCTION_ACTIVATION_READINESS_STATE_REQUIRED');
  if(!sameCandidate(value.candidate,candidate))throw new Error('PRODUCTION_ACTIVATION_READINESS_CANDIDATE_MISMATCH');
  if(value.checks.length!==4||value.checks.some(x=>x.status!=='PASS'))throw new Error('PRODUCTION_ACTIVATION_READINESS_CHECKS_REQUIRED');
  if(value.productionExecutionEnabled!==false||value.canonicalWritePermitted!==false||value.browserActivationAllowed!==false||value.realProductionTokenVerified!==false||value.realExternalAckObserved!==false||value.canonicalMutated!==false)throw new Error('PRODUCTION_ACTIVATION_READINESS_SAFETY_INVARIANT_INVALID');
  assertDigest(value.assessmentDigestSha256,'PRODUCTION_ACTIVATION_READINESS_DIGEST_INVALID');
  const material:ProductionReadinessAssessmentMaterial={protocol:value.protocol,candidate:value.candidate,state:value.state,checks:value.checks,assessedAt:value.assessedAt,productionExecutionEnabled:value.productionExecutionEnabled,canonicalWritePermitted:value.canonicalWritePermitted,browserActivationAllowed:value.browserActivationAllowed,realProductionTokenVerified:value.realProductionTokenVerified,realExternalAckObserved:value.realExternalAckObserved,canonicalMutated:value.canonicalMutated};
  if(computeProductionReadinessAssessmentDigest(material)!==value.assessmentDigestSha256)throw new Error('PRODUCTION_ACTIVATION_READINESS_DIGEST_MISMATCH');
}

function validateActivationRequest(value:ProductionActivationRequest,candidate:ControlReleaseCandidate,readiness:ProductionReadinessAssessment,d10:D10HumanProductApproval,binding:ProductionBindingEvidence,now:Date):void {
  if(value.protocol!==CONTROL_PRODUCTION_ACTIVATION_REQUEST_PROTOCOL||value.actorType!=='HUMAN')throw new Error('PRODUCTION_ACTIVATION_HUMAN_REQUEST_REQUIRED');
  assertSafeHumanId(value.requesterId,'PRODUCTION_ACTIVATION_REQUESTER_INVALID');
  if(value.reason.trim().length<12||value.reason.length>1000)throw new Error('PRODUCTION_ACTIVATION_REASON_INVALID');
  if(!sameCandidate(value.candidate,candidate))throw new Error('PRODUCTION_ACTIVATION_REQUEST_CANDIDATE_MISMATCH');
  if(value.readinessAssessmentDigestSha256!==readiness.assessmentDigestSha256||value.d10ApprovalDigestSha256!==d10.approvalDigestSha256||value.bindingEvidenceDigestSha256!==binding.evidenceDigestSha256)throw new Error('PRODUCTION_ACTIVATION_REQUEST_EVIDENCE_BINDING_MISMATCH');
  const requestedAt=parseTime(value.requestedAt,'PRODUCTION_ACTIVATION_REQUESTED_AT_INVALID');
  const expiresAt=parseTime(value.expiresAt,'PRODUCTION_ACTIVATION_EXPIRES_AT_INVALID');
  if(expiresAt<=requestedAt||expiresAt-requestedAt>MAX_ACTIVATION_REQUEST_TTL_MS)throw new Error('PRODUCTION_ACTIVATION_REQUEST_TTL_INVALID');
  if(requestedAt>now.getTime()+CLOCK_SKEW_MS||now.getTime()>expiresAt)throw new Error('PRODUCTION_ACTIVATION_REQUEST_NOT_CURRENT');
  assertDigest(value.requestDigestSha256,'PRODUCTION_ACTIVATION_REQUEST_DIGEST_INVALID');
  const expected=computeProductionActivationRequestDigest({protocol:value.protocol,actorType:value.actorType,requesterId:value.requesterId,reason:value.reason,candidate:value.candidate,readinessAssessmentDigestSha256:value.readinessAssessmentDigestSha256,d10ApprovalDigestSha256:value.d10ApprovalDigestSha256,bindingEvidenceDigestSha256:value.bindingEvidenceDigestSha256,requestedAt:value.requestedAt,expiresAt:value.expiresAt});
  if(value.requestDigestSha256!==expected)throw new Error('PRODUCTION_ACTIVATION_REQUEST_DIGEST_MISMATCH');
}

function validateActivationApproval(value:ProductionActivationApproval,request:ProductionActivationRequest,d10:D10HumanProductApproval,now:Date):void {
  if(value.protocol!==CONTROL_PRODUCTION_ACTIVATION_APPROVAL_PROTOCOL||value.actorType!=='HUMAN'||value.decision!=='APPROVED')throw new Error('PRODUCTION_ACTIVATION_HUMAN_APPROVAL_REQUIRED');
  assertSafeHumanId(value.approverId,'PRODUCTION_ACTIVATION_APPROVER_INVALID');
  if(value.approverId===request.requesterId)throw new Error('PRODUCTION_ACTIVATION_SEPARATION_OF_DUTIES_REQUIRED');
  if(value.approverId===d10.approverId)throw new Error('PRODUCTION_ACTIVATION_D10_SEPARATION_OF_DUTIES_REQUIRED');
  if(value.approvalNote.trim().length<12||value.approvalNote.length>1000)throw new Error('PRODUCTION_ACTIVATION_APPROVAL_NOTE_INVALID');
  if(value.requestDigestSha256!==request.requestDigestSha256)throw new Error('PRODUCTION_ACTIVATION_APPROVAL_REQUEST_MISMATCH');
  const approvedAt=parseTime(value.approvedAt,'PRODUCTION_ACTIVATION_APPROVED_AT_INVALID');
  const requestedAt=parseTime(request.requestedAt,'PRODUCTION_ACTIVATION_REQUESTED_AT_INVALID');
  const expiresAt=parseTime(request.expiresAt,'PRODUCTION_ACTIVATION_EXPIRES_AT_INVALID');
  if(approvedAt<requestedAt-CLOCK_SKEW_MS||approvedAt>expiresAt||approvedAt>now.getTime()+CLOCK_SKEW_MS)throw new Error('PRODUCTION_ACTIVATION_APPROVAL_TIME_INVALID');
  assertDigest(value.approvalDigestSha256,'PRODUCTION_ACTIVATION_APPROVAL_DIGEST_INVALID');
  const expected=computeProductionActivationApprovalDigest({protocol:value.protocol,actorType:value.actorType,decision:value.decision,approverId:value.approverId,approvalNote:value.approvalNote,requestDigestSha256:value.requestDigestSha256,approvedAt:value.approvedAt});
  if(value.approvalDigestSha256!==expected)throw new Error('PRODUCTION_ACTIVATION_APPROVAL_DIGEST_MISMATCH');
}

function blocked(state:Exclude<ProductionActivationDecision['state'],'PRODUCTION_RUNTIME_GATE_OPEN'>):ProductionActivationDecision {
  return Object.freeze({state,canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,browserActivationAllowed:false});
}

export class ControlProductionActivationAuthorizer {
  constructor(private readonly candidate:ControlReleaseCandidate,private readonly now:()=>Date=()=>new Date()) { validateControlReleaseCandidate(candidate); }

  authorize(input:Readonly<{readiness:ProductionReadinessAssessment;d10:D10HumanProductApproval;bindings:ProductionBindingEvidence;request:ProductionActivationRequest;approval:ProductionActivationApproval}>):ProductionActivationDecision {
    const now=this.now();
    try { validateReadinessAssessment(input.readiness,this.candidate); } catch { return blocked('BLOCKED_READINESS_ASSESSMENT'); }
    try {
      if(input.d10.protocol!==CONTROL_D10_APPROVAL_PROTOCOL)throw new Error('D10_PROTOCOL');
      validateD10HumanProductApproval(input.d10,this.candidate,now);
    } catch { return blocked('BLOCKED_D10'); }
    try { validateProductionBindingEvidence(input.bindings,this.candidate,now); } catch { return blocked('BLOCKED_REAL_BINDINGS'); }
    try { validateActivationRequest(input.request,this.candidate,input.readiness,input.d10,input.bindings,now);validateActivationApproval(input.approval,input.request,input.d10,now); } catch { return blocked('BLOCKED_ACTIVATION_CEREMONY'); }
    const requestExpiry=parseTime(input.request.expiresAt,'PRODUCTION_ACTIVATION_EXPIRES_AT_INVALID');
    const validUntil=new Date(Math.min(requestExpiry,now.getTime()+MAX_ACTIVATION_LEASE_MS)).toISOString();
    const leaseId=`control-activation:${sha256Canonical({candidate:this.candidate,request:input.request.requestDigestSha256,approval:input.approval.approvalDigestSha256,issuedAt:now.toISOString()}).slice(0,32)}`;
    const material={protocol:CONTROL_PRODUCTION_ACTIVATION_AUTHORIZATION_PROTOCOL,state:'PRODUCTION_RUNTIME_GATE_OPEN' as const,candidate:this.candidate,readinessAssessmentDigestSha256:input.readiness.assessmentDigestSha256,d10ApprovalDigestSha256:input.d10.approvalDigestSha256,bindingEvidenceDigestSha256:input.bindings.evidenceDigestSha256,activationRequestDigestSha256:input.request.requestDigestSha256,activationApprovalDigestSha256:input.approval.approvalDigestSha256,requesterId:input.request.requesterId,approverId:input.approval.approverId,issuedAt:now.toISOString(),validUntil,leaseId,executionAuthorization:'RUNTIME_GATE_ONLY' as const,canonicalWriteExecuted:false as const,externalAckSent:false as const,productionSessionCreated:false as const,browserActivationAllowed:false as const};
    const authorization:Object=Object.freeze({...material,authorizationDigestSha256:sha256Canonical(material)});
    return Object.freeze({state:'PRODUCTION_RUNTIME_GATE_OPEN',authorization:authorization as ProductionActivationAuthorization,canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,browserActivationAllowed:false});
  }
}
