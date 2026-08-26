(() => {
  'use strict';

  const VISIT_SEED=[
    {id:'VIS-0812',date:'12 ago 2026',lot:'CAF-A1',owner:'Laura Mejía',purpose:'Seguimiento de llenado y cierre de nutrición fase II',stage:'Llenado de fruto',vigor:'Alto',soil:'Humedad adecuada en puntos revisados',water:'Sin alerta observada',health:'Broca menor bajo seguimiento',finding:'Buen vigor general; mantener vigilancia sanitaria y confirmar evidencia de la aplicación.',recommendation:'Conservar seguimiento planificado y revisar condición antes de siguiente intervención.',commitment:'José completa evidencia; Laura revisa cierre sanitario.',next:'18 ago 2026',status:'CERRADA',evidence:'EV-445'},
    {id:'VIS-0818',date:'18 ago 2026',lot:'AGU-A2',owner:'Laura Mejía',purpose:'Verificar señal hídrica y coherencia con plan de cuajado',stage:'Cuajado',vigor:'Por observar',soil:'Verificación multisitio pendiente',water:'43% media DEMO; no concluyente',health:'Sin incidencia confirmada',finding:'Visita programada; la señal de humedad requiere contraste en campo.',recommendation:'No modificar manejo únicamente por la señal agregada.',commitment:'Camila prepara lecturas; Laura documenta criterio y próximos pasos.',next:'Por definir',status:'PROGRAMADA',evidence:'Pendiente'}
  ];

  function structuredVisits(){
    const local=storage.records.filter(r=>r.type==='structured-visit').map(r=>({
      id:r.id,
      date:r.values?.date||'Ahora',
      lot:r.values?.lot||r.lot,
      owner:r.values?.owner||identity?.displayName||'Responsable DEMO',
      purpose:r.values?.purpose||r.title,
      stage:r.values?.stage||'Por registrar',
      vigor:r.values?.vigor||'Por registrar',
      soil:r.values?.soil||'Por registrar',
      water:r.values?.water||'Por registrar',
      health:r.values?.health||'Por registrar',
      finding:r.values?.finding||r.values?.detail||'Sin hallazgo estructurado',
      recommendation:r.values?.recommendation||'Pendiente de revisión humana',
      commitment:r.values?.commitment||'Pendiente',
      next:r.values?.next||'Por definir',
      status:'LOCAL_ONLY',
      evidence:r.values?.evidence||'Pendiente'
    }));
    return [...local.reverse(),...VISIT_SEED];
  }

  function accompanimentOperational(){
    const visits=structuredVisits();
    const closed=visits.filter(v=>v.status==='CERRADA').length;
    const scheduled=visits.filter(v=>v.status==='PROGRAMADA').length;
    const local=visits.filter(v=>v.status==='LOCAL_ONLY').length;
    const next=visits.find(v=>v.status==='PROGRAMADA')||visits[0];
    const openCommitments=[
      {title:'Calibrar lectura de humedad AGU-A2',owner:'Camila Torres',due:'Antes del próximo fertirriego',state:'review'},
      {title:'Documentar criterio sanitario CAC-B1',owner:'Laura Mejía',due:'Próximo control',state:'review'},
      {title:'Completar evidencia nutrición CAF-A1',owner:'José Pérez',due:'Recibida',state:'ok'}
    ];

    return `${head('SANA · ACOMPAÑAMIENTO TÉCNICO','La visita es un instrumento de decisión, no una nota libre.','Cada acompañamiento conecta lote, fase, observaciones, mediciones, hallazgos, recomendación humana, compromisos, evidencia y posible revisión del plan.',`<button class="btn primary" data-visit-structured>Registrar visita estructurada</button>`)}
      <section class="grid metrics">${metric('Visitas estructuradas',visits.length,`${closed} cerrada(s) · ${scheduled} programada(s)`)}${metric('Registros locales',local,'LOCAL_ONLY · sandbox')}${metric('Compromisos abiertos','2','con responsable y plazo','warn')}${metric('Planes enlazados','3','café · aguacate · cacao','good')}</section>
      <section class="grid two">
        <article class="card"><div class="card-head"><div><h2>Próxima visita · ${esc(next.lot)}</h2><p>${esc(next.date)} · ${esc(next.owner)}</p></div><span class="status ${next.status==='PROGRAMADA'?'warn':'teal'}">${esc(next.status)}</span></div><div class="card-body"><div class="section-note"><strong>Propósito</strong><br>${esc(next.purpose)}</div><div class="chip-row" style="margin-top:12px"><span class="chip">Fase: ${esc(next.stage)}</span><span class="chip">Agua: ${esc(next.water)}</span><span class="chip">Sanidad: ${esc(next.health)}</span></div><div class="section-note" style="margin-top:12px"><strong>Criterio previo</strong><br>${esc(next.recommendation)}</div></div></article>
        <article class="card"><div class="card-head"><div><h2>Compromisos</h2><p>El seguimiento persiste después de la visita.</p></div></div><div class="card-body">${openCommitments.map(c=>`<div class="gate"><i class="${c.state==='ok'?'':'warn'}">${c.state==='ok'?'✓':'!'}</i><div><strong>${esc(c.title)}</strong><p>${esc(c.owner)} · ${esc(c.due)}</p></div><span class="status ${c.state==='ok'?'teal':'warn'}">${c.state==='ok'?'CERRADO':'PENDIENTE'}</span></div>`).join('')}</div></article>
      </section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Protocolo de visita</h2><p>Separar dato observado, interpretación y decisión reduce ambigüedad y mejora la trazabilidad.</p></div></div><div class="card-body"><div class="workflow"><div class="stage done"><span class="num">1</span><strong>Contexto</strong><span>Lote + plan + fase</span></div><div class="stage done"><span class="num">2</span><strong>Observar</strong><span>Cultivo + suelo + agua</span></div><div class="stage current"><span class="num">3</span><strong>Interpretar</strong><span>Hallazgo + riesgo</span></div><div class="stage"><span class="num">4</span><strong>Recomendar</strong><span>Criterio humano</span></div><div class="stage"><span class="num">5</span><strong>Comprometer</strong><span>Quién + cuándo</span></div><div class="stage"><span class="num">6</span><strong>Evidenciar</strong><span>Prueba + Passport</span></div><div class="stage"><span class="num">7</span><strong>Revisar plan</strong><span>Solo si corresponde</span></div></div></div></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Historial estructurado</h2><p>La historia técnica alimenta Passport y el contexto de SANA Intelligence, sin otorgarle autoridad.</p></div></div><div class="timeline">${visits.map(v=>`<div class="timeline-item"><i></i><div><strong>${esc(v.purpose)}</strong><p>${esc(v.lot)} · ${esc(v.owner)} · ${esc(v.finding)}</p><div class="chip-row" style="margin-top:6px"><span class="chip">Vigor: ${esc(v.vigor)}</span><span class="chip">Evidencia: ${esc(v.evidence)}</span><span class="chip">Siguiente: ${esc(v.next)}</span></div></div><time>${esc(v.date)}<br>${esc(v.status)}</time></div>`).join('')}</div></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Regla de integridad</h2><p>Qué significa cerrar una visita.</p></div></div><div class="card-body"><div class="section-note">“Cerrada” significa que el instrumento fue diligenciado y los compromisos fueron definidos. No significa certificación, auditoría independiente ni validación automática del contenido.</div></div></article><article class="card"><div class="card-head"><div><h2>Relación con el plan</h2><p>La visita puede recomendar una revisión, nunca cambiar el plan por sí sola.</p></div><button class="text-btn" data-view-link="plans">Abrir planes</button></div><div class="card-body"><div class="gate"><i>✓</i><div><strong>Observación documentada</strong><p>Puede alimentar criterio técnico.</p></div><span class="status teal">INPUT</span></div><div class="gate"><i class="blocked">×</i><div><strong>Cambio automático de plan</strong><p>Bloqueado por diseño.</p></div><span class="status danger">HUMAN_ONLY</span></div></div></article></section>${footer()}`;
  }

  views.advisory=accompanimentOperational;

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-visit-structured]');
    if(!button||typeof openModal!=='function')return;
    const lotOptions=DEMO.lots.map(l=>`<option value="${l.id}">${l.id} · ${l.crop} · ${l.name}</option>`).join('');
    const fields=`<div class="fields">
      <label>Lote / unidad<select name="lot">${lotOptions}</select></label>
      <label>Fecha<input name="date" type="date"></label>
      <label>Responsable<select name="owner"><option>Laura Mejía</option><option>Camila Torres</option><option>Carlos Técnico</option></select></label>
      <label>Fase observada<input name="stage" placeholder="Ej. Cuajado"></label>
      <label>Vigor<select name="vigor"><option>Alto</option><option>Medio</option><option>Bajo</option><option>No evaluado</option></select></label>
      <label>Suelo<input name="soil" placeholder="Condición observada"></label>
      <label>Agua<input name="water" placeholder="Condición / lectura relevante"></label>
      <label>Sanidad<input name="health" placeholder="Hallazgo o ausencia de incidencia"></label>
      <label class="full">Propósito<textarea name="purpose" required placeholder="Qué se busca verificar o acompañar"></textarea></label>
      <label class="full">Hallazgos observados<textarea name="finding" required placeholder="Dato u observación; evitar mezclar con recomendación"></textarea></label>
      <label class="full">Recomendación humana<textarea name="recommendation" required placeholder="Criterio técnico y próximos pasos"></textarea></label>
      <label class="full">Compromisos<textarea name="commitment" required placeholder="Responsable + acción + plazo"></textarea></label>
      <label>Próxima revisión<input name="next" placeholder="Fecha o condición"></label>
      <label>Evidencia<select name="evidence"><option>Pendiente</option><option>Foto DEMO</option><option>Registro estructurado</option><option>Documento DEMO</option></select></label>
      <label class="full">Autoridad<input value="HUMAN_REVIEW_REQUIRED · LOCAL_ONLY" readonly></label>
    </div>`;
    openModal('ACOMPAÑAMIENTO TÉCNICO','Visita técnica estructurada',fields,true,'structured-visit');
  });
})();
