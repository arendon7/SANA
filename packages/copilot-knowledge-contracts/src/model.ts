export type UUID=string; export type ISODateTime=string; export type CopilotMode='READ'|'EXPLAIN'|'COMPARE'|'DRAFT'; export type CopilotResponseStatus='COMPLETE'|'PARTIAL'|'REFUSED';
export type EvidenceSourceKind='CONTROL_TOWER_SNAPSHOT'|'KNOWLEDGE_DOCUMENT'|'CANONICAL_EXTERNAL_FACT'|'AGRONOMIC_ALERT'|'INVESTMENT_PROJECT'|'INVESTMENT_BUDGET'|'INVESTMENT_RISK'|'IMPACT_SNAPSHOT'|'DEMAND_WINDOW';
export type EvidenceFreshness='FRESH'|'STALE'|'UNKNOWN'; export type DraftSuggestionKind='INVESTMENT_MEMO'|'AGRONOMIC_ACTION'|'PORTFOLIO_REVIEW'|'SUPPLY_ACTION'|'COMMERCIAL_PLAN';
export interface CopilotInquiry { requestId:UUID; tenantId:UUID; actorId:UUID; mode:CopilotMode; question:string; subjectRefs:readonly string[]; requestedAt:ISODateTime; maxEvidenceAgeSeconds?:number; }
export interface EvidenceCandidate { evidenceId:string; tenantId:UUID; sourceKind:EvidenceSourceKind; sourceRef:string; observedAt?:ISODateTime; validAt?:ISODateTime; title:string; canonicalText:string; provenanceRef:string; sourceDigestSha256:string; }
export interface EvidenceItem extends EvidenceCandidate { freshness:EvidenceFreshness; accepted:boolean; rejectionReason?:string; }
export interface EvidenceBundle { bundleId:string; tenantId:UUID; requestId:UUID; asOf:ISODateTime; contextHashSha256:string; items:readonly EvidenceItem[]; acceptedEvidenceIds:readonly string[]; rejectedEvidenceIds:readonly string[]; }
export interface AuthorityDecision { allowed:boolean; reasonCodes:readonly string[]; evaluatedAt:ISODateTime; }
export interface CopilotCitation { evidenceId:string; sourceKind:EvidenceSourceKind; sourceRef:string; provenanceRef:string; }
export interface DraftSuggestion { suggestionId:string; kind:DraftSuggestionKind; state:'DRAFT_SUGGESTION'; title:string; body:string; proposedActions:readonly string[]; requiresHumanApproval:true; }
export interface CopilotResponse { responseId:string; requestId:UUID; tenantId:UUID; status:CopilotResponseStatus; answer:string; citations:readonly CopilotCitation[]; limitations:readonly string[]; contextHashSha256?:string; draftSuggestion?:DraftSuggestion; createdAt:ISODateTime; }
export interface ModelStructuredOutput { answer:string; citedEvidenceIds:readonly string[]; limitations:readonly string[]; draftSuggestion?:{kind:DraftSuggestionKind;title:string;body:string;proposedActions:readonly string[]}; }
export interface CopilotModelRequest { requestId:UUID; tenantId:UUID; mode:CopilotMode; prompt:string; idempotencyKey:string; contextHashSha256:string; evidenceIds:readonly string[]; }
