import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-control-model';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'apps/control-web/src/capital-readiness-model.ts','--ignoreConfig',
  '--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_CONTROL_MODEL_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await mkdir(`${tmp}/apps/control-web`,{recursive:true});
await writeFile(`${tmp}/apps/control-web/package.json`,JSON.stringify({type:'module'}));
const runtimeUrl=pathToFileURL(resolve(tmp,'apps/control-web/src/capital-readiness-model.js')).href;
const mod=await import(`${runtimeUrl}?v=${Date.now()}`);

function assert(condition,message){if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)}
function expectThrow(fn,code){let threw=false;try{fn()}catch(error){threw=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(threw,`EXPECTED_THROW_${code}`)}
function pass(name){console.log(`PASS ${name}`)}

const tenantId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId='11111111-1111-4111-8111-111111111111';
const digestA='a'.repeat(64),digestB='b'.repeat(64),digestC='c'.repeat(64),digestD='d'.repeat(64),digestE='e'.repeat(64);
const gateIds=['G1_ACTOR','G2_ASSET','G3_AGRONOMY','G4_BUDGET','G5_MARKET','G6_RISK','G7_TRACEABILITY','G8_IMPACT','G9_FINANCIAL_STRUCTURE'];
const riskIds=['PRODUCER','OPERATION','AGRONOMY','DATA','FINANCIAL','MARKET','CLIMATE','TRACEABILITY','MANAGEMENT'];
const financialLimitations=Object.freeze(['CAPITAL_READY_IS_NOT_FINANCING_APPROVAL','NO_RETURN_OR_REPAYMENT_GUARANTEE','NO_CUSTODY_OR_DISBURSEMENT_AUTHORITY']);
const gates=Object.freeze(gateIds.map(gateId=>Object.freeze({gateId,result:gateId==='G5_MARKET'?'BLOCKED':gateId==='G8_IMPACT'?'PASS_WITH_CONDITIONS':'PASS',rationale:`${gateId} rationale`,evidenceRefs:Object.freeze([`evidence:${gateId}`]),confidenceBps:9000,blockingGapRefs:Object.freeze(gateId==='G5_MARKET'?['gap:g5']:[]),conditionGapRefs:Object.freeze(gateId==='G8_IMPACT'?['gap:g8']:[]),assessedAt:'2026-08-12T10:00:00.000Z',assessedBy:'human:reviewer',methodVersion:'method-v1'})));
const pkg=Object.freeze({
  packageId:'capital-readiness:project:v1',tenantId,projectId,assessmentId:'assessment:v1',assessmentVersion:1,assessmentDigestSha256:digestC,policyVersion:'policy-v1',methodologyVersion:'method-v1',projectSnapshotRef:'snapshot:v1',generatedAt:'2026-08-12T12:00:00.000Z',decision:'NOT_CAPITAL_READY',projectState:'UNDER_REVIEW',projectEligibility:'NOT_EVALUATED',
  productionRef:Object.freeze({producerId:'producer:1',farmId:'farm:1',plotIds:Object.freeze(['plot:1']),cropCycleIds:Object.freeze(['cycle:1'])}),currency:'COP',requiredMinor:25_000_000_00,approvedBudgetVersion:1,evidenceManifestDigestSha256:digestA,riskProfileDigestSha256:digestB,gateAssessments:gates,openConditionGapRefs:Object.freeze(['gap:g8']),limitations:financialLimitations,provenanceRefs:Object.freeze(['assessment:'+digestC,'manifest:'+digestA,'risk:'+digestB]),financialAuthority:'READINESS_ONLY_NO_FINANCING_APPROVAL',digestSha256:digestD,
});
const manifest=Object.freeze({manifestId:'manifest:v1',tenantId,projectId,policyVersion:'policy-v1',asOf:'2026-08-12T11:00:00.000Z',items:Object.freeze([]),acceptedEvidenceRefs:Object.freeze(gateIds.map(x=>`evidence:${x}`)),rejectedEvidenceRefs:Object.freeze(['evidence:rejected']),coverageByGate:Object.freeze([]),totalCoverageBps:8889,limitations:Object.freeze(['G5_MARKET:MARKET_EVIDENCE_INCOMPLETE']),digestSha256:digestA});
const riskProfile=Object.freeze({profileId:'risk:v1',tenantId,projectId,asOf:'2026-08-12T11:00:00.000Z',dimensions:Object.freeze(riskIds.map((dimension,index)=>Object.freeze({dimension,state:dimension==='MARKET'?'LIMITING':'FAVORABLE',trend:'STABLE',evidenceRefs:Object.freeze([`risk-evidence:${index}`]),confidenceBps:8500,principalDrivers:Object.freeze(dimension==='MARKET'?['BUYER_EVIDENCE_GAP']:[]),mitigations:Object.freeze([]),unresolvedRiskRefs:Object.freeze(dimension==='MARKET'?['risk:market']:[])}))),openCriticalRiskRefs:Object.freeze([]),sourceRiskDigestSha256:digestE,limitations:Object.freeze([]),digestSha256:digestB});
const gaps=Object.freeze([
  Object.freeze({gapId:'gap:g8',tenantId,projectId,assessmentVersion:1,gateId:'G8_IMPACT',code:'IMPACT_BASELINE_PARTIAL',severity:'WARNING',blocking:false,state:'IN_REMEDIATION',description:'Impact baseline incomplete',sourceRef:'gate:G8_IMPACT',ownerRef:'impact:reviewer',requiredEvidenceRoles:Object.freeze(['IMPACT_BASELINE']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T09:10:00.000Z'}),
  Object.freeze({gapId:'gap:g5',tenantId,projectId,assessmentVersion:1,gateId:'G5_MARKET',code:'MARKET_PATHWAY_INCOMPLETE',severity:'CRITICAL',blocking:true,state:'OPEN',description:'Market pathway incomplete',sourceRef:'gate:G5_MARKET',ownerRef:'commercial:lead',requiredEvidenceRoles:Object.freeze(['MARKET_PATHWAY']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T09:00:00.000Z'}),
]);
const exceptions=Object.freeze([
  Object.freeze({exceptionId:'ex:g8',tenantId,code:'CAPITAL_READINESS_G8_IMPACT_CONDITION',severity:'WARNING',state:'ACKNOWLEDGED',subjectRef:`project:${projectId}`,reason:'G8 condition',fingerprint:`${tenantId}:CAPITAL_READINESS_G8_IMPACT_CONDITION:project:${projectId}`,openedAt:'2026-08-12T10:00:00.000Z',updatedAt:'2026-08-12T11:00:00.000Z'}),
  Object.freeze({exceptionId:'ex:other-domain',tenantId,code:'OPEN_CRITICAL_INVESTMENT_RISK',severity:'CRITICAL',state:'OPEN',subjectRef:`project:${projectId}`,reason:'Existing investment risk',fingerprint:`${tenantId}:OPEN_CRITICAL_INVESTMENT_RISK:project:${projectId}`,openedAt:'2026-08-12T10:00:00.000Z',updatedAt:'2026-08-12T11:00:00.000Z'}),
  Object.freeze({exceptionId:'ex:g5',tenantId,code:'CAPITAL_READINESS_G5_MARKET_BLOCKED',severity:'CRITICAL',state:'OPEN',subjectRef:`project:${projectId}`,reason:'G5 blocked',fingerprint:`${tenantId}:CAPITAL_READINESS_G5_MARKET_BLOCKED:project:${projectId}`,openedAt:'2026-08-12T10:00:00.000Z',updatedAt:'2026-08-12T11:00:00.000Z'}),
  Object.freeze({exceptionId:'ex:other-project',tenantId,code:'CAPITAL_READINESS_G5_MARKET_BLOCKED',severity:'CRITICAL',state:'OPEN',subjectRef:'project:other',reason:'Other project',fingerprint:`${tenantId}:CAPITAL_READINESS_G5_MARKET_BLOCKED:project:other`,openedAt:'2026-08-12T10:00:00.000Z',updatedAt:'2026-08-12T11:00:00.000Z'}),
]);

const sourceBefore=JSON.stringify({pkg,manifest,riskProfile,gaps,exceptions});
const model=mod.buildCapitalReadinessControlModel({package:pkg,manifest,riskProfile,gaps,controlExceptions:exceptions});
assert(model.model==='CAPITAL_READINESS_CONTROL_READ_ONLY','MODEL_ID');
assert(model.gates.length===9&&model.gates.map(x=>x.gateId).join('|')===gateIds.join('|'),'GATES_CANONICALLY_ORDERED');
assert(model.activeBlockingGaps.length===1&&model.activeBlockingGaps[0].gapId==='gap:g5','ACTIVE_BLOCKER_VISIBLE');
assert(model.activeConditions.length===1&&model.activeConditions[0].gapId==='gap:g8','ACTIVE_CONDITION_VISIBLE');
assert(model.risks.length===9&&model.risks.map(x=>x.dimension).join('|')===riskIds.join('|'),'RISK_VECTOR_CANONICALLY_ORDERED');
assert(!('score' in model)&&!('creditScore' in model),'NO_MAGIC_CREDIT_SCORE');
assert(model.exceptions.length===2&&model.exceptions.every(x=>x.code.startsWith('CAPITAL_READINESS_')),'ONLY_PROJECT_READINESS_EXCEPTIONS_INCLUDED');
assert(model.evidence.coverageBps===8889&&model.evidence.acceptedCount===9&&model.evidence.rejectedCount===1,'EVIDENCE_SUMMARY');
assert(model.trust.readOnly===true&&model.trust.canonicalMutationAvailable===false&&model.trust.financialMutationAvailable===false,'READ_ONLY_MUTATION_BOUNDARY');
assert(model.trust.aiAuthority==='ADVISORY_ONLY'&&model.trust.financialAuthority==='READINESS_ONLY_NO_FINANCING_APPROVAL','AI_FINANCIAL_AUTHORITY_BOUNDARY');
assert(model.trust.financingApproval===false&&model.trust.investmentRecommendation===false&&model.trust.disbursementAuthority===false&&model.trust.returnGuarantee===false,'NO_FINANCIAL_PROMISE_OR_EXECUTION');
assert(model.decisionLabel.includes('SANA readiness'),'DECISION_COPY_PRESERVES_READINESS_SCOPE');
assert(model.limitations.every(x=>typeof x==='string')&&financialLimitations.every(x=>model.limitations.includes(x)),'FINANCIAL_LIMITATIONS_VISIBLE');
assert(JSON.stringify({pkg,manifest,riskProfile,gaps,exceptions})===sourceBefore,'SOURCE_INPUTS_NOT_MUTATED');
pass('READ_ONLY_MODEL_HAPPY_PATH');

const reversedPackage=Object.freeze({...pkg,gateAssessments:Object.freeze([...gates].reverse())});
const reversedRisk=Object.freeze({...riskProfile,dimensions:Object.freeze([...riskProfile.dimensions].reverse())});
const reordered=mod.buildCapitalReadinessControlModel({package:reversedPackage,manifest,riskProfile:reversedRisk,gaps:Object.freeze([...gaps].reverse()),controlExceptions:Object.freeze([...exceptions].reverse())});
assert(JSON.stringify(model)===JSON.stringify(reordered),'MODEL_DETERMINISTIC_ACROSS_INPUT_ORDER');
pass('DETERMINISTIC_PRESENTATION_MODEL');

expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest:Object.freeze({...manifest,digestSha256:'f'.repeat(64)}),riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_MANIFEST_DIGEST_MISMATCH');
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest,riskProfile:Object.freeze({...riskProfile,digestSha256:'f'.repeat(64)}),gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_RISK_DIGEST_MISMATCH');
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest:Object.freeze({...manifest,tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}),riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_TENANT_MISMATCH');
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest:Object.freeze({...manifest,projectId:'project:other'}),riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_PROJECT_MISMATCH');
pass('DIGEST_AND_SCOPE_FAIL_CLOSED');

expectThrow(()=>mod.buildCapitalReadinessControlModel({package:Object.freeze({...pkg,financialAuthority:'BROKEN'}),manifest,riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_FINANCIAL_AUTHORITY_INVALID');
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:Object.freeze({...pkg,limitations:Object.freeze(financialLimitations.slice(0,2))}),manifest,riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_REQUIRED_LIMITATION_MISSING');
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:Object.freeze({...pkg,decision:'UNKNOWN'}),manifest,riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_DECISION_INVALID');
pass('FINANCIAL_TRUST_METADATA_FAILS_CLOSED');

expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest,riskProfile,gaps:Object.freeze(gaps.map((gap,index)=>index===0?Object.freeze({...gap,assessmentVersion:2}):gap)),controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_GAP_VERSION_MISMATCH');
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest,riskProfile,gaps:Object.freeze(gaps.slice(0,1)),controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_GAP_SET_MISMATCH');
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:Object.freeze({...pkg,openConditionGapRefs:Object.freeze([])}),manifest,riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_OPEN_CONDITION_SET_MISMATCH');
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest,riskProfile,gaps:Object.freeze(gaps.map((gap,index)=>index===0?Object.freeze({...gap,blocking:true}):gap)),controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_GAP_CLASSIFICATION_MISMATCH');
pass('GAP_VIEW_FAIL_CLOSED');

const missingRiskDimension=Object.freeze({...riskProfile,dimensions:Object.freeze(riskProfile.dimensions.slice(0,8))});
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest,riskProfile:missingRiskDimension,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_RISK_VECTOR_INVALID');
const crossTenantException=Object.freeze([...exceptions,Object.freeze({exceptionId:'ex:wrong-tenant',tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',code:'CAPITAL_READINESS_G6_RISK_BLOCKED',severity:'CRITICAL',state:'OPEN',subjectRef:`project:${projectId}`,reason:'Wrong tenant',fingerprint:'wrong',openedAt:'2026-08-12T10:00:00.000Z',updatedAt:'2026-08-12T11:00:00.000Z'})]);
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:pkg,manifest,riskProfile,gaps,controlExceptions:crossTenantException}),'CAPITAL_READINESS_VIEW_EXCEPTION_TENANT_MISMATCH');
pass('RISK_AND_EXCEPTION_SCOPE_FAIL_CLOSED');

const readyPackage=Object.freeze({...pkg,decision:'CAPITAL_READY'});
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:readyPackage,manifest,riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_READY_WITH_ACTIVE_GAP');
const conditionalBad=Object.freeze({...pkg,decision:'CAPITAL_READY_WITH_CONDITIONS'});
expectThrow(()=>mod.buildCapitalReadinessControlModel({package:conditionalBad,manifest,riskProfile,gaps,controlExceptions:exceptions}),'CAPITAL_READINESS_VIEW_CONDITIONAL_DECISION_INCONSISTENT');
pass('DECISION_VIEW_CONSISTENCY');

await rm(tmp,{recursive:true,force:true});
console.log('PASS_CAPITAL_READINESS_CONTROL_MODEL');
