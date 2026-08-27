(() => {
  'use strict';

  const VERSION='V176';
  const SCHEMA='SANA_DATAROOM_EXECUTIVE_EXACT_EXTERNAL_VERIFICATION_LINK_V1';
  const PARENT='V175';
  const PARENT_SHA='917d14463a187b54559c2306b145e4c5427092f0';
  const SOURCE_SCHEMA='SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION_REFERENCE_V1';
  const SOURCE_GLOBAL='__SANA_DATAROOM_CLAIM_EXTERNAL_VERIFICATION__';
  const ALLOWED_SOURCE_STATES=Object.freeze(['RESULT_REFERENCE_ONLY','EXPLICITLY_NOT_VERIFIED']);
  const RULE=Object.freeze({id:'CLAIM_EXTERNAL_VERIFICATION_EXACT_V1',sourceGlobal:SOURCE_GLOBAL,sourceSchema:SOURCE_SCHEMA,allowedSourceStates:ALLOWED_SOURCE_STATES,claimMatch:'EXACT_CLAIM_ID',envelopeMatch:'EXACT_ENVELOPE_ID',locatorPolicy:'DECLARED_LOCATORS_MUST_BE_SUBSET',lotPolicy:'DECLARED_LOT_MUST_EQUAL_SELECTED_LOT',statePolicy:'ALL_EXACT_CLAIM_CANDIDATES_MUST_USE_ONE_STATE',conflictPolicy:'ANY_EXACT_CLAIM_CANDIDATE_CONTRADICTION_FAILS_CLOSED',heuristics:Object.freeze([])});
  const LINK_RULES=Object.freeze([RULE]);
  const SOURCE_STATES=Object.freeze(['AVAILABLE','MISSING','SCHEMA_MISMATCH','INVALID_API']);
  const CAPABILITIES=Object.freeze({exactExternalVerificationReferenceLinking:true,explicitNotVerifiedRepresentation:true,verifiedResultRepresentation:false,heuristicLinking:false,truthVerification:false,certificationVerification:false});
  const AUTHORITY=Object.freeze({canonicalMutationAvailable:false,financialMutationAvailable:false,externalVerificationAuthority:false,resultVerificationAuthority:false,claimTruthAuthority:false,providerIdentityAuthority:false,providerQualificationAuthority:false,providerAccreditationAuthority:false,documentAuthenticityAuthority:false,evidentiarySufficiencyAuthority:false,certificationAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,decisionAuthority:false,aiAuthority:'ADVISORY_ONLY',offerAuthority:false,solicitationAuthority:false,brokerageAuthority:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='EXTERNAL_VERIFICATION_REFERENCE_ONLY ≠ VERIFIED_RESULT · PROVIDER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_ACCREDITATION · RESULT_REFERENCE ≠ DOCUMENT_AUTHENTICITY · EXPLICITLY_NOT_VERIFIED_AT_SOURCE ≠ NEGATIVE_PROJECT_CONCLUSION · EXTERNAL_VERIFICATION_REFERENCE ≠ CLAIM_TRUTH ≠ EVIDENTIARY_SUFFICIENCY ≠ CERTIFICATION_VALIDITY · EXACT_LINK ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ INVESTMENT_DECISION · CONTRACT_AVAILABLE ≠ VERIFICATION_EXISTS · NO_VERIFIED_STATE · CONFLICT_FAILS_CLOSED · NO_HEURISTIC_LINKING · COUNTS_ONLY ≠ SCORE · NO_MUTATION · READ_ONLY';

  function deepFreeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);
  }
  function text(v){return v===undefined||v===null?'':String(v).trim()}
  function uniq(values){return [...new Set((Array.isArray(values)?values:[]).map(text).filter(Boolean))].sort()}
  function sourceFor(host){
    if(host&&Object.prototype.hasOwnProperty.call(host,SOURCE_GLOBAL))return host[SOURCE_GLOBAL];
    return globalThis[SOURCE_GLOBAL]||null;
  }
  function readSource(host){
    const source=sourceFor(host);
    if(!source)return deepFreeze({state:'MISSING',records:Object.freeze([]),reason:'SOURCE_NOT_MATERIALIZED'});
    if(source.schema!==SOURCE_SCHEMA)return deepFreeze({state:'SCHEMA_MISMATCH',records:Object.freeze([]),reason:`EXPECTED_${SOURCE_SCHEMA}`});
    if(typeof source.records!=='function')return deepFreeze({state:'INVALID_API',records:Object.freeze([]),reason:'RECORDS_FUNCTION_REQUIRED'});
    try{
      const rows=source.records();
      if(!Array.isArray(rows))return deepFreeze({state:'INVALID_API',records:Object.freeze([]),reason:'RECORDS_ARRAY_REQUIRED'});
      return deepFreeze({state:'AVAILABLE',records:Object.freeze(Array.from(rows)),reason:null});
    }catch(_){return deepFreeze({state:'INVALID_API',records:Object.freeze([]),reason:'RECORDS_READ_FAILED'});}
  }
  function validateCandidate(record,envelope){
    const reasons=[];
    if(!record||typeof record!=='object')reasons.push('RECORD_NOT_OBJECT');
    else{
      if(record.schema!==SOURCE_SCHEMA)reasons.push('RECORD_SCHEMA_MISMATCH');
      if(text(record.claimId)!==envelope.claimId)reasons.push('CLAIM_ID_MISMATCH');
      if(text(record.claimEnvelopeRef)!==envelope.envelopeId)reasons.push('CLAIM_ENVELOPE_REF_MISMATCH');
      const sourceState=text(record.verificationState);
      if(!ALLOWED_SOURCE_STATES.includes(sourceState))reasons.push('EXTERNAL_VERIFICATION_STATE_NOT_ALLOWED');
      if(!text(record.verificationRef))reasons.push('VERIFICATION_REF_REQUIRED');
      if(sourceState==='RESULT_REFERENCE_ONLY'&&!text(record.resultRef))reasons.push('RESULT_REF_REQUIRED_FOR_RESULT_REFERENCE');
      const allowed=new Set(Array.from(envelope.locatorKeys||[]));
      for(const key of uniq(record.locatorKeys))if(!allowed.has(key))reasons.push('LOCATOR_OUTSIDE_CLAIM');
      const lot=text(record.lotId);
      if(lot){if(!envelope.selectedLot||lot!==String(envelope.selectedLot))reasons.push('LOT_SCOPE_CONTRADICTION');}
    }
    return deepFreeze({valid:reasons.length===0,reasons:Object.freeze(uniq(reasons))});
  }
  function envelopeWithVerification(envelope,sourceState){
    if(sourceState.state!=='AVAILABLE')return deepFreeze({...envelope,externalVerificationDiagnostic:{state:'SOURCE_UNAVAILABLE',sourceState:sourceState.state,reason:sourceState.reason,ruleId:RULE.id,candidateCount:0,validCandidateCount:0,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    const candidates=sourceState.records.filter(r=>r&&typeof r==='object'&&text(r.claimId)===envelope.claimId);
    if(!candidates.length)return deepFreeze({...envelope,externalVerificationDiagnostic:{state:'NO_EXACT_CANDIDATE',sourceState:'AVAILABLE',reason:null,ruleId:RULE.id,candidateCount:0,validCandidateCount:0,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    const checks=candidates.map(r=>({record:r,check:validateCandidate(r,envelope)}));
    const duplicateRefs=new Set(),seenRefs=new Set();for(const x of checks){const ref=text(x.record?.verificationRef);if(ref&&seenRefs.has(ref))duplicateRefs.add(ref);if(ref)seenRefs.add(ref);}
    const states=uniq(checks.map(x=>x.record?.verificationState));
    const stateConflicts=states.length===1?[]:['MIXED_EXTERNAL_VERIFICATION_STATES'];
    const conflictReasons=uniq(checks.flatMap(x=>x.check.reasons).concat(duplicateRefs.size?['DUPLICATE_VERIFICATION_REF']:[]).concat(stateConflicts));
    const valid=checks.filter(x=>x.check.valid);
    if(conflictReasons.length||valid.length!==candidates.length){
      return deepFreeze({...envelope,externalVerificationDiagnostic:{state:'CLAIM_EXTERNAL_VERIFICATION_CANDIDATE_CONFLICT',sourceState:'AVAILABLE',reason:'EXACT_CLAIM_CANDIDATE_CONTRADICTION',ruleId:RULE.id,candidateCount:candidates.length,validCandidateCount:valid.length,conflictReasons:Object.freeze(conflictReasons)},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    }
    const sourceVerificationState=states[0],explicitRefs=Object.freeze(uniq(valid.map(x=>x.record.verificationRef))),providerRefs=Object.freeze(uniq(valid.map(x=>x.record.providerRef))),resultRefs=Object.freeze(uniq(valid.map(x=>x.record.resultRef)));
    const mappedState=sourceVerificationState==='RESULT_REFERENCE_ONLY'?'EXTERNAL_VERIFICATION_REFERENCE_ONLY':'EXPLICITLY_NOT_VERIFIED_AT_SOURCE';
    const externalVerification=deepFreeze({state:mappedState,explicitRefs,providerRefs,resultRefs,sourceVerificationState,verifiedResult:false,providerIdentityVerified:false,providerQualificationVerified:false,providerAccreditationVerified:false,documentAuthenticityVerified:false,certificationValidityVerified:false,claimTruthVerified:false,limitations:Object.freeze(sourceVerificationState==='RESULT_REFERENCE_ONLY'?['RESULT_REFERENCE_ONLY_DOES_NOT_VERIFY_RESULT','PROVIDER_REFERENCE_DOES_NOT_VERIFY_IDENTITY_QUALIFICATION_OR_ACCREDITATION','EXTERNAL_VERIFICATION_REFERENCE_DOES_NOT_VERIFY_CLAIM_TRUTH_OR_CERTIFICATION']:['SOURCE_EXPLICITLY_STATES_NOT_VERIFIED','NOT_VERIFIED_AT_SOURCE_IS_NOT_A_NEGATIVE_PROJECT_CONCLUSION','NO_CLAIM_TRUTH_OR_CERTIFICATION_INFERENCE'])});
    return deepFreeze({...envelope,externalVerification,claimTruthVerified:false,evidentiarySufficiencyDetermined:false,decisionAuthority:false,externalVerificationDiagnostic:{state:'EXACT_EXTERNAL_VERIFICATION_REFERENCE_LINKED',sourceState:'AVAILABLE',reason:null,ruleId:RULE.id,candidateCount:candidates.length,validCandidateCount:valid.length,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
  }
  function summarize(envelopes,sourceState){
    const resultReference=envelopes.filter(e=>e.externalVerification?.state==='EXTERNAL_VERIFICATION_REFERENCE_ONLY').length;
    const explicitlyNotVerified=envelopes.filter(e=>e.externalVerification?.state==='EXPLICITLY_NOT_VERIFIED_AT_SOURCE').length;
    const conflicts=envelopes.filter(e=>e.externalVerificationDiagnostic?.state==='CLAIM_EXTERNAL_VERIFICATION_CANDIDATE_CONFLICT').length;
    const refs=uniq(envelopes.flatMap(e=>e.externalVerification?.explicitRefs||[])).length;
    return deepFreeze({total:envelopes.length,sourceState:sourceState.state,resultReference,explicitlyNotVerified,notDetermined:envelopes.length-resultReference-explicitlyNotVerified,conflicts,explicitVerificationReferences:refs,verifiedResults:0,claimTruthVerified:0,providerIdentityVerified:0,providerQualificationVerified:0,providerAccreditationVerified:0,documentAuthenticityVerified:0,evidentiarySufficiencyDetermined:0,certificationValidityVerified:0,decisionAuthority:0,semantics:'EXACT_EXTERNAL_VERIFICATION_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE'});
  }
  function build(host,options={}){
    const v175Factory=globalThis.__SANA_DATAROOM_EXECUTIVE_V175_FACTORY__||host?.__SANA_DATAROOM_EXECUTIVE_V175_FACTORY__;
    if(!v175Factory?.create)throw new Error('V175_FACTORY_REQUIRED');
    const parent=v175Factory.create(host).build(options),sourceState=readSource(host),envelopes=parent.envelopes.map(e=>envelopeWithVerification(e,sourceState));
    return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,parentSha:PARENT_SHA,scope:parent.scope,envelopes,summary:summarize(envelopes,sourceState),sourceContract:{globalName:SOURCE_GLOBAL,schema:SOURCE_SCHEMA,state:sourceState.state,reason:sourceState.reason,recordCount:sourceState.records.length},audit:{linkRules:LINK_RULES,ruleCount:1,heuristicLinking:false,sourceStates:SOURCE_STATES,conflictPolicy:RULE.conflictPolicy,statePolicy:RULE.statePolicy,provenanceGap:parent.audit?.provenanceGap||null},capabilities:CAPABILITIES,authority:AUTHORITY,provenance:{parent:PARENT,parentSha:PARENT_SHA,parentSchema:parent.schema,parentVersion:parent.version,sourceSchema:SOURCE_SCHEMA,linkRule:RULE.id,linkPolicy:'EXACT_CONTRACTED_LINKS_ONLY'},integrity:INTEGRITY});
  }
  function forSection(host,sectionId,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.sectionId===sectionId);return deepFreeze({...r,sectionId,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function forSource(host,sourceId,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.sourceId===sourceId);return deepFreeze({...r,sourceId,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function forExternalVerificationState(host,state,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.externalVerification?.state===state);return deepFreeze({...r,externalVerificationState:state,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function create(host){const target=host||globalThis;return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,sourceSchema:SOURCE_SCHEMA,linkRules:LINK_RULES,capabilities:CAPABILITIES,authority:AUTHORITY,build:o=>build(target,o),forSection:(id,o)=>forSection(target,id,o),forSource:(id,o)=>forSource(target,id,o),forExternalVerificationState:(state,o)=>forExternalVerificationState(target,state,o),integrity:INTEGRITY});}

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,create,integrity:INTEGRITY});
  if(typeof window!=='undefined')window.__SANA_DATAROOM_EXECUTIVE_V176_FACTORY__=factory;
  if(typeof globalThis!=='undefined')globalThis.__SANA_DATAROOM_EXECUTIVE_V176_FACTORY__=factory;
})();