import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ledgerPath='apps/control-web/public/sana-v3-source-evidence-ledger.js';
const cyclePath='apps/control-web/public/sana-v3-cycle-source-provenance.js';
const ledgerCode=fs.readFileSync(ledgerPath,'utf8');
const cycleCode=fs.readFileSync(cyclePath,'utf8');
const rows=[
  {id:'SRC-001',provider:'SHAREPOINT',name:'Protocolo',scope:'CAF-A1',version:'v3',cut:'2026-08-10',reviewer:'Laura',state:'REFERENCE_ONLY',externalId:'SP-DEMO-PROTO-001'},
  {id:'SRC-004',provider:'SHAREPOINT',name:'Línea base',scope:'FIN-LE-001',version:'v4',cut:'2026-08-01',reviewer:'Marta',state:'REFERENCE_ONLY',externalId:'SP-DEMO-BASE-004'},
  {id:'SRC-LOCAL',provider:'SHAREPOINT',name:'Fuente local',scope:'CAF-A1',version:'v9',cut:'2026-08-17',reviewer:'Usuario',state:'REFERENCE_ONLY',externalId:'REF-DEMO-LOCAL'}
];
const storage={records:[
  {id:'SE-1',type:'source-evidence-event',createdAt:'2026-08-17T20:00:00-05:00',values:{sourceId:'SRC-LOCAL',kind:'FINGERPRINT_DECLARED',fingerprint:'abc123',fingerprintType:'SHA256_DECLARED',observedAt:'2026-08-17T20:00:00-05:00'}},
  {id:'SE-2',type:'source-evidence-event',createdAt:'2026-08-17T20:01:00-05:00',values:{sourceId:'SRC-LOCAL',kind:'HUMAN_REVIEW_RECORDED',reviewOutcome:'REVIEWED_AS_REFERENCE',reviewerRole:'Técnico',observedAt:'2026-08-17T20:01:00-05:00'}},
  {id:'SE-3',type:'source-evidence-event',createdAt:'2026-08-17T20:02:00-05:00',values:{sourceId:'SRC-LOCAL',kind:'USE_DECLARED',useType:'PLAN_CONTEXT',targetRef:'PL-CF-04',observedAt:'2026-08-17T20:02:00-05:00'}},
  {id:'SE-4',type:'source-evidence-event',createdAt:'2026-08-17T20:03:00-05:00',values:{sourceId:'SRC-LOCAL',kind:'EXTERNAL_VERIFICATION_STATUS',verificationStatus:'EXTERNALLY_VERIFIED_DECLARED',observedAt:'2026-08-17T20:03:00-05:00'}}
]};
const context={window:{__SANA_DOCUMENT_SOURCES__:{rows:()=>rows.map(x=>({...x}))},__SANA_CYCLE_CLOSURE__:{selectedPlan:()=>({id:'PL-CF-04',version:4,lot:'CAF-A1'})}},storage,DEMO:{farm:{id:'FIN-LE-001'},plans:[{id:'PL-CF-04',version:4,lot:'CAF-A1'}]},views:{sources:()=>'',passport:()=>'',cycle:()=>''},head:()=>'',metric:()=>'',footer:()=>'',esc:v=>String(v),openModal:()=>{},document:{addEventListener:()=>{}},localStorage:{getItem:()=>null},console};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(ledgerCode,context,{filename:ledgerPath});
const api=context.window.__SANA_SOURCE_EVIDENCE_LEDGER__;
assert(api,'source evidence API missing');
assert.equal(api.schema,'SANA_SOURCE_EVIDENCE_LEDGER_V1');
const all=api.cases();
const src1=all.find(c=>c.id==='SRC-001');
assert.equal(src1.versionLabel,'v3');
assert.equal(src1.versionImmutable,false);
assert.equal(src1.fingerprint,'FP-DEMO-PROTO-001-v3');
assert.equal(src1.hashVerified,false);
assert.equal(src1.humanReviewRecorded,true);
assert.equal(src1.sourceVerified,false);
assert.equal(src1.contentIngested,false);
assert.equal(src1.accessPermissionVerified,false);
assert(src1.uses.some(u=>u.targetRef==='PL-CF-04'));

const local=all.find(c=>c.id==='SRC-LOCAL');
assert.equal(local.fingerprint,'abc123');
assert.equal(local.hashVerified,false,'declared fingerprint must not infer hash verification');
assert.equal(local.externalVerificationStatus,'EXTERNALLY_VERIFIED_DECLARED');
assert.equal(local.externalVerificationClaimed,true);
assert.equal(local.sourceVerified,false,'local external verification declaration must never become verified source');
assert.equal(local.humanReviewRecorded,true);
assert.equal(api.forTarget('PL-CF-04').some(c=>c.id==='SRC-LOCAL'),true);
assert.equal(api.summary().externallyVerified,0);
assert.equal(api.summary().verificationClaims,1);
assert.match(api.integrity,/EXTERNAL_VERIFICATION_STATUS_DECLARED ≠ EXTERNAL_VERIFICATION/);
assert.match(api.integrity,/FINGERPRINT_DECLARED ≠ HASH_VERIFIED/);
assert.match(api.integrity,/SOURCE_LINK ≠ ACCESS_PERMISSION/);

vm.runInContext(cycleCode,context,{filename:cyclePath});
const cycle=context.window.__SANA_CYCLE_SOURCE_EVIDENCE__;
assert(cycle,'cycle source evidence API missing');
const selected=cycle.selected();
assert.equal(selected.valid,true);
assert.equal(selected.plan.id,'PL-CF-04');
assert(selected.sources.some(s=>s.sourceId==='SRC-001'));
assert(selected.sources.some(s=>s.sourceId==='SRC-004'),'farm source should be included');
assert(selected.sources.some(s=>s.sourceId==='SRC-LOCAL'));
assert(selected.sources.every(s=>s.sourceVerified===false));
assert(selected.sources.every(s=>s.hashVerified===false));
assert(!('completeness' in selected));
assert(!('readyForArchive' in selected));
assert.match(cycle.integrity,/SOURCE_PROVENANCE ≠ CYCLE_GATE/);

for(const code of [ledgerCode,cycleCode]){
  assert(!/fetch\s*\(/.test(code));
  assert(!/productionExecutionAvailable\s*=\s*true/.test(code));
  assert(!/canonicalMutated\s*=\s*true/.test(code));
  assert(!/sourceVerified\s*:\s*true/.test(code));
}
console.log('SANA source evidence ledger v55 validation: OK');
