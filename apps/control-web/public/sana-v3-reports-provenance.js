(() => {
  'use strict';

  const REPORTS=[
    {id:'RPT-INS',name:'Proyección de insumos por cultivo',audience:'Equipo técnico / operación',sources:['Planes versionados','Inventario','Proyección de insumos'],cadence:'Por ciclo / corte',status:'DISPONIBLE DEMO'},
    {id:'RPT-ALT',name:'Alertas y pendientes operativos',audience:'Técnico / Productor',sources:['Campo','Sanidad','IoT','Compromisos'],cadence:'Semanal / a demanda',status:'DISPONIBLE DEMO'},
    {id:'RPT-FIN',name:'Economía por cultivo',audience:'Gestión / lectura financiera',sources:['Costos DEMO','Resultados','Escenario comercial'],cadence:'Por ciclo',status:'DISPONIBLE DEMO'},
    {id:'RPT-CUS',name:'Informe personalizado',audience:'Según propósito',sources:['Selección explícita'],cadence:'A demanda',status:'CONFIGURABLE'},
    {id:'RPT-REG',name:'Expediente para requerimiento regulatorio',audience:'Autoridad / cumplimiento',sources:['Passport','Evidencia','Trazabilidad'],cadence:'Según requerimiento',status:'NO ES PRESENTACIÓN OFICIAL'}
  ];

  function snapshots(){return storage.records.filter(r=>r.type==='report-snapshot').map(r=>({id:r.id,...r.values,createdAt:r.createdAt})).reverse()}
  function sourceVersions(){return [
    `Plan técnico: ${DEMO.plans.map(p=>`${p.id} v${p.version}`).join(' · ')}`,
    `Estado local/cloud: ${window.__SANA_CLOUD_STATE__?.describe?.().revision||0}`,
    `Passport records: ${storage.records.length}`,
    `Corte demo: ${new Date().toLocaleDateString('es-CO')}`
  ]}

  function reports(){
    const snaps=snapshots();
    return `${head('AGROWAY · INFORMES Y CORTES','Un informe vale por la trazabilidad de lo que contiene.','AGROWAY histórico contemplaba proyecciones de insumos, alertas, informes financieros por cultivo, personalizados y regulatorios. SANA añade procedencia, versión y fecha de corte para que una salida sea reconstruible.',`<button class="btn primary" data-report-snapshot>Registrar corte DEMO</button>`)}
      <section class="grid metrics">${metric('Familias de informe',REPORTS.length,'según especificación histórica','good')}${metric('Cortes registrados',snaps.length,'por esta identidad',snaps.length?'good':'warn')}${metric('Fuentes versionadas','4 capas','plan · estado · Passport · corte','good')}${metric('Presentaciones oficiales','0','requieren proceso humano/externo','warn')}</section>
      <section class="grid two">${REPORTS.map(r=>`<article class="card"><div class="card-head"><div><h2>${esc(r.name)}</h2><p>${esc(r.audience)} · ${esc(r.cadence)}</p></div><span class="status ${r.id==='RPT-REG'?'warn':''}">${esc(r.status)}</span></div><div class="card-body"><div class="chip-row">${r.sources.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div><div class="section-note" style="margin-top:12px">Una salida de esta familia debe conservar sus fuentes, corte y revisor. Generar un informe DEMO no equivale a presentarlo ante una autoridad, entidad financiera o tercero.</div></div></article>`).join('')}</section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Linaje mínimo de cada corte</h2><p>Metadatos que deben viajar con cualquier reporte.</p></div></div><div class="card-body"><div class="flow"><div class="flow-step"><b>01</b><span>Propósito</span><small>para quién / por qué</small></div><div class="flow-step"><b>02</b><span>Fuentes</span><small>módulos incluidos</small></div><div class="flow-step"><b>03</b><span>Versiones</span><small>plan / estado</small></div><div class="flow-step"><b>04</b><span>Corte</span><small>fecha y hora</small></div><div class="flow-step"><b>05</b><span>Revisor</span><small>persona responsable</small></div><div class="flow-step"><b>06</b><span>Integridad</span><small>DEMO / externo</small></div></div></div></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Historial de cortes DEMO</h2><p>Snapshots registrados por el usuario; no archivos regulatorios oficiales.</p></div></div><div class="card-body">${snaps.length?snaps.map(s=>`<div class="row"><span class="dot"></span><div class="copy"><strong>${esc(s.reportName||s.reportType||'Informe DEMO')}</strong><span>${esc(s.purpose||'Sin propósito')} · corte ${esc(s.cutoff||'—')}</span><small>${esc(s.sources||'Fuentes DEMO')}</small></div><div class="meta">${esc(s.reviewer||'Sin revisor')}<br><span class="status">LOCAL/NUBE DEMO</span></div></div>`).join(''):'<div class="empty">Aún no existen cortes creados por esta identidad.</div>'}</div></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Fuentes actuales</h2><p>Vista de la procedencia disponible en esta sesión.</p></div></div><div class="card-body">${sourceVersions().map((x,i)=>`<div class="gate"><i>${i+1}</i><div><strong>${esc(x.split(':')[0])}</strong><p>${esc(x.split(':').slice(1).join(':').trim())}</p></div><span class="status">DEMO</span></div>`).join('')}</div></article><article class="card"><div class="card-head"><div><h2>Frontera</h2><p>Qué no hace el botón “Registrar corte”.</p></div></div><div class="card-body"><div class="gate"><i class="blocked">×</i><div><strong>Certificar datos</strong><p>El reporte organiza información; no verifica externamente su autenticidad.</p></div><span class="status danger">NO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Presentar ante autoridad</strong><p>No existe envío, firma ni radicación automática.</p></div><span class="status danger">NO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Convertir escenario en hecho</strong><p>Estimaciones conservan su etiqueta y metodología.</p></div><span class="status danger">NO</span></div></div></article></section>${footer()}`;
  }

  views.reports=reports;

  function openSnapshot(){
    const options=REPORTS.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');
    openModal('INFORMES · CORTE TRAZABLE','Registrar corte DEMO',`<div class="fields"><label>Familia de informe<select name="reportType">${options}</select></label><label>Fecha de corte<input name="cutoff" type="date" required></label><label>Revisor humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Estado<select name="status"><option>BORRADOR DEMO</option><option>REVISADO DEMO</option><option>PENDIENTE EVIDENCIA</option></select></label><label class="full">Propósito<textarea name="purpose" required placeholder="Decisión o necesidad informativa que motiva este corte"></textarea></label><label class="full">Fuentes incluidas<textarea name="sources" required>${esc(sourceVersions().join('\n'))}</textarea></label><label class="full">Notas de calidad / exclusiones<textarea name="detail" placeholder="Qué no está incluido, qué es estimado, qué requiere verificación"></textarea></label><label class="full">Integridad<input value="LOCAL/NUBE DEMO · NO ES RADICACIÓN, CERTIFICACIÓN NI FIRMA" readonly></label></div>`,true,'report-snapshot');
  }

  document.addEventListener('click',event=>{if(event.target.closest('[data-report-snapshot]'))openSnapshot()});
})();
