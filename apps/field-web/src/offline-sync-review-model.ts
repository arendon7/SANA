export type SyncAssessment='READY_FOR_SERVER_SUBMISSION'|'SERVER_REVALIDATION_REQUIRED'|'CANONICAL_VERSION_CHANGED'|'DUPLICATE_ACK_MATCH';
export type SyncReviewAction='PREPARE_SUBMISSION'|'REQUEST_REBASE_REVIEW'|'INSPECT_ACK';
export interface LocalSyncReviewAction {id:string;envelopeId:string;action:SyncReviewAction;assessment:SyncAssessment;idempotencyKey:string;localOnly:true;canonicalMutated:false;envelopeRemoved:false;}
export const FIELD_SYNC_REVIEW_ROUTE='/field/sync-review';
