import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-readiness-evidence-review-ux2b2';
await rm(tmp,{recursive:true,force:true});
const compile=spawnSync('tsc',[
  'services/investment-portfolio/src/readiness-persistence.ts',
  'services/investment-portfolio/src/readiness-evidence-review.ts',
  'services/investment-portfolio/src/node-crypto.d.ts',
  'services/identity-access/src/capital-readiness-access.ts',
  '--ignoreConfig','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--strict','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true'
],{encoding:'utf8'});
if(compile.status!==0)throw new Error(`UX2B2_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await writeFile(`${tmp}/package.json`,JSON.stringify({type:'module'}));
const review=await import(`${pathToFileURL(resolve(tmp,'services/investment-portfolio/src/readiness-evidence-review.js')).href}?v=${Date.now()}`);
const access=await import(`${pathToFileURL(resolve(tmp,'services/identity-access/src/capital-readiness-access.js')).href}?v=${Date.now()}`);
const P=access.CAPITAL_READINESS_PERMISSIONS;
const assert=(value,message)=>{if(!value)throw new Error(`ASSERT:${message}`)};
const deny=async(fn,code)=>{try{await fn();throw new Error(`EXPECTED:${code}`)}catch(error){if(String(error.message).startsWith('EXPECTED:'))throw error;assert(String(error.message).includes(code),`${code}:${error.message}`)}};

const tenantId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId='11111111-1111-4111-8111-111111111111';
const assessmentId='assessment:ux2b2:1';
const gapId='gap:ux2b2:g5';
const evidenceRef='evidence:buyer-intent:ux2b2';
const receipt=Object.freeze({
  receiptId:'99999999-9999-4999-8999-999999999931',tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRef,
  objectRef:'memory://receipt/ux2b2',digestSha256:'f'.repeat(64),contentType:'application/pdf',byteLength:4096,evidenceRole:'BUYER_INTENT',
  submittedByActorRef:'producer:1',submittedAt:'2026-08-12T20:00:00.000Z',idempotencyKey:'ux2b2-receipt-000001',correlationId:'corr:ux2b2',state:'VALIDATED',
});
const gap=Object.freeze({
  gapId,tenantId,projectId,assessmentVersion:1,gateId:'G5_MARKET',code:'MARKET_CURRENT_BUYER_EVIDENCE_MISSING',severity:'CRITICAL',blocking:true,
  state:'EVIDENCE_SUBMITTED',description:'buyer evidence missing',sourceRef:'G5',ownerRef:'producer:1',requiredEvidenceRoles:Object.freeze(['BUYER_INTENT']),
  resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T19:00:00.000Z',
});

const producer=access.createMembershipPermissionAuthorizer({tenantId,actorId:'producer:1',roles:['OWNER'],grantedPermissions:[P.READ,P.EVIDENCE_SUBMIT],active:true});
const reviewer=access.createMembershipPermissionAuthorizer({tenantId,actorId:'reviewer:1',roles:['AGRONOMIST'],grantedPermissions:[P.READ,P.EVIDENCE_REVIEW],active:true});
const reviewer2=access.createMembershipPermissionAuthorizer({tenantId,actorId:'reviewer:2',roles:['ADMIN'],grantedPermissions:[P.READ,P.EVIDENCE_REVIEW],active:true});
const investor=access.createMembershipPermissionAuthorizer({tenantId,actorId:'investor:1',roles:['INVESTOR'],grantedPermissions:[P.READ,P.EVIDENCE_REVIEW],active:true});
reviewer.require(P.EVIDENCE_REVIEW);
await deny(()=>Promise.resolve(producer.require(P.EVIDENCE_REVIEW)),'PERMISSION_DENIED');
await deny(()=>Promise.resolve(investor.require(P.EVIDENCE_REVIEW)),'PERMISSION_DENIED');
assert(P.EVIDENCE_REVIEW==='invest:readiness:evidence:review','DEDICATED_REVIEW_PERMISSION');

class DB{
  constructor({actorGapState='EVIDENCE_SUBMITTED',receiptRow=receipt,reviews=[]}={}){this.gapState=actorGapState;this.receipt=receiptRow;this.reviews=[...reviews];this.calls=[];}
  async transaction(work){return work({query:async(sql,params=[])=>{this.calls.push({sql,params});
    if(sql.includes('tenant-context'))return{rows:[{}],rowCount:1};
    if(sql.includes('find-decision')){const row=this.reviews.find(item=>item.decisionId===params[1]);return row?{rows:[row],rowCount:1}:{rows:[],rowCount:0};}
    if(sql.includes('load-receipt'))return this.receipt?{rows:[this.receipt],rowCount:1}:{rows:[],rowCount:0};
    if(sql.includes('latest-gap-transition'))return{rows:[{sequence:1,toState:this.gapState,occurredAt:'2026-08-12T20:05:00.000Z'}],rowCount:1};
    if(sql.includes('submission-proof'))return this.gapState==='EVIDENCE_SUBMITTED'?{rows:[{}],rowCount:1}:{rows:[],rowCount:0};
    if(sql.includes('latest-review')){const rows=this.reviews.filter(item=>item.receiptId===params[1]).sort((a,b)=>b.sequence-a.sequence);return rows[0]?{rows:[rows[0]],rowCount:1}:{rows:[],rowCount:0};}
    if(sql.includes('insert-decision')){const row={decisionId:params[0],tenantId:params[1],projectId:params[2],assessmentId:params[3],assessmentVersion:params[4],gapId:params[5],receiptId:params[6],evidenceRef:params[7],receiptDigestSha256:params[8],sequence:params[9],action:params[10],reviewerRef:params[11],rationale:params[12],reviewedAt:params[13],previousDecisionDigestSha256:params[14],decisionDigestSha256:params[15]};this.reviews.push(Object.freeze(row));return{rows:[row],rowCount:1};}
    if(sql.includes('accepted-resolution-proof')){const wanted=params[5];const at=Date.parse(params[6]);const accepted=[];for(const ref of wanted){if(ref!==this.receipt?.evidenceRef)continue;const latest=this.reviews.filter(item=>item.evidenceRef===ref&&Date.parse(item.reviewedAt)<=at).sort((a,b)=>b.sequence-a.sequence)[0];if(latest?.action==='ACCEPTED_FOR_GAP_REVIEW')accepted.push({evidenceRef:ref});}return{rows:accepted,rowCount:accepted.length};}
    return{rows:[{}],rowCount:1};
  }});}
}

const command=(action='ACCEPTED_FOR_GAP_REVIEW',decisionId='99999999-9999-4999-8999-999999999941',reviewedAt='2026-08-12T20:10:00.000Z')=>({
  tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRef,decisionId,action,rationale:`Human ${action} rationale`,reviewedAt,
});

{const db=new DB();const accepted=await review.reviewAuthorizedReadinessEvidence(db,reviewer,gap,command());assert(accepted.action==='ACCEPTED_FOR_GAP_REVIEW'&&accepted.sequence===0,'FIRST_ACCEPTED_REVIEW');assert(accepted.previousDecisionDigestSha256===null&&/^[a-f0-9]{64}$/.test(accepted.decisionDigestSha256),'FIRST_REVIEW_DIGEST');await review.assertResolutionEvidenceHumanAccepted(db,{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRefs:[evidenceRef],at:'2026-08-12T20:11:00.000Z'});}

await deny(()=>review.reviewAuthorizedReadinessEvidence(new DB(),producer,gap,command()),'PERMISSION_DENIED');
await deny(()=>review.reviewAuthorizedReadinessEvidence(new DB(),investor,gap,command()),'PERMISSION_DENIED');
await deny(()=>review.reviewAuthorizedReadinessEvidence(new DB(),reviewer,{...gap,state:'IN_REMEDIATION'},command()),'READINESS_EVIDENCE_REVIEW_REQUIRES_EVIDENCE_SUBMITTED_STATE');
await deny(()=>review.reviewAuthorizedReadinessEvidence(new DB({actorGapState:'IN_REMEDIATION'}),reviewer,gap,command()),'READINESS_EVIDENCE_REVIEW_PERSISTED_GAP_NOT_SUBMITTED');
await deny(()=>review.reviewAuthorizedReadinessEvidence(new DB(),reviewer,gap,{...command(),tenantId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}),'READINESS_EVIDENCE_REVIEW_AUTHORITY_TENANT_MISMATCH');
await deny(()=>review.reviewAuthorizedReadinessEvidence(new DB(),reviewer,gap,{...command(),projectId:'22222222-2222-4222-8222-222222222222'}),'READINESS_EVIDENCE_REVIEW_GAP_SCOPE_MISMATCH');
await deny(()=>review.reviewAuthorizedReadinessEvidence(new DB({receiptRow:{...receipt,submittedByActorRef:'reviewer:1'}}),reviewer,gap,command()),'READINESS_EVIDENCE_REVIEW_SEPARATION_OF_DUTIES_REQUIRED');
await deny(()=>review.reviewAuthorizedReadinessEvidence(new DB(),reviewer,gap,command('ACCEPTED_FOR_GAP_REVIEW','99999999-9999-4999-8999-999999999942','2026-08-12T19:59:00.000Z')),'READINESS_EVIDENCE_REVIEW_BEFORE_RECEIPT_SUBMISSION');

{const db=new DB();const first=await review.reviewAuthorizedReadinessEvidence(db,reviewer,gap,command('REJECTED','99999999-9999-4999-8999-999999999943'));
  await deny(()=>review.assertResolutionEvidenceHumanAccepted(db,{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRefs:[evidenceRef],at:'2026-08-12T20:11:00.000Z'}),'READINESS_RESOLUTION_REQUIRES_LATEST_HUMAN_ACCEPTED_EVIDENCE');
  const second=await review.reviewAuthorizedReadinessEvidence(db,reviewer2,gap,command('ACCEPTED_FOR_GAP_REVIEW','99999999-9999-4999-8999-999999999944','2026-08-12T20:12:00.000Z'));
  assert(second.sequence===1&&second.previousDecisionDigestSha256===first.decisionDigestSha256,'REVIEW_HASH_PREDECESSOR_CHAIN');
  await review.assertResolutionEvidenceHumanAccepted(db,{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRefs:[evidenceRef],at:'2026-08-12T20:13:00.000Z'});
  const third=await review.reviewAuthorizedReadinessEvidence(db,reviewer,gap,command('REFRESH_REQUIRED','99999999-9999-4999-8999-999999999945','2026-08-12T20:14:00.000Z'));
  assert(third.sequence===2,'THIRD_REVIEW_SEQUENCE');
  await deny(()=>review.assertResolutionEvidenceHumanAccepted(db,{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRefs:[evidenceRef],at:'2026-08-12T20:15:00.000Z'}),'READINESS_RESOLUTION_REQUIRES_LATEST_HUMAN_ACCEPTED_EVIDENCE');
}

{const db=new DB();const first=await review.reviewAuthorizedReadinessEvidence(db,reviewer,gap,command('ACCEPTED_FOR_GAP_REVIEW','99999999-9999-4999-8999-999999999946'));
  const replay=await review.reviewAuthorizedReadinessEvidence(db,reviewer,gap,command('ACCEPTED_FOR_GAP_REVIEW','99999999-9999-4999-8999-999999999946'));
  assert(replay.decisionDigestSha256===first.decisionDigestSha256&&db.reviews.length===1,'EXACT_IDEMPOTENT_REPLAY');
  await deny(()=>review.reviewAuthorizedReadinessEvidence(db,reviewer,gap,{...command('ACCEPTED_FOR_GAP_REVIEW','99999999-9999-4999-8999-999999999946'),rationale:'drifted rationale'}),'READINESS_EVIDENCE_REVIEW_IDEMPOTENCY_PAYLOAD_DRIFT');
}

await deny(()=>review.assertResolutionEvidenceHumanAccepted(new DB(),{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRefs:[],at:'2026-08-12T20:15:00.000Z'}),'READINESS_RESOLUTION_REVIEW_EVIDENCE_REQUIRED');
await deny(()=>review.assertResolutionEvidenceHumanAccepted(new DB(),{tenantId,projectId,assessmentId,assessmentVersion:1,gapId,evidenceRefs:[evidenceRef,evidenceRef],at:'2026-08-12T20:15:00.000Z'}),'READINESS_RESOLUTION_REVIEW_EVIDENCE_DUPLICATE');

const boundary=review.READINESS_EVIDENCE_REVIEW_BOUNDARY;
assert(boundary.humanReviewRequired&&boundary.submitterCanReviewOwnReceipt===false&&boundary.cleanScanIsHumanAcceptance===false,'SEMANTIC_SEPARATION');
assert(boundary.reviewIsAppendOnly&&boundary.reviewResolvesGap===false&&boundary.acceptedReviewRequiredForResolution,'REVIEW_RESOLUTION_SEPARATION');
assert(boundary.browserMutationEnabled===false&&boundary.aiReviewAuthority===false&&boundary.financialAuthority===false,'TRUST_BOUNDARY');
console.log('PASS_CAPITAL_READINESS_EVIDENCE_REVIEW_UX2B2');
await rm(tmp,{recursive:true,force:true});
