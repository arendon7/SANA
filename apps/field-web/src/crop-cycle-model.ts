export type CropCycleTrust = 'DEMO_RECONSTRUCTED' | 'CANONICAL_RUNTIME';
export type CropCycleStage = 'ESTABLISHMENT' | 'VEGETATIVE' | 'PREPRODUCTION' | 'PRODUCTION';
export type CropCycleTab = 'summary' | 'plan' | 'monitoring' | 'history';
export type CropCyclePlanState = 'PENDING' | 'IN_WINDOW' | 'SCHEDULED' | 'RECORDED_LOCAL';
export type CropCycleSignalState = 'WITHIN_RANGE' | 'OUT_OF_RANGE' | 'PENDING_OBSERVATION';

export interface CropCycleIdentity { tenantId: string; farmId: string; farmName: string; plotId: string; plotName: string; cropCycleId: string; cropCycleLabel: string; crop: string; stage: CropCycleStage; startedAt: string; areaHectares: number; plantCount: number; }
export interface CropCyclePlanItem { id: string; domain: 'WATER' | 'NUTRITION' | 'PLANT_HEALTH'; title: string; state: CropCyclePlanState; evidenceRequired: true; authority: 'DETERMINISTIC_AGRONOMY'; }
export interface CropCycleSignal { id: string; label: string; value: string; target?: string; state: CropCycleSignalState; source: string; normalized: true; rawProviderPayloadVisible: false; freshnessMinutes?: number; }
export interface CropCycleDecision { id: string; title: string; source: 'DETERMINISTIC_RULE'; state: 'OPEN' | 'RESOLVED'; requiresHumanAction: true; }
export interface CropCycleViewModel { trust: CropCycleTrust; identity: CropCycleIdentity; plan: CropCyclePlanItem[]; signals: CropCycleSignal[]; decisions: CropCycleDecision[]; copilotState: 'DRAFT_SUGGESTION'; deterministicRulesAuthoritative: true; requiresHumanApproval: true; }

export const FIELD_CROP_CYCLE_ROUTE = '/field/lots/:plotId/cycles/:cropCycleId';
