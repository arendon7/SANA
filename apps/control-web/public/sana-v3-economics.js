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
  function observedResult(lotId){
    const local=harvestRecords().filter(r=>r.lot===lotId).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if(local)return {quantity:Number(local.values?.quantity)||0,unit:local.values?.unit||'',source:local.values?.provenance||'LOCAL_ONLY',status:'LOCAL_ONLY'};
    const base=window.__SANA_RESULT_BASE__?.[lotId];
    return base?{quantity:base.observed,unit:base.unit,source:'BASELINE_DEMO',status:'BASELINE_DEMO'}:null;
  }
  function lotData(lot){
    const base=BASE[lot.id]||{budget:0,recorded:0,evidence:0,priceScenario:0,unit:'',volume:0};
    const cfg=settings()[lot.id]||{};
    const local=records().filter(r=>r.lot===lot.id);
    const localAmount=local.reduce((sum,r)=>sum+(Number(r.values?.amount)||0),0);
    const recorded=base.recorded+localAmount;
    const budget=Number(cfg.budget)||base.budget;
    const price=Number(cfg.priceScenario)||base.priceScenario;
    const volume=Number(cfg.volume)||base.volume;
    const grossScenario=price*volume;
    const grossMargin=grossScenario-recorded;
    const evidence=Math.min(100,base.evidence+Math.min(16,local.filter(r=>r.values?.evidence&&r.values.evidence!=='Sin soporte').length*4));
    const observed=observedResult(lot.id);
    return {...base,...cfg,recorded,budget,priceScenario:price,volume,grossScenario,grossMargin,evidence,local,observed};
  }
  function statusVariance(recorded,budget){if(!budget)return 'warn';const ratio=recorded/budget;return ratio>1?'danger':ratio>.9?'warn':'teal'}
  function pct(recorded,budget){return budget?Math.round(recorded/budget*100):0}
  function categoryTotals(lotId){
    const seed={labor:3900000,inputs:4450000,water:1380000,logistics:1120000,technical:1750000,equipment:860000,other:0};
    if(lotId!=='CAF-A1')Object.keys(seed).forEach(k=>seed[k]=Math.round(seed[k]*(BASE[lotId]?.recorded||10000000)/15950000));
    records().filter(r=>r.lot===lotId).forEach(r=>{const c=r.values?.category||'other';seed[c]=(seed[c]||0)+(Number(r.values?.amount)||0)});
    return seed;
  }

  function economics(){
    const rows=DEMO.lots.filter(l=>BASE[l.id]).map(l=>({lot:l,...lotData(l)}));
    const totalBudget=rows.reduce((s,x)=>s+x.budget,0);
    const totalRecorded=rows.reduce((s,x)=>s+x.recorded,0);
    const avgEvidence=Math.round(rows.reduce((s,x)=>s+x.evidence,0)/rows.length);
    const localCount=records().length;
    const observedCount=rows.filter(x=>x.observed).length;
    const focus=rows[0];
    const cats=categoryTotals(focus.lot.id);
    return `${head('SANA · ECONOMÍA DEL CULTIVO','Costear desde la operación y su evidencia.','La capa económica enlaza costos a lote, actividad, responsable y soporte. Resultado productivo observado y escenario comercial permanecen separados: esta DEMO no sustituye contabilidad, facturación ni valoración financiera.',`<button class="btn primary" data-econ-cost>Registrar costo</button><button class="btn secondary" data-econ-scenario>Configurar escenario</button>`)}
      <section class="grid metrics">${metric('Presupuesto operativo',money(totalBudget),'escenario DEMO')}${metric('Costos registrados',money(totalRecorded),`${localCount} registro(s) LOCAL_ONLY`,'good')}${metric('Resultados vinculados',observedCount,`${harvestRecords().length} creados por usuario`,'good')}${metric('Evidencia económica',`${avgEvidence}%`,'ponderación DEMO por soporte',avgEvidence>=80?'good':'warn')}</section>
      <section class="economics-grid">${rows.map(({lot,...d})=>`<article class="economics-lot"><header><div><small>${lot.id}</small><h3>${esc(lot.crop)} · ${esc(lot.name)}</h3></div><span class="status ${statusVariance(d.recorded,d.budget)}">${pct(d.recorded,d.budget)}% PRESUP.</span></header><div class="economics-bars"><div><span>Presupuesto</span><strong>${money(d.budget)}</strong></div><div><span>Registrado</span><strong>${money(d.recorded)}</strong></div><div><span>Resultado observado</span><strong>${d.observed?`${d.observed.quantity} ${esc(d.observed.unit)}`:'—'}</strong></div><div><span>Evidencia costos</span><strong>${d.evidence}%</strong></div></div><div class="progress"><i class="${statusVariance(d.recorded,d.budget)==='danger'?'warn':''}" style="width:${Math.min(100,pct(d.recorded,d.budget))}%"></i></div><footer><span>${d.observed?`Resultado: ${esc(d.observed.source)}`:'Sin resultado vinculado'} · Escenario: ${d.volume} ${esc(d.unit)} × ${d.priceScenario?money(d.priceScenario):'sin precio'}</span><strong>${d.priceScenario?`Margen bruto DE ESCENARIO ${money(d.grossMargin)}`:'Sin escenario comercial'}</strong></footer></article>`).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Estructura de costos · CAF-A1</h2><p>Distribución DEMO; los registros locales se suman por categoría.</p></div></div><div class="card-body economics-cats">${CATS.map(([id,label])=>{const amount=cats[id]||0;const share=Math.round(amount/Object.values(cats).reduce((a,b)=>a+b,0)*100)||0;return `<div><span>${label}</span><div class="progress"><i style="width:${share}%"></i></div><strong>${money(amount)}</strong><small>${share}%</small></div>`}).join('')}</div></article><article class="card"><div class="card-head"><div><h2>Resultado vs escenario</h2><p>Comparar no equivale a reconocer un ingreso.</p></div></div><div class="card-body">${rows.filter(x=>x.priceScenario).map(x=>`<div class="gate"><i>${x.observed?'✓':'!'}</i><div><strong>${x.lot.id} · ${esc(x.lot.crop)}</strong><p>Observado: ${x.observed?`${x.observed.quantity} ${esc(x.observed.unit)} · ${esc(x.observed.source)}`:'sin resultado'}<br>Escenario comercial: ${x.volume} ${esc(x.unit)} × ${money(x.priceScenario)}/${esc(x.unit)}</p></div><span class="status ${x.observed?'teal':'warn'}">SEPARADOS</span></div>`).join('')}<div class="section-note" style="margin-top:12px">Incluso cuando el volumen observado coincide con el volumen del escenario, SANA no infiere venta, precio realizado, recaudo ni margen contable. Eso requiere evidencia comercial/contable independiente.</div></div></article></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Calidad de evidencia económica</h2><p>Un costo sin fuente no mejora readiness por existir.</p></div></div><div class="card-body"><div class="gate"><i>1</i><div><strong>Registro operativo</strong><p>Lote, categoría, fecha, responsable y monto.</p></div><span class="status teal">REQUERIDO</span></div><div class="gate"><i>2</i><div><strong>Soporte</strong><p>Factura, cuenta, comprobante, orden o evidencia equivalente.</p></div><span class="status warn">CALIDAD</span></div><div class="gate"><i>3</i><div><strong>Resultado productivo</strong><p>Se vincula como cantidad/calidad, nunca como ingreso automático.</p></div><span class="status teal">SEPARADO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Contabilidad oficial</strong><p>Fuera del alcance de esta DEMO.</p></div><span class="status danger">NO ASUMIR</span></div></div></article><article class="card"><div class="card-head"><div><h2>Registros económicos del sandbox</h2><p>Alimentan el expediente únicamente como evidencia DEMO.</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Lote</th><th>Concepto</th><th>Monto</th><th>Soporte</th></tr></thead><tbody>${records().length?records().slice().reverse().map(r=>`<tr><td>${esc(r.values?.date||'Ahora')}</td><td>${esc(r.lot)}</td><td>${esc(r.values?.concept||r.title)}</td><td>${money(r.values?.amount)}</td><td>${esc(r.values?.evidence||'Sin soporte')}</td></tr>`).join(''):'<tr><td colspan="5"><div class="empty">Aún no hay costos creados por esta identidad.</div></td></tr>'}</tbody></table></div></article></section>${footer()}`;
  }

  views.economics=economics;

  document.addEventListener('click',event=>{
    if(event.target.closest('[data-econ-cost]')){
      const lots=DEMO.lots.filter(l=>BASE[l.id]).map(l=>`<option value="${l.id}">${l.id} · ${l.crop}</option>`).join('');
      const cats=CATS.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
      openModal('ECONOMÍA · REGISTRO DEMO','Registrar costo operativo',`<div class="fields"><label>Lote<select name="lot">${lots}</select></label><label>Categoría<select name="category">${cats}</select></label><label class="full">Concepto<input name="concept" required placeholder="Qué costo ocurrió y por qué"></label><label>Monto COP<input name="amount" type="number" min="0" step="100" required></label><label>Fecha<input name="date" type="date"></label><label>Soporte<select name="evidence"><option>Sin soporte</option><option>Factura DEMO</option><option>Cuenta / comprobante DEMO</option><option>Orden / registro DEMO</option><option>Evidencia fotográfica DEMO</option></select></label><label>Responsable<input name="owner" value="${esc(identity?.displayName||'Responsable DEMO')}"></label><label class="full">Vínculo con plan/actividad<textarea name="detail" placeholder="Actividad, etapa o necesidad que explica este costo"></textarea></label><label class="full">Integridad<input value="LOCAL_ONLY · NO CONTABILIDAD OFICIAL" readonly></label></div>`,true,'economics-cost');
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
