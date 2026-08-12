import type {
  ApproveBudgetVersion,
  CancelCapitalCommitment,
  CapitalCommitment,
  CapitalDeployment,
  CapitalRecovery,
  ChangeInvestmentProjectState,
  ChangeInvestmentRiskState,
  CreateBudgetVersion,
  DeclareCapitalRequirement,
  EligibilityInput,
  EligibilityResult,
  InvestmentBudgetVersion,
  InvestmentImpactSnapshotLink,
  InvestmentProject,
  InvestmentRisk,
  LinkInvestmentEvidence,
  LinkInvestmentImpactSnapshot,
  PortfolioProjectSummary,
  ProjectEvidenceLink,
  RecordCapitalCommitment,
  RecordCapitalDeployment,
  RecordCapitalRecovery,
  RegisterInvestmentProject,
  RegisterInvestmentRisk,
} from '@agroway/invest-control-contracts';

const TERMINAL_STATES = new Set<InvestmentProject['state']>(['COMPLETED','CANCELLED']);
const ALLOWED_TRANSITIONS: Readonly<Record<InvestmentProject['state'], readonly InvestmentProject['state'][]>> = {
  DRAFT:['UNDER_REVIEW','CANCELLED'],
  UNDER_REVIEW:['DRAFT','APPROVED','CANCELLED'],
  APPROVED:['ACTIVE','PAUSED','CANCELLED'],
  ACTIVE:['PAUSED','COMPLETED','CANCELLED'],
  PAUSED:['ACTIVE','CANCELLED'],
  COMPLETED:[],
  CANCELLED:[],
};

function nonBlank(value:string, code:string):string {
  const normalized=value.trim();
  if(!normalized) throw new Error(code);
  return normalized;
}
function validIso(value:string):string {
  if(!Number.isFinite(Date.parse(value))) throw new Error('INVALID_ISO_DATETIME');
  return value;
}
function positiveMinor(value:number):number {
  if(!Number.isSafeInteger(value)||value<=0) throw new Error('INVALID_POSITIVE_MINOR_AMOUNT');
  return value;
}
function nonNegativeMinor(value:number):number {
  if(!Number.isSafeInteger(value)||value<0) throw new Error('INVALID_MINOR_AMOUNT');
  return value;
}
function sameScope(project:InvestmentProject, tenantId:string, projectId:string):void {
  if(project.tenantId!==tenantId||project.projectId!==projectId) throw new Error('PROJECT_SCOPE_MISMATCH');
}
function sameCurrency(project:InvestmentProject,currency:string):void {
  if(project.currency!==currency) throw new Error('PROJECT_CURRENCY_MISMATCH');
}
function assertMutable(project:InvestmentProject):void {
  if(TERMINAL_STATES.has(project.state)) throw new Error('PROJECT_TERMINAL');
}
function safeAdd(a:number,b:number):number {
  const value=a+b;
  if(!Number.isSafeInteger(value)) throw new Error('MINOR_AMOUNT_OVERFLOW');
  return value;
}

export function registerInvestmentProject(command:RegisterInvestmentProject):InvestmentProject {
  validIso(command.at);
  nonBlank(command.projectId,'PROJECT_ID_REQUIRED');
  nonBlank(command.tenantId,'TENANT_ID_REQUIRED');
  const code=nonBlank(command.code,'PROJECT_CODE_REQUIRED');
  const name=nonBlank(command.name,'PROJECT_NAME_REQUIRED');
  const currency=nonBlank(command.currency,'CURRENCY_REQUIRED');
  if(!command.productionRef.producerId||!command.productionRef.farmId) throw new Error('PRODUCTION_REF_REQUIRED');
  if(command.productionRef.plotIds.length===0||command.productionRef.cropCycleIds.length===0) throw new Error('PRODUCTION_SCOPE_REQUIRED');
  return Object.freeze({
    projectId:command.projectId, tenantId:command.tenantId, code, name,
    state:'DRAFT', eligibility:'NOT_EVALUATED',
    productionRef:Object.freeze({...command.productionRef,plotIds:[...command.productionRef.plotIds],cropCycleIds:[...command.productionRef.cropCycleIds]}),
    currency, requiredMinor:0, committedMinor:0, deployedMinor:0, recoveredMinor:0,
    createdAt:command.at, updatedAt:command.at,
  });
}

export function declareCapitalRequirement(project:InvestmentProject,command:DeclareCapitalRequirement):InvestmentProject {
  sameScope(project,command.tenantId,command.projectId); sameCurrency(project,command.currency); assertMutable(project); validIso(command.at);
  const requiredMinor=positiveMinor(command.amountMinor);
  if(requiredMinor<project.committedMinor) throw new Error('REQUIREMENT_BELOW_COMMITTED_CAPITAL');
  return Object.freeze({...project,requiredMinor,updatedAt:command.at});
}

export function recordCapitalCommitment(project:InvestmentProject,command:RecordCapitalCommitment):Readonly<{project:InvestmentProject;commitment:CapitalCommitment}> {
  sameScope(project,command.tenantId,command.projectId); sameCurrency(project,command.currency); assertMutable(project); validIso(command.at);
  const amountMinor=positiveMinor(command.amountMinor);
  const committedMinor=safeAdd(project.committedMinor,amountMinor);
  if(project.requiredMinor<=0) throw new Error('CAPITAL_REQUIREMENT_NOT_DECLARED');
  if(committedMinor>project.requiredMinor) throw new Error('COMMITMENT_EXCEEDS_REQUIREMENT');
  const commitment:CapitalCommitment=Object.freeze({
    commitmentId:nonBlank(command.commitmentId,'COMMITMENT_ID_REQUIRED'),tenantId:project.tenantId,projectId:project.projectId,
    amountMinor,currency:project.currency,sourceRef:nonBlank(command.sourceRef,'COMMITMENT_SOURCE_REQUIRED'),committedAt:command.at,cancelledMinor:0,
  });
  return Object.freeze({project:Object.freeze({...project,committedMinor,updatedAt:command.at}),commitment});
}

export function cancelCapitalCommitment(project:InvestmentProject,commitment:CapitalCommitment,command:CancelCapitalCommitment):Readonly<{project:InvestmentProject;commitment:CapitalCommitment}> {
  sameScope(project,command.tenantId,command.projectId); assertMutable(project); validIso(command.at);
  if(commitment.projectId!==project.projectId||commitment.tenantId!==project.tenantId||commitment.commitmentId!==command.commitmentId) throw new Error('COMMITMENT_SCOPE_MISMATCH');
  const amountMinor=positiveMinor(command.amountMinor);
  const activeAmount=commitment.amountMinor-commitment.cancelledMinor;
  if(amountMinor>activeAmount) throw new Error('CANCELLATION_EXCEEDS_ACTIVE_COMMITMENT');
  const committedMinor=project.committedMinor-amountMinor;
  if(committedMinor<project.deployedMinor) throw new Error('CANCELLATION_BELOW_DEPLOYED_CAPITAL');
  return Object.freeze({
    project:Object.freeze({...project,committedMinor,updatedAt:command.at}),
    commitment:Object.freeze({...commitment,cancelledMinor:safeAdd(commitment.cancelledMinor,amountMinor)}),
  });
}

export function recordCapitalDeployment(project:InvestmentProject,commitment:CapitalCommitment,alreadyDeployedForCommitment:number,command:RecordCapitalDeployment):Readonly<{project:InvestmentProject;deployment:CapitalDeployment}> {
  sameScope(project,command.tenantId,command.projectId); sameCurrency(project,command.currency); validIso(command.at);
  if(project.state!=='APPROVED'&&project.state!=='ACTIVE') throw new Error('PROJECT_NOT_APPROVED_FOR_DEPLOYMENT');
  if(commitment.tenantId!==project.tenantId||commitment.projectId!==project.projectId||commitment.commitmentId!==command.commitmentId) throw new Error('COMMITMENT_SCOPE_MISMATCH');
  nonNegativeMinor(alreadyDeployedForCommitment);
  const amountMinor=positiveMinor(command.amountMinor);
  const activeCommitted=commitment.amountMinor-commitment.cancelledMinor;
  if(safeAdd(alreadyDeployedForCommitment,amountMinor)>activeCommitted) throw new Error('DEPLOYMENT_EXCEEDS_COMMITMENT');
  const deployedMinor=safeAdd(project.deployedMinor,amountMinor);
  if(deployedMinor>project.committedMinor) throw new Error('DEPLOYMENT_EXCEEDS_PROJECT_COMMITTED');
  const deployment:CapitalDeployment=Object.freeze({
    deploymentId:nonBlank(command.deploymentId,'DEPLOYMENT_ID_REQUIRED'),tenantId:project.tenantId,projectId:project.projectId,
    commitmentId:commitment.commitmentId,amountMinor,currency:project.currency,purposeCode:nonBlank(command.purposeCode,'PURPOSE_CODE_REQUIRED'),
    evidenceRef:nonBlank(command.evidenceRef,'DEPLOYMENT_EVIDENCE_REQUIRED'),deployedAt:command.at,
  });
  return Object.freeze({project:Object.freeze({...project,deployedMinor,updatedAt:command.at}),deployment});
}

export function recordCapitalRecovery(project:InvestmentProject,command:RecordCapitalRecovery):Readonly<{project:InvestmentProject;recovery:CapitalRecovery}> {
  sameScope(project,command.tenantId,command.projectId); sameCurrency(project,command.currency); validIso(command.at);
  if(project.deployedMinor<=0) throw new Error('NO_DEPLOYED_CAPITAL');
  const amountMinor=positiveMinor(command.amountMinor);
  const recoveredMinor=safeAdd(project.recoveredMinor,amountMinor);
  const recovery:CapitalRecovery=Object.freeze({
    recoveryId:nonBlank(command.recoveryId,'RECOVERY_ID_REQUIRED'),tenantId:project.tenantId,projectId:project.projectId,
    amountMinor,currency:project.currency,kind:command.kind,evidenceRef:nonBlank(command.evidenceRef,'RECOVERY_EVIDENCE_REQUIRED'),receivedAt:command.at,
  });
  return Object.freeze({project:Object.freeze({...project,recoveredMinor,updatedAt:command.at}),recovery});
}

export function changeInvestmentProjectState(project:InvestmentProject,command:ChangeInvestmentProjectState):InvestmentProject {
  sameScope(project,command.tenantId,command.projectId); validIso(command.at); nonBlank(command.reason,'STATE_CHANGE_REASON_REQUIRED'); nonBlank(command.actorRef,'ACTOR_REF_REQUIRED');
  if(project.state===command.target) return project;
  if(!ALLOWED_TRANSITIONS[project.state].includes(command.target)) throw new Error('INVALID_PROJECT_STATE_TRANSITION');
  if(command.target==='APPROVED'&&project.eligibility!=='ELIGIBLE') throw new Error('PROJECT_NOT_ELIGIBLE');
  if(command.target==='ACTIVE'&&project.deployedMinor<=0) throw new Error('CAPITAL_NOT_DEPLOYED');
  return Object.freeze({...project,state:command.target,updatedAt:command.at});
}

export function createBudgetVersion(project:InvestmentProject,command:CreateBudgetVersion):InvestmentBudgetVersion {
  sameScope(project,command.tenantId,command.projectId); sameCurrency(project,command.currency); assertMutable(project); validIso(command.at);
  if(!Number.isSafeInteger(command.version)||command.version<=0) throw new Error('INVALID_BUDGET_VERSION');
  if(command.lines.length===0) throw new Error('BUDGET_LINES_REQUIRED');
  const ids=new Set<string>();
  let totalMinor=0;
  const lines=command.lines.map(line=>{
    if(ids.has(line.lineId)) throw new Error('DUPLICATE_BUDGET_LINE');
    ids.add(nonBlank(line.lineId,'BUDGET_LINE_ID_REQUIRED'));
    const amountMinor=nonNegativeMinor(line.amountMinor); totalMinor=safeAdd(totalMinor,amountMinor);
    return Object.freeze({...line,categoryCode:nonBlank(line.categoryCode,'BUDGET_CATEGORY_REQUIRED'),description:nonBlank(line.description,'BUDGET_DESCRIPTION_REQUIRED'),amountMinor});
  });
  if(totalMinor<=0) throw new Error('BUDGET_TOTAL_REQUIRED');
  return Object.freeze({projectId:project.projectId,tenantId:project.tenantId,version:command.version,currency:project.currency,lines,totalMinor,state:'DRAFT',createdAt:command.at});
}

export function approveBudgetVersion(project:InvestmentProject,budgets:readonly InvestmentBudgetVersion[],command:ApproveBudgetVersion):Readonly<{project:InvestmentProject;budgets:readonly InvestmentBudgetVersion[]}> {
  sameScope(project,command.tenantId,command.projectId); assertMutable(project); validIso(command.at); nonBlank(command.approverRef,'APPROVER_REF_REQUIRED');
  const target=budgets.find(b=>b.projectId===project.projectId&&b.tenantId===project.tenantId&&b.version===command.version);
  if(!target) throw new Error('BUDGET_VERSION_NOT_FOUND');
  if(target.state!=='DRAFT') throw new Error('BUDGET_VERSION_NOT_DRAFT');
  const next=budgets.map(b=>{
    if(b.projectId!==project.projectId||b.tenantId!==project.tenantId) return b;
    if(b.version===command.version) return Object.freeze({...b,state:'APPROVED' as const,approvedAt:command.at});
    if(b.state==='APPROVED') return Object.freeze({...b,state:'SUPERSEDED' as const});
    return b;
  });
  return Object.freeze({project:Object.freeze({...project,approvedBudgetVersion:command.version,updatedAt:command.at}),budgets:Object.freeze(next)});
}

export function registerInvestmentRisk(project:InvestmentProject,command:RegisterInvestmentRisk):InvestmentRisk {
  sameScope(project,command.tenantId,command.projectId); validIso(command.at);
  return Object.freeze({riskId:nonBlank(command.riskId,'RISK_ID_REQUIRED'),tenantId:project.tenantId,projectId:project.projectId,code:nonBlank(command.code,'RISK_CODE_REQUIRED'),title:nonBlank(command.title,'RISK_TITLE_REQUIRED'),severity:command.severity,state:'OPEN',openedAt:command.at,updatedAt:command.at});
}

export function changeInvestmentRiskState(risk:InvestmentRisk,command:ChangeInvestmentRiskState):InvestmentRisk {
  if(risk.tenantId!==command.tenantId||risk.projectId!==command.projectId||risk.riskId!==command.riskId) throw new Error('RISK_SCOPE_MISMATCH');
  validIso(command.at);
  const mitigation=command.mitigation?.trim();
  const ownerRef=command.ownerRef?.trim();
  if((command.target==='MITIGATED'||command.target==='ACCEPTED')&&!mitigation) throw new Error('RISK_MITIGATION_REQUIRED');
  return Object.freeze({...risk,state:command.target,...(mitigation?{mitigation}:{}),...(ownerRef?{ownerRef}:{}),updatedAt:command.at});
}

export function linkInvestmentEvidence(project:InvestmentProject,command:LinkInvestmentEvidence):ProjectEvidenceLink {
  sameScope(project,command.tenantId,command.projectId); validIso(command.at);
  return Object.freeze({linkId:nonBlank(command.linkId,'EVIDENCE_LINK_ID_REQUIRED'),tenantId:project.tenantId,projectId:project.projectId,kind:command.kind,evidenceRef:nonBlank(command.evidenceRef,'EVIDENCE_REF_REQUIRED'),linkedAt:command.at});
}

export function linkInvestmentImpactSnapshot(project:InvestmentProject,command:LinkInvestmentImpactSnapshot):InvestmentImpactSnapshotLink {
  sameScope(project,command.tenantId,command.projectId); validIso(command.at);
  return Object.freeze({linkId:nonBlank(command.linkId,'IMPACT_LINK_ID_REQUIRED'),tenantId:project.tenantId,projectId:project.projectId,impactSnapshotRef:nonBlank(command.impactSnapshotRef,'IMPACT_SNAPSHOT_REF_REQUIRED'),linkedAt:command.at});
}

export function evaluateEligibility(input:EligibilityInput,evaluatedAt:string):EligibilityResult {
  validIso(evaluatedAt);
  const reasons:string[]=[];
  if(input.project.requiredMinor<=0) reasons.push('CAPITAL_REQUIREMENT_MISSING');
  if(!input.hasApprovedBudget) reasons.push('APPROVED_BUDGET_MISSING');
  if(input.project.productionRef.plotIds.length===0||input.project.productionRef.cropCycleIds.length===0) reasons.push('PRODUCTION_SCOPE_MISSING');
  if(input.openRisks.some(r=>r.state==='OPEN'&&r.severity==='CRITICAL')) reasons.push('OPEN_CRITICAL_RISK');
  const available=new Set(input.evidenceKinds);
  for(const required of input.requiredEvidenceKinds) if(!available.has(required)) reasons.push(`EVIDENCE_MISSING:${required}`);
  return Object.freeze({projectId:input.project.projectId,tenantId:input.project.tenantId,state:reasons.length===0?'ELIGIBLE':'INELIGIBLE',reasons:Object.freeze(reasons),evaluatedAt});
}

export function applyEligibility(project:InvestmentProject,result:EligibilityResult):InvestmentProject {
  sameScope(project,result.tenantId,result.projectId);
  return Object.freeze({...project,eligibility:result.state,updatedAt:result.evaluatedAt});
}

export function summarizePortfolioProject(project:InvestmentProject,risks:readonly InvestmentRisk[]):PortfolioProjectSummary {
  const openCriticalRisks=risks.filter(r=>r.tenantId===project.tenantId&&r.projectId===project.projectId&&r.severity==='CRITICAL'&&r.state==='OPEN').length;
  return Object.freeze({projectId:project.projectId,state:project.state,currency:project.currency,requiredMinor:project.requiredMinor,committedMinor:project.committedMinor,deployedMinor:project.deployedMinor,recoveredMinor:project.recoveredMinor,openCriticalRisks});
}
