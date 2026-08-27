(() => {
  'use strict';

  const VERSION='V179';
  const SCHEMA='SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND_V1';
  const AUTHORITY=Object.freeze({claimTruthAuthority:false,currentRoundAuthority:false,latestRoundAuthority:false,chronologyAuthority:false,evidenceAcceptanceAuthority:false,evidentiarySufficiencyAuthority:false,findingResolutionAuthority:false,reviewerIdentityAuthority:false,recipientIdentityAuthority:false,responseProviderIdentityAuthority:false,certificationAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,financingApprovalAuthority:false,investmentDecisionAuthority:false,canonicalMutationAvailable:false,financialMutationAvailable:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='REMEDIATION_ROUND_REFERENCE ≠ CURRENT_ROUND ≠ LATEST_ROUND · EXPLICIT_SEQUENCE_BINDING ≠ CHRONOLOGICAL_TRUTH · OPENING_ADDITIONAL_EVIDENCE_REVIEW ≠ NEGATIVE_PROJECT_CONCLUSION · REQUEST_RESPONSE_REFERENCE ≠ EVIDENCE_ACCEPTED ≠ SUFFICIENT_EVIDENCE ≠ FINDING_RESOLVED · FOLLOWUP_REVIEW_REFERENCE ≠ SYSTEM_SUFFICIENCY_DETERMINATION · FOLLOWUP_SUFFICIENT_FOR_SCOPE ≠ UNIVERSAL_SUFFICIENCY · ROUND_HISTORY ≠ CERTIFICATION ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ FINANCING_APPROVAL ≠ INVESTMENT_DECISION · ZERO_BASELINE_RECORDS · REFERENCE_ONLY · NO_CURRENT_OR_LATEST_INFERENCE · NO_STORAGE_WRITE · NO_NETWORK · NO_FINANCIAL_MUTATION';

  function deepFreeze(value,seen=new WeakSet()){if(!value||typeof value!=='object'||seen.has(value))return value;seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);}
  function text(v){return v===undefined||v===null?'':String(v).trim()}
  function uniq(values){return [...new Set((Array.isArray(values)?values:[]).map(text).filter(Boolean))].sort()}
  function normalize(raw,index){
    if(!raw||typeof raw!=='object')return {valid:false,index,reason:'RECORD_NOT_OBJECT'};
    const roundRef=text(raw.roundRef),claimId=text(raw.claimId),claimEnvelopeRef=text(raw.claimEnvelopeRef),openingReviewRef=text(raw.openingReviewRef),requestRef=text(raw.requestRef),followupReviewRef=text(raw.followupReviewRef)||null,responseRefs=uniq(raw.responseRefs);
    if(!roundRef)return {valid:false,index,reason:'ROUND_REF_REQUIRED'};
    if(!claimId)return {valid:false,index,reason:'CLAIM_ID_REQUIRED'};
    if(!claimEnvelopeRef)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_REQUIRED'};
    if(claimEnvelopeRef!==`ENV::${claimId}`)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_MISMATCH'};
    if(!openingReviewRef)return {valid:false,index,reason:'OPENING_REVIEW_REF_REQUIRED'};
    if(!requestRef)return {valid:false,index,reason:'REQUEST_REF_REQUIRED'};
    if(followupReviewRef===openingReviewRef)return {valid:false,index,reason:'FOLLOWUP_REVIEW_MUST_DIFFER_FROM_OPENING'};
    if(followupReviewRef&&!responseRefs.length)return {valid:false,index,reason:'FOLLOWUP_REVIEW_REQUIRES_RESPONSE_REF'};
    return {valid:true,index,record:deepFreeze({schema:SCHEMA,version:VERSION,roundRef,claimId,claimEnvelopeRef,locatorKeys:Object.freeze(uniq(raw.locatorKeys)),lotId:text(raw.lotId)||null,openingReviewRef,requestRef,responseRefs:Object.freeze(responseRefs),followupReviewRef,observedAt:text(raw.observedAt)||null,provenance:text(raw.provenance)||'EXPLICIT_REFERENCE_INPUT',referenceOnly:true,currentRoundDetermined:false,latestRoundDetermined:false,chronologyDetermined:false,claimTruthVerified:false,evidenceAccepted:false,evidentiarySufficiencyDetermined:false,findingResolved:false,dueDiligenceApproved:false,eligible:false,financingApproved:false,decisionAuthority:false,authority:AUTHORITY,integrity:INTEGRITY})};
  }
  function create(records=[]){
    const input=Array.isArray(records)?records:[],normalized=[],rejected=[];input.forEach((raw,index)=>{const r=normalize(raw,index);if(r.valid)normalized.push(r.record);else rejected.push(Object.freeze({index:r.index,reason:r.reason}));});
    const duplicateRounds=new Set(),seenRounds=new Set();for(const r of normalized){if(seenRounds.has(r.roundRef))duplicateRounds.add(r.roundRef);seenRounds.add(r.roundRef)}
    let accepted=normalized.filter(r=>!duplicateRounds.has(r.roundRef));for(const ref of duplicateRounds)rejected.push(Object.freeze({index:null,reason:'DUPLICATE_ROUND_REF',roundRef:ref}));
    const bindingCounts=new Map();for(const r of accepted){const key=`${r.claimEnvelopeRef}::${r.openingReviewRef}::${r.requestRef}`;bindingCounts.set(key,(bindingCounts.get(key)||0)+1)}
    const duplicateBindings=new Set([...bindingCounts.entries()].filter(([,n])=>n>1).map(([k])=>k));if(duplicateBindings.size){accepted=accepted.filter(r=>!duplicateBindings.has(`${r.claimEnvelopeRef}::${r.openingReviewRef}::${r.requestRef}`));for(const key of duplicateBindings)rejected.push(Object.freeze({index:null,reason:'DUPLICATE_ROUND_BINDING',bindingKey:key}));}
    const finalRecords=Object.freeze(accepted),rejectedFrozen=Object.freeze(rejected);
    function forClaim(claimId){const id=text(claimId);return Object.freeze(finalRecords.filter(r=>r.claimId===id))}
    function summary(){const responseRounds=finalRecords.filter(r=>r.responseRefs.length).length,followupRounds=finalRecords.filter(r=>r.followupReviewRef).length;return deepFreeze({schema:SCHEMA,version:VERSION,roundReferences:finalRecords.length,rejected:rejectedFrozen.length,roundsWithResponseReferences:responseRounds,roundsWithFollowupReviewReferences:followupRounds,currentRoundDetermined:0,latestRoundDetermined:0,chronologyDetermined:0,evidenceAccepted:0,evidentiarySufficiencyDetermined:0,findingResolved:0,dueDiligenceApprovals:0,eligibilityDecisions:0,financingApprovals:0,decisionAuthority:0,semantics:'ROUND_REFERENCE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE · NO_CURRENT_OR_LATEST_INFERENCE'})}
    return deepFreeze({schema:SCHEMA,version:VERSION,records:()=>finalRecords,forClaim,diagnostics:()=>rejectedFrozen,summary,authority:AUTHORITY,integrity:INTEGRITY});
  }
  const factory=deepFreeze({schema:SCHEMA,version:VERSION,create,authority:AUTHORITY,integrity:INTEGRITY});const baseline=create([]);
  if(typeof window!=='undefined'){window.__SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND_V179_FACTORY__=factory;if(!window.__SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND__)window.__SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND__=baseline;}
  if(typeof globalThis!=='undefined'){globalThis.__SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND_V179_FACTORY__=factory;if(!globalThis.__SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND__)globalThis.__SANA_DATAROOM_CLAIM_EVIDENCE_REMEDIATION_ROUND__=baseline;}
})();