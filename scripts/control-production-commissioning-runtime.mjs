import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const target=process.argv[2]||'scripts/control-production-commissioning.mjs';
const api=await import(pathToFileURL(path.resolve(target)).href);
const {CONTROL_COMMISSIONING_PROTOCOL,CONTROL_COMMISSIONING_RELEASE,CONTROL_COMMISSIONING_COMMANDS,describeCommissioning,runControlProductionCommissioning,invokeFixedProductionHost}=api;
let passed=0;const check=(name,value)=>{assert.ok(value,name);passed++;console.log(`PASS ${name}`);};
const candidate={version:CONTROL_COMMISSIONING_RELEASE,headSha:'a'.repeat(40),reviewBundleSha256:'b'.repeat(64)};
const goodEnv={
  AGROWAY_CONTROL_RUNTIME_MODE:'PRODUCTION',AGROWAY_CONTROL_BOOTSTRAP_MODE:'PRODUCTION_EXTERNAL_BINDINGS',AGROWAY_CONTROL_RELEASE_VERSION:CONTROL_COMMISSIONING_RELEASE,
  AGROWAY_CONTROL_GIT_HEAD_SHA:candidate.headSha,AGROWAY_CONTROL_REVIEW_BUNDLE_SHA256:candidate.reviewBundleSha256,
  AGROWAY_POSTGRES_PASSWORD:'DATABASE_SECRET_SENTINEL_1234567890',AGROWAY_EXTERNAL_ACK_BEARER_TOKEN:'ACK_SECRET_SENTINEL_12345678901234567890'
};
const checks=[
  {id:'IDENTITY_PROVIDER_CONNECTIVITY',status:'PASS'},
  {id:'POSTGRES_CONNECTIVITY',status:'PASS'},
  {id:'EXTERNAL_ACK_PROVIDER_CONNECTIVITY',status:'PASS'},
  {id:'D10_HUMAN_PRODUCT_APPROVAL',status:'PENDING'}
];
const goodPreflight={state:'READY_FOR_D10_HUMAN_REVIEW',candidate,checks,bindingEvidenceIssued:true,bindingEvidenceDigestSha256:'c'.repeat(64),d10:'PENDING',secretsReturned:false,canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,browserActivationAllowed:false,productionExecutionAvailable:false};
const goodConfig={state:'CONFIGURATION_VALID',identityConfigured:true,postgresConfigured:true,externalAckConfigured:true,secretsReturned:false,networkProbeExecuted:false,productionExecutionAvailable:false};
function host(command){if(command==='check-config')return goodConfig;if(command==='preflight')return goodPreflight;throw new Error('TEST_HOST_COMMAND_UNEXPECTED');}

{
  let invoked=false;const description=runControlProductionCommissioning({command:'describe',env:goodEnv,invokeHost:()=>{invoked=true;throw new Error('SHOULD_NOT_RUN');}});
  check('describe:protocol',description.protocol===CONTROL_COMMISSIONING_PROTOCOL&&description.release===CONTROL_COMMISSIONING_RELEASE);
  check('describe:commands-exact',JSON.stringify(description.commands)===JSON.stringify(['describe','check-config','preflight','capture-evidence']));
  check('describe:no-activation-or-d10',description.activationCommandAvailable===false&&description.d10ApprovalCommandAvailable===false&&description.d10Accepted===false);
  check('describe:no-host-invocation',invoked===false);
  check('describe:no-env-values',description.environmentValuesReturned===false&&!JSON.stringify(description).includes('DATABASE_SECRET_SENTINEL'));
  check('describe:server-side-only',description.browser===false&&description.httpListener===false&&description.canonicalWriteAvailable===false&&description.externalAckSendAvailable===false&&description.productionSessionCreationAvailable===false);
}
{
  const result=runControlProductionCommissioning({command:'check-config',env:goodEnv,invokeHost:host});
  check('check-config:valid',result.state==='CONFIGURATION_VALID'&&result.identityConfigured===true&&result.postgresConfigured===true&&result.externalAckConfigured===true);
  check('check-config:no-network',result.networkProbeExecuted===false);
  check('check-config:no-secrets',result.secretsReturned===false&&!JSON.stringify(result).includes('SECRET_SENTINEL'));
  check('check-config:no-execution',result.productionExecutionAvailable===false&&result.activationCommandAvailable===false&&result.d10==='PENDING');
}
{
  const result=runControlProductionCommissioning({command:'preflight',env:goodEnv,invokeHost:host});
  check('preflight:ready-for-d10',result.state==='READY_FOR_D10_HUMAN_REVIEW'&&result.bindingEvidenceIssued===true&&result.bindingEvidenceDigestSha256==='c'.repeat(64));
  check('preflight:all-provider-pass',result.checks.slice(0,3).every(x=>x.status==='PASS')&&result.checks[3].status==='PENDING');
  check('preflight:candidate-exact',result.candidate.version===CONTROL_COMMISSIONING_RELEASE&&result.candidate.headSha===candidate.headSha&&result.candidate.reviewBundleSha256===candidate.reviewBundleSha256);
  check('preflight:no-side-effects',result.canonicalWriteExecuted===false&&result.externalAckSent===false&&result.productionSessionCreated===false&&result.browserActivationAllowed===false&&result.productionExecutionAvailable===false);
  check('preflight:no-secrets',!JSON.stringify(result).includes('SECRET_SENTINEL'));
}
{
  const root=path.resolve('.tmp/control-commissioning-runtime/pass');fs.rmSync(root,{recursive:true,force:true});
  const result=runControlProductionCommissioning({command:'capture-evidence',env:goodEnv,invokeHost:host,outputRoot:root,now:()=>new Date('2026-08-13T00:50:00.000Z')});
  const file=path.join(root,'PREFLIGHT_EVIDENCE.json');const text=fs.readFileSync(file,'utf8');const evidence=JSON.parse(text);
  check('capture:state',result.state==='EVIDENCE_CAPTURED_FOR_D10_HUMAN_REVIEW'&&evidence.state==='READY_FOR_D10_HUMAN_REVIEW');
  check('capture:digest',/^[a-f0-9]{64}$/.test(result.evidenceSha256)&&evidence.bindingEvidenceDigestSha256==='c'.repeat(64));
  check('capture:fixed-filename',result.evidencePath.endsWith('PREFLIGHT_EVIDENCE.json'));
  check('capture:no-secrets',evidence.containsProductionSecrets===false&&!text.includes('SECRET_SENTINEL'));
  check('capture:no-execution',evidence.productionExecutionAvailable===false&&evidence.canonicalWriteExecuted===false&&evidence.externalAckSent===false&&evidence.productionSessionCreated===false&&evidence.activationCommandAvailable===false);
  if(process.platform!=='win32')check('capture:private-permissions',(fs.statSync(file).mode&0o777)===0o600);else check('capture:private-permissions',true);
}
{
  const root=path.resolve('.tmp/control-commissioning-runtime/fail');fs.rmSync(root,{recursive:true,force:true});
  const failing={...goodPreflight,state:'BLOCKED_PRODUCTION_PREREQUISITES',checks:checks.map((x,i)=>i===1?{...x,status:'FAIL'}:x),bindingEvidenceIssued:false,bindingEvidenceDigestSha256:null};
  const result=runControlProductionCommissioning({command:'capture-evidence',env:goodEnv,invokeHost:()=>failing,outputRoot:root});
  check('capture:partial-blocked',result.state==='BLOCKED'&&result.error==='COMMISSIONING_EVIDENCE_PREREQUISITES_NOT_MET');
  check('capture:partial-no-file',!fs.existsSync(path.join(root,'PREFLIGHT_EVIDENCE.json')));
}
{
  const drift={...goodPreflight,candidate:{...candidate,version:'0.22.0-alpha21'}};
  const result=runControlProductionCommissioning({command:'preflight',env:goodEnv,invokeHost:()=>drift});
  check('candidate:host-drift-blocked',result.state==='BLOCKED'&&result.error==='COMMISSIONING_HOST_CANDIDATE_MISMATCH');
}
{
  const result=runControlProductionCommissioning({command:'preflight',env:{...goodEnv,AGROWAY_CONTROL_RELEASE_VERSION:'0.22.0-initial-rc1'},invokeHost:host});
  check('candidate:environment-drift-blocked',result.state==='BLOCKED'&&result.error==='COMMISSIONING_RELEASE_VERSION_MISMATCH');
}
{
  const result=runControlProductionCommissioning({command:'preflight',env:goodEnv,invokeHost:()=>({state:'BLOCKED',error:'PRODUCTION_OIDC_JWKS_TIMEOUT'})});
  check('host:blocked-safe-code',result.state==='BLOCKED'&&result.error==='PRODUCTION_OIDC_JWKS_TIMEOUT'&&!JSON.stringify(result).includes('SECRET_SENTINEL'));
}
{
  const malformed={...goodPreflight,checks:[...checks,{id:'POSTGRES_CONNECTIVITY',status:'PASS'}]};
  const result=runControlProductionCommissioning({command:'preflight',env:goodEnv,invokeHost:()=>malformed});
  check('host:malformed-checks-blocked',result.state==='BLOCKED'&&result.error==='COMMISSIONING_HOST_CHECKS_INVALID');
}
assert.throws(()=>runControlProductionCommissioning({command:'activate',env:goodEnv,invokeHost:host}),/COMMISSIONING_COMMAND_INVALID/);check('command:activate-forbidden',!CONTROL_COMMISSIONING_COMMANDS.includes('activate'));
assert.throws(()=>invokeFixedProductionHost('activate',goodEnv),/COMMISSIONING_HOST_COMMAND_INVALID/);check('host-command:activate-forbidden',true);
check('release:rc2',CONTROL_COMMISSIONING_RELEASE==='0.22.0-initial-rc2');
console.log(`PASS_CONTROL_PRODUCTION_COMMISSIONING_RUNTIME ${passed}/${passed}`);
