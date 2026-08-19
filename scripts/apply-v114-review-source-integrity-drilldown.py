from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if 'REVIEW_V114_COMPAT' in entry:
    print('V114 source-integrity drilldown already applied')
    raise SystemExit(0)

old_integrity='SOURCE_NAVIGATION ≠ REVIEW_PRIORITY · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='SOURCE_NAVIGATION ≠ REVIEW_PRIORITY · SOURCE_STAGE_NAVIGATION ≠ SOURCE_VERIFICATION · PANEL_TARGET ≠ API_AVAILABLE · TECHNICAL_DRILLDOWN ≠ REVIEW_PRIORITY · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V114 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V113_COMPAT='DATA ROOM · REVIEW WORKSPACE V113 · Circuito de revisión, con guía de estados vacíos y navegación técnica';"
new_compat=old_compat+"\n  const REVIEW_V114_COMPAT='DATA ROOM · REVIEW WORKSPACE V114 · Circuito de revisión, con drilldown técnico a paneles fuente';"
if old_compat not in entry: raise SystemExit('V114 compat const anchor missing')
entry=entry.replace(old_compat,new_compat,1)

anchor="  function focusReviewSourceIntegrity(){"
insert="""  function reviewSourcePanelNavigation(stage){
    const api=window.__SANA_DATAROOM_REVIEW_WORKSPACE__,target=api?.sourcePanelTarget?.(stage)||'';
    return {stage:String(stage||''),target,navigable:!!target,integrity:'SOURCE_STAGE_NAVIGATION ≠ SOURCE_VERIFICATION · PANEL_TARGET ≠ API_AVAILABLE'};
  }
  function focusReviewSourcePanel(stage){
    if(typeof document==='undefined')return false;
    const nav=reviewSourcePanelNavigation(stage);if(!nav.navigable)return false;
    const target=document.getElementById?.(nav.target);if(!target)return false;
    target.scrollIntoView?.({block:'start',behavior:'smooth'});
    target.focus?.({preventScroll:true});
    return true;
  }
"""
if anchor not in entry: raise SystemExit('V114 source integrity focus anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

old_html="${integrity.sources.map(source=>`<div class=\"review-source-integrity-item\" data-review-source-stage=\"${esc(source.stage)}\"><strong>${esc(source.label||source.stage)}</strong><span>API · ${esc(source.state)}</span><span>Schema · ${esc(source.schemaState)}</span><span>Payload · ${esc(source.payloadState)}</span><span>Casos · ${source.validCaseCount}/${source.caseCount} válidos · ${source.invalidCaseCount} inválidos</span></div>`).join('')}"
new_html="${integrity.sources.map(source=>{const nav=reviewSourcePanelNavigation(source.stage);return `<div class=\"review-source-integrity-item\" data-review-source-stage=\"${esc(source.stage)}\"><strong>${esc(source.label||source.stage)}</strong><span>API · ${esc(source.state)}</span><span>Schema · ${esc(source.schemaState)}</span><span>Payload · ${esc(source.payloadState)}</span><span>Casos · ${source.validCaseCount}/${source.caseCount} válidos · ${source.invalidCaseCount} inválidos</span>${nav.navigable?`<button type=\"button\" class=\"btn ghost\" data-review-source-panel-nav=\"${esc(source.stage)}\" aria-controls=\"${esc(nav.target)}\">Ir al panel fuente</button>`:''}</div>`}).join('')}"
if old_html not in entry: raise SystemExit('V114 source integrity item anchor missing')
entry=entry.replace(old_html,new_html,1)

old_compat_chain='<!-- ${REVIEW_V111_COMPAT} --><!-- ${REVIEW_V112_COMPAT} --><!-- ${REVIEW_V113_COMPAT} --><section data-review-context-summary'
new_compat_chain='<!-- ${REVIEW_V111_COMPAT} --><!-- ${REVIEW_V112_COMPAT} --><!-- ${REVIEW_V113_COMPAT} --><!-- ${REVIEW_V114_COMPAT} --><section data-review-context-summary'
if old_compat_chain not in entry: raise SystemExit('V114 compat html anchor missing')
entry=entry.replace(old_compat_chain,new_compat_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V113').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con guía de estados vacíos y navegación técnica');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con guía de estados vacíos y navegación técnica</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con guía de estados vacíos y navegación técnica</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V114').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con drilldown técnico a paneles fuente');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con drilldown técnico a paneles fuente</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con drilldown técnico a paneles fuente</h2>');"
if old_title not in entry: raise SystemExit('V114 title anchor missing')
entry=entry.replace(old_title,new_title,1)

click_anchor="      const emptySource=e.target.closest?.('[data-review-empty-source-nav]');\n      if(emptySource){focusReviewSourceIntegrity();return}"
click_repl="      const sourcePanel=e.target.closest?.('[data-review-source-panel-nav]');\n      if(sourcePanel){focusReviewSourcePanel(sourcePanel.dataset.reviewSourcePanelNav||'');return}\n"+click_anchor
if click_anchor not in entry: raise SystemExit('V114 click anchor missing')
entry=entry.replace(click_anchor,click_repl,1)

old_export="emptyGuidance:reviewEmptyGuidance,sourceIntegrity:reviewSourceIntegrity,recoverEmptyFilter:applyReviewFilterRecovery,focusSourceIntegrity:focusReviewSourceIntegrity,integrity:REVIEW_CONTEXT_INTEGRITY"
new_export="emptyGuidance:reviewEmptyGuidance,sourceIntegrity:reviewSourceIntegrity,sourcePanelNavigation:reviewSourcePanelNavigation,focusSourcePanel:focusReviewSourcePanel,recoverEmptyFilter:applyReviewFilterRecovery,focusSourceIntegrity:focusReviewSourceIntegrity,integrity:REVIEW_CONTEXT_INTEGRITY"
if old_export not in entry: raise SystemExit('V114 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V114 · Source integrity drilldown */' not in css:
    css += """

/* V114 · Source integrity drilldown */
.review-source-integrity-item>.btn{margin-top:5px;justify-self:start}.review-source-integrity-item>.btn:focus-visible{outline:3px solid rgba(42,123,115,.22);outline-offset:2px}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V114 source-integrity drilldown patch applied')
