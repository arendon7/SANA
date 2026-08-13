import {createMembershipPermissionAuthorizer,type MembershipPermissionAuthorizer} from './capital-readiness-access.js';
import {loadDurableMembership,type IdentitySqlExecutor} from './postgres-membership.js';

export type VerifiedProductionSessionScope=Readonly<{
  tenantId:string;
  actorId:string;
  authenticated:boolean;
  providerAttested:boolean;
  state:'ACTIVE'|'REVOKED';
  assurance:'AAL1'|'AAL2'|'AAL3';
  mfaVerified:boolean;
  issuedAt:string;
  expiresAt:string;
}>;

export type CapitalReadinessRequestContext=Readonly<{
  tenantId:string;
  actorId:string;
  authority:MembershipPermissionAuthorizer;
  identitySource:'VERIFIED_PRODUCTION_SESSION_PLUS_DURABLE_MEMBERSHIP';
}>;

function ms(value:string,code:string):number{const parsed=Date.parse(value);if(!Number.isFinite(parsed))throw new Error(code);return parsed;}

export async function createCapitalReadinessRequestContext(
  executor:IdentitySqlExecutor,
  session:VerifiedProductionSessionScope,
  requestedAt:string,
):Promise<CapitalReadinessRequestContext>{
  if(!session.authenticated||session.state!=='ACTIVE')throw new Error('CAPITAL_REQUEST_SESSION_INACTIVE');
  if(!session.providerAttested)throw new Error('CAPITAL_REQUEST_IDP_ATTESTATION_REQUIRED');
  if(session.assurance==='AAL1'||!session.mfaVerified)throw new Error('CAPITAL_REQUEST_AAL2_MFA_REQUIRED');
  const now=ms(requestedAt,'CAPITAL_REQUEST_TIME_INVALID');
  const issued=ms(session.issuedAt,'CAPITAL_REQUEST_SESSION_ISSUED_AT_INVALID');
  const expires=ms(session.expiresAt,'CAPITAL_REQUEST_SESSION_EXPIRES_AT_INVALID');
  if(now<issued)throw new Error('CAPITAL_REQUEST_SESSION_NOT_YET_VALID');
  if(now>=expires)throw new Error('CAPITAL_REQUEST_SESSION_EXPIRED');
  if(!session.tenantId.trim()||!session.actorId.trim())throw new Error('CAPITAL_REQUEST_SESSION_SCOPE_REQUIRED');
  const membership=await loadDurableMembership(executor,session.tenantId,session.actorId);
  if(membership.tenantId!==session.tenantId||membership.actorId!==session.actorId)throw new Error('CAPITAL_REQUEST_MEMBERSHIP_SCOPE_MISMATCH');
  if(!membership.active)throw new Error('CAPITAL_REQUEST_MEMBERSHIP_INACTIVE');
  const authority=createMembershipPermissionAuthorizer(membership);
  return Object.freeze({
    tenantId:session.tenantId,
    actorId:session.actorId,
    authority,
    identitySource:'VERIFIED_PRODUCTION_SESSION_PLUS_DURABLE_MEMBERSHIP',
  });
}

export const CAPITAL_READINESS_REQUEST_CONTEXT_BOUNDARY=Object.freeze({
  verifiedSessionRequired:true,
  durableMembershipRequired:true,
  requestScopedAuthoritySnapshot:true,
  callerSuppliedActorId:false,
  callerSuppliedTenantId:false,
  callerSuppliedRoles:false,
  callerSuppliedPermissions:false,
  browserMutationEnabled:false,
});
