import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const CONTROL_PRODUCTION_HOST_PROTOCOL='AGROWAY_CONTROL_PRODUCTION_HOST_V1';
const COMMANDS=new Set(['describe','verify-layout','check-config','preflight']);
const here=path.dirname(fileURLToPath(import.meta.url));
const defaultRuntimeRoot=path.basename(here)==='scripts'?path.resolve(here,'../dist/control-production-host'):here;

const safeErrorCode=error=>{
  const message=error instanceof Error?error.message:String(error);
  return /^[A-Z0-9_:-]{3,160}$/.test(message)?message:'PRODUCTION_HOST_OPERATION_FAILED';
};
const output=value=>process.stdout.write(`${JSON.stringify(value)}\n`);
const fixedModule=relative=>pathToFileURL(path.join(defaultRuntimeRoot,relative)).href;

export async function loadFixedProductionRuntime(){
  const [identity,postgres,ack,bootstrap]=await Promise.all([
    import(fixedModule('services/identity-access/src/oidc-production-wiring.js')),
    import(fixedModule('services/investment-portfolio/src/postgres-js-pool-factory.js')),
    import(fixedModule('services/external-data-gateway/src/control-external-ack-production-wiring.js')),
    import(fixedModule('services/pilot-certifier/src/control-production-bootstrap.js'))
  ]);
  for(const [name,fn] of [
    ['createProductionOidcWiring',identity.createProductionOidcWiring],
    ['createProductionPostgresWiringWithPinnedDriver',postgres.createProductionPostgresWiringWithPinnedDriver],
    ['createProductionExternalAckWiring',ack.createProductionExternalAckWiring],
    ['createControlProductionBootstrap',bootstrap.createControlProductionBootstrap]
  ])if(typeof fn!=='function')throw new Error(`PRODUCTION_HOST_RUNTIME_EXPORT_MISSING:${name}`);
  return Object.freeze({identity,postgres,ack,bootstrap});
}

export async function runControlProductionHost({env=process.env,command='describe',loadRuntime=loadFixedProductionRuntime,write=output}={}){
  if(!COMMANDS.has(command))throw new Error('PRODUCTION_HOST_COMMAND_INVALID');
  if(command==='describe'){
    const result=Object.freeze({protocol:CONTROL_PRODUCTION_HOST_PROTOCOL,kind:'SERVER_SIDE_CLI',commands:Object.freeze([...COMMANDS]),browser:false,httpListener:false,d10Accepted:false,activationCommandAvailable:false,productionExecutionAvailable:false});
    write(result);return result;
  }
  const runtime=await loadRuntime();
  if(command==='verify-layout'){
    const result=Object.freeze({protocol:CONTROL_PRODUCTION_HOST_PROTOCOL,state:'RUNTIME_LAYOUT_VERIFIED',fixedRuntimeRoot:true,browser:false,httpListener:false,productionExecutionAvailable:false});
    write(result);return result;
  }
  let postgresWiring;
  try{
    const identityWiring=runtime.identity.createProductionOidcWiring(env);
    postgresWiring=await runtime.postgres.createProductionPostgresWiringWithPinnedDriver(env);
    const ackWiring=runtime.ack.createProductionExternalAckWiring(env);
    if(command==='check-config'){
      const result=Object.freeze({protocol:CONTROL_PRODUCTION_HOST_PROTOCOL,state:'CONFIGURATION_VALID',identityConfigured:true,postgresConfigured:true,externalAckConfigured:true,secretsReturned:false,networkProbeExecuted:false,productionExecutionAvailable:false});
      write(result);return result;
    }
    const bootstrap=runtime.bootstrap.createControlProductionBootstrap(env,Object.freeze({
      createIdentity:()=>identityWiring,
      createPostgres:()=>postgresWiring,
      createExternalAck:()=>ackWiring
    }));
    const preflight=await bootstrap.preflight();
    const checks=Object.freeze(preflight.readiness.checks.map(({id,status})=>Object.freeze({id,status})));
    const result=Object.freeze({protocol:CONTROL_PRODUCTION_HOST_PROTOCOL,state:preflight.state,candidate:preflight.candidate,checks,bindingEvidenceIssued:preflight.bindingEvidence!==undefined,bindingEvidenceDigestSha256:preflight.bindingEvidence?.evidenceDigestSha256??null,d10:'PENDING',secretsReturned:false,canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,browserActivationAllowed:false,productionExecutionAvailable:false});
    write(result);return result;
  }catch(error){
    const result=Object.freeze({protocol:CONTROL_PRODUCTION_HOST_PROTOCOL,state:'BLOCKED',error:safeErrorCode(error),secretsReturned:false,productionExecutionAvailable:false});
    write(result);return result;
  }finally{
    if(postgresWiring&&typeof postgresWiring.closeDriver==='function')await postgresWiring.closeDriver().catch(()=>{});
  }
}

const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
  const command=process.argv[2]||'describe';
  runControlProductionHost({command}).then(result=>{if(result.state==='BLOCKED')process.exitCode=1}).catch(error=>{output({protocol:CONTROL_PRODUCTION_HOST_PROTOCOL,state:'BLOCKED',error:safeErrorCode(error),secretsReturned:false,productionExecutionAvailable:false});process.exitCode=1;});
}
