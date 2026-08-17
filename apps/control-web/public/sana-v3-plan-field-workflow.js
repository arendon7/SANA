(() => {
  'use strict';

  const BASE_CONTRACTS={
    'T-101':{planId:'PL-AG-03',planVersion:3,lot:'AGU-A2',phase:'Cuajado',expectedEvidence:'Lecturas multisitio + observación de campo',evidenceRequired:true},
    'T-102':{planId:'PL-CF-04',planVersion:4,lot:'CAF-A1',phase:'Llenado de fruto',expectedEvidence:'Registro fenológico + soporte de campo',evidenceRequired:true},
    'T-103':{planId:'PL-CA-02',planVersion:2,lot:'CAC-B1',phase:'Floración',expectedEvidence:'Monitoreo de puntos + evidencia sanitaria',evidenceRequired:true},
    'T-105':{planId:'PL-CF-04',planVersion:4,lot:'CAF-A1',phase:'Llenado de fruto',expectedEvidence:'Registro de ejecución + evidencia de aplicación',evidenceRequired:true},
    'T-106':{planId:'PL-AG-03',planVersion:3,lot:'AGU-A2',phase:'Cuajado',expectedEvidence:'Lectura CE + contexto de medición',evidenceRequired:true},
    'T-107':{planId:'PL-RS-01',planVersion:1,lot:'RES-01',phase:'Establecimiento',expectedEvidence:'Evidencia fotográfica de supervivencia',evidenceRequired:true}
  };

  function parsePlanRef(value=''){
    const [planId,lot,phase]=String(value).split('|');
    const plan=DEMO.plans.find(p=>p.id===planId);
    return {planId:plan?.id||planId,lot:lot||plan?.lot||'FIN-LE-001',phase:phase||plan?.phase||'Fase vigente',planVersion:plan?.version||1};
  }
  function records(type){return storage.records.filter(r=>r.type===type)}
  function localActivities(){
    return records('plan-activity').map(r=>{
      const ref=parsePlanRef(r.values?.planRef||r.values?.planId||'');
      return {id:r.values?.activityId||r.id,lot:r.values?.lot||ref.lot,planId:ref.planId,planVersion:ref.planVersion,phase:r.values?.phase||ref.phase,title:r.values?.title||r.title||'Actividad de plan',owner:r.values?.owner||identity?.displayName||'Responsable DEMO',when:r.values?.when||'Sin fecha',priority:r.values?.priority||'Media',expectedEvidence:r.values?.expectedEvidence||'Registro estructurado de ejecución',evidenceRequired:r.values?.evidenceRequired!=='false',local:true};
    });
  }
  function baselineActivities(){
    return DEMO.tasks.map(t=>{
      const c=BASE_CONTRACTS[t.id];
      return {id:t.id,lot:t.lot,planId:c?.planId||null,planVersion:c?.planVersion||null,phase:c?.phase||'Operación general',title:t.title,owner:t.owner,when:t.when,priority:t.priority,expectedEvidence:c?.expectedEvidence||t.evidence||'Registro de campo',evidenceRequired:Boolean(c?.evidenceRequired),local:false,legacyDone:storage.done.has(t.id)};
    });
  }
  function allActivities(){return [...baselineActivities(),...localActivities()]}
  function evidenceFor(activityId){return records('activity-evidence').filter(r=>r.values?.activityId===activityId)}
  function closuresFor(activityId){return records('activity-close').filter(r=>r.values?.activityId===activityId)}
  function latestClosure(activityId){return closuresFor(activityId).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0]||null}
  function state(activity){
    const close=latestClosure(activity.id);
    if(close){const s=close.values?.status||'CERRADA';return {code:s==='Completada'?'COMPLETED':s==='Reprogramada'?'REPROGRAMMED':'NOT_EXECUTED',label:s,source:'WORKFLOW_EVENT'};}
    if(activity.legacyDone)return {code:'LEGACY_DONE',label:'Cierre previo sin contrato',source:'LEGACY_SANDBOX'};
    return {code:'OPEN',label:'Abierta',source:'PLAN_ACTIVITY'};
  }
  function effective(activity){
    const ev=evidenceFor(activity.id); const close=latestClosure(activity.id); const st=state(activity);
    const evidenceReady=!activity.evidenceRequired||ev.length>0;
    return {...activity,evidence:ev,closure:close,state:st,evidenceReady,needsEvidence:activity.evidenceRequired&&!ev.length};
  }
  function activities(){return allActivities().map(effective)}
  function forLot(lot){return activities().filter(a=>a.lot===lot)}
  function forPlan(planId){return activities().filter(a=>a.planId===planId)}
  function findActivity(id){return activities().find(a=>a.id===id)}
  function selectedPlan(){const saved=localStorage.getItem('sana.v3.plan.selected');return DEMO.plans.find(p=>p.id===saved)||DEMO.plans[0]}
  function resultForLot(lot){
    const local=storage.records.filter(r=>r.type==='harvest-result'&&(r.lot===lot||r.values?.lot===lot)).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if(local)return {kind:'LOCAL_ONLY',title:`${local.values?.quantity||'—'} ${local.values?.unit||''}`,detail:local.values?.quality||'Sin clasificación'};
    const base=window.__SANA_RESULT_BASE__?.[lot];
    return base?{kind:'BASELINE_DEMO',title:`${base.observed} ${base.unit}`,detail:base.quality}:null;
  }
  function tone(a){return a.state.code==='COMPLETED'?'teal':a.state.code==='NOT_EXECUTED'?'danger':a.needsEvidence?'warn':''}
  function insertBeforeFooter(html,section){const marker='<footer class="footer-note">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}

  function activityCard(a){
    const result=resultForLot(a.lot);
    return `<article class="card"><div class="card-head"><div><h2>${esc(a.title)}</h2><p>${esc(a.id)} · ${esc(a.lot)} · ${a.planId?`${esc(a.planId)} v${a.planVersion} · ${esc(a.phase)}`:'SIN PLAN ASOCIADO'}</p></div><span class="status ${tone(a)}">${esc(a.state.label)}</span></div><div class="card-body"><div class="chip-row"><span class="chip">Responsable: ${esc(a.owner)}</span><span class="chip">${esc(a.when)}</span><span class="chip">Prioridad ${esc(a.priority)}</span>${a.local?'<span class="chip">LOCAL/NUBE DEMO</span>':''}</div><div class="section-note" style="margin-top:10px"><strong>Evidencia esperada</strong><br>${esc(a.expectedEvidence)} · ${a.evidenceRequired?'REQUERIDA PARA CIERRE COMPLETADO':'NO BLOQUEANTE'}</div><div class="workflow" style="margin-top:12px"><div class="stage ${a.planId?'done':''}"><span class="num">1</span><strong>Plan</strong><span>${a.planId?`${esc(a.planId)} v${a.planVersion}`:'Sin vínculo'}</span></div><div class="stage ${a.state.code!=='OPEN'?'done':'current'}"><span class="num">2</span><strong>Campo</strong><span>${a.state.code==='OPEN'?'Pendiente':'Evento registrado'}</span></div><div class="stage ${a.evidence.length?'done':a.evidenceRequired?'current':''}"><span class="num">3</span><strong>Evidencia</strong><span>${a.evidence.length?`${a.evidence.length} registro(s)`:a.evidenceRequired?'Pendiente':'Opcional'}</span></div><div class="stage ${a.state.code==='COMPLETED'?'done':''}"><span class="num">4</span><strong>Cierre</strong><span>${esc(a.state.label)}</span></div><div class="stage ${result?'done':''}"><span class="num">5</span><strong>Resultado ciclo</strong><span>${result?esc(result.kind):'Aún no registrado'}</span></div></div><div class="head-actions" style="margin-top:12px"><button class="btn secondary" data-workflow-evidence="${esc(a.id)}">Registrar evidencia</button><button class="btn primary" data-workflow-close="${esc(a.id)}">Cerrar / reprogramar</button></div>${a.evidence.length?`<div class="timeline" style="margin-top:12px">${a.evidence.slice().reverse().map(e=>`<div class="timeline-item"><i></i><div><strong>${esc(e.values?.evidenceType||'Evidencia')}</strong><p>${esc(e.values?.detail||'Sin detalle')} · ${esc(e.values?.responsible||'Responsable DEMO')}</p></div><time>${esc(e.values?.observedAt||String(e.createdAt||'').slice(0,10))}</time></div>`).join('')}</div>`:''}</div></article>`;
  }

  function workflowSection(list,title='Actividades con contrato Plan → Campo → Evidencia'){
    const planned=list.filter(a=>a.planId).length, open=list.filter(a=>a.state.code==='OPEN').length, evidenceGap=list.filter(a=>a.needsEvidence).length, completed=list.filter(a=>a.state.code==='COMPLETED').length;
    return `<section style="margin-top:14px"><div class="card-head"><div><h2>${esc(title)}</h2><p>Cada actividad conserva plan/versión, lote, fase, responsable, evidencia esperada, ejecución y cierre.</p></div><button class="btn primary" data-workflow-create>Nueva actividad vinculada</button></div><section class="grid metrics">${metric('Con plan',planned,'actividad + versión explícita','good')}${metric('Abiertas',open,'requieren ejecución')}${metric('Brechas de evidencia',evidenceGap,'no permiten cierre “Completada”',evidenceGap?'warn':'good')}${metric('Completadas',completed,'con evento de cierre DEMO','good')}</section><section class="grid two">${list.map(activityCard).join('')||'<div class="empty">No hay actividades en este alcance.</div>'}</section></section>`;
  }

  const originalField=views.field;
  views.field=function planFieldWorkflowView(){
    const list=activities();
    return `${head('AGROWAY · CAMPO CON CONTRATO DE PLAN','Ejecutar sin perder el porqué.','La actividad nace de una versión de plan o queda explícitamente como operación general. Evidencia y cierre son eventos separados; LOCAL_ONLY nunca equivale a ACK.',`<button class="btn primary" data-workflow-create>Nueva actividad de plan</button><button class="btn secondary" data-action="fieldRecord">Captura libre</button>`)}${workflowSection(list,'Agenda trazable de campo')}<section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Contrato offline</h2><p>Persistencia por identidad sin afirmar sincronización productiva.</p></div><span class="status warn">${storage.queue.length} PENDING_SERVER</span></div><div class="card-body">${queueRows()}<div class="section-note" style="margin-top:12px">LOCAL_ONLY ≠ SYNCED ≠ ACK. El cierre de workflow es un evento DEMO, no una autorización agronómica, orden de trabajo externa ni prueba regulatoria.</div></div></article><article class="card"><div class="card-head"><div><h2>Resultado del ciclo</h2><p>El resultado productivo es posterior y separado del resultado de una actividad.</p></div></div><div class="card-body"><div class="quick-grid" style="grid-template-columns:1fr 1fr"><button class="quick" data-view-link="plans"><strong>Plan versionado</strong><span>Objetivo, fase y gates.</span></button><button class="quick" data-view-link="passport"><strong>Passport</strong><span>Reconstrucción de la cadena.</span></button><button class="quick" data-view-link="results"><strong>Cosecha / resultado</strong><span>Dato observado del ciclo.</span></button><button class="quick" data-view-link="inventory"><strong>Inventario</strong><span>Movimientos separados del cierre.</span></button></div></div></article></section>${footer()}`;
  };

  const originalPlans=views.plans;
  views.plans=function plansWithActivityContracts(){
    const html=originalPlans(); const plan=selectedPlan(); const list=forPlan(plan.id);
    const section=`<section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Actividades de esta versión</h2><p>${esc(plan.id)} v${plan.version} · ${esc(plan.phase)} · el plan no cambia de fase automáticamente por cerrar actividades.</p></div><button class="btn primary" data-workflow-create>Nueva actividad de esta versión</button></div><div class="card-body">${list.length?list.map(a=>`<div class="row"><span class="dot ${a.needsEvidence?'warn':''}"></span><div class="copy"><strong>${esc(a.title)}</strong><span>${esc(a.id)} · ${esc(a.owner)} · evidencia: ${a.evidence.length}/${a.evidenceRequired?'requerida':'opcional'}</span></div><div class="meta"><span class="status ${tone(a)}">${esc(a.state.label)}</span></div></div>`).join(''):'<div class="empty">No hay actividades vinculadas a esta versión.</div>'}</div></section>`;
    return insertBeforeFooter(html,section);
  };

  function openCreate(){
    const plan=selectedPlan(); const activityId=`ACT-${Date.now()}`;
    const planRef=`${plan.id}|${plan.lot}|${plan.phase}`;
    openModal('PLAN → CAMPO · DEMO','Nueva actividad vinculada',`<div class="fields"><input type="hidden" name="activityId" value="${activityId}"><input type="hidden" name="planRef" value="${esc(planRef)}"><input type="hidden" name="lot" value="${esc(plan.lot)}"><label>Plan / versión<input value="${esc(plan.id)} · v${plan.version}" readonly></label><label>Fase<input name="phase" value="${esc(plan.phase)}" readonly></label><label class="full">Actividad<input name="title" required placeholder="Qué debe realizarse"></label><label>Responsable<input name="owner" value="${esc(identity?.displayName||plan.owner||'Responsable DEMO')}" required></label><label>Fecha / ventana<input name="when" type="date" required></label><label>Prioridad<select name="priority"><option>Media</option><option>Alta</option><option>Baja</option></select></label><label class="full">Evidencia esperada<input name="expectedEvidence" required placeholder="Qué prueba permitirá reconstruir la ejecución"></label><label class="full">Contrato<input value="PLAN_VERSIONED · HUMAN_REVIEW_REQUIRED · LOCAL/NUBE DEMO" readonly></label></div>`,true,'plan-activity');
  }
  function openEvidence(activity){
    openModal('CAMPO → EVIDENCIA · DEMO',`Evidencia · ${activity.id}`,`<div class="fields"><input type="hidden" name="activityId" value="${esc(activity.id)}"><input type="hidden" name="lot" value="${esc(activity.lot)}"><input type="hidden" name="planId" value="${esc(activity.planId||'')}"><label>Tipo de evidencia<select name="evidenceType"><option>Registro estructurado</option><option>Foto DEMO</option><option>Lectura / medición DEMO</option><option>Documento de soporte DEMO</option><option>Observación técnica DEMO</option></select></label><label>Fecha observada<input name="observedAt" type="date" required></label><label>Responsable<input name="responsible" value="${esc(identity?.displayName||activity.owner)}" required></label><label>Procedencia<select name="provenance"><option>OBSERVADO DEMO</option><option>MEDIDO DEMO</option><option>DECLARADO DEMO</option><option>DOCUMENTAL DEMO</option></select></label><label class="full">Detalle<textarea name="detail" required placeholder="Qué evidencia existe y qué demuestra exactamente"></textarea></label><label class="full">Integridad<input value="LOCAL/NUBE DEMO · EVIDENCIA ≠ VERIFICACIÓN EXTERNA" readonly></label></div>`,true,'activity-evidence');
  }
  function openClose(activity){
    if(activity.evidenceRequired&&!activity.evidence.length){toast('Evidencia requerida','Esta actividad exige al menos una evidencia registrada antes de marcarla como Completada. Puedes reprogramarla o registrar primero la evidencia.','warn')}
    const completedDisabled=activity.evidenceRequired&&!activity.evidence.length?'disabled':'';
    openModal('EJECUCIÓN → CIERRE · DEMO',`Cerrar actividad · ${activity.id}`,`<div class="fields"><input type="hidden" name="activityId" value="${esc(activity.id)}"><input type="hidden" name="lot" value="${esc(activity.lot)}"><input type="hidden" name="planId" value="${esc(activity.planId||'')}"><label>Estado<select name="status"><option ${completedDisabled}>Completada</option><option>Reprogramada</option><option>No ejecutada</option></select></label><label>Fecha<input name="completedAt" type="date" required></label><label>Responsable<input name="responsible" value="${esc(identity?.displayName||activity.owner)}" required></label><label>Evidencias enlazadas<input value="${activity.evidence.length}" readonly></label><label class="full">Resultado de la actividad<textarea name="outcome" required placeholder="Qué ocurrió en esta actividad; no confundir con cosecha/resultado del ciclo"></textarea></label><label class="full">Frontera<input value="CIERRE DEMO · NO CAMBIA FASE DEL PLAN · NO AUTORIZA MANEJO" readonly></label></div>`,true,'activity-close');
  }

  document.addEventListener('click',event=>{
    const create=event.target.closest('[data-workflow-create]'); if(create){openCreate();return;}
    const evidence=event.target.closest('[data-workflow-evidence]'); if(evidence){const a=findActivity(evidence.dataset.workflowEvidence);if(a)openEvidence(a);return;}
    const close=event.target.closest('[data-workflow-close]'); if(close){const a=findActivity(close.dataset.workflowClose);if(a)openClose(a);}
  });

  window.__SANA_PLAN_FIELD_WORKFLOW__=Object.freeze({activities,forLot,forPlan,findActivity,evidenceFor,closuresFor,resultForLot,baseContracts:Object.freeze({...BASE_CONTRACTS})});
})();
