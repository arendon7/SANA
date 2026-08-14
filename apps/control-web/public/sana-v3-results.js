(() => {
  'use strict';

  const BASE_RESULTS={
    'CAF-A1':{planned:6.20,observed:5.82,unit:'t',quality:'84% estándar DEMO',date:'28 jul 2026',evidence:82,status:'BASELINE_DEMO'},
    'AGU-A2':{planned:28.00,observed:26.32,unit:'t',quality:'89% primera DEMO',date:'02 ago 2026',evidence:78,status:'BASELINE_DEMO'},
    'CAC-B1':{planned:1.80,observed:1.64,unit:'t',quality:'81% fermentación DEMO',date:'06 ago 2026',evidence:74,status:'BASELINE_DEMO'}
  };
  window.__SANA_RESULT_BASE__=Object.freeze(Object.fromEntries(Object.entries(BASE_RESULTS).map(([key,value])=>[key,Object.freeze({...value})])));

  function localResults(){return storage.records.filter(r=>r.type==='harvest-result')}
  function lotResults(lotId){return localResults().filter(r=>r.lot===lotId)}
  function latestLocal(lotId){return lotResults(lotId).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0]||null}
  function asNumber(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function pct(a,b){return b?Math.round(a/b*100):0}
  function productiveLots(){return DEMO.lots.filter(l=>BASE_RESULTS[l.id])}

  function effectiveResult(lot){
    const base=BASE_RESULTS[lot.id];
    const local=latestLocal(lot.id);
    if(!local)return {...base,source:'Datos sintéticos de línea base',local:false};
    return {
      planned:asNumber(local.values?.planned)||base.planned,
      observed:asNumber(local.values?.quantity),
      unit:local.values?.unit||base.unit,
      quality:local.values?.quality||'Sin clasificación',
      date:local.values?.date||'Ahora',
      evidence:local.values?.evidence==='Sin soporte'?45:local.values?.evidence?88:55,
      status:'LOCAL_ONLY',
      source:local.values?.provenance||'OBSERVADO / DECLARADO',
      local:true,
      record:local
    };
  }

  function resultStatus(r){const ratio=pct(r.observed,r.planned);return ratio>=95?'teal':ratio>=80?'warn':'danger'}

  function results(){
    const lots=productiveLots();
    const rows=lots.map(l=>({lot:l,result:effectiveResult(l)}));
    const localCount=localResults().length;
    const avgPlan=Math.round(rows.reduce((s,x)=>s+Math.min(120,pct(x.result.observed,x.result.planned)),0)/rows.length);
    const avgEvidence=Math.round(rows.reduce((s,x)=>s+x.result.evidence,0)/rows.length);
    return `${head('AGROWAY · COSECHA Y RESULTADOS','Cerrar el ciclo con lo que realmente ocurrió.','Resultados observados, calidad, responsable y evidencia se registran aparte de presupuestos y escenarios. Un escenario económico nunca se convierte automáticamente en cosecha real.',`<button class="btn primary" data-harvest-result>Registrar resultado</button><button class="btn secondary" data-view-link="economics">Comparar con economía</button>`)}
      <section class="grid metrics">${metric('Unidades con resultado',rows.length,'línea base sintética + registros locales','good')}${metric('Cumplimiento medio',`${avgPlan}%`,'observado vs plan DEMO',avgPlan>=90?'good':'warn')}${metric('Calidad de evidencia',`${avgEvidence}%`,'soporte de resultados',avgEvidence>=80?'good':'warn')}${metric('Registros del usuario',localCount,'LOCAL_ONLY / nube DEMO si aplica',localCount?'good':'warn')}</section>
      <section class="economics-grid">${rows.map(({lot,result:r})=>`<article class="economics-lot"><header><div><small>${lot.id} · ${esc(r.source)}</small><h3>${esc(lot.crop)} · ${esc(lot.name)}</h3></div><span class="status ${resultStatus(r)}">${pct(r.observed,r.planned)}% DEL PLAN</span></header><div class="economics-bars"><div><span>Plan DEMO</span><strong>${r.planned} ${esc(r.unit)}</strong></div><div><span>Observado</span><strong>${r.observed||'—'} ${esc(r.unit)}</strong></div><div><span>Calidad</span><strong>${esc(r.quality)}</strong></div><div><span>Evidencia</span><strong>${r.evidence}%</strong></div></div><div class="progress"><i class="${resultStatus(r)==='danger'?'warn':''}" style="width:${Math.min(100,pct(r.observed,r.planned))}%"></i></div><footer><span>${esc(r.date)} · ${esc(r.status)}</span><strong>${r.local?'Registro creado por esta identidad':'Línea base sintética de demostración'}</strong></footer></article>`).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Cadena de cierre productivo</h2><p>Qué debe existir antes de interpretar un resultado.</p></div></div><div class="card-body"><div class="workflow"><div class="stage done"><span class="num">1</span><strong>Plan</strong><span>Objetivo + versión</span></div><div class="stage done"><span class="num">2</span><strong>Ejecución</strong><span>Actividades</span></div><div class="stage done"><span class="num">3</span><strong>Acompañamiento</strong><span>Hallazgos</span></div><div class="stage current"><span class="num">4</span><strong>Resultado</strong><span>Cosecha + calidad</span></div><div class="stage"><span class="num">5</span><strong>Economía</strong><span>Costos + escenario</span></div><div class="stage"><span class="num">6</span><strong>Impacto</strong><span>Método + evidencia</span></div></div></div></article><article class="card"><div class="card-head"><div><h2>Reglas de interpretación</h2><p>Evitan confundir una cifra con una conclusión.</p></div></div><div class="card-body"><div class="gate"><i>1</i><div><strong>Resultado observado</strong><p>Cantidad/calidad registrada con fecha, origen y responsable.</p></div><span class="status teal">DATO</span></div><div class="gate"><i class="warn">2</i><div><strong>Resultado declarado</strong><p>Se conserva como declarado hasta tener evidencia adicional.</p></div><span class="status warn">FUENTE</span></div><div class="gate"><i class="warn">3</i><div><strong>Escenario económico</strong><p>Sirve para comparación; no prueba ingreso ni precio real.</p></div><span class="status warn">ESCENARIO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Atribuir causalidad</strong><p>Un mayor resultado no demuestra por sí solo que una práctica lo causó.</p></div><span class="status danger">NO ASUMIR</span></div></div></article></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Resultados creados en el sandbox</h2><p>Estos registros alimentan Passport y pueden sincronizarse como estado DEMO del propietario cuando Firestore está habilitado.</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Lote</th><th>Cantidad</th><th>Calidad</th><th>Procedencia</th><th>Evidencia</th><th>Estado</th></tr></thead><tbody>${localResults().length?localResults().slice().reverse().map(r=>`<tr><td>${esc(r.values?.date||'Ahora')}</td><td><strong>${esc(r.lot)}</strong></td><td>${esc(r.values?.quantity||'—')} ${esc(r.values?.unit||'')}</td><td>${esc(r.values?.quality||'Sin clasificación')}</td><td>${esc(r.values?.provenance||'—')}</td><td>${esc(r.values?.evidence||'Sin soporte')}</td><td><span class="status warn">LOCAL_ONLY</span></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">Todavía no hay resultados creados por esta identidad.</div></td></tr>'}</tbody></table></div></section>${footer()}`;
  }

  views.results=results;

  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-harvest-result]'))return;
    const lots=productiveLots().map(l=>`<option value="${l.id}">${l.id} · ${esc(l.crop)}</option>`).join('');
    openModal('COSECHA / RESULTADO · DEMO','Registrar resultado productivo',`<div class="fields"><label>Lote<select name="lot">${lots}</select></label><label>Fecha<input name="date" type="date" required></label><label>Cantidad observada<input name="quantity" type="number" min="0" step="0.01" required></label><label>Unidad<select name="unit"><option value="t">t</option><option value="kg">kg</option><option value="unidades">unidades</option></select></label><label>Plan de referencia<input name="planned" type="number" min="0" step="0.01" placeholder="Cantidad planificada DEMO"></label><label>Procedencia<select name="provenance"><option>OBSERVADO</option><option>MEDIDO</option><option>DECLARADO POR PRODUCTOR</option><option>REGISTRO DE ENTREGA DEMO</option></select></label><label class="full">Calidad / clasificación<input name="quality" placeholder="Criterio, categoría o resultado de clasificación"></label><label>Evidencia<select name="evidence"><option>Sin soporte</option><option>Registro de pesaje DEMO</option><option>Foto / lote DEMO</option><option>Documento de entrega DEMO</option><option>Registro de calidad DEMO</option></select></label><label>Responsable<input name="owner" value="${esc(identity?.displayName||'Responsable DEMO')}"></label><label class="full">Observación<textarea name="detail" required placeholder="Qué se obtuvo, cómo se midió/declaró y qué debe revisarse"></textarea></label><label class="full">Integridad<input value="LOCAL_ONLY · NO ES FACTURA, INGRESO NI CERTIFICACIÓN" readonly></label></div>`,true,'harvest-result');
  });
})();
