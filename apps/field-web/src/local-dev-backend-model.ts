export type LocalDevBackendTrust='LOCAL_DEV_BACKEND_NOT_PRODUCTION';
export type SyncServerAssessment='READY_FOR_SERVER_SUBMISSION'|'SERVER_REVALIDATION_REQUIRED'|'CANONICAL_VERSION_CHANGED'|'INVALID_ENVELOPE'|'TENANT_SCOPE_MISMATCH';
export interface LocalDevBackendStatus {ok:true;trust:LocalDevBackendTrust;tenantId:string;canonicalVersion:string;persisted:{invitations:number;exports:number;syncReceipts:number;syncAcks:number};}
export interface ServerSyncReceipt {receiptId:string;tenantId:string;envelopeId:string|null;idempotencyKey:string;eventTime:string|null;receivedAt:string;assessment:SyncServerAssessment|string;payloadSha256:string;trust:LocalDevBackendTrust;}
export interface ServerSyncAck {ackId:string;tenantId:string;envelopeId:string;idempotencyKey:string;eventTime:string;receivedAt:string;state:'ACCEPTED';canonicalVersion:string;payloadSha256:string;ackSha256:string;trust:LocalDevBackendTrust;}
export interface DevInvitationReceipt {tenantId:string;invitationId:string;email:string;role:string;grantedPermissions:readonly string[];state:'PENDING';deliveryState:'NOT_SENT_DEV';createdAt:string;expiresAt:string;serverReceivedAt:string;trust:LocalDevBackendTrust;}
export interface DevExportArtifact {tenantId:string;exportRequestId:string;scope:'FULL_TENANT_DATA';format:'JSON'|'CSV';state:'READY';requestedAt:string;completedAt:string;objectRef:string;digestSha256:string;byteLength:number;trust:LocalDevBackendTrust;}
export const FIELD_LOCAL_DEV_BACKEND_ROUTE='/api/dev';
