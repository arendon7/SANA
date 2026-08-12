import type { AgronomySnapshot, ControlTowerException, DemandWindow, OperationsSnapshot, PortfolioProjectSummary, SupplySnapshot, TowerThresholds } from '@agroway/invest-control-contracts';
function id(tenantId:string,code:string,subjectRef:string):string{return `cte:${tenantId}:${code}:${subjectRef}`}
function ex(tenantId:string,code:string,severity:'WARNING'|'CRITICAL',subjectRef:string,reason:string,at:string):ControlTowerException{return {exceptionId:id(tenantId,code,subjectRef),tenantId,code,severity,state:'OPEN',subjectRef,reason,fingerprint:`${code}:${subjectRef}`,openedAt:at,updatedAt:at}}
export function deriveExceptions(tenantId:string,projects:readonly PortfolioProjectSummary[],agronomy:AgronomySnapshot,operations:OperationsSnapshot,supply:SupplySnapshot,demand:readonly DemandWindow[],thresholds:TowerThresholds,at:string):readonly ControlTowerException[]{
 const out:ControlTowerException[]=[];
 for(const p of projects){if(p.deployedMinor>p.committedMinor) out.push(ex(tenantId,'LEDGER_INVARIANT_BREACH','CRITICAL',p.projectId,'deployed capital exceeds committed capital',at)); else if(p.state==='ACTIVE'&&p.committedMinor<p.requiredMinor) out.push(ex(tenantId,'ACTIVE_PROJECT_CAPITAL_GAP','WARNING',p.projectId,'active project is not fully committed',at)); if(p.openCriticalRisks>0) out.push(ex(tenantId,'CRITICAL_INVESTMENT_RISK','CRITICAL',p.projectId,`${p.openCriticalRisks} critical risk(s) open`,at));}
 if(agronomy.criticalAlerts>=thresholds.raiseAgronomyCriticalWhenCriticalAlertsAtLeast) out.push(ex(tenantId,'AGRONOMY_CRITICAL','CRITICAL','portfolio',`${agronomy.criticalAlerts} critical agronomic alert(s)`,at));
 if(operations.overdueActivities>thresholds.maxOverdueActivities) out.push(ex(tenantId,'OPERATIONS_OVERDUE','WARNING','portfolio',`${operations.overdueActivities} overdue activities`,at));
 if(supply.inventoryCoverageDays<thresholds.minInventoryCoverageDays) out.push(ex(tenantId,'SUPPLY_COVERAGE_LOW','WARNING','portfolio',`inventory coverage ${supply.inventoryCoverageDays}d`,at));
 for(const d of demand){if(d.days===30&&d.gapQuantity>0) out.push(ex(tenantId,'DEMAND_GAP_30D','WARNING',d.productId,`30d demand gap ${d.gapQuantity} ${d.unit}`,at));}
 return out.sort((a,b)=>a.fingerprint.localeCompare(b.fingerprint));
}
