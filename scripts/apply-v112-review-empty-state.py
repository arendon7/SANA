from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if "REVIEW_V112_COMPAT" in entry:
    print('V112 empty-state patch already applied')
    raise SystemExit(0)

old_integrity="PRESERVED_SELECTOR ≠ VERIFIED_CONTEXT · READ_ONLY · NO_SOURCE_MUTATION"
new_integrity="PRESERVED_SELECTOR ≠ VERIFIED_CONTEXT · EMPTY_VIEW ≠ EMPTY_EVIDENCE · FILTER_EMPTY ≠ REVIEW_GAP · CONTEXT_EMPTY ≠ SOURCE_MISSING · SOURCE_INDETERMINATE ≠ SOURCE_ABSENT · FILTER_RECOVERY ≠ SOURCE_MUTATION · EMPTY_STATE ≠ REVIEW_OUTCOME · READ_ONLY · NO_SOURCE_MUTATION"
if old_integrity not in entry: raise SystemExit('V112 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V111_COMPAT='DATA ROOM · REVIEW WORKSPACE V111 · Circuito de revisión, con vista previa del impacto URL';"
new_compat=old_compat+"\n  const REVIEW_V112_COMPAT='DATA ROOM · REVIEW WORKSPACE V112 · Circuito de revisión, con estados vacíos explícitos y recuperación de filtros';"
if old_compat not in entry: raise SystemExit('V112 compat const anchor missing')
entry=entry.replace(old_compat,new_compat,1)

role_anchor="  function reviewRoleLens(role=currentRole()){"
insert="""  function reviewEmptyState(s,focus,context,visible=[]){
    const count=Array.isArray(visible)?visible.length:0;
    if(count>0)return {kind:'NONE',visible:true,canRecover:false,clears:[],headline:'Circuitos visibles',detail:`${count} circuito(s) visible(s).`,integrity:'EMPTY_VIEW ≠ EMPTY_EVIDENCE'};
    if(context?.resolved===false)return {kind:'CONTEXT_EMPTY',visible:false,canRecover:false,clears:[],headline:'El contexto URL no resuelve',detail:'Los selectores del enlace no producen un contexto resoluble. Usa la recuperación de contexto existente; esto no implica ausencia de evidencia ni falla.',integrity:'CONTEXT_EMPTY ≠ SOURCE_MISSING ≠ REVIEW_FAILURE'};
    const summary=s?.summary||{},technicalSignals=['unavailableSources','sourceReadErrors','schemaMismatches','missingSourceSchemas','ambiguousStageReferences','invalidSourceCases','sourcesWithInvalidPayload'].reduce((n,key)=>n+Number(summary[key]||0),0);
    if((s?.chains||[]).length>0){
      const canRecover=focus?.focus&&focus.focus!=='ALL';
      return {kind:'FILTER_EMPTY',visible:false,canRecover:!!canRecover,clears:canRecover?['rwFocus']:[],headline:'Los filtros no muestran circuitos',detail:canRecover?'El foco documental actual excluye todos los circuitos visibles. Puedes mostrar todos sin cambiar capital case, lote, etapa, evento o referencia.':'No hay circuitos visibles con el contexto actual; no se interpreta como gap, riesgo ni ausencia de evidencia.',integrity:'FILTER_EMPTY ≠ REVIEW_GAP · FILTER_RECOVERY ≠ SOURCE_MUTATION'};
    }
    if(technicalSignals>0)return {kind:'SOURCE_INDETERMINATE',visible:false,canRecover:false,clears:[],headline:'La proyección no es determinable desde las fuentes actuales',detail:'Existen señales técnicas de disponibilidad, schema, multiplicidad o payload. No se convierten en ausencia documental ni se corrigen desde esta vista.',technicalSignals,integrity:'SOURCE_INDETERMINATE ≠ SOURCE_ABSENT ≠ REVIEW_FAILURE'};
    return {kind:'WORKSPACE_EMPTY',visible:false,canRecover:false,clears:[],headline:'No hay circuitos proyectados en esta vista',detail:'El workspace no tiene circuitos proyectados. Este estado no afirma que no exista evidencia ni constituye resultado de revisión.',integrity:'WORKSPACE_EMPTY ≠ EMPTY_EVIDENCE ≠ REVIEW_OUTCOME'};
  }
  function applyReviewFilterRecovery(mode='CLEAR_FOCUS'){
    if(mode!=='CLEAR_FOCUS')return {applied:false,cleared:[]};
    try{
      const u=new URL(location.href),had=u.searchParams.has('rwFocus');
      u.searchParams.delete('rwFocus');
      history.replaceState(null,'',`${u.pathname}${u.search}${u.hash||'#dataroom'}`);
      if(typeof render==='function')render();
      if(typeof queueMicrotask==='function')queueMicrotask(()=>focusReviewWorkspace({scroll:false}));
      return {applied:true,cleared:had?['rwFocus']:[],path:`${u.pathname}${u.search}${u.hash||'#dataroom'}`,integrity:'FILTER_RECOVERY ≠ SOURCE_MUTATION · FILTER_EMPTY ≠ REVIEW_GAP'};
    }catch{return {applied:false,cleared:[]}}
  }
"""
if role_anchor not in entry: raise SystemExit('V112 role anchor missing')
entry=entry.replace(role_anchor,insert+role_anchor,1)

summary_anchor="        visibleChains:visible.length,\n        stageNavigation:reviewStageNavigation(s,focus),"
summary_repl="        visibleChains:visible.length,\n        emptyState:reviewEmptyState(s,focus,context,visible),\n        stageNavigation:reviewStageNavigation(s,focus),"
if summary_anchor not in entry: raise SystemExit('V112 summary anchor missing')
entry=entry.replace(summary_anchor,summary_repl,1)

html_anchor="  function reviewRoleLensHtml(lens){"
html_insert="""  function reviewEmptyStateHtml(empty){
    if(!empty||empty.kind==='NONE')return '';
    const action=empty.canRecover?'<button type="button" class="btn ghost" data-review-empty-recover="CLEAR_FOCUS">Mostrar todos los circuitos</button>':'';
    return `<section data-review-empty-state="${esc(empty.kind)}" class="review-empty-state" aria-label="Estado de resultados del workspace"><div class="review-empty-state-head"><div><p class="kicker">RESULTADOS DEL WORKSPACE · READ ONLY</p><h4>${esc(empty.headline)}</h4><p>${esc(empty.detail)}</p></div><span class="status">${esc(empty.kind)}</span></div>${action}<div class="section-note">${esc(empty.integrity)} · EMPTY_STATE ≠ REVIEW_OUTCOME</div></section>`;
  }
"""
if html_anchor not in entry: raise SystemExit('V112 html anchor missing')
entry=entry.replace(html_anchor,html_insert+html_anchor,1)

old_call="${reviewContextRecoveryHtml(x.recovery,x.recoveryAll)}${reviewRoleLensHtml(x.roleLens)}"
new_call="${reviewContextRecoveryHtml(x.recovery,x.recoveryAll)}${reviewEmptyStateHtml(x.emptyState)}${reviewRoleLensHtml(x.roleLens)}"
if old_call not in entry: raise SystemExit('V112 empty-state html call anchor missing')
entry=entry.replace(old_call,new_call,1)

old_compat_chain='<!-- ${REVIEW_V109_COMPAT} --><!-- ${REVIEW_V110_COMPAT} --><!-- ${REVIEW_V111_COMPAT} --><section data-review-context-summary'
new_compat_chain='<!-- ${REVIEW_V109_COMPAT} --><!-- ${REVIEW_V110_COMPAT} --><!-- ${REVIEW_V111_COMPAT} --><!-- ${REVIEW_V112_COMPAT} --><section data-review-context-summary'
if old_compat_chain not in entry: raise SystemExit('V112 compat html anchor missing')
entry=entry.replace(old_compat_chain,new_compat_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V111').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con vista previa y recuperación URL');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con vista previa y recuperación URL</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con vista previa y recuperación URL</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V112').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con estados vacíos explícitos y recuperación de filtros');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con estados vacíos explícitos y recuperación de filtros</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con estados vacíos explícitos y recuperación de filtros</h2>');"
if old_title not in entry: raise SystemExit('V112 title anchor missing')
entry=entry.replace(old_title,new_title,1)

click_anchor="      const recovery=e.target.closest?.('[data-review-context-recover]');\n      if(recovery){applyReviewRecovery(recovery.dataset.reviewContextRecover||'ALL');return}"
click_repl="      const emptyRecovery=e.target.closest?.('[data-review-empty-recover]');\n      if(emptyRecovery){applyReviewFilterRecovery(emptyRecovery.dataset.reviewEmptyRecover||'CLEAR_FOCUS');return}\n"+click_anchor
if click_anchor not in entry: raise SystemExit('V112 click anchor missing')
entry=entry.replace(click_anchor,click_repl,1)

old_export="liveContext:reviewLiveContext,recoveryPreview:reviewRecoveryPreview,recoveryPlan:reviewRecoveryPlan,recoverContext:applyReviewRecovery,integrity:REVIEW_CONTEXT_INTEGRITY"
new_export="liveContext:reviewLiveContext,recoveryPreview:reviewRecoveryPreview,recoveryPlan:reviewRecoveryPlan,recoverContext:applyReviewRecovery,emptyState:reviewEmptyState,recoverEmptyFilter:applyReviewFilterRecovery,integrity:REVIEW_CONTEXT_INTEGRITY"
if old_export not in entry: raise SystemExit('V112 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V112 · Empty state and filter recovery */' not in css:
    css += """

/* V112 · Empty state and filter recovery */
.review-empty-state{margin-top:9px;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fbfcfa}.review-empty-state-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.review-empty-state h4{margin:2px 0 3px;font-size:10px}.review-empty-state p{margin:0;font-size:7px;line-height:1.45;color:var(--muted)}.review-empty-state>.btn{margin-top:8px}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V112 empty-state and filter recovery patch applied')
