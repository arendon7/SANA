from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if 'REVIEW_V119_COMPAT' in entry:
    print('V119 structural diagnostics patch already applied')
    raise SystemExit(0)

old_integrity='INVALID_CASE_COUNT ≠ DOCUMENT_FAILURE · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='INVALID_CASE_COUNT ≠ DOCUMENT_FAILURE · STRUCTURAL_DIAGNOSTIC ≠ DOCUMENT_FINDING · ISSUE_CODE ≠ SEVERITY · ISSUE_CODE ≠ REMEDIATION_INSTRUCTION · INVALID_CASE ≠ INVALID_EVIDENCE · CASE_INDEX ≠ SOURCE_IDENTITY · DIAGNOSTIC_DISCLOSURE ≠ PERSISTED_STATE · DIAGNOSTIC_PROJECTION ≠ RAW_PAYLOAD · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V119 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V118_COMPAT='DATA ROOM · REVIEW WORKSPACE V118 · Circuito de revisión, con panorama cuantitativo técnico no ponderado';"
new_compat=old_compat+"\n  const REVIEW_V119_COMPAT='DATA ROOM · REVIEW WORKSPACE V119 · Circuito de revisión, con diagnóstico estructural data-minimized';"
if old_compat not in entry: raise SystemExit('V119 compat anchor missing')
entry=entry.replace(old_compat,new_compat,1)

old_map="sources:sources.map(source=>({stage:source.stage||'',label:source.label||source.stage||'',state:source.state||'UNAVAILABLE',schemaState:source.schemaState||'UNKNOWN',payloadState:source.payloadState||'UNKNOWN',invalidCaseCount:Number(source.invalidCaseCount||0),caseCount:Number(source.caseCount||0),validCaseCount:Number(source.validCaseCount||0)})),"
new_map="sources:sources.map(source=>({stage:source.stage||'',label:source.label||source.stage||'',state:source.state||'UNAVAILABLE',schemaState:source.schemaState||'UNKNOWN',payloadState:source.payloadState||'UNKNOWN',invalidCaseCount:Number(source.invalidCaseCount||0),caseCount:Number(source.caseCount||0),validCaseCount:Number(source.validCaseCount||0),invalidCases:(Array.isArray(source.invalidCases)?source.invalidCases:[]).map(item=>({index:Number(item?.index||0),id:String(item?.id||''),issues:(Array.isArray(item?.issues)?item.issues:[]).map(issue=>String(issue))}))})),"
if old_map not in entry: raise SystemExit('V119 source projection anchor missing')
entry=entry.replace(old_map,new_map,1)

anchor='  function reviewSourceIntegrityHtml(integrity){'
insert="""  function reviewStructuralDiagnostics(source){
    const cases=Array.isArray(source?.invalidCases)?source.invalidCases:[];
    return {stage:source?.stage||'',cases:cases.map(item=>({index:Number(item?.index||0),id:String(item?.id||''),issues:(Array.isArray(item?.issues)?item.issues:[]).map(issue=>String(issue))})),integrity:'STRUCTURAL_DIAGNOSTIC ≠ DOCUMENT_FINDING · ISSUE_CODE ≠ SEVERITY · ISSUE_CODE ≠ REMEDIATION_INSTRUCTION · INVALID_CASE ≠ INVALID_EVIDENCE · CASE_INDEX ≠ SOURCE_IDENTITY · DIAGNOSTIC_PROJECTION ≠ RAW_PAYLOAD'};
  }
  function reviewStructuralDiagnosticsHtml(source){
    const diagnostic=reviewStructuralDiagnostics(source);
    if(!diagnostic.cases.length)return '';
    return `<details data-review-structural-diagnostics="${esc(diagnostic.stage)}" class="review-structural-diagnostics"><summary>Ver diagnóstico estructural · ${diagnostic.cases.length} caso(s)</summary><div class="review-structural-diagnostics-body">${diagnostic.cases.map(item=>`<div class="review-structural-diagnostic-case" data-review-structural-case-index="${item.index}"><div><strong>Caso #${item.index+1}</strong><small>${item.id?`ID · ${esc(item.id)}`:'ID no utilizable en la proyección'}</small></div><div class="review-structural-issue-list">${item.issues.map(issue=>`<code>${esc(issue)}</code>`).join('')}</div></div>`).join('')}<div class="section-note">${esc(diagnostic.integrity)} · DIAGNOSTIC_DISCLOSURE ≠ PERSISTED_STATE</div></div></details>`;
  }
"""
if anchor not in entry: raise SystemExit('V119 integrity html anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

old_item="<span>Casos · ${source.validCaseCount}/${source.caseCount} válidos · ${source.invalidCaseCount} inválidos</span>${nav.navigable?`<button type=\"button\" class=\"btn ghost\" data-review-source-panel-nav=\"${esc(source.stage)}\" aria-controls=\"${esc(nav.target)}\">Ir al panel fuente</button>`:''}</div>"
new_item="<span>Casos · ${source.validCaseCount}/${source.caseCount} válidos · ${source.invalidCaseCount} inválidos</span>${reviewStructuralDiagnosticsHtml(source)}${nav.navigable?`<button type=\"button\" class=\"btn ghost\" data-review-source-panel-nav=\"${esc(source.stage)}\" aria-controls=\"${esc(nav.target)}\">Ir al panel fuente</button>`:''}</div>"
if old_item not in entry: raise SystemExit('V119 source item render anchor missing')
entry=entry.replace(old_item,new_item,1)

old_chain='<!-- ${REVIEW_V116_COMPAT} --><!-- ${REVIEW_V117_COMPAT} --><!-- ${REVIEW_V118_COMPAT} --><section data-review-context-summary'
new_chain='<!-- ${REVIEW_V116_COMPAT} --><!-- ${REVIEW_V117_COMPAT} --><!-- ${REVIEW_V118_COMPAT} --><!-- ${REVIEW_V119_COMPAT} --><section data-review-context-summary'
if old_chain not in entry: raise SystemExit('V119 compat html anchor missing')
entry=entry.replace(old_chain,new_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V118').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con panorama cuantitativo técnico no ponderado');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con panorama cuantitativo técnico no ponderado</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con panorama cuantitativo técnico no ponderado</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V119').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con diagnóstico estructural data-minimized');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con diagnóstico estructural data-minimized</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con diagnóstico estructural data-minimized</h2>');"
if old_title not in entry: raise SystemExit('V119 title anchor missing')
entry=entry.replace(old_title,new_title,1)

old_export='sourceOverview:reviewSourceIntegrityOverview,integrity:REVIEW_CONTEXT_INTEGRITY'
new_export='sourceOverview:reviewSourceIntegrityOverview,structuralDiagnostics:reviewStructuralDiagnostics,integrity:REVIEW_CONTEXT_INTEGRITY'
if old_export not in entry: raise SystemExit('V119 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V119 · Structural case diagnostics */' not in css:
    css += """

/* V119 · Structural case diagnostics */
.review-structural-diagnostics{margin-top:6px;border:1px dashed var(--line);border-radius:8px;background:#fff}.review-structural-diagnostics>summary{cursor:pointer;padding:7px 8px;font-size:6px;font-weight:800}.review-structural-diagnostics-body{display:grid;gap:6px;padding:0 8px 8px}.review-structural-diagnostic-case{display:grid;gap:5px;padding:7px;border:1px solid var(--line);border-radius:7px;background:#fbfcfa}.review-structural-diagnostic-case>div:first-child{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.review-structural-diagnostic-case strong{font-size:7px}.review-structural-diagnostic-case small{font-size:6px;color:var(--muted)}.review-structural-issue-list{display:flex;gap:4px;flex-wrap:wrap}.review-structural-issue-list code{padding:3px 5px;border:1px solid var(--line);border-radius:5px;font-size:6px;background:#fff}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V119 structural diagnostics patch applied')
