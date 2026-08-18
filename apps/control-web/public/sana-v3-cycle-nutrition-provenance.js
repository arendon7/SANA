(() => {
  'use strict';
  const nutritionApi=()=>window.__SANA_NUTRITION_LEDGER__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;

  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);
    if(!plan)return {valid:false,cases:[]};
    const cases=(nutritionApi()?.forLot?.(plan.lot)||[]).map(c=>({caseId:c.id,lot:c.lot,objective:c.objective,stageCoverage:c.stageCoverage?.percent??0,programs:c.programs?.length??0,preflight:c.preflight?.length??0,decisions:c.decisions?.length??0,approvedDecisions:c.semantics?.approvedDecisions??0,deferredDecisions:c.semantics?.deferredDecisions??0,applications:c.applications?.length??0,evidence:c.evidence?.length??0,responses:c.responses?.length??0,relationIssues:c.semantics?.relationIssues??0,causalClaims:c.semantics?.causalClaims??0,latestResponse:c.latestResponse?.responseClass||'',latestAttribution:c.latestResponse?.causalAttribution||''}));
    return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},cases,integrity:'NUTRITION_PROVENANCE ≠ CYCLE_GATE ≠ APPLICATION_AUTHORIZATION ≠ INVENTORY_DISPATCH ≠ PERFORMANCE ≠ CAUSAL_EFFECT'};
  }
  function selected(){const p=cycleApi()?.selectedPlan?.();return p?forPlan(p.id):{valid:false,cases:[]}}
  function panel(){
    const s=selected();if(!s.valid)return '';
    if(!s.cases.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · NUTRICIÓN / FERTIRRIEGO</p><h2>Sin cadena nutricional explícita vinculada</h2><p>Ausencia de captura no demuestra ausencia de manejo. Esta capa no modifica los gates de cierre.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    const applied=s.cases.reduce((n,c)=>n+c.applications,0),deferred=s.cases.reduce((n,c)=>n+c.deferredDecisions,0),evidence=s.cases.reduce((n,c)=>n+c.evidence,0),issues=s.cases.reduce((n,c)=>n+c.relationIssues,0),avg=Math.round(s.cases.reduce((n,c)=>n+c.stageCoverage,0)/s.cases.length);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · NUTRICIÓN / FERTIRRIEGO</p><h2>Procedencia nutricional del ciclo</h2><p>${esc(s.plan.id)} v${s.plan.version} · lote ${esc(s.plan.lot)} · lectura documental viva y no ponderada.</p></div><span class="status ${issues?'danger':'teal'}">${s.cases.length} CASO(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Cobertura media',`${avg}%`,'cadena explícita · no desempeño')}${metric('Aplicaciones',applied,'solo ejecución registrada')}${metric('Decisiones aplazadas',deferred,'programa ≠ aplicación')}${metric('Evidencias',evidence,'aplicación ≠ prueba por sí sola')}${metric('Relaciones a revisar',issues,'actividad / inventario',issues?'warn':'good')}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Caso</th><th>Cadena</th><th>Decisión</th><th>Aplicación / evidencia</th><th>Respuesta</th></tr></thead><tbody>${s.cases.map(c=>`<tr><td><strong>${esc(c.caseId)}</strong><br><small>${esc(c.objective||'—')}</small></td><td>${c.stageCoverage}%</td><td>${c.approvedDecisions} aprobada(s) · ${c.deferredDecisions} aplazada(s)</td><td>${c.applications} aplicación(es) · ${c.evidence} evidencia(s)${c.relationIssues?`<br><small>${c.relationIssues} relación(es) a revisar</small>`:''}</td><td>${c.responses}<br><small>${esc(c.latestResponse||'sin respuesta')} · ${esc(c.latestAttribution||'sin atribución')}</small></td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px">NUTRITION_PROVENANCE ≠ CYCLE_GATE ≠ APPLICATION_AUTHORIZATION ≠ INVENTORY_DISPATCH ≠ PERFORMANCE ≠ CAUSAL_EFFECT. No modifica completeness ni readyForArchive.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const base=views.cycle;if(base)views.cycle=()=>insert(base(),panel());
  window.__SANA_CYCLE_NUTRITION__=Object.freeze({forPlan,selected,integrity:'NUTRITION_PROVENANCE ≠ CYCLE_GATE ≠ APPLICATION_AUTHORIZATION ≠ INVENTORY_DISPATCH ≠ PERFORMANCE ≠ CAUSAL_EFFECT'});
})();
