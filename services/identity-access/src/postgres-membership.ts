import type {Membership,Permission,Role} from '@agroway/identity-contracts';

export type IdentitySqlScalar=string|number|boolean|null|readonly string[];
export interface IdentitySqlResult<Row extends object=Record<string,unknown>>{rows:readonly Row[];rowCount:number;}
export interface IdentitySqlTransaction{query<Row extends object=Record<string,unknown>>(sql:string,params?:readonly IdentitySqlScalar[]):Promise<IdentitySqlResult<Row>>;}
export interface IdentitySqlExecutor{transaction<T>(work:(tx:IdentitySqlTransaction)=>Promise<T>):Promise<T>;}

interface MembershipRow{
  tenantId:string;
  actorId:string;
  roles:readonly string[];
  grantedPermissions:readonly string[];
  active:boolean;
}

const ROLES:readonly Role[]=['OWNER','ADMIN','AGRONOMIST','OPERATOR','VIEWER','INVESTOR'];
const ROLE_SET=new Set<string>(ROLES);
function nonBlank(value:string,code:string):string{const normalized=value.trim();if(!normalized)throw new Error(code);return normalized;}
function uniqueNonBlank(values:readonly string[],code:string):readonly string[]{
  const normalized=values.map(value=>nonBlank(value,code));
  if(new Set(normalized).size!==normalized.length)throw new Error(`${code}_DUPLICATE`);
  return Object.freeze(normalized);
}
function roles(values:readonly string[]):readonly Role[]{
  const normalized=uniqueNonBlank(values,'MEMBERSHIP_ROLE_INVALID');
  if(normalized.some(role=>!ROLE_SET.has(role)))throw new Error('MEMBERSHIP_ROLE_UNKNOWN');
  return Object.freeze(normalized as Role[]);
}

/**
 * Loads one durable membership inside a tenant-bound transaction. Missing,
 * inactive or malformed state never falls back to role defaults or implicit
 * grants. Authorization remains a separate request-scoped step.
 */
export async function loadDurableMembership(
  executor:IdentitySqlExecutor,
  tenantId:string,
  actorId:string,
):Promise<Membership>{
  const tenant=nonBlank(tenantId,'MEMBERSHIP_TENANT_REQUIRED');
  const actor=nonBlank(actorId,'MEMBERSHIP_ACTOR_REQUIRED');
  return executor.transaction(async tx=>{
    const bound=await tx.query("/* identity:tenant-context */ SELECT set_config('app.tenant_id',$1,true)",[tenant]);
    if(bound.rowCount>1)throw new Error('MEMBERSHIP_TENANT_CONTEXT_BIND_INVALID');
    const result=await tx.query<MembershipRow>(`/* identity:load-membership */
      SELECT tenant_id AS "tenantId",actor_id AS "actorId",roles,granted_permissions AS "grantedPermissions",active
      FROM agroway_identity.membership
      WHERE tenant_id=$1 AND actor_id=$2
      LIMIT 2`,[tenant,actor]);
    if(result.rowCount===0)throw new Error('MEMBERSHIP_NOT_FOUND');
    if(result.rowCount!==1)throw new Error('MEMBERSHIP_NON_UNIQUE');
    const row=result.rows[0];
    if(row.tenantId!==tenant||row.actorId!==actor)throw new Error('MEMBERSHIP_SCOPE_MISMATCH');
    if(typeof row.active!=='boolean')throw new Error('MEMBERSHIP_ACTIVE_INVALID');
    const membership:Membership=Object.freeze({
      tenantId:row.tenantId,
      actorId:row.actorId,
      roles:roles(row.roles),
      grantedPermissions:uniqueNonBlank(row.grantedPermissions,'MEMBERSHIP_PERMISSION_INVALID') as readonly Permission[],
      active:row.active,
    });
    return membership;
  });
}

export const DURABLE_MEMBERSHIP_BOUNDARY=Object.freeze({
  explicitPermissionPersistence:true,
  implicitReadinessGrant:false,
  tenantBoundTransaction:true,
  callerControlledMembership:false,
});
