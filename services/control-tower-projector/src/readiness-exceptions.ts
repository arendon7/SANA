import type {ControlTowerException,ReadinessGap} from '@agroway/invest-control-contracts';

const ACTIVE_STATES=new Set<ReadinessGap['state']>(['OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED']);
const KNOWN_STATES=new Set<ReadinessGap['state']>(['OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED']);
const KNOWN_SEVERITIES=new Set<ReadinessGap['severity']>(['INFO','WARNING','CRITICAL']);
const KNOWN_GATES=new Set<ReadinessGap['gateId']>(['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE']);

function nonBlank(value:string,code:string):string{const normalized=value.trim();if(!normalized)throw new Error(code);return normalized;}
function isoMs(value:string,code:string):number{const parsed=Date.parse(value);if(!Number.isFinite(parsed))throw new Error(code);return parsed;}
function fingerprint(gap:ReadinessGap):string{return `CAPITAL_READINESS_GAP:${gap.projectId}:v${gap.assessmentVersion}:${gap.gapId}`;}
function exceptionId(tenantId:string,fp:string):string{return `cte:${tenantId}:${fp}`;}

function validateGap(tenantId:string,asOfMs:number,gap:ReadinessGap):void{
  if(gap.tenantId!==tenantId)throw new Error('READINESS_CONTROL_TENANT_MISMATCH');
  nonBlank(gap.projectId,'READINESS_CONTROL_PROJECT_REQUIRED');
  nonBlank(gap.gapId,'READINESS_CONTROL_GAP_ID_REQUIRED');
  nonBlank(gap.code,'READINESS_CONTROL_GAP_CODE_REQUIRED');
  nonBlank(gap.description,'READINESS_CONTROL_GAP_DESCRIPTION_REQUIRED');
  nonBlank(gap.sourceRef,'READINESS_CONTROL_GAP_SOURCE_REQUIRED');
  if(!Number.isSafeInteger(gap.assessmentVersion)||gap.assessmentVersion<=0)throw new Error('READINESS_CONTROL_ASSESSMENT_VERSION_INVALID');
  if(!KNOWN_GATES.has(gap.gateId))throw new Error('READINESS_CONTROL_GATE_INVALID');
  if(!KNOWN_STATES.has(gap.state))throw new Error('READINESS_CONTROL_GAP_STATE_INVALID');
  if(!KNOWN_SEVERITIES.has(gap.severity))throw new Error('READINESS_CONTROL_GAP_SEVERITY_INVALID');
  if(typeof gap.blocking!=='boolean')throw new Error('READINESS_CONTROL_GAP_BLOCKING_INVALID');
  const openedAt=isoMs(gap.openedAt,'READINESS_CONTROL_OPENED_AT_INVALID');
  if(openedAt>asOfMs)throw new Error('READINESS_CONTROL_GAP_FROM_FUTURE');
  if(gap.dueAt!==undefined)isoMs(gap.dueAt,'READINESS_CONTROL_DUE_AT_INVALID');
  if(gap.resolvedAt!==undefined){
    const resolvedAt=isoMs(gap.resolvedAt,'READINESS_CONTROL_RESOLVED_AT_INVALID');
    if(resolvedAt<openedAt||resolvedAt>asOfMs)throw new Error('READINESS_CONTROL_RESOLUTION_TIME_INVALID');
    if(ACTIVE_STATES.has(gap.state))throw new Error('READINESS_CONTROL_ACTIVE_GAP_HAS_RESOLUTION');
  }
  const roles=gap.requiredEvidenceRoles.map(role=>nonBlank(role,'READINESS_CONTROL_EVIDENCE_ROLE_INVALID'));
  if(new Set(roles).size!==roles.length)throw new Error('READINESS_CONTROL_EVIDENCE_ROLE_DUPLICATE');
}

function projectOne(tenantId:string,asOf:string,gap:ReadinessGap):ControlTowerException{
  const fp=fingerprint(gap);
  const projectedState:ControlTowerException['state']=gap.state==='OPEN'?'OPEN':'ACKNOWLEDGED';
  const classification=gap.blocking?'BLOCKING':'CONDITION';
  return Object.freeze({
    exceptionId:exceptionId(tenantId,fp),
    tenantId,
    code:'CAPITAL_READINESS_GAP',
    severity:gap.severity,
    state:projectedState,
    subjectRef:`readiness-gap:${gap.gapId}`,
    reason:`${gap.gateId}:${gap.code} · ${classification} · ${gap.state} · ${gap.description}`,
    fingerprint:fp,
    openedAt:gap.openedAt,
    updatedAt:asOf,
  });
}

/**
 * Rebuildable one-to-one projection from canonical Invest ReadinessGap state
 * into CONTROL's existing exception primitive. CONTROL never becomes the
 * source of truth for readiness and this function performs no canonical write.
 */
export function deriveReadinessGapExceptions(
  tenantId:string,
  gaps:readonly ReadinessGap[],
  asOf:string,
):readonly ControlTowerException[]{
  nonBlank(tenantId,'READINESS_CONTROL_TENANT_REQUIRED');
  const asOfMs=isoMs(asOf,'READINESS_CONTROL_AS_OF_INVALID');
  const fingerprints=new Set<string>();
  const out:ControlTowerException[]=[];
  for(const gap of gaps){
    validateGap(tenantId,asOfMs,gap);
    const fp=fingerprint(gap);
    if(fingerprints.has(fp))throw new Error('READINESS_CONTROL_DUPLICATE_GAP_FINGERPRINT');
    fingerprints.add(fp);
    if(!ACTIVE_STATES.has(gap.state))continue;
    out.push(projectOne(tenantId,asOf,gap));
  }
  return Object.freeze(out.sort((a,b)=>a.fingerprint.localeCompare(b.fingerprint)));
}

export const CAPITAL_READINESS_CONTROL_PROJECTION_BOUNDARY=Object.freeze({
  sourceOfTruth:'READINESS_GAP' as const,
  projectionOnly:true,
  rebuildable:true,
  controlResolutionMutatesReadiness:false,
  canonicalMutationAvailable:false,
  financingApproval:false,
  investmentRecommendation:false,
  custody:false,
  paymentExecution:false,
  disbursementAuthority:false,
  aiAuthority:'NONE' as const,
});
