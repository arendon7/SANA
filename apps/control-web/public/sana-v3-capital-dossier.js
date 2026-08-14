(() => {
  'use strict';

  const CAPITAL_KEY='sana.v3.capital.dossier';

  const GATE_DEFS=[
    {id:'identity',title:'Identidad y caracterización',weight:16,source:'Caracterización integral',why:'La contraparte debe entender quién produce, dónde, bajo qué contexto y con qué brechas.'},
    {id:'technical',title:'Plan técnico y responsables',weight:18,source:'Planes versionados',why:'La necesidad de capital debe conectarse con una hipótesis productiva y responsables humanos.'},
    {id:'operations',title:'Ejecución y trazabilidad',weight:18,source:'AGROWAY + Passport',why:'Demostrar que las actividades y decisiones pueden reconstruirse con evidencia.'},
    {id:'costs',title:'Costos y necesidad financiera',weight:14,source:'Registros administrativos',why:'Separar necesidad estimada, presupuesto, uso previsto y costos históricos respaldados.'},
    {id:'risk',title:'Riesgo y mitigación',weight:12,source:'Sanidad + agua + plan',why:'Mostrar riesgos relevantes, señales abiertas y mecanismos de mitigación sin prometer resultados.'},
    {id:'impact',title:'Impacto y metodología',weight:10,source:'SANA Impact',why:'Distinguir indicador trazable de estimación o afirmación que requiere verificación externa.'},
    {id:'legal',title:'Arquitectura jurídica / regulatoria',weight:12,source:'Proceso externo autorizado',why:'La eventual oferta, onboarding, KYC, contratación, pagos y custodia requieren diseño y proveedores autorizados cuando aplique.'}
  ];

  function characterizationState(){try{return JSON.parse(localStorage.getItem('sana.v3.characterization')||'{}')}catch{return {}}}
  function planReviewCount(){try{return JSON.parse(localStorage.getItem('sana.v3.plan.reviews')||'[]').length}catch{return 0}}
  function dossierState(){try{return JSON.parse(localStorage.getItem(CAPITAL_KEY)||'{}')}catch{return {}}}
  function saveDossier(next){localStorage.setItem(CAPITAL_KEY,JSON.stringify(next))}

  function characterizationScore(){
    const local=characterizationState();
    const baseline={identity:'complete',productive:'complete',soil:'review',water:'review',inputs:'complete',infrastructure:'complete',risks:'review',market:'missing',support:'complete',evidence:'review'};
    const keys=Object.keys(baseline);
    const total=keys.reduce((acc,key)=>{
      const status=local[key]?.status||baseline[key];
      return acc+(status==='complete'?1:status==='review'?.55:0);
    },0);
    return Math.round(total/keys.length*100);
  }

  function costEvidence(){
    const local=dossierState();
    const records=storage.records.filter(r=>/cost|costo|presupuesto|budget/i.test(`${r.type} ${r.title} ${JSON.stringify(r.values||{})}`));
    const configured=Boolean(local.needAmount&&local.useOfFunds&&local.horizon);
    return {score:Math.min(100,(configured?55:20)+Math.min(35,records.length*12)),records,configured};
  }

  function gateData(){
    const char=characterizationScore();
    const cost=costEvidence();
    const planEvidence=Math.round(DEMO.plans.reduce((a,p)=>a+p.progress,0)/DEMO.plans.length);
    const taskEvidence=DEMO.tasks.length?Math.round(DEMO.tasks.filter(t=>t.evidence&&t.evidence!=='Pendiente').length/DEMO.tasks.length*100):0;
    const passport=Math.round((DEMO.lots.reduce((a,l)=>a+l.evidence,0)/DEMO.lots.length+taskEvidence)/2);
    const openRisks=DEMO.incidents.filter(i=>!i.status.toLowerCase().includes('cerrada')).length;
    const risk=Math.max(45,92-openRisks*14);
    const local=dossierState();
    const impact=local.impactMethodologyReviewed?78:62;
    return {
      identity:{score:char,state:char>=85?'ready':char>=65?'review':'gap',detail:`${char}% cobertura ponderada de línea base`},
      technical:{score:Math.min(100,planEvidence+planReviewCount()*2),state:planEvidence>=80?'ready':'review',detail:`${DEMO.plans.length} planes · ${planReviewCount()} revisión(es) humana(s) DEMO`},
      operations:{score:passport,state:passport>=85?'ready':'review',detail:`${passport}% trazabilidad operativa estimada DEMO`},
      costs:{score:cost.score,state:cost.score>=80?'ready':'gap',detail:cost.configured?'Necesidad estructurada; revisar respaldo histórico':'Falta estructurar necesidad, horizonte y uso de fondos'},
      risk:{score:risk,state:risk>=75?'ready':'review',detail:`${openRisks} señal(es) abiertas en la unidad DEMO`},
      impact:{score:impact,state:impact>=75?'review':'gap',detail:'Indicadores DEMO; verificación externa no asumida'},
      legal:{score:20,state:'blocked',detail:'Fuera de la DEMO: arquitectura jurídica, onboarding, KYC, contratación, pagos/custodia'}
    };
  }

  function overall(gates){
    const total=GATE_DEFS.reduce((sum,g)=>sum+g.weight,0);
    return Math.round(GATE_DEFS.reduce((sum,g)=>sum+gates[g.id].score*g.weight,0)/total);
  }

  function moneyDemo(value){
    const n=Number(value)||48000000;
    try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)}catch{return `${n} COP`}
  }

  function capitalDossier(){
    const gates=gateData();
    const score=overall(gates);
    const local=dossierState();
    const need=local.needAmount||48000000;
    const use=local.useOfFunds||'Capital de trabajo técnico-productivo · insumos, acompañamiento y ejecución del plan DEMO';
    const horizon=local.horizon||'10 meses';
    const ready=GATE_DEFS.filter(g=>gates[g.id].state==='ready').length;
    const review=GATE_DEFS.filter(g=>gates[g.id].state==='review').length;
    const gaps=GATE_DEFS.filter(g=>['gap','blocked'].includes(gates[g.id].state)).length;

    return `${head('SANA · CAPITAL READINESS','Preparar un expediente antes de hablar de transacciones.','SANA conecta necesidad productiva, línea base, plan, ejecución, riesgo, evidencia e impacto para revisión humana. Esta capa no recomienda invertir, no capta recursos, no custodia fondos y no ejecuta pagos.',`<button class="btn primary" data-capital-config>Configurar caso DEMO</button>`)}
      <section class="capital-case"><article><small>CASO DEMOSTRATIVO · ${DEMO.farm.id}</small><h2>${esc(DEMO.farm.name)} · ${esc(DEMO.farm.producer)}</h2><p>${esc(use)}</p><div class="capital-case-meta"><div><span>Necesidad simulada</span><strong>${moneyDemo(need)}</strong></div><div><span>Horizonte</span><strong>${esc(horizon)}</strong></div><div><span>Readiness</span><strong>${score}%</strong></div><div><span>Dinero movido</span><strong>$0</strong></div></div></article><aside><span class="status danger">SIN OFERTA · SIN CUSTODIA</span><p>La puntuación es una herramienta de completitud documental DEMO. No es calificación crediticia, recomendación de inversión ni promesa de retorno.</p></aside></section>
      <section class="grid metrics" style="margin-top:14px">${metric('Readiness compuesto',`${score}%`,`${ready} gates listos · ${review} en revisión`,score>=75?'good':'warn')}${metric('Brechas / bloqueos',gaps,'incluye frontera regulatoria','warn')}${metric('Trazabilidad Passport',`${gates.operations.score}%`,'operación reconstruible DEMO','good')}${metric('Costos / necesidad',`${gates.costs.score}%`,gates.costs.state==='ready'?'evidencia suficiente DEMO':'requiere respaldo','warn')}</section>
      <section class="capital-gates">${GATE_DEFS.map((def,index)=>{const g=gates[def.id];return `<article class="capital-gate ${g.state}"><header><span>${String(index+1).padStart(2,'0')}</span><div><strong>${esc(def.title)}</strong><small>${esc(def.source)} · peso ${def.weight}%</small></div><b>${g.score}%</b><em class="status ${g.state==='ready'?'teal':g.state==='blocked'?'danger':'warn'}">${g.state==='ready'?'LISTO':g.state==='review'?'REVISAR':g.state==='blocked'?'FUERA DE DEMO':'BRECHA'}</em></header><p>${esc(g.detail)}</p><footer>${esc(def.why)}</footer></article>`}).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Expediente de preparación</h2><p>Qué puede revisar una contraparte autorizada sin acceder a funciones de ejecución.</p></div></div><div class="card-body"><div class="workflow"><div class="stage done"><span class="num">1</span><strong>Caracterización</strong><span>Quién + dónde + contexto</span></div><div class="stage done"><span class="num">2</span><strong>Plan</strong><span>Hipótesis + responsables</span></div><div class="stage current"><span class="num">3</span><strong>Evidencia</strong><span>Passport + operación</span></div><div class="stage"><span class="num">4</span><strong>Due diligence</strong><span>Humana / externa</span></div><div class="stage"><span class="num">5</span><strong>Decisión</strong><span>HUMAN_ONLY</span></div><div class="stage"><span class="num">6</span><strong>Proveedor autorizado</strong><span>Fuera de DEMO</span></div></div><div class="section-note" style="margin-top:12px">SANA puede preparar información y trazabilidad. Una futura experiencia transaccional debe estar separada, con roles, cumplimiento, contratos, pagos/custodia y proveedores adecuados definidos jurídicamente antes de habilitar cualquier ejecución.</div></div></article><article class="card"><div class="card-head"><div><h2>Uso previsto del capital DEMO</h2><p>El monto debe explicarse desde el plan, no desde una cifra aislada.</p></div></div><div class="card-body"><div class="capital-use"><div><span>Operación del plan</span><strong>42%</strong></div><div><span>Insumos / material</span><strong>27%</strong></div><div><span>Acompañamiento y evidencia</span><strong>18%</strong></div><div><span>Reserva de contingencia DEMO</span><strong>13%</strong></div></div><div class="section-note" style="margin-top:12px">Distribución ilustrativa. No constituye presupuesto aprobado ni instrucción de desembolso.</div></div></article></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Conexiones</h2><p>El dossier no duplica información: la referencia.</p></div></div><div class="card-body"><div class="quick-grid" style="grid-template-columns:1fr 1fr"><button class="quick" data-view-link="characterization"><strong>Caracterización</strong><span>Línea base y procedencia.</span></button><button class="quick" data-view-link="plans"><strong>Plan técnico</strong><span>Versiones y gates.</span></button><button class="quick" data-view-link="passport"><strong>Passport</strong><span>Cadena de evidencia.</span></button><button class="quick" data-view-link="impact"><strong>Impacto</strong><span>Indicadores y calidad.</span></button></div></div></article><article class="card"><div class="card-head"><div><h2>Límites no negociables</h2><p>Lo que esta capa nunca debe aparentar que hace.</p></div></div><div class="card-body"><div class="gate"><i class="blocked">×</i><div><strong>Recomendar una inversión</strong><p>Fuera del alcance de IA y DEMO.</p></div><span class="status danger">HUMAN_ONLY</span></div><div class="gate"><i class="blocked">×</i><div><strong>Aprobar / desembolsar / custodiar</strong><p>No existe capacidad transaccional.</p></div><span class="status danger">$0</span></div><div class="gate"><i class="blocked">×</i><div><strong>Presentar readiness como elegibilidad</strong><p>La puntuación solo mide completitud DEMO.</p></div><span class="status danger">PROHIBIDO</span></div></div></article></section>${footer()}`;
  }

  views.capital=capitalDossier;

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-capital-config]');
    if(!button||typeof openModal!=='function')return;
    const current=dossierState();
    const body=`<div class="fields"><label>Necesidad simulada COP<input name="needAmount" type="number" min="0" step="100000" value="${Number(current.needAmount)||48000000}"></label><label>Horizonte<input name="horizon" value="${esc(current.horizon||'10 meses')}"></label><label class="full">Uso previsto<textarea name="useOfFunds" required>${esc(current.useOfFunds||'Capital de trabajo técnico-productivo · insumos, acompañamiento y ejecución del plan DEMO')}</textarea></label><label>Metodología de impacto revisada<select name="impactMethodologyReviewed"><option value="false">No / pendiente</option><option value="true" ${current.impactMethodologyReviewed?'selected':''}>Sí · DEMO</option></select></label><label>Autoridad<input value="HUMAN_REVIEW_REQUIRED" readonly></label><label class="full">Frontera<input value="LOCAL_ONLY · SIN TRANSACCIONES · SIN CUSTODIA" readonly></label></div>`;
    openModal('CAPITAL READINESS · DEMO','Configurar expediente',body,true,'capital-dossier');
  });

  document.addEventListener('click',event=>{
    const saveButton=event.target.closest('#modal-save');
    if(!saveButton||typeof modalAction==='undefined'||modalAction!=='capital-dossier')return;
    const form=document.getElementById('modal-form');
    const values=Object.fromEntries(new FormData(form).entries());
    saveDossier({needAmount:Number(values.needAmount)||0,horizon:values.horizon||'',useOfFunds:values.useOfFunds||'',impactMethodologyReviewed:values.impactMethodologyReviewed==='true',updatedAt:new Date().toISOString(),localOnly:true});
  },true);
})();
