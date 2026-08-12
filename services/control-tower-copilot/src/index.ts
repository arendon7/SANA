import type {
  CopilotAuditPort,
  CopilotCitation,
  CopilotInquiry,
  CopilotModelGateway,
  CopilotModelRequest,
  CopilotResponse,
  DraftSuggestion,
  EvidenceBundle,
  EvidenceResolverPort,
  EvidenceSourcePort,
  ModelStructuredOutput,
} from '@agroway/copilot-knowledge-contracts';

export interface CopilotClock { now():string; }
export interface CopilotIdFactory { next(prefix:'response'|'suggestion'):string; }

function validIso(value:string):string {
  if(!Number.isFinite(Date.parse(value))) throw new Error('INVALID_ISO_DATETIME');
  return value;
}
function acceptedCitationIds(bundle:EvidenceBundle):Set<string>{return new Set(bundle.acceptedEvidenceIds)}
function validateModelOutput(output:ModelStructuredOutput,bundle:EvidenceBundle):void {
  const accepted=acceptedCitationIds(bundle);
  if(output.citedEvidenceIds.some(id=>!accepted.has(id))) throw new Error('MODEL_CITED_UNACCEPTED_EVIDENCE');
  if(output.draftSuggestion&&(!output.draftSuggestion.title.trim()||!output.draftSuggestion.body.trim())) throw new Error('INVALID_DRAFT_SUGGESTION');
}
function citations(output:ModelStructuredOutput,bundle:EvidenceBundle):readonly CopilotCitation[] {
  const byId=new Map(bundle.items.map(item=>[item.evidenceId,item] as const));
  return output.citedEvidenceIds.map(id=>{
    const item=byId.get(id);
    if(!item||!item.accepted) throw new Error('CITATION_EVIDENCE_NOT_ACCEPTED');
    return Object.freeze({evidenceId:item.evidenceId,sourceKind:item.sourceKind,sourceRef:item.sourceRef,provenanceRef:item.provenanceRef});
  });
}
function draft(output:ModelStructuredOutput,ids:CopilotIdFactory):DraftSuggestion|undefined {
  const value=output.draftSuggestion;
  if(!value) return undefined;
  return Object.freeze({
    suggestionId:ids.next('suggestion'),kind:value.kind,state:'DRAFT_SUGGESTION',title:value.title.trim(),body:value.body.trim(),
    proposedActions:Object.freeze([...value.proposedActions]),requiresHumanApproval:true,
  });
}

export class ControlTowerCopilotService {
  constructor(
    private readonly evidenceSource:EvidenceSourcePort,
    private readonly resolver:EvidenceResolverPort,
    private readonly model:CopilotModelGateway,
    private readonly audit:CopilotAuditPort,
    private readonly clock:CopilotClock,
    private readonly ids:CopilotIdFactory,
  ){}
  async answer(inquiry:CopilotInquiry):Promise<CopilotResponse>{
    if(!inquiry.question.trim()) throw new Error('COPILOT_QUESTION_REQUIRED');
    const asOf=validIso(this.clock.now());
    await this.audit.append('CopilotInquiryRequested',{requestId:inquiry.requestId,tenantId:inquiry.tenantId,mode:inquiry.mode});
    const candidates=await this.evidenceSource.collect(inquiry);
    const bundle=this.resolver.resolve(inquiry,candidates,asOf);
    await this.audit.append('CopilotEvidenceBundleResolved',{requestId:inquiry.requestId,bundleId:bundle.bundleId,contextHashSha256:bundle.contextHashSha256,acceptedEvidenceIds:bundle.acceptedEvidenceIds,rejectedEvidenceIds:bundle.rejectedEvidenceIds});
    if(bundle.acceptedEvidenceIds.length===0){
      const response:CopilotResponse=Object.freeze({
        responseId:this.ids.next('response'),requestId:inquiry.requestId,tenantId:inquiry.tenantId,status:'REFUSED',answer:'No hay evidencia aceptada suficiente para responder con trazabilidad.',
        citations:Object.freeze([]),limitations:Object.freeze(['NO_ACCEPTED_EVIDENCE']),contextHashSha256:bundle.contextHashSha256,createdAt:asOf,
      });
      await this.audit.append('CopilotAuthorityDenied',{requestId:inquiry.requestId,reasonCodes:['NO_ACCEPTED_EVIDENCE']});
      return response;
    }
    const request:CopilotModelRequest=Object.freeze({
      requestId:inquiry.requestId,tenantId:inquiry.tenantId,mode:inquiry.mode,
      prompt:inquiry.question,idempotencyKey:`copilot:${inquiry.requestId}:${bundle.contextHashSha256}`,contextHashSha256:bundle.contextHashSha256,evidenceIds:bundle.acceptedEvidenceIds,
    });
    const output=await this.model.generate(request);
    validateModelOutput(output,bundle);
    const suggestion=draft(output,this.ids);
    const response:CopilotResponse=Object.freeze({
      responseId:this.ids.next('response'),requestId:inquiry.requestId,tenantId:inquiry.tenantId,status:'COMPLETE',
      answer:output.answer,citations:Object.freeze([...citations(output,bundle)]),limitations:Object.freeze([...output.limitations]),
      contextHashSha256:bundle.contextHashSha256,...(suggestion?{draftSuggestion:suggestion}:{}),createdAt:asOf,
    });
    await this.audit.append('CopilotResponseValidated',{requestId:inquiry.requestId,responseId:response.responseId,citationCount:response.citations.length,draftOnly:Boolean(response.draftSuggestion),requiresHumanApproval:response.draftSuggestion?.requiresHumanApproval??false});
    return response;
  }
}

export const COPILOT_AUTHORITY_BOUNDARY=Object.freeze({
  financialMutation:false,agronomicExecution:false,budgetApproval:false,capitalDeployment:false,certificateIssuance:false,
  suggestionState:'DRAFT_SUGGESTION' as const,requiresHumanApproval:true as const,
});
