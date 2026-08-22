(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Data Room / intercambio documental';
  const OWNER='Administración + Legal + Gobierno documental';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};
  const INTEGRITY='SNAPSHOT_DATAROOM_EXCHANGE_GAPS_ONLY · NO_DOCUMENT_REQUEST ≠ GAP · REQUEST_OPEN ≠ GAP · DOCUMENT_PROVIDED_REFERENCE ≠ GAP · VERSION_REFERENCE ≠ GAP · ACK_REFERENCE ≠ GAP · SUPERSEDED_REFERENCE ≠ GAP · EXPIRY_REFERENCE ≠ GAP · REQUEST_CLOSED ≠ GAP · DOCUMENT_EXCHANGE_GAP ≠ MISSING_DD_REQUIREMENT ≠ INVESTMENT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_DECISION · NO_LIVE_FALLBACK · NO_AUTOMATIC_APPROVAL · NO_OFFER · NO_SOLICITATION · NO_CUSTODY · NO_DISBURSEMENT';
  function rows(manifest){return Array.isArray(manifest?.dataroomExchange?.rows)?manifest.dataroomExchange.rows:[]}
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function deriveExchange(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];
    const m=snapshot.manifest||{};
    if(!m.dataroomExchange)return [gap('dataroom-exchange:granularity',m.farm?.id||'Unidad','Granularidad de intercambio documental no capturada en este snapshot','Snapshot manifest · dataroomExchange','BAJA','El corte sigue válido. No se rellena desde ledger vivo, Data Room Access, Capital o estado mutable.')];
    const out=[];
    for(const r of rows(m)){
      const entity=`${r.caseId||'SIN_CASO'} · ${r.capitalCaseRef||'SIN_CAPITAL_CASE'}`;
      if(!r.caseId)out.push(gap('dataroom-exchange:missing-case',entity,'Caso de intercambio sin caseId','Data Room Exchange Snapshot · caseId','ALTA'));
      if(!r.capitalCaseRef)out.push(gap(`dataroom-exchange:${r.caseId||'SIN_CASO'}:capital-case`,entity,'Caso de intercambio sin capitalCaseRef','Data Room Exchange Snapshot · capitalCaseRef','MEDIA'));
      if(!r.accessCaseRef)out.push(gap(`dataroom-exchange:${r.caseId||'SIN_CASO'}:access-case`,entity,'Caso de intercambio sin accessCaseRef','Data Room Exchange Snapshot · accessCaseRef','MEDIA'));
      if(!r.lot)out.push(gap(`dataroom-exchange:${r.caseId||'SIN_CASO'}:lot`,entity,'Caso de intercambio sin lote','Data Room Exchange Snapshot · lot','MEDIA'));
      for(const ref of r.providedWithoutRequest||[])out.push(gap(`dataroom-exchange:${r.caseId}:provided-without-request:${ref}`,entity,'Referencia documental entregada sin solicitud trazable','Document Exchange Snapshot · providedWithoutRequest','MEDIA',ref));
      for(const ref of r.versionWithoutProvided||[])out.push(gap(`dataroom-exchange:${r.caseId}:version-without-provided:${ref}`,entity,'Versión declarada sin documento entregado trazable','Document Exchange Snapshot · versionWithoutProvided','MEDIA',ref));
      for(const ref of r.ackWithoutProvided||[])out.push(gap(`dataroom-exchange:${r.caseId}:ack-without-provided:${ref}`,entity,'ACK referenciado sin documento entregado trazable','Document Exchange Snapshot · ackWithoutProvided','MEDIA',ref));
      for(const ref of r.supersededWithoutProvided||[])out.push(gap(`dataroom-exchange:${r.caseId}:superseded-without-provided:${ref}`,entity,'Sustitución referenciada sin documento entregado trazable','Document Exchange Snapshot · supersededWithoutProvided','MEDIA',ref));
      for(const ref of r.expiryWithoutProvided||[])out.push(gap(`dataroom-exchange:${r.caseId}:expiry-without-provided:${ref}`,entity,'Vigencia/expiración referenciada para documento sin entrega explícita','Document Exchange Snapshot · expiryWithoutProvided','MEDIA',ref));
      for(const ref of r.closedWithoutRequest||[])out.push(gap(`dataroom-exchange:${r.caseId}:closed-without-request:${ref}`,entity,'Cierre sin solicitud documental trazable','Document Exchange Snapshot · closedWithoutRequest','MEDIA',ref));
      for(const ref of r.unresolvedEvidence||[])out.push(gap(`dataroom-exchange:${r.caseId}:unresolved-evidence:${ref}`,entity,'Evidencia referencia evento documental no resuelto','Document Exchange Snapshot · unresolvedEvidence','MEDIA',ref));
      for(const ref of r.unsupportedProvided||[])out.push(gap(`dataroom-exchange:${r.caseId}:unsupported-provided:${ref}`,entity,'Referencia documental entregada sin soporte de evidencia','Document Exchange Snapshot · unsupportedProvided','MEDIA',ref));
      const known=new Set((r.events||[]).map(e=>e.id).filter(Boolean));
      for(const e of r.events||[]){
        const id=e.id||'SIN_ID';
        if(!e.kind)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:kind`,entity,'Evento documental sin tipo','Document Exchange Snapshot · event.kind','ALTA'));
        if(e.kind&&!e.provenance)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:provenance`,entity,`${e.kind} sin procedencia`,'Document Exchange Snapshot · event.provenance','MEDIA'));
        if(['DOCUMENT_REQUESTED','DOCUMENT_PROVIDED_REFERENCE','VERSION_DECLARED','ACK_REFERENCE','SUPERSEDED_REFERENCE','EXPIRY_REFERENCE','REQUEST_CLOSED'].includes(e.kind)&&!e.counterpartyRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:counterparty-ref`,entity,`${e.kind} sin counterpartyRef`,'Document Exchange Snapshot · event.counterpartyRef','MEDIA'));
        if(['DOCUMENT_REQUESTED','DOCUMENT_PROVIDED_REFERENCE','VERSION_DECLARED','ACK_REFERENCE','SUPERSEDED_REFERENCE','EXPIRY_REFERENCE','REQUEST_CLOSED'].includes(e.kind)&&!e.snapshotRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:snapshot-ref`,entity,`${e.kind} sin snapshotRef`,'Document Exchange Snapshot · event.snapshotRef','MEDIA'));
        if(e.kind==='DOCUMENT_REQUESTED'){
          if(!e.requestRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:request-ref`,entity,'Solicitud documental sin requestRef','Document Exchange Snapshot · DOCUMENT_REQUESTED.requestRef','ALTA'));
          if(!e.documentTypeRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:document-type`,entity,'Solicitud documental sin documentTypeRef','Document Exchange Snapshot · DOCUMENT_REQUESTED.documentTypeRef','MEDIA'));
          if(!e.requestState)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:request-state`,entity,'Solicitud documental sin estado','Document Exchange Snapshot · DOCUMENT_REQUESTED.requestState','BAJA'));
        }
        if(e.kind==='DOCUMENT_PROVIDED_REFERENCE'){
          if(!e.requestRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:provided-request-ref`,entity,'Entrega documental sin requestRef','Document Exchange Snapshot · DOCUMENT_PROVIDED_REFERENCE.requestRef','MEDIA'));
          if(!e.documentRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:document-ref`,entity,'Entrega documental sin documentRef','Document Exchange Snapshot · DOCUMENT_PROVIDED_REFERENCE.documentRef','ALTA'));
          if(!e.providerRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:provider-ref`,entity,'Entrega documental sin providerRef','Document Exchange Snapshot · DOCUMENT_PROVIDED_REFERENCE.providerRef','MEDIA'));
          if(!e.providedState)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:provided-state`,entity,'Entrega documental sin estado','Document Exchange Snapshot · DOCUMENT_PROVIDED_REFERENCE.providedState','BAJA'));
        }
        if(e.kind==='VERSION_DECLARED'){
          if(!e.documentRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:version-document-ref`,entity,'Versión sin documentRef','Document Exchange Snapshot · VERSION_DECLARED.documentRef','MEDIA'));
          if(!e.versionRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:version-ref`,entity,'Versión sin versionRef','Document Exchange Snapshot · VERSION_DECLARED.versionRef','MEDIA'));
        }
        if(e.kind==='ACK_REFERENCE'){
          if(!e.documentRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:ack-document-ref`,entity,'ACK sin documentRef','Document Exchange Snapshot · ACK_REFERENCE.documentRef','MEDIA'));
          if(!e.ackRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:ack-ref`,entity,'ACK sin ackRef','Document Exchange Snapshot · ACK_REFERENCE.ackRef','MEDIA'));
        }
        if(e.kind==='SUPERSEDED_REFERENCE'){
          if(!e.documentRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:superseded-document-ref`,entity,'Sustitución sin documentRef original','Document Exchange Snapshot · SUPERSEDED_REFERENCE.documentRef','MEDIA'));
          if(!e.supersededByRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:superseded-by-ref`,entity,'Sustitución sin supersededByRef','Document Exchange Snapshot · SUPERSEDED_REFERENCE.supersededByRef','MEDIA'));
          if(!e.supersessionRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:supersession-ref`,entity,'Sustitución sin supersessionRef','Document Exchange Snapshot · SUPERSEDED_REFERENCE.supersessionRef','BAJA'));
        }
        if(e.kind==='EXPIRY_REFERENCE'){
          if(!e.documentRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:expiry-document-ref`,entity,'Vigencia/expiración sin documentRef','Document Exchange Snapshot · EXPIRY_REFERENCE.documentRef','MEDIA'));
          if(!e.expiryRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:expiry-ref`,entity,'Vigencia/expiración sin expiryRef','Document Exchange Snapshot · EXPIRY_REFERENCE.expiryRef','MEDIA'));
        }
        if(e.kind==='REQUEST_CLOSED'){
          if(!e.requestRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:closure-request-ref`,entity,'Cierre sin requestRef','Document Exchange Snapshot · REQUEST_CLOSED.requestRef','MEDIA'));
          if(!e.closureRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:closure-ref`,entity,'Cierre sin closureRef','Document Exchange Snapshot · REQUEST_CLOSED.closureRef','MEDIA'));
        }
        if(e.kind==='EVIDENCE'){
          if(!e.evidenceRef)out.push(gap(`dataroom-exchange:${r.caseId}:${id}:evidence-ref`,entity,'Evidencia documental sin evidenceRef','Document Exchange Snapshot · EVIDENCE.evidenceRef','MEDIA'));
          for(const ref of e.supports||[])if(!known.has(ref))out.push(gap(`dataroom-exchange:${r.caseId}:${id}:evidence-support:${ref}`,entity,'Evidencia documental apunta a evento no resuelto','Document Exchange Snapshot · EVIDENCE.supports','MEDIA',ref));
        }
      }
      for(const [field,label] of [['verifiedCounterpartyIdentities','identidad de contraparte verificada'],['verifiedProviderIdentities','identidad del proveedor verificada'],['verifiedDocuments','documentos verificados'],['verifiedReceipts','recepciones verificadas'],['currentValidDocuments','vigencia documental verificada'],['resolvedIssues','issues resueltos'],['dueDiligenceApprovals','aprobaciones DD'],['eligibilityDecisions','decisiones de elegibilidad'],['investmentOffers','ofertas de inversión'],['investmentRecommendations','recomendaciones de inversión'],['executionActions','acciones de ejecución'],['fundingExecuted','funding ejecutado']])if(Number(r[field])>0)out.push(gap(`dataroom-exchange:${r.caseId}:authority:${field}`,entity,`Snapshot declara ${label} fuera de autoridad`,`Document Exchange Snapshot · ${field}`,'ALTA'));
    }
    for(const [field,label] of [['verifiedCounterpartyIdentities','identidades de contraparte verificadas'],['verifiedProviderIdentities','identidades de proveedor verificadas'],['verifiedDocuments','documentos verificados'],['verifiedReceipts','recepciones verificadas'],['currentValidDocuments','vigencias verificadas'],['resolvedIssues','issues resueltos'],['dueDiligenceApprovals','aprobaciones DD'],['eligibilityDecisions','decisiones de elegibilidad'],['investmentOffers','ofertas de inversión'],['investmentRecommendations','recomendaciones de inversión'],['executionActions','acciones de ejecución'],['fundingExecuted','funding ejecutado']])if(Number(m.dataroomExchange[field])>0)out.push(gap(`dataroom-exchange:manifest:${field}`,m.farm?.id||'Unidad',`Manifest declara ${label} fuera de autoridad`,`Snapshot manifest · dataroomExchange.${field}`,'ALTA'));
    return out;
  }
  function mergeState(baseState,snapshot){if(!baseState?.valid)return baseState;const extra=deriveExchange(snapshot||baseState.snapshot);const gaps=[...(baseState.gaps||[]),...extra];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>counts[g.severity]=(counts[g.severity]||0)+1);return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:`${baseState.integrity||'SNAPSHOT_GAPS_ONLY'} · DATAROOM_EXCHANGE_PROVENANCE · ${INTEGRITY}`}}
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current)window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>mergeState(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},dataroomExchangeGaps:deriveExchange,integrity:INTEGRITY});
  function panel(){const state=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!state?.valid)return '';const list=(state.gaps||[]).filter(g=>g.domain===DOMAIN);if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · DOCUMENT EXCHANGE</p><h2>Sin inconsistencias de procedencia documental según este corte</h2><p>Solicitud abierta, entrega por referencia, ACK, sustitución, vigencia o cierre no son brecha por sí solos.</p></div><span class="status teal">0</span></div></section>`;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · DOCUMENT EXCHANGE</p><h2>Intercambio documental que requiere atención</h2><p>${list.length} inconsistencia(s) de procedencia. No se califica riesgo de inversión, elegibilidad, aprobación u oferta.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':'teal'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note">REQUEST_OPEN ≠ GAP · PROVIDED_REFERENCE ≠ VERIFIED_DOCUMENT · REQUEST_CLOSED ≠ ISSUE_RESOLVED/DD_APPROVAL.</div></div></section>`}
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const baseReports=views.reports;if(baseReports)views.reports=()=>insert(baseReports(),panel());
  window.__SANA_DD_DATAROOM_EXCHANGE_GAPS__=Object.freeze({derive:deriveExchange,integrity:INTEGRITY});
})();
