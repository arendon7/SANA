import type { InvestmentProject, ProductionRef } from '@agroway/invest-control-contracts';

export interface ProjectScopedCommand { tenantId:string; projectId:string; }

export function assertMinorUnits(value:number, code:string):void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${code}: amountMinor must be a non-negative safe integer`);
}
export function assertPositiveMinorUnits(value:number, code:string):void {
  assertMinorUnits(value,code); if (value === 0) throw new Error(`${code}: amountMinor must be > 0`);
}
export function assertSafeAdd(a:number,b:number,code:string):number {
  assertMinorUnits(a,`${code}:LEFT`); assertMinorUnits(b,`${code}:RIGHT`);
  const total=a+b; if(!Number.isSafeInteger(total)) throw new Error(`${code}: safe-integer overflow`); return total;
}
export function assertCurrencyCode(currency:string):void {
  if(!/^[A-Z]{3}$/.test(currency)) throw new Error('CURRENCY_CODE_INVALID');
}
export function assertProductionRef(ref:ProductionRef):void {
  if (!ref.producerId || !ref.farmId) throw new Error('PRODUCTION_REF_ID_MISSING');
  if (ref.plotIds.length === 0) throw new Error('PRODUCTION_REF_PLOT_REQUIRED');
  if (ref.cropCycleIds.length === 0) throw new Error('PRODUCTION_REF_CROP_CYCLE_REQUIRED');
  if (new Set(ref.plotIds).size !== ref.plotIds.length || new Set(ref.cropCycleIds).size !== ref.cropCycleIds.length) throw new Error('PRODUCTION_REF_DUPLICATE');
}
export function assertProjectLedger(project:InvestmentProject):void {
  for (const [code,value] of [['required',project.requiredMinor],['committed',project.committedMinor],['deployed',project.deployedMinor],['recovered',project.recoveredMinor]] as const) assertMinorUnits(value,code);
  if (project.committedMinor > project.requiredMinor) throw new Error('CAPITAL_COMMITTED_EXCEEDS_REQUIREMENT');
  if (project.deployedMinor > project.committedMinor) throw new Error('CAPITAL_DEPLOYED_EXCEEDS_COMMITMENT');
}
export function assertProjectCommandScope(project:InvestmentProject,cmd:ProjectScopedCommand):void {
  if(project.tenantId!==cmd.tenantId||project.projectId!==cmd.projectId) throw new Error('PROJECT_SCOPE_MISMATCH');
}
export function assertCurrency(project:InvestmentProject,currency:string):void {
  assertCurrencyCode(project.currency); assertCurrencyCode(currency);
  if (project.currency !== currency) throw new Error('PROJECT_CURRENCY_MISMATCH');
}
