import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapshotPath='apps/control-web/public/sana-v3-report-snapshot-source-evidence.js';
const historyPath='apps/control-web/public/sana-v3-dataroom-source-evidence-history.js';
const gapsPath='apps/control-web/public/sana-v3-due-diligence-source-evidence-gaps.js';
const snapshotCode=fs.readFileSync(snapshotPath,'utf8');
const historyCode=fs.readFileSync(historyPath,'utf8');
const gapsCode=fs.readFileSync(gapsPath,'utf8');

const live=[
  {id:'SRC-A',provider:'SHAREPOINT',name:'Protocolo confidencial que no debe copiarse',scope:'CAF-A1',externalId:'SP-A',registryState:'REFERENCE_ONLY',registryVersion:'v1',registryCut:'2026-08-10',registryReviewer:'Persona A',versionLabel:'v1',versionImmutable:false,fingerprint:'',fingerprintType:'',hashVerified:false,humanReviewRecorded:true,reviewOutcome:'REVIEWED_AS_REFERENCE',reviewerRole:'Técnico',externalVerificationStatus:'NOT_EXTERNALLY_VERIFIED',externalVerificationClaimed:false,sourceVerified:false,contentIngested:false,accessPermissionVerified:false,uses:[{id:'U1',observedAt:'2026-08-11',useType:'PLAN_CONTEXT',targetRef:'PL-CF-04',provenance:'DEMO'}],evidence:[],useCount:1,evidenceCount:0},
  {id:'SRC-B',provider:'SHAREPOINT',name:'Línea base',scope:'FIN-LE-001',externalId:'SP-B',registryState:'REFERENCE_ONLY',registryVersion:'v4',registryCut:'2026-08-01',registryReviewer:'Persona B',versionLabel:'v4',versionImmutable:false,fingerprint:'FP-DEMO',fingerprintType:'DECLARED_FINGERPRINT_DEMO',hashVerified:false,humanReviewRecorded:false,reviewOutcome:'',reviewerRole:'',externalVerificationStatus:'NOT_CAPTURED',externalVerificationClaimed:false,sourceVerified:false,contentIngested:false,accessPermissionVerified:false,uses:[],evidence:[],useCount:0,evidenceCount:0}
];
const baseManifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',farm:{id:'FIN-LE-001',name:'Finca'}};
const context={window:{__SANA_SOURCE_EVIDENCE_LEDGER__:{cases:()=>structuredClone(live)}},views:{reports:()=>'<footer class="footer"></footer>',dataroom:()=>'<footer class="footer"></footer>'},document:{addEventListener:()=>{},getElementById:()=>null},metric:()=>'',esc:v=>String(v),console};
vm.createContext(context);
vm.runInContext(snapshotCode,context,{filename:snapshotPath});
const snap=context.window.__SANA_REPORT_SNAPSHOT_SOURCE_EVIDENCE__;
assert(snap,'snapshot source evidence API missing');
const manifest=structuredClone(baseManifest);snap.enrichSourceEvidence(manifest);
assert(manifest.sourceEvidence,'manifest.sourceEvidence missing');
assert.equal(manifest.sourceEvidence.rowCount,2);
assert.equal(manifest.sourceEvidence.sourceVerifiedCount,0);
assert.equal(manifest.sourceEvidence.hashVerifiedCount,0);
assert.equal(manifest.sourceEvidence.contentIngestedCount,0);
const a=manifest.sourceEvidence.rows.find(r=>r.sourceId==='SRC-A');
assert.equal(a.reviewerIdentityState,'IDENTITY_NOT_COPIED');
assert(!('registryReviewer' in a),'registry reviewer identity must not be copied');
assert(!('name' in a),'document title/content label must not be copied into historical source evidence row');
assert.equal(a.contentState,'CONTENT_NOT_COPIED_REFERENCE_METADATA_ONLY');
assert.equal(a.hashVerified,false);
assert.equal(a.sourceVerified,false);
assert.match(manifest.sourceEvidence.integrity,/CONTENT_NOT_COPIED/);
assert.match(manifest.sourceEvidence.integrity,/NO_LIVE_FALLBACK/);

const oldSnapshot={id:'OLD',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:structuredClone(baseManifest),createdAt:'2026-08-01'};
const newSnapshot={id:'NEW',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:structuredClone(manifest),createdAt:'2026-08-17'};
context.window.__SANA_DUE_DILIGENCE_SNAPSHOT__={snapshots:()=>[oldSnapshot,newSnapshot]};
context.window.__SANA_SNAPSHOT_COMPARE__={selection:()=>({base:'OLD',target:'NEW'})};
vm.runInContext(historyCode,context,{filename:historyPath});
const hist=context.window.__SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__;
assert(hist,'source evidence history API missing');
assert.equal(hist.state().state,'CAPTURED');
assert.equal(hist.diff(oldSnapshot,newSnapshot).state,'PARTIAL_GRANULARITY');
assert(!/__SANA_SOURCE_EVIDENCE_LEDGER__/.test(historyCode),'history must not use live source evidence ledger');
assert(!/__SANA_DOCUMENT_SOURCES__/.test(historyCode),'history must not use live registry');
assert(!/storage\./.test(historyCode),'history must not use mutable storage');
assert.match(hist.integrity,/NO_LIVE_FALLBACK/);

const baseDd={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>newSnapshot,derive:snapshot=>({valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'}),current:()=>({valid:true,snapshot:newSnapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'})};
context.window.__SANA_DUE_DILIGENCE_GAPS__=baseDd;
vm.runInContext(gapsCode,context,{filename:gapsPath});
const dd=context.window.__SANA_DD_SOURCE_EVIDENCE_GAPS__;
assert(dd,'source evidence gaps API missing');
assert.equal(dd.derive(newSnapshot).length,0,'no fingerprint/hash verification/external verification/immutable version must not be gaps by themselves');

const problematic=structuredClone(newSnapshot);
const r=problematic.manifest.sourceEvidence.rows[0];
r.sourceId='';r.externalId='';r.scope='';r.versionLabel='';r.registryVersion='';r.fingerprint='abc';r.fingerprintType='';r.humanReviewRecorded=true;r.reviewOutcome='';r.reviewerRole='';r.uses=[{id:'BAD-U',observedAt:'2026-08-17',useType:'',targetRef:''}];r.externalVerificationClaimed=true;r.sourceVerified=true;r.hashVerified=true;r.contentIngested=true;r.accessPermissionVerified=true;
const issues=dd.derive(problematic);const text=issues.map(x=>x.condition).join(' | ');
assert.match(text,/sourceId/);
assert.match(text,/externalId/);
assert.match(text,/alcance/);
assert.match(text,/versión/);
assert.match(text,/Fingerprint declarado sin tipo/);
assert.match(text,/Revisión humana sin resultado/);
assert.match(text,/rol de revisor/);
assert.match(text,/Uso declarado sin tipo/);
assert.match(text,/Uso declarado sin targetRef/);
assert.match(text,/Claim local de verificación externa/);
assert.match(text,/sourceVerified=true/);
assert.match(text,/hashVerified=true/);
assert.match(text,/contenido ingerido/);
assert.match(text,/permiso de acceso verificado/);
assert.match(dd.integrity,/NO_FINGERPRINT ≠ GAP/);
assert.match(dd.integrity,/SOURCE_NOT_EXTERNALLY_VERIFIED ≠ GAP/);

for(const code of [snapshotCode,historyCode,gapsCode]){assert(!/fetch\s*\(/.test(code));assert(!/productionExecutionAvailable\s*=\s*true/.test(code));assert(!/canonicalMutated\s*=\s*true/.test(code));}
console.log('SANA source evidence history v56 validation: OK');
