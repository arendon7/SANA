(() => {
  'use strict';

  const VERSION='V174';
  const SCHEMA='SANA_DATAROOM_EXECUTIVE_CLAIM_ENVELOPE_V1';
  const PARENT='V173';
  const PARENT_SHA='0ff67fe5c768c4e1aa50760eef683ce88bcb1d33';
  const ATTESTATION_STATES=Object.freeze(['NO_EXPLICIT_ATTESTATION_LINK','ATTESTATION_REFERENCE_ONLY']);
  const EXTERNAL_VERIFICATION_STATES=Object.freeze(['NOT_DETERMINED','EXTERNAL_VERIFICATION_REFERENCE_ONLY','EXPLICITLY_NOT_VERIFIED_AT_SOURCE']);
  const LINK_RULES=Object.freeze([]);
  const INSPECTED_CONTRACTS=Object.freeze([
    Object.freeze({id:'DOCUMENT_ASSURANCE',file:'sana-v3-dataroom-assurance-ledger.js',globalName:'__SANA_DATAROOM_ASSURANCE__',schema:'SANA_DATAROOM_DOCUMENT_ASSURANCE_V1',claimSpecificLink:'NOT_MATERIALIZED',observedReferenceKeys:Object.freeze(['caseId','capitalCaseRef','exchangeCaseRef','snapshotRef','documentRef','requestRef','verifierRef','resultRef','evidenceRef'])}),
    Object.freeze({id:'DOCUMENT_ASSURANCE_HISTORY',file:'sana-v3-dataroom-assurance-history.js',globalName:'__SANA_DATAROOM_ASSURANCE_HISTORY__',schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',claimSpecificLink:'NOT_MATERIALIZED',observedReferenceKeys:Object.freeze(['caseId','snapshotRef','documentRefs','verifierRefs','resultRefs','evidenceRefs'])}),
    Object.freeze({id:'REVIEW_GOVERNANCE',file:'sana-v3-dataroom-review-governance.js',globalName:'__SANA_DATAROOM_REVIEW_GOVERNANCE__',schema:'SANA_DATAROOM_REVIEW_GOVERNANCE_V1',claimSpecificLink:'NOT_MATERIALIZED',observedReferenceKeys:Object.freeze(['caseId','capitalCaseRef','reviewCaseRef','snapshotRef','assignmentRef','reviewerRef','scopeRef','evidenceRef'])}),
    Object.freeze({id:'SOURCE_EVIDENCE_HISTORY',file:'sana-v3-dataroom-source-evidence-history.js',globalName:'__SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__',schema:'SNAPSHOT_HISTORY_REFERENCE',claimSpecificLink:'NOT_MATERIALIZED',observedReferenceKeys:Object.freeze(['snapshotRef','evidenceRef'])}),
    Object.freeze({id:'IMPACT_HISTORY',file:'sana-v3-dataroom-impact-history.js',globalName:'__SANA_DATAROOM_IMPACT_HISTORY__',schema:'SNAPSHOT_HISTORY_REFERENCE',claimSpecificLink:'NOT_MATERIALIZED',observedReferenceKeys:Object.freeze(['snapshotRef','entityRef'])})
  ]);
  const AUTHORITY=Object.freeze({canonicalMutationAvailable:false,financialMutationAvailable:false,attestationAuthority:false,externalVerificationAuthority:false,truthVerificationAuthority:false,evidentiarySufficiencyAuthority:false,reviewerIdentityAuthority:false,reviewerQualificationAuthority:false,certificationAuthority:false,decisionAuthority:false,aiAuthority:'ADVISORY_ONLY',offerAuthority:false,solicitationAuthority:false,brokerageAuthority:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='CLAIM ≠ ATTESTATION · ATTESTATION_REFERENCE ≠ VERIFIED_REVIEWER_IDENTITY ≠ VERIFIED_REVIEWER_QUALIFICATION · HUMAN_REVIEW_ACTIVITY ≠ ATTESTATION_TO_CLAIM_TRUTH · DOCUMENT_ASSURANCE ≠ EXTERNAL_VERIFICATION_OF_CLAIM · RESULT_REFERENCE ≠ VERIFIED_RESULT · VERIFICATION_LABEL ≠ CLAIM_VERIFICATION · EXTERNAL_VERIFICATION_REFERENCE ≠ CERTIFICATION_VALIDITY · NO_EXPLICIT_LINK ≠ NEGATIVE_PROJECT_CONCLUSION · CLAIM_TRUTH_NOT_DETERMINED · EVIDENTIARY_SUFFICIENCY_NOT_DETERMINED · COUNTS_ONLY ≠ SCORE · NO_HEURISTIC_LINKING · NO_AUTOMATIC_APPROVAL · NO_MUTATION · READ_ONLY';

  function deepFreeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);
  }
  function envelopeId(claimId){return `ENV::${claimId}`}
  function makeEnvelope(claim){
    return deepFreeze({
      schema:SCHEMA,version:VERSION,envelopeId:envelopeId(claim.claimId),claimId:claim.claimId,sectionId:claim.sectionId,sourceId:claim.sourceId,sourceGlobal:claim.sourceGlobal,sourceFile:claim.sourceFile,sourceView:claim.sourceView,
      claimClass:claim.claimClass,controlledStatement:claim.statement,claimSupportState:claim.supportState,selectedLot:claim.selectedLot,locatorKeys:Object.freeze(Array.from(claim.locatorKeys||[])),scopeQualities:Object.freeze(Array.from(claim.scopeQualities||[])),limitations:Object.freeze(Array.from(claim.limitations||[])),
      claimTruthVerified:false,evidentiarySufficiencyDetermined:false,decisionAuthority:false,
      attestation:Object.freeze({state:'NO_EXPLICIT_ATTESTATION_LINK',explicitRefs:Object.freeze([]),reviewerIdentityVerified:false,reviewerQualificationVerified:false,claimTruthAttested:false,limitations:Object.freeze(['NO_CLAIM_SPECIFIC_ATTESTATION_CONTRACT_MATERIALIZED','REVIEW_ACTIVITY_OR_SHARED_CONTEXT_MUST_NOT_BE_INFERRED_AS_ATTESTATION'])}),
      externalVerification:Object.freeze({state:'NOT_DETERMINED',explicitRefs:Object.freeze([]),verifiedResult:false,certificationValidityVerified:false,limitations:Object.freeze(['NO_CLAIM_SPECIFIC_EXTERNAL_VERIFICATION_CONTRACT_MATERIALIZED','ASSURANCE_RESULT_OR_VERIFICATION_LABEL_MUST_NOT_BE_INFERRED_AS_CLAIM_VERIFICATION'])}),
      documentaryAssuranceContext:Object.freeze({state:'NOT_CLAIM_LINKED',refs:Object.freeze([]),claimSpecific:false,doesNotAttestClaimTruth:true}),
      referenceOnly:true,authority:AUTHORITY,integrity:INTEGRITY
    });
  }
  function summarize(envelopes){
    const attestation=Object.fromEntries(ATTESTATION_STATES.map(k=>[k,0]));const externalVerification=Object.fromEntries(EXTERNAL_VERIFICATION_STATES.map(k=>[k,0]));
    for(const e of envelopes){attestation[e.attestation.state]=(attestation[e.attestation.state]||0)+1;externalVerification[e.externalVerification.state]=(externalVerification[e.externalVerification.state]||0)+1;}
    return deepFreeze({total:envelopes.length,attestation,externalVerification,claimTruthVerified:0,evidentiarySufficiencyDetermined:0,decisionAuthority:0,explicitAttestationReferences:0,explicitExternalVerificationReferences:0,semantics:'ENVELOPE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE'});
  }
  function audit(){
    return deepFreeze({contractsInspected:INSPECTED_CONTRACTS,linkRules:LINK_RULES,claimSpecificLinkContracts:0,outcome:'CLAIM_SPECIFIC_LINK_NOT_FOUND',policy:'FAIL_CLOSED_WITHOUT_EXACT_CONTRACTED_LINK',heuristicLinking:false,acceptedExactLinkFields:Object.freeze([]),provenanceGap:Object.freeze({versions:Object.freeze(['V164','V165','V166','V167','V168','V169']),state:'NOT_MATERIALIZED_IN_VERIFIED_GIT_LINEAGE',instruction:'DO_NOT_RECONSTRUCT_MISSING_HISTORY'})});
  }
  function build(host,options={}){
    const v173Factory=globalThis.__SANA_DATAROOM_EXECUTIVE_V173_FACTORY__||host?.__SANA_DATAROOM_EXECUTIVE_V173_FACTORY__;
    if(!v173Factory?.create)throw new Error('V173_FACTORY_REQUIRED');
    const parent=v173Factory.create(host).build(options),envelopes=parent.claims.map(makeEnvelope);
    return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,parentSha:PARENT_SHA,scope:parent.scope,envelopes,summary:summarize(envelopes),audit:audit(),authority:AUTHORITY,provenance:{parent:PARENT,parentSha:PARENT_SHA,parentSchema:parent.schema,parentVersion:parent.version,claimTemplates:parent.provenance?.templates||'CLAIM_TEMPLATES_V1',linkPolicy:'EXACT_CONTRACTED_LINKS_ONLY',linkRules:'NONE_MATERIALIZED_AT_V174'},integrity:INTEGRITY});
  }
  function forSection(host,sectionId,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.sectionId===sectionId);return deepFreeze({...r,sectionId,envelopes,summary:summarize(envelopes)});}
  function forSource(host,sourceId,options={}){const r=build(host,options),envelopes=r.envelopes.filter(e=>e.sourceId===sourceId);return deepFreeze({...r,sourceId,envelopes,summary:summarize(envelopes)});}
  function create(host){const target=host||globalThis;return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,attestationStates:ATTESTATION_STATES,externalVerificationStates:EXTERNAL_VERIFICATION_STATES,linkRules:LINK_RULES,inspectedContracts:INSPECTED_CONTRACTS,authority:AUTHORITY,build:o=>build(target,o),forSection:(id,o)=>forSection(target,id,o),forSource:(id,o)=>forSource(target,id,o),audit,integrity:INTEGRITY});}

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,create,integrity:INTEGRITY});
  if(typeof window!=='undefined')window.__SANA_DATAROOM_EXECUTIVE_V174_FACTORY__=factory;
  if(typeof globalThis!=='undefined')globalThis.__SANA_DATAROOM_EXECUTIVE_V174_FACTORY__=factory;
})();