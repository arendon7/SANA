import type { EvidenceBundle, EvidenceItem, EvidenceSourceKind, EvidenceFreshness } from '@agroway/copilot-knowledge-contracts';

export type EvidenceReviewState='UNREVIEWED'|'ACCEPTED_FOR_REVIEW'|'REJECTED'|'REFRESH_REQUIRED';
export type EvidenceHumanAction='ACCEPT_FOR_REVIEW'|'REJECT'|'REQUEST_REFRESH'|'LINK_EXCEPTION'|'ADD_NOTE';
export type DecisionSubjectKind='EVIDENCE'|'EXCEPTION'|'INVESTMENT_PROJECT'|'AGRONOMIC_DECISION'|'SUPPLY_DECISION'|'IMPACT_ASSERTION';

export interface ControlEvidenceRecord extends EvidenceItem {
  reviewState:EvidenceReviewState;
  linkedExceptionIds:readonly string[];
  canonicalMutated:false;
  localOnly:true;
}
export interface HumanEvidenceCommand {
  actorId:string;
  actorType:'HUMAN';
  action:EvidenceHumanAction;
  at:string;
  evidenceId:string;
  note:string;
  exceptionId?:string;
}
export interface DecisionLedgerEntry {
  entryId:string;
  tenantId:string;
  actorId:string;
  actorType:'HUMAN';
  subjectKind:DecisionSubjectKind;
  subjectRef:string;
  action:EvidenceHumanAction;
  evidenceIds:readonly string[];
  note:string;
  occurredAt:string;
  previousDigestSha256:string|null;
  entryDigestSha256:string;
  canonicalMutated:false;
  localOnly:true;
}
export interface AiEvidenceSynthesis {
  synthesisId:string;
  state:'DRAFT_SUGGESTION';
  authority:'ADVISORY_ONLY';
  summary:string;
  citedEvidenceIds:readonly string[];
  limitations:readonly string[];
}

const SHA256=/^[a-f0-9]{64}$/;
function assertIso(value:string):void{if(!Number.isFinite(Date.parse(value)))throw new Error('INVALID_ISO_DATETIME')}
function assertDigest(value:string,code='INVALID_SHA256'):void{if(!SHA256.test(value))throw new Error(code)}
function clone<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T}

export function validateEvidenceRecord(record:ControlEvidenceRecord):void{
  if(!record.evidenceId.trim())throw new Error('EVIDENCE_ID_REQUIRED');
  if(!record.sourceRef.trim()||!record.provenanceRef.trim())throw new Error('EVIDENCE_PROVENANCE_REQUIRED');
  assertDigest(record.sourceDigestSha256,'EVIDENCE_SOURCE_DIGEST_REQUIRED');
  if(record.observedAt)assertIso(record.observedAt);
  if(record.validAt)assertIso(record.validAt);
  if(record.accepted&&record.rejectionReason)throw new Error('ACCEPTED_EVIDENCE_CANNOT_HAVE_REJECTION_REASON');
  if(record.reviewState==='ACCEPTED_FOR_REVIEW'&&!record.accepted)throw new Error('REVIEW_ACCEPTANCE_REQUIRES_CANONICAL_ACCEPTED_EVIDENCE');
}
export function createControlEvidenceRecord(item:EvidenceItem):ControlEvidenceRecord{
  const record:ControlEvidenceRecord={...clone(item),reviewState:item.accepted?'UNREVIEWED':'REJECTED',linkedExceptionIds:[],canonicalMutated:false,localOnly:true};
  validateEvidenceRecord(record);return Object.freeze(record);
}
export function validateEvidenceBundle(bundle:EvidenceBundle,records:readonly ControlEvidenceRecord[]):void{
  assertIso(bundle.asOf);assertDigest(bundle.contextHashSha256,'CONTEXT_HASH_SHA256_REQUIRED');
  const ids=new Set(records.map(x=>x.evidenceId));
  for(const id of bundle.acceptedEvidenceIds)if(!ids.has(id))throw new Error('BUNDLE_ACCEPTED_EVIDENCE_NOT_FOUND');
  for(const id of bundle.rejectedEvidenceIds)if(!ids.has(id))throw new Error('BUNDLE_REJECTED_EVIDENCE_NOT_FOUND');
}
export function applyHumanEvidenceCommand(record:ControlEvidenceRecord,cmd:HumanEvidenceCommand):ControlEvidenceRecord{
  if(cmd.actorType!=='HUMAN'||!cmd.actorId.trim())throw new Error('HUMAN_ACTOR_REQUIRED');assertIso(cmd.at);
  if(cmd.evidenceId!==record.evidenceId)throw new Error('EVIDENCE_ID_MISMATCH');
  if(!cmd.note.trim())throw new Error('HUMAN_NOTE_REQUIRED');
  const next=clone(record) as ControlEvidenceRecord;
  if(cmd.action==='ACCEPT_FOR_REVIEW'){
    if(!record.accepted)throw new Error('REJECTED_CANONICAL_EVIDENCE_CANNOT_BE_ACCEPTED_FOR_REVIEW');
    if(record.freshness==='UNKNOWN')throw new Error('UNKNOWN_FRESHNESS_CANNOT_BE_ACCEPTED');
    next.reviewState='ACCEPTED_FOR_REVIEW';
  }else if(cmd.action==='REJECT')next.reviewState='REJECTED';
  else if(cmd.action==='REQUEST_REFRESH')next.reviewState='REFRESH_REQUIRED';
  else if(cmd.action==='LINK_EXCEPTION'){
    if(!cmd.exceptionId?.trim())throw new Error('EXCEPTION_ID_REQUIRED');
    if(!next.linkedExceptionIds.includes(cmd.exceptionId))next.linkedExceptionIds=[...next.linkedExceptionIds,cmd.exceptionId];
  }
  next.canonicalMutated=false;next.localOnly=true;validateEvidenceRecord(next);return Object.freeze(next);
}
export function validateAiEvidenceSynthesis(synthesis:AiEvidenceSynthesis,records:readonly ControlEvidenceRecord[]):void{
  if(synthesis.state!=='DRAFT_SUGGESTION'||synthesis.authority!=='ADVISORY_ONLY')throw new Error('AI_AUTHORITY_BOUNDARY_VIOLATION');
  const byId=new Map(records.map(x=>[x.evidenceId,x]));
  for(const id of synthesis.citedEvidenceIds){const e=byId.get(id);if(!e)throw new Error('AI_CITATION_EVIDENCE_NOT_FOUND');if(e.reviewState==='REJECTED')throw new Error('AI_CITATION_REJECTED_EVIDENCE_FORBIDDEN');}
}
export function validateDecisionLedgerEntry(entry:DecisionLedgerEntry,knownEvidenceIds:ReadonlySet<string>):void{
  if(entry.actorType!=='HUMAN'||!entry.actorId.trim())throw new Error('HUMAN_ACTOR_REQUIRED');
  assertIso(entry.occurredAt);if(!entry.note.trim())throw new Error('HUMAN_NOTE_REQUIRED');
  if(entry.previousDigestSha256!==null)assertDigest(entry.previousDigestSha256,'PREVIOUS_LEDGER_DIGEST_INVALID');
  assertDigest(entry.entryDigestSha256,'LEDGER_ENTRY_DIGEST_INVALID');
  for(const id of entry.evidenceIds)if(!knownEvidenceIds.has(id))throw new Error('LEDGER_EVIDENCE_NOT_FOUND');
  if(entry.canonicalMutated!==false||entry.localOnly!==true)throw new Error('ALPHA4_REVIEW_TRUST_BOUNDARY_VIOLATION');
}
export function appendHumanDecisionLedgerEntry(current:readonly DecisionLedgerEntry[],entry:DecisionLedgerEntry,knownEvidenceIds:ReadonlySet<string>):readonly DecisionLedgerEntry[]{
  validateDecisionLedgerEntry(entry,knownEvidenceIds);const prev=current.at(-1)?.entryDigestSha256??null;if(entry.previousDigestSha256!==prev)throw new Error('LEDGER_HASH_CHAIN_MISMATCH');return Object.freeze([...current,Object.freeze(clone(entry))]);
}
export function evidenceSourceLabel(kind:EvidenceSourceKind):string{return kind.replaceAll('_',' ')}
export function freshnessRank(value:EvidenceFreshness):number{return value==='FRESH'?0:value==='STALE'?1:2}
