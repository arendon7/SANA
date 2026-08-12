import type {
  IssuePilotCertificateCommand,
  PilotAcceptancePolicy,
  PilotCertificate,
  PilotCertificationDecision,
  PilotEnrollment,
  PilotEvidence,
  PilotStage,
  StageAcceptancePolicy,
  StageEvaluation,
} from '@agroway/pilot-certification-contracts';
import { REQUIRED_PILOT_STAGES } from '@agroway/pilot-certification-contracts';

export type Sha256HexAsync=(canonical:string)=>Promise<string>;
const SHA256=/^[a-f0-9]{64}$/;
function validIsoMs(value:string):number {const ms=Date.parse(value);if(!Number.isFinite(ms))throw new Error('INVALID_ISO_DATETIME');return ms;}
function assertDigest(value:string):string {if(!SHA256.test(value))throw new Error('INVALID_SHA256_DIGEST');return value;}
function canonical(value:unknown):string{return JSON.stringify(value);}
function evidenceForStage(evidence:readonly PilotEvidence[],stage:PilotStage):readonly PilotEvidence[]{return evidence.filter(item=>item.stage===stage).sort((a,b)=>a.evidenceId.localeCompare(b.evidenceId));}

export function evaluateStage(policy:StageAcceptancePolicy,evidence:readonly PilotEvidence[],tenantId:string,pilotId:string,asOf:string):StageEvaluation {
  const asOfMs=validIsoMs(asOf); const accepted:string[]=[]; const rejected:string[]=[]; const reasons:string[]=[];
  const seenKinds=new Set<string>();
  for(const item of evidenceForStage(evidence,policy.stage)){
    if(item.tenantId!==tenantId||item.pilotId!==pilotId){rejected.push(item.evidenceId);continue;}
    if(!SHA256.test(item.sourceDigestSha256)){rejected.push(item.evidenceId);reasons.push('INVALID_EVIDENCE_DIGEST');continue;}
    if(item.outcome==='FAIL'){rejected.push(item.evidenceId);reasons.push('EVIDENCE_FAILED');continue;}
    if(item.outcome!=='PASS'){rejected.push(item.evidenceId);continue;}
    if(policy.maxAgeSeconds!==undefined&&asOfMs-validIsoMs(item.observedAt)>policy.maxAgeSeconds*1000){rejected.push(item.evidenceId);reasons.push('EVIDENCE_STALE');continue;}
    accepted.push(item.evidenceId);seenKinds.add(item.kind);
  }
  for(const kind of policy.requiredKinds) if(!seenKinds.has(kind)) reasons.push(`REQUIRED_KIND_MISSING:${kind}`);
  if(accepted.length<policy.minimumEvidence) reasons.push('MINIMUM_EVIDENCE_NOT_MET');
  return Object.freeze({stage:policy.stage,status:reasons.length===0?'PASS':'FAIL',acceptedEvidenceIds:Object.freeze(accepted),rejectedEvidenceIds:Object.freeze(rejected),reasonCodes:Object.freeze([...new Set(reasons)].sort())});
}

export async function evaluatePilotCertification(enrollment:PilotEnrollment,policy:PilotAcceptancePolicy,evidence:readonly PilotEvidence[],evaluatedAt:string,sha256:Sha256HexAsync):Promise<PilotCertificationDecision>{
  validIsoMs(evaluatedAt);
  if(enrollment.policyVersion!==policy.version) throw new Error('PILOT_POLICY_VERSION_MISMATCH');
  if(!policy.requireAllStages||!policy.requireHumanCertification||!policy.requireTenantIsolation) throw new Error('UNSAFE_PILOT_POLICY');
  const configured=new Map(policy.requiredStages.map(stage=>[stage.stage,stage] as const));
  const missingPolicyStages:string[]=[];
  for(const stage of REQUIRED_PILOT_STAGES) if(!configured.has(stage)) missingPolicyStages.push(stage);
  const duplicatePolicyStageCount=policy.requiredStages.length-configured.size;
  const evaluations=policy.requiredStages.map(stage=>evaluateStage(stage,evidence,enrollment.tenantId,enrollment.pilotId,evaluatedAt));
  const reasons:string[]=[...missingPolicyStages.map(stage=>`POLICY_STAGE_MISSING:${stage}`)];
  if(duplicatePolicyStageCount>0) reasons.push('POLICY_STAGE_DUPLICATED');
  if(evaluations.some(item=>item.status==='FAIL')) reasons.push('ONE_OR_MORE_STAGES_FAILED');
  const tenantIsolationPass=evidence.some(item=>item.tenantId===enrollment.tenantId&&item.pilotId===enrollment.pilotId&&item.kind==='TENANT_ISOLATION'&&item.outcome==='PASS');
  if(!tenantIsolationPass) reasons.push('TENANT_ISOLATION_NOT_VERIFIED');
  const evidenceDigestSha256=assertDigest(await sha256(canonical(evidence.slice().sort((a,b)=>a.evidenceId.localeCompare(b.evidenceId)))));
  const decisionCore={pilotId:enrollment.pilotId,tenantId:enrollment.tenantId,policyVersion:policy.version,evaluatedAt,status:reasons.length===0?'ELIGIBLE_FOR_CERTIFICATION' as const:'REJECTED' as const,stageEvaluations:evaluations,reasonCodes:[...new Set(reasons)].sort(),evidenceDigestSha256};
  const decisionDigestSha256=assertDigest(await sha256(canonical(decisionCore)));
  return Object.freeze({...decisionCore,stageEvaluations:Object.freeze(evaluations),reasonCodes:Object.freeze(decisionCore.reasonCodes),decisionDigestSha256});
}

export function issuePilotCertificate(enrollment:PilotEnrollment,decision:PilotCertificationDecision,command:IssuePilotCertificateCommand):PilotCertificate {
  if(enrollment.tenantId!==command.tenantId||enrollment.pilotId!==command.pilotId) throw new Error('PILOT_SCOPE_MISMATCH');
  if(decision.tenantId!==command.tenantId||decision.pilotId!==command.pilotId) throw new Error('DECISION_SCOPE_MISMATCH');
  if(decision.status!=='ELIGIBLE_FOR_CERTIFICATION') throw new Error('PILOT_NOT_ELIGIBLE');
  if(decision.decisionDigestSha256!==command.decisionDigestSha256) throw new Error('DECISION_DIGEST_MISMATCH');
  if(command.humanAttestation!==true) throw new Error('HUMAN_ATTESTATION_REQUIRED');
  validIsoMs(command.issuedAt); assertDigest(command.decisionDigestSha256);
  return Object.freeze({
    certificateId:`pilot-certificate:${command.pilotId}:${command.decisionDigestSha256.slice(0,16)}`,pilotId:command.pilotId,tenantId:command.tenantId,
    policyVersion:decision.policyVersion,decisionDigestSha256:command.decisionDigestSha256,issuedByActorId:command.issuedByActorId,issuedAt:command.issuedAt,humanAttestation:true,state:'ACTIVE',
  });
}

export const PILOT_CERTIFICATION_AUTHORITY=Object.freeze({deterministicEligibility:true,humanCertificateIssuanceRequired:true,aiMayIssueCertificate:false});
