export type FieldTaskState='PLANNED'|'IN_PROGRESS'|'DONE'|'CANCELLED';
export type FieldTask=Readonly<{tenantId:string;taskId:string;cropCycleId:string;plotId:string;operatorId?:string;kind:string;scheduledAt:string;state:FieldTaskState}>;
export type FieldExecution=Readonly<{tenantId:string;executionId:string;taskId:string;startedAt:string;completedAt?:string;notes?:string;evidenceRefs:readonly string[]}>;
