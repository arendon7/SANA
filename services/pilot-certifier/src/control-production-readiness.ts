import { sha256Canonical } from './hash.js';

export const CONTROL_PRODUCTION_READINESS_PROTOCOL='AGROWAY_CONTROL_PRODUCTION_READINESS_V1' as const;
export const CONTROL_D10_APPROVAL_PROTOCOL='AGROWAY_CONTROL_D10_PRODUCT_APPROVAL_V1' as const;

export type ControlReleaseCandidate=Readonly<{
  version:string;
  headSha:string;
  reviewBundleSha256:string;
}>;

export type D10HumanProductApproval=Readonly<{
  protocol:typeof CONTROL_D10_APPROVAL_PROTOCOL;
  decision:'APPROVED';
  actorType:'HUMAN';
  approverId:string;
  approvalRecordId:string;
  approvalNote:string;
  approvedAt:string;
  candidate:ControlReleaseCandidate;
  approvalDigestSha256:string;
}>;

export type IdentityConnectivityEvidence=Readonly<{
  state:'JWKS_CONNECTED_READ_ONLY_PROBE';
  realTokenVerified:false;
  canonicalMutated:false;
  executionState:'NOT_EXECUTED';
}>;
export type PostgresConnectivityEvidence=Readonly<{
  state:'CONNECTED_READ_ONLY_PROBE';
  tlsRequired:true;
  canonicalWriteExecuted:false;
}>;
export type ExternalAckConnectivityEvidence=Readonly<{
  state:'EXTERNAL_ACK_PROVIDER_METADATA_CONNECTED_READ_ONLY_PROBE';
  realExternalAckObserved:false;
  canonicalMutated:false;
  executionState:'NOT_EXECUTED';
}>;

export interface IdentityConnectivityPort { verifyConnectivity():Promise<IdentityConnectivityEvidence>; }
export interface PostgresConnectivityPort { verifyConnectivity():Promise<PostgresConnectivityEvidence>; }
export interface ExternalAckConnectivityPort { verifyConnectivity():Promise<ExternalAckConnectivityEvidence>; }

export type ProductionReadinessPorts=Readonly<{
  identity:IdentityConnectivityPort;
  postgres:PostgresConnectivityPort;
  externalAck:ExternalAckConnectivityPort;
}>;

export type ProductionReadinessCheck=Readonly<{
  id:'IDENTITY_PROVIDER_CONNECTIVITY'|'POSTGRES_CONNECTIVITY'|'EXTERNAL_ACK_PROVIDER_CONNECTIVITY'|'D10_HUMAN_PRODUCT_APPROVAL';
  status:'PASS'|'PENDING'|'FAIL';
}>;

export type ProductionReadinessAssessment=Readonly<{
  protocol:typeof CONTROL_PRODUCTION_READINESS_PROTOCOL;
  candidate:ControlReleaseCandidate;
  state:'BLOCKED_PRODUCTION_PREREQUISITES'|'READY_FOR_D10_HUMAN_REVIEW'|'BLOCKED_INVALID_D10_EVIDENCE'|'READY_FOR_EXPLICIT_ACTIVATION_REVIEW';
  checks:readonly ProductionReadinessCheck[];
  assessedAt:string;
  assessmentDigestSha256:string;
  productionExecutionEnabled:false;
  canonicalWritePermitted:false;
  browserActivationAllowed:false;
  realProductionTokenVerified:false;
  realExternalAckObserved:false;
  canonicalMutated:false;
}>;

export type ProductionReadinessAssessmentMaterial=Omit<ProductionReadinessAssessment,'assessmentDigestSha256'>;

const SHA1=/^[a-f0-9]{40}$/;
const SHA256=/^[a-f0-9]{64}$/;
const VERSION=/^0\.22\.0-(?:alpha\d+|initial-rc[1-9]\d*)$/;
const SAFE_ID=/^[A-Za-z0-9][A-Za-z0-9_.:@/-]{2,127}$/;

export function validateControlReleaseCandidate(candidate:ControlReleaseCandidate):void {
  if(!VERSION.test(candidate.version)) throw new Error('PRODUCTION_READINESS_VERSION_INVALID');
  if(!SHA1.test(candidate.headSha)) throw new Error('PRODUCTION_READINESS_HEAD_SHA_INVALID');
  if(!SHA256.test(candidate.reviewBundleSha256)) throw new Error('PRODUCTION_READINESS_BUNDLE_DIGEST_INVALID');
}

function approvalMaterial(approval:Omit<D10HumanProductApproval,'approvalDigestSha256'>):unknown {
  return {
    protocol:approval.protocol,decision:approval.decision,actorType:approval.actorType,approverId:approval.approverId,
    approvalRecordId:approval.approvalRecordId,approvalNote:approval.approvalNote,approvedAt:approval.approvedAt,candidate:approval.candidate
  };
}

export function computeD10ApprovalDigest(approval:Omit<D10HumanProductApproval,'approvalDigestSha256'>):string {
  return sha256Canonical(approvalMaterial(approval));
}

export function computeProductionReadinessAssessmentDigest(assessment:ProductionReadinessAssessmentMaterial):string {
  return sha256Canonical(assessment);
}

export function validateD10HumanProductApproval(approval:D10HumanProductApproval,candidate:ControlReleaseCandidate,now:Date):void {
  validateControlReleaseCandidate(candidate);
  if(approval.protocol!==CONTROL_D10_APPROVAL_PROTOCOL) throw new Error('D10_APPROVAL_PROTOCOL_INVALID');
  if(approval.decision!=='APPROVED') throw new Error('D10_APPROVAL_DECISION_INVALID');
  if(approval.actorType!=='HUMAN') throw new Error('D10_HUMAN_ACTOR_REQUIRED');
  if(!SAFE_ID.test(approval.approverId)) throw new Error('D10_APPROVER_ID_INVALID');
  if(!SAFE_ID.test(approval.approvalRecordId)) throw new Error('D10_APPROVAL_RECORD_ID_INVALID');
  if(approval.approvalNote.trim().length<12||approval.approvalNote.length>2000) throw new Error('D10_APPROVAL_NOTE_INVALID');
  const approvedAt=Date.parse(approval.approvedAt);
  if(!Number.isFinite(approvedAt)) throw new Error('D10_APPROVED_AT_INVALID');
  if(approvedAt>now.getTime()+300000) throw new Error('D10_APPROVED_AT_FUTURE');
  if(approval.candidate.version!==candidate.version||approval.candidate.headSha!==candidate.headSha||approval.candidate.reviewBundleSha256!==candidate.reviewBundleSha256) throw new Error('D10_RELEASE_CANDIDATE_BINDING_MISMATCH');
  if(!SHA256.test(approval.approvalDigestSha256)) throw new Error('D10_APPROVAL_DIGEST_INVALID');
  const expected=computeD10ApprovalDigest({
    protocol:approval.protocol,decision:approval.decision,actorType:approval.actorType,approverId:approval.approverId,
    approvalRecordId:approval.approvalRecordId,approvalNote:approval.approvalNote,approvedAt:approval.approvedAt,candidate:approval.candidate
  });
  if(approval.approvalDigestSha256!==expected) throw new Error('D10_APPROVAL_DIGEST_MISMATCH');
}

function identityEvidenceValid(value:IdentityConnectivityEvidence):boolean {
  return value?.state==='JWKS_CONNECTED_READ_ONLY_PROBE'&&value.realTokenVerified===false&&value.canonicalMutated===false&&value.executionState==='NOT_EXECUTED';
}
function postgresEvidenceValid(value:PostgresConnectivityEvidence):boolean {
  return value?.state==='CONNECTED_READ_ONLY_PROBE'&&value.tlsRequired===true&&value.canonicalWriteExecuted===false;
}
function ackEvidenceValid(value:ExternalAckConnectivityEvidence):boolean {
  return value?.state==='EXTERNAL_ACK_PROVIDER_METADATA_CONNECTED_READ_ONLY_PROBE'&&value.realExternalAckObserved===false&&value.canonicalMutated===false&&value.executionState==='NOT_EXECUTED';
}

export class ControlProductionReadinessOrchestrator {
  constructor(private readonly ports:ProductionReadinessPorts,private readonly candidate:ControlReleaseCandidate,private readonly now:()=>Date=()=>new Date()) { validateControlReleaseCandidate(candidate); }

  async assess(d10?:D10HumanProductApproval):Promise<ProductionReadinessAssessment> {
    const assessedAt=this.now();
    const [identity,postgres,externalAck]=await Promise.allSettled([
      this.ports.identity.verifyConnectivity(),this.ports.postgres.verifyConnectivity(),this.ports.externalAck.verifyConnectivity()
    ]);
    const checks:ProductionReadinessCheck[]=[
      {id:'IDENTITY_PROVIDER_CONNECTIVITY',status:identity.status==='fulfilled'&&identityEvidenceValid(identity.value)?'PASS':'FAIL'},
      {id:'POSTGRES_CONNECTIVITY',status:postgres.status==='fulfilled'&&postgresEvidenceValid(postgres.value)?'PASS':'FAIL'},
      {id:'EXTERNAL_ACK_PROVIDER_CONNECTIVITY',status:externalAck.status==='fulfilled'&&ackEvidenceValid(externalAck.value)?'PASS':'FAIL'}
    ];
    const preflightsPass=checks.every(x=>x.status==='PASS');
    let state:ProductionReadinessAssessment['state'];
    if(!preflightsPass){checks.push({id:'D10_HUMAN_PRODUCT_APPROVAL',status:d10?'FAIL':'PENDING'});state='BLOCKED_PRODUCTION_PREREQUISITES';}
    else if(!d10){checks.push({id:'D10_HUMAN_PRODUCT_APPROVAL',status:'PENDING'});state='READY_FOR_D10_HUMAN_REVIEW';}
    else {
      try { validateD10HumanProductApproval(d10,this.candidate,assessedAt);checks.push({id:'D10_HUMAN_PRODUCT_APPROVAL',status:'PASS'});state='READY_FOR_EXPLICIT_ACTIVATION_REVIEW'; }
      catch { checks.push({id:'D10_HUMAN_PRODUCT_APPROVAL',status:'FAIL'});state='BLOCKED_INVALID_D10_EVIDENCE'; }
    }
    const material:ProductionReadinessAssessmentMaterial={protocol:CONTROL_PRODUCTION_READINESS_PROTOCOL,candidate:this.candidate,state,checks,assessedAt:assessedAt.toISOString(),productionExecutionEnabled:false,canonicalWritePermitted:false,browserActivationAllowed:false,realProductionTokenVerified:false,realExternalAckObserved:false,canonicalMutated:false};
    return Object.freeze({...material,checks:Object.freeze(checks.map(x=>Object.freeze({...x}))),assessmentDigestSha256:computeProductionReadinessAssessmentDigest(material)});
  }
}
