(() => {
  'use strict';
  const syncApi=()=>window.__SANA_CAPTURE_SYNC_LEDGER__;
  const cycleApi=()=>window.__SANA_CYCLE_CLOSURE__;
  const INTEGRITY='CAPTURE_SYNC_PROVENANCE ≠ CYCLE_GATE · LOCAL_CAPTURE ≠ QUEUED ≠ SYNC_ATTEMPT ≠ SERVER_ACK · SERVER_ACK ≠ SOURCE_VERIFIED · CONFLICT_RESOLVED ≠ SOURCE_VERIFIED · QUEUE_EMPTY ≠ DATA_COMPLETE · NO_AUTOMATIC_CONFLICT_RESOLUTION';
  function forPlan(planId){const plan=DEMO.plans.find(p=>p.id===planId);if(!plan)return {valid:false,cases:[]};const cases=(syncApi()?.forLot?.(plan.lot)||[]).map(c=>({caseId:c.id,recordRef:c.recordRef||'',recordType:c.recordType||'',state:c.state,captureRecorded:Boolean(c.captureRecorded),queueRecorded:Boolean(c.queueRecorded),syncAttemptRecorded:Boolean(c.syncAttemptRecorded),ackRecorded:Boolean(c.ackRecorded),ackRef:c.ackRef||'',conflictRecorded:Boolean(c.conflictRecorded),resolutionRecorded:Boolean(c.resolutionRecorded),sourceVerified:false,automaticResolution:false,legacyUnlinked:Boolean(c.legacyUnlinked)}));return {valid:true,plan:{id:plan.id,version:plan.version,lot:plan.lot},cases,integrity:INTEGRITY}}
  function selected(){const p=cycleApi()?.selectedPlan?.();return p?forPlan(p.id):{valid:false,cases:[]}}
  function panel(){const s=selected();if(!s.valid||!s.cases.length)return '';const ack=s.cases.filter(c=>c.ackRecorded).length,conf=s.cases.filter(c=>c.conflictRecorded&&!c.resolutionRecorded).length;return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">CIERRE · CAPTURE SYNC</p><h2>Procedencia de captura y sincronización</h2><p>${esc(s.plan.id)} · ${esc(s.plan.lot)} · read-only; no modifica completitud ni readyForArchive.</p></div><span class="status ${conf?'warn':''}">${ack} ACK DEMO</span></div><div class="card-body">${s.cases.map(c=>`<div class="gate"><i>${c.ackRecorded?'✓':'·'}</i><div><strong>${esc(c.recordRef||c.caseId)} · ${esc(c.recordType)}</strong><p>${esc(c.state)} · ${c.ackRecorded?esc(c.ackRef):'NO_RECORD_ACK'}${c.conflictRecorded?` · ${c.resolutionRecorded?'HUMAN_RESOLUTION':'CONFLICT_REVIEW_REQUIRED'}`:''}</p></div><span class="status ${c.conflictRecorded&&!c.resolutionRecorded?'warn':''}">PROVENANCE</span></div>`).join('')}<div class="section-note">${esc(INTEGRITY)}</div></div></section>`}
  function insert(html,section){const markers=['<footer class="footer-note">','<footer class="footer">'];for(const marker of markers){const at=html.lastIndexOf(marker);if(at>=0)return html.slice(0,at)+section+html.slice(at)}return html+section}
  const baseCycle=views.cycle;if(baseCycle)views.cycle=()=>insert(baseCycle(),panel());
  window.__SANA_CYCLE_CAPTURE_SYNC__=Object.freeze({forPlan,selected,integrity:INTEGRITY});
})();

// V152 loader: Capture Sync reference coherence only; no server/source verification or canonical authority.
(() => {
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return;
  const VERSION='V152',SRC='/sana-v3-capture-sync-references.js';
  const state={version:VERSION,status:'WAITING',attempts:0,integrity:'REFERENCE_COHERENCE ≠ VERIFIED_SYNC/SOURCE · NO_CANONICAL_WRITE · NO_AGRONOMIC/CREDIT/ELIGIBILITY/INVESTMENT_AUTHORITY'};
  function expose(){window.__SANA_CAPTURE_SYNC_REFERENCES_LOADER__=Object.freeze({...state})}
  function ready(){return window.__SANA_CAPTURE_SYNC_LEDGER__?.schema==='SANA_CAPTURE_SYNC_LEDGER_V1'&&window.__SANA_CAPTURE_SYNC_LEDGER__?.cases&&window.__SANA_DATA_TRUST__?.rows}
  function start(){
    state.attempts++;expose();
    if(window.__SANA_CAPTURE_SYNC_LEDGER__?.referenceVersion===VERSION){state.status='READY';expose();return}
    if(!ready()){if(state.attempts<25){state.status='WAITING_DEPENDENCIES';expose();setTimeout(start,40);return}state.status='BLOCKED_DEPENDENCIES';expose();return}
    if(document.querySelector?.('script[data-sana-capture-sync-references-v152]'))return;
    state.status='LOADING';expose();
    const s=document.createElement('script');s.src=SRC;s.defer=true;s.dataset.sanaCaptureSyncReferencesV152='1';
    s.onload=()=>{state.status=window.__SANA_CAPTURE_SYNC_LEDGER__?.referenceVersion===VERSION?'READY':'FAILED_CONTRACT';expose()};
    s.onerror=()=>{state.status='FAILED';expose()};
    document.head.appendChild(s);
  }
  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});
})();
