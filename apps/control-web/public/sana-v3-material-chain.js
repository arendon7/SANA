(() => {
  'use strict';

  const STAGES=[
    ['ORIGEN','Origen'],
    ['PROPAGACION','Propagación'],
    ['VIVERO','Vivero / aclimatación'],
    ['CLASIFICACION','Clasificación'],
    ['TRASLADO','Traslado'],
    ['TRASPLANTE','Trasplante'],
    ['VINCULO_PRODUCTIVO','Vínculo productivo'],
    ['DISPOSICION_FINAL','Disposición final']
  ];
  const ACTIVE_CHAIN=STAGES.slice(0,7).map(([id])=>id);
  const STAGE_LABEL=Object.fromEntries(STAGES);

  function lifecycle(){return window.__SANA_MATERIAL_LIFECYCLE__}
  function rawLocal(){return storage.records.filter(r=>r.type==='material-lifecycle-event')}
  function rawMap(){return new Map(rawLocal().map(r=>[r.id,r]))}
  function stageCode(value=''){
    const s=String(value).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(s==='ORIGEN')return 'ORIGEN';
    if(s.includes('PROPAG'))return 'PROPAGACION';
    if(s.includes('VIVERO')||s.includes('ACLIMAT'))return 'VIVERO';
    if(s.includes('CLASIFIC'))return 'CLASIFICACION';
    if(s.includes('TRASPLANTE / MOVIMIENTO'))return 'TRASLADO_TRANSPLANTE_LEGACY';
    if(s.includes('TRASLADO'))return 'TRASLADO';
    if(s.includes('TRASPLANTE'))return 'TRASPLANTE';
    if(s.includes('VINCULO PRODUCTIVO'))return 'VINCULO_PRODUCTIVO';
    if(s.includes('DISPOSICION'))return 'DISPOSICION_FINAL';
    return String(value||'SIN_CLASIFICAR');
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function localRecordFor(id,map=rawMap()){return map.get(id)||null}
  function normalizeEvent(event,map=rawMap()){
    const raw=localRecordFor(event.id,map);
    const v=raw?.values||{};
    const explicit=Boolean(v.chainSchema==='SANA_MATERIAL_CHAIN_V1');
    const inputQty=explicit?num(v.inputQty):null;
    const viableQty=explicit?num(v.viableQty):null;
    const lossQty=explicit?num(v.lossQty):null;
    const survivalRate=explicit&&inputQty>0&&viableQty!==null?Math.round(viableQty/inputQty*1000)/10:null;
    const conservationMismatch=explicit&&inputQty!==null&&viableQty!==null&&lossQty!==null&&viableQty+lossQty>inputQty;
    return {
      id:event.id,materialId:event.materialId,stage:event.stage,stageCode:v.stageCode||stageCode(event.stage),date:event.date,
      qty:Number(event.qty)||0,unit:event.unit||v.unit||'unidades',from:event.from,to:event.to,responsible:event.responsible,
      evidence:event.evidence,provenance:event.provenance,detail:event.detail||v.detail||'',local:Boolean(event.local),
      explicitQuantities:explicit,inputQty,viableQty,lossQty,survivalRate,conservationMismatch,
      lossReason:v.lossReason||'',countMethod:v.countMethod||'',sourceRef:v.sourceRef||'',identityBasis:v.identityBasis||'',
      destinationLot:v.destinationLot||'',evidenceRef:v.evidenceRef||'',evidenceStatus:v.evidenceStatus||'',
      quantitativeState:explicit?'EXPLICIT_COUNTS':'LEGACY_SINGLE_QUANTITY',
      integrity:conservationMismatch?'COUNT_MISMATCH':explicit?'EXPLICIT_DEMO':'LEGACY_NO_LOSS_INFERENCE'
    };
  }
  function eventsFor(materialId){
    const map=rawMap();
    return (lifecycle()?.forMaterial?.(materialId)||[]).map(e=>normalizeEvent(e,map)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.id).localeCompare(String(b.id)));
  }
  function materialTarget(materialId){return lifecycle()?.targetLot?.(materialId)||'Por asignar'}
  function relatedCosts(materialId,eventIds){
    const ids=new Set(eventIds);
    return storage.records.filter(r=>r.type==='economics-cost'&&(r.values?.materialId===materialId||ids.has(r.values?.materialEventId))).map(r=>({
      id:r.id,materialId:r.values?.materialId||materialId,materialEventId:r.values?.materialEventId||'',amount:Number(r.values?.amount)||0,
      concept:r.values?.concept||r.title||'Costo operativo',evidence:r.values?.evidence||'Sin soporte',date:r.values?.date||String(r.createdAt||'').slice(0,10),
      provenance:'LOCAL_ONLY',accountingStatus:'NO_CONTABILIDAD_OFICIAL'
    }));
  }
  function relatedInventory(materialId,eventIds){
    const ids=new Set(eventIds);
    return storage.records.filter(r=>r.type==='inventory-movement'&&(r.values?.materialId===materialId||ids.has(r.values?.materialEventId))).map(r=>({
      id:r.id,materialId:r.values?.materialId||materialId,materialEventId:r.values?.materialEventId||'',itemId:r.values?.itemId||'',movement:r.values?.movement||'',
      qty:Number(r.values?.qty)||0,lot:r.values?.lot||'',evidence:r.values?.evidence||'',date:String(r.createdAt||'').slice(0,10),provenance:'LOCAL_ONLY'
    }));
  }
  function chainFor(materialId){
    const material=DEMO.material.find(m=>m.id===materialId)||null;
    const events=eventsFor(materialId);
    const ids=events.map(e=>e.id);
    const explicit=events.filter(e=>e.explicitQuantities);
    const explicitLosses=explicit.filter(e=>Number(e.lossQty)>0);
    const latestExplicit=[...explicit].reverse().find(e=>e.survivalRate!==null)||null;
    const covered=new Set(events.map(e=>e.stageCode).filter(s=>ACTIVE_CHAIN.includes(s)));
    const costs=relatedCosts(materialId,ids);
    const inventory=relatedInventory(materialId,ids);
    const evidenceCount=events.filter(e=>e.evidence||e.evidenceRef).length;
    const target=materialTarget(materialId);
    return {
      material,target,events,costs,inventory,
      identity:{id:materialId,type:material?.type||'',species:material?.species||'',origin:material?.origin||'',targetLot:target},
      stageCoverage:{covered:covered.size,total:ACTIVE_CHAIN.length,percent:Math.round(covered.size/ACTIVE_CHAIN.length*100)},
      quantities:{explicitEvents:explicit.length,legacyEvents:events.length-explicit.length,declaredLoss:explicitLosses.reduce((s,e)=>s+(Number(e.lossQty)||0),0),latestSurvivalRate:latestExplicit?.survivalRate??null,latestSurvivalEvent:latestExplicit?.id||null,mismatches:explicit.filter(e=>e.conservationMismatch).length},
      evidence:{eventsWithEvidence:evidenceCount,totalEvents:events.length,coverage:events.length?Math.round(evidenceCount/events.length*100):0},
      relations:{costCount:costs.length,costAmount:costs.reduce((s,c)=>s+c.amount,0),inventoryCount:inventory.length},
      integrity:'MATERIAL_CHAIN_DEMO · LEGACY_QUANTITY ≠ LOSS ≠ SURVIVAL · EXPLICIT_LINK ≠ AUTO_MUTATION'
    };
  }
  function forLot(lotId){
    return DEMO.material.map(m=>chainFor(m.id)).filter(c=>c.target===lotId||c.events.some(e=>e.destinationLot===lotId||e.to===lotId));
  }
  function all(){return DEMO.material.map(m=>chainFor(m.id))}
  function money(v){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v)||0)}catch{return `${Number(v)||0} COP`}}
  function tone(v){return v?'warn':'teal'}
  function stageLabel(code){return STAGE_LABEL[code]||code.replaceAll('_',' ')}

  function chainPanel(){
    const chains=all();
    const explicit=chains.reduce((s,c)=>s+c.quantities.explicitEvents,0);
    const losses=chains.reduce((s,c)=>s+c.quantities.declaredLoss,0);
    const linkedCosts=chains.reduce((s,c)=>s+c.relations.costCount,0);
    const linkedMoves=chains.reduce((s,c)=>s+c.relations.inventoryCount,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">MATERIAL VEGETAL · CADENA V1</p><h2>Identidad, cantidades explícitas y relaciones reconstruibles</h2><p>Los eventos históricos de una sola cantidad permanecen como LEGACY_SINGLE_QUANTITY. Solo una captura que declare entrada, viables y pérdidas permite mostrar supervivencia.</p></div><button class="btn primary" data-material-chain-event>Registrar evento de cadena</button></div><div class="card-body"><div class="grid metrics">${metric('Eventos con conteo explícito',explicit,'entrada + viables + pérdidas')}${metric('Pérdidas declaradas',losses,'solo conteos explícitos; no inferidas')}${metric('Costos relacionados',linkedCosts,'referencia explícita · no contabilidad')}${metric('Movimientos relacionados',linkedMoves,'referencia explícita · no descuento automático')}</div><div class="section-note" style="margin-top:12px"><strong>Frontera:</strong> LEGACY_QUANTITY ≠ LOSS ≠ SURVIVAL. MATERIAL EVENT ≠ INVENTORY MOVEMENT ≠ COST ENTRY. La cadena reconstruye referencias; nunca crea movimientos, costos, certificación genética o estatus fitosanitario por inferencia.</div></div></section>
      <section class="material-lifecycle-grid" style="margin-top:14px">${chains.map(c=>chainCard(c)).join('')}</section>`;
  }
  function chainCard(c){
    const q=c.quantities;
    return `<article class="card"><div class="card-head"><div><small>${esc(c.identity.id)}</small><h2>${esc(c.identity.species||'Material vegetal')}</h2><p>${esc(c.identity.origin||'Origen no declarado')} → ${esc(c.target)}</p></div><span class="status ${q.mismatches?'danger':c.stageCoverage.percent<60?'warn':'teal'}">${c.stageCoverage.percent}% ETAPAS</span></div><div class="card-body"><div class="grid metrics">${metric('Supervivencia explícita',q.latestSurvivalRate===null?'—':`${q.latestSurvivalRate}%`,q.latestSurvivalRate===null?'no inferida desde históricos':`evento ${q.latestSurvivalEvent}`,q.latestSurvivalRate===null?'warn':'good')}${metric('Pérdidas declaradas',q.declaredLoss,'solo eventos V1')}${metric('Evidencia',`${c.evidence.coverage}%`,`${c.evidence.eventsWithEvidence}/${c.evidence.totalEvents} eventos`)}${metric('Relaciones',c.relations.costCount+c.relations.inventoryCount,`${money(c.relations.costAmount)} costo relacionado · ${c.relations.inventoryCount} movimiento(s)`)}</div><div class="workflow material-workflow" style="margin-top:12px">${STAGES.map(([code,label],i)=>{const ev=c.events.filter(e=>e.stageCode===code);return `<div class="stage ${ev.length?'done':''}"><span class="num">${i+1}</span><strong>${esc(label)}</strong><span>${ev.length?`${ev.length} evento(s)`:'sin captura explícita'}</span></div>`}).join('')}</div><div class="timeline" style="margin-top:14px">${c.events.map(e=>eventRow(e,c)).join('')||'<div class="empty">Sin eventos.</div>'}</div></div></article>`;
  }
  function eventRow(e,c){
    const linkedCost=c.costs.filter(x=>x.materialEventId===e.id).length;
    const linkedMoves=c.inventory.filter(x=>x.materialEventId===e.id).length;
    const counts=e.explicitQuantities?`entrada ${e.inputQty??'—'} · viables ${e.viableQty??'—'} · pérdidas ${e.lossQty??'—'}${e.survivalRate===null?'':` · supervivencia ${e.survivalRate}%`}`:`cantidad legacy ${e.qty} ${e.unit} · sin inferencia de pérdida/supervivencia`;
    return `<div class="timeline-item"><i></i><div><strong>${esc(stageLabel(e.stageCode))} · ${esc(e.id)}</strong><p>${esc(e.from||'—')} → ${esc(e.to||'—')} · ${esc(e.responsible||'—')}<br>${esc(counts)}</p><div class="chip-row"><span class="chip">${esc(e.quantitativeState)}</span><span class="chip">${esc(e.provenance||'—')}</span><span class="chip">evidencia ${esc(e.evidenceRef||e.evidence||'—')}</span>${e.conservationMismatch?'<span class="chip">COUNT_MISMATCH</span>':''}${linkedCost?`<span class="chip">${linkedCost} costo(s)</span>`:''}${linkedMoves?`<span class="chip">${linkedMoves} mov.</span>`:''}</div></div><time>${esc(e.date||'—')}</time></div>`;
  }
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}
  const baseMaterial=views.material;
  if(baseMaterial)views.material=function materialWithChain(){return insertBeforeFooter(baseMaterial(),chainPanel())};

  function passportPanel(){
    let lot='CAF-A1';try{lot=localStorage.getItem('sana.v3.passport.lot')||lot}catch{}
    const chains=forLot(lot);
    if(!chains.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">MATERIAL VEGETAL · PASSPORT</p><h2>Sin cadena vinculada al lote</h2><p>No se inventa una procedencia vegetal cuando no existe vínculo explícito.</p></div><span class="status warn">SIN VÍNCULO</span></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">MATERIAL VEGETAL · PASSPORT</p><h2>Origen vegetal reconstruible del lote ${esc(lot)}</h2><p>Material → eventos → evidencia → lote productivo. Los costos y movimientos relacionados permanecen eventos separados.</p></div><span class="status">${chains.length} CADENA(S)</span></div><div class="card-body">${chains.map(c=>`<div class="gate"><i>${c.stageCoverage.covered}</i><div><strong>${esc(c.identity.id)} · ${esc(c.identity.species)}</strong><p>${esc(c.identity.origin)} → ${esc(c.target)} · ${c.events.length} evento(s) · supervivencia explícita ${c.quantities.latestSurvivalRate===null?'no capturada':`${c.quantities.latestSurvivalRate}%`} · evidencia ${c.evidence.coverage}%</p></div><span class="status ${c.quantities.mismatches?'danger':'teal'}">${c.quantities.mismatches?'REVISAR':'TRAZABLE DEMO'}</span></div>`).join('')}<div class="section-note" style="margin-top:12px">La presencia de una cadena no certifica variedad, genética, sanidad, ICA ni origen externo. PASSPORT MATERIAL ≠ EXTERNAL CERTIFICATION.</div></div></section>`;
  }
  const basePassport=views.passport;
  if(basePassport)views.passport=function passportWithMaterial(){return insertBeforeFooter(basePassport(),passportPanel())};

  function materialOptions(){return DEMO.material.map(m=>`<option value="${esc(m.id)}">${esc(m.id)} · ${esc(m.species)}</option>`).join('')}
  function eventOptions(){return all().flatMap(c=>c.events.map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(c.identity.id)} · ${esc(stageLabel(e.stageCode))}</option>`)).join('')}
  function openChainEvent(){
    const stageOptions=STAGES.map(([id,label])=>`<option value="${id}">${esc(label)}</option>`).join('');
    const lotOptions=['VIV-01',...DEMO.lots.filter(l=>l.id!=='VIV-01').map(l=>l.id),'Disposición / circularidad'].map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    openModal('MATERIAL VEGETAL · CADENA V1','Registrar evento cuantitativo DEMO',`<input type="hidden" name="chainSchema" value="SANA_MATERIAL_CHAIN_V1"><div class="fields"><label>Material<select name="materialId">${materialOptions()}</select></label><label>Etapa<select name="stageCode">${stageOptions}</select></label><label>Fecha<input name="date" type="date" required></label><label>Unidad<select name="unit"><option>unidades</option><option>semillas</option><option>plántulas</option><option>injertos</option><option>esquejes</option></select></label><label>Entrada / población evaluada<input name="inputQty" type="number" min="0" step="1" required></label><label>Viables / supervivientes<input name="viableQty" type="number" min="0" step="1" required></label><label>Pérdidas declaradas<input name="lossQty" type="number" min="0" step="1" value="0" required></label><label>Método de conteo<select name="countMethod"><option>Conteo físico DEMO</option><option>Muestreo DEMO</option><option>Registro documental DEMO</option><option>Estimación DEMO</option></select></label><label>Desde<input name="from" required placeholder="Lote madre, vivero, bandeja, ubicación"></label><label>Hacia<select name="to">${lotOptions}</select></label><label>Destino productivo<select name="destinationLot"><option value="">Sin destino productivo todavía</option>${DEMO.lots.filter(l=>l.id!=='VIV-01').map(l=>`<option value="${l.id}">${l.id} · ${esc(l.crop)}</option>`).join('')}</select></label><label>Responsable<input name="responsible" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Base de identidad<select name="identityBasis"><option>DECLARADO_DEMO</option><option>DOCUMENTO_DEMO</option><option>OBSERVADO_DEMO</option><option>EXTERNO_PENDIENTE</option></select></label><label>Referencia de origen<input name="sourceRef" placeholder="Lote madre / proveedor / documento"></label><label>Evidencia<input name="evidence" required placeholder="Conteo, foto, acta, registro"></label><label>Referencia evidencia<input name="evidenceRef" placeholder="ID / archivo / folio DEMO"></label><label>Estado evidencia<select name="evidenceStatus"><option>LOCAL_ONLY</option><option>DOCUMENTAL_DEMO</option><option>PENDIENTE_VERIFICACION</option></select></label><label>Procedencia<select name="provenance"><option>MEDIDO / CONTADO DEMO</option><option>OBSERVADO DEMO</option><option>DOCUMENTAL DEMO</option><option>DECLARADO DEMO</option><option>ESTIMADO DEMO</option></select></label><label class="full">Motivo de pérdidas / descarte<textarea name="lossReason" placeholder="Solo si existe pérdida declarada; no inferir mortalidad"></textarea></label><label class="full">Detalle<textarea name="detail" placeholder="Qué ocurrió en la transición y por qué"></textarea></label><label class="full">Integridad<input value="LOCAL/NUBE DEMO · CONTEO EXPLÍCITO · NO CERTIFICA GENÉTICA, SANIDAD NI ICA" readonly></label></div>`,true,'material-lifecycle-event');
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-material-chain-event]'))openChainEvent()});

  function appendRelationFields(kind){
    const form=document.getElementById('modal-form');const body=document.getElementById('modal-body');if(!form||!body)return;
    if(form.querySelector('[name="materialId"]'))return;
    const block=document.createElement('div');block.className='fields';block.style.marginTop='12px';
    block.innerHTML=`<label>Material vegetal relacionado<select name="materialId"><option value="">Sin vínculo a material</option>${materialOptions()}</select></label><label>Evento de material relacionado<select name="materialEventId"><option value="">Sin vínculo a evento</option>${eventOptions()}</select></label><label class="full">Regla de relación<input value="${kind==='cost'?'COST':'INVENTORY'} LINK EXPLÍCITO · NO SE CREA NI MODIFICA MATERIAL AUTOMÁTICAMENTE" readonly></label>`;
    body.appendChild(block);
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-econ-cost]'))setTimeout(()=>appendRelationFields('cost'),0);
    if(event.target.closest('[data-inventory-movement]'))setTimeout(()=>appendRelationFields('inventory'),0);
  });

  window.__SANA_MATERIAL_CHAIN__=Object.freeze({schema:'SANA_MATERIAL_CHAIN_V1',all:()=>all().map(c=>({...c})),forMaterial:materialId=>chainFor(materialId),forLot:lotId=>forLot(lotId),eventsFor,stageCode,integrity:'MATERIAL_CHAIN_DEMO · LEGACY_QUANTITY ≠ LOSS ≠ SURVIVAL · MATERIAL_EVENT ≠ INVENTORY_MOVEMENT ≠ COST_ENTRY'});
})();
