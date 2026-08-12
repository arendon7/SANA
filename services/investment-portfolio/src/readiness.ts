import type {
  BuildCapitalReadinessPackageInput,
  BuildProductiveRiskProfileInput,
  BuildReadinessAssessmentInput,
  CapitalPilotIntake,
  CapitalPilotIntakeState,
  CapitalReadinessPackage,
  EvidenceGateDecision,
  EvidenceManifest,
  EvidenceManifestItem,
  GateEvaluationResult,
  GateEvidenceCoverage,
  IntakeSourceType,
  ProductiveRiskDimension,
  ProductiveRiskDimensionId,
  ProductiveRiskDimensionState,
  ProductiveRiskProfile,
  ReadinessAssessment,
  ReadinessDecision,
  ReadinessEvidenceFreshness,
  ReadinessEvidenceRef,
  ReadinessGateAssessment,
  ReadinessGateId,
  ReadinessGatePolicy,
  ReadinessGateSignal,
  ReadinessGap,
  ReadinessPolicy,
} from '@agroway/invest-control-contracts';
import type { InvestmentProject, InvestmentRisk, RiskSeverity } from '@agroway/invest-control-contracts';

export type Sha256Hex=(canonical:string)=>string;

export const READINESS_GATE_IDS:readonly ReadinessGateId[]=[
  'G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE',
] as const;

export const PRODUCTIVE_RISK_DIMENSIONS:readonly ProductiveRiskDimensionId[]=[
  'PRODUCER','OPERATION','AGRONOMY','DATA','FINANCIAL','MARKET','CLIMATE','TRACEABILITY','MANAGEMENT',
] as const;

const SHA256=/^[a-f0-9]{64}$/;
const BPS_MAX=10_000;

function nonBlank(value:string,code:string):string{const v=value.trim();if(!v)throw new Error(code);return v;}
function validIsoMs(value:string):number{const ms=Date.parse(value);if(!Number.isFinite(ms))throw new Error('INVALID_ISO_DATETIME');return ms;}
function assertDigest(value:string,code='INVALID_SHA256_DIGEST'):string{if(!SHA256.test(value))throw new Error(code);return value;}
function assertBps(value:number,code='INVALID_BPS'):number{if(!Number.isSafeInteger(value)||value<0||value>BPS_MAX)throw new Error(code);return value;}
function assertPositiveInteger(value:number,code:string):number{if(!Number.isSafeInteger(value)||value<=0)throw new Error(code);return value;}
function assertNonNegativeInteger(value:number,code:string):number{if(!Number.isSafeInteger(value)||value<0)throw new Error(code);return value;}
function uniqueSorted(values:readonly string[]):readonly string[]{return Object.freeze([...new Set(values.map(v=>v.trim()).filter(Boolean))].sort());}
function clampBps(numerator:number,denominator:number):number{if(denominator<=0)return BPS_MAX;return Math.max(0,Math.min(BPS_MAX,Math.round(numerator*BPS_MAX/denominator)));}
function sameProjectScope(project:InvestmentProject,tenantId:string,projectId:string):void{if(project.tenantId!==tenantId||project.projectId!==projectId)throw new Error('READINESS_PROJECT_SCOPE_MISMATCH');}
function canonical(value:unknown):string{
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  const entries=Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b));
  return `{${entries.map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}
function digestOf(value:unknown,sha256:Sha256Hex):string{return assertDigest(sha256(canonical(value)));}
function freezeArray<T>(items:readonly T[]):readonly T[]{return Object.freeze([...items]);}

function assertPolicy(policy:ReadinessPolicy):void{
  nonBlank(policy.policyVersion,'READINESS_POLICY_VERSION_REQUIRED');
  nonBlank(policy.methodologyVersion,'READINESS_METHODOLOGY_VERSION_REQUIRED');
  if(policy.requireAllNineGates!==true)throw new Error('READINESS_POLICY_MUST_REQUIRE_ALL_NINE_GATES');
  assertBps(policy.minimumTotalCoverageBps,'INVALID_MINIMUM_TOTAL_COVERAGE_BPS');
  if(policy.gates.length!==READINESS_GATE_IDS.length)throw new Error('READINESS_POLICY_GATE_COUNT_INVALID');
  const seen=new Set<ReadinessGateId>();
  for(const gate of policy.gates){
    if(!READINESS_GATE_IDS.includes(gate.gateId))throw new Error('UNKNOWN_READINESS_GATE');
    if(seen.has(gate.gateId))throw new Error('DUPLICATE_READINESS_GATE_POLICY');
    seen.add(gate.gateId);
    assertNonNegativeInteger(gate.minimumAcceptedEvidence,'INVALID_MINIMUM_ACCEPTED_EVIDENCE');
    assertBps(gate.minimumConfidenceBps,'INVALID_GATE_MINIMUM_CONFIDENCE_BPS');
    if(gate.acceptedQualities.length===0)throw new Error('ACCEPTED_EVIDENCE_QUALITY_REQUIRED');
    if(gate.maxEvidenceAgeSeconds!==undefined&&(!Number.isSafeInteger(gate.maxEvidenceAgeSeconds)||gate.maxEvidenceAgeSeconds<=0))throw new Error('INVALID_MAX_EVIDENCE_AGE_SECONDS');
    const roles=uniqueSorted(gate.requiredEvidenceRoles);
    if(roles.length!==gate.requiredEvidenceRoles.length)throw new Error('DUPLICATE_OR_EMPTY_REQUIRED_EVIDENCE_ROLE');
  }
  for(const gateId of READINESS_GATE_IDS)if(!seen.has(gateId))throw new Error(`READINESS_POLICY_GATE_MISSING:${gateId}`);
}

const INTAKE_TRANSITIONS:Readonly<Record<CapitalPilotIntakeState,readonly CapitalPilotIntakeState[]>>={
  CREATED:['CANONICAL_REUSE_SCAN','PAUSED','WITHDRAWN'],
  CANONICAL_REUSE_SCAN:['DATA_COMPLETION','PAUSED','WITHDRAWN'],
  DATA_COMPLETION:['EVIDENCE_VALIDATION','PAUSED','WITHDRAWN'],
  EVIDENCE_VALIDATION:['DATA_COMPLETION','ASSESSMENT_READY','PAUSED','WITHDRAWN'],
  ASSESSMENT_READY:['UNDER_ASSESSMENT','PAUSED','WITHDRAWN'],
  UNDER_ASSESSMENT:['GAP_REMEDIATION','HUMAN_REVIEW','PAUSED','WITHDRAWN'],
  GAP_REMEDIATION:['EVIDENCE_VALIDATION','UNDER_ASSESSMENT','HUMAN_REVIEW','PAUSED','WITHDRAWN'],
  HUMAN_REVIEW:['CAPITAL_READY','READY_WITH_CONDITIONS','NOT_READY','REASSESSMENT_REQUIRED','GAP_REMEDIATION','PAUSED','WITHDRAWN'],
  CAPITAL_READY:['REASSESSMENT_REQUIRED','PAUSED','WITHDRAWN'],
  READY_WITH_CONDITIONS:['GAP_REMEDIATION','REASSESSMENT_REQUIRED','PAUSED','WITHDRAWN'],
  NOT_READY:['GAP_REMEDIATION','REASSESSMENT_REQUIRED','WITHDRAWN'],
  REASSESSMENT_REQUIRED:['DATA_COMPLETION','EVIDENCE_VALIDATION','UNDER_ASSESSMENT','WITHDRAWN'],
  PAUSED:['CANONICAL_REUSE_SCAN','DATA_COMPLETION','EVIDENCE_VALIDATION','ASSESSMENT_READY','UNDER_ASSESSMENT','GAP_REMEDIATION','HUMAN_REVIEW','REASSESSMENT_REQUIRED','WITHDRAWN'],
  WITHDRAWN:[],
};

export interface CreateCapitalPilotIntakeInput{
  intakeId:string;project:InvestmentProject;intakeVersion:number;sourceType:IntakeSourceType;sourceRef:string;originatorRef?:string;consentSetRef?:string;dataPackVersion:string;createdAt:string;supersedesIntakeId?:string;
}

export function createCapitalPilotIntake(input:CreateCapitalPilotIntakeInput):CapitalPilotIntake{
  validIsoMs(input.createdAt);assertPositiveInteger(input.intakeVersion,'INVALID_INTAKE_VERSION');
  const base={
    intakeId:nonBlank(input.intakeId,'INTAKE_ID_REQUIRED'),tenantId:input.project.tenantId,projectId:input.project.projectId,intakeVersion:input.intakeVersion,
    sourceType:input.sourceType,sourceRef:nonBlank(input.sourceRef,'INTAKE_SOURCE_REF_REQUIRED'),dataPackVersion:nonBlank(input.dataPackVersion,'DATA_PACK_VERSION_REQUIRED'),
    state:'CREATED' as const,createdAt:input.createdAt,updatedAt:input.createdAt,
  };
  return Object.freeze({...base,...(input.originatorRef?.trim()?{originatorRef:input.originatorRef.trim()}:{}),...(input.consentSetRef?.trim()?{consentSetRef:input.consentSetRef.trim()}:{}),...(input.supersedesIntakeId?.trim()?{supersedesIntakeId:input.supersedesIntakeId.trim()}: {})});
}

export function transitionCapitalPilotIntake(intake:CapitalPilotIntake,target:CapitalPilotIntakeState,at:string):CapitalPilotIntake{
  const atMs=validIsoMs(at),updatedMs=validIsoMs(intake.updatedAt);if(atMs<updatedMs)throw new Error('INTAKE_TIME_REGRESSION');
  if(intake.state===target)return intake;
  if(!INTAKE_TRANSITIONS[intake.state].includes(target))throw new Error(`INVALID_INTAKE_TRANSITION:${intake.state}:${target}`);
  return Object.freeze({...intake,state:target,updatedAt:at});
}

function gatePolicyMap(policy:ReadinessPolicy):ReadonlyMap<ReadinessGateId,ReadinessGatePolicy>{assertPolicy(policy);return new Map(policy.gates.map(g=>[g.gateId,g] as const));}

function rejectAll(evidence:ReadinessEvidenceRef,reason:string,freshness:ReadinessEvidenceFreshness):readonly EvidenceGateDecision[]{
  return freezeArray([...evidence.gateIds].sort().map(gateId=>Object.freeze({gateId,accepted:false,freshness,rejectionReason:reason})));
}

function evidenceTimeState(observedAt:string,asOfMs:number,maxAgeSeconds?:number):Readonly<{freshness:ReadinessEvidenceFreshness;reason?:string}>{
  const observedMs=Date.parse(observedAt);
  if(!Number.isFinite(observedMs))return Object.freeze({freshness:'INVALID',reason:'INVALID_EVIDENCE_TIME'});
  if(observedMs>asOfMs)return Object.freeze({freshness:'FUTURE',reason:'EVIDENCE_FROM_FUTURE'});
  if(maxAgeSeconds!==undefined&&asOfMs-observedMs>maxAgeSeconds*1000)return Object.freeze({freshness:'STALE',reason:'STALE_EVIDENCE'});
  return Object.freeze({freshness:'FRESH'});
}

export interface BuildEvidenceManifestInput{project:InvestmentProject;policy:ReadinessPolicy;evidence:readonly ReadinessEvidenceRef[];asOf:string;}

export function buildEvidenceManifest(input:BuildEvidenceManifestInput,sha256:Sha256Hex):EvidenceManifest{
  const asOfMs=validIsoMs(input.asOf),policies=gatePolicyMap(input.policy),seenEvidence=new Set<string>();
  const sorted=[...input.evidence].sort((a,b)=>a.evidenceRef.localeCompare(b.evidenceRef));
  const items:EvidenceManifestItem[]=sorted.map(evidence=>{
    const evidenceRef=nonBlank(evidence.evidenceRef,'READINESS_EVIDENCE_REF_REQUIRED');
    if(seenEvidence.has(evidenceRef))throw new Error('DUPLICATE_READINESS_EVIDENCE_REF');seenEvidence.add(evidenceRef);
    nonBlank(evidence.role,'READINESS_EVIDENCE_ROLE_REQUIRED');
    assertBps(evidence.confidenceBps,'INVALID_EVIDENCE_CONFIDENCE_BPS');
    if(evidence.gateIds.length===0)throw new Error('READINESS_EVIDENCE_GATE_REQUIRED');
    const gateIds=[...new Set(evidence.gateIds)].sort();if(gateIds.length!==evidence.gateIds.length)throw new Error('DUPLICATE_EVIDENCE_GATE');
    for(const gateId of gateIds)if(!policies.has(gateId))throw new Error(`EVIDENCE_UNKNOWN_GATE:${gateId}`);
    let decisions:readonly EvidenceGateDecision[];
    if(evidence.tenantId!==input.project.tenantId)decisions=rejectAll(evidence,'TENANT_SCOPE_MISMATCH','INVALID');
    else if(evidence.projectId!==input.project.projectId)decisions=rejectAll(evidence,'PROJECT_SCOPE_MISMATCH','INVALID');
    else if(!evidence.provenanceRef.trim())decisions=rejectAll(evidence,'MISSING_PROVENANCE','INVALID');
    else if(!SHA256.test(evidence.digestSha256))decisions=rejectAll(evidence,'INVALID_EVIDENCE_DIGEST','INVALID');
    else decisions=freezeArray(gateIds.map(gateId=>{
      const gate=policies.get(gateId)!;
      const time=evidenceTimeState(evidence.observedAt,asOfMs,gate.maxEvidenceAgeSeconds);
      if(time.reason)return Object.freeze({gateId,accepted:false,freshness:time.freshness,rejectionReason:time.reason});
      if(!gate.acceptedQualities.includes(evidence.quality))return Object.freeze({gateId,accepted:false,freshness:'FRESH' as const,rejectionReason:'EVIDENCE_QUALITY_NOT_ACCEPTED'});
      if(evidence.confidenceBps<gate.minimumConfidenceBps)return Object.freeze({gateId,accepted:false,freshness:'FRESH' as const,rejectionReason:'EVIDENCE_CONFIDENCE_BELOW_GATE_MINIMUM'});
      return Object.freeze({gateId,accepted:true,freshness:'FRESH' as const});
    }));
    return Object.freeze({evidenceRef,role:evidence.role.trim(),confidenceBps:evidence.confidenceBps,gateDecisions:decisions});
  });

  const coverageByGate:GateEvidenceCoverage[]=READINESS_GATE_IDS.map(gateId=>{
    const policy=policies.get(gateId)!;
    const acceptedItems=items.filter(item=>item.gateDecisions.some(d=>d.gateId===gateId&&d.accepted));
    const roles=new Set(acceptedItems.map(item=>item.role));
    const required=policy.requiredEvidenceRoles;
    const satisfied=required.filter(role=>roles.has(role)).length;
    return Object.freeze({gateId,requiredRoleCount:required.length,satisfiedRoleCount:satisfied,acceptedEvidenceCount:acceptedItems.length,coverageBps:clampBps(satisfied,required.length)});
  });
  const totalRequired=coverageByGate.reduce((n,g)=>n+g.requiredRoleCount,0);
  const totalSatisfied=coverageByGate.reduce((n,g)=>n+g.satisfiedRoleCount,0);
  const totalCoverageBps=clampBps(totalSatisfied,totalRequired);
  const acceptedEvidenceRefs=uniqueSorted(items.filter(item=>item.gateDecisions.some(d=>d.accepted)).map(item=>item.evidenceRef));
  const rejectedEvidenceRefs=uniqueSorted(items.filter(item=>item.gateDecisions.every(d=>!d.accepted)).map(item=>item.evidenceRef));
  const limitations=uniqueSorted(items.flatMap(item=>item.gateDecisions.filter(d=>!d.accepted&&d.rejectionReason).map(d=>`${d.gateId}:${d.rejectionReason}`)));
  const core={tenantId:input.project.tenantId,projectId:input.project.projectId,policyVersion:input.policy.policyVersion,asOf:input.asOf,items,acceptedEvidenceRefs,rejectedEvidenceRefs,coverageByGate,totalCoverageBps,limitations};
  const digestSha256=digestOf(core,sha256);
  return Object.freeze({...core,items:freezeArray(items),acceptedEvidenceRefs,rejectedEvidenceRefs,coverageByGate:freezeArray(coverageByGate),limitations,manifestId:`readiness-manifest:${input.project.projectId}:${digestSha256.slice(0,16)}`,digestSha256});
}

function gapId(projectId:string,assessmentVersion:number,gateId:ReadinessGateId,code:string):string{return `readiness-gap:${projectId}:v${assessmentVersion}:${gateId}:${code}`;}
function makeGap(project:InvestmentProject,assessmentVersion:number,gateId:ReadinessGateId,code:string,description:string,blocking:boolean,requiredEvidenceRoles:readonly string[],asOf:string):ReadinessGap{
  const normalized=nonBlank(code,'READINESS_GAP_CODE_REQUIRED').replace(/[^A-Z0-9_:-]/gi,'_').toUpperCase();
  return Object.freeze({gapId:gapId(project.projectId,assessmentVersion,gateId,normalized),tenantId:project.tenantId,projectId:project.projectId,assessmentVersion,gateId,code:normalized,severity:blocking?'CRITICAL':'WARNING',blocking,state:'OPEN',description,sourceRef:`gate:${gateId}`,requiredEvidenceRoles:freezeArray(uniqueSorted(requiredEvidenceRoles)),resolutionEvidenceRefs:Object.freeze([]),openedAt:asOf});
}

export interface EvaluateReadinessGatesInput{project:InvestmentProject;policy:ReadinessPolicy;manifest:EvidenceManifest;assessmentVersion:number;signals?:readonly ReadinessGateSignal[];assessedAt:string;assessedBy:string;}

export function evaluateReadinessGates(input:EvaluateReadinessGatesInput):GateEvaluationResult{
  validIsoMs(input.assessedAt);assertPositiveInteger(input.assessmentVersion,'INVALID_ASSESSMENT_VERSION');nonBlank(input.assessedBy,'READINESS_ASSESSOR_REQUIRED');sameProjectScope(input.project,input.manifest.tenantId,input.manifest.projectId);
  if(input.manifest.policyVersion!==input.policy.policyVersion)throw new Error('READINESS_MANIFEST_POLICY_MISMATCH');
  const policies=gatePolicyMap(input.policy),signalMap=new Map<ReadinessGateId,ReadinessGateSignal>();
  for(const signal of input.signals??[]){if(signalMap.has(signal.gateId))throw new Error('DUPLICATE_READINESS_GATE_SIGNAL');signalMap.set(signal.gateId,signal);}
  const gaps:ReadinessGap[]=[];const assessments:ReadinessGateAssessment[]=[];
  for(const gateId of READINESS_GATE_IDS){
    const policy=policies.get(gateId)!,signal=signalMap.get(gateId),coverage=input.manifest.coverageByGate.find(g=>g.gateId===gateId);
    if(!coverage)throw new Error(`READINESS_COVERAGE_MISSING:${gateId}`);
    if(signal?.applicable===false){
      if(!policy.allowNotApplicable)throw new Error(`READINESS_GATE_NOT_APPLICABLE_FORBIDDEN:${gateId}`);
      assessments.push(Object.freeze({gateId,result:'NOT_APPLICABLE',rationale:signal.rationale?.trim()||'Gate marked not applicable by explicit assessment signal.',evidenceRefs:Object.freeze([]),confidenceBps:BPS_MAX,blockingGapRefs:Object.freeze([]),conditionGapRefs:Object.freeze([]),assessedAt:input.assessedAt,assessedBy:input.assessedBy,methodVersion:input.policy.methodologyVersion}));
      continue;
    }
    const acceptedItems=input.manifest.items.filter(item=>item.gateDecisions.some(d=>d.gateId===gateId&&d.accepted));
    const acceptedRoles=new Set(acceptedItems.map(item=>item.role));
    const missingRoles=policy.requiredEvidenceRoles.filter(role=>!acceptedRoles.has(role));
    const blockingCodes=uniqueSorted(signal?.blockerCodes??[]),conditionCodes=uniqueSorted(signal?.conditionCodes??[]);
    const gateGaps:ReadinessGap[]=[];
    if(missingRoles.length>0||coverage.acceptedEvidenceCount<policy.minimumAcceptedEvidence){
      const blocking=policy.missingEvidenceIsBlocking;
      const code=missingRoles.length?`MISSING_EVIDENCE_${missingRoles.join('_')}`:'MINIMUM_EVIDENCE_NOT_MET';
      gateGaps.push(makeGap(input.project,input.assessmentVersion,gateId,code,`Required readiness evidence is incomplete for ${gateId}.`,blocking,missingRoles,input.assessedAt));
    }
    for(const code of blockingCodes)gateGaps.push(makeGap(input.project,input.assessmentVersion,gateId,code,signal?.rationale?.trim()||`Blocking readiness condition ${code}.`,true,[],input.assessedAt));
    for(const code of conditionCodes)gateGaps.push(makeGap(input.project,input.assessmentVersion,gateId,code,signal?.rationale?.trim()||`Readiness condition ${code}.`,false,[],input.assessedAt));
    gaps.push(...gateGaps);
    const blockingGapRefs=gateGaps.filter(g=>g.blocking).map(g=>g.gapId).sort();
    const conditionGapRefs=gateGaps.filter(g=>!g.blocking).map(g=>g.gapId).sort();
    let result:ReadinessGateAssessment['result'];
    if(blockingGapRefs.length>0)result='BLOCKED';
    else if(missingRoles.length>0||coverage.acceptedEvidenceCount<policy.minimumAcceptedEvidence)result='INCOMPLETE';
    else if(conditionGapRefs.length>0)result='PASS_WITH_CONDITIONS';
    else result='PASS';
    const confidenceBps=acceptedItems.length===0?0:Math.round(acceptedItems.reduce((n,item)=>n+item.confidenceBps,0)/acceptedItems.length);
    const rationale=signal?.rationale?.trim()||`${gateId} evaluated from accepted evidence under policy ${input.policy.policyVersion}.`;
    assessments.push(Object.freeze({gateId,result,rationale,evidenceRefs:freezeArray(acceptedItems.map(i=>i.evidenceRef).sort()),confidenceBps,blockingGapRefs:freezeArray(blockingGapRefs),conditionGapRefs:freezeArray(conditionGapRefs),assessedAt:input.assessedAt,assessedBy:input.assessedBy,methodVersion:input.policy.methodologyVersion}));
  }
  return Object.freeze({assessments:freezeArray(assessments),gaps:freezeArray(gaps.sort((a,b)=>a.gapId.localeCompare(b.gapId)))});
}

function severityRank(severity:RiskSeverity):number{return severity==='CRITICAL'?4:severity==='HIGH'?3:severity==='MEDIUM'?2:1;}
function riskStateFrom(unresolved:readonly InvestmentRisk[],hasEvidence:boolean):ProductiveRiskDimensionState{
  if(unresolved.length===0)return hasEvidence?'FAVORABLE':'INDETERMINATE';
  const max=Math.max(...unresolved.map(r=>severityRank(r.severity)));
  if(max>=4)return 'CRITICAL';if(max>=3)return 'LIMITING';return 'WATCH';
}

export function buildProductiveRiskProfile(input:BuildProductiveRiskProfileInput,sha256:Sha256Hex):ProductiveRiskProfile{
  validIsoMs(input.asOf);
  const riskById=new Map(input.risks.map(risk=>{
    if(risk.tenantId!==input.project.tenantId||risk.projectId!==input.project.projectId)throw new Error('RISK_PROFILE_SCOPE_MISMATCH');
    return [risk.riskId,risk] as const;
  }));
  if(input.dimensions.length!==PRODUCTIVE_RISK_DIMENSIONS.length)throw new Error('PRODUCTIVE_RISK_DIMENSION_COUNT_INVALID');
  const seen=new Set<ProductiveRiskDimensionId>();
  const dimensions:ProductiveRiskDimension[]=input.dimensions.map(dimension=>{
    if(seen.has(dimension.dimension))throw new Error('DUPLICATE_PRODUCTIVE_RISK_DIMENSION');seen.add(dimension.dimension);assertBps(dimension.confidenceBps,'INVALID_RISK_DIMENSION_CONFIDENCE_BPS');
    const riskRefs=uniqueSorted(dimension.riskRefs);
    const risks=riskRefs.map(ref=>{const risk=riskById.get(ref);if(!risk)throw new Error(`RISK_PROFILE_UNKNOWN_RISK:${ref}`);return risk;});
    const unresolved=risks.filter(r=>r.state==='OPEN'||r.state==='ACCEPTED');
    return Object.freeze({dimension:dimension.dimension,state:riskStateFrom(unresolved,dimension.evidenceRefs.length>0),trend:dimension.trend??'UNKNOWN',evidenceRefs:freezeArray(uniqueSorted(dimension.evidenceRefs)),confidenceBps:dimension.confidenceBps,principalDrivers:freezeArray(uniqueSorted(dimension.principalDrivers)),mitigations:freezeArray(uniqueSorted(dimension.mitigations)),unresolvedRiskRefs:freezeArray(unresolved.map(r=>r.riskId).sort())});
  });
  for(const dimension of PRODUCTIVE_RISK_DIMENSIONS)if(!seen.has(dimension))throw new Error(`PRODUCTIVE_RISK_DIMENSION_MISSING:${dimension}`);
  dimensions.sort((a,b)=>PRODUCTIVE_RISK_DIMENSIONS.indexOf(a.dimension)-PRODUCTIVE_RISK_DIMENSIONS.indexOf(b.dimension));
  const openCriticalRiskRefs=uniqueSorted(input.risks.filter(r=>(r.state==='OPEN'||r.state==='ACCEPTED')&&r.severity==='CRITICAL').map(r=>r.riskId));
  const limitations=uniqueSorted(dimensions.filter(d=>d.state==='INDETERMINATE').map(d=>`INDETERMINATE:${d.dimension}`));
  const core={tenantId:input.project.tenantId,projectId:input.project.projectId,asOf:input.asOf,dimensions,openCriticalRiskRefs,limitations};
  const digestSha256=digestOf(core,sha256);
  return Object.freeze({...core,dimensions:freezeArray(dimensions),openCriticalRiskRefs,limitations,profileId:`productive-risk:${input.project.projectId}:${digestSha256.slice(0,16)}`,digestSha256});
}

export function deterministicMaximumReadinessDecision(policy:ReadinessPolicy,manifest:EvidenceManifest,evaluation:GateEvaluationResult,riskProfile:ProductiveRiskProfile):Exclude<ReadinessDecision,'REASSESSMENT_REQUIRED'>{
  assertPolicy(policy);
  if(manifest.policyVersion!==policy.policyVersion)throw new Error('READINESS_MANIFEST_POLICY_MISMATCH');
  if(manifest.totalCoverageBps<policy.minimumTotalCoverageBps)return 'NOT_CAPITAL_READY';
  if(riskProfile.openCriticalRiskRefs.length>0)return 'NOT_CAPITAL_READY';
  const activeBlocking=evaluation.gaps.some(g=>g.blocking&&!['RESOLVED','WAIVED','SUPERSEDED'].includes(g.state));
  if(activeBlocking)return 'NOT_CAPITAL_READY';
  if(evaluation.assessments.some(g=>g.result==='BLOCKED'||g.result==='INCOMPLETE'))return 'NOT_CAPITAL_READY';
  if(evaluation.assessments.some(g=>g.result==='PASS_WITH_CONDITIONS')||evaluation.gaps.some(g=>!g.blocking&&!['RESOLVED','SUPERSEDED'].includes(g.state)))return 'CAPITAL_READY_WITH_CONDITIONS';
  return 'CAPITAL_READY';
}

function decisionRank(decision:ReadinessDecision):number{return decision==='CAPITAL_READY'?3:decision==='CAPITAL_READY_WITH_CONDITIONS'?2:0;}
function assertRequestedDecisionAllowed(maximum:Exclude<ReadinessDecision,'REASSESSMENT_REQUIRED'>,requested:ReadinessDecision):void{
  if(requested==='REASSESSMENT_REQUIRED'||requested==='NOT_CAPITAL_READY')return;
  if(decisionRank(requested)>decisionRank(maximum))throw new Error('DECISION_EXCEEDS_DETERMINISTIC_READINESS');
}

export function buildReadinessAssessment(input:BuildReadinessAssessmentInput,sha256:Sha256Hex):ReadinessAssessment{
  validIsoMs(input.reviewedAt);assertPositiveInteger(input.assessmentVersion,'INVALID_ASSESSMENT_VERSION');sameProjectScope(input.project,input.intake.tenantId,input.intake.projectId);sameProjectScope(input.project,input.manifest.tenantId,input.manifest.projectId);sameProjectScope(input.project,input.riskProfile.tenantId,input.riskProfile.projectId);
  if(input.intake.intakeVersion<=0)throw new Error('INVALID_INTAKE_VERSION');
  if(input.manifest.policyVersion!==input.policy.policyVersion)throw new Error('READINESS_MANIFEST_POLICY_MISMATCH');
  if(input.gateEvaluation.assessments.length!==READINESS_GATE_IDS.length)throw new Error('READINESS_ASSESSMENT_REQUIRES_ALL_GATES');
  const gateIds=input.gateEvaluation.assessments.map(g=>g.gateId);if(new Set(gateIds).size!==READINESS_GATE_IDS.length)throw new Error('READINESS_ASSESSMENT_GATE_DUPLICATE_OR_MISSING');
  nonBlank(input.assessmentId,'READINESS_ASSESSMENT_ID_REQUIRED');nonBlank(input.projectSnapshotRef,'PROJECT_SNAPSHOT_REF_REQUIRED');nonBlank(input.reviewerRef,'READINESS_REVIEWER_REQUIRED');nonBlank(input.rationale,'READINESS_RATIONALE_REQUIRED');
  assertDigest(input.manifest.digestSha256,'INVALID_MANIFEST_DIGEST');assertDigest(input.riskProfile.digestSha256,'INVALID_RISK_PROFILE_DIGEST');
  const deterministicMaximumDecision=deterministicMaximumReadinessDecision(input.policy,input.manifest,input.gateEvaluation,input.riskProfile);assertRequestedDecisionAllowed(deterministicMaximumDecision,input.requestedDecision);
  const blockingGapRefs=uniqueSorted(input.gateEvaluation.gaps.filter(g=>g.blocking&&!['RESOLVED','WAIVED','SUPERSEDED'].includes(g.state)).map(g=>g.gapId));
  const conditionGapRefs=uniqueSorted(input.gateEvaluation.gaps.filter(g=>!g.blocking&&!['RESOLVED','SUPERSEDED'].includes(g.state)).map(g=>g.gapId));
  if(input.requestedDecision==='CAPITAL_READY'&&blockingGapRefs.length>0)throw new Error('CAPITAL_READY_WITH_BLOCKING_GAP_FORBIDDEN');
  const core={assessmentId:input.assessmentId.trim(),tenantId:input.project.tenantId,projectId:input.project.projectId,version:input.assessmentVersion,intakeId:input.intake.intakeId,intakeVersion:input.intake.intakeVersion,policyVersion:input.policy.policyVersion,methodologyVersion:input.policy.methodologyVersion,projectSnapshotRef:input.projectSnapshotRef.trim(),...(input.project.approvedBudgetVersion!==undefined?{approvedBudgetVersion:input.project.approvedBudgetVersion}:{}),evidenceManifestDigestSha256:input.manifest.digestSha256,riskProfileDigestSha256:input.riskProfile.digestSha256,gates:freezeArray([...input.gateEvaluation.assessments]),blockingGapRefs,conditionGapRefs,evidenceCoverageBps:input.manifest.totalCoverageBps,decision:input.requestedDecision,deterministicMaximumDecision,rationale:input.rationale.trim(),reviewerRef:input.reviewerRef.trim(),reviewedAt:input.reviewedAt};
  const digestSha256=digestOf(core,sha256);
  return Object.freeze({...core,digestSha256});
}

export function buildCapitalReadinessPackage(input:BuildCapitalReadinessPackageInput,sha256:Sha256Hex):CapitalReadinessPackage{
  validIsoMs(input.generatedAt);sameProjectScope(input.project,input.assessment.tenantId,input.assessment.projectId);sameProjectScope(input.project,input.manifest.tenantId,input.manifest.projectId);sameProjectScope(input.project,input.riskProfile.tenantId,input.riskProfile.projectId);
  if(input.assessment.evidenceManifestDigestSha256!==input.manifest.digestSha256)throw new Error('READINESS_PACKAGE_MANIFEST_DIGEST_MISMATCH');
  if(input.assessment.riskProfileDigestSha256!==input.riskProfile.digestSha256)throw new Error('READINESS_PACKAGE_RISK_DIGEST_MISMATCH');
  const gapIds=new Set(input.gaps.map(g=>{if(g.tenantId!==input.project.tenantId||g.projectId!==input.project.projectId)throw new Error('READINESS_PACKAGE_GAP_SCOPE_MISMATCH');return g.gapId;}));
  for(const ref of [...input.assessment.blockingGapRefs,...input.assessment.conditionGapRefs])if(!gapIds.has(ref))throw new Error(`READINESS_PACKAGE_GAP_MISSING:${ref}`);
  if(input.assessment.decision==='CAPITAL_READY'&&input.assessment.blockingGapRefs.length>0)throw new Error('CAPITAL_READY_WITH_BLOCKING_GAP_FORBIDDEN');
  const openConditionGapRefs=uniqueSorted(input.gaps.filter(g=>!g.blocking&&!['RESOLVED','SUPERSEDED'].includes(g.state)).map(g=>g.gapId));
  const limitations=uniqueSorted([
    ...input.manifest.limitations,...input.riskProfile.limitations,
    'CAPITAL_READY_IS_NOT_FINANCING_APPROVAL',
    'NO_RETURN_OR_REPAYMENT_GUARANTEE',
    'NO_CUSTODY_OR_DISBURSEMENT_AUTHORITY',
  ]);
  const provenanceRefs=uniqueSorted(input.provenanceRefs);if(provenanceRefs.length===0)throw new Error('READINESS_PACKAGE_PROVENANCE_REQUIRED');
  const core={tenantId:input.project.tenantId,projectId:input.project.projectId,assessmentId:input.assessment.assessmentId,assessmentVersion:input.assessment.version,generatedAt:input.generatedAt,decision:input.assessment.decision,projectState:input.project.state,projectEligibility:input.project.eligibility,productionRef:input.project.productionRef,currency:input.project.currency,requiredMinor:input.project.requiredMinor,...(input.project.approvedBudgetVersion!==undefined?{approvedBudgetVersion:input.project.approvedBudgetVersion}:{}),evidenceManifestDigestSha256:input.manifest.digestSha256,riskProfileDigestSha256:input.riskProfile.digestSha256,gateAssessments:freezeArray([...input.assessment.gates]),openConditionGapRefs,limitations,provenanceRefs,financialAuthority:'READINESS_ONLY_NO_FINANCING_APPROVAL' as const};
  const digestSha256=digestOf(core,sha256);
  return Object.freeze({...core,packageId:`capital-readiness:${input.project.projectId}:v${input.assessment.version}:${digestSha256.slice(0,16)}`,digestSha256});
}

export const CAPITAL_READINESS_AUTHORITY_BOUNDARY=Object.freeze({
  mutatesInvestmentEligibility:false,
  mutatesInvestmentProjectState:false,
  financialApproval:false,
  investmentRecommendation:false,
  custody:false,
  paymentExecution:false,
  disbursementAuthority:false,
  aiRequired:false,
  finalReadinessRequiresHumanReviewer:true,
});
