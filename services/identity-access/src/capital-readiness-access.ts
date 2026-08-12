import type {Membership,Permission,Role} from '@agroway/identity-contracts';

export const CAPITAL_READINESS_PERMISSIONS=Object.freeze({
  READ:'invest:read',
  INTAKE:'invest:readiness:intake',
  OPERATE:'invest:readiness:operate',
  REVIEW:'invest:readiness:review',
  FINALIZE:'invest:readiness:finalize',
  REMEDIATE:'invest:readiness:remediate',
  EVIDENCE_SUBMIT:'invest:readiness:evidence:submit',
  EVIDENCE_REVIEW:'invest:readiness:evidence:review',
  WAIVE:'invest:readiness:waive',
  REASSESS:'invest:readiness:reassess',
  WITHDRAW:'invest:readiness:withdraw',
} as const);

export type CapitalReadinessPermission=typeof CAPITAL_READINESS_PERMISSIONS[keyof typeof CAPITAL_READINESS_PERMISSIONS];

const ALL=Object.freeze(Object.values(CAPITAL_READINESS_PERMISSIONS));
const ROLE_CEILING:Readonly<Record<Role,readonly CapitalReadinessPermission[]>>={
  OWNER:ALL,
  ADMIN:ALL,
  AGRONOMIST:Object.freeze([
    CAPITAL_READINESS_PERMISSIONS.READ,
    CAPITAL_READINESS_PERMISSIONS.OPERATE,
    CAPITAL_READINESS_PERMISSIONS.REMEDIATE,
    CAPITAL_READINESS_PERMISSIONS.EVIDENCE_SUBMIT,
    CAPITAL_READINESS_PERMISSIONS.EVIDENCE_REVIEW,
  ]),
  OPERATOR:Object.freeze([]),
  VIEWER:Object.freeze([]),
  INVESTOR:Object.freeze([CAPITAL_READINESS_PERMISSIONS.READ]),
};
const KNOWN_PERMISSIONS=new Set<string>(ALL);
const KNOWN_ROLES=new Set<string>(Object.keys(ROLE_CEILING));

function unique<T>(values:readonly T[]):readonly T[]{return Object.freeze([...new Set(values)]);}
function assertKnownPermission(permission:string):asserts permission is CapitalReadinessPermission{
  if(!KNOWN_PERMISSIONS.has(permission))throw new Error('CAPITAL_READINESS_PERMISSION_UNKNOWN');
}
function assertRoleSet(roles:readonly Role[]):void{
  if(!roles.length)throw new Error('CAPITAL_READINESS_ROLE_REQUIRED');
  if(roles.some(role=>!KNOWN_ROLES.has(role)))throw new Error('CAPITAL_READINESS_ROLE_UNKNOWN');
  if(new Set(roles).size!==roles.length)throw new Error('CAPITAL_READINESS_ROLE_DUPLICATE');
}
function roleCeiling(roles:readonly Role[]):Set<CapitalReadinessPermission>{
  assertRoleSet(roles);
  return new Set(roles.flatMap(role=>ROLE_CEILING[role]));
}

export function effectiveCapitalReadinessPermissions(membership:Membership):readonly CapitalReadinessPermission[]{
  if(!membership.active)return Object.freeze([]);
  const ceiling=roleCeiling(membership.roles);
  const granted=unique(membership.grantedPermissions.filter(permission=>KNOWN_PERMISSIONS.has(permission)) as CapitalReadinessPermission[]);
  return Object.freeze(granted.filter(permission=>ceiling.has(permission)).sort());
}

export function requireCapitalReadinessPermission(
  membership:Membership,
  check:Readonly<{tenantId:string;actorId:string;permission:CapitalReadinessPermission}>,
):void{
  if(membership.tenantId!==check.tenantId||membership.actorId!==check.actorId)throw new Error('MEMBERSHIP_SCOPE_MISMATCH');
  if(!membership.active)throw new Error('MEMBERSHIP_INACTIVE');
  assertKnownPermission(check.permission);
  if(!effectiveCapitalReadinessPermissions(membership).includes(check.permission))throw new Error('PERMISSION_DENIED');
}

export interface MembershipPermissionAuthorizer {
  tenantId:string;
  actorId:string;
  require(permission:Permission):void;
}

/**
 * Request-scoped immutable authorization snapshot. The caller may later mutate
 * its original membership object; that must not change authority already bound
 * to the authenticated request.
 */
export function createMembershipPermissionAuthorizer(membership:Membership):MembershipPermissionAuthorizer{
  assertRoleSet(membership.roles);
  const snapshot:Membership=Object.freeze({
    tenantId:membership.tenantId,
    actorId:membership.actorId,
    roles:Object.freeze([...membership.roles]),
    grantedPermissions:Object.freeze([...membership.grantedPermissions]),
    active:membership.active,
  });
  return Object.freeze({
    tenantId:snapshot.tenantId,
    actorId:snapshot.actorId,
    require(permission:Permission):void{
      if(!KNOWN_PERMISSIONS.has(permission))throw new Error('PERMISSION_DENIED');
      requireCapitalReadinessPermission(snapshot,{
        tenantId:snapshot.tenantId,
        actorId:snapshot.actorId,
        permission:permission as CapitalReadinessPermission,
      });
    },
  });
}

export const CAPITAL_READINESS_ACCESS_POLICY=Object.freeze({
  roleCeiling:ROLE_CEILING,
  defaultPermissionGrant:false,
  investorReadOnly:true,
  evidenceSubmitSeparateFromRemediate:true,
  evidenceReviewSeparateFromSubmit:true,
  evidenceReviewSeparateFromRemediate:true,
  submitterMayNotReviewSameReceipt:true,
  agronomistCanFinalize:false,
  agronomistCanWaive:false,
  operatorReadinessAuthority:false,
  viewerReadinessAuthority:false,
});
