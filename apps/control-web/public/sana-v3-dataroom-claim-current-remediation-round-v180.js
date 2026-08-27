(() => {
  'use strict';

  const VERSION='V180';
  const SCHEMA='SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND_POINTER_V1';
  const STATE='CURRENT_ROUND_REFERENCE_ONLY';
  const AUTHORITY=Object.freeze({currentRoundAuthority:false,latestRoundAuthority:false,chronologyAuthority:false,claimTruthAuthority:false,evidenceAcceptanceAuthority:false,evidentiarySufficiencyAuthority:false,findingResolutionAuthority:false,certificationAuthority:false,dueDiligenceApprovalAuthority:false,eligibilityAuthority:false,financingApprovalAuthority:false,investmentDecisionAuthority:false,canonicalMutationAvailable:false,financialMutationAvailable:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='CURRENT_ROUND_POINTER_REFERENCE ≠ CURRENT_ROUND_AUTHORITY ≠ LATEST_ROUND · POINTER_OBSERVED_AT ≠ PRIORITY ≠ CHRONOLOGICAL_TRUTH · CURRENT_POINTER ≠ ROUND_COMPLETION ≠ FINDING_RESOLUTION · CURRENT_POINTER ≠ EVIDENCE_ACCEPTED ≠ EVIDENCE_SUFFICIENCY · CURRENT_POINTER ≠ CERTIFICATION ≠ DUE_DILIGENCE_APPROVAL ≠ ELIGIBILITY ≠ FINANCING_APPROVAL ≠ INVESTMENT_DECISION · ONE_ACCEPTED_POINTER_PER_CLAIM_ENVELOPE · MULTIPLE_POINTERS_FAIL_CLOSED · ZERO_BASELINE_RECORDS · REFERENCE_ONLY · NO_STORAGE_WRITE · NO_NETWORK · NO_FINANCIAL_MUTATION';

  function deepFreeze(value,seen=new WeakSet()){if(!value||typeof value!=='object'||seen.has(value))return value;seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);}
  function text(v){return v===undefined||v===null?'':String(v).trim()}
  function uniq(values){return [...new Set((Array.isArray(values)?values:[]).map(text).filter(Boolean))].sort()}
  function normalize(raw,index){
    if(!raw||typeof raw!=='object')return {valid:false,index,reason:'RECORD_NOT_OBJECT'};
    const pointerRef=text(raw.pointerRef),claimId=text(raw.claimId),claimEnvelopeRef=text(raw.claimEnvelopeRef),currentRoundRef=text(raw.currentRoundRef),pointerState=text(raw.pointerState);
    if(!pointerRef)return {valid:false,index,reason:'POINTER_REF_REQUIRED'};
    if(!claimId)return {valid:false,index,reason:'CLAIM_ID_REQUIRED'};
    if(!claimEnvelopeRef)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_REQUIRED'};
    if(claimEnvelopeRef!==`ENV::${claimId}`)return {valid:false,index,reason:'CLAIM_ENVELOPE_REF_MISMATCH'};
    if(!currentRoundRef)return {valid:false,index,reason:'CURRENT_ROUND_REF_REQUIRED'};
    if(pointerState!==STATE)return {valid:false,index,reason:'CURRENT_ROUND_POINTER_STATE_NOT_ALLOWED'};
    return {valid:true,index,record:deepFreeze({schema:SCHEMA,version:VERSION,pointerRef,claimId,claimEnvelopeRef,currentRoundRef,pointerState,locatorKeys:Object.freeze(uniq(raw.locatorKeys)),lotId:text(raw.lotId)||null,observedAt:text(raw.observedAt)||null,provenance:text(raw.provenance)||'EXPLICIT_REFERENCE_INPUT',referenceOnly:true,currentRoundReferenceValidated:false,currentRoundAuthority:false,latestRoundReferenceDetermined:false,latestRoundAuthority:false,chronologyDetermined:false,chronologyAuthority:false,claimTruthVerified:false,evidenceAccepted:false,evidentiarySufficiencyDetermined:false,findingResolved:false,dueDiligenceApproved:false,eligible:false,financingApproved:false,decisionAuthority:false,authority:AUTHORITY,integrity:INTEGRITY})};
  }
  function create(records=[]){
    const input=Array.isArray(records)?records:[],normalized=[],rejected=[];input.forEach((raw,index)=>{const r=normalize(raw,index);if(r.valid)normalized.push(r.record);else rejected.push(Object.freeze({index:r.index,reason:r.reason}));});
    const duplicateRefs=new Set(),seenRefs=new Set();for(const r of normalized){if(seenRefs.has(r.pointerRef))duplicateRefs.add(r.pointerRef);seenRefs.add(r.pointerRef)}
    let accepted=normalized.filter(r=>!duplicateRefs.has(r.pointerRef));for(const ref of duplicateRefs)rejected.push(Object.freeze({index:null,reason:'DUPLICATE_POINTER_REF',pointerRef:ref}));
    const claimCounts=new Map();for(const r of accepted)claimCounts.set(r.claimEnvelopeRef,(claimCounts.get(r.claimEnvelopeRef)||0)+1);
    const multipleClaims=new Set([...claimCounts.entries()].filter(([,n])=>n>1).map(([k])=>k));if(multipleClaims.size){accepted=accepted.filter(r=>!multipleClaims.has(r.claimEnvelopeRef));for(const key of multipleClaims)rejected.push(Object.freeze({index:null,reason:'MULTIPLE_CURRENT_POINTERS_FOR_CLAIM',claimEnvelopeRef:key}));}
    const finalRecords=Object.freeze(accepted),rejectedFrozen=Object.freeze(rejected);
    function forClaim(claimId){const id=text(claimId);return Object.freeze(finalRecords.filter(r=>r.claimId===id))}
    function summary(){return deepFreeze({schema:SCHEMA,version:VERSION,pointerReferences:finalRecords.length,rejected:rejectedFrozen.length,currentRoundReferencesValidated:0,currentRoundAuthority:0,latestRoundReferencesDetermined:0,latestRoundAuthority:0,chronologyDetermined:0,claimTruthVerified:0,evidenceAccepted:0,evidentiarySufficiencyDetermined:0,findingResolved:0,dueDiligenceApprovals:0,eligibilityDecisions:0,financingApprovals:0,decisionAuthority:0,semantics:'CURRENT_POINTER_REFERENCE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE · NO_TIMESTAMP_OR_ORDER_SELECTION'})}
    return deepFreeze({schema:SCHEMA,version:VERSION,state:STATE,records:()=>finalRecords,forClaim,diagnostics:()=>rejectedFrozen,summary,authority:AUTHORITY,integrity:INTEGRITY});
  }
  const factory=deepFreeze({schema:SCHEMA,version:VERSION,state:STATE,create,authority:AUTHORITY,integrity:INTEGRITY});const baseline=create([]);
  if(typeof window!=='undefined'){window.__SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND_V180_FACTORY__=factory;if(!window.__SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND__)window.__SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND__=baseline;}
  if(typeof globalThis!=='undefined'){globalThis.__SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND_V180_FACTORY__=factory;if(!globalThis.__SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND__)globalThis.__SANA_DATAROOM_CLAIM_CURRENT_REMEDIATION_ROUND__=baseline;}
})();