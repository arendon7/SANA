import type {ISODateTime,UUID} from './model.js';

export type ReadinessEvidenceReceiptState='VALIDATED';

/**
 * Canonical metadata receipt for an evidence object that has already passed the
 * server-side storage/digest/metadata validation boundary. File bytes never
 * live in this contract or in PostgreSQL.
 */
export interface ReadinessEvidenceReceipt {
  receiptId:UUID;
  tenantId:UUID;
  projectId:UUID;
  assessmentId:string;
  assessmentVersion:number;
  gapId:string;
  evidenceRef:string;
  objectRef:string;
  digestSha256:string;
  contentType:string;
  byteLength:number;
  evidenceRole:string;
  submittedByActorRef:string;
  submittedAt:ISODateTime;
  idempotencyKey:string;
  correlationId:string;
  state:ReadinessEvidenceReceiptState;
}

export interface RegisterReadinessEvidenceReceiptInput {
  receipt:ReadinessEvidenceReceipt;
}

export interface ValidatedEvidenceObject {
  objectRef:string;
  digestSha256:string;
  contentType:string;
  byteLength:number;
}

export interface ReadinessEvidenceObjectWrite {
  tenantId:UUID;
  receiptId:UUID;
  contentType:string;
  content:AsyncIterable<Uint8Array>;
}

/** Provider-neutral storage port for UX2B-1B. No implementation/provider is selected in UX2B-1A. */
export interface ReadinessEvidenceObjectStorePort {
  putImmutable(input:ReadinessEvidenceObjectWrite):Promise<ValidatedEvidenceObject>;
  deleteIfUnreferenced(input:Readonly<{objectRef:string;digestSha256:string}>):Promise<void>;
}
