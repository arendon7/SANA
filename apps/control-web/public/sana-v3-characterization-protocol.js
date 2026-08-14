(() => {
  'use strict';

  const CHARACTER_KEY='sana.v3.characterization';
  const SECTIONS=[
    {id:'identity',title:'Productora y unidad',desc:'Identidad, relación con el predio, tenencia, experiencia y consentimiento.',source:'DECLARADO + DOCUMENTAL'},
    {id:'productive',title:'Sistema productivo',desc:'Cultivos, áreas, diversificación, etapa, propósito y manejo actual.',source:'DECLARADO + OBSERVADO'},
    {id:'soil',title:'Suelo y regeneración',desc:'Cobertura, erosión, textura, análisis disponibles y prácticas regenerativas.',source:'OBSERVADO + EVIDENCIA'},
    {id:'water',title:'Agua',desc:'Fuente, disponibilidad, protección, riego, calidad y riesgos hídricos.',source:'DECLARADO + MEDIDO'},
    {id:'inputs',title:'Insumos y circularidad',desc:'Fertilización, bioinsumos, residuos orgánicos, almacenamiento y aprovechamiento.',source:'REGISTRO + OBSERVADO'},
    {id:'infrastructure',title:'Infraestructura y acceso',desc:'Beneficio, almacenamiento, equipos, vías, energía y conectividad.',source:'OBSERVADO'},
    {id:'risks',title:'Riesgos y resiliencia',desc:'Riesgo climático, sanitario, erosión, mercado, operación y medidas existentes.',source:'OBSERVADO + ANÁLISIS'},
    {id:'market',title:'Comercialización',desc:'Canales, comprador, condiciones de venta, calidad, asociatividad y evidencia.',source:'DECLARADO + DOCUMENTAL'},
    {id:'support',title:'Acompañamiento y capacidades',desc:'Asistencia técnica, formación, necesidades, objetivos y compromisos.',source:'DECLARADO + TÉCNICO'},
    {id:'evidence',title:'Evidencia de línea base',desc:'Fotografías, documentos, georreferencia, análisis y procedencia.',source:'EVIDENCIA'}
  ];

  const BASELINE={
    identity:{status:'complete',summary:'Marta Restrepo · productora DEMO · Finca La Esperanza · tenencia declarada propia.',updated:'12 ago 2026',by:'Equipo SANA DEMO'},
    productive:{status:'complete',summary:'Café, aguacate, cacao, vivero y restauración distribuidos en 12.4 ha.',updated:'12 ago 2026',by:'Equipo SANA DEMO'},
    soil:{status:'review',summary:'Cobertura y condición general registradas; análisis de suelo externo requiere expediente.',updated:'13 ago 2026',by:'Laura Mejía'},
    water:{status:'review',summary:'Fuentes y puntos de lectura DEMO identificados; falta separar disponibilidad declarada de medición.',updated:'13 ago 2026',by:'Camila Torres'},
    inputs:{status:'complete',summary:'Inventario DEMO enlazado con lotes y actividades; circularidad aún no verificada externamente.',updated:'14 ago 2026',by:'José Pérez'},
    infrastructure:{status:'complete',summary:'Vivero, tanque de fertirriego y equipos principales inventariados en DEMO.',updated:'12 ago 2026',by:'Equipo SANA DEMO'},
    risks:{status:'review',summary:'Riesgos hídricos y sanitarios visibles; mitigaciones requieren revisión por lote/plan.',updated:'14 ago 2026',by:'Laura Mejía'},
    market:{status:'missing',summary:'Canal comercial y evidencia de condiciones de venta aún no caracterizados.',updated:'—',by:'—'},
    support:{status:'complete',summary:'Roles técnicos y operativos asignados; acompañamiento activo DEMO.',updated:'14 ago 2026',by:'Administrador demo'},
    evidence:{status:'review',summary:'Passport contiene evidencia operativa; faltan piezas específicas de línea base.',updated:'14 ago 2026',by:'Sistema DEMO'}
  };

  function state(){
    let local={};
    try{local=JSON.parse(localStorage.getItem(CHARACTER_KEY)||'{}')}catch{}
    return {...BASELINE,...local};
  }
  function save(next){localStorage.setItem(CHARACTER_KEY,JSON.stringify(next))}
  function sectionState(row){return row.status==='complete'?'COMPLETA':row.status==='review'?'REVISAR':'PENDIENTE'}
  function sectionTone(row){return row.status==='complete'?'teal':row.status==='review'?'warn':'danger'}
  function completeness(rows){const vals=Object.values(rows);return Math.round(vals.reduce((a,r)=>a+(r.status==='complete'?1:r.status==='review'?.55:0),0)/SECTIONS.length*100)}
  function nextGap(rows){const missing=SECTIONS.find(s=>rows[s.id]?.status==='missing');if(missing)return missing;return SECTIONS.find(s=>rows[s.id]?.status==='review')||SECTIONS[0]}

  function characterization(){
    const rows=state();
    const pct=completeness(rows);
    const complete=SECTIONS.filter(s=>rows[s.id]?.status==='complete').length;
    const review=SECTIONS.filter(s=>rows[s.id]?.status==='review').length;
    const missing=SECTIONS.filter(s=>rows[s.id]?.status==='missing').length;
    const gap=nextGap(rows);

    return `${head('SANA · CARACTERIZACIÓN INTEGRAL','La línea base que da sentido a todo lo demás.','La caracterización organiza contexto humano, productivo, biofísico y comercial antes de convertir observaciones en planes, indicadores o preparación para capital. Completa no significa automáticamente verificada.',`<button class="btn primary" data-character-section="${gap.id}">Continuar caracterización</button>`)}
      <section class="grid metrics">${metric('Cobertura de ficha',`${pct}%`,`${complete}/10 completas`,'good')}${metric('En revisión',review,'requieren criterio o evidencia','warn')}${metric('Pendientes',missing,missing?'brechas de línea base':'sin secciones vacías',missing?'warn':'good')}${metric('Procedencia','4 capas','declarado · observado · evidencia · calculado','good')}</section>
      <section class="grid two"><article class="card"><div class="card-head"><div><h2>Finca La Esperanza</h2><p>${DEMO.farm.producer} · ${DEMO.farm.municipality}, ${DEMO.farm.department}</p></div><span class="status ${pct>=85?'teal':'warn'}">${pct}% LÍNEA BASE</span></div><div class="card-body"><div class="table-wrap"><table class="table"><tbody><tr><th>Unidad</th><td>${DEMO.farm.id}</td></tr><tr><th>Área</th><td>${DEMO.farm.area} ha</td></tr><tr><th>Altitud</th><td>${DEMO.farm.altitude}</td></tr><tr><th>Modelo</th><td>${DEMO.farm.model}</td></tr><tr><th>Unidades internas</th><td>${DEMO.lots.length}</td></tr><tr><th>Autoridad técnica</th><td>HUMAN_REVIEW_REQUIRED</td></tr></tbody></table></div></div></article><article class="card"><div class="card-head"><div><h2>Próxima brecha</h2><p>La plataforma prioriza completitud, no inventa el dato.</p></div></div><div class="card-body"><div class="section-note"><strong>${esc(gap.title)}</strong><br>${esc(gap.desc)}</div><div class="gate"><i class="warn">!</i><div><strong>Fuente esperada</strong><p>${esc(gap.source)}</p></div><span class="status warn">${sectionState(rows[gap.id])}</span></div><button class="btn secondary" style="margin-top:12px" data-character-section="${gap.id}">Abrir sección</button></div></article></section>
      <section class="character-grid" style="margin-top:14px">${SECTIONS.map((s,i)=>{const r=rows[s.id];return `<button class="character-card ${r.status}" data-character-section="${s.id}"><header><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(s.title)}</strong><small>${esc(s.source)}</small></div><b class="status ${sectionTone(r)}">${sectionState(r)}</b></header><p>${esc(r.summary)}</p><footer><span>${esc(r.updated)}</span><span>${esc(r.by)}</span></footer></button>`}).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Regla de procedencia</h2><p>El mismo campo puede tener distinto nivel de confianza.</p></div></div><div class="card-body"><div class="gate"><i>1</i><div><strong>DECLARADO</strong><p>Dato informado por productora/operario; conserva autor y fecha.</p></div><span class="status">FUENTE</span></div><div class="gate"><i>2</i><div><strong>OBSERVADO / MEDIDO</strong><p>Dato capturado en visita, instrumento o sensor.</p></div><span class="status teal">TRAZABLE</span></div><div class="gate"><i>3</i><div><strong>EVIDENCIA</strong><p>Documento, foto, análisis u otro respaldo enlazado.</p></div><span class="status teal">PRUEBA DEMO</span></div><div class="gate"><i class="warn">4</i><div><strong>CALCULADO / INFERIDO</strong><p>Debe mostrar método y nunca reemplazar el dato fuente.</p></div><span class="status warn">DERIVADO</span></div></div></article><article class="card"><div class="card-head"><div><h2>Conexión con SANA</h2><p>La línea base alimenta decisiones posteriores sin convertirse en aprobación.</p></div></div><div class="card-body"><div class="workflow"><div class="stage done"><span class="num">1</span><strong>Caracterizar</strong><span>Contexto y brechas</span></div><div class="stage current"><span class="num">2</span><strong>Planear</strong><span>Plan técnico</span></div><div class="stage"><span class="num">3</span><strong>Acompañar</strong><span>Visita + actividad</span></div><div class="stage"><span class="num">4</span><strong>Evidenciar</strong><span>Passport</span></div><div class="stage"><span class="num">5</span><strong>Medir</strong><span>Impacto / readiness</span></div></div></div></article></section>${footer()}`;
  }

  views.characterization=characterization;

  function formFor(section){
    const r=state()[section.id];
    const common=`<label>Procedencia<select name="source"><option>DECLARADO</option><option>OBSERVADO</option><option>MEDIDO</option><option>EVIDENCIA</option><option>CALCULADO / INFERIDO</option></select></label><label>Estado<select name="status"><option value="review" ${r.status==='review'?'selected':''}>Requiere revisión</option><option value="complete" ${r.status==='complete'?'selected':''}>Completa DEMO</option><option value="missing" ${r.status==='missing'?'selected':''}>Pendiente</option></select></label><label class="full">Resumen estructurado<textarea name="summary" required>${esc(r.summary==='—'?'':r.summary)}</textarea></label><label>Responsable humano<input name="by" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Fecha / momento<input name="updated" value="Hoy · DEMO" required></label>`;
    const extras={
      identity:'<label>Tenencia / relación<input name="tenure" placeholder="Ej. propia declarada"></label><label>Experiencia productiva<input name="experience" placeholder="Años / actividad"></label>',
      productive:'<label>Cultivos / sistemas<input name="systems" value="Café · Aguacate · Cacao"></label><label>Diversificación<input name="diversity" placeholder="Asociaciones / restauración"></label>',
      soil:'<label>Cobertura observada<input name="coverage" placeholder="% o descripción"></label><label>Análisis disponible<input name="analysis" placeholder="Fecha / expediente"></label>',
      water:'<label>Fuente principal<input name="waterSource" placeholder="Nacimiento / acueducto / otra"></label><label>Riego / disponibilidad<input name="irrigation" placeholder="Sistema + condición"></label>',
      inputs:'<label>Fertilización / bioinsumos<input name="inputs" placeholder="Práctica actual"></label><label>Residuos / circularidad<input name="circularity" placeholder="Aprovechamiento"></label>',
      infrastructure:'<label>Infraestructura clave<input name="infra" placeholder="Vivero / beneficio / almacenamiento"></label><label>Acceso y conectividad<input name="access" placeholder="Vía / energía / datos"></label>',
      risks:'<label>Riesgo principal<input name="risk" placeholder="Clima / sanidad / erosión / mercado"></label><label>Mitigación existente<input name="mitigation" placeholder="Acción actual"></label>',
      market:'<label>Canal / comprador<input name="channel" placeholder="Canal declarado"></label><label>Evidencia comercial<input name="marketEvidence" placeholder="Contrato / factura / registro / ninguna"></label>',
      support:'<label>Necesidad prioritaria<input name="need" placeholder="Acompañamiento requerido"></label><label>Objetivo acordado<input name="goal" placeholder="Resultado buscado"></label>',
      evidence:'<label>Tipo de evidencia<input name="evidenceType" placeholder="Foto / documento / análisis"></label><label>Referencia<input name="reference" placeholder="ID / archivo DEMO"></label>'
    };
    return `<div class="fields">${extras[section.id]||''}${common}<label class="full">Integridad<input value="LOCAL_ONLY · no implica verificación externa" readonly></label></div>`;
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-character-section]');
    if(!button||typeof openModal!=='function')return;
    const section=SECTIONS.find(s=>s.id===button.dataset.characterSection);
    if(!section)return;
    openModal(`CARACTERIZACIÓN · ${section.source}`,section.title,formFor(section),true,`characterization:${section.id}`);
  });

  document.addEventListener('sana:record-saved',event=>{
    const type=event.detail?.type||'';
    if(!type.startsWith('characterization:'))return;
    const id=type.split(':')[1];
    const rows=state();
    const values=event.detail?.values||{};
    rows[id]={status:values.status||'review',summary:values.summary||'Sin resumen',updated:values.updated||'Hoy · DEMO',by:values.by||identity?.displayName||'Responsable DEMO'};
    save(rows);
  });
})();
