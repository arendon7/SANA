import type { CurrencyCode, EvidenceKind, ISODateTime, ProductionRef, ProjectState, RecoveryKind, RiskSeverity, RiskState, UUID } from './model.js';
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
