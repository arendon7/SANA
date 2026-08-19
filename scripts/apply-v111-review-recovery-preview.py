from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

entry=entry.replace("COMPOSITE_CONTEXT_RESET ≠ SOURCE_LOSS · READ_ONLY · NO_SOURCE_MUTATION", "COMPOSITE_CONTEXT_RESET ≠ SOURCE_LOSS · RECOVERY_PREVIEW ≠ RECOVERY_EXECUTION · PREVIEW_PATH ≠ SOURCE_STATE · SELECTOR_IMPACT ≠ DATA_IMPACT · DETAILS_OPEN ≠ REVIEW_DECISION · PRESERVED_SELECTOR ≠ VERIFIED_CONTEXT · READ_ONLY · NO_SOURCE_MUTATION")
entry=entry.replace("  const REVIEW_V110_COMPAT='DATA ROOM · REVIEW WORKSPACE V110 · Circuito de revisión, con recuperación granular de contexto URL';", "  const REVIEW_V110_COMPAT='DATA ROOM · REVIEW WORKSPACE V110 · Circuito de revisión, con recuperación granular de contexto URL';\n  const REVIEW_V111_COMPAT='DATA ROOM · REVIEW WORKSPACE V111 · Circuito de revisión, con vista previa del impacto URL';")

anchor="""  function reviewRecoveryPlan(issues=[]){
    const seen=new Set();
    return (issues||[]).filter(issue=>issue&&REVIEW_RECOVERY_RULES[issue.key]&&!seen.has(issue.key)&&seen.add(issue.key)).map(issue=>{
      const rule=REVIEW_RECOVERY_RULES[issue.key];
      return {issueKey:issue.key,value:String(issue.value||''),detail:String(issue.detail||''),label:rule.label,keys:[...rule.keys],integrity:'CONTEXT_RECOVERY ≠ DATA_REMEDIATION · URL_ISSUE_CLEAR ≠ SOURCE_ISSUE_RESOLUTION · URL_SELECTOR_CLEAR ≠ SOURCE_MUTATION'};
    });
  }
"""
replacement="""  function reviewRecoveryPreview(issueKey='ALL',href=location.href){
    try{
      const keys=issueKey==='ALL'?[...REVIEW_CONTEXT_KEYS]:[...(REVIEW_RECOVERY_RULES[issueKey]?.keys||[])];
      if(!keys.length)return {valid:false,issueKey,clears:[],preserves:[],unrelatedPreserved:[],beforePath:'',afterPath:''};
      const before=new URL(href),after=new URL(href);
      const canonicalPresent=REVIEW_CONTEXT_KEYS.filter(key=>before.searchParams.has(key));
      const unrelated=[...new Set([...before.searchParams.keys()].filter(key=>!REVIEW_CONTEXT_KEYS.includes(key)))];
      keys.forEach(key=>after.searchParams.delete(key));
      return {valid:true,issueKey,clears:keys.filter(key=>before.searchParams.has(key)),preserves:canonicalPresent.filter(key=>!keys.includes(key)),unrelatedPreserved:unrelated,beforePath:`${before.pathname}${before.search}${before.hash||'#dataroom'}`,afterPath:`${after.pathname}${after.search}${after.hash||'#dataroom'}`,sourceEffect:'NONE',integrity:'RECOVERY_PREVIEW ≠ RECOVERY_EXECUTION · PREVIEW_PATH ≠ SOURCE_STATE · SELECTOR_IMPACT ≠ DATA_IMPACT · PRESERVED_SELECTOR ≠ VERIFIED_CONTEXT'};
    }catch{return {valid:false,issueKey,clears:[],preserves:[],unrelatedPreserved:[],beforePath:'',afterPath:''}}
  }
  function reviewRecoveryPlan(issues=[]){
    const seen=new Set();
    return (issues||[]).filter(issue=>issue&&REVIEW_RECOVERY_RULES[issue.key]&&!seen.has(issue.key)&&seen.add(issue.key)).map(issue=>{
      const rule=REVIEW_RECOVERY_RULES[issue.key];
      return {issueKey:issue.key,value:String(issue.value||''),detail:String(issue.detail||''),label:rule.label,keys:[...rule.keys],preview:reviewRecoveryPreview(issue.key),integrity:'CONTEXT_RECOVERY ≠ DATA_REMEDIATION · URL_ISSUE_CLEAR ≠ SOURCE_ISSUE_RESOLUTION · URL_SELECTOR_CLEAR ≠ SOURCE_MUTATION'};
    });
  }
"""
if anchor not in entry: raise SystemExit('recovery plan anchor missing')
entry=entry.replace(anchor,replacement,1)

old_summary="""        recovery:reviewRecoveryPlan(context.issues||[]),
        liveText:reviewLiveContext({stage:focus.stage||'ALL',stageLabel:focus.stage==='ALL'?'Todas':REVIEW_STAGE_LABELS[focus.stage]||focus.stage||'—',resolved:context.resolved!==false,issueCount:context.issues?.length||0,visibleChains:visible.length}),
"""
new_summary="""        recovery:reviewRecoveryPlan(context.issues||[]),
        recoveryAll:reviewRecoveryPreview('ALL'),
        liveText:reviewLiveContext({stage:focus.stage||'ALL',stageLabel:focus.stage==='ALL'?'Todas':REVIEW_STAGE_LABELS[focus.stage]||focus.stage||'—',resolved:context.resolved!==false,issueCount:context.issues?.length||0,visibleChains:visible.length}),
"""
if old_summary not in entry: raise SystemExit('summary preview anchor missing')
entry=entry.replace(old_summary,new_summary,1)

old_html="""  function reviewContextRecoveryHtml(actions=[]){
    if(!actions.length)return '';
    return `<div data-review-context-recovery style=\"margin-top:9px;padding:9px;border:1px solid #e3d7b6;border-radius:10px;background:#fffdf7\"><div style=\"display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap\"><div><strong style=\"font-size:8px\">RECUPERACIÓN DE CONTEXTO · URL ONLY</strong><div style=\"font-size:6px;color:var(--muted);margin-top:2px\">Elige qué selector no resuelto retirar. No modifica fuentes ni corrige datos.</div></div><button type=\"button\" class=\"btn ghost\" data-review-context-recover=\"ALL\">Restablecer contexto</button></div><div class=\"review-context-recovery-actions\" style=\"display:flex;gap:6px;flex-wrap:wrap;margin-top:7px\">${actions.map(action=>`<button type=\"button\" class=\"btn ghost\" data-review-context-recover=\"${esc(action.issueKey)}\" title=\"${esc(action.detail)}\">${esc(action.label)} · ${esc(action.value||'—')}</button>`).join('')}</div><div style=\"margin-top:6px;font-size:6px;color:var(--muted)\">CONTEXT_RECOVERY ≠ DATA_REMEDIATION · URL_ISSUE_CLEAR ≠ SOURCE_ISSUE_RESOLUTION · URL_SELECTOR_CLEAR ≠ SOURCE_MUTATION</div></div>`;
  }
"""
new_html="""  function reviewRecoveryPreviewHtml(preview,buttonLabel='Aplicar limpieza URL'){
    if(!preview?.valid)return '';
    const list=items=>items.length?items.map(item=>`<code>${esc(item)}</code>`).join(' · '):'<span>ninguno</span>';
    return `<div data-review-recovery-preview-body style=\"display:grid;gap:6px;padding:8px 9px;border-top:1px solid var(--line);font-size:7px\"><div><strong>Se retirarán:</strong> ${list(preview.clears)}</div><div><strong>Se conservarán:</strong> ${list(preview.preserves)}</div><div><strong>Queries ajenas preservadas:</strong> ${list(preview.unrelatedPreserved)}</div><div style=\"display:grid;gap:3px\"><strong>Ruta resultante:</strong><code style=\"white-space:normal;overflow-wrap:anywhere;color:var(--muted)\">${esc(preview.afterPath)}</code></div><button type=\"button\" class=\"btn ghost\" data-review-context-recover=\"${esc(preview.issueKey)}\">${esc(buttonLabel)}</button><div style=\"font-size:6px;color:var(--muted)\">RECOVERY_PREVIEW ≠ RECOVERY_EXECUTION · PREVIEW_PATH ≠ SOURCE_STATE · SELECTOR_IMPACT ≠ DATA_IMPACT</div></div>`;
  }
  function reviewContextRecoveryHtml(actions=[],allPreview=null){
    if(!actions.length)return '';
    const actionHtml=actions.map(action=>`<details data-review-context-recovery-preview=\"${esc(action.issueKey)}\" class=\"review-context-recovery-preview\"><summary>${esc(action.label)} · ${esc(action.value||'—')}</summary>${reviewRecoveryPreviewHtml(action.preview)}</details>`).join('');
    const allHtml=allPreview?.valid?`<details data-review-context-recovery-preview=\"ALL\" class=\"review-context-recovery-preview\"><summary>Restablecer contexto</summary>${reviewRecoveryPreviewHtml(allPreview,'Restablecer contexto URL')}</details>`:'';
    return `<div data-review-context-recovery style=\"margin-top:9px;padding:9px;border:1px solid #e3d7b6;border-radius:10px;background:#fffdf7\"><div><strong style=\"font-size:8px\">RECUPERACIÓN DE CONTEXTO · URL ONLY</strong><div style=\"font-size:6px;color:var(--muted);margin-top:2px\">Abre una opción para previsualizar exactamente qué cambia antes de limpiar selectores URL. No modifica fuentes ni corrige datos.</div></div><div class=\"review-context-recovery-actions\" style=\"display:grid;gap:6px;margin-top:7px\">${actionHtml}${allHtml}</div><div style=\"margin-top:6px;font-size:6px;color:var(--muted)\">DETAILS_OPEN ≠ REVIEW_DECISION · CONTEXT_RECOVERY ≠ DATA_REMEDIATION · URL_SELECTOR_CLEAR ≠ SOURCE_MUTATION</div></div>`;
  }
"""
if old_html not in entry: raise SystemExit('recovery html anchor missing')
entry=entry.replace(old_html,new_html,1)

old_call="""${reviewContextRecoveryHtml(x.recovery)}${reviewRoleLensHtml(x.roleLens)}"""
new_call="""${reviewContextRecoveryHtml(x.recovery,x.recoveryAll)}${reviewRoleLensHtml(x.roleLens)}"""
if old_call not in entry: raise SystemExit('recovery html call anchor missing')
entry=entry.replace(old_call,new_call,1)

old_compat='<!-- ${REVIEW_V108_COMPAT} --><!-- ${REVIEW_V109_COMPAT} --><!-- ${REVIEW_V110_COMPAT} --><section data-review-context-summary'
new_compat='<!-- ${REVIEW_V108_COMPAT} --><!-- ${REVIEW_V109_COMPAT} --><!-- ${REVIEW_V110_COMPAT} --><!-- ${REVIEW_V111_COMPAT} --><section data-review-context-summary'
if old_compat not in entry: raise SystemExit('V111 compat anchor missing')
entry=entry.replace(old_compat,new_compat,1)

old_title="""    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V110').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con recuperación URL y continuidad de foco');
    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con recuperación URL y continuidad de foco</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con recuperación URL y continuidad de foco</h2>');
"""
new_title="""    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V111').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con vista previa y recuperación URL');
    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con vista previa y recuperación URL</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con vista previa y recuperación URL</h2>');
"""
if old_title not in entry: raise SystemExit('V111 title anchor missing')
entry=entry.replace(old_title,new_title,1)

old_export="""liveContext:reviewLiveContext,recoveryPlan:reviewRecoveryPlan,recoverContext:applyReviewRecovery,integrity:REVIEW_CONTEXT_INTEGRITY"""
new_export="""liveContext:reviewLiveContext,recoveryPreview:reviewRecoveryPreview,recoveryPlan:reviewRecoveryPlan,recoverContext:applyReviewRecovery,integrity:REVIEW_CONTEXT_INTEGRITY"""
if old_export not in entry: raise SystemExit('V111 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V111 · Recovery preview */' not in css:
    css += """

/* V111 · Recovery preview */
.review-context-recovery-preview{border:1px solid var(--line);border-radius:9px;background:#fff;overflow:hidden}.review-context-recovery-preview summary{cursor:pointer;padding:8px 9px;font-size:7px;font-weight:700;list-style-position:inside}.review-context-recovery-preview summary:focus-visible{outline:3px solid rgba(42,123,115,.24);outline-offset:-3px}.review-context-recovery-preview[open] summary{background:#fbfcfa}.review-context-recovery-preview code{font-size:6px}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V111 recovery preview patch applied')
