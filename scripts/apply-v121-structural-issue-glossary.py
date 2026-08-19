from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if 'REVIEW_V121_COMPAT' in entry:
    print('V121 structural issue glossary patch already applied')
    raise SystemExit(0)

old_integrity='DISCLOSURE_OPEN ≠ PERSISTED_STATE · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='DISCLOSURE_OPEN ≠ PERSISTED_STATE · ISSUE_DESCRIPTION ≠ SEVERITY · STRUCTURAL_CODE ≠ DOCUMENT_FINDING · GLOSSARY_MEANING ≠ REMEDIATION_INSTRUCTION · UNKNOWN_CODE ≠ REVIEW_FAILURE · ISSUE_GLOSSARY ≠ EVIDENCE_ASSESSMENT · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V121 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V120_COMPAT='DATA ROOM · REVIEW WORKSPACE V120 · Circuito de revisión, con índice navegable de diagnósticos estructurales';"
new_compat=old_compat+"\n  const REVIEW_V121_COMPAT='DATA ROOM · REVIEW WORKSPACE V121 · Circuito de revisión, con glosario neutral de códigos estructurales';"
if old_compat not in entry: raise SystemExit('V121 compat anchor missing')
entry=entry.replace(old_compat,new_compat,1)

anchor="  function reviewStructuralDiagnosticsHtml(source){\n"
insert="""  const REVIEW_STRUCTURAL_ISSUE_MEANINGS=Object.freeze({
    CASE_NOT_OBJECT:'El elemento recibido no tiene forma de objeto de caso utilizable por esta proyección.',
    CASE_ID_INVALID:'El caso no expone un id de texto no vacío requerido para la forma mínima del workspace.',
    EVENTS_NOT_ARRAY:'La propiedad events no es un arreglo, por lo que el timeline no puede proyectarse de forma segura.',
    MISSING_INTERNAL_REFERENCES_NOT_ARRAY:'semantics.missingInternalReferences existe pero no tiene forma de arreglo.',
    CLOSURES_NOT_ARRAY:'La propiedad closures existe pero no tiene forma de arreglo.'
  });
  function reviewStructuralIssueGlossary(source){
    const diagnostic=reviewStructuralDiagnostics(source),seen=new Set(),entries=[];
    diagnostic.cases.flatMap(item=>item.issues||[]).forEach(code=>{const key=String(code||'');if(!key||seen.has(key))return;seen.add(key);entries.push({code:key,meaning:REVIEW_STRUCTURAL_ISSUE_MEANINGS[key]||'Código estructural no reconocido por este glosario; conserva significado técnico local y no implica fallo de revisión.'})});
    return {stage:diagnostic.stage,entries,integrity:'ISSUE_DESCRIPTION ≠ SEVERITY · STRUCTURAL_CODE ≠ DOCUMENT_FINDING · GLOSSARY_MEANING ≠ REMEDIATION_INSTRUCTION · UNKNOWN_CODE ≠ REVIEW_FAILURE · ISSUE_GLOSSARY ≠ EVIDENCE_ASSESSMENT'};
  }
  function reviewStructuralIssueGlossaryHtml(source){
    const glossary=reviewStructuralIssueGlossary(source);
    if(!glossary.entries.length)return '';
    return `<details data-review-structural-issue-glossary="${esc(glossary.stage)}" class="review-structural-issue-glossary"><summary>Qué significan estos códigos</summary><div class="review-structural-issue-glossary-body">${glossary.entries.map(item=>`<div class="review-structural-issue-glossary-item"><code>${esc(item.code)}</code><span>${esc(item.meaning)}</span></div>`).join('')}<div class="section-note">${esc(glossary.integrity)} · DISCLOSURE_STATE ≠ PERSISTED_STATE</div></div></details>`;
  }
"""
if anchor not in entry: raise SystemExit('V121 structural diagnostics anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

old_body="${diagnostic.cases.map(item=>`<div class=\"review-structural-diagnostic-case\" data-review-structural-case-index=\"${item.index}\"><div><strong>Caso #${item.index+1}</strong><small>${item.id?`ID · ${esc(item.id)}`:'ID no utilizable en la proyección'}</small></div><div class=\"review-structural-issue-list\">${item.issues.map(issue=>`<code>${esc(issue)}</code>`).join('')}</div></div>`).join('')}<div class=\"section-note\">${esc(diagnostic.integrity)} · DIAGNOSTIC_DISCLOSURE ≠ PERSISTED_STATE</div>"
new_body="${diagnostic.cases.map(item=>`<div class=\"review-structural-diagnostic-case\" data-review-structural-case-index=\"${item.index}\"><div><strong>Caso #${item.index+1}</strong><small>${item.id?`ID · ${esc(item.id)}`:'ID no utilizable en la proyección'}</small></div><div class=\"review-structural-issue-list\">${item.issues.map(issue=>`<code>${esc(issue)}</code>`).join('')}</div></div>`).join('')}${reviewStructuralIssueGlossaryHtml(source)}<div class=\"section-note\">${esc(diagnostic.integrity)} · DIAGNOSTIC_DISCLOSURE ≠ PERSISTED_STATE</div>"
if old_body not in entry: raise SystemExit('V121 diagnostic body anchor missing')
entry=entry.replace(old_body,new_body,1)

old_compat_chain='<!-- ${REVIEW_V118_COMPAT} --><!-- ${REVIEW_V119_COMPAT} --><!-- ${REVIEW_V120_COMPAT} --><section data-review-context-summary'
new_compat_chain='<!-- ${REVIEW_V118_COMPAT} --><!-- ${REVIEW_V119_COMPAT} --><!-- ${REVIEW_V120_COMPAT} --><!-- ${REVIEW_V121_COMPAT} --><section data-review-context-summary'
if old_compat_chain not in entry: raise SystemExit('V121 compat html anchor missing')
entry=entry.replace(old_compat_chain,new_compat_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V120').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con índice de diagnósticos estructurales');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con índice de diagnósticos estructurales</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con índice de diagnósticos estructurales</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V121').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con glosario de códigos estructurales');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con glosario de códigos estructurales</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con glosario de códigos estructurales</h2>');"
if old_title not in entry: raise SystemExit('V121 title anchor missing')
entry=entry.replace(old_title,new_title,1)

old_export='structuralDiagnosticsIndex:reviewStructuralDiagnosticsIndex,focusStructuralDiagnostics:focusReviewStructuralDiagnostics,integrity:REVIEW_CONTEXT_INTEGRITY'
new_export='structuralDiagnosticsIndex:reviewStructuralDiagnosticsIndex,focusStructuralDiagnostics:focusReviewStructuralDiagnostics,structuralIssueGlossary:reviewStructuralIssueGlossary,integrity:REVIEW_CONTEXT_INTEGRITY'
if old_export not in entry: raise SystemExit('V121 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V121 · Structural issue glossary */' not in css:
    css += """

/* V121 · Structural issue glossary */
.review-structural-issue-glossary{margin-top:7px;border-top:1px dashed var(--line);padding-top:6px}.review-structural-issue-glossary>summary{cursor:pointer;font-size:7px;font-weight:800;color:var(--ink2)}.review-structural-issue-glossary-body{display:grid;gap:6px;padding-top:7px}.review-structural-issue-glossary-item{display:grid;grid-template-columns:minmax(120px,.65fr) minmax(0,1.35fr);gap:8px;align-items:start;font-size:7px}.review-structural-issue-glossary-item span{color:var(--muted);line-height:1.45}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V121 structural issue glossary patch applied')
