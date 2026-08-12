import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-authorizer-snapshot-int17';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/identity-access/src/index.ts',
  '--ignoreConfig','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--strict','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_AUTHORIZER_SNAPSHOT_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await writeFile(`${tmp}/package.json`,JSON.stringify({type:'module'}));
const access=await import(`${pathToFileURL(resolve(tmp,'services/identity-access/src/index.js')).href}?v=${Date.now()}`);

function assert(condition,message){if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)}
function expectThrow(fn,code){let threw=false;try{fn()}catch(error){threw=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(threw,`EXPECTED_THROW_${code}`)}
function pass(name){console.log(`PASS ${name}`)}

const P=access.CAPITAL_READINESS_PERMISSIONS;

// Simulate a mutable object crossing the TypeScript boundary. The request-scoped
// authorizer must copy authenticated membership facts once, not retain a live
// reference that untrusted application code can mutate later in the request.
const roles=['AGRONOMIST'];
const grants=[P.READ];
const mutableMembership={
  tenantId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId:'human:agronomist',
  roles,
  grantedPermissions:grants,
  active:true,
};
const auth=access.createMembershipPermissionAuthorizer(mutableMembership);
auth.require(P.READ);

roles.splice(0,roles.length,'ADMIN');
grants.push(P.FINALIZE,P.WAIVE,P.REASSESS);
mutableMembership.active=false;
mutableMembership.tenantId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
mutableMembership.actorId='human:attacker';

assert(auth.tenantId==='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','TENANT_ID_SNAPSHOTTED');
assert(auth.actorId==='human:agronomist','ACTOR_ID_SNAPSHOTTED');
auth.require(P.READ);
expectThrow(()=>auth.require(P.FINALIZE),'PERMISSION_DENIED');
expectThrow(()=>auth.require(P.WAIVE),'PERMISSION_DENIED');
expectThrow(()=>auth.require(P.REASSESS),'PERMISSION_DENIED');
pass('POST_CREATION_MUTATION_CANNOT_ESCALATE_AUTHORITY');

// The inverse mutation must also not silently alter the already-authenticated
// request context. Revocation/refresh is handled by creating a new authorizer
// from newly authenticated membership state on the next request.
const adminRoles=['ADMIN'];
const adminGrants=[P.READ,P.FINALIZE];
const mutableAdmin={
  tenantId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId:'human:reviewer',
  roles:adminRoles,
  grantedPermissions:adminGrants,
  active:true,
};
const adminAuth=access.createMembershipPermissionAuthorizer(mutableAdmin);
adminRoles.splice(0,adminRoles.length,'VIEWER');
adminGrants.splice(0,adminGrants.length);
mutableAdmin.active=false;
adminAuth.require(P.READ);
adminAuth.require(P.FINALIZE);
pass('REQUEST_AUTHORIZATION_CONTEXT_IS_STABLE_AFTER_CREATION');

assert(Object.isFrozen(auth),'AUTHORIZER_OBJECT_FROZEN');
assert(Object.isFrozen(adminAuth),'ADMIN_AUTHORIZER_OBJECT_FROZEN');
pass('AUTHORIZER_OBJECTS_FROZEN');

console.log(JSON.stringify({
  status:'PASS',
  slice:'CAPITAL_READINESS_INT1.7_AUTHORIZER_SNAPSHOT',
  requestScopedSnapshot:true,
  liveMembershipReferenceRetained:false,
  postCreationPrivilegeEscalation:false,
  tenantAndActorStable:true,
},null,2));
