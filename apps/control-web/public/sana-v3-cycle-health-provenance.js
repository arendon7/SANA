(() => {
  'use strict';
  const healthApi=()=>window.__SANA_PHYTOSANITARY_LEDGER__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;

  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);
    if(!plan)return {valid:false,explicit:[],legacy:[]};
    const data=healthApi()?.forLot?.(plan.lot)||{explicit:[],legacy:[]};
    const explicit=data.explicit.map(c=>({caseId:c.id,lot:c.lot,scope:c.scope,stageCoverage:c.stageCoverage?.percent??0,observedPresence:c.semantics?.observedPresence??0,confirmedDiagnosis:c.semantics?.confirmedDiagnosis??0,actions:c.actions?.length??0,evidence:c.evidence?.length??0,followups:c.followups?.length??0,efficacyObservations:c.semantics?.efficacyObservations??0,actionLinkIssues:c.semantics?.actionLinkIssues??0,latestResult:c.latestFollowUp?.resultClass||'',latestEffect:c.latestFollowUp?.effectivenessObserved||''}));
    const legacy=data.legacy.map(x=>({id:x.id,sourceId:x.sourceId,summary:x.summary,status:x.status,semanticState:x.semanticState}));
    return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},explicit,legacy,integrity:'LIVE_PHYTOSANITARY_PROVENANCE_DEMO · NOT_CYCLE_GATE · NO_EXTERNAL_CERTIFICATION · NO_CAUSAL_EFFICACY'};
  }
  function selected(){const plan=cycleApi()?.selectedPlan?.();return plan?forPlan(plan.id):{valid:false,explicit:[],legacy:[]}}
  function panel(){
    const s=selected();if(!s.valid)return '';
    if(!s.explicit.length&&!s.legacy.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · SANIDAD VEGETAL</p><h2>Sin procedencia sanitaria vinculada</h2><p>Ausencia de captura no equivale a ausencia de riesgo. Esta capa no modifica los gates del cierre.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    const avg=s.explicit.length?Math.round(s.explicit.reduce((n,c)=>n+c.stageCoverage,0)/s.explicit.length):0;
    const observed=s.explicit.reduce((n,c)=>n+c.observedPresence,0);
    const diagnosed=s.explicit.reduce((n,c)=>n+c.confirmedDiagnosis,0);
    const actions=s.explicit.reduce((n,c)=>n+c.actions,0);
    const followups=s.explicit.reduce((n,c)=>n+c.followups,0);
    const linkIssues=s.explicit.reduce((n,c)=>n+c.actionLinkIssues,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · SANIDAD VEGETAL</p><h2>Procedencia sanitaria del ciclo</h2><p>${esc(s.plan.id)} v${s.plan.version} · lote ${esc(s.plan.lot)} · lectura documental viva, separada de completitud.</p></div><span class="status ${linkIssues?'danger':'teal'}">${s.explicit.length} V1 · ${s.legacy.length} LEGACY</span></div><div class="card-body"><div class="grid metrics">${metric('Cobertura media',`${avg}%`,'etapas sanitarias explícitas · no desempeño')}${metric('Presencias observadas',observed,'solo observaciones explícitas')}${metric('Diagnósticos humanos',diagnosed,'no inferidos desde alertas')}${metric('Acciones',actions,'recomendación ≠ ejecución')}${metric('Seguimientos',followups,'resultado observado · no causalidad')}</div>${s.explicit.length?`<div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Caso</th><th>Cadena</th><th>Presencia</th><th>Diagnóstico</th><th>Acción / evidencia</th><th>Seguimiento</th></tr></thead><tbody>${s.explicit.map(c=>`<tr><td><strong>${esc(c.caseId)}</strong><br><small>${esc(c.scope||'—')}</small></td><td>${c.stageCoverage}%</td><td>${c.observedPresence}</td><td>${c.confirmedDiagnosis}</td><td>${c.actions} acción(es) · ${c.evidence} evidencia(s)${c.actionLinkIssues?`<br><small>${c.actionLinkIssues} vínculo(s) a revisar</small>`:''}</td><td>${c.followups}<br><small>${esc(c.latestResult||'sin resultado')} · ${esc(c.latestEffect||'sin eficacia evaluada')}</small></td></tr>`).join('')}</tbody></table></div>`:''}${s.legacy.length?`<div class="section-note" style="margin-top:12px"><strong>Historia legacy:</strong> ${s.legacy.length} resumen(es) permanecen como contexto histórico y no se reinterpretan.</div>`:''}<div class="section-note" style="margin-top:12px">PHYTOSANITARY_PROVENANCE ≠ CYCLE_GATE ≠ EXTERNAL_CERTIFICATION ≠ CAUSAL_EFFICACY. No modifica completeness ni readyForArchive.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const base=views.cycle;if(base)views.cycle=()=>insert(base(),panel());
  window.__SANA_CYCLE_HEALTH__=Object.freeze({forPlan,selected,integrity:'PHYTOSANITARY_PROVENANCE ≠ CYCLE_GATE ≠ EXTERNAL_CERTIFICATION ≠ CAUSAL_EFFICACY'});
})();
