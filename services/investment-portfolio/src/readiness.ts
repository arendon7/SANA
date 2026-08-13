import type {
  CapitalPilotIntake,
  CapitalPilotIntakeState,
  IntakeSourceType,
  InvestmentProject,
  ProductiveRiskDimensionId,
  ReadinessGateId,
} from '@agroway/invest-control-contracts';

export const READINESS_GATE_IDS:readonly ReadinessGateId[]=[
  'G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE',
] as const;

export const PRODUCTIVE_RISK_DIMENSIONS:readonly ProductiveRiskDimensionId[]=[
  'PRODUCER','OPERATION','AGRONOMY','DATA','FINANCIAL','MARKET','CLIMATE','TRACEABILITY','MANAGEMENT',
] as const;

const INTAKE_SOURCE_TYPES:readonly IntakeSourceType[]=[
  'PRODUCER_DIRECT','SANA_DIAGNOSTIC','OFFTAKER','FINANCIAL_PARTNER','COOPERATION_PROGRAM','PUBLIC_PROGRAM','INTERNAL_PIPELINE',
] as const;

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
  REASSESSMENT_REQUIRED:['DATA_COMPLETION','EVIDENCE_VALIDATION','UNDER_ASSESSMENT','PAUSED','WITHDRAWN'],
  PAUSED:['WITHDRAWN'],
  WITHDRAWN:[],
};

function nonBlank(value:string,code:string):string{
  const normalized=value.trim();
  if(!normalized)throw new Error(code);
  return normalized;
}

function validIsoMs(value:string):number{
  const ms=Date.parse(value);
  if(!Number.isFinite(ms))throw new Error('INVALID_ISO_DATETIME');
  return ms;
}

function positiveInteger(value:number,code:string):number{
  if(!Number.isSafeInteger(value)||value<=0)throw new Error(code);
  return value;
}

export interface CreateCapitalPilotIntakeInput{
  intakeId:string;
  project:InvestmentProject;
  intakeVersion:number;
  sourceType:IntakeSourceType;
  sourceRef:string;
  originatorRef?:string;
  consentSetRef?:string;
  dataPackVersion:string;
  createdAt:string;
  supersedesIntakeId?:string;
}

export function createCapitalPilotIntake(input:CreateCapitalPilotIntakeInput):CapitalPilotIntake{
  validIsoMs(input.createdAt);
  positiveInteger(input.intakeVersion,'INVALID_INTAKE_VERSION');
  if(!INTAKE_SOURCE_TYPES.includes(input.sourceType))throw new Error('INVALID_INTAKE_SOURCE_TYPE');
  nonBlank(input.project.tenantId,'PROJECT_TENANT_REQUIRED');
  nonBlank(input.project.projectId,'PROJECT_ID_REQUIRED');
  const base={
    intakeId:nonBlank(input.intakeId,'INTAKE_ID_REQUIRED'),
    tenantId:input.project.tenantId,
    projectId:input.project.projectId,
    intakeVersion:input.intakeVersion,
    sourceType:input.sourceType,
    sourceRef:nonBlank(input.sourceRef,'INTAKE_SOURCE_REF_REQUIRED'),
    dataPackVersion:nonBlank(input.dataPackVersion,'DATA_PACK_VERSION_REQUIRED'),
    state:'CREATED' as const,
    createdAt:input.createdAt,
    updatedAt:input.createdAt,
  };
  return Object.freeze({
    ...base,
    ...(input.originatorRef?.trim()?{originatorRef:input.originatorRef.trim()}:{}),
    ...(input.consentSetRef?.trim()?{consentSetRef:input.consentSetRef.trim()}:{}),
    ...(input.supersedesIntakeId?.trim()?{supersedesIntakeId:input.supersedesIntakeId.trim()}:{}),
  });
}

export function transitionCapitalPilotIntake(intake:CapitalPilotIntake,target:CapitalPilotIntakeState,at:string):CapitalPilotIntake{
  const atMs=validIsoMs(at);
  const updatedMs=validIsoMs(intake.updatedAt);
  if(atMs<updatedMs)throw new Error('INTAKE_TIME_REGRESSION');
  if(intake.state===target)return intake;
  if(intake.state==='WITHDRAWN')throw new Error('WITHDRAWN_INTAKE_IS_TERMINAL');
  if(target==='PAUSED'){
    if(intake.state==='PAUSED')return intake;
    if(!INTAKE_TRANSITIONS[intake.state].includes('PAUSED'))throw new Error(`INVALID_INTAKE_TRANSITION:${intake.state}:PAUSED`);
    return Object.freeze({...intake,state:'PAUSED',pausedFromState:intake.state as Exclude<CapitalPilotIntakeState,'PAUSED'|'WITHDRAWN'>,updatedAt:at});
  }
  if(intake.state==='PAUSED'){
    if(target==='WITHDRAWN')return Object.freeze({...intake,state:'WITHDRAWN',updatedAt:at});
    if(!intake.pausedFromState||target!==intake.pausedFromState)throw new Error(`INVALID_INTAKE_RESUME:${String(intake.pausedFromState)}:${target}`);
    const {pausedFromState:_paused,...rest}=intake;
    return Object.freeze({...rest,state:target,updatedAt:at});
  }
  if(!INTAKE_TRANSITIONS[intake.state].includes(target))throw new Error(`INVALID_INTAKE_TRANSITION:${intake.state}:${target}`);
  const {pausedFromState:_paused,...rest}=intake;
  return Object.freeze({...rest,state:target,updatedAt:at});
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
