(() => {
  'use strict';

  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const REPORT_TYPE='RPT-DD';
  const TERMINAL=new Set(['LISTO_PARA_NUEVO_CORTE','NO_APLICA_JUSTIFICADO']);

  function snapshotApi(){return window.__SANA_DUE_DILIGENCE_SNAPSHOT__}
  function gapsApi(){return window.__SANA_DUE_DILIGENCE_GAPS__}
  function remediationApi(){return window.__SANA_DUE_DILIGENCE_REMEDIATION__}
  function nextCutApi(){return window.__SANA_DD_NEXT_CUT__}
  function compareApi(){return window.__SANA_SNAPSHOT_COMPARE__}
  function role(){return window.__SANA_ACCESS__?.role||'new_user'}
  function snapshots(){
    return (snapshotApi()?.snapshots?.()||[])
      .filter(s=>s?.manifest?.schema===SCHEMA&&s?.reportType===REPORT_TYPE)
      .slice()
      .sort((a,b)=>String(b.cutoff||b.createdAt||'').localeCompare(String(a.cutoff||a.createdAt||'')));
  }
  function avg(values){const nums=values.map(Number).filter(Number.isFinite);return nums.length?Math.round(nums.reduce((a,b)=>a+b,0)/nums.length):null}
  function sum(values){return values.map(Number).filter(Number.isFinite).reduce((a,b)=>a+b,0)}
  function pct(v){return v===null||v===undefined?'—':`${Math.round(Number(v)||0)}%`}
  function money(v){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v)||0)}catch{return `${Number(v)||0} COP`}}
  function cutLabel(s){return s?.cutoff||String(s?.createdAt||s?.manifest?.generatedAt||'').slice(0,10)||'sin corte'}
  function reviewer(s){return s?.reviewer||s?.manifest?.reviewer||'sin revisor'}
  function lens(){
    const map={
      admin:{title:'Gobernanza integral del expediente',text:'Prioriza consistencia entre fuentes, brechas, responsables, revisiones y preparación del siguiente corte.'},
      technical:{title:'Calidad técnica y evidencia',text:'Prioriza cierre de actividades, evidencia requerida, reconstruibilidad, metodología y condiciones para re-evaluación.'},
      producer:{title:'Operación, soportes y trazabilidad',text:'Prioriza actividades, costos soportados, evidencias de campo y acciones pendientes antes de un nuevo corte.'},
      investor:{title:'Lectura documental de contraparte',text:'Presenta procedencia, brechas, evolución entre cortes y fronteras de verificación. No habilita decisión, recomendación ni transacción.'}
    };
    return map[role()]||{title:'Lectura limitada del expediente',text:'La vista respeta el alcance asignado al rol DEMO.'};
  }
  function latestRemediation(snapshotId,gaps){
    const items=(remediationApi()?.forSnapshot?.(snapshotId)||[]).slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    const latest=new Map();items.forEach(item=>{if(item?.gapId&&!latest.has(item.gapId))latest.set(item.gapId,item)});
    return (gaps||[]).map(g=>({gap:g,item:latest.get(g.id)||null,status:latest.get(g.id)?.status||'SIN_PLAN'}));
  }

  function state(){
    const list=snapshots();
    if(!list.length)return {valid:false,state:'NO_SNAPSHOT',snapshots:[],latest:null,previous:null,diff:null,integrity:'DATAROOM_360_READ_ONLY · NO_SNAPSHOT'};
    const latest=list[0];
    const previous=list[1]||null;
    const m=latest.manifest||{};
    const gapsState=gapsApi()?.derive?.(latest)||{valid:false,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]};
    const gaps=gapsState.valid?gapsState.gaps||[]:[];
    const remediation=latestRemediation(latest.id,gaps);
    const remediated=remediation.filter(r=>r.item).length;
    const prepared=remediation.filter(r=>TERMINAL.has(r.status)).length;
    const openWork=remediation.filter(r=>!TERMINAL.has(r.status)).length;
    const cycles=m.cycles||[];
    const passports=m.passport||[];
    const economics=m.economics||[];
    const sources=m.sources||[];
    const impact=m.impact||null;
    const capital=m.capital||null;
    const supportRows=economics.filter(e=>e.supportCoverage!==undefined&&e.supportCoverage!==null);
    const diff=previous&&compareApi()?.compare?compareApi().compare(previous,latest):null;
    const nextCut=nextCutApi()?.state?.()||null;
    return {
      valid:true,
      state:'READY',
      snapshots:list,
      latest,previous,diff,nextCut,
      historical:{
        plans:(m.plans||[]).length,
        cycles:cycles.length,
        cycleCompleteness:avg(cycles.map(c=>c.completeness)),
        cycleEvidenceGaps:sum(cycles.map(c=>c.evidenceGaps)),
        openActivities:sum(cycles.map(c=>c.openActivities)),
        archiveReady:cycles.filter(c=>c.readyForArchive===true).length,
        passportIntegrity:avg(passports.map(p=>p.integrity)),
        budget:sum(economics.map(e=>e.budget)),
        baselineRecorded:sum(economics.map(e=>e.baseRecorded)),
        localRecorded:sum(economics.map(e=>e.localRecorded)),
        explicitCosts:sum(economics.map(e=>e.explicitCostCount)),
        supportCoverage:avg(supportRows.map(e=>e.supportCoverage)),
        mismatchCount:sum(economics.map(e=>e.mismatchCount)),
        unallocatedCount:sum(economics.map(e=>e.unallocatedCount)),
        sources:sources.length,
        referenceOnly:sources.filter(s=>s.state==='REFERENCE_ONLY'||!s.state).length,
        impact,
        capital
      },
      gaps:{rows:gaps,total:gaps.length,counts:gapsState.counts||{ALTA:0,MEDIA:0,BAJA:0},domains:gapsState.domains||[]},
      postCut:{remediation,total:remediation.length,withPlan:remediated,prepared,openWork},
      integrity:'DATAROOM_360_READ_ONLY · SNAPSHOT_HISTORY ≠ POST_CUT_REMEDIATION ≠ LIVE_STATE ≠ INVESTMENT_DECISION'
    };
  }

  function chip(text,tone=''){return `<span class="status ${tone}">${esc(text)}</span>`}
  function link(view,label,meta){return `<button class="quick" data-view-link="${view}" type="button"><strong>${esc(label)}</strong><span>${esc(meta)}</span></button>`}
  function narrative(s){
    const h=s.historical;
    const parts=[
      `${h.cycles} ciclo(s) capturados con completitud documental media ${pct(h.cycleCompleteness)}`,
      `${h.cycleEvidenceGaps} brecha(s) de evidencia y ${h.openActivities} actividad(es) abiertas en el corte`,
      `integridad Passport media ${pct(h.passportIntegrity)}`,
      `costos LOCAL_ONLY itemizados ${money(h.localRecorded)}${h.supportCoverage===null?' · granularidad de soporte no disponible en este corte':` · cobertura de soporte ${pct(h.supportCoverage)}`}`,
      `Impacto ${h.impact?.humanReviewed?'con revisión humana':'sin revisión humana'} · verificación externa capturada ${Number(h.impact?.externallyVerified||0)}`,
      `Readiness documental ${h.capital?.readiness===null||h.capital?.readiness===undefined?'no capturado':pct(h.capital.readiness)}`
    ];
    return parts;
  }
  function roleLensCard(){const l=lens();return `<article class="card"><div class="card-head"><div><p class="kicker">LENTE DEL ROL</p><h2>${esc(l.title)}</h2><p>${esc(l.text)}</p></div>${chip(role().toUpperCase())}</div></article>`}
  function noSnapshot(){return `${head('SANA · DATA ROOM 360°','Expediente ejecutivo sin corte histórico','Esta vista no sustituye un snapshot. Registra primero un corte Due Diligence para construir una lectura ejecutiva trazable.')}
    <section class="card"><div class="card-head"><div><h2>No existe un RPT-DD compatible</h2><p>El Data Room 360° no usa el estado vivo para fabricar historia.</p></div>${chip('NO SNAPSHOT','warn')}</div><div class="card-body"><div class="section-note">SNAPSHOT_HISTORY ≠ LIVE_STATE. Sin un corte registrado no se muestran métricas históricas, evolución ni brechas como si fueran evidencia de due diligence.</div><div class="head-actions" style="margin-top:12px"><button class="btn secondary" data-view-link="reports">Ir a Informes</button></div></div></section>${footer()}`}

  function dataroom360(){
    const s=state();if(!s.valid)return noSnapshot();
    const h=s.historical;const g=s.gaps;const p=s.postCut;const latest=s.latest;const prev=s.previous;
    const diff=s.diff?.valid?s.diff:null;
    const next=s.nextCut;
    const supportFoot=h.supportCoverage===null?'no capturado en este snapshot':`${h.explicitCosts} costo(s) explícito(s)`;
    return `${head('SANA · DATA ROOM 360°','Una sola narrativa del expediente','Integra corte histórico, procedencia, brechas, remediación posterior y evolución entre snapshots sin crear una segunda verdad. Toda métrica conserva su naturaleza DEMO y su frontera de autoridad.')}
      <section class="grid two">${roleLensCard()}<article class="card"><div class="card-head"><div><p class="kicker">CORTE HISTÓRICO ACTIVO</p><h2>${esc(cutLabel(latest))}</h2><p>${esc(reviewer(latest))} · ${esc(latest.id)}</p></div>${chip('SNAPSHOT_DEMO','warn')}</div><div class="card-body"><div class="chip-row">${chip(`${s.snapshots.length} corte(s)`)}${chip(`${g.total} brecha(s)`,g.total?'warn':'teal')}${chip(`${p.withPlan}/${p.total} con remediación`,p.withPlan===p.total?'teal':'warn')}</div><div class="section-note" style="margin-top:12px">Los valores de esta tarjeta pertenecen al snapshot. La remediación se muestra aparte como seguimiento posterior LOCAL_ONLY y nunca reescribe el corte.</div></div></article></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Ruta del expediente</h2><p>Unidad → plan → ejecución → evidencia → economía → impacto → readiness → due diligence.</p></div></div><div class="card-body"><div class="quick-grid">${link('territory','1 · Unidad','contexto productivo')}${link('cycle','2 · Plan y ejecución','cierre documental')}${link('passport','3 · Evidencia','cadena reconstruible')}${link('economics','4 · Economía','costos y procedencia')}${link('impact','5 · Impacto','metodología y calidad')}${link('capital','6 · Readiness','completitud documental')}${link('reports','7 · Due Diligence','snapshots y brechas')}</div></div></section>
      <section class="grid metrics" style="margin-top:14px">${metric('Completitud de ciclos',pct(h.cycleCompleteness),`${h.archiveReady}/${h.cycles} base(s) cerrable(s)`)}${metric('Passport',pct(h.passportIntegrity),`${h.cycleEvidenceGaps} brecha(s) de evidencia`,h.cycleEvidenceGaps?'warn':'good')}${metric('Soporte económico',pct(h.supportCoverage),supportFoot,h.supportCoverage!==null&&h.supportCoverage<100?'warn':'good')}${metric('Readiness documental',h.capital?.readiness===null||h.capital?.readiness===undefined?'—':pct(h.capital.readiness),'no es elegibilidad ni recomendación')}</section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Narrativa del corte</h2><p>Resumen descriptivo; no sustituye los módulos fuente.</p></div></div><div class="card-body">${narrative(s).map((x,i)=>`<div class="gate"><i>${i+1}</i><div><strong>${esc(x.split(' · ')[0])}</strong><p>${esc(x.split(' · ').slice(1).join(' · '))}</p></div><span class="status">CORTE</span></div>`).join('')}</div></article><article class="card"><div class="card-head"><div><h2>Procedencia económica</h2><p>Montos y calidad de vínculo capturados por el manifest.</p></div></div><div class="card-body"><div class="gate"><i>1</i><div><strong>Presupuesto / escenario</strong><p>${money(h.budget)}</p></div><span class="status">ESCENARIO</span></div><div class="gate"><i>2</i><div><strong>BASELINE_DEMO agregado</strong><p>${money(h.baselineRecorded)}</p></div><span class="status">PROCEDENCIA</span></div><div class="gate"><i>3</i><div><strong>LOCAL_ONLY itemizado</strong><p>${money(h.localRecorded)} · ${h.explicitCosts} registro(s) explícito(s)</p></div><span class="status teal">ITEMIZADO</span></div><div class="gate"><i class="${h.mismatchCount?'blocked':''}">${h.mismatchCount?'!':'✓'}</i><div><strong>Integridad de vínculos</strong><p>${h.mismatchCount} inconsistencia(s) · ${h.unallocatedCount} costo(s) no asignado(s) a ciclo</p></div><span class="status ${h.mismatchCount||h.unallocatedCount?'warn':'teal'}">${h.mismatchCount||h.unallocatedCount?'REVISAR':'SIN SEÑAL'}</span></div><div class="section-note">BUDGET ≠ COST ≠ ACCOUNTING ENTRY ≠ REALIZED REVENUE. Esta lectura no calcula rentabilidad ni desempeño financiero.</div></div></article></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Brechas del corte</h2><p>Inmutables respecto del snapshot activo.</p></div>${chip(`${g.total} ABIERTA(S)`,g.total?'warn':'teal')}</div><div class="card-body"><div class="grid metrics">${metric('Alta',g.counts.ALTA||0,'prioridad documental')}${metric('Media',g.counts.MEDIA||0,'revisión/completitud')}${metric('Baja',g.counts.BAJA||0,'granularidad/calidad')}</div><div class="chip-row" style="margin-top:12px">${(g.domains||[]).map(d=>`<span class="chip">${esc(d)}</span>`).join('')||'<span class="chip">Sin dominios con brecha</span>'}</div><div class="section-note" style="margin-top:12px">DOCUMENTARY_PRIORITY ≠ CREDIT_RISK ≠ ELIGIBILITY. Una brecha solo cambia históricamente cuando otro snapshot demuestra una condición distinta.</div></div></article><article class="card"><div class="card-head"><div><h2>Seguimiento posterior al corte</h2><p>Remediación LOCAL_ONLY; no forma parte retroactiva del snapshot.</p></div>${chip(`${p.prepared}/${p.total} PREPARADA(S)`,p.prepared===p.total?'teal':'warn')}</div><div class="card-body"><div class="grid metrics">${metric('Con plan',p.withPlan,`${p.total-p.withPlan} sin plan`)}${metric('Listas para re-evaluar',p.prepared,'no significa resueltas',p.prepared?'good':'warn')}${metric('Trabajo abierto',p.openWork,'incluye sin plan / en curso / esperando',p.openWork?'warn':'good')}</div><div class="section-note" style="margin-top:12px">REMEDIATION_ITEM ≠ SNAPSHOT_GAP ≠ GAP_RESOLVED. El seguimiento posterior puede cambiar; el snapshot histórico no.</div></div></article></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Evolución entre cortes</h2><p>${prev?`${esc(cutLabel(prev))} → ${esc(cutLabel(latest))}`:'Se requieren dos snapshots para demostrar evolución histórica.'}</p></div>${chip(diff?`${diff.total} DELTA(S)`:'SIN COMPARACIÓN',diff&&diff.total?'warn':'')}</div><div class="card-body">${diff?`<div class="grid metrics">${metric('Cambios capturados',diff.total,`${diff.domains.length} dominio(s)`)}${metric('Dominios',diff.domains.length,diff.domains.join(' · ')||'sin cambios')}${metric('Interpretación','DESCRIPTIVA','cambio ≠ mejora ≠ causalidad')}</div><div class="section-note" style="margin-top:12px">${diff.total?'La evolución proviene exclusivamente de dos manifests registrados.':'Los dos manifests comparables no presentan diferencias en los campos observados.'} CHANGE ≠ IMPROVEMENT ≠ FINANCIAL PERFORMANCE ≠ INVESTMENT SIGNAL.</div>`:'<div class="empty">Aún no existe una segunda fotografía histórica. El estado vivo y la remediación actual no sustituyen un nuevo snapshot.</div>'}</div></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Preparación del siguiente corte</h2><p>Condición operativa posterior, separada de la historia registrada.</p></div>${chip(next?.state?.replaceAll('_',' ')||'NO DISPONIBLE',next?.readyForHumanReview?'teal':'warn')}</div><div class="card-body"><div class="section-note"><strong>Regla:</strong> READY_FOR_HUMAN_REVIEW ≠ SNAPSHOT_CREATED ≠ GAP_RESOLVED ≠ INVESTMENT_READY. El Data Room 360° no crea cortes, no aprueba capital, no verifica externamente y no mueve dinero.</div><div class="head-actions" style="margin-top:12px"><button class="btn secondary" data-view-link="reports">Abrir expediente detallado</button></div></div></section>${footer()}`;
  }

  views.dataroom=dataroom360;
  window.__SANA_DATAROOM_360__=Object.freeze({schema:SCHEMA,state,integrity:'DATAROOM_360_READ_ONLY · SNAPSHOT_HISTORY ≠ POST_CUT_REMEDIATION ≠ LIVE_STATE ≠ INVESTMENT_DECISION'});
})();
