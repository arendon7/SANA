import { createHash } from 'node:crypto';
import { CONTROL_EXTERNAL_ACK_PROTOCOL, HttpsExternalAckTransport, validateExternalAckProviderConfig } from './control-external-ack-adapter.js';
import type { ExternalAckProviderConfig, ExternalAckTransport, ExternalAckVerificationKey, HttpFetchLike } from './control-external-ack-adapter.js';

export const PRODUCTION_EXTERNAL_ACK_CONFIGURATION_VERSION='AGROWAY_EXTERNAL_ACK_PRODUCTION_V1' as const;
export const PRODUCTION_EXTERNAL_ACK_METADATA_PROTOCOL='AGROWAY_CONTROL_ACK_PROVIDER_METADATA_V1' as const;

export type ProductionExternalAckEnvironment=Readonly<Record<string,string|undefined>>;
export type ProductionExternalAckAuthMode='NONE'|'BEARER';

export type ProductionExternalAckPolicy=Readonly<{
  timeoutMs:number;
  maxResponseBytes:number;
  maxAckAgeMs:number;
  clockSkewMs:number;
  metadataTimeoutMs:number;
  metadataMaxResponseBytes:number;
}>;

export type ProductionExternalAckConfiguration=Readonly<{
  version:typeof PRODUCTION_EXTERNAL_ACK_CONFIGURATION_VERSION;
  providerId:string;
  endpoint:string;
  metadataUri:string;
  authMode:ProductionExternalAckAuthMode;
  verificationKeys:readonly ExternalAckVerificationKey[];
  policy:ProductionExternalAckPolicy;
}>;

export type ProductionExternalAckDiagnostics=Readonly<{
  version:typeof PRODUCTION_EXTERNAL_ACK_CONFIGURATION_VERSION;
  providerId:string;
  endpointHost:string;
  metadataHost:string;
  sameOrigin:true;
  authMode:ProductionExternalAckAuthMode;
  bearerCredentialConfigured:boolean;
  verificationKeyIds:readonly string[];
  verificationKeySha256:Readonly<Record<string,string>>;
  timeoutMs:number;
  maxResponseBytes:number;
  metadataTimeoutMs:number;
  metadataMaxResponseBytes:number;
  credentialsStoredInDiagnostics:false;
  browserInvocationAllowed:false;
}>;

export type ProductionExternalAckConnectivityEvidence=Readonly<{
  state:'EXTERNAL_ACK_PROVIDER_METADATA_CONNECTED_READ_ONLY_PROBE';
  providerId:string;
  endpoint:string;
  metadataUri:string;
  ackProtocol:typeof CONTROL_EXTERNAL_ACK_PROTOCOL;
  verificationKeyIds:readonly string[];
  observedAt:string;
  realExternalAckObserved:false;
  canonicalMutated:false;
  executionState:'NOT_EXECUTED';
}>;

export interface ExternalAckMetadataHeadersLike { get(name:string):string|null; }
export interface ExternalAckMetadataResponseLike { ok:boolean;status:number;headers:ExternalAckMetadataHeadersLike;text():Promise<string>; }
export type ExternalAckMetadataFetchLike=(input:string,init:{method:'GET';headers:Readonly<Record<string,string>>;signal:AbortSignal;redirect:'error';credentials:'omit';cache:'no-store'})=>Promise<ExternalAckMetadataResponseLike>;

const PROVIDER=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const KEY_ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function required(env:ProductionExternalAckEnvironment,key:string):string{
  const value=env[key]?.trim();
  if(!value)throw new Error(`PRODUCTION_EXTERNAL_ACK_ENV_REQUIRED:${key}`);
  return value;
}

function integerEnv(env:ProductionExternalAckEnvironment,key:string,fallback:number,min:number,max:number):number{
  const raw=env[key]?.trim();
  if(raw===undefined||raw==='')return fallback;
  if(!/^\d+$/.test(raw))throw new Error(`PRODUCTION_EXTERNAL_ACK_ENV_INTEGER_INVALID:${key}`);
  const value=Number(raw);
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error(`PRODUCTION_EXTERNAL_ACK_ENV_INTEGER_OUT_OF_RANGE:${key}`);
  return value;
}

function strictHttpsUrl(value:string,key:string):URL{
  let url:URL;
  try{url=new URL(value);}catch{throw new Error(`PRODUCTION_EXTERNAL_ACK_HTTPS_URL_INVALID:${key}`);}
  if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search)throw new Error(`PRODUCTION_EXTERNAL_ACK_HTTPS_URL_INVALID:${key}`);
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host==='127.0.0.1'||host==='::1')throw new Error(`PRODUCTION_EXTERNAL_ACK_LOOPBACK_FORBIDDEN:${key}`);
  return url;
}

function parseAuthMode(env:ProductionExternalAckEnvironment):ProductionExternalAckAuthMode{
  const raw=required(env,'AGROWAY_EXTERNAL_ACK_AUTH_MODE');
  if(raw!=='NONE'&&raw!=='BEARER')throw new Error('PRODUCTION_EXTERNAL_ACK_AUTH_MODE_INVALID');
  return raw;
}

function bearerCredential(env:ProductionExternalAckEnvironment,mode:ProductionExternalAckAuthMode):string|undefined{
  const raw=env.AGROWAY_EXTERNAL_ACK_BEARER_TOKEN;
  const value=raw?.trim();
  if(mode==='NONE'){
    if(value)throw new Error('PRODUCTION_EXTERNAL_ACK_BEARER_FORBIDDEN_FOR_NONE_AUTH');
    return undefined;
  }
  if(!value||value.length<32||value.length>4096||/[\u0000-\u001f\u007f]/.test(value))throw new Error('PRODUCTION_EXTERNAL_ACK_BEARER_INVALID');
  return value;
}

function parseVerificationKeys(raw:string):readonly ExternalAckVerificationKey[]{
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}catch{throw new Error('PRODUCTION_EXTERNAL_ACK_KEYS_JSON_INVALID');}
  if(!Array.isArray(parsed)||parsed.length<1||parsed.length>8)throw new Error('PRODUCTION_EXTERNAL_ACK_KEY_COUNT_INVALID');
  const ids=new Set<string>();
  const keys=parsed.map((candidate,index)=>{
    if(candidate===null||typeof candidate!=='object'||Array.isArray(candidate))throw new Error(`PRODUCTION_EXTERNAL_ACK_KEY_OBJECT_REQUIRED:${index}`);
    const obj=candidate as Record<string,unknown>;
    const allowed=new Set(['keyId','algorithm','publicKeyPem']);
    if(Object.keys(obj).some(key=>!allowed.has(key)))throw new Error(`PRODUCTION_EXTERNAL_ACK_KEY_UNKNOWN_FIELD:${index}`);
    if(typeof obj.keyId!=='string'||!KEY_ID.test(obj.keyId))throw new Error(`PRODUCTION_EXTERNAL_ACK_KEY_ID_INVALID:${index}`);
    if(ids.has(obj.keyId))throw new Error('PRODUCTION_EXTERNAL_ACK_DUPLICATE_KEY_ID');
    ids.add(obj.keyId);
    if(obj.algorithm!=='Ed25519')throw new Error(`PRODUCTION_EXTERNAL_ACK_KEY_ALGORITHM_INVALID:${index}`);
    if(typeof obj.publicKeyPem!=='string'||!obj.publicKeyPem.includes('BEGIN PUBLIC KEY')||obj.publicKeyPem.length>4096)throw new Error(`PRODUCTION_EXTERNAL_ACK_PUBLIC_KEY_INVALID:${index}`);
    return Object.freeze({keyId:obj.keyId,algorithm:'Ed25519' as const,publicKeyPem:obj.publicKeyPem});
  });
  return Object.freeze(keys);
}

export function resolveProductionExternalAckConfiguration(env:ProductionExternalAckEnvironment):ProductionExternalAckConfiguration{
  const providerId=required(env,'AGROWAY_EXTERNAL_ACK_PROVIDER_ID');
  if(!PROVIDER.test(providerId))throw new Error('PRODUCTION_EXTERNAL_ACK_PROVIDER_ID_INVALID');
  const endpoint=required(env,'AGROWAY_EXTERNAL_ACK_ENDPOINT');
  const metadataUri=required(env,'AGROWAY_EXTERNAL_ACK_METADATA_URI');
  const endpointUrl=strictHttpsUrl(endpoint,'AGROWAY_EXTERNAL_ACK_ENDPOINT');
  const metadataUrl=strictHttpsUrl(metadataUri,'AGROWAY_EXTERNAL_ACK_METADATA_URI');
  if(endpointUrl.origin!==metadataUrl.origin)throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_ORIGIN_MISMATCH');
  const authMode=parseAuthMode(env);
  bearerCredential(env,authMode);
  const verificationKeys=parseVerificationKeys(required(env,'AGROWAY_EXTERNAL_ACK_VERIFICATION_KEYS_JSON'));
  const policy:ProductionExternalAckPolicy=Object.freeze({
    timeoutMs:integerEnv(env,'AGROWAY_EXTERNAL_ACK_TIMEOUT_MS',5000,250,30000),
    maxResponseBytes:integerEnv(env,'AGROWAY_EXTERNAL_ACK_MAX_RESPONSE_BYTES',65536,256,65536),
    maxAckAgeMs:integerEnv(env,'AGROWAY_EXTERNAL_ACK_MAX_ACK_AGE_MS',300000,1000,86400000),
    clockSkewMs:integerEnv(env,'AGROWAY_EXTERNAL_ACK_CLOCK_SKEW_MS',30000,0,300000),
    metadataTimeoutMs:integerEnv(env,'AGROWAY_EXTERNAL_ACK_METADATA_TIMEOUT_MS',5000,250,30000),
    metadataMaxResponseBytes:integerEnv(env,'AGROWAY_EXTERNAL_ACK_METADATA_MAX_BYTES',16384,256,65536)
  });
  const probeConfig:ExternalAckProviderConfig={providerId,endpoint,timeoutMs:policy.timeoutMs,maxResponseBytes:policy.maxResponseBytes,maxAckAgeMs:policy.maxAckAgeMs,clockSkewMs:policy.clockSkewMs,verificationKeys};
  validateExternalAckProviderConfig(probeConfig);
  return Object.freeze({version:PRODUCTION_EXTERNAL_ACK_CONFIGURATION_VERSION,providerId,endpoint,metadataUri,authMode,verificationKeys,policy});
}

export function productionExternalAckDiagnostics(config:ProductionExternalAckConfiguration,credentialConfigured:boolean):ProductionExternalAckDiagnostics{
  const verificationKeySha256:Record<string,string>={};
  for(const key of config.verificationKeys)verificationKeySha256[key.keyId]=createHash('sha256').update(key.publicKeyPem).digest('hex');
  return Object.freeze({
    version:config.version,providerId:config.providerId,endpointHost:new URL(config.endpoint).hostname,metadataHost:new URL(config.metadataUri).hostname,sameOrigin:true,
    authMode:config.authMode,bearerCredentialConfigured:credentialConfigured,verificationKeyIds:Object.freeze(config.verificationKeys.map(x=>x.keyId)),verificationKeySha256:Object.freeze(verificationKeySha256),
    timeoutMs:config.policy.timeoutMs,maxResponseBytes:config.policy.maxResponseBytes,metadataTimeoutMs:config.policy.metadataTimeoutMs,metadataMaxResponseBytes:config.policy.metadataMaxResponseBytes,
    credentialsStoredInDiagnostics:false,browserInvocationAllowed:false
  });
}

function defaultMetadataFetch():ExternalAckMetadataFetchLike{
  if(typeof globalThis.fetch!=='function')throw new Error('PRODUCTION_EXTERNAL_ACK_FETCH_UNAVAILABLE');
  return globalThis.fetch.bind(globalThis) as unknown as ExternalAckMetadataFetchLike;
}

function contentLength(headers:ExternalAckMetadataHeadersLike):number|undefined{
  const raw=headers.get('content-length');
  if(raw===null)return undefined;
  if(!/^\d+$/.test(raw))throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_CONTENT_LENGTH_INVALID');
  return Number(raw);
}

function parseMetadata(text:string,config:ProductionExternalAckConfiguration):void{
  let parsed:unknown;
  try{parsed=JSON.parse(text);}catch{throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_JSON_INVALID');}
  if(parsed===null||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_OBJECT_REQUIRED');
  const obj=parsed as Record<string,unknown>;
  const allowed=new Set(['protocol','providerId','ackProtocol','verificationKeyIds','status']);
  if(Object.keys(obj).some(key=>!allowed.has(key))||Object.keys(obj).length!==allowed.size)throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_FIELDS_INVALID');
  if(obj.protocol!==PRODUCTION_EXTERNAL_ACK_METADATA_PROTOCOL)throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_PROTOCOL_MISMATCH');
  if(obj.providerId!==config.providerId)throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_PROVIDER_MISMATCH');
  if(obj.ackProtocol!==CONTROL_EXTERNAL_ACK_PROTOCOL)throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_ACK_PROTOCOL_MISMATCH');
  if(obj.status!=='READY_FOR_ACK')throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_NOT_READY');
  if(!Array.isArray(obj.verificationKeyIds)||obj.verificationKeyIds.some(x=>typeof x!=='string'||!KEY_ID.test(x)))throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_KEY_IDS_INVALID');
  const observed=[...obj.verificationKeyIds as string[]];
  if(new Set(observed).size!==observed.length)throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_DUPLICATE_KEY_ID');
  const expected=config.verificationKeys.map(x=>x.keyId).sort();
  if(JSON.stringify(observed.sort())!==JSON.stringify(expected))throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_KEY_SET_MISMATCH');
}

export interface ProductionExternalAckWiring{
  readonly configuration:ProductionExternalAckConfiguration;
  readonly diagnostics:ProductionExternalAckDiagnostics;
  readonly connectivityCertified:boolean;
  verifyConnectivity():Promise<ProductionExternalAckConnectivityEvidence>;
  createTransport(fetcher?:HttpFetchLike):ExternalAckTransport;
}

export function createProductionExternalAckWiring(env:ProductionExternalAckEnvironment,metadataFetcher:ExternalAckMetadataFetchLike=defaultMetadataFetch(),now:()=>number=()=>Date.now()):ProductionExternalAckWiring{
  const configuration=resolveProductionExternalAckConfiguration(env);
  const bearerToken=bearerCredential(env,configuration.authMode);
  const diagnostics=productionExternalAckDiagnostics(configuration,bearerToken!==undefined);
  let evidence:ProductionExternalAckConnectivityEvidence|undefined;
  let inflight:Promise<ProductionExternalAckConnectivityEvidence>|undefined;
  async function verifyConnectivity():Promise<ProductionExternalAckConnectivityEvidence>{
    if(evidence)return evidence;
    if(inflight)return inflight;
    inflight=(async()=>{
      const controller=new AbortController();
      let timer:ReturnType<typeof setTimeout>|undefined;
      try{
        const headers:Record<string,string>={accept:'application/json','x-agroway-ack-protocol':CONTROL_EXTERNAL_ACK_PROTOCOL};
        if(bearerToken!==undefined)headers.authorization=`Bearer ${bearerToken}`;
        const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('PRODUCTION_EXTERNAL_ACK_METADATA_TIMEOUT'));},configuration.policy.metadataTimeoutMs);});
        const request=metadataFetcher(configuration.metadataUri,{method:'GET',headers:Object.freeze(headers),signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store'});
        const response=await Promise.race([request,timeout]);
        if(!response.ok)throw new Error(`PRODUCTION_EXTERNAL_ACK_METADATA_HTTP_STATUS_${response.status}`);
        const contentType=(response.headers.get('content-type')||'').toLowerCase();
        if(contentType&&!contentType.includes('json'))throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_CONTENT_TYPE_INVALID');
        const length=contentLength(response.headers);
        if(length!==undefined&&length>configuration.policy.metadataMaxResponseBytes)throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_RESPONSE_TOO_LARGE');
        const text=await response.text();
        if(new TextEncoder().encode(text).byteLength>configuration.policy.metadataMaxResponseBytes)throw new Error('PRODUCTION_EXTERNAL_ACK_METADATA_RESPONSE_TOO_LARGE');
        parseMetadata(text,configuration);
        evidence=Object.freeze({state:'EXTERNAL_ACK_PROVIDER_METADATA_CONNECTED_READ_ONLY_PROBE',providerId:configuration.providerId,endpoint:configuration.endpoint,metadataUri:configuration.metadataUri,ackProtocol:CONTROL_EXTERNAL_ACK_PROTOCOL,verificationKeyIds:Object.freeze(configuration.verificationKeys.map(x=>x.keyId)),observedAt:new Date(now()).toISOString(),realExternalAckObserved:false,canonicalMutated:false,executionState:'NOT_EXECUTED'});
        return evidence;
      }finally{if(timer!==undefined)clearTimeout(timer);inflight=undefined;}
    })();
    return inflight;
  }
  return Object.freeze({
    configuration,diagnostics,
    get connectivityCertified(){return evidence!==undefined;},
    verifyConnectivity,
    createTransport(fetcher?:HttpFetchLike):ExternalAckTransport{
      if(!evidence)throw new Error('PRODUCTION_EXTERNAL_ACK_CONNECTIVITY_CERTIFICATION_REQUIRED');
      const providerConfig:ExternalAckProviderConfig={providerId:configuration.providerId,endpoint:configuration.endpoint,timeoutMs:configuration.policy.timeoutMs,maxResponseBytes:configuration.policy.maxResponseBytes,maxAckAgeMs:configuration.policy.maxAckAgeMs,clockSkewMs:configuration.policy.clockSkewMs,verificationKeys:configuration.verificationKeys,...(bearerToken===undefined?{}:{bearerToken})};
      return fetcher===undefined?new HttpsExternalAckTransport(providerConfig):new HttpsExternalAckTransport(providerConfig,fetcher);
    }
  });
}
