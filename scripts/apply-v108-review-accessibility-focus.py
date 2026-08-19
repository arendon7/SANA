from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

entry=entry.replace("GUIDED_ENTRY ≠ ACCESS_GRANT · ENTRY_ROUTE ≠ REVIEW_PRIORITY · WORKSPACE_ENTRY ≠ REVIEW_DECISION · ENTRY_SCROLL ≠ SOURCE_MUTATION · ENTRY_CONTEXT_PRESERVED ≠ CONTEXT_VERIFICATION · READ_ONLY · NO_SOURCE_MUTATION", "GUIDED_ENTRY ≠ ACCESS_GRANT · ENTRY_ROUTE ≠ REVIEW_PRIORITY · WORKSPACE_ENTRY ≠ REVIEW_DECISION · ENTRY_SCROLL ≠ SOURCE_MUTATION · ENTRY_CONTEXT_PRESERVED ≠ CONTEXT_VERIFICATION · FOCUS_TARGET ≠ REVIEW_PRIORITY · KEYBOARD_NAVIGATION ≠ REVIEW_PROGRESS · ARIA_STATE ≠ REVIEW_OUTCOME · FOCUS_RETURN ≠ SOURCE_MUTATION · ACCESSIBILITY_LAYER ≠ ACCESS_CONTROL · READ_ONLY · NO_SOURCE_MUTATION")
entry=entry.replace("  const REVIEW_V106_COMPAT='DATA ROOM · REVIEW WORKSPACE V106 · Circuito de revisión, con guía humana por rol y etapa';", "  const REVIEW_V106_COMPAT='DATA ROOM · REVIEW WORKSPACE V106 · Circuito de revisión, con guía humana por rol y etapa';\n  const REVIEW_V107_COMPAT='DATA ROOM · REVIEW WORKSPACE V107 · Circuito de revisión, con entrada guiada y contexto humano';\n  const REVIEW_V108_COMPAT='DATA ROOM · REVIEW WORKSPACE V108 · Circuito de revisión, con foco accesible y navegación por teclado';")
old_open="""  function openGuidedReview(){
    const entry=reviewGuidedEntry();
    if(!entry.allowed||typeof window.go!=='function')return false;
    window.go(entry.view);
    if(typeof document!=='undefined')document.getElementById?.(entry.target)?.scrollIntoView?.({behavior:'smooth',block:'start'});
    return true;
  }
"""
new_open="""  function focusReviewWorkspace({scroll=true}={}){
    if(typeof document==='undefined')return false;
    const target=document.getElementById?.('review-workspace');
    if(!target)return false;
    if(scroll)target.scrollIntoView?.({behavior:'smooth',block:'start'});
    target.focus?.({preventScroll:true});
    return true;
  }
  function openGuidedReview(){
    const entry=reviewGuidedEntry();
    if(!entry.allowed||typeof window.go!=='function')return false;
    window.go(entry.view);
    focusReviewWorkspace({scroll:true});
    return true;
  }
"""
if old_open not in entry: raise SystemExit('openGuidedReview anchor missing')
entry=entry.replace(old_open,new_open)
old_switch="""  function reviewStageSwitcherHtml(nav){
    if(!nav)return '';
    const button=item=>{
      const disabled=!item.navigable||item.active,border=item.active?'var(--teal)':item.navigable?'#cfe0dd':'var(--line)',background=item.active?'#e9f4f1':item.navigable?'#f7fbfa':'#f7f8f5',color=item.active?'var(--teal)':item.navigable?'var(--ink2)':'var(--muted)';
      return `<button type=\"button\" data-review-context-stage=\"${esc(item.stage)}\" ${disabled?'disabled':''} aria-pressed=\"${item.active?'true':'false'}\" title=\"${esc(item.state)}\" style=\"display:grid;gap:2px;min-width:104px;padding:7px 8px;border:1px solid ${border};border-radius:9px;background:${background};color:${color};font:inherit;text-align:left;cursor:${disabled?'default':'pointer'};opacity:${disabled&&!item.active?'.72':'1'}\"><strong style=\"font-size:8px\">${esc(item.label)}</strong><small style=\"font-size:6px;color:inherit\">${esc(item.active?'ACTIVA':item.state)}</small></button>`;
    };
    return `<div data-review-stage-switcher style=\"margin-top:9px;padding-top:9px;border-top:1px solid var(--line)\"><div style=\"display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px\"><strong style=\"font-size:8px\">NAVEGACIÓN DE ETAPAS · URL ONLY</strong><small style=\"font-size:6px;color:var(--muted)\">${nav.contextReady?'Circuito seleccionado':'Selecciona capital case + lote'}</small></div><div style=\"display:flex;gap:6px;overflow-x:auto;padding-bottom:2px\">${nav.items.map(button).join('')}</div><div style=\"margin-top:6px;font-size:6px;color:var(--muted)\">STAGE_ORDER ≠ REQUIRED_SEQUENCE · NAVIGABLE_STAGE ≠ COMPLETE_STAGE · DISABLED_STAGE ≠ REVIEW_FAILURE</div></div>`;
  }
"""
new_switch="""  function reviewStageSwitcherHtml(nav){
    if(!nav)return '';
    const firstNavigable=nav.items.findIndex(item=>item.navigable),hasActive=nav.items.some(item=>item.active&&item.navigable);
    const button=(item,index)=>{
      const disabled=!item.navigable,border=item.active?'var(--teal)':item.navigable?'#cfe0dd':'var(--line)',background=item.active?'#e9f4f1':item.navigable?'#f7fbfa':'#f7f8f5',color=item.active?'var(--teal)':item.navigable?'var(--ink2)':'var(--muted)',tabIndex=item.navigable&&(item.active||(!hasActive&&index===firstNavigable))?0:-1;
      return `<button type=\"button\" data-review-context-stage=\"${esc(item.stage)}\" ${disabled?'disabled aria-disabled=\"true\"':'aria-disabled=\"false\"'} aria-pressed=\"${item.active?'true':'false'}\" aria-current=\"${item.active?'step':'false'}\" aria-label=\"${esc(item.label)} · ${esc(item.active?'ACTIVA':item.state)}\" tabindex=\"${tabIndex}\" title=\"${esc(item.state)}\" style=\"display:grid;gap:2px;min-width:104px;padding:7px 8px;border:1px solid ${border};border-radius:9px;background:${background};color:${color};font:inherit;text-align:left;cursor:${disabled?'default':'pointer'};opacity:${disabled?'.72':'1'}\"><strong style=\"font-size:8px\">${esc(item.label)}</strong><small style=\"font-size:6px;color:inherit\">${esc(item.active?'ACTIVA':item.state)}</small></button>`;
    };
    return `<div data-review-stage-switcher role=\"toolbar\" aria-label=\"Navegación de etapas del circuito de revisión\" aria-orientation=\"horizontal\" style=\"margin-top:9px;padding-top:9px;border-top:1px solid var(--line)\"><div style=\"display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px\"><strong style=\"font-size:8px\">NAVEGACIÓN DE ETAPAS · URL ONLY</strong><small style=\"font-size:6px;color:var(--muted)\">${nav.contextReady?'Circuito seleccionado · flechas/Home/End para mover foco':'Selecciona capital case + lote'}</small></div><div data-review-stage-roving style=\"display:flex;gap:6px;overflow-x:auto;padding-bottom:2px\">${nav.items.map(button).join('')}</div><div style=\"margin-top:6px;font-size:6px;color:var(--muted)\">STAGE_ORDER ≠ REQUIRED_SEQUENCE · NAVIGABLE_STAGE ≠ COMPLETE_STAGE · KEYBOARD_NAVIGATION ≠ REVIEW_PROGRESS</div></div>`;
  }
"""
if old_switch not in entry: raise SystemExit('stage switcher anchor missing')
entry=entry.replace(old_switch,new_switch)
entry=entry.replace("<!-- ${REVIEW_V106_COMPAT} -->", "<!-- ${REVIEW_V106_COMPAT} --><!-- ${REVIEW_V107_COMPAT} --><!-- ${REVIEW_V108_COMPAT} -->")
old_out="""    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V107').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con entrada guiada y contexto humano');
    return out;
"""
new_out="""    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V108').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con foco accesible, entrada guiada y contexto humano');
    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con foco accesible, entrada guiada y contexto humano</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con foco accesible, entrada guiada y contexto humano</h2>');
    return out;
"""
if old_out not in entry: raise SystemExit('inject output anchor missing')
entry=entry.replace(old_out,new_out)
old_listener="""  if(typeof document!=='undefined')document.addEventListener('click',e=>{
    const guided=e.target.closest?.('[data-review-guided-entry]');
    if(guided){openGuidedReview();return}
    const copy=e.target.closest?.('[data-review-context-copy]');
    if(copy){copyReviewContextPermalink().then(result=>{const status=document.querySelector?.('[data-review-context-copy-status]');if(status)status.textContent=result.copied?'Enlace copiado localmente':'Copia no disponible · enlace visible';});return}
    const stage=e.target.closest?.('[data-review-context-stage]');
    if(stage&&!stage.disabled)selectReviewStage(stage.dataset.reviewContextStage||'');
  });
"""
new_listener="""  if(typeof document!=='undefined'){
    document.addEventListener('click',e=>{
      const guided=e.target.closest?.('[data-review-guided-entry]');
      if(guided){openGuidedReview();return}
      const sourceReturn=e.target.closest?.('[data-review-source-return]');
      if(sourceReturn){queueMicrotask(()=>focusReviewWorkspace({scroll:false}));return}
      const copy=e.target.closest?.('[data-review-context-copy]');
      if(copy){copyReviewContextPermalink().then(result=>{const status=document.querySelector?.('[data-review-context-copy-status]');if(status)status.textContent=result.copied?'Enlace copiado localmente':'Copia no disponible · enlace visible';});return}
      const stage=e.target.closest?.('[data-review-context-stage]');
      if(stage&&!stage.disabled)selectReviewStage(stage.dataset.reviewContextStage||'');
    });
    document.addEventListener('keydown',e=>{
      const current=e.target.closest?.('[data-review-context-stage]'),toolbar=current?.closest?.('[data-review-stage-switcher]');
      if(!current||!toolbar||!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
      const buttons=[...toolbar.querySelectorAll('button[data-review-context-stage]:not([disabled])')];
      if(!buttons.length)return;
      const index=Math.max(0,buttons.indexOf(current));let next=index;
      if(e.key==='ArrowRight')next=(index+1)%buttons.length;
      else if(e.key==='ArrowLeft')next=(index-1+buttons.length)%buttons.length;
      else if(e.key==='Home')next=0;
      else if(e.key==='End')next=buttons.length-1;
      e.preventDefault();buttons.forEach((button,i)=>button.tabIndex=i===next?0:-1);buttons[next]?.focus?.();
    });
  }
"""
if old_listener not in entry: raise SystemExit('listener anchor missing')
entry=entry.replace(old_listener,new_listener)
entry=entry.replace("stageGuide:reviewRoleStageGuide,guidedEntry:reviewGuidedEntry,openGuidedReview,integrity:REVIEW_CONTEXT_INTEGRITY", "stageGuide:reviewRoleStageGuide,guidedEntry:reviewGuidedEntry,openGuidedReview,focusWorkspace:focusReviewWorkspace,integrity:REVIEW_CONTEXT_INTEGRITY")
css_append="""

/* V108 · Review accessibility & focus */
.review-workspace:focus{outline:none}.review-workspace:focus-visible{outline:3px solid rgba(42,123,115,.24);outline-offset:4px}.review-context-summary [data-review-context-stage]:focus-visible{outline:3px solid rgba(42,123,115,.24);outline-offset:2px}.review-context-summary [data-review-context-stage][aria-current=\"step\"]{box-shadow:0 0 0 2px rgba(42,123,115,.1)}@media(prefers-reduced-motion:reduce){.review-workspace,.review-context-summary [data-review-context-stage]{scroll-behavior:auto}}
"""
if '/* V108 · Review accessibility & focus */' not in css: css+=css_append
entry_path.write_text(entry)
css_path.write_text(css)
print('V108 accessibility/focus patch applied')
