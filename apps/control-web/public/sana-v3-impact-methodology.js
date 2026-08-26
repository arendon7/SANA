(() => {
  'use strict';

  const IMPACT_KEY='sana.v3.impact.methodology';
  const INDICATORS=[
    {id:'soil-om',layer:'Suelo',name:'Materia orgánica',baseline:2.8,current:3.4,unit:'%',method:'Comparación de análisis de suelo DEMO en puntos equivalentes.',source:'Análisis DEMO · 2 cortes',frequency:'Semestral',quality:'EVIDENCE_DEMO',verification:'NO_VERIFICADO_EXTERNO',direction:'up'},
    {id:'water',layer:'Agua',name:'Uso de agua',baseline:4200,current:3444,unit:'m³/ha·ciclo',method:'Volumen estimado desde lecturas IoT + registros operativos DEMO.',source:'IoT + bitácora AGROWAY',frequency:'Ciclo',quality:'ESTIMADO',verification:'NO_VERIFICADO_EXTERNO',direction:'down'},
    {id:'circular',layer:'Circularidad',name:'Insumos circulares',baseline:38,current:62,unit:'%',method:'Participación de insumos circulares sobre programa nutricional registrado.',source:'Inventario + aplicaciones',frequency:'Mensual',quality:'TRAZABLE_DEMO',verification:'INTERNO',direction:'up'},
    {id:'evidence',layer:'Gestión',name:'Actividades con evidencia',baseline:68,current:92,unit:'%',method:'Eventos ejecutados con evidencia vinculada / eventos ejecutados.',source:'AGROWAY + Passport',frequency:'Semanal',quality:'TRAZABLE_DEMO',verification:'INTERNO',direction:'up'},
    {id:'restoration',layer:'Biodiversidad',name:'Área de restauración acompañada',baseline:0,current:3.9,unit:'ha',method:'Área DEMO delimitada como RES-01 con línea base fotográfica/georreferenciada.',source:'Territorio + Passport',frequency:'Trimestral',quality:'EVIDENCE_DEMO',verification:'NO_VERIFICADO_EXTERNO',direction:'up'}
  ];

  function state(){try{return JSON.parse(localStorage.getItem(IMPACT_KEY)||'{}')}catch{return {}}}
  function save(next){localStorage.setItem(IMPACT_KEY,JSON.stringify(next))}
  function qualityScore(q){return q==='TRAZABLE_DEMO'?88:q==='EVIDENCE_DEMO'?78:q==='ESTIMADO'?58:40}
  function delta(i){const d=i.current-i.baseline;const pct=i.baseline?d/i.baseline*100:null;return {d,pct}}
  function good(i){return i.direction==='down'?i.current<i.baseline:i.current>i.baseline}
  function reviewed(){return Boolean(state().humanReviewed)}
  function overallQuality(){return Math.round(INDICATORS.reduce((s,i)=>s+qualityScore(i.quality),0)/INDICATORS.length)}
  function rows(){return INDICATORS.map(i=>({...i,qualityScore:qualityScore(i.quality),delta:delta(i),trend:good(i)?'FAVORABLE_DEMO':'REVISAR'}))}
  function summary(){
    const review=state();
    const list=rows();
    return {
      indicators:list.length,
      overallQuality:overallQuality(),
      humanReviewed:Boolean(review.humanReviewed),
      reviewer:review.by||'',
      reviewNote:review.note||'',
      reviewedAt:review.updatedAt||null,
      internallyVerified:list.filter(i=>i.verification==='INTERNO').length,
      externallyVerified:list.filter(i=>i.verification==='VERIFICADO_EXTERNO').length,
      externallyUnverified:list.filter(i=>i.verification==='NO_VERIFICADO_EXTERNO').length,
      estimated:list.filter(i=>i.quality==='ESTIMADO').length,
      integrity:'IMPACT_METHOD_REVIEW ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION ≠ CAUSALITY'
    };
  }

  function impactMethodology(){
    const review=state();
    const q=overallQuality();
    return `${head('SANA · IMPACT','Medir cambio sin confundir evidencia con afirmación.','Cada indicador conserva frontera, línea base, método, fuente, calidad y estado de verificación. La DEMO permite evaluar trazabilidad metodológica; no emite certificaciones ambientales.',`<button class="btn primary" data-impact-review>${review.humanReviewed?'Revisado por responsable':'Revisar metodología'}</button>`)}
      <section class="grid metrics">${metric('Indicadores activos',INDICATORS.length,'suelo · agua · circularidad · gestión · biodiversidad')}${metric('Calidad media',`${q}%`,'calidad DEMO de procedencia',q>=75?'good':'warn')}${metric('Revisión humana',review.humanReviewed?'COMPLETA':'PENDIENTE',review.humanReviewed?review.by||'responsable DEMO':'HUMAN_REVIEW_REQUIRED',review.humanReviewed?'good':'warn')}${metric('Verificación externa','0 / 5','ningún indicador se presenta como certificado','warn')}</section>
      <section class="impact-method-grid">${INDICATORS.map(i=>{const d=delta(i);return `<article class="impact-indicator"><header><div><small>${esc(i.layer)}</small><h3>${esc(i.name)}</h3></div><span class="status ${good(i)?'teal':'warn'}">${good(i)?'TENDENCIA FAVORABLE':'REVISAR'}</span></header><div class="impact-values"><div><span>Línea base</span><strong>${i.baseline} ${i.unit}</strong></div><div><span>Actual DEMO</span><strong>${i.current} ${i.unit}</strong></div><div><span>Cambio</span><strong>${d.pct===null?`${d.d} ${i.unit}`:`${d.pct>0?'+':''}${d.pct.toFixed(1)}%`}</strong></div></div><div class="impact-method"><strong>Método</strong><p>${esc(i.method)}</p><div><span>Fuente</span><b>${esc(i.source)}</b></div><div><span>Frecuencia</span><b>${esc(i.frequency)}</b></div><div><span>Calidad</span><b>${esc(i.quality)}</b></div><div><span>Verificación</span><b>${esc(i.verification)}</b></div></div></article>`}).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Arquitectura metodológica</h2><p>Antes de comunicar impacto, cada capa debe ser explícita.</p></div></div><div class="card-body"><div class="workflow"><div class="stage done"><span class="num">1</span><strong>Frontera</strong><span>Unidad + periodo</span></div><div class="stage done"><span class="num">2</span><strong>Línea base</strong><span>Fuente + fecha</span></div><div class="stage current"><span class="num">3</span><strong>Medición</strong><span>Método + frecuencia</span></div><div class="stage"><span class="num">4</span><strong>Calidad</strong><span>Medido / estimado</span></div><div class="stage"><span class="num">5</span><strong>Revisión</strong><span>Responsable humano</span></div><div class="stage"><span class="num">6</span><strong>Verificación</strong><span>Externa si aplica</span></div></div></div></article><article class="card"><div class="card-head"><div><h2>Jerarquía de afirmaciones</h2><p>Qué se puede decir con cada nivel de evidencia.</p></div></div><div class="card-body"><div class="gate"><i>1</i><div><strong>Indicador interno trazable</strong><p>Dato operativo con fuente y método visibles.</p></div><span class="status teal">PERMITIDO DEMO</span></div><div class="gate"><i>2</i><div><strong>Estimación</strong><p>Debe presentarse explícitamente como estimada.</p></div><span class="status warn">ETIQUETAR</span></div><div class="gate"><i>3</i><div><strong>Afirmación externa de impacto</strong><p>Puede requerir metodología consolidada y verificación independiente.</p></div><span class="status danger">NO ASUMIR</span></div><div class="gate"><i class="blocked">×</i><div><strong>Certificación</strong><p>Esta DEMO no certifica carbono, biodiversidad, suelo ni sostenibilidad.</p></div><span class="status danger">FUERA DE DEMO</span></div></div></article></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Matriz de calidad</h2><p>La calidad del dato se evalúa separada de si la tendencia es positiva.</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Indicador</th><th>Procedencia</th><th>Calidad DEMO</th><th>Verificación</th><th>Uso permitido</th></tr></thead><tbody>${INDICATORS.map(i=>`<tr><td><strong>${esc(i.name)}</strong></td><td>${esc(i.source)}</td><td>${qualityScore(i.quality)}% · ${esc(i.quality)}</td><td>${esc(i.verification)}</td><td>${i.verification==='INTERNO'?'Seguimiento operativo':'Seguimiento + preparación de expediente'}</td></tr>`).join('')}</tbody></table></div></section>${footer()}`;
  }

  views.impact=impactMethodology;
  window.__SANA_IMPACT__=Object.freeze({rows:()=>rows().map(i=>({...i,delta:{...i.delta}})),summary,review:()=>({...state()}),overallQuality,integrity:'REVIEWED_DEMO ≠ VERIFIED_EXTERNAL ≠ CERTIFIED'});

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-impact-review]');
    if(!button||typeof openModal!=='function')return;
    const current=state();
    openModal('SANA IMPACT · REVISIÓN','Revisión metodológica humana',`<div class="fields"><label>Responsable<input name="by" value="${esc(current.by||identity?.displayName||'Responsable DEMO')}" required></label><label>Estado<select name="status"><option value="reviewed">Revisada DEMO</option><option value="pending">Pendiente</option></select></label><label class="full">Observación<textarea name="note" placeholder="Brechas metodológicas, fuentes faltantes o criterios para próxima medición">${esc(current.note||'')}</textarea></label><label class="full">Frontera<input value="Revisión DEMO · no equivale a verificación independiente" readonly></label></div>`,true,'impact-methodology-review');
  });

  document.addEventListener('click',event=>{
    const saveButton=event.target.closest('#modal-save');
    if(!saveButton||typeof modalAction==='undefined'||modalAction!=='impact-methodology-review')return;
    const values=Object.fromEntries(new FormData(document.getElementById('modal-form')).entries());
    save({humanReviewed:values.status==='reviewed',by:values.by||'',note:values.note||'',updatedAt:new Date().toISOString(),quality:overallQuality(),localOnly:true});
  },true);
})();
