import type { EligibilityInput, EligibilityResult } from '@agroway/invest-control-contracts';
export function evaluateEligibility(input:EligibilityInput,at:string):EligibilityResult {
  const reasons:string[]=[]; const p=input.project;
  if(p.requiredMinor<=0) reasons.push('CAPITAL_REQUIREMENT_MISSING');
  if(!input.hasApprovedBudget) reasons.push('APPROVED_BUDGET_MISSING');
  const scopedRisks=input.openRisks.filter(r=>r.tenantId===p.tenantId&&r.projectId===p.projectId);
  if(scopedRisks.length!==input.openRisks.length) reasons.push('RISK_SCOPE_MISMATCH');
  if(scopedRisks.some(r=>r.state==='OPEN'&&r.severity==='CRITICAL')) reasons.push('CRITICAL_RISK_OPEN');
  const present=new Set(input.evidenceKinds); for(const kind of input.requiredEvidenceKinds) if(!present.has(kind)) reasons.push(`EVIDENCE_MISSING:${kind}`);
  return {projectId:p.projectId,tenantId:p.tenantId,state:reasons.length===0?'ELIGIBLE':'INELIGIBLE',reasons:[...new Set(reasons)].sort(),evaluatedAt:at};
}
