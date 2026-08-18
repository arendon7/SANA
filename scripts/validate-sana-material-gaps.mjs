import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-material-gaps.js','utf8');
const schema='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
const legacy={id:'OLD',reportType:'RPT-DD',manifest:{schema,farm:{id:'F-1'}}};
const goodRow={materialId:'MAT-1',targetLot:'CAF-A1',origin:'Vivero DEMO',stageCoverage:90,evidenceCoverage:95,explicitEvents:2,legacyEvents:1,declaredLoss:12,latestSurvivalRate:88,countMismatch:0};
const good={id:'GOOD',reportType:'RPT-DD',manifest:{schema,farm:{id:'F-1'},material:{lots:[{lotId:'CAF-A1',materials:[goodRow]}],unassigned:[]}}};
const bad={id:'BAD',reportType:'RPT-DD',manifest:{schema,farm:{id:'F-1'},material:{lots:[{lotId:'CAF-A1',materials:[{...goodRow,origin:'',stageCoverage:45,evidenceCoverage:40,explicitEvents:0,legacyEvents:3,latestSurvivalRate:null,countMismatch:1}]}],unassigned:[]}}};

let latest=good;
const baseApi={
  schema,
  latest:()=>latest,
  derive:s=>({valid:true,snapshot:s,gaps:[{id:'base',domain:'Ciclo',entity:'P1',condition:'base',source:'x',severity:'MEDIA',owner:'Técnico',status:'OPEN_AT_SNAPSHOT'}],counts:{ALTA:0,MEDIA:1,BAJA:0},domains:['Ciclo'],integrity:'base'}),
  current(){return this.derive(this.latest())}
};
const sandbox={window:{__SANA_DUE_DILIGENCE_GAPS__:baseApi},views:{reports:()=>'<footer class="footer">x</footer>'},esc:v=>String(v??''),console};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(code,sandbox);
const material=sandbox.window.__SANA_DD_MATERIAL_GAPS__;
const wrapped=sandbox.window.__SANA_DUE_DILIGENCE_GAPS__;
if(!material||!wrapped)throw new Error('material gap APIs missing');

const oldGaps=material.derive(legacy);
if(oldGaps.length!==1||oldGaps[0].id!=='material:granularity'||oldGaps[0].severity!=='BAJA')throw new Error('legacy snapshot should create only low-priority granularity gap');
const goodGaps=material.derive(good);
if(goodGaps.length!==0)throw new Error(`complete material chain should not invent gaps: ${JSON.stringify(goodGaps)}`);
const badGaps=material.derive(bad);
for(const token of ['origin','stages-high','evidence-high','count-mismatch','legacy-only']){
  if(!badGaps.some(g=>g.id.includes(token)))throw new Error(`missing expected material gap ${token}`);
}
if(badGaps.some(g=>/loss|pérdida/i.test(g.id)||/12/.test(g.condition)))throw new Error('declared loss alone must not become a gap');
latest=bad;
const combined=wrapped.current();
if(!combined.gaps.some(g=>g.id==='base')||!combined.gaps.some(g=>g.domain==='Material vegetal'))throw new Error('wrapped gap API must preserve base gaps and add material gaps');
if(!combined.domains.includes('Material vegetal'))throw new Error('material domain not propagated');
if(!/MATERIAL_PROVENANCE/.test(combined.integrity))throw new Error('combined integrity marker missing');
if(code.includes('__SANA_MATERIAL_CHAIN__'))throw new Error('gap extension must not read live material chain');
if(/creditApproved|investmentRecommendation|certifiedGenetic/i.test(code))throw new Error('forbidden inference pattern found');

console.log(`material gaps contract OK · legacy=${oldGaps.length} · good=${goodGaps.length} · bad=${badGaps.length} · loss-alone-not-gap`);
