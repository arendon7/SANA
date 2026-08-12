import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';

export const CONTROL_EXTERNAL_ACK_PROTOCOL='AGROWAY_CONTROL_ACK_V1' as const;
export type ControlExternalAckOutcome='ACCEPTED'|'REJECTED';
export type ControlSubmissionDestination='FUTURE_DOMAIN_ADAPTER'|'FIELD_OPERATION_ADAPTER'|'FINANCE_ADAPTER'|'SUPPLY_ADAPTER';

export interface AckPendingSubmissionPacket {
  packetId:string;
  tenantId:string;
  proposalId:string;
  projectId?:string;
  destination:ControlSubmissionDestination;
  state:'ACK_PENDING';
  idempotencyKey:string;
  packetDigestSha256:string;
  exportedAt:string;
  executionState:'NOT_EXECUTED';
  canonicalMutated:false;
}

export interface ExternalAckRequestEnvelope {
  protocol:typeof CONTROL_EXTERNAL_ACK_PROTOCOL;
  requestId:string;
  tenantId:string;
  packetId:string;
  proposalId:string;
  projectId:string|null;
  destination:ControlSubmissionDestination;
  idempotencyKey:string;
  packetDigestSha256:string;
  sentAt:string;
  responseNonce:string;
  requestDigestSha256:string;
}

export interface ExternalAckProviderResponse {
  protocol:typeof CONTROL_EXTERNAL_ACK_PROTOCOL;
  providerId:string;
  providerKeyId:string;
  requestId:string;
  tenantId:string;
  packetId:string;
  idempotencyKey:string;
  packetDigestSha256:string;
  requestDigestSha256:string;
  outcome:ControlExternalAckOutcome;
  externalReference:string;
  acknowledgedAt:string;
  responseNonce:string;
  signatureBase64Url:string;
}

export interface ExternalAckVerificationKey {
  keyId:string;
  algorithm:'Ed25519';
  publicKeyPem:string;
}

export interface ExternalAckProviderConfig {
  providerId:string;
  endpoint:string;
  timeoutMs:number;
  maxResponseBytes:number;
  maxAckAgeMs:number;
  clockSkewMs:number;
  verificationKeys:readonly ExternalAckVerificationKey[];
  bearerToken?:string;
}

export interface VerifiedExternalAckReceipt {
  receiptId:string;
  tenantId:string;
  packetId:string;
  proposalId:string;
  projectId:string|null;
  destination:ControlSubmissionDestination;
  providerId:string;
  providerKeyId:string;
  requestId:string;
  idempotencyKey:string;
  packetDigestSha256:string;
  requestDigestSha256:string;
  ackReceiptDigestSha256:string;
  outcome:ControlExternalAckOutcome;
  externalReference:string;
  acknowledgedAt:string;
  receivedAt:string;
  verificationState:'VERIFIED_EXTERNAL_ACK';
  executionState:'NOT_EXECUTED';
  canonicalMutated:false;
}

export interface ExternalAckReceiptStore {
  get(tenantId:string,packetId:string):Promise<VerifiedExternalAckReceipt|undefined>;
  putIfAbsent(receipt:VerifiedExternalAckReceipt):Promise<{stored:true;receipt:VerifiedExternalAckReceipt}|{stored:false;existing:VerifiedExternalAckReceipt}>;
}

export interface ExternalAckTransport {
  exchange(envelope:ExternalAckRequestEnvelope):Promise<ExternalAckProviderResponse>;
}

export interface HttpHeadersLike { get(name:string):string|null; }
export interface HttpResponseLike { ok:boolean; status:number; headers:HttpHeadersLike; text():Promise<string>; }
export type HttpFetchLike=(input:string,init:{method:'POST';headers:Readonly<Record<string,string>>;body:string;signal:unknown})=>Promise<HttpResponseLike>;

export interface ExternalAckSqlQueryResult<Row>{rows:Row[];rowCount:number|null;}
export interface ExternalAckSqlClientLike{query<Row=Record<string,unknown>>(text:string,values?:unknown[]):Promise<ExternalAckSqlQueryResult<Row>>;release():void;}
export interface ExternalAckSqlPoolLike{connect():Promise<ExternalAckSqlClientLike>;}

const SHA256=/^[a-f0-9]{64}$/;
const IDEMP=/^[A-Za-z0-9:_-]{16,160}$/;
const SAFE=/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const KEY_ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const BASE64URL=/^[A-Za-z0-9_-]{80,128}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sha256(input:string):string{return createHash('sha256').update(input).digest('hex');}
function assertSafe(value:string,code:string):void{if(!SAFE.test(value))throw new Error(code);}
function assertDigest(value:string,code:string):void{if(!SHA256.test(value))throw new Error(code);}
function assertIso(value:string,code:string):number{const parsed=Date.parse(value);if(!Number.isFinite(parsed))throw new Error(code);return parsed;}
function assertUuidTenant(value:string):void{if(!UUID.test(value))throw new Error('EXTERNAL_ACK_POSTGRES_TENANT_UUID_REQUIRED');}
function assertOutcome(value:string):asserts value is ControlExternalAckOutcome{if(value!=='ACCEPTED'&&value!=='REJECTED')throw new Error('EXTERNAL_ACK_OUTCOME_INVALID');}
function assertDestination(value:string):asserts value is ControlSubmissionDestination{if(!['FUTURE_DOMAIN_ADAPTER','FIELD_OPERATION_ADAPTER','FINANCE_ADAPTER','SUPPLY_ADAPTER'].includes(value))throw new Error('EXTERNAL_ACK_DESTINATION_INVALID');}

export function canonicalExternalAckRequestFrame(input:Omit<ExternalAckRequestEnvelope,'requestDigestSha256'>):string{
  return JSON.stringify([input.protocol,input.requestId,input.tenantId,input.packetId,input.proposalId,input.projectId,input.destination,input.idempotencyKey,input.packetDigestSha256,input.sentAt,input.responseNonce]);
}

export function canonicalExternalAckSignatureFrame(input:Omit<ExternalAckProviderResponse,'signatureBase64Url'>):string{
  return JSON.stringify([input.protocol,input.providerId,input.providerKeyId,input.requestId,input.tenantId,input.packetId,input.idempotencyKey,input.packetDigestSha256,input.requestDigestSha256,input.outcome,input.externalReference,input.acknowledgedAt,input.responseNonce]);
}

function decodeBase64Url(value:string):Uint8Array{
  if(!BASE64URL.test(value))throw new Error('EXTERNAL_ACK_SIGNATURE_ENCODING_INVALID');
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/');
  const padded=normalized+'='.repeat((4-normalized.length%4)%4);
  const decoder=(globalThis as unknown as {atob?:(v:string)=>string}).atob;
  if(!decoder)throw new Error('EXTERNAL_ACK_BASE64_DECODER_UNAVAILABLE');
  const binary=decoder(padded);
  const out=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
  return out;
}

function randomNonce():string{
  const cryptoApi=(globalThis as unknown as {crypto?:{getRandomValues:(x:Uint8Array)=>Uint8Array}}).crypto;
  if(!cryptoApi)throw new Error('EXTERNAL_ACK_SECURE_RANDOM_UNAVAILABLE');
  const bytes=cryptoApi.getRandomValues(new Uint8Array(24));
  return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}

export function validateExternalAckProviderConfig(config:ExternalAckProviderConfig):void{
  assertSafe(config.providerId,'EXTERNAL_ACK_PROVIDER_ID_INVALID');
  let endpoint:URL;
  try{endpoint=new URL(config.endpoint);}catch{throw new Error('EXTERNAL_ACK_ENDPOINT_INVALID');}
  if(endpoint.protocol!=='https:')throw new Error('EXTERNAL_ACK_HTTPS_REQUIRED');
  if(endpoint.username||endpoint.password)throw new Error('EXTERNAL_ACK_ENDPOINT_CREDENTIALS_FORBIDDEN');
  const host=endpoint.hostname.toLowerCase();
  if(host==='localhost'||host==='127.0.0.1'||host==='::1')throw new Error('EXTERNAL_ACK_LOOPBACK_ENDPOINT_FORBIDDEN');
  if(!Number.isInteger(config.timeoutMs)||config.timeoutMs<250||config.timeoutMs>30000)throw new Error('EXTERNAL_ACK_TIMEOUT_INVALID');
  if(!Number.isInteger(config.maxResponseBytes)||config.maxResponseBytes<256||config.maxResponseBytes>65536)throw new Error('EXTERNAL_ACK_RESPONSE_LIMIT_INVALID');
  if(!Number.isInteger(config.maxAckAgeMs)||config.maxAckAgeMs<1000||config.maxAckAgeMs>86400000)throw new Error('EXTERNAL_ACK_MAX_AGE_INVALID');
  if(!Number.isInteger(config.clockSkewMs)||config.clockSkewMs<0||config.clockSkewMs>300000)throw new Error('EXTERNAL_ACK_CLOCK_SKEW_INVALID');
  if(!config.verificationKeys.length)throw new Error('EXTERNAL_ACK_VERIFICATION_KEY_REQUIRED');
  const ids=new Set<string>();
  for(const key of config.verificationKeys){
    if(!KEY_ID.test(key.keyId))throw new Error('EXTERNAL_ACK_KEY_ID_INVALID');
    if(ids.has(key.keyId))throw new Error('EXTERNAL_ACK_DUPLICATE_KEY_ID');
    ids.add(key.keyId);
    if(key.algorithm!=='Ed25519')throw new Error('EXTERNAL_ACK_ALGORITHM_FORBIDDEN');
    if(!key.publicKeyPem.includes('BEGIN PUBLIC KEY'))throw new Error('EXTERNAL_ACK_PUBLIC_KEY_INVALID');
  }
  if(config.bearerToken!==undefined&&config.bearerToken.length<16)throw new Error('EXTERNAL_ACK_BEARER_TOKEN_INVALID');
}

export function validateAckPendingSubmissionPacket(packet:AckPendingSubmissionPacket):void{
  assertSafe(packet.packetId,'EXTERNAL_ACK_PACKET_ID_INVALID');
  assertSafe(packet.tenantId,'EXTERNAL_ACK_TENANT_ID_INVALID');
  assertSafe(packet.proposalId,'EXTERNAL_ACK_PROPOSAL_ID_INVALID');
  if(packet.projectId!==undefined)assertSafe(packet.projectId,'EXTERNAL_ACK_PROJECT_ID_INVALID');
  assertDestination(packet.destination);
  if(packet.state!=='ACK_PENDING')throw new Error('EXTERNAL_ACK_REQUIRES_ACK_PENDING_PACKET');
  if(!IDEMP.test(packet.idempotencyKey))throw new Error('EXTERNAL_ACK_IDEMPOTENCY_KEY_INVALID');
  assertDigest(packet.packetDigestSha256,'EXTERNAL_ACK_PACKET_DIGEST_INVALID');
  assertIso(packet.exportedAt,'EXTERNAL_ACK_EXPORTED_AT_INVALID');
  if(packet.executionState!=='NOT_EXECUTED'||packet.canonicalMutated!==false)throw new Error('EXTERNAL_ACK_CANONICAL_EXECUTION_FORBIDDEN');
}

function parseExternalAckProviderResponse(value:unknown):ExternalAckProviderResponse{
  if(value===null||typeof value!=='object'||Array.isArray(value))throw new Error('EXTERNAL_ACK_RESPONSE_OBJECT_REQUIRED');
  const obj=value as Record<string,unknown>;
  const allowed=new Set(['protocol','providerId','providerKeyId','requestId','tenantId','packetId','idempotencyKey','packetDigestSha256','requestDigestSha256','outcome','externalReference','acknowledgedAt','responseNonce','signatureBase64Url']);
  if(Object.keys(obj).some(k=>!allowed.has(k)))throw new Error('EXTERNAL_ACK_RESPONSE_UNKNOWN_FIELD');
  for(const key of allowed)if(typeof obj[key]!=='string')throw new Error(`EXTERNAL_ACK_RESPONSE_FIELD_INVALID:${key}`);
  const outcome=obj.outcome as string;assertOutcome(outcome);
  return {
    protocol:obj.protocol as typeof CONTROL_EXTERNAL_ACK_PROTOCOL,
    providerId:obj.providerId as string,
    providerKeyId:obj.providerKeyId as string,
    requestId:obj.requestId as string,
    tenantId:obj.tenantId as string,
    packetId:obj.packetId as string,
    idempotencyKey:obj.idempotencyKey as string,
    packetDigestSha256:obj.packetDigestSha256 as string,
    requestDigestSha256:obj.requestDigestSha256 as string,
    outcome,
    externalReference:obj.externalReference as string,
    acknowledgedAt:obj.acknowledgedAt as string,
    responseNonce:obj.responseNonce as string,
    signatureBase64Url:obj.signatureBase64Url as string
  };
}

function resolveGlobalFetch():HttpFetchLike{
  const fetcher=(globalThis as unknown as {fetch?:HttpFetchLike}).fetch;
  if(!fetcher)throw new Error('EXTERNAL_ACK_FETCH_UNAVAILABLE');
  return fetcher.bind(globalThis) as HttpFetchLike;
}

export class HttpsExternalAckTransport implements ExternalAckTransport {
  constructor(private readonly config:ExternalAckProviderConfig,private readonly fetcher:HttpFetchLike=resolveGlobalFetch()){
    validateExternalAckProviderConfig(config);
  }
  async exchange(envelope:ExternalAckRequestEnvelope):Promise<ExternalAckProviderResponse>{
    const AbortCtor=(globalThis as unknown as {AbortController?:new()=>{signal:unknown;abort():void}}).AbortController;
    if(!AbortCtor)throw new Error('EXTERNAL_ACK_ABORT_CONTROLLER_UNAVAILABLE');
    const controller=new AbortCtor();
    const headers:Record<string,string>={
      'content-type':'application/json',
      'accept':'application/json',
      'x-agroway-ack-protocol':CONTROL_EXTERNAL_ACK_PROTOCOL,
      'x-agroway-request-digest':envelope.requestDigestSha256,
      'idempotency-key':envelope.idempotencyKey
    };
    if(this.config.bearerToken!==undefined)headers.authorization=`Bearer ${this.config.bearerToken}`;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('EXTERNAL_ACK_HTTP_TIMEOUT'));},this.config.timeoutMs);});
    try{
      const task=(async()=>{
        const response=await this.fetcher(this.config.endpoint,{method:'POST',headers,body:JSON.stringify(envelope),signal:controller.signal});
        if(!response.ok)throw new Error(`EXTERNAL_ACK_HTTP_STATUS_${response.status}`);
        const length=response.headers.get('content-length');
        if(length!==null&&Number(length)>this.config.maxResponseBytes)throw new Error('EXTERNAL_ACK_RESPONSE_TOO_LARGE');
        const text=await response.text();
        const byteLength=new TextEncoder().encode(text).byteLength;
        if(byteLength>this.config.maxResponseBytes)throw new Error('EXTERNAL_ACK_RESPONSE_TOO_LARGE');
        let parsed:unknown;
        try{parsed=JSON.parse(text);}catch{throw new Error('EXTERNAL_ACK_RESPONSE_JSON_INVALID');}
        return parseExternalAckProviderResponse(parsed);
      })();
      return await Promise.race([task,timeout]);
    }finally{if(timer!==undefined)clearTimeout(timer);}
  }
}

export function verifyExternalAckResponse(envelope:ExternalAckRequestEnvelope,response:ExternalAckProviderResponse,config:ExternalAckProviderConfig,receivedAt:string):VerifiedExternalAckReceipt{
  validateExternalAckProviderConfig(config);
  const receivedMs=assertIso(receivedAt,'EXTERNAL_ACK_RECEIVED_AT_INVALID');
  if(response.protocol!==CONTROL_EXTERNAL_ACK_PROTOCOL)throw new Error('EXTERNAL_ACK_PROTOCOL_MISMATCH');
  if(response.providerId!==config.providerId)throw new Error('EXTERNAL_ACK_PROVIDER_MISMATCH');
  if(response.requestId!==envelope.requestId)throw new Error('EXTERNAL_ACK_REQUEST_ID_MISMATCH');
  if(response.tenantId!==envelope.tenantId)throw new Error('EXTERNAL_ACK_TENANT_MISMATCH');
  if(response.packetId!==envelope.packetId)throw new Error('EXTERNAL_ACK_PACKET_MISMATCH');
  if(response.idempotencyKey!==envelope.idempotencyKey)throw new Error('EXTERNAL_ACK_IDEMPOTENCY_MISMATCH');
  if(response.packetDigestSha256!==envelope.packetDigestSha256)throw new Error('EXTERNAL_ACK_PACKET_DIGEST_MISMATCH');
  if(response.requestDigestSha256!==envelope.requestDigestSha256)throw new Error('EXTERNAL_ACK_REQUEST_DIGEST_MISMATCH');
  if(response.responseNonce!==envelope.responseNonce)throw new Error('EXTERNAL_ACK_NONCE_MISMATCH');
  assertOutcome(response.outcome);
  assertSafe(response.externalReference,'EXTERNAL_ACK_EXTERNAL_REFERENCE_INVALID');
  if(!KEY_ID.test(response.providerKeyId))throw new Error('EXTERNAL_ACK_KEY_ID_INVALID');
  assertDigest(response.packetDigestSha256,'EXTERNAL_ACK_PACKET_DIGEST_INVALID');
  assertDigest(response.requestDigestSha256,'EXTERNAL_ACK_REQUEST_DIGEST_INVALID');
  const ackMs=assertIso(response.acknowledgedAt,'EXTERNAL_ACK_ACKNOWLEDGED_AT_INVALID');
  const sentMs=assertIso(envelope.sentAt,'EXTERNAL_ACK_SENT_AT_INVALID');
  if(ackMs<sentMs-config.clockSkewMs)throw new Error('EXTERNAL_ACK_PRE_REQUEST_TIMESTAMP');
  if(ackMs>receivedMs+config.clockSkewMs)throw new Error('EXTERNAL_ACK_FUTURE_TIMESTAMP');
  if(receivedMs-ackMs>config.maxAckAgeMs+config.clockSkewMs)throw new Error('EXTERNAL_ACK_STALE');
  const key=config.verificationKeys.find(x=>x.keyId===response.providerKeyId);
  if(!key)throw new Error('EXTERNAL_ACK_UNKNOWN_KEY');
  const {signatureBase64Url,...unsigned}=response;
  const frame=canonicalExternalAckSignatureFrame(unsigned);
  let publicKey;
  try{publicKey=createPublicKey(key.publicKeyPem);}catch{throw new Error('EXTERNAL_ACK_PUBLIC_KEY_INVALID');}
  const signature=decodeBase64Url(signatureBase64Url);
  if(!verifySignature(null,new TextEncoder().encode(frame),publicKey,signature))throw new Error('EXTERNAL_ACK_SIGNATURE_INVALID');
  const ackReceiptDigestSha256=sha256(frame);
  const receiptId=`ack:${config.providerId}:${sha256(JSON.stringify([envelope.tenantId,envelope.packetId,envelope.idempotencyKey])).slice(0,40)}`;
  return Object.freeze({
    receiptId,tenantId:envelope.tenantId,packetId:envelope.packetId,proposalId:envelope.proposalId,projectId:envelope.projectId,destination:envelope.destination,
    providerId:config.providerId,providerKeyId:response.providerKeyId,requestId:envelope.requestId,idempotencyKey:envelope.idempotencyKey,
    packetDigestSha256:envelope.packetDigestSha256,requestDigestSha256:envelope.requestDigestSha256,ackReceiptDigestSha256,
    outcome:response.outcome,externalReference:response.externalReference,acknowledgedAt:response.acknowledgedAt,receivedAt,
    verificationState:'VERIFIED_EXTERNAL_ACK',executionState:'NOT_EXECUTED',canonicalMutated:false
  });
}

export class ControlExternalAckAdapter {
  constructor(
    private readonly transport:ExternalAckTransport,
    private readonly store:ExternalAckReceiptStore,
    private readonly config:ExternalAckProviderConfig,
    private readonly now:()=>Date=()=>new Date(),
    private readonly nonceFactory:()=>string=randomNonce
  ){validateExternalAckProviderConfig(config);}

  async submit(packet:AckPendingSubmissionPacket):Promise<{state:'ACK_RECORDED';receipt:VerifiedExternalAckReceipt;replayed:boolean}>{
    validateAckPendingSubmissionPacket(packet);
    const existing=await this.store.get(packet.tenantId,packet.packetId);
    if(existing){
      if(existing.idempotencyKey!==packet.idempotencyKey||existing.packetDigestSha256!==packet.packetDigestSha256||existing.providerId!==this.config.providerId)throw new Error('EXTERNAL_ACK_EXISTING_RECEIPT_CONFLICT');
      return {state:'ACK_RECORDED',receipt:existing,replayed:true};
    }
    const sentAt=this.now().toISOString();
    const responseNonce=this.nonceFactory();
    if(!/^[a-f0-9]{32,128}$/.test(responseNonce))throw new Error('EXTERNAL_ACK_NONCE_INVALID');
    const requestId=`ackreq_${sha256(JSON.stringify([packet.tenantId,packet.packetId,packet.idempotencyKey,packet.packetDigestSha256,sentAt,responseNonce])).slice(0,32)}`;
    const unsigned:Omit<ExternalAckRequestEnvelope,'requestDigestSha256'>={
      protocol:CONTROL_EXTERNAL_ACK_PROTOCOL,requestId,tenantId:packet.tenantId,packetId:packet.packetId,proposalId:packet.proposalId,projectId:packet.projectId??null,
      destination:packet.destination,idempotencyKey:packet.idempotencyKey,packetDigestSha256:packet.packetDigestSha256,sentAt,responseNonce
    };
    const envelope:Object=Object.freeze({...unsigned,requestDigestSha256:sha256(canonicalExternalAckRequestFrame(unsigned))});
    const response=await this.transport.exchange(envelope as ExternalAckRequestEnvelope);
    const receivedAt=this.now().toISOString();
    const receipt=verifyExternalAckResponse(envelope as ExternalAckRequestEnvelope,response,this.config,receivedAt);
    const persisted=await this.store.putIfAbsent(receipt);
    if(persisted.stored)return {state:'ACK_RECORDED',receipt:persisted.receipt,replayed:false};
    const winner=persisted.existing;
    if(winner.ackReceiptDigestSha256!==receipt.ackReceiptDigestSha256||winner.idempotencyKey!==receipt.idempotencyKey||winner.providerId!==receipt.providerId)throw new Error('EXTERNAL_ACK_CONCURRENT_RECEIPT_CONFLICT');
    return {state:'ACK_RECORDED',receipt:winner,replayed:true};
  }
}

interface ExternalAckReceiptRow {
  receipt_id:string;tenant_id:string;packet_id:string;proposal_id:string;project_id:string|null;destination:string;provider_id:string;provider_key_id:string;request_id:string;idempotency_key:string;
  packet_digest_sha256:string;request_digest_sha256:string;ack_receipt_digest_sha256:string;outcome:string;external_reference:string;acknowledged_at:string;received_at:string;verification_state:string;execution_state:string;canonical_mutated:boolean;
}

function hydrateReceipt(row:ExternalAckReceiptRow):VerifiedExternalAckReceipt{
  assertDestination(row.destination);assertOutcome(row.outcome);
  if(row.verification_state!=='VERIFIED_EXTERNAL_ACK'||row.execution_state!=='NOT_EXECUTED'||row.canonical_mutated!==false)throw new Error('EXTERNAL_ACK_DURABLE_RECEIPT_CORRUPT');
  return Object.freeze({receiptId:row.receipt_id,tenantId:row.tenant_id,packetId:row.packet_id,proposalId:row.proposal_id,projectId:row.project_id,destination:row.destination,providerId:row.provider_id,providerKeyId:row.provider_key_id,requestId:row.request_id,idempotencyKey:row.idempotency_key,packetDigestSha256:row.packet_digest_sha256,requestDigestSha256:row.request_digest_sha256,ackReceiptDigestSha256:row.ack_receipt_digest_sha256,outcome:row.outcome,externalReference:row.external_reference,acknowledgedAt:new Date(row.acknowledged_at).toISOString(),receivedAt:new Date(row.received_at).toISOString(),verificationState:'VERIFIED_EXTERNAL_ACK',executionState:'NOT_EXECUTED',canonicalMutated:false});
}

const RECEIPT_SELECT=`SELECT receipt_id,tenant_id::text AS tenant_id,packet_id,proposal_id,project_id,destination,provider_id,provider_key_id,request_id,idempotency_key,packet_digest_sha256,request_digest_sha256,ack_receipt_digest_sha256,outcome,external_reference,acknowledged_at::text AS acknowledged_at,received_at::text AS received_at,verification_state,execution_state,canonical_mutated FROM agroway_core.control_external_ack_receipt`;

export class PostgresExternalAckReceiptStore implements ExternalAckReceiptStore {
  constructor(private readonly pool:ExternalAckSqlPoolLike){}
  async get(tenantId:string,packetId:string):Promise<VerifiedExternalAckReceipt|undefined>{
    assertUuidTenant(tenantId);assertSafe(packetId,'EXTERNAL_ACK_PACKET_ID_INVALID');
    const client=await this.pool.connect();let begun=false;
    try{
      await client.query('BEGIN');begun=true;
      await client.query("SELECT set_config('app.tenant_id',$1,true)",[tenantId]);
      const result=await client.query<ExternalAckReceiptRow>(`${RECEIPT_SELECT} WHERE tenant_id=$1::uuid AND packet_id=$2 LIMIT 1`,[tenantId,packetId]);
      await client.query('COMMIT');begun=false;
      return result.rows[0]===undefined?undefined:hydrateReceipt(result.rows[0]);
    }catch(error){if(begun)await client.query('ROLLBACK').catch(()=>undefined);throw error;}finally{client.release();}
  }
  async putIfAbsent(receipt:VerifiedExternalAckReceipt):Promise<{stored:true;receipt:VerifiedExternalAckReceipt}|{stored:false;existing:VerifiedExternalAckReceipt}>{
    assertUuidTenant(receipt.tenantId);validatePersistedReceipt(receipt);
    const client=await this.pool.connect();let begun=false;
    try{
      await client.query('BEGIN');begun=true;
      await client.query("SELECT set_config('app.tenant_id',$1,true)",[receipt.tenantId]);
      const inserted=await client.query<ExternalAckReceiptRow>(`INSERT INTO agroway_core.control_external_ack_receipt(receipt_id,tenant_id,packet_id,proposal_id,project_id,destination,provider_id,provider_key_id,request_id,idempotency_key,packet_digest_sha256,request_digest_sha256,ack_receipt_digest_sha256,outcome,external_reference,acknowledged_at,received_at,verification_state,execution_state,canonical_mutated) VALUES($1,$2::uuid,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::timestamptz,$17::timestamptz,'VERIFIED_EXTERNAL_ACK','NOT_EXECUTED',false) ON CONFLICT(tenant_id,packet_id) DO NOTHING RETURNING receipt_id,tenant_id::text AS tenant_id,packet_id,proposal_id,project_id,destination,provider_id,provider_key_id,request_id,idempotency_key,packet_digest_sha256,request_digest_sha256,ack_receipt_digest_sha256,outcome,external_reference,acknowledged_at::text AS acknowledged_at,received_at::text AS received_at,verification_state,execution_state,canonical_mutated`,[
        receipt.receiptId,receipt.tenantId,receipt.packetId,receipt.proposalId,receipt.projectId,receipt.destination,receipt.providerId,receipt.providerKeyId,receipt.requestId,receipt.idempotencyKey,receipt.packetDigestSha256,receipt.requestDigestSha256,receipt.ackReceiptDigestSha256,receipt.outcome,receipt.externalReference,receipt.acknowledgedAt,receipt.receivedAt
      ]);
      if(inserted.rows[0]!==undefined){await client.query('COMMIT');begun=false;return {stored:true,receipt:hydrateReceipt(inserted.rows[0])};}
      const existing=await client.query<ExternalAckReceiptRow>(`${RECEIPT_SELECT} WHERE tenant_id=$1::uuid AND packet_id=$2 LIMIT 1`,[receipt.tenantId,receipt.packetId]);
      if(existing.rows[0]===undefined)throw new Error('EXTERNAL_ACK_RECEIPT_CONFLICT_WITHOUT_ROW');
      await client.query('COMMIT');begun=false;
      return {stored:false,existing:hydrateReceipt(existing.rows[0])};
    }catch(error){if(begun)await client.query('ROLLBACK').catch(()=>undefined);throw error;}finally{client.release();}
  }
}

function validatePersistedReceipt(receipt:VerifiedExternalAckReceipt):void{
  assertSafe(receipt.receiptId,'EXTERNAL_ACK_RECEIPT_ID_INVALID');assertSafe(receipt.packetId,'EXTERNAL_ACK_PACKET_ID_INVALID');assertSafe(receipt.proposalId,'EXTERNAL_ACK_PROPOSAL_ID_INVALID');
  if(receipt.projectId!==null)assertSafe(receipt.projectId,'EXTERNAL_ACK_PROJECT_ID_INVALID');assertDestination(receipt.destination);assertSafe(receipt.providerId,'EXTERNAL_ACK_PROVIDER_ID_INVALID');
  if(!KEY_ID.test(receipt.providerKeyId))throw new Error('EXTERNAL_ACK_KEY_ID_INVALID');assertSafe(receipt.requestId,'EXTERNAL_ACK_REQUEST_ID_INVALID');if(!IDEMP.test(receipt.idempotencyKey))throw new Error('EXTERNAL_ACK_IDEMPOTENCY_KEY_INVALID');
  assertDigest(receipt.packetDigestSha256,'EXTERNAL_ACK_PACKET_DIGEST_INVALID');assertDigest(receipt.requestDigestSha256,'EXTERNAL_ACK_REQUEST_DIGEST_INVALID');assertDigest(receipt.ackReceiptDigestSha256,'EXTERNAL_ACK_RECEIPT_DIGEST_INVALID');
  assertOutcome(receipt.outcome);assertSafe(receipt.externalReference,'EXTERNAL_ACK_EXTERNAL_REFERENCE_INVALID');assertIso(receipt.acknowledgedAt,'EXTERNAL_ACK_ACKNOWLEDGED_AT_INVALID');assertIso(receipt.receivedAt,'EXTERNAL_ACK_RECEIVED_AT_INVALID');
  if(receipt.verificationState!=='VERIFIED_EXTERNAL_ACK'||receipt.executionState!=='NOT_EXECUTED'||receipt.canonicalMutated!==false)throw new Error('EXTERNAL_ACK_DURABLE_RECEIPT_INVALID');
}
