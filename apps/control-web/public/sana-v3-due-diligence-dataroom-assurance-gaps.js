(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Data Room / assurance documental';
  const OWNER='Administración + Legal + Gobierno documental';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};
  const INTEGRITY='SNAPSHOT_DATAROOM_ASSURANCE_GAPS_ONLY · NO_ASSURANCE_REQUEST ≠ GAP · ASSURANCE_OPEN ≠ GAP · VERIFIER_REFERENCE ≠ GAP · CHECK_SCOPE_DECLARED ≠ GAP · CHECK_EVIDENCE_REFERENCE ≠ GAP · RESULT_REFERENCE ≠ GAP · PASS_REFERENCE ≠ GAP · FAIL_REFERENCE ≠ GAP · INCONCLUSIVE_REFERENCE ≠ GAP · VALIDITY_WINDOW_REFERENCE ≠ GAP · ASSURANCE_SUPERSEDED ≠ GAP · ASSURANCE_CLOSED ≠ GAP · ASSURANCE_GAP ≠ FAILED_VERIFICATION ≠ DOCUMENT_INVALIDITY ≠ INVESTMENT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_DECISION · NO_LIVE_FALLBACK · NO_AUTOMATIC_APPROVAL · NO_OFFER · NO_SOLICITATION · NO_CUSTODY · NO_DISBURSEMENT';
  function rows(manifest){return Array.isArray(manifest?.dataroomAssurance?.rows)?manifest.dataroomAssurance.rows:[]}
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function deriveAssurance(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];
    const m=snapshot.manifest||{};
    if(!m.dataroomAssurance)return [gap('dataroom-assurance:granularity',m.farm?.id||'Unidad','Granularidad de assurance documental no capturada en este snapshot','Snapshot manifest · dataroomAssurance','BAJA','El corte sigue válido y puede ser anterior a Assurance V1. No se rellena desde estado vivo.')];
    const out=[];
    for(const r of rows(m)){
      const entity=`${r.caseId||'SIN_CASO'} · ${r.capitalCaseRef||'SIN_CAPITAL_CASE'}`;
      if(!r.caseId)out.push(gap('dataroom-assurance:missing-case',entity,'Caso de assurance sin caseId','Assurance Snapshot · caseId','ALTA'));
      if(!r.capitalCaseRef)out.push(gap(`dataroom-assurance:${r.caseId||'SIN_CASO'}:capital-case`,entity,'Caso de assurance sin capitalCaseRef','Assurance Snapshot · capitalCaseRef','MEDIA'));
      if(!r.accessCaseRef)out.push(gap(`dataroom-assurance:${r.caseId||'SIN_CASO'}:access-case`,entity,'Caso de assurance sin accessCaseRef trazable','Assurance Snapshot · accessCaseRef','MEDIA'));
      if(!r.exchangeCaseRef)out.push(gap(`dataroom-assurance:${r.caseId||'SIN_CASO'}:exchange-case`,entity,'Caso de assurance sin exchangeCaseRef','Assurance Snapshot · exchangeCaseRef','MEDIA'));
      if(!r.lot)out.push(gap(`dataroom-assurance:${r.caseId||'SIN_CASO'}:lot`,entity,'Caso de assurance sin lote','Assurance Snapshot · lot','MEDIA'));
      if(!r.snapshotRef)out.push(gap(`dataroom-assurance:${r.caseId||'SIN_CASO'}:snapshot-ref`,entity,'Caso de assurance sin snapshotRef','Assurance Snapshot · snapshotRef','MEDIA'));
      for(const ref of r.assignmentWithoutRequest||[])out.push(gap(`dataroom-assurance:${r.caseId}:assignment-without-request:${ref}`,entity,'Referencia de verificador sin solicitud de assurance trazable','Assurance Snapshot · assignmentWithoutRequest','MEDIA',ref));
      for(const ref of r.scopeWithoutAssignment||[])out.push(gap(`dataroom-assurance:${r.caseId}:scope-without-assignment:${ref}`,entity,'Alcance declarado sin referencia de verificador trazable','Assurance Snapshot · scopeWithoutAssignment','MEDIA',ref));
      for(const ref of r.checkWithoutScope||[])out.push(gap(`dataroom-assurance:${r.caseId}:check-without-scope:${ref}`,entity,'Referencia de evidencia de check sin alcance trazable','Assurance Snapshot · checkWithoutScope','MEDIA',ref));
      for(const ref of r.resultWithoutCheck||[])out.push(gap(`dataroom-assurance:${r.caseId}:result-without-check:${ref}`,entity,'Referencia de resultado sin evidencia de check trazable','Assurance Snapshot · resultWithoutCheck','MEDIA',ref));
      for(const ref of r.validityWithoutResult||[])out.push(gap(`dataroom-assurance:${r.caseId}:validity-without-result:${ref}`,entity,'Ventana de vigencia referenciada sin resultado trazable','Assurance Snapshot · validityWithoutResult','MEDIA',ref));
      for(const ref of r.supersededWithoutRequest||[])out.push(gap(`dataroom-assurance:${r.caseId}:superseded-without-request:${ref}`,entity,'Sustitución de assurance sin solicitud trazable','Assurance Snapshot · supersededWithoutRequest','MEDIA',ref));
      for(const ref of r.closedWithoutRequest||[])out.push(gap(`dataroom-assurance:${r.caseId}:closed-without-request:${ref}`,entity,'Cierre de assurance sin solicitud trazable','Assurance Snapshot · closedWithoutRequest','MEDIA',ref));
      for(const ref of r.unresolvedEvidence||[])out.push(gap(`dataroom-assurance:${r.caseId}:unresolved-evidence:${ref}`,entity,'Evidencia de assurance apunta a evento no resuelto','Assurance Snapshot · unresolvedEvidence','MEDIA',ref));
      for(const ref of r.unsupportedResult||[])out.push(gap(`dataroom-assurance:${r.caseId}:unsupported-result:${ref}`,entity,'Referencia de resultado sin soporte de evidencia trazable','Assurance Snapshot · unsupportedResult','MEDIA',ref));
      const known=new Set((r.events||[]).map(e=>e.id).filter(Boolean));
      for(const e of r.events||[]){
        const id=e.id||'SIN_ID';
        if(!e.kind)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:kind`,entity,'Evento de assurance sin tipo','Assurance Snapshot · event.kind','ALTA'));
        if(e.kind&&!e.provenance)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:provenance`,entity,`${e.kind} sin procedencia`,'Assurance Snapshot · event.provenance','MEDIA'));
        if(e.kind&&e.kind!=='EVIDENCE'&&!e.snapshotRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:event-snapshot-ref`,entity,`${e.kind} sin snapshotRef`,'Assurance Snapshot · event.snapshotRef','MEDIA'));
        if(e.kind&&e.kind!=='EVIDENCE'&&!e.documentRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:event-document-ref`,entity,`${e.kind} sin documentRef`,'Assurance Snapshot · event.documentRef','MEDIA'));
        if(e.kind==='ASSURANCE_REQUESTED'){
          if(!e.requestRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:request-ref`,entity,'Solicitud de assurance sin requestRef','Assurance Snapshot · ASSURANCE_REQUESTED.requestRef','ALTA'));
          if(!e.assuranceState)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:request-state`,entity,'Solicitud de assurance sin estado declarado','Assurance Snapshot · ASSURANCE_REQUESTED.assuranceState','BAJA'));
        }
        if(e.kind==='VERIFIER_REFERENCE_ASSIGNED'){
          if(!e.requestRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:assignment-request-ref`,entity,'Asignación de verificador sin requestRef','Assurance Snapshot · VERIFIER_REFERENCE_ASSIGNED.requestRef','MEDIA'));
          if(!e.verifierRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:verifier-ref`,entity,'Asignación sin verifierRef','Assurance Snapshot · VERIFIER_REFERENCE_ASSIGNED.verifierRef','ALTA'));
          if(!e.assignmentRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:assignment-ref`,entity,'Asignación sin assignmentRef','Assurance Snapshot · VERIFIER_REFERENCE_ASSIGNED.assignmentRef','MEDIA'));
        }
        if(e.kind==='CHECK_SCOPE_DECLARED'){
          if(!e.requestRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:scope-request-ref`,entity,'Alcance sin requestRef','Assurance Snapshot · CHECK_SCOPE_DECLARED.requestRef','MEDIA'));
          if(!e.verifierRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:scope-verifier-ref`,entity,'Alcance sin verifierRef','Assurance Snapshot · CHECK_SCOPE_DECLARED.verifierRef','MEDIA'));
          if(!e.scopeRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:scope-ref`,entity,'Alcance sin scopeRef','Assurance Snapshot · CHECK_SCOPE_DECLARED.scopeRef','ALTA'));
        }
        if(e.kind==='CHECK_EVIDENCE_REFERENCE'){
          if(!e.requestRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:check-request-ref`,entity,'Referencia de evidencia de check sin requestRef','Assurance Snapshot · CHECK_EVIDENCE_REFERENCE.requestRef','MEDIA'));
          if(!e.checkEvidenceRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:check-evidence-ref`,entity,'Check sin checkEvidenceRef','Assurance Snapshot · CHECK_EVIDENCE_REFERENCE.checkEvidenceRef','ALTA'));
        }
        if(e.kind==='RESULT_REFERENCE'){
          if(!e.requestRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:result-request-ref`,entity,'Resultado sin requestRef','Assurance Snapshot · RESULT_REFERENCE.requestRef','MEDIA'));
          if(!e.resultRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:result-ref`,entity,'Resultado sin resultRef','Assurance Snapshot · RESULT_REFERENCE.resultRef','ALTA'));
          if(!e.resultState)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:result-state`,entity,'Resultado sin estado declarado','Assurance Snapshot · RESULT_REFERENCE.resultState','BAJA'));
        }
        if(e.kind==='VALIDITY_WINDOW_REFERENCE'){
          if(!e.requestRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:validity-request-ref`,entity,'Vigencia sin requestRef','Assurance Snapshot · VALIDITY_WINDOW_REFERENCE.requestRef','MEDIA'));
          if(!e.validityRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:validity-ref`,entity,'Vigencia sin validityRef','Assurance Snapshot · VALIDITY_WINDOW_REFERENCE.validityRef','ALTA'));
          if(!e.validFrom&&!e.validUntil)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:validity-window`,entity,'Vigencia sin ventana temporal declarada','Assurance Snapshot · VALIDITY_WINDOW_REFERENCE.validFrom/validUntil','BAJA'));
        }
        if(e.kind==='ASSURANCE_SUPERSEDED'){
          if(!e.requestRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:superseded-request-ref`,entity,'Sustitución sin requestRef','Assurance Snapshot · ASSURANCE_SUPERSEDED.requestRef','MEDIA'));
          if(!e.supersededByDocumentRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:superseded-document-ref`,entity,'Sustitución sin supersededByDocumentRef','Assurance Snapshot · ASSURANCE_SUPERSEDED.supersededByDocumentRef','MEDIA'));
          if(!e.supersessionRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:supersession-ref`,entity,'Sustitución sin supersessionRef','Assurance Snapshot · ASSURANCE_SUPERSEDED.supersessionRef','BAJA'));
        }
        if(e.kind==='ASSURANCE_CLOSED'){
          if(!e.requestRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:closure-request-ref`,entity,'Cierre sin requestRef','Assurance Snapshot · ASSURANCE_CLOSED.requestRef','MEDIA'));
          if(!e.closureRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:closure-ref`,entity,'Cierre sin closureRef','Assurance Snapshot · ASSURANCE_CLOSED.closureRef','MEDIA'));
        }
        if(e.kind==='EVIDENCE'){
          if(!e.evidenceRef)out.push(gap(`dataroom-assurance:${r.caseId}:${id}:evidence-ref`,entity,'Evidencia de assurance sin evidenceRef','Assurance Snapshot · EVIDENCE.evidenceRef','MEDIA'));
          for(const ref of e.supports||[])if(!known.has(ref))out.push(gap(`dataroom-assurance:${r.caseId}:${id}:evidence-support:${ref}`,entity,'Evidencia de assurance apunta a evento no resuelto','Assurance Snapshot · EVIDENCE.supports','MEDIA',ref));
        }
      }
      for(const [field,label] of [['verifiedVerifierIdentities','identidades de verificador verificadas'],['verifiedVerifierIndependence','independencias de verificador verificadas'],['verifiedChecksPerformed','checks ejecutados verificados'],['verifiedEvidence','evidencias verificadas'],['verifiedResults','resultados verificados'],['verifiedDocuments','documentos verificados'],['currentValidDocuments','vigencias actuales verificadas'],['resolvedIssues','issues resueltos'],['dueDiligenceApprovals','aprobaciones DD'],['eligibilityDecisions','decisiones de elegibilidad'],['investmentSignals','señales de inversión'],['investmentOffers','ofertas de inversión'],['investmentRecommendations','recomendaciones de inversión'],['executionActions','acciones de ejecución'],['fundingExecuted','funding ejecutado']])if(Number(r[field])>0)out.push(gap(`dataroom-assurance:${r.caseId}:authority:${field}`,entity,`Snapshot declara ${label} fuera de autoridad`,`Assurance Snapshot · ${field}`,'ALTA'));
    }
    for(const [field,label] of [['verifiedVerifierIdentities','identidades de verificador verificadas'],['verifiedVerifierIndependence','independencias verificadas'],['verifiedChecksPerformed','checks verificados'],['verifiedEvidence','evidencias verificadas'],['verifiedResults','resultados verificados'],['verifiedDocuments','documentos verificados'],['currentValidDocuments','vigencias verificadas'],['resolvedIssues','issues resueltos'],['dueDiligenceApprovals','aprobaciones DD'],['eligibilityDecisions','decisiones de elegibilidad'],['investmentSignals','señales de inversión'],['investmentOffers','ofertas de inversión'],['investmentRecommendations','recomendaciones de inversión'],['executionActions','acciones de ejecución'],['fundingExecuted','funding ejecutado']])if(Number(m.dataroomAssurance[field])>0)out.push(gap(`dataroom-assurance:manifest:${field}`,m.farm?.id||'Unidad',`Manifest declara ${label} fuera de autoridad`,`Snapshot manifest · dataroomAssurance.${field}`,'ALTA'));
    return out;
  }
  function mergeState(baseState,snapshot){if(!baseState?.valid)return baseState;const extra=deriveAssurance(snapshot||baseState.snapshot);const gaps=[...(baseState.gaps||[]),...extra];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>counts[g.severity]=(counts[g.severity]||0)+1);return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:`${baseState.integrity||'SNAPSHOT_GAPS_ONLY'} · DATAROOM_ASSURANCE_PROVENANCE · ${INTEGRITY}`}}
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current)window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>mergeState(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},dataroomAssuranceGaps:deriveAssurance,integrity:INTEGRITY});
  function panel(){const state=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!state?.valid)return '';const list=(state.gaps||[]).filter(g=>g.domain===DOMAIN);if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · DOCUMENT ASSURANCE</p><h2>Sin inconsistencias de procedencia de assurance según este corte</h2><p>Solicitud abierta, verifier ref, scope, result ref, PASS/FAIL/INCONCLUSIVE, vigencia, sustitución o cierre no son brecha por sí solos.</p></div><span class="status teal">0</span></div></section>`;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · DOCUMENT ASSURANCE</p><h2>Assurance documental que requiere atención</h2><p>${list.length} inconsistencia(s) de procedencia. No se califica verificación fallida, invalidez documental, riesgo, elegibilidad ni decisión de inversión.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':'teal'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note">PASS_REFERENCE ≠ GAP/DD_APPROVAL · FAIL_REFERENCE ≠ FAILED_VERIFICATION · ASSURANCE_CLOSED ≠ ISSUE_RESOLVED.</div></div></section>`}
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const baseReports=views.reports;if(baseReports)views.reports=()=>insert(baseReports(),panel());
  window.__SANA_DD_DATAROOM_ASSURANCE_GAPS__=Object.freeze({derive:deriveAssurance,integrity:INTEGRITY});
})();
