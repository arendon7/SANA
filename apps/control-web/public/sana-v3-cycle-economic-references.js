(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const REPORT='RPT-DD';
  const INTEGRITY='SNAPSHOT_ECONOMIC_REFERENCES_ONLY · CYCLE_SOURCE_SCOPE_ONLY · CYCLE_READ_ONLY · NON_WEIGHTED · CONTENT_MINIMIZED · NO_LIVE_FALLBACK · TARGET_SCOPE_NEVER_ASSIGNS_CASE_TO_CYCLE · REFERENCE ≠ CYCLE_GATE ≠ ACCOUNTING_VERIFICATION ≠ PAYMENT_EXECUTION ≠ SALE_VERIFICATION ≠ FINANCIAL_SIGNAL';

  function latest(){return (window.__SANA_DUE_DILIGENCE_SNAPSHOT__?.snapshots?.()||[]).filter(s=>s?.manifest?.schema===SCHEMA&&s?.reportType===REPORT).slice().sort((a,b)=>String(b.cutoff||b.createdAt||'').localeCompare(String(a.cutoff||a.createdAt||'')))[0]||null}
  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);
    if(!plan)return {valid:false,state:'NO_PLAN',cases:[]};
    const s=latest();
    if(!s)return {valid:false,state:'NO_SNAPSHOT',plan,cases:[]};
    const d=s.manifest?.economicReferences;
    if(!d)return {valid:true,state:'NOT_CAPTURED_IN_SNAPSHOT',plan,snapshot:s,cases:[]};
    const cases=(d.cases||[]).filter(c=>c.lot===plan.lot);
    const foreignTargets=cases.reduce((n,c)=>n+(c.rows||[]).filter(r=>r.targetLot&&r.targetLot!==c.lot).length,0);
    return {
      valid:true,
      state:'CAPTURED',
      plan,
      snapshot:s,
      cases,
      summary:{
        linked:cases.reduce((n,c)=>n+(c.linked||0),0),
        expected:cases.reduce((n,c)=>n+(c.total||0),0),
        issues:cases.reduce((n,c)=>n+(c.issues||0),0),
        declaredNonCanonical:cases.reduce((n,c)=>n+(c.declaredNonCanonicalCount||0),0),
        foreignTargets,
        contentLeaks:Number(d.contentLeakCount)||0
      },
      integrity:INTEGRITY
    };
  }
  function selected(){const p=window.__SANA_CYCLE_CLOSURE__?.selectedPlan?.();return p?forPlan(p.id):{valid:false,state:'NO_SELECTED_PLAN',cases:[]}}
  function panel(){
    const s=selected();if(!s.valid)return '';
    if(s.state!=='CAPTURED')return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · ECONOMIC REFERENCES</p><h2>Granularidad referencial económica no capturada</h2><p>La ausencia no modifica completeness ni readyForArchive y no se rellena desde economía viva.</p></div><span class="status warn">NO GATE</span></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · ECONOMIC REFERENCES V149</p><h2>Procedencia referencial económica por scope fuente</h2><p>${esc(s.plan.id)} · ${esc(s.plan.lot)} · solo casos cuyo lote fuente pertenece al ciclo.</p></div><span class="status ${(s.summary.issues||s.summary.contentLeaks)?'warn':'teal'}">${s.summary.issues||0} ISSUE(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Enlazadas',s.summary.linked,'sin ponderación')}${metric('Esperadas',s.summary.expected,'solo V145')}${metric('Targets fuera scope',s.summary.foreignTargets,'issue visible, no reasigna ciclo',s.summary.foreignTargets?'warn':'good')}${metric('Impacto en cierre','0','no gate','good')}</div><div class="section-note" style="margin-top:12px">SOURCE CASE LOT DEFINES CYCLE MEMBERSHIP · TARGET LOT/PLAN REF NEVER REASSIGNS CASE · INTERNAL TARGET EXISTS ≠ ACCOUNTING FACT · NO CREDIT/INVESTMENT SIGNAL.</div></div></section>`;
  }
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const m of markers){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}return html+section}
  const base=views.cycle;if(base)views.cycle=()=>insert(base(),panel());
  window.__SANA_CYCLE_ECONOMIC_REFERENCES__=Object.freeze({forPlan,selected,integrity:INTEGRITY});
})();
