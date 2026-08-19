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
    'URL_CONTEXT ≠ PERSISTED_SOURCE_STATE · READ_ONLY · NO_SOURCE_MUTATION',
    'URL_CONTEXT ≠ PERSISTED_SOURCE_STATE · ROLE_LENS ≠ ACCESS_CONTROL · ROLE_EMPHASIS ≠ FILTER ≠ REVIEW_PRIORITY · ROLE_GUIDANCE ≠ REVIEW_OUTCOME · ROLE_LENS ≠ SOURCE_MUTATION · SAME_EVIDENCE_SET_ACROSS_ROLES · READ_ONLY · NO_SOURCE_MUTATION',
    'integrity boundary'
)

replace_once(
    "  const REVIEW_V103_COMPAT='DATA ROOM · REVIEW WORKSPACE V103 · Circuito de revisión, con contexto operativo y navegación de etapas';\n",
    "  const REVIEW_V103_COMPAT='DATA ROOM · REVIEW WORKSPACE V103 · Circuito de revisión, con contexto operativo y navegación de etapas';\n  const REVIEW_V104_COMPAT='DATA ROOM · REVIEW WORKSPACE V104 · Circuito de revisión, con contexto reproducible y navegación de etapas';\n  const REVIEW_ROLE_LENSES=Object.freeze({\n    admin:Object.freeze({label:'Gobernanza',headline:'Integridad y consistencia del circuito',summary:'Lee disponibilidad de fuentes, schema, referencias, ambigüedad y contexto sin convertir señales documentales en fallas automáticas.',cues:Object.freeze(['Revisar procedencia y estado técnico de las fuentes','Localizar referencias ambiguas o no resueltas','Mantener separadas gobernanza, suficiencia y decisión'])}),\n    technical:Object.freeze({label:'Técnica',headline:'Trazabilidad y procedencia para revisión humana',summary:'Prioriza eventos, referencias y vínculo con el caso fuente. La proyección ayuda a revisar; no diagnostica ni reemplaza criterio técnico.',cues:Object.freeze(['Contrastar secuencia observada con el ledger fuente','Revisar referencias internas antes de interpretar hallazgos','Mantener causalidad y eficacia fuera de inferencias automáticas'])}),\n    investor:Object.freeze({label:'Contraparte',headline:'Evidencia, alcance y límites de lectura',summary:'Orienta la lectura hacia procedencia, disponibilidad y brechas documentales sin transformar el expediente en score, elegibilidad o recomendación.',cues:Object.freeze(['Distinguir evidencia presente de suficiencia o verificación','Leer contexto no resuelto como incertidumbre documental','Separar trazabilidad de decisión, oferta o ejecución financiera'])}),\n    producer:Object.freeze({label:'Productor',headline:'Memoria documental del proceso de revisión',summary:'Explica qué referencias del expediente pueden reconstruirse y dónde está su fuente, sin cambiar actividades ni sustituir acompañamiento humano.',cues:Object.freeze(['Ubicar qué etapa está documentada','Reconocer cuándo una fuente no está disponible','Volver al registro fuente para comprender el contexto'])}),\n    visitor:Object.freeze({label:'Visitante',headline:'Recorrido explicativo de la evidencia',summary:'Presenta el circuito como una lectura demostrativa y no operativa. Ninguna etapa visible concede permisos ni implica aprobación.',cues:Object.freeze(['Seguir procedencia sin editar','Distinguir presencia de completitud','Entender las fronteras read-only del Data Room'])}),\n    new_user:Object.freeze({label:'Onboarding',headline:'Lectura inicial sin privilegios adicionales',summary:'Introduce el circuito y sus fuentes sin convertir una cuenta nueva en rol operativo ni ampliar acceso.',cues:Object.freeze(['Comprender las seis etapas de referencia','Reconocer límites de acceso y contexto','Usar el expediente solo como lectura'])})\n  });\n",
    'role lens constants'
)

replace_once(
    '  function reviewStageNavigation(s,focus){\n',
    "  function reviewRoleLens(role=currentRole()){\n    const key=Object.prototype.hasOwnProperty.call(REVIEW_ROLE_LENSES,role)?role:'new_user',cfg=REVIEW_ROLE_LENSES[key];\n    return {role:key,label:cfg.label,headline:cfg.headline,summary:cfg.summary,cues:[...cfg.cues],evidenceScope:'UNCHANGED',permissionEffect:'NONE',filterEffect:'NONE',integrity:'ROLE_LENS ≠ ACCESS_CONTROL · ROLE_EMPHASIS ≠ FILTER ≠ REVIEW_PRIORITY · ROLE_GUIDANCE ≠ REVIEW_OUTCOME · ROLE_LENS ≠ SOURCE_MUTATION · SAME_EVIDENCE_SET_ACROSS_ROLES'};\n  }\n  function reviewStageNavigation(s,focus){\n",
    'role lens function'
)

replace_once(
    '        permalink:reviewContextPermalink(focus),\n        integrity:REVIEW_CONTEXT_INTEGRITY',
    '        permalink:reviewContextPermalink(focus),\n        roleLens:reviewRoleLens(),\n        integrity:REVIEW_CONTEXT_INTEGRITY',
    'summary role lens'
)

replace_once(
    '  function reviewContextSummaryHtml(x){\n',
    "  function reviewRoleLensHtml(lens){\n    if(!lens)return '';\n    return `<div data-review-role-lens data-review-role=\"${esc(lens.role)}\" style=\"margin-top:9px;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fbfcfa\"><div style=\"display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap\"><div style=\"display:grid;gap:3px;min-width:0;flex:1\"><span style=\"font-size:6px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)\">LENTE DE LECTURA · ${esc(lens.label)}</span><strong style=\"font-size:9px\">${esc(lens.headline)}</strong><small style=\"font-size:7px;line-height:1.45;color:var(--muted)\">${esc(lens.summary)}</small></div><span class=\"status\">EMPHASIS ONLY</span></div><div style=\"display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px\">${lens.cues.map(c=>`<div style=\"padding:7px 8px;border:1px dashed var(--line);border-radius:8px;background:#fff;font-size:7px;line-height:1.4;color:var(--ink2)\">${esc(c)}</div>`).join('')}</div><div style=\"margin-top:7px;font-size:6px;color:var(--muted)\">ROLE_LENS ≠ ACCESS_CONTROL · ROLE_EMPHASIS ≠ FILTER ≠ REVIEW_PRIORITY · ROLE_GUIDANCE ≠ REVIEW_OUTCOME · SAME_EVIDENCE_SET_ACROSS_ROLES</div></div>`;\n  }\n  function reviewContextSummaryHtml(x){\n",
    'role lens html'
)

replace_once(
    '    return `<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><section data-review-context-summary',
    '    return `<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><section data-review-context-summary',
    'compat marker'
)

replace_once(
    "${reviewContextChip('Referencia',x.ref||'Sin foco',!!x.ref,x.resolved)}</div>${reviewStageSwitcherHtml(x.stageNavigation)}",
    "${reviewContextChip('Referencia',x.ref||'Sin foco',!!x.ref,x.resolved)}</div>${reviewRoleLensHtml(x.roleLens)}${reviewStageSwitcherHtml(x.stageNavigation)}",
    'role lens placement'
)

replace_once(
    "    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V104').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con contexto reproducible y navegación de etapas');",
    "    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V105').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con lente por rol y contexto reproducible');",
    'visible v105 title'
)

replace_once(
    'permalink:reviewContextPermalink,copyPermalink:copyReviewContextPermalink,integrity:REVIEW_CONTEXT_INTEGRITY',
    'permalink:reviewContextPermalink,copyPermalink:copyReviewContextPermalink,roleLens:reviewRoleLens,integrity:REVIEW_CONTEXT_INTEGRITY',
    'public api role lens'
)

path.write_text(text)
