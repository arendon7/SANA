import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('apps/control-web/public/sana-v3-material-chain.js','utf8');
const records=[
  {id:'EV-ADV-1',type:'material-lifecycle-event',values:{chainSchema:'SANA_MATERIAL_CHAIN_V1',materialId:'MAT-1',stageCode:'VIVERO',date:'2026-08-10',unit:'plántulas',inputQty:'100',viableQty:'90',lossQty:'10',from:'Propagación',to:'VIV-01',destinationLot:'LOT-1',responsible:'Técnico',evidence:'Conteo',evidenceRef:'E-1',provenance:'MEDIDO / CONTADO DEMO'}},
  {id:'COST-1',type:'economics-cost',values:{materialId:'MAT-1',materialEventId:'EV-ADV-1',amount:'250000',concept:'Sustrato',evidence:'Factura DEMO'}},
  {id:'MOVE-1',type:'inventory-movement',values:{materialId:'MAT-1',materialEventId:'EV-ADV-1',itemId:'INV-1',movement:'SALIDA',qty:'5',lot:'VIV-01',evidence:'Conteo físico DEMO'}}
];

globalThis.window={
  __SANA_MATERIAL_LIFECYCLE__:{
    forMaterial:id=>id==='MAT-1'?[
      {id:'LEG-1',materialId:'MAT-1',stage:'ORIGEN',date:'2026-08-01',qty:100,unit:'semillas',from:'Lote madre',to:'VIV-01',responsible:'Técnico',evidence:'Documento',provenance:'DOCUMENTAL DEMO'},
      {id:'EV-ADV-1',materialId:'MAT-1',stage:'VIVERO',date:'2026-08-10',qty:0,unit:'plántulas',from:'Propagación',to:'VIV-01',responsible:'Técnico',evidence:'Conteo',provenance:'MEDIDO / CONTADO DEMO',local:true}
    ]:[],
    targetLot:()=> 'LOT-1'
  }
};
globalThis.storage={records};
globalThis.DEMO={material:[{id:'MAT-1',type:'Semilla',species:'Café',origin:'Lote madre'}],lots:[{id:'LOT-1',crop:'Café'}]};
globalThis.views={material:()=>'<footer class="footer"></footer>',passport:()=>'<footer class="footer"></footer>'};
globalThis.localStorage={getItem:()=> 'LOT-1'};
globalThis.document={addEventListener:()=>{},getElementById:()=>null,createElement:()=>({})};
globalThis.identity={displayName:'QA'};
globalThis.esc=v=>String(v??'');
globalThis.metric=()=>'';
globalThis.openModal=()=>{};

vm.runInThisContext(source,{filename:'sana-v3-material-chain.js'});
const api=window.__SANA_MATERIAL_CHAIN__;
assert.ok(api,'material chain API must exist');
assert.equal(api.schema,'SANA_MATERIAL_CHAIN_V1');

const chain=api.forMaterial('MAT-1');
assert.equal(chain.events.length,2);
const legacy=chain.events.find(e=>e.id==='LEG-1');
const advanced=chain.events.find(e=>e.id==='EV-ADV-1');
assert.equal(legacy.quantitativeState,'LEGACY_SINGLE_QUANTITY');
assert.equal(legacy.survivalRate,null,'legacy quantity must not infer survival');
assert.equal(advanced.quantitativeState,'EXPLICIT_COUNTS');
assert.equal(advanced.survivalRate,90);
assert.equal(advanced.lossQty,10);
assert.equal(advanced.conservationMismatch,false);
assert.equal(chain.quantities.declaredLoss,10);
assert.equal(chain.quantities.latestSurvivalRate,90);
assert.equal(chain.relations.costCount,1);
assert.equal(chain.relations.costAmount,250000);
assert.equal(chain.relations.inventoryCount,1);
assert.equal(chain.costs[0].accountingStatus,'NO_CONTABILIDAD_OFICIAL');
assert.equal(chain.inventory[0].movement,'SALIDA');
assert.equal(api.forLot('LOT-1').length,1);
assert.match(api.integrity,/LEGACY_QUANTITY ≠ LOSS ≠ SURVIVAL/);
assert.match(api.integrity,/MATERIAL_EVENT ≠ INVENTORY_MOVEMENT ≠ COST_ENTRY/);
assert.equal(source.includes('storage.records.push'),false,'chain must not create raw records by itself');
assert.equal(source.includes('fetch('),false,'chain must not perform external I/O');
assert.equal(source.includes('certified=true'),false);

console.log('material chain contract OK · legacy quantities not interpreted as losses · explicit relations preserved');
