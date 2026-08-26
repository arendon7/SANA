(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const DOMAIN='Data Room / acceso';
  const OWNER='Administración + Legal + Gobierno de datos';
  const SEVERITY_ORDER={ALTA:3,MEDIA:2,BAJA:1};
  const INTEGRITY='SNAPSHOT_DATAROOM_ACCESS_GAPS_ONLY · NO_ACCESS ≠ GAP · ACCESS_REQUEST_ONLY ≠ GAP · ACCESS_OPEN ≠ GAP · ACCESS_EXPIRED ≠ GAP · ACCESS_REVOKED ≠ GAP · DOCUMENT_SCOPE_SHARED ≠ GAP · DOCUMENT_VIEW_REFERENCE ≠ GAP · DATAROOM_ACCESS_GAP ≠ INVESTMENT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_DECISION · NO_LIVE_FALLBACK · NO_AUTOMATIC_APPROVAL · NO_OFFER · NO_SOLICITATION · NO_CUSTODY · NO_DISBURSEMENT';
  function rows(manifest){return Array.isArray(manifest?.dataroomAccess?.rows)?manifest.dataroomAccess.rows:[]}
  function gap(id,entity,condition,source,severity='MEDIA',detail=''){return {id,domain:DOMAIN,entity,condition,source,severity,owner:OWNER,detail,status:'OPEN_AT_SNAPSHOT'}}
  function deriveAccess(snapshot){
    if(!snapshot||snapshot.manifest?.schema!==SCHEMA)return [];
    const m=snapshot.manifest||{};
    if(!m.dataroomAccess)return [gap('dataroom-access:granularity',m.farm?.id||'Unidad','Granularidad de gobierno de acceso no capturada en este snapshot','Snapshot manifest · dataroomAccess','BAJA','El corte sigue válido. No se rellena desde RBAC, ledger de acceso, identidad, Capital o storage vivos.')];
    const out=[];
    for(const r of rows(m)){
      const entity=`${r.caseId||'SIN_CASO'} · ${r.capitalCaseRef||'SIN_CAPITAL_CASE'}`;
      if(!r.caseId)out.push(gap('dataroom-access:missing-case',entity,'Caso de acceso sin caseId','Data Room Access Snapshot · caseId','ALTA'));
      if(!r.capitalCaseRef)out.push(gap(`dataroom-access:${r.caseId||'SIN_CASO'}:capital-case`,entity,'Caso de acceso sin capitalCaseRef','Data Room Access Snapshot · capitalCaseRef','MEDIA'));
      if(!r.lot)out.push(gap(`dataroom-access:${r.caseId||'SIN_CASO'}:lot`,entity,'Caso de acceso sin lote','Data Room Access Snapshot · lot','MEDIA'));
      for(const ref of r.grantWithoutRequest||[])out.push(gap(`dataroom-access:${r.caseId}:grant-without-request:${ref}`,entity,'Grant sin solicitud trazable','Data Room Access Snapshot · grantWithoutRequest','MEDIA',ref));
      for(const ref of r.grantWithoutConsentReference||[])out.push(gap(`dataroom-access:${r.caseId}:grant-without-consent-ref:${ref}`,entity,'Grant sin referencia de consentimiento trazable','Data Room Access Snapshot · grantWithoutConsentReference','MEDIA',ref));
      for(const ref of r.shareWithoutGrant||[])out.push(gap(`dataroom-access:${r.caseId}:share-without-grant:${ref}`,entity,'Alcance documental compartido sin grant trazable','Data Room Access Snapshot · shareWithoutGrant','MEDIA',ref));
      for(const ref of r.viewWithoutShare||[])out.push(gap(`dataroom-access:${r.caseId}:view-without-share:${ref}`,entity,'Referencia de visualización sin alcance documental compartido trazable','Data Room Access Snapshot · viewWithoutShare','MEDIA',ref));
      for(const ref of r.terminalWithoutGrant||[])out.push(gap(`dataroom-access:${r.caseId}:terminal-without-grant:${ref}`,entity,'Expiración o revocación sin grant trazable','Data Room Access Snapshot · terminalWithoutGrant','MEDIA',ref));
      for(const ref of r.unresolvedEvidence||[])out.push(gap(`dataroom-access:${r.caseId}:unresolved-evidence:${ref}`,entity,'Evidencia referencia un evento de acceso no resuelto','Data Room Access Snapshot · unresolvedEvidence','MEDIA',ref));
      for(const ref of r.unsupportedGrant||[])out.push(gap(`dataroom-access:${r.caseId}:unsupported-grant:${ref}`,entity,'Grant sin soporte de evidencia referenciado','Data Room Access Snapshot · unsupportedGrant','MEDIA',ref));
      const known=new Set((r.events||[]).map(e=>e.id).filter(Boolean));
      for(const e of r.events||[]){
        const id=e.id||'SIN_ID';
        if(!e.kind)out.push(gap(`dataroom-access:${r.caseId}:${id}:kind`,entity,'Evento de acceso sin tipo','Data Room Access Snapshot · event.kind','ALTA'));
        if(e.kind&&!e.provenance)out.push(gap(`dataroom-access:${r.caseId}:${id}:provenance`,entity,`${e.kind} sin procedencia`,'Data Room Access Snapshot · event.provenance','MEDIA'));
        if(['ACCESS_REQUESTED','CONSENT_REFERENCE','ACCESS_GRANTED','DOCUMENT_SCOPE_SHARED','DOCUMENT_VIEW_REFERENCE','ACCESS_EXPIRED','ACCESS_REVOKED'].includes(e.kind)&&!e.counterpartyRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:counterparty-ref`,entity,`${e.kind} sin counterpartyRef`,'Data Room Access Snapshot · event.counterpartyRef','MEDIA'));
        if(['ACCESS_REQUESTED','CONSENT_REFERENCE','ACCESS_GRANTED','DOCUMENT_SCOPE_SHARED','DOCUMENT_VIEW_REFERENCE','ACCESS_EXPIRED','ACCESS_REVOKED'].includes(e.kind)&&!e.snapshotRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:snapshot-ref`,entity,`${e.kind} sin snapshotRef`,'Data Room Access Snapshot · event.snapshotRef','MEDIA'));
        if(e.kind==='ACCESS_REQUESTED'){
          if(!e.requestRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:request-ref`,entity,'Solicitud de acceso sin requestRef','Data Room Access Snapshot · ACCESS_REQUESTED.requestRef','MEDIA'));
          if(!e.scopeRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:request-scope`,entity,'Solicitud de acceso sin scopeRef','Data Room Access Snapshot · ACCESS_REQUESTED.scopeRef','BAJA'));
          if(!e.accessState)out.push(gap(`dataroom-access:${r.caseId}:${id}:request-state`,entity,'Solicitud de acceso sin estado','Data Room Access Snapshot · ACCESS_REQUESTED.accessState','BAJA'));
        }
        if(e.kind==='CONSENT_REFERENCE'){
          if(!e.consentRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:consent-ref`,entity,'Referencia de consentimiento sin consentRef','Data Room Access Snapshot · CONSENT_REFERENCE.consentRef','MEDIA'));
          if(!e.consentState)out.push(gap(`dataroom-access:${r.caseId}:${id}:consent-state`,entity,'Referencia de consentimiento sin estado','Data Room Access Snapshot · CONSENT_REFERENCE.consentState','BAJA'));
        }
        if(e.kind==='ACCESS_GRANTED'){
          if(!e.grantRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:grant-ref`,entity,'Grant sin grantRef','Data Room Access Snapshot · ACCESS_GRANTED.grantRef','ALTA'));
          if(!e.grantorRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:grantor-ref`,entity,'Grant sin grantorRef','Data Room Access Snapshot · ACCESS_GRANTED.grantorRef','MEDIA'));
          if(!e.scopeRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:grant-scope`,entity,'Grant sin scopeRef','Data Room Access Snapshot · ACCESS_GRANTED.scopeRef','MEDIA'));
          if(!e.accessState)out.push(gap(`dataroom-access:${r.caseId}:${id}:grant-state`,entity,'Grant sin estado','Data Room Access Snapshot · ACCESS_GRANTED.accessState','BAJA'));
        }
        if(e.kind==='DOCUMENT_SCOPE_SHARED'){
          if(!e.grantRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:share-grant-ref`,entity,'Share sin grantRef','Data Room Access Snapshot · DOCUMENT_SCOPE_SHARED.grantRef','MEDIA'));
          if(!e.shareRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:share-ref`,entity,'Share sin shareRef','Data Room Access Snapshot · DOCUMENT_SCOPE_SHARED.shareRef','MEDIA'));
          if(!(e.documentRefs||[]).length)out.push(gap(`dataroom-access:${r.caseId}:${id}:document-refs`,entity,'Share sin documentRefs','Data Room Access Snapshot · DOCUMENT_SCOPE_SHARED.documentRefs','MEDIA'));
        }
        if(e.kind==='DOCUMENT_VIEW_REFERENCE'){
          if(!e.documentRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:view-document-ref`,entity,'Referencia de visualización sin documentRef','Data Room Access Snapshot · DOCUMENT_VIEW_REFERENCE.documentRef','MEDIA'));
          if(!e.viewRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:view-ref`,entity,'Referencia de visualización sin viewRef','Data Room Access Snapshot · DOCUMENT_VIEW_REFERENCE.viewRef','MEDIA'));
        }
        if(e.kind==='ACCESS_EXPIRED'){
          if(!e.grantRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:expiry-grant-ref`,entity,'Expiración sin grantRef','Data Room Access Snapshot · ACCESS_EXPIRED.grantRef','MEDIA'));
          if(!e.expirationRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:expiration-ref`,entity,'Expiración sin expirationRef','Data Room Access Snapshot · ACCESS_EXPIRED.expirationRef','MEDIA'));
        }
        if(e.kind==='ACCESS_REVOKED'){
          if(!e.grantRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:revoke-grant-ref`,entity,'Revocación sin grantRef','Data Room Access Snapshot · ACCESS_REVOKED.grantRef','MEDIA'));
          if(!e.revocationRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:revocation-ref`,entity,'Revocación sin revocationRef','Data Room Access Snapshot · ACCESS_REVOKED.revocationRef','MEDIA'));
        }
        if(e.kind==='EVIDENCE'){
          if(!e.evidenceRef)out.push(gap(`dataroom-access:${r.caseId}:${id}:evidence-ref`,entity,'Evidencia de acceso sin evidenceRef','Data Room Access Snapshot · EVIDENCE.evidenceRef','MEDIA'));
          for(const ref of e.supports||[])if(!known.has(ref))out.push(gap(`dataroom-access:${r.caseId}:${id}:evidence-support:${ref}`,entity,'Evidencia de acceso apunta a evento no resuelto','Data Room Access Snapshot · EVIDENCE.supports','MEDIA',ref));
        }
      }
      if(Number(r.verifiedCounterpartyIdentities)>0)out.push(gap(`dataroom-access:${r.caseId}:verified-counterparty`,entity,'Snapshot declara identidad de contraparte verificada fuera de autoridad','Data Room Access Snapshot · verifiedCounterpartyIdentities','ALTA'));
      if(Number(r.verifiedGrantorAuthorities)>0)out.push(gap(`dataroom-access:${r.caseId}:verified-grantor`,entity,'Snapshot declara autoridad del grantor verificada fuera de autoridad','Data Room Access Snapshot · verifiedGrantorAuthorities','ALTA'));
      if(Number(r.verifiedConsents)>0)out.push(gap(`dataroom-access:${r.caseId}:verified-consent`,entity,'Snapshot declara consentimiento verificado fuera de autoridad','Data Room Access Snapshot · verifiedConsents','ALTA'));
      if(Number(r.verifiedDocumentReads)>0)out.push(gap(`dataroom-access:${r.caseId}:verified-read`,entity,'Snapshot declara lectura documental verificada fuera de autoridad','Data Room Access Snapshot · verifiedDocumentReads','ALTA'));
      if(Number(r.dueDiligenceApprovals)>0)out.push(gap(`dataroom-access:${r.caseId}:dd-approval`,entity,'Snapshot declara aprobación Due Diligence fuera de autoridad','Data Room Access Snapshot · dueDiligenceApprovals','ALTA'));
      if(Number(r.eligibilityDecisions)>0)out.push(gap(`dataroom-access:${r.caseId}:eligibility`,entity,'Snapshot declara elegibilidad fuera de autoridad','Data Room Access Snapshot · eligibilityDecisions','ALTA'));
      if(Number(r.investmentOffers)>0)out.push(gap(`dataroom-access:${r.caseId}:offer`,entity,'Snapshot declara oferta de inversión fuera de autoridad','Data Room Access Snapshot · investmentOffers','ALTA'));
      if(Number(r.investmentRecommendations)>0)out.push(gap(`dataroom-access:${r.caseId}:recommendation`,entity,'Snapshot declara recomendación de inversión fuera de autoridad','Data Room Access Snapshot · investmentRecommendations','ALTA'));
      if(Number(r.executionActions)>0)out.push(gap(`dataroom-access:${r.caseId}:execution`,entity,'Snapshot declara ejecución fuera de autoridad','Data Room Access Snapshot · executionActions','ALTA'));
      if(Number(r.fundingExecuted)>0)out.push(gap(`dataroom-access:${r.caseId}:funding`,entity,'Snapshot declara funding ejecutado fuera de autoridad','Data Room Access Snapshot · fundingExecuted','ALTA'));
    }
    for(const [field,label] of [['verifiedCounterpartyIdentities','identidades de contraparte verificadas'],['verifiedGrantorAuthorities','autoridades de grantor verificadas'],['verifiedConsents','consentimientos verificados'],['verifiedDocumentReads','lecturas verificadas'],['dueDiligenceApprovals','aprobaciones DD'],['eligibilityDecisions','decisiones de elegibilidad'],['investmentOffers','ofertas de inversión'],['investmentRecommendations','recomendaciones de inversión'],['executionActions','acciones de ejecución'],['fundingExecuted','funding ejecutado']])if(Number(m.dataroomAccess[field])>0)out.push(gap(`dataroom-access:manifest:${field}`,m.farm?.id||'Unidad',`Manifest declara ${label} fuera de autoridad`,`Snapshot manifest · dataroomAccess.${field}`,'ALTA'));
    return out;
  }
  function mergeState(baseState,snapshot){if(!baseState?.valid)return baseState;const extra=deriveAccess(snapshot||baseState.snapshot);const gaps=[...(baseState.gaps||[]),...extra];gaps.sort((a,b)=>(SEVERITY_ORDER[b.severity]||0)-(SEVERITY_ORDER[a.severity]||0)||String(a.domain).localeCompare(String(b.domain))||String(a.entity).localeCompare(String(b.entity)));const counts={ALTA:0,MEDIA:0,BAJA:0};gaps.forEach(g=>counts[g.severity]=(counts[g.severity]||0)+1);return {...baseState,gaps,counts,domains:[...new Set(gaps.map(g=>g.domain))],integrity:`${baseState.integrity||'SNAPSHOT_GAPS_ONLY'} · DATAROOM_ACCESS_PROVENANCE · ${INTEGRITY}`}}
  const base=window.__SANA_DUE_DILIGENCE_GAPS__;
  if(base?.derive&&base?.current){window.__SANA_DUE_DILIGENCE_GAPS__=Object.freeze({schema:base.schema,latest:base.latest,derive:snapshot=>mergeState(base.derive(snapshot),snapshot),current:()=>{const snapshot=base.latest?.();return mergeState(base.derive(snapshot),snapshot)},dataroomAccessGaps:deriveAccess,integrity:INTEGRITY})}
  function panel(){const state=window.__SANA_DUE_DILIGENCE_GAPS__?.current?.();if(!state?.valid)return '';const list=(state.gaps||[]).filter(g=>g.domain===DOMAIN);if(!list.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · DATA ROOM ACCESS</p><h2>Sin inconsistencias documentales de acceso según este corte</h2><p>No tener acceso, tener solicitud pendiente, acceso abierto, expirado o revocado no constituye brecha por sí solo.</p></div><span class="status teal">0</span></div></section>`;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">BRECHAS · DATA ROOM ACCESS</p><h2>Procedencia de acceso que requiere atención</h2><p>${list.length} inconsistencia(s) documental(es). No se califica riesgo de inversión, elegibilidad, aprobación u oferta.</p></div><span class="status warn">${list.length}</span></div><div class="card-body">${list.map(g=>`<div class="gate"><i class="${g.severity==='ALTA'?'blocked':'warn'}">${g.severity==='ALTA'?'!':'·'}</i><div><strong>${esc(g.entity)} · ${esc(g.condition)}</strong><p>${esc(g.source)}${g.detail?` · ${esc(g.detail)}`:''}</p></div><span class="status ${g.severity==='ALTA'?'danger':g.severity==='MEDIA'?'warn':'teal'}">${esc(g.severity)}</span></div>`).join('')}<div class="section-note">NO_ACCESS ≠ GAP · ACCESS_REQUEST_ONLY ≠ GAP · ACCESS_OPEN ≠ GAP · ACCESS_EXPIRED ≠ GAP · ACCESS_REVOKED ≠ GAP.</div></div></section>`}
  function insert(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?html+section:html.slice(0,at)+section+html.slice(at)}
  const baseReports=views.reports;if(baseReports)views.reports=()=>insert(baseReports(),panel());
  window.__SANA_DD_DATAROOM_ACCESS_GAPS__=Object.freeze({derive:deriveAccess,integrity:INTEGRITY});
})();
