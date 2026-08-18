(() => {
  'use strict';

  const REVIEW_CONTEXT_INTEGRITY='CONTEXT_SUMMARY ≠ SOURCE_VERIFICATION · ACTIVE_SELECTOR ≠ REVIEW_PRIORITY · CONTEXT_ISSUE_COUNT ≠ RISK_SCORE · SUMMARY_VIEW ≠ PERSISTED_STATE · REVIEW_CONTEXT_VIEW ≠ SOURCE_LEDGER · STAGE_SWITCH ≠ REVIEW_PROGRESS · STAGE_ORDER ≠ REQUIRED_SEQUENCE · NAVIGABLE_STAGE ≠ COMPLETE_STAGE · DISABLED_STAGE ≠ REVIEW_FAILURE · URL_STAGE_CHANGE ≠ SOURCE_MUTATION · STAGE_BUTTON_STATUS ≠ REVIEW_OUTCOME · CONTEXT_LINK ≠ SOURCE_SNAPSHOT · COPIED_LINK ≠ VERIFIED_CONTEXT · CLIPBOARD_COPY ≠ EXTERNAL_DELIVERY · SHAREABLE_URL ≠ REVIEW_APPROVAL · LINK_REOPEN ≠ CONTEXT_VERIFICATION · URL_CONTEXT ≠ PERSISTED_SOURCE_STATE · READ_ONLY · NO_SOURCE_MUTATION';
  const REVIEW_STAGE_LABELS=Object.freeze({CASE:'Expediente',HANDOFF:'Handoff',FEEDBACK:'Feedback',RESPONSE:'Respuesta',DISPOSITION:'Disposición',ROUND:'Ronda'});
  const REVIEW_STAGE_ORDER=Object.freeze(['CASE','HANDOFF','FEEDBACK','RESPONSE','DISPOSITION','ROUND']);
  const REVIEW_CONTEXT_KEYS=Object.freeze(['rwCapital','rwLot','rwFocus','rwStage','rwEvent','rwRef']);
  const REVIEW_V102_COMPAT='DATA ROOM · REVIEW WORKSPACE V102 · Circuito de revisión, con contexto operativo visible';
  const REVIEW_V103_COMPAT='DATA ROOM · REVIEW WORKSPACE V103 · Circuito de revisión, con contexto operativo y navegación de etapas';

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

  function reviewStageNavigation(s,focus){
    const ready=focus?.capital&&focus.capital!=='ALL'&&focus?.lot&&focus.lot!=='ALL';
    const chain=ready?(s?.chains||[]).find(c=>c.capitalCaseRef===focus.capital&&c.lot===focus.lot)||null:null;
    const items=REVIEW_STAGE_ORDER.map(stage=>{
      const meta=chain?.stages?.find(x=>x.stage===stage)||null;
      let state='NO_CONTEXT';
      if(chain){
        if(meta?.ambiguous)state='AMBIGUOUS';
        else if(meta?.present&&meta?.entry)state='REFERENCED';
        else if(meta?.sourceState&&meta.sourceState!=='AVAILABLE')state='SOURCE_UNAVAILABLE';
        else if(meta?.sourceSchemaState&&meta.sourceSchemaState!=='MATCH')state='SCHEMA_UNRESOLVED';
        else if(meta?.sourcePayloadState==='INVALID')state='PAYLOAD_INVALID';
        else state='NOT_REFERENCED';
      }
      return {stage,label:REVIEW_STAGE_LABELS[stage],active:focus?.stage===stage,navigable:state==='REFERENCED',state,integrity:'STAGE_BUTTON_STATUS ≠ REVIEW_OUTCOME'};
    });
    return {contextReady:!!chain,chainKey:chain?.key||'',items,integrity:'STAGE_SWITCH ≠ REVIEW_PROGRESS · STAGE_ORDER ≠ REQUIRED_SEQUENCE · NAVIGABLE_STAGE ≠ COMPLETE_STAGE · DISABLED_STAGE ≠ REVIEW_FAILURE · URL_STAGE_CHANGE ≠ SOURCE_MUTATION'};
  }
  function reviewContextPermalink(focus){
    try{
      const f=focus||window.__SANA_DATAROOM_REVIEW_WORKSPACE__?.readFocus?.();
      if(!f)return null;
      const u=new URL(location.href);
      [...u.searchParams.keys()].forEach(key=>u.searchParams.delete(key));
      const values=[['rwCapital',f.capital,'ALL'],['rwLot',f.lot,'ALL'],['rwFocus',f.focus,'ALL'],['rwStage',f.stage,'ALL'],['rwEvent',f.event,''],['rwRef',f.ref,'']];
      for(const [key,value,empty] of values)if(value&&value!==empty)u.searchParams.set(key,String(value));
      u.hash='#dataroom';
      return {href:u.toString(),path:`${u.pathname}${u.search}${u.hash}`,keys:[...REVIEW_CONTEXT_KEYS],integrity:'CONTEXT_LINK ≠ SOURCE_SNAPSHOT · COPIED_LINK ≠ VERIFIED_CONTEXT · SHAREABLE_URL ≠ REVIEW_APPROVAL · LINK_REOPEN ≠ CONTEXT_VERIFICATION · URL_CONTEXT ≠ PERSISTED_SOURCE_STATE'};
    }catch{return null}
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
        stageNavigation:reviewStageNavigation(s,focus),
        permalink:reviewContextPermalink(focus),
        integrity:REVIEW_CONTEXT_INTEGRITY
      };
    }catch{return null}
  }
  function reviewContextChip(label,value,active,resolved){
    const border=active?(resolved?'#cfe0dd':'#dfd2b7'):'var(--line)',background=active?(resolved?'#f4faf8':'#fffdf8'):'#fafbf9';
    return `<div data-review-context-field="${esc(label)}" style="display:grid;gap:2px;flex:1 1 118px;min-width:0;padding:7px 9px;border:1px solid ${border};border-radius:9px;background:${background}"><span style="font-size:6px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">${esc(label)}</span><strong style="font-size:8px;overflow-wrap:anywhere">${esc(value||'—')}</strong></div>`;
  }
  function reviewStageSwitcherHtml(nav){
    if(!nav)return '';
    const button=item=>{
      const disabled=!item.navigable||item.active,border=item.active?'var(--teal)':item.navigable?'#cfe0dd':'var(--line)',background=item.active?'#e9f4f1':item.navigable?'#f7fbfa':'#f7f8f5',color=item.active?'var(--teal)':item.navigable?'var(--ink2)':'var(--muted)';
      return `<button type="button" data-review-context-stage="${esc(item.stage)}" ${disabled?'disabled':''} aria-pressed="${item.active?'true':'false'}" title="${esc(item.state)}" style="display:grid;gap:2px;min-width:104px;padding:7px 8px;border:1px solid ${border};border-radius:9px;background:${background};color:${color};font:inherit;text-align:left;cursor:${disabled?'default':'pointer'};opacity:${disabled&&!item.active?'.72':'1'}"><strong style="font-size:8px">${esc(item.label)}</strong><small style="font-size:6px;color:inherit">${esc(item.active?'ACTIVA':item.state)}</small></button>`;
    };
    return `<div data-review-stage-switcher style="margin-top:9px;padding-top:9px;border-top:1px solid var(--line)"><div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px"><strong style="font-size:8px">NAVEGACIÓN DE ETAPAS · URL ONLY</strong><small style="font-size:6px;color:var(--muted)">${nav.contextReady?'Circuito seleccionado':'Selecciona capital case + lote'}</small></div><div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:2px">${nav.items.map(button).join('')}</div><div style="margin-top:6px;font-size:6px;color:var(--muted)">STAGE_ORDER ≠ REQUIRED_SEQUENCE · NAVIGABLE_STAGE ≠ COMPLETE_STAGE · DISABLED_STAGE ≠ REVIEW_FAILURE</div></div>`;
  }
  function reviewContextPermalinkHtml(link){
    if(!link)return '';
    return `<div data-review-context-link style="margin-top:9px;padding-top:9px;border-top:1px solid var(--line)"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap"><div style="display:grid;gap:3px;min-width:0;flex:1"><strong style="font-size:8px">ENLACE DE CONTEXTO · CANÓNICO</strong><code style="font-size:6px;color:var(--muted);white-space:normal;overflow-wrap:anywhere">${esc(link.href)}</code><small data-review-context-copy-status aria-live="polite" style="font-size:6px;color:var(--muted)">Solo reproduce selectores URL; no congela ni verifica fuentes.</small></div><button type="button" class="btn ghost" data-review-context-copy style="white-space:nowrap">Copiar enlace</button></div><div style="margin-top:6px;font-size:6px;color:var(--muted)">CONTEXT_LINK ≠ SOURCE_SNAPSHOT · COPIED_LINK ≠ VERIFIED_CONTEXT · CLIPBOARD_COPY ≠ EXTERNAL_DELIVERY</div></div>`;
  }
  function reviewContextSummaryHtml(x){
    if(!x)return '';
    return `<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><section data-review-context-summary class="review-context-summary" aria-label="Resumen de contexto de revisión" style="margin:0 0 12px;padding:11px;border:1px solid var(--line);border-radius:12px;background:${x.resolved?'#fff':'#fbfaf5'}"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px"><div style="display:grid;gap:2px"><p class="kicker" style="margin:0;font-size:7px;letter-spacing:.1em;color:var(--muted);font-weight:850">CONTEXTO ACTIVO · URL ONLY</p><strong style="font-size:10px">${x.resolved?'Contexto resuelto':'Contexto con selectores no resueltos'}</strong><small style="font-size:7px;color:var(--muted)">${x.visibleChains} circuito(s) visible(s) · ${x.issueCount} incidencia(s) de contexto</small></div><span class="status ${x.resolved?'teal':'warn'}">${x.resolved?'RESOLVED':'UNRESOLVED'}</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">${reviewContextChip('Capital case',x.capital,x.capital!=='ALL',x.resolved)}${reviewContextChip('Lote',x.lot,x.lot!=='ALL',x.resolved)}${reviewContextChip('Foco',x.focus,x.focus!=='ALL',x.resolved)}${reviewContextChip('Etapa',x.stage==='ALL'?'Todas':`${x.stageLabel} · ${x.stage}`,x.stage!=='ALL',x.resolved)}${reviewContextChip('Evento',x.event||'Sin foco',!!x.event,x.resolved)}${reviewContextChip('Referencia',x.ref||'Sin foco',!!x.ref,x.resolved)}</div>${reviewStageSwitcherHtml(x.stageNavigation)}${reviewContextPermalinkHtml(x.permalink)}<div class="section-note" style="margin-top:8px">${esc(REVIEW_CONTEXT_INTEGRITY)}</div></section>`;
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
    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V104').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con contexto reproducible y navegación de etapas');
    return out;
  }
  function selectReviewStage(stage){
    const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__;
    if(!REVIEW_STAGE_ORDER.includes(stage)||!api?.state||!api?.readFocus)return false;
    try{
      const s=api.state(),focus=api.readFocus(),nav=reviewStageNavigation(s,focus),item=nav.items.find(x=>x.stage===stage);
      if(!item?.navigable||item.active)return false;
      const u=new URL(location.href);
      u.searchParams.set('rwStage',stage);
      u.searchParams.delete('rwEvent');
      u.searchParams.delete('rwRef');
      history.replaceState(null,'',`${u.pathname}${u.search}${u.hash||'#dataroom'}`);
      if(typeof render==='function')render();
      return true;
    }catch{return false}
  }
  async function copyReviewContextPermalink(){
    const link=reviewContextPermalink();
    if(!link)return {copied:false,reason:'CONTEXT_LINK_UNAVAILABLE',href:''};
    if(typeof navigator==='undefined'||!navigator.clipboard?.writeText)return {copied:false,reason:'CLIPBOARD_UNAVAILABLE',href:link.href};
    try{await navigator.clipboard.writeText(link.href);return {copied:true,reason:'COPIED_LOCAL_CLIPBOARD',href:link.href}}catch{return {copied:false,reason:'CLIPBOARD_WRITE_FAILED',href:link.href}}
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

  if(typeof document!=='undefined')document.addEventListener('click',e=>{
    const copy=e.target.closest?.('[data-review-context-copy]');
    if(copy){copyReviewContextPermalink().then(result=>{const status=document.querySelector?.('[data-review-context-copy-status]');if(status)status.textContent=result.copied?'Enlace copiado localmente':'Copia no disponible · enlace visible';});return}
    const stage=e.target.closest?.('[data-review-context-stage]');
    if(stage&&!stage.disabled)selectReviewStage(stage.dataset.reviewContextStage||'');
  });

  window.__SANA_DATAROOM_ENTRY__=Object.freeze({role:currentRole,integrity:'ROLE_ENTRY_ONLY · DATAROOM_READ_ONLY · NO_PRIVILEGE_ESCALATION'});
  window.__SANA_DATAROOM_REVIEW_CONTEXT_SUMMARY__=Object.freeze({summary:reviewContextSummary,inject:injectReviewContextSummary,stageNavigation:reviewStageNavigation,selectStage:selectReviewStage,permalink:reviewContextPermalink,copyPermalink:copyReviewContextPermalink,integrity:REVIEW_CONTEXT_INTEGRITY});
})();
