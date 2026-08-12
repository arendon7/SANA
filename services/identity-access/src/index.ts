import type {AddOn,DataExportFormat,DataExportRequest,DataExportScope,EntitlementDecision,Membership,Permission,PlanTier,ProductCapability,Role,TenantInvitation,TenantSubscription} from '@agroway/identity-contracts';
export type PermissionCheck=Readonly<{tenantId:string;actorId:string;permission:Permission}>;
const actions=(domain:string,verbs:readonly string[])=>verbs.map(v=>`${domain}:${v}`);
const DOMAINS=['identity','land','agronomy','finance','supply','field','monitoring','harvest','impact','traceability','product','export'] as const;
const allStandardPermissions=DOMAINS.flatMap(d=>actions(d,['read','create','update','delete','approve','execute','manage','export','admin']));

export const CAPITAL_READINESS_PERMISSIONS=Object.freeze({
  READ:'invest:read',
  INTAKE:'invest:readiness:intake',
  OPERATE:'invest:readiness:operate',
  REVIEW:'invest:readiness:review',
  FINALIZE:'invest:readiness:finalize',
  REMEDIATE:'invest:readiness:remediate',
  WAIVE:'invest:readiness:waive',
  REASSESS:'invest:readiness:reassess',
  WITHDRAW:'invest:readiness:withdraw',
} as const);
const ALL_CAPITAL_READINESS_PERMISSIONS=Object.freeze(Object.values(CAPITAL_READINESS_PERMISSIONS));

const ROLE_PERMISSION_CEILING:Readonly<Record<Role,readonly Permission[]>>={
  OWNER:[...allStandardPermissions,'audit:read',...ALL_CAPITAL_READINESS_PERMISSIONS],
  ADMIN:[...allStandardPermissions.filter(p=>!p.endsWith(':delete')),'audit:read',...ALL_CAPITAL_READINESS_PERMISSIONS],
  AGRONOMIST:[
    ...actions('land',['read']),
    ...actions('agronomy',['read','create','update','approve','execute','export']),
    ...actions('field',['read','create','update','execute','export']),
    ...actions('monitoring',['read','create','update','approve','execute','export']),
    ...actions('supply',['read']),
    ...actions('harvest',['read']),
    ...actions('traceability',['read']),
    ...actions('product',['read']),
    CAPITAL_READINESS_PERMISSIONS.READ,
    CAPITAL_READINESS_PERMISSIONS.OPERATE,
    CAPITAL_READINESS_PERMISSIONS.REMEDIATE,
  ],
  OPERATOR:[...actions('land',['read']),...actions('agronomy',['read']),...actions('field',['read','create','update','execute']),...actions('monitoring',['read','create']),...actions('supply',['read']),...actions('harvest',['read','create'])],
  VIEWER:[...DOMAINS.flatMap(d=>actions(d,['read'])).filter(p=>!p.startsWith('identity:'))],
  INVESTOR:[...actions('finance',['read']),...actions('impact',['read','export']),...actions('traceability',['read']),...actions('harvest',['read']),...actions('land',['read']),CAPITAL_READINESS_PERMISSIONS.READ],
};
const PLAN_CAPABILITIES:Readonly<Record<PlanTier,readonly ProductCapability[]>>={CAMPO:['FIELD_CORE'],PRO:['FIELD_CORE','ADVANCED_AGRONOMY'],NETWORK:['FIELD_CORE','ADVANCED_AGRONOMY','MULTI_FARM_CONTROL'],ENTERPRISE:['FIELD_CORE','ADVANCED_AGRONOMY','MULTI_FARM_CONTROL','ENTERPRISE_ADMIN']};
const ADD_ON_CAPABILITIES:Readonly<Record<AddOn,ProductCapability>>={PASSPORT:'TRACEABILITY_PASSPORT',SENSORS:'SENSOR_INGESTION',SANA_INTELLIGENCE:'AI_COPILOT',SANA_IMPACT:'IMPACT_ACCOUNTING'};
function isoMs(value:string):number{const n=Date.parse(value);if(!Number.isFinite(n))throw new Error('INVALID_ISO_DATETIME');return n}
function unique<T>(items:readonly T[]):T[]{return [...new Set(items)]}
function roleCeiling(roles:readonly Role[]):Set<Permission>{return new Set(roles.flatMap(role=>ROLE_PERMISSION_CEILING[role]??[]))}
export function effectivePermissions(membership:Membership):readonly Permission[]{if(!membership.active)return[];const ceiling=roleCeiling(membership.roles);return unique(membership.grantedPermissions.filter(permission=>ceiling.has(permission))).sort()}
export function requirePermission(membership:Membership,check:PermissionCheck):void{if(membership.tenantId!==check.tenantId||membership.actorId!==check.actorId)throw new Error('MEMBERSHIP_SCOPE_MISMATCH');if(!membership.active)throw new Error('MEMBERSHIP_INACTIVE');if(!effectivePermissions(membership).includes(check.permission))throw new Error('PERMISSION_DENIED')}

export interface MembershipPermissionAuthorizer {
  tenantId:string;
  actorId:string;
  require(permission:Permission):void;
}
export function createMembershipPermissionAuthorizer(membership:Membership):MembershipPermissionAuthorizer{
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
    require(permission:Permission):void{requirePermission(snapshot,{tenantId:snapshot.tenantId,actorId:snapshot.actorId,permission});},
  });
}

export function createInvitation(input:Readonly<{membership:Membership;invitationId:string;email:string;roles:readonly Exclude<Role,'OWNER'>[];grantedPermissions:readonly Permission[];createdAt:string;expiresAt:string}>):TenantInvitation{requirePermission(input.membership,{tenantId:input.membership.tenantId,actorId:input.membership.actorId,permission:'identity:manage'});const email=input.email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('INVALID_INVITATION_EMAIL');if(!input.roles.length)throw new Error('INVITATION_ROLE_REQUIRED');if(isoMs(input.expiresAt)<=isoMs(input.createdAt))throw new Error('INVALID_INVITATION_EXPIRY');const ceiling=roleCeiling(input.roles);const granted=unique(input.grantedPermissions);if(granted.some(permission=>!ceiling.has(permission)))throw new Error('INVITATION_PERMISSION_EXCEEDS_ROLE');return Object.freeze({tenantId:input.membership.tenantId,invitationId:input.invitationId,email,invitedByActorId:input.membership.actorId,roles:unique(input.roles),grantedPermissions:granted,state:'PENDING',createdAt:input.createdAt,expiresAt:input.expiresAt})}
export function resolveEntitlement(subscription:TenantSubscription,capability:ProductCapability,asOf:string):EntitlementDecision{const now=isoMs(asOf),from=isoMs(subscription.effectiveFrom),until=subscription.effectiveUntil?isoMs(subscription.effectiveUntil):null;if(subscription.status!=='ACTIVE'||now<from||(until!==null&&now>=until))return Object.freeze({allowed:false,capability,reason:'SUBSCRIPTION_INACTIVE'});if(PLAN_CAPABILITIES[subscription.plan].includes(capability))return Object.freeze({allowed:true,capability,reason:'PLAN_INCLUDED'});if(subscription.addOns.some(addOn=>ADD_ON_CAPABILITIES[addOn]===capability))return Object.freeze({allowed:true,capability,reason:'ADD_ON_INCLUDED'});return Object.freeze({allowed:false,capability,reason:'NOT_ENTITLED'})}
export function requireEntitlement(subscription:TenantSubscription,capability:ProductCapability,asOf:string):void{if(!resolveEntitlement(subscription,capability,asOf).allowed)throw new Error('ENTITLEMENT_DENIED')}
export function createDataExportRequest(input:Readonly<{membership:Membership;subscription:TenantSubscription;exportRequestId:string;format:DataExportFormat;scope:DataExportScope;requestedAt:string}>):DataExportRequest{requirePermission(input.membership,{tenantId:input.membership.tenantId,actorId:input.membership.actorId,permission:'export:create'});if(input.subscription.tenantId!==input.membership.tenantId)throw new Error('SUBSCRIPTION_SCOPE_MISMATCH');if(input.subscription.status!=='ACTIVE')throw new Error('SUBSCRIPTION_INACTIVE');isoMs(input.requestedAt);return Object.freeze({tenantId:input.membership.tenantId,exportRequestId:input.exportRequestId,requestedByActorId:input.membership.actorId,format:input.format,scope:input.scope,state:'REQUESTED',requestedAt:input.requestedAt})}
export const ACCESS_POLICY={ROLE_PERMISSION_CEILING,PLAN_CAPABILITIES,ADD_ON_CAPABILITIES,CAPITAL_READINESS_PERMISSIONS} as const;
