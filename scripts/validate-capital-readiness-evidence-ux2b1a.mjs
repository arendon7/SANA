import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const tmp='.tmp-readiness-evidence-ux2b1a';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/investment-portfolio/src/readiness-evidence.ts',
  'services/identity-access/src/capital-readiness-access.ts',
  '--ignoreConfig','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--strict','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true'
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`UX2B1A_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await writeFile(`${tmp}/package.json`,JSON.stringify({type:'module'}));
const evidence=await import(`${pathToFileURL(resolve(tmp,'services/investment-portfolio/src/readiness-evidence.js')).href}?v=${Date.now()}`);
const access=await import(`${pathToFileURL(resolve(tmp,'services/identity-access/src/capital-readiness-access.js')).href}?v=${Date.now()}`);
const P=access.CAPITAL_READINESS_PERMISSIONS;
const assert=(v,m)=>{if(!v)throw new Error(`ASSERT:${m}`)};
const deny=async(fn,code)=>{try{await fn();throw new Error(`EXPECTED:${code}`)}catch(e){if(String(e.message).startsWith('EXPECTED:'))throw e;assert(String(e.message).includes(code),`${code}:${e.message}`)}};
const tenantId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',projectId='11111111-1111-4111-8111-111111111111',assessmentId='assessment:evidence:v1',gapId='gap:g5';
const ownerMembership={tenantId,actorId:'producer:1',roles:['OWNER'],grantedPermissions:[P.READ,P.EVIDENCE_SUBMIT],active:true};
const ownerAuth=access.createMembershipPermissionAuthorizer(ownerMembership);
ownerAuth.require(P.EVIDENCE_SUBMIT);
await deny(()=>Promise.resolve(ownerAuth.require(P.REMEDIATE)),'PERMISSION_DENIED');
await deny(()=>Promise.resolve(ownerAuth.require(P.FINALIZE)),'PERMISSION_DENIED');
const investorAuth=access.createMembershipPermissionAuthorizer({tenantId,actorId:'investor:1',roles:['INVESTOR'],grantedPermissions:[P.READ,P.EVIDENCE_SUBMIT],active:true});
investorAuth.require(P.READ);
await deny(()=>Promise.resolve(investorAuth.require(P.EVIDENCE_SUBMIT)),'PERMISSION_DENIED');
const agroAuth=access.createMembershipPermissionAuthorizer({tenantId,actorId:'agro:1',roles:['AGRONOMIST'],grantedPermissions:[P.READ,P.EVIDENCE_SUBMIT],active:true});
agroAuth.require(P.EVIDENCE_SUBMIT);

const receipt=Object.freeze({receiptId:'99999999-9999-4999-8999-999999999901',tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRef:'evidence:buyer-intent:1',objectRef:'object://quarantine/9999',digestSha256:'a'.repeat(64),contentType:'application/pdf',byteLength:4096,evidenceRole:'BUYER_INTENT',submittedByActorRef:'producer:1',submittedAt:'2026-08-12T20:00:00.000Z',idempotencyKey:'evidence-submit-00000001',correlationId:'corr:evidence:1',state:'VALIDATED'});
class DB{constructor(mode='insert'){this.mode=mode;this.calls=[];this.tx=0;this.commit=0;this.rollback=0}async transaction(fn){this.tx++;const q={query:async(sql,params=[])=>{this.calls.push({sql,params});if(sql.includes('find-idempotent')){if(this.mode==='replay')return{rows:[receipt],rowCount:1};if(this.mode==='drift')return{rows:[{...receipt,objectRef:'object://different'}],rowCount:1};return{rows:[],rowCount:0}}if(sql.includes('insert-receipt'))return{rows:[receipt],rowCount:1};if(sql.includes('validate-submission-receipts'))return{rows:[{evidenceRef:receipt.evidenceRef}],rowCount:1};if(sql.includes('latest-gap-transition'))return{rows:[{sequence:0,toState:'OPEN',occurredAt:'2026-08-12T19:00:00.000Z'}],rowCount:1};return{rows:[{}],rowCount:1}}};try{const x=await fn(q);this.commit++;return x}catch(e){this.rollback++;throw e}}}
const inserted=await evidence.registerAuthorizedReadinessEvidenceReceipt(new DB(),ownerAuth,receipt);assert(inserted.evidenceRef===receipt.evidenceRef,'RECEIPT_INSERT');
const replayed=await evidence.registerAuthorizedReadinessEvidenceReceipt(new DB('replay'),ownerAuth,receipt);assert(replayed.receiptId===receipt.receiptId,'IDEMPOTENT_REPLAY');
await deny(()=>evidence.registerAuthorizedReadinessEvidenceReceipt(new DB('drift'),ownerAuth,receipt),'READINESS_EVIDENCE_IDEMPOTENCY_PAYLOAD_DRIFT');
await deny(()=>evidence.registerAuthorizedReadinessEvidenceReceipt(new DB(),agroAuth,receipt),'READINESS_EVIDENCE_ACTOR_MUST_DERIVE_FROM_AUTHORITY');
const gap=Object.freeze({gapId,tenantId,projectId,assessmentVersion:1,gateId:'G5_MARKET',code:'MARKET_CURRENT_BUYER_EVIDENCE_MISSING',severity:'CRITICAL',blocking:true,state:'OPEN',description:'buyer evidence missing',sourceRef:'G5',ownerRef:'producer:1',requiredEvidenceRoles:Object.freeze(['BUYER_INTENT']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T19:00:00.000Z'});
const submitDb=new DB();
await evidence.submitAuthorizedReadinessGapEvidence(submitDb,ownerAuth,gap,{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,fromState:'OPEN',evidenceRefs:[receipt.evidenceRef],transitionId:'transition:evidence:1',at:'2026-08-12T20:05:00.000Z',note:'Producer submitted buyer intent'});
assert(submitDb.calls.some(c=>c.sql.includes('submitted_evidence_refs')),'SUBMISSION_TRANSITION_BINDS_RECEIPT');
await deny(()=>evidence.submitAuthorizedReadinessGapEvidence(new DB(),investorAuth,gap,{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,fromState:'OPEN',evidenceRefs:[receipt.evidenceRef],transitionId:'bad',at:'2026-08-12T20:05:00.000Z'}),'PERMISSION_DENIED');
await deny(()=>evidence.submitAuthorizedReadinessGapEvidence(new DB(),ownerAuth,gap,{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,fromState:'OPEN',evidenceRefs:[],transitionId:'bad2',at:'2026-08-12T20:05:00.000Z'}),'READINESS_EVIDENCE_SUBMISSION_REF_REQUIRED');
assert(evidence.READINESS_EVIDENCE_BOUNDARY.postgresStoresFileBytes===false,'NO_FILE_BYTES_POSTGRES');
assert(evidence.READINESS_EVIDENCE_BOUNDARY.submissionResolvesGap===false&&evidence.READINESS_EVIDENCE_BOUNDARY.submissionWaivesGap===false,'SUBMISSION_NOT_RESOLUTION');
assert(evidence.READINESS_EVIDENCE_BOUNDARY.browserUploadEnabled===false&&evidence.READINESS_EVIDENCE_BOUNDARY.financialAuthority===false,'TRUST_BOUNDARY');
const commandText=(await import('node:fs/promises')).readFile('packages/invest-control-contracts/src/commands.ts','utf8');
const commands=await commandText;assert(commands.includes("target:'IN_REMEDIATION'"),'GENERIC_REMEDIATION_TYPED_NARROW');assert(commands.includes('SubmitReadinessGapEvidence'),'SPECIALIZED_SUBMIT_COMMAND');
console.log('PASS_CAPITAL_READINESS_EVIDENCE_UX2B1A');
await rm(tmp,{recursive:true,force:true});
