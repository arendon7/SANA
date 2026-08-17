(() => {
  'use strict';

  const READY='LISTO_PARA_NUEVO_CORTE';
  const JUSTIFIED='NO_APLICA_JUSTIFICADO';
  const TERMINAL_FOR_REVIEW=new Set([READY,JUSTIFIED]);

  function gapsApi(){return window.__SANA_DUE_DILIGENCE_GAPS__}
  function remediationApi(){return window.__SANA_DUE_DILIGENCE_REMEDIATION__}
  function freshnessApi(){return window.__SANA_SNAPSHOT_FRESHNESS__}

  function state(){
    const gapsState=gapsApi()?.current?.();
    if(!gapsState?.valid)return {valid:false,state:'NO_SNAPSHOT',snapshot:null,gaps:[],items:[],readyForHumanReview:false};
    const snapshot=gapsState.snapshot;
    const gaps=gapsState.gaps||[];
    const items=(remediationApi()?.forSnapshot?.(snapshot.id)||[]);
    const latest=new Map();
    items.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).forEach(item=>{if(!latest.has(item.gapId))latest.set(item.gapId,item)});
    const rows=gaps.map(g=>{
      const item=latest.get(g.id)||null;
      const status=item?.status||'SIN_PLAN';
      const terminal=TERMINAL_FOR_REVIEW.has(status);
      return {gap:g,item,status,terminal,high:g.severity==='ALTA'};
    });
    const highTotal=rows.filter(r=>r.high).length;
    const highPrepared=rows.filter(r=>r.high&&r.terminal).length;
    const allPrepared=rows.filter(r=>r.terminal).length;
    const withoutPlan=rows.filter(r=>r.status==='SIN_PLAN').length;
    const waiting=rows.filter(r=>r.status==='ESPERANDO_EVIDENCIA').length;
    const active=rows.filter(r=>r.status==='EN_CURSO').length;
    const pending=rows.filter(r=>r.status==='PENDIENTE').length;
    const freshness=freshnessApi()?.state?.()||null;
    const readyForHumanReview=gaps.length===0||(
      highPrepared===highTotal&&
      withoutPlan===0&&
      active===0&&
      waiting===0&&
      pending===0
    );
    const cutState=gaps.length===0?'NO_GAPS_AT_SNAPSHOT':readyForHumanReview?'READY_FOR_HUMAN_CUT_REVIEW':'NOT_READY_FOR_NEW_CUT';
    return {valid:true,state:cutState,snapshot,gaps,items,rows,highTotal,highPrepared,allPrepared,withoutPlan,waiting,active,pending,freshness,readyForHumanReview,integrity:'CUT_PREP_ONLY · READY_FOR_HUMAN_REVIEW ≠ SNAPSHOT_CREATED ≠ GAP_RESOLVED ≠ INVESTMENT_READY'};
  }

  function tone(status){return TERMINAL_FOR_REVIEW.has(status)?'teal':status==='SIN_PLAN'||status==='PENDIENTE'?'danger':'warn'}
  function label(status){return String(status||'SIN_PLAN').replaceAll('_',' ')}
  function checklistPanel(){
    const s=state();
    if(!s.valid)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">PREPARACIÓN DE NUEVO CORTE</p><h2>Sin snapshot base compatible</h2><p>El checklist requiere una Matriz de Brechas derivada de un corte Due Diligence registrado.</p></div><span class="status warn">NO DISPONIBLE</span></div></section>`;
    const canSnapshot=Boolean(window.__SANA_ACCESS__?.canAction?.('report-snapshot'));
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">PREPARACIÓN DE NUEVO CORTE · HUMAN REVIEW</p><h2>${s.readyForHumanReview?'Expediente preparado para revisión de nuevo corte':'Aún existen acciones antes de re-evaluar'}</h2><p>Evalúa únicamente si el trabajo de remediación está en condición de ser medido otra vez. No decide que la brecha desapareció.</p></div><span class="status ${s.readyForHumanReview?'teal':'warn'}">${s.state.replaceAll('_',' ')}</span></div><div class="card-body"><div class="grid metrics">${metric('Brechas históricas',s.gaps.length,'permanecen en el snapshot')}${metric('Altas preparadas',`${s.highPrepared}/${s.highTotal}`,'LISTO PARA NUEVO CORTE / NO APLICA JUSTIFICADO',s.highPrepared===s.highTotal?'good':'warn')}${metric('Sin plan',s.withoutPlan,'requieren remediation item',s.withoutPlan?'warn':'good')}${metric('Trabajo abierto',s.active+s.waiting+s.pending,`${s.active} en curso · ${s.waiting} esperando evidencia · ${s.pending} pendientes`,s.active+s.waiting+s.pending?'warn':'good')}</div><div class="section-note" style="margin-top:12px"><strong>Regla:</strong> READY_FOR_HUMAN_REVIEW ≠ SNAPSHOT_CREATED ≠ GAP_RESOLVED ≠ INVESTMENT_READY. El checklist no crea un snapshot, no cambia Capital Readiness y no usa esta señal como elegibilidad.</div>${s.readyForHumanReview&&canSnapshot?`<div class="head-actions" style="margin-top:12px"><button class="btn primary" data-report-snapshot>Considerar nuevo snapshot DEMO</button></div>`:''}</div></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Checklist por brecha</h2><p>La condición terminal significa “lista para re-evaluación”, nunca “resuelta”.</p></div></div><div class="card-body">${s.rows.length?s.rows.map(r=>`<div class="row"><span class="dot ${r.high?'danger':''}"></span><div class="copy"><strong>${esc(r.gap.domain)} · ${esc(r.gap.entity)}</strong><span>${esc(r.gap.condition)}</span><small>${r.item?`Responsable ${esc(r.item.owner||r.gap.owner)} · objetivo ${esc(r.item.dueDate||'sin fecha')}`:`Sin remediation item`}</small></div><div class="meta"><span class="status ${tone(r.status)}">${esc(label(r.status))}</span></div></div>`).join(''):'<div class="empty">El snapshot no contiene brechas según la matriz actual. Un nuevo corte sigue siendo una decisión humana basada en necesidad informativa, no una obligación automática.</div>'}</div></section>`;
  }

  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}
  const baseReports=views.reports;
  if(baseReports)views.reports=function reportsWithNextCut(){return insertBeforeFooter(baseReports(),checklistPanel())};

  window.__SANA_DD_NEXT_CUT__=Object.freeze({state,integrity:'CUT_PREP_ONLY · READY_FOR_HUMAN_REVIEW ≠ SNAPSHOT_CREATED ≠ GAP_RESOLVED ≠ INVESTMENT_READY'});
})();
