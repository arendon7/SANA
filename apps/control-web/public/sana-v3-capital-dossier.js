(() => {
  'use strict';

  const CAPITAL_KEY='sana.v3.capital.dossier';

  const GATE_DEFS=[
    {id:'identity',title:'Identidad y caracterización',weight:16,source:'Caracterización integral',why:'La contraparte debe entender quién produce, dónde, bajo qué contexto y con qué brechas.'},
    {id:'technical',title:'Plan técnico y responsables',weight:18,source:'Planes versionados',why:'La necesidad de capital debe conectarse con una hipótesis productiva y responsables humanos.'},
    {id:'operations',title:'Ejecución y trazabilidad',weight:18,source:'Activity Contract + Passport',why:'Demostrar que las actividades y decisiones pueden reconstruirse con evidencia sin mezclar economía, impacto o desempeño.'},
    {id:'costs',title:'Costos y necesidad financiera',weight:14,source:'__SANA_ECONOMICS__',why:'Separar necesidad estimada, presupuesto/escenario, BASELINE_DEMO y costos LOCAL_ONLY explícitamente respaldados.'},
    {id:'risk',title:'Riesgo y mitigación',weight:12,source:'Sanidad + agua + plan',why:'Mostrar riesgos relevantes, señales abiertas y mecanismos de mitigación sin prometer resultados.'},
    {id:'impact',title:'Impacto y metodología',weight:10,source:'SANA Impact',why:'Distinguir indicador trazable de estimación o afirmación que requiere verificación externa.'},
    {id:'legal',title:'Arquitectura jurídica / regulatoria',weight:12,source:'Proceso externo autorizado',why:'La eventual oferta, onboarding, KYC, contratación, pagos y custodia requieren diseño y proveedores autorizados cuando aplique.'}
  ];

  function characterizationState(){try{return JSON.parse(localStorage.getItem('sana.v3.characterization')||'{}')}catch{return {}}}
  function planReviewCount(){try{return JSON.parse(localStorage.getItem('sana.v3.plan.reviews')||'[]').length}catch{return 0}}
  function dossierState(){try{return JSON.parse(localStorage.getItem(CAPITAL_KEY)||'{}')}catch{return {}}}
  function saveDossier(next){localStorage.setItem(CAPITAL_KEY,JSON.stringify(next))}
  function moneyDemo(value){const n=Number(value)||0;try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)}catch{return `${n} COP`}}

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

  function economicsEvidence(){
    const api=window.__SANA_ECONOMICS__;
    const local=dossierState();
    const rows=api?.rows?.()||[];
    const costs=api?.costs?.()||[];
    const cycles=DEMO.plans.map(p=>api?.cycleSummary?.(p.id)).filter(Boolean);
    const explicit=cycles.flatMap(c=>c.explicitCosts||[]);
    const supported=explicit.filter(c=>c.supported&&c.linkIntegrity==='OK');
    const mismatches=cycles.reduce((sum,c)=>sum+(c.mismatchedCosts?.length||0),0);
    const unallocated=cycles.reduce((sum,c)=>sum+(c.unallocatedLotCosts?.length||0),0);
    const configured=Boolean(local.needAmount&&local.useOfFunds&&local.horizon);
    const supportCoverage=explicit.length?Math.round(supported.length/explicit.length*100):0;
    const budget=rows.reduce((sum,r)=>sum+(Number(r.budget)||0),0);
    const baseline=rows.reduce((sum,r)=>sum+(Number(r.baseRecorded)||0),0);
    const localRecorded=rows.reduce((sum,r)=>sum+(Number(r.localRecorded)||0),0);
    const explicitAmount=cycles.reduce((sum,c)=>sum+(Number(c.explicitAmount)||0),0);
    const score=Math.min(100,
      (configured?30:10)+
      (api?15:0)+
      (explicit.length?20:0)+
      Math.round(supportCoverage*.25)+
      (explicit.length&&mismatches===0?10:0)
    );
    return {score,configured,rows,costs,cycles,explicit,supported,mismatches,unallocated,supportCoverage,budget,baseline,localRecorded,explicitAmount,contractAvailable:Boolean(api)};
  }

  function operationsEvidence(){
    const activities=window.__SANA_PLAN_FIELD_WORKFLOW__?.activities?.()||[];
    if(activities.length){
      const linked=activities.filter(a=>a.planId).length;
      const withClosure=activities.filter(a=>['COMPLETED','REPROGRAMMED','NOT_EXECUTED'].includes(a.state?.code)).length;
      const required=activities.filter(a=>a.evidenceRequired);
      const withEvidence=required.filter(a=>(a.evidence||[]).length>0).length;
      const planCoverage=Math.round(linked/activities.length*100);
      const closureCoverage=Math.round(withClosure/activities.length*100);
      const evidenceCoverage=required.length?Math.round(withEvidence/required.length*100):100;
      const score=Math.round(planCoverage*.2+closureCoverage*.4+evidenceCoverage*.4);
      return {score,activities:activities.length,linked,withClosure,required:required.length,withEvidence,planCoverage,closureCoverage,evidenceCoverage,detail:`${linked}/${activities.length} con plan · ${withClosure}/${activities.length} con evento de cierre · ${withEvidence}/${required.length} evidencia requerida`};
    }
    const taskEvidence=DEMO.tasks.length?Math.round(DEMO.tasks.filter(t=>t.evidence&&t.evidence!=='Pendiente').length/DEMO.tasks.length*100):0;
    const passport=Math.round((DEMO.lots.reduce((a,l)=>a+l.evidence,0)/DEMO.lots.length+taskEvidence)/2);
    return {score:passport,activities:0,linked:0,withClosure:0,required:0,withEvidence:0,planCoverage:0,closureCoverage:0,evidenceCoverage:taskEvidence,detail:`${passport}% trazabilidad operativa estimada DEMO · fallback legacy`};
  }

  function gateData(){
    const char=characterizationScore();
    const cost=economicsEvidence();
    const operations=operationsEvidence();
    const planEvidence=Math.round(DEMO.plans.reduce((a,p)=>a+p.progress,0)/DEMO.plans.length);
    const openRisks=DEMO.incidents.filter(i=>!i.status.toLowerCase().includes('cerrada')).length;
    const risk=Math.max(45,92-openRisks*14);
    const local=dossierState();
    const impact=local.impactMethodologyReviewed?78:62;
    const costDetail=!cost.contractAvailable?'Read-model económico no disponible':cost.configured?`${cost.explicit.length} costo(s) explícitos · ${cost.supportCoverage}% con soporte · ${cost.mismatches} mismatch`:'Falta estructurar necesidad, horizonte y uso de fondos; la evidencia económica permanece separada';
    return {
      identity:{score:char,state:char>=85?'ready':char>=65?'review':'gap',detail:`${char}% cobertura ponderada de línea base`},
      technical:{score:Math.min(100,planEvidence+planReviewCount()*2),state:planEvidence>=80?'ready':'review',detail:`${DEMO.plans.length} planes · ${planReviewCount()} revisión(es) humana(s) DEMO`},
      operations:{score:operations.score,state:operations.score>=85?'ready':operations.score>=65?'review':'gap',detail:operations.detail},
      costs:{score:cost.score,state:cost.score>=80?'ready':cost.score>=55?'review':'gap',detail:costDetail},
      risk:{score:risk,state:risk>=75?'ready':'review',detail:`${openRisks} señal(es) abiertas en la unidad DEMO`},
      impact:{score:impact,state:impact>=75?'review':'gap',detail:'Indicadores DEMO; verificación externa no asumida'},
      legal:{score:20,state:'blocked',detail:'Fuera de la DEMO: arquitectura jurídica, onboarding, KYC, contratación, pagos/custodia'}
    };
  }

  function overall(gates){
    const total=GATE_DEFS.reduce((sum,g)=>sum+g.weight,0);
    return Math.round(GATE_DEFS.reduce((sum,g)=>sum+gates[g.id].score*g.weight,0)/total);
  }

  function capitalDossier(){
    const gates=gateData();
    const economics=economicsEvidence();
    const operations=operationsEvidence();
    const score=overall(gates);
    const local=dossierState();
    const need=local.needAmount||48000000;
    const use=local.useOfFunds||'Capital de trabajo técnico-productivo · insumos, acompañamiento y ejecución del plan DEMO';
    const horizon=local.horizon||'10 meses';
    const ready=GATE_DEFS.filter(g=>gates[g.id].state==='ready').length;
    const review=GATE_DEFS.filter(g=>gates[g.id].state==='review').length;
    const gaps=GATE_DEFS.filter(g=>['gap','blocked'].includes(gates[g.id].state)).length;
    const role=window.__SANA_ACCESS__?.role||String(identity?.role||'new_user').toLowerCase();
    const canConfigure=['admin','producer'].includes(role)&&window.__SANA_ACCESS__?.canAction?.('capital-dossier')!==false;

    return `${head('SANA · CAPITAL READINESS','Preparar un expediente antes de hablar de transacciones.','SANA conecta necesidad productiva, línea base, plan, ejecución, riesgo, evidencia, economía e impacto para revisión humana. Esta capa no recomienda invertir, no capta recursos, no custodia fondos y no ejecuta pagos.',canConfigure?`<button class="btn primary" data-capital-config>Configurar caso DEMO</button>`:'')}
      <section class="capital-case"><article><small>CASO DEMOSTRATIVO · ${DEMO.farm.id}</small><h2>${esc(DEMO.farm.name)} · ${esc(DEMO.farm.producer)}</h2><p>${esc(use)}</p><div class="capital-case-meta"><div><span>Necesidad simulada</span><strong>${moneyDemo(need)}</strong></div><div><span>Horizonte</span><strong>${esc(horizon)}</strong></div><div><span>Readiness</span><strong>${score}%</strong></div><div><span>Dinero movido</span><strong>$0</strong></div></div></article><aside><span class="status danger">SIN OFERTA · SIN CUSTODIA</span><p>La puntuación es una herramienta de completitud documental DEMO. No es calificación crediticia, recomendación de inversión ni promesa de retorno.</p></aside></section>
      <section class="grid metrics" style="margin-top:14px">${metric('Readiness compuesto',`${score}%`,`${ready} gates listos · ${review} en revisión`,score>=75?'good':'warn')}${metric('Brechas / bloqueos',gaps,'incluye frontera regulatoria','warn')}${metric('Trazabilidad operativa',`${gates.operations.score}%`,`${operations.withClosure}/${operations.activities} cierres · ${operations.withEvidence}/${operations.required} evidencias`,gates.operations.state==='ready'?'good':'warn')}${metric('Economía contractual',`${gates.costs.score}%`,`${economics.explicit.length} costo(s) explícitos · soporte ${economics.supportCoverage}%`,gates.costs.state==='ready'?'good':'warn')}</section>
      <section class="capital-gates">${GATE_DEFS.map((def,index)=>{const g=gates[def.id];return `<article class="capital-gate ${g.state}"><header><span>${String(index+1).padStart(2,'0')}</span><div><strong>${esc(def.title)}</strong><small>${esc(def.source)} · peso ${def.weight}%</small></div><b>${g.score}%</b><em class="status ${g.state==='ready'?'teal':g.state==='blocked'?'danger':'warn'}">${g.state==='ready'?'LISTO':g.state==='review'?'REVISAR':g.state==='blocked'?'FUERA DE DEMO':'BRECHA'}</em></header><p>${esc(g.detail)}</p><footer>${esc(def.why)}</footer></article>`}).join('')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Procedencia económica</h2><p>El gate económico consume una sola verdad; no busca palabras sueltas en el storage.</p></div></div><div class="card-body"><div class="grid metrics">${metric('Presupuesto DEMO',moneyDemo(economics.budget),'escenario operativo')}${metric('BASELINE_DEMO',moneyDemo(economics.baseline),'agregado histórico · no itemizado','warn')}${metric('LOCAL_ONLY',moneyDemo(economics.localRecorded),`${economics.costs.length} costo(s) itemizados`,economics.costs.length?'good':'warn')}${metric('Asignado a ciclos',moneyDemo(economics.explicitAmount),`${economics.explicit.length} explícitos · ${economics.unallocated} no asignados`,economics.explicit.length?'good':'warn')}</div><div class="section-note" style="margin-top:12px"><strong>Regla:</strong> BASELINE_DEMO ≠ ITEMIZED_CYCLE_COST ≠ ACCOUNTING_ENTRY ≠ REALIZED_REVENUE. La necesidad simulada de ${moneyDemo(need)} no se deduce automáticamente de estos montos y no representa una solicitud, oferta o recomendación.</div></div></article><article class="card"><div class="card-head"><div><h2>Expediente de preparación</h2><p>Qué puede revisar una contraparte autorizada sin acceder a funciones de ejecución.</p></div></div><div class="card-body"><div class="workflow"><div class="stage done"><span class="num">1</span><strong>Caracterización</strong><span>Quién + dónde + contexto</span></div><div class="stage done"><span class="num">2</span><strong>Plan</strong><span>Hipótesis + responsables</span></div><div class="stage current"><span class="num">3</span><strong>Evidencia</strong><span>Passport + Activity Contract + economía</span></div><div class="stage"><span class="num">4</span><strong>Due diligence</strong><span>Humana / externa</span></div><div class="stage"><span class="num">5</span><strong>Decisión</strong><span>HUMAN_ONLY</span></div><div class="stage"><span class="num">6</span><strong>Proveedor autorizado</strong><span>Fuera de DEMO</span></div></div><div class="section-note" style="margin-top:12px">El gate operativo usa únicamente Activity Contract + cierres + evidencia requerida; no recicla la completitud total de Cierre de ciclo y por tanto no vuelve a contar economía ni impacto. Una futura experiencia transaccional debe permanecer separada.</div></div></article></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Uso previsto del capital DEMO</h2><p>El monto debe explicarse desde el plan, no desde una cifra aislada.</p></div></div><div class="card-body"><div class="capital-use"><div><span>Operación del plan</span><strong>42%</strong></div><div><span>Insumos / material</span><strong>27%</strong></div><div><span>Acompañamiento y evidencia</span><strong>18%</strong></div><div><span>Reserva de contingencia DEMO</span><strong>13%</strong></div></div><div class="section-note" style="margin-top:12px">Distribución ilustrativa. No se infiere desde costos registrados y no constituye presupuesto aprobado ni instrucción de desembolso.</div></div></article><article class="card"><div class="card-head"><div><h2>Conexiones</h2><p>El dossier no duplica información: la referencia.</p></div></div><div class="card-body"><div class="quick-grid" style="grid-template-columns:1fr 1fr"><button class="quick" data-view-link="cycle"><strong>Cierre de ciclo</strong><span>Completitud y brechas.</span></button><button class="quick" data-view-link="economics"><strong>Economía</strong><span>Costos y procedencia.</span></button><button class="quick" data-view-link="passport"><strong>Passport</strong><span>Cadena de evidencia.</span></button><button class="quick" data-view-link="impact"><strong>Impacto</strong><span>Indicadores y calidad.</span></button></div></div></article></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Límites no negociables</h2><p>Lo que esta capa nunca debe aparentar que hace.</p></div></div><div class="card-body"><div class="gate"><i class="blocked">×</i><div><strong>Recomendar una inversión</strong><p>Fuera del alcance de IA y DEMO.</p></div><span class="status danger">HUMAN_ONLY</span></div><div class="gate"><i class="blocked">×</i><div><strong>Aprobar / desembolsar / custodiar</strong><p>No existe capacidad transaccional.</p></div><span class="status danger">$0</span></div><div class="gate"><i class="blocked">×</i><div><strong>Presentar readiness como elegibilidad</strong><p>La puntuación solo mide completitud DEMO.</p></div><span class="status danger">PROHIBIDO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Inferir retorno o capacidad de pago</strong><p>Presupuesto, costo y escenario no equivalen a ingreso realizado, flujo de caja ni retorno.</p></div><span class="status danger">NO</span></div></div></section>${footer()}`;
  }

  views.capital=capitalDossier;
  window.__SANA_CAPITAL_READINESS__=Object.freeze({gateData,overall,economicsEvidence,operationsEvidence});

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
