(() => {
  'use strict';

  const FORECASTS=[
    {id:'PRY-CF-01',lot:'CAF-A1',plan:'PL-CF-04',phase:'Llenado de fruto',item:'2Feed Triple 7',unit:'kg',planned:310,stock:480,horizon:'30 días',basis:'Plan Café productivo 2026 v4 · actividades programadas',owner:'Laura Mejía'},
    {id:'PRY-CF-02',lot:'CAF-A1',plan:'PL-CF-04',phase:'Llenado de fruto',item:'2Grow líquido',unit:'L',planned:190,stock:340,horizon:'30 días',basis:'Plan Café productivo 2026 v4 · fase III',owner:'Laura Mejía'},
    {id:'PRY-AG-01',lot:'AGU-A2',plan:'PL-AG-03',phase:'Cuajado',item:'Bioinsumo K',unit:'L',planned:118,stock:82,horizon:'21 días',basis:'Plan Aguacate Hass 2026 v3 · escenario DEMO',owner:'Camila Torres'},
    {id:'PRY-CA-01',lot:'CAC-B1',plan:'PL-CA-02',phase:'Floración',item:'Cal agrícola',unit:'kg',planned:140,stock:260,horizon:'45 días',basis:'Plan Cacao renovación v2 · actividades DEMO',owner:'Laura Mejía'}
  ];

  function localAdjustments(){return storage.records.filter(r=>r.type==='input-forecast-adjustment').map(r=>r.values||{})}
  function adjustmentFor(id){return localAdjustments().filter(x=>x.forecastId===id).slice(-1)[0]}
  function effective(row){const a=adjustmentFor(row.id);return {...row,planned:a?.planned?Number(a.planned):row.planned,horizon:a?.horizon||row.horizon,note:a?.detail||'',adjusted:Boolean(a)}}
  function rows(){return FORECASTS.map(effective)}
  function coverage(row){return row.planned>0?Math.round(row.stock/row.planned*100):0}
  function gap(row){return Math.max(0,row.planned-row.stock)}
  function state(row){const c=coverage(row);return c>=130?'COBERTURA':c>=100?'JUSTO':'BRECHA'}
  function tone(row){return state(row)==='BRECHA'?'danger':state(row)==='JUSTO'?'warn':'teal'}

  function forecasts(){
    const list=rows();
    const gaps=list.filter(r=>gap(r)>0);
    const demand=list.reduce((sum,r)=>sum+r.planned,0);
    const stock=list.reduce((sum,r)=>sum+r.stock,0);
    return `${head('AGROWAY · PROYECCIÓN DE INSUMOS','Anticipar necesidades sin confundir estimación con instrucción.','La especificación histórica de AGROWAY contempla proyecciones de insumos por cultivo. Esta vista conecta plan, fase, inventario y horizonte para detectar brechas; no prescribe dosis, no compra y no autoriza aplicaciones.',`<button class="btn primary" data-forecast-adjust>Ajustar escenario DEMO</button>`)}
      <section class="grid metrics">${metric('Demanda modelada',demand,'unidades mixtas solo para conteo de filas/escenarios')}${metric('Ítems modelados',list.length,'vinculados a plan y lote','good')}${metric('Brechas de stock',gaps.length,gaps.length?'requieren revisión':'sin brechas DEMO',gaps.length?'warn':'good')}${metric('Órdenes generadas','0','sin compras ni automatización','good')}</section>
      <article class="card"><div class="card-head"><div><h2>Proyección por cultivo / ciclo</h2><p>Cada fila conserva plan, fase, horizonte, responsable y base del cálculo DEMO.</p></div><span class="status">ESTIMACIÓN DEMO</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Proyección</th><th>Lote / fase</th><th>Insumo</th><th>Demanda estimada</th><th>Stock DEMO</th><th>Cobertura</th><th>Brecha</th><th>Base</th></tr></thead><tbody>${list.map(r=>`<tr><td><strong>${esc(r.id)}</strong>${r.adjusted?'<br><small>AJUSTE LOCAL/NUBE DEMO</small>':''}</td><td>${esc(r.lot)}<br><small>${esc(r.phase)} · ${esc(r.horizon)}</small></td><td><strong>${esc(r.item)}</strong><br><small>${esc(r.owner)}</small></td><td>${r.planned} ${esc(r.unit)}</td><td>${r.stock} ${esc(r.unit)}</td><td><span class="status ${tone(r)}">${coverage(r)}% · ${state(r)}</span></td><td>${gap(r)?`${gap(r)} ${esc(r.unit)}`:'—'}</td><td>${esc(r.basis)}${r.note?`<br><small>${esc(r.note)}</small>`:''}</td></tr>`).join('')}</tbody></table></div></article>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Cómo se construye</h2><p>Proyección trazable, no “número mágico”.</p></div></div><div class="card-body"><div class="flow"><div class="flow-step"><b>01</b><span>Plan</span><small>versión vigente</small></div><div class="flow-step"><b>02</b><span>Fase</span><small>momento del cultivo</small></div><div class="flow-step"><b>03</b><span>Actividades</span><small>programación DEMO</small></div><div class="flow-step"><b>04</b><span>Demanda</span><small>estimación</small></div><div class="flow-step"><b>05</b><span>Inventario</span><small>stock trazado</small></div><div class="flow-step"><b>06</b><span>Brecha</span><small>revisión humana</small></div></div><div class="section-note" style="margin-top:12px">La demanda es una estimación asociada al plan DEMO. Cualquier dosis, compra, reposición o aplicación requiere validación humana y procesos separados.</div></div></article><article class="card"><div class="card-head"><div><h2>Señales actuales</h2><p>Qué requiere atención sin ejecutar nada.</p></div></div><div class="card-body">${gaps.length?gaps.map(r=>`<div class="gate"><i class="warn">!</i><div><strong>${esc(r.item)} · ${esc(r.lot)}</strong><p>Brecha estimada ${gap(r)} ${esc(r.unit)} para horizonte ${esc(r.horizon)}.</p></div><span class="status warn">REVISAR</span></div>`).join(''):'<div class="empty">No hay brechas en el escenario DEMO.</div>'}<div class="gate"><i class="blocked">×</i><div><strong>Orden automática / dosificación</strong><p>La proyección no genera compra, orden de trabajo ni receta.</p></div><span class="status danger">BLOQUEADO</span></div></div></article></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Conexiones</h2><p>El cálculo debe poder reconstruirse.</p></div></div><div class="card-body"><div class="quick-grid" style="grid-template-columns:1fr 1fr"><button class="quick" data-view-link="plans"><strong>Planes</strong><span>Versión y fase.</span></button><button class="quick" data-view-link="inventory"><strong>Inventario</strong><span>Stock y cobertura.</span></button><button class="quick" data-view-link="field"><strong>Campo</strong><span>Actividades próximas.</span></button><button class="quick" data-view-link="economics"><strong>Economía</strong><span>Costos separados.</span></button></div></div></article><article class="card"><div class="card-head"><div><h2>Integridad</h2><p>Separación de conceptos.</p></div></div><div class="card-body"><div class="gate"><i>≈</i><div><strong>Demanda proyectada</strong><p>Escenario estimado desde el plan DEMO.</p></div><span class="status warn">ESTIMACIÓN</span></div><div class="gate"><i>✓</i><div><strong>Stock registrado</strong><p>Dato de inventario DEMO, sujeto a verificación física.</p></div><span class="status">TRAZABLE DEMO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Compra / aplicación</strong><p>No se infiere ni se ejecuta.</p></div><span class="status danger">HUMAN_ONLY</span></div></div></article></section>${footer()}`;
  }

  views.forecast=forecasts;

  function openAdjust(){
    const opts=FORECASTS.map(r=>`<option value="${r.id}">${r.id} · ${esc(r.lot)} · ${esc(r.item)}</option>`).join('');
    openModal('PROYECCIÓN DE INSUMOS · DEMO','Ajustar escenario',`<div class="fields"><label>Proyección<select name="forecastId">${opts}</select></label><label>Demanda estimada<input name="planned" type="number" min="0" step="0.1" required></label><label>Horizonte<input name="horizon" placeholder="Ej. 30 días"></label><label>Responsable<input name="owner" value="${esc(identity?.displayName||'Responsable DEMO')}"></label><label class="full">Justificación del ajuste<textarea name="detail" required placeholder="Qué cambió en el plan, fase o supuesto"></textarea></label><label class="full">Frontera<input value="ESTIMACIÓN LOCAL/NUBE DEMO · NO GENERA ORDEN, COMPRA NI DOSIS" readonly></label></div>`,true,'input-forecast-adjustment');
  }

  document.addEventListener('click',event=>{if(event.target.closest('[data-forecast-adjust]'))openAdjust()});
})();
