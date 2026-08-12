import { generateKeyPairSync, sign } from 'node:crypto';import { createRequire } from 'node:module';import path from 'node:path';import { pathToFileURL } from 'node:url';
const target=process.argv[2]||'.tmp/control-alpha11/services/identity-access/src/index.js';let mod;try{mod=createRequire(import.meta.url)(path.resolve(target))}catch{mod=await import(pathToFileURL(path.resolve(target)).href)}const {verifyOidcProductionSession,authorizeProductionOperation}=mod;if(typeof verifyOidcProductionSession!=='function')throw new Error('OIDC_ADAPTER_EXPORT_MISSING');
const NOW='2026-08-12T06:20:00.000Z',NOW_S=Math.floor(Date.parse(NOW)/1000),ISS='https://idp.example.test/greenatics',JWKS='https://idp.example.test/greenatics/jwks',AUD='agroway-control',NONCE='nonce-7c3b6e9c5d';
const rsa=generateKeyPairSync('rsa',{modulusLength:2048});const ec=generateKeyPairSync('ec',{namedCurve:'prime256v1'});const rsaJwk={...rsa.publicKey.export({format:'jwk'}),kid:'rsa-1',use:'sig',alg:'RS256',key_ops:['verify']};const ecJwk={...ec.publicKey.export({format:'jwk'}),kid:'ec-1',use:'sig',alg:'ES256',key_ops:['verify']};
const provider=()=>({issuer:ISS,audience:AUD,jwksUri:JWKS,tenantClaim:'tenant_id',sessionIdClaim:'sid',allowedAlgorithms:['RS256','ES256'],acrAssurance:{'urn:agroway:aal1':'AAL1','urn:agroway:aal2':'AAL2','urn:agroway:aal3':'AAL3'},mfaAmrValues:['mfa','otp','hwk'],clockSkewSeconds:30,maxTokenAgeSeconds:600});
const payload=()=>({iss:ISS,aud:AUD,sub:'actor-human-1',sid:'provider-session-001',tenant_id:'tenant-greenatics',nonce:NONCE,iat:NOW_S-30,nbf:NOW_S-35,exp:NOW_S+270,acr:'urn:agroway:aal2',amr:['pwd','mfa']});
const b64=v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url');
function mint(alg='RS256',claims=payload(),headerExtra={}){const kid=alg==='RS256'?'rsa-1':'ec-1',priv=alg==='RS256'?rsa.privateKey:ec.privateKey;const h=b64({typ:'JWT',alg,kid,...headerExtra}),p=b64(claims),input=`${h}.${p}`;const sig=alg==='RS256'?sign('RSA-SHA256',Buffer.from(input),priv):sign('sha256',Buffer.from(input),{key:priv,dsaEncoding:'ieee-p1363'});return `${input}.${sig.toString('base64url')}`}
const keys=new Map([['rsa-1',rsaJwk],['ec-1',ecJwk]]);const resolver=(map=keys)=>({calls:[],async resolve(uri,kid){this.calls.push([uri,kid]);return map.get(kid)}});
const input=(token=mint(),over={})=>({idToken:token,expectedNonce:NONCE,requestedAt:NOW,provider:provider(),jwks:resolver(),...over});
const results=[];const pass=(n,d='')=>{results.push({name:n,pass:true,detail:d});console.log(`PASS ${n}${d?` :: ${d}`:''}`)};const fail=(n,d='')=>{results.push({name:n,pass:false,detail:d});console.error(`FAIL ${n}${d?` :: ${d}`:''}`)};
async function allow(name,i,verify=x=>x.session.providerAttested&&x.session.authenticated){try{const r=await verifyOidcProductionSession(i);verify(r)?pass(name,`${r.algorithm}/${r.assurance}`):fail(name,JSON.stringify(r))}catch(e){fail(name,e.message)}}
async function deny(name,error,i){try{await verifyOidcProductionSession(i);fail(name,'unexpected-success')}catch(e){e.message===error?pass(name,error):fail(name,`${e.message} != ${error}`)}}
await allow('rs256-valid',input());await allow('es256-valid',input(mint('ES256')),r=>r.algorithm==='ES256'&&r.session.mfaVerified===true);await allow('multiple-audience-with-azp',input(mint('RS256',{...payload(),aud:[AUD,'secondary-api'],azp:AUD})));
{const r=await verifyOidcProductionSession(input());const digest1=r.session.sessionId,digest2=(await verifyOidcProductionSession(input())).session.sessionId;digest1===digest2&&digest1.startsWith('oidc:')?pass('deterministic-local-session-id'):fail('deterministic-local-session-id')}
{const r=await verifyOidcProductionSession(input());const operation={operationId:'op-oidc-chain-001',targetTenantId:'tenant-greenatics',targetProjectId:'inv-yar-001',requiredPermission:'finance:update',risk:'STANDARD',proposalDigestSha256:'a'.repeat(64),authorizationContextDigestSha256:'b'.repeat(64),idempotencyKey:'oidc:chain:operation:0001'};const approval={approvalId:'approval-oidc-001',actorId:'approver-2',actorType:'HUMAN',tenantId:'tenant-greenatics',projectId:'inv-yar-001',state:'APPROVED',proposalDigestSha256:'a'.repeat(64),authorizationContextDigestSha256:'b'.repeat(64),approvedAt:'2026-08-12T06:19:00.000Z'};const decision=authorizeProductionOperation({environment:'PRODUCTION',tenantId:'tenant-greenatics',projectId:'inv-yar-001',actorId:'actor-human-1',requestedAt:NOW,membership:{tenantId:'tenant-greenatics',actorId:'actor-human-1',roles:['ADMIN'],grantedPermissions:['finance:update'],active:true},session:r.session,operation,approvals:[approval]});decision.state==='AUTHORIZED_FOR_ADAPTER'&&decision.executionState==='NOT_EXECUTED'?pass('verified-session-feeds-alpha9-authorization'):fail('verified-session-feeds-alpha9-authorization')}
await deny('compact-three-parts-required','OIDC_JWT_COMPACT_INVALID',input('abc.def'));
{const h=b64({typ:'JWT',alg:'none',kid:'none'}),p=b64(payload());await deny('alg-none-forbidden','OIDC_JWT_ALGORITHM_NOT_ALLOWED',input(`${h}.${p}.AA`))}
await deny('unknown-kid','OIDC_JWK_NOT_FOUND',input(mint('RS256',payload(),{kid:'unknown'})));
{const token=mint();const [h,p]=token.split('.');await deny('signature-tamper','OIDC_JWT_SIGNATURE_REJECTED',input(`${h}.${p}.${Buffer.alloc(256,7).toString('base64url')}`))}
await deny('issuer-mismatch','OIDC_ISSUER_MISMATCH',input(mint('RS256',{...payload(),iss:'https://evil.example.test'})));
await deny('audience-mismatch','OIDC_AUDIENCE_MISMATCH',input(mint('RS256',{...payload(),aud:'wrong-api'})));
await deny('multi-audience-needs-azp','OIDC_AUDIENCE_MISMATCH',input(mint('RS256',{...payload(),aud:[AUD,'secondary-api']})));
await deny('nonce-bound','OIDC_NONCE_MISMATCH',input(mint('RS256',{...payload(),nonce:'other-nonce'})));
await deny('expired-token','OIDC_TOKEN_EXPIRED',input(mint('RS256',{...payload(),iat:NOW_S-180,nbf:NOW_S-185,exp:NOW_S-31})));
await deny('future-nbf','OIDC_TOKEN_NOT_YET_VALID',input(mint('RS256',{...payload(),nbf:NOW_S+31})));
await deny('future-iat','OIDC_TOKEN_ISSUED_IN_FUTURE',input(mint('RS256',{...payload(),iat:NOW_S+31,exp:NOW_S+300})));
await deny('token-too-old','OIDC_TOKEN_TOO_OLD',input(mint('RS256',{...payload(),iat:NOW_S-700,nbf:NOW_S-700,exp:NOW_S+200})));
await deny('subject-required','OIDC_SUBJECT_REQUIRED',input(mint('RS256',{...payload(),sub:''})));
await deny('session-claim-required','OIDC_SESSION_CLAIM_REQUIRED',input(mint('RS256',{...payload(),sid:''})));
await deny('tenant-claim-required','OIDC_TENANT_CLAIM_REQUIRED',input(mint('RS256',{...payload(),tenant_id:''})));
await deny('acr-mapped','OIDC_ACR_UNMAPPED',input(mint('RS256',{...payload(),acr:'urn:unknown'})));
await deny('amr-required','OIDC_AMR_REQUIRED',input(mint('RS256',{...payload(),amr:'mfa'})));
await deny('aal2-minimum','OIDC_AAL2_MFA_REQUIRED',input(mint('RS256',{...payload(),acr:'urn:agroway:aal1'})));
await deny('mfa-marker-required','OIDC_AAL2_MFA_REQUIRED',input(mint('RS256',{...payload(),amr:['pwd']})));
{const bad=new Map(keys);bad.set('rsa-1',{...rsaJwk,use:'enc'});await deny('jwk-signature-use','OIDC_JWK_NOT_FOR_SIGNATURE',input(mint(),{jwks:resolver(bad)}))}
{const bad=new Map(keys);bad.set('rsa-1',{...rsaJwk,key_ops:['sign']});await deny('jwk-verify-key-op','OIDC_JWK_VERIFY_NOT_ALLOWED',input(mint(),{jwks:resolver(bad)}))}
{const p=provider();p.issuer='http://idp.example.test';await deny('https-issuer-required','OIDC_HTTPS_CONFIGURATION_REQUIRED',input(mint(),{provider:p}))}
{const p=provider();p.maxTokenAgeSeconds=7200;await deny('max-token-age-bounded','OIDC_TOKEN_AGE_CONFIGURATION_INVALID',input(mint(),{provider:p}))}
await deny('requested-at-valid','OIDC_REQUESTED_AT_INVALID',input(mint(),{requestedAt:'not-a-date'}));
const failed=results.filter(x=>!x.pass);console.log(`${failed.length?'FAIL':'PASS'}_CONTROL_OIDC_SESSION_RUNTIME ${results.length-failed.length}/${results.length}`);if(failed.length)process.exit(1);
