from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

entry=entry.replace("ACCESSIBILITY_LAYER ≠ ACCESS_CONTROL · READ_ONLY · NO_SOURCE_MUTATION", "ACCESSIBILITY_LAYER ≠ ACCESS_CONTROL · FOCUS_CONTINUITY ≠ REVIEW_PROGRESS · LIVE_ANNOUNCEMENT ≠ REVIEW_OUTCOME · RESTORED_FOCUS ≠ SOURCE_MUTATION · ANNOUNCED_CONTEXT ≠ CONTEXT_VERIFICATION · KEYBOARD_FOCUS ≠ REVIEW_PRIORITY · READ_ONLY · NO_SOURCE_MUTATION")
entry=entry.replace("  const REVIEW_V108_COMPAT='DATA ROOM · REVIEW WORKSPACE V108 · Circuito de revisión, con foco accesible y navegación por teclado';", "  const REVIEW_V108_COMPAT='DATA ROOM · REVIEW WORKSPACE V108 · Circuito de revisión, con foco accesible y navegación por teclado';\n  const REVIEW_V109_COMPAT='DATA ROOM · REVIEW WORKSPACE V109 · Circuito de revisión, con continuidad de foco y contexto anunciado';")

anchor="""  function openGuidedReview(){
    const entry=reviewGuidedEntry();
    if(!entry.allowed||typeof window.go!=='function')return false;
    window.go(entry.view);
    focusReviewWorkspace({scroll:true});
    return true;
  }
"""
replacement=anchor+"""  function focusReviewStage(stage){
    if(typeof document==='undefined'||!REVIEW_STAGE_ORDER.includes(stage))return false;
    const target=document.querySelector?.(`[data-review-context-stage="${stage}"]`);
    if(!target||target.disabled)return false;
    target.focus?.({preventScroll:true});
    return true;
  }
  function reviewLiveContext(x){
    if(!x)return '';
    const stage=x.stage&&x.stage!=='ALL'?(x.stageLabel||x.stage):'Todas las etapas';
    const resolution=x.resolved? 'contexto resuelto' : `contexto con ${x.issueCount||0} selector(es) no resuelto(s)`;
    return `Contexto de revisión: ${stage}; ${resolution}; ${x.visibleChains||0} circuito(s) visible(s).`;
  }
"""
if anchor not in entry: raise SystemExit('open guided anchor missing')
entry=entry.replace(anchor,replacement,1)

old="""        humanGuide:reviewRoleStageGuide(currentRole(),focus.stage||'ALL'),
        integrity:REVIEW_CONTEXT_INTEGRITY
"""
new="""        humanGuide:reviewRoleStageGuide(currentRole(),focus.stage||'ALL'),
        liveText:reviewLiveContext({stage:focus.stage||'ALL',stageLabel:focus.stage==='ALL'?'Todas':REVIEW_STAGE_LABELS[focus.stage]||focus.stage||'—',resolved:context.resolved!==false,issueCount:context.issues?.length||0,visibleChains:visible.length}),
        integrity:REVIEW_CONTEXT_INTEGRITY
"""
if old not in entry: raise SystemExit('summary anchor missing')
entry=entry.replace(old,new,1)

old_html='<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><!-- ${REVIEW_V105_COMPAT} --><!-- ${REVIEW_V106_COMPAT} --><!-- ${REVIEW_V107_COMPAT} --><!-- ${REVIEW_V108_COMPAT} --><section data-review-context-summary class="review-context-summary" aria-label="Resumen de contexto de revisión"'
new_html='<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><!-- ${REVIEW_V105_COMPAT} --><!-- ${REVIEW_V106_COMPAT} --><!-- ${REVIEW_V107_COMPAT} --><!-- ${REVIEW_V108_COMPAT} --><!-- ${REVIEW_V109_COMPAT} --><section data-review-context-summary class="review-context-summary" aria-label="Resumen de contexto de revisión"'
if old_html not in entry: raise SystemExit('compat html anchor missing')
entry=entry.replace(old_html,new_html,1)

html_anchor="""background:${x.resolved?'#fff':'#fbfaf5'}\"><div style=\"display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px\">"""
html_replace="""background:${x.resolved?'#fff':'#fbfaf5'}\"><div data-review-context-live class=\"review-context-live\" role=\"status\" aria-live=\"polite\" aria-atomic=\"true\">${esc(x.liveText||'')}</div><div style=\"display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px\">"""
if html_anchor not in entry: raise SystemExit('live region insertion anchor missing')
entry=entry.replace(html_anchor,html_replace,1)

old_title="""    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V108').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con foco accesible, entrada guiada y contexto humano');
    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con foco accesible, entrada guiada y contexto humano</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con foco accesible, entrada guiada y contexto humano</h2>');
"""
new_title="""    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V109').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con continuidad de foco y contexto anunciado');
    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con continuidad de foco y contexto anunciado</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con continuidad de foco y contexto anunciado</h2>');
"""
if old_title not in entry: raise SystemExit('title anchor missing')
entry=entry.replace(old_title,new_title,1)

old_select="""      history.replaceState(null,'',`${u.pathname}${u.search}${u.hash||'#dataroom'}`);
      if(typeof render==='function')render();
      return true;
"""
new_select="""      history.replaceState(null,'',`${u.pathname}${u.search}${u.hash||'#dataroom'}`);
      if(typeof render==='function')render();
      if(typeof queueMicrotask==='function')queueMicrotask(()=>focusReviewStage(stage));
      return true;
"""
if old_select not in entry: raise SystemExit('select stage anchor missing')
entry=entry.replace(old_select,new_select,1)

old_click="""      const sourceReturn=e.target.closest?.('[data-review-source-return]');
      if(sourceReturn){queueMicrotask(()=>focusReviewWorkspace({scroll:false}));return}
      const copy=e.target.closest?.('[data-review-context-copy]');
"""
new_click="""      const sourceReturn=e.target.closest?.('[data-review-source-return]');
      if(sourceReturn){queueMicrotask(()=>focusReviewWorkspace({scroll:false}));return}
      const railStage=e.target.closest?.('[data-review-workspace-stage]');
      if(railStage){const stage=railStage.dataset.reviewWorkspaceStage||'';queueMicrotask(()=>focusReviewStage(stage));return}
      const inspectorClose=e.target.closest?.('[data-review-workspace-inspector-close]');
      if(inspectorClose){queueMicrotask(()=>focusReviewWorkspace({scroll:false}));return}
      const copy=e.target.closest?.('[data-review-context-copy]');
"""
if old_click not in entry: raise SystemExit('click continuity anchor missing')
entry=entry.replace(old_click,new_click,1)

old_export="""guidedEntry:reviewGuidedEntry,openGuidedReview,focusWorkspace:focusReviewWorkspace,integrity:REVIEW_CONTEXT_INTEGRITY"""
new_export="""guidedEntry:reviewGuidedEntry,openGuidedReview,focusWorkspace:focusReviewWorkspace,focusStage:focusReviewStage,liveContext:reviewLiveContext,integrity:REVIEW_CONTEXT_INTEGRITY"""
if old_export not in entry: raise SystemExit('export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V109 · Focus continuity & live context */' not in css:
    css += """

/* V109 · Focus continuity & live context */
.review-context-live{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.review-context-summary{position:relative}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V109 focus continuity/live context patch applied')
