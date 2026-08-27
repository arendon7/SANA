import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const paths={
  v171:'apps/control-web/public/sana-v3-dataroom-executive-v171.js',
  v172:'apps/control-web/public/sana-v3-dataroom-executive-v172.js',
  v173:'apps/control-web/public/sana-v3-dataroom-executive-v173.js',
  v174:'apps/control-web/public/sana-v3-dataroom-executive-v174.js',
  source:'apps/control-web/public/sana-v3-dataroom-claim-attestation-v175.js',
  v175:'apps/control-web/public/sana-v3-dataroom-executive-v175.js'
};
const code=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));

for(const [pattern,label] of [
  [/\bVERSION\s*=\s*['"]V175['"]/, 'VERSION=V175'],
  [/\bSCHEMA\s*=\s*['"]SANA_DATAROOM_EXECUTIVE_EXACT_ATTESTATION_LINK_V1['"]/, 'executive schema'],
  [/\bPARENT_SHA\s*=\s*['"]cd4717c33b64584eeff538a8097f6c8740fb6e16['"]/, 'exact V174 parent'],
  [/CLAIM_ATTESTATION_EXACT_V1/, 'typed exact link rule'],[/EXACT_CLAIM_ID/, 'exact claim match'],[/EXACT_ENVELOPE_ID/, 'exact envelope match'],
  [/DECLARED_LOCATORS_MUST_BE_SUBSET/, 'locator subset rule'],[/DECLARED_LOT_MUST_EQUAL_SELECTED_LOT/, 'lot exact rule'],[/CONFLICT_FAILS_CLOSED/, 'conflict boundary'],[/NO_HEURISTIC_LINKING/, 'heuristic boundary'],
  [/attestationAuthority\s*:\s*false/, 'attestation authority false'],[/claimTruthAuthority\s*:\s*false/, 'truth authority false'],[/externalVerificationAuthority\s*:\s*false/, 'external verification authority false'],[/decisionAuthority\s*:\s*false/, 'decision authority false'],
  [/CONTRACT_AVAILABLE ≠ ATTESTATION_EXISTS/, 'contract presence boundary'],[/COUNTS_ONLY ≠ SCORE/, 'count boundary']
])assert.ok(pattern.test(code.v175),`missing V175 executive invariant: ${label}`);
for(const [pattern,label] of [
  [/SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1/, 'source schema'],[/ZERO_BASELINE_RECORDS/, 'zero baseline'],[/CLAIM_ENVELOPE_REF_MISMATCH/, 'source envelope validation'],[/REFERENCE_ONLY_STATE_REQUIRED/, 'source state validation'],
  [/claimTruthAuthority\s*:\s*false/, 'source truth authority false'],[/externalVerificationAuthority\s*:\s*false/, 'source external verification authority false'],[/investmentDecisionAuthority\s*:\s*false/, 'source investment authority false'],[/NO_STORAGE_WRITE/, 'source no storage write']
])assert.ok(pattern.test(code.source),`missing V175 source invariant: ${label}`);
for(const src of [code.v175,code.source])for(const forbidden of ['fetch(','XMLHttpRequest','localStorage.setItem','sessionStorage.setItem','indexedDB.open','canonicalMutationAvailable:true','financialMutationAvailable:true','attestationAuthority:true','claimTruthAuthority:true','externalVerificationAuthority:true','decisionAuthority:true','riskScore:','creditScore:','investmentScore:','projectScore:','overallScore:'])assert.ok(!src.includes(forbidden),`forbidden V175 token: ${forbidden}`);

const context={window:{},structuredClone,console};context.globalThis=context;
for(const key of ['v171','v172','v173','v174','source','v175'])vm.runInNewContext(code[key],context,{filename:paths[key]});
const sourceFactory=context.window.__SANA_DATAROOM_CLAIM_ATTESTATION_V175_FACTORY__;
const executiveFactory=context.window.__SANA_DATAROOM_EXECUTIVE_V175_FACTORY__;
assert.ok(sourceFactory?.create,'V175 source factory missing');assert.equal(sourceFactory.schema,'SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1');
assert.ok(executiveFactory?.create,'V175 executive factory missing');assert.equal(executiveFactory.schema,'SANA_DATAROOM_EXECUTIVE_EXACT_ATTESTATION_LINK_V1');assert.equal(executiveFactory.version,'V175');
const baseline=context.window.__SANA_DATAROOM_CLAIM_ATTESTATION__;assert.equal(baseline.schema,'SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1');assert.equal(baseline.records().length,0);assert.equal(baseline.summary().records,0);assert.equal(baseline.summary().claimTruthVerified,0);

const data={
  snapshots:[{id:'SNAP-A',reportType:'RPT-DD',cutoff:'2026-08-20',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}}],
  state:{valid:true,state:'CAPTURED',snapshot:{id:'SNAP-A',cutoff:'2026-08-20'},rows:[{id:'ROW-A',lotId:'LOT-A'},{id:'ROW-B',lotId:'LOT-B'}],integrity:'SNAPSHOT_ONLY'},
  capital:[{id:'CAP-A',lot:'LOT-A',events:[{id:'CAP-A-E1',lot:'LOT-A',kind:'REVIEW_STARTED',observedAt:'2026-08-20T10:00:00-05:00'}]},{id:'CAP-B',lot:'LOT-B',events:[{id:'CAP-B-E1',lot:'LOT-B',kind:'REVIEW_STARTED',observedAt:'2026-08-20T11:00:00-05:00'}]}],
  refs:[{id:'RG-A',lot:'LOT-A',events:[{id:'RG-A-E1',lot:'LOT-A',kind:'REVIEW_SCOPE_DECLARED',observedAt:'2026-08-20T10:00:00-05:00'}]},{id:'RG-B',lot:'LOT-B',events:[{id:'RG-B-E1',lot:'LOT-B',kind:'REVIEW_SCOPE_DECLARED'}]}]
};
const state=()=>data.state;
function baseHost(){return {
  DEMO:{lots:[{id:'LOT-A'},{id:'LOT-B'}]},
  __SANA_DATAROOM_360__:{state},__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>data.snapshots},
  __SANA_CAPITAL_REVIEW__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},__SANA_CAPITAL_GOVERNANCE__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},__SANA_DATAROOM_FINDINGS__:{cases:()=>data.capital,forLot:lot=>data.capital.filter(x=>x.lot===lot)},
  __SANA_DUE_DILIGENCE_GAPS__:{current:()=>({valid:true,state:'CAPTURED',snapshot:data.state.snapshot,gaps:[{id:'GAP-A',lot:'LOT-A'},{id:'GAP-B',lot:'LOT-B'}]})},
  __SANA_DATAROOM_PHENOLOGY_HISTORY__:{state},__SANA_DATAROOM_LABOR_HISTORY__:{state},__SANA_DATAROOM_HEALTH_HISTORY__:{state},__SANA_DATAROOM_HEALTH_LIFECYCLE__:{state},__SANA_DATAROOM_NUTRITION_HISTORY__:{state},__SANA_DATAROOM_FORECAST_HISTORY__:{state},__SANA_DATAROOM_HARVEST_HISTORY__:{state},__SANA_DATAROOM_INVENTORY_HISTORY__:{state},__SANA_DATAROOM_ECONOMIC_RECONCILIATION_HISTORY__:{state},__SANA_DATAROOM_COMMERCIAL_HISTORY__:{state},__SANA_DATAROOM_DATA_TRUST_HISTORY__:{state},__SANA_DATAROOM_CAPTURE_SYNC_HISTORY__:{state},__SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__:{state},__SANA_DATAROOM_CIRCULARITY_HISTORY__:{state},__SANA_DATAROOM_MATERIAL_HISTORY__:{state},__SANA_DATAROOM_IMPACT_HISTORY__:{state},__SANA_DATAROOM_CAPITAL_GOVERNANCE_HISTORY__:{state},__SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__:{state},__SANA_DATAROOM_FINDINGS_HISTORY__:{state},
  __SANA_DATAROOM_REVIEW_GOVERNANCE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_CASE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_HANDOFF__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_FEEDBACK__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_RESPONSE__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_DISPOSITION__:{cases:()=>data.refs},__SANA_DATAROOM_REVIEW_ROUND__:{cases:()=>data.refs}
}}
const parentHost=baseHost();
const parent=context.window.__SANA_DATAROOM_EXECUTIVE_V174_FACTORY__.create(parentHost).build({lot:'LOT-A'});
const target=parent.envelopes.find(e=>e.sourceId==='CAPITAL_REVIEW'&&e.claimClass==='SOURCE_REFERENCE_PRESENT');
assert.ok(target,'target V174 envelope missing');assert.ok(target.locatorKeys.length>0,'target locator key missing');
const locatorKey=Array.from(target.locatorKeys)[0];

const sourceInput=[{attestationRef:'ATT-EXACT-01',claimId:target.claimId,claimEnvelopeRef:target.envelopeId,locatorKeys:[locatorKey],lotId:'LOT-A',reviewerRef:'REVIEWER-REF-01',reviewCaseRef:'RV-REF-01',observedAt:'2026-08-21T09:00:00-05:00',attestationState:'REFERENCE_ONLY',provenance:'TEST_EXACT'}];
const sourceBefore=JSON.stringify(sourceInput),exactSource=sourceFactory.create(sourceInput);assert.equal(JSON.stringify(sourceInput),sourceBefore,'source factory mutated input');assert.equal(exactSource.records().length,1);assert.equal(exactSource.diagnostics().length,0);const sr=exactSource.records()[0];assert.equal(sr.claimTruthVerified,false);assert.equal(sr.reviewerIdentityVerified,false);assert.equal(sr.reviewerQualificationVerified,false);assert.equal(sr.externalVerificationDetermined,false);assert.equal(sr.decisionAuthority,false);assert.ok(Object.isFrozen(sr));
const invalidState=sourceFactory.create([{...sourceInput[0],attestationRef:'ATT-BAD-STATE',attestationState:'VERIFIED'}]);assert.equal(invalidState.records().length,0);assert.equal(invalidState.diagnostics()[0].reason,'REFERENCE_ONLY_STATE_REQUIRED');
const invalidEnvelope=sourceFactory.create([{...sourceInput[0],attestationRef:'ATT-BAD-ENV',claimEnvelopeRef:'ENV::WRONG'}]);assert.equal(invalidEnvelope.records().length,0);assert.equal(invalidEnvelope.diagnostics()[0].reason,'CLAIM_ENVELOPE_REF_MISMATCH');
const duplicates=sourceFactory.create([{...sourceInput[0],attestationRef:'ATT-DUP'},{...sourceInput[0],attestationRef:'ATT-DUP'}]);assert.equal(duplicates.records().length,0);assert.ok(duplicates.diagnostics().some(x=>x.reason==='DUPLICATE_ATTESTATION_REF'));

function resultWith(source){const host=baseHost();host.__SANA_DATAROOM_CLAIM_ATTESTATION__=source;return {host,result:executiveFactory.create(host).build({lot:'LOT-A'})}}
const exact=resultWith(exactSource);const linked=exact.result.envelopes.find(e=>e.claimId===target.claimId);assert.ok(linked);assert.equal(linked.attestation.state,'ATTESTATION_REFERENCE_ONLY');assert.equal(JSON.stringify(Array.from(linked.attestation.explicitRefs)),JSON.stringify(['ATT-EXACT-01']));assert.equal(JSON.stringify(Array.from(linked.attestation.reviewerRefs)),JSON.stringify(['REVIEWER-REF-01']));assert.equal(linked.linkDiagnostic.state,'EXACT_ATTESTATION_REFERENCE_LINKED');assert.equal(linked.claimTruthVerified,false);assert.equal(linked.attestation.claimTruthAttested,false);assert.equal(linked.attestation.reviewerIdentityVerified,false);assert.equal(linked.attestation.reviewerQualificationVerified,false);assert.equal(linked.attestation.reviewerIndependenceVerified,false);assert.equal(linked.externalVerification.state,'NOT_DETERMINED');assert.equal(linked.externalVerification.verifiedResult,false);assert.equal(linked.externalVerification.certificationValidityVerified,false);assert.equal(linked.evidentiarySufficiencyDetermined,false);assert.equal(linked.decisionAuthority,false);
assert.equal(exact.result.summary.linked,1);assert.equal(exact.result.summary.conflicts,0);assert.equal(exact.result.summary.explicitAttestationReferences,1);assert.equal(exact.result.sourceContract.state,'AVAILABLE');assert.equal(exact.result.audit.ruleCount,1);assert.equal(exact.result.audit.heuristicLinking,false);assert.equal(exact.result.audit.linkRules[0].id,'CLAIM_ATTESTATION_EXACT_V1');assert.equal(exact.result.authority.attestationAuthority,false);assert.equal(exact.result.authority.claimTruthAuthority,false);assert.equal(exact.result.authority.externalVerificationAuthority,false);assert.equal(exact.result.authority.decisionAuthority,false);assert.equal(exact.result.capabilities.exactAttestationReferenceLinking,true);assert.equal(exact.result.capabilities.heuristicLinking,false);

const wrongClaimDirect={schema:'SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1',records:()=>[{...sourceInput[0],attestationRef:'ATT-WRONG-CLAIM',claimId:'CLM::NOT-TARGET',claimEnvelopeRef:'ENV::CLM::NOT-TARGET',sourceId:'CAPITAL_REVIEW',lotId:'LOT-A',observedAt:'2026-08-21T09:00:00-05:00',reviewerRef:'REVIEWER-REF-01',verified:true,reviewerQualified:true}]};
const wrongClaim=resultWith(wrongClaimDirect).result.envelopes.find(e=>e.claimId===target.claimId);assert.equal(wrongClaim.attestation.state,'NO_EXPLICIT_ATTESTATION_LINK');assert.equal(wrongClaim.linkDiagnostic.state,'NO_EXACT_CANDIDATE');
const wrongSchema=resultWith({schema:'WRONG_SCHEMA',records:()=>sourceInput}).result;assert.equal(wrongSchema.sourceContract.state,'SCHEMA_MISMATCH');assert.equal(wrongSchema.summary.linked,0);assert.ok(wrongSchema.envelopes.every(e=>e.attestation.state==='NO_EXPLICIT_ATTESTATION_LINK'));
const missing=resultWith(null).result;assert.equal(missing.sourceContract.state,'MISSING');assert.equal(missing.summary.linked,0);
const invalidApi=resultWith({schema:'SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1',records:()=>({})}).result;assert.equal(invalidApi.sourceContract.state,'INVALID_API');assert.equal(invalidApi.summary.linked,0);
const maliciousForClaim=resultWith({schema:'SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1',records:()=>[],forClaim:()=>sourceInput}).result;assert.equal(maliciousForClaim.summary.linked,0,'adapter must not trust forClaim');

function directRecord(overrides){return {schema:'SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1',attestationRef:'ATT-DIRECT',claimId:target.claimId,claimEnvelopeRef:target.envelopeId,locatorKeys:[locatorKey],lotId:'LOT-A',reviewerRef:'REVIEWER-DECOY',reviewCaseRef:'RV-DECOY',observedAt:'2026-08-21T09:00:00-05:00',attestationState:'REFERENCE_ONLY',verified:true,reviewerQualified:true,externalVerificationStatus:'VERIFICADO_EXTERNO',evidenceAccepted:true,...overrides}}
function directResult(record){return resultWith({schema:'SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1',records:()=>[record]}).result.envelopes.find(e=>e.claimId===target.claimId)}
const wrongEnvelope=directResult(directRecord({claimEnvelopeRef:'ENV::WRONG'}));assert.equal(wrongEnvelope.attestation.state,'NO_EXPLICIT_ATTESTATION_LINK');assert.equal(wrongEnvelope.linkDiagnostic.state,'CLAIM_ATTESTATION_CANDIDATE_CONFLICT');assert.ok(wrongEnvelope.linkDiagnostic.conflictReasons.includes('CLAIM_ENVELOPE_REF_MISMATCH'));
const wrongLocator=directResult(directRecord({locatorKeys:[locatorKey,'LOC::OUTSIDE']}));assert.equal(wrongLocator.attestation.state,'NO_EXPLICIT_ATTESTATION_LINK');assert.equal(wrongLocator.linkDiagnostic.state,'CLAIM_ATTESTATION_CANDIDATE_CONFLICT');assert.ok(wrongLocator.linkDiagnostic.conflictReasons.includes('LOCATOR_OUTSIDE_CLAIM'));
const wrongLot=directResult(directRecord({lotId:'LOT-B'}));assert.equal(wrongLot.attestation.state,'NO_EXPLICIT_ATTESTATION_LINK');assert.equal(wrongLot.linkDiagnostic.state,'CLAIM_ATTESTATION_CANDIDATE_CONFLICT');assert.ok(wrongLot.linkDiagnostic.conflictReasons.includes('LOT_SCOPE_CONTRADICTION'));
const wrongStateDirect=directResult(directRecord({attestationState:'VERIFIED'}));assert.equal(wrongStateDirect.attestation.state,'NO_EXPLICIT_ATTESTATION_LINK');assert.ok(wrongStateDirect.linkDiagnostic.conflictReasons.includes('REFERENCE_ONLY_STATE_REQUIRED'));
const maliciousFlags=directResult(directRecord({attestationRef:'ATT-MALICIOUS-FLAGS'}));assert.equal(maliciousFlags.attestation.state,'ATTESTATION_REFERENCE_ONLY');assert.equal(maliciousFlags.claimTruthVerified,false);assert.equal(maliciousFlags.attestation.reviewerIdentityVerified,false);assert.equal(maliciousFlags.attestation.reviewerQualificationVerified,false);assert.equal(maliciousFlags.externalVerification.state,'NOT_DETERMINED');assert.equal(maliciousFlags.externalVerification.verifiedResult,false);assert.equal(maliciousFlags.decisionAuthority,false);
const mixedConflictSource={schema:'SANA_DATAROOM_CLAIM_ATTESTATION_REFERENCE_V1',records:()=>[directRecord({attestationRef:'ATT-VALID-MIX'}),directRecord({attestationRef:'ATT-BAD-MIX',lotId:'LOT-B'})]};const mixed=resultWith(mixedConflictSource).result.envelopes.find(e=>e.claimId===target.claimId);assert.equal(mixed.attestation.state,'NO_EXPLICIT_ATTESTATION_LINK','one contradictory exact-claim candidate must fail the envelope closed');assert.equal(mixed.linkDiagnostic.state,'CLAIM_ATTESTATION_CANDIDATE_CONFLICT');

const parentById=new Map(parent.envelopes.map(e=>[e.claimId,e]));for(const e of exact.result.envelopes){const p=parentById.get(e.claimId);assert.ok(p);assert.equal(e.controlledStatement,p.controlledStatement);assert.equal(JSON.stringify(Array.from(e.locatorKeys)),JSON.stringify(Array.from(p.locatorKeys)));assert.equal(e.claimTruthVerified,false);assert.equal(e.evidentiarySufficiencyDetermined,false);assert.equal(e.decisionAuthority,false);assert.ok(Object.isFrozen(e)&&Object.isFrozen(e.linkDiagnostic)&&Object.isFrozen(e.authority));}
assert.equal(exact.result.summary.semantics,'EXACT_LINK_COUNTS_ONLY · NOT_WEIGHTED · NOT_PERCENTAGE · NOT_SCORE');assert.equal(exact.result.summary.claimTruthVerified,0);assert.equal(exact.result.summary.reviewerIdentityVerified,0);assert.equal(exact.result.summary.reviewerQualificationVerified,0);assert.equal(exact.result.summary.externalVerificationDetermined,0);assert.equal(exact.result.summary.certificationValidityVerified,0);assert.equal(exact.result.summary.decisionAuthority,0);
assert.equal(exact.result.parent,'V174');assert.equal(exact.result.parentSha,'cd4717c33b64584eeff538a8097f6c8740fb6e16');assert.equal(exact.result.provenance.parentSchema,'SANA_DATAROOM_EXECUTIVE_CLAIM_ENVELOPE_V1');assert.equal(exact.result.provenance.linkPolicy,'EXACT_CONTRACTED_LINKS_ONLY');assert.equal(exact.result.audit.provenanceGap.instruction,'DO_NOT_RECONSTRUCT_MISSING_HISTORY');assert.equal(JSON.stringify(Array.from(exact.result.audit.provenanceGap.versions)),JSON.stringify(['V164','V165','V166','V167','V168','V169']));
const dataBefore=JSON.stringify(data);executiveFactory.create(exact.host).build({lot:'LOT-A'});assert.equal(JSON.stringify(data),dataBefore,'V175 mutated source fixtures');assert.equal(JSON.stringify(sourceInput),sourceBefore,'V175 mutated attestation input');
const api=executiveFactory.create(exact.host),first=JSON.stringify(api.build({lot:'LOT-A'}).envelopes.map(e=>({id:e.envelopeId,state:e.attestation.state,refs:Array.from(e.attestation.explicitRefs||[]),diag:e.linkDiagnostic.state}))),second=JSON.stringify(api.build({lot:'LOT-A'}).envelopes.map(e=>({id:e.envelopeId,state:e.attestation.state,refs:Array.from(e.attestation.explicitRefs||[]),diag:e.linkDiagnostic.state})));assert.equal(first,second,'V175 output is not deterministic');
const section=api.forSection('CAPITAL_READINESS',{lot:'LOT-A'});assert.ok(section.envelopes.length>0&&section.envelopes.every(e=>e.sectionId==='CAPITAL_READINESS'));const sourceFiltered=api.forSource('CAPITAL_REVIEW',{lot:'LOT-A'});assert.ok(sourceFiltered.envelopes.length>0&&sourceFiltered.envelopes.every(e=>e.sourceId==='CAPITAL_REVIEW'));const linkedOnly=api.forAttestationState('ATTESTATION_REFERENCE_ONLY',{lot:'LOT-A'});assert.equal(linkedOnly.envelopes.length,1);assert.equal(linkedOnly.envelopes[0].claimId,target.claimId);

console.log(`SANA Data Room Executive V175 validation: PASS · exact refs ${exact.result.summary.explicitAttestationReferences} · conflicts fail closed`);