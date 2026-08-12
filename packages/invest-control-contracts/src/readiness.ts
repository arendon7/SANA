import type { EvidenceKind, InvestmentProject, InvestmentRisk, ISODateTime, ProjectState, ProductionRef, UUID } from './model.js';

export type ReadinessGateId=
  |'G1_ACTOR'
  |'G2_ASSET'
  |'G3_AGRONOMY'
  |'G4_BUDGET'
  |'G5_MARKET'
  |'G6_RISK'
  |'G7_TRACEABILITY'
  |'G8_IMPACT'
  |'G9_FINANCIAL_STRUCTURE';

export type ReadinessGateResult='PASS'|'PASS_WITH_CONDITIONS'|'INCOMPLETE'|'BLOCKED'|'NOT_APPLICABLE';
export type ReadinessDecision='NOT_CAPITAL_READY'|'CAPITAL_READY_WITH_CONDITIONS'|'CAPITAL_READY'|'REASSESSMENT_REQUIRED';
export type IntakeSourceType='PRODUCER_DIRECT'|'SANA_DIAGNOSTIC'|'OFFTAKER'|'FINANCIAL_PARTNER'|'COOPERATION_PROGRAM'|'PUBLIC_PROGRAM'|'INTERNAL_PIPELINE';
export type CapitalPilotIntakeState='CREATED'|'CANONICAL_REUSE_SCAN'|'DATA_COMPLETION'|'EVIDENCE_VALIDATION'|'ASSESSMENT_READY'|'UNDER_ASSESSMENT'|'GAP_REMEDIATION'|'HUMAN_REVIEW'|'CAPITAL_READY'|'READY_WITH_CONDITIONS'|'NOT_READY'|'REASSESSMENT_REQUIRED'|'PAUSED'|'WITHDRAWN';
export type ReadinessGapState='OPEN'|'IN_REMEDIATION'|'EVIDENCE_SUBMITTED'|'RESOLVED'|'WAIVED'|'SUPERSEDED';
export type ReadinessGapSeverity='INFO'|'WARNING'|'CRITICAL';
export type ReadinessEvidenceQuality='VERIFIED'|'SUPPORTED'|'ESTIMATED'|'UNVERIFIED';
export type ReadinessEvidenceFreshness='FRESH'|'STALE'|'FUTURE'|'INVALID';
export type ReadinessEvidenceSourceKind='USER_REPORTED'|'DOCUMENT'|'PHOTO'|'LAB_RESULT'|'SENSOR'|'AGROWAY_EVENT'|'TECHNICAL_OBSERVATION'|'CALCULATED'|'PARTNER_REFERENCE';
export type ProductiveRiskDimensionId='PRODUCER'|'OPERATION'|'AGRONOMY'|'DATA'|'FINANCIAL'|'MARKET'|'CLIMATE'|'TRACEABILITY'|'MANAGEMENT';
export type ProductiveRiskDimensionState='FAVORABLE'|'WATCH'|'LIMITING'|'CRITICAL'|'INDETERMINATE';
export type ProductiveRiskTrend='IMPROVING'|'STABLE'|'DETERIORATING'|'UNKNOWN';

export interface CapitalPilotIntake {
  intakeId:UUID;
  tenantId:UUID;
  projectId:UUID;
  intakeVersion:number;
  sourceType:IntakeSourceType;
  sourceRef:string;
  originatorRef?:string;
  consentSetRef?:string;
  dataPackVersion:string;
  state:CapitalPilotIntakeState;
  createdAt:ISODateTime;
  updatedAt:ISODateTime;
  supersedesIntakeId?:UUID;
}

export interface ReadinessEvidenceRef {
  evidenceRef:string;
  tenantId:UUID;
  projectId:UUID;
  sourceKind:ReadinessEvidenceSourceKind;
  projectEvidenceKind?:EvidenceKind;
  gateIds:readonly ReadinessGateId[];
  role:string;
  observedAt:ISODateTime;
  provenanceRef:string;
  digestSha256:string;
  quality:ReadinessEvidenceQuality;
  confidenceBps:number;
}

export interface ReadinessGatePolicy {
  gateId:ReadinessGateId;
  requiredEvidenceRoles:readonly string[];
  minimumAcceptedEvidence:number;
  minimumConfidenceBps:number;
  acceptedQualities:readonly ReadinessEvidenceQuality[];
  maxEvidenceAgeSeconds?:number;
  missingEvidenceIsBlocking:boolean;
  allowNotApplicable:boolean;
}

export interface ReadinessPolicy {
  policyVersion:string;
  methodologyVersion:string;
  gates:readonly ReadinessGatePolicy[];
  minimumTotalCoverageBps:number;
  requireAllNineGates:true;
}

export interface EvidenceGateDecision {
  gateId:ReadinessGateId;
  accepted:boolean;
  freshness:ReadinessEvidenceFreshness;
  rejectionReason?:string;
}

export interface EvidenceManifestItem {
  evidenceRef:string;
  role:string;
  gateDecisions:readonly EvidenceGateDecision[];
}

export interface GateEvidenceCoverage {
  gateId:ReadinessGateId;
  requiredRoleCount:number;
  satisfiedRoleCount:number;
  acceptedEvidenceCount:number;
  coverageBps:number;
}

export interface EvidenceManifest {
  manifestId:string;
  tenantId:UUID;
  projectId:UUID;
  policyVersion:string;
  asOf:ISODateTime;
  items:readonly EvidenceManifestItem[];
  acceptedEvidenceRefs:readonly string[];
  rejectedEvidenceRefs:readonly string[];
  coverageByGate:readonly GateEvidenceCoverage[];
  totalCoverageBps:number;
  limitations:readonly string[];
  digestSha256:string;
}

export interface ReadinessGateSignal {
  gateId:ReadinessGateId;
  applicable?:boolean;
  blockerCodes?:readonly string[];
  conditionCodes?:readonly string[];
  rationale?:string;
}

export interface ReadinessGap {
  gapId:string;
  tenantId:UUID;
  projectId:UUID;
  assessmentVersion:number;
  gateId:ReadinessGateId;
  code:string;
  severity:ReadinessGapSeverity;
  blocking:boolean;
  state:ReadinessGapState;
  description:string;
  sourceRef:string;
  ownerRef?:string;
  dueAt?:ISODateTime;
  requiredEvidenceRoles:readonly string[];
  resolutionEvidenceRefs:readonly string[];
  openedAt:ISODateTime;
  resolvedAt?:ISODateTime;
  resolvedBy?:string;
  resolutionNote?:string;
}

export interface ReadinessGateAssessment {
  gateId:ReadinessGateId;
  result:ReadinessGateResult;
  rationale:string;
  evidenceRefs:readonly string[];
  confidenceBps:number;
  blockingGapRefs:readonly string[];
  conditionGapRefs:readonly string[];
  assessedAt:ISODateTime;
  assessedBy:string;
  methodVersion:string;
}

export interface GateEvaluationResult {
  assessments:readonly ReadinessGateAssessment[];
  gaps:readonly ReadinessGap[];
}

export interface ReadinessAssessment {
  assessmentId:string;
  tenantId:UUID;
  projectId:UUID;
  version:number;
  intakeId:UUID;
  intakeVersion:number;
  policyVersion:string;
  methodologyVersion:string;
  projectSnapshotRef:string;
  approvedBudgetVersion?:number;
  evidenceManifestDigestSha256:string;
  riskProfileDigestSha256:string;
  gates:readonly ReadinessGateAssessment[];
  blockingGapRefs:readonly string[];
  conditionGapRefs:readonly string[];
  evidenceCoverageBps:number;
  decision:ReadinessDecision;
  deterministicMaximumDecision:Exclude<ReadinessDecision,'REASSESSMENT_REQUIRED'>;
  rationale:string;
  reviewerRef:string;
  reviewedAt:ISODateTime;
  digestSha256:string;
}

export interface ProductiveRiskDimensionInput {
  dimension:ProductiveRiskDimensionId;
  riskRefs:readonly UUID[];
  evidenceRefs:readonly string[];
  principalDrivers:readonly string[];
  mitigations:readonly string[];
  confidenceBps:number;
  trend?:ProductiveRiskTrend;
}

export interface ProductiveRiskDimension {
  dimension:ProductiveRiskDimensionId;
  state:ProductiveRiskDimensionState;
  trend:ProductiveRiskTrend;
  evidenceRefs:readonly string[];
  confidenceBps:number;
  principalDrivers:readonly string[];
  mitigations:readonly string[];
  unresolvedRiskRefs:readonly UUID[];
}

export interface ProductiveRiskProfile {
  profileId:string;
  tenantId:UUID;
  projectId:UUID;
  asOf:ISODateTime;
  dimensions:readonly ProductiveRiskDimension[];
  openCriticalRiskRefs:readonly UUID[];
  limitations:readonly string[];
  digestSha256:string;
}

export interface BuildProductiveRiskProfileInput {
  project:InvestmentProject;
  risks:readonly InvestmentRisk[];
  dimensions:readonly ProductiveRiskDimensionInput[];
  asOf:ISODateTime;
}

export interface CapitalReadinessPackage {
  packageId:string;
  tenantId:UUID;
  projectId:UUID;
  assessmentId:string;
  assessmentVersion:number;
  generatedAt:ISODateTime;
  decision:ReadinessDecision;
  projectState:ProjectState;
  projectEligibility:InvestmentProject['eligibility'];
  productionRef:ProductionRef;
  currency:string;
  requiredMinor:number;
  approvedBudgetVersion?:number;
  evidenceManifestDigestSha256:string;
  riskProfileDigestSha256:string;
  gateAssessments:readonly ReadinessGateAssessment[];
  openConditionGapRefs:readonly string[];
  limitations:readonly string[];
  provenanceRefs:readonly string[];
  financialAuthority:'READINESS_ONLY_NO_FINANCING_APPROVAL';
  digestSha256:string;
}

export interface BuildReadinessAssessmentInput {
  project:InvestmentProject;
  intake:CapitalPilotIntake;
  policy:ReadinessPolicy;
  manifest:EvidenceManifest;
  riskProfile:ProductiveRiskProfile;
  gateEvaluation:GateEvaluationResult;
  assessmentId:string;
  assessmentVersion:number;
  projectSnapshotRef:string;
  requestedDecision:ReadinessDecision;
  rationale:string;
  reviewerRef:string;
  reviewedAt:ISODateTime;
}

export interface BuildCapitalReadinessPackageInput {
  project:InvestmentProject;
  assessment:ReadinessAssessment;
  manifest:EvidenceManifest;
  riskProfile:ProductiveRiskProfile;
  gaps:readonly ReadinessGap[];
  generatedAt:ISODateTime;
  provenanceRefs:readonly string[];
}
