(() => {
  'use strict';

  const BASE=[
    {id:'RES-CF-01',lot:'CAF-A1',stream:'Pulpa y mucílago de café',qty:320,unit:'kg/mes',destination:'Compostaje / transformación biológica',stage:'EN TRANSFORMACIÓN',evidence:'Registro DEMO',owner:'José Pérez'},
    {id:'RES-AG-01',lot:'AGU-A2',stream:'Poda y material vegetal',qty:180,unit:'kg/mes',destination:'Cobertura / reincorporación al suelo',stage:'REINCORPORADO',evidence:'Foto + actividad DEMO',owner:'Marta Restrepo'},
    {id:'RES-CA-01',lot:'CAC-B1',stream:'Cáscara y material de cosecha',qty:115,unit:'kg/mes',destination:'Compostaje',stage:'CLASIFICADO',evidence:'Pendiente soporte',owner:'Laura Mejía'},
    {id:'RES-VI-01',lot:'VIV-01',stream:'Material vegetal no conforme',qty:45,unit:'kg/mes',destination:'Transformación biológica',stage:'GENERADO',evidence:'Registro DEMO',owner:'Andrés Gómez'}
  ];

  const stages=['GENERADO','CLASIFICADO','EN TRANSFORMACIÓN','REINCORPORADO','DISPOSICIÓN EXTERNA'];
  const destinations=['Compostaje','Transformación biológica','Biodigestión','Cobertura / reincorporación al suelo','Disposición externa autorizada'];

  function userRows(){
    return storage.records.filter(r=>r.type==='circularity-residue').map(r=>({
      id:r.id,lot:r.values?.lot||r.lot||'FIN-LE-001',stream:r.values?.stream||r.title||'Residuo agrícola',qty:Number(r.values?.qty)||0,unit:'kg',destination:r.values?.destination||'Por definir',stage:r.values?.stage||'GENERADO',evidence:r.values?.evidence||'LOCAL_ONLY',owner:r.values?.owner||identity?.displayName||'Usuario DEMO',local:true
    }));
  }

  function rows(){return [...userRows(),...BASE]}
  function totalQty(list){return Math.round(list.reduce((sum,row)=>sum+(Number(row.qty)||0),0))}
  function reintegrated(list){const eligible=list.filter(r=>/REINCORPORADO|TRANSFORMACIÓN/i.test(r.stage));return list.length?Math.round(eligible.length/list.length*100):0}
  function stageTone(stage){return /REINCORPORADO/i.test(stage)?'teal':/EXTERNA/i.test(stage)?'warn':/GENERADO|CLASIFICADO|TRANSFORMACIÓN/i.test(stage)?'warn':''}

  function circularity(){
    const list=rows(); const local=userRows(); const total=totalQty(list); const reintegration=reintegrated(list);
    return `${head('AGROWAY · CIRCULARIDAD Y RESIDUOS','Cerrar el ciclo también exige trazabilidad.','La especificación histórica de AGROWAY contempla gestión del ciclo de vida, disposición final y trazabilidad de residuos. SANA lo conecta con lote, actividad, evidencia, economía e impacto sin convertir una estimación en certificación.',`<button class="btn primary" data-circularity-residue>Registrar residuo DEMO</button>`)}
      <section class="grid metrics">${metric('Flujo caracterizado',`${total} kg/mes`,'suma DEMO · base + registros del usuario','good')}${metric('Reintegración / transformación',`${reintegration}%`,'por estado del flujo DEMO','good')}${metric('Registros del usuario',local.length,local.length?'persisten por identidad':'aún sin captura propia',local.length?'good':'warn')}${metric('Destino sin cerrar',list.filter(r=>/GENERADO|CLASIFICADO/i.test(r.stage)).length,'requieren siguiente acción','warn')}</section>
      <article class="card"><div class="card-head"><div><h2>Trazabilidad de residuos agrícolas</h2><p>Origen → clasificación → transformación → reincorporación o disposición.</p></div><span class="status">AGROWAY SOURCE-DRIVEN</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Flujo</th><th>Lote</th><th>Cantidad</th><th>Destino</th><th>Estado</th><th>Evidencia</th><th>Responsable</th></tr></thead><tbody>${list.map(r=>`<tr><td><strong>${esc(r.stream)}</strong>${r.local?'<br><small>LOCAL_ONLY / Nube DEMO según sync</small>':''}</td><td>${esc(r.lot)}</td><td>${r.qty} ${esc(r.unit)}</td><td>${esc(r.destination)}</td><td><span class="status ${stageTone(r.stage)}">${esc(r.stage)}</span></td><td>${esc(r.evidence)}</td><td>${esc(r.owner)}</td></tr>`).join('')}</tbody></table></div></article>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Cadena de circularidad</h2><p>Modelo operativo reconstruido desde los documentos AGROWAY.</p></div></div><div class="card-body"><div class="workflow"><div class="stage done"><span class="num">1</span><strong>Generar</strong><span>Origen y lote</span></div><div class="stage current"><span class="num">2</span><strong>Caracterizar</strong><span>Tipo + cantidad</span></div><div class="stage"><span class="num">3</span><strong>Transformar</strong><span>Proceso biológico</span></div><div class="stage"><span class="num">4</span><strong>Controlar</strong><span>Evidencia / calidad</span></div><div class="stage"><span class="num">5</span><strong>Reincorporar</strong><span>Uso o disposición</span></div></div><div class="section-note" style="margin-top:12px">La documentación histórica contempla transformación biológica, compostaje/biodigestión y formulación de insumos. Esta DEMO representa el flujo de información; no certifica composición, calidad de fertilizante ni tratamiento real.</div></div></article>
      <article class="card"><div class="card-head"><div><h2>Conexión con SANA</h2><p>La circularidad no vive en un silo.</p></div></div><div class="card-body"><div class="quick-grid" style="grid-template-columns:1fr 1fr"><button class="quick" data-view-link="inventory"><strong>Inventarios</strong><span>Entradas, salidas y espacios.</span></button><button class="quick" data-view-link="passport"><strong>Passport</strong><span>Procedencia y evidencia.</span></button><button class="quick" data-view-link="economics"><strong>Economía</strong><span>Costos sin inferir ahorros.</span></button><button class="quick" data-view-link="impact"><strong>Impacto</strong><span>Indicadores con metodología.</span></button></div><div class="section-note" style="margin-top:12px"><strong>Fuente histórica:</strong> AGROWAY definía gestión de disposición final y un modelo de trazabilidad/acompañamiento para agricultura circular. SANA conserva esa intención, ampliándola con procedencia del dato y límites de verificación.</div></div></article></section>${footer()}`;
  }

  views.circularity=circularity;
  window.__SANA_CIRCULARITY__=Object.freeze({
    rows:()=>rows().map(row=>({...row})),
    forLot:lotId=>rows().filter(row=>row.lot===lotId).map(row=>({...row}))
  });

  function openForm(){
    const lots=DEMO.lots.map(l=>`<option value="${l.id}">${l.id} · ${esc(l.crop)}</option>`).join('');
    const body=`<div class="fields"><label>Lote / origen<select name="lot">${lots}</select></label><label>Flujo residual<input name="stream" required placeholder="Ej. pulpa, poda, cáscara"></label><label>Cantidad (kg)<input name="qty" type="number" min="0" step="0.1" required></label><label>Destino<select name="destination">${destinations.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>Estado<select name="stage">${stages.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>Evidencia<select name="evidence"><option>Registro estructurado</option><option>Foto DEMO</option><option>Pesaje / medición DEMO</option><option>Pendiente soporte</option></select></label><label>Responsable<input name="owner" value="${esc(identity?.displayName||'Usuario DEMO')}"></label><label class="full">Observación / procedimiento<textarea name="detail" placeholder="Qué se generó, cómo se clasificó y cuál es la siguiente acción..."></textarea></label><label class="full">Integridad<input value="LOCAL_ONLY · NO CERTIFICA TRATAMIENTO NI COMPOSICIÓN" readonly></label></div>`;
    openModal('CIRCULARIDAD · AGROWAY/SANA','Registrar flujo residual',body,true,'circularity-residue');
  }

  document.addEventListener('click',event=>{if(event.target.closest('[data-circularity-residue]'))openForm()});
})();
