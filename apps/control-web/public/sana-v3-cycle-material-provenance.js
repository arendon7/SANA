(() => {
  'use strict';
  const materialApi=()=>window.__SANA_MATERIAL_CHAIN__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;
  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);
    if(!plan)return {valid:false,chains:[]};
    const chains=(materialApi()?.forLot?.(plan.lot)||[]).map(c=>({materialId:c.identity?.id||'',species:c.identity?.species||'',origin:c.identity?.origin||'',stageCoverage:c.stageCoverage?.percent??0,explicitEvents:c.quantities?.explicitEvents??0,legacyEvents:c.quantities?.legacyEvents??0,declaredLoss:c.quantities?.declaredLoss??0,survival:c.quantities?.latestSurvivalRate??null,mismatch:c.quantities?.mismatches??0,evidence:c.evidence?.coverage??0,costCount:c.relations?.costCount??0,inventoryCount:c.relations?.inventoryCount??0}));
    return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},chains,integrity:'LIVE_MATERIAL_PROVENANCE_DEMO · NOT_CYCLE_GATE · NO_EXTERNAL_CERTIFICATION'};
  }
  function selected(){const plan=cycleApi()?.selectedPlan?.();return plan?forPlan(plan.id):{valid:false,chains:[]}}
  function panel(){
    const s=selected();if(!s.valid)return '';
    if(!s.chains.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · MATERIAL VEGETAL</p><h2>Sin procedencia vegetal vinculada</h2><p>Esta capa no modifica los gates existentes del cierre.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    const avgStage=Math.round(s.chains.reduce((n,c)=>n+c.stageCoverage,0)/s.chains.length);const avgEvidence=Math.round(s.chains.reduce((n,c)=>n+c.evidence,0)/s.chains.length);const mismatches=s.chains.reduce((n,c)=>n+c.mismatch,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · MATERIAL VEGETAL</p><h2>Procedencia vegetal del ciclo</h2><p>${esc(s.plan.id)} v${s.plan.version} · lote ${esc(s.plan.lot)} · lectura DEMO separada de completitud.</p></div><span class="status ${mismatches?'danger':'teal'}">${s.chains.length} CADENA(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Cobertura media',`${avgStage}%`,'etapas documentadas · no desempeño')}${metric('Evidencia media',`${avgEvidence}%`,'cadena vegetal DEMO')}${metric('Supervivencia explícita',s.chains.filter(c=>c.survival!==null).length,'solo conteos V1')}${metric('Count mismatch',mismatches,'revisión humana',mismatches?'warn':'good')}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Material</th><th>Origen</th><th>Etapas</th><th>Conteos</th><th>Evidencia</th><th>Relaciones</th></tr></thead><tbody>${s.chains.map(c=>`<tr><td><strong>${esc(c.materialId)}</strong><br><small>${esc(c.species)}</small></td><td>${esc(c.origin||'—')}</td><td>${c.stageCoverage}%</td><td>${c.survival===null?'Supervivencia no capturada':`Supervivencia ${c.survival}%`}<br><small>${c.explicitEvents} explícitos · ${c.legacyEvents} legacy · pérdida declarada ${c.declaredLoss}</small></td><td>${c.evidence}%</td><td>${c.costCount} costo(s) · ${c.inventoryCount} mov.</td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px">MATERIAL_PROVENANCE ≠ CYCLE_GATE ≠ PERFORMANCE ≠ EXTERNAL_CERTIFICATION. DECLARED_LOSS ≠ FAILURE. No modifica completeness ni readyForArchive.</div></div></section>`;
  }
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const base=views.cycle;if(base)views.cycle=()=>insert(base(),panel());
  window.__SANA_CYCLE_MATERIAL__=Object.freeze({forPlan,selected,integrity:'LIVE_MATERIAL_PROVENANCE_DEMO · MATERIAL_PROVENANCE ≠ CYCLE_GATE ≠ PERFORMANCE ≠ EXTERNAL_CERTIFICATION'});
})();
