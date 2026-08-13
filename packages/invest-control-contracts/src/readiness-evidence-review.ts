import type {ISODateTime,UUID} from './model.js';

export type ReadinessEvidenceReviewAction=
  |'ACCEPTED_FOR_GAP_REVIEW'
  |'REJECTED'
  |'REFRESH_REQUIRED';

/**
 * Canonical append-only human decision about one validated readiness-evidence
 * receipt. A review decision says whether the evidence is adequate for the
 * referenced readiness gap; it does not resolve that gap by itself.
 */
export interface ReadinessEvidenceReviewDecision {
  decisionId:UUID;
  tenantId:UUID;
  projectId:UUID;
  assessmentId:string;
  assessmentVersion:number;
  gapId:string;
  receiptId:UUID;
  evidenceRef:string;
  receiptDigestSha256:string;
  sequence:number;
  action:ReadinessEvidenceReviewAction;
  reviewerRef:string;
  rationale:string;
  reviewedAt:ISODateTime;
  previousDecisionDigestSha256:string|null;
  decisionDigestSha256:string;
}

export interface ReviewReadinessEvidenceInput {
  tenantId:UUID;
  projectId:UUID;
  assessmentId:string;
  assessmentVersion:number;
  gapId:string;
  evidenceRef:string;
  decisionId:UUID;
  action:ReadinessEvidenceReviewAction;
  rationale:string;
  reviewedAt:ISODateTime;
}

export const READINESS_EVIDENCE_REVIEW_INVARIANTS=Object.freeze({
  humanOnly:true,
  submitterCannotReviewOwnReceipt:true,
  receiptImmutable:true,
  reviewAppendOnly:true,
  reviewDoesNotResolveGap:true,
  acceptedReviewRequiredForResolution:true,
  aiReviewAuthority:false,
  financialAuthority:false,
} as const);
