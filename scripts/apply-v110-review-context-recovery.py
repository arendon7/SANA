from pathlib import Path

entry_path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
css_path=Path('apps/control-web/public/sana-v3-review-workspace.css')
entry=entry_path.read_text()
css=css_path.read_text()

entry=entry.replace("KEYBOARD_FOCUS ≠ REVIEW_PRIORITY · READ_ONLY · NO_SOURCE_MUTATION", "KEYBOARD_FOCUS ≠ REVIEW_PRIORITY · CONTEXT_RECOVERY ≠ DATA_REMEDIATION · URL_ISSUE_CLEAR ≠ SOURCE_ISSUE_RESOLUTION · URL_SELECTOR_CLEAR ≠ SOURCE_MUTATION · RECOVERY_CHOICE ≠ REVIEW_DECISION · COMPOSITE_CONTEXT_RESET ≠ SOURCE_LOSS · READ_ONLY · NO_SOURCE_MUTATION")
entry=entry.replace("  const REVIEW_V109_COMPAT='DATA ROOM · REVIEW WORKSPACE V109 · Circuito de revisión, con continuidad de foco y contexto anunciado';", "  const REVIEW_V109_COMPAT='DATA ROOM · REVIEW WORKSPACE V109 · Circuito de revisión, con continuidad de foco y contexto anunciado';\n  const REVIEW_V110_COMPAT='DATA ROOM · REVIEW WORKSPACE V110 · Circuito de revisión, con recuperación granular de contexto URL';\n  const REVIEW_RECOVERY_RULES=Object.freeze({rwCapital:Object.freeze({label:'Quitar capital case',keys:Object.freeze(['rwCapital'])}),rwLot:Object.freeze({label:'Quitar lote',keys:Object.freeze(['rwLot'])}),rwContext:Object.freeze({label:'Restablecer combinación',keys:Object.freeze(['rwCapital','rwLot','rwStage','rwEvent','rwRef'])}),rwStage:Object.freeze({label:'Quitar etapa',keys:Object.freeze(['rwStage','rwEvent'])}),rwEvent:Object.freeze({label:'Quitar evento',keys:Object.freeze(['rwEvent'])}),rwRef:Object.freeze({label:'Quitar referencia',keys:Object.freeze(['rwRef'])})});")

anchor="""  function reviewLiveContext(x){
    if(!x)return '';
    const stage=x.stage&&x.stage!=='ALL'?(x.stageLabel||x.stage):'Todas las etapas';
    const resolution=x.resolved? 'contexto resuelto' : `contexto con ${x.issueCount||0} selector(es) no resuelto(s)`;
    return `Contexto de revisión: ${stage}; ${resolution}; ${x.visibleChains||0} circuito(s) visible(s).`;
  }
"""
addition=anchor+"""  function reviewRecoveryPlan(issues=[]){
    const seen=new Set();
    return (issues||[]).filter(issue=>issue&&REVIEW_RECOVERY_RULES[issue.key]&&!seen.has(issue.key)&&seen.add(issue.key)).map(issue=>{
      const rule=REVIEW_RECOVERY_RULES[issue.key];
      return {issueKey:issue.key,value:String(issue.value||''),detail:String(issue.detail||''),label:rule.label,keys:[...rule.keys],integrity:'CONTEXT_RECOVERY ≠ DATA_REMEDIATION · URL_ISSUE_CLEAR ≠ SOURCE_ISSUE_RESOLUTION · URL_SELECTOR_CLEAR ≠ SOURCE_MUTATION'};
    });
  }
  function applyReviewRecovery(issueKey='ALL'){
    try{
      const keys=issueKey==='ALL'?[...REVIEW_CONTEXT_KEYS]:[...(REVIEW_RECOVERY_RULES[issueKey]?.keys||[])];
      if(!keys.length)return {applied:false,issueKey,cleared:[]};
      const u=new URL(location.href);
      keys.forEach(key=>u.searchParams.delete(key));
      history.replaceState(null,'',`${u.pathname}${u.search}${u.hash||'#dataroom'}`);
      if(typeof render==='function')render();
      if(typeof queueMicrotask==='function')queueMicrotask(()=>focusReviewWorkspace({scroll:false}));
      return {applied:true,issueKey,cleared:keys,path:`${u.pathname}${u.search}${u.hash||'#dataroom'}`,integrity:'RECOVERY_CHOICE ≠ REVIEW_DECISION · COMPOSITE_CONTEXT_RESET ≠ SOURCE_LOSS'};
    }catch{return {applied:false,issueKey,cleared:[]}}
  }
"""
if anchor not in entry: raise SystemExit('live context anchor missing')
entry=entry.replace(anchor,addition,1)

old="""        humanGuide:reviewRoleStageGuide(currentRole(),focus.stage||'ALL'),
        liveText:reviewLiveContext({stage:focus.stage||'ALL',stageLabel:focus.stage==='ALL'?'Todas':REVIEW_STAGE_LABELS[focus.stage]||focus.stage||'—',resolved:context.resolved!==false,issueCount:context.issues?.length||0,visibleChains:visible.length}),
        integrity:REVIEW_CONTEXT_INTEGRITY
"""
new="""        humanGuide:reviewRoleStageGuide(currentRole(),focus.stage||'ALL'),
        issues:(context.issues||[]).map(issue=>({...issue})),
        recovery:reviewRecoveryPlan(context.issues||[]),
        liveText:reviewLiveContext({stage:focus.stage||'ALL',stageLabel:focus.stage==='ALL'?'Todas':REVIEW_STAGE_LABELS[focus.stage]||focus.stage||'—',resolved:context.resolved!==false,issueCount:context.issues?.length||0,visibleChains:visible.length}),
        integrity:REVIEW_CONTEXT_INTEGRITY
"""
if old not in entry: raise SystemExit('summary recovery anchor missing')
entry=entry.replace(old,new,1)

html_anchor="""  function reviewRoleLensHtml(lens){
    if(!lens)return '';
    return `<div data-review-role-lens data-review-role=\"${esc(lens.role)}\""""
if html_anchor not in entry: raise SystemExit('role lens html anchor missing')
recovery_html="""  function reviewContextRecoveryHtml(actions=[]){
    if(!actions.length)return '';
    return `<div data-review-context-recovery style=\"margin-top:9px;padding:9px;border:1px solid #e3d7b6;border-radius:10px;background:#fffdf7\"><div style=\"display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap\"><div><strong style=\"font-size:8px\">RECUPERACIÓN DE CONTEXTO · URL ONLY</strong><div style=\"font-size:6px;color:var(--muted);margin-top:2px\">Elige qué selector no resuelto retirar. No modifica fuentes ni corrige datos.</div></div><button type=\"button\" class=\"btn ghost\" data-review-context-recover=\"ALL\">Restablecer contexto</button></div><div class=\"review-context-recovery-actions\" style=\"display:flex;gap:6px;flex-wrap:wrap;margin-top:7px\">${actions.map(action=>`<button type=\"button\" class=\"btn ghost\" data-review-context-recover=\"${esc(action.issueKey)}\" title=\"${esc(action.detail)}\">${esc(action.label)} · ${esc(action.value||'—')}</button>`).join('')}</div><div style=\"margin-top:6px;font-size:6px;color:var(--muted)\">CONTEXT_RECOVERY ≠ DATA_REMEDIATION · URL_ISSUE_CLEAR ≠ SOURCE_ISSUE_RESOLUTION · URL_SELECTOR_CLEAR ≠ SOURCE_MUTATION</div></div>`;
  }
"""
entry=entry.replace(html_anchor,recovery_html+html_anchor,1)

old_html='<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><!-- ${REVIEW_V105_COMPAT} --><!-- ${REVIEW_V106_COMPAT} --><!-- ${REVIEW_V107_COMPAT} --><!-- ${REVIEW_V108_COMPAT} --><!-- ${REVIEW_V109_COMPAT} --><section data-review-context-summary class="review-context-summary" aria-label="Resumen de contexto de revisión"'
new_html='<!-- ${REVIEW_V102_COMPAT} --><!-- ${REVIEW_V103_COMPAT} --><!-- ${REVIEW_V104_COMPAT} --><!-- ${REVIEW_V105_COMPAT} --><!-- ${REVIEW_V106_COMPAT} --><!-- ${REVIEW_V107_COMPAT} --><!-- ${REVIEW_V108_COMPAT} --><!-- ${REVIEW_V109_COMPAT} --><!-- ${REVIEW_V110_COMPAT} --><section data-review-context-summary class="review-context-summary" aria-label="Resumen de contexto de revisión"'
if old_html not in entry: raise SystemExit('compat v110 html anchor missing')
entry=entry.replace(old_html,new_html,1)

old_sections="""</div>${reviewRoleLensHtml(x.roleLens)}${reviewHumanGuideHtml(x.humanGuide)}${reviewStageSwitcherHtml(x.stageNavigation)}${reviewContextPermalinkHtml(x.permalink)}<div class=\"section-note\""""
new_sections="""</div>${reviewContextRecoveryHtml(x.recovery)}${reviewRoleLensHtml(x.roleLens)}${reviewHumanGuideHtml(x.humanGuide)}${reviewStageSwitcherHtml(x.stageNavigation)}${reviewContextPermalinkHtml(x.permalink)}<div class=\"section-note\""""
if old_sections not in entry: raise SystemExit('recovery html placement anchor missing')
entry=entry.replace(old_sections,new_sections,1)

old_title="""    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V109').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con continuidad de foco y contexto anunciado');
    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con continuidad de foco y contexto anunciado</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con continuidad de foco y contexto anunciado</h2>');
"""
new_title="""    out=out.replace('DATA ROOM · REVIEW WORKSPACE V101','DATA ROOM · REVIEW WORKSPACE V110').replace('Circuito de revisión, con navegación bidireccional al caso fuente','Circuito de revisión, con recuperación URL y continuidad de foco');
    out=out.replace('<section id=\"review-workspace\" class=\"card review-workspace\">','<section id=\"review-workspace\" class=\"card review-workspace\" tabindex=\"-1\" aria-labelledby=\"review-workspace-title\">').replace('<h2>Circuito de revisión, con recuperación URL y continuidad de foco</h2>','<h2 id=\"review-workspace-title\">Circuito de revisión, con recuperación URL y continuidad de foco</h2>');
"""
if old_title not in entry: raise SystemExit('v110 title anchor missing')
entry=entry.replace(old_title,new_title,1)

old_click="""      const copy=e.target.closest?.('[data-review-context-copy]');
      if(copy){copyReviewContextPermalink().then(result=>{const status=document.querySelector?.('[data-review-context-copy-status]');if(status)status.textContent=result.copied?'Enlace copiado localmente':'Copia no disponible · enlace visible';});return}
"""
new_click="""      const recovery=e.target.closest?.('[data-review-context-recover]');
      if(recovery){applyReviewRecovery(recovery.dataset.reviewContextRecover||'ALL');return}
      const copy=e.target.closest?.('[data-review-context-copy]');
      if(copy){copyReviewContextPermalink().then(result=>{const status=document.querySelector?.('[data-review-context-copy-status]');if(status)status.textContent=result.copied?'Enlace copiado localmente':'Copia no disponible · enlace visible';});return}
"""
if old_click not in entry: raise SystemExit('recovery click anchor missing')
entry=entry.replace(old_click,new_click,1)

old_export="""focusStage:focusReviewStage,liveContext:reviewLiveContext,integrity:REVIEW_CONTEXT_INTEGRITY"""
new_export="""focusStage:focusReviewStage,liveContext:reviewLiveContext,recoveryPlan:reviewRecoveryPlan,recoverContext:applyReviewRecovery,integrity:REVIEW_CONTEXT_INTEGRITY"""
if old_export not in entry: raise SystemExit('v110 export anchor missing')
entry=entry.replace(old_export,new_export,1)

if '/* V110 · Context recovery */' not in css:
    css += """

/* V110 · Context recovery */
.review-context-recovery-actions .btn{max-width:100%;overflow-wrap:anywhere}.review-context-recovery-actions .btn:focus-visible{outline:3px solid rgba(42,123,115,.24);outline-offset:2px}
"""

entry_path.write_text(entry)
css_path.write_text(css)
print('V110 context recovery patch applied')
