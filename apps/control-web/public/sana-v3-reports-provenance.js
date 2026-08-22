(() => {
  'use strict';

  const SNAPSHOT_SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const REPORTS=[
    {id:'RPT-DD',name:'Snapshot Due Diligence / Data Room DEMO',audience:'Contraparte autorizada · solo lectura',sources:['Cycle Closure','Passport','Economics Contract','Source Registry','SANA Impact','Capital Readiness'],cadence:'Por corte versionado',status:'SNAPSHOT_DEMO'},
    {id:'RPT-INS',name:'Proyección de insumos por cultivo',audience:'Equipo técnico / operación',sources:['Planes versionados','Inventario','Proyección de insumos'],cadence:'Por ciclo / corte',status:'DISPONIBLE DEMO'},
    {id:'RPT-ALT',name:'Alertas y pendientes operativos',audience:'Técnico / Productor',sources:['Campo','Sanidad','IoT','Compromisos'],cadence:'Semanal / a demanda',status:'DISPONIBLE DEMO'},
    {id:'RPT-FIN',name:'Economía por cultivo',audience:'Gestión / lectura financiera',sources:['__SANA_ECONOMICS__','Resultados','Escenario comercial'],cadence:'Por ciclo',status:'DISPONIBLE DEMO'},
    {id:'RPT-CUS',name:'Informe personalizado',audience:'Según propósito',sources:['Selección explícita'],cadence:'A demanda',status:'CONFIGURABLE'},
    {id:'RPT-REG',name:'Expediente para requerimiento regulatorio',audience:'Autoridad / cumplimiento',sources:['Passport','Evidencia','Trazabilidad'],cadence:'Según requerimiento',status:'NO ES PRESENTACIÓN OFICIAL'}
  ];

  function safeJson(value,fallback=null){try{return typeof value==='string'?JSON.parse(value):value}catch{return fallback}}
  function snapshotRecords(){return storage.records.filter(r=>r.type==='report-snapshot').map(r=>({id:r.id,...r.values,manifest:safeJson(r.values?.manifest,{}),createdAt:r.createdAt})).reverse()}
  function role(){const direct=window.__SANA_ACCESS__?.role;if(direct)return direct;const raw=String(identity?.role||'new_user').toLowerCase();return raw.includes('admin')?'admin':raw.includes('technical')||raw.includes('técn')?'technical':raw.includes('producer')||raw.includes('productor')?'producer':raw.includes('invest')?'investor':'new_user'}
  function canSnapshot(){return ['admin','technical','producer'].includes(role())&&window.__SANA_ACCESS__?.canAction?.('report-snapshot')!==false}
  function reportName(id){return REPORTS.find(r=>r.id===id)?.name||id}

  function contractRefs(){
    return [
      {id:'cycle',label:'Cycle Closure',available:Boolean(window.__SANA_CYCLE_CLOSURE__),state:'READ_MODEL'},
      {id:'passport',label:'Passport',available:Boolean(window.__SANA_PASSPORT_CHAIN__),state:'READ_MODEL'},
      {id:'economics',label:'Economics Contract',available:Boolean(window.__SANA_ECONOMICS__),state:'READ_MODEL'},
      {id:'sources',label:'Source Registry',available:Boolean(window.__SANA_DOCUMENT_SOURCES__),state:'REFERENCE_ONLY'},
      {id:'impact',label:'SANA Impact',available:Boolean(window.__SANA_IMPACT__),state:'METHODOLOGY_READ_MODEL'},
      {id:'capital',label:'Capital Readiness',available:Boolean(window.__SANA_CAPITAL_READINESS__),state:'READ_MODEL'}
    ];
  }
  function currentManifest(reportType='RPT-DD'){
    const cloud=window.__SANA_CLOUD_STATE__?.describe?.()||{};
    const cycleApi=window.__SANA_CYCLE_CLOSURE__;
    const passportApi=window.__SANA_PASSPORT_CHAIN__;
    const econApi=window.__SANA_ECONOMICS__;
    const sourceApi=window.__SANA_DOCUMENT_SOURCES__;
    const impactApi=window.__SANA_IMPACT__;
    const capitalApi=window.__SANA_CAPITAL_READINESS__;
    const cycles=(cycleApi?.dossiers?.()||[]).map(d=>({
      planId:d.plan.id,planVersion:d.plan.version,lot:d.plan.lot,completeness:d.completeness,evidenceGaps:d.evidenceGaps,openActivities:d.open.length,readyForArchive:d.readyForArchive,
      reviewStatus:d.reviews?.[0]?.values?.status||'SIN_REVISIÓN'
    }));
    const economics=(econApi?.rows?.()||[]).map(r=>({lotId:r.lot.id,budget:r.budget,baseRecorded:r.baseRecorded,baseRecordedProvenance:r.baseRecordedProvenance,localRecorded:r.localRecorded,observedStatus:r.observed?.status||'SIN_RESULTADO'}));
    const passport=DEMO.lots.filter(l=>l.id!=='VIV-01').map(l=>{
      const chain=passportApi?.chainFor?.(l.id);return {lot:l.id,integrity:chain&&passportApi?.integrityScore?passportApi.integrityScore(chain):null};
    });
    const sources=(sourceApi?.rows?.()||[]).map(s=>({id:s.id,scope:s.scope,version:s.version,cut:s.cut,state:s.state,externalId:s.externalId}));
    const impact=impactApi?.summary?.()||null;
    const gates=capitalApi?.gateData?.()||null;
    const capital=gates?{readiness:capitalApi.overall?.(gates)??null,gates:Object.fromEntries(Object.entries(gates).map(([id,g])=>[id,{score:g.score,state:g.state}]))}:null;
    return {
      schema:SNAPSHOT_SCHEMA,
      mode:'SNAPSHOT_DEMO',
      reportType,
      generatedAt:new Date().toISOString(),
      environment:'DEMO',
      farm:{id:DEMO.farm.id,name:DEMO.farm.name},
      cloud:{status:cloud.status||'LOCAL_ONLY',revision:cloud.revision||0,dirty:Boolean(cloud.dirty)},
      plans:DEMO.plans.map(p=>({id:p.id,version:p.version,lot:p.lot,phase:p.phase})),
      cycles,economics,passport,sources,impact,capital,
      contracts:contractRefs(),
      boundaries:['SNAPSHOT_DEMO ≠ EXTERNAL_VERIFICATION','REFERENCE_ONLY ≠ VERIFIED','LOCAL_ONLY ≠ SYNCED ≠ ACK','READINESS ≠ ELIGIBILITY ≠ INVESTMENT_RECOMMENDATION','NO KYC · NO OFFER · NO CUSTODY · NO PAYMENT · NO EXTERNAL DATA ROOM WRITE']
    };
  }
  function sourceSummary(manifest=currentManifest()){
    return manifest.contracts.map(c=>`${c.label}: ${c.available?'AVAILABLE':'MISSING'} · ${c.state}`).join('\n');
  }
  function sourceVersions(){
    const manifest=currentManifest();
    return [
      `Planes: ${manifest.plans.map(p=>`${p.id} v${p.version}`).join(' · ')}`,
      `Estado local/cloud: ${manifest.cloud.status} · rev ${manifest.cloud.revision}`,
      `Contratos disponibles: ${manifest.contracts.filter(c=>c.available).length}/${manifest.contracts.length}`,
      `Fuentes documentales: ${manifest.sources.length} referencia(s)`,
      `Impacto: ${manifest.impact?.humanReviewed?'REVISADO DEMO':'HUMAN_REVIEW_REQUIRED'} · externo ${manifest.impact?.externallyVerified||0}`,
      `Corte vivo: ${new Date().toLocaleDateString('es-CO')}`
    ];
  }

  function snapshotDetail(s){
    const m=s.manifest||{};const contracts=m.contracts||[];const cycles=m.cycles||[];
    return `${m.schema||'LEGACY_SNAPSHOT'} · ${contracts.filter(c=>c.available).length}/${contracts.length||0} contratos · ${cycles.length} ciclo(s) · ${m.mode||'LOCAL/NUBE DEMO'}`;
  }
  function currentDataRoomCard(){
    const m=currentManifest();const available=m.contracts.filter(c=>c.available).length;const cycles=m.cycles||[];const weakest=cycles.slice().sort((a,b)=>a.completeness-b.completeness)[0];
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Data Room DEMO · manifest actual</h2><p>Índice automático de read-models; no copia documentos externos ni crea una segunda verdad.</p></div><span class="status ${available===m.contracts.length?'teal':'warn'}">${available}/${m.contracts.length} CONTRATOS</span></div><div class="card-body"><div class="grid metrics">${metric('Esquema',SNAPSHOT_SCHEMA,'manifest versionado')}${metric('Ciclos referenciados',cycles.length,weakest?`menor completitud ${weakest.planId}: ${weakest.completeness}%`:'sin ciclos')}${metric('Fuentes externas',m.sources.length,'metadatos REFERENCE_ONLY')}${metric('Verificación externa',m.impact?.externallyVerified||0,'no asumir certificación','warn')}</div><div class="quick-grid" style="grid-template-columns:1fr 1fr;margin-top:12px">${m.contracts.map(c=>`<div class="quick" style="cursor:default"><strong>${esc(c.label)}</strong><span>${c.available?'Disponible':'No disponible'} · ${esc(c.state)}</span></div>`).join('')}</div><div class="section-note" style="margin-top:12px">Este manifest captura salidas de contratos fuente en un corte DEMO. No firma, sella, certifica ni verifica externamente datos; tampoco crea KYC, oferta, elegibilidad, aprobación, custodia, pago o escritura en un Data Room externo.</div></div></section>`;
  }

  function reports(){
    const snaps=snapshotRecords();
    return `${head('AGROWAY · INFORMES Y DATA ROOM','Un informe vale por la trazabilidad de lo que contiene.','SANA añade procedencia, versión, fecha de corte y manifest automático. Un snapshot conserva qué read-models y referencias alimentaron la lectura, sin convertir una salida DEMO en verificación externa, radicación, oferta o decisión.',canSnapshot()?`<button class="btn primary" data-report-snapshot>Registrar snapshot DEMO</button>`:'')}
      <section class="grid metrics">${metric('Familias de informe',REPORTS.length,'incluye Due Diligence / Data Room','good')}${metric('Snapshots registrados',snaps.length,'por esta identidad',snaps.length?'good':'warn')}${metric('Contratos fuente',`${contractRefs().filter(c=>c.available).length}/${contractRefs().length}`,'read-models disponibles','good')}${metric('Presentaciones oficiales','0','requieren proceso humano/externo','warn')}</section>
      ${currentDataRoomCard()}
      <section class="grid two" style="margin-top:14px">${REPORTS.map(r=>`<article class="card"><div class="card-head"><div><h2>${esc(r.name)}</h2><p>${esc(r.audience)} · ${esc(r.cadence)}</p></div><span class="status ${r.id==='RPT-REG'||r.id==='RPT-DD'?'warn':''}">${esc(r.status)}</span></div><div class="card-body"><div class="chip-row">${r.sources.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div><div class="section-note" style="margin-top:12px">${r.id==='RPT-DD'?'El manifest se genera desde contratos fuente; el usuario no declara manualmente qué fuentes “usó”.':'Una salida de esta familia debe conservar sus fuentes, corte y revisor.'} Generar un informe DEMO no equivale a presentarlo ante una autoridad, entidad financiera o tercero.</div></div></article>`).join('')}</section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Linaje mínimo de cada snapshot</h2><p>Metadatos que viajan con cualquier corte.</p></div></div><div class="card-body"><div class="flow"><div class="flow-step"><b>01</b><span>Propósito</span><small>para quién / por qué</small></div><div class="flow-step"><b>02</b><span>Manifest</span><small>contratos fuente</small></div><div class="flow-step"><b>03</b><span>Versiones</span><small>plan / revisión</small></div><div class="flow-step"><b>04</b><span>Corte</span><small>fecha y hora</small></div><div class="flow-step"><b>05</b><span>Revisor</span><small>persona responsable</small></div><div class="flow-step"><b>06</b><span>Integridad</span><small>SNAPSHOT_DEMO</small></div></div></div></section>
      <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Historial de snapshots DEMO</h2><p>Registros por identidad; nunca expedientes oficiales ni archivos externos.</p></div></div><div class="card-body">${snaps.length?snaps.map(s=>`<div class="row"><span class="dot"></span><div class="copy"><strong>${esc(reportName(s.reportType||'RPT-DD'))}</strong><span>${esc(s.purpose||'Sin propósito')} · corte ${esc(s.cutoff||'—')}</span><small>${esc(snapshotDetail(s))}</small></div><div class="meta">${esc(s.reviewer||'Sin revisor')}<br><span class="status">${esc(s.status||'SNAPSHOT_DEMO')}</span></div></div>`).join(''):'<div class="empty">Aún no existen snapshots creados por esta identidad.</div>'}</div></section>
      <section class="grid two" style="margin-top:14px"><article class="card"><div class="card-head"><div><h2>Fuentes actuales</h2><p>Procedencia visible del manifest vivo.</p></div></div><div class="card-body">${sourceVersions().map((x,i)=>`<div class="gate"><i>${i+1}</i><div><strong>${esc(x.split(':')[0])}</strong><p>${esc(x.split(':').slice(1).join(':').trim())}</p></div><span class="status">DEMO</span></div>`).join('')}</div></article><article class="card"><div class="card-head"><div><h2>Fronteras del Data Room</h2><p>Qué no hace “Registrar snapshot”.</p></div></div><div class="card-body"><div class="gate"><i class="blocked">×</i><div><strong>Certificar / verificar externamente</strong><p>El snapshot organiza procedencia; no autentica fuentes externas.</p></div><span class="status danger">NO</span></div><div class="gate"><i class="blocked">×</i><div><strong>Radicar / compartir externamente</strong><p>No existe envío, firma, ACL, upload ni escritura a un Data Room externo.</p></div><span class="status danger">NO</span></div><div class="gate"><i class="blocked">×</i><div><strong>KYC / elegibilidad / aprobación</strong><p>Readiness y snapshot no sustituyen due diligence humana o regulatoria.</p></div><span class="status danger">HUMAN_ONLY</span></div></div></article></section>${footer()}`;
  }

  views.reports=reports;
  window.__SANA_DUE_DILIGENCE_SNAPSHOT__=Object.freeze({schema:SNAPSHOT_SCHEMA,currentManifest,snapshots:()=>snapshotRecords().map(s=>({...s,manifest:{...(s.manifest||{})}})),contractRefs:()=>contractRefs().map(c=>({...c})),integrity:'SNAPSHOT_DEMO ≠ EXTERNAL_VERIFICATION ≠ DATA_ROOM_WRITE'});

  function openSnapshot(){
    const options=REPORTS.map(r=>`<option value="${r.id}" ${r.id==='RPT-DD'?'selected':''}>${esc(r.name)}</option>`).join('');
    const manifest=currentManifest('RPT-DD');const manifestJson=JSON.stringify(manifest);const refs=sourceSummary(manifest);
    openModal('INFORMES · SNAPSHOT TRAZABLE','Registrar snapshot DEMO',`<div class="fields"><label>Familia de informe<select name="reportType">${options}</select></label><label>Fecha de corte<input name="cutoff" type="date" required></label><label>Revisor humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label>Estado<select name="status"><option>SNAPSHOT_DEMO</option><option>REVISADO DEMO</option><option>PENDIENTE EVIDENCIA</option></select></label><label class="full">Propósito<textarea name="purpose" required placeholder="Pregunta de due diligence o necesidad informativa que motiva este corte"></textarea></label><label class="full">Contratos capturados<textarea readonly>${esc(refs)}</textarea></label><label class="full">Notas de calidad / exclusiones<textarea name="detail" placeholder="Qué requiere verificación externa o revisión humana adicional"></textarea></label><input type="hidden" name="snapshotSchema" value="${SNAPSHOT_SCHEMA}"><input type="hidden" name="sources" value="${esc(refs.replace(/\n/g,' | '))}"><textarea name="manifest" hidden>${esc(manifestJson)}</textarea><label class="full">Integridad<input value="SNAPSHOT_DEMO · NO ES RADICACIÓN, CERTIFICACIÓN, KYC, OFERTA NI DATA ROOM EXTERNO" readonly></label></div>`,true,'report-snapshot');
  }

  document.addEventListener('click',event=>{if(event.target.closest('[data-report-snapshot]'))openSnapshot()});
})();
