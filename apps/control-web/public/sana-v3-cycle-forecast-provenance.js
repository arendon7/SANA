(() => {
  'use strict';
  const forecastApi=()=>window.__SANA_FORECAST_LEDGER__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;
  const INTEGRITY='FORECAST_PROVENANCE ≠ CYCLE_GATE · FORECAST_ESTIMATE ≠ CONFIRMED_NEED · PLANNING_AVAILABILITY ≠ PHYSICAL_COUNT · FORECAST_GAP ≠ PURCHASE_AUTHORIZATION · PURCHASE_REQUEST ≠ PURCHASE_ORDER ≠ RECEIPT · RECEIPT ≠ CONSUMPTION · NO_AUTOMATIC_PROCUREMENT';
  function forPlan(planId){const plan=DEMO.plans.find(p=>p.id===planId);if(!plan)return {valid:false,cases:[]};const cases=(forecastApi()?.forLot?.(plan.lot)||[]).map(c=>({forecastId:c.id,itemId:c.itemId,item:c.item,unit:c.unit,horizon:c.horizon,estimate:c.estimate,planningAvailable:c.inventory?.planningAvailable??null,planningState:c.inventory?.state||'NO_REFERENCE',forecastGap:c.forecastGap,decisionState:c.decisionState,confirmedNeed:c.confirmedNeed,purchaseRequestCount:c.requests?.length??0,receiptCount:c.receipts?.length??0,actualConsumptionCount:c.consumptions?.length??0,activityRefs:[...(c.activityRefs||[])],basisRefs:[...(c.basisRefs||[])],automaticPurchaseOrders:0}));return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},cases,integrity:INTEGRITY}}
  function selected(){const plan=cycleApi()?.selectedPlan?.();return plan?forPlan(plan.id):{valid:false,cases:[]}}
  function panel(){const s=selected();if(!s.valid||!s.cases.length)return '';return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · FORECAST</p><h2>Procedencia de demanda futura</h2><p>${esc(s.plan.id)} · ${esc(s.plan.lot)}. Esta proyección es read-only y no modifica completitud ni readyForArchive.</p></div><span class="status warn">NO GATE</span></div><div class="card-body">${s.cases.map(c=>`<div class="gate"><i>≈</i><div><strong>${esc(c.forecastId)} · ${esc(c.item)}</strong><p>${Number(c.estimate).toLocaleString('es-CO')} ${esc(c.unit)} estimados · ${c.forecastGap===null?'gap no comparable':`${Number(c.forecastGap).toLocaleString('es-CO')} ${esc(c.unit)} de gap estimado`} · ${esc(String(c.decisionState).replaceAll('_',' '))}</p></div><span class="status">PROVENANCE</span></div>`).join('')}<div class="section-note">${esc(INTEGRITY)}</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const baseCycle=views.cycle;if(baseCycle)views.cycle=()=>insert(baseCycle(),panel());
  window.__SANA_CYCLE_FORECAST__=Object.freeze({forPlan,selected,integrity:INTEGRITY});
})();

// V139/V140 loader: activate Forecast reference integrity, then historical provenance.
(() => {
  if(typeof window==='undefined'||typeof document==='undefined'||!document.createElement)return;
  const HISTORY=['/sana-v3-report-snapshot-forecast-references.js','/sana-v3-cycle-forecast-references.js','/sana-v3-due-diligence-forecast-reference-gaps.js','/sana-v3-dataroom-forecast-references.js'];
  function loadHistory(i=0){
    if(i>=HISTORY.length)return;
    const src=HISTORY[i];
    if(document.querySelector?.(`script[src="${src}"]`)){loadHistory(i+1);return}
    const s=document.createElement('script');s.src=src;s.defer=true;s.dataset.sanaForecastReferenceHistoryV140=String(i+1);s.onload=()=>loadHistory(i+1);document.head.appendChild(s);
  }
  function load(){
    if(!window.__SANA_FORECAST_LEDGER__||!window.__SANA_NUTRITION_LEDGER__||!window.__SANA_PLAN_FIELD_WORKFLOW__)return;
    if(window.__SANA_FORECAST_LEDGER__?.referenceVersion==='V139'){loadHistory();return}
    if(document.querySelector?.('script[data-sana-forecast-references-v139]'))return;
    const s=document.createElement('script');s.src='/sana-v3-forecast-references.js';s.defer=true;s.dataset.sanaForecastReferencesV139='1';s.onload=()=>loadHistory();document.head.appendChild(s);
  }
  if(document.readyState==='complete')queueMicrotask(load);else window.addEventListener('load',load,{once:true});
})();
