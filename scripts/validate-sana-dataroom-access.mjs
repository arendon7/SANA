import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const path='apps/control-web/public/sana-v3-dataroom-access-ledger.js';
const code=fs.readFileSync(path,'utf8');
const context={
  window:{__SANA_ACCESS__:{role:'admin'}},
  storage:{records:[]},
  DEMO:{lots:[{id:'CAF-A1',crop:'Café'},{id:'AGU-A2',crop:'Aguacate'},{id:'CAC-B1',crop:'Cacao'}]},
  views:{dataroom:()=>'<footer class="footer"></footer>',capital:()=>'<footer class="footer"></footer>'},
  metric:()=>'',esc:v=>String(v),openModal:()=>{},document:{addEventListener:()=>{}},console
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(code,context,{filename:path});
const api=context.window.__SANA_DATAROOM_ACCESS__;
assert(api,'Data Room access governance API missing');
assert.equal(api.schema,'SANA_DATAROOM_ACCESS_LEDGER_V1');

const caf=api.cases().find(c=>c.id==='DA-CAF-01');
const agu=api.cases().find(c=>c.id==='DA-AGU-01');
const cac=api.cases().find(c=>c.id==='DA-CAC-01');
assert(caf&&agu&&cac,'baseline access cases missing');
assert.equal(caf.requests.length,1);
assert.equal(caf.consents.length,1);
assert.equal(caf.grants.length,1);
assert.equal(caf.shares.length,1);
assert.equal(caf.views.length,1);
assert.equal(caf.sharedDocumentRefs.length,2);
assert.equal(caf.semantics.accessOpen,true,'explicit grant without expiry/revoke event should remain open');
assert.equal(caf.verifiedCounterpartyIdentities,0);
assert.equal(caf.verifiedGrantorAuthorities,0);
assert.equal(caf.verifiedConsents,0,'consent reference must not become verified consent');
assert.equal(caf.verifiedDocumentReads,0,'view reference must not become verified read');
assert.equal(caf.dueDiligenceApprovals,0,'document access must not become DD approval');
assert.equal(caf.eligibilityDecisions,0);
assert.equal(caf.investmentOffers,0,'grant must not become investment offer');
assert.equal(caf.executionActions,0);
assert.equal(caf.fundingExecuted,0);

assert.equal(agu.requests.length,1);
assert.equal(agu.grants.length,0,'request must not become grant');
assert.equal(agu.semantics.accessOpen,false);
assert.equal(cac.grants.length,1);
assert.equal(cac.revocations.length,1);
assert.equal(cac.semantics.accessOpen,false,'explicit revocation must close the demo grant state');
assert.equal(cac.investmentOffers,0);
assert.equal(cac.eligibilityDecisions,0,'revocation must not become investment rejection/eligibility decision');

const s=api.summary();
assert.equal(s.requests,3);
assert.equal(s.grants,2);
assert.equal(s.openAccesses,1);
assert.equal(s.revocations,1);
assert.equal(s.dueDiligenceApprovals,0);
assert.equal(s.investmentOffers,0);
assert.equal(s.investmentRecommendations,0);
assert.equal(s.fundingExecuted,0);
assert.match(api.integrity,/ROLE_ACCESS ≠ COUNTERPARTY_GRANT/);
assert.match(api.integrity,/ACCESS_REQUESTED ≠ ACCESS_GRANTED/);
assert.match(api.integrity,/CONSENT_REFERENCE ≠ VERIFIED_CONSENT/);
assert.match(api.integrity,/ACCESS_GRANTED ≠ INVESTMENT_OFFER/);
assert.match(api.integrity,/DOCUMENT_SCOPE_SHARED ≠ DOCUMENT_READ/);
assert.match(api.integrity,/DOCUMENT_VIEW_REFERENCE ≠ VERIFIED_READ ≠ DUE_DILIGENCE_APPROVAL/);
assert.match(api.integrity,/ACCESS_REVOKED ≠ INVESTMENT_REJECTION/);
assert.match(api.integrity,/EXPIRY_DATE ≠ EXPIRED_EVENT/);

context.storage.records.push(
  {id:'LOCAL-SHARE',type:'dataroom-access-event',lot:'CAF-A1',createdAt:'2026-08-18',values:{caseId:'DA-LOCAL-BADSHARE',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-LOCAL-01',kind:'DOCUMENT_SCOPE_SHARED',observedAt:'2026-08-18T10:00',counterpartyRef:'CP-LOCAL',grantRef:'MISSING-GRANT',documentRefs:'DOC-1,DOC-2'}},
  {id:'LOCAL-VIEW',type:'dataroom-access-event',lot:'CAF-A1',createdAt:'2026-08-18',values:{caseId:'DA-LOCAL-BADVIEW',capitalCaseRef:'CAP-CAF-01',lot:'CAF-A1',snapshotRef:'SNAP-LOCAL-02',kind:'DOCUMENT_VIEW_REFERENCE',observedAt:'2026-08-18T11:00',counterpartyRef:'CP-LOCAL',documentRef:'DOC-NOT-SHARED',viewRef:'VIEW-LOCAL'}}
);
const badShare=api.cases().find(c=>c.id==='DA-LOCAL-BADSHARE');
assert.deepEqual([...badShare.semantics.shareWithoutGrant],['LOCAL-SHARE']);
assert.equal(badShare.investmentOffers,0);
const badView=api.cases().find(c=>c.id==='DA-LOCAL-BADVIEW');
assert.deepEqual([...badView.semantics.viewWithoutShare],['LOCAL-VIEW']);
assert.equal(badView.verifiedDocumentReads,0,'unshared view reference still cannot become verified read');
assert.equal(badView.dueDiligenceApprovals,0);

assert(!/fetch\s*\(/.test(code));
assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
assert(!/productionActivationAllowed\s*=\s*true/.test(code));
assert(!/canonicalMutated\s*=\s*true/.test(code));
assert(!/investmentOffers\s*:\s*[1-9]/.test(code));
assert(!/dueDiligenceApprovals\s*:\s*[1-9]/.test(code));
assert(!/fundingExecuted\s*:\s*[1-9]/.test(code));
console.log('SANA Data Room access governance v65 validation: OK');
