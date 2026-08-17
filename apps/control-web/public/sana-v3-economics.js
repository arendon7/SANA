(() => {
  'use strict';

  const ECON_KEY='sana.v3.economics.settings';
  const BASE={
    'CAF-A1':{budget:18400000,recorded:15950000,evidence:78,priceScenario:13800000,unit:'t',volume:5.82},
    'AGU-A2':{budget:27300000,recorded:24100000,evidence:72,priceScenario:6100000,unit:'t',volume:26.32},
    'CAC-B1':{budget:12600000,recorded:10350000,evidence:69,priceScenario:9100000,unit:'t',volume:1.64},
    'RES-01':{budget:8800000,recorded:7420000,evidence:84,priceScenario:0,unit:'ha',volume:3.9}
  };
  const CATS=[['labor','Mano de obra'],['inputs','Insumos y material'],['water','Agua / riego'],['logistics','Logística'],['technical','Acompañamiento técnico'],['equipment','Equipos / mantenimiento'],['other','Otros trazables']];

  function settings(){try{return JSON.parse(localStorage.getItem(ECON_KEY)||'{}')}catch{return {}}}
  function saveSettings(next){localStorage.setItem(ECON_KEY,JSON.stringify(next))}
  function records(){return storage.records.filter(r=>r.type==='economics-cost')}
  function harvestRecords(){return storage.records.filter(r=>r.type==='harvest-result')}
  function money(n){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0)}catch{return `${Number(n)||0} COP`}}
  function categoryLabel(id){return CATS.find(([key])=>key===id)?.[1]||'Otros trazables'}
  function parseAllocation(value=''){
    const [kind,lot,activityId,planId,planVersion]=String(value).split('|');
    return {kind:kind||'LOT',lot:lot||'',activityId:activityId||'',planId:planId||'',planVersion:Number(planVersion)||null};
  }
  function allocationFor(record){
    const parsed=parseAllocation(record.values?.allocationRef||'');
    const activityId=record.values?.activityId||parsed.activityId||'';
    const activity=activityId?window.__SANA_PLAN_FIELD_WORKFLOW__?.findActivity?.(activityId):null;
    const planId=record.values?.planId||parsed.planId||activity?.planId||'';
    const plan=DEMO.plans.find(p=>p.id===planId);
    const planVersion=Number(record.values?.planVersion)||parsed.planVersion||activity?.planVersion||plan?.version||null;
    const declaredLot=record.lot||record.values?.lot||'';
    const linkedLot=parsed.lot||activity?.lot||plan?.lot||'';
    const validLink=!activityId||Boolean(activity)&&(!declaredLot||!linkedLot||declaredLot===linkedLot)&&(!planId||activity?.planId===planId);
    return {activityId,planId,planVersion,declaredLot,linkedLot,validLink,kind:activityId?'ACTIVITY':'LOT'};
  }
  function normalizeCost(record){
    const link=allocationFor(record);
    const evidence=record.values?.evidence||'Sin soporte';
    const supported=Boolean(evidence&&!/^Sin soporte$/i.test(evidence));
    return {
      id:record.id,
      lot:link.declaredLot||link.linkedLot||'',
      activityId:link.activityId,
      planId:link.planId,
      planVersion:link.planVersion,
      linkKind:link.kind,
      linkIntegrity:link.validLink?'OK':'MISMATCH',
      category:record.values?.category||'other',
      categoryLabel:categoryLabel(record.values?.category||'other'),
      concept:record.values?.concept||record.title||'Costo operativo',
      amount:Number(record.values?.amount)||0,
      date:record.values?.date||String(record.createdAt||'').slice(0,10),
      evidence,
      supported,
      owner:record.values?.owner||'Responsable DEMO',
      detail:record.values?.detail||'',
      provenance:'LOCAL_ONLY',
      accountingStatus:'NO_CONTABILIDAD_OFICIAL',
      createdAt:record.createdAt||null
    };
  }
  function costRows(){return records().map(normalizeCost)}
  function observedResult(lotId){
    const local=harvestRecords().filter(r=>r.lot===lotId||r.values?.lot===lotId).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if(local)return {quantity:Number(local.values?.quantity)||0,unit:local.values?.unit||'',source:local.values?.provenance||'LOCAL_ONLY',status:'LOCAL_ONLY'};
    const base=window.__SANA_RESULT_BASE__?.[lotId];
    return base?{quantity:base.observed,unit:base.unit,source:'BASELINE_DEMO',status:'BASELINE_DEMO'}:null;
  }
  function lotData(lot){
    const base=BASE[lot.id]||{budget:0,recorded:0,evidence:0,priceScenario:0,unit:'',volume:0};
    const cfg=settings()[lot.id]||{};
    const local=costRows().filter(r=>r.lot===lot.id);
    const localAmount=local.reduce((sum,r)=>sum+r.amount,0);
    const baseRecorded=Number(base.recorded)||0;
    const recorded=baseRecorded+localAmount;
    const budget=Number(cfg.budget)||base.budget;
    const price=Number(cfg.priceScenario)||base.priceScenario;
    const volume=Number(cfg.volume)||base.volume;
    const grossScenario=price*volume;
    const grossMargin=grossScenario-recorded;
    const supportedLocal=local.filter(r=>r.supported&&r.linkIntegrity==='OK');
    const evidence=Math.min(100,base.evidence+Math.min(16,supportedLocal.length*4));
    const observed=observedResult(lot.id);
    return {...base,...cfg,lotId:lot.id,baseRecorded,baseRecordedProvenance:'BASELINE_DEMO',localRecorded:localAmount,recorded,budget,priceScenario:price,volume,grossScenario,grossMarginScenario:grossMargin,evidence,local,supportedLocal,observed};
  }
  function lotSummary(lotId){const lot=DEMO.lots.find(l=>l.id===lotId);return lot?{lot:{...lot},...lotData(lot)}:null}
  function forLot(lotId){return costRows().filter(r=>r.lot===lotId)}
  function forActivity(activityId){return costRows().filter(r=>r.activityId===activityId)}
  function cycleSummary(planId){
    const plan=DEMO.plans.find(p=>p.id===planId);
    if(!plan)return null;
    const lot=lotSummary(plan.lot);
    const explicitCosts=costRows().filter(r=>r.planId===planId&&r.linkIntegrity==='OK');
    const supportedExplicit=explicitCosts.filter(r=>r.supported);
    const unallocatedLotCosts=costRows().filter(r=>r.lot===plan.lot&&!r.planId);
    const mismatchedCosts=costRows().filter(r=>r.planId===planId&&r.linkIntegrity!=='OK');
    const explicitAmount=explicitCosts.reduce((s,r)=>s+r.amount,0);
    const supportedAmount=supportedExplicit.reduce((s,r)=>s+r.amount,0);
    const evidenceCoverage=explicitCosts.length?Math.round(supportedExplicit.length/explicitCosts.length*100):0;
    return {
      plan:{...plan},lot:lot?.lot||null,
      explicitCosts:explicitCosts.map(r=>({...r})),supportedExplicit:supportedExplicit.map(r=>({...r})),
      unallocatedLotCosts:unallocatedLotCosts.map(r=>({...r})),mismatchedCosts:mismatchedCosts.map(r=>({...r})),
      explicitAmount,supportedAmount,evidenceCoverage,
      budget:lot?.budget||0,baseRecorded:lot?.baseRecorded||0,baseRecordedProvenance:'BASELINE_DEMO',localRecorded:lot?.localRecorded||0,totalRecordedLot:lot?.recorded||0,
      observed:lot?.observed||null,scenario:{volume:lot?.volume||0,unit:lot?.unit||'',priceScenario:lot?.priceScenario||0,grossScenario:lot?.grossScenario||0,grossMarginScenario:lot?.grossMarginScenario||0},
      integrity:'COST_LINK_EXPLICIT · BASELINE_DEMO ≠ ITEMIZED_CYCLE_COST · NO_CONTABILIDAD_OFICIAL'
    };
  }
  function allLotSummaries(){return DEMO.lots.filter(l=>BASE[l.id]).map(l=>lotSummary(l.id))}
  function statusVariance(recorded,budget){if(!budget)return 'warn';const ratio=recorded/budget;return ratio>1?'danger':ratio>.9?'warn':'teal'}
  function pct(recorded,budget){return budget?Math.round(recorded/budget*100):0}
  function categoryTotals(lotId){
    const seed={labor:3900000,inputs:4450000,water:1380000,logistics:1120000,technical:1750000,equipment:860000,other:0};
    if(lotId!=='CAF-A1')Object.keys(seed).forEach(k=>seed[k]=Math.round(seed[k]*(BASE[lotId]?.recorded||10000000)/15950000));
    forLot(lotId).forEach(r=>{seed[r.category]=(seed[r.category]||0)+r.amount});
    return seed;
  }

  function economics(){
    const rows=allLotSummaries();
    const totalBudget=rows.reduce((s,x)=>s+x.budget,0);
    const totalRecorded=rows.reduce((s,x)=>s+x.recorded,0);
    const avgEvidence=Math.round(rows.reduce((s,x)=>s+x.evidence,0)/rows.length);
    const localCount=costRows().length;
    const explicitCount=costRows().filter(r=>r.planId&&r.linkIntegrity==='OK').length;
    const observedCount=rows.filter(x=>x.observed).length;
    const focus=rows[0];
    const cats=categoryTotals(focus.lot.id);
    return `${head('SANA · ECONOMÍA DEL CULTIVO','Costear desde la operación y su evidencia.','La capa económica expone un único read-model por lote, actividad y ciclo. BASELINE_DEMO, costo LOCAL_ONLY, resultado observado y escenario comercial permanecen separados: esta DEMO no sustituye contabilidad, facturación ni valoración financiera.',`<button class="btn primary" data-econ-cost>Registrar costo</button><button class="btn secondary" data-econ-scenario>Configurar escenario</button>`)}
      <section class="grid metrics">${metric('Presupuesto operativo',money(totalBudget),'escenario DEMO')}${metric('Costos visibles',money(totalRecorded),`${localCount} LOCAL_ONLY · resto BASELINE_DEMO`,'good')}${metric('Costos con vínculo',explicitCount,`activityId + planId + versión`,explicitCount?'good':'warn')}${metric('Evidencia económica',`${avgEvidence}%`,'calidad DEMO de soporte; no auditoría',avgEvidence>=80?'good':'warn')}</section>
      <section class="economics-grid">${rows.map(d=>`<article class="economics-lot"><header><div><small>${d.lot.id}</small><h3>${esc(d.lot.crop)} · ${esc(d.lot.name)}</h3></div><span class="status ${statusVariance(d.recorded,d.budget)}">${pct(d.recorded,d.budget)}% PRESUP.</span></header><div class="economics-bars"><div><span>Presupuesto</span><strong>${money(d.budget)}</strong></div><div><span>BASELINE_DEMO</span><strong>${money(d.baseRecorded)}</strong></div><div><span>LOCAL_ONLY</span><strong>${money(d.localRecorded)}</strong></div><div><span>Resultado observado</span><strong>${d.observed?`${d.observed.quantity} ${esc(d.observed.unit)}`:'—'}</strong></div></div><div class="progress"><i class="${statusVariance(d.recorded,d.budget)==='danger'?'warn':''}" style="width:${Math.min(100,pct(d.recorded,d.budget))}%"></i></div><footer><span>${d.observed?`Resultado: ${esc(d.observed.source)}`:'Sin resultado vinculado'} · Escenario: ${d.volume} ${esc(d.unit)} × ${d.priceScenario?money(d.priceScenario):'sin precio'}</span><strong>${d.priceScenario?`Margen bruto DE ESCENARIO ${money(d.grossMarginScenario)}`:'Sin escenario comercial'}</strong></footer></article>`).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Estructura de costos · CAF-A1</h2><p>Distribución DEMO; el baseline no se presenta como detalle contable itemizado.</p></div></div><div class="card-body economics-cats">${CATS.map(([id,label])=>{const amount=cats[id]||0;const share=Math.round(amount/Object.values(cats).reduce((a,b)=>a+b,0)*100)||0;return `<div><span>${label}</span><div class="progress"><i style="width:${share}%"></i></div><strong>${money(amount)}</strong><small>${share}%</small></div>`}).join('')}</div></article><article class="card"><div class="card-head"><div><h2>Resultado vs escenario</h2><p>Comparar no equivale a reconocer un ingreso.</p></div></div><div class="card-body">${rows.filter(x=>x.priceScenario).map(x=>`<div class="gate"><i>${x.observed?'✓':'!'}</i><div><strong>${x.lot.id} · ${esc(x.lot.crop)}</strong><p>Observado: ${x.observed?`${x.observed.quantity} ${esc(x.observed.unit)} · ${esc(x.observed.source)}`:'sin resultado'}<br>Escenario comercial: ${x.volume} ${esc(x.unit)} × ${money(x.priceScenario)}/${esc(x.unit)}</p></div><span class="status ${x.observed?'teal':'warn'}">SEPARADOS</span></div>`).join('')}<div class="section-note" style="margin-top:12px">Incluso cuando el volumen observado coincide con el volumen del escenario, SANA no infiere venta, precio realizado, recaudo, utilidad ni margen contable. Eso requiere evidencia comercial/contable independiente.</div></div></article></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Contrato económico del ciclo</h2><p>Qué puede y qué no puede viajar hacia Passport, Cierre de ciclo y Readiness.</p></div></div><div class="card-body"><div class="gate"><i>1</i><div><strong>Costo LOCAL_ONLY</strong><p>Lote, categoría, fecha, responsable, monto y procedencia.</p></div><span class="status teal">REGISTRO</span></div><div class="gate"><i>2</i><div><strong>Vínculo explícito</strong><p>activityId + planId + planVersion cuando el costo pertenece a una actividad del ciclo.</p></div><span class="status teal">TRAZABLE</span></div><div class="gate"><i class="warn">!</i><div><strong>BASELINE_DEMO</strong><p>Monto histórico sintético agregado; no se reasigna retroactivamente a una actividad o plan.</p></div><span class="status warn">NO ITEMIZADO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Cierre contable / rentabilidad</strong><p>Fuera del alcance. COST LINK ≠ ACCOUNTING ENTRY ≠ REALIZED REVENUE.</p></div><span class="status danger">NO ASUMIR</span></div></div></article><article class="card"><div class="card-head"><div><h2>Registros económicos LOCAL_ONLY</h2><p>Únicos registros itemizados creados por la identidad; el baseline permanece separado.</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Lote</th><th>Actividad / plan</th><th>Concepto</th><th>Monto</th><th>Soporte</th></tr></thead><tbody>${costRows().length?costRows().slice().reverse().map(r=>`<tr><td>${esc(r.date||'Ahora')}</td><td>${esc(r.lot)}</td><td>${r.activityId?`${esc(r.activityId)} · ${esc(r.planId||'sin plan')} v${r.planVersion||'—'}`:'Costo de lote · no asignado a ciclo'}${r.linkIntegrity!=='OK'?'<br><span class="status danger">MISMATCH</span>':''}</td><td>${esc(r.concept)}</td><td>${money(r.amount)}</td><td>${esc(r.evidence)}</td></tr>`).join(''):'<tr><td colspan="6"><div class="empty">Aún no hay costos itemizados creados por esta identidad.</div></td></tr>'}</tbody></table></div></article></section>${footer()}`;
  }

  views.economics=economics;
  window.__SANA_ECONOMICS__=Object.freeze({
    rows:()=>allLotSummaries().map(r=>({...r,lot:{...r.lot},local:r.local.map(x=>({...x})),supportedLocal:r.supportedLocal.map(x=>({...x}))})),
    costs:()=>costRows().map(r=>({...r})),
    forLot:lotId=>forLot(lotId).map(r=>({...r})),
    forActivity:activityId=>forActivity(activityId).map(r=>({...r})),
    lotSummary,
    cycleSummary,
    categories:()=>CATS.map(([id,label])=>({id,label})),
    integrity:'BASELINE_DEMO ≠ LOCAL_ONLY_COST ≠ ACCOUNTING_ENTRY ≠ REALIZED_REVENUE'
  });

  function allocationOptions(){
    const workflow=window.__SANA_PLAN_FIELD_WORKFLOW__?.activities?.()||[];
    const lots=DEMO.lots.filter(l=>BASE[l.id]).map(l=>`<option value="LOT|${l.id}|||">${l.id} · costo general de lote (sin actividad)</option>`);
    const activities=workflow.filter(a=>BASE[a.lot]).map(a=>`<option value="ACTIVITY|${a.lot}|${a.id}|${a.planId||''}|${a.planVersion||''}">${a.lot} · ${a.id} · ${esc(a.title)} · ${a.planId?`${a.planId} v${a.planVersion}`:'sin plan'}</option>`);
    return [...lots,...activities].join('');
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('[data-econ-cost]')){
      const cats=CATS.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
      openModal('ECONOMÍA · REGISTRO DEMO','Registrar costo operativo',`<div class="fields"><label class="full">Asignación explícita<select name="allocationRef" required>${allocationOptions()}</select></label><label>Categoría<select name="category">${cats}</select></label><label>Fecha<input name="date" type="date" required></label><label class="full">Concepto<input name="concept" required placeholder="Qué costo ocurrió y por qué"></label><label>Monto COP<input name="amount" type="number" min="0" step="100" required></label><label>Soporte<select name="evidence"><option>Sin soporte</option><option>Factura DEMO</option><option>Cuenta / comprobante DEMO</option><option>Orden / registro DEMO</option><option>Evidencia fotográfica DEMO</option></select></label><label>Responsable<input name="owner" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Contexto<textarea name="detail" placeholder="Origen, necesidad, proveedor o contexto; no usar para inventar vínculo con una actividad"></textarea></label><label class="full">Integridad<input value="LOCAL_ONLY · COST LINK ≠ ACCOUNTING ENTRY · NO CONTABILIDAD OFICIAL" readonly></label></div>`,true,'economics-cost');
    }
    if(event.target.closest('[data-econ-scenario]')){
      const current=settings()['CAF-A1']||{};
      openModal('ECONOMÍA · ESCENARIO','Configurar CAF-A1',`<div class="fields"><label>Presupuesto COP<input name="budget" type="number" value="${Number(current.budget)||BASE['CAF-A1'].budget}"></label><label>Volumen escenario (t)<input name="volume" type="number" step="0.01" value="${Number(current.volume)||BASE['CAF-A1'].volume}"></label><label>Precio escenario COP/t<input name="priceScenario" type="number" value="${Number(current.priceScenario)||BASE['CAF-A1'].priceScenario}"></label><label>Autoridad<input value="ESCENARIO_DEMO_ONLY" readonly></label><label class="full">Nota<input value="No es precio de mercado, venta realizada ni promesa de rendimiento" readonly></label></div>`,true,'economics-scenario');
    }
  });

  document.addEventListener('click',event=>{
    const save=event.target.closest('#modal-save');
    if(!save||typeof modalAction==='undefined'||modalAction!=='economics-scenario')return;
    const values=Object.fromEntries(new FormData(document.getElementById('modal-form')).entries());
    const next=settings();
    next['CAF-A1']={budget:Number(values.budget)||0,volume:Number(values.volume)||0,priceScenario:Number(values.priceScenario)||0,updatedAt:new Date().toISOString(),localOnly:true};
    saveSettings(next);
  },true);
})();
