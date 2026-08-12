import type {
  CapitalPilotIntake,
  CapitalPilotIntakeState,
  ReadinessAssessment,
  ReadinessDecision,
  ReadinessGateAssessment,
  ReadinessGateId,
  ReadinessGap,
  ReadinessGapState,
} from '@agroway/invest-control-contracts';

export type CapitalReadinessSqlScalar=string|number|boolean|null|readonly string[];
export type CapitalReadinessSqlParams=readonly CapitalReadinessSqlScalar[];

export interface CapitalReadinessSqlResult<Row extends object=Record<string,unknown>> {
  rows:readonly Row[];
  rowCount:number;
}

export interface CapitalReadinessSqlTransaction {
  query<Row extends object=Record<string,unknown>>(sql:string,params?:CapitalReadinessSqlParams):Promise<CapitalReadinessSqlResult<Row>>;
}

export interface CapitalReadinessSqlExecutor {
  transaction<T>(work:(tx:CapitalReadinessSqlTransaction)=>Promise<T>):Promise<T>;
}

export interface CreatePersistedCapitalPilotIntakeInput {
  intake:CapitalPilotIntake;
  initialTransitionId:string;
  actorRef:string;
  reason?:string;
}

export interface PersistReadinessProof {
  evidenceManifestAsOf:string;
  riskProfileAsOf:string;
  sourceRiskDigestSha256:string;
  persistedAt:string;
}

export interface PersistFinalReadinessAssessmentInput {
  assessment:ReadinessAssessment;
  gaps:readonly ReadinessGap[];
  proof:PersistReadinessProof;
  initialGapTransitionIds:Readonly<Record<string,string>>;
}

export interface AppendReadinessGapTransitionInput {
  transitionId:string;
  tenantId:string;
  projectId:string;
  assessmentId:string;
  assessmentVersion:number;
  gapId:string;
  fromState:ReadinessGapState;
  toState:ReadinessGapState;
  actorRef:string;
  occurredAt:string;
  resolutionEvidenceRefs?:readonly string[];
  note?:string;
}

export interface PersistedReadinessProof {
  evidenceManifestAsOf:string;
  riskProfileAsOf:string;
  evidenceManifestDigestSha256:string;
  riskProfileDigestSha256:string;
  sourceRiskDigestSha256:string;
  persistedAt:string;
}

export interface PersistedCapitalReadinessSnapshot {
  tenantId:string;
  projectId:string;
  intake:CapitalPilotIntake;
  assessment:ReadinessAssessment;
  gaps:readonly ReadinessGap[];
  proof:PersistedReadinessProof;
  storageBoundary:Readonly<{
    canonicalPersisted:readonly string[];
    rebuildableNotHydrated:readonly string[];
    readOnlyHydration:true;
    canonicalMutationBridgeAvailable:false;
    financialMutationAvailable:false;
    aiAuthority:'ADVISORY_ONLY';
  }>;
}

interface IntakeRow {
  intakeId:string;tenantId:string;projectId:string;intakeVersion:number;sourceType:CapitalPilotIntake['sourceType'];sourceRef:string;
  originatorRef:string|null;consentSetRef:string|null;dataPackVersion:string;supersedesIntakeId:string|null;createdAt:string;
}
interface IntakeTransitionRow {
  transitionId:string;tenantId:string;projectId:string;intakeId:string;intakeVersion:number;sequence:number;
  fromState:CapitalPilotIntakeState|null;toState:CapitalPilotIntakeState;actorRef:string;reason:string|null;occurredAt:string;
}
interface AssessmentRow {
  assessmentId:string;tenantId:string;projectId:string;version:number;intakeId:string;intakeVersion:number;policyVersion:string;methodologyVersion:string;
  projectSnapshotRef:string;approvedBudgetVersion:number|null;evidenceManifestAsOf:string;riskProfileAsOf:string;evidenceManifestDigestSha256:string;
  riskProfileDigestSha256:string;sourceRiskDigestSha256:string;evidenceCoverageBps:number;decision:ReadinessDecision;
  deterministicMaximumDecision:Exclude<ReadinessDecision,'REASSESSMENT_REQUIRED'>;rationale:string;reviewerRef:string;reviewedAt:string;digestSha256:string;persistedAt:string;
}
interface GateRow {
  tenantId:string;projectId:string;assessmentId:string;assessmentVersion:number;gateId:ReadinessGateId;result:ReadinessGateAssessment['result'];
  rationale:string;evidenceRefs:readonly string[];confidenceBps:number;assessedAt:string;assessedBy:string;methodVersion:string;
}
interface GapRow {
  gapId:string;tenantId:string;projectId:string;assessmentId:string;assessmentVersion:number;gateId:ReadinessGateId;code:string;
  severity:ReadinessGap['severity'];blocking:boolean;description:string;sourceRef:string;ownerRef:string|null;dueAt:string|null;
  requiredEvidenceRoles:readonly string[];openedAt:string;
}
interface GapTransitionRow {
  transitionId:string;tenantId:string;projectId:string;assessmentId:string;assessmentVersion:number;gapId:string;sequence:number;
  fromState:ReadinessGapState|null;toState:ReadinessGapState;actorRef:string;resolutionEvidenceRefs:readonly string[];note:string|null;occurredAt:string;
}

const GATE_ORDER:readonly ReadinessGateId[]=[
  'G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE',
] as const;
const SHA256=/^[a-f0-9]{64}$/;
const INTAKE_STATES:readonly CapitalPilotIntakeState[]=[
  'CREATED','CANONICAL_REUSE_SCAN','DATA_COMPLETION','EVIDENCE_VALIDATION','ASSESSMENT_READY','UNDER_ASSESSMENT','GAP_REMEDIATION','HUMAN_REVIEW',
  'CAPITAL_READY','READY_WITH_CONDITIONS','NOT_READY','REASSESSMENT_REQUIRED','PAUSED','WITHDRAWN',
] as const;
const GAP_STATES:readonly ReadinessGapState[]=['OPEN','IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED'] as const;
const TERMINAL_GAP_STATES=new Set<ReadinessGapState>(['RESOLVED','WAIVED','SUPERSEDED']);

function nonBlank(value:string,code:string):string{const v=value.trim();if(!v)throw new Error(code);return v;}
function isoMs(value:string,code='INVALID_ISO_DATETIME'):number{const ms=Date.parse(value);if(!Number.isFinite(ms))throw new Error(code);return ms;}
function positiveInteger(value:number,code:string):number{if(!Number.isSafeInteger(value)||value<=0)throw new Error(code);return value;}
function nonNegativeInteger(value:number,code:string):number{if(!Number.isSafeInteger(value)||value<0)throw new Error(code);return value;}
function bps(value:number,code:string):number{if(!Number.isSafeInteger(value)||value<0||value>10_000)throw new Error(code);return value;}
function digest(value:string,code:string):string{if(!SHA256.test(value))throw new Error(code);return value;}
function strings(values:readonly string[],code:string):readonly string[]{const normalized=values.map(v=>nonBlank(v,code));if(new Set(normalized).size!==normalized.length)throw new Error(`${code}_DUPLICATE`);return Object.freeze([...normalized]);}
function sameStrings(a:readonly string[],b:readonly string[]):boolean{const left=[...a].sort(),right=[...b].sort();return left.length===right.length&&left.every((v,i)=>v===right[i]);}
function sameScope(tenantId:string,projectId:string,otherTenantId:string,otherProjectId:string,code:string):void{if(tenantId!==otherTenantId||projectId!==otherProjectId)throw new Error(code);}
function rowCount(result:CapitalReadinessSqlResult<object>,expected:number,code:string):void{if(result.rowCount!==expected)throw new Error(`${code}:EXPECTED_${expected}_GOT_${result.rowCount}`);}
function allowedIntakeState(value:string):value is CapitalPilotIntakeState{return INTAKE_STATES.includes(value as CapitalPilotIntakeState);}
function allowedGapState(value:string):value is ReadinessGapState{return GAP_STATES.includes(value as ReadinessGapState);}

function allowedIntakeTransition(current:CapitalPilotIntake,target:CapitalPilotIntakeState):boolean{
  if(current.state==='WITHDRAWN')return false;
  if(current.state==='PAUSED')return target==='WITHDRAWN'||(current.pausedFromState!==undefined&&target===current.pausedFromState);
  const allowed:Readonly<Record<Exclude<CapitalPilotIntakeState,'PAUSED'|'WITHDRAWN'>,readonly CapitalPilotIntakeState[]>>={
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
  };
  return allowed[current.state].includes(target);
}

function allowedGapTransition(from:ReadinessGapState,to:ReadinessGapState):boolean{
  if(TERMINAL_GAP_STATES.has(from))return false;
  if(from==='OPEN')return ['IN_REMEDIATION','EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED'].includes(to);
  if(from==='IN_REMEDIATION')return ['EVIDENCE_SUBMITTED','RESOLVED','WAIVED','SUPERSEDED'].includes(to);
  return from==='EVIDENCE_SUBMITTED'&&['IN_REMEDIATION','RESOLVED','WAIVED','SUPERSEDED'].includes(to);
}

async function inTenantTransaction<T>(executor:CapitalReadinessSqlExecutor,tenantId:string,work:(tx:CapitalReadinessSqlTransaction)=>Promise<T>):Promise<T>{
  nonBlank(tenantId,'READINESS_TENANT_REQUIRED');
  return executor.transaction(async tx=>{
    const bind=await tx.query('/* capital-readiness:tenant-context */ SELECT set_config(\'app.tenant_id\',$1,true)',[tenantId]);
    if(bind.rowCount>1)throw new Error('READINESS_TENANT_CONTEXT_BIND_INVALID');
    return work(tx);
  });
}

function assertInitialIntake(intake:CapitalPilotIntake):void{
  nonBlank(intake.intakeId,'INTAKE_ID_REQUIRED');nonBlank(intake.tenantId,'INTAKE_TENANT_REQUIRED');nonBlank(intake.projectId,'INTAKE_PROJECT_REQUIRED');
  positiveInteger(intake.intakeVersion,'INVALID_INTAKE_VERSION');nonBlank(intake.sourceRef,'INTAKE_SOURCE_REF_REQUIRED');nonBlank(intake.dataPackVersion,'DATA_PACK_VERSION_REQUIRED');
  isoMs(intake.createdAt);isoMs(intake.updatedAt);
  if(intake.state!=='CREATED'||intake.pausedFromState!==undefined)throw new Error('PERSISTED_INTAKE_MUST_START_CREATED');
  if(intake.updatedAt!==intake.createdAt)throw new Error('INITIAL_INTAKE_UPDATED_AT_MUST_EQUAL_CREATED_AT');
}

export async function createPersistedCapitalPilotIntake(executor:CapitalReadinessSqlExecutor,input:CreatePersistedCapitalPilotIntakeInput):Promise<void>{
  assertInitialIntake(input.intake);nonBlank(input.initialTransitionId,'INITIAL_TRANSITION_ID_REQUIRED');const actorRef=nonBlank(input.actorRef,'INTAKE_ACTOR_REQUIRED');
  const reason=input.reason?.trim()||null;const i=input.intake;
  await inTenantTransaction(executor,i.tenantId,async tx=>{
    const inserted=await tx.query(`/* capital-readiness:create-intake */
      INSERT INTO agroway_invest.capital_pilot_intake
        (intake_id,tenant_id,project_id,intake_version,source_type,source_ref,originator_ref,consent_set_ref,data_pack_version,supersedes_intake_id,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[
      i.intakeId,i.tenantId,i.projectId,i.intakeVersion,i.sourceType,i.sourceRef,i.originatorRef??null,i.consentSetRef??null,i.dataPackVersion,i.supersedesIntakeId??null,i.createdAt,
    ]);rowCount(inserted,1,'CREATE_INTAKE_ROWCOUNT');
    const transition=await tx.query(`/* capital-readiness:create-intake-transition */
      INSERT INTO agroway_invest.capital_pilot_intake_transition
        (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,reason,occurred_at)
      VALUES ($1,$2,$3,$4,$5,0,NULL,'CREATED',$6,$7,$8)`,[
      input.initialTransitionId,i.tenantId,i.projectId,i.intakeId,i.intakeVersion,actorRef,reason,i.createdAt,
    ]);rowCount(transition,1,'CREATE_INTAKE_TRANSITION_ROWCOUNT');
  });
}

export async function appendPersistedCapitalPilotIntakeTransition(executor:CapitalReadinessSqlExecutor,current:CapitalPilotIntake,next:CapitalPilotIntake,input:Readonly<{transitionId:string;actorRef:string;reason?:string}>):Promise<void>{
  sameScope(current.tenantId,current.projectId,next.tenantId,next.projectId,'INTAKE_TRANSITION_SCOPE_MISMATCH');
  if(current.intakeId!==next.intakeId||current.intakeVersion!==next.intakeVersion||current.createdAt!==next.createdAt)throw new Error('INTAKE_TRANSITION_IDENTITY_MISMATCH');
  if(current.state===next.state)throw new Error('INTAKE_TRANSITION_NOOP_NOT_PERSISTED');
  if(!allowedIntakeTransition(current,next.state))throw new Error(`INVALID_INTAKE_TRANSITION:${current.state}:${next.state}`);
  if(isoMs(next.updatedAt)<isoMs(current.updatedAt))throw new Error('INTAKE_TRANSITION_TIME_REGRESSION');
  const transitionId=nonBlank(input.transitionId,'INTAKE_TRANSITION_ID_REQUIRED'),actorRef=nonBlank(input.actorRef,'INTAKE_TRANSITION_ACTOR_REQUIRED');
  await inTenantTransaction(executor,current.tenantId,async tx=>{
    const latest=await tx.query<IntakeTransitionRow>(`/* capital-readiness:latest-intake-transition */
      SELECT transition_id AS "transitionId",tenant_id AS "tenantId",project_id AS "projectId",intake_id AS "intakeId",intake_version AS "intakeVersion",
             sequence,from_state AS "fromState",to_state AS "toState",actor_ref AS "actorRef",reason,occurred_at AS "occurredAt"
      FROM agroway_invest.capital_pilot_intake_transition
      WHERE tenant_id=$1 AND project_id=$2 AND intake_id=$3 AND intake_version=$4
      ORDER BY sequence DESC LIMIT 1`,[current.tenantId,current.projectId,current.intakeId,current.intakeVersion]);
    rowCount(latest,1,'LATEST_INTAKE_TRANSITION_ROWCOUNT');const row=latest.rows[0];
    if(row.toState!==current.state)throw new Error('PERSISTED_INTAKE_STATE_STALE');
    if(isoMs(row.occurredAt)>isoMs(next.updatedAt))throw new Error('PERSISTED_INTAKE_TIME_AHEAD');
    const inserted=await tx.query(`/* capital-readiness:append-intake-transition */
      INSERT INTO agroway_invest.capital_pilot_intake_transition
        (transition_id,tenant_id,project_id,intake_id,intake_version,sequence,from_state,to_state,actor_ref,reason,occurred_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[
      transitionId,current.tenantId,current.projectId,current.intakeId,current.intakeVersion,row.sequence+1,current.state,next.state,actorRef,input.reason?.trim()||null,next.updatedAt,
    ]);rowCount(inserted,1,'APPEND_INTAKE_TRANSITION_ROWCOUNT');
  });
}

function validateFinalAssessmentInput(input:PersistFinalReadinessAssessmentInput):void{
  const a=input.assessment;nonBlank(a.assessmentId,'ASSESSMENT_ID_REQUIRED');nonBlank(a.tenantId,'ASSESSMENT_TENANT_REQUIRED');nonBlank(a.projectId,'ASSESSMENT_PROJECT_REQUIRED');
  positiveInteger(a.version,'INVALID_ASSESSMENT_VERSION');positiveInteger(a.intakeVersion,'INVALID_INTAKE_VERSION');nonBlank(a.intakeId,'ASSESSMENT_INTAKE_REQUIRED');
  nonBlank(a.policyVersion,'ASSESSMENT_POLICY_REQUIRED');nonBlank(a.methodologyVersion,'ASSESSMENT_METHOD_REQUIRED');nonBlank(a.projectSnapshotRef,'ASSESSMENT_PROJECT_SNAPSHOT_REQUIRED');
  digest(a.evidenceManifestDigestSha256,'ASSESSMENT_MANIFEST_DIGEST_INVALID');digest(a.riskProfileDigestSha256,'ASSESSMENT_RISK_DIGEST_INVALID');digest(a.digestSha256,'ASSESSMENT_DIGEST_INVALID');bps(a.evidenceCoverageBps,'ASSESSMENT_COVERAGE_INVALID');
  const reviewMs=isoMs(a.reviewedAt);const manifestMs=isoMs(input.proof.evidenceManifestAsOf);const riskMs=isoMs(input.proof.riskProfileAsOf);const persistedMs=isoMs(input.proof.persistedAt);
  if(reviewMs<manifestMs||reviewMs<riskMs||persistedMs<reviewMs)throw new Error('ASSESSMENT_PROOF_TIME_ORDER_INVALID');
  digest(input.proof.sourceRiskDigestSha256,'ASSESSMENT_SOURCE_RISK_DIGEST_INVALID');
  if(a.gates.length!==GATE_ORDER.length||new Set(a.gates.map(g=>g.gateId)).size!==GATE_ORDER.length)throw new Error('ASSESSMENT_REQUIRES_EXACTLY_NINE_GATES');
  for(const gateId of GATE_ORDER)if(!a.gates.some(g=>g.gateId===gateId))throw new Error(`ASSESSMENT_GATE_MISSING:${gateId}`);
  const gaps=[...input.gaps];const ids=new Set<string>();
  for(const gap of gaps){
    sameScope(a.tenantId,a.projectId,gap.tenantId,gap.projectId,'ASSESSMENT_GAP_SCOPE_MISMATCH');
    if(gap.assessmentVersion!==a.version)throw new Error('ASSESSMENT_GAP_VERSION_MISMATCH');
    if(ids.has(gap.gapId))throw new Error('ASSESSMENT_DUPLICATE_GAP');ids.add(gap.gapId);
    if(gap.state!=='OPEN'||gap.resolvedAt!==undefined||gap.resolvedBy!==undefined||gap.resolutionNote!==undefined||gap.resolutionEvidenceRefs.length!==0)throw new Error('FINAL_ASSESSMENT_GAP_MUST_START_OPEN');
    if(!input.initialGapTransitionIds[gap.gapId]?.trim())throw new Error(`INITIAL_GAP_TRANSITION_ID_REQUIRED:${gap.gapId}`);
    if(isoMs(gap.openedAt)>reviewMs)throw new Error('ASSESSMENT_GAP_OPENED_AFTER_REVIEW');
  }
  if(Object.keys(input.initialGapTransitionIds).length!==gaps.length)throw new Error('INITIAL_GAP_TRANSITION_SET_MISMATCH');
  const expectedBlocking=a.gates.flatMap(g=>g.blockingGapRefs),expectedConditions=a.gates.flatMap(g=>g.conditionGapRefs);
  if(new Set([...expectedBlocking,...expectedConditions]).size!==expectedBlocking.length+expectedConditions.length)throw new Error('ASSESSMENT_DUPLICATE_GATE_GAP_REF');
  if(!sameStrings(gaps.filter(g=>g.blocking).map(g=>g.gapId),expectedBlocking)||!sameStrings(gaps.filter(g=>!g.blocking).map(g=>g.gapId),expectedConditions))throw new Error('ASSESSMENT_GATE_GAP_SET_MISMATCH');
  for(const gate of a.gates){
    if(gate.methodVersion!==a.methodologyVersion)throw new Error('ASSESSMENT_GATE_METHOD_MISMATCH');
    if(isoMs(gate.assessedAt)>reviewMs)throw new Error('ASSESSMENT_GATE_AFTER_REVIEW');
  }
  if(a.decision==='CAPITAL_READY'&&gaps.length!==0)throw new Error('ASSESSMENT_READY_WITH_GAPS');
  if(a.decision==='CAPITAL_READY_WITH_CONDITIONS'&&(gaps.some(g=>g.blocking)||gaps.filter(g=>!g.blocking).length===0))throw new Error('ASSESSMENT_CONDITIONAL_GAPS_INVALID');
}

export async function persistFinalReadinessAssessment(executor:CapitalReadinessSqlExecutor,input:PersistFinalReadinessAssessmentInput):Promise<void>{
  validateFinalAssessmentInput(input);const a=input.assessment;
  await inTenantTransaction(executor,a.tenantId,async tx=>{
    await tx.query('/* capital-readiness:defer-finalization */ SET CONSTRAINTS ALL DEFERRED');
    for(const gateId of GATE_ORDER){
      const gate=a.gates.find(g=>g.gateId===gateId)!;
      const inserted=await tx.query(`/* capital-readiness:insert-gate */
        INSERT INTO agroway_invest.readiness_gate_assessment
          (tenant_id,project_id,assessment_id,assessment_version,gate_id,result,rationale,evidence_refs,confidence_bps,assessed_at,assessed_by,method_version)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[
        a.tenantId,a.projectId,a.assessmentId,a.version,gate.gateId,gate.result,gate.rationale,strings(gate.evidenceRefs,'GATE_EVIDENCE_REF_REQUIRED'),bps(gate.confidenceBps,'GATE_CONFIDENCE_INVALID'),gate.assessedAt,gate.assessedBy,gate.methodVersion,
      ]);rowCount(inserted,1,'INSERT_GATE_ROWCOUNT');
    }
    const sortedGaps=[...input.gaps].sort((x,y)=>GATE_ORDER.indexOf(x.gateId)-GATE_ORDER.indexOf(y.gateId)||x.code.localeCompare(y.code)||x.gapId.localeCompare(y.gapId));
    for(const gap of sortedGaps){
      const inserted=await tx.query(`/* capital-readiness:insert-gap */
        INSERT INTO agroway_invest.readiness_gap
          (gap_id,tenant_id,project_id,assessment_id,assessment_version,gate_id,code,severity,blocking,description,source_ref,owner_ref,due_at,required_evidence_roles,opened_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,[
        gap.gapId,gap.tenantId,gap.projectId,a.assessmentId,gap.assessmentVersion,gap.gateId,gap.code,gap.severity,gap.blocking,gap.description,gap.sourceRef,gap.ownerRef??null,gap.dueAt??null,strings(gap.requiredEvidenceRoles,'GAP_EVIDENCE_ROLE_REQUIRED'),gap.openedAt,
      ]);rowCount(inserted,1,'INSERT_GAP_ROWCOUNT');
      const initial=await tx.query(`/* capital-readiness:insert-gap-initial-transition */
        INSERT INTO agroway_invest.readiness_gap_transition
          (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
        VALUES ($1,$2,$3,$4,$5,$6,0,NULL,'OPEN',$7,$8,NULL,$9)`,[
        input.initialGapTransitionIds[gap.gapId],gap.tenantId,gap.projectId,a.assessmentId,gap.assessmentVersion,gap.gapId,a.reviewerRef,Object.freeze([]),gap.openedAt,
      ]);rowCount(initial,1,'INSERT_GAP_INITIAL_TRANSITION_ROWCOUNT');
    }
    const parent=await tx.query(`/* capital-readiness:insert-final-assessment-parent-last */
      INSERT INTO agroway_invest.readiness_assessment
        (assessment_id,tenant_id,project_id,version,intake_id,intake_version,policy_version,methodology_version,project_snapshot_ref,approved_budget_version,
         evidence_manifest_as_of,risk_profile_as_of,evidence_manifest_digest_sha256,risk_profile_digest_sha256,source_risk_digest_sha256,evidence_coverage_bps,
         decision,deterministic_maximum_decision,rationale,reviewer_ref,reviewed_at,digest_sha256,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,[
      a.assessmentId,a.tenantId,a.projectId,a.version,a.intakeId,a.intakeVersion,a.policyVersion,a.methodologyVersion,a.projectSnapshotRef,a.approvedBudgetVersion??null,
      input.proof.evidenceManifestAsOf,input.proof.riskProfileAsOf,a.evidenceManifestDigestSha256,a.riskProfileDigestSha256,input.proof.sourceRiskDigestSha256,a.evidenceCoverageBps,
      a.decision,a.deterministicMaximumDecision,a.rationale,a.reviewerRef,a.reviewedAt,a.digestSha256,input.proof.persistedAt,
    ]);rowCount(parent,1,'INSERT_FINAL_ASSESSMENT_ROWCOUNT');
    await tx.query('/* capital-readiness:check-finalization-now */ SET CONSTRAINTS ALL IMMEDIATE');
  });
}

export async function appendPersistedReadinessGapTransition(executor:CapitalReadinessSqlExecutor,input:AppendReadinessGapTransitionInput):Promise<void>{
  nonBlank(input.transitionId,'GAP_TRANSITION_ID_REQUIRED');nonBlank(input.tenantId,'GAP_TRANSITION_TENANT_REQUIRED');nonBlank(input.projectId,'GAP_TRANSITION_PROJECT_REQUIRED');
  nonBlank(input.assessmentId,'GAP_TRANSITION_ASSESSMENT_REQUIRED');positiveInteger(input.assessmentVersion,'GAP_TRANSITION_VERSION_INVALID');nonBlank(input.gapId,'GAP_TRANSITION_GAP_REQUIRED');
  nonBlank(input.actorRef,'GAP_TRANSITION_ACTOR_REQUIRED');isoMs(input.occurredAt);
  if(!allowedGapTransition(input.fromState,input.toState))throw new Error(`INVALID_READINESS_GAP_TRANSITION:${input.fromState}:${input.toState}`);
  const evidence=strings(input.resolutionEvidenceRefs??[],'GAP_RESOLUTION_EVIDENCE_REF_REQUIRED'),note=input.note?.trim()||null;
  if(input.toState==='RESOLVED'&&(evidence.length===0||!note))throw new Error('READINESS_GAP_RESOLUTION_REQUIRES_EVIDENCE_AND_NOTE');
  if(input.toState==='WAIVED'&&!note)throw new Error('READINESS_GAP_WAIVER_REQUIRES_NOTE');
  await inTenantTransaction(executor,input.tenantId,async tx=>{
    const latest=await tx.query<GapTransitionRow>(`/* capital-readiness:latest-gap-transition */
      SELECT transition_id AS "transitionId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",
             gap_id AS "gapId",sequence,from_state AS "fromState",to_state AS "toState",actor_ref AS "actorRef",resolution_evidence_refs AS "resolutionEvidenceRefs",note,occurred_at AS "occurredAt"
      FROM agroway_invest.readiness_gap_transition
      WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4 AND gap_id=$5
      ORDER BY sequence DESC LIMIT 1`,[input.tenantId,input.projectId,input.assessmentId,input.assessmentVersion,input.gapId]);
    rowCount(latest,1,'LATEST_GAP_TRANSITION_ROWCOUNT');const row=latest.rows[0];
    if(row.toState!==input.fromState)throw new Error('PERSISTED_GAP_STATE_STALE');
    if(isoMs(row.occurredAt)>isoMs(input.occurredAt))throw new Error('PERSISTED_GAP_TIME_AHEAD');
    const inserted=await tx.query(`/* capital-readiness:append-gap-transition */
      INSERT INTO agroway_invest.readiness_gap_transition
        (transition_id,tenant_id,project_id,assessment_id,assessment_version,gap_id,sequence,from_state,to_state,actor_ref,resolution_evidence_refs,note,occurred_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[
      input.transitionId,input.tenantId,input.projectId,input.assessmentId,input.assessmentVersion,input.gapId,row.sequence+1,input.fromState,input.toState,input.actorRef,evidence,note,input.occurredAt,
    ]);rowCount(inserted,1,'APPEND_GAP_TRANSITION_ROWCOUNT');
  });
}

function validateIntakeRows(identity:IntakeRow,transitions:readonly IntakeTransitionRow[]):CapitalPilotIntake{
  nonBlank(identity.intakeId,'HYDRATE_INTAKE_ID_REQUIRED');nonBlank(identity.tenantId,'HYDRATE_INTAKE_TENANT_REQUIRED');nonBlank(identity.projectId,'HYDRATE_INTAKE_PROJECT_REQUIRED');positiveInteger(identity.intakeVersion,'HYDRATE_INTAKE_VERSION_INVALID');
  const createdMs=isoMs(identity.createdAt,'HYDRATE_INTAKE_CREATED_AT_INVALID');
  const rows=[...transitions].sort((a,b)=>a.sequence-b.sequence);if(rows.length===0)throw new Error('HYDRATE_INTAKE_TRANSITIONS_REQUIRED');
  let state:CapitalPilotIntakeState='CREATED',updatedAt=identity.createdAt,pausedFromState:CapitalPilotIntake['pausedFromState'];
  for(let index=0;index<rows.length;index++){
    const row=rows[index];sameScope(identity.tenantId,identity.projectId,row.tenantId,row.projectId,'HYDRATE_INTAKE_TRANSITION_SCOPE_MISMATCH');
    if(row.intakeId!==identity.intakeId||row.intakeVersion!==identity.intakeVersion)throw new Error('HYDRATE_INTAKE_TRANSITION_IDENTITY_MISMATCH');
    if(row.sequence!==index)throw new Error('HYDRATE_INTAKE_TRANSITION_SEQUENCE_GAP');if(!allowedIntakeState(row.toState))throw new Error('HYDRATE_INTAKE_STATE_INVALID');
    const atMs=isoMs(row.occurredAt,'HYDRATE_INTAKE_TRANSITION_TIME_INVALID');if(atMs<createdMs||atMs<isoMs(updatedAt))throw new Error('HYDRATE_INTAKE_TRANSITION_TIME_REGRESSION');
    if(index===0){if(row.fromState!==null||row.toState!=='CREATED')throw new Error('HYDRATE_INTAKE_INITIAL_TRANSITION_INVALID');state='CREATED';updatedAt=row.occurredAt;continue;}
    if(row.fromState!==state)throw new Error('HYDRATE_INTAKE_FROM_STATE_STALE');
    const current:CapitalPilotIntake={...identity,sourceType:identity.sourceType,sourceRef:identity.sourceRef,originatorRef:identity.originatorRef??undefined,consentSetRef:identity.consentSetRef??undefined,dataPackVersion:identity.dataPackVersion,state,pausedFromState,createdAt:identity.createdAt,updatedAt,supersedesIntakeId:identity.supersedesIntakeId??undefined};
    if(!allowedIntakeTransition(current,row.toState))throw new Error(`HYDRATE_INVALID_INTAKE_TRANSITION:${state}:${row.toState}`);
    if(row.toState==='PAUSED')pausedFromState=state as Exclude<CapitalPilotIntakeState,'PAUSED'|'WITHDRAWN'>;
    else if(state==='PAUSED')pausedFromState=undefined;
    state=row.toState;updatedAt=row.occurredAt;
  }
  return Object.freeze({
    intakeId:identity.intakeId,tenantId:identity.tenantId,projectId:identity.projectId,intakeVersion:identity.intakeVersion,sourceType:identity.sourceType,sourceRef:identity.sourceRef,
    ...(identity.originatorRef?{originatorRef:identity.originatorRef}:{}),...(identity.consentSetRef?{consentSetRef:identity.consentSetRef}:{}),dataPackVersion:identity.dataPackVersion,state,
    ...(pausedFromState?{pausedFromState}:{}),createdAt:identity.createdAt,updatedAt,...(identity.supersedesIntakeId?{supersedesIntakeId:identity.supersedesIntakeId}:{}),
  });
}

function hydrateGap(definition:GapRow,rows:readonly GapTransitionRow[]):ReadinessGap{
  const ordered=[...rows].sort((a,b)=>a.sequence-b.sequence);if(ordered.length===0)throw new Error(`HYDRATE_GAP_TRANSITIONS_REQUIRED:${definition.gapId}`);
  let state:ReadinessGapState='OPEN',lastAt=definition.openedAt,resolutionEvidenceRefs:readonly string[]=Object.freeze([]),resolvedAt:string|undefined,resolvedBy:string|undefined,resolutionNote:string|undefined;
  const openedMs=isoMs(definition.openedAt,'HYDRATE_GAP_OPENED_AT_INVALID');
  for(let index=0;index<ordered.length;index++){
    const row=ordered[index];sameScope(definition.tenantId,definition.projectId,row.tenantId,row.projectId,'HYDRATE_GAP_TRANSITION_SCOPE_MISMATCH');
    if(row.assessmentId!==definition.assessmentId||row.assessmentVersion!==definition.assessmentVersion||row.gapId!==definition.gapId)throw new Error('HYDRATE_GAP_TRANSITION_IDENTITY_MISMATCH');
    if(row.sequence!==index)throw new Error('HYDRATE_GAP_TRANSITION_SEQUENCE_GAP');if(!allowedGapState(row.toState))throw new Error('HYDRATE_GAP_STATE_INVALID');
    const atMs=isoMs(row.occurredAt,'HYDRATE_GAP_TRANSITION_TIME_INVALID');if(atMs<openedMs||atMs<isoMs(lastAt))throw new Error('HYDRATE_GAP_TRANSITION_TIME_REGRESSION');
    if(index===0){if(row.fromState!==null||row.toState!=='OPEN')throw new Error('HYDRATE_GAP_INITIAL_TRANSITION_INVALID');state='OPEN';lastAt=row.occurredAt;continue;}
    if(row.fromState!==state)throw new Error('HYDRATE_GAP_FROM_STATE_STALE');if(!allowedGapTransition(state,row.toState))throw new Error(`HYDRATE_INVALID_GAP_TRANSITION:${state}:${row.toState}`);
    state=row.toState;lastAt=row.occurredAt;
    if(state==='RESOLVED'||state==='WAIVED'||state==='SUPERSEDED'){
      resolutionEvidenceRefs=strings(row.resolutionEvidenceRefs??[],'HYDRATE_GAP_RESOLUTION_EVIDENCE_INVALID');resolvedAt=row.occurredAt;resolvedBy=nonBlank(row.actorRef,'HYDRATE_GAP_RESOLVED_BY_REQUIRED');resolutionNote=row.note?.trim()||undefined;
      if(state==='RESOLVED'&&(resolutionEvidenceRefs.length===0||!resolutionNote))throw new Error('HYDRATE_RESOLVED_GAP_PROOF_MISSING');
      if(state==='WAIVED'&&!resolutionNote)throw new Error('HYDRATE_WAIVED_GAP_NOTE_MISSING');
    }
  }
  return Object.freeze({
    gapId:definition.gapId,tenantId:definition.tenantId,projectId:definition.projectId,assessmentVersion:definition.assessmentVersion,gateId:definition.gateId,code:definition.code,severity:definition.severity,blocking:definition.blocking,state,
    description:definition.description,sourceRef:definition.sourceRef,...(definition.ownerRef?{ownerRef:definition.ownerRef}:{}),...(definition.dueAt?{dueAt:definition.dueAt}:{}),requiredEvidenceRoles:Object.freeze([...definition.requiredEvidenceRoles]),resolutionEvidenceRefs,
    openedAt:definition.openedAt,...(resolvedAt?{resolvedAt}:{}),...(resolvedBy?{resolvedBy}:{}),...(resolutionNote?{resolutionNote}:{}),
  });
}

function hydrateAssessment(row:AssessmentRow,gateRows:readonly GateRow[],gaps:readonly ReadinessGap[]):ReadinessAssessment{
  nonBlank(row.assessmentId,'HYDRATE_ASSESSMENT_ID_REQUIRED');positiveInteger(row.version,'HYDRATE_ASSESSMENT_VERSION_INVALID');positiveInteger(row.intakeVersion,'HYDRATE_INTAKE_VERSION_INVALID');
  nonBlank(row.policyVersion,'HYDRATE_POLICY_REQUIRED');nonBlank(row.methodologyVersion,'HYDRATE_METHOD_REQUIRED');nonBlank(row.projectSnapshotRef,'HYDRATE_PROJECT_SNAPSHOT_REQUIRED');
  digest(row.evidenceManifestDigestSha256,'HYDRATE_MANIFEST_DIGEST_INVALID');digest(row.riskProfileDigestSha256,'HYDRATE_RISK_DIGEST_INVALID');digest(row.sourceRiskDigestSha256,'HYDRATE_SOURCE_RISK_DIGEST_INVALID');digest(row.digestSha256,'HYDRATE_ASSESSMENT_DIGEST_INVALID');bps(row.evidenceCoverageBps,'HYDRATE_COVERAGE_INVALID');
  const reviewedMs=isoMs(row.reviewedAt,'HYDRATE_REVIEW_TIME_INVALID'),manifestMs=isoMs(row.evidenceManifestAsOf,'HYDRATE_MANIFEST_TIME_INVALID'),riskMs=isoMs(row.riskProfileAsOf,'HYDRATE_RISK_TIME_INVALID'),persistedMs=isoMs(row.persistedAt,'HYDRATE_PERSISTED_TIME_INVALID');
  if(reviewedMs<manifestMs||reviewedMs<riskMs||persistedMs<reviewedMs)throw new Error('HYDRATE_PROOF_TIME_ORDER_INVALID');
  if(gateRows.length!==GATE_ORDER.length||new Set(gateRows.map(g=>g.gateId)).size!==GATE_ORDER.length)throw new Error('HYDRATE_ASSESSMENT_GATE_SET_INVALID');
  const gates=Object.freeze(GATE_ORDER.map(gateId=>{
    const gate=gateRows.find(g=>g.gateId===gateId);if(!gate)throw new Error(`HYDRATE_ASSESSMENT_GATE_MISSING:${gateId}`);
    sameScope(row.tenantId,row.projectId,gate.tenantId,gate.projectId,'HYDRATE_GATE_SCOPE_MISMATCH');if(gate.assessmentId!==row.assessmentId||gate.assessmentVersion!==row.version)throw new Error('HYDRATE_GATE_ASSESSMENT_MISMATCH');
    if(gate.methodVersion!==row.methodologyVersion)throw new Error('HYDRATE_GATE_METHOD_MISMATCH');if(isoMs(gate.assessedAt)>reviewedMs)throw new Error('HYDRATE_GATE_AFTER_REVIEW');
    const scoped=gaps.filter(g=>g.gateId===gateId);const blockingGapRefs=Object.freeze(scoped.filter(g=>g.blocking).map(g=>g.gapId).sort()),conditionGapRefs=Object.freeze(scoped.filter(g=>!g.blocking).map(g=>g.gapId).sort());
    return Object.freeze({gateId,result:gate.result,rationale:gate.rationale,evidenceRefs:strings(gate.evidenceRefs,'HYDRATE_GATE_EVIDENCE_REF_INVALID'),confidenceBps:bps(gate.confidenceBps,'HYDRATE_GATE_CONFIDENCE_INVALID'),blockingGapRefs,conditionGapRefs,assessedAt:gate.assessedAt,assessedBy:gate.assessedBy,methodVersion:gate.methodVersion});
  }));
  const blockingGapRefs=Object.freeze(gaps.filter(g=>g.blocking).map(g=>g.gapId).sort()),conditionGapRefs=Object.freeze(gaps.filter(g=>!g.blocking).map(g=>g.gapId).sort());
  if(row.decision==='CAPITAL_READY'&&(blockingGapRefs.length>0||conditionGapRefs.length>0))throw new Error('HYDRATE_READY_WITH_GAPS');
  if(row.decision==='CAPITAL_READY_WITH_CONDITIONS'&&(blockingGapRefs.length>0||conditionGapRefs.length===0))throw new Error('HYDRATE_CONDITIONAL_DECISION_INVALID');
  return Object.freeze({
    assessmentId:row.assessmentId,tenantId:row.tenantId,projectId:row.projectId,version:row.version,intakeId:row.intakeId,intakeVersion:row.intakeVersion,policyVersion:row.policyVersion,methodologyVersion:row.methodologyVersion,projectSnapshotRef:row.projectSnapshotRef,
    ...(row.approvedBudgetVersion!==null?{approvedBudgetVersion:row.approvedBudgetVersion}:{}),evidenceManifestDigestSha256:row.evidenceManifestDigestSha256,riskProfileDigestSha256:row.riskProfileDigestSha256,gates,blockingGapRefs,conditionGapRefs,evidenceCoverageBps:row.evidenceCoverageBps,
    decision:row.decision,deterministicMaximumDecision:row.deterministicMaximumDecision,rationale:row.rationale,reviewerRef:row.reviewerRef,reviewedAt:row.reviewedAt,digestSha256:row.digestSha256,
  });
}

export async function loadPersistedCapitalReadinessSnapshot(executor:CapitalReadinessSqlExecutor,tenantId:string,projectId:string,assessmentVersion:number):Promise<PersistedCapitalReadinessSnapshot>{
  nonBlank(tenantId,'LOAD_READINESS_TENANT_REQUIRED');nonBlank(projectId,'LOAD_READINESS_PROJECT_REQUIRED');positiveInteger(assessmentVersion,'LOAD_READINESS_VERSION_INVALID');
  return inTenantTransaction(executor,tenantId,async tx=>{
    const assessmentResult=await tx.query<AssessmentRow>(`/* capital-readiness:load-assessment */
      SELECT assessment_id AS "assessmentId",tenant_id AS "tenantId",project_id AS "projectId",version,intake_id AS "intakeId",intake_version AS "intakeVersion",
             policy_version AS "policyVersion",methodology_version AS "methodologyVersion",project_snapshot_ref AS "projectSnapshotRef",approved_budget_version AS "approvedBudgetVersion",
             evidence_manifest_as_of AS "evidenceManifestAsOf",risk_profile_as_of AS "riskProfileAsOf",evidence_manifest_digest_sha256 AS "evidenceManifestDigestSha256",
             risk_profile_digest_sha256 AS "riskProfileDigestSha256",source_risk_digest_sha256 AS "sourceRiskDigestSha256",evidence_coverage_bps AS "evidenceCoverageBps",
             decision,deterministic_maximum_decision AS "deterministicMaximumDecision",rationale,reviewer_ref AS "reviewerRef",reviewed_at AS "reviewedAt",digest_sha256 AS "digestSha256",created_at AS "persistedAt"
      FROM agroway_invest.readiness_assessment WHERE tenant_id=$1 AND project_id=$2 AND version=$3`,[tenantId,projectId,assessmentVersion]);
    rowCount(assessmentResult,1,'LOAD_ASSESSMENT_ROWCOUNT');const ar=assessmentResult.rows[0];sameScope(tenantId,projectId,ar.tenantId,ar.projectId,'LOAD_ASSESSMENT_SCOPE_MISMATCH');
    const gatesResult=await tx.query<GateRow>(`/* capital-readiness:load-gates */
      SELECT tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gate_id AS "gateId",result,rationale,
             evidence_refs AS "evidenceRefs",confidence_bps AS "confidenceBps",assessed_at AS "assessedAt",assessed_by AS "assessedBy",method_version AS "methodVersion"
      FROM agroway_invest.readiness_gate_assessment WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4`,[tenantId,projectId,ar.assessmentId,ar.version]);
    const gapResult=await tx.query<GapRow>(`/* capital-readiness:load-gaps */
      SELECT gap_id AS "gapId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gate_id AS "gateId",code,severity,blocking,description,
             source_ref AS "sourceRef",owner_ref AS "ownerRef",due_at AS "dueAt",required_evidence_roles AS "requiredEvidenceRoles",opened_at AS "openedAt"
      FROM agroway_invest.readiness_gap WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4`,[tenantId,projectId,ar.assessmentId,ar.version]);
    const gapTransitionsResult=await tx.query<GapTransitionRow>(`/* capital-readiness:load-gap-transitions */
      SELECT transition_id AS "transitionId",tenant_id AS "tenantId",project_id AS "projectId",assessment_id AS "assessmentId",assessment_version AS "assessmentVersion",gap_id AS "gapId",sequence,
             from_state AS "fromState",to_state AS "toState",actor_ref AS "actorRef",resolution_evidence_refs AS "resolutionEvidenceRefs",note,occurred_at AS "occurredAt"
      FROM agroway_invest.readiness_gap_transition WHERE tenant_id=$1 AND project_id=$2 AND assessment_id=$3 AND assessment_version=$4 ORDER BY gap_id,sequence`,[tenantId,projectId,ar.assessmentId,ar.version]);
    const hydratedGaps=Object.freeze([...gapResult.rows].sort((a,b)=>GATE_ORDER.indexOf(a.gateId)-GATE_ORDER.indexOf(b.gateId)||a.code.localeCompare(b.code)||a.gapId.localeCompare(b.gapId)).map(def=>{
      sameScope(tenantId,projectId,def.tenantId,def.projectId,'LOAD_GAP_SCOPE_MISMATCH');if(def.assessmentId!==ar.assessmentId||def.assessmentVersion!==ar.version)throw new Error('LOAD_GAP_ASSESSMENT_MISMATCH');
      return hydrateGap(def,gapTransitionsResult.rows.filter(t=>t.gapId===def.gapId));
    }));
    const transitionGapIds=new Set(gapTransitionsResult.rows.map(t=>t.gapId));for(const id of transitionGapIds)if(!hydratedGaps.some(g=>g.gapId===id))throw new Error('LOAD_ORPHAN_GAP_TRANSITION');
    const assessment=hydrateAssessment(ar,gatesResult.rows,hydratedGaps);
    const intakeResult=await tx.query<IntakeRow>(`/* capital-readiness:load-intake */
      SELECT intake_id AS "intakeId",tenant_id AS "tenantId",project_id AS "projectId",intake_version AS "intakeVersion",source_type AS "sourceType",source_ref AS "sourceRef",
             originator_ref AS "originatorRef",consent_set_ref AS "consentSetRef",data_pack_version AS "dataPackVersion",supersedes_intake_id AS "supersedesIntakeId",created_at AS "createdAt"
      FROM agroway_invest.capital_pilot_intake WHERE tenant_id=$1 AND project_id=$2 AND intake_id=$3 AND intake_version=$4`,[tenantId,projectId,assessment.intakeId,assessment.intakeVersion]);
    rowCount(intakeResult,1,'LOAD_INTAKE_ROWCOUNT');const intakeIdentity=intakeResult.rows[0];sameScope(tenantId,projectId,intakeIdentity.tenantId,intakeIdentity.projectId,'LOAD_INTAKE_SCOPE_MISMATCH');
    const intakeTransitionsResult=await tx.query<IntakeTransitionRow>(`/* capital-readiness:load-intake-transitions */
      SELECT transition_id AS "transitionId",tenant_id AS "tenantId",project_id AS "projectId",intake_id AS "intakeId",intake_version AS "intakeVersion",sequence,
             from_state AS "fromState",to_state AS "toState",actor_ref AS "actorRef",reason,occurred_at AS "occurredAt"
      FROM agroway_invest.capital_pilot_intake_transition WHERE tenant_id=$1 AND project_id=$2 AND intake_id=$3 AND intake_version=$4 ORDER BY sequence`,[tenantId,projectId,assessment.intakeId,assessment.intakeVersion]);
    const intake=validateIntakeRows(intakeIdentity,intakeTransitionsResult.rows);
    if(intake.intakeId!==assessment.intakeId||intake.intakeVersion!==assessment.intakeVersion)throw new Error('LOAD_ASSESSMENT_INTAKE_BINDING_MISMATCH');
    return Object.freeze({
      tenantId,projectId,intake,assessment,gaps:hydratedGaps,
      proof:Object.freeze({evidenceManifestAsOf:ar.evidenceManifestAsOf,riskProfileAsOf:ar.riskProfileAsOf,evidenceManifestDigestSha256:ar.evidenceManifestDigestSha256,riskProfileDigestSha256:ar.riskProfileDigestSha256,sourceRiskDigestSha256:ar.sourceRiskDigestSha256,persistedAt:ar.persistedAt}),
      storageBoundary:Object.freeze({
        canonicalPersisted:Object.freeze(['CAPITAL_PILOT_INTAKE','INTAKE_TRANSITION_HISTORY','FINAL_READINESS_ASSESSMENT','G1_G9_DECISION_BASIS','READINESS_GAP_DEFINITION','GAP_TRANSITION_HISTORY']),
        rebuildableNotHydrated:Object.freeze(['EVIDENCE_MANIFEST','PRODUCTIVE_RISK_PROFILE','CAPITAL_READINESS_PACKAGE','CONTROL_READINESS_MODEL','CONTROL_READINESS_EXCEPTIONS']),
        readOnlyHydration:true,canonicalMutationBridgeAvailable:false,financialMutationAvailable:false,aiAuthority:'ADVISORY_ONLY',
      }),
    });
  });
}

export const CAPITAL_READINESS_PERSISTENCE_AUTHORITY_BOUNDARY=Object.freeze({
  databaseDriverBundled:false,
  canonicalDomainEventsPublished:false,
  controlToInvestMutationBridge:false,
  projectEligibilityMutation:false,
  projectStateMutation:false,
  financingApproval:false,
  investmentRecommendation:false,
  custody:false,
  paymentExecution:false,
  disbursementAuthority:false,
  aiFinalReadinessAuthority:false,
} as const);
