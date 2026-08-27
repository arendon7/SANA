import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const p171='apps/control-web/public/sana-v3-dataroom-executive-v171.js';
const p172='apps/control-web/public/sana-v3-dataroom-executive-v172.js';
const p173='apps/control-web/public/sana-v3-dataroom-executive-v173.js';
const p174='apps/control-web/public/sana-v3-dataroom-executive-v174.js';
const s171=fs.readFileSync(p171,'utf8'),s172=fs.readFileSync(p172,'utf8'),s173=fs.readFileSync(p173,'utf8'),src=fs.readFileSync(p174,'utf8');

for(const [pattern,label] of [
  [/\bVERSION\s*=\s*['"]V174['"]/, 'VERSION=V174'],
  [/\bSCHEMA\s*=\s*['"]SANA_DATAROOM_EXECUTIVE_CLAIM_ENVELOPE_V1['"]/, 'claim envelope schema'],
  [/\bPARENT_SHA\s*=\s*['"]0ff67fe5c768c4e1aa50760eef683ce88bcb1d33['"]/, 'exact V173 parent'],
  [/NO_EXPLICIT_ATTESTATION_LINK/, 'closed attestation state'],[/NOT_DETERMINED/, 'closed verification state'],
  [/CLAIM_SPECIFIC_LINK_NOT_FOUND/, 'audit finding'],[/FAIL_CLOSED_WITHOUT_EXACT_CONTRACTED_LINK/, 'fail closed policy'],[/NO_HEURISTIC_LINKING/, 'no heuristic linking'],
  [/attestationAuthority\s*:\s*false/, 'attestation authority false'],[/externalVerificationAuthority\s*:\s*false/, 'external verification authority false'],[/truthVerificationAuthority\s*:\s*false/, 'truth authority false'],[/decisionAuthority\s*:\s*false/, 'decision authority false'],
  [/DOCUMENT_ASSURANCE ≠ EXTERNAL_VERIFICATION_OF_CLAIM/, 'assurance boundary'],[/COUNTS_ONLY ≠ SCORE/, 'count boundary'],[/DO_NOT_RECONSTRUCT_MISSING_HISTORY/, 'provenance gap boundary']
])assert.ok(pattern.test(src),`missing V174 invariant: ${label}`);
for(const forbidden of ['fetch(','XMLHttpRequest','localStorage.setItem','sessionStorage.setItem','indexedDB.open','canonicalMutationAvailable:true','financialMutationAvailable:true','attestationAuthority:true','externalVerificationAuthority:true','truthVerificationAuthority:true','decisionAuthority:true','riskScore:','creditScore:','investmentScore:','projectScore:','overallScore:'])assert.ok(!src.includes(forbidden),`forbidden V174 token: ${forbidden}`);
assert.ok(/const LINK_RULES=Object\.freeze\(\[\]\)/.test(src),'V174 must not materialize a claim link rule without a source contract');

const context={window:{},structuredClone,console};context.globalThis=context;
vm.runInNewContext(s171,context,{filename:p171});vm.runInNewContext(s172,context,{filename:p172});vm.runInNewContext(s173,context,{filename:p173});vm.runInNewContext(src,context,{filename:p174});
const factory=context.window.__SANA_DATAROOM_EXECUTIVE_V174_FACTORY__;
assert.ok(factory?.create,'V174 factory missing');assert.equal(factory.schema,'SANA_DATAROOM_EXECUTIVE_CLAIM_ENVELOPE_V1');assert.equal(factory.version,'V174');assert.equal(factory.linkRules.length,0);

const targetClaimId='CLM::CAPITAL_REVIEW::SOURCE_REFERENCE_PRESENT::LOT-A';
const data={
  snapshots:[{id:'SNAP-A',reportType:'RPT-DD',cutoff:'2026-08-20',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}}],
  state:{valid:true,state:'CAPTURED',snapshot:{id:'SNAP-A',cutoff:'2026-08-20'},rows:[{id:'ROW-A',lotId:'LOT-A'},{id:'ROW-B',lotId:'LOT-B'}],integrity:'SNAPSHOT_ONLY'},
  sourceEvidenceState:{valid:true,state:'CAPTURED',snapshot:{id:'SNAP-A',cutoff:'2026-08-20'},rows:[{id:'SE-A',lotId:'LOT-A',humanReviewRecorded:true,evidenceAccepted:true,externalVerificationStatus:'VERIFICADO_EXTERNO',claimId:targetClaimId,observedAt:'2026-08-20T10:00:00-05:00'}],integrity:'DECLARED_STATUS_NOT_VERIFICATION'},
  capital:[{id:'CAP-A',lot:'LOT-A',events:[{id:'CAP-A-E1',lot:'LOT-A',kind:'REVIEW_STARTED',observedAt:'2026-08-20T10:00:00-05:00'}]},{id:'CAP-B',lot:'LOT-B',events:[{id:'CAP-B-E1',lot:'LOT-B',kind:'REVIEW_STARTED',observedAt:'2026-08-20T11:00:00-05:00'}]}],
  refs:[{id:'RG-A',lot:'LOT-A',claimId:targetClaimId,sourceId:'CAPITAL_REVIEW',observedAt:'2026-08-20T10:00:00-05:00',reviewerRef:'REVIEWER-DECOY',reviewerQualified:true,events:[{id:'RG-A-E1',lot:'LOT-A',kind:'REVIEW_SCOPE_DECLARED',observedAt:'2026-08-20T10:00:00-05:00'}]},{id:'RG-B',lot:'LOT-B',events:[{id:'RG-B-E1',lot:'LOT-B',kind:'REVIEW_SCOPE_DECLARED'}]}],
  assurance:[{id:'AS-DECOY',caseId:'AS-LOT-A',lot:'LOT-A',claimId:targetClaimId,sourceId:'CAPITAL_REVIEW',observedAt:'2026-08-20T10:00:00-05:00',resultRef:'RESULT-DECOY',resultState:'PASS_REFERENCE_ONLY',verificationState:'VERIFICADO_EXTERNO',evidenceAccepted:true,verified:true}]
};
const before=JSON.stringify(data),state=()=>data.state;
const host={
  DEMO:{lots:[{id:'LOT-A'},{id:'LOT-B'}]},
  __SANA_DATAROOM_360__:{state},__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>data.snapshots},
  __SANA_CAPITAL_REVIEW__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},__SANA_CAPITAL_GOVERNANCE__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},__SANA_DATAROOM_FINDINGS__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},
  __SANA_DUE_DILIGENCE_GAPS__:{current:()=>({valid:true,state:'CAPTURED',snapshot:data.state.snapshot,gaps:[{id:'GAP-A',lot:'LOT-A'},{id:'GAP-B',lot:'LOT-B'}]})},
  __SANA_DATAROOM_PHENOLOGY_HISTORY__:{state},__SANA_DATAROOM_LABOR_HISTORY__:{state},__SANA_DATAROOM_HEALTH_HISTORY__:{state},__SANA_DATAROOM_HEALTH_LIFECYCLE__:{state},__SANA_DATAROOM_NUTRITION_HISTORY__:{state},__SANA_DATAROOM_FORECAST_HISTORY__:{state},__SANA_DATAROOM_HARVEST_HISTORY__:{state},__SANA_DATAROOM_INVENTORY_HISTORY__:{state},__SANA_DATAROOM_ECONOMIC_RECONCILIATION_HISTORY__:{state},__SANA_DATAROOM_COMMERCIAL_HISTORY__:{state},__SANA_DATAROOM_DATA_TRUST_HISTORY__:{state},__SANA_DATAROOM_CAPTURE_SYNC_HISTORY__:{state},__SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__:{state:()=>data.sourceEvidenceState},__SANA_DATAROOM_CIRCULARITY_HISTORY__:{state},__SANA_DATAROOM_MATERIAL_HISTORY__:{state},__SANA_DATAROOM_IMPACT_HISTORY__:{state},__SANA_DATAROOM_CAPITAL_GOVERNANCE_HISTORY__:{state},__SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__:{state},__SANA_DATAROOM_FINDINGS_HISTORY__:{state},
  __SANA_DATAROOM_REVIEW_GOVERNANCE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_CASE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_HANDOFF__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_FEEDBACK__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_RESPONSE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_DISPOSITION__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_ROUND__:{cases:()=>data.refs},
  __SANA_DATAROOM_ASSURANCE__:{schema:'SANA_DATAROOM_DOCUMENT_ASSURANCE_V1',cases:()=>data.assurance,forLot:lot=>data.assurance.filter(x=>x.lot===lot),summary:()=>({verifiedDocuments:99})},
  __SANA_DATAROOM_ASSURANCE_HISTORY__:{state:()=>({valid:true,state:'CAPTURED',snapshot:data.state.snapshot,rows:data.assurance})}
};

const api=factory.create(host),result=api.build({lot:'LOT-A'}),parent=context.window.__SANA_DATAROOM_EXECUTIVE_V173_FACTORY__.create(host).build({lot:'LOT-A'});
assert.equal(result.scope.lot,'LOT-A');assert.equal(result.parent,'V173');assert.equal(result.parentSha,'0ff67fe5c768c4e1aa50760eef683ce88bcb1d33');assert.equal(result.provenance.parentSchema,'SANA_DATAROOM_EXECUTIVE_CLAIMS_V1');assert.equal(result.provenance.linkRules,'NONE_MATERIALIZED_AT_V174');
assert.equal(result.envelopes.length,parent.claims.length,'V174 must envelope each parent claim exactly once');assert.equal(new Set(result.envelopes.map(e=>e.envelopeId)).size,result.envelopes.length,'envelope IDs must be unique');
for(let i=0;i<result.envelopes.length;i++){
  const e=result.envelopes[i],c=parent.claims[i];
  assert.equal(e.claimId,c.claimId);assert.equal(e.controlledStatement,c.statement);assert.equal(JSON.stringify(Array.from(e.locatorKeys)),JSON.stringify(Array.from(c.locatorKeys)),'V174 changed parent locator keys');
  assert.equal(e.attestation.state,'NO_EXPLICIT_ATTESTATION_LINK');assert.equal(e.attestation.explicitRefs.length,0);assert.equal(e.attestation.reviewerIdentityVerified,false);assert.equal(e.attestation.reviewerQualificationVerified,false);assert.equal(e.attestation.claimTruthAttested,false);
  assert.equal(e.externalVerification.state,'NOT_DETERMINED');assert.equal(e.externalVerification.explicitRefs.length,0);assert.equal(e.externalVerification.verifiedResult,false);assert.equal(e.externalVerification.certificationValidityVerified,false);
  assert.equal(e.documentaryAssuranceContext.state,'NOT_CLAIM_LINKED');assert.equal(e.documentaryAssuranceContext.refs.length,0);assert.equal(e.documentaryAssuranceContext.claimSpecific,false);assert.equal(e.documentaryAssuranceContext.doesNotAttestClaimTruth,true);
  assert.equal(e.claimTruthVerified,false);assert.equal(e.evidentiarySufficiencyDetermined,false);assert.equal(e.decisionAuthority,false);assert.equal(e.referenceOnly,true);
  assert.ok(Object.isFrozen(e)&&Object.isFrozen(e.attestation)&&Object.isFrozen(e.attestation.explicitRefs)&&Object.isFrozen(e.externalVerification)&&Object.isFrozen(e.externalVerification.explicitRefs));
}
const target=result.envelopes.find(e=>e.claimId===targetClaimId);assert.ok(target,'adversarial target claim missing');
assert.equal(target.attestation.explicitRefs.length,0,'same lot/source/time/reviewer/claim-shaped decoy inferred attestation');assert.equal(target.externalVerification.explicitRefs.length,0,'assurance PASS/verified decoy inferred external verification');assert.equal(target.claimTruthVerified,false,'review/assurance decoy promoted claim truth');
assert.equal(result.summary.attestation.NO_EXPLICIT_ATTESTATION_LINK,result.envelopes.length);assert.equal(result.summary.attestation.ATTESTATION_REFERENCE_ONLY,0);assert.equal(result.summary.externalVerification.NOT_DETERMINED,result.envelopes.length);assert.equal(result.summary.externalVerification.EXTERNAL_VERIFICATION_REFERENCE_ONLY,0);assert.equal(result.summary.externalVerification.EXPLICITLY_NOT_VERIFIED_AT_SOURCE,0);assert.equal(result.summary.claimTruthVerified,0);assert.equal(result.summary.evidentiarySufficiencyDetermined,0);assert.equal(result.summary.decisionAuthority,0);assert.equal(result.summary.explicitAttestationReferences,0);assert.equal(result.summary.explicitExternalVerificationReferences,0);assert.equal(result.summary.semantics,'ENVELOPE_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE');
assert.equal(result.audit.claimSpecificLinkContracts,0);assert.equal(result.audit.linkRules.length,0);assert.equal(result.audit.outcome,'CLAIM_SPECIFIC_LINK_NOT_FOUND');assert.equal(result.audit.policy,'FAIL_CLOSED_WITHOUT_EXACT_CONTRACTED_LINK');assert.equal(result.audit.heuristicLinking,false);assert.equal(result.audit.acceptedExactLinkFields.length,0);assert.equal(result.audit.provenanceGap.instruction,'DO_NOT_RECONSTRUCT_MISSING_HISTORY');assert.equal(JSON.stringify(Array.from(result.audit.provenanceGap.versions)),JSON.stringify(['V164','V165','V166','V167','V168','V169']));
const assuranceContract=result.audit.contractsInspected.find(x=>x.id==='DOCUMENT_ASSURANCE');assert.equal(assuranceContract.schema,'SANA_DATAROOM_DOCUMENT_ASSURANCE_V1');assert.equal(assuranceContract.claimSpecificLink,'NOT_MATERIALIZED');const reviewContract=result.audit.contractsInspected.find(x=>x.id==='REVIEW_GOVERNANCE');assert.equal(reviewContract.schema,'SANA_DATAROOM_REVIEW_GOVERNANCE_V1');assert.equal(reviewContract.claimSpecificLink,'NOT_MATERIALIZED');
assert.equal(result.authority.attestationAuthority,false);assert.equal(result.authority.externalVerificationAuthority,false);assert.equal(result.authority.truthVerificationAuthority,false);assert.equal(result.authority.evidentiarySufficiencyAuthority,false);assert.equal(result.authority.reviewerIdentityAuthority,false);assert.equal(result.authority.reviewerQualificationAuthority,false);assert.equal(result.authority.certificationAuthority,false);assert.equal(result.authority.decisionAuthority,false);assert.equal(result.authority.aiAuthority,'ADVISORY_ONLY');
assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.envelopes)&&Object.isFrozen(result.audit)&&Object.isFrozen(result.audit.contractsInspected)&&Object.isFrozen(result.authority));
const first=JSON.stringify(api.build({lot:'LOT-A'}).envelopes.map(e=>({id:e.envelopeId,claim:e.claimId,att:e.attestation.state,ext:e.externalVerification.state,keys:Array.from(e.locatorKeys)})));const second=JSON.stringify(api.build({lot:'LOT-A'}).envelopes.map(e=>({id:e.envelopeId,claim:e.claimId,att:e.attestation.state,ext:e.externalVerification.state,keys:Array.from(e.locatorKeys)})));assert.equal(first,second,'V174 envelopes are not deterministic');
const capSection=api.forSection('CAPITAL_READINESS',{lot:'LOT-A'});assert.ok(capSection.envelopes.length>0&&capSection.envelopes.every(e=>e.sectionId==='CAPITAL_READINESS'));const capSource=api.forSource('CAPITAL_REVIEW',{lot:'LOT-A'});assert.ok(capSource.envelopes.length>0&&capSource.envelopes.every(e=>e.sourceId==='CAPITAL_REVIEW'));
assert.equal(JSON.stringify(data),before,'V174 mutated source fixtures');

console.log(`SANA Data Room Executive V174 validation: PASS · ${result.envelopes.length} claim envelopes · 0 inferred links`);