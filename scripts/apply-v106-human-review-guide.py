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
    'SAME_EVIDENCE_SET_ACROSS_ROLES · READ_ONLY · NO_SOURCE_MUTATION',
    'SAME_EVIDENCE_SET_ACROSS_ROLES · REVIEW_QUESTION ≠ REQUIREMENT ≠ DECISION · QUESTION_SET ≠ SCORECARD · STAGE_GUIDANCE ≠ AUTOMATIC_FINDING · QUESTION_ORDER ≠ PRIORITY · GUIDE_VIEW ≠ SOURCE_MUTATION · READ_ONLY · NO_SOURCE_MUTATION',
    'integrity boundary'
)

replace_once(
    "  const REVIEW_V104_COMPAT='DATA ROOM · REVIEW WORKSPACE V104 · Circuito de revisión, con contexto reproducible y navegación de etapas';\n",
    "  const REVIEW_V104_COMPAT='DATA ROOM · REVIEW WORKSPACE V104 · Circuito de revisión, con contexto reproducible y navegación de etapas';\n  const REVIEW_V105_COMPAT='DATA ROOM · REVIEW WORKSPACE V105 · Circuito de revisión, con lente por rol y contexto reproducible';\n  const REVIEW_STAGE_GUIDES=Object.freeze({\n    ALL:Object.freeze(['¿Qué etapas del circuito pueden reconstruirse desde referencias únicas y cuáles siguen indeterminadas?','¿Qué señales provienen de disponibilidad, schema o payload y no deben confundirse con ausencia documental?','¿Qué contexto adicional necesitaría una persona antes de emitir cualquier juicio sobre suficiencia o resultado?']),\n    CASE:Object.freeze(['¿El expediente fuente identifica claramente el caso, capital case y lote que se están revisando?','¿Las referencias internas del expediente permiten reconstruir su procedencia sin asumir identidad por coincidencia de IDs?','¿Qué información falta para comprender el alcance del caso sin convertir esa ausencia en fallo automático?']),\n    HANDOFF:Object.freeze(['¿La entrega documenta qué fue transferido para revisión y desde qué caso fuente?','¿El handoff conserva referencias suficientes para entender el alcance sin inferir aceptación o completitud?','¿Hay alguna ambigüedad de procedencia que deba resolverse antes de interpretar la entrega?']),\n    FEEDBACK:Object.freeze(['¿El feedback puede vincularse con una referencia o evento concreto del caso revisado?','¿Se distingue una observación humana de una conclusión, prioridad o decisión automática?','¿Qué evidencia adicional sería necesaria para interpretar el comentario con su contexto original?']),\n    RESPONSE:Object.freeze(['¿La respuesta se vincula explícitamente con el feedback o referencia a la que pretende responder?','¿La respuesta aporta evidencia o explicación sin asumir que ello resuelve automáticamente el asunto?','¿Qué aspectos necesitan revisión humana adicional antes de considerar suficiente la respuesta?']),\n    DISPOSITION:Object.freeze(['¿La disposición registrada puede trazarse a las referencias y eventos que la sustentan?','¿El estado de disposición se mantiene separado de aprobación DD, elegibilidad o decisión financiera?','¿Qué condiciones o límites deberían quedar explícitos para que una persona interprete correctamente la disposición?']),\n    ROUND:Object.freeze(['¿La ronda permite reconstruir qué cambió entre iteraciones sin asumir mejora, causalidad o cierre?','¿El estado de la ronda se mantiene separado del resultado del capital case y de cualquier aprobación?','¿Qué elementos requieren comparación humana antes de describir la evolución del proceso de revisión?'])\n  });\n",
    'guide constants'
)

replace_once(
    '  function reviewStageNavigation(s,focus){\n',
    "  function reviewRoleStageGuide(role=currentRole(),stage='ALL'){\n    const lens=reviewRoleLens(role),key=Object.prototype.hasOwnProperty.call(REVIEW_STAGE_GUIDES,stage)?stage:'ALL',base=REVIEW_STAGE_GUIDES[key];\n    const rolePrompt={admin:'¿Qué control de integridad o gobernanza merece atención humana aquí?',technical:'¿Qué procedencia o evidencia técnica conviene contrastar directamente con la fuente?',investor:'¿Qué límite de lectura debe preservarse para no convertir evidencia en recomendación o elegibilidad?',producer:'¿Qué parte de esta revisión conviene explicar desde el registro fuente y el acompañamiento humano?',visitor:'¿Qué puede comprenderse de esta etapa sin asumir permiso, aprobación o resultado?',new_user:'¿Qué concepto de esta etapa debe entenderse antes de atribuirle significado operativo?'}[lens.role]||'¿Qué debe revisar una persona antes de interpretar esta etapa?';\n    return {role:lens.role,stage:key,stageLabel:key==='ALL'?'Todas':REVIEW_STAGE_LABELS[key]||key,questions:[rolePrompt,...base.slice(0,2)],answerMode:'HUMAN_ONLY',required:false,scoreEffect:'NONE',priorityEffect:'NONE',findingEffect:'NONE',permissionEffect:'NONE',integrity:'REVIEW_QUESTION ≠ REQUIREMENT ≠ DECISION · QUESTION_SET ≠ SCORECARD · STAGE_GUIDANCE ≠ AUTOMATIC_FINDING · QUESTION_ORDER ≠ PRIORITY · GUIDE_VIEW ≠ SOURCE_MUTATION'};\n  }\n  function reviewStageNavigation(s,focus){\n",
    'guide function'
)

replace_once(
    '        roleLens:reviewRoleLens(),\n        integrity:REVIEW_CONTEXT_INTEGRITY',
    '        roleLens:reviewRoleLens(),\n        humanGuide:reviewRoleStageGuide(currentRole(),focus.stage||\'ALL\'),\n        integrity:REVIEW_CONTEXT_INTEGRITY',
    'summary guide'
)

replace_once(
    '  function reviewStageSwitcherHtml(nav){\n',
    "  function reviewHumanGuideHtml(guide){\n    if(!guide)return '';\n    return `<div data-review-human-guide data-review-guide-role=\"${esc(guide.role)}\" data-review-guide-stage=\"${esc(guide.stage)}\" style=\"margin-top:9px;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff\"><div style=\"display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap\"><div style=\"display:grid;gap:3px;min-width:0;flex:1\"><span style=\"font-size:6px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)\">GUÍA DE REVISIÓN HUMANA · ${esc(guide.stageLabel)}</span><strong style=\"font-size:9px\">Preguntas para orientar la lectura, no para puntuarla</strong><small style=\"font-size:7px;color:var(--muted)\">No son requisitos, checklist de cierre ni hallazgos automáticos.</small></div><span class=\"status\">HUMAN ONLY</span></div><ol style=\"margin:8px 0 0;padding-left:18px;display:grid;gap:5px\">${guide.questions.map(q=>`<li style=\"font-size:7px;line-height:1.45;color:var(--ink2)\">${esc(q)}</li>`).join('')}</ol><div style=\"margin-top:7px;font-size:6px;color:var(--muted)\">REVIEW_QUESTION ≠ REQUIREMENT ≠ DECISION · QUESTION_SET ≠ SCORECARD · STAGE_GUIDANCE ≠ AUTOMATIC_FINDING · QUESTION_ORDER ≠ PRIORITY</div></div>`;\n  }\n  function reviewStageSwitcherHtml(nav){\n",
    'guide html'
)

replace_once(
    '    return `<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><section data-review-context-summary',
    '    return `<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><!-- ${REVIEW_V105_COMPAT} --><section data-review-context-summary',
    'compat marker'
)

replace_once(
    '${reviewRoleLensHtml(x.roleLens)}${reviewStageSwitcherHtml(x.stageNavigation)}',
    '${reviewRoleLensHtml(x.roleLens)}${reviewHumanGuideHtml(x.humanGuide)}${reviewStageSwitcherHtml(x.stageNavigation)}',
    'guide placement'
)

replace_once(
    "    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V105').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con lente por rol y contexto reproducible');",
    "    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V106').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con guía humana por rol y etapa');",
    'visible v106 title'
)

replace_once(
    'roleLens:reviewRoleLens,integrity:REVIEW_CONTEXT_INTEGRITY',
    'roleLens:reviewRoleLens,stageGuide:reviewRoleStageGuide,integrity:REVIEW_CONTEXT_INTEGRITY',
    'public api guide'
)

path.write_text(text)
