import type {KnowledgeHit} from '@agroway/knowledge-registry';
export type CopilotMode='READ'|'EXPLAIN'|'COMPARE'|'DRAFT';export type CanonicalAgronomySource='DIAGNOSIS'|'PLAN'|'MONITORING'|'CATALOG';
export interface CanonicalAgronomyFact {factId:string;tenantId:string;source:CanonicalAgronomySource;canonicalText:string;provenanceRef:string;sourceDigestSha256:string;}
export interface CopilotInquiry {requestId:string;tenantId:string;actorId:string;mode:CopilotMode;question:string;requestedAt:string;}
export interface CopilotContext {canonicalFacts:readonly CanonicalAgronomyFact[];knowledge:readonly KnowledgeHit[];contextHashSha256:string;}
export interface DraftSuggestion {state:'DRAFT_SUGGESTION';requiresHumanApproval:true;title:string;body:string;}
export interface CopilotResponse {status:'COMPLETE'|'DENIED';answer:string;citations:readonly string[];contextHashSha256:string;draftSuggestion?:DraftSuggestion;}
export interface DigestPort {sha256(text:string):string;}
