import {createHash} from 'node:crypto';
import type {
  ReadinessEvidenceContentScannerPort,
  ReadinessEvidenceObjectStorePort,
  ReadinessEvidenceReceipt,
  ReadinessGap,
  ValidatedEvidenceObject,
} from '@agroway/invest-control-contracts';
import type {CapitalReadinessSqlExecutor} from './readiness-persistence.js';
import {
  READINESS_EVIDENCE_SUBMIT_PERMISSION,
  registerAuthorizedReadinessEvidenceReceipt,
  submitAuthorizedReadinessGapEvidence,
  type ReadinessEvidenceAuthorityContext,
} from './readiness-evidence.js';

export type SupportedReadinessEvidenceContentType='application/pdf'|'image/jpeg'|'image/png'|'image/webp';

export interface ReadinessEvidenceIngestionPolicy {
  maxBytes:number;
  scannerTimeoutMs:number;
  allowedContentTypes:readonly SupportedReadinessEvidenceContentType[];
}

export interface IngestReadinessGapEvidenceInput {
  authority:ReadinessEvidenceAuthorityContext;
  gap:ReadinessGap;
  assessmentId:string;
  evidenceRole:string;
  declaredContentType:string;
  idempotencyKey:string;
  correlationId:string;
  submittedAt:string;
  transitionId:string;
  note?:string;
  content:AsyncIterable<Uint8Array>;
}

export interface ReadinessEvidenceIngestionResult {
  receipt:ReadinessEvidenceReceipt;
  scannerRef:string;
  gapState:'EVIDENCE_SUBMITTED';
  autoResolved:false;
  canonicalMutation:'EVIDENCE_RECEIPT_AND_SUBMISSION_ONLY';
}

const IDEMPOTENCY=/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/;
const SHA256=/^[a-f0-9]{64}$/;
const INITIAL_MAX_BYTES=25*1024*1024;
const MIN_SCANNER_TIMEOUT_MS=100;
const MAX_SCANNER_TIMEOUT_MS=30_000;

function nonBlank(value:string,code:string):string{const normalized=value.trim();if(!normalized)throw new Error(code);return normalized;}
function iso(value:string,code:string):string{if(!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function normalizeContentType(value:string):string{return nonBlank(value,'READINESS_INGEST_CONTENT_TYPE_REQUIRED').toLowerCase().split(';',1)[0].trim();}
function policy(policy:ReadinessEvidenceIngestionPolicy):Readonly<ReadinessEvidenceIngestionPolicy>{
  if(!Number.isSafeInteger(policy.maxBytes)||policy.maxBytes<=0||policy.maxBytes>INITIAL_MAX_BYTES)throw new Error('READINESS_INGEST_MAX_BYTES_POLICY_INVALID');
  if(!Number.isSafeInteger(policy.scannerTimeoutMs)||policy.scannerTimeoutMs<MIN_SCANNER_TIMEOUT_MS||policy.scannerTimeoutMs>MAX_SCANNER_TIMEOUT_MS)throw new Error('READINESS_INGEST_SCANNER_TIMEOUT_POLICY_INVALID');
  const allowed=[...new Set(policy.allowedContentTypes)];
  if(!allowed.length||allowed.some(type=>!['application/pdf','image/jpeg','image/png','image/webp'].includes(type)))throw new Error('READINESS_INGEST_ALLOWED_CONTENT_TYPES_INVALID');
  return Object.freeze({...policy,allowedContentTypes:Object.freeze(allowed)});
}
function deterministicUuid(canonical:string):string{
  const chars=createHash('sha256').update(canonical).digest('hex').slice(0,32).split('');
  chars[12]='5';
  chars[16]=((parseInt(chars[16],16)&0x3)|0x8).toString(16);
  const hex=chars.join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}
function startsWithBytes(bytes:Uint8Array,expected:readonly number[]):boolean{return bytes.length>=expected.length&&expected.every((value,index)=>bytes[index]===value);}
function ascii(bytes:Uint8Array,start:number,length:number):string{return String.fromCharCode(...bytes.slice(start,start+length));}
function signatureMatches(contentType:string,bytes:Uint8Array):boolean{
  if(contentType==='application/pdf')return bytes.length>=5&&ascii(bytes,0,5)==='%PDF-';
  if(contentType==='image/jpeg')return startsWithBytes(bytes,[0xff,0xd8,0xff]);
  if(contentType==='image/png')return startsWithBytes(bytes,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if(contentType==='image/webp')return bytes.length>=12&&ascii(bytes,0,4)==='RIFF'&&ascii(bytes,8,4)==='WEBP';
  return false;
}
async function collectBounded(content:AsyncIterable<Uint8Array>,maxBytes:number):Promise<Uint8Array>{
  const chunks:Uint8Array[]=[];let total=0;
  for await(const chunk of content){
    if(!(chunk instanceof Uint8Array))throw new Error('READINESS_INGEST_CHUNK_INVALID');
    if(chunk.byteLength===0)continue;
    total+=chunk.byteLength;
    if(total>maxBytes)throw new Error('READINESS_INGEST_CONTENT_TOO_LARGE');
    chunks.push(Uint8Array.from(chunk));
  }
  if(total===0)throw new Error('READINESS_INGEST_CONTENT_EMPTY');
  const out=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.byteLength;}
  return out;
}
async function* oneChunk(content:Uint8Array):AsyncGenerator<Uint8Array>{yield Uint8Array.from(content);}
async function withTimeout<T>(promise:Promise<T>,timeoutMs:number,code:string):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    return await Promise.race([
      promise,
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error(code)),timeoutMs);}),
    ]);
  }finally{if(timer!==undefined)clearTimeout(timer);}
}
function sameStoredObject(server:Readonly<{digestSha256:string;contentType:string;byteLength:number}>,stored:Readonly<{digestSha256:string;contentType:string;byteLength:number;objectRef:string}>):void{
  nonBlank(stored.objectRef,'READINESS_INGEST_OBJECT_REF_REQUIRED');
  if(!SHA256.test(stored.digestSha256)||stored.digestSha256!==server.digestSha256)throw new Error('READINESS_INGEST_OBJECT_DIGEST_DRIFT');
  if(normalizeContentType(stored.contentType)!==server.contentType)throw new Error('READINESS_INGEST_OBJECT_CONTENT_TYPE_DRIFT');
  if(stored.byteLength!==server.byteLength)throw new Error('READINESS_INGEST_OBJECT_LENGTH_DRIFT');
}

export class ReadinessEvidenceIngestionService {
  private readonly ingestionPolicy:Readonly<ReadinessEvidenceIngestionPolicy>;
  constructor(
    private readonly executor:CapitalReadinessSqlExecutor,
    private readonly objectStore:ReadinessEvidenceObjectStorePort,
    private readonly scanner:ReadinessEvidenceContentScannerPort,
    ingestionPolicy:ReadinessEvidenceIngestionPolicy,
  ){
    this.ingestionPolicy=policy(ingestionPolicy);
  }

  private async cleanupUnreferenced(stored:ValidatedEvidenceObject|undefined,digestSha256:string):Promise<void>{
    if(!stored?.objectRef?.trim())return;
    try{await this.objectStore.deleteIfUnreferenced({objectRef:stored.objectRef,digestSha256});}catch{/* preserve the primary ingestion/persistence error */}
  }

  async ingestAndSubmit(input:IngestReadinessGapEvidenceInput):Promise<ReadinessEvidenceIngestionResult>{
    input.authority.require(READINESS_EVIDENCE_SUBMIT_PERMISSION);
    if(input.authority.tenantId!==input.gap.tenantId)throw new Error('READINESS_INGEST_AUTHORITY_TENANT_MISMATCH');
    nonBlank(input.authority.actorId,'READINESS_INGEST_AUTHORITY_ACTOR_REQUIRED');
    if(input.gap.state!=='OPEN'&&input.gap.state!=='IN_REMEDIATION')throw new Error('READINESS_INGEST_GAP_STATE_INVALID');
    const assessmentId=nonBlank(input.assessmentId,'READINESS_INGEST_ASSESSMENT_REQUIRED');
    const evidenceRole=nonBlank(input.evidenceRole,'READINESS_INGEST_EVIDENCE_ROLE_REQUIRED');
    if(!input.gap.requiredEvidenceRoles.includes(evidenceRole))throw new Error('READINESS_INGEST_EVIDENCE_ROLE_NOT_REQUIRED');
    const contentType=normalizeContentType(input.declaredContentType);
    if(!this.ingestionPolicy.allowedContentTypes.includes(contentType as SupportedReadinessEvidenceContentType))throw new Error('READINESS_INGEST_CONTENT_TYPE_NOT_ALLOWED');
    if(!IDEMPOTENCY.test(input.idempotencyKey))throw new Error('READINESS_INGEST_IDEMPOTENCY_KEY_INVALID');
    const idempotencyKey=input.idempotencyKey;
    const correlationId=nonBlank(input.correlationId,'READINESS_INGEST_CORRELATION_REQUIRED');
    const submittedAt=iso(input.submittedAt,'READINESS_INGEST_SUBMITTED_AT_INVALID');
    const transitionId=nonBlank(input.transitionId,'READINESS_INGEST_TRANSITION_ID_REQUIRED');

    const bytes=await collectBounded(input.content,this.ingestionPolicy.maxBytes);
    if(!signatureMatches(contentType,bytes))throw new Error('READINESS_INGEST_CONTENT_SIGNATURE_MISMATCH');
    const digestSha256=createHash('sha256').update(bytes).digest('hex');
    const byteLength=bytes.byteLength;
    const identity=JSON.stringify([input.gap.tenantId,input.gap.projectId,assessmentId,input.gap.assessmentVersion,input.gap.gapId,idempotencyKey]);
    const receiptId=deterministicUuid(identity);
    const evidenceRef=`readiness-evidence:${receiptId}`;

    const scan=await withTimeout(this.scanner.scan(Object.freeze({receiptId,contentType,digestSha256,byteLength,content:Uint8Array.from(bytes)})),this.ingestionPolicy.scannerTimeoutMs,'READINESS_INGEST_SCANNER_TIMEOUT');
    const scannerRef=nonBlank(scan.scannerRef,'READINESS_INGEST_SCANNER_REF_REQUIRED');
    if(scan.state!=='CLEAN')throw new Error(`READINESS_INGEST_SCAN_NOT_CLEAN:${scan.state}`);

    let stored:ValidatedEvidenceObject|undefined;
    try{
      stored=await this.objectStore.putImmutable(Object.freeze({
        tenantId:input.gap.tenantId,
        receiptId,
        contentType,
        expectedDigestSha256:digestSha256,
        expectedByteLength:byteLength,
        content:oneChunk(bytes),
      }));
      sameStoredObject({digestSha256,contentType,byteLength},stored);
    }catch(error){
      await this.cleanupUnreferenced(stored,digestSha256);
      throw error;
    }

    const receipt:ReadinessEvidenceReceipt=Object.freeze({
      receiptId,
      tenantId:input.gap.tenantId,
      projectId:input.gap.projectId,
      assessmentId,
      assessmentVersion:input.gap.assessmentVersion,
      gapId:input.gap.gapId,
      evidenceRef,
      objectRef:stored.objectRef,
      digestSha256,
      contentType,
      byteLength,
      evidenceRole,
      submittedByActorRef:input.authority.actorId,
      submittedAt,
      idempotencyKey,
      correlationId,
      state:'VALIDATED',
    });

    let persisted:ReadinessEvidenceReceipt;
    try{
      persisted=await registerAuthorizedReadinessEvidenceReceipt(this.executor,input.authority,receipt);
    }catch(error){
      await this.cleanupUnreferenced(stored,digestSha256);
      throw error;
    }

    // If submission fails, the canonical receipt remains intentionally durable.
    // A retry with the same idempotency key reuses the deterministic object and
    // receipt; referenced evidence is never deleted after canonical persistence.
    await submitAuthorizedReadinessGapEvidence(this.executor,input.authority,input.gap,Object.freeze({
      tenantId:input.gap.tenantId,
      projectId:input.gap.projectId,
      assessmentId,
      assessmentVersion:input.gap.assessmentVersion,
      gapId:input.gap.gapId,
      fromState:input.gap.state,
      evidenceRefs:Object.freeze([persisted.evidenceRef]),
      transitionId,
      at:submittedAt,
      ...(input.note?.trim()?{note:input.note.trim()}:{}),
    }));

    return Object.freeze({
      receipt:persisted,
      scannerRef,
      gapState:'EVIDENCE_SUBMITTED',
      autoResolved:false,
      canonicalMutation:'EVIDENCE_RECEIPT_AND_SUBMISSION_ONLY',
    });
  }
}

export const READINESS_EVIDENCE_INGESTION_BOUNDARY=Object.freeze({
  serverSideOnly:true,
  callerControlsActor:false,
  callerControlsTenant:false,
  callerControlsReceiptId:false,
  callerControlsEvidenceRef:false,
  callerControlsObjectRef:false,
  callerControlsDigest:false,
  callerControlsByteLength:false,
  rawContentPersistedInPostgres:false,
  initialMediaTypes:Object.freeze(['application/pdf','image/jpeg','image/png','image/webp']),
  contentSafetyScanRequired:true,
  autoResolution:false,
  browserRouteEnabled:false,
  storageProviderSelected:false,
  financialAuthority:false,
});
