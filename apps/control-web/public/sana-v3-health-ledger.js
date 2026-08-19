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
    return {id:r.id,caseId:v.caseId||r.id,eventKind:v.eventKind||'OBSERVATION',lot:v.lot||r.lot||'',observedAt:v.observedAt||String(r.createdAt||'').slice(0,10),scope:v.scope||'',presenceStatus:v.presenceStatus||'',findingClass:v.findingClass||'',diagnosisStatus:v.diagnosisStatus||'',activityId:v.activityId||'',actionType:v.actionType||'',product:v.product||'',dose:v.dose||'',evidenceRef:v.evidenceRef||'',followUpClass:v.followUpClass||'',resultClass:v.resultClass||'',effectivenessObserved:v.effectivenessObserved||'',compareBasis:v.compareBasis||'',basis:v.basis||'',detail:v.detail||r.title||'',author:v.author||identity?.displayName||'Responsable DEMO',provenance:v.provenance||'LOCAL_ONLY',healthSchema:SCHEMA,projectionVersion:v.projectionVersion||'V1_COMPAT',local:true};
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
  function coverage(stageEvents,stages){
    const covered=stages.filter(([kind])=>(stageEvents[kind]||[]).length).length;
    return {covered,total:stages.length,percent:Math.round(covered/stages.length*100)};
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
    return {
      id:caseId,lot:first.lot,scope:first.scope||'',openedAt:first.observedAt,projectionVersion:'V2',events,stageEvents,observations,findings,recommendations,activityLinks,actions,evidence,followups,results,
      stageCoverage:coverage(stageEvents,LEGACY_STAGES),
      chainCoverage:coverage(stageEvents,STAGES),
      semantics:{observedPresence,confirmedDiagnosis,efficacyObservations:explicitResultEfficacyObservations+embeddedEfficacyObservationsV1,explicitResultEfficacyObservations,embeddedEfficacyObservationsV1,explicitActivityLinks:activityLinks.length,embeddedActivityLinksV1,explicitResults:results.length,embeddedResultsV1,actionLinkIssues},
      latestFollowUp:followups[followups.length-1]||null,
      latestResult:results[results.length-1]||null,
      integrity:'OBSERVATION ≠ DIAGNOSIS · DIAGNOSIS ≠ RECOMMENDATION · RECOMMENDATION ≠ ACTIVITY_LINK ≠ EXECUTION · ACTIVITY_LINK_EVENT ≠ ACTION · FOLLOW_UP ≠ RESULT · RESULT ≠ CAUSAL_ATTRIBUTION · EMBEDDED_V1_RELATION ≠ V2_STAGE'
    };
  }
  function cases(){return [...new Set(explicitEvents().map(e=>e.caseId))].map(caseFor).filter(Boolean)}
  function forLot(lot){return {explicit:cases().filter(c=>c.lot===lot),legacy:legacySummaries().filter(c=>c.lot===lot)}}
  function all(){return {explicit:cases(),legacy:legacySummaries()}}
  function eventLabel(kind){return STAGE_LABEL[kind]||String(kind||'').replaceAll('_',' ')}
  function toneForCase(c){return c.semantics.actionLinkIssues?'danger':c.chainCoverage.percent<100?'warn':'teal'}
  function linkText(a){return a.activityLink.status==='LINKED'?`${a.activityId} · ${a.activityLink.activity?.state?.label||'actividad'}`:a.activityLink.status}

  function compatibilityNote(c){
    const parts=[];
    if(c.semantics.embeddedActivityLinksV1&&!c.activityLinks.length)parts.push(`${c.semantics.embeddedActivityLinksV1} vínculo(s) V1 embebido(s) en ACTION; no completan ACTIVITY_LINK V2`);
    if(c.semantics.embeddedResultsV1&&!c.results.length)parts.push(`${c.semantics.embeddedResultsV1} resultado(s) V1 embebido(s) en FOLLOW_UP; no completan RESULT V2`);
    return parts.length?`<div class="section-note" style="margin-top:12px"><strong>Compatibilidad histórica:</strong> ${esc(parts.join(' · '))}. No hay promoción retroactiva de semántica.</div>`:'';
  }
  function eventChips(e){
    const resolved=e.activityId?activityLink(e):null;
    return `<div class="chip-row"><span class="chip">${esc(e.provenance||'—')}</span>${e.projectionVersion?`<span class="chip">${esc(e.projectionVersion)}</span>`:''}${e.presenceStatus?`<span class="chip">${esc(e.presenceStatus)}</span>`:''}${e.diagnosisStatus?`<span class="chip">${esc(e.diagnosisStatus)}</span>`:''}${e.activityId?`<span class="chip">${esc(linkText({...e,activityLink:resolved}))}</span>`:''}${e.followUpClass?`<span class="chip">${esc(e.followUpClass)}</span>`:''}${e.resultClass?`<span class="chip">${esc(e.resultClass)}</span>`:''}${e.effectivenessObserved?`<span class="chip">${esc(e.effectivenessObserved)}</span>`:''}</div>`;
  }
  function caseCard(c){
    const f=c.findings[c.findings.length-1];
    const result=c.latestResult;
    return `<article class="card"><div class="card-head"><div><small>${esc(c.id)} · ${esc(c.lot)}</small><h2>${esc(c.scope||'Caso sanitario')}</h2><p>${f?`${esc(f.findingClass||'Hallazgo')} · ${esc(f.diagnosisStatus||'SIN DIAGNÓSTICO')}`:'Sin hallazgo/diagnóstico explícito'}</p></div><span class="status ${toneForCase(c)}">${c.chainCoverage.percent}% CADENA V2</span></div><div class="card-body"><div class="grid metrics">${metric('Presencia observada',c.semantics.observedPresence,'solo OBSERVATION')}${metric('Diagnóstico humano',c.semantics.confirmedDiagnosis,'solo confirmación humana explícita')}${metric('Vínculos Activity V2',c.activityLinks.filter(a=>a.activityLink.status==='LINKED').length,`${c.activityLinks.length} vínculo(s) explícito(s)`) }${metric('Acciones registradas',c.actions.length,'vínculo ≠ ejecución')}${metric('Resultados V2',c.results.length,result?.effectivenessObserved||'sin resultado explícito')}</div><div class="workflow" style="margin-top:12px">${STAGES.map(([kind,label],i)=>`<div class="stage ${c.stageEvents[kind].length?'done':''}"><span class="num">${i+1}</span><strong>${esc(label)}</strong><span>${c.stageEvents[kind].length?`${c.stageEvents[kind].length} evento(s)`:'sin evento explícito'}</span></div>`).join('')}</div><div class="head-actions" style="margin-top:12px">${STAGES.map(([kind,label])=>`<button class="btn secondary" data-health-event="${kind}" data-health-case="${esc(c.id)}">${esc(label)}</button>`).join('')}</div><div class="timeline" style="margin-top:14px">${c.events.filter(e=>e.eventKind!=='CASE_OPEN').map(e=>`<div class="timeline-item"><i></i><div><strong>${esc(eventLabel(e.eventKind))} · ${esc(e.id)}</strong><p>${esc(e.detail||'—')}</p>${eventChips(e)}</div><time>${esc(e.observedAt||'—')}</time></div>`).join('')}</div>${compatibilityNote(c)}<div class="section-note" style="margin-top:12px"><strong>Frontera V2:</strong> OBSERVATION ≠ DIAGNOSIS ≠ RECOMMENDATION ≠ ACTIVITY_LINK ≠ ACTION ≠ EVIDENCE ≠ FOLLOW_UP ≠ RESULT. Un cambio observado no demuestra causalidad del tratamiento.</div></div></article>`;
  }
  function legacyPanel(rows){
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD · HISTORIA LEGACY</p><h2>Resúmenes anteriores sin semántica retroactiva</h2><p>Se conservan como evidencia histórica resumida. Un estado “cerrado” no se interpreta como tratamiento aplicado ni como eficacia demostrada.</p></div><span class="status warn">${rows.length} LEGACY</span></div><div class="card-body">${rows.map(i=>`<div class="row"><span class="dot warn"></span><div class="copy"><strong>${esc(i.sourceId)} · ${esc(i.lot)} · ${esc(i.summary)}</strong><span>${esc(i.semanticState)}</span></div><div class="meta"><span class="status warn">${esc(i.status||'LEGACY')}</span><br>${esc(i.date||'—')}</div></div>`).join('')||'<div class="empty">Sin historia legacy.</div>'}<div class="section-note" style="margin-top:12px">LEGACY_INCIDENT_SUMMARY ≠ OBSERVED_PRESENCE ≠ DIAGNOSIS ≠ TREATMENT ≠ EFFICACY.</div></div></section>`;
  }
  function ledgerPanel(){
    const data=all();const explicit=data.explicit;const legacy=data.legacy;
    const observed=explicit.reduce((n,c)=>n+c.semantics.observedPresence,0);const diagnosed=explicit.reduce((n,c)=>n+c.semantics.confirmedDiagnosis,0);const links=explicit.reduce((n,c)=>n+c.activityLinks.length,0);const actions=explicit.reduce((n,c)=>n+c.actions.length,0);const results=explicit.reduce((n,c)=>n+c.results.length,0);
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD VEGETAL · CADENA V2</p><h2>Ocho transiciones auditables sin fabricar causalidad</h2><p>V121 separa por primera vez el vínculo con Activity Contract de la ejecución, y el seguimiento del resultado observado. La cobertura V1 se conserva aparte para compatibilidad histórica.</p></div><button class="btn primary" data-health-new-case>Abrir caso sanitario</button></div><div class="card-body"><div class="grid metrics">${metric('Casos',explicit.length,'proyección V2 sobre ledger V1')}${metric('Presencias observadas',observed,'no inferidas desde alertas')}${metric('Diagnósticos humanos',diagnosed,'confirmaciones explícitas')}${metric('Vínculos Activity V2',links,'relación ≠ ejecución')}${metric('Acciones',actions,'ejecución registrada')}${metric('Resultados V2',results,'resultado ≠ causalidad')}</div><div class="section-note" style="margin-top:12px"><strong>Contrato V121:</strong> ACTIVITY_LINK_EVENT ≠ ACTION. FOLLOW_UP ≠ RESULT. Los activityId/resultados embebidos en eventos V1 siguen visibles, pero no completan las nuevas etapas V2.</div></div></section><section class="grid two" style="margin-top:14px">${explicit.map(caseCard).join('')||'<div class="empty">Sin casos V2.</div>'}</section>${legacyPanel(legacy)}`;
  }
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}

  const baseHealth=views.health;
  if(baseHealth)views.health=function healthWithLedger(){let html=baseHealth();html=html.replace('data-action="health">Registrar monitoreo','data-health-new-case>Abrir caso sanitario');html=html.replace('<h2>Incidencias y vigilancia</h2><p>Sin automatizar la decisión agronómica.</p>','<h2>Resumen de incidencias heredado</h2><p>Contexto histórico; no equivale a la cadena sanitaria V2.</p>');return insert(html,ledgerPanel())};

  function passportPanel(){
    let lot='CAF-A1';try{lot=localStorage.getItem('sana.v3.passport.lot')||lot}catch{}
    const data=forLot(lot);const explicit=data.explicit;
    if(!explicit.length&&!data.legacy.length)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD · PASSPORT</p><h2>Sin historia sanitaria vinculada</h2><p>No se inventa una condición fitosanitaria a partir de ausencia de registros.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">SANIDAD · PASSPORT</p><h2>Procedencia sanitaria reconstruible del lote ${esc(lot)}</h2><p>Observación → diagnóstico/hallazgo → recomendación → actividad vinculada → acción → evidencia → seguimiento → resultado.</p></div><span class="status">${explicit.length} V2 · ${data.legacy.length} LEGACY</span></div><div class="card-body">${explicit.map(c=>`<div class="gate"><i>${c.chainCoverage.covered}</i><div><strong>${esc(c.id)} · ${esc(c.scope||'Caso sanitario')}</strong><p>${c.chainCoverage.percent}% cadena V2 · presencia ${c.semantics.observedPresence} · diagnóstico ${c.semantics.confirmedDiagnosis} · vínculos ${c.activityLinks.length} · acciones ${c.actions.length} · resultados ${c.results.length}</p></div><span class="status ${toneForCase(c)}">${c.chainCoverage.percent===100?'TRAZABLE V2 DEMO':'PARCIAL V2'}</span></div>`).join('')}${data.legacy.length?`<div class="section-note" style="margin-top:12px">${data.legacy.length} resumen(es) legacy permanecen visibles pero no se convierten en diagnóstico, tratamiento o eficacia.</div>`:''}<div class="section-note" style="margin-top:12px">PASSPORT PHYTOSANITARY ≠ ICA CERTIFICATION ≠ DIAGNOSIS CERTIFICATE ≠ TREATMENT AUTHORIZATION ≠ CAUSAL EFFICACY.</div></div></section>`;
  }
  const basePassport=views.passport;
  if(basePassport)views.passport=function passportWithHealth(){return insert(basePassport(),passportPanel())};

  function lotOptions(selected=''){return DEMO.lots.map(l=>`<option value="${esc(l.id)}" ${l.id===selected?'selected':''}>${esc(l.id)} · ${esc(l.crop)}</option>`).join('')}
  function activityOptions(lot){const rows=workflow()?.forLot?.(lot)||[];return `<option value="">Seleccionar actividad</option>${rows.map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${esc(a.title)}</option>`).join('')}`}
  function openCase(){const id=`SAN-${Date.now()}`;openModal('SANIDAD · CADENA V2','Abrir caso sanitario',`<div class="fields"><input type="hidden" name="healthSchema" value="${SCHEMA}"><input type="hidden" name="projectionVersion" value="V2"><input type="hidden" name="eventKind" value="CASE_OPEN"><input type="hidden" name="caseId" value="${id}"><label>Caso<input value="${id}" readonly></label><label>Lote<select name="lot">${lotOptions()}</select></label><label>Ámbito<select name="scope"><option value="BIOTIC_RISK">Riesgo biótico</option><option value="ABIOTIC_STRESS">Estrés abiótico</option><option value="UNKNOWN">Por determinar</option></select></label><label>Fecha<input name="observedAt" type="date" required></label><label>Responsable humano<input name="author" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Procedencia<select name="provenance"><option>OBSERVED_DEMO</option><option>DECLARED_DEMO</option><option>DOCUMENTAL_DEMO</option></select></label><label class="full">Motivo de apertura<textarea name="detail" required placeholder="Qué se observó o qué riesgo requiere seguimiento. No diagnosticar por inferencia."></textarea></label></div>`,true,'phytosanitary-event')}
  function openEvent(kind,caseId){
    const c=caseFor(caseId);if(!c)return;
    const common=`<input type="hidden" name="healthSchema" value="${SCHEMA}"><input type="hidden" name="projectionVersion" value="V2"><input type="hidden" name="eventKind" value="${kind}"><input type="hidden" name="caseId" value="${esc(caseId)}"><input type="hidden" name="lot" value="${esc(c.lot)}"><label>Caso<input value="${esc(caseId)} · ${esc(c.lot)}" readonly></label><label>Fecha<input name="observedAt" type="date" required></label><label>Responsable humano<input name="author" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label>`;
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
  document.addEventListener('click',event=>{if(event.target.closest('[data-health-new-case]')){openCase();return}const b=event.target.closest('[data-health-event]');if(b)openEvent(b.dataset.healthEvent,b.dataset.healthCase)});

  window.__SANA_PHYTOSANITARY_LEDGER__=Object.freeze({schema:SCHEMA,projection:PROJECTION,projectionVersion:'V2',stages:STAGES.map(([id,label])=>({id,label})),legacyStages:LEGACY_STAGES.map(([id,label])=>({id,label})),events:explicitEvents,cases,forCase:caseFor,forLot,legacy:legacySummaries,integrity:'LEGACY_INCIDENT_SUMMARY ≠ OBSERVED_PRESENCE ≠ DIAGNOSIS ≠ TREATMENT ≠ EFFICACY · OBSERVATION ≠ DIAGNOSIS · DIAGNOSIS ≠ RECOMMENDATION · RECOMMENDATION ≠ EXECUTION · ACTIVITY_LINK_EVENT ≠ ACTION · FOLLOW_UP ≠ RESULT · RESULT ≠ CAUSAL_ATTRIBUTION · EMBEDDED_V1_RELATION ≠ V2_STAGE'});
})();
