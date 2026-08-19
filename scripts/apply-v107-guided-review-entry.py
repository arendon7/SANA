from pathlib import Path

path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
text=path.read_text()

def replace_once(old,new,label):
    global text
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text=text.replace(old,new,1)

replace_once(
    'GUIDE_VIEW ≠ SOURCE_MUTATION · READ_ONLY · NO_SOURCE_MUTATION',
    'GUIDE_VIEW ≠ SOURCE_MUTATION · GUIDED_ENTRY ≠ ACCESS_GRANT · ENTRY_ROUTE ≠ REVIEW_PRIORITY · WORKSPACE_ENTRY ≠ REVIEW_DECISION · ENTRY_SCROLL ≠ SOURCE_MUTATION · ENTRY_CONTEXT_PRESERVED ≠ CONTEXT_VERIFICATION · READ_ONLY · NO_SOURCE_MUTATION',
    'integrity boundary'
)

replace_once(
    "  const REVIEW_V105_COMPAT='DATA ROOM · REVIEW WORKSPACE V105 · Circuito de revisión, con lente por rol y contexto reproducible';\n",
    "  const REVIEW_V105_COMPAT='DATA ROOM · REVIEW WORKSPACE V105 · Circuito de revisión, con lente por rol y contexto reproducible';\n  const REVIEW_V106_COMPAT='DATA ROOM · REVIEW WORKSPACE V106 · Circuito de revisión, con guía humana por rol y etapa';\n",
    'v106 compat marker'
)

replace_once(
    "  function investorCard(){\n    const s=summary();\n    return `<section class=\"card\" style=\"margin-top:14px\"><div class=\"card-head\"><div><p class=\"kicker\">LECTURA EJECUTIVA PRIORITARIA</p><h2>Data Room 360°</h2><p>Empieza por el expediente integrado antes de abrir módulos individuales. Mantiene separados snapshot histórico, remediación posterior y evolución entre cortes.</p></div><span class=\"status teal\">READ ONLY</span></div><div class=\"card-body\"><div class=\"grid metrics\">${metric('Último corte',s.cut,'SNAPSHOT_DEMO')}${metric('Brechas históricas',s.gaps,'prioridad documental')}${metric('Preparadas para re-evaluar',s.remediation,'no significa resueltas')}${metric('Evolución',s.evolution,'solo entre snapshots registrados')}</div><div class=\"head-actions\" style=\"margin-top:12px\"><button class=\"btn primary\" data-view-link=\"dataroom\">Abrir Data Room 360°</button><button class=\"btn secondary\" data-view-link=\"reports\">Ver detalle de Due Diligence</button></div><div class=\"section-note\" style=\"margin-top:12px\">READ_ONLY ≠ INVESTMENT_RECOMMENDATION ≠ ELIGIBILITY ≠ TRANSACTION. La vista organiza evidencia; no decide.</div></div></section>`;\n  }\n",
    "  function investorCard(){\n    const s=summary(),entry=reviewGuidedEntry('investor');\n    return `<section class=\"card\" style=\"margin-top:14px\"><div class=\"card-head\"><div><p class=\"kicker\">LECTURA EJECUTIVA PRIORITARIA</p><h2>Data Room 360°</h2><p>Empieza por el expediente integrado antes de abrir módulos individuales. Mantiene separados snapshot histórico, remediación posterior y evolución entre cortes.</p></div><span class=\"status teal\">READ ONLY</span></div><div class=\"card-body\"><div class=\"grid metrics\">${metric('Último corte',s.cut,'SNAPSHOT_DEMO')}${metric('Brechas históricas',s.gaps,'prioridad documental')}${metric('Preparadas para re-evaluar',s.remediation,'no significa resueltas')}${metric('Evolución',s.evolution,'solo entre snapshots registrados')}</div><div class=\"head-actions\" style=\"margin-top:12px\">${entry.allowed?'<button class=\"btn primary\" data-review-guided-entry>Abrir revisión guiada</button>':''}<button class=\"btn secondary\" data-view-link=\"dataroom\">Abrir Data Room 360°</button><button class=\"btn secondary\" data-view-link=\"reports\">Ver detalle de Due Diligence</button></div><div class=\"section-note\" style=\"margin-top:12px\">GUIDED_ENTRY ≠ ACCESS_GRANT · ENTRY_ROUTE ≠ REVIEW_PRIORITY · conserva el contexto URL actual si existe. READ_ONLY ≠ INVESTMENT_RECOMMENDATION ≠ ELIGIBILITY ≠ TRANSACTION.</div></div></section>`;\n  }\n",
    'investor guided entry'
)

replace_once(
    "  function operatorCard(role){\n    const s=summary();\n    const title=role==='admin'?'Expediente ejecutivo':role==='technical'?'Síntesis técnica del expediente':'Síntesis documental del predio';\n    return `<section class=\"card\" style=\"margin-top:14px\"><div class=\"card-head\"><div><p class=\"kicker\">DATA ROOM 360°</p><h2>${esc(title)}</h2><p>Corte ${esc(s.cut)} · ${esc(s.gaps)} brecha(s) históricas · ${esc(s.remediation)} preparadas para re-evaluación.</p></div><button class=\"btn secondary\" data-view-link=\"dataroom\">Abrir 360°</button></div><div class=\"card-body\"><div class=\"section-note\">La síntesis ejecutiva es read-only. Para modificar actividades, evidencia, costos o remediación debes volver al módulo fuente correspondiente.</div></div></section>`;\n  }\n",
    "  function operatorCard(role){\n    const s=summary(),entry=reviewGuidedEntry(role);\n    const title=role==='admin'?'Expediente ejecutivo':role==='technical'?'Síntesis técnica del expediente':'Síntesis documental del predio';\n    return `<section class=\"card\" style=\"margin-top:14px\"><div class=\"card-head\"><div><p class=\"kicker\">DATA ROOM 360°</p><h2>${esc(title)}</h2><p>Corte ${esc(s.cut)} · ${esc(s.gaps)} brecha(s) históricas · ${esc(s.remediation)} preparadas para re-evaluación.</p></div><div class=\"head-actions\">${entry.allowed?'<button class=\"btn primary\" data-review-guided-entry>Revisión guiada</button>':''}<button class=\"btn secondary\" data-view-link=\"dataroom\">Abrir 360°</button></div></div><div class=\"card-body\"><div class=\"section-note\">GUIDED_ENTRY ≠ ACCESS_GRANT · conserva el contexto URL actual. La síntesis ejecutiva es read-only; para modificar actividades, evidencia, costos o remediación debes volver al módulo fuente correspondiente.</div></div></section>`;\n  }\n",
    'operator guided entry'
)

replace_once(
    '  function reviewRoleLens(role=currentRole()){\n',
    "  function reviewGuidedEntry(role=currentRole()){\n    const access=window.__SANA_ACCESS__,allowed=Boolean(access&&typeof access.canView==='function'&&access.canView('dataroom'));\n    return {role,allowed,view:'dataroom',target:'review-workspace',preservesContext:true,accessEffect:'NONE',filterEffect:'NONE',priorityEffect:'NONE',integrity:'GUIDED_ENTRY ≠ ACCESS_GRANT · ENTRY_ROUTE ≠ REVIEW_PRIORITY · WORKSPACE_ENTRY ≠ REVIEW_DECISION · ENTRY_SCROLL ≠ SOURCE_MUTATION · ENTRY_CONTEXT_PRESERVED ≠ CONTEXT_VERIFICATION'};\n  }\n  function openGuidedReview(){\n    const entry=reviewGuidedEntry();\n    if(!entry.allowed||typeof window.go!=='function')return false;\n    window.go(entry.view);\n    if(typeof document!=='undefined')document.getElementById?.(entry.target)?.scrollIntoView?.({behavior:'smooth',block:'start'});\n    return true;\n  }\n  function reviewRoleLens(role=currentRole()){\n",
    'guided entry functions'
)

replace_once(
    '    return `<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><!-- ${REVIEW_V105_COMPAT} --><section data-review-context-summary',
    '    return `<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><!-- ${REVIEW_V105_COMPAT} --><!-- ${REVIEW_V106_COMPAT} --><section data-review-context-summary',
    'compat marker'
)

replace_once(
    "    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V106').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con guía humana por rol y etapa');",
    "    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V107').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con entrada guiada y contexto humano');",
    'visible v107 title'
)

replace_once(
    "  if(typeof document!=='undefined')document.addEventListener('click',e=>{\n    const copy=e.target.closest?.('[data-review-context-copy]');",
    "  if(typeof document!=='undefined')document.addEventListener('click',e=>{\n    const guided=e.target.closest?.('[data-review-guided-entry]');\n    if(guided){openGuidedReview();return}\n    const copy=e.target.closest?.('[data-review-context-copy]');",
    'guided entry listener'
)

replace_once(
    'stageGuide:reviewRoleStageGuide,integrity:REVIEW_CONTEXT_INTEGRITY',
    'stageGuide:reviewRoleStageGuide,guidedEntry:reviewGuidedEntry,openGuidedReview,integrity:REVIEW_CONTEXT_INTEGRITY',
    'public api guided entry'
)

path.write_text(text)
