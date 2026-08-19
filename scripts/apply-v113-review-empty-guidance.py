from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

if 'REVIEW_V113_COMPAT' in entry:
    print('V113 empty-state guidance patch already applied')
    raise SystemExit(0)

old_integrity='EMPTY_STATE ≠ REVIEW_OUTCOME · READ_ONLY · NO_SOURCE_MUTATION'
new_integrity='EMPTY_STATE ≠ REVIEW_OUTCOME · SOURCE_GUIDANCE ≠ SOURCE_REMEDIATION · GUIDANCE_LINK ≠ SOURCE_VERIFICATION · PROJECTION_PREREQUISITE ≠ REVIEW_REQUIREMENT · SOURCE_NAVIGATION ≠ REVIEW_PRIORITY · READ_ONLY · NO_SOURCE_MUTATION'
if old_integrity not in entry: raise SystemExit('V113 integrity anchor missing')
entry=entry.replace(old_integrity,new_integrity,1)

old_compat="  const REVIEW_V112_COMPAT='DATA ROOM · REVIEW WORKSPACE V112 · Circuito de revisión, con estados vacíos explícitos y recuperación de filtros';"
new_compat=old_compat+"\n  const REVIEW_V113_COMPAT='DATA ROOM · REVIEW WORKSPACE V113 · Circuito de revisión, con guía de estados vacíos y navegación técnica';"
if old_compat not in entry: raise SystemExit('V113 compat const anchor missing')
entry=entry.replace(old_compat,new_compat,1)

anchor="  function applyReviewFilterRecovery(mode='CLEAR_FOCUS'){"
insert="""  function reviewSourceIntegrity(s){
    const sources=Array.isArray(s?.sources)?s.sources:[];
    return {
      sources:sources.map(source=>({stage:source.stage||'',label:source.label||source.stage||'',state:source.state||'UNAVAILABLE',schemaState:source.schemaState||'UNKNOWN',payloadState:source.payloadState||'UNKNOWN',invalidCaseCount:Number(source.invalidCaseCount||0),caseCount:Number(source.caseCount||0),validCaseCount:Number(source.validCaseCount||0)})),
      integrity:'SOURCE_STATUS ≠ SOURCE_VERIFICATION · TECHNICAL_STATE ≠ REVIEW_OUTCOME · SOURCE_INTEGRITY_VIEW ≠ SOURCE_REMEDIATION'
    };
  }
  function reviewEmptyGuidance(empty,s){
    if(!empty||empty.kind==='NONE'||empty.kind==='FILTER_EMPTY'||empty.kind==='CONTEXT_EMPTY')return {kind:empty?.kind||'NONE',items:[],sourceIntegrity:null,navigable:false,integrity:'SOURCE_GUIDANCE ≠ SOURCE_REMEDIATION'};
    if(empty.kind==='SOURCE_INDETERMINATE'){
      const summary=s?.summary||{},items=[];
      if(Number(summary.unavailableSources||0)>0||Number(summary.sourceReadErrors||0)>0)items.push('Revisar disponibilidad y lectura de las APIs fuente del circuito.');
      if(Number(summary.schemaMismatches||0)>0||Number(summary.missingSourceSchemas||0)>0)items.push('Contrastar el schema expuesto por la fuente con el contrato canónico de su etapa.');
      if(Number(summary.ambiguousStageReferences||0)>0)items.push('Revisar multiplicidad de casos fuente para la misma etapa, capital case y lote.');
      if(Number(summary.invalidSourceCases||0)>0||Number(summary.sourcesWithInvalidPayload||0)>0)items.push('Revisar forma mínima del payload antes de proyectarlo en el workspace.');
      if(!items.length)items.push('Revisar señales técnicas de integridad de fuente sin atribuir ausencia documental.');
      return {kind:empty.kind,items,sourceIntegrity:reviewSourceIntegrity(s),navigable:true,integrity:'SOURCE_GUIDANCE ≠ SOURCE_REMEDIATION · GUIDANCE_LINK ≠ SOURCE_VERIFICATION · SOURCE_NAVIGATION ≠ REVIEW_PRIORITY'};
    }
    return {kind:empty.kind,items:[
      'Debe existir al menos una fuente disponible con schema compatible antes de proyectar una etapa.',
      'Los casos fuente deben conservar capital case, lote, id y events[] con forma mínima válida.',
      'Una etapa con múltiples casos para el mismo circuito se mantiene ambigua y no se elige automáticamente.',
      'La ausencia de circuitos proyectados no prueba ausencia de evidencia, incumplimiento ni riesgo.'
    ],sourceIntegrity:null,navigable:false,integrity:'PROJECTION_PREREQUISITE ≠ REVIEW_REQUIREMENT · WORKSPACE_EMPTY ≠ EMPTY_EVIDENCE · GUIDANCE_VIEW ≠ REVIEW_OUTCOME'};
  }
  function focusReviewSourceIntegrity(){
    if(typeof document==='undefined')return false;
    const target=document.querySelector?.('[data-review-source-integrity]');
    if(!target)return false;
    target.scrollIntoView?.({block:'start',behavior:'smooth'});
    target.focus?.({preventScroll:true});
    return true;
  }
"""
if anchor not in entry: raise SystemExit('V113 filter recovery anchor missing')
entry=entry.replace(anchor,insert+anchor,1)

summary_anchor="        emptyState:reviewEmptyState(s,focus,context,visible),\n        stageNavigation:reviewStageNavigation(s,focus),"
summary_repl="        emptyState:reviewEmptyState(s,focus,context,visible),\n        emptyGuidance:reviewEmptyGuidance(reviewEmptyState(s,focus,context,visible),s),\n        stageNavigation:reviewStageNavigation(s,focus),"
if summary_anchor not in entry: raise SystemExit('V113 summary guidance anchor missing')
entry=entry.replace(summary_anchor,summary_repl,1)

html_anchor="  function reviewEmptyStateHtml(empty){"
html_insert="""  function reviewSourceIntegrityHtml(integrity){
    if(!integrity?.sources?.length)return '';
    return `<section data-review-source-integrity tabindex="-1" class="review-source-integrity" aria-label="Integridad técnica de fuentes"><div class="review-source-integrity-head"><div><p class="kicker">INTEGRIDAD DE FUENTES · READ ONLY</p><h4>Estado técnico usado para decidir si una etapa puede proyectarse</h4><p>Disponibilidad, schema y payload se muestran como señales técnicas; no verifican documentos ni califican la revisión.</p></div><span class="status">TECHNICAL ONLY</span></div><div class="review-source-integrity-grid">${integrity.sources.map(source=>`<div class="review-source-integrity-item" data-review-source-stage="${esc(source.stage)}"><strong>${esc(source.label||source.stage)}</strong><span>API · ${esc(source.state)}</span><span>Schema · ${esc(source.schemaState)}</span><span>Payload · ${esc(source.payloadState)}</span><span>Casos · ${source.validCaseCount}/${source.caseCount} válidos · ${source.invalidCaseCount} inválidos</span></div>`).join('')}</div><div class="section-note">${esc(integrity.integrity)}</div></section>`;
  }
  function reviewEmptyGuidanceHtml(guidance){
    if(!guidance?.items?.length)return '';
    const action=guidance.navigable?'<button type="button" class="btn ghost" data-review-empty-source-nav>Ir a integridad de fuentes</button>':'';
    return `<div data-review-empty-guidance="${esc(guidance.kind)}" class="review-empty-guidance"><div><strong>GUÍA HUMANA · READ ONLY</strong><p>Orientación para comprender por qué no hay una proyección visible. No corrige fuentes ni crea requisitos de revisión.</p></div><ul>${guidance.items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>${action}<div class="section-note">${esc(guidance.integrity)}</div>${reviewSourceIntegrityHtml(guidance.sourceIntegrity)}</div>`;
  }
"""
if html_anchor not in entry: raise SystemExit('V113 html anchor missing')
entry=entry.replace(html_anchor,html_insert+html_anchor,1)

old_call="${reviewContextRecoveryHtml(x.recovery,x.recoveryAll)}${reviewEmptyStateHtml(x.emptyState)}${reviewRoleLensHtml(x.roleLens)}"
new_call="${reviewContextRecoveryHtml(x.recovery,x.recoveryAll)}${reviewEmptyStateHtml(x.emptyState)}${reviewEmptyGuidanceHtml(x.emptyGuidance)}${reviewRoleLensHtml(x.roleLens)}"
if old_call not in entry: raise SystemExit('V113 empty guidance call anchor missing')
entry=entry.replace(old_call,new_call,1)

old_compat_chain='<!-- ${REVIEW_V110_COMPAT} --><!-- ${REVIEW_V111_COMPAT} --><!-- ${REVIEW_V112_COMPAT} --><section data-review-context-summary'
new_compat_chain='<!-- ${REVIEW_V110_COMPAT} --><!-- ${REVIEW_V111_COMPAT} --><!-- ${REVIEW_V112_COMPAT} --><!-- ${REVIEW_V113_COMPAT} --><section data-review-context-summary'
if old_compat_chain not in entry: raise SystemExit('V113 compat html anchor missing')
entry=entry.replace(old_compat_chain,new_compat_chain,1)

old_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V112').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con estados vacíos explícitos y recuperación de filtros');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con estados vacíos explícitos y recuperación de filtros</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con estados vacíos explícitos y recuperación de filtros</h2>');"
new_title="    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V113').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con guía de estados vacíos y navegación técnica');\n    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con guía de estados vacíos y navegación técnica</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con guía de estados vacíos y navegación técnica</h2>');"
if old_title not in entry: raise SystemExit('V113 title anchor missing')
entry=entry.replace(old_title,new_title,1)

click_anchor="      const emptyRecovery=e.target.closest?.('[data-review-empty-recover]');\n      if(emptyRecovery){applyReviewFilterRecovery(emptyRecovery.dataset.reviewEmptyRecover||'CLEAR_FOCUS');return}"
click_repl="      const emptySource=e.target.closest?.('[data-review-empty-source-nav]');\n      if(emptySource){focusReviewSourceIntegrity();return}\n"+click_anchor
if click_anchor not in entry: raise SystemExit('V113 click anchor missing')
entry=entry.replace(click_anchor,click_repl,1)

old_export="emptyState:reviewEmptyState,recoverEmptyFilter:applyReviewFilterRecovery,integrity:REVIEW_CONTEXT_INTEGRITY"
new_export="emptyState:reviewEmptyState,emptyGuidance:reviewEmptyGuidance,sourceIntegrity:reviewSourceIntegrity,recoverEmptyFilter:applyReviewFilterRecovery,focusSourceIntegrity:focusReviewSourceIntegrity,integrity:REVIEW_CONTEXT_INTEGRITY"
if old_export not in entry: raise SystemExit('V113 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V113 · Empty-state guidance */' not in css:
    css += """

/* V113 · Empty-state guidance */
.review-empty-guidance{margin-top:7px;padding:10px;border:1px dashed var(--line);border-radius:10px;background:#fff}.review-empty-guidance strong{font-size:8px}.review-empty-guidance p,.review-empty-guidance li{font-size:7px;line-height:1.45;color:var(--muted)}.review-empty-guidance p{margin:3px 0 6px}.review-empty-guidance ul{margin:0 0 7px;padding-left:17px;display:grid;gap:4px}.review-empty-guidance>[data-review-empty-source-nav]{margin-top:2px}.review-source-integrity{margin-top:9px;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fbfcfa}.review-source-integrity:focus{outline:3px solid rgba(42,123,115,.22);outline-offset:2px}.review-source-integrity-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.review-source-integrity h4{margin:2px 0 3px;font-size:10px}.review-source-integrity p{margin:0;font-size:7px;line-height:1.45;color:var(--muted)}.review-source-integrity-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}.review-source-integrity-item{display:grid;gap:2px;padding:8px;border:1px solid var(--line);border-radius:8px;background:#fff}.review-source-integrity-item strong{font-size:8px}.review-source-integrity-item span{font-size:6px;color:var(--muted)}@media(max-width:760px){.review-source-integrity-grid{grid-template-columns:1fr}}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V113 empty-state guidance patch applied')
