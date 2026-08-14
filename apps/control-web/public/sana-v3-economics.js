(() => {
  'use strict';

  const ECON_KEY='sana.v3.economics.settings';
  const BASE={
    'CAF-A1':{budget:18400000,recorded:15950000,evidence:78,priceScenario:13800000,unit:'t',volume:5.82},
    'AGU-A2':{budget:27300000,recorded:24100000,evidence:72,priceScenario:6100000,unit:'t',volume:26.32},
    'CAC-B1':{budget:12600000,recorded:10350000,evidence:69,priceScenario:9100000,unit:'t',volume:1.64},
    'RES-01':{budget:8800000,recorded:7420000,evidence:84,priceScenario:0,unit:'ha',volume:3.9}
  };
  const CATS=[
    ['labor','Mano de obra'],['inputs','Insumos y material'],['water','Agua / riego'],['logistics','Logística'],['technical','Acompañamiento técnico'],['equipment','Equipos / mantenimiento'],['other','Otros trazables']
  ];

  function settings(){try{return JSON.parse(localStorage.getItem(ECON_KEY)||'{}')}catch{return {}}}
  function saveSettings(next){localStorage.setItem(ECON_KEY,JSON.stringify(next))}
  function records(){return storage.records.filter(r=>r.type==='economics-cost')}
  function money(n){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0)}catch{return `${Number(n)||0} COP`}}
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
    return {...base,...cfg,recorded,budget,priceScenario:price,volume,grossScenario,grossMargin,evidence,local};
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
    const focus=rows[0];
    const cats=categoryTotals(focus.lot.id);
    return `${head('SANA · ECONOMÍA DEL CULTIVO','Costear desde la operación y su evidencia.','La capa económica enlaza costos a lote, actividad, responsable y soporte. No sustituye contabilidad ni valoración financiera; los ingresos y márgenes mostrados son escenarios DEMO.',`<button class="btn primary" data-econ-cost>Registrar costo</button><button class="btn secondary" data-econ-scenario>Configurar escenario</button>`)}
      <section class="grid metrics">${metric('Presupuesto operativo',money(totalBudget),'escenario DEMO')}${metric('Costos registrados',money(totalRecorded),`${localCount} registro(s) LOCAL_ONLY`,'good')}${metric('Evidencia económica',`${avgEvidence}%`,'ponderación DEMO por soporte',avgEvidence>=80?'good':'warn')}${metric('Desviación total',`${pct(totalRecorded,totalBudget)}%`,'ejecutado vs presupuesto',statusVariance(totalRecorded,totalBudget)==='danger'?'warn':'good')}</section>
      <section class="economics-grid">${rows.map(({lot,...d})=>`<article class="economics-lot"><header><div><small>${lot.id}</small><h3>${esc(lot.crop)} · ${esc(lot.name)}</h3></div><span class="status ${statusVariance(d.recorded,d.budget)}">${pct(d.recorded,d.budget)}% PRESUP.</span></header><div class="economics-bars"><div><span>Presupuesto</span><strong>${money(d.budget)}</strong></div><div><span>Registrado</span><strong>${money(d.recorded)}</strong></div><div><span>$/ha</span><strong>${money(d.recorded/lot.area)}</strong></div><div><span>Evidencia</span><strong>${d.evidence}%</strong></div></div><div class="progress"><i class="${statusVariance(d.recorded,d.budget)==='danger'?'warn':''}" style="width:${Math.min(100,pct(d.recorded,d.budget))}%"></i></div><footer><span>Escenario ingreso bruto: ${d.priceScenario?money(d.grossScenario):'NO APLICA'}</span><strong>${d.priceScenario?`Margen bruto DEMO ${money(d.grossMargin)}`:'Sin escenario comercial'}</strong></footer></article>`).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Estructura de costos · CAF-A1</h2><p>Distribución DEMO; los registros locales se suman por categoría.</p></div></div><div class="card-body economics-cats">${CATS.map(([id,label])=>{const amount=cats[id]||0;const share=Math.round(amount/Object.values(cats).reduce((a,b)=>a+b,0)*100)||0;return `<div><span>${label}</span><div class="progress"><i style="width:${share}%"></i></div><strong>${money(amount)}</strong><small>${share}%</small></div>`}).join('')}</div></article><article class="card"><div class="card-head"><div><h2>Calidad de evidencia económica</h2><p>Un costo sin fuente no mejora readiness por existir.</p></div></div><div class="card-body"><div class="gate"><i>1</i><div><strong>Registro operativo</strong><p>Lote, categoría, fecha, responsable y monto.</p></div><span class="status teal">REQUERIDO</span></div><div class="gate"><i>2</i><div><strong>Soporte</strong><p>Factura, cuenta, comprobante, orden o evidencia equivalente.</p></div><span class="status warn">CALIDAD</span></div><div class="gate"><i>3</i><div><strong>Vínculo productivo</strong><p>Actividad/plan que explica por qué ocurrió el costo.</p></div><span class="status teal">TRAZABLE</span></div><div class="gate"><i class="blocked">×</i><div><strong>Contabilidad oficial</strong><p>Fuera del alcance de esta DEMO.</p></div><span class="status danger">NO ASUMIR</span></div></div></article></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Registros económicos del sandbox</h2><p>Estos eventos permanecen LOCAL_ONLY y alimentan Capital Readiness únicamente como evidencia DEMO.</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Lote</th><th>Categoría</th><th>Concepto</th><th>Monto</th><th>Soporte</th><th>Estado</th></tr></thead><tbody>${records().length?records().slice().reverse().map(r=>`<tr><td>${esc(r.values?.date||'Ahora')}</td><td>${esc(r.lot)}</td><td>${esc(CATS.find(x=>x[0]===r.values?.category)?.[1]||r.values?.category||'Otro')}</td><td>${esc(r.values?.concept||r.title)}</td><td>${money(r.values?.amount)}</td><td>${esc(r.values?.evidence||'Sin soporte')}</td><td><span class="status warn">LOCAL_ONLY</span></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">Aún no hay costos creados por el usuario en este navegador.</div></td></tr>'}</tbody></table></div></section>${footer()}`;
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
      openModal('ECONOMÍA · ESCENARIO','Configurar CAF-A1',`<div class="fields"><label>Presupuesto COP<input name="budget" type="number" value="${Number(current.budget)||BASE['CAF-A1'].budget}"></label><label>Volumen escenario (t)<input name="volume" type="number" step="0.01" value="${Number(current.volume)||BASE['CAF-A1'].volume}"></label><label>Precio escenario COP/t<input name="priceScenario" type="number" value="${Number(current.priceScenario)||BASE['CAF-A1'].priceScenario}"></label><label>Autoridad<input value="ESCENARIO_DEMO_ONLY" readonly></label><label class="full">Nota<input value="No es precio de mercado, proyección oficial ni promesa de rendimiento" readonly></label></div>`,true,'economics-scenario');
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
