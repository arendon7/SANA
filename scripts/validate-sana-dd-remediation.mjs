import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-due-diligence-remediation.js','utf8');
const gap={id:'cycle:P-1:evidence',domain:'Ciclo',entity:'P-1',condition:'1 brecha de evidencia',source:'Cycle Closure',severity:'ALTA',owner:'Técnico + Productor'};
const snapshot={id:'SNAP-1'};

function boot({role='technical',canAction=true,records=[]}={}){
  globalThis.storage={records};
  globalThis.window={
    __SANA_DUE_DILIGENCE_GAPS__:{current:()=>({valid:true,snapshot,gaps:[gap]})},
    __SANA_ACCESS__:{role,canAction:()=>canAction,deny:()=>{}}
  };
  globalThis.views={reports:()=>'<footer class="footer"></footer>'};
  globalThis.esc=v=>String(v??'');
  globalThis.metric=()=>'';
  delete globalThis.document;
  vm.runInThisContext(source,{filename:'sana-v3-due-diligence-remediation.js'});
  return window.__SANA_DUE_DILIGENCE_REMEDIATION__;
}

const record={id:'REC-1',type:'dd-remediation',createdAt:'2026-08-17T21:00:00Z',values:{snapshotId:'SNAP-1',gapId:gap.id,status:'EN_CURSO',owner:'Laura Técnica',dueDate:'2026-08-25',detail:'Completar soporte',expectedEvidence:'Documento versionado'}};
let api=boot({role:'technical',canAction:true,records:[record]});
assert.equal(api.canManage(),true);
assert.equal(api.records().length,1);
assert.equal(api.forSnapshot('SNAP-1').length,1);
assert.equal(api.latestForGap('SNAP-1',gap.id).status,'EN_CURSO');
assert.equal(api.latestForGap('SNAP-1',gap.id).localOnly,true);

api=boot({role:'producer',canAction:true,records:[record]});
assert.equal(api.canManage(),true);
api=boot({role:'admin',canAction:true,records:[record]});
assert.equal(api.canManage(),true);
api=boot({role:'investor',canAction:false,records:[record]});
assert.equal(api.canManage(),false);

const originalGap=structuredClone(gap);
api.latestForGap('SNAP-1',gap.id);
assert.deepEqual(gap,originalGap);
assert.equal(source.includes('storage.records.push'),false);
assert.equal(source.includes('currentManifest'),false);
assert.equal(source.includes('GAP_RESOLVED'),true);
assert.match(api.integrity,/REMEDIATION_ITEM ≠ SNAPSHOT_GAP ≠ GAP_RESOLVED ≠ HISTORICAL_EVIDENCE/);

console.log('due diligence remediation contract OK · snapshot/gap immutability preserved');
