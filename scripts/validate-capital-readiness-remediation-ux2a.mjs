import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-remediation-ux2a';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/investment-portfolio/src/readiness-remediation.ts','--ignoreConfig',
  '--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_REMEDIATION_UX2A_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await mkdir(`${tmp}/services/investment-portfolio`,{recursive:true});
await writeFile(`${tmp}/services/investment-portfolio/package.json`,JSON.stringify({type:'module'}));
const runtimeUrl=pathToFileURL(resolve(tmp,'services/investment-portfolio/src/readiness-remediation.js')).href;
const mod=await import(`${runtimeUrl}?v=${Date.now()}`);
const assert=(condition,message)=>{if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)};
const expectThrow=(fn,code)=>{let threw=false;try{fn()}catch(error){threw=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(threw,`EXPECTED_THROW_${code}`)};

const tenantId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId='11111111-1111-4111-8111-111111111111';
const gap=(overrides={})=>Object.freeze({gapId:'gap:g4',tenantId,projectId,assessmentVersion:1,gateId:'G4_BUDGET',code:'BUDGET_HARVEST_LABOR_MISSING',severity:'CRITICAL',blocking:true,state:'OPEN',description:'Internal technical description',sourceRef:'gate:G4_BUDGET',ownerRef:'producer:1',dueAt:'2026-08-18T23:59:59.000Z',requiredEvidenceRoles:Object.freeze(['HARVEST_LABOR_BUDGET']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T09:00:00.000Z',...overrides});
const gaps=Object.freeze([
  gap(),
  gap({gapId:'gap:g5',gateId:'G5_MARKET',code:'MARKET_CURRENT_BUYER_EVIDENCE_MISSING',severity:'CRITICAL',ownerRef:'producer:1',dueAt:'2026-08-19T23:59:59.000Z',requiredEvidenceRoles:Object.freeze(['BUYER_INTENT'])}),
  gap({gapId:'gap:g7',gateId:'G7_TRACEABILITY',code:'TRACEABILITY_LOT_EVIDENCE_PENDING',severity:'WARNING',ownerRef:'agronomist:1',dueAt:'2026-08-17T23:59:59.000Z',requiredEvidenceRoles:Object.freeze(['LOT_CURRENT_EVIDENCE'])}),
  gap({gapId:'gap:resolved',gateId:'G3_AGRONOMY',code:'OLD_GAP',severity:'WARNING',state:'RESOLVED',blocking:false,ownerRef:'agronomist:1',dueAt:undefined,requiredEvidenceRoles:Object.freeze(['OLD'])}),
]);
const presentations=Object.freeze([
  Object.freeze({code:'BUDGET_HARVEST_LABOR_MISSING',title:'Costo de cosecha',instruction:'Indica cuánto esperas gastar en mano de obra durante la cosecha.',actionKind:'PROVIDE_INFORMATION',responsibility:'PRODUCER',evidenceExamples:Object.freeze(['presupuesto','histórico verificable'])}),
  Object.freeze({code:'MARKET_CURRENT_BUYER_EVIDENCE_MISSING',title:'Comprador y venta',instruction:'Comparte una evidencia actual de conversación, intención de compra o acuerdo comercial.',actionKind:'PROVIDE_DOCUMENT',responsibility:'PRODUCER',evidenceExamples:Object.freeze(['carta de intención','conversación comercial','orden de compra'])}),
  Object.freeze({code:'TRACEABILITY_LOT_EVIDENCE_PENDING',title:'Actualizar información del lote',instruction:'El equipo técnico debe actualizar y validar la evidencia del lote antes de una nueva evaluación.',actionKind:'COORDINATE_TECHNICAL_VISIT',responsibility:'AGRONOMIST',evidenceExamples:Object.freeze(['visita técnica','evidencia de campo sincronizada'])}),
]);
const input=Object.freeze({tenantId,projectId,assessmentVersion:1,gaps,presentations,generatedAt:'2026-08-12T12:00:00.000Z'});
const before=JSON.stringify(input);
const projection=mod.buildRemediationTaskProjection(input);
assert(projection.model==='CAPITAL_READINESS_REMEDIATION_TASK_PROJECTION','MODEL_ID');
assert(projection.tasks.length===3,'CLOSED_GAP_EXCLUDED');
assert(projection.tasks.map(x=>x.gapId).join('|')==='gap:g4|gap:g5|gap:g7','BLOCKING_PRIORITY_AND_GATE_ORDER');
assert(projection.producerTasks.length===2&&projection.producerTasks.every(x=>x.responsibility==='PRODUCER'),'TWO_PRODUCER_TASKS');
assert(projection.sanaTasks.length===1&&projection.sanaTasks[0].responsibility==='AGRONOMIST','TECHNICAL_TASK_NOT_PUSHED_TO_PRODUCER');
assert(projection.tasks.every(x=>x.trust.projectionOnly&&x.trust.completingTaskResolvesGap===false&&x.trust.canonicalMutationAvailable===false),'PROJECTION_TRUST');
assert(projection.trust.sourceOfTruth==='READINESS_GAP'&&projection.trust.producerCannotWaive&&projection.trust.producerCannotFinalize,'AUTHORITY_BOUNDARY');
assert(projection.unmappedGapRefs.length===0,'NO_UNMAPPED_HASS_GAPS');
assert(JSON.stringify(input)===before,'SOURCE_INPUT_NOT_MUTATED');

const reversed=mod.buildRemediationTaskProjection({...input,gaps:Object.freeze([...gaps].reverse()),presentations:Object.freeze([...presentations].reverse())});
assert(JSON.stringify(projection)===JSON.stringify(reversed),'DETERMINISTIC_INPUT_ORDER');

const submitted=mod.buildRemediationTaskProjection({...input,gaps:Object.freeze([gap({state:'EVIDENCE_SUBMITTED'})])});
assert(submitted.tasks[0].state==='UNDER_REVIEW','EVIDENCE_SUBMITTED_MAPS_TO_REVIEW');
const inProgress=mod.buildRemediationTaskProjection({...input,gaps:Object.freeze([gap({state:'IN_REMEDIATION'})])});
assert(inProgress.tasks[0].state==='IN_PROGRESS','IN_REMEDIATION_MAPS_TO_PROGRESS');

const unmapped=mod.buildRemediationTaskProjection({...input,gaps:Object.freeze([gap({code:'UNKNOWN_NEW_GAP'})])});
assert(unmapped.producerTasks.length===0&&unmapped.sanaTasks.length===1,'UNKNOWN_GAP_NOT_PUSHED_TO_PRODUCER');
assert(unmapped.unmappedGapRefs[0]==='gap:g4'&&unmapped.tasks[0].presentationState==='NEEDS_CONFIGURATION','UNKNOWN_GAP_FAILS_TO_SANA_CONFIGURATION');
assert(unmapped.tasks[0].actionKind==='SANA_REVIEW','UNKNOWN_GAP_SAFE_ACTION');

expectThrow(()=>mod.buildRemediationTaskProjection({...input,gaps:Object.freeze([gap({tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'})])}),'REMEDIATION_GAP_SCOPE_MISMATCH');
expectThrow(()=>mod.buildRemediationTaskProjection({...input,gaps:Object.freeze([gap({assessmentVersion:2})])}),'REMEDIATION_GAP_VERSION_MISMATCH');
expectThrow(()=>mod.buildRemediationTaskProjection({...input,gaps:Object.freeze([gap(),gap()])}),'REMEDIATION_DUPLICATE_GAP');
expectThrow(()=>mod.buildRemediationTaskProjection({...input,presentations:Object.freeze([presentations[0],presentations[0]])}),'REMEDIATION_DUPLICATE_PRESENTATION');
expectThrow(()=>mod.buildRemediationTaskProjection({...input,gaps:Object.freeze([gap({dueAt:'not-a-date'})])}),'REMEDIATION_GAP_DUE_AT_INVALID');

await rm(tmp,{recursive:true,force:true});
console.log('PASS_CAPITAL_READINESS_REMEDIATION_UX2A');
