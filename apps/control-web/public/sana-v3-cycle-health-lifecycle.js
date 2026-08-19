(() => {
  'use strict';
  function healthApi(){return window.__SANA_PHYTOSANITARY_LEDGER__}
  function cycleApi(){return window.__SANA_CYCLE_CLOSURE__}
  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);if(!plan)return {valid:false,rows:[]};
    const data=healthApi()?.forLot?.(plan.lot)||{explicit:[]};
    const rows=data.explicit.map(c=>({caseId:c.id,lot:c.lot||plan.lot,caseState:c.caseState||'OPEN',closureCount:c.closures?.length??0,closureIssues:c.closureIssues??0,closedAt:c.closedAt||'',latestClosureClass:c.latestClosure?.closureClass||'',latestClosureEventId:c.latestClosure?.id||'',latestClosureBasisResultId:c.latestClosure?.basisEventId||'',chainCoverage:c.chainCoverage?.percent??null}));
    return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},rows,integrity:'LIVE_HEALTH_CASE_LIFECYCLE_DEMO · CASE_CLOSURE ≠ CYCLE_GATE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · RESULT ≠ CASE_CLOSURE · NO_COMPLETENESS_WEIGHTING'};
  }
  function selected(){const plan=cycleApi()?.selectedPlan?.();return plan?forPlan(plan.id):{valid:false,rows:[]}}
  function panel(){
    const s=selected();if(!s.valid||!s.rows.length)return '';
    const closed=s.rows.filter(r=>r.caseState==='CLOSED_HUMAN').length;const open=s.rows.length-closed;const issues=s.rows.reduce((n,r)=>n+Number(r.closureIssues||0),0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · LIFECYCLE SANIDAD</p><h2>Estado humano de expedientes sanitarios</h2><p>${esc(s.plan.id)} v${s.plan.version} · lectura auxiliar no ponderada.</p></div><span class="status ${issues?'danger':'teal'}">${closed} CERRADO(S) HUMANO</span></div><div class="card-body"><div class="grid metrics">${metric('Casos abiertos',open,'no bloquean cierre por sí solos')}${metric('Cerrados humanos',closed,'cierre ≠ resolución')}${metric('Issues lifecycle',issues,'integridad documental')}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Caso</th><th>Estado</th><th>Cierre humano</th><th>RESULT base</th><th>Cadena V2</th></tr></thead><tbody>${s.rows.map(r=>`<tr><td><strong>${esc(r.caseId)}</strong></td><td>${esc(r.caseState)}</td><td>${esc(r.closedAt||'—')}<br><small>${esc(r.latestClosureClass||'sin cierre')} · ${r.closureIssues} issue(s)</small></td><td>${esc(r.latestClosureBasisResultId||'—')}</td><td>${r.chainCoverage===null?'N/A':`${r.chainCoverage}%`}</td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px">CASE_CLOSURE ≠ CYCLE_GATE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY. No modifica completeness ni readyForArchive.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const base=views.cycle;if(base)views.cycle=()=>insert(base(),panel());
  window.__SANA_CYCLE_HEALTH_LIFECYCLE__=Object.freeze({forPlan,selected,integrity:'HEALTH_CASE_LIFECYCLE ≠ CYCLE_GATE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · RESULT ≠ CASE_CLOSURE · NO_COMPLETENESS_WEIGHTING · NO_EXTERNAL_CERTIFICATION'});
})();
