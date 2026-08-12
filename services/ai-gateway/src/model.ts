export type AiMode='READ'|'EXPLAIN'|'COMPARE'|'DRAFT';
export interface ModelPolicy { policyId:string;tenantId:string;provider:string;model:string;enabled:boolean;allowedModes:readonly AiMode[];storeProviderData:false;structuredOutputs:boolean;maxOutputTokens:number; }
export interface GatewayRequest { requestId:string;tenantId:string;actorId:string;mode:AiMode;prompt:string;contextHashSha256:string;evidenceIds:readonly string[];idempotencyKey:string; }
export interface ProviderInput { model:string;prompt:string;maxOutputTokens:number;store:false;structuredOutputs:boolean; }
export interface ProviderOutput { outputText:string;citedEvidenceIds:readonly string[];draftSuggestion?:{title:string;body:string};providerRequestId?:string; }
export interface GatewayResult extends ProviderOutput { requestId:string;tenantId:string;provider:string;model:string; }
