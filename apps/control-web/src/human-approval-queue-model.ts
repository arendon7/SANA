export type ApprovalRisk='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type ApprovalState='PENDING_HUMAN_REVIEW'|'AWAITING_SECOND_HUMAN_APPROVAL'|'APPROVED_FOR_SUBMISSION'|'CHANGES_REQUESTED'|'REJECTED';
export type ApprovalExecutionState='NOT_EXECUTED';
export type ApprovalProposalKind='AGRONOMIC_ACTION'|'INVESTMENT_COMMITMENT'|'SUPPLY_ACTION'|'COMMERCIAL_PLAN'|'IMPACT_ASSERTION'|'EXCEPTION_RESOLUTION';
export type ApprovalHumanAction='APPROVE_FOR_SUBMISSION'|'REQUEST_CHANGES'|'REJECT'|'ADD_NOTE';
export type DeterministicPrecheck='PASS'|'FAIL';

export interface ApprovalEvidenceRef {
  evidenceId:string;
  freshness:'FRESH'|'STALE'|'UNKNOWN';
  reviewState:'ACCEPTED_FOR_REVIEW'|'UNREVIEWED'|'REJECTED'|'REFRESH_REQUIRED';
}
export interface ApprovalProposal {
  proposalId:string;
  tenantId:string;
  projectId?:string;
  kind:ApprovalProposalKind;
  title:string;
  summary:string;
  risk:ApprovalRisk;
  requestedByActorId:string;
  requestedByActorType:'HUMAN'|'AI';
  suggestionState?:'DRAFT_SUGGESTION';
  proposedActions:readonly string[];
  evidence:readonly ApprovalEvidenceRef[];
  evidenceContextHashSha256:string;
  proposalDigestSha256:string;
  deterministicPrecheck:DeterministicPrecheck;
  deterministicReasonCodes:readonly string[];
  state:ApprovalState;
  requiredApprovals:1|2;
  approvalRecords:readonly HumanApprovalRecord[];
  executionState:ApprovalExecutionState;
  canonicalMutated:false;
  localOnly:true;
}
export interface HumanApprovalRecord {
  approvalId:string;
  proposalId:string;
  approverActorId:string;
  approverActorType:'HUMAN';
  action:ApprovalHumanAction;
  note:string;
  approvedAt:string;
  evidenceContextHashSha256:string;
  proposalDigestSha256:string;
  previousApprovalDigestSha256:string|null;
  approvalDigestSha256:string;
}
export interface HumanApprovalCommand {
  actorId:string;
  actorType:'HUMAN';
  action:ApprovalHumanAction;
  note:string;
  at:string;
  approvalDigestSha256?:string;
}

const SHA256=/^[a-f0-9]{64}$/;
function assertIso(value:string):void{if(!Number.isFinite(Date.parse(value)))throw new Error('INVALID_ISO_DATETIME')}
function assertDigest(value:string,code:string):void{if(!SHA256.test(value))throw new Error(code)}
function clone<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T}
export function requiredHumanApprovals(risk:ApprovalRisk):1|2{return risk==='HIGH'||risk==='CRITICAL'?2:1}

export function validateApprovalProposal(proposal:ApprovalProposal):void{
  if(!proposal.proposalId.trim()||!proposal.tenantId.trim())throw new Error('PROPOSAL_IDENTITY_REQUIRED');
  assertDigest(proposal.evidenceContextHashSha256,'EVIDENCE_CONTEXT_HASH_REQUIRED');
  assertDigest(proposal.proposalDigestSha256,'PROPOSAL_DIGEST_REQUIRED');
  if(proposal.requiredApprovals!==requiredHumanApprovals(proposal.risk))throw new Error('REQUIRED_APPROVAL_COUNT_MISMATCH');
  if(proposal.requestedByActorType==='AI'&&proposal.suggestionState!=='DRAFT_SUGGESTION')throw new Error('AI_PROPOSAL_MUST_BE_DRAFT_SUGGESTION');
  if(proposal.requestedByActorType==='HUMAN'&&proposal.suggestionState)throw new Error('HUMAN_PROPOSAL_CANNOT_HAVE_AI_SUGGESTION_STATE');
  if(proposal.executionState!=='NOT_EXECUTED')throw new Error('ALPHA5_EXECUTION_FORBIDDEN');
  if(proposal.canonicalMutated!==false||proposal.localOnly!==true)throw new Error('ALPHA5_REVIEW_TRUST_BOUNDARY_VIOLATION');
  for(const record of proposal.approvalRecords)validateHumanApprovalRecord(record,proposal);
}
export function validateHumanApprovalRecord(record:HumanApprovalRecord,proposal:ApprovalProposal):void{
  if(record.approverActorType!=='HUMAN'||!record.approverActorId.trim())throw new Error('HUMAN_APPROVER_REQUIRED');
  if(record.proposalId!==proposal.proposalId)throw new Error('APPROVAL_PROPOSAL_MISMATCH');
  if(record.evidenceContextHashSha256!==proposal.evidenceContextHashSha256)throw new Error('APPROVAL_CONTEXT_HASH_MISMATCH');
  if(record.proposalDigestSha256!==proposal.proposalDigestSha256)throw new Error('APPROVAL_PROPOSAL_DIGEST_MISMATCH');
  if(!record.note.trim())throw new Error('HUMAN_APPROVAL_NOTE_REQUIRED');
  assertIso(record.approvedAt);assertDigest(record.approvalDigestSha256,'APPROVAL_DIGEST_REQUIRED');
  if(record.previousApprovalDigestSha256!==null)assertDigest(record.previousApprovalDigestSha256,'PREVIOUS_APPROVAL_DIGEST_INVALID');
}
function assertApprovalReadiness(proposal:ApprovalProposal,actorId:string):void{
  if(proposal.deterministicPrecheck!=='PASS')throw new Error('DETERMINISTIC_PRECHECK_MUST_PASS');
  if(proposal.evidence.length===0)throw new Error('APPROVAL_EVIDENCE_REQUIRED');
  if(proposal.evidence.some(e=>e.reviewState!=='ACCEPTED_FOR_REVIEW'))throw new Error('ALL_APPROVAL_EVIDENCE_MUST_BE_ACCEPTED_FOR_REVIEW');
  if((proposal.risk==='HIGH'||proposal.risk==='CRITICAL')&&proposal.evidence.some(e=>e.freshness!=='FRESH'))throw new Error('HIGH_RISK_REQUIRES_FRESH_EVIDENCE');
  if((proposal.risk==='HIGH'||proposal.risk==='CRITICAL')&&proposal.requestedByActorType==='HUMAN'&&proposal.requestedByActorId===actorId)throw new Error('HIGH_RISK_SEPARATION_OF_DUTIES_REQUIRED');
  if(proposal.approvalRecords.some(r=>r.approverActorId===actorId&&r.action==='APPROVE_FOR_SUBMISSION'))throw new Error('DUPLICATE_HUMAN_APPROVER_FORBIDDEN');
}
export function applyHumanApprovalCommand(proposal:ApprovalProposal,cmd:HumanApprovalCommand):ApprovalProposal{
  validateApprovalProposal(proposal);
  if(cmd.actorType!=='HUMAN'||!cmd.actorId.trim())throw new Error('HUMAN_APPROVER_REQUIRED');
  if(!cmd.note.trim())throw new Error('HUMAN_APPROVAL_NOTE_REQUIRED');assertIso(cmd.at);
  const next=clone(proposal) as ApprovalProposal;
  if(cmd.action==='APPROVE_FOR_SUBMISSION'){
    assertApprovalReadiness(proposal,cmd.actorId);
    if(!cmd.approvalDigestSha256)throw new Error('APPROVAL_DIGEST_REQUIRED');assertDigest(cmd.approvalDigestSha256,'APPROVAL_DIGEST_REQUIRED');
    const previous=proposal.approvalRecords.at(-1)?.approvalDigestSha256??null;
    const record:HumanApprovalRecord={approvalId:`${proposal.proposalId}:${cmd.actorId}:${cmd.at}`,proposalId:proposal.proposalId,approverActorId:cmd.actorId,approverActorType:'HUMAN',action:'APPROVE_FOR_SUBMISSION',note:cmd.note,approvedAt:cmd.at,evidenceContextHashSha256:proposal.evidenceContextHashSha256,proposalDigestSha256:proposal.proposalDigestSha256,previousApprovalDigestSha256:previous,approvalDigestSha256:cmd.approvalDigestSha256};
    next.approvalRecords=[...proposal.approvalRecords,record];
    next.state=next.approvalRecords.filter(r=>r.action==='APPROVE_FOR_SUBMISSION').length>=proposal.requiredApprovals?'APPROVED_FOR_SUBMISSION':'AWAITING_SECOND_HUMAN_APPROVAL';
  }else if(cmd.action==='REQUEST_CHANGES'){
    next.state='CHANGES_REQUESTED';next.approvalRecords=[];
  }else if(cmd.action==='REJECT'){
    next.state='REJECTED';
  }
  next.executionState='NOT_EXECUTED';next.canonicalMutated=false;next.localOnly=true;validateApprovalProposal(next);return Object.freeze(next);
}
export function assertNoAiApproval(records:readonly HumanApprovalRecord[]):void{if(records.some(r=>r.approverActorType!=='HUMAN'))throw new Error('AI_APPROVAL_FORBIDDEN')}
export function approvalReadiness(proposal:ApprovalProposal):Readonly<{ready:boolean;missing:readonly string[]}>{const missing:string[]=[];if(proposal.deterministicPrecheck!=='PASS')missing.push('DETERMINISTIC_PRECHECK');if(proposal.evidence.length===0)missing.push('EVIDENCE');if(proposal.evidence.some(e=>e.reviewState!=='ACCEPTED_FOR_REVIEW'))missing.push('EVIDENCE_REVIEW');if((proposal.risk==='HIGH'||proposal.risk==='CRITICAL')&&proposal.evidence.some(e=>e.freshness!=='FRESH'))missing.push('FRESH_EVIDENCE');return Object.freeze({ready:missing.length===0,missing})}
