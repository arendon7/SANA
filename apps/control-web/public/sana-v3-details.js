(() => {
  'use strict';
  const KEY='sana.demo.v3.state';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const statusClass=s=>/valid|verific|complet|cerrad|activo|vigente/i.test(s)?'good':/pend|program|seguimiento|caracter/i.test(s)?'warn':/no habil|rechaz|bloq/i.test(s)?'bad':'pending';
  const status=s=>`<span class="status ${statusClass(s)}">${esc(s)}</span>`;
  const shortDate=v=>{try{return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${v}T12:00:00`))}catch{return esc(v)}};
  const metric=(label,value,delta='')=>`<article class="metric"><div class="label">${label}</div><div class="value">${value}</div>${delta?`<div class="delta">${delta}</div>`:''}</article>`;
  const empty=text=>`<div class="empty"><b>Sin registros</b>${esc(text)}</div>`;

  function contextForProducer(s,p){
    const farms=(s.farms||[]).filter(f=>f.producerId===p.id);
    const farmIds=new Set(farms.map(f=>f.id));
    const lots=(s.lots||[]).filter(l=>farmIds.has(l.farmId));
    const lotIds=new Set(lots.map(l=>l.id));
    const cycles=(s.cycles||[]).filter(c=>lotIds.has(c.lotId));
    const cycleIds=new Set(cycles.map(c=>c.id));
    const activities=(s.activities||[]).filter(a=>cycleIds.has(a.cycleId));
    const visits=(s.visits||[]).filter(v=>farmIds.has(v.farmId));
    const evidences=(s.evidences||[]).filter(e=>e.producerId===p.id || activities.some(a=>a.evidenceId===e.id));
    const docs=(s.documents||[]).filter(d=>d.related===p.id||farmIds.has(d.related)||cycleIds.has(d.related));
    const chars=(s.characterizations||[]).filter(c=>farmIds.has(c.farmId));
    return {farms,lots,cycles,activities,visits,evidences,docs,chars};
  }

  function renderProducer(id){
    const s=read(), p=(s.producers||[]).find(x=>x.id===id); if(!p)return;
    const c=contextForProducer(s,p), w=$('#workspace'); if(!w)return;
    const pending=c.activities.filter(a=>a.status!=='Completada').length;
    const valid=c.evidences.filter(e=>e.status==='Validada').length;
    const char=c.chars[0];
    $('#breadcrumbs').innerHTML=`<span>SANA</span><b>/</b><span>Productores</span><b>/</b><strong>${esc(p.name)}</strong>`;
    $('#mainNav')?.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    $('#mainNav')?.querySelector('[data-nav="producers"]')?.classList.add('active');
    w.innerHTML=`
      <div class="page-head"><div><span class="eyebrow">${esc(p.id)} · Perfil 360°</span><h1>${esc(p.name)}</h1><p>${esc(p.segment)} · ${esc(p.municipality)} · ${esc(p.phone||'Sin teléfono')} · ${esc(p.status)}. Esta vista conecta persona, unidad productiva, acompañamiento y evidencia en una sola historia.</p></div><div class="page-actions"><button class="ghost" data-detail-back="producers">← Productores</button><button class="secondary" data-detail-goto="characterization">Caracterización</button><button class="primary" data-detail-goto="trace">Registrar seguimiento</button></div></div>
      <section class="metric-grid">${metric('Línea base',`${p.score}/100`,char?`${char.completion}% ficha integral`:'sin ficha integral')}${metric('Predios',c.farms.length,`${c.lots.length} lote(s)`) }${metric('Actividades abiertas',pending,`${c.activities.length} totales`)}${metric('Evidencia validada',`${valid}/${c.evidences.length||0}`,'registros vinculados')}</section>
      <section class="content-grid">
        <article class="stack">
          <section class="card"><div class="card-header"><div><span class="eyebrow">Unidad productiva</span><h2>Predios y lotes</h2><p>Contexto físico donde ocurre el acompañamiento.</p></div></div>${c.farms.length?c.farms.map(f=>`<div class="record" data-record="farm" data-id="${f.id}" style="margin-bottom:10px"><div class="record-top"><span class="eyebrow">${f.id}</span>${status(f.status)}</div><h3>${esc(f.name)}</h3><p>${esc(f.vereda)}, ${esc(f.municipality)} · ${f.hectares} ha · ${f.altitude} msnm · ${esc(f.water)}</p><div class="record-meta">${c.lots.filter(l=>l.farmId===f.id).map(l=>`<span class="chip">${esc(l.name)} · ${esc(l.crop)}</span>`).join('')}</div></div>`).join(''):empty('Este productor aún no tiene predio vinculado.')}</section>
          <section class="card"><div class="card-header"><div><span class="eyebrow">Producción</span><h2>Ciclos y plan técnico</h2></div><button class="secondary" data-detail-goto="plan">Ver plan completo</button></div></div>${c.cycles.length?`<div class="table-wrap"><table><thead><tr><th>Ciclo</th><th>Lote</th><th>Etapa</th><th>Plan</th><th>Avance</th><th>Estado</th></tr></thead><tbody>${c.cycles.map(x=>{const l=c.lots.find(l=>l.id===x.lotId);return `<tr><td><b>${esc(x.crop)}</b><br><small>${x.id}</small></td><td>${esc(l?.name||x.lotId)}</td><td>${esc(x.stage)}</td><td>${esc(x.plan)}</td><td>${x.progress}%</td><td>${status(x.status)}</td></tr>`}).join('')}</tbody></table></div>`:empty('No hay ciclos productivos registrados.')}</section>
          <section class="card"><div class="card-header"><div><span class="eyebrow">Trazabilidad</span><h2>Actividad reciente</h2></div></div><div class="timeline">${timeline(c)}</div></section>
        </article>
        <aside class="stack">
          <section class="card"><div class="card-header"><div><span class="eyebrow">Caracterización</span><h3>Línea base integral</h3></div></div>${char?`<div class="progress-ring" style="--pct:${char.completion}%"><div><b>${char.completion}%</b><span>completado</span></div></div><div class="mini-list"><div class="mini-row"><span>Estado</span><b>${esc(char.status)}</b></div><div class="mini-row"><span>Prioridad</span><b>${esc(char.priority)}</b></div><div class="mini-row"><span>Siguiente paso</span><b style="max-width:150px;text-align:right">${esc(char.next)}</b></div></div>`:empty('Crea una caracterización integral para construir la línea base.')}</section>
          <section class="card"><div class="card-header"><div><span class="eyebrow">Evidencia</span><h3>Integridad documental</h3></div><button class="secondary" data-detail-goto="evidence">Abrir</button></div></div><div class="mini-list"><div class="mini-row"><span>Validadas</span><b>${valid}</b></div><div class="mini-row"><span>Pendientes / observadas</span><b>${c.evidences.length-valid}</b></div><div class="mini-row"><span>Documentos</span><b>${c.docs.length}</b></div></div></section>
          <section class="card"><div class="card-header"><div><span class="eyebrow">Próxima acción</span><h3>${pending?'Continuar acompañamiento':'Mantener seguimiento'}</h3></div></div><p style="font-size:11px;line-height:1.55;color:#68766f">${nextAction(c,char)}</p></section>
        </aside>
      </section>`;
  }

  function renderFarm(id){
    const s=read(), f=(s.farms||[]).find(x=>x.id===id); if(!f)return;
    const p=(s.producers||[]).find(x=>x.id===f.producerId), lots=(s.lots||[]).filter(l=>l.farmId===id), lotIds=new Set(lots.map(l=>l.id)), cycles=(s.cycles||[]).filter(c=>lotIds.has(c.lotId)), cycleIds=new Set(cycles.map(c=>c.id)), activities=(s.activities||[]).filter(a=>cycleIds.has(a.cycleId)), visits=(s.visits||[]).filter(v=>v.farmId===id), chars=(s.characterizations||[]).filter(c=>c.farmId===id), evidence=(s.evidences||[]).filter(e=>p&&e.producerId===p.id), char=chars[0];
    const w=$('#workspace'); if(!w)return;
    $('#breadcrumbs').innerHTML=`<span>SANA</span><b>/</b><span>Predios y lotes</span><b>/</b><strong>${esc(f.name)}</strong>`;
    $('#mainNav')?.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    $('#mainNav')?.querySelector('[data-nav="farms"]')?.classList.add('active');
    w.innerHTML=`
      <div class="page-head"><div><span class="eyebrow">${esc(f.id)} · Unidad productiva 360°</span><h1>${esc(f.name)}</h1><p>${esc(f.vereda)}, ${esc(f.municipality)} · ${f.hectares} ha · ${f.altitude} msnm · ${esc(f.tenure)}. Productor: ${esc(p?.name||'Sin asignar')}.</p></div><div class="page-actions"><button class="ghost" data-detail-back="farms">← Predios</button><button class="secondary" data-detail-goto="characterization">Línea base</button><button class="primary" data-detail-goto="trace">Nueva visita</button></div></div>
      <section class="metric-grid">${metric('Área',`${f.hectares} ha`,`${lots.length} lote(s)`) }${metric('Ciclos',cycles.length,`${activities.length} actividades`)}${metric('Visitas',visits.length,`${visits.filter(v=>v.status==='Programada').length} programada(s)`)}${metric('Caracterización',char?`${char.completion}%`:'—',char?.status||'sin ficha')}</section>
      <section class="content-grid"><article class="stack">
        <section class="card"><div class="card-header"><div><span class="eyebrow">Contexto territorial</span><h2>Ficha del predio</h2></div>${status(f.status)}</div><div class="split"><div class="mini-list"><div class="mini-row"><span>Municipio</span><b>${esc(f.municipality)}</b></div><div class="mini-row"><span>Vereda</span><b>${esc(f.vereda)}</b></div><div class="mini-row"><span>Altitud</span><b>${f.altitude} msnm</b></div></div><div class="mini-list"><div class="mini-row"><span>Tenencia</span><b>${esc(f.tenure)}</b></div><div class="mini-row"><span>Agua</span><b>${esc(f.water)}</b></div><div class="mini-row"><span>Productor</span><b>${esc(p?.name||'—')}</b></div></div></div></section>
        <section class="card"><div class="card-header"><div><span class="eyebrow">Microterritorio</span><h2>Lotes productivos</h2></div></div>${lots.length?`<div class="record-grid">${lots.map(l=>`<article class="record"><div class="record-top"><span class="eyebrow">${l.id}</span>${status(l.status)}</div><h3>${esc(l.name)}</h3><p>${esc(l.crop)} · ${esc(l.variety)} · ${l.hectares} ha</p><div class="record-meta"><span class="chip">Salud suelo ${l.soilHealth}/100</span><span class="chip">${cycles.filter(c=>c.lotId===l.id).length} ciclo(s)</span></div></article>`).join('')}</div>`:empty('Registra el primer lote para empezar trazabilidad agronómica.')}</section>
        <section class="card"><div class="card-header"><div><span class="eyebrow">Acompañamiento</span><h2>Visitas y hallazgos</h2></div></div>${visits.length?`<div class="timeline">${visits.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(v=>`<div class="timeline-item"><div class="timeline-dot">V</div><div><h4>${esc(v.purpose)}</h4><p>${esc(v.technician)} · ${esc(v.finding)} · ${status(v.status)}</p><time>${shortDate(v.date)}</time></div></div>`).join('')}</div>`:empty('Todavía no hay visitas asociadas a este predio.')}</section>
      </article><aside class="stack">
        <section class="card"><div class="card-header"><div><span class="eyebrow">Línea base</span><h3>Caracterización integral</h3></div></div>${char?`<div class="progress-ring" style="--pct:${char.completion}%"><div><b>${char.completion}%</b><span>completado</span></div></div><p style="font-size:10px;line-height:1.55;color:#68766f">${esc(char.summary)}</p><div class="mini-row"><span>Prioridad</span><b>${esc(char.priority)}</b></div>`:empty('Sin caracterización integral vinculada.')}</section>
        <section class="card"><div class="card-header"><div><span class="eyebrow">Plan vivo</span><h3>Estado operativo</h3></div></div><div class="mini-list"><div class="mini-row"><span>Actividades abiertas</span><b>${activities.filter(a=>a.status!=='Completada').length}</b></div><div class="mini-row"><span>Evidencias del productor</span><b>${evidence.length}</b></div><div class="mini-row"><span>Ciclos en seguimiento</span><b>${cycles.filter(c=>/seguimiento/i.test(c.status)).length}</b></div></div></section>
        <section class="card"><div class="card-header"><div><span class="eyebrow">Integridad</span><h3>Lectura técnica</h3></div></div><p style="font-size:10px;line-height:1.6;color:#68766f">El predio organiza contexto y riesgos; las decisiones agronómicas deben quedar vinculadas al lote/ciclo correspondiente para conservar trazabilidad y evitar generalizaciones.</p></section>
      </aside></section>`;
  }

  function timeline(c){
    const events=[...c.visits.map(v=>({date:v.date,title:v.purpose,detail:`Visita · ${v.status}`})),...c.activities.map(a=>({date:a.due,title:a.title,detail:`Actividad · ${a.status}`})),...c.evidences.map(e=>({date:e.date,title:e.title,detail:`Evidencia · ${e.status}`}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);
    return events.length?events.map(e=>`<div class="timeline-item"><div class="timeline-dot">•</div><div><h4>${esc(e.title)}</h4><p>${esc(e.detail)}</p><time>${shortDate(e.date)}</time></div></div>`).join(''):empty('Aún no hay eventos trazables asociados.');
  }

  function nextAction(c,char){
    const pendingEvidence=c.evidences.find(e=>e.status==='Pendiente'); if(pendingEvidence)return `Revisar la evidencia “${pendingEvidence.title}” y dejar una decisión técnica documentada.`;
    const open=c.activities.find(a=>a.status!=='Completada'); if(open)return `Cerrar o actualizar la actividad “${open.title}” y vincular evidencia cuando corresponda.`;
    if(char&&char.completion<100)return char.next;
    return 'Revisar el siguiente ciclo productivo y programar el acompañamiento de acuerdo con el plan técnico.';
  }

  function gotoPage(name){
    if(name==='characterization'){ const b=$('[data-char-nav]'); if(b)b.click(); return; }
    const b=$(`#mainNav [data-nav="${name}"]`); if(b)b.click();
  }

  document.addEventListener('click',e=>{
    const rec=e.target.closest('[data-record]');
    if(rec?.dataset.record==='producer'){ e.preventDefault(); renderProducer(rec.dataset.id); return; }
    if(rec?.dataset.record==='farm'){ e.preventDefault(); renderFarm(rec.dataset.id); return; }
    const back=e.target.closest('[data-detail-back]'); if(back){gotoPage(back.dataset.detailBack);return;}
    const go=e.target.closest('[data-detail-goto]'); if(go){gotoPage(go.dataset.detailGoto);return;}
  });
})();
