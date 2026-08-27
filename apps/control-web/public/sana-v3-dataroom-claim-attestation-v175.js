(() => {
  'use strict';

  const VERSION='V175';
  const SCHEMA='SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1';
  const STATE='REFERENCE_ONLY';
  const AUTHORITY=Object.freeze({claimTruthAuthority:false,reviewerIdentityAuthority:false,reviewerQualificationAuthority:false,reviewerIndependenceAuthority:false,evidentiarySufficiencyAuthority:false,externalVerificationAuthority:false,certificationAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,investmentDecisionAuthority:false,financialMutationAvailable:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='ATTESTATION_REFERENCE ≠ CLAIM_TRUTH · REVIEWER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_INDEPENDENCE · LOCATOR_REFERENCE ≠ VERIFIED_EVIDENCE · ATTESTATION_REFERENCE ≠ EVIDENTIARY_SUFFICIENCY · ATTESTATION_REFERENCE ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION · ATTESTATION_REFERENCE ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ INVESTMENT_DECISION · REFERENCE_ONLY · ZERO_BASELINE_RECORDS · NO_STORAGE_WRITE · NO_NETWORK · NO_FINANCIAL_MUTATION';

  function deepFreeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);
  }
  function text(v){return v===undefined||v===null?'':String(v).trim()}
  function uniq(values){return [...new Set((Array.isArray(values)?values:[]).map(text).filter(Boolean))].sort()}
  function normalize(raw,index){
    if(!raw||typeof raw!=='object')return {valid:false,index,reason:'RECORD_NOT_OBJECT'};
    const attestationRef=text(raw.attestationRef),claimId=text(raw.claimId),claimEnvelopeRef=text(raw.claimEnvelopeRef),attestationState=text(raw.attestationState),lotId=text(raw.lotId)||null;
    if(!attestationRef)return {valid:false,index,reason:'ATTESTATION_REF_REQUIRED'};
    if(!claimId)return {valid:false,index,reason:'CLAIM_ID_REQUIRED'};
    if(!claimEnvelopeRef)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_REQUIRED'};
    if(claimEnvelopeRef!==`ENV::${claimId}`)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_MISMATCH'};
    if(attestationState!==STATE)return {valid:false,index,reason:'REFERENCE_ONLY_STATE_REQUIRED'};
    return {valid:true,index,record:deepFreeze({schema:SCHEMA,version:VERSION,attestationRef,claimId,claimEnvelopeRef,locatorKeys:Object.freeze(uniq(raw.locatorKeys)),lotId,reviewerRef:text(raw.reviewerRef)||null,reviewCaseRef:text(raw.reviewCaseRef)||null,observedAt:text(raw.observedAt)||null,attestationState:STATE,provenance:text(raw.provenance)||'EXPLICIT_REFERENCE_INPUT',referenceOnly:true,claimTruthVerified:false,reviewerIdentityVerified:false,reviewerQualificationVerified:false,reviewerIndependenceVerified:false,evidentiarySufficiencyDetermined:false,externalVerificationDetermined:false,certificationValidityVerified:false,decisionAuthority:false,authority:AUTHORITY,integrity:INTEGRITY})};
  }
  function create(records=[]){
    const input=Array.isArray(records)?records:[],accepted=[],rejected=[];
    input.forEach((raw,index)=>{const r=normalize(raw,index);if(r.valid)accepted.push(r.record);else rejected.push(Object.freeze({index:r.index,reason:r.reason}));});
    const duplicateRefs=new Set(),seen=new Set();for(const r of accepted){if(seen.has(r.attestationRef))duplicateRefs.add(r.attestationRef);seen.add(r.attestationRef)}
    const finalRecords=Object.freeze(accepted.filter(r=>!duplicateRefs.has(r.attestationRef)));for(const ref of duplicateRefs)rejected.push(Object.freeze({index:null,reason:'DUPLICATE_ATTESTATION_REF',attestationRef:ref}));
    const rejectedFrozen=Object.freeze(rejected);
    function forClaim(claimId){const id=text(claimId);return Object.freeze(finalRecords.filter(r=>r.claimId===id))}
    function summary(){return deepFreeze({schema:SCHEMA,version:VERSION,records:finalRecords.length,rejected:rejectedFrozen.length,referenceOnly:finalRecords.length,claimTruthVerified:0,reviewerIdentityVerified:0,reviewerQualificationVerified:0,reviewerIndependenceVerified:0,evidentiarySufficiencyDetermined:0,externalVerificationDetermined:0,certificationValidityVerified:0,decisionAuthority:0,semantics:'REFERENCE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE'})}
    return deepFreeze({schema:SCHEMA,version:VERSION,state:STATE,records:()=>finalRecords,forClaim,diagnostics:()=>rejectedFrozen,summary,authority:AUTHORITY,integrity:INTEGRITY});
  }

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,state:STATE,create,authority:AUTHORITY,integrity:INTEGRITY});
  const baseline=create([]);
  if(typeof window!=='undefined'){
    window.__SANA_DATAROOM_CLAIM_ATTESTATION_V175_FACTORY__=factory;
    if(!window.__SANA_DATAROOM_CLAIM_ATTESTATION__)window.__SANA_DATAROOM_CLAIM_ATTESTATION__=baseline;
  }
  if(typeof globalThis!=='undefined'){
    globalThis.__SANA_DATAROOM_CLAIM_ATTESTATION_V175_FACTORY__=factory;
    if(!globalThis.__SANA_DATAROOM_CLAIM_ATTESTATION__)globalThis.__SANA_DATAROOM_CLAIM_ATTESTATION__=baseline;
  }
})();