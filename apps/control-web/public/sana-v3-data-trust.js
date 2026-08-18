(() => {
  'use strict';

  const SCHEMA='SANA_DATA_TRUST_V1';
  const INTEGRITY='CAPTURED ≠ SYNCED · SYNC_ATTEMPT ≠ SERVER_ACK · SERVER_ACK ≠ HARDWARE_VERIFIED · SOURCE_LABEL ≠ SOURCE_AUTHENTICITY · READING ≠ VALIDATED_MEASUREMENT · VALIDATED_MEASUREMENT ≠ MANAGEMENT_DECISION · NETWORK_ONLINE ≠ RECORD_SYNCED · LOCAL_PERSISTENCE ≠ CANONICAL_WRITE · CONFLICT ≠ DATA_LOSS';

  const BASE=[
    {
      id:'DTR-AGU-MAN-01',lot:'AGU-A2',variable:'Humedad suelo',value:43,unit:'%',observedAt:'2026-08-14T07:10:00-05:00',capturedAt:'2026-08-14T07:12:00-05:00',point:'P3',method:'Lectura manual puntual',sourceClass:'MANUAL_DEMO',sourceRef:'OPERADOR_DEMO',qualityClaim:'OBSERVED_DEMO',hardwareVerification:'NOT_APPLICABLE',calibrationState:'METHOD_NOT_VERIFIED',locationIntegrity:'LOT_AND_POINT_DECLARED',timeIntegrity:'CLIENT_TIME_DECLARED',captureState:'CAPTURED_LOCAL',queueState:'QUEUED_DEMO_NO_ACK',syncAttemptState:'NOT_CAPTURED_AT_RECORD_LEVEL',ackState:'NO_RECORD_ACK',ackRef:'',validationState:'UNVALIDATED',conflictState:'NONE',humanReview:'REQUIRED',provenance:'BASELINE_DEMO',note:'Lectura manual retenida localmente. La existencia de red o nube de cuenta no demuestra ACK de este registro.'
    },
    {
      id:'DTR-AGU-SEN-02',lot:'AGU-A2',variable:'Humedad suelo',value:45,unit:'%',observedAt:'2026-08-13T07:10:00-05:00',capturedAt:'2026-08-13T07:10:04-05:00',point:'S2',method:'Sensor capacitivo DEMO',sourceClass:'SENSOR_DEMO',sourceRef:'SEN-SOIL-DEMO-07',qualityClaim:'OBSERVED_DEMO',hardwareVerification:'HARDWARE_NOT_VERIFIED',calibrationState:'CALIBRATION_NOT_CAPTURED',locationIntegrity:'LOT_AND_POINT_DECLARED',timeIntegrity:'DEVICE_TIME_NOT_VERIFIED',captureState:'CAPTURED_DEMO',queueState:'NOT_QUEUED',syncAttemptState:'SYNC_ATTEMPTED_DEMO',ackState:'SERVER_ACK_DEMO_EXPLICIT',ackRef:'ACK-DEMO-DTR-002',validationState:'UNVALIDATED',conflictState:'NONE',humanReview:'REQUIRED',provenance:'BASELINE_DEMO',note:'Caso sintético con ACK DEMO explícito. El ACK no autentica hardware, calibración ni validez agronómica.'
    },
    {
      id:'DTR-CAC-CONFLICT-03',lot:'CAC-B1',variable:'Humedad relativa',value:null,unit:'%',observedAt:'2026-08-14T06:30:00-05:00',capturedAt:'2026-08-14T06:31:00-05:00',point:'P1',method:'Importación DEMO',sourceClass:'IMPORTED_DEMO',sourceRef:'IMPORT-DEMO-03',qualityClaim:'PENDING_VERIFICATION',hardwareVerification:'SOURCE_AUTHENTICITY_NOT_VERIFIED',calibrationState:'NOT_APPLICABLE',locationIntegrity:'LOT_AND_POINT_DECLARED',timeIntegrity:'SOURCE_TIME_DECLARED',captureState:'CAPTURED_DEMO',queueState:'NOT_QUEUED',syncAttemptState:'NOT_CAPTURED_AT_RECORD_LEVEL',ackState:'NO_RECORD_ACK',ackRef:'',validationState:'UNVALIDATED',conflictState:'CONFLICT_REVIEW_REQUIRED',humanReview:'REQUIRED',provenance:'BASELINE_DEMO',candidates:[{candidateId:'A',value:68,unit:'%',sourceRef:'IMPORT-A',capturedAt:'2026-08-14T06:31:00-05:00'},{candidateId:'B',value:76,unit:'%',sourceRef:'IMPORT-B',capturedAt:'2026-08-14T06:31:03-05:00'}],note:'Dos candidatos incompatibles se preservan. No existe resolución automática ni last-write-wins.'
    }
  ];

  function cloudContext(){
    const fallback={status:'LOCAL_ONLY',connected:false,conflict:false,revision:0,dirty:false};
    try{return {...fallback,...(window.__SANA_CLOUD_STATE__?.describe?.()||{})}}catch{return fallback}
  }

  function sourceClass(value=''){
    const s=String(value).toLowerCase();
    if(s.includes('sensor'))return 'SENSOR_DEMO';
    if(s.includes('import'))return 'IMPORTED_DEMO';
    return 'MANUAL_DEMO';
  }

  function hardwareState(kind,values={}){
    if(kind==='SENSOR_DEMO')return values.hardwareVerification||'HARDWARE_NOT_VERIFIED';
    if(kind==='IMPORTED_DEMO')return values.hardwareVerification||'SOURCE_AUTHENTICITY_NOT_VERIFIED';
    return 'NOT_APPLICABLE';
  }

  function userRows(){
    const cloud=cloudContext();
    const records=(storage?.records||[]).filter(r=>r.type==='sensor');
    return records.map(r=>{
      const v=r.values||{};
      const kind=sourceClass(v.source);
      const explicitQueue=(storage?.queue||[]).find(q=>q.recordId===r.id);
      return {
        id:r.id,lot:v.lot||r.lot||'',variable:v.variable||r.title||'Lectura',value:v.value===''||v.value===undefined?null:Number(v.value),unit:v.unit||'',observedAt:v.observedAt||r.createdAt||'',capturedAt:r.createdAt||'',point:v.point||'',method:v.method||'',sourceClass:kind,sourceRef:v.deviceRef||v.sourceRef||'',qualityClaim:v.quality||'NOT_CAPTURED',hardwareVerification:hardwareState(kind,v),calibrationState:v.calibration||'NOT_CAPTURED',locationIntegrity:v.point?'LOT_AND_POINT_DECLARED':'LOT_ONLY_DECLARED',timeIntegrity:v.observedAt?'OBSERVED_TIME_DECLARED':'CAPTURE_TIME_ONLY',captureState:'CAPTURED_LOCAL',queueState:explicitQueue?'QUEUED_EXPLICIT_RECORD_LINK':'QUEUE_RELATION_NOT_CAPTURED',syncAttemptState:'NOT_CAPTURED_AT_RECORD_LEVEL',ackState:'NO_RECORD_ACK',ackRef:'',validationState:'UNVALIDATED',conflictState:'NONE',humanReview:'REQUIRED',provenance:'USER_DEMO_LOCAL',accountCloudStatus:cloud.status,accountCloudRevision:cloud.revision,accountCloudConflict:Boolean(cloud.conflict),candidates:[],note:'Registro del usuario. El estado de sincronización de la cuenta se conserva como contexto y no se promueve a ACK del registro.'
      };
    });
  }

  function reviewFlags(row){
    const flags=[];
    if(!row.unit)flags.push('UNIT_NOT_CAPTURED');
    if(!row.method)flags.push('METHOD_NOT_CAPTURED');
    if(!row.observedAt)flags.push('OBSERVED_TIME_NOT_CAPTURED');
    if(row.sourceClass==='SENSOR_DEMO'&&!row.sourceRef)flags.push('DEVICE_REF_NOT_CAPTURED');
    if(row.sourceClass==='SENSOR_DEMO'&&row.hardwareVerification!=='HARDWARE_VERIFIED')flags.push('HARDWARE_NOT_VERIFIED');
    if(row.calibrationState==='NOT_CAPTURED'||row.calibrationState==='CALIBRATION_NOT_CAPTURED')flags.push('CALIBRATION_NOT_CAPTURED');
    if(row.ackState==='NO_RECORD_ACK')flags.push('NO_RECORD_ACK');
    if(row.validationState!=='VALIDATED')flags.push('MEASUREMENT_NOT_VALIDATED');
    if(row.conflictState==='CONFLICT_REVIEW_REQUIRED')flags.push('CONFLICT_REVIEW_REQUIRED');
    return flags;
  }

  function normalize(row){
    const flags=reviewFlags(row);
    return {...row,candidates:(row.candidates||[]).map(x=>({...x})),reviewFlags:flags,decisionUse:'HUMAN_CONTEXT_ONLY',canonicalWrite:false,productionAuthority:false,integrity:INTEGRITY};
  }

  function rows(){return [...BASE.map(normalize),...userRows().map(normalize)]}
  function forLot(lotId){return rows().filter(r=>r.lot===lotId)}
  function summary(){
    const all=rows();
    return {
      schema:SCHEMA,total:all.length,localOnly:all.filter(r=>r.ackState==='NO_RECORD_ACK').length,demoAck:all.filter(r=>r.ackState==='SERVER_ACK_DEMO_EXPLICIT').length,conflicts:all.filter(r=>r.conflictState==='CONFLICT_REVIEW_REQUIRED').length,unvalidated:all.filter(r=>r.validationState!=='VALIDATED').length,automaticDecisions:0,cloudContext:cloudContext(),integrity:INTEGRITY
    };
  }

  function tone(value=''){return /CONFLICT|UNVALIDATED|NOT_VERIFIED|NO_RECORD_ACK|NOT_CAPTURED|REQUIRED/i.test(value)?'warn':/ACK_DEMO|CAPTURED/i.test(value)?'teal':''}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  function cloudLabel(c){return `${c.status||'LOCAL_ONLY'}${c.revision?` · rev ${c.revision}`:''}`}

  function iotPanel(){
    const s=summary();const all=rows();const cloud=s.cloudContext;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">DATA TRUST · IOT/OFFLINE</p><h2>Confianza y sincronización por registro</h2><p>Persistencia local, estado de cuenta, ACK del registro, autenticidad de fuente, calibración y validación son dimensiones distintas.</p></div><span class="status warn">HUMAN REVIEW</span></div><div class="card-body"><div class="grid metrics">${metric('Lecturas modeladas',s.total,'base DEMO + capturas de usuario')}${metric('ACK por registro',s.demoAck,'solo ACK DEMO explícito; no productivo',s.demoAck?'good':'warn')}${metric('Conflictos preservados',s.conflicts,'sin last-write-wins',s.conflicts?'warn':'good')}${metric('Decisiones automáticas','0','VALIDATED_MEASUREMENT ≠ MANAGEMENT_DECISION','good')}</div><div class="section-note" style="margin-top:12px"><strong>Contexto de cuenta:</strong> ${esc(cloudLabel(cloud))}. ACCOUNT_SYNC_STATUS ≠ RECORD_ACK · NETWORK_ONLINE ≠ RECORD_SYNCED.</div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Lectura</th><th>Fuente</th><th>Captura / ACK</th><th>Confianza fuente</th><th>Validación</th><th>Revisión</th></tr></thead><tbody>${all.map(r=>`<tr><td><strong>${esc(r.variable)}</strong><br><small>${esc(r.lot)} · ${r.value===null?'—':esc(r.value)} ${esc(r.unit)}</small>${r.candidates.length?`<br><small>${r.candidates.map(c=>`${esc(c.candidateId)}=${esc(c.value)} ${esc(c.unit)}`).join(' · ')}</small>`:''}</td><td>${esc(r.sourceClass)}<br><small>${esc(r.sourceRef||'sin referencia')}</small></td><td><span class="status ${tone(r.ackState)}">${esc(r.ackState)}</span><br><small>${esc(r.queueState)} · ${esc(r.syncAttemptState)}</small></td><td>${esc(r.hardwareVerification)}<br><small>${esc(r.calibrationState)}</small></td><td><span class="status ${tone(r.validationState)}">${esc(r.validationState)}</span><br><small>${esc(r.qualityClaim)}</small></td><td><span class="status ${tone(r.conflictState)}">${esc(r.conflictState)}</span><br><small>${r.reviewFlags.length} bandera(s) · HUMAN_CONTEXT_ONLY</small></td></tr>`).join('')}</tbody></table></div><div class="section-note" style="margin-top:12px">${esc(INTEGRITY)}. Un conflicto preserva candidatos; no elimina datos ni escoge ganador automáticamente.</div></div></section>`;
  }

  function passportPanel(){
    let lot='CAF-A1';try{const saved=localStorage.getItem('sana.v3.passport.lot');if(saved)lot=saved}catch{}
    const list=forLot(lot);if(!list.length)return '';
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">PASSPORT · DATA TRUST</p><h2>Procedencia de lecturas · ${esc(lot)}</h2><p>La presencia en Passport no autentica sensor, no valida la medición y no demuestra ACK productivo.</p></div><span class="status warn">READ-ONLY</span></div><div class="card-body">${list.map(r=>`<div class="gate"><i class="${r.conflictState==='CONFLICT_REVIEW_REQUIRED'?'warn':''}">${r.conflictState==='CONFLICT_REVIEW_REQUIRED'?'!':'✓'}</i><div><strong>${esc(r.variable)} · ${esc(r.sourceClass)}</strong><p>${esc(r.ackState)} · ${esc(r.hardwareVerification)} · ${esc(r.validationState)}</p></div><span class="status ${tone(r.ackState)}">${esc(r.decisionUse)}</span></div>`).join('')}<div class="section-note">READING ≠ VALIDATED_MEASUREMENT · SERVER_ACK ≠ HARDWARE_VERIFIED · VALIDATED_MEASUREMENT ≠ MANAGEMENT_DECISION.</div></div></section>`;
  }

  const baseIot=views.iot;if(baseIot)views.iot=()=>insert(baseIot(),iotPanel());
  const basePassport=views.passport;if(basePassport)views.passport=()=>insert(basePassport(),passportPanel());

  window.__SANA_DATA_TRUST__=Object.freeze({schema:SCHEMA,rows,forLot,summary,cloudContext,integrity:INTEGRITY});
})();
