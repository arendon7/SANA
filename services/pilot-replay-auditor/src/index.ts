export interface ReplayEventLike {
  eventId:string; tenantId:string; pilotId:string; sequence:number; eventType:string; payloadDigestSha256:string; occurredAt:string;
}
export interface ReplayAuditLike {
  pilotId:string; tenantId:string; status:'PASS'|'FAIL'; eventCount:number; replayDigestSha256:string; reasonCodes:readonly string[];
}
export type Sha256HexAsync=(canonical:string)=>Promise<string>;
const SHA256=/^[a-f0-9]{64}$/;
function assertDigest(value:string):string {if(!SHA256.test(value))throw new Error('INVALID_SHA256_DIGEST');return value;}
function canonicalEvent(event:ReplayEventLike):readonly [number,string,string,string]{
  return [event.sequence,event.eventId,event.eventType,event.payloadDigestSha256] as const;
}
export async function auditPilotReplay(tenantId:string,pilotId:string,events:readonly ReplayEventLike[],sha256:Sha256HexAsync):Promise<ReplayAuditLike>{
  const reasons:string[]=[]; const seenIds=new Set<string>(); let expected=1;
  const ordered=[...events].sort((a,b)=>a.sequence-b.sequence||a.eventId.localeCompare(b.eventId));
  for(const event of ordered){
    if(event.tenantId!==tenantId||event.pilotId!==pilotId) reasons.push('EVENT_SCOPE_MISMATCH');
    if(seenIds.has(event.eventId)) reasons.push('DUPLICATE_EVENT_ID'); else seenIds.add(event.eventId);
    if(!Number.isSafeInteger(event.sequence)||event.sequence<=0) reasons.push('INVALID_EVENT_SEQUENCE');
    if(event.sequence!==expected) reasons.push('NON_CONTIGUOUS_SEQUENCE');
    expected=event.sequence+1;
    if(!SHA256.test(event.payloadDigestSha256)) reasons.push('INVALID_PAYLOAD_DIGEST');
    if(!Number.isFinite(Date.parse(event.occurredAt))) reasons.push('INVALID_EVENT_TIME');
    if(!event.eventType.trim()) reasons.push('EVENT_TYPE_REQUIRED');
  }
  const replayDigestSha256=assertDigest(await sha256(JSON.stringify(ordered.map(canonicalEvent))));
  const uniqueReasons=[...new Set(reasons)].sort();
  return Object.freeze({pilotId,tenantId,status:uniqueReasons.length===0?'PASS':'FAIL',eventCount:ordered.length,replayDigestSha256,reasonCodes:Object.freeze(uniqueReasons)});
}
export function assertReplayMatches(expectedDigestSha256:string,audit:ReplayAuditLike):void{
  assertDigest(expectedDigestSha256); assertDigest(audit.replayDigestSha256);
  if(audit.status!=='PASS') throw new Error('REPLAY_AUDIT_FAILED');
  if(audit.replayDigestSha256!==expectedDigestSha256) throw new Error('REPLAY_DIGEST_MISMATCH');
}
