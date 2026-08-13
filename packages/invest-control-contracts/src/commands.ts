import type { CurrencyCode, EvidenceKind, ISODateTime, ProductionRef, ProjectState, RecoveryKind, RiskSeverity, RiskState, UUID } from './model.js';
import type { CapitalPilotIntakeState, IntakeSourceType, ReadinessDecision, ReadinessGapState } from './readiness.js';

export interface RegisterInvestmentProject { projectId:UUID; tenantId:UUID; code:string; name:string; productionRef:ProductionRef; currency:CurrencyCode; at:ISODateTime; }
export interface DeclareCapitalRequirement { projectId:UUID; tenantId:UUID; amountMinor:number; currency:CurrencyCode; at:ISODateTime; }
export interface RecordCapitalCommitment { commitmentId:UUID; projectId:UUID; tenantId:UUID; amountMinor:number; currency:CurrencyCode; sourceRef:string; at:ISODateTime; }
export interface CancelCapitalCommitment { commitmentId:UUID; projectId:UUID; tenantId:UUID; amountMinor:number; at:ISODateTime; }
export interface RecordCapitalDeployment { deploymentId:UUID; commitmentId:UUID; projectId:UUID; tenantId:UUID; amountMinor:number; currency:CurrencyCode; purposeCode:string; evidenceRef:string; at:ISODateTime; }
export interface RecordCapitalRecovery { recoveryId:UUID; projectId:UUID; tenantId:UUID; amountMinor:number; currency:CurrencyCode; kind:RecoveryKind; evidenceRef:string; at:ISODateTime; }
export interface ChangeInvestmentProjectState { projectId:UUID; tenantId:UUID; target:ProjectState; at:ISODateTime; reason:string; actorRef:string; }
export interface CreateBudgetVersion { projectId:UUID; tenantId:UUID; version:number; currency:CurrencyCode; lines:readonly {lineId:UUID;categoryCode:string;description:string;amountMinor:number}[]; at:ISODateTime; }
export interface ApproveBudgetVersion { projectId:UUID; tenantId:UUID; version:number; at:ISODateTime; approverRef:string; }
export interface RegisterInvestmentRisk { riskId:UUID; projectId:UUID; tenantId:UUID; code:string; title:string; severity:RiskSeverity; at:ISODateTime; }
export interface ChangeInvestmentRiskState { riskId:UUID; projectId:UUID; tenantId:UUID; target:RiskState; mitigation?:string; ownerRef?:string; at:ISODateTime; }
export interface LinkInvestmentEvidence { linkId:UUID; projectId:UUID; tenantId:UUID; kind:EvidenceKind; evidenceRef:string; at:ISODateTime; }
export interface LinkInvestmentImpactSnapshot { linkId:UUID; projectId:UUID; tenantId:UUID; impactSnapshotRef:string; at:ISODateTime; }

// CAPITAL_READINESS application commands. Actor identity is derived from the
// authenticated membership by the authority service and is intentionally not
// accepted as caller-controlled command data.
export interface StartCapitalReadinessIntake {
  intakeId:UUID;
  tenantId:UUID;
  projectId:UUID;
  intakeVersion:number;
  sourceType:IntakeSourceType;
  sourceRef:string;
  consentSetRef?:string;
  dataPackVersion:string;
  createdAt:ISODateTime;
  supersedesIntakeId?:UUID;
  initialTransitionId:string;
  reason?:string;
}

export interface AdvanceCapitalReadinessIntake {
  tenantId:UUID;
  projectId:UUID;
  intakeId:UUID;
  intakeVersion:number;
  target:Exclude<CapitalPilotIntakeState,'HUMAN_REVIEW'|'CAPITAL_READY'|'READY_WITH_CONDITIONS'|'NOT_READY'|'REASSESSMENT_REQUIRED'|'WITHDRAWN'>;
  transitionId:string;
  at:ISODateTime;
  reason?:string;
}

export interface SubmitCapitalReadinessForHumanReview {
  tenantId:UUID;
  projectId:UUID;
  intakeId:UUID;
  intakeVersion:number;
  transitionId:string;
  at:ISODateTime;
  reason:string;
}

export interface PauseCapitalReadinessIntake {
  tenantId:UUID;
  projectId:UUID;
  intakeId:UUID;
  intakeVersion:number;
  transitionId:string;
  at:ISODateTime;
  reason:string;
}

export interface ResumeCapitalReadinessIntake {
  tenantId:UUID;
  projectId:UUID;
  intakeId:UUID;
  intakeVersion:number;
  transitionId:string;
  at:ISODateTime;
  reason:string;
}

export interface WithdrawCapitalReadinessIntake {
  tenantId:UUID;
  projectId:UUID;
  intakeId:UUID;
  intakeVersion:number;
  transitionId:string;
  at:ISODateTime;
  reason:string;
}

export interface RequestCapitalReadinessReassessment {
  tenantId:UUID;
  projectId:UUID;
  intakeId:UUID;
  intakeVersion:number;
  transitionId:string;
  at:ISODateTime;
  reason:string;
}

export interface FinalizeCapitalReadinessDecision {
  tenantId:UUID;
  projectId:UUID;
  tenantId:UUID;
  intakeId:UUID;
  intakeVersion:number;
  assessmentId:string;
  assessmentVersion:number;
  decision:ReadinessDecision;
  transitionId:string;
  reason:string;
}

/** Generic remediation may only put a gap into active remediation. Evidence submission is specialized below. */
export interface AdvanceReadinessGapRemediation {
  tenantId:UUID;
  projectId:UUID;
  assessmentId:string;
  assessmentVersion:number;
  gapId:string;
  fromState:Extract<ReadinessGapState,'OPEN'|'EVIDENCE_SUBMITTED'>;
  target:'IN_REMEDIATION';
  transitionId:string;
  at:ISODateTime;
  note?:string;
}

/**
 * Submits already validated canonical evidence receipts against one gap. This
 * command does not resolve or waive the gap.
 */
export interface SubmitReadinessGapEvidence {
  tenantId:UUID;
  projectId:UUID;
  assessmentId:string;
  assessmentVersion:number;
  gapId:string;
  fromState:Extract<ReadinessGapState,'OPEN'|'IN_REMEDIATION'>;
  evidenceRefs:readonly string[];
  transitionId:string;
  at:ISODateTime;
  note?:string;
}

export interface ResolveReadinessGap {
  tenantId:UUID;
  projectId:UUID;
  assessmentId:string;
  assessmentVersion:number;
  gapId:string;
  fromState:Exclude<ReadinessGapState,'RESOLVED'|'WAIVED'|'SUPERSEDED'>;
  transitionId:string;
  at:ISODateTime;
  resolutionEvidenceRefs:readonly string[];
  note:string;
}

export interface WaiveReadinessGap {
  tenantId:UUID;
  projectId:UUID;
  assessmentId:string;
  assessmentVersion:number;
  gapId:string;
  fromState:Exclude<ReadinessGapState,'RESOLVED'|'WAIVED'|'SUPERSEDED'>;
  transitionId:string;
  at:ISODateTime;
  note:string;
}
