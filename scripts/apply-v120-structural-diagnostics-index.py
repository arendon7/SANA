from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if 'REVIEW_V120_COMPAT' in entry:
    print('V120 structural diagnostics index patch already applied')
    raise SystemExit(0)

old_integrity='DIAGNOSTIC_PROJECTION ≠ RAW_PAYLOAD · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='DIAGNOSTIC_PROJECTION ≠ RAW_PAYLOAD · STRUCTURAL_INDEX ≠ CASE_IDENTITY · INVALID_COUNT ≠ SEVERITY · DIAGNOSTIC_FOCUS ≠ REVIEW_FINDING · DIAGNOSTIC_NAVIGATION ≠ REMEDIATION · DISCLOSURE_OPEN ≠ PERSISTED_STATE · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V120 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V119_COMPAT='DATA ROOM · REVIEW WORKSPACE V119 · Circuito de revisión, con diagnóstico estructural data-minimized';"
new_compat=old_compat+"\n  const REVIEW_V120_COMPAT='DATA ROOM · REVIEW WORKSPACE V120 · Circuito de revisión, con índice navegable de diagnósticos estructurales';"
if old_compat not in entry: raise SystemExit('V120 compat anchor missing')
entry=entry.replace(old_compat,new_compat,1)

anchor="  function reviewStructuralDiagnosticsHtml(source){\n"
insert="""  function reviewStructuralDiagnosticsIndex(integrity){
    const sources=Array.isArray(integrity?.sources)?integrity.sources:[];
    const items=sources.filter(source=>Number(source?.invalidCaseCount||0)>0).map(source=>({stage:String(source.stage||''),label:String(source.label||source.stage||''),count:Number(source.invalidCaseCount||0),target:`review-structural-diagnostics-${String(source.stage||'').toLowerCase()}`}));
    return {items,totalInvalid:items.reduce((n,item)=>n+item.count,0),integrity:'STRUCTURAL_INDEX ≠ CASE_IDENTITY · INVALID_COUNT ≠ SEVERITY · DIAGNOSTIC_NAVIGATION ≠ REMEDIATION'};
  }
  function reviewStructuralDiagnosticsIndexHtml(index){
    if(!index?.items?.length)return '';
    return `<div data-review-structural-index class="review-structural-index" aria-label="Índice de diagnósticos estructurales"><div><strong>DIAGNÓSTICOS ESTRUCTURALES · ÍNDICE</strong><small>${index.totalInvalid} caso(s) estructuralmente inválido(s) · conteo descriptivo</small></div><div class="review-structural-index-actions">${index.items.map(item=>`<button type="button" class="btn ghost" data-review-structural-index-nav="${esc(item.stage)}" aria-controls="${esc(item.target)}">${esc(item.label)} · ${item.count}</button>`).join('')}</div><div class="section-note">${esc(index.integrity)} · DIAGNOSTIC_FOCUS ≠ REVIEW_FINDING</div></div>`;
  }
  function focusReviewStructuralDiagnostics(stage){
    if(typeof document==='undefined'||!REVIEW_STAGE_ORDER.includes(stage))return false;
    const details=document.querySelector?.(`[data-review-structural-diagnostics="${stage}"]`);
    if(!details)return false;
    details.open=true;
    details.scrollIntoView?.({block:'nearest',behavior:'smooth'});
    const summary=details.querySelector?.('summary');
    summary?.focus?.({preventScroll:true});
    return true;
  }
"""
if anchor not in entry: raise SystemExit('V120 diagnostics html anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

old_details='return `<details data-review-structural-diagnostics="${esc(diagnostic.stage)}" class="review-structural-diagnostics">'
new_details='return `<details id="review-structural-diagnostics-${esc(String(diagnostic.stage||\'\').toLowerCase())}" data-review-structural-diagnostics="${esc(diagnostic.stage)}" class="review-structural-diagnostics">'
if old_details not in entry: raise SystemExit('V120 details anchor missing')
entry=entry.replace(old_details,new_details,1)

old_integrity_html='${reviewSourceIntegrityOverviewHtml(reviewSourceIntegrityOverview(integrity))}${reviewTechnicalStateGlossaryHtml(reviewTechnicalStateGlossary())}<div class="review-source-integrity-grid">'
new_integrity_html='${reviewSourceIntegrityOverviewHtml(reviewSourceIntegrityOverview(integrity))}${reviewStructuralDiagnosticsIndexHtml(reviewStructuralDiagnosticsIndex(integrity))}${reviewTechnicalStateGlossaryHtml(reviewTechnicalStateGlossary())}<div class="review-source-integrity-grid">'
if old_integrity_html not in entry: raise SystemExit('V120 integrity html anchor missing')
entry=entry.replace(old_integrity_html,new_integrity_html,1)

old_compat_chain='<!-- ${REVIEW_V117_COMPAT} --><!-- ${REVIEW_V118_COMPAT} --><!-- ${REVIEW_V119_COMPAT} --><section data-review-context-summary'
new_compat_chain='<!-- ${REVIEW_V117_COMPAT} --><!-- ${REVIEW_V118_COMPAT} --><!-- ${REVIEW_V119_COMPAT} --><!-- ${REVIEW_V120_COMPAT} --><section data-review-context-summary'
if old_compat_chain not in entry: raise SystemExit('V120 compat html anchor missing')
entry=entry.replace(old_compat_chain,new_compat_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V119').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con diagnóstico estructural data-minimized');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con diagnóstico estructural data-minimized</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con diagnóstico estructural data-minimized</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V120').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con índice de diagnósticos estructurales');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con índice de diagnósticos estructurales</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con índice de diagnósticos estructurales</h2>');"
if old_title not in entry: raise SystemExit('V120 title anchor missing')
entry=entry.replace(old_title,new_title,1)

click_anchor="      const sourcePanel=e.target.closest?.('[data-review-source-panel-nav]');\n      if(sourcePanel){focusReviewSourcePanel(sourcePanel.dataset.reviewSourcePanelNav||'');return}"
click_repl="      const structuralIndex=e.target.closest?.('[data-review-structural-index-nav]');\n      if(structuralIndex){focusReviewStructuralDiagnostics(structuralIndex.dataset.reviewStructuralIndexNav||'');return}\n"+click_anchor
if click_anchor not in entry: raise SystemExit('V120 click anchor missing')
entry=entry.replace(click_anchor,click_repl,1)

old_export='sourceOverview:reviewSourceIntegrityOverview,structuralDiagnostics:reviewStructuralDiagnostics,integrity:REVIEW_CONTEXT_INTEGRITY'
new_export='sourceOverview:reviewSourceIntegrityOverview,structuralDiagnostics:reviewStructuralDiagnostics,structuralDiagnosticsIndex:reviewStructuralDiagnosticsIndex,focusStructuralDiagnostics:focusReviewStructuralDiagnostics,integrity:REVIEW_CONTEXT_INTEGRITY'
if old_export not in entry: raise SystemExit('V120 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V120 · Structural diagnostics index */' not in css:
    css += """

/* V120 · Structural diagnostics index */
.review-structural-index{display:grid;gap:7px;margin:9px 0;padding:9px;border:1px solid var(--line);border-radius:10px;background:#fbfcfa}.review-structural-index>div:first-child{display:grid;gap:2px}.review-structural-index small{font-size:6px;color:var(--muted)}.review-structural-index-actions{display:flex;gap:6px;flex-wrap:wrap}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V120 structural diagnostics index patch applied')
