from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
entry=entry_path.read_text()

if 'REVIEW_V115_COMPAT' in entry:
    print('V115 source-integrity return already applied')
    raise SystemExit(0)

old_integrity='TECHNICAL_DRILLDOWN ≠ REVIEW_PRIORITY · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='TECHNICAL_DRILLDOWN ≠ REVIEW_PRIORITY · SOURCE_INTEGRITY_RETURN ≠ REVIEW_STATE_CHANGE · RETURN_TARGET ≠ SOURCE_VERIFICATION · INTEGRITY_RETURN ≠ REMEDIATION · FOCUS_RETURN ≠ REVIEW_PRIORITY · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V115 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V114_COMPAT='DATA ROOM · REVIEW WORKSPACE V114 · Circuito de revisión, con drilldown técnico a paneles fuente';"
new_compat=old_compat+"\n  const REVIEW_V115_COMPAT='DATA ROOM · REVIEW WORKSPACE V115 · Circuito de revisión, con retorno técnico a integridad';"
if old_compat not in entry: raise SystemExit('V115 compat const anchor missing')
entry=entry.replace(old_compat,new_compat,1)

anchor="  function focusReviewSourceIntegrity(){"
insert="""  function decorateSourceIntegrityReturns(html,enabled=false){
    if(!enabled||!html||html.includes('data-review-source-integrity-return'))return html;
    const button='<button type="button" class="btn ghost" data-review-source-integrity-return aria-controls="review-workspace-source-integrity">Volver a integridad</button>';
    return html.replace(/(<button[^>]*data-review-source-return[^>]*>Volver al workspace<\\/button>)/g,`$1${button}`);
  }
"""
if anchor not in entry: raise SystemExit('V115 focus source integrity anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

old_source_section='<section data-review-source-integrity tabindex="-1" class="review-source-integrity" aria-label="Integridad técnica de fuentes">'
new_source_section='<section id="review-workspace-source-integrity" data-review-source-integrity tabindex="-1" class="review-source-integrity" aria-label="Integridad técnica de fuentes">'
if old_source_section not in entry: raise SystemExit('V115 source integrity id anchor missing')
entry=entry.replace(old_source_section,new_source_section,1)

old_compat_chain='<!-- ${REVIEW_V112_COMPAT} --><!-- ${REVIEW_V113_COMPAT} --><!-- ${REVIEW_V114_COMPAT} --><section data-review-context-summary'
new_compat_chain='<!-- ${REVIEW_V112_COMPAT} --><!-- ${REVIEW_V113_COMPAT} --><!-- ${REVIEW_V114_COMPAT} --><!-- ${REVIEW_V115_COMPAT} --><section data-review-context-summary'
if old_compat_chain not in entry: raise SystemExit('V115 compat html anchor missing')
entry=entry.replace(old_compat_chain,new_compat_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V114').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con drilldown técnico a paneles fuente');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con drilldown técnico a paneles fuente</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con drilldown técnico a paneles fuente</h2>');\n    return out;"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V115').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con retorno técnico a integridad');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con retorno técnico a integridad</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con retorno técnico a integridad</h2>');\n    out=decorateSourceIntegrityReturns(out,section.includes('data-review-source-integrity'));\n    return out;"
if old_title not in entry: raise SystemExit('V115 title/decorator anchor missing')
entry=entry.replace(old_title,new_title,1)

click_anchor="      const sourceReturn=e.target.closest?.('[data-review-source-return]');\n      if(sourceReturn){queueMicrotask(()=>focusReviewWorkspace({scroll:false}));return}"
click_repl="      const integrityReturn=e.target.closest?.('[data-review-source-integrity-return]');\n      if(integrityReturn){focusReviewSourceIntegrity();return}\n"+click_anchor
if click_anchor not in entry: raise SystemExit('V115 source return click anchor missing')
entry=entry.replace(click_anchor,click_repl,1)

old_export="sourcePanelNavigation:reviewSourcePanelNavigation,focusSourcePanel:focusReviewSourcePanel,recoverEmptyFilter:applyReviewFilterRecovery,focusSourceIntegrity:focusReviewSourceIntegrity,integrity:REVIEW_CONTEXT_INTEGRITY"
new_export="sourcePanelNavigation:reviewSourcePanelNavigation,focusSourcePanel:focusReviewSourcePanel,decorateSourceIntegrityReturns,recoverEmptyFilter:applyReviewFilterRecovery,focusSourceIntegrity:focusReviewSourceIntegrity,integrity:REVIEW_CONTEXT_INTEGRITY"
if old_export not in entry: raise SystemExit('V115 export anchor missing')
entry=entry.replace(old_export,new_export,1)

entry_path.write_text(entry)
print('V115 source-integrity return patch applied')
