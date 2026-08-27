(() => {
  'use strict';

  const VERSION='V175';
  const SCHEMA='SANA_DATAROOM_EXECUTIVE_EXACT_ATTESTATION_LINK_V1';
  const PARENT='V174';
  const PARENT_SHA='cd4717c33b64584eeff538a8097f6c8740fb6e16';
  const SOURCE_SCHEMA='SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1';
  const SOURCE_GLOBAL='__SANA_DATAROOM_CLAIM_ATTESTATION__';
  const RULE=Object.freeze({id:'CLAIM_ATTESTATION_EXACT_V1',sourceGlobal:SOURCE_GLOBAL,sourceSchema:SOURCE_SCHEMA,requiredState:'REFERENCE_ONLY',claimMatch:'EXACT_CLAIM_ID',envelopeMatch:'EXACT_ENVELOPE_ID',locatorPolicy:'DECLARED_LOCATORS_MUST_BE_SUBSET',lotPolicy:'DECLARED_LOT_MUST_EQUAL_SELECTED_LOT',conflictPolicy:'ANY_EXACT_CLAIM_CANDIDATE_CONTRADICTION_FAILS_CLOSED',heuristics:Object.freeze([])});
  const LINK_RULES=Object.freeze([RULE]);
  const SOURCE_STATES=Object.freeze(['AVAILABLE','MISSING','SCHEMA_MISMATCH','INVALID_API']);
  const CAPABILITIES=Object.freeze({exactAttestationReferenceLinking:true,heuristicLinking:false,truthVerification:false,externalVerification:false});
  const AUTHORITY=Object.freeze({canonicalMutationAvailable:false,financialMutationAvailable:false,attestationAuthority:false,claimTruthAuthority:false,reviewerIdentityAuthority:false,reviewerQualificationAuthority:false,reviewerIndependenceAuthority:false,evidentiarySufficiencyAuthority:false,externalVerificationAuthority:false,certificationAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,decisionAuthority:false,aiAuthority:'ADVISORY_ONLY',offerAuthority:false,solicitationAuthority:false,brokerageAuthority:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='EXACT_CLAIM_LINK ≠ CLAIM_TRUTH · ATTESTATION_REFERENCE_ONLY ≠ VERIFIED_REVIEWER_IDENTITY ≠ VERIFIED_REVIEWER_QUALIFICATION ≠ VERIFIED_REVIEWER_INDEPENDENCE · EXACT_LOCATOR_REFERENCE ≠ VERIFIED_EVIDENCE · ATTESTATION_REFERENCE ≠ EVIDENTIARY_SUFFICIENCY · ATTESTATION_REFERENCE ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION_VALIDITY · EXACT_LINK ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ INVESTMENT_DECISION · CONTRACT_AVAILABLE ≠ ATTESTATION_EXISTS · CONFLICT_FAILS_CLOSED · NO_HEURISTIC_LINKING · COUNTS_ONLY ≠ SCORE · NO_MUTATION · READ_ONLY';

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
      if(text(record.attestationState)!=='REFERENCE_ONLY')reasons.push('REFERENCE_ONLY_STATE_REQUIRED');
      if(!text(record.attestationRef))reasons.push('ATTESTATION_REF_REQUIRED');
      const allowed=new Set(Array.from(envelope.locatorKeys||[]));
      const declared=uniq(record.locatorKeys);
      for(const key of declared)if(!allowed.has(key))reasons.push('LOCATOR_OUTSIDE_CLAIM');
      const lot=text(record.lotId);
      if(lot){if(!envelope.selectedLot||lot!==String(envelope.selectedLot))reasons.push('LOT_SCOPE_CONTRADICTION');}
    }
    return deepFreeze({valid:reasons.length===0,reasons:Object.freeze(uniq(reasons))});
  }
  function envelopeWithAttestation(envelope,sourceState){
    if(sourceState.state!=='AVAILABLE')return deepFreeze({...envelope,linkDiagnostic:{state:'SOURCE_UNAVAILABLE',sourceState:sourceState.state,reason:sourceState.reason,ruleId:RULE.id,candidateCount:0,validCandidateCount:0,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    const candidates=sourceState.records.filter(r=>r&&typeof r==='object'&&text(r.claimId)===envelope.claimId);
    if(!candidates.length)return deepFreeze({...envelope,linkDiagnostic:{state:'NO_EXACT_CANDIDATE',sourceState:'AVAILABLE',reason:null,ruleId:RULE.id,candidateCount:0,validCandidateCount:0,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    const checks=candidates.map(r=>({record:r,check:validateCandidate(r,envelope)}));
    const duplicateRefs=new Set(),seenRefs=new Set();for(const x of checks){const ref=text(x.record?.attestationRef);if(ref&&seenRefs.has(ref))duplicateRefs.add(ref);if(ref)seenRefs.add(ref);}
    const conflictReasons=uniq(checks.flatMap(x=>x.check.reasons).concat(duplicateRefs.size?['DUPLICATE_ATTESTATION_REF']:[]));
    const valid=checks.filter(x=>x.check.valid);
    if(conflictReasons.length||valid.length!==candidates.length){
      return deepFreeze({...envelope,linkDiagnostic:{state:'CLAIM_ATTESTATION_CANDIDATE_CONFLICT',sourceState:'AVAILABLE',reason:'EXACT_CLAIM_CANDIDATE_CONTRADICTION',ruleId:RULE.id,candidateCount:candidates.length,validCandidateCount:valid.length,conflictReasons:Object.freeze(conflictReasons)},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
    }
    const explicitRefs=Object.freeze(uniq(valid.map(x=>x.record.attestationRef))),reviewerRefs=Object.freeze(uniq(valid.map(x=>x.record.reviewerRef))),reviewCaseRefs=Object.freeze(uniq(valid.map(x=>x.record.reviewCaseRef)));
    const attestation=deepFreeze({state:'ATTESTATION_REFERENCE_ONLY',explicitRefs,reviewerRefs,reviewCaseRefs,reviewerIdentityVerified:false,reviewerQualificationVerified:false,reviewerIndependenceVerified:false,claimTruthAttested:false,limitations:Object.freeze(['EXACT_REFERENCE_LINK_ONLY','ATTESTATION_REFERENCE_DOES_NOT_VERIFY_CLAIM_TRUTH','REVIEWER_REFERENCE_DOES_NOT_VERIFY_IDENTITY_QUALIFICATION_OR_INDEPENDENCE'])});
    return deepFreeze({...envelope,attestation,claimTruthVerified:false,evidentiarySufficiencyDetermined:false,decisionAuthority:false,linkDiagnostic:{state:'EXACT_ATTESTATION_REFERENCE_LINKED',sourceState:'AVAILABLE',reason:null,ruleId:RULE.id,candidateCount:candidates.length,validCandidateCount:valid.length,conflictReasons:Object.freeze([])},capabilities:CAPABILITIES,authority:AUTHORITY,integrity:INTEGRITY});
  }
  function summarize(envelopes,sourceState){
    const linked=envelopes.filter(e=>e.attestation?.state==='ATTESTATION_REFERENCE_ONLY').length;
    const conflicts=envelopes.filter(e=>e.linkDiagnostic?.state==='CLAIM_ATTESTATION_CANDIDATE_CONFLICT').length;
    const noLink=envelopes.length-linked;
    const refs=uniq(envelopes.flatMap(e=>e.attestation?.explicitRefs||[])).length;
    return deepFreeze({total:envelopes.length,sourceState:sourceState.state,linked,unlinked:noLink,conflicts,explicitAttestationReferences:refs,claimTruthVerified:0,reviewerIdentityVerified:0,reviewerQualificationVerified:0,reviewerIndependenceVerified:0,evidentiarySufficiencyDetermined:0,externalVerificationDetermined:0,certificationValidityVerified:0,decisionAuthority:0,semantics:'EXACT_LINK_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE'});
  }
  function build(host,options={}){
    const v174Factory=globalThis.__SANA_DATAROOM_EXECUTIVE_V174_FACTORY__||host?.__SANA_DATAROOM_EXECUTIVE_V174_FACTORY__;
    if(!v174Factory?.create)throw new Error('V174_FACTORY_REQUIRED');
    const parent=v174Factory.create(host).build(options),sourceState=readSource(host),envelopes=parent.envelopes.map(e=>envelopeWithAttestation(e,sourceState));
    return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,parentSha:PARENT_SHA,scope:parent.scope,envelopes,summary:summarize(envelopes,sourceState),sourceContract:{globalName:SOURCE_GLOBAL,schema:SOURCE_SCHEMA,state:sourceState.state,reason:sourceState.reason,recordCount:sourceState.records.length},audit:{linkRules:LINK_RULES,ruleCount:1,heuristicLinking:false,sourceStates:SOURCE_STATES,conflictPolicy:RULE.conflictPolicy,provenanceGap:parent.audit?.provenanceGap||null},capabilities:CAPABILITIES,authority:AUTHORITY,provenance:{parent:PARENT,parentSha:PARENT_SHA,parentSchema:parent.schema,parentVersion:parent.version,sourceSchema:SOURCE_SCHEMA,linkRule:RULE.id,linkPolicy:'EXACT_CONTRACTED_LINKS_ONLY'},integrity:INTEGRITY});
  }
  function forSection(host,sectionId,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.sectionId===sectionId);return deepFreeze({...r,sectionId,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function forSource(host,sourceId,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.sourceId===sourceId);return deepFreeze({...r,sourceId,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function forAttestationState(host,state,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.attestation?.state===state);return deepFreeze({...r,attestationState:state,envelopes,summary:summarize(envelopes,{state:r.sourceContract.state})});}
  function create(host){const target=host||globalThis;return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,sourceSchema:SOURCE_SCHEMA,linkRules:LINK_RULES,capabilities:CAPABILITIES,authority:AUTHORITY,build:o=>build(target,o),forSection:(id,o)=>forSection(target,id,o),forSource:(id,o)=>forSource(target,id,o),forAttestationState:(state,o)=>forAttestationState(target,state,o),integrity:INTEGRITY});}

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,create,integrity:INTEGRITY});
  if(typeof window!=='undefined')window.__SANA_DATAROOM_EXECUTIVE_V175_FACTORY__=factory;
  if(typeof globalThis!=='undefined')globalThis.__SANA_DATAROOM_EXECUTIVE_V175_FACTORY__=factory;
})();