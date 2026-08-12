export type ControlTowerTrust='DEMO_RECONSTRUCTED'|'CANONICAL_RUNTIME';
export type ControlExceptionSeverity='INFO'|'WARNING'|'CRITICAL';
export interface ControlNetworkContext { tenantId:string; networkName:string; activeFarms:number; activeAreaHa:number; activeCropCycles:number; asOf:string; }
export interface ControlException { id:string; severity:ControlExceptionSeverity; code:string; title:string; subject:string; reason:string; evidenceRefs:readonly string[]; requiresHumanAction:true; deterministic:true; }
export interface ControlProjectCapital { projectId:string; name:string; location:string; requiredMinor:number; committedMinor:number; deployedMinor:number; recoveredMinor:number; currency:'COP'; criticalRisks:number; }
export interface ControlAgronomy { healthyCycles:number; watchCycles:number; criticalCycles:number; openAlerts:number; criticalAlerts:number; }
export interface ControlOperations { planned:number; completed:number; due:number; overdue:number; }
export interface ControlSupply { openOrders:number; fillRateBps:number; inventoryCoverageDays:number; }
export interface ControlDemandWindow { product:string; unit:string; days:30|60|90; planned:number; committed:number; gap:number; }
export interface ControlImpactMetric { label:string; value:string; source:string; }
export interface ControlTowerViewModel { trust:ControlTowerTrust; context:ControlNetworkContext; exceptions:readonly ControlException[]; projects:readonly ControlProjectCapital[]; agronomy:ControlAgronomy; operations:ControlOperations; supply:ControlSupply; demand:readonly ControlDemandWindow[]; impact:readonly ControlImpactMetric[]; copilotState:'DRAFT_SUGGESTION'; deterministicRulesAuthoritative:true; rawProviderPayloadVisible:false; requiresHumanApproval:true; }
export const CONTROL_TOWER_HOME_ROUTE='/control';
