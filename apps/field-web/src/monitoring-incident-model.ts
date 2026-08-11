export type MonitoringIncidentCanonicalState = 'OPEN' | 'RESOLVED';
export type LocalIncidentDecision = 'KEEP_OPEN' | 'RESOLVE_PENDING_CANONICAL_SYNC';
export interface NormalizedMonitoringFact { factId: string; metric: string; value: number; unit: string; eventTime: string; receivedTime: string; freshnessMinutes: number; sourceId: string; normalized: true; rawProviderPayloadVisible: false; }
export interface DeterministicAlertRule { ruleId: string; metric: string; targetMin: number; targetMax: number; authority: 'DETERMINISTIC_AGRONOMY'; }
export interface MonitoringIncidentContext { tenantId: string; farmId: string; plotId: string; cropCycleId: string; incidentId: string; factId: string; ruleId: string; }
export interface LocalIncidentDecisionEnvelope { kind: 'LOCAL_MONITORING_INCIDENT_DECISION_RECORDED'; localOnly: true; canonicalIncidentMutated: false; decision: LocalIncidentDecision; verificationValue: number; verificationUnit: string; operatorId: string; context: MonitoringIncidentContext; createdAt: string; }
export const FIELD_MONITORING_INCIDENT_ROUTE = '/field/monitoring/incidents/:incidentId';
