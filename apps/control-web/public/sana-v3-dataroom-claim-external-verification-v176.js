(() => {
  'use strict';

  const VERSION='V176';
  const SCHEMA='SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION_REFERENCE_V1';
  const STATES=Object.freeze(['RESULT_REFERENCE_ONLY','EXPLICITLY_NOT_VERIFIED']);
  const AUTHORITY=Object.freeze({claimTruthAuthority:false,resultVerificationAuthority:false,providerIdentityAuthority:false,providerQualificationAuthority:false,providerAccreditationAuthority:false,documentAuthenticityAuthority:false,evidentiarySufficiencyAuthority:false,certificationAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,investmentDecisionAuthority:false,financialMutationAvailable:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='EXTERNAL_VERIFICATION_REFERENCE ≠ VERIFIED_RESULT · PROVIDER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_ACCREDITATION · RESULT_REFERENCE ≠ DOCUMENT_AUTHENTICITY · EXPLICITLY_NOT_VERIFIED ≠ NEGATIVE_PROJECT_CONCLUSION · EXTERNAL_VERIFICATION_REFERENCE ≠ CLAIM_TRUTH ≠ EVIDENTIARY_SUFFICIENCY ≠ CERTIFICATION_VALIDITY ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ INVESTMENT_DECISION · NO_VERIFIED_STATE · ZERO_BASELINE_RECORDS · REFERENCE_ONLY · NO_STORAGE_WRITE · NO_NETWORK · NO_FINANCIAL_MUTATION';

  function deepFreeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);
  }
  function text(v){return v===undefined||v===null?'':String(v).trim()}
  function uniq(values){return [...new Set((Array.isArray(values)?values:[]).map(text).filter(Boolean))].sort()}
  function normalize(raw,index){
    if(!raw||typeof raw!=='object')return {valid:false,index,reason:'RECORD_NOT_OBJECT'};
    const verificationRef=text(raw.verificationRef),claimId=text(raw.claimId),claimEnvelopeRef=text(raw.claimEnvelopeRef),verificationState=text(raw.verificationState),resultRef=text(raw.resultRef)||null;
    if(!verificationRef)return {valid:false,index,reason:'VERIFICATION_REF_REQUIRED'};
    if(!claimId)return {valid:false,index,reason:'CLAIM_ID_REQUIRED'};
    if(!claimEnvelopeRef)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_REQUIRED'};
    if(claimEnvelopeRef!==`ENV::${claimId}`)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_MISMATCH'};
    if(!STATES.includes(verificationState))return {valid:false,index,reason:'EXTERNAL_VERIFICATION_STATE_NOT_ALLOWED'};
    if(verificationState==='RESULT_REFERENCE_ONLY'&&!resultRef)return {valid:false,index,reason:'RESULT_REF_REQUIRED_FOR_RESULT_REFERENCE'};
    return {valid:true,index,record:deepFreeze({schema:SCHEMA,version:VERSION,verificationRef,claimId,claimEnvelopeRef,locatorKeys:Object.freeze(uniq(raw.locatorKeys)),lotId:text(raw.lotId)||null,providerRef:text(raw.providerRef)||null,resultRef,observedAt:text(raw.observedAt)||null,verificationState,provenance:text(raw.provenance)||'EXPLICIT_REFERENCE_INPUT',referenceOnly:true,claimTruthVerified:false,verifiedResult:false,providerIdentityVerified:false,providerQualificationVerified:false,providerAccreditationVerified:false,documentAuthenticityVerified:false,evidentiarySufficiencyDetermined:false,certificationValidityVerified:false,decisionAuthority:false,authority:AUTHORITY,integrity:INTEGRITY})};
  }
  function create(records=[]){
    const input=Array.isArray(records)?records:[],accepted=[],rejected=[];
    input.forEach((raw,index)=>{const r=normalize(raw,index);if(r.valid)accepted.push(r.record);else rejected.push(Object.freeze({index:r.index,reason:r.reason}));});
    const duplicateRefs=new Set(),seen=new Set();for(const r of accepted){if(seen.has(r.verificationRef))duplicateRefs.add(r.verificationRef);seen.add(r.verificationRef)}
    const finalRecords=Object.freeze(accepted.filter(r=>!duplicateRefs.has(r.verificationRef)));for(const ref of duplicateRefs)rejected.push(Object.freeze({index:null,reason:'DUPLICATE_VERIFICATION_REF',verificationRef:ref}));
    const rejectedFrozen=Object.freeze(rejected);
    function forClaim(claimId){const id=text(claimId);return Object.freeze(finalRecords.filter(r=>r.claimId===id))}
    function summary(){const resultRefs=finalRecords.filter(r=>r.verificationState==='RESULT_REFERENCE_ONLY').length,explicitNotVerified=finalRecords.filter(r=>r.verificationState==='EXPLICITLY_NOT_VERIFIED').length;return deepFreeze({schema:SCHEMA,version:VERSION,records:finalRecords.length,rejected:rejectedFrozen.length,resultReferences:resultRefs,explicitlyNotVerified:explicitNotVerified,claimTruthVerified:0,verifiedResults:0,providerIdentityVerified:0,providerQualificationVerified:0,providerAccreditationVerified:0,documentAuthenticityVerified:0,evidentiarySufficiencyDetermined:0,certificationValidityVerified:0,decisionAuthority:0,semantics:'REFERENCE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE'})}
    return deepFreeze({schema:SCHEMA,version:VERSION,states:STATES,records:()=>finalRecords,forClaim,diagnostics:()=>rejectedFrozen,summary,authority:AUTHORITY,integrity:INTEGRITY});
  }

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,states:STATES,create,authority:AUTHORITY,integrity:INTEGRITY});
  const baseline=create([]);
  if(typeof window!=='undefined'){
    window.__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION_V176_FACTORY__=factory;
    if(!window.__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION__)window.__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION__=baseline;
  }
  if(typeof globalThis!=='undefined'){
    globalThis.__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION_V176_FACTORY__=factory;
    if(!globalThis.__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION__)globalThis.__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION__=baseline;
  }
})();