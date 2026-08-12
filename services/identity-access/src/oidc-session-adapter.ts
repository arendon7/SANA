import { createHash, createPublicKey, verify } from 'node:crypto';
import type { ProductionSession, ProductionSessionAssurance } from './index.js';

export type OidcSigningAlgorithm='RS256'|'ES256';
export type OidcJsonWebKey=Readonly<Record<string,unknown>>;

export type OidcProviderConfiguration=Readonly<{
  issuer:string;
  audience:string;
  jwksUri:string;
  tenantClaim:string;
  sessionIdClaim:string;
  allowedAlgorithms:readonly OidcSigningAlgorithm[];
  acrAssurance:Readonly<Record<string,ProductionSessionAssurance>>;
  mfaAmrValues:readonly string[];
  clockSkewSeconds:number;
  maxTokenAgeSeconds:number;
}>;

export interface OidcJwksResolver {
  resolve(jwksUri:string,kid:string):Promise<OidcJsonWebKey|undefined>;
}

export type VerifyOidcProductionSessionInput=Readonly<{
  idToken:string;
  expectedNonce:string;
  requestedAt:string;
  provider:OidcProviderConfiguration;
  jwks:OidcJwksResolver;
}>;

export type VerifiedOidcSessionResult=Readonly<{
  session:ProductionSession;
  issuer:string;
  subject:string;
  tenantId:string;
  keyId:string;
  algorithm:OidcSigningAlgorithm;
  assurance:ProductionSessionAssurance;
  mfaVerified:true;
  tokenDigestSha256:string;
}>;

const BASE64URL=/^[A-Za-z0-9_-]+$/;
const HTTPS_ERROR='OIDC_HTTPS_CONFIGURATION_REQUIRED';

function requiredString(value:unknown,error:string):string {
  if(typeof value!=='string'||!value.trim()) throw new Error(error);
  return value;
}

function numericDate(value:unknown,error:string):number {
  if(typeof value!=='number'||!Number.isFinite(value)||!Number.isInteger(value)||value<0) throw new Error(error);
  return value;
}

function parseIso(value:string):number {
  const n=Date.parse(value);
  if(!Number.isFinite(n)) throw new Error('OIDC_REQUESTED_AT_INVALID');
  return n;
}

function requireHttpsUrl(value:string):void {
  let url:URL;
  try { url=new URL(value); } catch { throw new Error(HTTPS_ERROR); }
  if(url.protocol!=='https:'||url.username||url.password||url.hash) throw new Error(HTTPS_ERROR);
}

function decodeBase64UrlBytes(segment:string,error:string):Uint8Array {
  if(!segment||!BASE64URL.test(segment)) throw new Error(error);
  const base64=segment.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-segment.length%4)%4);
  let binary:string;
  try { binary=atob(base64); } catch { throw new Error(error); }
  const out=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) out[i]=binary.charCodeAt(i);
  return out;
}

function decodeJson(segment:string,error:string):Record<string,unknown> {
  const bytes=decodeBase64UrlBytes(segment,error);
  let parsed:unknown;
  try { parsed=JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error(error); }
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) throw new Error(error);
  return parsed as Record<string,unknown>;
}

function audienceMatches(claim:unknown,expected:string,azp:unknown):boolean {
  if(typeof claim==='string') return claim===expected && (azp===undefined||azp===expected);
  if(Array.isArray(claim)&&claim.length>0&&claim.every(x=>typeof x==='string')) {
    if(!claim.includes(expected)) return false;
    if(claim.length>1) return azp===expected;
    return azp===undefined||azp===expected;
  }
  return false;
}

function validateJwk(jwk:OidcJsonWebKey,alg:OidcSigningAlgorithm):void {
  if(jwk.use!==undefined&&jwk.use!=='sig') throw new Error('OIDC_JWK_NOT_FOR_SIGNATURE');
  if(jwk.alg!==undefined&&jwk.alg!==alg) throw new Error('OIDC_JWK_ALGORITHM_MISMATCH');
  if(jwk.key_ops!==undefined&&(!Array.isArray(jwk.key_ops)||!jwk.key_ops.includes('verify'))) throw new Error('OIDC_JWK_VERIFY_NOT_ALLOWED');
  if(alg==='RS256'&&jwk.kty!=='RSA') throw new Error('OIDC_JWK_KEY_TYPE_MISMATCH');
  if(alg==='ES256'&&(jwk.kty!=='EC'||jwk.crv!=='P-256')) throw new Error('OIDC_JWK_KEY_TYPE_MISMATCH');
}

function verifySignature(alg:OidcSigningAlgorithm,jwk:OidcJsonWebKey,signingInput:string,signature:Uint8Array):boolean {
  const key=createPublicKey({key:jwk,format:'jwk'});
  const data=new TextEncoder().encode(signingInput);
  if(alg==='RS256') return verify('RSA-SHA256',data,key,signature);
  if(signature.byteLength!==64) return false;
  return verify('sha256',data,{key,dsaEncoding:'ieee-p1363'},signature);
}

function assuranceFromClaims(provider:OidcProviderConfiguration,payload:Record<string,unknown>):{assurance:ProductionSessionAssurance;mfaVerified:boolean} {
  const acr=requiredString(payload.acr,'OIDC_ACR_REQUIRED');
  const assurance=provider.acrAssurance[acr];
  if(!assurance) throw new Error('OIDC_ACR_UNMAPPED');
  const amr=payload.amr;
  if(!Array.isArray(amr)||!amr.every(x=>typeof x==='string')) throw new Error('OIDC_AMR_REQUIRED');
  const accepted=new Set(provider.mfaAmrValues);
  const mfaVerified=amr.some(x=>accepted.has(x));
  if(assurance==='AAL1'||!mfaVerified) throw new Error('OIDC_AAL2_MFA_REQUIRED');
  return {assurance,mfaVerified};
}

function validateConfiguration(provider:OidcProviderConfiguration):void {
  requireHttpsUrl(provider.issuer);
  requireHttpsUrl(provider.jwksUri);
  requiredString(provider.audience,'OIDC_AUDIENCE_CONFIGURATION_REQUIRED');
  requiredString(provider.tenantClaim,'OIDC_TENANT_CLAIM_CONFIGURATION_REQUIRED');
  requiredString(provider.sessionIdClaim,'OIDC_SESSION_CLAIM_CONFIGURATION_REQUIRED');
  if(!provider.allowedAlgorithms.length||provider.allowedAlgorithms.some(x=>x!=='RS256'&&x!=='ES256')) throw new Error('OIDC_ALGORITHM_CONFIGURATION_INVALID');
  if(!provider.mfaAmrValues.length||provider.mfaAmrValues.some(x=>!x.trim())) throw new Error('OIDC_MFA_MAPPING_CONFIGURATION_INVALID');
  if(!Number.isInteger(provider.clockSkewSeconds)||provider.clockSkewSeconds<0||provider.clockSkewSeconds>120) throw new Error('OIDC_CLOCK_SKEW_CONFIGURATION_INVALID');
  if(!Number.isInteger(provider.maxTokenAgeSeconds)||provider.maxTokenAgeSeconds<=0||provider.maxTokenAgeSeconds>3600) throw new Error('OIDC_TOKEN_AGE_CONFIGURATION_INVALID');
}

export async function verifyOidcProductionSession(input:VerifyOidcProductionSessionInput):Promise<VerifiedOidcSessionResult> {
  validateConfiguration(input.provider);
  requiredString(input.expectedNonce,'OIDC_EXPECTED_NONCE_REQUIRED');
  const parts=input.idToken.split('.');
  if(parts.length!==3) throw new Error('OIDC_JWT_COMPACT_INVALID');
  const [encodedHeader,encodedPayload,encodedSignature]=parts;
  const header=decodeJson(encodedHeader,'OIDC_JWT_HEADER_INVALID');
  const payload=decodeJson(encodedPayload,'OIDC_JWT_PAYLOAD_INVALID');
  const alg=header.alg;
  if((alg!=='RS256'&&alg!=='ES256')||!input.provider.allowedAlgorithms.includes(alg)) throw new Error('OIDC_JWT_ALGORITHM_NOT_ALLOWED');
  if(header.typ!==undefined&&header.typ!=='JWT') throw new Error('OIDC_JWT_TYPE_INVALID');
  const kid=requiredString(header.kid,'OIDC_JWT_KID_REQUIRED');
  const signature=decodeBase64UrlBytes(encodedSignature,'OIDC_JWT_SIGNATURE_INVALID');
  const jwk=await input.jwks.resolve(input.provider.jwksUri,kid);
  if(!jwk) throw new Error('OIDC_JWK_NOT_FOUND');
  validateJwk(jwk,alg);
  if(!verifySignature(alg,jwk,`${encodedHeader}.${encodedPayload}`,signature)) throw new Error('OIDC_JWT_SIGNATURE_REJECTED');

  const issuer=requiredString(payload.iss,'OIDC_ISSUER_REQUIRED');
  if(issuer!==input.provider.issuer) throw new Error('OIDC_ISSUER_MISMATCH');
  if(!audienceMatches(payload.aud,input.provider.audience,payload.azp)) throw new Error('OIDC_AUDIENCE_MISMATCH');
  const subject=requiredString(payload.sub,'OIDC_SUBJECT_REQUIRED');
  const tenantId=requiredString(payload[input.provider.tenantClaim],'OIDC_TENANT_CLAIM_REQUIRED');
  const providerSessionId=requiredString(payload[input.provider.sessionIdClaim],'OIDC_SESSION_CLAIM_REQUIRED');
  if(payload.nonce!==input.expectedNonce) throw new Error('OIDC_NONCE_MISMATCH');

  const exp=numericDate(payload.exp,'OIDC_EXP_REQUIRED');
  const iat=numericDate(payload.iat,'OIDC_IAT_REQUIRED');
  const nbf=payload.nbf===undefined?undefined:numericDate(payload.nbf,'OIDC_NBF_INVALID');
  if(exp<=iat) throw new Error('OIDC_TOKEN_LIFETIME_INVALID');
  const requestedAtMs=parseIso(input.requestedAt);
  const requestedAtSec=Math.floor(requestedAtMs/1000);
  const skew=input.provider.clockSkewSeconds;
  if(requestedAtSec-skew>=exp) throw new Error('OIDC_TOKEN_EXPIRED');
  if(iat-skew>requestedAtSec) throw new Error('OIDC_TOKEN_ISSUED_IN_FUTURE');
  if(nbf!==undefined&&nbf-skew>requestedAtSec) throw new Error('OIDC_TOKEN_NOT_YET_VALID');
  if(requestedAtSec-iat>input.provider.maxTokenAgeSeconds+skew) throw new Error('OIDC_TOKEN_TOO_OLD');

  const {assurance,mfaVerified}=assuranceFromClaims(input.provider,payload);
  if(!mfaVerified) throw new Error('OIDC_AAL2_MFA_REQUIRED');
  const tokenDigestSha256=createHash('sha256').update(input.idToken).digest('hex');
  const sessionDigest=createHash('sha256').update(JSON.stringify([issuer,tenantId,subject,providerSessionId,iat])).digest('hex');
  const session:ProductionSession=Object.freeze({
    sessionId:`oidc:${sessionDigest}`,
    providerSessionId,
    provider:'OIDC',
    providerAttested:true,
    tenantId,
    actorId:subject,
    state:'ACTIVE',
    authenticated:true,
    assurance,
    mfaVerified:true,
    issuedAt:new Date(iat*1000).toISOString(),
    expiresAt:new Date(exp*1000).toISOString()
  });
  return Object.freeze({session,issuer,subject,tenantId,keyId:kid,algorithm:alg,assurance,mfaVerified:true,tokenDigestSha256});
}
