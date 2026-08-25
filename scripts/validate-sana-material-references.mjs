import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-material-references.js','utf8');
const chains=[
  {material:{id:'M1'},target:'L1',identity:{id:'M1',targetLot:'L1'},events:[{id:'E1',materialId:'M1',date:'2026-08-01',destinationLot:'L1'}],costs:[],inventory:[],integrity:'BASE'},
  {material:{id:'M2'},target:'L2',identity:{id:'M2',targetLot:'L2'},events:[{id:'E2',materialId:'M2',date:'2026-08-05',destinationLot:'L2'}],costs:[],inventory:[],integrity:'BASE'},
  {material:{id:'M3'},target:'L3',identity:{id:'M3',targetLot:'L3'},events:[{id:'E3',materialId:'M3',date:'2026-08-01'}],costs:[],inventory:[],integrity:'BASE'}
];
const base={schema:'SANA_MATERIAL_CHAIN_V1',all:()=>structuredClone(chains),forMaterial:id=>structuredClone(chains.find(c=>c.identity.id===id)||null),forLot:lot=>structuredClone(chains.filter(c=>c.target===lot)),eventsFor:id=>structuredClone(chains.find(c=>c.identity.id===id)?.events||[]),integrity:'BASE'};
const records=[
  {id:'R1',type:'material-lifecycle-event',createdAt:'2026-08-02T12:00:00Z',values:{referenceVersion:'V156',materialId:'M1',date:'2026-08-02',destinationLot:'L1',sourceRef:'PROVIDER-DOC',evidenceRef:'EVIDENCE-DOC'}},
  {id:'C1',type:'economics-cost',createdAt:'2026-08-03T12:00:00Z',values:{referenceVersion:'V156',materialId:'M1',materialEventId:'E1',date:'2026-08-03'}},
  {id:'I1',type:'inventory-movement',createdAt:'2026-08-04T12:00:00Z',values:{referenceVersion:'V156',materialId:'M1',materialEventId:'E2'}},
  {id:'R2',type:'material-lifecycle-event',createdAt:'2026-08-04T12:00:00Z',values:{referenceVersion:'V156',materialId:'M2',date:'2026-08-04',destinationLot:'L9'}},
  {id:'C2',type:'economics-cost',createdAt:'2026-08-04T12:00:00Z',values:{referenceVersion:'V156',materialId:'M2',materialEventId:'E2',date:'2026-08-04'}},
  {id:'O1',type:'material-lifecycle-event',createdAt:'2026-08-02T12:00:00Z',values:{referenceVersion:'V156',materialId:'M9',destinationLot:'L1',sourceRef:'ORPHAN-SOURCE'}},
  {id:'O2',type:'inventory-movement',createdAt:'2026-08-06T12:00:00Z',values:{referenceVersion:'V156',materialId:'M9',materialEventId:'E1'}},
  {id:'OLD',type:'economics-cost',values:{materialId:'M3',materialEventId:'E3'}}
];
const sandbox={window:{__SANA_MATERIAL_CHAIN__:base},DEMO:{material:[{id:'M1'},{id:'M2'},{id:'M3'}],lots:[{id:'L1'},{id:'L2'},{id:'L3'}]},storage:{records},structuredClone,console,Date,setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.__SANA_MATERIAL_CHAIN__;
assert.equal(api.referenceVersion,'V156');
const m1=api.forMaterial('M1');
assert.equal(m1.referenceState,'CAPTURED');
assert.deepEqual(JSON.parse(JSON.stringify(m1.referenceCoverage)),{total:5,linked:4,issues:1,percent:80});
assert.ok(m1.referenceRows.some(r=>r.kind==='DESTINATION_LOT_REF'&&r.status==='LINKED'));
assert.ok(m1.referenceRows.some(r=>r.kind==='COST_MATERIAL_EVENT_REF'&&r.status==='LINKED'));
assert.ok(m1.referenceRows.some(r=>r.kind==='INVENTORY_MATERIAL_EVENT_REF'&&r.status==='CROSS_MATERIAL_REFERENCE'));
assert.equal(m1.declaredReferenceRows.length,2);
assert.ok(m1.declaredReferenceRows.every(r=>r.status==='DECLARED_NON_CANONICAL_REFERENCE'));
const m2=api.forMaterial('M2');
assert.equal(m2.referenceCoverage.total,3);
assert.equal(m2.referenceIssues,2);
assert.ok(m2.referenceRows.some(r=>r.kind==='DESTINATION_LOT_REF'&&r.status==='MISSING_TARGET'));
assert.ok(m2.referenceRows.some(r=>r.kind==='COST_MATERIAL_EVENT_REF'&&r.status==='FORWARD_REFERENCE'));
const legacy=api.forMaterial('M3');
assert.equal(legacy.referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');
assert.equal(legacy.referenceCoverage.total,0);
const orphan=api.orphanReferenceRows();
assert.equal(orphan.length,4);
assert.ok(orphan.some(r=>r.source.id==='O1'&&r.kind==='MATERIAL_ID_REF'&&r.status==='MISSING_TARGET'));
assert.ok(orphan.some(r=>r.source.id==='O1'&&r.kind==='DESTINATION_LOT_REF'&&r.status==='LINKED'));
assert.ok(orphan.some(r=>r.source.id==='O2'&&r.kind==='INVENTORY_MATERIAL_EVENT_REF'&&r.status==='SOURCE_MATERIAL_MISSING'));
const summary=api.summary();
assert.equal(summary.referenceCaptured,2);
assert.equal(summary.legacyReferenceNotCaptured,1);
assert.equal(summary.orphanSourceCount,2);
assert.equal(summary.referenceExpected,12);
assert.equal(summary.referenceLinked,6);
assert.equal(summary.referenceIssues,6);
assert.equal(summary.declaredNonCanonical,3);
assert.match(api.integrity,/MATERIAL_REFERENCE ≠ MATERIAL_IDENTITY_VERIFICATION/);
assert.match(api.integrity,/SOURCE_REFERENCE_DECLARED ≠ ORIGIN_VERIFIED/);
assert.match(api.integrity,/REFERENCE ≠ GENETIC_QUALITY ≠ PHYTOSANITARY_STATUS ≠ ICA_CERTIFICATION/);
console.log('material references V156: ok');
