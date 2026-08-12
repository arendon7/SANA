export type FieldHomeTrust = 'DEMO_RECONSTRUCTED' | 'CANONICAL_RUNTIME';
export type FieldHomeTaskState = 'PENDING' | 'DONE';
export interface FieldHomeContext { farmId: string; farmName: string; plotId: string; plotName: string; cropCycleId: string; cropCycleLabel: string; }
export interface FieldHomeTask { id: string; title: string; state: FieldHomeTaskState; scheduledAt: string; evidenceRequired: boolean; }
export interface FieldHomeAlert { id: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; source: 'DETERMINISTIC_RULE'; title: string; freshnessMinutes: number; }
export interface FieldHomeViewModel { trust: FieldHomeTrust; context: FieldHomeContext; tasks: FieldHomeTask[]; alerts: FieldHomeAlert[]; copilotState: 'DRAFT_SUGGESTION'; requiresHumanApproval: true; }
export const FIELD_HOME_ROUTE = '/field';
