from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if 'REVIEW_V118_COMPAT' in entry:
    print('V118 source overview patch already applied')
    raise SystemExit(0)

old_integrity='STRUCTURAL_VALIDITY ≠ DOCUMENT_VERIFICATION · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='STRUCTURAL_VALIDITY ≠ DOCUMENT_VERIFICATION · TECHNICAL_COUNT ≠ SEVERITY · SOURCE_COUNT ≠ REVIEW_SCORE · NONMATCH_COUNT ≠ RISK · COUNT_AGGREGATION ≠ PRIORITY · OVERVIEW ≠ DUE_DILIGENCE · INVALID_CASE_COUNT ≠ DOCUMENT_FAILURE · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V118 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V117_COMPAT='DATA ROOM · REVIEW WORKSPACE V117 · Circuito de revisión, con glosario neutral de estados técnicos';"
new_compat=old_compat+"\n  const REVIEW_V118_COMPAT='DATA ROOM · REVIEW WORKSPACE V118 · Circuito de revisión, con panorama cuantitativo técnico no ponderado';"
if old_compat not in entry: raise SystemExit('V118 compat anchor missing')
entry=entry.replace(old_compat,new_compat,1)

anchor='  function reviewTechnicalStateGlossary(){'
insert="""  function reviewSourceIntegrityOverview(integrity){
    const sources=Array.isArray(integrity?.sources)?integrity.sources:[];
    const count=(field,value)=>sources.filter(source=>source?.[field]===value).length;
    const sum=field=>sources.reduce((n,source)=>n+Number(source?.[field]||0),0);
    return {total:sources.length,api:{available:count('state','AVAILABLE'),unavailable:count('state','UNAVAILABLE'),readError:count('state','READ_ERROR')},schema:{match:count('schemaState','MATCH'),missing:count('schemaState','MISSING'),mismatch:count('schemaState','MISMATCH'),unknown:count('schemaState','UNKNOWN')},payload:{valid:count('payloadState','VALID'),partialInvalid:count('payloadState','PARTIAL_INVALID'),invalid:count('payloadState','INVALID'),unknown:count('payloadState','UNKNOWN')},cases:{total:sum('caseCount'),valid:sum('validCaseCount'),invalid:sum('invalidCaseCount')},integrity:'TECHNICAL_COUNT ≠ SEVERITY · SOURCE_COUNT ≠ REVIEW_SCORE · NONMATCH_COUNT ≠ RISK · COUNT_AGGREGATION ≠ PRIORITY · OVERVIEW ≠ DUE_DILIGENCE · INVALID_CASE_COUNT ≠ DOCUMENT_FAILURE'};
  }
  function reviewSourceIntegrityOverviewHtml(overview){
    if(!overview||overview.total<1)return '';
    const card=(label,value,detail)=>`<div class="review-source-overview-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`;
    return `<div data-review-source-overview class="review-source-overview" aria-label="Panorama cuantitativo de estados técnicos">${card('Fuentes',String(overview.total),'conteo de fuentes del circuito')}${card('API',`${overview.api.available} available`,`${overview.api.unavailable} unavailable · ${overview.api.readError} read error`)}${card('Schema',`${overview.schema.match} match`,`${overview.schema.missing} missing · ${overview.schema.mismatch} mismatch · ${overview.schema.unknown} unknown`)}${card('Payload',`${overview.payload.valid} valid`,`${overview.payload.partialInvalid} partial invalid · ${overview.payload.invalid} invalid · ${overview.payload.unknown} unknown`)}${card('Casos',`${overview.cases.valid}/${overview.cases.total} estructuralmente válidos`,`${overview.cases.invalid} inválidos estructurales`) }<div class="section-note">${esc(overview.integrity)}</div></div>`;
  }
"""
if anchor not in entry: raise SystemExit('V118 glossary anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

old_render='</div><span class="status">TECHNICAL ONLY</span></div>${reviewTechnicalStateGlossaryHtml(reviewTechnicalStateGlossary())}<div class="review-source-integrity-grid">'
new_render='</div><span class="status">TECHNICAL ONLY</span></div>${reviewSourceIntegrityOverviewHtml(reviewSourceIntegrityOverview(integrity))}${reviewTechnicalStateGlossaryHtml(reviewTechnicalStateGlossary())}<div class="review-source-integrity-grid">'
if old_render not in entry: raise SystemExit('V118 overview render anchor missing')
entry=entry.replace(old_render,new_render,1)

old_chain='<!-- ${REVIEW_V115_COMPAT} --><!-- ${REVIEW_V116_COMPAT} --><!-- ${REVIEW_V117_COMPAT} --><section data-review-context-summary'
new_chain='<!-- ${REVIEW_V115_COMPAT} --><!-- ${REVIEW_V116_COMPAT} --><!-- ${REVIEW_V117_COMPAT} --><!-- ${REVIEW_V118_COMPAT} --><section data-review-context-summary'
if old_chain not in entry: raise SystemExit('V118 compat html anchor missing')
entry=entry.replace(old_chain,new_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V117').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con glosario neutral de estados técnicos');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con glosario neutral de estados técnicos</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con glosario neutral de estados técnicos</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V118').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con panorama cuantitativo técnico no ponderado');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con panorama cuantitativo técnico no ponderado</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con panorama cuantitativo técnico no ponderado</h2>');"
if old_title not in entry: raise SystemExit('V118 title anchor missing')
entry=entry.replace(old_title,new_title,1)

old_export='technicalGlossary:reviewTechnicalStateGlossary,integrity:REVIEW_CONTEXT_INTEGRITY'
new_export='technicalGlossary:reviewTechnicalStateGlossary,sourceOverview:reviewSourceIntegrityOverview,integrity:REVIEW_CONTEXT_INTEGRITY'
if old_export not in entry: raise SystemExit('V118 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V118 · Source integrity overview */' not in css:
    css += """

/* V118 · Source integrity overview */
.review-source-overview{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:9px 0}.review-source-overview-card{display:grid;gap:2px;padding:8px;border:1px solid var(--line);border-radius:9px;background:#fff}.review-source-overview-card>span{font-size:6px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.review-source-overview-card>strong{font-size:9px}.review-source-overview-card>small{font-size:6px;line-height:1.35;color:var(--muted)}.review-source-overview>.section-note{grid-column:1/-1}@media(max-width:760px){.review-source-overview{grid-template-columns:repeat(2,minmax(0,1fr))}.review-source-overview-card:last-of-type{grid-column:1/-1}}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V118 source integrity overview patch applied')
