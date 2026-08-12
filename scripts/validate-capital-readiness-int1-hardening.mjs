import {createHash} from 'node:crypto';
import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-int1-hardening';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/investment-portfolio/src/readiness.ts','--ignoreConfig',
  '--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_HARDENING_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await mkdir(`${tmp}/services/investment-portfolio`,{recursive:true});
await writeFile(`${tmp}/services/investment-portfolio/package.json`,JSON.stringify({type:'module'}));
const runtimeUrl=pathToFileURL(resolve(tmp,'services/investment-portfolio/src/readiness.js')).href;
const mod=await import(`${runtimeUrl}?v=${Date.now()}`);

const sha256=value=>createHash('sha256').update(value).digest('hex');
const now='2026-08-12T12:00:00.000Z';
const observed='2026-08-10T12:00:00.000Z';
function assert(condition,message){if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)}
function expectThrow(fn,code){let threw=false;try{fn()}catch(error){threw=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(threw,`EXPECTED_THROW_${code}`)}
function pass(name){console.log(`PASS ${name}`)}

const project=Object.freeze({
  projectId:'11111111-1111-4111-8111-111111111111',tenantId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',code:'HASS-INT1-HARDENING',name:'Hass INT1.1 hardening fixture',state:'UNDER_REVIEW',eligibility:'NOT_EVALUATED',
  productionRef:Object.freeze({producerId:'22222222-2222-4222-8222-222222222222',farmId:'33333333-3333-4333-8333-333333333333',plotIds:Object.freeze(['44444444-4444-4444-8444-444444444441']),cropCycleIds:Object.freeze(['55555555-5555-4555-8555-555555555551'])}),
  currency:'COP',requiredMinor:25_000_000_00,committedMinor:0,deployedMinor:0,recoveredMinor:0,approvedBudgetVersion:1,createdAt:'2026-08-01T12:00:00.000Z',updatedAt:observed,
});
const roles={G1_ACTOR:'ACTOR_EXECUTION',G2_ASSET:'PRODUCTIVE_SCOPE',G3_AGRONOMY:'AGRONOMIC_PLAN',G4_BUDGET:'APPROVED_BUDGET',G5_MARKET:'MARKET_PATHWAY',G6_RISK:'RISK_REGISTER',G7_TRACEABILITY:'TRACEABILITY_COVERAGE',G8_IMPACT:'IMPACT_BASELINE',G9_FINANCIAL_STRUCTURE:'PARTNER_COMPATIBILITY'};
const gateIds=mod.READINESS_GATE_IDS;
const policy=Object.freeze({policyVersion:'int1-hardening-v1',methodologyVersion:'int1-hardening-method-v1',minimumTotalCoverageBps:10_000,requireAllNineGates:true,gates:Object.freeze(gateIds.map(gateId=>Object.freeze({gateId,requiredEvidenceRoles:Object.freeze([roles[gateId]]),minimumAcceptedEvidence:1,minimumConfidenceBps:7000,acceptedQualities:Object.freeze(['VERIFIED','SUPPORTED']),maxEvidenceAgeSeconds:60*60*24*30,missingEvidenceIsBlocking:true,allowNotApplicable:false})))});
const evidence=Object.freeze(gateIds.map(gateId=>Object.freeze({evidenceRef:`evidence:${gateId}`,tenantId:project.tenantId,projectId:project.projectId,sourceKind:'AGROWAY_EVENT',gateIds:Object.freeze([gateId]),role:roles[gateId],observedAt:observed,provenanceRef:`agroway://hardening/${gateId}`,digestSha256:sha256(`payload:${gateId}`),quality:'VERIFIED',confidenceBps:9500})));
const dimensions=Object.freeze(mod.PRODUCTIVE_RISK_DIMENSIONS.map((dimension,index)=>Object.freeze({dimension,riskRefs:Object.freeze([]),evidenceRefs:Object.freeze([evidence[index%evidence.length].evidenceRef]),principalDrivers:Object.freeze([]),mitigations:Object.freeze([]),confidenceBps:9000,trend:'STABLE'})));

const manifest=mod.buildEvidenceManifest({project,policy,evidence,asOf:now},sha256);
const changedDigestEvidence=Object.freeze(evidence.map((item,index)=>index===0?Object.freeze({...item,digestSha256:sha256('changed-payload')}):item));
const manifestChangedDigest=mod.buildEvidenceManifest({project,policy,evidence:changedDigestEvidence,asOf:now},sha256);
assert(manifest.digestSha256!==manifestChangedDigest.digestSha256,'MANIFEST_BINDS_SOURCE_DIGEST');
const changedProvenanceEvidence=Object.freeze(evidence.map((item,index)=>index===0?Object.freeze({...item,provenanceRef:'agroway://hardening/changed-provenance'}):item));
const manifestChangedProvenance=mod.buildEvidenceManifest({project,policy,evidence:changedProvenanceEvidence,asOf:now},sha256);
assert(manifest.digestSha256!==manifestChangedProvenance.digestSha256,'MANIFEST_BINDS_PROVENANCE');
pass('MANIFEST_PROVENANCE_BINDING');

let resumable=mod.createCapitalPilotIntake({intakeId:'66666666-6666-4666-8666-666666666660',project,intakeVersion:1,sourceType:'SANA_DIAGNOSTIC',sourceRef:'diagnostic:hardening',dataPackVersion:'v1',createdAt:'2026-08-01T12:00:00.000Z'});
resumable=mod.transitionCapitalPilotIntake(resumable,'CANONICAL_REUSE_SCAN',observed);
resumable=mod.transitionCapitalPilotIntake(resumable,'PAUSED',now);
assert(resumable.pausedFromState==='CANONICAL_REUSE_SCAN','PAUSE_CAPTURES_PREVIOUS_STATE');
expectThrow(()=>mod.transitionCapitalPilotIntake(resumable,'DATA_COMPLETION',now),'INVALID_INTAKE_RESUME');
resumable=mod.transitionCapitalPilotIntake(resumable,'CANONICAL_REUSE_SCAN',now);
assert(resumable.state==='CANONICAL_REUSE_SCAN'&&!('pausedFromState' in resumable),'RESUME_RETURNS_ONLY_TO_PREVIOUS_STATE');
pass('PAUSE_RESUME_EXACT_STATE');

const mitigatedRisk=Object.freeze({riskId:'77777777-7777-4777-8777-777777777771',tenantId:project.tenantId,projectId:project.projectId,code:'WATER_STRESS',title:'Historical water stress',severity:'HIGH',state:'MITIGATED',mitigation:'Irrigation intervention verified',ownerRef:'agronomist:1',openedAt:'2026-08-01T12:00:00.000Z',updatedAt:observed});
const mitigatedDimensions=Object.freeze(dimensions.map(d=>d.dimension==='CLIMATE'?Object.freeze({...d,riskRefs:Object.freeze([mitigatedRisk.riskId]),mitigations:Object.freeze(['IRRIGATION_VERIFIED'])}):d));
const mitigatedProfile=mod.buildProductiveRiskProfile({project,risks:Object.freeze([mitigatedRisk]),dimensions:mitigatedDimensions,asOf:now},sha256);
assert(mitigatedProfile.dimensions.find(d=>d.dimension==='CLIMATE').state==='WATCH','MITIGATED_RISK_NOT_LAUNDERED_TO_FAVORABLE');
assert(/^[a-f0-9]{64}$/.test(mitigatedProfile.sourceRiskDigestSha256),'RISK_SOURCE_DIGEST_PRESENT');
pass('MITIGATED_RISK_REMAINS_VISIBLE');

const activeRisk=Object.freeze({...mitigatedRisk,riskId:'77777777-7777-4777-8777-777777777772',state:'OPEN',severity:'MEDIUM',code:'LABOR_CAPACITY'});
expectThrow(()=>mod.buildProductiveRiskProfile({project,risks:Object.freeze([activeRisk]),dimensions,asOf:now},sha256),'UNMAPPED_ACTIVE_RISK');
pass('UNMAPPED_ACTIVE_RISK_FAILS_CLOSED');

let intake=mod.createCapitalPilotIntake({intakeId:'66666666-6666-4666-8666-666666666666',project,intakeVersion:1,sourceType:'SANA_DIAGNOSTIC',sourceRef:'diagnostic:hardening-review',dataPackVersion:'v1',createdAt:'2026-08-01T12:00:00.000Z'});
for(const target of ['CANONICAL_REUSE_SCAN','DATA_COMPLETION','EVIDENCE_VALIDATION','ASSESSMENT_READY','UNDER_ASSESSMENT','HUMAN_REVIEW'])intake=mod.transitionCapitalPilotIntake(intake,target,now);
const cleanProfile=mod.buildProductiveRiskProfile({project,risks:Object.freeze([]),dimensions,asOf:now},sha256);
const evaluation=mod.evaluateReadinessGates({project,policy,manifest,assessmentVersion:1,assessedAt:now,assessedBy:'human:reviewer'});
const forgedEvaluation=Object.freeze({...evaluation,assessments:Object.freeze(evaluation.assessments.map((gate,index)=>index===0?Object.freeze({...gate,result:'BLOCKED'}):gate))});
expectThrow(()=>mod.buildReadinessAssessment({project,intake,policy,manifest,riskProfile:cleanProfile,gateEvaluation:forgedEvaluation,assessmentId:'assessment:forged',assessmentVersion:1,projectSnapshotRef:'snapshot:1',requestedDecision:'NOT_CAPITAL_READY',rationale:'Forged fixture must fail.',reviewerRef:'human:reviewer',reviewedAt:now},sha256),'READINESS_GATE_RESULT_INCONSISTENT');
pass('FORGED_GATE_EVALUATION_REJECTED');

const assessment=mod.buildReadinessAssessment({project,intake,policy,manifest,riskProfile:cleanProfile,gateEvaluation:evaluation,assessmentId:'assessment:bound:v1',assessmentVersion:1,projectSnapshotRef:'snapshot:bound:v1',requestedDecision:'CAPITAL_READY',rationale:'All gates satisfy hardening policy.',reviewerRef:'human:reviewer',reviewedAt:now},sha256);
const pkg=mod.buildCapitalReadinessPackage({project,assessment,manifest,riskProfile:cleanProfile,gaps:evaluation.gaps,generatedAt:now,provenanceRefs:Object.freeze(['assessment:'+assessment.digestSha256,'manifest:'+manifest.digestSha256,'risk:'+cleanProfile.digestSha256])},sha256);
assert(pkg.assessmentDigestSha256===assessment.digestSha256,'PACKAGE_BINDS_ASSESSMENT_DIGEST');
assert(pkg.policyVersion===policy.policyVersion&&pkg.methodologyVersion===policy.methodologyVersion,'PACKAGE_BINDS_POLICY_METHOD');
assert(pkg.projectSnapshotRef==='snapshot:bound:v1','PACKAGE_BINDS_PROJECT_SNAPSHOT');
pass('PACKAGE_BINDS_FINAL_ASSESSMENT');

const nAPolicy=Object.freeze({...policy,policyVersion:'int1-na-v1',gates:Object.freeze(policy.gates.map(g=>g.gateId==='G9_FINANCIAL_STRUCTURE'?Object.freeze({...g,allowNotApplicable:true}):g))});
const evidenceWithoutG9=Object.freeze(evidence.filter(item=>!item.gateIds.includes('G9_FINANCIAL_STRUCTURE')));
const nAManifest=mod.buildEvidenceManifest({project,policy:nAPolicy,evidence:evidenceWithoutG9,asOf:now},sha256);
assert(nAManifest.totalCoverageBps<10_000,'RAW_COVERAGE_SEES_MISSING_NA_GATE');
const nAEvaluation=mod.evaluateReadinessGates({project,policy:nAPolicy,manifest:nAManifest,assessmentVersion:2,signals:Object.freeze([{gateId:'G9_FINANCIAL_STRUCTURE',applicable:false,rationale:'No external financing structure required for this fixture.'}]),assessedAt:now,assessedBy:'human:reviewer'});
assert(nAEvaluation.assessments.find(g=>g.gateId==='G9_FINANCIAL_STRUCTURE').result==='NOT_APPLICABLE','G9_EXPLICIT_NA');
assert(nAEvaluation.effectiveCoverageBps===10_000,'EFFECTIVE_COVERAGE_EXCLUDES_VALID_NA_GATE');
assert(mod.deterministicMaximumReadinessDecision(nAPolicy,nAManifest,nAEvaluation,cleanProfile)==='CAPITAL_READY','VALID_NA_DOES_NOT_FALSE_BLOCK_READINESS');
pass('NOT_APPLICABLE_EFFECTIVE_COVERAGE');

await rm(tmp,{recursive:true,force:true});
console.log('PASS_CAPITAL_READINESS_INT1_1_HARDENING');
