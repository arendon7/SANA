(() => {
  'use strict';

  const SCHEMA='SANA_PHYTOSANITARY_LEDGER_V1';
  const PROJECTION='SANA_PHYTOSANITARY_CHAIN_V2';
  const LEGACY_STAGES=[
    ['OBSERVATION','Observación'],
    ['FINDING','Hallazgo / diagnóstico'],
    ['RECOMMENDATION','Recomendación humana'],
    ['ACTION','Aplicación / acción'],
    ['EVIDENCE','Evidencia'],
    ['FOLLOW_UP','Seguimiento / resultado']
  ];
  const STAGES=[
    ['OBSERVATION','Observación'],
    ['FINDING','Hallazgo / diagnóstico'],
    ['RECOMMENDATION','Recomendación humana'],
    ['ACTIVITY_LINK','Actividad vinculada'],
    ['ACTION','Aplicación / acción registrada'],
    ['EVIDENCE','Evidencia'],
    ['FOLLOW_UP','Seguimiento'],
    ['RESULT','Resultado observado']
  ];
  const STAGE_LABEL=Object.fromEntries(STAGES);
  const LIFECYCLE_LABEL=Object.freeze({CASE_OPEN:'Apertura de caso',CASE_CLOSE:'Cierre humano'});
  const PREDECESSOR_KIND=Object.freeze({FINDING:'OBSERVATION',RECOMMENDATION:'FINDING',ACTIVITY_LINK:'RECOMMENDATION',ACTION:'ACTIVITY_LINK',EVIDENCE:'ACTION',FOLLOW_UP:'EVIDENCE',RESULT:'FOLLOW_UP'});
  const LIFECYCLE_PREDECESSOR_KIND=Object.freeze({CASE_CLOSE:'RESULT'});
  const BASE_EVENTS=[
    {id:'SAN-EV-001',caseId:'SAN-CAC-001',eventKind:'CASE_OPEN',lot:'CAC-B1',observedAt:'2026-08-13',scope:'BIOTIC_RISK',detail:'Caso de vigilancia abierto por condición climática favorable para monilia.',author:'Laura Mejía',provenance:'BASELINE_DEMO'},
    {id:'SAN-EV-002',caseId:'SAN-CAC-001',eventKind:'OBSERVATION',lot:'CAC-B1',observedAt:'2026-08-13',presenceStatus:'NO_PRESENCE_CONFIRMED',detail:'Condición climática favorable para monilia; no equivale a presencia observada de enfermedad.',author:'Laura Mejía',provenance:'OBSERVED_CONTEXT_DEMO'},
    {id:'SAN-EV-003',caseId:'SAN-CAC-001',eventKind:'FINDING',lot:'CAC-B1',observedAt:'2026-08-13',findingClass:'RISK_CONDITION',diagnosisStatus:'NO_DIAGNOSIS',detail:'Se mantiene vigilancia. No hay diagnóstico de monilia derivado de la condición climática.',author:'Laura Mejía',provenance:'HUMAN_ASSESSMENT_DEMO'},
    {id:'SAN-EV-004',caseId:'SAN-CAC-001',eventKind:'RECOMMENDATION',lot:'CAC-B1',observedAt:'2026-08-13',detail:'Revisar 18 puntos y documentar síntomas compatibles antes de escalar cualquier intervención.',author:'Laura Mejía',basis:'Condición climática + protocolo de vigilancia DEMO',provenance:'HUMAN_RECOMMENDATION_DEMO'},
    {id:'SAN-EV-005',caseId:'SAN-CAC-001',eventKind:'ACTION',lot:'CAC-B1',observedAt:'2026-08-14',activityId:'T-103',actionType:'MONITORING',detail:'Monitoreo preventivo de 18 puntos. No se registra aplicación fitosanitaria.',author:'Laura Mejía',provenance:'ACTIVITY_LINK_DEMO'},
    {id:'SAN-EV-006',caseId:'SAN-CAC-001',eventKind:'EVIDENCE',lot:'CAC-B1',observedAt:'2026-08-14',activityId:'T-103',evidenceRef:'SAN-EVID-103',detail:'Registro estructurado DEMO del monitoreo de puntos.',author:'Laura Mejía',provenance:'EVIDENCE_DEMO'},
    {id:'SAN-EV-007',caseId:'SAN-CAC-001',eventKind:'FOLLOW_UP',lot:'CAC-B1',observedAt:'2026-08-15',resultClass:'SURVEILLANCE_CONTINUES',effectivenessObserved:'NO_EFFICACY_ASSESSMENT',compareBasis:'Seguimiento visual DEMO; no hubo tratamiento que evaluar.',detail:'Sin escalamiento a tratamiento. El lote continúa bajo vigilancia.',author:'Laura Mejía',provenance:'FOLLOW_UP_DEMO'}
  ].map(e=>Object.freeze({...e,healthSchema:SCHEMA,projectionVersion:'V1_SEEDED',local:false}));

  function workflow(){return window.__SANA_PLAN_FIELD_WORKFLOW__}
  function localExplicit(){return storage.records.filter(r=>r.type==='phytosanitary-event'&&r.values?.healthSchema===SCHEMA)}
  function localLegacy(){return storage.records.filter(r=>r.type==='health')}
  function normalizeLocal(r){
    const v=r.values||{};
    return {id:r.id,caseId:v.caseId||r.id,eventKind:v.eventKind||'OBSERVATION',lot:v.lot||r.lot||'',observedAt:v.observedAt||String(r.createdAt||'').slice(0,10),scope:v.scope||'',presenceStatus:v.presenceStatus||'',findingClass:v.findingClass||'',diagnosisStatus:v.diagnosisStatus||'',basisEventId:v.basisEventId||'',activityId:v.activityId||'',actionType:v.actionType||'',product:v.product||'',dose:v.dose||'',evidenceRef:v.evidenceRef||'',followUpClass:v.followUpClass||'',resultClass:v.resultClass||'',effectivenessObserved:v.effectivenessObserved||'',closureClass:v.closureClass||'',compareBasis:v.compareBasis||'',basis:v.basis||'',detail:v.detail||r.title||'',author:v.author||identity?.displayName||'Responsable DEMO',provenance:v.provenance||'LOCAL_ONLY',healthSchema:SCHEMA,projectionVersion:v.projectionVersion||'V1_COMPAT',local:true};
  }
  function explicitEvents(){return [...BASE_EVENTS,...localExplicit().map(normalizeLocal)].sort((a,b)=>String(a.observedAt).localeCompare(String(b.observedAt))||String(a.id).localeCompare(String(b.id)))}
  function legacySummaries(){
    const seeded=DEMO.incidents.map(i=>({id:`LEG-${i.id}`,sourceId:i.id,lot:i.lot,date:i.date,summary:i.finding,severity:i.severity,status:i.status,owner:i.owner,provenance:'LEGACY_INCIDENT_SUMMARY',semanticState:'OBSERVATION_SUMMARY_ONLY · DIAGNOSIS_NOT_INFERRED · TREATMENT_NOT_INFERRED · EFFICACY_NOT_INFERRED'}));
    const local=localLegacy().map(r=>({id:`LEG-${r.id}`,sourceId:r.id,lot:r.lot||r.values?.lot||'',date:String(r.createdAt||'').slice(0,10),summary:r.values?.detail||r.title||'Monitoreo sanitario previo',severity:r.values?.severity||'—',status:r.values?.result||'CAPTURA LEGACY',owner:identity?.displayName||'Responsable DEMO',provenance:'LOCAL_HEALTH_CAPTURE_LEGACY',semanticState:'UNSTRUCTURED_CAPTURE · DIAGNOSIS_NOT_INFERRED · TREATMENT_NOT_INFERRED · EFFICACY_NOT_INFERRED'}));
    return [...seeded,...local];
  }
  function activityLink(event){
    if(!event.activityId)return {status:'NO_ACTIVITY_LINK',activity:null};
    const activity=workflow()?.findActivity?.(event.activityId)||null;
    if(!activity)return {status:'MISSING_ACTIVITY',activity:null};
    if(event.lot&&activity.lot!==event.lot)return {status:'LOT_MISMATCH',activity};
    return {status:'LINKED',activity};
  }
  function expectedPredecessorKind(eventKind){return PREDECESSOR_KIND[eventKind]||LIFECYCLE_PREDECESSOR_KIND[eventKind]||null}
  function eventReference(event,caseEvents){
    const expectedKind=expectedPredecessorKind(event.eventKind);
    if(!expectedKind)return {required:false,status:'NOT_REQUIRED',expectedKind:null,target:null};
    if(event.projectionVersion!=='V2'&&!event.basisEventId)return {required:false,status:'LEGACY_NOT_CAPTURED',expectedKind,target:null};
    if(!event.basisEventId)return {required:true,status:'MISSING_REFERENCE',expectedKind,target:null};
    const all=explicitEvents();
    const target=all.find(e=>e.id===event.basisEventId)||null;
    if(!target)return {required:true,status:'MISSING_TARGET',expectedKind,target:null};
    if(target.caseId!==event.caseId)return {required:true,status:'CROSS_CASE_REFERENCE',expectedKind,target};
    if(target.eventKind!==expectedKind)return {required:true,status:'KIND_MISMATCH',expectedKind,target};
    if(String(target.observedAt||'')>String(event.observedAt||''))return {required:true,status:'FORWARD_REFERENCE',expectedKind,target};
    if(caseEvents&&!caseEvents.some(e=>e.id===target.id))return {required:true,status:'CROSS_CASE_REFERENCE',expectedKind,target};
    return {required:true,status:'LINKED',expectedKind,target};
  }
  function coverage(stageEvents,stages){
    const covered=stages.filter(([kind])=>(stageEvents[kind]||[]).length).length;
    return {covered,total:stages.length,percent:Math.round(covered/stages.length*100)};
  }
  function referenceCoverage(events){
    const rows=events.filter(e=>PREDECESSOR_KIND[e.eventKind]&&e.projectionVersion==='V2').map(e=>({event:e,reference:eventReference(e,events)}));
    const linked=rows.filter(r=>r.reference.status==='LINKED').length;
    return {linked,total:rows.length,percent:rows.length?Math.round(linked/rows.length*100):null,issues:rows.filter(r=>r.reference.status!=='LINKED').length,rows};
  }
  function lifecycleState(events){
    const closures=events.filter(e=>e.eventKind==='CASE_CLOSE');
    const closureRows=closures.map(event=>({event,reference:eventReference(event,events)}));
    const validClosures=closureRows.filter(r=>r.event.projectionVersion==='V2'&&r.reference.status==='LINKED');
    const latestClosure=validClosures[validClosures.length-1]?.event||null;
    return {state:latestClosure?'CLOSED_HUMAN':'OPEN',closures,closureRows,latestClosure,issues:closureRows.filter(r=>r.event.projectionVersion==='V2'&&r.reference.status!=='LINKED').length};
  }
  function caseFor(caseId){
    const events=explicitEvents().filter(e=>e.caseId===caseId);
    if(!events.length)return null;
    const first=events.find(e=>e.eventKind==='CASE_OPEN')||events[0];
    const stageEvents=Object.fromEntries(STAGES.map(([kind])=>[kind,events.filter(e=>e.eventKind===kind)]));
    const observations=stageEvents.OBSERVATION;
    const findings=stageEvents.FINDING;
    const recommendations=stageEvents.RECOMMENDATION;
    const activityLinks=stageEvents.ACTIVITY_LINK.map(e=>({...e,activityLink:activityLink(e)}));
    const actions=stageEvents.ACTION.map(e=>({...e,activityLink:activityLink(e)}));
    const evidence=stageEvents.EVIDENCE;
    const followups=stageEvents.FOLLOW_UP;
    const results=stageEvents.RESULT;
    const observedPresence=observations.filter(e=>e.presenceStatus==='PRESENCE_OBSERVED').length;
    const confirmedDiagnosis=findings.filter(e=>e.diagnosisStatus==='CONFIRMED_HUMAN_DEMO').length;
    const explicitResultEfficacyObservations=results.filter(e=>e.effectivenessObserved&&e.effectivenessObserved!=='NO_EFFICACY_ASSESSMENT').length;
    const embeddedEfficacyObservationsV1=followups.filter(e=>e.effectivenessObserved&&e.effectivenessObserved!=='NO_EFFICACY_ASSESSMENT').length;
    const embeddedActivityLinksV1=actions.filter(e=>e.activityId).length;
    const embeddedResultsV1=followups.filter(e=>e.resultClass||e.effectivenessObserved).length;
    const linkedRows=[...activityLinks,...actions.filter(e=>e.activityId)];
    const actionLinkIssues=linkedRows.filter(a=>!['LINKED','NO_ACTIVITY_LINK'].includes(a.activityLink.status)).length;
    const refs=referenceCoverage(events);
    const lifecycle=lifecycleState(events);
    return {
      id:caseId,lot:first.lot,scope:first.scope||'',openedAt:first.observedAt,projectionVersion:'V2',events,stageEvents,observations,findings,recommendations,activityLinks,actions,evidence,followups,results,
      stageCoverage:coverage(stageEvents,LEGACY_STAGES),
      chainCoverage:coverage(stageEvents,STAGES),
      referenceCoverage:{linked:refs.linked,total:refs.total,percent:refs.percent},
      referenceIssues:refs.issues,
      referenceRows:refs.rows,
      caseState:lifecycle.state,
      closures:lifecycle.closures,
      closureRows:lifecycle.closureRows,
      closureIssues:lifecycle.issues,
      latestClosure:lifecycle.latestClosure,
      closedAt:lifecycle.latestClosure?.observedAt||null,
      semantics:{observedPresence,confirmedDiagnosis,efficacyObservations:explicitResultEfficacyObservations+embeddedEfficacyObservationsV1,explicitResultEfficacyObservations,embeddedEfficacyObservationsV1,explicitActivityLinks:activityLinks.length,embeddedActivityLinksV1,explicitResults:results.length,embeddedResultsV1,actionLinkIssues,referenceIssues:refs.issues,closureIssues:lifecycle.issues},
      latestFollowUp:followups[followups.length-1]||null,
      latestResult:results[results.length-1]||null,
      integrity:'OBSERVATION ≠ DIAGNOSIS · DIAGNOSIS ≠ RECOMMENDATION · RECOMMENDATION ≠ ACTIVITY_LINK ≠ EXECUTION · ACTIVITY_LINK_EVENT ≠ ACTION · FOLLOW_UP ≠ RESULT · RESULT ≠ CAUSAL_ATTRIBUTION · RESULT ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY · EMBEDDED_V1_RELATION ≠ V2_STAGE · CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE · REFERENCE ≠ CAUSALITY'
    };
  }
  function cases(){return [...new Set(explicitEvents().map(e=>e.caseId))].map(caseFor).filter(Boolean)}
  function forLot(lot){return {explicit:cases().filter(c=>c.lot===lot),legacy:legacySummaries().filter(c=>c.lot===lot)}}
  function all(){return {explicit:cases(),legacy:legacySummaries()}}
  function eventLabel(kind){return STAGE_LABEL[kind]||LIFECYCLE_LABEL[kind]||String(kind||'').replaceAll('_',' ')}
  function toneForCase(c){return c.semantics.actionLinkIssues||c.referenceIssues||c.closureIssues?'danger':c.chainCoverage.percent<100?'warn':'teal'}
  function linkText(a){return a.activityLink.status==='LINKED'?`${a.activityId} · ${a.activityLink.activity?.state?.label||'actividad'}`:a.activityLink.status}

  function compatibilityNote(c){
    const parts=[];
    if(c.semantics.embeddedActivityLinksV1&&!c.activityLinks.length)parts.push(`${c.semantics.embeddedActivityLinksV1} vínculo(s) V1 embebido(s) en ACTION; no completan ACTIVITY_LINK V2`);
    if(c.semantics.embeddedResultsV1&&!c.results.length)parts.push(`${c.semantics.embeddedResultsV1} resultado(s) V1 embebido(s) en FOLLOW_UP; no completan RESULT V2`);
    return parts.length?`<div class="section-note" style="margin-top:12px"><strong>Compatibilidad histórica:</strong> ${esc(parts.join(' · '))}. No hay promoción retroactiva de semántica.</div>`:'';
  }
  function eventChips(e,c){
    const resolved=e.activityId?activityLink(e):null;
    const ref=expectedPredecessorKind(e.eventKind)?eventReference(e,c?.events||null):null;
    return `<div class="chip-row"><span class="chip">${esc(e.provenance||'—')}</span>${e.projectionVersion?`<span class="chip">${esc(e.projectionVersion)}</span>`:''}${e.presenceStatus?`<span class="chip">${esc(e.presenceStatus)}</span>`:''}${e.diagnosisStatus?`<span class="chip">${esc(e.diagnosisStatus)}</span>`:''}${e.activityId?`<span class="chip">${esc(linkText({...e,activityLink:resolved}))}</span>`:''}${e.basisEventId?`<span class="chip">REF ${esc(e.basisEventId)} · ${esc(ref?.status||'—')}</span>`:ref?.status==='LEGACY_NOT_CAPTURED'?'<span class="chip">REF LEGACY NO CAPTURADA</span>':ref?.required?`<span class="chip">REF ${esc(ref.status)}</span>`:''}${e.followUpClass?`<span class="chip">${esc(e.followUpClass)}</span>`:''}${e.resultClass?`<span class="chip">${esc(e.resultClass)}</span>`:''}${e.effectivenessObserved?`<span class="chip">${esc(e.effectivenessObserved)}</span>`:''}${e.closureClass?`<span class="chip">${esc(e.closureClass)}</span>`:''}</div>`;
  }
  function caseCard(c){
    const f=c.findings[c.findings.length-1];
    const result=c.latestResult;
    const refText=c.referenceCoverage.total?`${c.referenceCoverage.linked}/${c.referenceCoverage.total} · ${c.referenceCoverage.percent}%`:'sin eventos V2 referenciables';
    const lifecycleActions=c.caseState==='CLOSED_HUMAN'
      ? `<span class="status teal">CERRADO HUMANO · ${esc(c.closedAt||'—')}</span>`
      : `${STAGES.map(([kind,label])=>`<button class="btn secondary" data-health-event="${kind}" data-health-case="${esc(c.id)}">${esc(label)}</button>`).join('')}${c.latestResult?`<button class="btn primary" data-health-close-case="${esc(c.id)}">Cerrar caso humano</button>`:''}`;
    return `<article class="card"><div class="card-head"><div><small>${esc(c.id)} · ${esc(c.lot)}</small><h2>${esc(c.scope||'Caso sanitario')}</h2><p>${f?`${esc(f.findingClass||'Hallazgo')} · ${esc(f.diagnosisStatus||'SIN DIAGNÓSTICO')}`:'Sin hallazgo/diagnóstico explícito'}</p></div><span class="status ${toneForCase(c)}">${c.caseState==='CLOSED_HUMAN'?'CERRADO HUMANO':`${c.chainCoverage.percent}% CADENA V2`}</span></div><div class="card-body"><div class="grid metrics">${metric('Estado del caso',c.caseState,c.latestClosure?.closureClass||'RESULT ≠ cierre')}${metric('Presencia observada',c.semantics.observedPresence,'solo OBSERVATION')}${metric('Diagnóstico humano',c.semantics.confirmedDiagnosis,'solo confirmación humana explícita')}${metric('Referencias V2',refText,c.referenceIssues?`${c.referenceIssues} inconsistencia(s)`:'predecesor explícito')}${metric('Vínculos Activity V2',c.activityLinks.filter(a=>a.activityLink.status==='LINKED').length,`${c.activityLinks.length} vínculo(s) explícito(s)`) }${metric('Resultados V2',c.results.length,result?.effectivenessObserved||'sin resultado explícito')}</div><div class="workflow" style="margin-top:12px">${STAGES.map(([kind,label],i)=>`<div class="stage ${c.stageEvents[kind].length?'done':''}"><span class="num">${i+1}</span><strong>${esc(label)}</strong><span>${c.stageEvents[kind].length?`${c.stageEvents[kind].length} evento(s)`:'sin evento explícito'}</span></div>`).join('')}</div><div class="head-actions" style="margin-top:12px">${lifecycleActions}</div><div class="timeline" style="margin-top:14px">${c.events.filter(e=>e.eventKind!=='CASE_OPEN').map(e=>`<div class="timeline-item"><i></i><div><strong>${esc(eventLabel(e.eventKind))} · ${esc(e.id)}</strong><p>${esc(e.detail||'—')}</p>${eventChips(e,c)}</div><time>${esc(e.observedAt||'—')}</time></div>`).join('')}</div>${compatibilityNote(c)}<div class="section-note" style="margin-top:12px"><strong>Frontera V126:</strong> RESULT ≠ CASE_CLOSURE. El cierre es una decisión humana documental referenciada a un resultado; no declara que la condición esté resuelta ni que un tratamiento haya sido eficaz.</div></div></article>`;
  }
  function legacyPanel(rows){
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD · HISTORIA LEGACY</p><h2>Resúmenes anteriores sin semántica retroactiva</h2><p>Se conservan como evidencia histórica resumida. Un estado “cerrado” no se interpreta como tratamiento aplicado ni como eficacia demostrada.</p></div><span class="status warn">${rows.length} LEGACY</span></div><div class="card-body">${rows.map(i=>`<div class="row"><span class="dot warn"></span><div class="copy"><strong>${esc(i.sourceId)} · ${esc(i.lot)} · ${esc(i.summary)}</strong><span>${esc(i.semanticState)}</span></div><div class="meta"><span class="status warn">${esc(i.status||'LEGACY')}</span><br>${esc(i.date||'—')}</div></div>`).join('')||'<div class="empty">Sin historia legacy.</div>'}<div class="section-note" style="margin-top:12px">LEGACY_INCIDENT_SUMMARY ≠ OBSERVED_PRESENCE ≠ DIAGNOSIS ≠ TREATMENT ≠ EFFICACY.</div></div></section>`;
  }
  function ledgerPanel(){
    const data=all();const explicit=data.explicit;const legacy=data.legacy;
    const observed=explicit.reduce((n,c)=>n+c.semantics.observedPresence,0);const diagnosed=explicit.reduce((n,c)=>n+c.semantics.confirmedDiagnosis,0);const links=explicit.reduce((n,c)=>n+c.activityLinks.length,0);const results=explicit.reduce((n,c)=>n+c.results.length,0);const referenceIssues=explicit.reduce((n,c)=>n+c.referenceIssues,0);const closed=explicit.filter(c=>c.caseState==='CLOSED_HUMAN').length;const closureIssues=explicit.reduce((n,c)=>n+c.closureIssues,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD VEGETAL · CADENA V2</p><h2>Ocho transiciones auditables + lifecycle humano</h2><p>V126 separa el resultado observado del cierre humano del expediente. El cierre no forma parte de las ocho etapas ni altera chainCoverage.</p></div><button class="btn primary" data-health-new-case>Abrir caso sanitario</button></div><div class="card-body"><div class="grid metrics">${metric('Casos',explicit.length,'proyección V2 sobre ledger V1')}${metric('Casos cerrados',closed,'cierre humano explícito')}${metric('Presencias observadas',observed,'no inferidas desde alertas')}${metric('Diagnósticos humanos',diagnosed,'confirmaciones explícitas')}${metric('Resultados V2',results,'resultado ≠ cierre')}${metric('Issues lifecycle',closureIssues,referenceIssues?`${referenceIssues} issue(s) de cadena adicionales`:'cierre referenciado')}</div><div class="section-note" style="margin-top:12px"><strong>Contrato V126:</strong> RESULT ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY. El lifecycle es aditivo y no modifica las ocho etapas.</div></div></section><section class="grid two" style="margin-top:14px">${explicit.map(caseCard).join('')||'<div class="empty">Sin casos V2.</div>'}</section>${legacyPanel(legacy)}`;
  }
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}

  const baseHealth=views.health;
  if(baseHealth)views.health=function healthWithLedger(){let html=baseHealth();html=html.replace('data-action="health">Registrar monitoreo','data-health-new-case>Abrir caso sanitario');html=html.replace('<h2>Incidencias y vigilancia</h2><p>Sin automatizar la decisión agronómica.</p>','<h2>Resumen de incidencias heredado</h2><p>Contexto histórico; no equivale a la cadena sanitaria V2.</p>');return insert(html,ledgerPanel())};

  function passportPanel(){
    let lot='CAF-A1';try{lot=localStorage.getItem('sana.v3.passport.lot')||lot}catch{}
    const data=forLot(lot);const explicit=data.explicit;
    if(!explicit.length&&!data.legacy.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD · PASSPORT</p><h2>Sin historia sanitaria vinculada</h2><p>No se inventa una condición fitosanitaria a partir de ausencia de registros.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD · PASSPORT</p><h2>Procedencia sanitaria reconstruible del lote ${esc(lot)}</h2><p>Observación → diagnóstico/hallazgo → recomendación → actividad vinculada → acción → evidencia → seguimiento → resultado; el cierre humano se registra aparte.</p></div><span class="status">${explicit.length} V2 · ${data.legacy.length} LEGACY</span></div><div class="card-body">${explicit.map(c=>`<div class="gate"><i>${c.chainCoverage.covered}</i><div><strong>${esc(c.id)} · ${esc(c.scope||'Caso sanitario')}</strong><p>${c.chainCoverage.percent}% cadena V2 · ${esc(c.caseState)} · referencias ${c.referenceCoverage.total?`${c.referenceCoverage.linked}/${c.referenceCoverage.total}`:'N/A'} · resultados ${c.results.length}</p></div><span class="status ${toneForCase(c)}">${c.caseState==='CLOSED_HUMAN'?'CERRADO HUMANO':c.chainCoverage.percent===100&&!c.referenceIssues?'TRAZABLE V2 DEMO':'PARCIAL V2'}</span></div>`).join('')}${data.legacy.length?`<div class="section-note" style="margin-top:12px">${data.legacy.length} resumen(es) legacy permanecen visibles pero no se convierten en diagnóstico, tratamiento, eficacia, referencias V2 o cierres de caso.</div>`:''}<div class="section-note" style="margin-top:12px">PASSPORT PHYTOSANITARY ≠ ICA CERTIFICATION ≠ DIAGNOSIS CERTIFICATE ≠ TREATMENT AUTHORIZATION ≠ CAUSAL EFFICACY. CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED.</div></div></section>`;
  }
  const basePassport=views.passport;
  if(basePassport)views.passport=function passportWithHealth(){return insert(basePassport(),passportPanel())};

  function lotOptions(selected=''){return DEMO.lots.map(l=>`<option value="${esc(l.id)}" ${l.id===selected?'selected':''}>${esc(l.id)} · ${esc(l.crop)}</option>`).join('')}
  function activityOptions(lot){const rows=workflow()?.forLot?.(lot)||[];return `<option value="">Seleccionar actividad</option>${rows.map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${esc(a.title)}</option>`).join('')}`}
  function predecessorOptions(c,kind){
    const expected=PREDECESSOR_KIND[kind];if(!expected)return '';
    const rows=(c.stageEvents?.[expected]||[]).slice().sort((a,b)=>String(b.observedAt||'').localeCompare(String(a.observedAt||''))||String(b.id).localeCompare(String(a.id)));
    return `<option value="">Seleccionar ${esc(eventLabel(expected))}</option>${rows.map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.observedAt||'—')} · ${esc((e.detail||'').slice(0,70))}</option>`).join('')}`;
  }
  function predecessorField(c,kind){const expected=PREDECESSOR_KIND[kind];return expected?`<label>Evento precedente · ${esc(eventLabel(expected))}<select name="basisEventId" required>${predecessorOptions(c,kind)}</select></label>`:''}
  function resultOptions(c){return c.results.slice().sort((a,b)=>String(b.observedAt||'').localeCompare(String(a.observedAt||''))||String(b.id).localeCompare(String(a.id))).map(e=>`<option value="${esc(e.id)}">${esc(e.id)} · ${esc(e.observedAt||'—')} · ${esc(e.resultClass||'resultado')}</option>`).join('')}
  function openCase(){const id=`SAN-${Date.now()}`;openModal('SANIDAD · CADENA V2','Abrir caso sanitario',`<div class="fields"><input type="hidden" name="healthSchema" value="${SCHEMA}"><input type="hidden" name="projectionVersion" value="V2"><input type="hidden" name="eventKind" value="CASE_OPEN"><input type="hidden" name="caseId" value="${id}"><label>Caso<input value="${id}" readonly></label><label>Lote<select name="lot">${lotOptions()}</select></label><label>Ámbito<select name="scope"><option value="BIOTIC_RISK">Riesgo biótico</option><option value="ABIOTIC_STRESS">Estrés abiótico</option><option value="UNKNOWN">Por determinar</option></select></label><label>Fecha<input name="observedAt" type="date" required></label><label>Responsable humano<input name="author" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Procedencia<select name="provenance"><option>OBSERVED_DEMO</option><option>DECLARED_DEMO</option><option>DOCUMENTAL_DEMO</option></select></label><label class="full">Motivo de apertura<textarea name="detail" required placeholder="Qué se observó o qué riesgo requiere seguimiento. No diagnosticar por inferencia."></textarea></label></div>`,true,'phytosanitary-event')}
  function openEvent(kind,caseId){
    const c=caseFor(caseId);if(!c)return;
    if(c.caseState==='CLOSED_HUMAN'){toast('Caso sanitario cerrado','Abra un nuevo caso para registrar una nueva cadena. El cierre histórico no se reescribe.','warn');return}
    const common=`<input type="hidden" name="healthSchema" value="${SCHEMA}"><input type="hidden" name="projectionVersion" value="V2"><input type="hidden" name="eventKind" value="${kind}"><input type="hidden" name="caseId" value="${esc(caseId)}"><input type="hidden" name="lot" value="${esc(c.lot)}"><label>Caso<input value="${esc(caseId)} · ${esc(c.lot)}" readonly></label><label>Fecha<input name="observedAt" type="date" required></label><label>Responsable humano<input name="author" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label>${predecessorField(c,kind)}`;
    let fields='';
    if(kind==='OBSERVATION')fields=`${common}<label>Presencia<select name="presenceStatus"><option value="NO_PRESENCE_CONFIRMED">No confirmada</option><option value="PRESENCE_OBSERVED">Presencia observada</option><option value="ABSENCE_OBSERVED">Ausencia observada en muestra</option><option value="INCONCLUSIVE">Inconcluso</option></select></label><label>Procedencia<select name="provenance"><option>OBSERVED_DEMO</option><option>MEASURED_DEMO</option><option>DECLARED_DEMO</option></select></label><label class="full">Observación<textarea name="detail" required></textarea></label>`;
    if(kind==='FINDING')fields=`${common}<label>Clasificación<input name="findingClass" required placeholder="Síntoma, plaga, enfermedad, riesgo, estrés..."></label><label>Estado diagnóstico<select name="diagnosisStatus"><option value="NO_DIAGNOSIS">Sin diagnóstico</option><option value="SUSPECTED_HUMAN">Sospecha humana</option><option value="CONFIRMED_HUMAN_DEMO">Confirmado por responsable humano · DEMO</option><option value="RULED_OUT_HUMAN">Descartado por responsable humano</option></select></label><label>Procedencia<input name="provenance" value="HUMAN_ASSESSMENT_DEMO" readonly></label><label class="full">Fundamento / hallazgo<textarea name="detail" required placeholder="Qué soporta exactamente el hallazgo o diagnóstico."></textarea></label>`;
    if(kind==='RECOMMENDATION')fields=`${common}<label>Procedencia<input name="provenance" value="HUMAN_RECOMMENDATION_DEMO" readonly></label><label class="full">Base técnica<textarea name="basis" required placeholder="Observación, protocolo, umbral, contexto..."></textarea></label><label class="full">Recomendación humana<textarea name="detail" required placeholder="La recomendación no equivale a vínculo, ejecución ni autorización externa."></textarea></label>`;
    if(kind==='ACTIVITY_LINK')fields=`${common}<label>Actividad vinculada<select name="activityId" required>${activityOptions(c.lot)}</select></label><label>Procedencia<input name="provenance" value="ACTIVITY_RELATION_DEMO" readonly></label><label class="full">Alcance del vínculo<textarea name="detail" required placeholder="Por qué esta actividad se vincula al caso. Vincular no demuestra ejecución."></textarea></label>`;
    if(kind==='ACTION')fields=`${common}<label>Tipo de acción<select name="actionType"><option value="MONITORING">Monitoreo</option><option value="CULTURAL_CONTROL">Control cultural</option><option value="BIOLOGICAL_APPLICATION">Aplicación biológica DEMO</option><option value="OTHER">Otra acción</option></select></label><label>Referencia actividad<select name="activityId">${activityOptions(c.lot)}</select></label><label>Producto / insumo<input name="product" placeholder="Opcional; solo si realmente se aplicó"></label><label>Dosis / cantidad<input name="dose" placeholder="Opcional"></label><label>Procedencia<input name="provenance" value="EXECUTION_DEMO" readonly></label><label class="full">Acción ejecutada<textarea name="detail" required placeholder="Describir únicamente lo ejecutado. El activityId no sustituye el evento ACTIVITY_LINK V2."></textarea></label>`;
    if(kind==='EVIDENCE')fields=`${common}<label>Actividad relacionada<select name="activityId">${activityOptions(c.lot)}</select></label><label>Referencia evidencia<input name="evidenceRef" required placeholder="ID / referencia DEMO"></label><label>Procedencia<select name="provenance"><option>EVIDENCE_DEMO</option><option>MEASURED_DEMO</option><option>DOCUMENTAL_DEMO</option></select></label><label class="full">Qué demuestra<textarea name="detail" required placeholder="Describir alcance de la evidencia sin sobreinterpretarla."></textarea></label>`;
    if(kind==='FOLLOW_UP')fields=`${common}<label>Clase de seguimiento<select name="followUpClass"><option value="FOLLOW_UP_PERFORMED">Seguimiento realizado</option><option value="SURVEILLANCE_CONTINUES">Continúa vigilancia</option><option value="REASSESSMENT_REQUIRED">Requiere reevaluación</option><option value="ESCALATION_RECOMMENDED">Escalamiento recomendado</option></select></label><label>Procedencia<input name="provenance" value="FOLLOW_UP_DEMO" readonly></label><label class="full">Base de seguimiento<textarea name="compareBasis" required placeholder="Qué se revisó, muestra, fecha y condiciones."></textarea></label><label class="full">Seguimiento<textarea name="detail" required placeholder="Registrar observaciones de seguimiento. El resultado se registra en una etapa separada."></textarea></label>`;
    if(kind==='RESULT')fields=`${common}<label>Resultado observado<select name="resultClass"><option value="CONDITION_NOT_OBSERVED">Condición no observada</option><option value="CONDITION_PERSISTS_OBSERVED">Condición persiste</option><option value="CONDITION_CHANGED_OBSERVED">Condición cambió</option><option value="INCONCLUSIVE_RESULT">Resultado inconcluso</option><option value="SURVEILLANCE_CONTINUES">Continúa vigilancia</option></select></label><label>Efecto observado<select name="effectivenessObserved"><option value="NO_EFFICACY_ASSESSMENT">Sin evaluación de eficacia</option><option value="IMPROVEMENT_OBSERVED">Mejoría observada</option><option value="NO_CHANGE_OBSERVED">Sin cambio observado</option><option value="WORSENING_OBSERVED">Deterioro observado</option></select></label><label>Procedencia<input name="provenance" value="RESULT_OBSERVATION_DEMO" readonly></label><label class="full">Base de comparación<textarea name="compareBasis" required placeholder="Qué se comparó y bajo qué condiciones."></textarea></label><label class="full">Resultado observado<textarea name="detail" required placeholder="Describir el resultado. No atribuir causalidad al tratamiento."></textarea></label>`;
    openModal(`SANIDAD · ${eventLabel(kind).toUpperCase()}`,`${eventLabel(kind)} · ${caseId}`,`<div class="fields">${fields}</div>`,true,'phytosanitary-event');
  }
  function openCloseCase(caseId){
    const c=caseFor(caseId);if(!c||c.caseState==='CLOSED_HUMAN')return;
    if(!c.results.length){toast('Cierre no disponible','Registre primero un RESULT explícito V2. Resultado y cierre permanecen separados.','warn');return}
    openModal('SANIDAD · LIFECYCLE','Cierre humano del caso',`<div class="fields"><input type="hidden" name="healthSchema" value="${SCHEMA}"><input type="hidden" name="projectionVersion" value="V2"><input type="hidden" name="eventKind" value="CASE_CLOSE"><input type="hidden" name="caseId" value="${esc(caseId)}"><input type="hidden" name="lot" value="${esc(c.lot)}"><label>Caso<input value="${esc(caseId)} · ${esc(c.lot)}" readonly></label><label>Resultado de referencia<select name="basisEventId" required><option value="">Seleccionar RESULT</option>${resultOptions(c)}</select></label><label>Fecha de cierre<input name="observedAt" type="date" required></label><label>Responsable humano<input name="author" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Clasificación de cierre<select name="closureClass"><option value="MONITORING_COMPLETE">Monitoreo completado</option><option value="NO_FURTHER_ACTION_CURRENTLY">Sin acción adicional por ahora</option><option value="ESCALATED_TO_NEW_CASE">Escalado a nuevo caso</option><option value="OTHER_HUMAN_CLOSURE">Otro cierre humano</option></select></label><label>Procedencia<input name="provenance" value="HUMAN_CASE_CLOSURE_DEMO" readonly></label><label class="full">Justificación del cierre<textarea name="detail" required placeholder="Por qué se cierra administrativamente el expediente. No declarar causalidad, curación ni eficacia salvo evidencia independiente explícita."></textarea></label><label class="full">Integridad<input value="RESULT ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED" readonly></label></div>`,true,'phytosanitary-event');
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-health-new-case]')){openCase();return}const close=event.target.closest('[data-health-close-case]');if(close){openCloseCase(close.dataset.healthCloseCase);return}const b=event.target.closest('[data-health-event]');if(b)openEvent(b.dataset.healthEvent,b.dataset.healthCase)});

  window.__SANA_PHYTOSANITARY_LEDGER__=Object.freeze({schema:SCHEMA,projection:PROJECTION,projectionVersion:'V2',stages:STAGES.map(([id,label])=>({id,label})),legacyStages:LEGACY_STAGES.map(([id,label])=>({id,label})),predecessorKinds:PREDECESSOR_KIND,lifecyclePredecessorKinds:LIFECYCLE_PREDECESSOR_KIND,events:explicitEvents,cases,forCase:caseFor,forLot,legacy:legacySummaries,eventReference,lifecycleState,integrity:'LEGACY_INCIDENT_SUMMARY ≠ OBSERVED_PRESENCE ≠ DIAGNOSIS ≠ TREATMENT ≠ EFFICACY · OBSERVATION ≠ DIAGNOSIS · DIAGNOSIS ≠ RECOMMENDATION · RECOMMENDATION ≠ EXECUTION · ACTIVITY_LINK_EVENT ≠ ACTION · FOLLOW_UP ≠ RESULT · RESULT ≠ CAUSAL_ATTRIBUTION · RESULT ≠ CASE_CLOSURE · CASE_CLOSED_HUMAN ≠ CONDITION_RESOLVED · CASE_CLOSURE ≠ TREATMENT_EFFICACY · EMBEDDED_V1_RELATION ≠ V2_STAGE · CASE_MEMBERSHIP ≠ PREDECESSOR_REFERENCE · REFERENCE ≠ CAUSALITY'});
})();
