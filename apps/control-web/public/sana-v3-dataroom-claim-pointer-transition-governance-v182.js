(() => {
  'use strict';

  const VERSION='V182';
  const SCHEMA='SANA_DATAROOM_CLAIM_POINTER_TRANSITION_GOVERNANCE_REFERENCE_V1';
  const STATE='GOVERNANCE_REFERENCE_ONLY';
  const AUTHORITY=Object.freeze({claimTruthAuthority:false,governanceCaseReferenceAuthority:false,dispositionReferenceAuthority:false,reviewRoundReferenceAuthority:false,governanceAuthority:false,transitionAuthorizationAuthority:false,transitionApprovalAuthority:false,complianceAuthority:false,legalEffectAuthority:false,supersessionAuthority:false,chronologyAuthority:false,evidenceAcceptanceAuthority:false,evidentiarySufficiencyAuthority:false,findingResolutionAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,financingApprovalAuthority:false,decisionAuthority:false,canonicalMutationAvailable:false,financialMutationAvailable:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='GOVERNANCE_REFERENCE ≠ VERIFIED_GOVERNANCE_CASE ≠ AUTHORIZATION · DISPOSITION_REFERENCE ≠ VERIFIED_OR_VALID_DISPOSITION · COMPLETE_TRANSITION_REFERENCE_COVERAGE ≠ ADEQUATE_GOVERNANCE ≠ COMPLIANCE · POINTER_PREDECESSOR_RELATION ≠ LEGAL_SUPERSESSION · GOVERNANCE_REFERENCE ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ FINANCING_APPROVAL ≠ INVESTMENT_DECISION · ZERO_BASELINE_RECORDS · REFERENCE_ONLY · COUNTS_ONLY ≠ SCORE · NO_STORAGE_WRITE · NO_NETWORK · NO_FINANCIAL_MUTATION';

  function deepFreeze(value,seen=new WeakSet()){if(!value||typeof value!=='object'||seen.has(value))return value;seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value)}
  function text(v){return v==null?'':String(v).trim()}
  function uniq(values){return [...new Set((Array.isArray(values)?values:[]).map(text).filter(Boolean))].sort()}
  function normalize(raw,index){
    if(!raw||typeof raw!=='object')return {valid:false,index,reason:'RECORD_NOT_OBJECT'};
    const governanceRef=text(raw.governanceRef),claimId=text(raw.claimId),claimEnvelopeRef=text(raw.claimEnvelopeRef),predecessorPointerRef=text(raw.predecessorPointerRef),successorPointerRef=text(raw.successorPointerRef),governanceCaseRef=text(raw.governanceCaseRef),governanceState=text(raw.governanceState);
    if(!governanceRef)return {valid:false,index,reason:'GOVERNANCE_REF_REQUIRED'};
    if(!claimId)return {valid:false,index,reason:'CLAIM_ID_REQUIRED'};
    if(!claimEnvelopeRef)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_REQUIRED'};
    if(claimEnvelopeRef!==`ENV::${claimId}`)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_MISMATCH'};
    if(!predecessorPointerRef)return {valid:false,index,reason:'PREDECESSOR_POINTER_REF_REQUIRED'};
    if(!successorPointerRef)return {valid:false,index,reason:'SUCCESSOR_POINTER_REF_REQUIRED'};
    if(predecessorPointerRef===successorPointerRef)return {valid:false,index,reason:'SELF_POINTER_TRANSITION_NOT_ALLOWED'};
    if(!governanceCaseRef)return {valid:false,index,reason:'GOVERNANCE_CASE_REF_REQUIRED'};
    if(governanceState!==STATE)return {valid:false,index,reason:'GOVERNANCE_REFERENCE_STATE_NOT_ALLOWED'};
    return {valid:true,index,record:deepFreeze({schema:SCHEMA,version:VERSION,governanceRef,claimId,claimEnvelopeRef,predecessorPointerRef,successorPointerRef,governanceCaseRef,dispositionRef:text(raw.dispositionRef)||null,reviewRoundRef:text(raw.reviewRoundRef)||null,locatorKeys:Object.freeze(uniq(raw.locatorKeys)),lotId:text(raw.lotId)||null,observedAt:text(raw.observedAt)||null,governanceState,provenance:text(raw.provenance)||'EXPLICIT_REFERENCE_INPUT',referenceOnly:true,governanceCaseReferenceVerified:false,dispositionReferenceVerified:false,reviewRoundReferenceVerified:false,reviewerIdentityVerified:false,transitionAuthorized:false,transitionApproved:false,complianceDetermined:false,legalEffectDetermined:false,supersessionAuthority:false,chronologyDetermined:false,claimTruthVerified:false,evidenceAccepted:false,evidentiarySufficiencyDetermined:false,findingResolved:false,dueDiligenceApproved:false,eligible:false,financingApproved:false,decisionAuthority:false,authority:AUTHORITY,integrity:INTEGRITY})};
  }
  function create(records=[]){
    const input=Array.isArray(records)?records:[],accepted=[],rejected=[];input.forEach((raw,index)=>{const r=normalize(raw,index);if(r.valid)accepted.push(r.record);else rejected.push(Object.freeze({index:r.index,reason:r.reason}))});
    const dupRefs=new Set(),seenRefs=new Set(),transitionCounts=new Map();for(const r of accepted){if(seenRefs.has(r.governanceRef))dupRefs.add(r.governanceRef);seenRefs.add(r.governanceRef);const key=`${r.claimEnvelopeRef}::${r.predecessorPointerRef}->${r.successorPointerRef}`;transitionCounts.set(key,(transitionCounts.get(key)||0)+1)}
    const dupTransitions=new Set([...transitionCounts.entries()].filter(([,n])=>n>1).map(([k])=>k));let finalRecords=accepted.filter(r=>!dupRefs.has(r.governanceRef)&&!dupTransitions.has(`${r.claimEnvelopeRef}::${r.predecessorPointerRef}->${r.successorPointerRef}`));for(const ref of dupRefs)rejected.push(Object.freeze({index:null,reason:'DUPLICATE_GOVERNANCE_REF',governanceRef:ref}));for(const key of dupTransitions)rejected.push(Object.freeze({index:null,reason:'DUPLICATE_TRANSITION_GOVERNANCE_REFERENCE',transitionKey:key}));
    finalRecords=Object.freeze(finalRecords);const rejectedFrozen=Object.freeze(rejected);
    function forClaim(claimId){const id=text(claimId);return Object.freeze(finalRecords.filter(r=>r.claimId===id))}
    function summary(){return deepFreeze({schema:SCHEMA,version:VERSION,records:finalRecords.length,rejected:rejectedFrozen.length,governanceReferences:finalRecords.length,verifiedGovernanceCases:0,verifiedDispositions:0,transitionAuthorizations:0,transitionApprovals:0,complianceDeterminations:0,legalEffectDeterminations:0,dueDiligenceApprovals:0,eligibilityDecisions:0,financingApprovals:0,decisionAuthority:0,semantics:'GOVERNANCE_REFERENCE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_RATIO · NOT_SCORE'})}
    return deepFreeze({schema:SCHEMA,version:VERSION,state:STATE,records:()=>finalRecords,forClaim,diagnostics:()=>rejectedFrozen,summary,authority:AUTHORITY,integrity:INTEGRITY});
  }
  const factory=deepFreeze({schema:SCHEMA,version:VERSION,state:STATE,create,authority:AUTHORITY,integrity:INTEGRITY});const baseline=create([]);
  if(typeof window!=='undefined'){window.__SANA_DATAROOM_CLAIM_POINTER_TRANSITION_GOVERNANCE_V182_FACTORY__=factory;if(!window.__SANA_DATAROOM_CLAIM_POINTER_TRANSITION_GOVERNANCE__)window.__SANA_DATAROOM_CLAIM_POINTER_TRANSITION_GOVERNANCE__=baseline;}
  if(typeof globalThis!=='undefined'){globalThis.__SANA_DATAROOM_CLAIM_POINTER_TRANSITION_GOVERNANCE_V182_FACTORY__=factory;if(!globalThis.__SANA_DATAROOM_CLAIM_POINTER_TRANSITION_GOVERNANCE__)globalThis.__SANA_DATAROOM_CLAIM_POINTER_TRANSITION_GOVERNANCE__=baseline;}
})();