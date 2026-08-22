import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-gaps.js','utf8');

function boot(snapshots=[]){
  globalThis.window={__SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>snapshots}};
  globalThis.views={reports:()=>'<footer class="footer"></footer>'};
  globalThis.esc=v=>String(v??'');
  globalThis.metric=()=>'';
  vm.runInThisContext(source,{filename:'sana-v3-due-diligence-gaps.js'});
  return window.__SANA_DUE_DILIGENCE_GAPS__;
}

const schema='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
const completeManifest={
  schema,reportType:'RPT-DD',farm:{id:'F-1'},
  cycles:[{planId:'P-1',evidenceGaps:0,openActivities:0,readyForArchive:true,reviewStatus:'REVISADO DEMO'}],
  passport:[{lot:'L-1',integrity:95}],
  economics:[{lotId:'L-1',localRecorded:1000,observedStatus:'LOCAL_ONLY',explicitCostCount:1,supportCoverage:100,mismatchCount:0,unallocatedCount:0}],
  sources:[{id:'SRC-1',state:'VERIFIED_REFERENCE',scope:'L-1',version:'1',cut:'2026-08-17'}],
  impact:{humanReviewed:true,externallyVerified:1,estimated:0},
  capital:{gates:{identity:{state:'ready'},technical:{state:'ready'},operations:{state:'ready'},costs:{state:'ready'},risk:{state:'ready'},impact:{state:'ready'},legal:{state:'ready'}}}
};
const complete={id:'SNAP-COMPLETE',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:completeManifest};

let api=boot([complete]);
let result=api.current();
assert.equal(result.valid,true);
assert.equal(result.gaps.length,0);
assert.deepEqual(result.domains,[]);

const gapManifest=structuredClone(completeManifest);
gapManifest.cycles=[{planId:'P-2',evidenceGaps:2,openActivities:1,readyForArchive:false,reviewStatus:'SIN_REVISIÓN'}];
gapManifest.passport=[{lot:'L-2',integrity:62}];
gapManifest.economics=[{lotId:'L-2',localRecorded:0,observedStatus:'SIN_RESULTADO',explicitCostCount:2,supportCoverage:50,mismatchCount:1,unallocatedCount:1}];
gapManifest.sources=[{id:'SRC-2',state:'REFERENCE_ONLY',scope:'L-2',version:'1',cut:'2026-08-17'}];
gapManifest.impact={humanReviewed:false,externallyVerified:0,estimated:2};
gapManifest.capital={gates:{operations:{state:'gap'},costs:{state:'review'},legal:{state:'blocked'}}};
const withGaps={id:'SNAP-GAPS',reportType:'RPT-DD',cutoff:'2026-08-18',manifest:gapManifest};
api=boot([complete,withGaps]);
result=api.current();
assert.equal(result.valid,true);
assert.deepEqual(new Set(result.domains),new Set(['Ciclo','Passport','Economía','Fuentes','Impacto','Readiness']));
assert.ok(result.counts.ALTA>0);
assert.ok(result.counts.MEDIA>0);
assert.ok(result.counts.BAJA>0);
assert.ok(result.gaps.every(g=>g.status==='OPEN_AT_SNAPSHOT'));
assert.ok(result.gaps.every(g=>['ALTA','MEDIA','BAJA'].includes(g.severity)));

const legacyEconomics=structuredClone(completeManifest);
legacyEconomics.economics=[{lotId:'L-1',localRecorded:1000,observedStatus:'LOCAL_ONLY'}];
api=boot([{id:'SNAP-LEGACY',reportType:'RPT-DD',cutoff:'2026-08-19',manifest:legacyEconomics}]);
result=api.current();
assert.ok(result.gaps.some(g=>g.id==='economics:L-1:granularity'&&g.severity==='BAJA'));

api=boot([{id:'BAD',reportType:'RPT-DD',cutoff:'2026-08-20',manifest:{schema:'OTHER'}}]);
result=api.current();
assert.equal(result.valid,false);
assert.equal(result.reason,'NO_SNAPSHOT');
const incompatible=api.derive({id:'BAD',manifest:{schema:'OTHER'}});
assert.equal(incompatible.valid,false);
assert.equal(incompatible.reason,'SCHEMA_INCOMPATIBLE');

assert.equal(source.includes('storage.records'),false);
assert.equal(source.includes('.currentManifest'),false);
assert.match(api.integrity,/DOCUMENTARY_PRIORITY ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION/);

console.log('due diligence gap matrix contract OK · historical-only semantics validated');
