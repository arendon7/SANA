import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-control-projection-alpha22';
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
const baseGap=Object.freeze({
  gapId:'gap:g5-market',tenantId,projectId,assessmentVersion:1,gateId:'G5_MARKET',code:'BUYER_EVIDENCE_MISSING',severity:'CRITICAL',blocking:true,state:'OPEN',
  description:'Current buyer pathway evidence is incomplete.',sourceRef:'gate:G5_MARKET',requiredEvidenceRoles:Object.freeze(['BUYER_INTENT']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T10:00:00.000Z',
});
const remediation=Object.freeze({...baseGap,gapId:'gap:g4-budget',gateId:'G4_BUDGET',code:'BUDGET_LINE_MISSING',severity:'WARNING',state:'IN_REMEDIATION',description:'Budget evidence is being remediated.',sourceRef:'gate:G4_BUDGET'});
const submitted=Object.freeze({...baseGap,gapId:'gap:g7-trace',gateId:'G7_TRACEABILITY',code:'TRACEABILITY_EVIDENCE_PENDING',severity:'INFO',state:'EVIDENCE_SUBMITTED',blocking:false,description:'Traceability evidence awaits human review.',sourceRef:'gate:G7_TRACEABILITY'});

const projected=mod.deriveReadinessGapExceptions(tenantId,Object.freeze([submitted,baseGap,remediation]),asOf);
assert(projected.length===3,'ACTIVE_GAPS_PROJECT_ONE_TO_ONE');
assert(projected.map(x=>x.fingerprint).join('|')===[...projected].sort((a,b)=>a.fingerprint.localeCompare(b.fingerprint)).map(x=>x.fingerprint).join('|'),'DETERMINISTIC_SORT');
const open=projected.find(x=>x.subjectRef==='readiness-gap:gap:g5-market');
const rem=projected.find(x=>x.subjectRef==='readiness-gap:gap:g4-budget');
const evidence=projected.find(x=>x.subjectRef==='readiness-gap:gap:g7-trace');
assert(open?.code==='CAPITAL_READINESS_GAP'&&open.state==='OPEN'&&open.severity==='CRITICAL','OPEN_GAP_MAPPING');
assert(rem?.state==='ACKNOWLEDGED'&&rem.severity==='WARNING','REMEDIATION_PRESENTATION_MAPPING');
assert(evidence?.state==='ACKNOWLEDGED'&&evidence.severity==='INFO','EVIDENCE_SUBMITTED_PRESENTATION_MAPPING');
assert(open?.reason.includes('G5_MARKET:BUYER_EVIDENCE_MISSING')&&open.reason.includes('BLOCKING'),'GATE_CODE_CLASSIFICATION_PRESERVED');
pass('ACTIVE_GAP_PROJECTION');

const reversed=mod.deriveReadinessGapExceptions(tenantId,Object.freeze([remediation,baseGap,submitted]),asOf);
assert(JSON.stringify(projected)===JSON.stringify(reversed),'INPUT_ORDER_INDEPENDENT');
pass('DETERMINISTIC_REBUILD');

const closed=Object.freeze([
  Object.freeze({...baseGap,state:'RESOLVED',resolvedAt:'2026-08-12T11:00:00.000Z',resolvedBy:'human:reviewer',resolutionNote:'Reviewed',resolutionEvidenceRefs:Object.freeze(['evidence:1'])}),
  Object.freeze({...remediation,state:'WAIVED',resolvedAt:'2026-08-12T11:10:00.000Z',resolvedBy:'human:reviewer',resolutionNote:'Waived'}),
  Object.freeze({...submitted,state:'SUPERSEDED',resolvedAt:'2026-08-12T11:20:00.000Z',resolvedBy:'system:reassessment'}),
]);
assert(mod.deriveReadinessGapExceptions(tenantId,closed,asOf).length===0,'CLOSED_GAPS_DISAPPEAR');
pass('CLOSED_GAPS_DO_NOT_EMIT');

expectThrow(()=>mod.deriveReadinessGapExceptions(tenantId,[Object.freeze({...baseGap,tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'})],asOf),'READINESS_CONTROL_TENANT_MISMATCH');
expectThrow(()=>mod.deriveReadinessGapExceptions(tenantId,[Object.freeze({...baseGap,openedAt:'2026-08-13T10:00:00.000Z'})],asOf),'READINESS_CONTROL_GAP_FROM_FUTURE');
expectThrow(()=>mod.deriveReadinessGapExceptions(tenantId,[baseGap,baseGap],asOf),'READINESS_CONTROL_DUPLICATE_GAP_FINGERPRINT');
expectThrow(()=>mod.deriveReadinessGapExceptions(tenantId,[Object.freeze({...baseGap,state:'OPEN',resolvedAt:'2026-08-12T11:00:00.000Z'})],asOf),'READINESS_CONTROL_ACTIVE_GAP_HAS_RESOLUTION');
pass('FAIL_CLOSED_SCOPE_TIME_DUPLICATE');

const baseInput=Object.freeze({
  snapshotId:'tower:1',tenantId,asOf,
  network:Object.freeze({producerCount:1,farmCount:1,activeAreaHa:8.6,activeCropCycleCount:1}),
  projects:Object.freeze([]),
  agronomy:Object.freeze({healthyCycles:1,watchCycles:0,criticalCycles:0,openAlerts:0,criticalAlerts:0}),
  operations:Object.freeze({plannedActivities:10,completedActivities:10,dueActivities:0,overdueActivities:0}),
  supply:Object.freeze({openOrders:0,fillRateBps:10_000,inventoryCoverageDays:30}),demand:Object.freeze([]),impact:Object.freeze([]),watermarks:Object.freeze([]),
  thresholds:Object.freeze({maxOverdueActivities:3,minInventoryCoverageDays:7,raiseAgronomyCriticalWhenCriticalAlertsAtLeast:1}),
});
const noReadiness=mod.projectControlTower(baseInput);
assert(noReadiness.exceptions.length===0,'OMITTED_READINESS_BACKWARD_COMPATIBLE');
const integrated=mod.projectControlTower({...baseInput,readinessGaps:Object.freeze([baseGap])});
assert(integrated.exceptions.length===1&&integrated.exceptions[0].code==='CAPITAL_READINESS_GAP','PROJECTOR_INTEGRATES_READINESS_OPTIONALLY');
const existingAndReadiness=mod.projectControlTower({...baseInput,operations:Object.freeze({...baseInput.operations,overdueActivities:4}),readinessGaps:Object.freeze([baseGap])});
assert(existingAndReadiness.exceptions.some(x=>x.code==='OPERATIONS_OVERDUE')&&existingAndReadiness.exceptions.some(x=>x.code==='CAPITAL_READINESS_GAP'),'EXISTING_EXCEPTION_DERIVATION_PRESERVED');
pass('CONTROL_PROJECTOR_BACKWARD_COMPATIBILITY');

assert(mod.CAPITAL_READINESS_CONTROL_PROJECTION_BOUNDARY.projectionOnly===true,'PROJECTION_ONLY');
assert(mod.CAPITAL_READINESS_CONTROL_PROJECTION_BOUNDARY.controlResolutionMutatesReadiness===false,'CONTROL_CANNOT_MUTATE_READINESS');
assert(mod.CAPITAL_READINESS_CONTROL_PROJECTION_BOUNDARY.financingApproval===false,'NO_FINANCING_APPROVAL');
assert(mod.CAPITAL_READINESS_CONTROL_PROJECTION_BOUNDARY.custody===false,'NO_CUSTODY');
pass('TRUST_BOUNDARY');

await rm(tmp,{recursive:true,force:true});
console.log('PASS_CAPITAL_READINESS_CONTROL_PROJECTION_ALPHA22');
