import type {
  CapitalReadinessPackage,
  ControlTowerException,
  EvidenceManifest,
  ProductiveRiskDimension,
  ProductiveRiskDimensionId,
  ProductiveRiskProfile,
  ReadinessGateAssessment,
  ReadinessGateId,
  ReadinessGap,
} from '@agroway/invest-control-contracts';

const SHA256=/^[a-f0-9]{64}$/;
const GATE_ORDER:readonly ReadinessGateId[]=['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'] as const;
const RISK_ORDER:readonly ProductiveRiskDimensionId[]=['PRODUCER','OPERATION','AGRONOMY','DATA','FINANCIAL','MARKET','CLIMATE','TRACEABILITY','MANAGEMENT'] as const;
const ACTIVE_GAP_STATES=new Set(['OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED']);

export interface CapitalReadinessGateView {
  gateId:ReadinessGateId;
  result:ReadinessGateAssessment['result'];
  confidenceBps:number;
  evidenceCount:number;
  blockingGapCount:number;
  conditionGapCount:number;
  rationale:string;
}

export interface CapitalReadinessGapView {
  gapId:string;
  gateId:ReadinessGateId;
  code:string;
  severity:ReadinessGap['severity'];
  blocking:boolean;
  state:ReadinessGap['state'];
  description:string;
  ownerRef?:string;
  dueAt?:string;
}

export interface CapitalReadinessRiskView {
  dimension:ProductiveRiskDimensionId;
  state:ProductiveRiskDimension['state'];
  trend:ProductiveRiskDimension['trend'];
  confidenceBps:number;
  principalDrivers:readonly string[];
  mitigations:readonly string[];
  unresolvedRiskCount:number;
}

export interface CapitalReadinessExceptionView {
  exceptionId:string;
  code:string;
  severity:ControlTowerException['severity'];
  state:ControlTowerException['state'];
  reason:string;
  updatedAt:string;
}

export interface CapitalReadinessControlModel {
  model:'CAPITAL_READINESS_CONTROL_READ_ONLY';
  tenantId:string;
  projectId:string;
  assessmentId:string;
  assessmentVersion:number;
  assessmentDigestSha256:string;
  policyVersion:string;
  methodologyVersion:string;
  projectSnapshotRef:string;
  generatedAt:string;
  decision:CapitalReadinessPackage['decision'];
  decisionLabel:string;
  evidence:Readonly<{
    coverageBps:number;
    acceptedCount:number;
    rejectedCount:number;
    manifestDigestSha256:string;
  }>;
  gates:readonly CapitalReadinessGateView[];
  activeBlockingGaps:readonly CapitalReadinessGapView[];
  activeConditions:readonly CapitalReadinessGapView[];
  closedGaps:readonly CapitalReadinessGapView[];
  risks:readonly CapitalReadinessRiskView[];
  openCriticalRiskCount:number;
  exceptions:readonly CapitalReadinessExceptionView[];
  limitations:readonly string[];
  provenanceRefs:readonly string[];
  trust:Readonly<{
    readOnly:true;
    canonicalMutationAvailable:false;
    financialMutationAvailable:false;
    aiAuthority:'ADVISORY_ONLY';
    financialAuthority:'READINESS_ONLY_NO_FINANCING_APPROVAL';
    financingApproval:false;
    investmentRecommendation:false;
    disbursementAuthority:false;
    returnGuarantee:false;
  }>;
}

export interface BuildCapitalReadinessControlModelInput {
  package:CapitalReadinessPackage;
  manifest:EvidenceManifest;
  riskProfile:ProductiveRiskProfile;
  gaps:readonly ReadinessGap[];
  controlExceptions:readonly ControlTowerException[];
}

function assertIso(value:string,code:string):void{if(!Number.isFinite(Date.parse(value)))throw new Error(code);}
function assertDigest(value:string,code:string):void{if(!SHA256.test(value))throw new Error(code);}
function uniqueSorted(values:readonly string[]):readonly string[]{return Object.freeze([...new Set(values.map(value=>value.trim()).filter(Boolean))].sort());}
function sameStrings(left:readonly string[],right:readonly string[]):boolean{const a=[...left].sort(),b=[...right].sort();return a.length===b.length&&a.every((value,index)=>value===b[index]);}
function activeGap(gap:ReadinessGap):boolean{return ACTIVE_GAP_STATES.has(gap.state);}
function gapView(gap:ReadinessGap):CapitalReadinessGapView{return Object.freeze({gapId:gap.gapId,gateId:gap.gateId,code:gap.code,severity:gap.severity,blocking:gap.blocking,state:gap.state,description:gap.description,...(gap.ownerRef?{ownerRef:gap.ownerRef}:{}),...(gap.dueAt?{dueAt:gap.dueAt}:{})});}
function decisionLabel(decision:CapitalReadinessPackage['decision']):string{
  if(decision==='CAPITAL_READY')return 'Capital ready under SANA readiness policy';
  if(decision==='CAPITAL_READY_WITH_CONDITIONS')return 'Capital ready with conditions under SANA readiness policy';
  if(decision==='REASSESSMENT_REQUIRED')return 'Readiness reassessment required';
  return 'Not capital ready under current SANA readiness policy';
}

function validateScope(input:BuildCapitalReadinessControlModelInput):void {
  const pkg=input.package,manifest=input.manifest,risk=input.riskProfile;
  if(manifest.tenantId!==pkg.tenantId||risk.tenantId!==pkg.tenantId)throw new Error('CAPITAL_READINESS_VIEW_TENANT_MISMATCH');
  if(manifest.projectId!==pkg.projectId||risk.projectId!==pkg.projectId)throw new Error('CAPITAL_READINESS_VIEW_PROJECT_MISMATCH');
  if(pkg.evidenceManifestDigestSha256!==manifest.digestSha256)throw new Error('CAPITAL_READINESS_VIEW_MANIFEST_DIGEST_MISMATCH');
  if(pkg.riskProfileDigestSha256!==risk.digestSha256)throw new Error('CAPITAL_READINESS_VIEW_RISK_DIGEST_MISMATCH');
  assertDigest(pkg.assessmentDigestSha256,'CAPITAL_READINESS_VIEW_ASSESSMENT_DIGEST_INVALID');
  assertDigest(pkg.digestSha256,'CAPITAL_READINESS_VIEW_PACKAGE_DIGEST_INVALID');
  assertDigest(manifest.digestSha256,'CAPITAL_READINESS_VIEW_MANIFEST_DIGEST_INVALID');
  assertDigest(risk.digestSha256,'CAPITAL_READINESS_VIEW_RISK_DIGEST_INVALID');
  assertDigest(risk.sourceRiskDigestSha256,'CAPITAL_READINESS_VIEW_SOURCE_RISK_DIGEST_INVALID');
  assertIso(pkg.generatedAt,'CAPITAL_READINESS_VIEW_GENERATED_AT_INVALID');
  assertIso(manifest.asOf,'CAPITAL_READINESS_VIEW_MANIFEST_TIME_INVALID');
  assertIso(risk.asOf,'CAPITAL_READINESS_VIEW_RISK_TIME_INVALID');
  if(Date.parse(pkg.generatedAt)<Date.parse(manifest.asOf)||Date.parse(pkg.generatedAt)<Date.parse(risk.asOf))throw new Error('CAPITAL_READINESS_VIEW_PACKAGE_PREDATES_SOURCE');
  if(!Number.isSafeInteger(pkg.assessmentVersion)||pkg.assessmentVersion<=0)throw new Error('CAPITAL_READINESS_VIEW_ASSESSMENT_VERSION_INVALID');
  if(!pkg.policyVersion.trim()||!pkg.methodologyVersion.trim()||!pkg.projectSnapshotRef.trim())throw new Error('CAPITAL_READINESS_VIEW_METHOD_CONTEXT_REQUIRED');
}

function validateGatesAndGaps(input:BuildCapitalReadinessControlModelInput):void {
  const gates=input.package.gateAssessments;
  if(gates.length!==GATE_ORDER.length||new Set(gates.map(gate=>gate.gateId)).size!==GATE_ORDER.length)throw new Error('CAPITAL_READINESS_VIEW_GATE_SET_INVALID');
  for(const gateId of GATE_ORDER)if(!gates.some(gate=>gate.gateId===gateId))throw new Error(`CAPITAL_READINESS_VIEW_GATE_MISSING:${gateId}`);
  const expectedBlocking=gates.flatMap(gate=>gate.blockingGapRefs),expectedConditions=gates.flatMap(gate=>gate.conditionGapRefs);
  if(new Set([...expectedBlocking,...expectedConditions]).size!==expectedBlocking.length+expectedConditions.length)throw new Error('CAPITAL_READINESS_VIEW_DUPLICATE_GATE_GAP_REF');
  const seen=new Set<string>();
  for(const gap of input.gaps){
    if(seen.has(gap.gapId))throw new Error('CAPITAL_READINESS_VIEW_DUPLICATE_GAP');seen.add(gap.gapId);
    if(gap.tenantId!==input.package.tenantId||gap.projectId!==input.package.projectId)throw new Error('CAPITAL_READINESS_VIEW_GAP_SCOPE_MISMATCH');
    if(gap.assessmentVersion!==input.package.assessmentVersion)throw new Error('CAPITAL_READINESS_VIEW_GAP_VERSION_MISMATCH');
    const blocking=expectedBlocking.includes(gap.gapId),condition=expectedConditions.includes(gap.gapId);
    if(!blocking&&!condition)throw new Error('CAPITAL_READINESS_VIEW_UNREFERENCED_GAP');
    if(gap.blocking!==blocking||gap.blocking===condition)throw new Error('CAPITAL_READINESS_VIEW_GAP_CLASSIFICATION_MISMATCH');
  }
  if(!sameStrings([...seen],[...expectedBlocking,...expectedConditions]))throw new Error('CAPITAL_READINESS_VIEW_GAP_SET_MISMATCH');
  const activeConditions=input.gaps.filter(gap=>!gap.blocking&&activeGap(gap)).map(gap=>gap.gapId);
  if(!sameStrings(activeConditions,input.package.openConditionGapRefs))throw new Error('CAPITAL_READINESS_VIEW_OPEN_CONDITION_SET_MISMATCH');
  const activeBlocking=input.gaps.filter(gap=>gap.blocking&&activeGap(gap));
  if(input.package.decision==='CAPITAL_READY'&&(activeBlocking.length>0||activeConditions.length>0))throw new Error('CAPITAL_READINESS_VIEW_READY_WITH_ACTIVE_GAP');
  if(input.package.decision==='CAPITAL_READY_WITH_CONDITIONS'&&(activeBlocking.length>0||activeConditions.length===0))throw new Error('CAPITAL_READINESS_VIEW_CONDITIONAL_DECISION_INCONSISTENT');
}

function orderedRiskDimensions(profile:ProductiveRiskProfile):readonly ProductiveRiskDimension[] {
  if(profile.dimensions.length!==RISK_ORDER.length||new Set(profile.dimensions.map(item=>item.dimension)).size!==RISK_ORDER.length)throw new Error('CAPITAL_READINESS_VIEW_RISK_VECTOR_INVALID');
  for(const dimension of RISK_ORDER)if(!profile.dimensions.some(item=>item.dimension===dimension))throw new Error(`CAPITAL_READINESS_VIEW_RISK_DIMENSION_MISSING:${dimension}`);
  return Object.freeze(RISK_ORDER.map(dimension=>profile.dimensions.find(item=>item.dimension===dimension)!));
}

function projectExceptions(input:BuildCapitalReadinessControlModelInput):readonly CapitalReadinessExceptionView[] {
  const subjectRef=`project:${input.package.projectId}`;
  const scoped=input.controlExceptions.filter(item=>item.code.startsWith('CAPITAL_READINESS_')&&item.subjectRef===subjectRef);
  for(const item of scoped){
    if(item.tenantId!==input.package.tenantId)throw new Error('CAPITAL_READINESS_VIEW_EXCEPTION_TENANT_MISMATCH');
    assertIso(item.updatedAt,'CAPITAL_READINESS_VIEW_EXCEPTION_TIME_INVALID');
  }
  return Object.freeze([...scoped].sort((a,b)=>a.code.localeCompare(b.code)||a.exceptionId.localeCompare(b.exceptionId)).map(item=>Object.freeze({exceptionId:item.exceptionId,code:item.code,severity:item.severity,state:item.state,reason:item.reason,updatedAt:item.updatedAt})));
}

export function buildCapitalReadinessControlModel(input:BuildCapitalReadinessControlModelInput):CapitalReadinessControlModel {
  validateScope(input);validateGatesAndGaps(input);
  const riskDimensions=orderedRiskDimensions(input.riskProfile);
  const gates=Object.freeze(GATE_ORDER.map(gateId=>{
    const gate=input.package.gateAssessments.find(item=>item.gateId===gateId)!;
    return Object.freeze({gateId,result:gate.result,confidenceBps:gate.confidenceBps,evidenceCount:gate.evidenceRefs.length,blockingGapCount:gate.blockingGapRefs.length,conditionGapCount:gate.conditionGapRefs.length,rationale:gate.rationale});
  }));
  const sortedGaps=[...input.gaps].sort((a,b)=>GATE_ORDER.indexOf(a.gateId)-GATE_ORDER.indexOf(b.gateId)||a.code.localeCompare(b.code)||a.gapId.localeCompare(b.gapId));
  const activeBlockingGaps=Object.freeze(sortedGaps.filter(gap=>gap.blocking&&activeGap(gap)).map(gapView));
  const activeConditions=Object.freeze(sortedGaps.filter(gap=>!gap.blocking&&activeGap(gap)).map(gapView));
  const closedGaps=Object.freeze(sortedGaps.filter(gap=>!activeGap(gap)).map(gapView));
  const risks=Object.freeze(riskDimensions.map(item=>Object.freeze({dimension:item.dimension,state:item.state,trend:item.trend,confidenceBps:item.confidenceBps,principalDrivers:Object.freeze([...item.principalDrivers]),mitigations:Object.freeze([...item.mitigations]),unresolvedRiskCount:item.unresolvedRiskRefs.length})));
  return Object.freeze({
    model:'CAPITAL_READINESS_CONTROL_READ_ONLY',tenantId:input.package.tenantId,projectId:input.package.projectId,assessmentId:input.package.assessmentId,assessmentVersion:input.package.assessmentVersion,
    assessmentDigestSha256:input.package.assessmentDigestSha256,policyVersion:input.package.policyVersion,methodologyVersion:input.package.methodologyVersion,projectSnapshotRef:input.package.projectSnapshotRef,generatedAt:input.package.generatedAt,
    decision:input.package.decision,decisionLabel:decisionLabel(input.package.decision),
    evidence:Object.freeze({coverageBps:input.manifest.totalCoverageBps,acceptedCount:input.manifest.acceptedEvidenceRefs.length,rejectedCount:input.manifest.rejectedEvidenceRefs.length,manifestDigestSha256:input.manifest.digestSha256}),
    gates,activeBlockingGaps,activeConditions,closedGaps,risks,openCriticalRiskCount:input.riskProfile.openCriticalRiskRefs.length,exceptions:projectExceptions(input),
    limitations:uniqueSorted([...input.package.limitations,...input.manifest.limitations,...input.riskProfile.limitations]),provenanceRefs:uniqueSorted(input.package.provenanceRefs),
    trust:Object.freeze({readOnly:true,canonicalMutationAvailable:false,financialMutationAvailable:false,aiAuthority:'ADVISORY_ONLY',financialAuthority:'READINESS_ONLY_NO_FINANCING_APPROVAL',financingApproval:false,investmentRecommendation:false,disbursementAuthority:false,returnGuarantee:false}),
  });
}
