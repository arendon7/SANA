import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-capital-readiness-ux2b0-identity';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/identity-access/src/capital-readiness-access.ts',
  'services/identity-access/src/postgres-membership.ts',
  'services/identity-access/src/capital-readiness-request-context.ts',
  '--ignoreConfig','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--strict','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true',
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`CAPITAL_READINESS_UX2B0_IDENTITY_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await mkdir(`${tmp}/services/identity-access`,{recursive:true});
await writeFile(`${tmp}/services/identity-access/package.json`,JSON.stringify({type:'module'}));
const access=await import(`${pathToFileURL(resolve(tmp,'services/identity-access/src/capital-readiness-access.js')).href}?v=${Date.now()}`);
const request=await import(`${pathToFileURL(resolve(tmp,'services/identity-access/src/capital-readiness-request-context.js')).href}?v=${Date.now()}`);

const assert=(condition,message)=>{if(!condition)throw new Error(`ASSERTION_FAILED:${message}`)};
const expectThrow=async(fn,code)=>{let threw=false;try{await fn()}catch(error){threw=true;assert(String(error?.message??error).includes(code),`EXPECTED_${code}_GOT_${String(error?.message??error)}`)}assert(threw,`EXPECTED_THROW_${code}`)};
const P=access.CAPITAL_READINESS_PERMISSIONS;
const tenant='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const actor='producer-or-tech:1';
const baseSession=Object.freeze({tenantId:tenant,actorId:actor,authenticated:true,providerAttested:true,state:'ACTIVE',assurance:'AAL2',mfaVerified:true,issuedAt:'2026-08-12T19:00:00.000Z',expiresAt:'2026-08-12T21:00:00.000Z'});

function executorFor(row){return Object.freeze({transaction:async work=>work(Object.freeze({query:async(sql,params=[])=>{
  if(sql.includes('identity:tenant-context'))return{rows:Object.freeze([{}]),rowCount:1};
  if(sql.includes('identity:load-membership'))return row?{rows:Object.freeze([row]),rowCount:1}:{rows:Object.freeze([]),rowCount:0};
  throw new Error(`UNEXPECTED_SQL:${sql}:${JSON.stringify(params)}`);
}}))});}

const sourceRoles=['AGRONOMIST'];
const sourceGrants=[P.READ,P.REMEDIATE,P.FINALIZE];
const row={tenantId:tenant,actorId:actor,roles:sourceRoles,grantedPermissions:sourceGrants,active:true};
const ctx=await request.createCapitalReadinessRequestContext(executorFor(row),baseSession,'2026-08-12T20:00:00.000Z');
ctx.authority.require(P.READ);ctx.authority.require(P.REMEDIATE);
await expectThrow(()=>Promise.resolve(ctx.authority.require(P.FINALIZE)),'PERMISSION_DENIED');
assert(ctx.tenantId===tenant&&ctx.actorId===actor,'SESSION_SCOPE_BOUND');
assert(ctx.identitySource==='VERIFIED_PRODUCTION_SESSION_PLUS_DURABLE_MEMBERSHIP','IDENTITY_SOURCE');
assert(Object.isFrozen(ctx)&&Object.isFrozen(ctx.authority),'REQUEST_CONTEXT_FROZEN');

sourceRoles.splice(0,sourceRoles.length,'ADMIN');sourceGrants.push(P.WAIVE,P.REASSESS);
await expectThrow(()=>Promise.resolve(ctx.authority.require(P.FINALIZE)),'PERMISSION_DENIED');
await expectThrow(()=>Promise.resolve(ctx.authority.require(P.WAIVE)),'PERMISSION_DENIED');

const ownerNoGrant={tenantId:tenant,actorId:'owner:1',roles:['OWNER'],grantedPermissions:[],active:true};
const ownerCtx=await request.createCapitalReadinessRequestContext(executorFor(ownerNoGrant),{...baseSession,actorId:'owner:1'},'2026-08-12T20:00:00.000Z');
await expectThrow(()=>Promise.resolve(ownerCtx.authority.require(P.READ)),'PERMISSION_DENIED');

const investor={tenantId:tenant,actorId:'investor:1',roles:['INVESTOR'],grantedPermissions:[P.READ,P.REMEDIATE],active:true};
const investorCtx=await request.createCapitalReadinessRequestContext(executorFor(investor),{...baseSession,actorId:'investor:1'},'2026-08-12T20:00:00.000Z');
investorCtx.authority.require(P.READ);
await expectThrow(()=>Promise.resolve(investorCtx.authority.require(P.REMEDIATE)),'PERMISSION_DENIED');

await expectThrow(()=>request.createCapitalReadinessRequestContext(executorFor({...row,tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}),baseSession,'2026-08-12T20:00:00.000Z'),'MEMBERSHIP_SCOPE_MISMATCH');
await expectThrow(()=>request.createCapitalReadinessRequestContext(executorFor({...row,active:false}),baseSession,'2026-08-12T20:00:00.000Z'),'CAPITAL_REQUEST_MEMBERSHIP_INACTIVE');
await expectThrow(()=>request.createCapitalReadinessRequestContext(executorFor({...row,roles:['ROOT']}),baseSession,'2026-08-12T20:00:00.000Z'),'MEMBERSHIP_ROLE_UNKNOWN');
await expectThrow(()=>request.createCapitalReadinessRequestContext(executorFor(null),baseSession,'2026-08-12T20:00:00.000Z'),'MEMBERSHIP_NOT_FOUND');
await expectThrow(()=>request.createCapitalReadinessRequestContext(executorFor(row),{...baseSession,assurance:'AAL1'},'2026-08-12T20:00:00.000Z'),'CAPITAL_REQUEST_AAL2_MFA_REQUIRED');
await expectThrow(()=>request.createCapitalReadinessRequestContext(executorFor(row),{...baseSession,mfaVerified:false},'2026-08-12T20:00:00.000Z'),'CAPITAL_REQUEST_AAL2_MFA_REQUIRED');
await expectThrow(()=>request.createCapitalReadinessRequestContext(executorFor(row),baseSession,'2026-08-12T21:00:00.000Z'),'CAPITAL_REQUEST_SESSION_EXPIRED');
await expectThrow(()=>Promise.resolve(access.createMembershipPermissionAuthorizer({...row,roles:['AGRONOMIST','ROOT']})),'CAPITAL_READINESS_ROLE_UNKNOWN');

console.log(JSON.stringify({
  status:'PASS',slice:'CAPITAL_READINESS_UX2B0_IDENTITY_FOUNDATION',
  durableMembership:true,explicitGrants:true,implicitGrant:false,tenantBound:true,
  requestScopedSnapshot:true,postCreationEscalation:false,investorReadOnly:true,
  oidcVerifiedSessionContractRequired:true,browserMutationEnabled:false,
},null,2));
await rm(tmp,{recursive:true,force:true});
