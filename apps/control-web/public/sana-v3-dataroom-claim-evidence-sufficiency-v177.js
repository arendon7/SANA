(() => {
  'use strict';

  const VERSION='V177';
  const SCHEMA='SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY_REVIEW_V1';
  const STATES=Object.freeze(['SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY','ADDITIONAL_EVIDENCE_REQUIRED_REFERENCE_ONLY']);
  const AUTHORITY=Object.freeze({claimTruthAuthority:false,reviewerIdentityAuthority:false,reviewerQualificationAuthority:false,reviewerIndependenceAuthority:false,evidentiarySufficiencyAuthority:false,externalVerificationAuthority:false,providerAccreditationAuthority:false,certificationAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,financingApprovalAuthority:false,investmentDecisionAuthority:false,financialMutationAvailable:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='SUFFICIENCY_REVIEW_REFERENCE ≠ CLAIM_TRUTH · SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE ≠ UNIVERSALLY_SUFFICIENT_EVIDENCE · ADDITIONAL_EVIDENCE_REQUIRED ≠ NEGATIVE_PROJECT_CONCLUSION · REVIEWER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_INDEPENDENCE · REVIEW_SCOPE_REFERENCE ≠ AUTHORITY_GRANTED · REVIEW_CONCLUSION ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ FINANCING_APPROVAL ≠ INVESTMENT_DECISION · ZERO_BASELINE_RECORDS · REFERENCE_ONLY · NO_STORAGE_WRITE · NO_NETWORK · NO_FINANCIAL_MUTATION';

  function deepFreeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);
  }
  function text(v){return v===undefined||v===null?'':String(v).trim()}
  function uniq(values){return [...new Set((Array.isArray(values)?values:[]).map(text).filter(Boolean))].sort()}
  function normalize(raw,index){
    if(!raw||typeof raw!=='object')return {valid:false,index,reason:'RECORD_NOT_OBJECT'};
    const reviewRef=text(raw.reviewRef),claimId=text(raw.claimId),claimEnvelopeRef=text(raw.claimEnvelopeRef),reviewState=text(raw.reviewState);
    if(!reviewRef)return {valid:false,index,reason:'REVIEW_REF_REQUIRED'};
    if(!claimId)return {valid:false,index,reason:'CLAIM_ID_REQUIRED'};
    if(!claimEnvelopeRef)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_REQUIRED'};
    if(claimEnvelopeRef!==`ENV::${claimId}`)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_MISMATCH'};
    if(!STATES.includes(reviewState))return {valid:false,index,reason:'EVIDENCE_SUFFICIENCY_REVIEW_STATE_NOT_ALLOWED'};
    return {valid:true,index,record:deepFreeze({schema:SCHEMA,version:VERSION,reviewRef,claimId,claimEnvelopeRef,locatorKeys:Object.freeze(uniq(raw.locatorKeys)),lotId:text(raw.lotId)||null,reviewerRef:text(raw.reviewerRef)||null,reviewCaseRef:text(raw.reviewCaseRef)||null,reviewScopeRef:text(raw.reviewScopeRef)||null,requestedEvidenceRefs:Object.freeze(uniq(raw.requestedEvidenceRefs)),observedAt:text(raw.observedAt)||null,reviewState,provenance:text(raw.provenance)||'EXPLICIT_REFERENCE_INPUT',referenceOnly:true,claimTruthVerified:false,reviewerIdentityVerified:false,reviewerQualificationVerified:false,reviewerIndependenceVerified:false,evidentiarySufficiencyDetermined:false,externalVerificationVerified:false,certificationValidityVerified:false,dueDiligenceApproved:false,eligible:false,financingApproved:false,decisionAuthority:false,authority:AUTHORITY,integrity:INTEGRITY})};
  }
  function create(records=[]){
    const input=Array.isArray(records)?records:[],accepted=[],rejected=[];
    input.forEach((raw,index)=>{const r=normalize(raw,index);if(r.valid)accepted.push(r.record);else rejected.push(Object.freeze({index:r.index,reason:r.reason}));});
    const duplicateRefs=new Set(),seen=new Set();for(const r of accepted){if(seen.has(r.reviewRef))duplicateRefs.add(r.reviewRef);seen.add(r.reviewRef)}
    const finalRecords=Object.freeze(accepted.filter(r=>!duplicateRefs.has(r.reviewRef)));for(const ref of duplicateRefs)rejected.push(Object.freeze({index:null,reason:'DUPLICATE_REVIEW_REF',reviewRef:ref}));
    const rejectedFrozen=Object.freeze(rejected);
    function forClaim(claimId){const id=text(claimId);return Object.freeze(finalRecords.filter(r=>r.claimId===id))}
    function summary(){const sufficient=finalRecords.filter(r=>r.reviewState==='SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY').length,additional=finalRecords.filter(r=>r.reviewState==='ADDITIONAL_EVIDENCE_REQUIRED_REFERENCE_ONLY').length;return deepFreeze({schema:SCHEMA,version:VERSION,records:finalRecords.length,rejected:rejectedFrozen.length,sufficientForDeclaredScopeReferences:sufficient,additionalEvidenceRequiredReferences:additional,claimTruthVerified:0,evidentiarySufficiencyDetermined:0,reviewerIdentityVerified:0,reviewerQualificationVerified:0,reviewerIndependenceVerified:0,dueDiligenceApprovals:0,eligibilityDecisions:0,financingApprovals:0,decisionAuthority:0,semantics:'REVIEW_REFERENCE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE'})}
    return deepFreeze({schema:SCHEMA,version:VERSION,states:STATES,records:()=>finalRecords,forClaim,diagnostics:()=>rejectedFrozen,summary,authority:AUTHORITY,integrity:INTEGRITY});
  }

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,states:STATES,create,authority:AUTHORITY,integrity:INTEGRITY});
  const baseline=create([]);
  if(typeof window!=='undefined'){
    window.__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY_V177_FACTORY__=factory;
    if(!window.__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY__)window.__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY__=baseline;
  }
  if(typeof globalThis!=='undefined'){
    globalThis.__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY_V177_FACTORY__=factory;
    if(!globalThis.__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY__)globalThis.__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY__=baseline;
  }
})();