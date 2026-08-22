(() => {
  'use strict';

  const BASE_EVENTS=[
    {id:'MV-CF-001',materialId:'MAT-CAF-2401',stage:'ORIGEN',date:'2026-06-04',qty:920,unit:'semillas',from:'Lote madre certificado DEMO',to:'VIV-01',responsible:'Andrés Gómez',evidence:'Registro de ingreso DEMO',provenance:'DECLARADO / DOCUMENTAL DEMO'},
    {id:'MV-CF-002',materialId:'MAT-CAF-2401',stage:'PROPAGACIÓN',date:'2026-06-12',qty:920,unit:'semillas',from:'Ingreso',to:'Germinación · VIV-01',responsible:'Andrés Gómez',evidence:'Bitácora DEMO',provenance:'REGISTRO DEMO'},
    {id:'MV-AG-001',materialId:'MAT-AGU-1702',stage:'ORIGEN',date:'2026-05-21',qty:460,unit:'injertos',from:'Vivero regional DEMO',to:'VIV-01',responsible:'Camila Torres',evidence:'Documento DEMO',provenance:'DOCUMENTAL DEMO'},
    {id:'MV-AG-002',materialId:'MAT-AGU-1702',stage:'CLASIFICACIÓN',date:'2026-08-11',qty:389,unit:'injertos',from:'Aclimatación',to:'AGU-A2',responsible:'Camila Torres',evidence:'Registro de selección DEMO',provenance:'OBSERVADO DEMO'},
    {id:'MV-CA-001',materialId:'MAT-CAC-0904',stage:'PROPAGACIÓN',date:'2026-06-28',qty:2100,unit:'plántulas',from:'Propagación propia DEMO',to:'VIV-01',responsible:'Andrés Gómez',evidence:'Bitácora DEMO',provenance:'REGISTRO DEMO'},
    {id:'MV-CA-002',materialId:'MAT-CAC-0904',stage:'CLASIFICACIÓN',date:'2026-08-13',qty:390,unit:'plántulas',from:'VIV-01',to:'Listo para campo',responsible:'Laura Mejía',evidence:'Conteo DEMO',provenance:'OBSERVADO DEMO'}
  ];

  const MATERIAL_TARGETS={
    'MAT-CAF-2401':'CAF-A1',
    'MAT-AGU-1702':'AGU-A2',
    'MAT-CAC-0904':'CAC-B1'
  };
  const STAGES=['ORIGEN','PROPAGACIÓN','CLASIFICACIÓN','TRASPLANTE / MOVIMIENTO','VÍNCULO PRODUCTIVO','DISPOSICIÓN FINAL'];
  const stageIndex=s=>Math.max(0,STAGES.findIndex(x=>x===s));
  const fmtDate=v=>{try{return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${v}T12:00:00`))}catch{return v||'—'}};

  function localEvents(){
    return storage.records.filter(r=>r.type==='material-lifecycle-event').map(r=>({
      id:r.id, materialId:r.values?.materialId||'', stage:r.values?.stage||'ORIGEN', date:r.values?.date||String(r.createdAt||'').slice(0,10),
      qty:Number(r.values?.qty)||0, unit:r.values?.unit||'unidades', from:r.values?.from||'—', to:r.values?.to||'—',
      responsible:r.values?.responsible||identity?.displayName||'Usuario DEMO', evidence:r.values?.evidence||'LOCAL_ONLY',
      provenance:r.values?.provenance||'REGISTRO LOCAL/NUBE DEMO', detail:r.values?.detail||'', local:true
    })).reverse();
  }
  function allEvents(){return [...localEvents(),...BASE_EVENTS]}
  function eventsFor(materialId){return allEvents().filter(e=>e.materialId===materialId).sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
  function targetLot(materialId){return MATERIAL_TARGETS[materialId]||'Por asignar'}
  function latestStage(materialId){const list=eventsFor(materialId);return list.length?list[list.length-1].stage:'ORIGEN'}
  function traceScore(material){
    const stages=new Set(eventsFor(material.id).map(e=>e.stage));
    const base=Math.min(92,35+stages.size*12+(material.trace==='Completa'?18:8));
    return Math.min(100,base);
  }
  function tone(stage){return /DISPOSICIÓN/i.test(stage)?'warn':/VÍNCULO|TRASPLANTE/i.test(stage)?'teal':''}

  function materialLifecycle(){
    const local=localEvents();
    const avg=Math.round(DEMO.material.reduce((s,m)=>s+traceScore(m),0)/DEMO.material.length);
    const total=DEMO.material.reduce((s,m)=>s+Number(m.qty||0),0);
    const available=DEMO.material.reduce((s,m)=>s+Number(m.available||0),0);
    return `${head('AGROWAY · CICLO DE VIDA DEL MATERIAL VEGETAL','De la fuente genética declarada al cierre del material.','AGROWAY histórico contemplaba plantas madre, semillas, esquejes, propagación, vivero, cultivo y disposición final. SANA conserva cada transición con cantidad, fecha, responsable, evidencia y procedencia; no certifica identidad genética ni estatus fitosanitario por sí sola.',`<button class="btn primary" data-material-event>Registrar transición DEMO</button>`)}
      <section class="grid metrics">${metric('Materiales activos',DEMO.material.length,`${total} unidades iniciales modeladas`,'good')}${metric('Disponibles en vivero',available,'según inventario DEMO','good')}${metric('Integridad media',`${avg}%`,'completitud de cadena DEMO',avg>=80?'good':'warn')}${metric('Eventos propios',local.length,local.length?'LOCAL/Nube DEMO según sync':'sin capturas propias',local.length?'good':'warn')}</section>
      <article class="card"><div class="card-head"><div><h2>Inventario vegetal y estado de ciclo</h2><p>El inventario es una fotografía; el ciclo explica cómo llegó cada material hasta allí.</p></div><span class="status">SOURCE-DRIVEN AGROWAY</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Material</th><th>Tipo / especie</th><th>Origen declarado</th><th>Disponible</th><th>Etapa inventario</th><th>Última transición</th><th>Destino productivo</th><th>Integridad</th></tr></thead><tbody>${DEMO.material.map(m=>`<tr><td><strong>${m.id}</strong></td><td>${esc(m.type)}<br><small>${esc(m.species)}</small></td><td>${esc(m.origin)}</td><td>${m.available} / ${m.qty}</td><td>${esc(m.stage)}</td><td><span class="status ${tone(latestStage(m.id))}">${esc(latestStage(m.id))}</span></td><td>${esc(targetLot(m.id))}</td><td>${traceScore(m)}%<br><small>${esc(m.trace)}</small></td></tr>`).join('')}</tbody></table></div></article>
      <section class="material-lifecycle-grid" style="margin-top:14px">${DEMO.material.map(m=>materialCard(m)).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Contrato de transición</h2><p>Campos mínimos para que un movimiento sea reconstruible.</p></div></div><div class="card-body"><div class="flow"><div class="flow-step"><b>01</b><span>Identidad</span><small>material / lote</small></div><div class="flow-step"><b>02</b><span>Origen</span><small>desde dónde</small></div><div class="flow-step"><b>03</b><span>Cantidad</span><small>unidad explícita</small></div><div class="flow-step"><b>04</b><span>Movimiento</span><small>etapa + destino</small></div><div class="flow-step"><b>05</b><span>Responsable</span><small>persona</small></div><div class="flow-step"><b>06</b><span>Evidencia</span><small>prueba / procedencia</small></div></div><div class="section-note" style="margin-top:12px">“Completo” en DEMO significa que la cadena tiene campos suficientes para reconstrucción funcional; no equivale a certificación varietal, sanitaria, ICA ni genética.</div></div></article>
      <article class="card"><div class="card-head"><div><h2>Conexión del cierre</h2><p>El material no desaparece cuando sale del vivero.</p></div></div><div class="card-body"><div class="quick-grid" style="grid-template-columns:1fr 1fr"><button class="quick" data-view-link="territory"><strong>Lote productivo</strong><span>Destino y contexto espacial.</span></button><button class="quick" data-view-link="plans"><strong>Plan técnico</strong><span>Versión y manejo.</span></button><button class="quick" data-view-link="results"><strong>Resultado</strong><span>Cosecha observada.</span></button><button class="quick" data-view-link="circularity"><strong>Disposición / circularidad</strong><span>Reincorporación o destino final.</span></button></div><div class="gate" style="margin-top:12px"><i class="blocked">×</i><div><strong>Identidad genética certificada</strong><p>Solo puede afirmarse con evidencia/proceso externo válido.</p></div><span class="status danger">NO ASUMIR</span></div></div></article></section>${footer()}`;
  }

  function materialCard(m){
    const ev=eventsFor(m.id);
    return `<article class="card"><div class="card-head"><div><h2>${esc(m.species)}</h2><p>${m.id} · ${esc(m.type)} · ${m.available}/${m.qty} disponibles</p></div><span class="status ${m.trace==='Completa'?'teal':'warn'}">${traceScore(m)}% TRAZA</span></div><div class="card-body"><div class="workflow material-workflow">${STAGES.map((s,i)=>{const done=ev.some(e=>e.stage===s);const current=s===latestStage(m.id);return `<div class="stage ${done?'done':''} ${current?'current':''}"><span class="num">${i+1}</span><strong>${esc(s)}</strong><span>${done?'registrado':'pendiente / no aplica'}</span></div>`}).join('')}</div><div class="timeline" style="margin-top:14px">${ev.map(e=>`<div class="timeline-item"><i></i><div><strong>${esc(e.stage)} · ${e.qty} ${esc(e.unit)}</strong><p>${esc(e.from)} → ${esc(e.to)} · ${esc(e.responsible)}</p><div class="chip-row"><span class="chip">${esc(e.evidence)}</span><span class="chip">${esc(e.provenance)}</span>${e.local?'<span class="chip">LOCAL/NUBE DEMO</span>':''}</div></div><time>${fmtDate(e.date)}</time></div>`).join('')||'<div class="empty">Sin eventos de ciclo.</div>'}</div></div></article>`;
  }

  views.material=materialLifecycle;
  window.__SANA_MATERIAL_LIFECYCLE__=Object.freeze({events:allEvents,forMaterial:eventsFor,targetLot});

  function openEvent(){
    const materialOptions=DEMO.material.map(m=>`<option value="${m.id}">${m.id} · ${esc(m.species)}</option>`).join('');
    const stageOptions=STAGES.map(s=>`<option>${esc(s)}</option>`).join('');
    const lotOptions=['VIV-01',...DEMO.lots.filter(l=>l.id!=='VIV-01').map(l=>l.id),'Disposición / circularidad'].map(x=>`<option>${esc(x)}</option>`).join('');
    openModal('MATERIAL VEGETAL · TRAZABILIDAD','Registrar transición DEMO',`<div class="fields"><label>Material<select name="materialId">${materialOptions}</select></label><label>Etapa<select name="stage">${stageOptions}</select></label><label>Fecha<input name="date" type="date" required></label><label>Cantidad<input name="qty" type="number" min="0" step="1" required></label><label>Unidad<select name="unit"><option>unidades</option><option>semillas</option><option>plántulas</option><option>injertos</option><option>esquejes</option></select></label><label>Desde<input name="from" required placeholder="Origen / ubicación anterior"></label><label>Hacia<select name="to">${lotOptions}</select></label><label>Responsable<input name="responsible" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Evidencia<input name="evidence" required placeholder="Registro / foto / documento / conteo"></label><label>Procedencia<select name="provenance"><option>DECLARADO DEMO</option><option>OBSERVADO DEMO</option><option>DOCUMENTAL DEMO</option><option>MEDIDO / CONTADO DEMO</option><option>PENDIENTE VERIFICACIÓN</option></select></label><label class="full">Detalle / motivo<textarea name="detail" placeholder="Qué transición ocurrió y por qué"></textarea></label><label class="full">Integridad<input value="LOCAL/NUBE DEMO · NO CERTIFICA IDENTIDAD GENÉTICA NI FITOSANITARIA" readonly></label></div>`,true,'material-lifecycle-event');
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-material-event]'))openEvent()});
})();
