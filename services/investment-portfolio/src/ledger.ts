import type { CapitalCommitment, CapitalDeployment, CapitalRecovery, DeclareCapitalRequirement, InvestmentProject, RecordCapitalCommitment, CancelCapitalCommitment, RecordCapitalDeployment, RecordCapitalRecovery } from '@agroway/invest-control-contracts';
import { assertCurrency, assertMinorUnits, assertPositiveMinorUnits, assertProjectCommandScope, assertProjectLedger, assertSafeAdd } from './invariants.js';

function assertCommitmentScope(project:InvestmentProject,commitment:CapitalCommitment,commitmentId?:string):void {
  if(commitment.tenantId!==project.tenantId||commitment.projectId!==project.projectId) throw new Error('COMMITMENT_SCOPE_MISMATCH');
  if(commitmentId!==undefined&&commitment.commitmentId!==commitmentId) throw new Error('COMMITMENT_SCOPE_MISMATCH');
  assertCurrency(project,commitment.currency);
}

export function declareRequirement(project:InvestmentProject,cmd:DeclareCapitalRequirement):InvestmentProject {
  assertProjectCommandScope(project,cmd); assertCurrency(project,cmd.currency); assertPositiveMinorUnits(cmd.amountMinor,'CAPITAL_REQUIREMENT');
  if (cmd.amountMinor < project.committedMinor) throw new Error('CAPITAL_REQUIREMENT_BELOW_COMMITTED');
  const next={...project,requiredMinor:cmd.amountMinor,updatedAt:cmd.at}; assertProjectLedger(next); return next;
}
export function recordCommitment(project:InvestmentProject,cmd:RecordCapitalCommitment):{project:InvestmentProject;commitment:CapitalCommitment} {
  assertProjectCommandScope(project,cmd); assertCurrency(project,cmd.currency); assertPositiveMinorUnits(cmd.amountMinor,'CAPITAL_COMMITMENT');
  if(!cmd.sourceRef.trim()) throw new Error('CAPITAL_COMMITMENT_SOURCE_REQUIRED');
  const nextCommitted=assertSafeAdd(project.committedMinor,cmd.amountMinor,'CAPITAL_COMMITMENT_TOTAL');
  if (nextCommitted>project.requiredMinor) throw new Error('CAPITAL_COMMITMENT_EXCEEDS_REQUIREMENT');
  const next={...project,committedMinor:nextCommitted,updatedAt:cmd.at}; assertProjectLedger(next);
  return {project:next,commitment:{commitmentId:cmd.commitmentId,tenantId:project.tenantId,projectId:project.projectId,amountMinor:cmd.amountMinor,currency:project.currency,sourceRef:cmd.sourceRef,committedAt:cmd.at,cancelledMinor:0}};
}
export function cancelCommitment(project:InvestmentProject,commitment:CapitalCommitment,deployedAgainstCommitmentMinor:number,cmd:CancelCapitalCommitment):{project:InvestmentProject;commitment:CapitalCommitment} {
  assertProjectCommandScope(project,cmd); assertCommitmentScope(project,commitment,cmd.commitmentId);
  assertPositiveMinorUnits(cmd.amountMinor,'CAPITAL_COMMITMENT_CANCEL'); assertMinorUnits(deployedAgainstCommitmentMinor,'DEPLOYED_AGAINST_COMMITMENT');
  const cancellable=commitment.amountMinor-commitment.cancelledMinor-deployedAgainstCommitmentMinor;
  if (cancellable<0) throw new Error('COMMITMENT_DEPLOYMENT_STATE_INVALID');
  if (cmd.amountMinor>cancellable) throw new Error('CAPITAL_COMMITMENT_CANCEL_EXCEEDS_AVAILABLE');
  const nextCommitment={...commitment,cancelledMinor:commitment.cancelledMinor+cmd.amountMinor};
  const next={...project,committedMinor:project.committedMinor-cmd.amountMinor,updatedAt:cmd.at}; assertProjectLedger(next); return {project:next,commitment:nextCommitment};
}
export function recordDeployment(project:InvestmentProject,commitment:CapitalCommitment,deployedAgainstCommitmentMinor:number,cmd:RecordCapitalDeployment):{project:InvestmentProject;deployment:CapitalDeployment} {
  assertProjectCommandScope(project,cmd); assertCommitmentScope(project,commitment,cmd.commitmentId); assertCurrency(project,cmd.currency);
  assertPositiveMinorUnits(cmd.amountMinor,'CAPITAL_DEPLOYMENT'); assertMinorUnits(deployedAgainstCommitmentMinor,'DEPLOYED_AGAINST_COMMITMENT');
  const available=commitment.amountMinor-commitment.cancelledMinor-deployedAgainstCommitmentMinor;
  if(available<0) throw new Error('COMMITMENT_DEPLOYMENT_STATE_INVALID');
  if (cmd.amountMinor>available) throw new Error('CAPITAL_DEPLOYMENT_EXCEEDS_COMMITMENT_AVAILABLE');
  if (!cmd.evidenceRef.trim()) throw new Error('CAPITAL_DEPLOYMENT_EVIDENCE_REQUIRED');
  if (!cmd.purposeCode.trim()) throw new Error('CAPITAL_DEPLOYMENT_PURPOSE_REQUIRED');
  const nextDeployed=assertSafeAdd(project.deployedMinor,cmd.amountMinor,'CAPITAL_DEPLOYMENT_TOTAL');
  const next={...project,deployedMinor:nextDeployed,updatedAt:cmd.at}; assertProjectLedger(next);
  return {project:next,deployment:{deploymentId:cmd.deploymentId,tenantId:project.tenantId,projectId:project.projectId,commitmentId:commitment.commitmentId,amountMinor:cmd.amountMinor,currency:project.currency,purposeCode:cmd.purposeCode,evidenceRef:cmd.evidenceRef,deployedAt:cmd.at}};
}
export function recordRecovery(project:InvestmentProject,cmd:RecordCapitalRecovery):{project:InvestmentProject;recovery:CapitalRecovery} {
  assertProjectCommandScope(project,cmd); assertCurrency(project,cmd.currency); assertPositiveMinorUnits(cmd.amountMinor,'CAPITAL_RECOVERY');
  if(project.deployedMinor===0) throw new Error('CAPITAL_RECOVERY_WITHOUT_DEPLOYMENT');
  if (!cmd.evidenceRef.trim()) throw new Error('CAPITAL_RECOVERY_EVIDENCE_REQUIRED');
  const nextRecovered=assertSafeAdd(project.recoveredMinor,cmd.amountMinor,'CAPITAL_RECOVERY_TOTAL');
  const next={...project,recoveredMinor:nextRecovered,updatedAt:cmd.at}; assertProjectLedger(next);
  return {project:next,recovery:{recoveryId:cmd.recoveryId,tenantId:project.tenantId,projectId:project.projectId,amountMinor:cmd.amountMinor,currency:project.currency,kind:cmd.kind,evidenceRef:cmd.evidenceRef,receivedAt:cmd.at}};
}
