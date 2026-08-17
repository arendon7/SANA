(() => {
  'use strict';

  function workflow(){return window.__SANA_PLAN_FIELD_WORKFLOW__}
  function activities(){return workflow()?.activities?.()||[]}
  function relationFor(activityId){
    const activity=workflow()?.findActivity?.(activityId)||activities().find(a=>a.id===activityId)||null;
    const inventory=window.__SANA_INVENTORY__?.forActivity?.(activityId)||[];
    const worklogs=window.__SANA_TEAM_WORKLOGS__?.forActivity?.(activityId)||[];
    const result=activity?workflow()?.resultForLot?.(activity.lot)||null:null;
    return {activity,inventory,worklogs,result,evidence:activity?.evidence||[],closure:activity?.closure||null};
  }
  function relations(){return activities().map(a=>relationFor(a.id))}
  function insertBeforeFooter(html,section){const marker='<footer class="footer-note">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}
  function linkedCount(){const rows=relations();return {inventory:rows.reduce((s,r)=>s+r.inventory.length,0),worklogs:rows.reduce((s,r)=>s+r.worklogs.length,0),evidence:rows.reduce((s,r)=>s+r.evidence.length,0),closed:rows.filter(r=>r.activity?.state?.code==='COMPLETED').length}}
  function relationRows(scope){
    const rows=relations().filter(r=>!scope||r.activity?.lot===scope||r.activity?.planId===scope);
    return rows.map(r=>`<div class="row"><span class="dot ${r.activity?.needsEvidence?'warn':''}"></span><div class="copy"><strong>${esc(r.activity?.id||'—')} · ${esc(r.activity?.title||'Actividad')}</strong><span>${esc(r.activity?.lot||'—')} · inventario ${r.inventory.length} · jornadas ${r.worklogs.length} · evidencias ${r.evidence.length}${r.result?` · resultado ${esc(r.result.kind)}`:''}</span></div><div class="meta"><span class="status ${r.activity?.state?.code==='COMPLETED'?'teal':r.activity?.needsEvidence?'warn':''}">${esc(r.activity?.state?.label||'—')}</span></div></div>`).join('')||'<div class="empty">No hay relaciones explícitas en este alcance.</div>';
  }
  function relationsSection(scope,title='Relaciones del Activity Contract'){
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><h2>${esc(title)}</h2><p>Los vínculos se crean por referencia explícita a activityId. Cerrar una actividad no crea movimientos, horas ni impacto por inferencia.</p></div><span class="status">REFERENCE BY ID</span></div><div class="card-body">${relationRows(scope)}<div class="section-note" style="margin-top:12px">ACTIVITY CLOSE ≠ INVENTORY MOVEMENT ≠ WORKLOG ≠ IMPACT CLAIM. Cada evento conserva su propia procedencia y autoridad.</div></div></section>`;
  }

  const baseField=views.field;
  if(baseField)views.field=function fieldWithRelations(){return insertBeforeFooter(baseField(),relationsSection(null,'Actividad → inventario → jornada → resultado'))};

  const basePlans=views.plans;
  if(basePlans)views.plans=function plansWithRelations(){const planId=localStorage.getItem('sana.v3.plan.selected')||DEMO.plans[0]?.id;return insertBeforeFooter(basePlans(),relationsSection(planId,'Relaciones de la versión seleccionada'))};

  const basePassport=views.passport;
  if(basePassport)views.passport=function passportWithRelations(){const lot=localStorage.getItem('sana.v3.passport.lot')||'CAF-A1';return insertBeforeFooter(basePassport(),relationsSection(lot,'Relaciones operativas del expediente'))};

  const baseImpact=views.impact;
  if(baseImpact)views.impact=function impactWithActivityProvenance(){
    const c=linkedCount();const rows=relations();const completed=rows.filter(r=>r.activity?.state?.code==='COMPLETED');const completedWithEvidence=completed.filter(r=>r.evidence.length>0).length;
    const section=`<section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Procedencia operativa desde Activity Contract</h2><p>Input para calidad y trazabilidad metodológica; no recalcula automáticamente indicadores ni demuestra causalidad.</p></div><span class="status warn">NO ATTRIBUTION</span></div><div class="card-body"><section class="grid metrics">${metric('Actividades con contrato',rows.length,'plan/versión/lote/fase')}${metric('Cierres completados',c.closed,'evento de cierre DEMO')}${metric('Cierres con evidencia',completedWithEvidence,completed.length?`${Math.round(completedWithEvidence/completed.length*100)}% de cierres`:'sin cierres aún',completed.length&&completedWithEvidence===completed.length?'good':'warn')}${metric('Movimientos vinculados',c.inventory,'referencia activityId')}${metric('Jornadas vinculadas',c.worklogs,'referencia activityId')}</section><div class="section-note" style="margin-top:12px"><strong>Uso permitido:</strong> documentar procedencia de una medición, actividad o cálculo. <strong>No permitido:</strong> inferir que la actividad causó un cambio de suelo, agua, biodiversidad, carbono, productividad o rentabilidad.</div></div></section>`;
    return insertBeforeFooter(baseImpact(),section);
  };

  window.__SANA_ACTIVITY_RELATIONS__=Object.freeze({forActivity:relationFor,rows:relations,counts:linkedCount});
})();
