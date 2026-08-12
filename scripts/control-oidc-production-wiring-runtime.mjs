import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {generateKeyPairSync,sign} from 'node:crypto';
const target=process.argv[2];if(!target)throw new Error('COMPILED_IDENTITY_ACCESS_INDEX_REQUIRED');
const api=await import(pathToFileURL(path.resolve(target)).href);
const {createProductionOidcWiring,resolveProductionOidcConfiguration,productionOidcDiagnostics,HttpsCachedOidcJwksResolver}=api;
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=publicKey.export({format:'jwk'});jwk.kid='kid-alpha16';jwk.use='sig';jwk.alg='RS256';jwk.key_ops=['verify'];
const issuer='https://idp.alpha16.test/tenant';const jwksUri='https://idp.alpha16.test/.well-known/jwks.json';const audience='agroway-control';
const env={AGROWAY_OIDC_ISSUER:issuer,AGROWAY_OIDC_AUDIENCE:audience,AGROWAY_OIDC_JWKS_URI:jwksUri,AGROWAY_OIDC_TENANT_CLAIM:'tenant_id',AGROWAY_OIDC_SESSION_CLAIM:'sid',AGROWAY_OIDC_ALLOWED_ALGORITHMS:'RS256',AGROWAY_OIDC_AAL2_ACR_VALUES:'urn:alpha16:aal2',AGROWAY_OIDC_AAL3_ACR_VALUES:'urn:alpha16:aal3',AGROWAY_OIDC_MFA_AMR_VALUES:'mfa,otp',AGROWAY_OIDC_CLOCK_SKEW_SECONDS:'30',AGROWAY_OIDC_MAX_TOKEN_AGE_SECONDS:'900',AGROWAY_OIDC_JWKS_TIMEOUT_MS:'500',AGROWAY_OIDC_JWKS_CACHE_TTL_MS:'10000',AGROWAY_OIDC_JWKS_MAX_BYTES:'8192',AGROWAY_OIDC_JWKS_MAX_KEYS:'8'};
const nowIso='2026-08-12T19:10:00.000Z';const nowMs=Date.parse(nowIso);const nowSec=Math.floor(nowMs/1000);
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
function token({kid='kid-alpha16',nonce='nonce-alpha16',tenant='11111111-1111-4111-8111-111111111111',acr='urn:alpha16:aal2',amr=['pwd','mfa']}={}){const header={alg:'RS256',typ:'JWT',kid};const payload={iss:issuer,aud:audience,sub:'actor-alpha16',tenant_id:tenant,sid:'provider-session-alpha16',nonce,iat:nowSec-30,exp:nowSec+300,acr,amr};const signingInput=`${b64(header)}.${b64(payload)}`;const signature=sign('RSA-SHA256',Buffer.from(signingInput),privateKey).toString('base64url');return `${signingInput}.${signature}`;}
const headers=(type='application/jwk-set+json',length=null)=>({get(name){name=name.toLowerCase();if(name==='content-type')return type;if(name==='content-length')return length;return null}});
function jsonResponse(body,{status=200,type='application/jwk-set+json',length=null}={}){const text=typeof body==='string'?body:JSON.stringify(body);return{ok:status>=200&&status<300,status,headers:headers(type,length??String(Buffer.byteLength(text))),async text(){return text}}}
let passed=0;const check=(name,value)=>{assert.ok(value,name);passed++;console.log(`PASS ${name}`)};
const config=resolveProductionOidcConfiguration(env);check('config:version',config.version==='AGROWAY_OIDC_PRODUCTION_V1');check('config:issuer',config.provider.issuer===issuer);check('config:algorithms',config.provider.allowedAlgorithms.length===1&&config.provider.allowedAlgorithms[0]==='RS256');check('config:acr',config.provider.acrAssurance['urn:alpha16:aal2']==='AAL2'&&config.provider.acrAssurance['urn:alpha16:aal3']==='AAL3');check('config:mfa',config.provider.mfaAmrValues.includes('mfa'));check('config:bounded-policy',config.jwks.timeoutMs===500&&config.jwks.maxResponseBytes===8192&&config.jwks.maxKeys===8);
const diagnostics=productionOidcDiagnostics(config);check('diagnostics:no-secrets',diagnostics.secretsStoredInConfiguration===false&&diagnostics.browserTokenEndpointAllowed===false);check('diagnostics:hosts',diagnostics.issuerHost==='idp.alpha16.test'&&diagnostics.jwksHost==='idp.alpha16.test');
for(const [name,patch,error] of [
 ['missing-issuer',{AGROWAY_OIDC_ISSUER:undefined},/PRODUCTION_OIDC_ENV_REQUIRED:AGROWAY_OIDC_ISSUER/],
 ['http-issuer',{AGROWAY_OIDC_ISSUER:'http://idp.alpha16.test/tenant'},/PRODUCTION_OIDC_HTTPS_URL_INVALID:AGROWAY_OIDC_ISSUER/],
 ['loopback-jwks',{AGROWAY_OIDC_JWKS_URI:'https://127.0.0.1/jwks'},/PRODUCTION_OIDC_LOOPBACK_FORBIDDEN:AGROWAY_OIDC_JWKS_URI/],
 ['same-claims',{AGROWAY_OIDC_SESSION_CLAIM:'tenant_id'},/PRODUCTION_OIDC_CLAIMS_MUST_BE_DISTINCT/],
 ['bad-alg',{AGROWAY_OIDC_ALLOWED_ALGORITHMS:'none'},/PRODUCTION_OIDC_ALGORITHM_NOT_ALLOWED/],
 ['acr-overlap',{AGROWAY_OIDC_AAL3_ACR_VALUES:'urn:alpha16:aal2'},/PRODUCTION_OIDC_ACR_ASSURANCE_OVERLAP/],
 ['timeout-range',{AGROWAY_OIDC_JWKS_TIMEOUT_MS:'31'},/PRODUCTION_OIDC_ENV_INTEGER_OUT_OF_RANGE:AGROWAY_OIDC_JWKS_TIMEOUT_MS/]
]){assert.throws(()=>resolveProductionOidcConfiguration({...env,...patch}),error);check(`reject:${name}`,true)}
const calls=[];const fetcher=async(input,init)=>{calls.push({input,init});return jsonResponse({keys:[jwk]})};const wiring=createProductionOidcWiring(env,fetcher,()=>nowMs);
check('wiring:starts-uncertified',wiring.connectivityCertified===false);await assert.rejects(()=>wiring.verifySession({idToken:token(),expectedNonce:'nonce-alpha16',requestedAt:nowIso}),/PRODUCTION_OIDC_CONNECTIVITY_CERTIFICATION_REQUIRED/);check('wiring:session-before-probe-denied',true);
const evidence=await wiring.verifyConnectivity();check('wiring:preflight',evidence.state==='JWKS_CONNECTED_READ_ONLY_PROBE'&&evidence.keyCount===1&&evidence.realTokenVerified===false);check('wiring:no-execution',evidence.executionState==='NOT_EXECUTED'&&evidence.canonicalMutated===false);check('wiring:certified-after-probe',wiring.connectivityCertified===true);check('fetch:method-get',calls[0].init.method==='GET');check('fetch:redirect-error',calls[0].init.redirect==='error');check('fetch:no-credentials',calls[0].init.credentials==='omit');check('fetch:no-store',calls[0].init.cache==='no-store');
const verified=await wiring.verifySession({idToken:token(),expectedNonce:'nonce-alpha16',requestedAt:nowIso});check('session:verified',verified.session.state==='ACTIVE'&&verified.session.providerAttested===true&&verified.session.assurance==='AAL2');check('session:tenant',verified.tenantId==='11111111-1111-4111-8111-111111111111');check('session:mfa',verified.mfaVerified===true);check('cache:session-reuses-preflight-jwks',calls.length===1);
await assert.rejects(()=>wiring.verifySession({idToken:token({nonce:'other'}),expectedNonce:'nonce-alpha16',requestedAt:nowIso}),/OIDC_NONCE_MISMATCH/);check('session:nonce-bound',true);
await assert.rejects(()=>wiring.verifySession({idToken:token({acr:'urn:alpha16:unknown'}),expectedNonce:'nonce-alpha16',requestedAt:nowIso}),/OIDC_ACR_UNMAPPED/);check('session:acr-bound',true);
let rotatingCalls=0;const jwk2={...jwk,kid:'kid-alpha16-rotated'};const rotationFetcher=async()=>jsonResponse({keys:[rotatingCalls++===0?jwk:jwk2]});const resolver=new HttpsCachedOidcJwksResolver(jwksUri,config.jwks,rotationFetcher,()=>nowMs);await resolver.preflight();const rotated=await resolver.resolve(jwksUri,'kid-alpha16-rotated');check('rotation:missing-kid-refreshes',rotated?.kid==='kid-alpha16-rotated'&&rotatingCalls===2);await assert.rejects(()=>resolver.resolve('https://other.alpha16.test/jwks','kid-alpha16'),/PRODUCTION_OIDC_JWKS_URI_SCOPE_MISMATCH/);check('resolver:uri-bound',true);
let clock=nowMs;let expiryCalls=0;const expiryResolver=new HttpsCachedOidcJwksResolver(jwksUri,{...config.jwks,cacheTtlMs:1000},async()=>{expiryCalls++;return jsonResponse({keys:[jwk]})},()=>clock);await expiryResolver.resolve(jwksUri,'kid-alpha16');clock+=1500;await expiryResolver.resolve(jwksUri,'kid-alpha16');check('cache:expiry-refetches',expiryCalls===2);
for(const [name,fetch,error] of [
 ['http-status',async()=>jsonResponse({keys:[jwk]},{status:503}),/PRODUCTION_OIDC_JWKS_HTTP_STATUS_503/],
 ['content-type',async()=>jsonResponse({keys:[jwk]},{type:'text/html'}),/PRODUCTION_OIDC_JWKS_CONTENT_TYPE_INVALID/],
 ['oversize-header',async()=>jsonResponse({keys:[jwk]},{length:'99999'}),/PRODUCTION_OIDC_JWKS_RESPONSE_TOO_LARGE/],
 ['invalid-json',async()=>jsonResponse('{bad json'),/PRODUCTION_OIDC_JWKS_JSON_INVALID/],
 ['duplicate-kid',async()=>jsonResponse({keys:[jwk,{...jwk}]}),/PRODUCTION_OIDC_JWK_DUPLICATE_KID/],
 ['missing-kid',async()=>jsonResponse({keys:[{kty:'RSA'}]}),/PRODUCTION_OIDC_JWK_KID_REQUIRED/]
]){const r=new HttpsCachedOidcJwksResolver(jwksUri,config.jwks,fetch,()=>nowMs);await assert.rejects(()=>r.preflight(),error);check(`jwks:${name}`,true)}
const timeoutPolicy={...config.jwks,timeoutMs:250};const timeoutResolver=new HttpsCachedOidcJwksResolver(jwksUri,timeoutPolicy,async()=>await new Promise(()=>{}),()=>nowMs);const started=Date.now();await assert.rejects(()=>timeoutResolver.preflight(),/PRODUCTION_OIDC_JWKS_TIMEOUT/);check('jwks:timeout-bounded',Date.now()-started<2000);
let resolveConcurrent;const concurrentFetcher=async()=>await new Promise(resolve=>{resolveConcurrent=()=>resolve(jsonResponse({keys:[jwk]}))});const concurrentResolver=new HttpsCachedOidcJwksResolver(jwksUri,config.jwks,concurrentFetcher,()=>nowMs);const p1=concurrentResolver.preflight();const p2=concurrentResolver.preflight();await new Promise(resolve=>setImmediate(resolve));resolveConcurrent();const [c1,c2]=await Promise.all([p1,p2]);check('jwks:concurrent-fetch-coalesced',c1.keyCount===1&&c2.keyCount===1);
console.log(`PASS_CONTROL_OIDC_PRODUCTION_WIRING_RUNTIME ${passed}/${passed}`);
