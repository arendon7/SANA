import type {
  CopilotInquiry,
  EvidenceBundle,
  EvidenceCandidate,
  EvidenceFreshness,
  EvidenceItem,
  EvidenceResolverPort,
} from '@agroway/copilot-knowledge-contracts';

export type Sha256Hex=(canonical:string)=>string;
const SHA256=/^[a-f0-9]{64}$/;

function validIsoMs(value:string):number {
  const ms=Date.parse(value);
  if(!Number.isFinite(ms)) throw new Error('INVALID_ISO_DATETIME');
  return ms;
}
function assertDigest(value:string):string {
  if(!SHA256.test(value)) throw new Error('INVALID_SHA256_DIGEST');
  return value;
}
function freshness(candidate:EvidenceCandidate,inquiry:CopilotInquiry,asOfMs:number):EvidenceFreshness {
  const reference=candidate.validAt??candidate.observedAt;
  if(!reference||inquiry.maxEvidenceAgeSeconds===undefined) return reference?'FRESH':'UNKNOWN';
  const ageMs=asOfMs-validIsoMs(reference);
  if(ageMs<0) return 'UNKNOWN';
  return ageMs<=inquiry.maxEvidenceAgeSeconds*1000?'FRESH':'STALE';
}
function canonicalContext(inquiry:CopilotInquiry,items:readonly EvidenceItem[],asOf:string):string {
  return JSON.stringify({
    tenantId:inquiry.tenantId,requestId:inquiry.requestId,asOf,
    items:items.map(i=>[i.evidenceId,i.sourceKind,i.sourceRef,i.provenanceRef,i.sourceDigestSha256,i.freshness,i.accepted]),
  });
}

export class DeterministicEvidenceResolver implements EvidenceResolverPort {
  constructor(private readonly sha256:Sha256Hex){}
  resolve(inquiry:CopilotInquiry,candidates:readonly EvidenceCandidate[],asOf:string):EvidenceBundle {
    const asOfMs=validIsoMs(asOf);
    const seen=new Set<string>();
    const items:EvidenceItem[]=[...candidates]
      .sort((a,b)=>a.evidenceId.localeCompare(b.evidenceId))
      .map(candidate=>{
        if(candidate.tenantId!==inquiry.tenantId) return Object.freeze({...candidate,freshness:'UNKNOWN' as const,accepted:false,rejectionReason:'TENANT_SCOPE_MISMATCH'});
        if(seen.has(candidate.evidenceId)) return Object.freeze({...candidate,freshness:'UNKNOWN' as const,accepted:false,rejectionReason:'DUPLICATE_EVIDENCE_ID'});
        seen.add(candidate.evidenceId);
        if(!candidate.canonicalText.trim()) return Object.freeze({...candidate,freshness:'UNKNOWN' as const,accepted:false,rejectionReason:'EMPTY_CANONICAL_TEXT'});
        if(!candidate.provenanceRef.trim()) return Object.freeze({...candidate,freshness:'UNKNOWN' as const,accepted:false,rejectionReason:'MISSING_PROVENANCE'});
        try{assertDigest(candidate.sourceDigestSha256);}catch{return Object.freeze({...candidate,freshness:'UNKNOWN' as const,accepted:false,rejectionReason:'INVALID_SOURCE_DIGEST'});}
        const state=freshness(candidate,inquiry,asOfMs);
        if(state==='STALE') return Object.freeze({...candidate,freshness:state,accepted:false,rejectionReason:'STALE_EVIDENCE'});
        return Object.freeze({...candidate,freshness:state,accepted:true});
      });
    const contextHashSha256=assertDigest(this.sha256(canonicalContext(inquiry,items,asOf)));
    const acceptedEvidenceIds=items.filter(i=>i.accepted).map(i=>i.evidenceId);
    const rejectedEvidenceIds=items.filter(i=>!i.accepted).map(i=>i.evidenceId);
    return Object.freeze({
      bundleId:`evidence:${inquiry.requestId}:${contextHashSha256.slice(0,16)}`,tenantId:inquiry.tenantId,requestId:inquiry.requestId,asOf,
      contextHashSha256,items:Object.freeze(items),acceptedEvidenceIds:Object.freeze(acceptedEvidenceIds),rejectedEvidenceIds:Object.freeze(rejectedEvidenceIds),
    });
  }
}

export function assertProviderPayloadNotPersisted(value:unknown):void {
  if(value===null||typeof value!=='object') return;
  const forbidden=/^(raw|rawPayload|providerPayload|credentials|apiKey|authorization|token|secret)$/i;
  const stack:unknown[]=[value];
  while(stack.length){
    const current=stack.pop();
    if(!current||typeof current!=='object') continue;
    for(const [key,entry] of Object.entries(current as Record<string,unknown>)){
      if(forbidden.test(key)) throw new Error('RAW_PROVIDER_PAYLOAD_PERSISTENCE_FORBIDDEN');
      if(entry&&typeof entry==='object') stack.push(entry);
    }
  }
}
