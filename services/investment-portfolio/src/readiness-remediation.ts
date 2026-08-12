import type {ReadinessGap,ReadinessGateId,ReadinessGapSeverity} from '@agroway/invest-control-contracts';

export type RemediationTaskState='TO_DO'|'IN_PROGRESS'|'UNDER_REVIEW';
export type RemediationResponsibility='PRODUCER'|'SANA_ANALYST'|'AGRONOMIST'|'SHARED';
export type RemediationActionKind='PROVIDE_INFORMATION'|'PROVIDE_DOCUMENT'|'COORDINATE_TECHNICAL_VISIT'|'SANA_REVIEW';
export type RemediationPresentationState='READY'|'NEEDS_CONFIGURATION';

export interface RemediationPresentation {
  code:string;
  title:string;
  instruction:string;
  actionKind:RemediationActionKind;
  responsibility:RemediationResponsibility;
  evidenceExamples:readonly string[];
}

export interface ProducerRemediationTask {
  taskId:string;
  tenantId:string;
  projectId:string;
  assessmentVersion:number;
  gapId:string;
  gateId:ReadinessGateId;
  gapCode:string;
  severity:ReadinessGapSeverity;
  blocking:boolean;
  state:RemediationTaskState;
  presentationState:RemediationPresentationState;
  title:string;
  instruction:string;
  actionKind:RemediationActionKind;
  responsibility:RemediationResponsibility;
  ownerRef?:string;
  dueAt?:string;
  requiredEvidenceRoles:readonly string[];
  evidenceExamples:readonly string[];
  canonicalGapState:Extract<ReadinessGap['state'],'OPEN'|'IN_REMEDIATION'|'EVIDENCE_SUBMITTED'>;
  trust:Readonly<{
    projectionOnly:true;
    completingTaskResolvesGap:false;
    canonicalMutationAvailable:false;
    financingApproval:false;
  }>;
}

export interface RemediationTaskProjection {
  model:'CAPITAL_READINESS_REMEDIATION_TASK_PROJECTION';
  tenantId:string;
  projectId:string;
  assessmentVersion:number;
  generatedAt:string;
  tasks:readonly ProducerRemediationTask[];
  producerTasks:readonly ProducerRemediationTask[];
  sanaTasks:readonly ProducerRemediationTask[];
  unmappedGapRefs:readonly string[];
  trust:Readonly<{
    sourceOfTruth:'READINESS_GAP';
    projectionRebuildable:true;
    browserMutationRequired:false;
    producerCannotWaive:true;
    producerCannotFinalize:true;
    financingApproval:false;
  }>;
}

export interface BuildRemediationTaskProjectionInput {
  tenantId:string;
  projectId:string;
  assessmentVersion:number;
  gaps:readonly ReadinessGap[];
  presentations:readonly RemediationPresentation[];
  generatedAt:string;
}

const GATE_ORDER:readonly ReadinessGateId[]=['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'];
const ACTIVE_STATES=new Set<ReadinessGap['state']>(['OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED']);
const KNOWN_GAP_STATES=new Set<ReadinessGap['state']>(['OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED']);
const KNOWN_SEVERITIES=new Set<ReadinessGapSeverity>(['INFO','WARNING','CRITICAL']);
const ACTION_KINDS=new Set<RemediationActionKind>(['PROVIDE_INFORMATION','PROVIDE_DOCUMENT','COORDINATE_TECHNICAL_VISIT','SANA_REVIEW']);
const RESPONSIBILITIES=new Set<RemediationResponsibility>(['PRODUCER','SANA_ANALYST','AGRONOMIST','SHARED']);
const SEVERITY_ORDER:Readonly<Record<ReadinessGapSeverity,number>>={CRITICAL:0,WARNING:1,INFO:2};

function nonBlank(value:string,code:string):string{const normalized=value.trim();if(!normalized)throw new Error(code);return normalized;}
function validIso(value:string,code:string):string{if(!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function uniqueStrings(values:readonly string[]):readonly string[]{return Object.freeze([...new Set(values.map(value=>value.trim()).filter(Boolean))].sort());}
function taskState(state:ReadinessGap['state']):RemediationTaskState{
  if(state==='OPEN')return'TO_DO';
  if(state==='IN_REMEDIATION')return'IN_PROGRESS';
  if(state==='EVIDENCE_SUBMITTED')return'UNDER_REVIEW';
  throw new Error(`REMEDIATION_TASK_INACTIVE_GAP_STATE:${state}`);
}
function fallbackPresentation(gap:ReadinessGap):RemediationPresentation{
  return Object.freeze({
    code:gap.code,
    title:'Información pendiente',
    instruction:'SANA debe traducir esta brecha a una tarea concreta antes de solicitar información adicional al productor.',
    actionKind:'SANA_REVIEW',
    responsibility:'SANA_ANALYST',
    evidenceExamples:Object.freeze([]),
  });
}
function validatePresentation(item:RemediationPresentation):void{
  nonBlank(item.code,'REMEDIATION_PRESENTATION_CODE_REQUIRED');
  nonBlank(item.title,'REMEDIATION_PRESENTATION_TITLE_REQUIRED');
  nonBlank(item.instruction,'REMEDIATION_PRESENTATION_INSTRUCTION_REQUIRED');
  if(!ACTION_KINDS.has(item.actionKind))throw new Error(`REMEDIATION_PRESENTATION_ACTION_INVALID:${String(item.actionKind)}`);
  if(!RESPONSIBILITIES.has(item.responsibility))throw new Error(`REMEDIATION_PRESENTATION_RESPONSIBILITY_INVALID:${String(item.responsibility)}`);
  for(const example of item.evidenceExamples)nonBlank(example,'REMEDIATION_PRESENTATION_EVIDENCE_EXAMPLE_REQUIRED');
}
function validateGap(gap:ReadinessGap,input:BuildRemediationTaskProjectionInput):void{
  nonBlank(gap.gapId,'REMEDIATION_GAP_ID_REQUIRED');
  nonBlank(gap.code,'REMEDIATION_GAP_CODE_REQUIRED');
  nonBlank(gap.sourceRef,'REMEDIATION_GAP_SOURCE_REQUIRED');
  nonBlank(gap.description,'REMEDIATION_GAP_DESCRIPTION_REQUIRED');
  if(gap.tenantId!==input.tenantId||gap.projectId!==input.projectId)throw new Error('REMEDIATION_GAP_SCOPE_MISMATCH');
  if(gap.assessmentVersion!==input.assessmentVersion)throw new Error('REMEDIATION_GAP_VERSION_MISMATCH');
  if(!GATE_ORDER.includes(gap.gateId))throw new Error(`REMEDIATION_GAP_GATE_INVALID:${String(gap.gateId)}`);
  if(!KNOWN_GAP_STATES.has(gap.state))throw new Error(`REMEDIATION_GAP_STATE_INVALID:${String(gap.state)}`);
  if(!KNOWN_SEVERITIES.has(gap.severity))throw new Error(`REMEDIATION_GAP_SEVERITY_INVALID:${String(gap.severity)}`);
  validIso(gap.openedAt,'REMEDIATION_GAP_OPENED_AT_INVALID');
  if(gap.dueAt)validIso(gap.dueAt,'REMEDIATION_GAP_DUE_AT_INVALID');
  if(gap.resolvedAt)validIso(gap.resolvedAt,'REMEDIATION_GAP_RESOLVED_AT_INVALID');
  for(const role of gap.requiredEvidenceRoles)nonBlank(role,'REMEDIATION_REQUIRED_EVIDENCE_ROLE_INVALID');
}

export function buildRemediationTaskProjection(input:BuildRemediationTaskProjectionInput):RemediationTaskProjection{
  nonBlank(input.tenantId,'REMEDIATION_TENANT_REQUIRED');
  nonBlank(input.projectId,'REMEDIATION_PROJECT_REQUIRED');
  if(!Number.isSafeInteger(input.assessmentVersion)||input.assessmentVersion<=0)throw new Error('REMEDIATION_ASSESSMENT_VERSION_INVALID');
  validIso(input.generatedAt,'REMEDIATION_GENERATED_AT_INVALID');
  const presentations=new Map<string,RemediationPresentation>();
  for(const item of input.presentations){
    validatePresentation(item);
    if(presentations.has(item.code))throw new Error(`REMEDIATION_DUPLICATE_PRESENTATION:${item.code}`);
    presentations.set(item.code,Object.freeze({...item,evidenceExamples:uniqueStrings(item.evidenceExamples)}));
  }
  const seenGapIds=new Set<string>();
  const active=input.gaps.filter(gap=>{
    if(seenGapIds.has(gap.gapId))throw new Error(`REMEDIATION_DUPLICATE_GAP:${gap.gapId}`);
    seenGapIds.add(gap.gapId);
    validateGap(gap,input);
    return ACTIVE_STATES.has(gap.state);
  });
  const tasks=active.map(gap=>{
    const configured=presentations.get(gap.code);
    const presentation=configured??fallbackPresentation(gap);
    const presentationState:RemediationPresentationState=configured?'READY':'NEEDS_CONFIGURATION';
    const canonicalGapState=gap.state as ProducerRemediationTask['canonicalGapState'];
    return Object.freeze({
      taskId:`readiness-task:${input.assessmentVersion}:${gap.gapId}`,
      tenantId:gap.tenantId,projectId:gap.projectId,assessmentVersion:gap.assessmentVersion,gapId:gap.gapId,gateId:gap.gateId,gapCode:gap.code,severity:gap.severity,blocking:gap.blocking,state:taskState(gap.state),presentationState,
      title:presentation.title,instruction:presentation.instruction,actionKind:presentation.actionKind,responsibility:presentation.responsibility,
      ...(gap.ownerRef?.trim()?{ownerRef:gap.ownerRef.trim()}:{}),...(gap.dueAt?{dueAt:gap.dueAt}:{}),
      requiredEvidenceRoles:uniqueStrings(gap.requiredEvidenceRoles),evidenceExamples:uniqueStrings(presentation.evidenceExamples),canonicalGapState,
      trust:Object.freeze({projectionOnly:true,completingTaskResolvesGap:false,canonicalMutationAvailable:false,financingApproval:false}),
    });
  }).sort((a,b)=>Number(b.blocking)-Number(a.blocking)||SEVERITY_ORDER[a.severity]-SEVERITY_ORDER[b.severity]||GATE_ORDER.indexOf(a.gateId)-GATE_ORDER.indexOf(b.gateId)||(a.dueAt??'').localeCompare(b.dueAt??'')||a.gapId.localeCompare(b.gapId));
  const frozenTasks=Object.freeze(tasks);
  const producerTasks=Object.freeze(frozenTasks.filter(task=>task.presentationState==='READY'&&(task.responsibility==='PRODUCER'||task.responsibility==='SHARED')));
  const sanaTasks=Object.freeze(frozenTasks.filter(task=>task.presentationState==='NEEDS_CONFIGURATION'||task.responsibility==='SANA_ANALYST'||task.responsibility==='AGRONOMIST'||task.responsibility==='SHARED'));
  const unmappedGapRefs=Object.freeze(frozenTasks.filter(task=>task.presentationState==='NEEDS_CONFIGURATION').map(task=>task.gapId).sort());
  return Object.freeze({
    model:'CAPITAL_READINESS_REMEDIATION_TASK_PROJECTION',tenantId:input.tenantId,projectId:input.projectId,assessmentVersion:input.assessmentVersion,generatedAt:input.generatedAt,tasks:frozenTasks,producerTasks,sanaTasks,unmappedGapRefs,
    trust:Object.freeze({sourceOfTruth:'READINESS_GAP',projectionRebuildable:true,browserMutationRequired:false,producerCannotWaive:true,producerCannotFinalize:true,financingApproval:false}),
  });
}
