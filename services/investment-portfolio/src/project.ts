import type { ChangeInvestmentProjectState, EligibilityResult, InvestmentProject, ProductionRef, RegisterInvestmentProject, ProjectState } from '@agroway/invest-control-contracts';
import { assertCurrencyCode, assertProductionRef, assertProjectLedger } from './invariants.js';
const transitions:Record<ProjectState,readonly ProjectState[]>={
  DRAFT:['UNDER_REVIEW','CANCELLED'], UNDER_REVIEW:['DRAFT','APPROVED','CANCELLED'], APPROVED:['ACTIVE','CANCELLED'],
  ACTIVE:['PAUSED','COMPLETED','CANCELLED'], PAUSED:['ACTIVE','CANCELLED'], COMPLETED:[], CANCELLED:[]
};
export function registerProject(cmd:RegisterInvestmentProject):InvestmentProject {
  assertProductionRef(cmd.productionRef); assertCurrencyCode(cmd.currency); if (!cmd.projectId.trim()||!cmd.tenantId.trim()||!cmd.code.trim()||!cmd.name.trim()) throw new Error('PROJECT_IDENTITY_REQUIRED');
  return {projectId:cmd.projectId,tenantId:cmd.tenantId,code:cmd.code.trim(),name:cmd.name.trim(),state:'DRAFT',eligibility:'NOT_EVALUATED',productionRef:cmd.productionRef,currency:cmd.currency,requiredMinor:0,committedMinor:0,deployedMinor:0,recoveredMinor:0,createdAt:cmd.at,updatedAt:cmd.at};
}
export function changeProjectState(project:InvestmentProject,cmd:ChangeInvestmentProjectState):InvestmentProject {
  if (project.projectId!==cmd.projectId||project.tenantId!==cmd.tenantId) throw new Error('PROJECT_SCOPE_MISMATCH');
  if (!cmd.actorRef) throw new Error('PROJECT_STATE_ACTOR_REQUIRED');
  if (!transitions[project.state].includes(cmd.target)) throw new Error(`PROJECT_STATE_TRANSITION_FORBIDDEN:${project.state}->${cmd.target}`);
  if (cmd.target==='APPROVED' && project.eligibility!=='ELIGIBLE') throw new Error('PROJECT_NOT_ELIGIBLE');
  if (cmd.target==='ACTIVE' && project.committedMinor < project.requiredMinor) throw new Error('PROJECT_NOT_FULLY_COMMITTED');
  const next={...project,state:cmd.target,updatedAt:cmd.at}; assertProjectLedger(next); return next;
}

export function linkProductionRef(project:InvestmentProject,productionRef:ProductionRef,at:string):InvestmentProject {
  if(!['DRAFT','UNDER_REVIEW'].includes(project.state)) throw new Error('PRODUCTION_REF_LOCKED'); assertProductionRef(productionRef); return {...project,productionRef,eligibility:'NOT_EVALUATED',updatedAt:at};
}
export function applyEligibilityResult(project:InvestmentProject,result:EligibilityResult):InvestmentProject {
  if(project.projectId!==result.projectId||project.tenantId!==result.tenantId) throw new Error('ELIGIBILITY_SCOPE_MISMATCH');
  if(!['DRAFT','UNDER_REVIEW'].includes(project.state)) throw new Error('ELIGIBILITY_STATE_LOCKED'); return {...project,eligibility:result.state,updatedAt:result.evaluatedAt};
}
