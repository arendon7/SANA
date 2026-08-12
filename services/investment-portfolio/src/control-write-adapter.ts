import type { DeclareCapitalRequirement, InvestmentProject } from '@agroway/invest-control-contracts';
import { declareRequirement } from './ledger.js';

export interface CanonicalWriteAuthorization {
  state:'AUTHORIZED_FOR_ADAPTER';
  tenantId:string;
  projectId:string;
  actorId:string;
  operationId:string;
  requiredPermission:string;
  authorizationContextDigestSha256:string;
  idempotencyKey:string;
  adapterInvocationAllowed:true;
  executionState:'NOT_EXECUTED';
  canonicalMutated:false;
  approvalAuthority:'HUMAN_ONLY';
  aiAuthority:'ADVISORY_ONLY';
}

export interface CanonicalOutboxEvent {
  eventKey:string;
  tenantId:string;
  aggregateId:string;
  eventName:'CapitalRequirementDeclared';
  payload:Readonly<{
    projectId:string;
    actorId:string;
    operationId:string;
    authorizationContextDigestSha256:string;
    idempotencyKey:string;
    previousRequiredMinor:number;
    requiredMinor:number;
    currency:string;
  }>;
  occurredAt:string;
}

export interface CanonicalWriteReceipt {
  receiptId:string;
  tenantId:string;
  projectId:string;
  operationId:string;
  idempotencyKey:string;
  authorizationContextDigestSha256:string;
  commandKind:'DECLARE_CAPITAL_REQUIREMENT';
  state:'COMMITTED_TO_CANONICAL_PORT';
  canonicalMutated:true;
  outboxAppended:true;
  committedAt:string;
}

export interface CanonicalInvestmentTransaction {
  findReceipt(tenantId:string,idempotencyKey:string):Promise<CanonicalWriteReceipt|undefined>;
  loadProjectForUpdate(tenantId:string,projectId:string):Promise<InvestmentProject|undefined>;
  saveProject(project:InvestmentProject):Promise<void>;
  appendOutbox(event:CanonicalOutboxEvent):Promise<void>;
  saveReceipt(receipt:CanonicalWriteReceipt):Promise<void>;
}

export interface CanonicalInvestmentUnitOfWork {
  transaction<T>(work:(tx:CanonicalInvestmentTransaction)=>Promise<T>):Promise<T>;
}

function requireAuthorization(auth:CanonicalWriteAuthorization,cmd:DeclareCapitalRequirement):void {
  if(auth.state!=='AUTHORIZED_FOR_ADAPTER'||auth.adapterInvocationAllowed!==true) throw new Error('CANONICAL_WRITE_AUTHORIZATION_REQUIRED');
  if(auth.executionState!=='NOT_EXECUTED'||auth.canonicalMutated!==false) throw new Error('CANONICAL_WRITE_PRECONDITION_STATE_INVALID');
  if(auth.approvalAuthority!=='HUMAN_ONLY'||auth.aiAuthority!=='ADVISORY_ONLY') throw new Error('CANONICAL_WRITE_AUTHORITY_BOUNDARY_INVALID');
  if(auth.tenantId!==cmd.tenantId||auth.projectId!==cmd.projectId) throw new Error('CANONICAL_WRITE_SCOPE_MISMATCH');
  if(auth.requiredPermission!=='finance:update') throw new Error('CANONICAL_WRITE_PERMISSION_MISMATCH');
  if(!auth.actorId.trim()||!auth.operationId.trim()) throw new Error('CANONICAL_WRITE_ACTOR_OPERATION_REQUIRED');
  if(!/^[a-f0-9]{64}$/i.test(auth.authorizationContextDigestSha256)) throw new Error('CANONICAL_WRITE_CONTEXT_DIGEST_INVALID');
  if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/.test(auth.idempotencyKey)) throw new Error('CANONICAL_WRITE_IDEMPOTENCY_KEY_INVALID');
}

function assertIdempotentReplay(existing:CanonicalWriteReceipt,auth:CanonicalWriteAuthorization,cmd:DeclareCapitalRequirement):CanonicalWriteReceipt {
  if(existing.tenantId!==cmd.tenantId||existing.projectId!==cmd.projectId||existing.operationId!==auth.operationId||existing.authorizationContextDigestSha256!==auth.authorizationContextDigestSha256||existing.commandKind!=='DECLARE_CAPITAL_REQUIREMENT') throw new Error('CANONICAL_WRITE_IDEMPOTENCY_CONFLICT');
  return existing;
}

export async function applyCapitalRequirementCanonicalWrite(auth:CanonicalWriteAuthorization,cmd:DeclareCapitalRequirement,uow:CanonicalInvestmentUnitOfWork):Promise<CanonicalWriteReceipt> {
  requireAuthorization(auth,cmd);
  return uow.transaction(async tx=>{
    const existing=await tx.findReceipt(cmd.tenantId,auth.idempotencyKey);
    if(existing) return assertIdempotentReplay(existing,auth,cmd);
    const project=await tx.loadProjectForUpdate(cmd.tenantId,cmd.projectId);
    if(!project) throw new Error('CANONICAL_WRITE_PROJECT_NOT_FOUND');
    if(project.tenantId!==cmd.tenantId||project.projectId!==cmd.projectId) throw new Error('CANONICAL_WRITE_PROJECT_SCOPE_MISMATCH');
    const next=declareRequirement(project,cmd);
    const event:CanonicalOutboxEvent={
      eventKey:`CapitalRequirementDeclared:${auth.operationId}`,
      tenantId:cmd.tenantId,
      aggregateId:cmd.projectId,
      eventName:'CapitalRequirementDeclared',
      payload:{projectId:cmd.projectId,actorId:auth.actorId,operationId:auth.operationId,authorizationContextDigestSha256:auth.authorizationContextDigestSha256,idempotencyKey:auth.idempotencyKey,previousRequiredMinor:project.requiredMinor,requiredMinor:next.requiredMinor,currency:next.currency},
      occurredAt:cmd.at
    };
    const receipt:CanonicalWriteReceipt={receiptId:`cwr:${cmd.tenantId}:${auth.operationId}`,tenantId:cmd.tenantId,projectId:cmd.projectId,operationId:auth.operationId,idempotencyKey:auth.idempotencyKey,authorizationContextDigestSha256:auth.authorizationContextDigestSha256,commandKind:'DECLARE_CAPITAL_REQUIREMENT',state:'COMMITTED_TO_CANONICAL_PORT',canonicalMutated:true,outboxAppended:true,committedAt:cmd.at};
    await tx.saveProject(next);
    await tx.appendOutbox(event);
    await tx.saveReceipt(receipt);
    return receipt;
  });
}
