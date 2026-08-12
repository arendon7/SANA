import type {
  ReadinessEvidenceReceipt,
  ReadinessGap,
  SubmitReadinessGapEvidence,
} from '@agroway/invest-control-contracts';
import type {
  CapitalReadinessSqlExecutor,
  CapitalReadinessSqlResult,
  CapitalReadinessSqlScalar,
  CapitalReadinessSqlTransaction,
} from './readiness-persistence.js';

export const READINESS_EVIDENCE_SUBMIT_PERMISSION='invest:readiness:evidence:submit' as const;

export interface ReadinessEvidenceAuthorityContext {
  tenantId:string;
  actorId:string;
  require(permission:typeof READINESS_EVIDENCE_SUBMIT_PERMISSION):void;
}

interface ReceiptRow {
  receiptId:string;tenantId:string;projectId:string;assessmentId:string;assessmentVersion:number;gapId:string;
  evidenceRef:string;objectRef:string;digestSha256:string;contentType:string;byteLength:number;evidenceRole:string;
  submittedByActorRef:string;submittedAt:string;idempotencyKey:string;correlationId:string;state:'VALIDATED';
}
interface GapTransitionRow {
  sequence:number;toState:string;occurredAt:string;
}

const SHA256=/^[a-f0-9]{64}$/;
const IDEMPOTENCY=/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/;
const CONTENT_TYPE=/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i;

function nonBlank(value:string,code:string):string{const normalized=value.trim();if(!normalized)throw new Error(code);return normalized;}
function positive(value:number,code:string):number{if(!Number.isSafeInteger(value)||value<=0)throw new Error(code);return value;}
function iso(value:string,code:string):string{if(!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function digest(value:string):string{if(!SHA256.test(value))throw new Error('READINESS_EVIDENCE_DIGEST_INVALID');return value;}
function unique(values:readonly string[],code:string):readonly string[]{const normalized=values.map(v=>nonBlank(v,code));if(!normalized.length)throw new Error(`${code}_REQUIRED`);if(new Set(normalized).size!==normalized.length)throw new Error(`${code}_DUPLICATE`);return Object.freeze(normalized.sort());}
function rowCount(result:CapitalReadinessSqlResult<object>,expected:number,code:string):void{if(result.rowCount!==expected)throw new Error(`${code}:EXPECTED_${expected}_GOT_${result.rowCount}`);}
function sameScope(a:Readonly<{tenantId:string;projectId:string;assessmentVersion:number;gapId:string}>,b:Readonly<{tenantId:string;projectId:string;assessmentVersion:number;gapId:string}>,code:string):void{if(a.tenantId!==b.tenantId||a.projectId!==b.projectId||a.assessmentVersion!==b.assessmentVersion||a.gapId!==b.gapId)throw new Error(code);}

async function inTenantTransaction<T>(executor:CapitalReadinessSqlExecutor,tenantId:string,work:(tx:CapitalReadinessSqlTransaction)=>Promise<T>):Promise<T>{
  const tenant=nonBlank(tenantId,'READINESS_EVIDENCE_TENANT_REQUIRED');
  return executor.transaction(async tx=>{
    const bound=await tx.query("/* readiness-evidence:tenant-context */ SELECT set_config('app.tenant_id',$1,true)",[tenant]);
    if(bound.rowCount>1)throw new Error('READINESS_EVIDENCE_TENANT_CONTEXT_BIND_INVALID');
    return work(tx);
  });
}

function validateReceipt(receipt:ReadinessEvidenceReceipt):void{
  nonBlank(receipt.receiptId,'READINESS_EVIDENCE_RECEIPT_ID_REQUIRED');
  nonBlank(receipt.tenantId,'READINESS_EVIDENCE_TENANT_REQUIRED');
  nonBlank(receipt.projectId,'READINESS_EVIDENCE_PROJECT_REQUIRED');
  nonBlank(receipt.assessmentId,'READINESS_EVIDENCE_ASSESSMENT_REQUIRED');
  positive(receipt.assessmentVersion,'READINESS_EVIDENCE_ASSESSMENT_VERSION_INVALID');
  nonBlank(receipt.gapId,'READINESS_EVIDENCE_GAP_REQUIRED');
  nonBlank(receipt.evidenceRef,'READINESS_EVIDENCE_REF_REQUIRED');
  nonBlank(receipt.objectRef,'READINESS_EVIDENCE_OBJECT_REF_REQUIRED');
  digest(receipt.digestSha256);
  if(!CONTENT_TYPE.test(receipt.contentType))throw new Error('READINESS_EVIDENCE_CONTENT_TYPE_INVALID');
  positive(receipt.byteLength,'READINESS_EVIDENCE_BYTE_LENGTH_INVALID');
  nonBlank(receipt.evidenceRole,'READINESS_EVIDENCE_ROLE_REQUIRED');
  nonBlank(receipt.submittedByActorRef,'READINESS_EVIDENCE_ACTOR_REQUIRED');
  iso(receipt.submittedAt,'READINESS_EVIDENCE_SUBMITTED_AT_INVALID');
  if(!IDEMPOTENCY.test(receipt.idempotencyKey))throw new Error('READINESS_EVIDENCE_IDEMPOTENCY_KEY_INVALID');
  nonBlank(receipt.correlationId,'READINESS_EVIDENCE_CORRELATION_REQUIRED');
  if(receipt.state!=='VALIDATED')throw new Error('READINESS_EVIDENCE_RECEIPT_MUST_BE_VALIDATED');
}

function receiptFromRow(row:ReceiptRow):ReadinessEvidenceReceipt{return Object.freeze({...row});}
function sameReceipt(a:ReadinessEvidenceReceipt,b:ReadinessEvidenceReceipt):boolean{
  return a.receiptId===b.receiptId&&a.tenantId===b.tenantId&&a.projectId===b.projectId&&a.assessmentId===b.assessmentId&&a.assessmentVersion===b.assessmentVersion&&a.gapId===b.gapId&&a.evidenceRef===b.evidenceRef&&a.objectRef===b.objectRef&&a.digestSha256===b.digestSha256&&a.contentType===b.contentType&&a.byteLength===b.byteLength&&a.evidenceRole===b.evidenceRole&&a.submittedByActorRef===b.submittedByActorRef&&a.submittedAt===b.submittedAt&&a.idempotencyKey===b.idempotencyKey&&a.correlationId===b.correlationId&&a.state===b.state;
}

/**
 * Persists only metadata for an already server-validated immutable object.
 * Idempotency is serialized per tenant/key; replay returns the exact existing
 * receipt, while payload drift fails closed.
 */
export async function registerAuthorizedReadinessEvidenceReceipt(
  executor:CapitalReadinessSqlExecutor,
  authority:ReadinessEvidenceAuthorityContext,
  receipt:ReadinessEvidenceReceipt,
):Promise<ReadinessEvidenceReceipt>{
  validateReceipt(receipt);
  if(authority.tenantId!==receipt.tenantId)throw new Error('READINESS_EVIDENCE_AUTHORITY_TENANT_MISMATCH');
  nonBlank(authority.actorId,'READINESS_EVIDENCE_AUTHORITY_ACTOR_REQUIRED');
  authority.require(READINESS_EVIDENCE_SUBMIT_PERMISSION);
  if(receipt.submittedByActorRef!==authority.actorId)throw new Error('READINESS_EVIDENCE_ACTOR_MUST_DERIVE_FROM_AUTHORITY');
  return inTenantTransaction(executor,receipt.tenantId,async tx=>{
    await tx.query('/* readiness-evidence:idempotency-lock */ SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`readiness-evidence:${receipt.tenantId}:${receipt.idempotencyKey}`]);
    const existing=await tx.query<ReceiptRow>(`/* readiness-evidence:find-idempotent */
      SELECT receipt_id AS "receiptId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gap_id AS "gapId",
             evidence_ref AS "evidenceRef",object_ref AS "objectRef",digest_sha256 AS "digestSha256",content_type AS "contentType",byte_length AS "byteLength",evidence_role AS "evidenceRole",
             submitted_by_actor_ref AS "submittedByActorRef",submitted_at AS "submittedAt",idempotency_key AS "idempotencyKey",correlation_id AS "correlationId",validation_state AS state
      FROM agroway_invest.readiness_evidence_receipt
      WHERE tenant_id=$1 AND idempotency_key=$2
      LIMIT 2`,[receipt.tenantId,receipt.idempotencyKey]);
    if(existing.rowCount>1)throw new Error('READINESS_EVIDENCE_IDEMPOTENCY_NON_UNIQUE');
    if(existing.rowCount===1){
      const replay=receiptFromRow(existing.rows[0]);
      if(!sameReceipt(replay,receipt))throw new Error('READINESS_EVIDENCE_IDEMPOTENCY_PAYLOAD_DRIFT');
      return replay;
    }
    const inserted=await tx.query<ReceiptRow>(`/* readiness-evidence:insert-receipt */
      INSERT INTO agroway_invest.readiness_evidence_receipt
        (receipt_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,evidence_ref,object_ref,digest_sha256,content_type,byte_length,evidence_role,submitted_by_actor_ref,submitted_at,idempotency_key,correlation_id,validation_state)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'VALIDATED')
      RETURNING receipt_id AS "receiptId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gap_id AS "gapId",
                evidence_ref AS "evidenceRef",object_ref AS "objectRef",digest_sha256 AS "digestSha256",content_type AS "contentType",byte_length AS "byteLength",evidence_role AS "evidenceRole",
                submitted_by_actor_ref AS "submittedByActorRef",submitted_at AS "submittedAt",idempotency_key AS "idempotencyKey",correlation_id AS "correlationId",validation_state AS state`,[
      receipt.receiptId,receipt.tenantId,receipt.projectId,receipt.assessmentId,receipt.assessmentVersion,receipt.gapId,receipt.evidenceRef,receipt.objectRef,receipt.digestSha256,receipt.contentType,receipt.byteLength,receipt.evidenceRole,receipt.submittedByActorRef,receipt.submittedAt,receipt.idempotencyKey,receipt.correlationId,
    ]);
    rowCount(inserted,1,'READINESS_EVIDENCE_INSERT_ROWCOUNT');
    const persisted=receiptFromRow(inserted.rows[0]);
    if(!sameReceipt(persisted,receipt))throw new Error('READINESS_EVIDENCE_INSERT_RETURNING_DRIFT');
    return persisted;
  });
}

/**
 * Links validated receipts to one canonical gap by appending an
 * EVIDENCE_SUBMITTED transition. This does not resolve or waive the gap.
 */
export async function submitAuthorizedReadinessGapEvidence(
  executor:CapitalReadinessSqlExecutor,
  authority:ReadinessEvidenceAuthorityContext,
  gap:ReadinessGap,
  command:SubmitReadinessGapEvidence,
):Promise<void>{
  if(authority.tenantId!==gap.tenantId)throw new Error('READINESS_EVIDENCE_AUTHORITY_TENANT_MISMATCH');
  authority.require(READINESS_EVIDENCE_SUBMIT_PERMISSION);
  if(command.tenantId!==gap.tenantId||command.projectId!==gap.projectId||command.assessmentVersion!==gap.assessmentVersion||command.gapId!==gap.gapId)throw new Error('READINESS_EVIDENCE_COMMAND_SCOPE_MISMATCH');
  if(command.fromState!==gap.state)throw new Error('READINESS_EVIDENCE_COMMAND_STATE_STALE');
  if(command.fromState!=='OPEN'&&command.fromState!=='IN_REMEDIATION')throw new Error('READINESS_EVIDENCE_SUBMISSION_SOURCE_STATE_INVALID');
  nonBlank(command.assessmentId,'READINESS_EVIDENCE_ASSESSMENT_REQUIRED');
  const evidenceRefs=unique(command.evidenceRefs,'READINESS_EVIDENCE_SUBMISSION_REF');
  nonBlank(command.transitionId,'READINESS_EVIDENCE_TRANSITION_ID_REQUIRED');
  iso(command.at,'READINESS_EVIDENCE_TRANSITION_AT_INVALID');
  const note=command.note?.trim()||null;
  await inTenantTransaction(executor,gap.tenantId,async tx=>{
    const receipts=await tx.query<Pick<ReceiptRow,'evidenceRef'>>(`/* readiness-evidence:validate-submission-receipts */
      SELECT evidence_ref AS "evidenceRef"
      FROM agroway_invest.readiness_evidence_receipt
      WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4 AND gap_id=$5
        AND validation_state='VALIDATED' AND evidence_ref = ANY($6::text[])
      ORDER BY evidence_ref`,[gap.tenantId,gap.projectId,command.assessmentId,gap.assessmentVersion,gap.gapId,evidenceRefs]);
    const found=receipts.rows.map(row=>row.evidenceRef).sort();
    if(found.length!==evidenceRefs.length||found.some((ref,index)=>ref!==evidenceRefs[index]))throw new Error('READINESS_EVIDENCE_RECEIPT_SET_MISMATCH');
    const latest=await tx.query<GapTransitionRow>(`/* readiness-evidence:latest-gap-transition */
      SELECT sequence,to_state AS "toState",occurred_at AS "occurredAt"
      FROM agroway_invest.readiness_gap_transition
      WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4 AND gap_id=$5
      ORDER BY sequence DESC LIMIT 1`,[gap.tenantId,gap.projectId,command.assessmentId,gap.assessmentVersion,gap.gapId]);
    rowCount(latest,1,'READINESS_EVIDENCE_LATEST_GAP_ROWCOUNT');
    const row=latest.rows[0];
    if(row.toState!==command.fromState)throw new Error('PERSISTED_GAP_STATE_STALE');
    if(Date.parse(row.occurredAt)>Date.parse(command.at))throw new Error('PERSISTED_GAP_TIME_AHEAD');
    const inserted=await tx.query(`/* readiness-evidence:append-submission-transition */
      INSERT INTO agroway_invest.readiness_gap_transition
        (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,submitted_evidence_refs,note,occurred_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'EVIDENCE_SUBMITTED',$9,$10,$11,$12,$13)`,[
      command.transitionId,gap.tenantId,gap.projectId,command.assessmentId,gap.assessmentVersion,gap.gapId,row.sequence+1,command.fromState,authority.actorId,Object.freeze([]),evidenceRefs,note,command.at,
    ]);
    rowCount(inserted,1,'READINESS_EVIDENCE_SUBMISSION_TRANSITION_ROWCOUNT');
  });
}

export const READINESS_EVIDENCE_BOUNDARY=Object.freeze({
  postgresStoresFileBytes:false,
  receiptRequiresValidatedObject:true,
  evidenceSubmitSeparateFromRemediate:true,
  submissionResolvesGap:false,
  submissionWaivesGap:false,
  browserUploadEnabled:false,
  financialAuthority:false,
});
