import type {
  CapitalTotals,
  ControlTowerException,
  ControlTowerSnapshot,
  CurrencyCode,
  TowerThresholds,
} from '@agroway/invest-control-contracts';
import type { PortfolioProjectSummary } from '@agroway/invest-control-contracts';

function validIso(value:string):string {
  if(!Number.isFinite(Date.parse(value))) throw new Error('INVALID_ISO_DATETIME');
  return value;
}
function bps(numerator:number,denominator:number):number {
  if(denominator<=0) return 0;
  return Math.max(0,Math.round((numerator*10_000)/denominator));
}
function safeSum(values:readonly number[]):number {
  let total=0;
  for(const value of values){
    if(!Number.isSafeInteger(value)||value<0) throw new Error('INVALID_CAPITAL_AMOUNT');
    total+=value;
    if(!Number.isSafeInteger(total)) throw new Error('CAPITAL_TOTAL_OVERFLOW');
  }
  return total;
}

export function projectCapitalTotals(projects:readonly PortfolioProjectSummary[]):readonly CapitalTotals[] {
  const currencies=[...new Set(projects.map(p=>p.currency))].sort();
  return currencies.map((currency:CurrencyCode)=>{
    const scoped=projects.filter(p=>p.currency===currency);
    const requiredMinor=safeSum(scoped.map(p=>p.requiredMinor));
    const committedMinor=safeSum(scoped.map(p=>p.committedMinor));
    const deployedMinor=safeSum(scoped.map(p=>p.deployedMinor));
    const recoveredMinor=safeSum(scoped.map(p=>p.recoveredMinor));
    return Object.freeze({
      currency,requiredMinor,committedMinor,deployedMinor,recoveredMinor,
      capitalCoverageBps:bps(committedMinor,requiredMinor),
      deploymentBps:bps(deployedMinor,committedMinor),
      recoveryMultipleBps:bps(recoveredMinor,deployedMinor),
    });
  });
}

export interface ControlTowerProjectionInput extends Omit<ControlTowerSnapshot,'capital'|'exceptions'> {
  projects:readonly PortfolioProjectSummary[];
  thresholds:TowerThresholds;
  previousExceptions?:readonly ControlTowerException[];
}

type ExceptionDraft=Readonly<{code:string;severity:ControlTowerException['severity'];subjectRef:string;reason:string}>;

function exceptionDrafts(input:ControlTowerProjectionInput):readonly ExceptionDraft[] {
  const drafts:ExceptionDraft[]=[];
  if(input.operations.overdueActivities>input.thresholds.maxOverdueActivities){
    drafts.push({code:'OVERDUE_OPERATIONS',severity:'WARNING',subjectRef:'operations',reason:`Overdue activities ${input.operations.overdueActivities} exceed threshold ${input.thresholds.maxOverdueActivities}`});
  }
  if(input.supply.inventoryCoverageDays<input.thresholds.minInventoryCoverageDays){
    drafts.push({code:'LOW_INVENTORY_COVERAGE',severity:'WARNING',subjectRef:'supply',reason:`Inventory coverage ${input.supply.inventoryCoverageDays}d is below threshold ${input.thresholds.minInventoryCoverageDays}d`});
  }
  if(input.agronomy.criticalAlerts>=input.thresholds.raiseAgronomyCriticalWhenCriticalAlertsAtLeast){
    drafts.push({code:'CRITICAL_AGRONOMY_ALERTS',severity:'CRITICAL',subjectRef:'agronomy',reason:`Critical agronomy alerts ${input.agronomy.criticalAlerts} reached threshold ${input.thresholds.raiseAgronomyCriticalWhenCriticalAlertsAtLeast}`});
  }
  for(const project of input.projects){
    if(project.openCriticalRisks>0) drafts.push({code:'OPEN_CRITICAL_INVESTMENT_RISK',severity:'CRITICAL',subjectRef:`project:${project.projectId}`,reason:`Project has ${project.openCriticalRisks} open critical risk(s)`});
    if(project.deployedMinor>project.committedMinor) drafts.push({code:'CAPITAL_INVARIANT_BREACH',severity:'CRITICAL',subjectRef:`project:${project.projectId}`,reason:'Deployed capital exceeds committed capital'});
  }
  return drafts;
}

function fingerprint(tenantId:string,draft:ExceptionDraft):string {
  return `${tenantId}:${draft.code}:${draft.subjectRef}`;
}

export function projectExceptions(input:ControlTowerProjectionInput):readonly ControlTowerException[] {
  validIso(input.asOf);
  const previous=new Map((input.previousExceptions??[]).map(item=>[item.fingerprint,item] as const));
  return exceptionDrafts(input).map(draft=>{
    const fp=fingerprint(input.tenantId,draft);
    const existing=previous.get(fp);
    if(existing&&existing.state!=='RESOLVED'&&existing.state!=='SUPPRESSED'){
      return Object.freeze({...existing,severity:draft.severity,reason:draft.reason,updatedAt:input.asOf});
    }
    return Object.freeze({
      exceptionId:`exception:${fp}`,tenantId:input.tenantId,code:draft.code,severity:draft.severity,state:'OPEN' as const,
      subjectRef:draft.subjectRef,reason:draft.reason,fingerprint:fp,openedAt:input.asOf,updatedAt:input.asOf,
    });
  });
}

export function projectControlTowerSnapshot(input:ControlTowerProjectionInput):ControlTowerSnapshot {
  validIso(input.asOf);
  const capital=projectCapitalTotals(input.projects);
  const exceptions=projectExceptions(input);
  return Object.freeze({
    snapshotId:input.snapshotId,tenantId:input.tenantId,asOf:input.asOf,network:input.network,
    capital:Object.freeze([...capital]),agronomy:input.agronomy,operations:input.operations,supply:input.supply,
    demand:Object.freeze([...input.demand]),impact:Object.freeze([...input.impact]),exceptions:Object.freeze([...exceptions]),
    watermarks:Object.freeze([...input.watermarks]),
  });
}
