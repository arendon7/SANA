(() => {
  'use strict';

  const SELECTED_KEY='sana.v3.cycle.selected';
  function selectedPlan(){const saved=localStorage.getItem(SELECTED_KEY);return DEMO.plans.find(p=>p.id===saved)||DEMO.plans[0]}
  function impactState(){try{return JSON.parse(localStorage.getItem('sana.v3.impact.methodology')||'{}')}catch{return {}}}
  function economicSummary(planId){return window.__SANA_ECONOMICS__?.cycleSummary?.(planId)||null}
  function closureReviews(planId){return storage.records.filter(r=>r.type==='cycle-close-review'&&r.values?.planId===planId).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}
  function sourceRows(lot){const api=window.__SANA_DOCUMENT_SOURCES__;return [...(api?.forScope?.(lot)||[]),...(api?.forScope?.(DEMO.farm.id)||[])]}
  function activityRelations(planId){return (window.__SANA_ACTIVITY_RELATIONS__?.rows?.()||[]).filter(r=>r.activity?.planId===planId)}
  function workflowActivities(planId){return window.__SANA_PLAN_FIELD_WORKFLOW__?.forPlan?.(planId)||[]}
  function resultForLot(lot){return window.__SANA_PLAN_FIELD_WORKFLOW__?.resultForLot?.(lot)||null}
  function isIncidentClosed(i){return /cerrad/i.test(String(i.status||''))}

  function dossier(plan){
    const lot=DEMO.lots.find(l=>l.id===plan.lot);
    const activities=workflowActivities(plan.id);
    const relations=activityRelations(plan.id);
    const required=activities.filter(a=>a.evidenceRequired);
    const evidenceReady=required.filter(a=>a.evidence.length>0).length;
    const evidenceGaps=required.length-evidenceReady;
    const resolved=activities.filter(a=>['COMPLETED','REPROGRAMMED','NOT_EXECUTED'].includes(a.state.code));
    const open=activities.filter(a=>a.state.code==='OPEN');
    const legacy=activities.filter(a=>a.state.code==='LEGACY_DONE');
    const result=resultForLot(plan.lot);
    const incidents=DEMO.incidents.filter(i=>i.lot===plan.lot);
    const openIncidents=incidents.filter(i=>!isIncidentClosed(i));
    const economy=economicSummary(plan.id);
    const econExplicit=economy?.explicitCosts||[];
    const econSupported=economy?.supportedExplicit||[];
    const econUnallocated=economy?.unallocatedLotCosts||[];
    const econMismatch=economy?.mismatchedCosts||[];
    const sources=sourceRows(plan.lot);
    const impact=impactState();
    const reviews=closureReviews(plan.id);
    const inventoryLinks=relations.reduce((s,r)=>s+r.inventory.length,0);
    const worklogLinks=relations.reduce((s,r)=>s+r.worklogs.length,0);
    const actualEvidence=relations.reduce((s,r)=>s+r.evidence.length,0);
    const gates={
      plan:Boolean(plan?.id),
      activities:activities.length>0,
      activitiesResolved:activities.length>0&&open.length===0&&legacy.length===0,
      evidence:required.length===0||evidenceGaps===0,
      result:Boolean(result),
      economics:Boolean(economy)&&econExplicit.length>0&&econSupported.length>0&&econMismatch.length===0,
      sources:sources.length>0,
      impactReviewed:Boolean(impact.humanReviewed)
    };
    const weighted=[['plan',15],['activities',10],['activitiesResolved',15],['evidence',20],['result',15],['economics',10],['sources',5],['impactReviewed',10]];
    const completeness=weighted.reduce((sum,[key,w])=>sum+(gates[key]?w:0),0);
    const readyForArchive=gates.plan&&gates.activitiesResolved&&gates.evidence&&gates.result;
    return {plan,lot,activities,relations,required,evidenceReady,evidenceGaps,resolved,open,legacy,result,incidents,openIncidents,economy,econExplicit,econSupported,econUnallocated,econMismatch,sources,impact,reviews,inventoryLinks,worklogLinks,actualEvidence,gates,completeness,readyForArchive};
  }
  function dossiers(){return DEMO.plans.map(p=>dossier(p))}
  function tone(ok,review=false){return ok?'teal':review?'warn':'danger'}
  function resultText(d){return d.result?`${d.result.title} · ${d.result.kind}`:'Sin resultado de ciclo'}
  function lastReview(d){return d.reviews[0]||null}
  function money(n){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0)}catch{return `${Number(n)||0} COP`}}

  function gateRow(label,ok,detail,review=false){return `<div class="gate"><i class="${ok?'':review?'warn':'blocked'}">${ok?'✓':review?'!':'×'}</i><div><strong>${esc(label)}</strong><p>${esc(detail)}</p></div><span class="status ${tone(ok,review)}">${ok?'OK':review?'REVISAR':'BRECHA'}</span></div>`}

  function cycleClosure(){
    const plan=selectedPlan();const d=dossier(plan);const review=lastReview(d);
    const role=window.__SANA_ACCESS__?.role||'new_user';const canReview=['admin','technical','producer'].includes(role);
    return `${head('SANA · CIERRE DE CICLO','Cerrar la historia, no fabricar una conclusión.','El expediente reúne plan/versión, actividades, cierres, evidencia aportada, incidencias, referencias de inventario y jornadas, resultado, economía contractual y procedencia de impacto. La completitud mide reconstrucción documental: no rendimiento, rentabilidad, causalidad ni certificación.',canReview?'<button class="btn primary" data-cycle-review>Registrar revisión humana</button>':'')}
      <section class="plan-switcher">${DEMO.plans.map(p=>`<button class="${p.id===plan.id?'active':''}" data-cycle-select="${p.id}"><small>${p.id} · v${p.version}</small><strong>${esc(p.name)}</strong><span>${p.lot} · ${esc(p.phase)}</span></button>`).join('')}</section>
      <section class="grid metrics" style="margin-top:14px">${metric('Completitud expediente',`${d.completeness}%`,'documentación y procedencia · NO desempeño',d.completeness>=80?'good':'warn')}${metric('Actividades resueltas',`${d.resolved.length}/${d.activities.length}`,`${d.open.length} abiertas · ${d.legacy.length} legacy`,d.open.length||d.legacy.length?'warn':'good')}${metric('Evidencia requerida',`${d.evidenceReady}/${d.required.length}`,`${d.evidenceGaps} brecha(s)`,d.evidenceGaps?'warn':'good')}${metric('Resultado del ciclo',d.result?'DISPONIBLE':'PENDIENTE',resultText(d),d.result?'good':'warn')}</section>
      <section class="grid two"><article class="card"><div class="card-head"><div><h2>${esc(plan.name)} · v${plan.version}</h2><p>${plan.lot} · ${esc(d.lot?.crop||'Unidad')} · ${esc(plan.phase)}</p></div><span class="status ${d.readyForArchive?'teal':'warn'}">${d.readyForArchive?'BASE DOCUMENTAL CERRABLE':'BRECHAS ABIERTAS'}</span></div><div class="card-body"><div class="section-note"><strong>Estado del expediente</strong><br>${d.readyForArchive?'Plan, actividades, evidencia y resultado cumplen los mínimos documentales DEMO para revisión de archivo.':'El expediente todavía tiene brechas documentales. Puede revisarse, pero no declararse completo.'}</div><div class="chip-row" style="margin-top:12px"><span class="chip">Inventario vinculado: ${d.inventoryLinks}</span><span class="chip">Jornadas vinculadas: ${d.worklogLinks}</span><span class="chip">Pruebas activityId: ${d.actualEvidence}</span><span class="chip">Fuentes documentales: ${d.sources.length}</span></div>${review?`<div class="section-note" style="margin-top:12px"><strong>Última revisión humana</strong><br>${esc(review.values?.status||'REVISADO DEMO')} · ${esc(review.values?.reviewer||'Responsable')} · ${esc(review.values?.cutoff||String(review.createdAt||'').slice(0,10))}<br>${esc(review.values?.detail||'Sin observación')}</div>`:''}</div></article>
      <article class="card"><div class="card-head"><div><h2>Gates de cierre documental</h2><p>Los gates controlan completitud del expediente, no decisiones agronómicas.</p></div></div><div class="card-body">${gateRow('Plan y versión',d.gates.plan,`${plan.id} v${plan.version}`)}${gateRow('Actividades resueltas',d.gates.activitiesResolved,`${d.open.length} abiertas · ${d.legacy.length} cierres legacy`,d.activities.length>0)}${gateRow('Evidencia realmente aportada',d.gates.evidence,`${d.evidenceGaps} actividad(es) requieren prueba`,d.required.length>0)}${gateRow('Resultado productivo',d.gates.result,resultText(d),true)}${gateRow('Economía explícita con soporte',d.gates.economics,d.economy?`${d.econExplicit.length} costo(s) asignados al plan · ${d.econSupported.length} con soporte · ${d.econMismatch.length} mismatch`:'Read-model económico no disponible',true)}${gateRow('Fuentes documentales',d.gates.sources,`${d.sources.length} referencia(s) REFERENCE_ONLY`,true)}${gateRow('Metodología de impacto revisada',d.gates.impactReviewed,d.impact.humanReviewed?`Revisada por ${d.impact.by||'responsable DEMO'}`:'HUMAN_REVIEW_REQUIRED; no verificación externa',true)}</div></article></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Actividad y relaciones explícitas</h2><p>El cierre no genera eventos laterales por inferencia.</p></div></div><div class="card-body">${d.relations.length?d.relations.map(r=>`<div class="row"><span class="dot ${r.activity?.needsEvidence?'warn':''}"></span><div class="copy"><strong>${esc(r.activity?.id||'—')} · ${esc(r.activity?.title||'Actividad')}</strong><span>${esc(r.activity?.state?.label||'—')} · evidencia ${r.evidence.length} · inventario ${r.inventory.length} · jornadas ${r.worklogs.length}</span></div><div class="meta">${esc(r.activity?.phase||'—')}</div></div>`).join(''):'<div class="empty">No hay relaciones Activity Contract para esta versión.</div>'}<div class="section-note" style="margin-top:12px">ACTIVITY CLOSE ≠ INVENTORY MOVEMENT ≠ WORKLOG ≠ IMPACT CLAIM.</div></div></article><article class="card"><div class="card-head"><div><h2>Resultado, incidencias y economía</h2><p>Tres capas separadas; ninguna se infiere de otra.</p></div></div><div class="card-body">${gateRow('Resultado observado / baseline',Boolean(d.result),resultText(d),true)}${gateRow('Incidencias abiertas',d.openIncidents.length===0,`${d.openIncidents.length} abierta(s) de ${d.incidents.length} registrada(s)`,d.incidents.length>0)}${gateRow('Costos explícitos del ciclo',d.econExplicit.length>0,d.economy?`${d.econExplicit.length} registro(s) · ${money(d.economy.explicitAmount)} · soporte ${d.economy.evidenceCoverage}%`:'Sin contrato económico',true)}${gateRow('Costos de lote no asignados',d.econUnallocated.length===0,`${d.econUnallocated.length} registro(s) existen en el lote pero NO se imputan al ciclo`,d.econUnallocated.length>0)}<div class="section-note" style="margin-top:12px">BASELINE_DEMO ≠ ITEMIZED_CYCLE_COST. El baseline agregado de ${money(d.economy?.baseRecorded||0)} permanece como contexto del lote y no completa el gate económico del plan. No se infiere venta, ingreso, utilidad ni margen contable.</div></div></article></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Procedencia documental e impacto</h2><p>Qué fuentes sostienen la lectura y qué no puede concluirse.</p></div></div><div class="card-body">${d.sources.map(s=>`<div class="row"><span class="dot warn"></span><div class="copy"><strong>${esc(s.name)}</strong><span>${esc(s.scope)} · ${esc(s.version)} · corte ${esc(s.cut)}</span></div><div class="meta"><span class="status warn">REFERENCE_ONLY</span></div></div>`).join('')||'<div class="empty">Sin referencias documentales aplicables.</div>'}<div class="section-note" style="margin-top:12px">La procedencia operativa puede respaldar un método o una medición. No demuestra que una actividad haya causado un cambio de suelo, agua, biodiversidad, carbono, rendimiento o rentabilidad.</div></div></article><article class="card"><div class="card-head"><div><h2>Salidas del cierre</h2><p>El expediente sirve como índice hacia las capas fuente.</p></div></div><div class="card-body"><div class="quick-grid" style="grid-template-columns:1fr 1fr"><button class="quick" data-view-link="plans"><strong>Plan</strong><span>Versión, fase y gates.</span></button><button class="quick" data-view-link="passport"><strong>Passport</strong><span>Cadena de evidencia.</span></button><button class="quick" data-view-link="economics"><strong>Economía</strong><span>Costos, soportes y asignación.</span></button><button class="quick" data-view-link="impact"><strong>Impacto</strong><span>Método y verificación.</span></button><button class="quick" data-view-link="reports"><strong>Informe</strong><span>Corte versionado y procedencia.</span></button><button class="quick" data-view-link="capital"><strong>Readiness</strong><span>Lectura de preparación; sin oferta.</span></button></div></div></article></section>${footer()}`;
  }

  views.cycle=cycleClosure;
  window.__SANA_CYCLE_CLOSURE__=Object.freeze({dossier:dossier,dossiers:()=>dossiers().map(d=>({...d})),selectedPlan});

  function openReview(){
    const d=dossier(selectedPlan());
    const statusOptions=d.readyForArchive?'<option>LISTO PARA ARCHIVO DEMO</option><option>REVISADO CON BRECHAS</option>':'<option>REVISADO CON BRECHAS</option>';
    openModal('CIERRE DE CICLO · REVISIÓN HUMANA','Registrar revisión del expediente',`<div class="fields"><input type="hidden" name="planId" value="${esc(d.plan.id)}"><input type="hidden" name="lot" value="${esc(d.plan.lot)}"><label>Plan / versión<input value="${esc(d.plan.id)} · v${d.plan.version}" readonly></label><label>Completitud<input value="${d.completeness}% · DOCUMENTAL" readonly></label><label>Estado<select name="status">${statusOptions}</select></label><label>Fecha de corte<input name="cutoff" type="date" required></label><label>Revisor humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Observación / brechas<textarea name="detail" required placeholder="Qué está completo, qué falta y qué no puede concluirse"></textarea></label><label class="full">Frontera<input value="REVISIÓN DEMO · NO CERTIFICA CULTIVO, CONTABILIDAD, IMPACTO NI INVERSIÓN" readonly></label></div>`,true,'cycle-close-review');
  }
  document.addEventListener('click',event=>{
    const select=event.target.closest('[data-cycle-select]');if(select){localStorage.setItem(SELECTED_KEY,select.dataset.cycleSelect);if(typeof render==='function')render();return;}
    if(event.target.closest('[data-cycle-review]'))openReview();
  });
})();
