(() => {
  'use strict';

  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const REPORT_TYPE='RPT-DD';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};
  const OWNER_BY_DOMAIN={
    'Ciclo':'Técnico + Productor',
    'Passport':'Técnico',
    'Economía':'Productor + Administración',
    'Fuentes':'Administración + Técnico',
    'Impacto':'Técnico + Administración',
    'Readiness':'Administración / función responsable'
  };

  function api(){return window.__SANA_DUE_DILIGENCE_SNAPSHOT__}
  function snapshots(){return (api()?.snapshots?.()||[]).filter(s=>s?.manifest?.schema===SCHEMA&&s?.reportType===REPORT_TYPE)}
  function latest(){return snapshots().slice().sort((a,b)=>String(b.cutoff||b.createdAt||'').localeCompare(String(a.cutoff||a.createdAt||'')))[0]||null}
  function gap(id,domain,entity,condition,source,severity='MEDIA',owner=OWNER_BY_DOMAIN[domain]||'Responsable humano',detail=''){
    return {id,domain,entity,condition,source,severity,owner,detail,status:'OPEN_AT_SNAPSHOT'};
  }
  function derive(snapshot){
    if(!snapshot)return {valid:false,reason:'NO_SNAPSHOT',snapshot:null,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]};
    const m=snapshot.manifest||{};
    if(m.schema!==SCHEMA)return {valid:false,reason:'SCHEMA_INCOMPATIBLE',snapshot,gaps:[],counts:{ALTA:0,MEDIA:0,BAJA:0},domains:[]};
    const gaps=[];

    (m.cycles||[]).forEach(c=>{
      if(Number(c.evidenceGaps)>0)gaps.push(gap(`cycle:${c.planId}:evidence`,'Ciclo',c.planId,`${c.evidenceGaps} brecha(s) de evidencia requerida`,'Cycle Closure · evidenceGaps','ALTA'));
      if(Number(c.openActivities)>0)gaps.push(gap(`cycle:${c.planId}:open`,'Ciclo',c.planId,`${c.openActivities} actividad(es) abiertas en el corte`,'Cycle Closure · openActivities','ALTA'));
      if(c.readyForArchive!==true)gaps.push(gap(`cycle:${c.planId}:archive`,'Ciclo',c.planId,'Base documental no marcada como cerrable','Cycle Closure · readyForArchive','MEDIA'));
      if(!c.reviewStatus||c.reviewStatus==='SIN_REVISIÓN')gaps.push(gap(`cycle:${c.planId}:review`,'Ciclo',c.planId,'Sin revisión humana de cierre registrada','Cycle Closure · reviewStatus','MEDIA'));
    });

    (m.passport||[]).forEach(p=>{
      if(p.integrity===null||p.integrity===undefined)gaps.push(gap(`passport:${p.lot}:missing`,'Passport',p.lot,'Integridad Passport no capturada en el snapshot','Passport · integrity','ALTA'));
      else if(Number(p.integrity)<80)gaps.push(gap(`passport:${p.lot}:integrity`,'Passport',p.lot,`Integridad reconstruible ${p.integrity}%`,'Passport · integrity','MEDIA'));
    });

    (m.economics||[]).forEach(e=>{
      if(Number(e.localRecorded||0)<=0)gaps.push(gap(`economics:${e.lotId}:itemized`,'Economía',e.lotId,'Sin costos LOCAL_ONLY itemizados capturados en el corte','Economics Contract · localRecorded','MEDIA'));
      if(!e.observedStatus||e.observedStatus==='SIN_RESULTADO')gaps.push(gap(`economics:${e.lotId}:result`,'Economía',e.lotId,'Sin resultado observado capturado en la lectura económica','Economics Contract · observedStatus','MEDIA'));
      if(e.supportCoverage===undefined&&e.explicitCostCount===undefined)gaps.push(gap(`economics:${e.lotId}:granularity`,'Economía',e.lotId,'El snapshot no captura granularidad de costos explícitos/soporte para este lote','Snapshot manifest · Economics Contract','BAJA',OWNER_BY_DOMAIN['Economía'],'No se rellena desde estado vivo; requiere un nuevo corte que capture esa granularidad.'));
      if(e.supportCoverage!==undefined&&Number(e.supportCoverage)<100)gaps.push(gap(`economics:${e.lotId}:support`,'Economía',e.lotId,`Cobertura de soporte económico ${e.supportCoverage}%`,'Economics Contract · supportCoverage','ALTA'));
      if(Number(e.mismatchCount||0)>0)gaps.push(gap(`economics:${e.lotId}:mismatch`,'Economía',e.lotId,`${e.mismatchCount} vínculo(s) económico(s) con inconsistencia`,'Economics Contract · mismatchCount','ALTA'));
      if(Number(e.unallocatedCount||0)>0)gaps.push(gap(`economics:${e.lotId}:unallocated`,'Economía',e.lotId,`${e.unallocatedCount} costo(s) del lote no asignado(s) a ciclo`,'Economics Contract · unallocatedCount','MEDIA'));
    });

    const sources=m.sources||[];
    if(!sources.length)gaps.push(gap('sources:none','Fuentes',m.farm?.id||'Unidad','Sin referencias documentales externas capturadas','Source Registry · sources','ALTA'));
    sources.forEach(s=>{
      if(s.state==='REFERENCE_ONLY'||!s.state)gaps.push(gap(`source:${s.id}:verification`,'Fuentes',s.id,'Fuente registrada como referencia; verificación externa no demostrada','Source Registry · state','MEDIA',OWNER_BY_DOMAIN['Fuentes'],`${s.scope||'sin ámbito'} · ${s.version||'sin versión'} · corte ${s.cut||'—'}`));
    });

    const impact=m.impact||null;
    if(!impact)gaps.push(gap('impact:missing','Impacto','SANA Impact','Read-model de impacto no capturado','SANA Impact · summary','ALTA'));
    else {
      if(!impact.humanReviewed)gaps.push(gap('impact:review','Impacto','SANA Impact','Metodología sin revisión humana registrada','SANA Impact · humanReviewed','ALTA'));
      if(Number(impact.externallyVerified||0)===0)gaps.push(gap('impact:external','Impacto','SANA Impact','Sin indicadores verificados externamente en el corte','SANA Impact · externallyVerified','MEDIA',OWNER_BY_DOMAIN['Impacto'],'No equivale a exigir certificación para todos los usos; identifica la frontera de verificación del snapshot.'));
      if(Number(impact.estimated||0)>0)gaps.push(gap('impact:estimated','Impacto','SANA Impact',`${impact.estimated} indicador(es) estimado(s)`,'SANA Impact · estimated','BAJA'));
    }

    const capital=m.capital||null;
    if(!capital)gaps.push(gap('readiness:missing','Readiness','Capital','Readiness no capturado en el snapshot','Capital Readiness · gateData','ALTA'));
    else Object.entries(capital.gates||{}).forEach(([id,g])=>{
      if(g?.state==='blocked')gaps.push(gap(`readiness:${id}:blocked`,'Readiness',id,'Gate fuera de la DEMO / bloqueado','Capital Readiness · gate state','ALTA',id==='legal'?'Administración + Jurídico / proceso externo':OWNER_BY_DOMAIN['Readiness']));
      else if(g?.state==='gap')gaps.push(gap(`readiness:${id}:gap`,'Readiness',id,'Gate con brecha documental','Capital Readiness · gate state','ALTA'));
      else if(g?.state==='review')gaps.push(gap(`readiness:${id}:review`,'Readiness',id,'Gate requiere revisión adicional','Capital Readiness · gate state','MEDIA'));
    });

    gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||a.domain.localeCompare(b.domain)||a.entity.localeCompare(b.entity));
    const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>{counts[g.severity]=(counts[g.severity]||0)+1});
    return {valid:true,reason:'OK',snapshot,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION'};
  }
  function current(){return derive(latest())}
  function snapshotLabel(s){return s?`${s.cutoff||String(s.createdAt||'').slice(0,10)||'sin corte'} · ${s.reviewer||'sin revisor'} · ${String(s.id||'').slice(-8)}`:'—'}
  function severityTone(s){return s==='ALTA'?'danger':s==='MEDIA'?'warn':'teal'}
  function matrix(){
    const state=current();
    if(!state.valid)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">MATRIZ DE BRECHAS · SNAPSHOT</p><h2>Sin corte Due Diligence compatible</h2><p>La matriz se genera únicamente desde un snapshot RPT-DD registrado. No usa el estado vivo como sustituto.</p></div><span class="status warn">${state.reason}</span></div></section>`;
    const s=state.snapshot;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">MATRIZ DE BRECHAS · READ ONLY</p><h2>Qué falta según el último corte registrado</h2><p>${esc(snapshotLabel(s))}. Cada fila describe una condición capturada en ese snapshot; no es scoring crediticio ni evaluación de inversión.</p></div><span class="status ${state.gaps.length?'warn':'teal'}">${state.gaps.length} BRECHA(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Prioridad documental alta',state.counts.ALTA,'requiere atención del expediente',state.counts.ALTA?'warn':'good')}${metric('Prioridad media',state.counts.MEDIA,'revisión / completitud')}${metric('Prioridad baja',state.counts.BAJA,'granularidad / calidad')}${metric('Dominios afectados',state.domains.length,state.domains.join(' · ')||'sin brechas','good')}</div><div class="section-note" style="margin-top:12px"><strong>Regla:</strong> una brecha permanece asociada al corte histórico. No se marca “resuelta” aquí. Un snapshot posterior debe demostrar el cambio. SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION.</div></div></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Brechas por procedencia</h2><p>Dominio → expediente → condición → fuente → responsable funcional sugerido.</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Prioridad</th><th>Dominio</th><th>Expediente</th><th>Condición observada</th><th>Procedencia</th><th>Responsable sugerido</th></tr></thead><tbody>${state.gaps.length?state.gaps.map(g=>`<tr><td><span class="status ${severityTone(g.severity)}">${esc(g.severity)}</span></td><td>${esc(g.domain)}</td><td><strong>${esc(g.entity)}</strong></td><td>${esc(g.condition)}${g.detail?`<small style="display:block;margin-top:4px">${esc(g.detail)}</small>`:''}</td><td>${esc(g.source)}</td><td>${esc(g.owner)}</td></tr>`).join(''):`<tr><td colspan="6"><div class="empty">El snapshot no presenta brechas según las reglas actuales. Esto no equivale a aprobación, verificación externa, elegibilidad o ausencia de riesgo.</div></td></tr>`}</tbody></table></div></section>`;
  }
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}

  const baseReports=views.reports;
  if(baseReports)views.reports=function reportsWithGapMatrix(){return insertBeforeFooter(baseReports(),matrix())};

  window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:SCHEMA,latest,derive,current,integrity:'SNAPSHOT_GAPS_ONLY · DOCUMENTARY_PRIORITY ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION'});
})();
