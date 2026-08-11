export type TaskEvidenceTrust = 'DEMO_RECONSTRUCTED' | 'CANONICAL_RUNTIME';
export type EvidenceBlobStorage = 'INDEXED_DB' | 'MEMORY_FALLBACK_QA_ONLY' | 'METADATA_ONLY';
export interface TaskExecutionContext { tenantId: string; farmId: string; plotId: string; cropCycleId: string; taskId: string; planAction?: string; }
export interface TaskEvidenceMetadata { id: string; context: TaskExecutionContext; capturedAt: string; measurementValue: string; measurementUnit: string; notes: string; fileName?: string; mimeType?: string; size?: number; sha256?: string; storageMode: EvidenceBlobStorage; }
export interface LocalTaskEvidenceOutboxEnvelope { kind: 'LOCAL_TASK_EVIDENCE_CAPTURED'; localOnly: true; evidenceId: string; evidenceSha256?: string; context: TaskExecutionContext; createdAt: string; }
export const FIELD_TASK_EXECUTION_ROUTE = '/field/tasks/:taskId/execute';
