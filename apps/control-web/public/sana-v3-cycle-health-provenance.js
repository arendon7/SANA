(() => {
  'use strict';
  const healthApi=()=>window.__SANA_PHYTOSANITARY_LEDGER__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;

  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);
    if(!plan)return {valid:false,explicit:[],legacy:[]};
    const data=healthApi()?.forLot?.(plan.lot)||{explicit:[],legacy:[]};
    const explicit=data.explicit.map(c=>({caseId:c.id,lot:c.lot,scope:c.scope,projectionVersion:c.projectionVersion||'V1',stageCoverage:c.stageCoverage?.percent??0,chainCoverage:c.chainCoverage?.percent??c.stageCoverage?.percent??0,observedPresence:c.semantics?.observedPresence??0,confirmedDiagnosis:c.semantics?.confirmedDiagnosis??0,activityLinks:c.activityLinks?.length??0,embeddedActivityLinksV1:c.semantics?.embeddedActivityLinksV1??0,actions:c.actions?.length??0,evidence:c.evidence?.length??0,followups:c.followups?.length??0,results:c.results?.length??0,embeddedResultsV1:c.semantics?.embeddedResultsV1??0,efficacyObservations:c.semantics?.efficacyObservations??0,explicitResultEfficacyObservations:c.semantics?.explicitResultEfficacyObservations??0,actionLinkIssues:c.semantics?.actionLinkIssues??0,latestResult:c.latestFollowUp?.resultClass||'',latestEffect:c.latestFollowUp?.effectivenessObserved||'',latestV2Result:c.latestResult?.resultClass||'',latestV2Effect:c.latestResult?.effectivenessObserved||''}));
    const legacy=data.legacy.map(x=>({id:x.id,sourceId:x.sourceId,summary:x.summary,status:x.status,semanticState:x.semanticState}));
    return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},explicit,legacy,integrity:'LIVE_PHYTOSANITARY_PROVENANCE_DEMO · V1_EMBEDDED ≠ V2_STAGE · NOT_CYCLE_GATE · NO_EXTERNAL_CERTIFICATION · NO_CAUSAL_EFFICACY'};
  }
  function selected(){const plan=cycleApi()?.selectedPlan?.();return plan?forPlan(plan.id):{valid:false,explicit:[],legacy:[]}}
  function panel(){
    const s=selected();if(!s.valid)return '';
    if(!s.explicit.length&&!s.legacy.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · SANIDAD VEGETAL</p><h2>Sin procedencia sanitaria vinculada</h2><p>Ausencia de captura no equivale a ausencia de riesgo. Esta capa no modifica los gates del cierre.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    const avg=s.explicit.length?Math.round(s.explicit.reduce((n,c)=>n+c.chainCoverage,0)/s.explicit.length):0;
    const observed=s.explicit.reduce((n,c)=>n+c.observedPresence,0);
    const diagnosed=s.explicit.reduce((n,c)=>n+c.confirmedDiagnosis,0);
    const links=s.explicit.reduce((n,c)=>n+c.activityLinks,0);
    const actions=s.explicit.reduce((n,c)=>n+c.actions,0);
    const results=s.explicit.reduce((n,c)=>n+c.results,0);
    const linkIssues=s.explicit.reduce((n,c)=>n+c.actionLinkIssues,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · SANIDAD VEGETAL</p><h2>Procedencia sanitaria del ciclo</h2><p>${esc(s.plan.id)} v${s.plan.version} · lote ${esc(s.plan.lot)} · lectura documental viva, separada de completitud.</p></div><span class="status ${linkIssues?'danger':'teal'}">${s.explicit.length} CASO(S) · ${s.legacy.length} LEGACY</span></div><div class="card-body"><div class="grid metrics">${metric('Cobertura media V2',`${avg}%`,'8 etapas explícitas · no desempeño')}${metric('Presencias observadas',observed,'solo observaciones explícitas')}${metric('Diagnósticos humanos',diagnosed,'no inferidos desde alertas')}${metric('Vínculos Activity V2',links,'relación ≠ ejecución')}${metric('Acciones',actions,'ejecución registrada')}${metric('Resultados V2',results,'resultado ≠ causalidad')}</div>${s.explicit.length?`<div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Caso</th><th>Cadena</th><th>Presencia / diagnóstico</th><th>Vínculo / acción / evidencia</th><th>Seguimiento / resultado</th></tr></thead><tbody>${s.explicit.map(c=>`<tr><td><strong>${esc(c.caseId)}</strong><br><small>${esc(c.scope||'—')} · ${esc(c.projectionVersion)}</small></td><td>V1 ${c.stageCoverage}% · V2 ${c.chainCoverage}%</td><td>${c.observedPresence} presencia(s) · ${c.confirmedDiagnosis} diagnóstico(s)</td><td>${c.activityLinks} vínculo(s) V2 · ${c.actions} acción(es) · ${c.evidence} evidencia(s)${c.embeddedActivityLinksV1?`<br><small>${c.embeddedActivityLinksV1} vínculo(s) V1 embebido(s)</small>`:''}${c.actionLinkIssues?`<br><small>${c.actionLinkIssues} vínculo(s) a revisar</small>`:''}</td><td>${c.followups} seguimiento(s) · ${c.results} resultado(s) V2<br><small>${esc(c.latestV2Result||c.latestResult||'sin resultado')} · ${esc(c.latestV2Effect||c.latestEffect||'sin eficacia evaluada')}${c.embeddedResultsV1?` · ${c.embeddedResultsV1} V1 embebido(s)`:''}</small></td></tr>`).join('')}</tbody></table></div>`:''}${s.legacy.length?`<div class="section-note" style="margin-top:12px"><strong>Historia legacy:</strong> ${s.legacy.length} resumen(es) permanecen como contexto histórico y no se reinterpretan.</div>`:''}<div class="section-note" style="margin-top:12px">PHYTOSANITARY_PROVENANCE ≠ CYCLE_GATE ≠ EXTERNAL_CERTIFICATION ≠ CAUSAL_EFFICACY. ACTIVITY_LINK ≠ EXECUTION. FOLLOW_UP ≠ RESULT. V1_EMBEDDED ≠ V2_STAGE. No modifica completeness ni readyForArchive.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const base=views.cycle;if(base)views.cycle=()=>insert(base(),panel());
  window.__SANA_CYCLE_HEALTH__=Object.freeze({forPlan,selected,integrity:'PHYTOSANITARY_PROVENANCE ≠ CYCLE_GATE ≠ EXTERNAL_CERTIFICATION ≠ CAUSAL_EFFICACY · ACTIVITY_LINK ≠ EXECUTION · FOLLOW_UP ≠ RESULT · V1_EMBEDDED ≠ V2_STAGE'});
})();
