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
  expectedDigestSha256:string;
  expectedByteLength:number;
  content:AsyncIterable<Uint8Array>;
}

/**
 * Provider-neutral immutable storage port. `putImmutable` must be idempotent for
 * the same tenant+receiptId+expected digest and must reject content drift rather
 * than replacing an existing object. Provider credentials/configuration never
 * enter the domain contract.
 */
export interface ReadinessEvidenceObjectStorePort {
  putImmutable(input:ReadinessEvidenceObjectWrite):Promise<ValidatedEvidenceObject>;
  deleteIfUnreferenced(input:Readonly<{objectRef:string;digestSha256:string}>):Promise<void>;
}

export type ReadinessEvidenceScanState='CLEAN'|'REJECTED'|'UNKNOWN';
export interface ReadinessEvidenceScanResult {
  state:ReadinessEvidenceScanState;
  scannerRef:string;
}
export interface ReadinessEvidenceContentScannerPort {
  scan(input:Readonly<{
    receiptId:UUID;
    contentType:string;
    digestSha256:string;
    byteLength:number;
    content:Uint8Array;
  }>):Promise<ReadinessEvidenceScanResult>;
}
