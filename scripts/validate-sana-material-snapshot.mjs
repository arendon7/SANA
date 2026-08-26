import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync('apps/control-web/public/sana-v3-dataroom-material-history.js','utf8');
const legacy={id:'S1',reportType:'RPT-DD',cutoff:'2026-08-01',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1'}};
const materialRow={materialId:'MAT-1',species:'Café',type:'Semilla',origin:'Origen DEMO',targetLot:'CAF-A1',stageCoverage:70,explicitEvents:1,legacyEvents:2,declaredLoss:10,latestSurvivalRate:90,evidenceCoverage:80,countMismatch:0,costCount:1,costAmount:100000,inventoryMovementCount:1,temporalState:'SNAPSHOT_CAPTURED_FROM_MATERIAL_CHAIN'};
const captured={id:'S2',reportType:'RPT-DD',cutoff:'2026-08-10',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',material:{lots:[{lotId:'CAF-A1',materials:[materialRow]}],unassigned:[],granularity:'ADDITIVE_V1 · MATERIAL_CHAIN',capturedAt:'2026-08-10T12:00:00Z'}}};
const changed={id:'S3',reportType:'RPT-DD',cutoff:'2026-08-17',manifest:{schema:'SANA_DUE_DILIGENCE_SNAPSHOT_V1',material:{lots:[{lotId:'CAF-A1',materials:[{...materialRow,stageCoverage:85,explicitEvents:2,declaredLoss:12,latestSurvivalRate:88,evidenceCoverage:95,costCount:2,costAmount:160000,inventoryMovementCount:2}]}],unassigned:[],granularity:'ADDITIVE_V1 · MATERIAL_CHAIN',capturedAt:'2026-08-17T12:00:00Z'}}};

const snapshots=[changed,captured,legacy];
const sandbox={
  window:{
    __SANA_DUE_DILIGENCE_SNAPSHOT__:{snapshots:()=>snapshots},
    __SANA_SNAPSHOT_COMPARE__:{selection:()=>({base:'S2',target:'S3'})}
  },
  views:{dataroom:()=>'<footer class="footer">x</footer>',reports:()=>'<footer class="footer">x</footer>'},
  esc:v=>String(v??''),metric:()=>'',console
};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(code,sandbox);
const api=sandbox.window.__SANA_DATAROOM_MATERIAL_HISTORY__;
if(!api)throw new Error('missing material history API');

const state=api.state();
if(state.state!=='CAPTURED'||state.rows.length!==1)throw new Error('latest captured material snapshot not read correctly');
if(code.includes('__SANA_MATERIAL_CHAIN__'))throw new Error('historical module must not fall back to live material chain');

const legacyVsCaptured=api.diff(legacy,captured);
if(!legacyVsCaptured.valid||legacyVsCaptured.state!=='PARTIAL_GRANULARITY')throw new Error('legacy snapshot must remain valid with partial granularity');

const full=api.diff(captured,changed);
if(!full.valid||full.state!=='CAPTURED_BOTH')throw new Error('enriched snapshots should compare');
for(const label of ['Cobertura de etapas %','Eventos con conteo explícito','Pérdidas declaradas','Supervivencia explícita %','Cobertura de evidencia %','Costos relacionados','Movimientos relacionados']){
  if(!full.changes.some(c=>c.field===label))throw new Error(`missing expected material delta: ${label}`);
}
if(!/CHANGE ≠ IMPROVEMENT ≠ SURVIVAL_CAUSALITY ≠ INVESTMENT_SIGNAL/.test(full.integrity))throw new Error('interpretation boundary missing');
if(/resolve|certif.*true|investmentApproved/i.test(code))throw new Error('forbidden authority pattern found');

console.log(`material snapshot contract OK · ${full.changes.length} historical deltas · legacy no-fill preserved`);
