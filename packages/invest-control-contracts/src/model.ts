export type UUID=string; export type ISODateTime=string; export type CurrencyCode=string;
export type ProjectState='DRAFT'|'UNDER_REVIEW'|'APPROVED'|'ACTIVE'|'PAUSED'|'COMPLETED'|'CANCELLED';
export type EligibilityState='NOT_EVALUATED'|'ELIGIBLE'|'INELIGIBLE'; export type RiskSeverity='LOW'|'MEDIUM'|'HIGH'|'CRITICAL'; export type RiskState='OPEN'|'MITIGATED'|'ACCEPTED'|'CLOSED'; export type EvidenceKind='AGRONOMIC'|'FINANCIAL'|'MARKET'|'LEGAL'|'FIELD'|'IMPACT'; export type ExceptionSeverity='INFO'|'WARNING'|'CRITICAL'; export type ExceptionState='OPEN'|'ACKNOWLEDGED'|'RESOLVED'|'SUPPRESSED';
export interface ProductionRef { producerId:UUID; farmId:UUID; plotIds:readonly UUID[]; cropCycleIds:readonly UUID[]; }
export interface Money { currency:CurrencyCode; amountMinor:number; }
export interface InvestmentProject { projectId:UUID; tenantId:UUID; code:string; name:string; state:ProjectState; eligibility:EligibilityState; productionRef:ProductionRef; currency:CurrencyCode; requiredMinor:number; committedMinor:number; deployedMinor:number; recoveredMinor:number; approvedBudgetVersion?:number; createdAt:ISODateTime; updatedAt:ISODateTime; }
export interface CapitalCommitment { commitmentId:UUID; tenantId:UUID; projectId:UUID; amountMinor:number; currency:CurrencyCode; sourceRef:string; committedAt:ISODateTime; cancelledMinor:number; }
export interface CapitalDeployment { deploymentId:UUID; tenantId:UUID; projectId:UUID; commitmentId:UUID; amountMinor:number; currency:CurrencyCode; purposeCode:string; evidenceRef:string; deployedAt:ISODateTime; }
export type RecoveryKind='PRINCIPAL'|'RETURN'|'OTHER';
export interface CapitalRecovery { recoveryId:UUID; tenantId:UUID; projectId:UUID; amountMinor:number; currency:CurrencyCode; kind:RecoveryKind; evidenceRef:string; receivedAt:ISODateTime; }
export interface BudgetLine { lineId:UUID; categoryCode:string; description:string; amountMinor:number; }
export interface InvestmentBudgetVersion { projectId:UUID; tenantId:UUID; version:number; currency:CurrencyCode; lines:readonly BudgetLine[]; totalMinor:number; state:'DRAFT'|'APPROVED'|'SUPERSEDED'; createdAt:ISODateTime; approvedAt?:ISODateTime; }
export interface InvestmentRisk { riskId:UUID; tenantId:UUID; projectId:UUID; code:string; title:string; severity:RiskSeverity; state:RiskState; mitigation?:string; ownerRef?:string; openedAt:ISODateTime; updatedAt:ISODateTime; }
export interface ProjectEvidenceLink { linkId:UUID; tenantId:UUID; projectId:UUID; kind:EvidenceKind; evidenceRef:string; linkedAt:ISODateTime; }
export interface InvestmentImpactSnapshotLink { linkId:UUID; tenantId:UUID; projectId:UUID; impactSnapshotRef:string; linkedAt:ISODateTime; }
export interface EligibilityResult { projectId:UUID; tenantId:UUID; state:Exclude<EligibilityState,'NOT_EVALUATED'>; reasons:readonly string[]; evaluatedAt:ISODateTime; }
export interface EligibilityInput { project:InvestmentProject; hasApprovedBudget:boolean; openRisks:readonly InvestmentRisk[]; evidenceKinds:readonly EvidenceKind[]; requiredEvidenceKinds:readonly EvidenceKind[]; }
export interface PortfolioProjectSummary { projectId:UUID; state:ProjectState; currency:CurrencyCode; requiredMinor:number; committedMinor:number; deployedMinor:number; recoveredMinor:number; openCriticalRisks:number; }
export interface CapitalTotals { currency:CurrencyCode; requiredMinor:number; committedMinor:number; deployedMinor:number; recoveredMinor:number; capitalCoverageBps:number; deploymentBps:number; recoveryMultipleBps:number; }
export interface NetworkSnapshot { producerCount:number; farmCount:number; activeAreaHa:number; activeCropCycleCount:number; }
export interface AgronomySnapshot { healthyCycles:number; watchCycles:number; criticalCycles:number; openAlerts:number; criticalAlerts:number; }
export interface OperationsSnapshot { plannedActivities:number; completedActivities:number; dueActivities:number; overdueActivities:number; }
export interface SupplySnapshot { openOrders:number; fillRateBps:number; inventoryCoverageDays:number; walletShareBps?:number; }
export interface DemandWindow { productId:UUID; unit:string; days:30|60|90; plannedQuantity:number; committedQuantity:number; gapQuantity:number; }
export interface ImpactMetric { metricKey:string; value:number; unit:string; sourceSnapshotRef:string; }
export interface ProjectionWatermark { source:string; offset:string; asOf:ISODateTime; }
export interface ControlTowerException { exceptionId:string; tenantId:UUID; code:string; severity:ExceptionSeverity; state:ExceptionState; subjectRef:string; reason:string; fingerprint:string; openedAt:ISODateTime; updatedAt:ISODateTime; }
export interface ControlTowerSnapshot { snapshotId:string; tenantId:UUID; asOf:ISODateTime; network:NetworkSnapshot; capital:readonly CapitalTotals[]; agronomy:AgronomySnapshot; operations:OperationsSnapshot; supply:SupplySnapshot; demand:readonly DemandWindow[]; impact:readonly ImpactMetric[]; exceptions:readonly ControlTowerException[]; watermarks:readonly ProjectionWatermark[]; }
export interface TowerThresholds { maxOverdueActivities:number; minInventoryCoverageDays:number; raiseAgronomyCriticalWhenCriticalAlertsAtLeast:number; }
