import {
  ControlProductionReadinessOrchestrator,
  type ControlReleaseCandidate,
  type D10HumanProductApproval,
  type ExternalAckConnectivityEvidence,
  type IdentityConnectivityEvidence,
  type PostgresConnectivityEvidence,
  type ProductionReadinessAssessment,
  validateControlReleaseCandidate
} from './control-production-readiness.js';
import {
  CONTROL_PRODUCTION_BINDING_EVIDENCE_PROTOCOL,
  ControlProductionActivationAuthorizer,
  computeProductionBindingEvidenceDigest,
  type ProductionActivationApproval,
  type ProductionActivationDecision,
  type ProductionActivationRequest,
  type ProductionBindingEvidence
} from './control-production-activation.js';

export const CONTROL_PRODUCTION_BOOTSTRAP_PROTOCOL='AGROWAY_CONTROL_PRODUCTION_BOOTSTRAP_V1' as const;
export const CONTROL_PRODUCTION_BOOTSTRAP_MODE='PRODUCTION_EXTERNAL_BINDINGS' as const;

export type ControlProductionBootstrapEnvironment=Readonly<Record<string,string|undefined>>;

export interface BootstrapIdentityWiring { verifyConnectivity():Promise<IdentityConnectivityEvidence>; }
export interface BootstrapPostgresWiring { verifyConnectivity():Promise<PostgresConnectivityEvidence>; }
export interface BootstrapExternalAckWiring { verifyConnectivity():Promise<ExternalAckConnectivityEvidence>; }

export type ControlProductionBootstrapFactories=Readonly<{
  createIdentity(env:ControlProductionBootstrapEnvironment):BootstrapIdentityWiring;
  createPostgres(env:ControlProductionBootstrapEnvironment):BootstrapPostgresWiring;
  createExternalAck(env:ControlProductionBootstrapEnvironment):BootstrapExternalAckWiring;
}>;

export type ProductionBootstrapPreflightResult=Readonly<{
  protocol:typeof CONTROL_PRODUCTION_BOOTSTRAP_PROTOCOL;
  candidate:ControlReleaseCandidate;
  readiness:ProductionReadinessAssessment;
  bindingEvidence?:ProductionBindingEvidence;
  state:'BLOCKED_PRODUCTION_PREREQUISITES'|'BLOCKED_INVALID_D10_EVIDENCE'|'READY_FOR_D10_HUMAN_REVIEW'|'READY_FOR_EXPLICIT_ACTIVATION_REVIEW';
  productionExecutionAvailable:false;
  canonicalWriteExecuted:false;
  externalAckSent:false;
  productionSessionCreated:false;
  browserActivationAllowed:false;
}>;

export interface ControlProductionBootstrap {
  readonly protocol:typeof CONTROL_PRODUCTION_BOOTSTRAP_PROTOCOL;
  readonly state:'CONFIGURED_FAIL_CLOSED';
  readonly candidate:ControlReleaseCandidate;
  readonly productionExecutionAvailable:false;
  readonly browserActivationAllowed:false;
  readonly realBindingEvidenceIssued:boolean;
  preflight(d10?:D10HumanProductApproval):Promise<ProductionBootstrapPreflightResult>;
  authorizeActivation(input:Readonly<{d10:D10HumanProductApproval;request:ProductionActivationRequest;approval:ProductionActivationApproval}>):ProductionActivationDecision;
}

const required=(env:ControlProductionBootstrapEnvironment,key:string):string=>{
  const value=env[key]?.trim();
  if(!value)throw new Error(`PRODUCTION_BOOTSTRAP_ENV_REQUIRED:${key}`);
  return value;
};

export function resolveControlProductionReleaseCandidate(env:ControlProductionBootstrapEnvironment):ControlReleaseCandidate {
  if(required(env,'AGROWAY_CONTROL_RUNTIME_MODE')!=='PRODUCTION')throw new Error('PRODUCTION_BOOTSTRAP_RUNTIME_MODE_REQUIRED');
  if(required(env,'AGROWAY_CONTROL_BOOTSTRAP_MODE')!==CONTROL_PRODUCTION_BOOTSTRAP_MODE)throw new Error('PRODUCTION_BOOTSTRAP_EXTERNAL_BINDINGS_MODE_REQUIRED');
  const candidate=Object.freeze({version:required(env,'AGROWAY_CONTROL_RELEASE_VERSION'),headSha:required(env,'AGROWAY_CONTROL_GIT_HEAD_SHA'),reviewBundleSha256:required(env,'AGROWAY_CONTROL_REVIEW_BUNDLE_SHA256')});
  validateControlReleaseCandidate(candidate);
  return candidate;
}

function buildBindingEvidence(candidate:ControlReleaseCandidate,observedAt:string):ProductionBindingEvidence {
  const material={protocol:CONTROL_PRODUCTION_BINDING_EVIDENCE_PROTOCOL,environment:'PRODUCTION' as const,candidate,identityProviderBound:true as const,identityProviderConnectivityCertified:true as const,postgresSecretsBound:true as const,postgresConnectivityCertified:true as const,externalAckProviderBound:true as const,externalAckProviderConnectivityCertified:true as const,observedAt};
  return Object.freeze({...material,evidenceDigestSha256:computeProductionBindingEvidenceDigest(material)});
}

export function createControlProductionBootstrap(env:ControlProductionBootstrapEnvironment,factories:ControlProductionBootstrapFactories,now:()=>Date=()=>new Date()):ControlProductionBootstrap {
  const candidate=resolveControlProductionReleaseCandidate(env);
  let identity:BootstrapIdentityWiring;let postgres:BootstrapPostgresWiring;let externalAck:BootstrapExternalAckWiring;
  try { identity=factories.createIdentity(env);postgres=factories.createPostgres(env);externalAck=factories.createExternalAck(env); }
  catch(error){throw new Error('PRODUCTION_BOOTSTRAP_WIRING_CREATION_FAILED',{cause:error});}
  let latestReadiness:ProductionReadinessAssessment|undefined;let latestBindings:ProductionBindingEvidence|undefined;
  const readiness=new ControlProductionReadinessOrchestrator({identity,postgres,externalAck},candidate,now);
  const activation=new ControlProductionActivationAuthorizer(candidate,now);

  async function preflight(d10?:D10HumanProductApproval):Promise<ProductionBootstrapPreflightResult>{
    latestReadiness=undefined;latestBindings=undefined;
    const assessed=await readiness.assess(d10);latestReadiness=assessed;
    const connectivityPass=assessed.checks.slice(0,3).every(check=>check.status==='PASS');
    if(connectivityPass)latestBindings=buildBindingEvidence(candidate,now().toISOString());
    const state=assessed.state==='READY_FOR_EXPLICIT_ACTIVATION_REVIEW'?'READY_FOR_EXPLICIT_ACTIVATION_REVIEW':assessed.state==='READY_FOR_D10_HUMAN_REVIEW'?'READY_FOR_D10_HUMAN_REVIEW':assessed.state==='BLOCKED_INVALID_D10_EVIDENCE'?'BLOCKED_INVALID_D10_EVIDENCE':'BLOCKED_PRODUCTION_PREREQUISITES';
    return Object.freeze({protocol:CONTROL_PRODUCTION_BOOTSTRAP_PROTOCOL,candidate,readiness:assessed,...(latestBindings?{bindingEvidence:latestBindings}:{}),state,productionExecutionAvailable:false,canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,browserActivationAllowed:false});
  }

  function authorizeActivation(input:Readonly<{d10:D10HumanProductApproval;request:ProductionActivationRequest;approval:ProductionActivationApproval}>):ProductionActivationDecision{
    if(!latestReadiness)return Object.freeze({state:'BLOCKED_READINESS_ASSESSMENT',canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,browserActivationAllowed:false});
    if(!latestBindings)return Object.freeze({state:'BLOCKED_REAL_BINDINGS',canonicalWriteExecuted:false,externalAckSent:false,productionSessionCreated:false,browserActivationAllowed:false});
    return activation.authorize({readiness:latestReadiness,d10:input.d10,bindings:latestBindings,request:input.request,approval:input.approval});
  }

  return Object.freeze({protocol:CONTROL_PRODUCTION_BOOTSTRAP_PROTOCOL,state:'CONFIGURED_FAIL_CLOSED' as const,candidate,productionExecutionAvailable:false as const,browserActivationAllowed:false as const,get realBindingEvidenceIssued(){return latestBindings!==undefined;},preflight,authorizeActivation});
}
