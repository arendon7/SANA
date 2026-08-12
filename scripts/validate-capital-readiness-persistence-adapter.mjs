import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-persistence-adapter';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/investment-portfolio/src/readiness-persistence.ts','--ignoreConfig',
  '--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--strict','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_PERSISTENCE_ADAPTER_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await mkdir(`${tmp}/services/investment-portfolio`,{recursive:true});
await writeFile(`${tmp}/services/investment-portfolio/package.json`,JSON.stringify({type:'module'}));
const runtimeUrl=pathToFileURL(resolve(tmp,'services/investment-portfolio/src/readiness-persistence.js')).href;
const mod=await import(`${runtimeUrl}?v=${Date.now()}`);

function assert(condition,message){if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)}
function pass(name){console.log(`PASS ${name}`)}
async function expectReject(work,code){let threw=false;try{await work()}catch(error){threw=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(threw,`EXPECTED_REJECT_${code}`)}

class RecordingExecutor{
  constructor(responder=()=>({rows:[],rowCount:1})){this.responder=responder;this.calls=[];this.transactions=0;}
  async transaction(work){this.transactions++;const tx={query:async(sql,params=[])=>{const call={sql,params:[...params]};this.calls.push(call);return this.responder(sql,params,this.calls.length-1)}};return work(tx)}
}
const marker=(call)=>{const m=call.sql.match(/\/\* capital-readiness:([^*]+) \*\//);return m?.[1]?.trim()??'unknown'};

const tenantId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId='11111111-1111-4111-8111-111111111111';
const intakeId='22222222-2222-4222-8222-222222222222';
const digestA='a'.repeat(64),digestB='b'.repeat(64),digestC='c'.repeat(64),digestD='d'.repeat(64);
const gateIds=['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'];
const now='2026-08-12T11:00:00.000Z';
const intake=Object.freeze({intakeId,tenantId,projectId,intakeVersion:1,sourceType:'SANA_DIAGNOSTIC',sourceRef:"diagnostic:x'); DROP TABLE agroway_invest.project; --",originatorRef:'sana:test',consentSetRef:'consent:v1',dataPackVersion:'datapack-v1',state:'CREATED',createdAt:'2026-08-12T09:00:00.000Z',updatedAt:'2026-08-12T09:00:00.000Z'});

// Create intake: tenant binding must happen first; all caller data stays in params.
const createExec=new RecordingExecutor();
await mod.createPersistedCapitalPilotIntake(createExec,{intake,initialTransitionId:'33333333-3333-4333-8333-333333333333',actorRef:'human:originator'});
assert(createExec.transactions===1,'CREATE_INTAKE_SINGLE_TRANSACTION');
assert(createExec.calls.map(marker).join('|')==='tenant-context|create-intake|create-intake-transition','CREATE_INTAKE_SQL_ORDER');
assert(createExec.calls[0].params[0]===tenantId,'TENANT_BOUND_FIRST');
assert(createExec.calls.every(call=>!call.sql.includes(intake.sourceRef)),'USER_DATA_NOT_INTERPOLATED_IN_SQL');
assert(createExec.calls[1].params.includes(intake.sourceRef),'USER_DATA_PARAMETERIZED');
pass('CREATE_INTAKE_ATOMIC_PARAMETERIZED');

// Append intake transition uses persisted current state as optimistic guard.
const humanReview=Object.freeze({...intake,state:'HUMAN_REVIEW',updatedAt:'2026-08-12T10:30:00.000Z'});
const readyWithConditions=Object.freeze({...humanReview,state:'READY_WITH_CONDITIONS',updatedAt:'2026-08-12T11:05:00.000Z'});
const appendExec=new RecordingExecutor((sql)=>sql.includes('latest-intake-transition')?{rows:[{transitionId:'t',tenantId,projectId,intakeId,intakeVersion:1,sequence:6,fromState:'UNDER_ASSESSMENT',toState:'HUMAN_REVIEW',actorRef:'human:reviewer',reason:null,occurredAt:'2026-08-12T10:30:00.000Z'}],rowCount:1}:{rows:[],rowCount:1});
await mod.appendPersistedCapitalPilotIntakeTransition(appendExec,humanReview,readyWithConditions,{transitionId:'44444444-4444-4444-8444-444444444444',actorRef:'human:reviewer',reason:'final readiness state'});
assert(appendExec.calls.map(marker).join('|')==='tenant-context|latest-intake-transition|append-intake-transition','APPEND_INTAKE_ORDER');
assert(appendExec.calls.at(-1).params[5]===7,'APPEND_INTAKE_SEQUENCE_DERIVED');
pass('APPEND_INTAKE_OPTIMISTIC_STATE_GUARD');

const staleAppendExec=new RecordingExecutor((sql)=>sql.includes('latest-intake-transition')?{rows:[{transitionId:'t',tenantId,projectId,intakeId,intakeVersion:1,sequence:6,fromState:'ASSESSMENT_READY',toState:'UNDER_ASSESSMENT',actorRef:'human:x',reason:null,occurredAt:'2026-08-12T10:00:00.000Z'}],rowCount:1}:{rows:[],rowCount:1});
await expectReject(()=>mod.appendPersistedCapitalPilotIntakeTransition(staleAppendExec,humanReview,readyWithConditions,{transitionId:'44444444-4444-4444-8444-444444444445',actorRef:'human:reviewer'}),'PERSISTED_INTAKE_STATE_STALE');
assert(!staleAppendExec.calls.some(call=>marker(call)==='append-intake-transition'),'STALE_INTAKE_DOES_NOT_WRITE');
pass('STALE_INTAKE_FAILS_BEFORE_WRITE');

const gapId='readiness-gap:project:v1:G8_IMPACT:IMPACT_BASELINE_PARTIAL';
const gap=Object.freeze({gapId,tenantId,projectId,assessmentVersion:1,gateId:'G8_IMPACT',code:'IMPACT_BASELINE_PARTIAL',severity:'WARNING',blocking:false,state:'OPEN',description:'Impact baseline requires completion',sourceRef:'gate:G8_IMPACT',ownerRef:'impact:reviewer',requiredEvidenceRoles:Object.freeze(['IMPACT_BASELINE']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T10:20:00.000Z'});
const gates=Object.freeze(gateIds.map(gateId=>Object.freeze({gateId,result:gateId==='G8_IMPACT'?'PASS_WITH_CONDITIONS':'PASS',rationale:`${gateId} deterministic rationale`,evidenceRefs:Object.freeze([`evidence:${gateId}`]),confidenceBps:9000,blockingGapRefs:Object.freeze([]),conditionGapRefs:Object.freeze(gateId==='G8_IMPACT'?[gapId]:[]),assessedAt:'2026-08-12T10:40:00.000Z',assessedBy:'human:reviewer',methodVersion:'method-v1'})));
const assessment=Object.freeze({assessmentId:'assessment:project:v1',tenantId,projectId,version:1,intakeId,intakeVersion:1,policyVersion:'policy-v1',methodologyVersion:'method-v1',projectSnapshotRef:'snapshot:v1',evidenceManifestDigestSha256:digestA,riskProfileDigestSha256:digestB,gates,blockingGapRefs:Object.freeze([]),conditionGapRefs:Object.freeze([gapId]),evidenceCoverageBps:10000,decision:'CAPITAL_READY_WITH_CONDITIONS',deterministicMaximumDecision:'CAPITAL_READY_WITH_CONDITIONS',rationale:'Human final review with one impact condition',reviewerRef:'human:reviewer',reviewedAt:now,digestSha256:digestC});
const proof=Object.freeze({evidenceManifestAsOf:'2026-08-12T10:00:00.000Z',riskProfileAsOf:'2026-08-12T10:00:00.000Z',sourceRiskDigestSha256:digestD,persistedAt:'2026-08-12T11:01:00.000Z'});

const persistExec=new RecordingExecutor();
const sourceBefore=JSON.stringify({assessment,gap,proof});
await mod.persistFinalReadinessAssessment(persistExec,{assessment,gaps:Object.freeze([gap]),proof,initialGapTransitionIds:Object.freeze({[gapId]:'55555555-5555-4555-8555-555555555555'})});
const persistMarkers=persistExec.calls.map(marker);
assert(persistExec.transactions===1,'FINAL_ASSESSMENT_SINGLE_TRANSACTION');
assert(persistMarkers[0]==='tenant-context'&&persistMarkers[1]==='defer-finalization','FINAL_ASSESSMENT_TENANT_AND_DEFER_FIRST');
assert(persistMarkers.filter(x=>x==='insert-gate').length===9,'EXACTLY_NINE_GATE_INSERTS');
const gapIndex=persistMarkers.indexOf('insert-gap'),gapTransitionIndex=persistMarkers.indexOf('insert-gap-initial-transition'),parentIndex=persistMarkers.indexOf('insert-final-assessment-parent-last'),immediateIndex=persistMarkers.indexOf('check-finalization-now');
assert(gapIndex>persistMarkers.lastIndexOf('insert-gate'),'GAPS_AFTER_GATES');
assert(gapTransitionIndex>gapIndex,'GAP_INITIAL_TRANSITION_AFTER_GAP');
assert(parentIndex>gapTransitionIndex,'FINAL_PARENT_INSERTED_LAST');
assert(immediateIndex>parentIndex,'DEFERRED_INTEGRITY_FORCED_BEFORE_TRANSACTION_RETURN');
assert(JSON.stringify({assessment,gap,proof})===sourceBefore,'FINAL_ASSESSMENT_INPUTS_NOT_MUTATED');
pass('FINAL_ASSESSMENT_ATOMIC_ORDER_AND_IMMUTABILITY');

const brokenGateAssessment=Object.freeze({...assessment,gates:Object.freeze(gates.slice(0,8))});
await expectReject(()=>mod.persistFinalReadinessAssessment(new RecordingExecutor(),{assessment:brokenGateAssessment,gaps:Object.freeze([gap]),proof,initialGapTransitionIds:Object.freeze({[gapId]:'55555555-5555-4555-8555-555555555556'})}),'ASSESSMENT_REQUIRES_EXACTLY_NINE_GATES');
pass('WRITE_GATE_SET_FAIL_CLOSED');

await expectReject(()=>mod.appendPersistedReadinessGapTransition(new RecordingExecutor(),{transitionId:'66666666-6666-4666-8666-666666666666',tenantId,projectId,assessmentId:assessment.assessmentId,assessmentVersion:1,gapId,fromState:'OPEN',toState:'RESOLVED',actorRef:'human:reviewer',occurredAt:'2026-08-12T11:10:00.000Z'}),'READINESS_GAP_RESOLUTION_REQUIRES_EVIDENCE_AND_NOTE');
pass('GAP_RESOLUTION_PROOF_REQUIRED_BEFORE_SQL');

const gapAppendExec=new RecordingExecutor((sql)=>sql.includes('latest-gap-transition')?{rows:[{transitionId:'g0',tenantId,projectId,assessmentId:assessment.assessmentId,assessmentVersion:1,gapId,sequence:0,fromState:null,toState:'OPEN',actorRef:'human:reviewer',resolutionEvidenceRefs:[],note:null,occurredAt:gap.openedAt}],rowCount:1}:{rows:[],rowCount:1});
await mod.appendPersistedReadinessGapTransition(gapAppendExec,{transitionId:'66666666-6666-4666-8666-666666666667',tenantId,projectId,assessmentId:assessment.assessmentId,assessmentVersion:1,gapId,fromState:'OPEN',toState:'RESOLVED',actorRef:'human:reviewer',occurredAt:'2026-08-12T11:10:00.000Z',resolutionEvidenceRefs:Object.freeze(['evidence:impact-baseline']),note:'Verified impact baseline'});
assert(gapAppendExec.calls.map(marker).join('|')==='tenant-context|latest-gap-transition|append-gap-transition','GAP_APPEND_ORDER');
assert(gapAppendExec.calls.at(-1).params[6]===1,'GAP_APPEND_SEQUENCE_DERIVED');
pass('GAP_APPEND_OPTIMISTIC_AND_PARAMETERIZED');

// Deterministic hydration fixture: rows deliberately arrive out of canonical order.
const assessmentRow={assessmentId:assessment.assessmentId,tenantId,projectId,version:1,intakeId,intakeVersion:1,policyVersion:'policy-v1',methodologyVersion:'method-v1',projectSnapshotRef:'snapshot:v1',approvedBudgetVersion:null,evidenceManifestAsOf:proof.evidenceManifestAsOf,riskProfileAsOf:proof.riskProfileAsOf,evidenceManifestDigestSha256:digestA,riskProfileDigestSha256:digestB,sourceRiskDigestSha256:digestD,evidenceCoverageBps:10000,decision:'CAPITAL_READY_WITH_CONDITIONS',deterministicMaximumDecision:'CAPITAL_READY_WITH_CONDITIONS',rationale:assessment.rationale,reviewerRef:'human:reviewer',reviewedAt:now,digestSha256:digestC,persistedAt:proof.persistedAt};
const gateRows=[...gates].reverse().map(g=>({tenantId,projectId,assessmentId:assessment.assessmentId,assessmentVersion:1,gateId:g.gateId,result:g.result,rationale:g.rationale,evidenceRefs:[...g.evidenceRefs],confidenceBps:g.confidenceBps,assessedAt:g.assessedAt,assessedBy:g.assessedBy,methodVersion:g.methodVersion}));
const gapRow={gapId,tenantId,projectId,assessmentId:assessment.assessmentId,assessmentVersion:1,gateId:'G8_IMPACT',code:gap.code,severity:'WARNING',blocking:false,description:gap.description,sourceRef:gap.sourceRef,ownerRef:'impact:reviewer',dueAt:null,requiredEvidenceRoles:['IMPACT_BASELINE'],openedAt:gap.openedAt};
const gapTransitions=[
 {transitionId:'g1',tenantId,projectId,assessmentId:assessment.assessmentId,assessmentVersion:1,gapId,sequence:1,fromState:'OPEN',toState:'RESOLVED',actorRef:'human:reviewer',resolutionEvidenceRefs:['evidence:impact-baseline'],note:'Verified impact baseline',occurredAt:'2026-08-12T11:10:00.000Z'},
 {transitionId:'g0',tenantId,projectId,assessmentId:assessment.assessmentId,assessmentVersion:1,gapId,sequence:0,fromState:null,toState:'OPEN',actorRef:'human:reviewer',resolutionEvidenceRefs:[],note:null,occurredAt:gap.openedAt},
];
const intakeRow={intakeId,tenantId,projectId,intakeVersion:1,sourceType:'SANA_DIAGNOSTIC',sourceRef:'diagnostic:fixture',originatorRef:'sana:test',consentSetRef:'consent:v1',dataPackVersion:'datapack-v1',supersedesIntakeId:null,createdAt:'2026-08-12T09:00:00.000Z'};
const intakeTransitions=[
 {transitionId:'i6',tenantId,projectId,intakeId,intakeVersion:1,sequence:6,fromState:'UNDER_ASSESSMENT',toState:'HUMAN_REVIEW',actorRef:'human:reviewer',reason:null,occurredAt:'2026-08-12T10:30:00.000Z'},
 {transitionId:'i7',tenantId,projectId,intakeId,intakeVersion:1,sequence:7,fromState:'HUMAN_REVIEW',toState:'READY_WITH_CONDITIONS',actorRef:'human:reviewer',reason:null,occurredAt:'2026-08-12T11:05:00.000Z'},
 {transitionId:'i0',tenantId,projectId,intakeId,intakeVersion:1,sequence:0,fromState:null,toState:'CREATED',actorRef:'human:originator',reason:null,occurredAt:'2026-08-12T09:00:00.000Z'},
 {transitionId:'i1',tenantId,projectId,intakeId,intakeVersion:1,sequence:1,fromState:'CREATED',toState:'CANONICAL_REUSE_SCAN',actorRef:'human:x',reason:null,occurredAt:'2026-08-12T09:05:00.000Z'},
 {transitionId:'i2',tenantId,projectId,intakeId,intakeVersion:1,sequence:2,fromState:'CANONICAL_REUSE_SCAN',toState:'DATA_COMPLETION',actorRef:'human:x',reason:null,occurredAt:'2026-08-12T09:10:00.000Z'},
 {transitionId:'i3',tenantId,projectId,intakeId,intakeVersion:1,sequence:3,fromState:'DATA_COMPLETION',toState:'EVIDENCE_VALIDATION',actorRef:'human:x',reason:null,occurredAt:'2026-08-12T09:15:00.000Z'},
 {transitionId:'i4',tenantId,projectId,intakeId,intakeVersion:1,sequence:4,fromState:'EVIDENCE_VALIDATION',toState:'ASSESSMENT_READY',actorRef:'human:x',reason:null,occurredAt:'2026-08-12T09:20:00.000Z'},
 {transitionId:'i5',tenantId,projectId,intakeId,intakeVersion:1,sequence:5,fromState:'ASSESSMENT_READY',toState:'UNDER_ASSESSMENT',actorRef:'human:x',reason:null,occurredAt:'2026-08-12T09:25:00.000Z'},
];
function hydrationResponder(sql){
 if(sql.includes('load-assessment'))return {rows:[assessmentRow],rowCount:1};
 if(sql.includes('load-gates'))return {rows:gateRows,rowCount:gateRows.length};
 if(sql.includes('load-gaps'))return {rows:[gapRow],rowCount:1};
 if(sql.includes('load-gap-transitions'))return {rows:gapTransitions,rowCount:gapTransitions.length};
 if(sql.includes('load-intake-transitions'))return {rows:intakeTransitions,rowCount:intakeTransitions.length};
 if(sql.includes('load-intake'))return {rows:[intakeRow],rowCount:1};
 return {rows:[],rowCount:1};
}
const hydrateExec=new RecordingExecutor(hydrationResponder);
const snapshot=await mod.loadPersistedCapitalReadinessSnapshot(hydrateExec,tenantId,projectId,1);
assert(snapshot.assessment.gates.map(g=>g.gateId).join('|')===gateIds.join('|'),'HYDRATED_GATES_CANONICAL_ORDER');
assert(snapshot.intake.state==='READY_WITH_CONDITIONS','HYDRATED_CURRENT_INTAKE_STATE');
assert(snapshot.gaps.length===1&&snapshot.gaps[0].state==='RESOLVED','HYDRATED_CURRENT_GAP_STATE');
assert(snapshot.gaps[0].resolutionEvidenceRefs[0]==='evidence:impact-baseline','HYDRATED_RESOLUTION_PROOF');
assert(snapshot.assessment.conditionGapRefs[0]===gapId,'IMMUTABLE_ASSESSMENT_CONDITION_PRESERVED_AFTER_GAP_RESOLUTION');
assert(snapshot.proof.sourceRiskDigestSha256===digestD,'PERSISTED_SOURCE_RISK_PROOF_EXPOSED');
assert(snapshot.storageBoundary.readOnlyHydration===true&&snapshot.storageBoundary.canonicalMutationBridgeAvailable===false&&snapshot.storageBoundary.financialMutationAvailable===false,'HYDRATION_AUTHORITY_BOUNDARY');
assert(snapshot.storageBoundary.rebuildableNotHydrated.includes('EVIDENCE_MANIFEST')&&snapshot.storageBoundary.rebuildableNotHydrated.includes('PRODUCTIVE_RISK_PROFILE'),'NO_REBUILDABLE_FACT_FABRICATION');
assert(!('evidenceManifest' in snapshot)&&!('riskProfile' in snapshot)&&!('capitalReadinessPackage' in snapshot),'NO_FAKE_REBUILDABLE_OBJECTS');
assert(hydrateExec.calls[0].params[0]===tenantId&&marker(hydrateExec.calls[0])==='tenant-context','READ_TENANT_CONTEXT_FIRST');
pass('READ_HYDRATION_CANONICAL_VS_CURRENT_STATE_BOUNDARY');

const reorderedExec=new RecordingExecutor(hydrationResponder);
const snapshotAgain=await mod.loadPersistedCapitalReadinessSnapshot(reorderedExec,tenantId,projectId,1);
assert(JSON.stringify(snapshot)===JSON.stringify(snapshotAgain),'HYDRATION_DETERMINISTIC');
pass('READ_HYDRATION_DETERMINISTIC');

const missingGateExec=new RecordingExecutor(sql=>sql.includes('load-gates')?{rows:gateRows.slice(0,8),rowCount:8}:hydrationResponder(sql));
await expectReject(()=>mod.loadPersistedCapitalReadinessSnapshot(missingGateExec,tenantId,projectId,1),'HYDRATE_ASSESSMENT_GATE_SET_INVALID');
const sequenceGapRows=gapTransitions.map(x=>x.sequence===1?{...x,sequence:2}:x);
const gapSequenceExec=new RecordingExecutor(sql=>sql.includes('load-gap-transitions')?{rows:sequenceGapRows,rowCount:2}:hydrationResponder(sql));
await expectReject(()=>mod.loadPersistedCapitalReadinessSnapshot(gapSequenceExec,tenantId,projectId,1),'HYDRATE_GAP_TRANSITION_SEQUENCE_GAP');
const badDigestExec=new RecordingExecutor(sql=>sql.includes('load-assessment')?{rows:[{...assessmentRow,sourceRiskDigestSha256:'bad'}],rowCount:1}:hydrationResponder(sql));
await expectReject(()=>mod.loadPersistedCapitalReadinessSnapshot(badDigestExec,tenantId,projectId,1),'HYDRATE_SOURCE_RISK_DIGEST_INVALID');
const crossTenantGateExec=new RecordingExecutor(sql=>sql.includes('load-gates')?{rows:gateRows.map((g,i)=>i===0?{...g,tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}:g),rowCount:9}:hydrationResponder(sql));
await expectReject(()=>mod.loadPersistedCapitalReadinessSnapshot(crossTenantGateExec,tenantId,projectId,1),'HYDRATE_GATE_SCOPE_MISMATCH');
pass('READ_HYDRATION_ADVERSARIAL_FAIL_CLOSED');

for(const [key,value] of Object.entries(mod.CAPITAL_READINESS_PERSISTENCE_AUTHORITY_BOUNDARY)){
 if(key==='databaseDriverBundled'||key==='canonicalDomainEventsPublished'||key==='controlToInvestMutationBridge'||key==='projectEligibilityMutation'||key==='projectStateMutation'||key==='financingApproval'||key==='investmentRecommendation'||key==='custody'||key==='paymentExecution'||key==='disbursementAuthority'||key==='aiFinalReadinessAuthority')assert(value===false,`AUTHORITY_BOUNDARY_${key}`);
}
pass('PERSISTENCE_AUTHORITY_BOUNDARY');

await rm(tmp,{recursive:true,force:true});
console.log('PASS_CAPITAL_READINESS_PERSISTENCE_ADAPTER_INT16_CD');
