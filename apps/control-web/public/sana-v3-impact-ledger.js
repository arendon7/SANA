(() => {
  'use strict';

  const SOURCE_LINKS={
    'soil-om':[{view:'territory',label:'Territorio'},{view:'passport',label:'Passport'}],
    water:[{view:'iot',label:'IoT'},{view:'field',label:'Campo'}],
    circular:[{view:'inventory',label:'Inventario'},{view:'nutrition',label:'Nutrición'}],
    evidence:[{view:'passport',label:'Passport'},{view:'field',label:'Campo'}],
    restoration:[{view:'territory',label:'Territorio'},{view:'passport',label:'Passport'}]
  };

  function impactApi(){return window.__SANA_IMPACT__}
  function sourceRows(){return impactApi()?.rows?.()||[]}
  function estimationType(row){return row.quality==='ESTIMADO'?'ESTIMADO':'NO_ESTIMADO_DEMO'}
  function calcLabel(row){
    const delta=row.delta||{};
    if(delta.pct===null||delta.pct===undefined)return `${Number(delta.d||0)} ${row.unit}`;
    const n=Number(delta.pct||0);return `${n>0?'+':''}${n.toFixed(1)}%`;
  }
  function boundary(row){return {unit:'FIN-LE-001',scope:row.layer,period:row.frequency||'SEGÚN MÉTODO',environment:'DEMO'}}
  function ledgerRows(){
    return sourceRows().map(row=>({
      id:row.id,
      layer:row.layer,
      name:row.name,
      boundary:boundary(row),
      baseline:{value:row.baseline,unit:row.unit,state:'BASELINE_DEMO'},
      observation:{value:row.current,unit:row.unit,state:row.quality==='ESTIMADO'?'OBSERVACIÓN_CON_ESTIMACIÓN':'OBSERVADO_DEMO'},
      calculation:{value:calcLabel(row),method:row.method,state:'CALCULATED_DEMO'},
      estimation:{type:estimationType(row),explicit:row.quality==='ESTIMADO'},
      provenance:{source:row.source,frequency:row.frequency,quality:row.quality,qualityScore:row.qualityScore},
      verification:{state:row.verification,external:row.verification==='VERIFICADO_EXTERNO'},
      navigation:(SOURCE_LINKS[row.id]||[]).map(x=>({...x})),
      integrity:'LIVE_METHOD_DEMO · NOT_SNAPSHOT_HISTORY'
    }));
  }
  function summary(){
    const rows=ledgerRows();
    return {
      indicators:rows.length,
      estimated:rows.filter(r=>r.estimation.explicit).length,
      internallyVerified:rows.filter(r=>r.verification.state==='INTERNO').length,
      externallyVerified:rows.filter(r=>r.verification.external).length,
      externallyUnverified:rows.filter(r=>r.verification.state==='NO_VERIFICADO_EXTERNO').length,
      integrity:'LIVE_METHOD ≠ SNAPSHOT_HISTORY ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION'
    };
  }
  function stage(label,value,state,tone=''){
    return `<div class="gate"><i class="${tone}">${state}</i><div><strong>${esc(label)}</strong><p>${esc(value)}</p></div><span class="status ${tone}">${esc(state)}</span></div>`;
  }
  function ledgerPanel(){
    const rows=ledgerRows();const s=summary();
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">IMPACT LEDGER · LIVE_METHOD_DEMO</p><h2>Del dato a la afirmación, sin saltos metodológicos</h2><p>Cada indicador conserva frontera, línea base, observación, cálculo, condición de estimación, procedencia y verificación. Esta vista es viva; solo un snapshot registrado la convierte en historia del expediente.</p></div><span class="status warn">${s.indicators} INDICADORES</span></div><div class="card-body"><div class="grid metrics">${metric('Indicadores',s.indicators,'ledger metodológico')}${metric('Estimados',s.estimated,'deben conservar etiqueta',s.estimated?'warn':'good')}${metric('Verificación interna',s.internallyVerified,'no equivale a verificación externa')}${metric('Verificación externa',s.externallyVerified,'no asumir certificación',s.externallyVerified?'good':'warn')}</div><div class="section-note" style="margin-top:12px"><strong>Regla temporal:</strong> LIVE_METHOD ≠ SNAPSHOT_HISTORY ≠ EXTERNAL_VERIFICATION. Cambiar una metodología o un dato vivo no reescribe cortes históricos ya registrados.</div></div></section>
      <section class="grid two" style="margin-top:14px">${rows.map(r=>`<article class="card"><div class="card-head"><div><small>${esc(r.layer)}</small><h2>${esc(r.name)}</h2><p>${esc(r.id)} · ${esc(r.boundary.period)}</p></div><span class="status ${r.estimation.explicit?'warn':'teal'}">${r.estimation.explicit?'ESTIMADO':'TRAZABLE DEMO'}</span></div><div class="card-body">${stage('1 · Línea base',`${r.baseline.value} ${r.baseline.unit}`,r.baseline.state)}${stage('2 · Observación',`${r.observation.value} ${r.observation.unit}`,r.observation.state,r.estimation.explicit?'warn':'')}${stage('3 · Cálculo',`${r.calculation.value} · ${r.calculation.method}`,r.calculation.state)}${stage('4 · Estimación',r.estimation.explicit?'El valor contiene una estimación explícita.':'El indicador no está clasificado como estimado en el contrato actual.',r.estimation.type,r.estimation.explicit?'warn':'')}${stage('5 · Verificación',r.verification.external?'Verificación externa declarada en el contrato.':r.verification.state==='INTERNO'?'Verificación interna DEMO; no independiente.':'Sin verificación externa demostrada.',r.verification.state,r.verification.external?'teal':r.verification.state==='INTERNO'?'':'warn')}<div class="section-note" style="margin-top:10px"><strong>Procedencia:</strong> ${esc(r.provenance.source)} · calidad ${esc(r.provenance.quality)} (${r.provenance.qualityScore}%).</div>${r.navigation.length?`<div class="head-actions" style="margin-top:10px">${r.navigation.map(n=>`<button class="btn secondary" data-view-link="${esc(n.view)}">Ver ${esc(n.label)}</button>`).join('')}</div>`:''}</div></article>`).join('')}</section>`;
  }
  function insertBeforeFooter(html,section){const marker='<footer class="footer">';const at=html.lastIndexOf(marker);return at<0?`${html}${section}`:`${html.slice(0,at)}${section}${html.slice(at)}`}

  const baseImpact=views.impact;
  if(baseImpact)views.impact=function impactWithLedger(){return insertBeforeFooter(baseImpact(),ledgerPanel())};

  window.__SANA_IMPACT_LEDGER__=Object.freeze({rows:()=>ledgerRows().map(r=>({...r,boundary:{...r.boundary},baseline:{...r.baseline},observation:{...r.observation},calculation:{...r.calculation},estimation:{...r.estimation},provenance:{...r.provenance},verification:{...r.verification},navigation:r.navigation.map(n=>({...n}))})),summary,integrity:'LIVE_METHOD ≠ SNAPSHOT_HISTORY ≠ EXTERNAL_VERIFICATION ≠ CERTIFICATION'});
})();

// V156 loader: explicit Source Registry links only; navigation/source labels never become evidence.
(() => {
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return;
  const VERSION='V156',SRC='/sana-v3-impact-references.js';
  const state={version:VERSION,status:'WAITING',attempts:0,integrity:'SOURCE_REGISTRY_REFERENCE ≠ CONTENT_CORRECTNESS ≠ CAUSALITY ≠ EXTERNAL_VERIFICATION · NO_CERTIFICATION · NO_CREDIT/ELIGIBILITY/INVESTMENT_AUTHORITY'};
  function expose(){window.__SANA_IMPACT_REFERENCES_LOADER__=Object.freeze({...state})}
  function ready(){return window.__SANA_IMPACT_LEDGER__?.rows&&window.__SANA_DOCUMENT_SOURCES__?.rows}
  function start(){
    state.attempts++;expose();
    if(window.__SANA_IMPACT_LEDGER__?.referenceVersion==='V156'){state.status='READY';expose();return}
    if(!ready()){if(state.attempts<30){state.status='WAITING_DEPENDENCIES';expose();setTimeout(start,40);return}state.status='BLOCKED_DEPENDENCIES';expose();return}
    if(document.querySelector?.('script[data-sana-impact-references-v156]'))return;
    state.status='LOADING';expose();const s=document.createElement('script');s.src=SRC;s.defer=true;s.dataset.sanaImpactReferencesV156='1';s.onload=()=>{state.status=window.__SANA_IMPACT_LEDGER__?.referenceVersion==='V156'?'READY':'FAILED_CONTRACT';expose()};s.onerror=()=>{state.status='FAILED';expose()};document.head.appendChild(s);
  }
  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});
})();
