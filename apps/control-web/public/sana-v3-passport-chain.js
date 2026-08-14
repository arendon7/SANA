(() => {
  'use strict';

  const PASSPORT_LOT_KEY='sana.v3.passport.lot';

  function passportLot(){
    const saved=localStorage.getItem(PASSPORT_LOT_KEY);
    return DEMO.lots.some(l=>l.id===saved)?saved:'CAF-A1';
  }

  function localPlanReviews(lot){
    let reviews=[];
    try{reviews=JSON.parse(localStorage.getItem('sana.v3.plan.reviews')||'[]')}catch{}
    const planIds=new Set(DEMO.plans.filter(p=>p.lot===lot).map(p=>p.id));
    return reviews.filter(r=>planIds.has(r.planId));
  }

  function resultRows(lot,records){
    const local=records.filter(r=>r.type==='harvest-result');
    if(local.length)return local.map(r=>({title:`Resultado ${r.values?.quantity||'—'} ${r.values?.unit||''}`,meta:`${r.values?.date||'Ahora'} · ${r.values?.quality||'sin clasificación'} · ${r.values?.provenance||'sin procedencia'}`,state:'LOCAL_ONLY',quality:r.values?.evidence||'Sin soporte'}));
    const base=window.__SANA_RESULT_BASE__?.[lot];
    return base?[{title:`Resultado base ${base.observed} ${base.unit}`,meta:`${base.date} · ${base.quality} · plan ${base.planned} ${base.unit}`,state:'BASELINE_DEMO',quality:`Evidencia ${base.evidence}%`}]:[];
  }

  function chainFor(lot){
    const unit=DEMO.lots.find(l=>l.id===lot);
    const plans=DEMO.plans.filter(p=>p.lot===lot);
    const tasks=DEMO.tasks.filter(t=>t.lot===lot);
    const evidence=DEMO.evidence.filter(e=>e.lot===lot);
    const incidents=DEMO.incidents.filter(i=>i.lot===lot);
    const records=storage.records.filter(r=>r.lot===lot || r.values?.lot===lot);
    const planReviews=localPlanReviews(lot);

    const identityRows=[
      {title:`${unit?.crop||'Unidad'} · ${unit?.name||lot}`,meta:`${lot} · ${unit?.area||'—'} ha · ${unit?.variety||'sin variedad'}`,state:'VERIFICABLE_DEMO',quality:'Alta'},
      {title:'Finca La Esperanza',meta:'Támesis · Antioquia · unidad sintética',state:'DEMO',quality:'Contexto'}
    ];
    const planning=plans.map(p=>({title:`${p.name} · v${p.version}`,meta:`${p.phase} · ${p.owner} · ${p.progress}%`,state:'VERSIONADO',quality:'Alta'}));
    planReviews.forEach(r=>planning.push({title:'Revisión humana de plan',meta:`${r.by} · ${r.at}`,state:'LOCAL_ONLY',quality:'Sandbox'}));
    const field=records.filter(r=>r.type==='structured-visit').map(r=>({title:r.values?.purpose||r.title,meta:`${r.values?.owner||'Responsable'} · ${r.values?.finding||'sin hallazgo'}`,state:'LOCAL_ONLY',quality:'Estructurado'}));
    incidents.forEach(i=>field.push({title:i.title,meta:`${i.kind} · ${i.status} · ${i.owner}`,state:i.status,quality:'AGROWAY'}));
    const execution=tasks.map(t=>({title:t.title,meta:`${t.owner} · ${t.when} · ${t.status}`,state:t.status,quality:t.evidence?'Con evidencia':'Sin evidencia'}));
    const proofs=evidence.map(e=>({title:e.title,meta:`${e.type} · ${e.by} · ${e.date}`,state:e.integrity,quality:'Evidencia DEMO'}));
    records.filter(r=>!['structured-visit','plan-review','harvest-result'].includes(r.type)).forEach(r=>proofs.push({title:r.title,meta:`${r.type} · ${r.createdAt||'Ahora'}`,state:'LOCAL_ONLY',quality:'Sandbox'}));
    const results=resultRows(lot,records);

    return {unit,plans,tasks,evidence,records,identity:identityRows,planning,field,execution,proofs,results};
  }

  function integrityScore(chain){
    const plan=chain.plans.length?100:35;
    const taskEvidence=chain.tasks.length?Math.round(chain.tasks.filter(t=>t.evidence).length/chain.tasks.length*100):0;
    const proof=Math.min(100,60+chain.evidence.length*9);
    const contextual=chain.field.length?92:65;
    const result=chain.results.length?90:55;
    return Math.round(plan*.22+taskEvidence*.23+proof*.25+contextual*.15+result*.15);
  }

  function chainBlock(number,title,subtitle,rows){
    const ok=rows.length>0;
    return `<article class="passport-chain-step ${ok?'has-data':'missing'}"><header><span>${number}</span><div><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></div><b>${ok?rows.length:'0'}</b></header><div class="passport-chain-rows">${rows.length?rows.map(r=>`<div class="passport-chain-row"><i></i><div><strong>${esc(r.title)}</strong><small>${esc(r.meta)}</small></div><span class="status ${/LOCAL|PEND|NO|PROGRAM/i.test(r.state)?'warn':/OBSERV|BLOCK/i.test(r.state)?'danger':'teal'}">${esc(r.state)}</span><em>${esc(r.quality)}</em></div>`).join(''):'<div class="passport-gap">Falta información para reconstruir esta parte de la historia.</div>'}</div></article>`;
  }

  function passportOperational(){
    const lotId=passportLot();
    const c=chainFor(lotId);
    const score=integrityScore(c);
    const pendingTasks=c.tasks.filter(t=>!t.evidence).length;
    const localOnly=c.records.length+localPlanReviews(lotId).length;
    const plan=c.plans[0];
    const nextGap=pendingTasks?'Completar evidencia de actividades sin prueba vinculada':!c.field.length?'Registrar acompañamiento técnico estructurado':!c.results.length?'Registrar resultado/cierre productivo':'Mantener continuidad entre plan, campo, evidencia y resultado';

    return `${head('SANA · PASSPORT Y EVIDENCIA','Reconstruir por qué ocurrió cada decisión y qué resultado siguió.','Passport conecta origen, plan, acompañamiento, ejecución, pruebas y resultado productivo. No aumenta autoridad: hace visible la procedencia y permite detectar vacíos antes de afirmar desempeño, causalidad o impacto.',`<button class="btn secondary" data-action="exportPassport">Exportar vista DEMO</button>`)}
      <section class="passport-lot-switcher">${DEMO.lots.filter(l=>!['VIV-01'].includes(l.id)).map(l=>`<button class="${l.id===lotId?'active':''}" data-passport-lot="${l.id}"><small>${l.id}</small><strong>${esc(l.crop)} · ${esc(l.name)}</strong><span>${l.area} ha · ${l.evidence}% evidencia base</span></button>`).join('')}</section>
      <section class="passport-hero" style="margin-top:14px"><article class="passport-main"><small>PASSPORT · SANA-DEMO-${lotId}-2026</small><h2>${esc(c.unit?.crop||'Unidad')} · ${esc(c.unit?.name||lotId)}</h2><p>${lotId} · ${c.unit?.area||'—'} ha · Finca La Esperanza · Támesis${plan?` · Plan v${plan.version}`:''}</p><div class="passport-meta"><div><span>Integridad reconstruible</span><strong>${score}%</strong></div><div><span>Pruebas enlazadas</span><strong>${c.evidence.length}</strong></div><div><span>Resultados</span><strong>${c.results.length}</strong></div><div><span>Registros locales</span><strong>${localOnly}</strong></div></div></article><article class="card"><div class="card-head"><div><h2>Brecha prioritaria</h2><p>Lo siguiente que mejora la reconstrucción.</p></div><span class="status ${score>=85?'teal':'warn'}">${score>=85?'ALTA':'MEJORABLE'}</span></div><div class="card-body"><div class="section-note"><strong>${esc(nextGap)}</strong><br>El porcentaje mide completitud DEMO de la cadena; no certifica autenticidad externa, causalidad ni impacto.</div><div class="gate"><i class="${pendingTasks?'warn':''}">${pendingTasks?'!':'✓'}</i><div><strong>Actividades sin evidencia</strong><p>${pendingTasks} registro(s) requieren prueba o justificación.</p></div><span class="status ${pendingTasks?'warn':'teal'}">${pendingTasks?'ABIERTO':'OK'}</span></div><div class="gate"><i class="${localOnly?'warn':''}">${localOnly?'!':'✓'}</i><div><strong>Eventos LOCAL_ONLY</strong><p>${localOnly} evento(s) aún son sandbox/nube DEMO, nunca ACK productivo.</p></div><span class="status ${localOnly?'warn':'teal'}">${localOnly?'DEMO':'OK'}</span></div></div></article></section>
      <section class="passport-chain" style="margin-top:14px">${chainBlock('01','Identidad y contexto','Qué unidad estamos observando.',c.identity)}${chainBlock('02','Plan y autoridad','Qué estaba previsto y quién podía decidir.',c.planning)}${chainBlock('03','Acompañamiento y hallazgos','Qué se observó y cómo se interpretó.',c.field)}${chainBlock('04','Ejecución','Qué actividad ocurrió o quedó pendiente.',c.execution)}${chainBlock('05','Evidencia','Qué prueba respalda la historia.',c.proofs)}${chainBlock('06','Resultado productivo','Qué se obtuvo y con qué procedencia/calidad.',c.results)}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Reglas de procedencia</h2><p>Evitan que una historia completa parezca más verificada de lo que realmente está.</p></div></div><div class="card-body"><div class="gate"><i>✓</i><div><strong>DEMO / AGROWAY</strong><p>Dato sintético estructurado dentro del producto.</p></div><span class="status">CONTEXTO</span></div><div class="gate"><i class="warn">!</i><div><strong>LOCAL_ONLY / NUBE DEMO</strong><p>Registro del usuario; sincronizar no lo convierte en ACK productivo.</p></div><span class="status warn">SANDBOX</span></div><div class="gate"><i class="blocked">×</i><div><strong>CAUSALIDAD / VERIFICACIÓN EXTERNA</strong><p>No se atribuye salvo que exista método y proceso independiente suficiente.</p></div><span class="status danger">NO ASUMIR</span></div></div></article><article class="card"><div class="card-head"><div><h2>Conexiones operativas</h2><p>Passport sirve como índice, no como silo.</p></div></div><div class="card-body"><div class="quick-grid" style="grid-template-columns:1fr 1fr"><button class="quick" data-view-link="plans"><strong>Abrir plan</strong><span>Versiones, fases y gates.</span></button><button class="quick" data-view-link="advisory"><strong>Abrir acompañamiento</strong><span>Hallazgos y compromisos.</span></button><button class="quick" data-view-link="results"><strong>Abrir resultados</strong><span>Cosecha, calidad y procedencia.</span></button><button class="quick" data-view-link="impact"><strong>Abrir impacto</strong><span>Separar evidencia de afirmación.</span></button></div></div></article></section>${footer()}`;
  }

  views.passport=passportOperational;

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-passport-lot]');
    if(!button)return;
    localStorage.setItem(PASSPORT_LOT_KEY,button.dataset.passportLot);
    if(typeof render==='function')render();
  });
})();
