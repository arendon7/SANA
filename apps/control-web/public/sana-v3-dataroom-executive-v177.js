(() => {
  'use strict';

  const VERSION='V177';
  const SCHEMA='SANA_DATAROOM_EXECUTIVE_EXACT_EVIDENCE_SUFFICIENCY_REVIEW_V1';
  const PARENT='V176';
  const PARENT_SHA='af6d36e0af3ffb104e1bf5faca546c3de71c5f20';
  const SOURCE_SCHEMA='SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY_REVIEW_V1';
  const SOURCE_GLOBAL='__SANA_DATAROOM_CLAIM_EVIDENCE_SUFFICIENCY__';
  const ALLOWED_SOURCE_STATES=Object.freeze(['SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY','ADDITIONAL_EVIDENCE_REQUIRED_REFERENCE_ONLY']);
  const RULE=Object.freeze({id:'CLAIM_EVIDENCE_SUFFICIENCY_EXACT_V1',sourceGlobal:SOURCE_GLOBAL,sourceSchema:SOURCE_SCHEMA,allowedSourceStates:ALLOWED_SOURCE_STATES,claimMatch:'EXACT_CLAIM_ID',envelopeMatch:'EXACT_ENVELOPE_ID',locatorPolicy:'DECLARED_LOCATORS_MUST_BE_SUBSET',lotPolicy:'DECLARED_LOT_MUST_EQUAL_SELECTED_LOT',statePolicy:'ALL_EXACT_CLAIM_CANDIDATES_MUST_USE_ONE_STATE',conflictPolicy:'ANY_EXACT_CLAIM_CANDIDATE_CONTRADICTION_FAILS_CLOSED',heuristics:Object.freeze([])});
  const LINK_RULES=Object.freeze([RULE]);
  const SOURCE_STATES=Object.freeze(['AVAILABLE','MISSING','SCHEMA_MISMATCH','INVALID_API']);
  const CAPABILITIES=Object.freeze({exactEvidenceSufficiencyReviewReferenceLinking:true,sufficientForDeclaredScopeRepresentation:true,additionalEvidenceRequiredRepresentation:true,systemSufficiencyAuthority:false,heuristicLinking:false,truthVerification:false,approvalRepresentation:false});
  const AUTHORITY=Object.freeze({canonicalMutationAvailable:false,financialMutationAvailable:false,evidenceSufficiencyReviewAuthority:false,evidentiarySufficiencyAuthority:false,claimTruthAuthority:false,reviewerIdentityAuthority:false,reviewerQualificationAuthority:false,reviewerIndependenceAuthority:false,externalVerificationAuthority:false,providerAccreditationAuthority:false,certificationAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,financingApprovalAuthority:false,decisionAuthority:false,aiAuthority:'ADVISORY_ONLY',offerAuthority:false,solicitationAuthority:false,brokerageAuthority:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='SUFFICIENCY_REVIEW_REFERENCE ≠ CLAIM_TRUTH · SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE ≠ UNIVERSALLY_SUFFICIENT_EVIDENCE · ADDITIONAL_EVIDENCE_REQUIRED_AT_REVIEW ≠ NEGATIVE_PROJECT_CONCLUSION · REVIEWER_REFERENCE ≠ VERIFIED_IDENTITY ≠ VERIFIED_QUALIFICATION ≠ VERIFIED_INDEPENDENCE · REVIEW_SCOPE_REFERENCE ≠ AUTHORITY_GRANTED · REVIEW_CONCLUSION ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ FINANCING_APPROVAL ≠ INVESTMENT_DECISION · CONTRACT_AVAILABLE ≠ REVIEW_EXISTS · CONFLICT_FAILS_CLOSED · NO_HEURISTIC_LINKING · COUNTS_ONLY ≠ SCORE · NO_MUTATION · READ_ONLY';

  function deepFreeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);
  }
  function text(v){return v===undefined||v===null?'':String(v).trim()}
  function uniq(values){return [...new Set((Array.isArray(values)?values:[]).map(text).filter(Boolean))].sort()}
  function sourceFor(host){if(host&&Object.prototype.hasOwnProperty.call(host,SOURCE_GLOBAL))return host[SOURCE_GLOBAL];return globalThis[SOURCE_GLOBAL]||null;}
  function readSource(host){
    const source=sourceFor(host);
    if(!source)return deepFreeze({state:'MISSING',records:Object.freeze([]),reason:'SOURCE_NOT_MATERIALIZED'});
    if(source.schema!==SOURCE_SCHEMA)return deepFreeze({state:'SCHEMA_MISMATCH',records:Object.freeze([]),reason:`EXPECTED_${SOURCE_SCHEMA}`});
    if(typeof source.records!=='function')return deepFreeze({state:'INVALID_API',records:Object.freeze([]),reason:'RECORDS_FUNCTION_REQUIRED'});
    try{const rows=source.records();if(!Array.isArray(rows))return deepFreeze({state:'INVALID_API',records:Object.freeze([]),reason:'RECORDS_ARRAY_REQUIRED'});return deepFreeze({state:'AVAILABLE',records:Object.freeze(Array.from(rows)),reason:null});}
    catch(_){return deepFreeze({state:'INVALID_API',records:Object.freeze([]),reason:'RECORDS_READ_FAILED'});}
  }
  function validateCandidate(record,envelope){
    const reasons=[];
    if(!record||typeof record!=='object')reasons.push('RECORD_NOT_OBJECT');
    else{
      if(record.schema!==SOURCE_SCHEMA)reasons.push('RECORD_SCHEMA_MISMATCH');
      if(text(record.claimId)!==envelope.claimId)reasons.push('CLAIM_ID_MISMATCH');
      if(text(record.claimEnvelopeRef)!==envelope.envelopeId)reasons.push('CLAIM_ENVELOPE_REF_MISMATCH');
      const state=text(record.reviewState);if(!ALLOWED_SOURCE_STATES.includes(state))reasons.push('EVIDENCE_SUFFICIENCY_REVIEW_STATE_NOT_ALLOWED');
      if(!text(record.reviewRef))reasons.push('REVIEW_REF_REQUIRED');
      const allowed=new Set(Array.from(envelope.locatorKeys||[]));for(const key of uniq(record.locatorKeys))if(!allowed.has(key))reasons.push('LOCATOR_OUTSIDE_CLAIM');
      const lot=text(record.lotId);if(lot&&(!envelope.selectedLot||lot!==String(envelope.selectedLot)))reasons.push('LOT_SCOPE_CONTRADICTION');
    }
    return deepFreeze({valid:reasons.length===0,reasons:Object.freeze(uniq(reasons))});
  }
  function envelopeWithReview(envelope,sourceState){
    if(sourceState.state!=='AVAILABLE')return deepFreeze({...envelope,evidenceSufficiencyReview:deepFreeze({state:'NOT_DETERMINED',explicitRefs:Object.freeze([]),reviewerRefs:Object.freeze([]),reviewCaseRefs:Object.freeze([]),reviewScopeRefs:Object.freeze([]),requestedEvidenceRefs:Object.freeze([]),claimTruthVerified:false,evidentiarySufficiencyDetermined:false}),evidenceSufficiencyDiagnostic:{state:'SOURCE_UNAVAILABLE',sourceState:sourceState.state,reason:sourceState.reason,ruleId:RULE.id,candidateCount:0,validCandidateCount:0,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    const candidates=sourceState.records.filter(r=>r&&typeof r==='object'&&text(r.claimId)===envelope.claimId);
    if(!candidates.length)return deepFreeze({...envelope,evidenceSufficiencyReview:deepFreeze({state:'NOT_DETERMINED',explicitRefs:Object.freeze([]),reviewerRefs:Object.freeze([]),reviewCaseRefs:Object.freeze([]),reviewScopeRefs:Object.freeze([]),requestedEvidenceRefs:Object.freeze([]),claimTruthVerified:false,evidentiarySufficiencyDetermined:false}),evidenceSufficiencyDiagnostic:{state:'NO_EXACT_CANDIDATE',sourceState:'AVAILABLE',reason:null,ruleId:RULE.id,candidateCount:0,validCandidateCount:0,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    const checks=candidates.map(r=>({record:r,check:validateCandidate(r,envelope)}));
    const duplicateRefs=new Set(),seenRefs=new Set();for(const x of checks){const ref=text(x.record?.reviewRef);if(ref&&seenRefs.has(ref))duplicateRefs.add(ref);if(ref)seenRefs.add(ref);}
    const states=uniq(checks.map(x=>x.record?.reviewState));const stateConflicts=states.length===1?[]:['MIXED_EVIDENCE_SUFFICIENCY_REVIEW_STATES'];
    const conflictReasons=uniq(checks.flatMap(x=>x.check.reasons).concat(duplicateRefs.size?['DUPLICATE_REVIEW_REF']:[]).concat(stateConflicts));const valid=checks.filter(x=>x.check.valid);
    if(conflictReasons.length||valid.length!==candidates.length)return deepFreeze({...envelope,evidenceSufficiencyReview:deepFreeze({state:'NOT_DETERMINED',explicitRefs:Object.freeze([]),reviewerRefs:Object.freeze([]),reviewCaseRefs:Object.freeze([]),reviewScopeRefs:Object.freeze([]),requestedEvidenceRefs:Object.freeze([]),claimTruthVerified:false,evidentiarySufficiencyDetermined:false}),evidenceSufficiencyDiagnostic:{state:'CLAIM_EVIDENCE_SUFFICIENCY_CANDIDATE_CONFLICT',sourceState:'AVAILABLE',reason:'EXACT_CLAIM_CANDIDATE_CONTRADICTION',ruleId:RULE.id,candidateCount:candidates.length,validCandidateCount:valid.length,conflictReasons:Object.freeze(conflictReasons)},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    const sourceReviewState=states[0],mappedState=sourceReviewState==='SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY'?'SUFFICIENCY_REVIEW_REFERENCE_ONLY':'ADDITIONAL_EVIDENCE_REQUIRED_AT_REVIEW';
    const review=deepFreeze({state:mappedState,sourceReviewState,explicitRefs:Object.freeze(uniq(valid.map(x=>x.record.reviewRef))),reviewerRefs:Object.freeze(uniq(valid.map(x=>x.record.reviewerRef))),reviewCaseRefs:Object.freeze(uniq(valid.map(x=>x.record.reviewCaseRef))),reviewScopeRefs:Object.freeze(uniq(valid.map(x=>x.record.reviewScopeRef))),requestedEvidenceRefs:Object.freeze(uniq(valid.flatMap(x=>x.record.requestedEvidenceRefs||[]))),claimTruthVerified:false,reviewerIdentityVerified:false,reviewerQualificationVerified:false,reviewerIndependenceVerified:false,evidentiarySufficiencyDetermined:false,externalVerificationVerified:false,certificationValidityVerified:false,dueDiligenceApproved:false,eligible:false,financingApproved:false,decisionAuthority:false,limitations:Object.freeze(sourceReviewState==='SUFFICIENT_FOR_DECLARED_REVIEW_SCOPE_REFERENCE_ONLY'?['HUMAN_REVIEW_REFERENCE_ONLY','SUFFICIENT_FOR_DECLARED_SCOPE_IS_NOT_UNIVERSAL_SUFFICIENCY','REVIEW_CONCLUSION_DOES_NOT_VERIFY_CLAIM_TRUTH_OR_GRANT_APPROVAL']:['HUMAN_REVIEW_REFERENCE_ONLY','ADDITIONAL_EVIDENCE_REQUIRED_IS_NOT_A_NEGATIVE_PROJECT_CONCLUSION','REVIEW_CONCLUSION_DOES_NOT_VERIFY_CLAIM_TRUTH_OR_GRANT_APPROVAL'])});
    return deepFreeze({...envelope,evidenceSufficiencyReview:review,evidentiarySufficiencyDetermined:false,claimTruthVerified:false,decisionAuthority:false,evidenceSufficiencyDiagnostic:{state:'EXACT_EVIDENCE_SUFFICIENCY_REVIEW_LINKED',sourceState:'AVAILABLE',reason:null,ruleId:RULE.id,candidateCount:candidates.length,validCandidateCount:valid.length,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
  }
  function summarize(envelopes,sourceState){
    const sufficient=envelopes.filter(e=>e.evidenceSufficiencyReview?.state==='SUFFICIENCY_REVIEW_REFERENCE_ONLY').length,additional=envelopes.filter(e=>e.evidenceSufficiencyReview?.state==='ADDITIONAL_EVIDENCE_REQUIRED_AT_REVIEW').length,conflicts=envelopes.filter(e=>e.evidenceSufficiencyDiagnostic?.state==='CLAIM_EVIDENCE_SUFFICIENCY_CANDIDATE_CONFLICT').length,refs=uniq(envelopes.flatMap(e=>e.evidenceSufficiencyReview?.explicitRefs||[])).length;
    return deepFreeze({total:envelopes.length,sourceState:sourceState.state,sufficientForDeclaredScopeReference:sufficient,additionalEvidenceRequiredAtReview:additional,notDetermined:envelopes.length-sufficient-additional,conflicts,explicitReviewReferences:refs,claimTruthVerified:0,evidentiarySufficiencyDetermined:0,reviewerIdentityVerified:0,reviewerQualificationVerified:0,reviewerIndependenceVerified:0,dueDiligenceApprovals:0,eligibilityDecisions:0,financingApprovals:0,decisionAuthority:0,semantics:'EXACT_SUFFICIENCY_REVIEW_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE'});
  }
  function build(host,options={}){
    const v176Factory=globalThis.__SANA_DATAROOM_EXECUTIVE_V176_FACTORY__||host?.__SANA_DATAROOM_EXECUTIVE_V176_FACTORY__;if(!v176Factory?.create)throw new Error('V176_FACTORY_REQUIRED');
    const parent=v176Factory.create(host).build(options),sourceState=readSource(host),envelopes=parent.envelopes.map(e=>envelopeWithReview(e,sourceState));
    return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,parentSha:PARENT_SHA,scope:parent.scope,envelopes,summary:summarize(envelopes,sourceState),sourceContract:{globalName:SOURCE_GLOBAL,schema:SOURCE_SCHEMA,state:sourceState.state,reason:sourceState.reason,recordCount:sourceState.records.length},audit:{linkRules:LINK_RULES,ruleCount:1,heuristicLinking:false,sourceStates:SOURCE_STATES,conflictPolicy:RULE.conflictPolicy,statePolicy:RULE.statePolicy,provenanceGap:parent.audit?.provenanceGap||null},capabilities:CAPABILITIES,authority:AUTHORITY,provenance:{parent:PARENT,parentSha:PARENT_SHA,parentSchema:parent.schema,parentVersion:parent.version,sourceSchema:SOURCE_SCHEMA,linkRule:RULE.id,linkPolicy:'EXACT_CONTRACTED_LINKS_ONLY'},integrity:INTEGRITY});
  }
  function forSection(host,sectionId,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.sectionId===sectionId);return deepFreeze({...r,sectionId,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function forSource(host,sourceId,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.sourceId===sourceId);return deepFreeze({...r,sourceId,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function forReviewState(host,state,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.evidenceSufficiencyReview?.state===state);return deepFreeze({...r,reviewState:state,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function create(host){const target=host||globalThis;return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,sourceSchema:SOURCE_SCHEMA,linkRules:LINK_RULES,capabilities:CAPABILITIES,authority:AUTHORITY,build:o=>build(target,o),forSection:(id,o)=>forSection(target,id,o),forSource:(id,o)=>forSource(target,id,o),forReviewState:(state,o)=>forReviewState(target,state,o),integrity:INTEGRITY});}

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,create,integrity:INTEGRITY});
  if(typeof window!=='undefined')window.__SANA_DATAROOM_EXECUTIVE_V177_FACTORY__=factory;
  if(typeof globalThis!=='undefined')globalThis.__SANA_DATAROOM_EXECUTIVE_V177_FACTORY__=factory;
})();