import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const livePath='apps/control-web/public/sana-v3-dataroom-access-ledger.js';
const snapPath='apps/control-web/public/sana-v3-report-snapshot-dataroom-access.js';
const histPath='apps/control-web/public/sana-v3-dataroom-access-history.js';
const gapPath='apps/control-web/public/sana-v3-due-diligence-dataroom-access-gaps.js';
const liveCode=fs.readFileSync(livePath,'utf8');
const snapCode=fs.readFileSync(snapPath,'utf8');
const histCode=fs.readFileSync(histPath,'utf8');
const gapCode=fs.readFileSync(gapPath,'utf8');

const context={
  window:{__SANA_ACCESS__:{role:'admin'}},storage:{records:[]},
  DEMO:{lots:[{id:'CAF-A1',crop:'Café'},{id:'AGU-A2',crop:'Aguacate'},{id:'CAC-B1',crop:'Cacao'}]},
  views:{dataroom:()=>'<footer class="footer"></footer>',capital:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'},
  metric:()=>'',esc:v=>String(v),openModal:()=>{},document:{addEventListener:()=>{},getElementById:()=>null},console,queueMicrotask:fn=>fn()
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(liveCode,context,{filename:livePath});
vm.runInContext(snapCode,context,{filename:snapPath});
const live=context.window.__SANA_DATAROOM_ACCESS__;
const snapApi=context.window.__SANA_REPORT_SNAPSHOT_DATAROOM_ACCESS__;
assert(live&&snapApi,'live or snapshot API missing');
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FARM-DEMO'},generatedAt:'2026-08-18T10:00:00-05:00'};
snapApi.enrichDataRoomAccess(manifest);
assert(manifest.dataroomAccess,'manifest.dataroomAccess missing');
assert.equal(manifest.dataroomAccess.rowCount,3);
assert.equal(manifest.dataroomAccess.verifiedDocumentReads,0);
assert.equal(manifest.dataroomAccess.dueDiligenceApprovals,0);
assert.equal(manifest.dataroomAccess.investmentOffers,0);
assert.equal(manifest.dataroomAccess.fundingExecuted,0);
const caf=manifest.dataroomAccess.rows.find(r=>r.caseId==='DA-CAF-01');
const agu=manifest.dataroomAccess.rows.find(r=>r.caseId==='DA-AGU-01');
assert(caf&&agu,'baseline snapshot rows missing');
assert.equal(caf.grantCount,1);
assert.equal(caf.viewReferenceCount,1);
assert.equal(caf.verifiedDocumentReads,0);
assert.equal(caf.dueDiligenceApprovals,0);
assert.equal(caf.investmentOffers,0);
assert.equal(agu.requestCount,1);
assert.equal(agu.grantCount,0,'request-only snapshot must remain no grant');

const latest={id:'SNAP-NEW',reportType:'RPT-DD',cutoff:'2026-08-18',manifest:JSON.parse(JSON.stringify(manifest))};
const old={id:'SNAP-OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FARM-DEMO'}}};
const historyContext={window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[latest,old]},__SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'SNAP-OLD',target:'SNAP-NEW'})}},views:{dataroom:()=>'<footer class="footer"></footer>',reports:()=>'<footer class="footer"></footer>'},metric:()=>'',esc:v=>String(v),console};
historyContext.window.window=historyContext.window;
vm.createContext(historyContext);
vm.runInContext(histCode,historyContext,{filename:histPath});
const hist=historyContext.window.__SANA_DATAROOM_ACCESS_HISTORY__;
assert(hist,'snapshot-only access history API missing');
assert.equal(hist.state().state,'CAPTURED');
const partial=hist.diff(old,latest);
assert.equal(partial.valid,true);
assert.equal(partial.state,'PARTIAL_GRANULARITY');
assert(!histCode.includes('__SANA_DATAROOM_ACCESS__'),'history must not use live access ledger');
assert(!/\bstorage\b/.test(histCode),'history must not use mutable storage');
assert.match(hist.integrity,/NO_LIVE_FALLBACK/);
assert.match(hist.integrity,/CHANGE ≠ IMPROVEMENT/);

function accessManifest(rows){return {schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FARM-DEMO'},dataroomAccess:{rows,verifiedCounterpartyIdentities:0,verifiedGrantorAuthorities:0,verifiedConsents:0,verifiedDocumentReads:0,dueDiligenceApprovals:0,eligibilityDecisions:0,investmentOffers:0,investmentRecommendations:0,executionActions:0,fundingExecuted:0}}}
function baseRow(overrides={}){return {caseId:'DA-CLEAN',capitalCaseRef:'CAP-CLEAN',lot:'CAF-A1',snapshotRef:'SNAP-CLEAN',counterpartyRefs:['CP-CLEAN'],grantorRefs:[],requestCount:0,consentReferenceCount:0,grantCount:0,shareCount:0,viewReferenceCount:0,expiryCount:0,revocationCount:0,evidenceCount:0,sharedDocumentRefs:[],viewDocumentRefs:[],accessOpen:false,grantWithoutRequest:[],grantWithoutConsentReference:[],shareWithoutGrant:[],viewWithoutShare:[],terminalWithoutGrant:[],unresolvedEvidence:[],unsupportedGrant:[],events:[],verifiedCounterpartyIdentities:0,verifiedGrantorAuthorities:0,verifiedConsents:0,verifiedDocumentReads:0,dueDiligenceApprovals:0,eligibilityDecisions:0,investmentOffers:0,investmentRecommendations:0,executionActions:0,fundingExecuted:0,...overrides}}
const gapContext={window:{__SANA_DUE_DILIGENCE_GAPS__:{schema:'BASE',latest:()=>null,derive:s=>({valid:true,snapshot:s,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:false})}},views:{reports:()=>'<footer class="footer"></footer>'},esc:v=>String(v),console};
gapContext.window.window=gapContext.window;
vm.createContext(gapContext);
vm.runInContext(gapCode,gapContext,{filename:gapPath});
const dd=gapContext.window.__SANA_DD_DATAROOM_ACCESS_GAPS__;
assert(dd,'Data Room access DD API missing');

const requestOnly=baseRow({caseId:'DA-REQUEST',requestCount:1,events:[{id:'RQ',kind:'ACCESS_REQUESTED',observedAt:'2026-08-18',capitalCaseRef:'CAP-CLEAN',lot:'CAF-A1',snapshotRef:'SNAP-CLEAN',counterpartyRef:'CP-CLEAN',scopeRef:'DD',requestRef:'REQ-1',accessState:'REQUESTED',provenance:'USER_DEMO_LOCAL'}]});
assert.equal(dd.derive({manifest:accessManifest([requestOnly])}).length,0,'request-only must not be a gap');

const openGrant=baseRow({caseId:'DA-GRANT',grantorRefs:['GOV-1'],requestCount:1,consentReferenceCount:1,grantCount:1,evidenceCount:1,accessOpen:true,events:[
  {id:'RQ2',kind:'ACCESS_REQUESTED',snapshotRef:'SNAP-CLEAN',counterpartyRef:'CP-CLEAN',scopeRef:'DD',requestRef:'REQ-2',accessState:'REQUESTED',provenance:'USER_DEMO_LOCAL'},
  {id:'CS2',kind:'CONSENT_REFERENCE',snapshotRef:'SNAP-CLEAN',counterpartyRef:'CP-CLEAN',consentRef:'CONSENT-2',consentState:'REFERENCE_ONLY',provenance:'USER_DEMO_LOCAL'},
  {id:'GR2',kind:'ACCESS_GRANTED',snapshotRef:'SNAP-CLEAN',counterpartyRef:'CP-CLEAN',grantorRef:'GOV-1',scopeRef:'DD',grantRef:'GRANT-2',accessState:'GRANTED_DEMO',provenance:'USER_DEMO_LOCAL'},
  {id:'EV2',kind:'EVIDENCE',evidenceRef:'EV-2',supports:['GR2'],provenance:'USER_DEMO_LOCAL'}
]});
assert.equal(dd.derive({manifest:accessManifest([openGrant])}).length,0,'clean open grant must not be a gap');

const revoked=baseRow({caseId:'DA-REVOKED',grantorRefs:['GOV-1'],requestCount:1,consentReferenceCount:1,grantCount:1,revocationCount:1,evidenceCount:1,accessOpen:false,events:[
  {id:'RQ3',kind:'ACCESS_REQUESTED',snapshotRef:'SNAP-CLEAN',counterpartyRef:'CP-CLEAN',scopeRef:'DD',requestRef:'REQ-3',accessState:'REQUESTED',provenance:'USER_DEMO_LOCAL'},
  {id:'CS3',kind:'CONSENT_REFERENCE',snapshotRef:'SNAP-CLEAN',counterpartyRef:'CP-CLEAN',consentRef:'CONSENT-3',consentState:'REFERENCE_ONLY',provenance:'USER_DEMO_LOCAL'},
  {id:'GR3',kind:'ACCESS_GRANTED',snapshotRef:'SNAP-CLEAN',counterpartyRef:'CP-CLEAN',grantorRef:'GOV-1',scopeRef:'DD',grantRef:'GRANT-3',accessState:'GRANTED_DEMO',provenance:'USER_DEMO_LOCAL'},
  {id:'RV3',kind:'ACCESS_REVOKED',snapshotRef:'SNAP-CLEAN',counterpartyRef:'CP-CLEAN',grantRef:'GRANT-3',revocationRef:'REVOKE-3',accessState:'REVOKED_DEMO',provenance:'USER_DEMO_LOCAL'},
  {id:'EV3',kind:'EVIDENCE',evidenceRef:'EV-3',supports:['GR3'],provenance:'USER_DEMO_LOCAL'}
]});
assert.equal(dd.derive({manifest:accessManifest([revoked])}).length,0,'revocation itself must not be a gap');

const malformed=baseRow({caseId:'DA-BAD',capitalCaseRef:'',lot:'',grantWithoutRequest:['BAD-GRANT'],grantWithoutConsentReference:['BAD-GRANT'],shareWithoutGrant:['BAD-SHARE'],viewWithoutShare:['BAD-VIEW'],terminalWithoutGrant:['BAD-RV'],unresolvedEvidence:['MISSING'],unsupportedGrant:['BAD-GRANT'],events:[
  {id:'BAD-GRANT',kind:'ACCESS_GRANTED',counterpartyRef:'',snapshotRef:'',grantorRef:'',scopeRef:'',grantRef:'',accessState:'',provenance:''},
  {id:'BAD-SHARE',kind:'DOCUMENT_SCOPE_SHARED',counterpartyRef:'CP',snapshotRef:'SNAP',grantRef:'',shareRef:'',documentRefs:[],provenance:'USER'},
  {id:'BAD-VIEW',kind:'DOCUMENT_VIEW_REFERENCE',counterpartyRef:'CP',snapshotRef:'SNAP',documentRef:'',viewRef:'',provenance:'USER'},
  {id:'BAD-RV',kind:'ACCESS_REVOKED',counterpartyRef:'CP',snapshotRef:'SNAP',grantRef:'',revocationRef:'',provenance:'USER'},
  {id:'BAD-EV',kind:'EVIDENCE',evidenceRef:'',supports:['MISSING'],provenance:'USER'}
],verifiedDocumentReads:1,dueDiligenceApprovals:1,investmentOffers:1,fundingExecuted:1});
const badGaps=dd.derive({manifest:accessManifest([malformed])});
for(const phrase of ['Grant sin solicitud trazable','Grant sin referencia de consentimiento trazable','Alcance documental compartido sin grant trazable','Referencia de visualización sin alcance documental compartido trazable','Expiración o revocación sin grant trazable','lectura documental verificada fuera de autoridad','aprobación Due Diligence fuera de autoridad','oferta de inversión fuera de autoridad','funding ejecutado fuera de autoridad'])assert(badGaps.some(g=>g.condition.includes(phrase)),`missing expected gap: ${phrase}`);
assert.match(dd.integrity,/NO_ACCESS ≠ GAP/);
assert.match(dd.integrity,/ACCESS_REQUEST_ONLY ≠ GAP/);
assert.match(dd.integrity,/ACCESS_OPEN ≠ GAP/);
assert.match(dd.integrity,/ACCESS_EXPIRED ≠ GAP/);
assert.match(dd.integrity,/ACCESS_REVOKED ≠ GAP/);
assert.match(dd.integrity,/DATAROOM_ACCESS_GAP ≠ INVESTMENT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_DECISION/);
assert(!gapCode.includes('__SANA_DATAROOM_ACCESS__'),'DD history gaps must not read live access ledger');
assert(!/\bstorage\b/.test(gapCode),'DD history gaps must not use mutable storage');
assert(!/fetch\s*\(/.test(snapCode+histCode+gapCode));
assert(!/productionExecutionAvailable\s*=\s*true/.test(snapCode+histCode+gapCode));
assert(!/productionActivationAllowed\s*=\s*true/.test(snapCode+histCode+gapCode));
assert(!/canonicalMutated\s*=\s*true/.test(snapCode+histCode+gapCode));
console.log('SANA Data Room access snapshot/history/DD v66 validation: OK');
