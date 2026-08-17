(() => {
  'use strict';

  const MINIMUMS={
    'INV-001':{qty:100,unit:'L'},'INV-002':{qty:180,unit:'kg'},'INV-003':{qty:95,unit:'L'},'INV-004':{qty:120,unit:'kg'}
  };
  const SPACES=[
    {id:'ESP-BOD-01',name:'Bodega de agroinsumos',type:'Bodega',capacity:'6.000 kg/L equivalentes DEMO',use:61,restriction:'Separación por compatibilidad / soporte DEMO'},
    {id:'ESP-T02',name:'Tanque fertirriego T-02',type:'Tanque',capacity:'2.000 L',use:76,restriction:'AGU-A2 · operación DEMO'},
    {id:'ESP-VIV-01',name:'Área de vivero',type:'Espacio productivo',capacity:'1.200 plántulas',use:57,restriction:'Propagación / aclimatación'},
    {id:'ESP-EQP-01',name:'Zona de equipos',type:'Equipos',capacity:'12 posiciones',use:67,restriction:'Mantenimiento y disponibilidad'}
  ];

  function parseQty(text=''){const m=String(text).replace(/\./g,'').match(/([\d.,]+)\s*(.*)/);return {value:m?Number(m[1].replace(',','.'))||0:0,unit:m?.[2]?.trim()||'und'}}
  function movements(){return storage.records.filter(r=>r.type==='inventory-movement').map(r=>({id:r.id,createdAt:r.createdAt,...r.values})).reverse()}
  function itemMovements(id){return movements().filter(m=>m.itemId===id)}
  function delta(m){const q=Number(m.qty)||0;if(m.movement==='ENTRADA'||m.movement==='AJUSTE +')return q;if(m.movement==='SALIDA'||m.movement==='AJUSTE -')return -q;return 0}
  function current(item){const base=parseQty(item.qty);return {...base,value:Math.max(0,base.value+itemMovements(item.id).reduce((sum,m)=>sum+delta(m),0))}}
  function forecastFor(item){return (window.__SANA_INPUT_FORECAST__?.rows?.()||[]).find(r=>r.item===item.name)||null}
  function row(item){
    const now=current(item),minimum=MINIMUMS[item.id],forecast=forecastFor(item);const gap=forecast?Math.max(0,forecast.planned-now.value):0;
    const state=minimum&&now.value<minimum.qty?'BAJO':gap>0?'BRECHA PROYECTADA':item.status;
    return {...item,base:parseQty(item.qty),current:now,minimum,forecast,gap,state};
  }
  function rows(){return DEMO.inventory.map(row)}
  function tone(state=''){return /BAJO|BRECHA/i.test(state)?'danger':/VIGILAR|Mantenimiento/i.test(state)?'warn':'teal'}
  function fmt(n){return Number(n).toLocaleString('es-CO',{maximumFractionDigits:2})}
  function activityOptions(){return (window.__SANA_PLAN_FIELD_WORKFLOW__?.activities?.()||[]).filter(a=>a.planId).map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${esc(a.lot)} · ${esc(a.title)}</option>`).join('')}

  function inventory(){
    const list=rows(),moves=movements(),low=list.filter(i=>/BAJO|BRECHA/i.test(i.state));
    return `${head('AGROWAY · INVENTARIOS Y ESPACIOS','Stock trazable, capacidad visible y brechas conectadas al plan.','El inventario combina existencia base DEMO, movimientos por identidad, mínimos operativos, espacios/tanques y demanda proyectada. Los movimientos pueden vincularse explícitamente a una actividad; cerrar una actividad nunca descuenta stock por inferencia.',`<button class="btn primary" data-inventory-movement>Registrar movimiento DEMO</button>`)}
      <section class="grid metrics">${metric('Ítems modelados',list.length,'agroinsumos · equipos · espacios','good')}${metric('Movimientos propios',moves.length,moves.length?'persisten por identidad':'aún sin movimientos',moves.length?'good':'')}${metric('Vinculados a actividad',moves.filter(m=>m.activityId).length,'referencia explícita · no automática',moves.some(m=>m.activityId)?'good':'')}${metric('Brechas / mínimos',low.length,low.length?'requieren revisión humana':'sin señal crítica',low.length?'warn':'good')}</section>
      <article class="card"><div class="card-head"><div><h2>Stock efectivo y demanda</h2><p>Base DEMO + movimientos trazados; la proyección se consume desde un único read-model.</p></div><button class="text-btn" data-view-link="forecast">Ver proyección</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Ítem</th><th>Grupo</th><th>Base</th><th>Stock efectivo</th><th>Mínimo</th><th>Demanda proyectada</th><th>Brecha</th><th>Vínculo</th><th>Estado</th></tr></thead><tbody>${list.map(i=>`<tr><td><strong>${esc(i.name)}</strong><br><small>${esc(i.id)}</small></td><td>${esc(i.group)}</td><td>${fmt(i.base.value)} ${esc(i.base.unit)}</td><td><strong>${fmt(i.current.value)} ${esc(i.current.unit)}</strong></td><td>${i.minimum?`${fmt(i.minimum.qty)} ${esc(i.minimum.unit)}`:'—'}</td><td>${i.forecast?`${fmt(i.forecast.planned)} ${esc(i.forecast.unit)} · ${esc(i.forecast.horizon)}`:'—'}</td><td>${i.gap?`${fmt(i.gap)} ${esc(i.forecast?.unit||i.current.unit)}`:'—'}</td><td>${esc(i.linked)}</td><td><span class="status ${tone(i.state)}">${esc(i.state)}</span></td></tr>`).join('')}</tbody></table></div></article>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Espacios, tanques y capacidades</h2><p>Capacidad operativa visible sin control automático de equipos.</p></div></div><div class="card-body">${SPACES.map(s=>`<div class="gate"><i>${Math.round(s.use/10)}</i><div><strong>${esc(s.name)} · ${esc(s.capacity)}</strong><p>${esc(s.type)} · ${esc(s.restriction)}</p>${progress(s.use,s.use>85?'warn':'teal')}</div><span class="status ${s.use>85?'warn':'teal'}">${s.use}% USO</span></div>`).join('')}</div></article><article class="card"><div class="card-head"><div><h2>Frontera de decisión</h2><p>Inventario ≠ compras ni dosificación.</p></div></div><div class="card-body"><div class="gate"><i class="warn">!</i><div><strong>Brecha o mínimo</strong><p>Genera señal para revisión física y planificación.</p></div><span class="status warn">REVISAR</span></div><div class="gate"><i class="blocked">×</i><div><strong>Cierre de actividad → stock</strong><p>Nunca se descuenta o repone inventario por inferencia; exige movimiento explícito.</p></div><span class="status danger">NO AUTOMÁTICO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Orden de compra / pago / dosis</strong><p>No existe desde esta vista.</p></div><span class="status danger">HUMAN_ONLY</span></div></div></article></section>
      <article class="card" style="margin-top:14px"><div class="card-head"><div><h2>Bitácora de movimientos</h2><p>Entrada, salida o ajuste con responsable, destino, actividad vinculada y evidencia.</p></div><span class="status">LOCAL/NUBE DEMO</span></div><div class="card-body">${moves.length?moves.map(m=>`<div class="row"><span class="dot ${m.movement==='SALIDA'?'warn':''}"></span><div class="copy"><strong>${esc(m.movement)} · ${esc(DEMO.inventory.find(i=>i.id===m.itemId)?.name||m.itemId)}</strong><span>${esc(m.lot||'Almacén')} · ${m.activityId?`actividad ${esc(m.activityId)} · `:''}${esc(m.detail||'Sin nota')} · evidencia ${esc(m.evidence||'—')}</span></div><div class="meta">${esc(m.qty||'0')}<br>${esc(m.owner||'Sin responsable')}</div></div>`).join(''):'<div class="empty">Aún no hay movimientos creados por esta identidad.</div>'}</div></article>${footer()}`;
  }
  views.inventory=inventory;
  window.__SANA_INVENTORY__=Object.freeze({rows:()=>rows().map(i=>({...i,current:{...i.current}})),movements:()=>movements().map(m=>({...m})),forActivity:id=>movements().filter(m=>m.activityId===id).map(m=>({...m})),spaces:()=>SPACES.map(s=>({...s}))});

  function openMovement(){
    const items=DEMO.inventory.filter(i=>!i.group.includes('Espacio')).map(i=>`<option value="${i.id}">${esc(i.id)} · ${esc(i.name)}</option>`).join('');
    const lots=`<option value="Almacén">Almacén / bodega</option>${DEMO.lots.map(l=>`<option value="${l.id}">${l.id} · ${esc(l.crop)}</option>`).join('')}`;
    const activities=activityOptions();
    openModal('INVENTARIO · MOVIMIENTO TRAZABLE','Registrar movimiento DEMO',`<div class="fields"><label>Ítem<select name="itemId">${items}</select></label><label>Movimiento<select name="movement"><option>ENTRADA</option><option>SALIDA</option><option>AJUSTE +</option><option>AJUSTE -</option></select></label><label>Cantidad<input name="qty" type="number" min="0.01" step="0.01" required></label><label>Destino / lote<select name="lot">${lots}</select></label><label class="full">Actividad vinculada<select name="activityId"><option value="">Sin vínculo a actividad</option>${activities}</select></label><label>Responsable<input name="owner" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Evidencia<select name="evidence"><option>Conteo físico DEMO</option><option>Registro de actividad</option><option>Soporte documental DEMO</option><option>Pendiente soporte</option></select></label><label class="full">Nota / motivo<textarea name="detail" required placeholder="Origen del movimiento, actividad asociada o razón del ajuste"></textarea></label><label class="full">Integridad<input value="LOCAL/NUBE DEMO · VÍNCULO EXPLÍCITO · NO GENERA COMPRA, PAGO, DESPACHO NI DOSIS" readonly></label></div>`,true,'inventory-movement');
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-inventory-movement]'))openMovement()});
})();
