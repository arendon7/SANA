import {createHash} from 'node:crypto';
import {mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const tmp='.tmp-readiness-ingestion-ux2b1b';
const shim='.tmp-readiness-ingestion-node-crypto.d.ts';
await rm(tmp,{recursive:true,force:true});
await writeFile(shim,"declare module 'node:crypto'{export interface Hash{update(data:Uint8Array|string):Hash;digest(encoding:'hex'):string}export function createHash(algorithm:string):Hash}\n");
const compile=spawnSync('tsc',[
  'services/investment-portfolio/src/readiness-persistence.ts',
  'services/investment-portfolio/src/readiness-evidence.ts',
  'services/investment-portfolio/src/readiness-evidence-ingestion.ts',
  shim,
  '--ignoreConfig','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','true','--strict','true','--rootDir','.','--outDir',tmp,'--noEmitOnError','true'
],{encoding:'utf8'});
await rm(shim,{force:true});
if(compile.status!==0)throw new Error(`UX2B1B_COMPILE_FAILED\n${compile.stdout}\n${compile.stderr}`);
await mkdir(`${tmp}/services/investment-portfolio`,{recursive:true});
await writeFile(`${tmp}/services/investment-portfolio/package.json`,JSON.stringify({type:'module'}));
const mod=await import(`${pathToFileURL(resolve(tmp,'services/investment-portfolio/src/readiness-evidence-ingestion.js')).href}?v=${Date.now()}`);
const assert=(v,m)=>{if(!v)throw new Error(`ASSERT:${m}`)};
const deny=async(fn,code)=>{try{await fn();throw new Error(`EXPECTED:${code}`)}catch(e){if(String(e.message).startsWith('EXPECTED:'))throw e;assert(String(e.message).includes(code),`${code}:${e.message}`)}};
const tenantId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',projectId='11111111-1111-4111-8111-111111111111',assessmentId='assessment:ingest:1',gapId='gap:ingest:g5';
const authority=Object.freeze({tenantId,actorId:'producer:1',require(p){if(p!=='invest:readiness:evidence:submit')throw new Error('PERMISSION_DENIED')}});
const gap=Object.freeze({gapId,tenantId,projectId,assessmentVersion:1,gateId:'G5_MARKET',code:'MARKET_CURRENT_BUYER_EVIDENCE_MISSING',severity:'CRITICAL',blocking:true,state:'OPEN',description:'buyer evidence missing',sourceRef:'G5',ownerRef:'producer:1',requiredEvidenceRoles:Object.freeze(['BUYER_INTENT']),resolutionEvidenceRefs:Object.freeze([]),openedAt:'2026-08-12T20:00:00.000Z'});
const media={
  'application/pdf':new TextEncoder().encode('%PDF-1.7\nSANA'),
  'image/jpeg':Uint8Array.from([0xff,0xd8,0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46]),
  'image/png':Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1,2,3,4]),
  'image/webp':Uint8Array.from([0x52,0x49,0x46,0x46,0x04,0,0,0,0x57,0x45,0x42,0x50,1,2,3,4]),
};
async function* bytes(value){yield Uint8Array.from(value)}
async function* empty(){}
async function* invalidChunk(){yield 'not-bytes'}
class Scanner{constructor(state='CLEAN',delayMs=0){this.state=state;this.delayMs=delayMs;this.calls=0}async scan(input){this.calls++;if(this.delayMs<0)return new Promise(()=>{});if(this.delayMs)await new Promise(r=>setTimeout(r,this.delayMs));return{state:this.state,scannerRef:`scanner:test:${input.digestSha256.slice(0,8)}`}}}
class Store{constructor(mode='ok'){this.mode=mode;this.puts=[];this.deletes=[]}async putImmutable(input){let all=[];for await(const chunk of input.content)all.push(...chunk);const actual=Uint8Array.from(all),digest=createHash('sha256').update(actual).digest('hex');this.puts.push({receiptId:input.receiptId,digest,bytes:actual.length});return{objectRef:`memory://${input.tenantId}/${input.receiptId}`,digestSha256:this.mode==='digest-drift'?'0'.repeat(64):digest,contentType:this.mode==='type-drift'?'image/png':input.contentType,byteLength:this.mode==='length-drift'?actual.length+1:actual.length}}async deleteIfUnreferenced(input){this.deletes.push(input)}}
class DB{
  constructor({failReceipt=false,failSubmission=0}={}){this.receipts=new Map();this.current='OPEN';this.failReceipt=failReceipt;this.failSubmission=failSubmission;this.calls=[]}
  async transaction(work){return work({query:async(sql,params=[])=>{this.calls.push({sql,params});
    if(sql.includes('tenant-context')||sql.includes('idempotency-lock'))return{rows:[{}],rowCount:1};
    if(sql.includes('find-idempotent')){const r=this.receipts.get(params[1]);return r?{rows:[r],rowCount:1}:{rows:[],rowCount:0}}
    if(sql.includes('insert-receipt')){if(this.failReceipt)throw new Error('SIMULATED_RECEIPT_PERSISTENCE_FAILURE');const r={receiptId:params[0],tenantId:params[1],projectId:params[2],assessmentId:params[3],assessmentVersion:params[4],gapId:params[5],evidenceRef:params[6],objectRef:params[7],digestSha256:params[8],contentType:params[9],byteLength:params[10],evidenceRole:params[11],submittedByActorRef:params[12],submittedAt:params[13],idempotencyKey:params[14],correlationId:params[15],state:'VALIDATED'};this.receipts.set(params[14],r);return{rows:[r],rowCount:1}}
    if(sql.includes('validate-submission-receipts')){const wanted=params[6];const rows=[...this.receipts.values()].filter(r=>r.tenantId===params[0]&&r.projectId===params[1]&&r.assessmentId===params[2]&&r.assessmentVersion===params[3]&&r.gapId===params[4]&&r.submittedByActorRef===params[5]&&wanted.includes(r.evidenceRef)).map(r=>({evidenceRef:r.evidenceRef}));return{rows,rowCount:rows.length}}
    if(sql.includes('latest-gap-transition'))return{rows:[{sequence:0,toState:this.current,occurredAt:'2026-08-12T20:00:00.000Z'}],rowCount:1};
    if(sql.includes('append-submission-transition')){if(this.failSubmission>0){this.failSubmission--;throw new Error('SIMULATED_SUBMISSION_FAILURE')}this.current='EVIDENCE_SUBMITTED';return{rows:[],rowCount:1}}
    return{rows:[{}],rowCount:1};
  }});}
}
const policy={maxBytes:1024,scannerTimeoutMs:100,allowedContentTypes:['application/pdf','image/jpeg','image/png','image/webp']};
const input=(contentType,content,idempotency='ingest-idempotency-0001')=>({authority,gap,assessmentId,evidenceRole:'BUYER_INTENT',declaredContentType:contentType,idempotencyKey:idempotency,correlationId:`corr:${idempotency}`,submittedAt:'2026-08-12T20:10:00.000Z',transitionId:`transition:${idempotency}`,content:bytes(content)});

for(const [type,content] of Object.entries(media)){
  const db=new DB(),store=new Store(),scanner=new Scanner(),service=new mod.ReadinessEvidenceIngestionService(db,store,scanner,policy);
  const result=await service.ingestAndSubmit(input(type,content,`ingest-${type.replace(/[^a-z]/g,'-')}-0001`));
  assert(result.gapState==='EVIDENCE_SUBMITTED'&&!result.autoResolved,`MEDIA_${type}_SUBMITTED_NOT_RESOLVED`);
  assert(result.receipt.contentType===type&&result.receipt.digestSha256===createHash('sha256').update(content).digest('hex'),`MEDIA_${type}_SERVER_DIGEST`);
  assert(store.puts.length===1&&scanner.calls===1,`MEDIA_${type}_STORE_SCAN`);
}

{const service=new mod.ReadinessEvidenceIngestionService(new DB(),new Store(),new Scanner(),policy);await deny(()=>service.ingestAndSubmit(input('image/jpeg',media['application/pdf'],'ingest-spoof-000001')),'READINESS_INGEST_CONTENT_SIGNATURE_MISMATCH')}
{const service=new mod.ReadinessEvidenceIngestionService(new DB(),new Store(),new Scanner(),policy);await deny(()=>service.ingestAndSubmit(input('text/html',new TextEncoder().encode('<html>'),'ingest-html-0000001')),'READINESS_INGEST_CONTENT_TYPE_NOT_ALLOWED')}
{const service=new mod.ReadinessEvidenceIngestionService(new DB(),new Store(),new Scanner(),policy);await deny(()=>service.ingestAndSubmit({...input('application/pdf',media['application/pdf'],'ingest-empty-000001'),content:empty()}),'READINESS_INGEST_CONTENT_EMPTY')}
{const service=new mod.ReadinessEvidenceIngestionService(new DB(),new Store(),new Scanner(),{...policy,maxBytes:8});await deny(()=>service.ingestAndSubmit(input('application/pdf',media['application/pdf'],'ingest-large-000001')),'READINESS_INGEST_CONTENT_TOO_LARGE')}
{const service=new mod.ReadinessEvidenceIngestionService(new DB(),new Store(),new Scanner(),policy);await deny(()=>service.ingestAndSubmit({...input('application/pdf',media['application/pdf'],'ingest-badchunk-001'),content:invalidChunk()}),'READINESS_INGEST_CHUNK_INVALID')}
{const store=new Store(),service=new mod.ReadinessEvidenceIngestionService(new DB(),store,new Scanner('REJECTED'),policy);await deny(()=>service.ingestAndSubmit(input('application/pdf',media['application/pdf'],'ingest-scan-reject01')),'READINESS_INGEST_SCAN_NOT_CLEAN:REJECTED');assert(store.puts.length===0,'REJECTED_SCAN_BEFORE_STORAGE')}
{const store=new Store(),service=new mod.ReadinessEvidenceIngestionService(new DB(),store,new Scanner('UNKNOWN'),policy);await deny(()=>service.ingestAndSubmit(input('application/pdf',media['application/pdf'],'ingest-scan-unknown1')),'READINESS_INGEST_SCAN_NOT_CLEAN:UNKNOWN');assert(store.puts.length===0,'UNKNOWN_SCAN_BEFORE_STORAGE')}
{const store=new Store(),service=new mod.ReadinessEvidenceIngestionService(new DB(),store,new Scanner('CLEAN',-1),policy);await deny(()=>service.ingestAndSubmit(input('application/pdf',media['application/pdf'],'ingest-scan-timeout1')),'READINESS_INGEST_SCANNER_TIMEOUT');assert(store.puts.length===0,'TIMEOUT_BEFORE_STORAGE')}
for(const mode of ['digest-drift','type-drift','length-drift']){const store=new Store(mode),service=new mod.ReadinessEvidenceIngestionService(new DB(),store,new Scanner(),policy);await deny(()=>service.ingestAndSubmit(input('application/pdf',media['application/pdf'],`ingest-${mode}-00001`)),mode==='digest-drift'?'READINESS_INGEST_OBJECT_DIGEST_DRIFT':mode==='type-drift'?'READINESS_INGEST_OBJECT_CONTENT_TYPE_DRIFT':'READINESS_INGEST_OBJECT_LENGTH_DRIFT');assert(store.deletes.length===1,`${mode}_CLEANUP`)}
{const store=new Store(),db=new DB({failReceipt:true}),service=new mod.ReadinessEvidenceIngestionService(db,store,new Scanner(),policy);await deny(()=>service.ingestAndSubmit(input('application/pdf',media['application/pdf'],'ingest-db-fail-00001')),'SIMULATED_RECEIPT_PERSISTENCE_FAILURE');assert(store.deletes.length===1,'PERSISTENCE_FAILURE_CLEANUP')}
{const store=new Store(),db=new DB({failSubmission:1}),service=new mod.ReadinessEvidenceIngestionService(db,store,new Scanner(),policy);const retryKey='ingest-retry-0000001';await deny(()=>service.ingestAndSubmit(input('application/pdf',media['application/pdf'],retryKey)),'SIMULATED_SUBMISSION_FAILURE');assert(db.receipts.size===1&&store.deletes.length===0,'TRANSITION_FAILURE_PRESERVES_RECEIPT');const first=[...db.receipts.values()][0];const result=await service.ingestAndSubmit(input('application/pdf',media['application/pdf'],retryKey));assert(result.receipt.receiptId===first.receiptId,'DETERMINISTIC_RECEIPT_RETRY');assert(db.receipts.size===1&&db.current==='EVIDENCE_SUBMITTED','RETRY_SUBMITS_EXISTING_RECEIPT')}
{const db1=new DB(),db2=new DB(),store1=new Store(),store2=new Store(),scanner=new Scanner(),service1=new mod.ReadinessEvidenceIngestionService(db1,store1,scanner,policy),service2=new mod.ReadinessEvidenceIngestionService(db2,store2,scanner,policy);const deterministicKey='ingest-deterministic01';const a=await service1.ingestAndSubmit(input('application/pdf',media['application/pdf'],deterministicKey)),b=await service2.ingestAndSubmit(input('application/pdf',media['application/pdf'],deterministicKey));assert(a.receipt.receiptId===b.receipt.receiptId&&a.receipt.evidenceRef===b.receipt.evidenceRef,'DETERMINISTIC_IDENTITIES')}
const boundary=mod.READINESS_EVIDENCE_INGESTION_BOUNDARY;
assert(boundary.serverSideOnly&&!boundary.browserRouteEnabled&&!boundary.storageProviderSelected,'NO_TRANSPORT_PROVIDER_CLAIM');
assert(!boundary.callerControlsActor&&!boundary.callerControlsTenant&&!boundary.callerControlsReceiptId&&!boundary.callerControlsEvidenceRef&&!boundary.callerControlsObjectRef&&!boundary.callerControlsDigest&&!boundary.callerControlsByteLength,'SERVER_DERIVED_IDENTITIES');
assert(boundary.rawContentPersistedInPostgres===false&&boundary.contentSafetyScanRequired===true&&boundary.autoResolution===false&&boundary.financialAuthority===false,'TRUST_BOUNDARY');
console.log('PASS_CAPITAL_READINESS_INGESTION_UX2B1B');
await rm(tmp,{recursive:true,force:true});
