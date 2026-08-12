import type { CopilotInquiry, CopilotModelRequest, EvidenceBundle, EvidenceCandidate, ModelStructuredOutput } from './model.js';
export interface EvidenceSourcePort { collect(inquiry:CopilotInquiry):Promise<readonly EvidenceCandidate[]>; }
export interface EvidenceResolverPort { resolve(inquiry:CopilotInquiry,candidates:readonly EvidenceCandidate[],asOf:string):EvidenceBundle; }
export interface CopilotModelGateway { generate(request:CopilotModelRequest):Promise<ModelStructuredOutput>; }
export interface CopilotAuditPort { append(eventName:string,payload:Readonly<Record<string,unknown>>):Promise<void>; }
