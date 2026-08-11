export type PassportAssemblyEligibility = 'MISSING_EVIDENCE' | 'ASSEMBLY_READY' | 'ELIGIBLE_FOR_HUMAN_CERTIFICATION';
export type PassportSectionStatus = 'MISSING' | 'LOCAL_PENDING' | 'COMPLETE_CANONICAL';
export interface PassportAssemblyContext { tenantId: string; farmId: string; plotId: string; cropCycleId: string; }
export interface PassportSectionEvidence { sectionId: 'identity_cycle'|'agronomy_plan'|'field_execution'|'input_trace'|'monitoring_decision'|'harvest_output'; status: PassportSectionStatus; source: string; }
export interface PassportAssemblyPreview { context: PassportAssemblyContext; eligibility: PassportAssemblyEligibility; assemblyDigestSha256?: string; sections: PassportSectionEvidence[]; certificateIssued: false; aiCanSign: false; humanSignerRequired: true; certificationDecisionDigestSource: 'SERVER_ONLY'; }
export const FIELD_TRACEABILITY_PASSPORT_ROUTE = '/field/traceability/passport/:cropCycleId';
