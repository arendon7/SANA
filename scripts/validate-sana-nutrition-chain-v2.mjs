import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-nutrition-chain-v2.js','utf8');
globalThis.window={};
vm.runInThisContext(source,{filename:'sana-v3-nutrition-chain-v2.js'});
const api=window.__SANA_NUTRITION_CHAIN_V2__;
assert.ok(api);
assert.equal(api.projection,'SANA_NUTRITION_CHAIN_V2');
assert.equal(api.predecessorKinds.PREFLIGHT,'PROGRAM');
assert.equal(api.predecessorKinds.DECISION,'PREFLIGHT');
assert.equal(api.predecessorKinds.APPLICATION,'DECISION');
assert.equal(api.predecessorKinds.EVIDENCE,'APPLICATION');
assert.equal(api.predecessorKinds.RESPONSE,'EVIDENCE');

const event=(id,eventKind,observedAt,basisEventId='',caseId='NUT-V2-1',projectionVersion='V2')=>({id,eventKind,observedAt,basisEventId,caseId,projectionVersion});
const full=[
  event('N-PROG','PROGRAM','2026-08-18'),
  event('N-PREF','PREFLIGHT','2026-08-18','N-PROG'),
  event('N-DEC','DECISION','2026-08-18','N-PREF'),
  event('N-APP','APPLICATION','2026-08-19','N-DEC'),
  event('N-EVID','EVIDENCE','2026-08-19','N-APP'),
  event('N-RESP','RESPONSE','2026-08-20','N-EVID')
];
const ok=api.analyzeEvents(full);
assert.equal(ok.total,5);
assert.equal(ok.linked,5);
assert.equal(ok.percent,100);
assert.equal(ok.issues,0);
assert.ok(ok.rows.every(r=>r.reference.status==='LINKED'));

const missing=[event('M-PROG','PROGRAM','2026-08-18'),event('M-PREF','PREFLIGHT','2026-08-18')];
assert.equal(api.analyzeEvents(missing).rows[0].reference.status,'MISSING_REFERENCE');
const targetMissing=[event('T-PROG','PROGRAM','2026-08-18'),event('T-PREF','PREFLIGHT','2026-08-18','DOES-NOT-EXIST')];
assert.equal(api.analyzeEvents(targetMissing).rows[0].reference.status,'MISSING_TARGET');
const wrongKind=[event('K-PROG','PROGRAM','2026-08-18'),event('K-PREF','PREFLIGHT','2026-08-18','K-PROG'),event('K-DEC','DECISION','2026-08-18','K-PROG')];
assert.equal(api.analyzeEvents(wrongKind).rows.find(r=>r.event.id==='K-DEC').reference.status,'KIND_MISMATCH');
const cross=[event('C-PROG','PROGRAM','2026-08-18','', 'CASE-A'),event('C-PREF','PREFLIGHT','2026-08-18','C-PROG','CASE-B')];
assert.equal(api.analyzeEvents(cross).rows[0].reference.status,'CROSS_CASE_REFERENCE');
const forward=[event('F-PROG','PROGRAM','2026-08-20'),event('F-PREF','PREFLIGHT','2026-08-19','F-PROG')];
assert.equal(api.analyzeEvents(forward).rows[0].reference.status,'FORWARD_REFERENCE');

const historical=[
  event('H-PROG','PROGRAM','2026-08-18','', 'NUT-HIST','V1_SEEDED'),
  event('H-PREF','PREFLIGHT','2026-08-18','', 'NUT-HIST','V1_SEEDED'),
  event('H-DEC','DECISION','2026-08-18','', 'NUT-HIST','V1_SEEDED'),
  event('H-APP','APPLICATION','2026-08-19','', 'NUT-HIST','V1_SEEDED'),
  event('H-EVID','EVIDENCE','2026-08-19','', 'NUT-HIST','V1_SEEDED'),
  event('H-RESP','RESPONSE','2026-08-20','', 'NUT-HIST','V1_SEEDED')
];
const legacy=api.analyzeEvents(historical);
assert.equal(legacy.total,0,'historical V1 events must remain outside the V2 reference denominator');
assert.equal(legacy.percent,null);
assert.equal(api.eventReference(historical[1],historical).status,'LEGACY_NOT_CAPTURED');

const analyzed=api.analyzeCase({id:'NUT-V2-1',lot:'LOT-1',events:full,stageCoverage:{percent:100}});
assert.equal(analyzed.referenceCoverage.percent,100);
assert.equal(analyzed.referenceIssues,0);
assert.match(analyzed.integrity,/REFERENCE ≠ AUTHORIZATION/);
assert.match(analyzed.integrity,/RESPONSE ≠ CAUSAL_EFFECT/);
assert.match(api.integrity,/NO_AUTOMATIC_AUTHORIZATION/);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('fetch('),false);
assert.equal(source.includes('canonicalMutated=true'),false);
assert.equal(source.includes('productionExecutionAvailable=true'),false);

console.log('nutrition chain v2 contract OK · 5/5 predecessor references · V1 history excluded · reference is not authorization or causal effect');
