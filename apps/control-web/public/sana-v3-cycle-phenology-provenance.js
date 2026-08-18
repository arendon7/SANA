(() => {
  'use strict';

  const phenologyApi=()=>window.__SANA_PHENOLOGY_SERIES__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;

  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);
    if(!plan)return {valid:false,summary:null};

    const s=phenologyApi()?.summary?.(plan.lot)||null;
    if(!s)return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},summary:null};

    const series=(s.variables||[]).map(variable=>{
      const x=phenologyApi().series(plan.lot,variable);
      return {
        variable,
        count:x.rows.length,
        units:x.units,
        comparable:x.comparable,
        delta:x.delta,
        direction:x.direction
      };
    });

    return {
      valid:true,
      plan:{id:plan.id,version:plan.version,lot:plan.lot},
      summary:{
        latestStage:s.latestStage?{
          stage:s.latestStage.stage,
          progress:s.latestStage.progress,
          sourceClass:s.latestStage.sourceClass,
          quality:s.latestStage.quality,
          observedAt:s.latestStage.observedAt
        }:null,
        stageCount:s.stages?.length??0,
        measurementCount:s.measurements?.length??0,
        interpretationCount:s.interpretations?.length??0,
        evidenceCount:s.evidence?.length??0,
        variables:s.variables||[],
        legacyCount:s.legacy?.length??0,
        series
      },
      integrity:'PHENOLOGY_PROVENANCE ≠ PLAN_PHASE ≠ CYCLE_GATE · MEASUREMENT ≠ MANAGEMENT_DECISION · TREND ≠ PERFORMANCE ≠ CAUSALITY'
    };
  }

  function selected(){
    const p=cycleApi()?.selectedPlan?.();
    return p?forPlan(p.id):{valid:false,summary:null};
  }

  function panel(){
    const s=selected();
    if(!s.valid)return '';
    const x=s.summary;
    if(!x||(!x.stageCount&&!x.measurementCount&&!x.legacyCount))return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · FENOLOGÍA Y VARIABLES</p><h2>Sin serie fenológica vinculada</h2><p>Ausencia de captura no equivale a ausencia de evolución del cultivo. Esta capa no cambia gates del cierre.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;

    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · FENOLOGÍA Y VARIABLES</p><h2>Procedencia temporal del ciclo</h2><p>${esc(s.plan.id)} v${s.plan.version} · lote ${esc(s.plan.lot)} · observación y medición read-only.</p></div><span class="status teal">${x.measurementCount} MED · ${x.stageCount} ETAPA</span></div><div class="card-body"><div class="grid metrics">${metric('Última etapa',x.latestStage?.stage||'—',x.latestStage?.sourceClass||'sin fuente')}${metric('Variables',x.variables.length,'series independientes')}${metric('Interpretaciones',x.interpretationCount,'humanas')}${metric('Evidencias',x.evidenceCount,'soportes explícitos')}${metric('Legacy',x.legacyCount,'sin reinterpretar')}</div>${x.series.length?`<div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Variable</th><th>Puntos</th><th>Unidad</th><th>Delta</th><th>Lectura</th></tr></thead><tbody>${x.series.map(r=>`<tr><td><strong>${esc(r.variable)}</strong></td><td>${r.count}</td><td>${esc(r.units.join(', ')||'—')}</td><td>${r.comparable?esc(r.delta):'—'}</td><td>${esc(r.direction)}<br><small>descriptivo únicamente</small></td></tr>`).join('')}</tbody></table></div>`:''}<div class="section-note" style="margin-top:12px">PHENOLOGY_PROVENANCE ≠ PLAN_PHASE ≠ CYCLE_GATE · MEASUREMENT ≠ MANAGEMENT_DECISION · TREND ≠ PERFORMANCE ≠ CAUSALITY. No modifica completeness ni readyForArchive.</div></div></section>`;
  }

  function insert(html,section){
    const marker='<footer class="footer">';
    const at=html.lastIndexOf(marker);
    return at<0?html+section:html.slice(0,at)+section+html.slice(at);
  }

  const base=views.cycle;
  if(base)views.cycle=()=>insert(base(),panel());

  window.__SANA_CYCLE_PHENOLOGY__=Object.freeze({
    forPlan,
    selected,
    integrity:'PHENOLOGY_PROVENANCE ≠ PLAN_PHASE ≠ CYCLE_GATE · MEASUREMENT ≠ MANAGEMENT_DECISION · TREND ≠ PERFORMANCE ≠ CAUSALITY'
  });
})();
