(() => {
  'use strict';

  const identity=window.__SANA_DEMO_IDENTITY__||(()=>{try{return JSON.parse(localStorage.getItem('sana.demo.identity')||'null')}catch{return null}})();
  const raw=String(identity?.role||'new_user').toLowerCase();
  const role=raw.includes('admin')?'admin':raw.includes('technical')||raw.includes('técn')?'technical':raw.includes('producer')||raw.includes('productor')?'producer':raw.includes('invest')?'investor':raw.includes('visitor')||raw.includes('guest')?'visitor':'new_user';
  const operational=['admin','technical','producer'].includes(role);

  function activities(){return window.__SANA_PLAN_FIELD_WORKFLOW__?.activities?.()||[]}
  function dossiers(){return window.__SANA_CYCLE_CLOSURE__?.dossiers?.()||[]}
  function economyForPlan(planId){return window.__SANA_ECONOMICS__?.cycleSummary?.(planId)||null}
  function money(n){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0)}catch{return `${Number(n)||0} COP`}}
  function priorityValue(v=''){return v==='Alta'?0:v==='Media'?1:2}
  function nextActivity(){
    const list=activities();
    const evidenceGap=list.filter(a=>a.needsEvidence).sort((a,b)=>priorityValue(a.priority)-priorityValue(b.priority))[0];
    if(evidenceGap)return {kind:'evidence',activity:evidenceGap,label:'Aportar evidencia',reason:'La actividad exige una prueba antes de poder cerrarse como Completada.'};
    const open=list.filter(a=>a.state.code==='OPEN').sort((a,b)=>priorityValue(a.priority)-priorityValue(b.priority))[0];
    if(open)return {kind:'activity',activity:open,label:'Abrir actividad',reason:'Es la siguiente actividad abierta según prioridad del sandbox.'};
    const reprogrammed=list.filter(a=>a.state.code==='REPROGRAMMED')[0];
    if(reprogrammed)return {kind:'activity',activity:reprogrammed,label:'Revisar reprogramación',reason:'Existe una actividad reprogramada que todavía debe seguirse.'};
    return null;
  }
  function leastCompleteDossier(){return dossiers().slice().sort((a,b)=>a.completeness-b.completeness)[0]||null}
  function journeyState(){
    const next=nextActivity();
    if(next)return {...next,view:'field'};
    const ds=dossiers();
    const withoutResult=ds.find(d=>d.activities.length&&d.open.length===0&&!d.result);
    if(withoutResult)return {kind:'result',dossier:withoutResult,label:'Registrar resultado del ciclo',reason:`${withoutResult.plan.id} tiene la operación resuelta pero no un resultado productivo registrado.`,view:'results'};
    const incomplete=leastCompleteDossier();
    if(incomplete)return {kind:'cycle',dossier:incomplete,label:'Revisar cierre de ciclo',reason:`${incomplete.plan.id} tiene ${incomplete.completeness}% de completitud documental.`,view:'cycle'};
    return {kind:'passport',label:'Auditar evidencia',reason:'No hay una siguiente actividad operativa; revisa la cadena de evidencia.',view:'passport'};
  }
  function insertAfterHead(html,section){const marker='</header>';const at=html.indexOf(marker);return at<0?`${section}${html}`:`${html.slice(0,at+marker.length)}${section}${html.slice(at+marker.length)}`}
  function selectedActivity(){const id=localStorage.getItem('sana.v3.journey.activity');return id?window.__SANA_PLAN_FIELD_WORKFLOW__?.findActivity?.(id):null}
  function actionButton(state){
    if(state.kind==='evidence'&&state.activity)return `<button class="btn primary" data-workflow-evidence="${esc(state.activity.id)}">${esc(state.label)}</button><button class="btn secondary" data-journey-activity="${esc(state.activity.id)}">Ver actividad</button>`;
    if(state.kind==='activity'&&state.activity)return `<button class="btn primary" data-journey-activity="${esc(state.activity.id)}">${esc(state.label)}</button>`;
    if(state.kind==='cycle'&&state.dossier)return `<button class="btn primary" data-journey-cycle="${esc(state.dossier.plan.id)}">${esc(state.label)}</button>`;
    return `<button class="btn primary" data-journey-go="${esc(state.view)}">${esc(state.label)}</button>`;
  }
  function operationalCard(){
    const state=journeyState();const a=state.activity;const cycle=state.dossier;
    return `<section class="card journey-now" style="margin-top:14px"><div class="card-head"><div><p class="kicker">HOY EN SANA · SIGUIENTE ACCIÓN</p><h2>${esc(state.label)}</h2><p>${esc(state.reason)}</p></div><span class="status ${state.kind==='evidence'?'warn':state.kind==='cycle'?'teal':''}">${esc(state.kind.toUpperCase())}</span></div><div class="card-body"><div class="grid metrics">${a?metric('Actividad',a.id,`${a.lot} · ${a.planId?`${a.planId} v${a.planVersion}`:'sin plan'}`):metric('Plan',cycle?.plan?.id||'—',cycle?`v${cycle.plan.version} · ${cycle.plan.lot}`:'flujo general')}${a?metric('Evidencia',`${a.evidence.length}`,a.evidenceRequired?'requerida para cierre':'no bloqueante',a.needsEvidence?'warn':'good'):metric('Completitud',cycle?`${cycle.completeness}%`:'—','documental · NO desempeño',cycle&&cycle.completeness<80?'warn':'good')}${metric('Nube',window.__SANA_CLOUD_STATE__?.describe?.().status||'LOCAL_ONLY','LOCAL_ONLY ≠ SYNCED ≠ ACK')}${metric('Autoridad','HUMANA','SANA organiza; no decide manejo','good')}</div><div class="head-actions" style="margin-top:12px">${actionButton(state)}<button class="btn secondary" data-view-link="guide">Ver recorrido completo</button></div></div></section>`;
  }
  function investorCard(){
    const d=leastCompleteDossier();if(!d)return '';
    const econ=economyForPlan(d.plan.id);
    const econBlock=econ?`<div class="grid metrics" style="margin-top:12px">${metric('Presupuesto DEMO',money(econ.budget),'escenario operativo · no compromiso')}${metric('BASELINE_DEMO',money(econ.baseRecorded),'agregado histórico · no itemizado','warn')}${metric('LOCAL_ONLY lote',money(econ.localRecorded),`${econ.explicitCosts.length} costo(s) explícitos al ciclo`,econ.localRecorded?'good':'warn')}${metric('Soporte ciclo',`${econ.evidenceCoverage}%`,`${econ.supportedExplicit.length}/${econ.explicitCosts.length} costo(s) explícitos con soporte`,econ.evidenceCoverage===100&&econ.explicitCosts.length?'good':'warn')}</div>`:'<div class="section-note" style="margin-top:12px">Read-model económico no disponible para este plan.</div>';
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">LECTURA DE CIERRE · SOLO EVIDENCIA</p><h2>${esc(d.plan.id)} · ${esc(d.plan.name)}</h2><p>${d.completeness}% de completitud documental · ${d.evidenceGaps} brecha(s) de evidencia · ${d.open.length} actividad(es) abiertas.</p></div><span class="status warn">READ_ONLY</span></div><div class="card-body"><div class="section-note">La completitud no es score de inversión, rendimiento ni impacto. La lectura económica proviene del mismo contrato de Economía: presupuesto/escenario, BASELINE_DEMO y costos LOCAL_ONLY permanecen separados. No se calcula ROI, IRR, utilidad realizada ni recomendación.</div>${econBlock}<div class="head-actions" style="margin-top:12px"><button class="btn primary" data-journey-cycle="${esc(d.plan.id)}">Abrir Cierre de ciclo</button><button class="btn secondary" data-view-link="passport">Auditar Passport</button><button class="btn secondary" data-view-link="economics">Ver procedencia económica</button></div></div></section>`;
  }

  const baseHome=views.home;
  if(baseHome)views.home=function homeWithJourney(){const html=baseHome();if(operational)return insertAfterHead(html,operationalCard());if(role==='investor')return insertAfterHead(html,investorCard());return html};

  const baseGuide=views.guide;
  if(baseGuide)views.guide=function guideWithNextAction(){const html=baseGuide();if(!operational)return html;return insertAfterHead(html,operationalCard())};

  const baseField=views.field;
  if(baseField)views.field=function fieldWithJourneyFocus(){
    const html=baseField();const a=selectedActivity();if(!a)return html;
    const next=a.needsEvidence?`<button class="btn primary" data-workflow-evidence="${esc(a.id)}">Registrar evidencia</button>`:a.state.code==='OPEN'?`<button class="btn primary" data-workflow-close="${esc(a.id)}">Cerrar / reprogramar</button>`:`<button class="btn secondary" data-view-link="passport">Ver en Passport</button>`;
    const section=`<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">ACTIVIDAD SELECCIONADA DESDE HOY EN SANA</p><h2>${esc(a.title)}</h2><p>${esc(a.id)} · ${esc(a.lot)} · ${a.planId?`${esc(a.planId)} v${a.planVersion} · ${esc(a.phase)}`:'operación general'}</p></div><span class="status ${a.needsEvidence?'warn':a.state.code==='COMPLETED'?'teal':''}">${esc(a.state.label)}</span></div><div class="card-body"><div class="section-note"><strong>Evidencia esperada:</strong> ${esc(a.expectedEvidence)}<br>Pruebas aportadas: ${a.evidence.length}. La expectativa no cuenta como prueba.</div><div class="head-actions" style="margin-top:12px">${next}<button class="btn secondary" data-journey-clear>Quitar foco</button></div></div></section>`;
    return insertAfterHead(html,section);
  };

  document.addEventListener('click',event=>{
    const activity=event.target.closest('[data-journey-activity]');if(activity){localStorage.setItem('sana.v3.journey.activity',activity.dataset.journeyActivity);window.go?.('field');return;}
    const cycle=event.target.closest('[data-journey-cycle]');if(cycle){localStorage.setItem('sana.v3.cycle.selected',cycle.dataset.journeyCycle);window.go?.('cycle');return;}
    const go=event.target.closest('[data-journey-go]');if(go){window.go?.(go.dataset.journeyGo);return;}
    if(event.target.closest('[data-journey-clear]')){localStorage.removeItem('sana.v3.journey.activity');if(typeof render==='function')render();}
  });

  window.__SANA_OPERATIONAL_JOURNEY__=Object.freeze({role,state:journeyState,nextActivity,leastCompleteDossier,economyForPlan});
})();
