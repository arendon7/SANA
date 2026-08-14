(() => {
  'use strict';

  const PLAN_SELECTED_KEY='sana.v3.plan.selected';
  const PLAN_REVIEW_KEY='sana.v3.plan.reviews';

  const PLAN_PROTOCOLS={
    'PL-CF-04':{
      crop:'Café',lot:'CAF-A1',objective:'Conducir el ciclo de café con seguimiento del llenado, disponibilidad hídrica, sanidad, nutrición y evidencia de ejecución antes de cosecha.',
      success:'Cerrar el ciclo con actividades críticas trazables, evidencia suficiente y revisión humana de resultados.',
      variables:['Etapa fenológica','Humedad de suelo','Vigor','Presión sanitaria','Disponibilidad de insumos','Evidencia por actividad'],
      phases:[
        {name:'Línea base',status:'done',criterion:'Lote, material vegetal, condición inicial y plan v4 identificados.',evidence:'Ficha de lote + plan versionado'},
        {name:'Desarrollo',status:'done',criterion:'Seguimiento vegetativo y manejo documentados.',evidence:'Bitácora + aplicaciones'},
        {name:'Llenado de fruto',status:'current',criterion:'Validar condición del cultivo antes de cada manejo relevante.',evidence:'Fenología + nutrición + sanidad'},
        {name:'Cosecha',status:'planned',criterion:'Definir criterios de entrada a cosecha y registro de resultado.',evidence:'Registro de cosecha'},
        {name:'Cierre',status:'planned',criterion:'Comparar plan vs. ejecución y documentar aprendizaje.',evidence:'Informe de cierre + nueva versión'}
      ],
      gates:[
        {label:'Responsable humano asignado',state:'ok',detail:'Laura Mejía · Agrónoma'},
        {label:'Fenología reciente',state:'ok',detail:'Registro de llenado disponible'},
        {label:'Inventario crítico',state:'ok',detail:'2Feed con cobertura suficiente DEMO'},
        {label:'Sanidad',state:'review',detail:'Broca menor cerrada; mantener vigilancia'},
        {label:'Evidencia acumulada',state:'ok',detail:'94% reconstruible'}
      ]
    },
    'PL-AG-03':{
      crop:'Aguacate',lot:'AGU-A2',objective:'Acompañar cuajado y desarrollo temprano con lectura integrada de agua, nutrición, vigor y riesgo, evitando decisiones basadas en una sola señal.',
      success:'Mantener un plan trazable donde cada intervención relevante quede condicionada por contexto de campo y revisión técnica.',
      variables:['Cuajado','Humedad multisitio','CE/pH agua','Vigor','Drenaje','Inventario nutricional'],
      phases:[
        {name:'Línea base',status:'done',criterion:'Unidad, material y contexto productivo documentados.',evidence:'Ficha + origen material'},
        {name:'Floración',status:'done',criterion:'Observaciones y actividades principales registradas.',evidence:'Fenología + campo'},
        {name:'Cuajado',status:'current',criterion:'Verificar agua y condición del cultivo antes de modificar manejo.',evidence:'Lecturas + visita técnica'},
        {name:'Desarrollo de fruto',status:'planned',criterion:'Actualizar variables y plan de seguimiento.',evidence:'Plan nueva fase'},
        {name:'Cierre',status:'planned',criterion:'Revisar resultados, incidencias y aprendizaje.',evidence:'Informe de ciclo'}
      ],
      gates:[
        {label:'Responsable humano asignado',state:'ok',detail:'Camila Torres · Técnica'},
        {label:'Humedad de suelo',state:'block',detail:'43% media; verificar en varios puntos'},
        {label:'CE/pH agua',state:'ok',detail:'Última lectura DEMO disponible'},
        {label:'Inventario crítico',state:'review',detail:'Bioinsumo K · cobertura 8 días'},
        {label:'Evidencia acumulada',state:'ok',detail:'88% reconstruible'}
      ]
    },
    'PL-CA-02':{
      crop:'Cacao',lot:'CAC-B1',objective:'Mantener seguimiento de floración y riesgo sanitario con monitoreo documentado y acciones escaladas únicamente cuando exista criterio humano suficiente.',
      success:'Conservar continuidad del plan y cerrar incidencias con evidencia, sin convertir una alerta climática en diagnóstico automático.',
      variables:['Floración','Clima','Monilia','Vigor','Humedad','Evidencia sanitaria'],
      phases:[
        {name:'Línea base',status:'done',criterion:'Lote, variedad y condiciones iniciales disponibles.',evidence:'Ficha + georreferencia'},
        {name:'Desarrollo',status:'done',criterion:'Manejo y observaciones documentados.',evidence:'Bitácora'},
        {name:'Floración',status:'current',criterion:'Monitorear condición sanitaria y registrar muestra.',evidence:'18 puntos + evidencia'},
        {name:'Fructificación',status:'planned',criterion:'Actualizar riesgos y actividades según revisión humana.',evidence:'Plan de fase'},
        {name:'Cierre',status:'planned',criterion:'Comparar incidencias, respuesta y producción.',evidence:'Informe de cierre'}
      ],
      gates:[
        {label:'Responsable humano asignado',state:'ok',detail:'Laura Mejía · Agrónoma'},
        {label:'Monitoreo sanitario',state:'review',detail:'Clima favorable para monilia; sin incidencia confirmada'},
        {label:'Muestra de campo',state:'ok',detail:'18 puntos registrados DEMO'},
        {label:'Inventario asociado',state:'ok',detail:'Disponibilidad registrada'},
        {label:'Evidencia acumulada',state:'ok',detail:'91% reconstruible'}
      ]
    },
    'PL-RS-01':{
      crop:'Restauración',lot:'RES-01',objective:'Acompañar establecimiento de la franja ribereña mediante supervivencia, reposición, evidencia georreferenciada y seguimiento periódico.',
      success:'Mantener una historia verificable de establecimiento y supervivencia, diferenciando observación DEMO de impacto ambiental verificado.',
      variables:['Supervivencia','Reposición','Cobertura','Humedad','Evidencia fotográfica','Georreferencia'],
      phases:[
        {name:'Línea base',status:'done',criterion:'Área y condición inicial documentadas.',evidence:'Georreferencia + foto'},
        {name:'Establecimiento',status:'current',criterion:'Registrar supervivencia y necesidades de reposición.',evidence:'Conteo + fotografía'},
        {name:'Consolidación',status:'planned',criterion:'Revisar cobertura y estabilidad.',evidence:'Seguimiento periódico'},
        {name:'Monitoreo',status:'planned',criterion:'Mantener ventana comparable de observación.',evidence:'Series de seguimiento'},
        {name:'Cierre',status:'planned',criterion:'Separar resultado operativo de afirmación de impacto.',evidence:'Informe + metodología'}
      ],
      gates:[
        {label:'Responsable humano asignado',state:'ok',detail:'Carlos Técnico'},
        {label:'Georreferencia de línea base',state:'ok',detail:'Disponible DEMO'},
        {label:'Supervivencia',state:'review',detail:'Próximo conteo pendiente'},
        {label:'Evidencia fotográfica',state:'review',detail:'Actividad prevista 17 ago'},
        {label:'Impacto externo',state:'block',detail:'Requiere metodología/verificación antes de afirmar'}
      ]
    }
  };

  function planReviews(){try{return JSON.parse(localStorage.getItem(PLAN_REVIEW_KEY)||'[]')}catch{return []}}
  function savePlanReviews(rows){localStorage.setItem(PLAN_REVIEW_KEY,JSON.stringify(rows))}
  function selectedPlan(){const saved=localStorage.getItem(PLAN_SELECTED_KEY);return DEMO.plans.some(p=>p.id===saved)?saved:DEMO.plans[0].id}
  function planStatus(state){return state==='ok'?'<span class="status teal">OK</span>':state==='block'?'<span class="status danger">BLOQUEA CAMBIO</span>':'<span class="status warn">REVISAR</span>'}
  function phaseClass(status){return status==='done'?'done':status==='current'?'current':''}

  function plansOperational(){
    const id=selectedPlan();
    const plan=DEMO.plans.find(p=>p.id===id)||DEMO.plans[0];
    const protocol=PLAN_PROTOCOLS[plan.id];
    const lot=DEMO.lots.find(l=>l.id===plan.lot);
    const reviews=planReviews().filter(r=>r.planId===plan.id).slice(-4).reverse();
    const relatedTasks=DEMO.tasks.filter(t=>t.lot===plan.lot);
    const relatedEvidence=DEMO.evidence.filter(e=>e.lot===plan.lot);
    const blockers=protocol.gates.filter(g=>g.state==='block').length;
    const reviewsNeeded=protocol.gates.filter(g=>g.state==='review').length;

    return `${head('AGROWAY · PLAN TÉCNICO VERSIONADO','El plan deja de ser una lista: se convierte en protocolo vivo.','Objetivo, variables, fases, gates, responsables, actividades y evidencia permanecen conectados. Un cambio relevante genera revisión humana y nueva versión; la IA no aprueba manejo.',`<button class="btn primary" data-action="plan">Crear nueva versión DEMO</button>`)}
      <section class="plan-switcher">${DEMO.plans.map(p=>`<button class="${p.id===plan.id?'active':''}" data-plan-select="${p.id}"><small>${p.id} · v${p.version}</small><strong>${esc(p.name)}</strong><span>${p.lot} · ${esc(p.phase)}</span></button>`).join('')}</section>
      <section class="grid metrics" style="margin-top:14px">${metric('Avance plan',`${plan.progress}%`,`v${plan.version} · ${esc(plan.updated)}`,'good')}${metric('Fase actual',esc(plan.phase),`${lot?.crop||protocol.crop} · ${plan.lot}`)}${metric('Gates por revisar',reviewsNeeded,blockers?`${blockers} bloqueante(s)`:'sin bloqueos críticos',blockers?'warn':'good')}${metric('Evidencia ligada',`${relatedEvidence.length}`,`${lot?.evidence||0}% reconstruible`,'good')}</section>
      <section class="grid two">
        <article class="card"><div class="card-head"><div><h2>${esc(plan.name)} · v${plan.version}</h2><p>Responsable: ${esc(plan.owner)} · HUMAN_REVIEW_REQUIRED</p></div><span class="status ${blockers?'danger':'teal'}">${blockers?'REQUIERE CONDICIÓN':'PLAN ACTIVO'}</span></div><div class="card-body"><div class="section-note"><strong>Objetivo del ciclo</strong><br>${esc(protocol.objective)}</div><div class="section-note" style="margin-top:10px"><strong>Criterio de éxito</strong><br>${esc(protocol.success)}</div><div class="chip-row" style="margin-top:12px">${protocol.variables.map(v=>`<span class="chip">${esc(v)}</span>`).join('')}</div></div></article>
        <article class="card"><div class="card-head"><div><h2>Preflight del plan</h2><p>Antes de modificar una decisión relevante.</p></div><button class="text-btn" data-plan-review="${plan.id}">Registrar revisión humana</button></div><div class="card-body">${protocol.gates.map(g=>`<div class="gate"><i class="${g.state==='block'?'blocked':g.state==='review'?'warn':''}">${g.state==='ok'?'✓':g.state==='block'?'×':'!'}</i><div><strong>${esc(g.label)}</strong><p>${esc(g.detail)}</p></div>${planStatus(g.state)}</div>`).join('')}</div></article>
      </section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Protocolo por fases</h2><p>Cada transición exige criterio y evidencia definidos; la fase siguiente no se activa automáticamente.</p></div></div><div class="card-body"><div class="workflow protocol-workflow">${protocol.phases.map((ph,i)=>`<button class="stage ${phaseClass(ph.status)}" data-plan-phase="${plan.id}" data-phase-index="${i}"><span class="num">${i+1}</span><strong>${esc(ph.name)}</strong><span>${ph.status==='done'?'Cerrada':ph.status==='current'?'Fase actual':'Planificada'}</span></button>`).join('')}</div></div></section>
      <section class="grid two" style="margin-top:14px">
        <article class="card"><div class="card-head"><div><h2>Actividades heredadas del plan</h2><p>Responsable, momento y evidencia esperada.</p></div><button class="text-btn" data-view-link="field">Abrir agenda</button></div><div class="card-body">${relatedTasks.length?taskRows(relatedTasks):'<div class="empty">No hay actividades DEMO vinculadas a este lote.</div>'}</div></article>
        <article class="card"><div class="card-head"><div><h2>Revisión y evidencia</h2><p>Historia local del protocolo y pruebas vinculadas.</p></div><button class="text-btn" data-view-link="passport">Abrir Passport</button></div><div class="card-body lane">${relatedEvidence.map(e=>`<div class="row"><span class="dot"></span><div class="copy"><strong>${esc(e.title)}</strong><span>${esc(e.type)} · ${esc(e.by)}</span></div><div class="meta">${esc(e.date)}<br>${esc(e.integrity)}</div></div>`).join('')}${reviews.map(r=>`<div class="row"><span class="dot"></span><div class="copy"><strong>Revisión humana DEMO</strong><span>${esc(r.by)} · sin cambio canónico</span></div><div class="meta">${esc(r.at)}</div></div>`).join('')||(!relatedEvidence.length?'<div class="empty">Sin eventos asociados.</div>':'')}</div></article>
      </section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Reglas de versionamiento</h2><p>Cómo debe evolucionar un plan sin borrar su historia.</p></div></div><div class="card-body"><div class="workflow"><div class="stage done"><span class="num">1</span><strong>Borrador</strong><span>Objetivo + contexto</span></div><div class="stage done"><span class="num">2</span><strong>Revisión</strong><span>Responsable humano</span></div><div class="stage current"><span class="num">3</span><strong>Versión activa</strong><span>Ejecución trazable</span></div><div class="stage"><span class="num">4</span><strong>Cambio</strong><span>Motivo + evidencia</span></div><div class="stage"><span class="num">5</span><strong>Nueva versión</strong><span>Sin sobrescribir anterior</span></div></div><div class="section-note" style="margin-top:12px">SANA Intelligence puede señalar brechas o sugerir preguntas, pero no cambia fases, dosis, actividades ni versión del plan. Toda modificación relevante permanece HUMAN_REVIEW_REQUIRED y esta DEMO solo guarda eventos locales.</div></div></section>${footer()}`;
  }

  views.plans=plansOperational;

  document.addEventListener('click',event=>{
    const select=event.target.closest('[data-plan-select]');
    if(select){
      localStorage.setItem(PLAN_SELECTED_KEY,select.dataset.planSelect);
      if(typeof render==='function')render();
      return;
    }
    const review=event.target.closest('[data-plan-review]');
    if(review){
      const rows=planReviews();
      rows.push({planId:review.dataset.planReview,by:identity?.displayName||'Responsable humano DEMO',at:new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date()),localOnly:true});
      savePlanReviews(rows.slice(-40));
      storage.records.push({id:`PLAN-REVIEW-${Date.now()}`,type:'plan-review',title:'Revisión humana de plan',lot:DEMO.plans.find(p=>p.id===review.dataset.planReview)?.lot||'FIN-LE-001',createdAt:new Date().toISOString(),localOnly:true});
      persist();
      toast('Revisión humana registrada','Evento LOCAL_ONLY en la DEMO. No cambia versión, autoridad ni estado productivo.');
      if(typeof render==='function')render();
      return;
    }
    const phase=event.target.closest('[data-plan-phase]');
    if(phase){
      const protocol=PLAN_PROTOCOLS[phase.dataset.planPhase];
      const item=protocol?.phases?.[Number(phase.dataset.phaseIndex)];
      if(!item||typeof openModal!=='function')return;
      openModal('PROTOCOLO DE FASE',item.name,`<div class="fields"><label>Estado<input value="${item.status==='done'?'CERRADA':item.status==='current'?'FASE ACTUAL':'PLANIFICADA'}" readonly></label><label>Autoridad<input value="HUMAN_REVIEW_REQUIRED" readonly></label><label class="full">Criterio<textarea readonly>${esc(item.criterion)}</textarea></label><label class="full">Evidencia esperada<textarea readonly>${esc(item.evidence)}</textarea></label></div>`,false);
    }
  });
})();
