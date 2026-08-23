import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-commercial-references.js','utf8');
new vm.Script(src,{filename:'commercial-reference-history-v149'});
const clone=v=>JSON.parse(JSON.stringify(v));

const modernData={
  referenceSemanticsVersion:'V149',
  cases:[{
    caseId:'COM-1',lot:'L1',referenceState:'CAPTURED_V147',referenceVersion:'V147',referenceSemanticsVersion:'V149',
    linked:1,total:1,issues:0,declaredNonCanonicalCount:2,
    declaredCanonicalLinked:1,declaredCanonicalTotal:1,declaredCanonicalIssues:0,
    derivedCrossDomainLinked:0,derivedCrossDomainTotal:0,derivedCrossDomainIssues:0,
    rows:[{sourceEventId:'D1',sourceKind:'DELIVERY_DECLARATION',kind:'HARVEST_DELIVERY_REF',refId:'HR-H1',sourceDomain:'',sourceKindExpected:'',origin:'DECLARED_COMMERCIAL_EVENT',temporalPolicy:'ENFORCED_WHEN_COMPARABLE',status:'LINKED',domain:'HARVEST',targetId:'HR-H1',targetKind:'HANDOFF',targetLot:'L1'}]
  }]
};
const legacyData=clone(modernData);
delete legacyData.referenceSemanticsVersion;
for(const c of legacyData.cases){
  delete c.referenceSemanticsVersion;
  for(const f of ['declaredCanonicalLinked','declaredCanonicalTotal','declaredCanonicalIssues','derivedCrossDomainLinked','derivedCrossDomainTotal','derivedCrossDomainIssues'])delete c[f];
  for(const r of c.rows){delete r.origin;delete r.temporalPolicy;}
}
function snap(id,cutoff,data){return {id,reportType:'RPT-DD',cutoff,manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',commercialReferences:clone(data)}}}
const legacy=snap('S-V148','2026-08-20',legacyData);
const modern=snap('S-V149','2026-08-21',modernData);
const context={window:{__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>[modern,legacy]}},views:{dataroom:()=>''},esc:String,metric:()=>'',console,JSON,Object,Array,Number,String,Math,Map,Set};
vm.createContext(context);vm.runInContext(src,context);
const api=context.window.__SANA_DATAROOM_COMMERCIAL_REFERENCES__;

// Pure semantic enrichment: one explicit migration delta, zero reference-row churn.
const migration=api.diff(legacy,modern);
assert.equal(migration.valid,true);
assert.equal(migration.state,'CAPTURED_BOTH');
assert.equal(migration.semanticChanges,1);
assert.equal(migration.rowChanges,0);
assert.equal(migration.derivedProjectionChanges,0);
assert.ok(migration.changes.some(c=>c.changeKind==='SEMANTIC_GRANULARITY_CHANGED'&&c.field==='referenceSemanticsVersion'));
assert.equal(migration.comparisonFields.includes('origin'),false);
assert.equal(migration.comparisonFields.includes('temporalPolicy'),false);

// A real target swap during the same V148→V149 transition must still be visible.
const changedModern=snap('S-V149-CHANGED','2026-08-22',modernData);
const changedRow=changedModern.manifest.commercialReferences.cases[0].rows[0];
changedRow.refId='HR-H2';changedRow.targetId='HR-H2';
const migrationWithTargetChange=api.diff(legacy,changedModern);
assert.equal(migrationWithTargetChange.semanticChanges,1);
assert.equal(migrationWithTargetChange.rowChanges,2);
assert.equal(migrationWithTargetChange.derivedProjectionChanges,0);
assert.ok(migrationWithTargetChange.changes.some(c=>c.changeKind==='REFERENCE_ROW_REMOVED'));
assert.ok(migrationWithTargetChange.changes.some(c=>c.changeKind==='REFERENCE_ROW_ADDED'));

// Once both snapshots are V149, origin and temporal policy are structural and derived deltas are labeled separately.
const modernOriginChanged=snap('S-V149-ORIGIN','2026-08-23',modernData);
modernOriginChanged.manifest.commercialReferences.cases[0].rows[0].origin='DERIVED_CROSS_DOMAIN_PROJECTION';
modernOriginChanged.manifest.commercialReferences.cases[0].rows[0].temporalPolicy='NOT_APPLICABLE_NO_DECLARATION_TIMESTAMP';
const v149Structural=api.diff(modern,modernOriginChanged);
assert.equal(v149Structural.semanticChanges,0);
assert.equal(v149Structural.rowChanges,2);
assert.equal(v149Structural.derivedProjectionChanges,1);
assert.equal(v149Structural.comparisonFields.includes('origin'),true);
assert.equal(v149Structural.comparisonFields.includes('temporalPolicy'),true);
assert.ok(v149Structural.changes.some(c=>c.changeKind==='REFERENCE_ROW_REMOVED'));
assert.ok(v149Structural.changes.some(c=>c.changeKind==='DERIVED_PROJECTION_ROW_ADDED'));

const identical=api.diff(modern,snap('S-V149-IDENTICAL','2026-08-24',modernData));
assert.equal(identical.total,0);
assert.equal(identical.rowChanges,0);
assert.equal(identical.semanticChanges,0);
assert.equal(identical.derivedProjectionChanges,0);

assert.match(src,/DECLARED_REFERENCE_DELTA ≠ DERIVED_PROJECTION_DELTA/);
assert.match(src,/SEMANTIC_GRANULARITY_CHANGE ≠ REFERENCE_CHANGE/);
assert.doesNotMatch(src,/__SANA_COMMERCIAL_LEDGER__|localStorage|storage\?\.records/);
console.log('SANA Commercial Reference History Migration V149: OK');
