import {createHash} from 'node:crypto';
import type {
  ReadinessEvidenceReceipt,
  ReadinessEvidenceReviewAction,
  ReadinessEvidenceReviewDecision,
  ReadinessGap,
  ReviewReadinessEvidenceInput,
} from '@agroway/invest-control-contracts';
import type {
  CapitalReadinessSqlExecutor,
  CapitalReadinessSqlResult,
  CapitalReadinessSqlTransaction,
} from './readiness-persistence.js';

export const READINESS_EVIDENCE_REVIEW_PERMISSION='invest:readiness:evidence:review' as const;

export interface ReadinessEvidenceReviewAuthorityContext {
  tenantId:string;
  actorId:string;
  require(permission:typeof READINESS_EVIDENCE_REVIEW_PERMISSION):void;
}

interface ReceiptRow extends ReadinessEvidenceReceipt {}
interface GapTransitionRow { sequence:number;toState:string;occurredAt:string; }
interface ReviewRow extends ReadinessEvidenceReviewDecision {}

const SHA256=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS:readonly ReadinessEvidenceReviewAction[]=['ACCEPTED_FOR_GAP_REVIEW','REJECTED','REFRESH_REQUIRED'] as const;

function nonBlank(value:string,code:string):string{const normalized=value.trim();if(!normalized)throw new Error(code);return normalized;}
function iso(value:string,code:string):string{if(!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function uuid(value:string,code:string):string{if(!UUID.test(value))throw new Error(code);return value;}
function digest(value:string,code:string):string{if(!SHA256.test(value))throw new Error(code);return value;}
function rowCount(result:CapitalReadinessSqlResult<object>,expected:number,code:string):void{if(result.rowCount!==expected)throw new Error(`${code}:EXPECTED_${expected}_GOT_${result.rowCount}`);}
function sha256(value:unknown):string{return createHash('sha256').update(JSON.stringify(value)).digest('hex');}

async function inTenantTransaction<T>(executor:CapitalReadinessSqlExecutor,tenantId:string,work:(tx:CapitalReadinessSqlTransaction)=>Promise<T>):Promise<T>{
  const tenant=nonBlank(tenantId,'READINESS_EVIDENCE_REVIEW_TENANT_REQUIRED');
  return executor.transaction(async tx=>{
    const bound=await tx.query("/* readiness-evidence-review:tenant-context */ SELECT set_config('app.tenant_id',$1,true)",[tenant]);
    if(bound.rowCount>1)throw new Error('READINESS_EVIDENCE_REVIEW_TENANT_CONTEXT_BIND_INVALID');
    return work(tx);
  });
}

function sameDecision(a:ReadinessEvidenceReviewDecision,b:ReadinessEvidenceReviewDecision):boolean{
  return a.decisionId===b.decisionId&&a.tenantId===b.tenantId&&a.projectId===b.projectId&&a.assessmentId===b.assessmentId&&a.assessmentVersion===b.assessmentVersion&&a.gapId===b.gapId&&a.receiptId===b.receiptId&&a.evidenceRef===b.evidenceRef&&a.receiptDigestSha256===b.receiptDigestSha256&&a.sequence===b.sequence&&a.action===b.action&&a.reviewerRef===b.reviewerRef&&a.rationale===b.rationale&&a.reviewedAt===b.reviewedAt&&a.previousDecisionDigestSha256===b.previousDecisionDigestSha256&&a.decisionDigestSha256===b.decisionDigestSha256;
}

function validateGapScope(gap:ReadinessGap,input:ReviewReadinessEvidenceInput):void{
  if(gap.tenantId!==input.tenantId||gap.projectId!==input.projectId||gap.assessmentVersion!==input.assessmentVersion||gap.gapId!==input.gapId)throw new Error('READINESS_EVIDENCE_REVIEW_GAP_SCOPE_MISMATCH');
  if(gap.state!=='EVIDENCE_SUBMITTED')throw new Error('READINESS_EVIDENCE_REVIEW_REQUIRES_EVIDENCE_SUBMITTED_STATE');
}

/**
 * Appends a HUMAN evidence-review decision for one canonical validated receipt.
 * The receipt must already have been submitted to the same gap. Review does not
 * resolve, waive, finalize or financially approve anything.
 */
export async function reviewAuthorizedReadinessEvidence(
  executor:CapitalReadinessSqlExecutor,
  authority:ReadinessEvidenceReviewAuthorityContext,
  gap:ReadinessGap,
  input:ReviewReadinessEvidenceInput,
):Promise<ReadinessEvidenceReviewDecision>{
  if(authority.tenantId!==input.tenantId)throw new Error('READINESS_EVIDENCE_REVIEW_AUTHORITY_TENANT_MISMATCH');
  const reviewerRef=nonBlank(authority.actorId,'READINESS_EVIDENCE_REVIEW_ACTOR_REQUIRED');
  authority.require(READINESS_EVIDENCE_REVIEW_PERMISSION);
  validateGapScope(gap,input);
  const assessmentId=nonBlank(input.assessmentId,'READINESS_EVIDENCE_REVIEW_ASSESSMENT_REQUIRED');
  const evidenceRef=nonBlank(input.evidenceRef,'READINESS_EVIDENCE_REVIEW_REF_REQUIRED');
  const decisionId=uuid(input.decisionId,'READINESS_EVIDENCE_REVIEW_DECISION_ID_INVALID');
  if(!ACTIONS.includes(input.action))throw new Error('READINESS_EVIDENCE_REVIEW_ACTION_INVALID');
  const rationale=nonBlank(input.rationale,'READINESS_EVIDENCE_REVIEW_RATIONALE_REQUIRED');
  const reviewedAt=iso(input.reviewedAt,'READINESS_EVIDENCE_REVIEW_TIME_INVALID');

  return inTenantTransaction(executor,input.tenantId,async tx=>{
    const replay=await tx.query<ReviewRow>(`/* readiness-evidence-review:find-decision */
      SELECT decision_id AS "decisionId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gap_id AS "gapId",
             receipt_id AS "receiptId",evidence_ref AS "evidenceRef",receipt_digest_sha256 AS "receiptDigestSha256",sequence,action,reviewer_ref AS "reviewerRef",rationale,
             reviewed_at AS "reviewedAt",previous_decision_digest_sha256 AS "previousDecisionDigestSha256",decision_digest_sha256 AS "decisionDigestSha256"
      FROM agroway_invest.readiness_evidence_review
      WHERE tenant_id=$1 AND decision_id=$2 LIMIT 2`,[input.tenantId,decisionId]);
    if(replay.rowCount>1)throw new Error('READINESS_EVIDENCE_REVIEW_DECISION_NON_UNIQUE');
    if(replay.rowCount===1){
      const existing=Object.freeze({...replay.rows[0]});
      if(existing.projectId!==input.projectId||existing.assessmentId!==assessmentId||existing.assessmentVersion!==input.assessmentVersion||existing.gapId!==input.gapId||existing.evidenceRef!==evidenceRef||existing.action!==input.action||existing.reviewerRef!==reviewerRef||existing.rationale!==rationale||existing.reviewedAt!==reviewedAt)throw new Error('READINESS_EVIDENCE_REVIEW_IDEMPOTENCY_PAYLOAD_DRIFT');
      return existing;
    }

    const receipts=await tx.query<ReceiptRow>(`/* readiness-evidence-review:load-receipt */
      SELECT receipt_id AS "receiptId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gap_id AS "gapId",
             evidence_ref AS "evidenceRef",object_ref AS "objectRef",digest_sha256 AS "digestSha256",content_type AS "contentType",byte_length AS "byteLength",evidence_role AS "evidenceRole",
             submitted_by_actor_ref AS "submittedByActorRef",submitted_at AS "submittedAt",idempotency_key AS "idempotencyKey",correlation_id AS "correlationId",validation_state AS state
      FROM agroway_invest.readiness_evidence_receipt
      WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4 AND gap_id=$5 AND evidence_ref=$6
      LIMIT 2`,[input.tenantId,input.projectId,assessmentId,input.assessmentVersion,input.gapId,evidenceRef]);
    rowCount(receipts,1,'READINESS_EVIDENCE_REVIEW_RECEIPT_ROWCOUNT');
    const receipt=receipts.rows[0];
    if(receipt.state!=='VALIDATED')throw new Error('READINESS_EVIDENCE_REVIEW_RECEIPT_NOT_VALIDATED');
    if(receipt.submittedByActorRef===reviewerRef)throw new Error('READINESS_EVIDENCE_REVIEW_SEPARATION_OF_DUTIES_REQUIRED');
    if(Date.parse(receipt.submittedAt)>Date.parse(reviewedAt))throw new Error('READINESS_EVIDENCE_REVIEW_BEFORE_RECEIPT_SUBMISSION');

    const latestGap=await tx.query<GapTransitionRow>(`/* readiness-evidence-review:latest-gap-transition */
      SELECT sequence,to_state AS "toState",occurred_at AS "occurredAt"
      FROM agroway_invest.readiness_gap_transition
      WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4 AND gap_id=$5
      ORDER BY sequence DESC LIMIT 1`,[input.tenantId,input.projectId,assessmentId,input.assessmentVersion,input.gapId]);
    rowCount(latestGap,1,'READINESS_EVIDENCE_REVIEW_LATEST_GAP_ROWCOUNT');
    if(latestGap.rows[0].toState!=='EVIDENCE_SUBMITTED')throw new Error('READINESS_EVIDENCE_REVIEW_PERSISTED_GAP_NOT_SUBMITTED');
    if(Date.parse(latestGap.rows[0].occurredAt)>Date.parse(reviewedAt))throw new Error('READINESS_EVIDENCE_REVIEW_TIME_BEFORE_GAP_SUBMISSION');

    const submitted=await tx.query(`/* readiness-evidence-review:submission-proof */
      SELECT 1
      FROM agroway_invest.readiness_gap_transition
      WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4 AND gap_id=$5
        AND to_state='EVIDENCE_SUBMITTED' AND actor_ref=$6 AND occurred_at <= $7 AND $8 = ANY(submitted_evidence_refs)
      ORDER BY sequence DESC LIMIT 1`,[input.tenantId,input.projectId,assessmentId,input.assessmentVersion,input.gapId,receipt.submittedByActorRef,reviewedAt,evidenceRef]);
    rowCount(submitted,1,'READINESS_EVIDENCE_REVIEW_SUBMISSION_PROOF_ROWCOUNT');

    const prior=await tx.query<ReviewRow>(`/* readiness-evidence-review:latest-review */
      SELECT decision_id AS "decisionId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gap_id AS "gapId",
             receipt_id AS "receiptId",evidence_ref AS "evidenceRef",receipt_digest_sha256 AS "receiptDigestSha256",sequence,action,reviewer_ref AS "reviewerRef",rationale,
             reviewed_at AS "reviewedAt",previous_decision_digest_sha256 AS "previousDecisionDigestSha256",decision_digest_sha256 AS "decisionDigestSha256"
      FROM agroway_invest.readiness_evidence_review
      WHERE tenant_id=$1 AND receipt_id=$2
      ORDER BY sequence DESC LIMIT 1`,[input.tenantId,receipt.receiptId]);
    const previous=prior.rowCount===1?prior.rows[0]:undefined;
    if(prior.rowCount>1)throw new Error('READINESS_EVIDENCE_REVIEW_PREDECESSOR_NON_UNIQUE');
    if(previous&&Date.parse(previous.reviewedAt)>Date.parse(reviewedAt))throw new Error('READINESS_EVIDENCE_REVIEW_TIME_REGRESSION');
    const sequence=previous?previous.sequence+1:0;
    const previousDecisionDigestSha256=previous?digest(previous.decisionDigestSha256,'READINESS_EVIDENCE_REVIEW_PREVIOUS_DIGEST_INVALID'):null;
    const receiptDigestSha256=digest(receipt.digestSha256,'READINESS_EVIDENCE_REVIEW_RECEIPT_DIGEST_INVALID');
    const decisionDigestSha256=sha256([
      decisionId,input.tenantId,input.projectId,assessmentId,input.assessmentVersion,input.gapId,receipt.receiptId,evidenceRef,receiptDigestSha256,sequence,input.action,reviewerRef,rationale,reviewedAt,previousDecisionDigestSha256,
    ]);
    const expected:ReadinessEvidenceReviewDecision=Object.freeze({
      decisionId,tenantId:input.tenantId,projectId:input.projectId,assessmentId,assessmentVersion:input.assessmentVersion,gapId:input.gapId,
      receiptId:receipt.receiptId,evidenceRef,receiptDigestSha256,sequence,action:input.action,reviewerRef,rationale,reviewedAt,previousDecisionDigestSha256,decisionDigestSha256,
    });
    const inserted=await tx.query<ReviewRow>(`/* readiness-evidence-review:insert-decision */
      INSERT INTO agroway_invest.readiness_evidence_review
        (decision_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,receipt_id,evidence_ref,receipt_digest_sha256,sequence,action,reviewer_ref,rationale,reviewed_at,previous_decision_digest_sha256,decision_digest_sha256)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING decision_id AS "decisionId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gap_id AS "gapId",
                receipt_id AS "receiptId",evidence_ref AS "evidenceRef",receipt_digest_sha256 AS "receiptDigestSha256",sequence,action,reviewer_ref AS "reviewerRef",rationale,
                reviewed_at AS "reviewedAt",previous_decision_digest_sha256 AS "previousDecisionDigestSha256",decision_digest_sha256 AS "decisionDigestSha256"`,[
      expected.decisionId,expected.tenantId,expected.projectId,expected.assessmentId,expected.assessmentVersion,expected.gapId,expected.receiptId,expected.evidenceRef,expected.receiptDigestSha256,
      expected.sequence,expected.action,expected.reviewerRef,expected.rationale,expected.reviewedAt,expected.previousDecisionDigestSha256,expected.decisionDigestSha256,
    ]);
    rowCount(inserted,1,'READINESS_EVIDENCE_REVIEW_INSERT_ROWCOUNT');
    const persisted=Object.freeze({...inserted.rows[0]});
    if(!sameDecision(persisted,expected))throw new Error('READINESS_EVIDENCE_REVIEW_INSERT_RETURNING_DRIFT');
    return persisted;
  });
}

/**
 * Application-level proof used before a resolution attempt. PostgreSQL repeats
 * this rule in migration 0030, so direct SQL cannot bypass human review.
 */
export async function assertResolutionEvidenceHumanAccepted(
  executor:CapitalReadinessSqlExecutor,
  input:Readonly<{tenantId:string;projectId:string;assessmentId:string;assessmentVersion:number;gapId:string;evidenceRefs:readonly string[];at:string}>,
):Promise<void>{
  if(input.evidenceRefs.length===0)throw new Error('READINESS_RESOLUTION_REVIEW_EVIDENCE_REQUIRED');
  if(new Set(input.evidenceRefs).size!==input.evidenceRefs.length)throw new Error('READINESS_RESOLUTION_REVIEW_EVIDENCE_DUPLICATE');
  const at=iso(input.at,'READINESS_RESOLUTION_REVIEW_TIME_INVALID');
  await inTenantTransaction(executor,input.tenantId,async tx=>{
    const result=await tx.query<{evidenceRef:string}>(`/* readiness-evidence-review:accepted-resolution-proof */
      SELECT r.evidence_ref AS "evidenceRef"
      FROM agroway_invest.readiness_evidence_receipt r
      JOIN LATERAL (
        SELECT d.action,d.reviewed_at
        FROM agroway_invest.readiness_evidence_review d
        WHERE d.tenant_id=r.tenant_id AND d.project_id=r.project_id AND d.assessment_id=r.assessment_id AND d.assessment_version=r.assessment_version
          AND d.gap_id=r.gap_id AND d.receipt_id=r.receipt_id AND d.reviewed_at <= $7
        ORDER BY d.sequence DESC LIMIT 1
      ) latest ON latest.action='ACCEPTED_FOR_GAP_REVIEW'
      WHERE r.tenant_id=$1 AND r.project_id=$2 AND r.assessment_id=$3 AND r.assessment_version=$4 AND r.gap_id=$5
        AND r.evidence_ref = ANY($6::text[])
      ORDER BY r.evidence_ref`,[input.tenantId,input.projectId,input.assessmentId,input.assessmentVersion,input.gapId,Object.freeze([...input.evidenceRefs]),at]);
    const found=result.rows.map(row=>row.evidenceRef).sort();
    const expected=[...input.evidenceRefs].sort();
    if(found.length!==expected.length||found.some((ref,index)=>ref!==expected[index]))throw new Error('READINESS_RESOLUTION_REQUIRES_LATEST_HUMAN_ACCEPTED_EVIDENCE');
  });
}

export const READINESS_EVIDENCE_REVIEW_BOUNDARY=Object.freeze({
  humanReviewRequired:true,
  submitterCanReviewOwnReceipt:false,
  cleanScanIsHumanAcceptance:false,
  reviewIsAppendOnly:true,
  reviewResolvesGap:false,
  acceptedReviewRequiredForResolution:true,
  browserMutationEnabled:false,
  aiReviewAuthority:false,
  financialAuthority:false,
} as const);
