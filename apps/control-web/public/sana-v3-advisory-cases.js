(() => {
  'use strict';

  const SEED=[
    {id:'CAS-AG-014',lot:'AGU-A2',opened:'14 ago 2026',question:'¿La señal de humedad justifica modificar el próximo fertirriego?',context:'Media DEMO 43%; lectura agregada no concluyente.',agronomist:'Laura Mejía',response:'No ajustar únicamente por la señal agregada. Contrastar varios puntos, drenaje, CE/pH y fase de cuajado.',commitment:'Camila toma lecturas multisitio antes de la siguiente decisión.',evidence:'Pendiente visita 18 ago',status:'EN REVISIÓN'},
    {id:'CAS-CA-009',lot:'CAC-B1',opened:'13 ago 2026',question:'¿Debe escalarse la vigilancia de monilia?',context:'Condición climática favorable; sin incidencia confirmada.',agronomist:'Laura Mejía',response:'Mantener vigilancia estructurada y aplicar el umbral definido por la responsable antes de escalar manejo.',commitment:'Documentar próximo control de puntos y síntomas compatibles.',evidence:'EV-434',status:'RESPUESTA HUMANA'}
  ];

  function localCases(){
    return storage.records.filter(r=>r.type==='agronomist-case').map(r=>({
      id:r.id,
      lot:r.values?.lot||r.lot,
      opened:r.values?.opened||new Date(r.createdAt).toLocaleDateString('es-CO'),
      question:r.values?.question||r.title,
      context:r.values?.context||'Sin contexto estructurado',
      agronomist:r.values?.agronomist||'Responsable por asignar',
      response:r.values?.response||'Pendiente de respuesta humana',
      commitment:r.values?.commitment||'Pendiente',
      evidence:r.values?.evidence||'Pendiente',
      status:r.values?.status||'LOCAL_ONLY'
    })).reverse();
  }
  function cases(){return [...localCases(),...SEED]}
  function tone(status){return /RESPUESTA|CERRAD/i.test(status)?'teal':/REVIS|LOCAL|PEND/i.test(status)?'warn':''}

  function section(){
    const list=cases(); const open=list.filter(c=>!/CERRAD/i.test(c.status)).length; const human=list.filter(c=>/RESPUESTA/i.test(c.status)).length;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Casos con Agrónomo</h2><p>La conversación se convierte en expediente técnico; la IA puede ordenar contexto, pero la respuesta agronómica queda atribuida a una persona.</p></div><button class="btn secondary" data-agronomist-case>Abrir caso técnico</button></div><div class="card-body"><div class="grid metrics" style="margin-bottom:14px"><article class="metric"><span>Casos</span><strong>${list.length}</strong><small>${open} abiertos</small></article><article class="metric"><span>Respuesta humana</span><strong>${human}</strong><small>casos con criterio atribuido</small></article><article class="metric"><span>Autoridad IA</span><strong>0</strong><small class="warn">ADVISORY_ONLY</small></article><article class="metric"><span>Registros propios</span><strong>${localCases().length}</strong><small>LOCAL/Nube DEMO</small></article></div><div class="table-wrap"><table class="table"><thead><tr><th>Caso</th><th>Lote</th><th>Consulta</th><th>Agrónomo</th><th>Respuesta / compromiso</th><th>Evidencia</th><th>Estado</th></tr></thead><tbody>${list.map(c=>`<tr><td><strong>${esc(c.id)}</strong><br><small>${esc(c.opened)}</small></td><td>${esc(c.lot)}</td><td><strong>${esc(c.question)}</strong><br><small>${esc(c.context)}</small></td><td>${esc(c.agronomist)}</td><td>${esc(c.response)}<br><small>Compromiso: ${esc(c.commitment)}</small></td><td>${esc(c.evidence)}</td><td><span class="status ${tone(c.status)}">${esc(c.status)}</span></td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px">AGROWAY histórico contemplaba “Chat con Agrónomo” y acompañamiento especializado al plan de cultivo. En SANA, el chat se modela como caso trazable para conservar contexto, responsable y evidencia; una salida de IA nunca se registra como respuesta agronómica humana.</div></div></section>
    <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Ciclo de caso técnico</h2><p>De la pregunta a un cierre verificable.</p></div></div><div class="card-body"><div class="flow"><div class="flow-step"><b>01</b><span>Abrir</span><small>pregunta + lote</small></div><div class="flow-step"><b>02</b><span>Contextualizar</span><small>plan + datos</small></div><div class="flow-step"><b>03</b><span>Revisar</span><small>persona técnica</small></div><div class="flow-step"><b>04</b><span>Responder</span><small>criterio atribuido</small></div><div class="flow-step"><b>05</b><span>Comprometer</span><small>acción + responsable</small></div><div class="flow-step"><b>06</b><span>Evidenciar</span><small>prueba vinculada</small></div><div class="flow-step"><b>07</b><span>Cerrar</span><small>sin cambio automático</small></div></div></div></section>`;
  }

  const previous=views.advisory;
  views.advisory=()=>{
    const html=previous();
    const marker='<footer class="footer-note">';
    const index=html.lastIndexOf(marker);
    return index>=0?`${html.slice(0,index)}${section()}${html.slice(index)}`:`${html}${section()}`;
  };

  function openCase(){
    const lots=DEMO.lots.map(l=>`<option value="${l.id}">${l.id} · ${esc(l.crop)} · ${esc(l.name)}</option>`).join('');
    const body=`<div class="fields"><label>Lote<select name="lot">${lots}</select></label><label>Fecha de apertura<input name="opened" type="date"></label><label class="full">Pregunta técnica<textarea name="question" required placeholder="Pregunta concreta que requiere criterio agronómico"></textarea></label><label class="full">Contexto disponible<textarea name="context" required placeholder="Plan, fase, observaciones, lecturas y evidencia relevante"></textarea></label><label>Agrónomo responsable<select name="agronomist"><option>Laura Mejía</option><option>Camila Torres</option><option>Por asignar</option></select></label><label>Estado<select name="status"><option>EN REVISIÓN</option><option>RESPUESTA HUMANA</option><option>PENDIENTE EVIDENCIA</option><option>CERRADO</option></select></label><label class="full">Respuesta humana<textarea name="response" placeholder="Solo registrar cuando exista criterio de una persona responsable"></textarea></label><label class="full">Compromiso<textarea name="commitment" placeholder="Acción, responsable y plazo"></textarea></label><label>Evidencia<input name="evidence" placeholder="ID / pendiente"></label><label>Autoridad<input value="HUMAN_REVIEW_REQUIRED" readonly></label><label class="full">Integridad<input value="LOCAL_ONLY / Nube DEMO · IA NO FIRMA RESPUESTA AGRONÓMICA" readonly></label></div>`;
    openModal('AGROWAY/SANA · CASO TÉCNICO','Consulta con Agrónomo',body,true,'agronomist-case');
  }

  document.addEventListener('click',event=>{if(event.target.closest('[data-agronomist-case]'))openCase()});
})();
