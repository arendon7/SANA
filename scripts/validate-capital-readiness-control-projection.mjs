import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-control-projection';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/control-tower-projector/src/index.ts','--ignoreConfig',
  '--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_CONTROL_PROJECTION_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await mkdir(`${tmp}/services/control-tower-projector`,{recursive:true});
await writeFile(`${tmp}/services/control-tower-projector/package.json`,JSON.stringify({type:'module'}));
const runtimeUrl=pathToFileURL(resolve(tmp,'services/control-tower-projector/src/index.js')).href;
const mod=await import(`${runtimeUrl}?v=${Date.now()}`);

function assert(condition,message){if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)}
function expectThrow(fn,code){let threw=false;try{fn()}catch(error){threw=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(threw,`EXPECTED_THROW_${code}`)}
function pass(name){console.log(`PASS ${name}`)}

const tenantId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId='11111111-1111-4111-8111-111111111111';
const asOf='2026-08-12T12:00:00.000Z';
const later='2026-08-13T12:00:00.000Z';
const digest='a'.repeat(64);
const assessment=Object.freeze({
  assessmentId:'assessment:hass:v1',tenantId,projectId,version:1,intakeId:'66666666-6666-4666-8666-666666666666',intakeVersion:1,
  policyVersion:'int1-policy-v1',methodologyVersion:'int1-method-v1',projectSnapshotRef:'snapshot:hass:v1',approvedBudgetVersion:1,
  evidenceManifestDigestSha256:digest,riskProfileDigestSha256:'b'.repeat(64),gates:Object.freeze([]),
  blockingGapRefs:Object.freeze(['gap:g5-a','gap:g5-b']),conditionGapRefs:Object.freeze(['gap:g8-condition']),evidenceCoverageBps:9000,
  decision:'NOT_CAPITAL_READY',deterministicMaximumDecision:'NOT_CAPITAL_READY',rationale:'Market pathway incomplete.',reviewerRef:'human:reviewer',reviewedAt:'2026-08-12T11:00:00.000Z',digestSha256:'c'.repeat(64),
});
const gaps=Object.freeze([
  Object.freeze({gapId:'gap:g5-b',tenantId,projectId,assessmentVersion:1,gateId:'G5_MARKET',code:'OFFTAKE_MISSING',severity:'CRITICAL',blocking:true,state:'OPEN',description:'Offtake evidence missing',sourceRef:'gate:G5_MARKET',requiredEvidenceRoles:Object.freeze(['MARKET_PATHWAY']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T10:00:00.000Z'}),
  Object.freeze({gapId:'gap:g8-condition',tenantId,projectId,assessmentVersion:1,gateId:'G8_IMPACT',code:'IMPACT_BASELINE_PARTIAL',severity:'WARNING',blocking:false,state:'IN_REMEDIATION',description:'Impact baseline partially complete',sourceRef:'gate:G8_IMPACT',requiredEvidenceRoles:Object.freeze(['IMPACT_BASELINE']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T10:05:00.000Z'}),
  Object.freeze({gapId:'gap:g5-a',tenantId,projectId,assessmentVersion:1,gateId:'G5_MARKET',code:'BUYER_EVIDENCE_MISSING',severity:'CRITICAL',blocking:true,state:'EVIDENCE_SUBMITTED',description:'Buyer evidence incomplete',sourceRef:'gate:G5_MARKET',requiredEvidenceRoles:Object.freeze(['MARKET_PATHWAY']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T10:10:00.000Z'}),
]);

const baseInput=Object.freeze({
  snapshotId:'tower:1',tenantId,asOf,
  network:Object.freeze({producerCount:1,farmCount:1,activeAreaHa:12,activeCropCycleCount:2}),
  agronomy:Object.freeze({healthyCycles:2,watchCycles:0,criticalCycles:0,openAlerts:0,criticalAlerts:0}),
  operations:Object.freeze({plannedActivities:10,completedActivities:8,dueActivities:2,overdueActivities:0}),
  supply:Object.freeze({openOrders:0,fillRateBps:10_000,inventoryCoverageDays:30}),
  demand:Object.freeze([]),impact:Object.freeze([]),watermarks:Object.freeze([]),projects:Object.freeze([]),
  thresholds:Object.freeze({maxOverdueActivities:3,minInventoryCoverageDays:7,raiseAgronomyCriticalWhenCriticalAlertsAtLeast:1}),
});

const noReadiness=mod.projectControlTowerSnapshot(baseInput);
assert(noReadiness.exceptions.length===0,'OMITTED_READINESS_IS_BACKWARD_COMPATIBLE');
pass('NO_READINESS_BACKWARD_COMPATIBILITY');

const withReadiness=mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps}])});
const market=withReadiness.exceptions.find(x=>x.code==='CAPITAL_READINESS_G5_MARKET_BLOCKED');
const impact=withReadiness.exceptions.find(x=>x.code==='CAPITAL_READINESS_G8_IMPACT_CONDITION');
assert(market&&market.severity==='CRITICAL','G5_BLOCKING_IS_CRITICAL');
assert(impact&&impact.severity==='WARNING','G8_CONDITION_IS_WARNING');
assert(withReadiness.exceptions.filter(x=>x.code==='CAPITAL_READINESS_G5_MARKET_BLOCKED').length===1,'MULTIPLE_G5_BLOCKERS_AGGREGATED');
assert(market.reason.includes('BUYER_EVIDENCE_MISSING, OFFTAKE_MISSING'),'BLOCKER_CODES_SORTED_DETERMINISTICALLY');
pass('READINESS_GAPS_PROJECT_TO_EXISTING_EXCEPTION_PRIMITIVE');

const reversed=mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps:Object.freeze([...gaps].reverse())}])});
const normalized=snapshot=>snapshot.exceptions.map(x=>({id:x.exceptionId,code:x.code,severity:x.severity,subjectRef:x.subjectRef,reason:x.reason,fingerprint:x.fingerprint,state:x.state,openedAt:x.openedAt,updatedAt:x.updatedAt}));
assert(JSON.stringify(normalized(withReadiness))===JSON.stringify(normalized(reversed)),'READINESS_PROJECTION_ORDER_INDEPENDENT');
pass('DETERMINISTIC_REBUILD');

const sourceBefore=JSON.stringify({assessment,gaps});
mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps}])});
assert(JSON.stringify({assessment,gaps})===sourceBefore,'PROJECTION_DOES_NOT_MUTATE_READINESS_CANON');
pass('PROJECTION_IS_NON_MUTATING');

const acknowledgedPrevious=Object.freeze(withReadiness.exceptions.map(x=>x.code==='CAPITAL_READINESS_G5_MARKET_BLOCKED'?Object.freeze({...x,state:'ACKNOWLEDGED'}):x));
const updated=mod.projectControlTowerSnapshot({...baseInput,asOf:later,capitalReadiness:Object.freeze([{assessment,gaps}]),previousExceptions:acknowledgedPrevious});
const updatedMarket=updated.exceptions.find(x=>x.code==='CAPITAL_READINESS_G5_MARKET_BLOCKED');
assert(updatedMarket.state==='ACKNOWLEDGED','ACTIVE_PREVIOUS_STATE_PRESERVED');
assert(updatedMarket.openedAt===market.openedAt&&updatedMarket.updatedAt===later,'ACTIVE_EXCEPTION_UPDATES_WITHOUT_REOPEN');
const resolvedPrevious=Object.freeze(withReadiness.exceptions.map(x=>x.code==='CAPITAL_READINESS_G5_MARKET_BLOCKED'?Object.freeze({...x,state:'RESOLVED'}):x));
const reopened=mod.projectControlTowerSnapshot({...baseInput,asOf:later,capitalReadiness:Object.freeze([{assessment,gaps}]),previousExceptions:resolvedPrevious});
const reopenedMarket=reopened.exceptions.find(x=>x.code==='CAPITAL_READINESS_G5_MARKET_BLOCKED');
assert(reopenedMarket.state==='OPEN'&&reopenedMarket.openedAt===later,'RESOLVED_EXCEPTION_REOPENS_IF_CANONICAL_GAP_REAPPEARS');
assert(reopenedMarket.exceptionId===market.exceptionId&&reopenedMarket.fingerprint===market.fingerprint,'REOPEN_USES_STABLE_ID_AND_FINGERPRINT');
pass('PREVIOUS_EXCEPTION_UPDATE_AND_REOPEN_BEHAVIOR');

const closedGaps=Object.freeze(gaps.map(g=>Object.freeze({...g,state:g.blocking?'RESOLVED':'WAIVED'})));
const closedProjection=mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps:closedGaps}])});
assert(!closedProjection.exceptions.some(x=>x.code.startsWith('CAPITAL_READINESS_G')),'CLOSED_OR_WAIVED_GAPS_DO_NOT_PROJECT_ACTIVE_EXCEPTION');
pass('CLOSED_GAPS_DO_NOT_EMIT');

const reassessment=Object.freeze({...assessment,blockingGapRefs:Object.freeze([]),conditionGapRefs:Object.freeze([]),decision:'REASSESSMENT_REQUIRED',deterministicMaximumDecision:'CAPITAL_READY'});
const reassessmentProjection=mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment:reassessment,gaps:Object.freeze([])}])});
const reassessmentException=reassessmentProjection.exceptions.find(x=>x.code==='CAPITAL_READINESS_REASSESSMENT_REQUIRED');
assert(reassessmentException&&reassessmentException.severity==='WARNING','REASSESSMENT_PROJECTS_WARNING');
assert(reassessmentException.reason.includes('not a financing default or disbursement decision'),'REASSESSMENT_REASON_PRESERVES_FINANCIAL_BOUNDARY');
pass('REASSESSMENT_SIGNAL');

expectThrow(()=>mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment:Object.freeze({...assessment,tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}),gaps}])}),'READINESS_PROJECTION_TENANT_MISMATCH');
expectThrow(()=>mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps:Object.freeze(gaps.map((g,index)=>index===0?Object.freeze({...g,projectId:'99999999-9999-4999-8999-999999999999'}):g))}])}),'READINESS_PROJECTION_GAP_PROJECT_MISMATCH');
expectThrow(()=>mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps:Object.freeze(gaps.map((g,index)=>index===0?Object.freeze({...g,assessmentVersion:2}):g))}])}),'READINESS_PROJECTION_GAP_VERSION_MISMATCH');
expectThrow(()=>mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment:Object.freeze({...assessment,reviewedAt:'2026-09-01T00:00:00.000Z'}),gaps}])}),'READINESS_PROJECTION_ASSESSMENT_FROM_FUTURE');
expectThrow(()=>mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps:Object.freeze(gaps.map((g,index)=>index===0?Object.freeze({...g,openedAt:'2026-09-01T00:00:00.000Z'}):g))}])}),'READINESS_PROJECTION_GAP_FROM_FUTURE');
pass('SCOPE_VERSION_TIME_FAIL_CLOSED');

expectThrow(()=>mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps:Object.freeze(gaps.map((g,index)=>index===0?Object.freeze({...g,blocking:false}):g))}])}),'READINESS_PROJECTION_GAP_CLASSIFICATION_MISMATCH');
expectThrow(()=>mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps:Object.freeze(gaps.slice(0,2))}])}),'READINESS_PROJECTION_GAP_SET_MISMATCH');
expectThrow(()=>mod.projectControlTowerSnapshot({...baseInput,capitalReadiness:Object.freeze([{assessment,gaps},{assessment,gaps}])}),'READINESS_PROJECTION_DUPLICATE_PROJECT');
pass('GAP_MEMBERSHIP_AND_CLASSIFICATION_FAIL_CLOSED');

await rm(tmp,{recursive:true,force:true});
console.log('PASS_CAPITAL_READINESS_CONTROL_PROJECTION');
