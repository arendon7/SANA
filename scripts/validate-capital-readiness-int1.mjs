import {createHash} from 'node:crypto';
import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-int1';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/investment-portfolio/src/readiness.ts',
  '--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_TEST_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await mkdir(`${tmp}/services/investment-portfolio`,{recursive:true});
await writeFile(`${tmp}/services/investment-portfolio/package.json`,JSON.stringify({type:'module'}));
const runtimeUrl=pathToFileURL(resolve(tmp,'services/investment-portfolio/src/readiness.js')).href;
const mod=await import(`${runtimeUrl}?v=${Date.now()}`);
const sha256=value=>createHash('sha256').update(value).digest('hex');
const digest=value=>sha256(String(value));
const now='2026-08-12T12:00:00.000Z';
const observed='2026-08-10T12:00:00.000Z';

function assert(condition,message){if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)}
function expectThrow(fn,code){let thrown=false;try{fn()}catch(error){thrown=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(thrown,`EXPECTED_THROW_${code}`)}
function pass(name){console.log(`PASS ${name}`)}

const project=Object.freeze({
  projectId:'11111111-1111-4111-8111-111111111111',tenantId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',code:'HASS-INT1-001',name:'Hass Design Partner INT1.1',state:'UNDER_REVIEW',eligibility:'NOT_EVALUATED',
  productionRef:Object.freeze({producerId:'22222222-2222-4222-8222-222222222222',farmId:'33333333-3333-4333-8333-333333333333',plotIds:Object.freeze(['44444444-4444-4444-8444-444444444441','44444444-4444-4444-8444-444444444442']),cropCycleIds:Object.freeze(['55555555-5555-4555-8555-555555555551','55555555-5555-4555-8555-555555555552'])}),
  currency:'COP',requiredMinor:50_000_000_00,committedMinor:0,deployedMinor:0,recoveredMinor:0,approvedBudgetVersion:1,createdAt:'2026-08-01T12:00:00.000Z',updatedAt:'2026-08-10T12:00:00.000Z',
});

const gateRoles={
  G1_ACTOR:'ACTOR_EXECUTION',G2_ASSET:'PRODUCTIVE_SCOPE',G3_AGRONOMY:'AGRONOMIC_PLAN',G4_BUDGET:'APPROVED_BUDGET',G5_MARKET:'MARKET_PATHWAY',G6_RISK:'RISK_REGISTER',G7_TRACEABILITY:'TRACEABILITY_COVERAGE',G8_IMPACT:'IMPACT_BASELINE',G9_FINANCIAL_STRUCTURE:'PARTNER_COMPATIBILITY',
};
const gateIds=mod.READINESS_GATE_IDS;
assert(gateIds.length===9,'NINE_GATES_REQUIRED');
const policy=Object.freeze({
  policyVersion:'sana-capital-readiness-int1.1-policy-v1',methodologyVersion:'int1.1-method-v1',minimumTotalCoverageBps:10_000,requireAllNineGates:true,
  gates:Object.freeze(gateIds.map(gateId=>Object.freeze({gateId,requiredEvidenceRoles:Object.freeze([gateRoles[gateId]]),minimumAcceptedEvidence:1,minimumConfidenceBps:7000,acceptedQualities:Object.freeze(['VERIFIED','SUPPORTED']),maxEvidenceAgeSeconds:60*60*24*30,missingEvidenceIsBlocking:true,allowNotApplicable:false}))),
});

const evidence=Object.freeze(gateIds.map((gateId,index)=>Object.freeze({
  evidenceRef:`evidence:${gateId}`,tenantId:project.tenantId,projectId:project.projectId,sourceKind:index===4?'PARTNER_REFERENCE':'AGROWAY_EVENT',gateIds:Object.freeze([gateId]),role:gateRoles[gateId],observedAt:observed,provenanceRef:`agroway://fixture/${gateId}`,digestSha256:digest(`evidence-${gateId}`),quality:'VERIFIED',confidenceBps:9500,
})));

let intake=mod.createCapitalPilotIntake({intakeId:'66666666-6666-4666-8666-666666666666',project,intakeVersion:1,sourceType:'SANA_DIAGNOSTIC',sourceRef:'diagnostic:hass-int1',originatorRef:'sana:design-partner',consentSetRef:'consent:v1',dataPackVersion:'hass-datapack-v1',createdAt:'2026-08-01T12:00:00.000Z'});
assert(intake.state==='CREATED','INTAKE_CREATED');
for(const target of ['CANONICAL_REUSE_SCAN','DATA_COMPLETION','EVIDENCE_VALIDATION','ASSESSMENT_READY','UNDER_ASSESSMENT','HUMAN_REVIEW'])intake=mod.transitionCapitalPilotIntake(intake,target,now);
assert(intake.state==='HUMAN_REVIEW','INTAKE_REACHES_HUMAN_REVIEW');
expectThrow(()=>mod.transitionCapitalPilotIntake(intake,'CREATED',now),'INVALID_INTAKE_TRANSITION');
pass('INTAKE_STATE_MACHINE');

const manifest=mod.buildEvidenceManifest({project,policy,evidence,asOf:now},sha256);
assert(manifest.totalCoverageBps===10_000,'FULL_EVIDENCE_COVERAGE');
assert(manifest.acceptedEvidenceRefs.length===9,'NINE_ACCEPTED_EVIDENCE');
assert(manifest.rejectedEvidenceRefs.length===0,'NO_REJECTED_HAPPY_PATH');
const manifestReordered=mod.buildEvidenceManifest({project,policy,evidence:Object.freeze([...evidence].reverse()),asOf:now},sha256);
assert(manifest.digestSha256===manifestReordered.digestSha256,'MANIFEST_DETERMINISTIC_ORDER');
pass('EVIDENCE_MANIFEST_HAPPY_PATH_AND_DETERMINISM');

const gateEvaluation=mod.evaluateReadinessGates({project,policy,manifest,assessmentVersion:1,assessedAt:now,assessedBy:'human:capital-reviewer'});
assert(gateEvaluation.assessments.length===9,'NINE_GATE_ASSESSMENTS');
assert(gateEvaluation.assessments.every(g=>g.result==='PASS'),'ALL_GATES_PASS');
assert(gateEvaluation.gaps.length===0,'NO_GAPS_HAPPY_PATH');
pass('G1_G9_HAPPY_PATH');

const dimensions=Object.freeze(mod.PRODUCTIVE_RISK_DIMENSIONS.map((dimension,index)=>Object.freeze({dimension,riskRefs:Object.freeze([]),evidenceRefs:Object.freeze([evidence[index%evidence.length].evidenceRef]),principalDrivers:Object.freeze([]),mitigations:Object.freeze([]),confidenceBps:9000,trend:'STABLE'})));
const riskProfile=mod.buildProductiveRiskProfile({project,risks:Object.freeze([]),dimensions,asOf:now},sha256);
assert(riskProfile.dimensions.length===9,'NINE_RISK_DIMENSIONS');
assert(riskProfile.dimensions.every(d=>d.state==='FAVORABLE'),'FAVORABLE_NO_OPEN_RISK_WITH_EVIDENCE');
pass('PRODUCTIVE_RISK_VECTOR');

const assessment=mod.buildReadinessAssessment({project,intake,policy,manifest,riskProfile,gateEvaluation,assessmentId:'assessment:hass-int1:v1',assessmentVersion:1,projectSnapshotRef:'project-snapshot:hass-int1:v1',requestedDecision:'CAPITAL_READY',rationale:'All nine gates satisfy the explicit INT1.1 test policy.',reviewerRef:'human:capital-reviewer',reviewedAt:now},sha256);
assert(assessment.decision==='CAPITAL_READY','HUMAN_CAPITAL_READY_RECORDED');
assert(assessment.deterministicMaximumDecision==='CAPITAL_READY','DETERMINISTIC_MAX_CAPITAL_READY');
assert(project.eligibility==='NOT_EVALUATED','READINESS_DOES_NOT_MUTATE_ELIGIBILITY');
assert(project.state==='UNDER_REVIEW','READINESS_DOES_NOT_MUTATE_PROJECT_STATE');
pass('HUMAN_READINESS_DECISION_BOUNDARY');

const pkg=mod.buildCapitalReadinessPackage({project,assessment,manifest,riskProfile,gaps:gateEvaluation.gaps,generatedAt:now,provenanceRefs:Object.freeze(['manifest:'+manifest.digestSha256,'risk:'+riskProfile.digestSha256,'assessment:'+assessment.digestSha256])},sha256);
assert(pkg.financialAuthority==='READINESS_ONLY_NO_FINANCING_APPROVAL','PACKAGE_FINANCIAL_AUTHORITY_BOUNDARY');
assert(pkg.limitations.includes('CAPITAL_READY_IS_NOT_FINANCING_APPROVAL'),'PACKAGE_DISCLOSES_NOT_APPROVAL');
assert(pkg.limitations.includes('NO_RETURN_OR_REPAYMENT_GUARANTEE'),'PACKAGE_DISCLOSES_NO_GUARANTEE');
const pkgAgain=mod.buildCapitalReadinessPackage({project,assessment,manifest,riskProfile,gaps:gateEvaluation.gaps,generatedAt:now,provenanceRefs:Object.freeze(['assessment:'+assessment.digestSha256,'risk:'+riskProfile.digestSha256,'manifest:'+manifest.digestSha256])},sha256);
assert(pkg.digestSha256===pkgAgain.digestSha256,'PACKAGE_DETERMINISTIC_PROVENANCE_ORDER');
pass('CAPITAL_READINESS_PACKAGE');

const crossTenantEvidence=Object.freeze(evidence.map((item,index)=>index===0?Object.freeze({...item,tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}):item));
const crossTenantManifest=mod.buildEvidenceManifest({project,policy,evidence:crossTenantEvidence,asOf:now},sha256);
assert(crossTenantManifest.rejectedEvidenceRefs.includes(evidence[0].evidenceRef),'CROSS_TENANT_EVIDENCE_REJECTED');
const crossTenantEval=mod.evaluateReadinessGates({project,policy,manifest:crossTenantManifest,assessmentVersion:2,assessedAt:now,assessedBy:'human:capital-reviewer'});
assert(crossTenantEval.gaps.some(g=>g.blocking),'CROSS_TENANT_CAUSES_BLOCKING_GAP');
expectThrow(()=>mod.buildReadinessAssessment({project,intake,policy,manifest:crossTenantManifest,riskProfile,gateEvaluation:crossTenantEval,assessmentId:'assessment:false-ready',assessmentVersion:2,projectSnapshotRef:'snapshot:v2',requestedDecision:'CAPITAL_READY',rationale:'Must fail.',reviewerRef:'human:capital-reviewer',reviewedAt:now},sha256),'DECISION_EXCEEDS_DETERMINISTIC_READINESS');
pass('CROSS_TENANT_FAIL_CLOSED_AND_FALSE_READY_BLOCKED');

const invalidDigestEvidence=Object.freeze(evidence.map((item,index)=>index===1?Object.freeze({...item,digestSha256:'not-a-digest'}):item));
const invalidDigestManifest=mod.buildEvidenceManifest({project,policy,evidence:invalidDigestEvidence,asOf:now},sha256);
assert(invalidDigestManifest.limitations.some(x=>x.includes('INVALID_EVIDENCE_DIGEST')),'INVALID_DIGEST_EXPLICIT');
pass('INVALID_EVIDENCE_DIGEST_FAIL_CLOSED');

const futureEvidence=Object.freeze(evidence.map((item,index)=>index===2?Object.freeze({...item,observedAt:'2026-09-01T12:00:00.000Z'}):item));
const futureManifest=mod.buildEvidenceManifest({project,policy,evidence:futureEvidence,asOf:now},sha256);
assert(futureManifest.limitations.some(x=>x.includes('EVIDENCE_FROM_FUTURE')),'FUTURE_EVIDENCE_EXPLICIT');
pass('FUTURE_EVIDENCE_FAIL_CLOSED');

const stalePolicy=Object.freeze({...policy,policyVersion:'stale-policy-v1',gates:Object.freeze(policy.gates.map(g=>Object.freeze({...g,maxEvidenceAgeSeconds:3600})))});
const staleManifest=mod.buildEvidenceManifest({project,policy:stalePolicy,evidence,asOf:now},sha256);
assert(staleManifest.rejectedEvidenceRefs.length===9,'STALE_EVIDENCE_REJECTED');
assert(staleManifest.limitations.some(x=>x.includes('STALE_EVIDENCE')),'STALE_EVIDENCE_EXPLICIT');
pass('STALE_EVIDENCE_FAIL_CLOSED');

const incompletePolicy=Object.freeze({...policy,gates:Object.freeze(policy.gates.slice(0,8))});
expectThrow(()=>mod.buildEvidenceManifest({project,policy:incompletePolicy,evidence,asOf:now},sha256),'READINESS_POLICY_GATE_COUNT_INVALID');
pass('POLICY_REQUIRES_ALL_NINE_GATES');

const criticalRisk=Object.freeze({riskId:'77777777-7777-4777-8777-777777777777',tenantId:project.tenantId,projectId:project.projectId,code:'MARKET_CONCENTRATION',title:'Single buyer concentration',severity:'CRITICAL',state:'OPEN',openedAt:observed,updatedAt:observed});
const criticalDimensions=Object.freeze(dimensions.map(d=>d.dimension==='MARKET'?Object.freeze({...d,riskRefs:Object.freeze([criticalRisk.riskId]),principalDrivers:Object.freeze(['SINGLE_BUYER'])}):d));
const criticalProfile=mod.buildProductiveRiskProfile({project,risks:Object.freeze([criticalRisk]),dimensions:criticalDimensions,asOf:now},sha256);
assert(criticalProfile.openCriticalRiskRefs.includes(criticalRisk.riskId),'CRITICAL_RISK_VISIBLE');
assert(criticalProfile.dimensions.find(d=>d.dimension==='MARKET').state==='CRITICAL','CRITICAL_RISK_DIMENSION');
assert(mod.deterministicMaximumReadinessDecision(policy,manifest,gateEvaluation,criticalProfile)==='NOT_CAPITAL_READY','CRITICAL_RISK_BLOCKS_READY');
pass('CRITICAL_PRODUCTIVE_RISK_BLOCKS_READINESS');

const wrongProject=Object.freeze({...project,projectId:'99999999-9999-4999-8999-999999999999'});
expectThrow(()=>mod.buildCapitalReadinessPackage({project:wrongProject,assessment,manifest,riskProfile,gaps:gateEvaluation.gaps,generatedAt:now,provenanceRefs:Object.freeze(['x'])},sha256),'READINESS_PROJECT_SCOPE_MISMATCH');
pass('PACKAGE_SCOPE_FAIL_CLOSED');

assert(mod.CAPITAL_READINESS_AUTHORITY_BOUNDARY.financialApproval===false,'NO_FINANCIAL_APPROVAL_AUTHORITY');
assert(mod.CAPITAL_READINESS_AUTHORITY_BOUNDARY.investmentRecommendation===false,'NO_INVESTMENT_RECOMMENDATION_AUTHORITY');
assert(mod.CAPITAL_READINESS_AUTHORITY_BOUNDARY.custody===false,'NO_CUSTODY');
assert(mod.CAPITAL_READINESS_AUTHORITY_BOUNDARY.paymentExecution===false,'NO_PAYMENT_EXECUTION');
assert(mod.CAPITAL_READINESS_AUTHORITY_BOUNDARY.disbursementAuthority===false,'NO_DISBURSEMENT_AUTHORITY');
assert(mod.CAPITAL_READINESS_AUTHORITY_BOUNDARY.aiRequired===false,'AI_INDEPENDENT_CORE');
pass('AUTHORITY_BOUNDARY');

await rm(tmp,{recursive:true,force:true});
console.log('PASS_CAPITAL_READINESS_INT1_1_RUNTIME');
