(() => {
  'use strict';

  const SCHEMA='SANA_CAPTURE_SYNC_LEDGER_V1';
  const INTEGRITY='LOCAL_CAPTURE ≠ QUEUED · QUEUED ≠ SYNC_ATTEMPT · SYNC_ATTEMPT ≠ SERVER_ACK · SERVER_ACK ≠ SOURCE_VERIFIED · ONLINE ≠ VERIFIED_SYNC · QUEUE_EMPTY ≠ DATA_COMPLETE · CONFLICT_DETECTED ≠ DATA_LOSS · CONFLICT_RESOLVED ≠ SOURCE_VERIFIED · SENSOR_READING ≠ CALIBRATED_MEASUREMENT · QUALITY_FLAG ≠ AGRONOMIC_DECISION · DEVICE_ID ≠ CERTIFIED_INSTRUMENT · LOCAL_PERSISTENCE ≠ CANONICAL_WRITE · NO_AUTOMATIC_CONFLICT_RESOLUTION';
  const KINDS={CAPTURED_LOCAL:'Captura local',QUEUED_LOCAL:'Encolado local',SYNC_ATTEMPTED_DEMO:'Intento de sync DEMO',SERVER_ACK_DEMO_EXPLICIT:'ACK servidor DEMO explícito',CONFLICT_DETECTED:'Conflicto detectado',HUMAN_RESOLUTION_RECORDED:'Resolución humana registrada',EVIDENCE:'Evidencia'};
  const BASE_CASES=[
    {id:'SYNC-AGU-MAN-01',recordRef:'DTR-AGU-MAN-01',lot:'AGU-A2',recordType:'sensor',label:'Humedad suelo · lectura manual',sourceClass:'MANUAL_DEMO',events:[
      {id:'SYNC-EV-001',kind:'CAPTURED_LOCAL',observedAt:'2026-08-14T07:12:00-05:00',provenance:'BASELINE_DEMO'},
      {id:'SYNC-EV-002',kind:'QUEUED_LOCAL',observedAt:'2026-08-14T07:12:01-05:00',provenance:'BASELINE_DEMO'}
    ]},
    {id:'SYNC-AGU-SEN-02',recordRef:'DTR-AGU-SEN-02',lot:'AGU-A2',recordType:'sensor',label:'Humedad suelo · sensor DEMO',sourceClass:'SENSOR_DEMO',events:[
      {id:'SYNC-EV-003',kind:'CAPTURED_LOCAL',observedAt:'2026-08-13T07:10:04-05:00',provenance:'BASELINE_DEMO'},
      {id:'SYNC-EV-004',kind:'SYNC_ATTEMPTED_DEMO',observedAt:'2026-08-13T07:10:05-05:00',provenance:'BASELINE_DEMO'},
      {id:'SYNC-EV-005',kind:'SERVER_ACK_DEMO_EXPLICIT',observedAt:'2026-08-13T07:10:06-05:00',ackRef:'ACK-DEMO-DTR-002',provenance:'BASELINE_DEMO'}
    ]},
    {id:'SYNC-CAC-CONFLICT-03',recordRef:'DTR-CAC-CONFLICT-03',lot:'CAC-B1',recordType:'import',label:'Humedad relativa · importación DEMO',sourceClass:'IMPORTED_DEMO',events:[
      {id:'SYNC-EV-006',kind:'CAPTURED_LOCAL',observedAt:'2026-08-14T06:31:00-05:00',provenance:'BASELINE_DEMO'},
      {id:'SYNC-EV-007',kind:'CONFLICT_DETECTED',observedAt:'2026-08-14T06:31:03-05:00',candidateRefs:['IMPORT-A','IMPORT-B'],provenance:'BASELINE_DEMO'}
    ]},
    {id:'SYNC-RESOLVED-DEMO-04',recordRef:'IMPORT-DEMO-RES-04',lot:'CAF-A1',recordType:'import',label:'Caso DEMO de resolución humana',sourceClass:'IMPORTED_DEMO',events:[
      {id:'SYNC-EV-008',kind:'CAPTURED_LOCAL',observedAt:'2026-08-12T12:00:00-05:00',provenance:'BASELINE_DEMO'},
      {id:'SYNC-EV-009',kind:'CONFLICT_DETECTED',observedAt:'2026-08-12T12:00:03-05:00',candidateRefs:['SRC-A','SRC-B'],provenance:'BASELINE_DEMO'},
      {id:'SYNC-EV-010',kind:'HUMAN_RESOLUTION_RECORDED',observedAt:'2026-08-12T12:20:00-05:00',resolution:'KEEP_BOTH_MARK_PRIMARY_A',reviewerRole:'Técnico DEMO',provenance:'BASELINE_DEMO'}
    ]}
  ];

  function localLifecycleEvents(){return (storage?.records||[]).filter(r=>r.type==='sync-lifecycle-event').map(r=>{const v=r.values||{};return {id:r.id,recordRef:v.recordRef||'',lot:v.lot||r.lot||'',kind:v.kind||'',observedAt:v.observedAt||r.createdAt||'',resolution:v.resolution||'',candidateRefs:String(v.candidateRefs||'').split(',').map(x=>x.trim()).filter(Boolean),evidenceRef:v.evidenceRef||'',provenance:'USER_DEMO_LOCAL'}})}
  function queuedByRecord(recordId){return (storage?.queue||[]).filter(q=>q.recordId===recordId)}
  function localCases(){
    const lifecycle=localLifecycleEvents();
    return (storage?.records||[]).filter(r=>r.type!=='sync-lifecycle-event'&&r.localOnly!==false).map(r=>{
      const q=queuedByRecord(r.id);const explicit=lifecycle.filter(e=>e.recordRef===r.id);const events=[{id:`CAP-${r.id}`,kind:'CAPTURED_LOCAL',observedAt:r.createdAt||'',provenance:'USER_DEMO_LOCAL'},...q.map(x=>({id:x.id,kind:'QUEUED_LOCAL',observedAt:x.createdAt||x.created||r.createdAt||'',queueState:x.state||'PENDING_SERVER',provenance:'USER_DEMO_LOCAL'})),...explicit];
      return {id:`SYNC-${r.id}`,recordRef:r.id,lot:r.lot||r.values?.lot||'',recordType:r.type||'record',label:r.title||r.values?.variable||r.type||'Registro local',sourceClass:r.type==='sensor'?'SENSOR_OR_MANUAL_USER_DEMO':'LOCAL_RECORD_DEMO',events,local:true};
    });
  }
  function orphanQueues(){return (storage?.queue||[]).filter(q=>!q.recordId).map(q=>({id:`SYNC-LEGACY-${q.id}`,recordRef:'',lot:q.lot||'',recordType:q.type||'legacy-queue',label:q.type||'Cola legacy',sourceClass:'LEGACY_QUEUE_ENTRY_UNLINKED',events:[{id:q.id,kind:'QUEUED_LOCAL',observedAt:q.createdAt||q.created||'',provenance:'LEGACY_QUEUE_ENTRY_UNLINKED'}],legacyUnlinked:true}))}
  function eventSort(a,b){return String(a.observedAt||'').localeCompare(String(b.observedAt||''))||String(a.id).localeCompare(String(b.id))}
  function normalizeCase(c){const events=(c.events||[]).map(e=>({...e,candidateRefs:[...(e.candidateRefs||[])]})).sort(eventSort);const kinds=new Set(events.map(e=>e.kind));const ack=events.filter(e=>e.kind==='SERVER_ACK_DEMO_EXPLICIT').at(-1)||null;const conflict=events.filter(e=>e.kind==='CONFLICT_DETECTED').at(-1)||null;const resolution=events.filter(e=>e.kind==='HUMAN_RESOLUTION_RECORDED').at(-1)||null;const queue=events.filter(e=>e.kind==='QUEUED_LOCAL').at(-1)||null;const attempt=events.filter(e=>e.kind==='SYNC_ATTEMPTED_DEMO').at(-1)||null;return {...c,events,captureRecorded:kinds.has('CAPTURED_LOCAL'),queueRecorded:Boolean(queue),syncAttemptRecorded:Boolean(attempt),ackRecorded:Boolean(ack),ackRef:ack?.ackRef||'',conflictRecorded:Boolean(conflict),resolutionRecorded:Boolean(resolution),resolution:resolution?.resolution||'',sourceVerified:false,calibratedMeasurement:false,canonicalWrite:false,productionAuthority:false,automaticResolution:false,state:resolution?'HUMAN_RESOLUTION_RECORDED':conflict?'CONFLICT_REVIEW_REQUIRED':ack?'ACK_DEMO_EXPLICIT':attempt?'SYNC_ATTEMPTED_DEMO':queue?'PENDING_SERVER':'CAPTURED_LOCAL',integrity:INTEGRITY}}
  function cases(){return [...BASE_CASES,...localCases(),...orphanQueues()].map(normalizeCase)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function forRecord(recordRef){return cases().filter(c=>c.recordRef===recordRef)}
  function summary(){const all=cases();return {schema:SCHEMA,total:all.length,localCaptures:all.filter(c=>c.captureRecorded).length,queued:all.filter(c=>c.queueRecorded).length,unlinkedLegacyQueue:all.filter(c=>c.legacyUnlinked).length,syncAttempts:all.filter(c=>c.syncAttemptRecorded).length,explicitDemoAcks:all.filter(c=>c.ackRecorded).length,conflicts:all.filter(c=>c.conflictRecorded&&!c.resolutionRecorded).length,humanResolutions:all.filter(c=>c.resolutionRecorded).length,automaticResolutions:0,canonicalWrites:0,integrity:INTEGRITY}}
  function tone(c){return c.conflictRecorded&&!c.resolutionRecorded?'warn':c.ackRecorded?'teal':c.queueRecorded?'warn':''}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  function panel(title='Cadena de captura y sincronización'){const s=summary();const all=cases();return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CAPTURE SYNC · V53</p><h2>${esc(title)}</h2><p>Cada transición es un hecho distinto. El estado online y la cola global nunca se convierten en ACK de un registro.</p></div><span class="status warn">RECORD-LEVEL</span></div><div class="card-body"><div class="grid metrics">${metric('Capturas',s.localCaptures,'captura ≠ cola')}${metric('ACK DEMO explícito',s.explicitDemoAcks,'ACK ≠ fuente verificada')}${metric('Cola legacy sin enlace',s.unlinkedLegacyQueue,'no se reconstruye',s.unlinkedLegacyQueue?'warn':'good')}${metric('Resoluciones automáticas','0','conflicto requiere humano','good')}</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Registro</th><th>Lote / tipo</th><th>Captura</th><th>Cola</th><th>Intento</th><th>ACK</th><th>Conflicto / resolución</th></tr></thead><tbody>${all.map(c=>`<tr><td><strong>${esc(c.label)}</strong><br><small>${esc(c.recordRef||c.id)}</small></td><td>${esc(c.lot||'—')}<br><small>${esc(c.recordType)}</small></td><td>${c.captureRecorded?'SÍ':'—'}</td><td>${c.queueRecorded?'PENDING/RECORDED':'—'}</td><td>${c.syncAttemptRecorded?'DEMO':'—'}</td><td><span class="status ${tone(c)}">${c.ackRecorded?esc(c.ackRef||'ACK DEMO'):'NO ACK'}</span></td><td>${c.conflictRecorded?(c.resolutionRecorded?`RESUELTO HUMANO · ${esc(c.resolution)}`:'REVIEW REQUIRED'):'—'}</td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px">${esc(INTEGRITY)}</div></div></section>`}

  const baseField=views.field;if(baseField)views.field=()=>insert(baseField(),panel('Cola y sincronización por registro'));
  const baseIot=views.iot;if(baseIot)views.iot=()=>insert(baseIot(),panel('Lecturas y sincronización por registro'));
  const basePassport=views.passport;if(basePassport)views.passport=()=>{let lot='CAF-A1';try{lot=localStorage.getItem('sana.v3.passport.lot')||lot}catch{}const list=forLot(lot);if(!list.length)return basePassport();const p=`<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">PASSPORT · CAPTURE SYNC</p><h2>Procedencia de sincronización · ${esc(lot)}</h2><p>Solo estados por registro; no certifica fuente, dispositivo, calibración ni completitud.</p></div><span class="status">READ-ONLY</span></div><div class="card-body">${list.map(c=>`<div class="gate"><i>${c.ackRecorded?'✓':'·'}</i><div><strong>${esc(c.label)}</strong><p>${esc(c.state)} · ${c.ackRecorded?esc(c.ackRef):'NO_RECORD_ACK'} · sourceVerified=false</p></div><span class="status ${tone(c)}">${c.conflictRecorded&&!c.resolutionRecorded?'REVIEW':'PROVENANCE'}</span></div>`).join('')}<div class="section-note">SERVER_ACK ≠ SOURCE_VERIFIED · CONFLICT_RESOLVED ≠ SOURCE_VERIFIED · QUEUE_EMPTY ≠ DATA_COMPLETE.</div></div></section>`;return insert(basePassport(),p)};

  window.__SANA_CAPTURE_SYNC_LEDGER__=Object.freeze({schema:SCHEMA,cases:()=>cases().map(c=>({...c,events:c.events.map(e=>({...e,candidateRefs:[...(e.candidateRefs||[])]}))})),forLot,forRecord,summary,integrity:INTEGRITY});
})();
