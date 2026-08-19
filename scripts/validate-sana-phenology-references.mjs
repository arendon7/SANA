import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-phenology-references.js','utf8');
for(const token of ['V133','LEGACY_REFERENCE_NOT_CAPTURED','MISSING_REFERENCE','MISSING_TARGET','KIND_MISMATCH','CROSS_LOT_REFERENCE','FORWARD_REFERENCE','LINKED','REFERENCE ≠ PLAN_PHASE','REFERENCE ≠ MANAGEMENT_DECISION','REFERENCE ≠ CAUSALITY'])assert.ok(src.includes(token),token);

const E=[
{id:'S1',eventKind:'STAGE_OBSERVATION',lot:'L1',observedAt:'2026-08-01T08:00:00-05:00'},
{id:'M1',eventKind:'VARIABLE_MEASUREMENT',lot:'L1',observedAt:'2026-08-01T09:00:00-05:00'},
{id:'S2',eventKind:'STAGE_OBSERVATION',lot:'L2',observedAt:'2026-08-01T08:00:00-05:00'},
{id:'MF',eventKind:'VARIABLE_MEASUREMENT',lot:'L1',observedAt:'2026-08-05T09:00:00-05:00'},
{id:'I1',eventKind:'HUMAN_INTERPRETATION',lot:'L1',observedAt:'2026-08-02T08:00:00-05:00',basisRefs:['S1','M1']},
{id:'E1',eventKind:'EVIDENCE',lot:'L1',observedAt:'2026-08-03T08:00:00-05:00',supports:['I1']},
{id:'IMISS',eventKind:'HUMAN_INTERPRETATION',lot:'L1',observedAt:'2026-08-03T08:00:00-05:00',basisRefs:['NOPE']},
{id:'IKIND',eventKind:'HUMAN_INTERPRETATION',lot:'L1',observedAt:'2026-08-04T08:00:00-05:00',basisRefs:['E1']},
{id:'ICROSS',eventKind:'HUMAN_INTERPRETATION',lot:'L1',observedAt:'2026-08-04T08:00:00-05:00',basisRefs:['S2']},
{id:'IFWD',eventKind:'HUMAN_INTERPRETATION',lot:'L1',observedAt:'2026-08-04T08:00:00-05:00',basisRefs:['MF']},
{id:'IEMPTY',eventKind:'HUMAN_INTERPRETATION',lot:'L1',observedAt:'2026-08-04T08:00:00-05:00',basisRefs:[]},
{id:'ILEG',eventKind:'HUMAN_INTERPRETATION',lot:'L1',observedAt:'2026-08-04T08:00:00-05:00',basisRefs:['S1']}
];
const v133=['I1','E1','IMISS','IKIND','ICROSS','IFWD','IEMPTY'];
globalThis.storage={records:v133.map(id=>({id,type:'phenology-series-event',values:{phenologySchema:'SANA_PHENOLOGY_SERIES_V1',referenceVersion:'V133'}}))};
globalThis.identity={displayName:'QA'};globalThis.DEMO={lots:[{id:'L1',crop:'QA'},{id:'L2',crop:'QA'}]};globalThis.views={phenology:()=>'<footer class="footer"></footer>'};globalThis.document={addEventListener:()=>{}};globalThis.esc=v=>String(v??'');globalThis.metric=()=>'';globalThis.openModal=()=>{};
const summary=lot=>({lot,stages:E.filter(e=>e.lot===lot&&e.eventKind==='STAGE_OBSERVATION'),measurements:E.filter(e=>e.lot===lot&&e.eventKind==='VARIABLE_MEASUREMENT'),interpretations:E.filter(e=>e.lot===lot&&e.eventKind==='HUMAN_INTERPRETATION'),evidence:E.filter(e=>e.lot===lot&&e.eventKind==='EVIDENCE'),variables:[],legacy:[],integrity:'BASE'});
globalThis.window={__SANA_PHENOLOGY_SERIES__:Object.freeze({schema:'SANA_PHENOLOGY_SERIES_V1',entries:()=>E,forLot:lot=>({entries:E.filter(e=>e.lot===lot),legacy:[]}),summary,integrity:'BASE'})};
vm.runInThisContext(src);
const api=window.__SANA_PHENOLOGY_SERIES__,by=id=>api.entries().find(e=>e.id===id);
assert.equal(api.reference(by('I1'),'S1').status,'LINKED');
assert.equal(api.reference(by('IMISS'),'NOPE').status,'MISSING_TARGET');
assert.equal(api.reference(by('IKIND'),'E1').status,'KIND_MISMATCH');
assert.equal(api.reference(by('ICROSS'),'S2').status,'CROSS_LOT_REFERENCE');
assert.equal(api.reference(by('IFWD'),'MF').status,'FORWARD_REFERENCE');
const c=api.referenceCoverage('L1');
assert.equal(c.total,8);assert.equal(c.linked,3);assert.equal(c.issues,5);
assert.equal(c.rows.find(r=>r.event.id==='IEMPTY').reference.status,'MISSING_REFERENCE');
assert.equal(api.reference(by('ILEG'),'S1').status,'LEGACY_REFERENCE_NOT_CAPTURED');
console.log('SANA phenology semantic references V133: OK');
