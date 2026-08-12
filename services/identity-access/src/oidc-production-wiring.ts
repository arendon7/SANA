import { verifyOidcProductionSession } from './oidc-session-adapter.js';
import type { OidcJwksResolver, OidcJsonWebKey, OidcProviderConfiguration, OidcSigningAlgorithm, VerifiedOidcSessionResult } from './oidc-session-adapter.js';

export const PRODUCTION_OIDC_CONFIGURATION_VERSION='AGROWAY_OIDC_PRODUCTION_V1' as const;

export type ProductionOidcEnvironment=Readonly<Record<string,string|undefined>>;

export type ProductionOidcJwksPolicy=Readonly<{
  timeoutMs:number;
  cacheTtlMs:number;
  maxResponseBytes:number;
  maxKeys:number;
}>;

export type ProductionOidcConfiguration=Readonly<{
  version:typeof PRODUCTION_OIDC_CONFIGURATION_VERSION;
  provider:OidcProviderConfiguration;
  jwks:ProductionOidcJwksPolicy;
}>;

export type ProductionOidcDiagnostics=Readonly<{
  version:typeof PRODUCTION_OIDC_CONFIGURATION_VERSION;
  issuerHost:string;
  jwksHost:string;
  audience:string;
  tenantClaim:string;
  sessionIdClaim:string;
  algorithms:readonly OidcSigningAlgorithm[];
  aal2AcrCount:number;
  aal3AcrCount:number;
  mfaAmrCount:number;
  timeoutMs:number;
  cacheTtlMs:number;
  maxResponseBytes:number;
  maxKeys:number;
  secretsStoredInConfiguration:false;
  browserTokenEndpointAllowed:false;
}>;

export type ProductionOidcConnectivityEvidence=Readonly<{
  state:'JWKS_CONNECTED_READ_ONLY_PROBE';
  issuer:string;
  jwksUri:string;
  keyCount:number;
  fetchedAt:string;
  expiresAt:string;
  realTokenVerified:false;
  canonicalMutated:false;
  executionState:'NOT_EXECUTED';
}>;

export type ProductionOidcSessionVerificationInput=Readonly<{
  idToken:string;
  expectedNonce:string;
  requestedAt:string;
}>;

export interface OidcJwksHttpHeadersLike { get(name:string):string|null; }
export interface OidcJwksHttpResponseLike { ok:boolean; status:number; headers:OidcJwksHttpHeadersLike; text():Promise<string>; }
export type OidcJwksFetchLike=(input:string,init:{method:'GET';headers:Readonly<Record<string,string>>;signal:AbortSignal;redirect:'error';credentials:'omit';cache:'no-store'})=>Promise<OidcJwksHttpResponseLike>;

const CLAIM=/^[A-Za-z_][A-Za-z0-9_.:-]{0,127}$/;
const SAFE_VALUE=/^[^\u0000-\u001f\u007f]{1,512}$/;
const KID=/^[^\u0000-\u001f\u007f]{1,256}$/;
const ALLOWED_ALGORITHMS=new Set<OidcSigningAlgorithm>(['RS256','ES256']);

function required(env:ProductionOidcEnvironment,key:string):string {
  const value=env[key]?.trim();
  if(!value) throw new Error(`PRODUCTION_OIDC_ENV_REQUIRED:${key}`);
  return value;
}

function integerEnv(env:ProductionOidcEnvironment,key:string,fallback:number,min:number,max:number):number {
  const raw=env[key]?.trim();
  if(raw===undefined||raw==='') return fallback;
  if(!/^\d+$/.test(raw)) throw new Error(`PRODUCTION_OIDC_ENV_INTEGER_INVALID:${key}`);
  const value=Number(raw);
  if(!Number.isSafeInteger(value)||value<min||value>max) throw new Error(`PRODUCTION_OIDC_ENV_INTEGER_OUT_OF_RANGE:${key}`);
  return value;
}

function csv(value:string,key:string):string[] {
  const items=value.split(',').map(x=>x.trim()).filter(Boolean);
  if(!items.length||new Set(items).size!==items.length) throw new Error(`PRODUCTION_OIDC_ENV_LIST_INVALID:${key}`);
  return items;
}

function requireClaim(value:string,key:string):string {
  if(!CLAIM.test(value)) throw new Error(`PRODUCTION_OIDC_CLAIM_INVALID:${key}`);
  return value;
}

function requireSafe(value:string,key:string):string {
  if(!SAFE_VALUE.test(value)) throw new Error(`PRODUCTION_OIDC_VALUE_INVALID:${key}`);
  return value;
}

function strictHttpsUrl(value:string,key:string,issuer=false):URL {
  let url:URL;
  try { url=new URL(value); } catch { throw new Error(`PRODUCTION_OIDC_HTTPS_URL_INVALID:${key}`); }
  if(url.protocol!=='https:'||url.username||url.password||url.hash||(issuer&&url.search)) throw new Error(`PRODUCTION_OIDC_HTTPS_URL_INVALID:${key}`);
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host==='127.0.0.1'||host==='::1') throw new Error(`PRODUCTION_OIDC_LOOPBACK_FORBIDDEN:${key}`);
  return url;
}

function algorithms(value:string):OidcSigningAlgorithm[] {
  const list=csv(value,'AGROWAY_OIDC_ALLOWED_ALGORITHMS');
  if(list.some(x=>!ALLOWED_ALGORITHMS.has(x as OidcSigningAlgorithm))) throw new Error('PRODUCTION_OIDC_ALGORITHM_NOT_ALLOWED');
  return list as OidcSigningAlgorithm[];
}

function assuranceMap(aal2:readonly string[],aal3:readonly string[]):Readonly<Record<string,'AAL2'|'AAL3'>> {
  const out:Record<string,'AAL2'|'AAL3'>={};
  for(const value of aal2){requireSafe(value,'AGROWAY_OIDC_AAL2_ACR_VALUES');out[value]='AAL2';}
  for(const value of aal3){requireSafe(value,'AGROWAY_OIDC_AAL3_ACR_VALUES');if(out[value])throw new Error('PRODUCTION_OIDC_ACR_ASSURANCE_OVERLAP');out[value]='AAL3';}
  if(!Object.keys(out).length) throw new Error('PRODUCTION_OIDC_ACR_MAPPING_REQUIRED');
  return Object.freeze(out);
}

export function resolveProductionOidcConfiguration(env:ProductionOidcEnvironment):ProductionOidcConfiguration {
  const issuer=required(env,'AGROWAY_OIDC_ISSUER');
  const jwksUri=required(env,'AGROWAY_OIDC_JWKS_URI');
  strictHttpsUrl(issuer,'AGROWAY_OIDC_ISSUER',true);
  strictHttpsUrl(jwksUri,'AGROWAY_OIDC_JWKS_URI');
  const audience=requireSafe(required(env,'AGROWAY_OIDC_AUDIENCE'),'AGROWAY_OIDC_AUDIENCE');
  const tenantClaim=requireClaim(required(env,'AGROWAY_OIDC_TENANT_CLAIM'),'AGROWAY_OIDC_TENANT_CLAIM');
  const sessionIdClaim=requireClaim(required(env,'AGROWAY_OIDC_SESSION_CLAIM'),'AGROWAY_OIDC_SESSION_CLAIM');
  if(tenantClaim===sessionIdClaim) throw new Error('PRODUCTION_OIDC_CLAIMS_MUST_BE_DISTINCT');
  const allowedAlgorithms=algorithms(env.AGROWAY_OIDC_ALLOWED_ALGORITHMS?.trim()||'RS256,ES256');
  const aal2=env.AGROWAY_OIDC_AAL2_ACR_VALUES?.trim()?csv(env.AGROWAY_OIDC_AAL2_ACR_VALUES,'AGROWAY_OIDC_AAL2_ACR_VALUES'):[];
  const aal3=env.AGROWAY_OIDC_AAL3_ACR_VALUES?.trim()?csv(env.AGROWAY_OIDC_AAL3_ACR_VALUES,'AGROWAY_OIDC_AAL3_ACR_VALUES'):[];
  const acrAssurance=assuranceMap(aal2,aal3);
  const mfaAmrValues=csv(required(env,'AGROWAY_OIDC_MFA_AMR_VALUES'),'AGROWAY_OIDC_MFA_AMR_VALUES').map(x=>requireSafe(x,'AGROWAY_OIDC_MFA_AMR_VALUES'));
  const provider:OidcProviderConfiguration=Object.freeze({
    issuer,audience,jwksUri,tenantClaim,sessionIdClaim,
    allowedAlgorithms:Object.freeze([...allowedAlgorithms]),
    acrAssurance,
    mfaAmrValues:Object.freeze([...mfaAmrValues]),
    clockSkewSeconds:integerEnv(env,'AGROWAY_OIDC_CLOCK_SKEW_SECONDS',30,0,120),
    maxTokenAgeSeconds:integerEnv(env,'AGROWAY_OIDC_MAX_TOKEN_AGE_SECONDS',900,1,3600)
  });
  const jwks:ProductionOidcJwksPolicy=Object.freeze({
    timeoutMs:integerEnv(env,'AGROWAY_OIDC_JWKS_TIMEOUT_MS',5000,250,30000),
    cacheTtlMs:integerEnv(env,'AGROWAY_OIDC_JWKS_CACHE_TTL_MS',300000,1000,3600000),
    maxResponseBytes:integerEnv(env,'AGROWAY_OIDC_JWKS_MAX_BYTES',65536,1024,1048576),
    maxKeys:integerEnv(env,'AGROWAY_OIDC_JWKS_MAX_KEYS',32,1,128)
  });
  return Object.freeze({version:PRODUCTION_OIDC_CONFIGURATION_VERSION,provider,jwks});
}

export function productionOidcDiagnostics(config:ProductionOidcConfiguration):ProductionOidcDiagnostics {
  const issuerHost=new URL(config.provider.issuer).hostname;
  const jwksHost=new URL(config.provider.jwksUri).hostname;
  const values=Object.values(config.provider.acrAssurance);
  return Object.freeze({
    version:config.version,issuerHost,jwksHost,audience:config.provider.audience,tenantClaim:config.provider.tenantClaim,sessionIdClaim:config.provider.sessionIdClaim,
    algorithms:Object.freeze([...config.provider.allowedAlgorithms]),aal2AcrCount:values.filter(x=>x==='AAL2').length,aal3AcrCount:values.filter(x=>x==='AAL3').length,
    mfaAmrCount:config.provider.mfaAmrValues.length,timeoutMs:config.jwks.timeoutMs,cacheTtlMs:config.jwks.cacheTtlMs,maxResponseBytes:config.jwks.maxResponseBytes,maxKeys:config.jwks.maxKeys,
    secretsStoredInConfiguration:false,browserTokenEndpointAllowed:false
  });
}

function defaultFetch():OidcJwksFetchLike {
  if(typeof globalThis.fetch!=='function') throw new Error('PRODUCTION_OIDC_FETCH_UNAVAILABLE');
  return globalThis.fetch.bind(globalThis) as unknown as OidcJwksFetchLike;
}

function headerLength(headers:OidcJwksHttpHeadersLike):number|undefined {
  const raw=headers.get('content-length');
  if(raw===null) return undefined;
  if(!/^\d+$/.test(raw)) throw new Error('PRODUCTION_OIDC_JWKS_CONTENT_LENGTH_INVALID');
  return Number(raw);
}

function parseJwks(text:string,maxKeys:number):ReadonlyMap<string,OidcJsonWebKey> {
  let parsed:unknown;
  try { parsed=JSON.parse(text); } catch { throw new Error('PRODUCTION_OIDC_JWKS_JSON_INVALID'); }
  if(parsed===null||typeof parsed!=='object'||Array.isArray(parsed)) throw new Error('PRODUCTION_OIDC_JWKS_OBJECT_REQUIRED');
  const keys=(parsed as Record<string,unknown>).keys;
  if(!Array.isArray(keys)||keys.length<1||keys.length>maxKeys) throw new Error('PRODUCTION_OIDC_JWKS_KEY_COUNT_INVALID');
  const map=new Map<string,OidcJsonWebKey>();
  for(const candidate of keys){
    if(candidate===null||typeof candidate!=='object'||Array.isArray(candidate)) throw new Error('PRODUCTION_OIDC_JWK_OBJECT_REQUIRED');
    const jwk=candidate as Record<string,unknown>;
    if(typeof jwk.kid!=='string'||!KID.test(jwk.kid)) throw new Error('PRODUCTION_OIDC_JWK_KID_REQUIRED');
    if(map.has(jwk.kid)) throw new Error('PRODUCTION_OIDC_JWK_DUPLICATE_KID');
    if(typeof jwk.kty!=='string'||!jwk.kty) throw new Error('PRODUCTION_OIDC_JWK_KTY_REQUIRED');
    map.set(jwk.kid,Object.freeze({...jwk}));
  }
  return map;
}

type CachedJwks=Readonly<{keys:ReadonlyMap<string,OidcJsonWebKey>;fetchedAtMs:number;expiresAtMs:number}>;

export class HttpsCachedOidcJwksResolver implements OidcJwksResolver {
  private cache:CachedJwks|undefined;
  private inflight:Promise<CachedJwks>|undefined;
  constructor(
    private readonly jwksUri:string,
    private readonly policy:ProductionOidcJwksPolicy,
    private readonly fetcher:OidcJwksFetchLike=defaultFetch(),
    private readonly now:()=>number=()=>Date.now()
  ){
    strictHttpsUrl(jwksUri,'AGROWAY_OIDC_JWKS_URI');
  }

  private async fetchFresh():Promise<CachedJwks> {
    if(this.inflight) return this.inflight;
    this.inflight=(async()=>{
      const controller=new AbortController();
      let timer:ReturnType<typeof setTimeout>|undefined;
      try {
        const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('PRODUCTION_OIDC_JWKS_TIMEOUT'));},this.policy.timeoutMs);});
        const request=this.fetcher(this.jwksUri,{method:'GET',headers:Object.freeze({accept:'application/jwk-set+json, application/json'}),signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store'});
        const response=await Promise.race([request,timeout]);
        if(!response.ok) throw new Error(`PRODUCTION_OIDC_JWKS_HTTP_STATUS_${response.status}`);
        const contentType=(response.headers.get('content-type')||'').toLowerCase();
        if(contentType&&!contentType.includes('json')) throw new Error('PRODUCTION_OIDC_JWKS_CONTENT_TYPE_INVALID');
        const length=headerLength(response.headers);
        if(length!==undefined&&length>this.policy.maxResponseBytes) throw new Error('PRODUCTION_OIDC_JWKS_RESPONSE_TOO_LARGE');
        const text=await response.text();
        if(new TextEncoder().encode(text).byteLength>this.policy.maxResponseBytes) throw new Error('PRODUCTION_OIDC_JWKS_RESPONSE_TOO_LARGE');
        const keys=parseJwks(text,this.policy.maxKeys);
        const fetchedAtMs=this.now();
        const next:CachedJwks=Object.freeze({keys,fetchedAtMs,expiresAtMs:fetchedAtMs+this.policy.cacheTtlMs});
        this.cache=next;
        return next;
      } finally {
        if(timer!==undefined) clearTimeout(timer);
        this.inflight=undefined;
      }
    })();
    return this.inflight;
  }

  async preflight():Promise<{keyCount:number;fetchedAt:string;expiresAt:string}> {
    const entry=await this.fetchFresh();
    return Object.freeze({keyCount:entry.keys.size,fetchedAt:new Date(entry.fetchedAtMs).toISOString(),expiresAt:new Date(entry.expiresAtMs).toISOString()});
  }

  async resolve(jwksUri:string,kid:string):Promise<OidcJsonWebKey|undefined> {
    if(jwksUri!==this.jwksUri) throw new Error('PRODUCTION_OIDC_JWKS_URI_SCOPE_MISMATCH');
    if(!KID.test(kid)) throw new Error('PRODUCTION_OIDC_JWK_KID_INVALID');
    const now=this.now();
    if(this.cache&&now<this.cache.expiresAtMs){
      const hit=this.cache.keys.get(kid);
      if(hit) return hit;
      const refreshed=await this.fetchFresh();
      return refreshed.keys.get(kid);
    }
    const fresh=await this.fetchFresh();
    return fresh.keys.get(kid);
  }

  clear():void { this.cache=undefined; }
}

export interface ProductionOidcWiring {
  readonly configuration:ProductionOidcConfiguration;
  readonly diagnostics:ProductionOidcDiagnostics;
  readonly connectivityCertified:boolean;
  verifyConnectivity():Promise<ProductionOidcConnectivityEvidence>;
  verifySession(input:ProductionOidcSessionVerificationInput):Promise<VerifiedOidcSessionResult>;
}

export function createProductionOidcWiring(env:ProductionOidcEnvironment,fetcher?:OidcJwksFetchLike,now:()=>number=()=>Date.now()):ProductionOidcWiring {
  const configuration=resolveProductionOidcConfiguration(env);
  const diagnostics=productionOidcDiagnostics(configuration);
  const resolver=new HttpsCachedOidcJwksResolver(configuration.provider.jwksUri,configuration.jwks,fetcher??defaultFetch(),now);
  let evidence:ProductionOidcConnectivityEvidence|undefined;
  return Object.freeze({
    configuration,diagnostics,
    get connectivityCertified(){return evidence!==undefined;},
    async verifyConnectivity(){
      const probe=await resolver.preflight();
      evidence=Object.freeze({state:'JWKS_CONNECTED_READ_ONLY_PROBE',issuer:configuration.provider.issuer,jwksUri:configuration.provider.jwksUri,keyCount:probe.keyCount,fetchedAt:probe.fetchedAt,expiresAt:probe.expiresAt,realTokenVerified:false,canonicalMutated:false,executionState:'NOT_EXECUTED'});
      return evidence;
    },
    async verifySession(input){
      if(!evidence) throw new Error('PRODUCTION_OIDC_CONNECTIVITY_CERTIFICATION_REQUIRED');
      return verifyOidcProductionSession({idToken:input.idToken,expectedNonce:input.expectedNonce,requestedAt:input.requestedAt,provider:configuration.provider,jwks:resolver});
    }
  });
}
