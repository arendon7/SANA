import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const snapSrc=fs.readFileSync('apps/control-web/public/sana-v3-report-snapshot-forecast-references.js','utf8');
const ddSrc=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-forecast-reference-gaps.js','utf8');
const cases=[
  {id:'F1',lot:'L1',itemId:'I1',referenceState:'CAPTURED_V139',referenceCoverage:{linked:1,total:2},referenceIssues:1,referenceRows:[{kind:'PLAN',refId:'PL-1',reference:{status:'LINKED',domain:'PLAN',target:{id:'PL-1'}}},{kind:'ACTIVITY',refId:'A-X',reference:{status:'MISSING_TARGET',domain:'ACTIVITY',target:null}}]},
  {id:'F2',lot:'L2',itemId:'I2',referenceState:'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{linked:0,total:0},referenceIssues:0,referenceRows:[]}
];
const snapshotSandbox={window:{__SANA_FORECAST_LEDGER__:{referenceVersion:'V139',cases:()=>cases}},document:{addEventListener:()=>{},getElementById:()=>null},queueMicrotask:f=>f(),console};
vm.createContext(snapshotSandbox);vm.runInContext(snapSrc,snapshotSandbox);
const manifest={schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',forecast:{cases:2}};
snapshotSandbox.window.__SANA_REPORT_SNAPSHOT_FORECAST_REFERENCES__.enrich(manifest);
assert.equal(manifest.forecastReferences.version,'V140');
assert.equal(manifest.forecastReferences.capturedCount,1);
assert.equal(manifest.forecastReferences.legacyCount,1);
assert.equal(manifest.forecastReferences.linked,1);
assert.equal(manifest.forecastReferences.expected,2);
assert.equal(manifest.forecastReferences.issueCount,1);
assert.equal(manifest.forecastReferences.cases[1].referenceState,'LEGACY_REFERENCE_NOT_CAPTURED');

const snapshot={manifest,reportType:'RPT-DD',cutoff:'2026-08-20'};
const baseState={valid:true,snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[],integrity:'BASE'};
const ddSandbox={window:{__SANA_DUE_DILIGENCE_GAPS__:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',latest:()=>snapshot,derive:()=>baseState,current:()=>baseState}},views:{reports:()=>''},esc:v=>String(v??''),console};
vm.createContext(ddSandbox);vm.runInContext(ddSrc,ddSandbox);
const gaps=ddSandbox.window.__SANA_DD_FORECAST_REFERENCE_GAPS__.derive(snapshot);
assert.equal(gaps.length,1);
assert.match(gaps[0].condition,/MISSING_TARGET/);
assert.match(gaps[0].detail,/no invalida la estimación/i);
const legacy={manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',forecast:{}},reportType:'RPT-DD'};
assert.equal(ddSandbox.window.__SANA_DD_FORECAST_REFERENCE_GAPS__.derive(legacy).length,0);
console.log('forecast reference provenance V140: ok');
