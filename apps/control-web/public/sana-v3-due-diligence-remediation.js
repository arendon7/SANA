(() => {
  'use strict';

  const TYPE='dd-remediation';
  const STATUSES=['PENDIENTE','EN_CURSO','ESPERANDO_EVIDENCIA','LISTO_PARA_NUEVO_CORTE','NO_APLICA_JUSTIFICADO'];

  function gapApi(){return window.__SANA_DUE_DILIGENCE_GAPS__}
  function role(){return window.__SANA_ACCESS__?.role||'new_user'}
  function canManage(){return ['admin','technical','producer'].includes(role())&&window.__SANA_ACCESS__?.canAction?.(TYPE)!==false}
  function records(){return storage.records.filter(r=>r.type===TYPE).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}
  function forSnapshot(snapshotId){return records().filter(r=>r.values?.snapshotId===snapshotId)}
  function latestForGap(snapshotId,gapId){return forSnapshot(snapshotId).find(r=>r.values?.gapId===gapId)||null}
  function normalize(record){if(!record)return null;return {id:record.id,createdAt:record.createdAt,localOnly:true,...record.values}}
  function statusTone(status=''){return status==='LISTO_PARA_NUEVO_CORTE'?'teal':status==='EN_CURSO'||status==='ESPERANDO_EVIDENCIA'?'warn':status==='NO_APLICA_JUSTIFICADO'?'warn':''}
  function statusLabel(status=''){return String(status||'PENDIENTE').replaceAll('_',' ')}

  function planPanel(){
    const state=gapApi()?.current?.();
    if(!state?.valid)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">PLAN DE REMEDIACIÓN</p><h2>Sin matriz histórica activa</h2><p>Primero debe existir un snapshot Due Diligence compatible y su Matriz de Brechas.</p></div><span class="status warn">NO PLAN</span></div></section>`;
    const snapshotId=state.snapshot.id;
    const items=forSnapshot(snapshotId);
    const latestByGap=new Map();items.forEach(r=>{if(!latestByGap.has(r.values?.gapId))latestByGap.set(r.values?.gapId,r)});
    const ready=[...latestByGap.values()].filter(r=>r.values?.status==='LISTO_PARA_NUEVO_CORTE').length;
    const active=[...latestByGap.values()].filter(r=>['EN_CURSO','ESPERANDO_EVIDENCIA'].includes(r.values?.status)).length;
    const unplanned=state.gaps.filter(g=>!latestByGap.has(g.id)).length;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">PLAN DE REMEDIACIÓN · LOCAL_ONLY</p><h2>Trabajar la brecha sin reescribir el corte</h2><p>${esc(snapshotId)} · ${state.gaps.length} brecha(s) históricas. El seguimiento es operativo y mutable; el snapshot y sus brechas permanecen inmutables.</p></div><span class="status ${unplanned?'warn':'teal'}">${unplanned} SIN PLAN</span></div><div class="card-body"><div class="grid metrics">${metric('Brechas del snapshot',state.gaps.length,'históricas · read-only')}${metric('Sin plan',unplanned,'requieren responsable/acción',unplanned?'warn':'good')}${metric('En trabajo',active,'EN CURSO / ESPERANDO EVIDENCIA')}${metric('Listas para re-evaluar',ready,'requieren nuevo snapshot; no están “resueltas”',ready?'good':'warn')}</div><div class="section-note" style="margin-top:12px"><strong>Frontera:</strong> REMEDIATION_ITEM ≠ SNAPSHOT_GAP ≠ GAP_RESOLVED. LISTO_PARA_NUEVO_CORTE solo habilita una revisión posterior; no modifica el snapshot, no cambia readiness histórico y no prueba elegibilidad.</div></div></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Acciones por brecha</h2><p>El registro de seguimiento referencia la brecha original por snapshotId + gapId.</p></div></div><div class="card-body">${state.gaps.length?state.gaps.map(g=>{const rec=latestByGap.get(g.id);const v=rec?.values||{};return `<div class="row"><span class="dot ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':''}"></span><div class="copy"><strong>${esc(g.domain)} · ${esc(g.entity)}</strong><span>${esc(g.condition)}</span><small>${rec?`${esc(statusLabel(v.status))} · ${esc(v.owner||g.owner)} · objetivo ${esc(v.dueDate||'sin fecha')}`:`Sin plan · responsable funcional sugerido: ${esc(g.owner)}`}</small>${rec&&v.expectedEvidence?`<small>Evidencia/condición esperada: ${esc(v.expectedEvidence)}</small>`:''}</div><div class="meta"><span class="status ${rec?statusTone(v.status):'warn'}">${rec?esc(statusLabel(v.status)):'SIN PLAN'}</span>${canManage()?`<br><button class="text-btn" data-dd-remediation="${esc(g.id)}">${rec?'Actualizar plan':'Crear plan'}</button>`:''}</div></div>`}).join(''):'<div class="empty">No hay brechas que requieran plan bajo las reglas actuales. Esto no equivale a aprobación o ausencia de riesgo.</div>'}</div></section>`;
  }

  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}
  const baseReports=views.reports;
  if(baseReports)views.reports=function reportsWithRemediation(){return insertBeforeFooter(baseReports(),planPanel())};

  function openPlan(gapId){
    if(!canManage())return window.__SANA_ACCESS__?.deny?.('Este rol solo puede leer el plan de remediación.');
    const state=gapApi()?.current?.();if(!state?.valid)return;
    const gap=state.gaps.find(g=>g.id===gapId);if(!gap)return;
    const previous=latestForGap(state.snapshot.id,gap.id);const v=previous?.values||{};
    const statusOptions=STATUSES.map(s=>`<option value="${s}" ${s===(v.status||'PENDIENTE')?'selected':''}>${statusLabel(s)}</option>`).join('');
    openModal('DUE DILIGENCE · REMEDIACIÓN','Plan de trabajo de la brecha',`<div class="fields"><input type="hidden" name="snapshotId" value="${esc(state.snapshot.id)}"><input type="hidden" name="gapId" value="${esc(gap.id)}"><input type="hidden" name="gapDomain" value="${esc(gap.domain)}"><input type="hidden" name="gapSeverity" value="${esc(gap.severity)}"><label>Snapshot<input value="${esc(state.snapshot.id)}" readonly></label><label>Brecha<input value="${esc(gap.domain)} · ${esc(gap.entity)}" readonly></label><label>Estado<select name="status">${statusOptions}</select></label><label>Fecha objetivo<input name="dueDate" type="date" value="${esc(v.dueDate||'')}"></label><label>Responsable<input name="owner" value="${esc(v.owner||gap.owner)}" required></label><label>Procedencia<input value="${esc(gap.source)}" readonly></label><label class="full">Condición histórica<textarea readonly>${esc(gap.condition)}</textarea></label><label class="full">Acción / siguiente paso<textarea name="detail" required placeholder="Qué debe hacerse o verificarse antes de un nuevo corte">${esc(v.detail||'')}</textarea></label><label class="full">Evidencia o condición esperada para re-evaluar<textarea name="expectedEvidence" placeholder="Documento, soporte, revisión, cierre de actividad o verificación que debería existir en el siguiente snapshot">${esc(v.expectedEvidence||'')}</textarea></label><label class="full">Integridad<input value="LOCAL_ONLY · NO MODIFICA EL SNAPSHOT · NO MARCA LA BRECHA COMO RESUELTA" readonly></label></div>`,true,TYPE);
  }

  if(typeof document!=='undefined')document.addEventListener('click',event=>{const button=event.target.closest('[data-dd-remediation]');if(button)openPlan(button.dataset.ddRemediation)});

  window.__SANA_DUE_DILIGENCE_REMEDIATION__=Object.freeze({
    records:()=>records().map(normalize),
    forSnapshot:id=>forSnapshot(id).map(normalize),
    latestForGap:(snapshotId,gapId)=>normalize(latestForGap(snapshotId,gapId)),
    canManage,
    integrity:'REMEDIATION_LOCAL_ONLY · REMEDIATION_ITEM ≠ SNAPSHOT_GAP ≠ GAP_RESOLVED ≠ HISTORICAL_EVIDENCE'
  });
})();
