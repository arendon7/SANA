import type {
  CapitalTotals,
  ControlTowerException,
  ControlTowerSnapshot,
  CurrencyCode,
  ReadinessAssessment,
  ReadinessGap,
  ReadinessGateId,
  TowerThresholds,
} from '@agroway/invest-control-contracts';
import type { PortfolioProjectSummary } from '@agroway/invest-control-contracts';

const SHA256=/^[a-f0-9]{64}$/;
const READINESS_GATE_IDS:readonly ReadinessGateId[]=['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'] as const;
const READINESS_GAP_STATES=new Set(['OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED']);
const READINESS_DECISIONS=new Set(['NOT_CAPITAL_READY','CAPITAL_READY_WITH_CONDITIONS','CAPITAL_READY','REASSESSMENT_REQUIRED']);

function validIso(value:string):string {
  if(!Number.isFinite(Date.parse(value))) throw new Error('INVALID_ISO_DATETIME');
  return value;
}
function isoMs(value:string):number {validIso(value);return Date.parse(value);}
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
function sameStrings(left:readonly string[],right:readonly string[]):boolean {
  const a=[...left].sort(),b=[...right].sort();
  return a.length===b.length&&a.every((value,index)=>value===b[index]);
}
function activeReadinessGap(gap:ReadinessGap):boolean {
  return gap.state==='OPEN'||gap.state==='IN_REMEDIATION'||gap.state==='EVIDENCE_SUBMITTED';
}
function nonBlank(value:string,code:string):string {const normalized=value.trim();if(!normalized)throw new Error(code);return normalized;}

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

export interface CapitalReadinessProjectionItem {
  assessment:ReadinessAssessment;
  gaps:readonly ReadinessGap[];
}

export interface ControlTowerProjectionInput extends Omit<ControlTowerSnapshot,'capital'|'exceptions'> {
  projects:readonly PortfolioProjectSummary[];
  thresholds:TowerThresholds;
  previousExceptions?:readonly ControlTowerException[];
  capitalReadiness?:readonly CapitalReadinessProjectionItem[];
}

type ExceptionDraft=Readonly<{code:string;severity:ControlTowerException['severity'];subjectRef:string;reason:string}>;

function validateReadinessProjectionItem(tenantId:string,asOfMs:number,item:CapitalReadinessProjectionItem):void {
  const assessment=item.assessment;
  if(assessment.tenantId!==tenantId) throw new Error('READINESS_PROJECTION_TENANT_MISMATCH');
  if(isoMs(assessment.reviewedAt)>asOfMs) throw new Error('READINESS_PROJECTION_ASSESSMENT_FROM_FUTURE');
  nonBlank(assessment.projectId,'READINESS_PROJECTION_PROJECT_REQUIRED');
  if(!Number.isSafeInteger(assessment.version)||assessment.version<=0) throw new Error('READINESS_PROJECTION_ASSESSMENT_VERSION_INVALID');
  if(!Number.isSafeInteger(assessment.evidenceCoverageBps)||assessment.evidenceCoverageBps<0||assessment.evidenceCoverageBps>10_000) throw new Error('READINESS_PROJECTION_EVIDENCE_COVERAGE_INVALID');
  if(!READINESS_DECISIONS.has(assessment.decision)) throw new Error('READINESS_PROJECTION_DECISION_INVALID');
  if(!SHA256.test(assessment.digestSha256)||!SHA256.test(assessment.evidenceManifestDigestSha256)||!SHA256.test(assessment.riskProfileDigestSha256)) throw new Error('READINESS_PROJECTION_DIGEST_INVALID');
  nonBlank(assessment.policyVersion,'READINESS_PROJECTION_POLICY_VERSION_REQUIRED');
  nonBlank(assessment.methodologyVersion,'READINESS_PROJECTION_METHODOLOGY_VERSION_REQUIRED');
  nonBlank(assessment.projectSnapshotRef,'READINESS_PROJECTION_PROJECT_SNAPSHOT_REQUIRED');
  nonBlank(assessment.reviewerRef,'READINESS_PROJECTION_REVIEWER_REQUIRED');
  const blockingRefs=[...assessment.blockingGapRefs].sort();
  const conditionRefs=[...assessment.conditionGapRefs].sort();
  if(new Set([...blockingRefs,...conditionRefs]).size!==blockingRefs.length+conditionRefs.length) throw new Error('READINESS_PROJECTION_DUPLICATE_ASSESSMENT_GAP_REF');
  if(assessment.decision==='CAPITAL_READY'&&(blockingRefs.length>0||conditionRefs.length>0)) throw new Error('READINESS_PROJECTION_READY_WITH_GAPS_INCONSISTENT');
  if(assessment.decision==='CAPITAL_READY_WITH_CONDITIONS'&&(blockingRefs.length>0||conditionRefs.length===0)) throw new Error('READINESS_PROJECTION_CONDITIONAL_DECISION_INCONSISTENT');
  const gaps=new Map<string,ReadinessGap>();
  for(const gap of item.gaps){
    nonBlank(gap.gapId,'READINESS_PROJECTION_GAP_ID_REQUIRED');
    nonBlank(gap.code,'READINESS_PROJECTION_GAP_CODE_REQUIRED');
    if(!READINESS_GATE_IDS.includes(gap.gateId)) throw new Error('READINESS_PROJECTION_GATE_INVALID');
    if(!READINESS_GAP_STATES.has(gap.state)) throw new Error('READINESS_PROJECTION_GAP_STATE_INVALID');
    if(typeof gap.blocking!=='boolean') throw new Error('READINESS_PROJECTION_GAP_BLOCKING_INVALID');
    if(gaps.has(gap.gapId)) throw new Error('READINESS_PROJECTION_DUPLICATE_GAP');
    gaps.set(gap.gapId,gap);
    if(gap.tenantId!==tenantId) throw new Error('READINESS_PROJECTION_GAP_TENANT_MISMATCH');
    if(gap.projectId!==assessment.projectId) throw new Error('READINESS_PROJECTION_GAP_PROJECT_MISMATCH');
    if(gap.assessmentVersion!==assessment.version) throw new Error('READINESS_PROJECTION_GAP_VERSION_MISMATCH');
    if(isoMs(gap.openedAt)>asOfMs) throw new Error('READINESS_PROJECTION_GAP_FROM_FUTURE');
    if(gap.resolvedAt!==undefined){
      const resolvedAt=isoMs(gap.resolvedAt);if(resolvedAt<isoMs(gap.openedAt)||resolvedAt>asOfMs) throw new Error('READINESS_PROJECTION_GAP_RESOLUTION_TIME_INVALID');
      if(activeReadinessGap(gap)) throw new Error('READINESS_PROJECTION_ACTIVE_GAP_HAS_RESOLVED_AT');
    }
    const inBlocking=blockingRefs.includes(gap.gapId),inCondition=conditionRefs.includes(gap.gapId);
    if(!inBlocking&&!inCondition) throw new Error('READINESS_PROJECTION_UNREFERENCED_GAP');
    if(gap.blocking!==inBlocking||gap.blocking===inCondition) throw new Error('READINESS_PROJECTION_GAP_CLASSIFICATION_MISMATCH');
  }
  if(!sameStrings([...gaps.keys()],[...blockingRefs,...conditionRefs])) throw new Error('READINESS_PROJECTION_GAP_SET_MISMATCH');
}

function capitalReadinessDrafts(tenantId:string,asOf:string,items:readonly CapitalReadinessProjectionItem[]):readonly ExceptionDraft[] {
  const asOfMs=isoMs(asOf),seenProjects=new Set<string>(),drafts:ExceptionDraft[]=[];
  const sorted=[...items].sort((a,b)=>a.assessment.projectId.localeCompare(b.assessment.projectId)||a.assessment.version-b.assessment.version);
  for(const item of sorted){
    validateReadinessProjectionItem(tenantId,asOfMs,item);
    const assessment=item.assessment;
    if(seenProjects.has(assessment.projectId)) throw new Error('READINESS_PROJECTION_DUPLICATE_PROJECT');
    seenProjects.add(assessment.projectId);
    const active=item.gaps.filter(activeReadinessGap);
    const groups=new Map<string,{gateId:ReadinessGateId;blocking:boolean;codes:string[]}>();
    for(const gap of active){
      const key=`${gap.gateId}:${gap.blocking?'BLOCKED':'CONDITION'}`;
      const group=groups.get(key)??{gateId:gap.gateId,blocking:gap.blocking,codes:[]};
      group.codes.push(gap.code.trim());
      groups.set(key,group);
    }
    for(const [,group] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))){
      const codes=[...new Set(group.codes)].sort();
      const suffix=group.blocking?'BLOCKED':'CONDITION';
      drafts.push(Object.freeze({
        code:`CAPITAL_READINESS_${group.gateId}_${suffix}`,
        severity:group.blocking?'CRITICAL':'WARNING',
        subjectRef:`project:${assessment.projectId}`,
        reason:`Readiness assessment v${assessment.version} ${group.gateId} has ${group.blocking?'blocking gap':'condition'} code(s): ${codes.join(', ')}`,
      }));
    }
    if(assessment.decision==='REASSESSMENT_REQUIRED'){
      drafts.push(Object.freeze({
        code:'CAPITAL_READINESS_REASSESSMENT_REQUIRED',severity:'WARNING',subjectRef:`project:${assessment.projectId}`,
        reason:`Readiness assessment v${assessment.version} requires reassessment; this is a readiness-state signal, not a financing default or disbursement decision.`,
      }));
    }
  }
  return Object.freeze(drafts);
}

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
  drafts.push(...capitalReadinessDrafts(input.tenantId,input.asOf,input.capitalReadiness??[]));
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
