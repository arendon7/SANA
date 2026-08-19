from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if 'REVIEW_V116_COMPAT' in entry:
    print('V116 review assistance disclosure already applied')
    raise SystemExit(0)

old_integrity='FOCUS_RETURN ≠ REVIEW_PRIORITY · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='FOCUS_RETURN ≠ REVIEW_PRIORITY · ASSISTANCE_DISCLOSURE ≠ REVIEW_PROGRESS · COLLAPSED_GUIDANCE ≠ HIDDEN_EVIDENCE · DISCLOSURE_STATE ≠ PERSISTED_STATE · GUIDANCE_VISIBILITY ≠ REVIEW_OUTCOME · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V116 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V115_COMPAT='DATA ROOM · REVIEW WORKSPACE V115 · Circuito de revisión, con retorno técnico a integridad';"
new_compat=old_compat+"\n  const REVIEW_V116_COMPAT='DATA ROOM · REVIEW WORKSPACE V116 · Circuito de revisión, con ayuda humana bajo divulgación progresiva';"
if old_compat not in entry: raise SystemExit('V116 compat const anchor missing')
entry=entry.replace(old_compat,new_compat,1)

anchor="  function reviewRoleLensHtml(lens){"
insert="""  function reviewAssistanceHtml(lens,guide){
    if(!lens&&!guide)return '';
    const roleLabel=lens?.label||'Lectura',stageLabel=guide?.stageLabel||'Todas';
    return `<details data-review-assistance class="review-assistance"><summary><span><strong>AYUDA DE REVISIÓN · ${esc(roleLabel)} · ${esc(stageLabel)}</strong><small>Lente por rol + preguntas humanas</small></span><span class="status">GUIDANCE ONLY</span></summary><div class="review-assistance-body">${reviewRoleLensHtml(lens)}${reviewHumanGuideHtml(guide)}<div class="section-note">ASSISTANCE_DISCLOSURE ≠ REVIEW_PROGRESS · COLLAPSED_GUIDANCE ≠ HIDDEN_EVIDENCE · DISCLOSURE_STATE ≠ PERSISTED_STATE · GUIDANCE_VISIBILITY ≠ REVIEW_OUTCOME</div></div></details>`;
  }
"""
if anchor not in entry: raise SystemExit('V116 role lens anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

old_call="${reviewEmptyGuidanceHtml(x.emptyGuidance)}${reviewRoleLensHtml(x.roleLens)}${reviewHumanGuideHtml(x.humanGuide)}${reviewStageSwitcherHtml(x.stageNavigation)}"
new_call="${reviewEmptyGuidanceHtml(x.emptyGuidance)}${reviewAssistanceHtml(x.roleLens,x.humanGuide)}${reviewStageSwitcherHtml(x.stageNavigation)}"
if old_call not in entry: raise SystemExit('V116 assistance call anchor missing')
entry=entry.replace(old_call,new_call,1)

old_compat_chain='<!-- ${REVIEW_V113_COMPAT} --><!-- ${REVIEW_V114_COMPAT} --><!-- ${REVIEW_V115_COMPAT} --><section data-review-context-summary'
new_compat_chain='<!-- ${REVIEW_V113_COMPAT} --><!-- ${REVIEW_V114_COMPAT} --><!-- ${REVIEW_V115_COMPAT} --><!-- ${REVIEW_V116_COMPAT} --><section data-review-context-summary'
if old_compat_chain not in entry: raise SystemExit('V116 compat html anchor missing')
entry=entry.replace(old_compat_chain,new_compat_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V115').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con retorno técnico a integridad');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con retorno técnico a integridad</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con retorno técnico a integridad</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V116').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con ayuda humana bajo divulgación progresiva');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con ayuda humana bajo divulgación progresiva</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con ayuda humana bajo divulgación progresiva</h2>');"
if old_title not in entry: raise SystemExit('V116 title anchor missing')
entry=entry.replace(old_title,new_title,1)

old_export="decorateSourceIntegrityReturns,recoverEmptyFilter:applyReviewFilterRecovery,focusSourceIntegrity:focusReviewSourceIntegrity,integrity:REVIEW_CONTEXT_INTEGRITY"
new_export="decorateSourceIntegrityReturns,assistanceHtml:reviewAssistanceHtml,recoverEmptyFilter:applyReviewFilterRecovery,focusSourceIntegrity:focusReviewSourceIntegrity,integrity:REVIEW_CONTEXT_INTEGRITY"
if old_export not in entry: raise SystemExit('V116 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V116 · Reviewer assistance disclosure */' not in css:
    css += """

/* V116 · Reviewer assistance disclosure */
.review-assistance{margin-top:9px;border:1px solid var(--line);border-radius:10px;background:#fbfcfa;overflow:hidden}.review-assistance>summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;cursor:pointer;list-style-position:inside}.review-assistance>summary span:first-child{display:grid;gap:2px}.review-assistance>summary strong{font-size:8px}.review-assistance>summary small{font-size:6px;color:var(--muted)}.review-assistance>summary:focus-visible{outline:3px solid rgba(42,123,115,.22);outline-offset:-3px}.review-assistance[open]>summary{border-bottom:1px solid var(--line);background:#fff}.review-assistance-body{padding:0 10px 10px}.review-assistance-body>[data-review-role-lens],.review-assistance-body>[data-review-human-guide]{margin-top:10px}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V116 review assistance disclosure patch applied')
