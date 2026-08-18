(() => {
  'use strict';

  const REVIEW_CONTEXT_INTEGRITY='CONTEXT_SUMMARY ≠ SOURCE_VERIFICATION · ACTIVE_SELECTOR ≠ REVIEW_PRIORITY · CONTEXT_ISSUE_COUNT ≠ RISK_SCORE · SUMMARY_VIEW ≠ PERSISTED_STATE · REVIEW_CONTEXT_VIEW ≠ SOURCE_LEDGER · READ_ONLY · NO_SOURCE_MUTATION';
  const REVIEW_STAGE_LABELS=Object.freeze({CASE:'Expediente',HANDOFF:'Handoff',FEEDBACK:'Feedback',RESPONSE:'Respuesta',DISPOSITION:'Disposición',ROUND:'Ronda'});

  function currentRole(){
    if(window.__SANA_ACCESS__?.role)return window.__SANA_ACCESS__.role;
    let id=window.__SANA_DEMO_IDENTITY__||null;
    if(!id){try{id=JSON.parse(localStorage.getItem('sana.demo.identity')||'null')}catch{id=null}}
    const raw=String(id?.role||'new_user').toLowerCase();
    return raw.includes('admin')?'admin':raw.includes('technical')||raw.includes('técn')?'technical':raw.includes('producer')||raw.includes('productor')?'producer':raw.includes('invest')?'investor':raw.includes('visitor')||raw.includes('guest')?'visitor':'new_user';
  }
  function state(){return window.__SANA_DATAROOM_360__?.state?.()||null}
  function insertAfterHeader(html,section){const marker='</header>';const at=html.indexOf(marker);return at<0?`${section}${html}`:`${html.slice(0,at+marker.length)}${section}${html.slice(at+marker.length)}`}
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}
  function summary(){
    const s=state();
    if(!s?.valid)return {cut:'Sin corte RPT-DD',gaps:'—',remediation:'—',evolution:'—'};
    return {
      cut:s.latest?.cutoff||String(s.latest?.createdAt||'').slice(0,10)||'sin corte',
      gaps:String(s.gaps?.total??0),
      remediation:`${s.postCut?.prepared??0}/${s.postCut?.total??0}`,
      evolution:s.diff?.valid?`${s.diff.total} delta(s)`:'sin 2.º corte'
    };
  }
  function investorCard(){
    const s=summary();
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">LECTURA EJECUTIVA PRIORITARIA</p><h2>Data Room 360°</h2><p>Empieza por el expediente integrado antes de abrir módulos individuales. Mantiene separados snapshot histórico, remediación posterior y evolución entre cortes.</p></div><span class="status teal">READ ONLY</span></div><div class="card-body"><div class="grid metrics">${metric('Último corte',s.cut,'SNAPSHOT_DEMO')}${metric('Brechas históricas',s.gaps,'prioridad documental')}${metric('Preparadas para re-evaluar',s.remediation,'no significa resueltas')}${metric('Evolución',s.evolution,'solo entre snapshots registrados')}</div><div class="head-actions" style="margin-top:12px"><button class="btn primary" data-view-link="dataroom">Abrir Data Room 360°</button><button class="btn secondary" data-view-link="reports">Ver detalle de Due Diligence</button></div><div class="section-note" style="margin-top:12px">READ_ONLY ≠ INVESTMENT_RECOMMENDATION ≠ ELIGIBILITY ≠ TRANSACTION. La vista organiza evidencia; no decide.</div></div></section>`;
  }
  function operatorCard(role){
    const s=summary();
    const title=role==='admin'?'Expediente ejecutivo':role==='technical'?'Síntesis técnica del expediente':'Síntesis documental del predio';
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">DATA ROOM 360°</p><h2>${esc(title)}</h2><p>Corte ${esc(s.cut)} · ${esc(s.gaps)} brecha(s) históricas · ${esc(s.remediation)} preparadas para re-evaluación.</p></div><button class="btn secondary" data-view-link="dataroom">Abrir 360°</button></div><div class="card-body"><div class="section-note">La síntesis ejecutiva es read-only. Para modificar actividades, evidencia, costos o remediación debes volver al módulo fuente correspondiente.</div></div></section>`;
  }

  function reviewContextSummary(){
    const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;
    if(!api?.state||!api?.readFocus||!api?.contextIntegrity)return null;
    try{
      const s=api.state(),focus=api.readFocus(),context=api.contextIntegrity(s.chains,focus),visible=api.visibleChains?.(s.chains,focus)||[];
      return {
        capital:focus.capital||'ALL',
        lot:focus.lot||'ALL',
        focus:focus.focus||'ALL',
        stage:focus.stage||'ALL',
        stageLabel:focus.stage==='ALL'?'Todas':REVIEW_STAGE_LABELS[focus.stage]||focus.stage||'—',
        event:focus.event||'',
        ref:focus.ref||'',
        resolved:context.resolved!==false,
        issueCount:context.issues?.length||0,
        visibleChains:visible.length,
        integrity:REVIEW_CONTEXT_INTEGRITY
      };
    }catch{return null}
  }
  function reviewContextChip(label,value,active,resolved){
    const border=active?(resolved?'#cfe0dd':'#dfd2b7'):'var(--line)',background=active?(resolved?'#f4faf8':'#fffdf8'):'#fafbf9';
    return `<div data-review-context-field="${esc(label)}" style="display:grid;gap:2px;flex:1 1 118px;min-width:0;padding:7px 9px;border:1px solid ${border};border-radius:9px;background:${background}"><span style="font-size:6px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">${esc(label)}</span><strong style="font-size:8px;overflow-wrap:anywhere">${esc(value||'—')}</strong></div>`;
  }
  function reviewContextSummaryHtml(x){
    if(!x)return '';
    return `<section data-review-context-summary class="review-context-summary" aria-label="Resumen de contexto de revisión" style="margin:0 0 12px;padding:11px;border:1px solid var(--line);border-radius:12px;background:${x.resolved?'#fff':'#fbfaf5'}"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px"><div style="display:grid;gap:2px"><p class="kicker" style="margin:0;font-size:7px;letter-spacing:.1em;color:var(--muted);font-weight:850">CONTEXTO ACTIVO · URL ONLY</p><strong style="font-size:10px">${x.resolved?'Contexto resuelto':'Contexto con selectores no resueltos'}</strong><small style="font-size:7px;color:var(--muted)">${x.visibleChains} circuito(s) visible(s) · ${x.issueCount} incidencia(s) de contexto</small></div><span class="status ${x.resolved?'teal':'warn'}">${x.resolved?'RESOLVED':'UNRESOLVED'}</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">${reviewContextChip('Capital case',x.capital,x.capital!=='ALL',x.resolved)}${reviewContextChip('Lote',x.lot,x.lot!=='ALL',x.resolved)}${reviewContextChip('Foco',x.focus,x.focus!=='ALL',x.resolved)}${reviewContextChip('Etapa',x.stage==='ALL'?'Todas':`${x.stageLabel} · ${x.stage}`,x.stage!=='ALL',x.resolved)}${reviewContextChip('Evento',x.event||'Sin foco',!!x.event,x.resolved)}${reviewContextChip('Referencia',x.ref||'Sin foco',!!x.ref,x.resolved)}</div><div class="section-note" style="margin-top:8px">${esc(REVIEW_CONTEXT_INTEGRITY)}</div></section>`;
  }
  function injectReviewContextSummary(html){
    if(!html||html.includes('data-review-context-summary'))return html;
    const workspaceAt=html.indexOf('<section id="review-workspace"');
    if(workspaceAt<0)return html;
    const context=reviewContextSummary(),section=reviewContextSummaryHtml(context);
    if(!section)return html;
    const controlsAt=html.indexOf('<div class="review-workspace-controls"',workspaceAt),controlsEnd=controlsAt>=0?html.indexOf('</div>',controlsAt):-1;
    const bodyAt=html.indexOf('<div class="card-body">',workspaceAt),fallback=bodyAt>=0?bodyAt+'<div class="card-body">'.length:workspaceAt;
    const insertAt=controlsEnd>=0?controlsEnd+'</div>'.length:fallback;
    let out=`${html.slice(0,insertAt)}${section}${html.slice(insertAt)}`;
    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V102').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con contexto operativo visible');
    return out;
  }

  const base=views.home;
  if(base)views.home=function homeWithDataRoomEntry(){
    const html=base();const role=currentRole();
    if(role==='investor')return insertAfterHeader(html,investorCard());
    if(['admin','technical','producer'].includes(role))return insertBeforeFooter(html,operatorCard(role));
    return html;
  };

  const baseDataRoom=views.dataroom;
  if(baseDataRoom)views.dataroom=function dataRoomWithReviewContextSummary(){return injectReviewContextSummary(baseDataRoom())};

  window.__SANA_DATAROOM_ENTRY__=Object.freeze({role:currentRole,integrity:'ROLE_ENTRY_ONLY · DATAROOM_READ_ONLY · NO_PRIVILEGE_ESCALATION'});
  window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__=Object.freeze({summary:reviewContextSummary,inject:injectReviewContextSummary,integrity:REVIEW_CONTEXT_INTEGRITY});
})();
