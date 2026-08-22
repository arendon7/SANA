(() => {
  'use strict';
  const econApi=()=>window.__SANA_ECONOMIC_RECONCILIATION__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;
  const INTEGRITY='ECONOMIC_PROVENANCE ≠ CYCLE_GATE · BUDGET_REFERENCE ≠ COMMITMENT · COST_DECLARED ≠ VERIFIED_EXPENSE · INVOICE_REFERENCE ≠ INVOICE_VERIFIED · PAYMENT_STATUS_DECLARED ≠ PAYMENT_EXECUTED · COMMERCIAL_SCENARIO ≠ SALE · HARVEST_RESULT ≠ SALE_VOLUME · SALE ≠ CASH_RECEIPT · MARGIN_SCENARIO ≠ REALIZED_MARGIN · NO_ACCOUNTING_LEDGER';
  function forPlan(planId){const plan=DEMO.plans.find(p=>p.id===planId);if(!plan)return {valid:false,cases:[]};const c=(econApi()?.forLot?.(plan.lot)||[])[0]||null;if(!c)return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},cases:[],integrity:INTEGRITY};return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},cases:[{caseId:c.id,lot:c.lot,budget:c.budget,baselineAggregateCost:c.baselineAggregateCost,declaredLocalCost:c.declaredLocalCost,declaredCostCount:c.declaredCosts?.length??0,supportedDeclaredCostCount:c.semantics?.supportedDeclaredCostCount??0,crossDomainRefCount:c.crossDomainRefs?.length??0,invoiceReferenceCount:c.invoices?.length??0,paymentStatusDeclarationCount:c.paymentStates?.length??0,saleDeclarationCount:c.sales?.length??0,cashReceiptDeclarationCount:c.cashReceipts?.length??0,scenarioGross:c.scenario?.grossScenario??0,scenarioMargin:c.scenario?.grossMarginScenario??0,accountingEntries:0,verifiedExpenses:0,paymentsExecuted:0,realizedRevenue:0,realizedMargin:null}],integrity:INTEGRITY}}
  function selected(){const p=cycleApi()?.selectedPlan?.();return p?forPlan(p.id):{valid:false,cases:[]}}
  function money(n){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0)}catch{return `${Number(n)||0} COP`}}
  function panel(){const s=selected(),c=s.cases?.[0];if(!s.valid||!c)return '';return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · ECONOMIC RECONCILIATION</p><h2>Procedencia económica del ciclo</h2><p>${esc(s.plan.id)} · ${esc(s.plan.lot)} · read-only; no modifica completitud ni readyForArchive.</p></div><span class="status warn">NO ACCOUNTING GATE</span></div><div class="card-body"><div class="grid metrics">${metric('Presupuesto',money(c.budget),'reference ≠ commitment')}${metric('Costo local declarado',money(c.declaredLocalCost),'≠ verified expense')}${metric('Refs. cruzadas',c.crossDomainRefCount,'no doble conteo')}${metric('Pago ejecutado','0','sin ejecución financiera','good')}</div><div class="section-note">${esc(INTEGRITY)}</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const baseCycle=views.cycle;if(baseCycle)views.cycle=()=>insert(baseCycle(),panel());
  window.__SANA_CYCLE_ECONOMIC_RECONCILIATION__=Object.freeze({forPlan,selected,integrity:INTEGRITY});
})();

// V145 loader: internal economic references only; no accounting/payment/sale authority.
(() => {
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return;
  const VERSION='V145',SRC='/sana-v3-economic-references.js';
  const state={version:VERSION,status:'WAITING',attempts:0,integrity:'INTERNAL_REFERENCE_VALIDATION ≠ ACCOUNTING_VERIFICATION · NO_PAYMENT_EXECUTION · NO_CREDIT/INVESTMENT_AUTHORITY'};
  function expose(){window.__SANA_ECONOMIC_REFERENCES_LOADER__=Object.freeze({...state})}
  function ready(){return window.__SANA_ECONOMIC_RECONCILIATION__?.schema==='SANA_ECONOMIC_RECONCILIATION_LEDGER_V1'&&window.__SANA_PLAN_FIELD_WORKFLOW__?.findActivity&&window.__SANA_HARVEST_LEDGER__?.cases&&window.__SANA_LABOR_LEDGER__?.cases&&window.__SANA_INVENTORY_LEDGER__?.cases}
  function start(){
    state.attempts++;expose();
    if(window.__SANA_ECONOMIC_RECONCILIATION__?.referenceVersion==='V145'){state.status='READY';expose();return}
    if(!ready()){if(state.attempts<25){state.status='WAITING_DEPENDENCIES';expose();setTimeout(start,40);return}state.status='BLOCKED_DEPENDENCIES';expose();return}
    if(document.querySelector?.('script[data-sana-economic-references-v145]'))return;
    state.status='LOADING';expose();const s=document.createElement('script');s.src=SRC;s.defer=true;s.dataset.sanaEconomicReferencesV145='1';s.onload=()=>{state.status=window.__SANA_ECONOMIC_RECONCILIATION__?.referenceVersion==='V145'?'READY':'FAILED_CONTRACT';expose()};s.onerror=()=>{state.status='FAILED';expose()};document.head.appendChild(s);
  }
  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});
})();

// V146 loader: snapshot-only economic reference history; no accounting or financial authority.
(() => {
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function'||typeof window.addEventListener!=='function')return;
  const VERSION='V146';
  const ASSETS=['/sana-v3-report-snapshot-economic-references.js','/sana-v3-cycle-economic-references.js','/sana-v3-due-diligence-economic-reference-gaps.js','/sana-v3-dataroom-economic-references.js'];
  const state={version:VERSION,status:'WAITING',index:0,attempts:0,integrity:'SNAPSHOT_ONLY · CONTENT_MINIMIZED · NON_WEIGHTED · NO_ACCOUNTING/PAYMENT/SALE/CREDIT/INVESTMENT_AUTHORITY'};
  function expose(){window.__SANA_ECONOMIC_REFERENCE_HISTORY_LOADER__=Object.freeze({...state})}
  function v145Ready(){return window.__SANA_ECONOMIC_RECONCILIATION__?.referenceVersion==='V145'&&window.__SANA_ECONOMIC_REFERENCES_LOADER__?.status==='READY'}
  function loadNext(){
    if(state.index>=ASSETS.length){state.status='READY';expose();return}
    const src=ASSETS[state.index];
    if(document.querySelector?.(`script[src="${src}"]`)){state.index++;expose();queueMicrotask(loadNext);return}
    state.status='LOADING';expose();const s=document.createElement('script');s.src=src;s.defer=true;s.dataset.sanaEconomicReferenceHistoryV146=String(state.index+1);s.onload=()=>{state.index++;expose();loadNext()};s.onerror=()=>{state.status='FAILED';expose()};document.head.appendChild(s);
  }
  function start(){state.attempts++;expose();if(!v145Ready()){if(state.attempts<25){state.status='WAITING_V145';expose();setTimeout(start,40);return}state.status='BLOCKED_V145';expose();return}loadNext()}
  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});
})();
