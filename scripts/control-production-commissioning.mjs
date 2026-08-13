#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const CONTROL_COMMISSIONING_PROTOCOL='AGROWAY_CONTROL_COMMISSIONING_V1';
export const CONTROL_COMMISSIONING_RELEASE='0.22.0-initial-rc2';
export const CONTROL_COMMISSIONING_COMMANDS=Object.freeze(['describe','check-config','preflight','capture-evidence']);

const FIXED_HOST_RUNNER=path.resolve('dist/control-production-host/run.mjs');
const EVIDENCE_ROOT=path.resolve('dist/control-commissioning-evidence');
const EVIDENCE_FILE=path.join(EVIDENCE_ROOT,'PREFLIGHT_EVIDENCE.json');
const SHA1=/^[a-f0-9]{40}$/;
const SHA256=/^[a-f0-9]{64}$/;
const SAFE_ERROR=/^[A-Z0-9_:-]{3,160}$/;
const CHECK_IDS=new Set(['IDENTITY_PROVIDER_CONNECTIVITY','POSTGRES_CONNECTIVITY','EXTERNAL_ACK_PROVIDER_CONNECTIVITY','D10_HUMAN_PRODUCT_APPROVAL']);
const CHECK_STATUS=new Set(['PASS','PENDING','FAIL']);

const requiredEnvironment=Object.freeze({
  releaseCandidate:Object.freeze([
    Object.freeze({key:'AGROWAY_CONTROL_RUNTIME_MODE',secret:false}),
    Object.freeze({key:'AGROWAY_CONTROL_BOOTSTRAP_MODE',secret:false}),
    Object.freeze({key:'AGROWAY_CONTROL_RELEASE_VERSION',secret:false}),
    Object.freeze({key:'AGROWAY_CONTROL_GIT_HEAD_SHA',secret:false}),
    Object.freeze({key:'AGROWAY_CONTROL_REVIEW_BUNDLE_SHA256',secret:false})
  ]),
  oidc:Object.freeze([
    Object.freeze({key:'AGROWAY_OIDC_ISSUER',secret:false}),
    Object.freeze({key:'AGROWAY_OIDC_JWKS_URI',secret:false}),
    Object.freeze({key:'AGROWAY_OIDC_AUDIENCE',secret:false}),
    Object.freeze({key:'AGROWAY_OIDC_TENANT_CLAIM',secret:false}),
    Object.freeze({key:'AGROWAY_OIDC_SESSION_CLAIM',secret:false}),
    Object.freeze({key:'AGROWAY_OIDC_MFA_AMR_VALUES',secret:false})
  ]),
  postgres:Object.freeze([
    Object.freeze({key:'AGROWAY_POSTGRES_HOST',secret:false}),
    Object.freeze({key:'AGROWAY_POSTGRES_DATABASE',secret:false}),
    Object.freeze({key:'AGROWAY_POSTGRES_USER',secret:false}),
    Object.freeze({key:'AGROWAY_POSTGRES_PASSWORD',secret:true}),
    Object.freeze({key:'AGROWAY_POSTGRES_CA_PEM',secret:true})
  ]),
  externalAck:Object.freeze([
    Object.freeze({key:'AGROWAY_EXTERNAL_ACK_PROVIDER_ID',secret:false}),
    Object.freeze({key:'AGROWAY_EXTERNAL_ACK_ENDPOINT',secret:false}),
    Object.freeze({key:'AGROWAY_EXTERNAL_ACK_METADATA_URI',secret:false}),
    Object.freeze({key:'AGROWAY_EXTERNAL_ACK_AUTH_MODE',secret:false}),
    Object.freeze({key:'AGROWAY_EXTERNAL_ACK_VERIFICATION_KEYS_JSON',secret:false})
  ])
});

const conditionalEnvironment=Object.freeze([
  Object.freeze({when:'AGROWAY_EXTERNAL_ACK_AUTH_MODE=BEARER',key:'AGROWAY_EXTERNAL_ACK_BEARER_TOKEN',secret:true}),
  Object.freeze({atLeastOneOf:Object.freeze(['AGROWAY_OIDC_AAL2_ACR_VALUES','AGROWAY_OIDC_AAL3_ACR_VALUES']),secret:false})
]);

const optionalEnvironment=Object.freeze([
  'AGROWAY_OIDC_ALLOWED_ALGORITHMS','AGROWAY_OIDC_CLOCK_SKEW_SECONDS','AGROWAY_OIDC_MAX_TOKEN_AGE_SECONDS','AGROWAY_OIDC_JWKS_TIMEOUT_MS','AGROWAY_OIDC_JWKS_CACHE_TTL_MS','AGROWAY_OIDC_JWKS_MAX_BYTES','AGROWAY_OIDC_JWKS_MAX_KEYS',
  'AGROWAY_POSTGRES_PORT','AGROWAY_POSTGRES_TLS_SERVERNAME','AGROWAY_POSTGRES_POOL_MAX','AGROWAY_POSTGRES_CONNECT_TIMEOUT_MS','AGROWAY_POSTGRES_STATEMENT_TIMEOUT_MS',
  'AGROWAY_EXTERNAL_ACK_TIMEOUT_MS','AGROWAY_EXTERNAL_ACK_MAX_RESPONSE_BYTES','AGROWAY_EXTERNAL_ACK_MAX_ACK_AGE_MS','AGROWAY_EXTERNAL_ACK_CLOCK_SKEW_MS','AGROWAY_EXTERNAL_ACK_METADATA_TIMEOUT_MS','AGROWAY_EXTERNAL_ACK_METADATA_MAX_BYTES'
]);

function safeError(value){return typeof value==='string'&&SAFE_ERROR.test(value)?value:'COMMISSIONING_OPERATION_BLOCKED';}
function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function blocked(error){return Object.freeze({protocol:CONTROL_COMMISSIONING_PROTOCOL,release:CONTROL_COMMISSIONING_RELEASE,state:'BLOCKED',error:safeError(error),d10:'PENDING',productionExecutionAvailable:false,canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,activationCommandAvailable:false});}

function validateCandidateEnvironment(env){
  if(env.AGROWAY_CONTROL_RUNTIME_MODE?.trim()!=='PRODUCTION')throw new Error('COMMISSIONING_RUNTIME_MODE_REQUIRED');
  if(env.AGROWAY_CONTROL_BOOTSTRAP_MODE?.trim()!=='PRODUCTION_EXTERNAL_BINDINGS')throw new Error('COMMISSIONING_BOOTSTRAP_MODE_REQUIRED');
  if(env.AGROWAY_CONTROL_RELEASE_VERSION?.trim()!==CONTROL_COMMISSIONING_RELEASE)throw new Error('COMMISSIONING_RELEASE_VERSION_MISMATCH');
  if(!SHA1.test(env.AGROWAY_CONTROL_GIT_HEAD_SHA?.trim()||''))throw new Error('COMMISSIONING_GIT_HEAD_SHA_INVALID');
  if(!SHA256.test(env.AGROWAY_CONTROL_REVIEW_BUNDLE_SHA256?.trim()||''))throw new Error('COMMISSIONING_REVIEW_BUNDLE_SHA256_INVALID');
  return Object.freeze({
    version:CONTROL_COMMISSIONING_RELEASE,
    headSha:env.AGROWAY_CONTROL_GIT_HEAD_SHA.trim(),
    reviewBundleSha256:env.AGROWAY_CONTROL_REVIEW_BUNDLE_SHA256.trim()
  });
}

function parseHostOutput(stdout){
  const lines=String(stdout||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  for(let i=lines.length-1;i>=0;i--){
    try{const value=JSON.parse(lines[i]);if(value&&typeof value==='object'&&!Array.isArray(value))return value;}catch{}
  }
  throw new Error('COMMISSIONING_HOST_OUTPUT_INVALID');
}

export function invokeFixedProductionHost(command,env=process.env){
  if(command!=='check-config'&&command!=='preflight')throw new Error('COMMISSIONING_HOST_COMMAND_INVALID');
  if(!fs.existsSync(FIXED_HOST_RUNNER))return blocked('COMMISSIONING_PRODUCTION_HOST_NOT_BUILT');
  const child=spawnSync(process.execPath,[FIXED_HOST_RUNNER,command],{env,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:1024*1024});
  let parsed;
  try{parsed=parseHostOutput(child.stdout);}catch{return blocked('COMMISSIONING_HOST_OUTPUT_INVALID');}
  if(child.status!==0&&parsed.state!=='BLOCKED')return blocked('COMMISSIONING_HOST_EXIT_FAILURE');
  return parsed;
}

function normalizeChecks(value){
  if(!Array.isArray(value)||value.length!==4)throw new Error('COMMISSIONING_HOST_CHECKS_INVALID');
  const seen=new Set();
  const checks=value.map(item=>{
    if(!item||typeof item!=='object'||!CHECK_IDS.has(item.id)||!CHECK_STATUS.has(item.status)||seen.has(item.id))throw new Error('COMMISSIONING_HOST_CHECKS_INVALID');
    seen.add(item.id);return Object.freeze({id:item.id,status:item.status});
  });
  if(seen.size!==4)throw new Error('COMMISSIONING_HOST_CHECKS_INVALID');
  return Object.freeze(checks);
}

function assertCandidateMatch(actual,expected){
  if(!actual||typeof actual!=='object'||actual.version!==expected.version||actual.headSha!==expected.headSha||actual.reviewBundleSha256!==expected.reviewBundleSha256)throw new Error('COMMISSIONING_HOST_CANDIDATE_MISMATCH');
}

function normalizeCheckConfig(host){
  if(host?.state==='BLOCKED')return blocked(host.error);
  if(host?.state!=='CONFIGURATION_VALID'||host.identityConfigured!==true||host.postgresConfigured!==true||host.externalAckConfigured!==true||host.secretsReturned!==false||host.networkProbeExecuted!==false||host.productionExecutionAvailable!==false)throw new Error('COMMISSIONING_HOST_CONFIG_RESULT_INVALID');
  return Object.freeze({protocol:CONTROL_COMMISSIONING_PROTOCOL,release:CONTROL_COMMISSIONING_RELEASE,state:'CONFIGURATION_VALID',identityConfigured:true,postgresConfigured:true,externalAckConfigured:true,secretsReturned:false,networkProbeExecuted:false,d10:'PENDING',productionExecutionAvailable:false,activationCommandAvailable:false});
}

function normalizePreflight(host,expectedCandidate){
  if(host?.state==='BLOCKED')return blocked(host.error);
  if(host?.state!=='READY_FOR_D10_HUMAN_REVIEW'&&host?.state!=='BLOCKED_PRODUCTION_PREREQUISITES')throw new Error('COMMISSIONING_HOST_PREFLIGHT_STATE_INVALID');
  assertCandidateMatch(host.candidate,expectedCandidate);
  const checks=normalizeChecks(host.checks);
  if(typeof host.bindingEvidenceIssued!=='boolean')throw new Error('COMMISSIONING_BINDING_EVIDENCE_FLAG_INVALID');
  if(host.bindingEvidenceIssued&&(!SHA256.test(host.bindingEvidenceDigestSha256||'')))throw new Error('COMMISSIONING_BINDING_EVIDENCE_DIGEST_INVALID');
  if(!host.bindingEvidenceIssued&&host.bindingEvidenceDigestSha256!==null)throw new Error('COMMISSIONING_BINDING_EVIDENCE_DIGEST_UNEXPECTED');
  if(host.d10!=='PENDING'||host.secretsReturned!==false||host.canonicalWriteExecuted!==false||host.externalAckSent!==false||host.productionSessionCreated!==false||host.browserActivationAllowed!==false||host.productionExecutionAvailable!==false)throw new Error('COMMISSIONING_HOST_PREFLIGHT_TRUST_INVALID');
  return Object.freeze({
    protocol:CONTROL_COMMISSIONING_PROTOCOL,release:CONTROL_COMMISSIONING_RELEASE,state:host.state,candidate:Object.freeze({...expectedCandidate}),checks,
    bindingEvidenceIssued:host.bindingEvidenceIssued,bindingEvidenceDigestSha256:host.bindingEvidenceDigestSha256,d10:'PENDING',secretsReturned:false,
    canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,browserActivationAllowed:false,productionExecutionAvailable:false,activationCommandAvailable:false
  });
}

function evidenceReady(preflight){
  if(preflight.state!=='READY_FOR_D10_HUMAN_REVIEW'||preflight.bindingEvidenceIssued!==true||!SHA256.test(preflight.bindingEvidenceDigestSha256||''))return false;
  const map=new Map(preflight.checks.map(x=>[x.id,x.status]));
  return map.get('IDENTITY_PROVIDER_CONNECTIVITY')==='PASS'&&map.get('POSTGRES_CONNECTIVITY')==='PASS'&&map.get('EXTERNAL_ACK_PROVIDER_CONNECTIVITY')==='PASS'&&map.get('D10_HUMAN_PRODUCT_APPROVAL')==='PENDING';
}

function writeEvidence(preflight,outputRoot=EVIDENCE_ROOT,now=()=>new Date()){
  if(!evidenceReady(preflight))throw new Error('COMMISSIONING_EVIDENCE_PREREQUISITES_NOT_MET');
  const root=path.resolve(outputRoot);const target=path.join(root,'PREFLIGHT_EVIDENCE.json');const temp=path.join(root,'.PREFLIGHT_EVIDENCE.tmp');
  fs.mkdirSync(root,{recursive:true});
  const evidence={
    protocol:CONTROL_COMMISSIONING_PROTOCOL,release:CONTROL_COMMISSIONING_RELEASE,state:'READY_FOR_D10_HUMAN_REVIEW',capturedAt:now().toISOString(),candidate:preflight.candidate,
    checks:preflight.checks,bindingEvidenceIssued:true,bindingEvidenceDigestSha256:preflight.bindingEvidenceDigestSha256,d10:'PENDING',containsProductionSecrets:false,
    canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,productionExecutionAvailable:false,activationCommandAvailable:false
  };
  const body=Buffer.from(JSON.stringify(evidence,null,2)+'\n');
  fs.writeFileSync(temp,body,{mode:0o600});fs.renameSync(temp,target);
  return Object.freeze({protocol:CONTROL_COMMISSIONING_PROTOCOL,release:CONTROL_COMMISSIONING_RELEASE,state:'EVIDENCE_CAPTURED_FOR_D10_HUMAN_REVIEW',evidencePath:path.relative(process.cwd(),target),evidenceSha256:sha256(body),containsProductionSecrets:false,d10:'PENDING',productionExecutionAvailable:false,activationCommandAvailable:false});
}

export function describeCommissioning(){
  return Object.freeze({
    protocol:CONTROL_COMMISSIONING_PROTOCOL,release:CONTROL_COMMISSIONING_RELEASE,kind:'SERVER_SIDE_COMMISSIONING_CLI',commands:CONTROL_COMMISSIONING_COMMANDS,
    requiredEnvironment,conditionalEnvironment,optionalEnvironment,environmentValuesReturned:false,browser:false,httpListener:false,d10Accepted:false,d10ApprovalCommandAvailable:false,
    activationCommandAvailable:false,canonicalWriteAvailable:false,externalAckSendAvailable:false,productionSessionCreationAvailable:false,productionExecutionAvailable:false
  });
}

export function runControlProductionCommissioning({command='describe',env=process.env,invokeHost=invokeFixedProductionHost,outputRoot=EVIDENCE_ROOT,now=()=>new Date()}={}){
  if(!CONTROL_COMMISSIONING_COMMANDS.includes(command))throw new Error('COMMISSIONING_COMMAND_INVALID');
  if(command==='describe')return describeCommissioning();
  let candidate;
  try{candidate=validateCandidateEnvironment(env);}catch(error){return blocked(error instanceof Error?error.message:String(error));}
  let host;
  try{host=invokeHost(command==='check-config'?'check-config':'preflight',env);}catch(error){return blocked(error instanceof Error?error.message:String(error));}
  try{
    if(command==='check-config')return normalizeCheckConfig(host);
    const preflight=normalizePreflight(host,candidate);
    if(command==='preflight')return preflight;
    return writeEvidence(preflight,outputRoot,now);
  }catch(error){return blocked(error instanceof Error?error.message:String(error));}
}

const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
  const command=process.argv[2]||'describe';
  let result;
  try{result=runControlProductionCommissioning({command});}
  catch(error){result=blocked(error instanceof Error?error.message:String(error));}
  process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
  if(result.state==='BLOCKED')process.exitCode=2;
}
