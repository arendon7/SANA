from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if 'REVIEW_V117_COMPAT' in entry:
    print('V117 technical glossary patch already applied')
    raise SystemExit(0)

old_integrity='GUIDANCE_VISIBILITY ≠ REVIEW_OUTCOME · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='GUIDANCE_VISIBILITY ≠ REVIEW_OUTCOME · TECHNICAL_LABEL ≠ SEVERITY · GLOSSARY_ENTRY ≠ REVIEW_FINDING · STATE_DESCRIPTION ≠ REMEDIATION_INSTRUCTION · GLOSSARY_DISCLOSURE ≠ PERSISTED_STATE · STRUCTURAL_VALIDITY ≠ DOCUMENT_VERIFICATION · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V117 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V116_COMPAT='DATA ROOM · REVIEW WORKSPACE V116 · Circuito de revisión, con ayuda humana bajo divulgación progresiva';"
new_compat=old_compat+"\n  const REVIEW_V117_COMPAT='DATA ROOM · REVIEW WORKSPACE V117 · Circuito de revisión, con glosario neutral de estados técnicos';"
if old_compat not in entry: raise SystemExit('V117 compat anchor missing')
entry=entry.replace(old_compat,new_compat,1)

anchor='  function reviewSourceIntegrityHtml(integrity){'
insert="""  function reviewTechnicalStateGlossary(){
    return {groups:[
      {label:'API',items:[['AVAILABLE','La interfaz fuente está expuesta y pudo consultarse. No verifica el contenido documental.'],['UNAVAILABLE','La interfaz fuente no está disponible para esta proyección. No significa ausencia de evidencia.'],['READ_ERROR','La lectura técnica no pudo completarse. No equivale a fuente vacía ni a fallo de revisión.']]},
      {label:'Schema',items:[['MATCH','El identificador de schema coincide con el contrato esperado por el workspace. No certifica la fuente.'],['MISSING','La fuente no expone un schema utilizable por esta proyección.'],['MISMATCH','El schema expuesto no coincide con el contrato esperado; la proyección se bloquea sin modificar la fuente.']]},
      {label:'Payload',items:[['VALID','Los casos cumplen la forma estructural mínima usada por el workspace.'],['PARTIAL_INVALID','Hay mezcla de casos estructuralmente válidos e inválidos; solo los válidos pueden proyectarse.'],['INVALID','No hay casos estructuralmente utilizables para la proyección actual.'],['UNKNOWN','El payload no fue evaluado porque una condición técnica previa impidió llegar a esa lectura.']]},
      {label:'Casos',items:[['VÁLIDO','Válido significa estructura mínima compatible; no implica evidencia verificada, completa, suficiente ni aprobada.']]}
    ],integrity:'TECHNICAL_LABEL ≠ SEVERITY · GLOSSARY_ENTRY ≠ REVIEW_FINDING · STATE_DESCRIPTION ≠ REMEDIATION_INSTRUCTION · STRUCTURAL_VALIDITY ≠ DOCUMENT_VERIFICATION'};
  }
  function reviewTechnicalStateGlossaryHtml(glossary){
    if(!glossary?.groups?.length)return '';
    return `<details data-review-technical-glossary class="review-technical-glossary"><summary>Qué significan estos estados técnicos</summary><div class="review-technical-glossary-body">${glossary.groups.map(group=>`<div class="review-technical-glossary-group"><strong>${esc(group.label)}</strong>${group.items.map(([term,meaning])=>`<div class="review-technical-glossary-item"><code>${esc(term)}</code><span>${esc(meaning)}</span></div>`).join('')}</div>`).join('')}<div class="section-note">${esc(glossary.integrity)} · GLOSSARY_DISCLOSURE ≠ PERSISTED_STATE</div></div></details>`;
  }
"""
if anchor not in entry: raise SystemExit('V117 source integrity html anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

old_head='</div><span class="status">TECHNICAL ONLY</span></div><div class="review-source-integrity-grid">'
new_head='</div><span class="status">TECHNICAL ONLY</span></div>${reviewTechnicalStateGlossaryHtml(reviewTechnicalStateGlossary())}<div class="review-source-integrity-grid">'
if old_head not in entry: raise SystemExit('V117 glossary render anchor missing')
entry=entry.replace(old_head,new_head,1)

old_chain='<!-- ${REVIEW_V114_COMPAT} --><!-- ${REVIEW_V115_COMPAT} --><!-- ${REVIEW_V116_COMPAT} --><section data-review-context-summary'
new_chain='<!-- ${REVIEW_V114_COMPAT} --><!-- ${REVIEW_V115_COMPAT} --><!-- ${REVIEW_V116_COMPAT} --><!-- ${REVIEW_V117_COMPAT} --><section data-review-context-summary'
if old_chain not in entry: raise SystemExit('V117 compat html anchor missing')
entry=entry.replace(old_chain,new_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V116').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con ayuda humana bajo divulgación progresiva');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con ayuda humana bajo divulgación progresiva</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con ayuda humana bajo divulgación progresiva</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V117').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con glosario neutral de estados técnicos');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con glosario neutral de estados técnicos</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con glosario neutral de estados técnicos</h2>');"
if old_title not in entry: raise SystemExit('V117 title anchor missing')
entry=entry.replace(old_title,new_title,1)

old_export='focusSourceIntegrity:focusReviewSourceIntegrity,integrity:REVIEW_CONTEXT_INTEGRITY'
new_export='focusSourceIntegrity:focusReviewSourceIntegrity,technicalGlossary:reviewTechnicalStateGlossary,integrity:REVIEW_CONTEXT_INTEGRITY'
if old_export not in entry: raise SystemExit('V117 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V117 · Technical state glossary */' not in css:
    css += """

/* V117 · Technical state glossary */
.review-technical-glossary{margin:9px 0;border:1px solid var(--line);border-radius:9px;background:#fff}.review-technical-glossary>summary{cursor:pointer;padding:8px 9px;font-size:7px;font-weight:800}.review-technical-glossary-body{display:grid;gap:8px;padding:0 9px 9px}.review-technical-glossary-group{display:grid;gap:5px}.review-technical-glossary-group>strong{font-size:7px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.review-technical-glossary-item{display:grid;grid-template-columns:minmax(74px,auto) 1fr;gap:8px;align-items:start;font-size:7px;line-height:1.4}.review-technical-glossary-item code{font-size:6px;overflow-wrap:anywhere}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V117 technical state glossary patch applied')
