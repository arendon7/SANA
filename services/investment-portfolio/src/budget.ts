import type { ApproveBudgetVersion, CreateBudgetVersion, InvestmentBudgetVersion, InvestmentProject } from '@agroway/invest-control-contracts';
import { assertCurrency, assertMinorUnits, assertProjectCommandScope, assertSafeAdd } from './invariants.js';
export function createBudgetVersion(project:InvestmentProject,cmd:CreateBudgetVersion):InvestmentBudgetVersion {
  assertProjectCommandScope(project,cmd); assertCurrency(project,cmd.currency);
  if(!Number.isSafeInteger(cmd.version)||cmd.version<1) throw new Error('BUDGET_VERSION_INVALID');
  if(cmd.lines.length===0) throw new Error('BUDGET_LINES_REQUIRED');
  let totalMinor=0; const ids=new Set<string>();
  for(const line of cmd.lines){
    assertMinorUnits(line.amountMinor,'BUDGET_LINE');
    if(!line.lineId.trim()||!line.categoryCode.trim()||!line.description.trim()) throw new Error('BUDGET_LINE_IDENTITY_REQUIRED');
    if(ids.has(line.lineId)) throw new Error('BUDGET_LINE_DUPLICATE'); ids.add(line.lineId);
    totalMinor=assertSafeAdd(totalMinor,line.amountMinor,'BUDGET_TOTAL');
  }
  return {projectId:project.projectId,tenantId:project.tenantId,version:cmd.version,currency:project.currency,lines:cmd.lines,totalMinor,state:'DRAFT',createdAt:cmd.at};
}
export function approveBudget(project:InvestmentProject,budget:InvestmentBudgetVersion,previousApproved:InvestmentBudgetVersion|undefined,cmd:ApproveBudgetVersion):{project:InvestmentProject;budget:InvestmentBudgetVersion;supersededBudget?:InvestmentBudgetVersion} {
  assertProjectCommandScope(project,cmd); assertCurrency(project,budget.currency);
  if(project.projectId!==budget.projectId||project.tenantId!==budget.tenantId||cmd.version!==budget.version) throw new Error('BUDGET_SCOPE_MISMATCH');
  if(budget.state!=='DRAFT') throw new Error('BUDGET_NOT_DRAFT'); if(project.requiredMinor===0) throw new Error('CAPITAL_REQUIREMENT_REQUIRED');
  if(budget.totalMinor>project.requiredMinor) throw new Error('BUDGET_EXCEEDS_CAPITAL_REQUIREMENT'); if(!cmd.approverRef.trim()) throw new Error('BUDGET_APPROVER_REQUIRED');
  if(previousApproved && (previousApproved.projectId!==project.projectId || previousApproved.tenantId!==project.tenantId || previousApproved.currency!==project.currency || previousApproved.state!=='APPROVED')) throw new Error('PREVIOUS_APPROVED_BUDGET_INVALID');
  const nextProject={...project,approvedBudgetVersion:budget.version,eligibility:'NOT_EVALUATED' as const,updatedAt:cmd.at};
  const nextBudget={...budget,state:'APPROVED' as const,approvedAt:cmd.at};
  return previousApproved ? {project:nextProject,budget:nextBudget,supersededBudget:{...previousApproved,state:'SUPERSEDED'}} : {project:nextProject,budget:nextBudget};
}
