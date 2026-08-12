export type KnowledgeAuthority='CANONICAL'|'TECHNICAL'|'EXPERIMENTAL'|'HISTORICAL';
export type KnowledgeLifecycle='DRAFT'|'PUBLISHED'|'DEPRECATED';
export type KnowledgeSourceKind='AGRONOMY_PROTOCOL'|'PRODUCT_CATALOG'|'DIAGNOSIS'|'PLAN'|'MONITORING'|'TECHNICAL_NOTE'|'HISTORICAL_RECORD';
export interface KnowledgeDocument { documentId:string; tenantId:string; title:string; authority:KnowledgeAuthority; sourceKind:KnowledgeSourceKind; lifecycle:KnowledgeLifecycle; createdAt:string; currentRevision:number; }
export interface KnowledgeRevision { documentId:string; tenantId:string; revision:number; canonicalText:string; contentSha256:string; createdAt:string; publishedAt?:string; }
export interface KnowledgeCandidate { document:KnowledgeDocument; revision:KnowledgeRevision; lexicalScore:number; }
export interface KnowledgeHit { evidenceId:string; documentId:string; revision:number; title:string; authority:KnowledgeAuthority; canonicalText:string; contentSha256:string; lexicalScore:number; }
export interface RetrievalQuery { tenantId:string; query:string; limit:number; authorities?:readonly KnowledgeAuthority[]; }
