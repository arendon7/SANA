(() => {
  'use strict';
  const harvestApi=()=>window.__SANA_HARVEST_LEDGER__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;

  function forPlan(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);if(!plan)return {valid:false,cases:[]};
    const cases=(harvestApi()?.forLot?.(plan.lot)||[]).map(c=>({caseId:c.id,lot:c.lot,harvestQuantity:c.quantities?.harvestQuantity??null,harvestUnit:c.quantities?.harvestUnit||'',lossQuantity:c.quantities?.lossQuantity??null,lossUnit:c.quantities?.lossUnit||'',handoffQuantity:c.quantities?.handoffQuantity??null,handoffUnit:c.quantities?.handoffUnit||'',soldQuantity:c.quantities?.soldQuantity??null,soldUnit:c.quantities?.soldUnit||'',observedYield:c.quantities?.observedYield??null,yieldUnit:c.quantities?.yieldUnit||'',classificationCount:c.classifications?.length??0,evidenceCount:c.evidence?.length??0,saleDeclarationCount:c.sales?.length??0,paymentCaptured:c.semantics?.paymentCaptured??0,unsupportedExecution:c.semantics?.unsupportedExecution?.length??0,saleWithoutHandoff:c.semantics?.saleWithoutHandoff?.length??0,soldExceedsHarvest:Boolean(c.semantics?.soldExceedsHarvest),lossExceedsHarvest:Boolean(c.semantics?.lossExceedsHarvest)}));
    return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},cases,integrity:'HARVEST_PROVENANCE ≠ CYCLE_GATE · HARVEST ≠ SALE · HANDOFF ≠ SALE · SALE_DECLARATION ≠ PAYMENT · QUALITY_CLASSIFICATION ≠ CERTIFICATION · YIELD ≠ PROFITABILITY · RESULT ≠ CAUSALITY'};
  }
  function selected(){const p=cycleApi()?.selectedPlan?.();return p?forPlan(p.id):{valid:false,cases:[]}}
  function panel(){const s=selected();if(!s.valid)return '';if(!s.cases.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · COSECHA Y RESULTADOS</p><h2>Sin ledger de resultado vinculado</h2><p>Ausencia de captura no equivale a ausencia de cosecha o venta. Esta capa no modifica gates del cierre.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;const harvest=s.cases.reduce((n,c)=>n+(Number(c.harvestQuantity)||0),0),sales=s.cases.reduce((n,c)=>n+c.saleDeclarationCount,0),payments=s.cases.reduce((n,c)=>n+c.paymentCaptured,0),issues=s.cases.reduce((n,c)=>n+c.unsupportedExecution+c.saleWithoutHandoff+(c.soldExceedsHarvest?1:0)+(c.lossExceedsHarvest?1:0),0);return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · COSECHA Y RESULTADOS</p><h2>Procedencia productiva y comercial del ciclo</h2><p>${esc(s.plan.id)} v${s.plan.version} · lote ${esc(s.plan.lot)} · lectura read-only y no ponderada.</p></div><span class="status ${issues?'warn':'teal'}">${s.cases.length} CASO(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Cosecha explícita',harvest,'suma descriptiva; revisar unidades')}${metric('Ventas declaradas',sales,'declaración ≠ pago')}${metric('Pagos capturados',payments,'registro ≠ ejecución financiera',payments?'warn':'good')}${metric('Brechas de relación',issues,'soporte/consistencia documental',issues?'warn':'good')}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Caso</th><th>Cosecha</th><th>Merma</th><th>Entrega</th><th>Venta</th><th>Rendimiento</th></tr></thead><tbody>${s.cases.map(c=>`<tr><td><strong>${esc(c.caseId)}</strong></td><td>${c.harvestQuantity??'—'} ${esc(c.harvestUnit)}</td><td>${c.lossQuantity??'—'} ${esc(c.lossUnit)}</td><td>${c.handoffQuantity??'—'} ${esc(c.handoffUnit)}</td><td>${c.soldQuantity??'—'} ${esc(c.soldUnit)}<br><small>${c.saleDeclarationCount} declaración(es) · ${c.paymentCaptured} pago(s) capturado(s)</small></td><td>${c.observedYield??'—'} ${esc(c.yieldUnit)}<br><small>descriptivo; no rentabilidad</small></td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px">HARVEST_PROVENANCE ≠ CYCLE_GATE · HARVEST ≠ SALE · SALE_DECLARATION ≠ PAYMENT · QUALITY_CLASSIFICATION ≠ CERTIFICATION · YIELD ≠ PROFITABILITY · RESULT ≠ CAUSALITY. No modifica completeness ni readyForArchive.</div></div></section>`}
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const base=views.cycle;if(base)views.cycle=()=>insert(base(),panel());
  window.__SANA_CYCLE_HARVEST__=Object.freeze({forPlan,selected,integrity:'HARVEST_PROVENANCE ≠ CYCLE_GATE · HARVEST ≠ SALE · HANDOFF ≠ SALE · SALE_DECLARATION ≠ PAYMENT · QUALITY_CLASSIFICATION ≠ CERTIFICATION · YIELD ≠ PROFITABILITY · RESULT ≠ CAUSALITY'});
})();

(() => {
  'use strict';
  const state={version:'V135',status:'PENDING',loaded:false,failed:false};
  function load(){
    if(state.loaded||state.failed||typeof document==='undefined'||!document.createElement)return;
    const script=document.createElement('script');script.src='/sana-v3-harvest-references.js';script.async=false;
    script.onload=()=>{state.loaded=true;state.status='READY'};
    script.onerror=()=>{state.failed=true;state.status='FAILED'};
    document.head.appendChild(script);
  }
  if(typeof document!=='undefined'&&document.readyState==='loading'&&typeof window?.addEventListener==='function')window.addEventListener('DOMContentLoaded',load,{once:true});else load();
  if(typeof window!=='undefined')window.__SANA_HARVEST_REFERENCES_LOADER__=Object.freeze({version:'V135',asset:'/sana-v3-harvest-references.js',state});
})();
