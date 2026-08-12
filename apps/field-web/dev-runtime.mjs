import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEV_BACKEND_TRUST = 'LOCAL_DEV_BACKEND_NOT_PRODUCTION';
export const DEV_TENANT_ID = 'tenant-demo';
export const DEV_ACTOR_ID = 'actor-admin';
const ROLE_PERMISSION_CEILING = Object.freeze({
  OPERATOR:new Set(['field:execute','monitoring:create','supply:read']),
  AGRONOMIST:new Set(['field:execute','monitoring:create','supply:read','agronomy:approve']),
  VIEWER:new Set(['supply:read']),
  INVESTOR:new Set([]),
  ADMIN:new Set(['field:execute','monitoring:create','supply:read','identity:admin'])
});
const DEMO_SUBSCRIPTION = Object.freeze({tenantId:DEV_TENANT_ID,plan:'PRO',addOns:['PASSPORT','SENSORS'],status:'ACTIVE',seatLimit:8});
const DEMO_MEMBERSHIPS = Object.freeze([
  {actorId:'actor-admin',role:'ADMIN',active:true},
  {actorId:'actor-agro',role:'AGRONOMIST',active:true},
  {actorId:'actor-op',role:'OPERATOR',active:true},
  {actorId:'actor-view',role:'VIEWER',active:true}
]);
const CANONICAL = Object.freeze({
  version:'dev-canonical-v2',
  inventoryAvailable:{'inv-wg-liq-a':4},
  incidentVersions:{'humidity-n3':'incident-humidity-n3-v2'}
});
export function sha256Bytes(bytes){return createHash('sha256').update(bytes).digest('hex')}
export function sha256Json(value){return sha256Bytes(Buffer.from(JSON.stringify(value)))}
function parseIso(value){const n=Date.parse(value);if(!Number.isFinite(n))throw new Error('INVALID_ISO_DATETIME');return n}
function normalizeEmail(value){const email=String(value||'').trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('INVALID_INVITATION_EMAIL');return email}
function requireDemoScope(tenantId,actorId=DEV_ACTOR_ID){if(tenantId!==DEV_TENANT_ID)throw new Error('TENANT_SCOPE_MISMATCH');if(actorId!==DEV_ACTOR_ID)throw new Error('ACTOR_NOT_AUTHORIZED')}
export function blankDevState(){return {schema:'agroway.local-dev-backend.v1',trust:DEV_BACKEND_TRUST,invitations:[],exports:[],syncReceipts:[],syncAcks:[]}}
export class DevRuntimeStore {
  constructor(runtimeDir){this.runtimeDir=runtimeDir;this.statePath=path.join(runtimeDir,'dev-state.json');this.exportDir=path.join(runtimeDir,'exports');}
  async init(){await mkdir(this.exportDir,{recursive:true});try{const parsed=JSON.parse(await readFile(this.statePath,'utf8'));this.state={...blankDevState(),...parsed};}catch{this.state=blankDevState();await this.save();}return this}
  async save(){const tmp=`${this.statePath}.tmp`;await writeFile(tmp,JSON.stringify(this.state,null,2)+'\n');await rename(tmp,this.statePath)}
  async reset(){this.state=blankDevState();await this.save()}
  async createInvitation(input){requireDemoScope(input.tenantId,input.actorId);const createdAt=String(input.createdAt),expiresAt=String(input.expiresAt);parseIso(createdAt);if(parseIso(expiresAt)<=parseIso(createdAt))throw new Error('INVALID_INVITATION_EXPIRY');const role=String(input.role||'');const ceiling=ROLE_PERMISSION_CEILING[role];if(!ceiling)throw new Error('INVALID_INVITATION_ROLE');const grants=[...new Set(input.grantedPermissions||[])];if(grants.some(p=>!ceiling.has(p)))throw new Error('INVITATION_PERMISSION_EXCEEDS_ROLE');const pending=this.state.invitations.filter(x=>x.state==='PENDING').length;const active=DEMO_MEMBERSHIPS.filter(x=>x.active).length;if(active+pending>=DEMO_SUBSCRIPTION.seatLimit)throw new Error('SEAT_LIMIT_REACHED');const invitationId=String(input.invitationId||'');if(!invitationId)throw new Error('INVITATION_ID_REQUIRED');const existing=this.state.invitations.find(x=>x.invitationId===invitationId);if(existing)return {duplicate:true,invitation:existing};const invitation={tenantId:DEV_TENANT_ID,invitationId,email:normalizeEmail(input.email),role,grantedPermissions:grants,state:'PENDING',deliveryState:'NOT_SENT_DEV',createdAt,expiresAt,serverReceivedAt:new Date().toISOString(),trust:DEV_BACKEND_TRUST};this.state.invitations.unshift(invitation);await this.save();return {duplicate:false,invitation};}
  async createFullTenantExport(input){requireDemoScope(input.tenantId,input.actorId);if(input.scope!=='FULL_TENANT_DATA')throw new Error('EXPORT_SCOPE_REJECTED');if(!['JSON','CSV'].includes(input.format))throw new Error('EXPORT_FORMAT_REJECTED');parseIso(input.requestedAt);const exportRequestId=String(input.exportRequestId||'');if(!exportRequestId)throw new Error('EXPORT_REQUEST_ID_REQUIRED');const existing=this.state.exports.find(x=>x.exportRequestId===exportRequestId);if(existing)return {duplicate:true,request:existing};const requested={tenantId:DEV_TENANT_ID,exportRequestId,requestedByActorId:DEV_ACTOR_ID,format:input.format,scope:'FULL_TENANT_DATA',state:'PROCESSING',requestedAt:input.requestedAt,trust:DEV_BACKEND_TRUST};this.state.exports.unshift(requested);await this.save();const payload={schema:'agroway.full-tenant-export.dev.v1',provenance:DEV_BACKEND_TRUST,tenantId:DEV_TENANT_ID,generatedAt:new Date().toISOString(),canonicalVersion:CANONICAL.version,data:{memberships:DEMO_MEMBERSHIPS,subscription:DEMO_SUBSCRIPTION,invitations:this.state.invitations,syncAcks:this.state.syncAcks}};const bytes=Buffer.from(JSON.stringify(payload,null,2)+'\n');const digestSha256=sha256Bytes(bytes);const filename=`${exportRequestId}.json`;await writeFile(path.join(this.exportDir,filename),bytes);Object.assign(requested,{state:'READY',completedAt:new Date().toISOString(),objectRef:`/api/dev/exports/${encodeURIComponent(exportRequestId)}/download`,digestSha256,byteLength:bytes.length});await this.save();return {duplicate:false,request:requested};}
  exportById(id){return this.state.exports.find(x=>x.exportRequestId===id)}
  async exportBytes(id){const request=this.exportById(id);if(!request||request.state!=='READY')throw new Error('EXPORT_NOT_READY');return readFile(path.join(this.exportDir,`${id}.json`))}
  assessEnvelope(envelope){if(!envelope||typeof envelope!=='object')return {status:'REJECTED',code:'INVALID_ENVELOPE'};if(envelope.tenantId&&envelope.tenantId!==DEV_TENANT_ID)return {status:'REJECTED',code:'TENANT_SCOPE_MISMATCH'};try{parseIso(envelope.createdAt)}catch{return {status:'REJECTED',code:'INVALID_EVENT_TIME'}}if(envelope.kind==='LOCAL_INVENTORY_CONSUMPTION_RECORDED'){const available=CANONICAL.inventoryAvailable[envelope.inventoryLotId];if(Number.isFinite(available)&&Number(envelope.quantity)>available)return {status:'CONFLICT',code:'SERVER_REVALIDATION_REQUIRED',canonical:{available,unit:envelope.unit}};}if(envelope.kind==='LOCAL_MONITORING_INCIDENT_DECISION_RECORDED'&&envelope.decision==='RESOLVE_PENDING_CANONICAL_SYNC'){const current=CANONICAL.incidentVersions[envelope.incidentId||envelope.context?.incidentId];if(current&&envelope.baseCanonicalVersion&&current!==envelope.baseCanonicalVersion)return {status:'CONFLICT',code:'CANONICAL_VERSION_CHANGED',canonical:{version:current}};}return {status:'ACCEPTABLE',code:'READY_FOR_SERVER_SUBMISSION'};}
  async submitEnvelope({tenantId,actorId,idempotencyKey,envelope}){requireDemoScope(tenantId,actorId);if(!idempotencyKey||idempotencyKey!==`local-envelope:${envelope?.id}`)throw new Error('IDEMPOTENCY_KEY_MISMATCH');const prior=this.state.syncAcks.find(x=>x.idempotencyKey===idempotencyKey);if(prior)return {httpStatus:200,duplicate:true,ack:prior};const receivedAt=new Date().toISOString();const assessment=this.assessEnvelope(envelope);const receipt={receiptId:randomUUID(),tenantId:DEV_TENANT_ID,envelopeId:envelope?.id||null,idempotencyKey,eventTime:envelope?.createdAt||null,receivedAt,assessment:assessment.code,payloadSha256:sha256Json(envelope),trust:DEV_BACKEND_TRUST};this.state.syncReceipts.unshift(receipt);if(assessment.status!=='ACCEPTABLE'){await this.save();return {httpStatus:assessment.status==='CONFLICT'?409:422,duplicate:false,receipt,assessment};}const ack={ackId:randomUUID(),tenantId:DEV_TENANT_ID,envelopeId:envelope.id,idempotencyKey,eventTime:envelope.createdAt,receivedAt,state:'ACCEPTED',canonicalVersion:CANONICAL.version,payloadSha256:receipt.payloadSha256,ackSha256:null,trust:DEV_BACKEND_TRUST};ack.ackSha256=sha256Json({...ack,ackSha256:undefined});this.state.syncAcks.unshift(ack);await this.save();return {httpStatus:201,duplicate:false,ack};}
  status(){return {ok:true,trust:DEV_BACKEND_TRUST,tenantId:DEV_TENANT_ID,canonicalVersion:CANONICAL.version,persisted:{invitations:this.state.invitations.length,exports:this.state.exports.length,syncReceipts:this.state.syncReceipts.length,syncAcks:this.state.syncAcks.length}}}
}
