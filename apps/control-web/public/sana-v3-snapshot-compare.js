(() => {
  'use strict';

  const SELECT_KEY='sana.v3.snapshot.compare.selection';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1';
  const KIND_LABELS={DOCUMENTAL:'DOCUMENTAL',OPERATIVO:'OPERATIVO',ECONOMICO:'ECONÓMICO',METODOLOGICO:'METODOLÓGICO',FUENTE:'FUENTE',ESCENARIO:'ESCENARIO',PROCEDENCIA:'PROCEDENCIA'};

  function snapshotApi(){return window.__SANA_DUE_DILIGENCE_SNAPSHOT__}
  function snapshots(){return (snapshotApi()?.snapshots?.()||[]).filter(s=>s?.manifest?.schema===SCHEMA)}
  function readSelection(list){
    let saved={};try{saved=JSON.parse(localStorage.getItem(SELECT_KEY)||'{}')}catch{}
    const ids=new Set(list.map(s=>s.id));
    let base=ids.has(saved.base)?saved.base:null;
    let target=ids.has(saved.target)?saved.target:null;
    if(!base&&list.length>=2)base=list[1].id;
    if(!target&&list.length)target=list[0].id;
    if(base===target&&list.length>=2){const other=list.find(s=>s.id!==target);base=other?.id||base}
    return {base,target};
  }
  function saveSelection(next){localStorage.setItem(SELECT_KEY,JSON.stringify(next))}
  function same(a,b){return JSON.stringify(a??null)===JSON.stringify(b??null)}
  function value(v){
    if(v===undefined||v===null||v==='')return '—';
    if(typeof v==='boolean')return v?'SÍ':'NO';
    if(typeof v==='number')return new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(v);
    return String(v);
  }
  function money(v){try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v)||0)}catch{return `${Number(v)||0} COP`}}
  function dateLabel(s){return s?.cutoff||String(s?.createdAt||s?.manifest?.generatedAt||'').slice(0,10)||'sin corte'}
  function snapshotLabel(s){return `${dateLabel(s)} · ${s?.reviewer||s?.manifest?.reviewer||'sin revisor'} · ${String(s?.id||'').slice(-8)}`}
  function addChange(out,domain,entity,field,before,after,kind='DOCUMENTAL',formatter=value){
    if(same(before,after))return;
    out.push({domain,entity,field,before:formatter(before),after:formatter(after),kind});
  }
  function compareKeyed(out,domain,aRows,bRows,keyField,fields){
    const a=new Map((aRows||[]).map(r=>[String(r?.[keyField]??''),r]));
    const b=new Map((bRows||[]).map(r=>[String(r?.[keyField]??''),r]));
    const keys=new Set([...a.keys(),...b.keys()]);
    keys.forEach(key=>{
      const left=a.get(key),right=b.get(key);const entity=key||'sin-id';
      if(!left){out.push({domain,entity,field:'Registro',before:'—',after:'AGREGADO',kind:fields[0]?.kind||'DOCUMENTAL'});return}
      if(!right){out.push({domain,entity,field:'Registro',before:'PRESENTE',after:'RETIRADO',kind:fields[0]?.kind||'DOCUMENTAL'});return}
      fields.forEach(f=>addChange(out,domain,entity,f.label,left?.[f.key],right?.[f.key],f.kind,f.format||value));
    });
  }

  function compare(baseSnapshot,targetSnapshot){
    const a=baseSnapshot?.manifest||{};const b=targetSnapshot?.manifest||{};const changes=[];
    if(a.schema!==SCHEMA||b.schema!==SCHEMA)return {valid:false,reason:'SCHEMA_INCOMPATIBLE',changes:[],counts:{}};

    compareKeyed(changes,'Plan',a.plans,b.plans,'id',[
      {key:'version',label:'Versión',kind:'DOCUMENTAL'},
      {key:'phase',label:'Fase declarada',kind:'OPERATIVO'},
      {key:'lot',label:'Lote',kind:'DOCUMENTAL'}
    ]);
    compareKeyed(changes,'Cierre de ciclo',a.cycles,b.cycles,'planId',[
      {key:'planVersion',label:'Versión del plan',kind:'DOCUMENTAL'},
      {key:'completeness',label:'Completitud documental %',kind:'DOCUMENTAL'},
      {key:'evidenceGaps',label:'Brechas de evidencia',kind:'DOCUMENTAL'},
      {key:'openActivities',label:'Actividades abiertas',kind:'OPERATIVO'},
      {key:'readyForArchive',label:'Base documental cerrable',kind:'DOCUMENTAL'},
      {key:'reviewStatus',label:'Estado de revisión',kind:'DOCUMENTAL'}
    ]);
    compareKeyed(changes,'Passport',a.passport,b.passport,'lot',[
      {key:'integrity',label:'Integridad reconstruible %',kind:'DOCUMENTAL'}
    ]);
    compareKeyed(changes,'Economía',a.economics,b.economics,'lotId',[
      {key:'budget',label:'Presupuesto / escenario',kind:'ESCENARIO',format:money},
      {key:'baseRecorded',label:'BASELINE_DEMO agregado',kind:'PROCEDENCIA',format:money},
      {key:'baseRecordedProvenance',label:'Procedencia baseline',kind:'PROCEDENCIA'},
      {key:'localRecorded',label:'Costos LOCAL_ONLY itemizados',kind:'ECONOMICO',format:money},
      {key:'observedStatus',label:'Estado de resultado observado',kind:'OPERATIVO'}
    ]);
    compareKeyed(changes,'Fuentes',a.sources,b.sources,'id',[
      {key:'scope',label:'Ámbito',kind:'FUENTE'},
      {key:'version',label:'Versión de fuente',kind:'FUENTE'},
      {key:'cut',label:'Corte de fuente',kind:'FUENTE'},
      {key:'state',label:'Estado de referencia',kind:'FUENTE'},
      {key:'externalId',label:'Identificador externo',kind:'FUENTE'}
    ]);

    const impactFields=[
      ['overallQuality','Calidad metodológica %'],['humanReviewed','Revisión humana'],['reviewer','Revisor metodológico'],['reviewedAt','Fecha de revisión'],['internallyVerified','Verificación interna'],['externallyVerified','Verificación externa'],['externallyUnverified','No verificados externamente'],['estimated','Indicadores estimados']
    ];
    impactFields.forEach(([key,label])=>addChange(changes,'Impacto','SANA Impact',label,a.impact?.[key],b.impact?.[key],'METODOLOGICO'));

    addChange(changes,'Readiness','Capital','Readiness compuesto %',a.capital?.readiness,b.capital?.readiness,'DOCUMENTAL');
    const gateIds=new Set([...Object.keys(a.capital?.gates||{}),...Object.keys(b.capital?.gates||{})]);
    gateIds.forEach(id=>{
      addChange(changes,'Readiness',id,'Score del gate %',a.capital?.gates?.[id]?.score,b.capital?.gates?.[id]?.score,'DOCUMENTAL');
      addChange(changes,'Readiness',id,'Estado del gate',a.capital?.gates?.[id]?.state,b.capital?.gates?.[id]?.state,'DOCUMENTAL');
    });

    const counts={};changes.forEach(c=>{counts[c.kind]=(counts[c.kind]||0)+1});
    const domains=[...new Set(changes.map(c=>c.domain))];
    return {valid:true,baseId:baseSnapshot.id,targetId:targetSnapshot.id,changes,counts,domains,total:changes.length,integrity:'DIFF_DEMO · CHANGE ≠ IMPROVEMENT ≠ CAUSALITY ≠ INVESTMENT_SIGNAL'};
  }

  function domainSections(result){
    if(!result.total)return '<div class="empty">No hay diferencias en los campos comparables de estos dos manifests.</div>';
    return result.domains.map(domain=>{
      const rows=result.changes.filter(c=>c.domain===domain);
      return `<article class="card"><div class="card-head"><div><h2>${esc(domain)}</h2><p>${rows.length} diferencia(s) capturada(s) por manifest.</p></div><span class="status warn">DELTA DEMO</span></div><div class="card-body">${rows.map(c=>`<div class="row"><span class="dot warn"></span><div class="copy"><strong>${esc(c.entity)} · ${esc(c.field)}</strong><span>${esc(c.before)} → ${esc(c.after)}</span></div><div class="meta"><span class="status">${esc(KIND_LABELS[c.kind]||c.kind)}</span></div></div>`).join('')}</div></article>`;
    }).join('');
  }
  function selectorOptions(list,selected){return list.map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(snapshotLabel(s))}</option>`).join('')}
  function comparePanel(){
    const list=snapshots();
    if(list.length<2)return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMPARADOR DE CORTES</p><h2>Se requieren al menos 2 snapshots</h2><p>Registra dos cortes versionados para comparar cambios sin usar el estado vivo como sustituto de evidencia histórica.</p></div><span class="status warn">${list.length}/2</span></div><div class="card-body"><div class="section-note">El comparador no enfrenta un snapshot con el estado actual porque el estado vivo todavía no es un corte. Primero debe quedar registrado como `SNAPSHOT_DEMO`.</div></div></section>`;
    const chosen=readSelection(list);const base=list.find(s=>s.id===chosen.base);const target=list.find(s=>s.id===chosen.target);
    const result=base&&target&&base.id!==target?compare(base,target):{valid:false,changes:[],counts:{},domains:[],total:0};
    const documentary=result.counts?.DOCUMENTAL||0;const operational=result.counts?.OPERATIVO||0;const economic=(result.counts?.ECONOMICO||0)+(result.counts?.ESCENARIO||0)+(result.counts?.PROCEDENCIA||0);const methodological=result.counts?.METODOLOGICO||0;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMPARADOR DE CORTES · READ ONLY</p><h2>Qué cambió entre dos snapshots</h2><p>Compara manifests registrados. Un delta describe diferencia de estado/procedencia; no determina que el cultivo, el riesgo o una inversión hayan mejorado o empeorado.</p></div><span class="status warn">DIFF_DEMO</span></div><div class="card-body"><div class="fields"><label>Snapshot base<select data-snapshot-base>${selectorOptions(list,chosen.base)}</select></label><label>Snapshot comparado<select data-snapshot-target>${selectorOptions(list,chosen.target)}</select></label></div><div class="head-actions" style="margin-top:10px"><button class="btn secondary" data-snapshot-swap>Intercambiar cortes</button></div>${base&&target?`<div class="section-note" style="margin-top:12px"><strong>Base:</strong> ${esc(snapshotLabel(base))}<br><strong>Comparado:</strong> ${esc(snapshotLabel(target))}<br>La dirección A → B es descriptiva. No equivale a tendencia favorable, causalidad, reducción de riesgo ni señal de inversión.</div>`:''}</div></section>
      ${result.valid?`<section class="grid metrics" style="margin-top:14px">${metric('Cambios detectados',result.total,`${result.domains.length} dominio(s)`)}${metric('Documentales',documentary,'versiones · completitud · readiness',documentary?'warn':'good')}${metric('Operativos / económicos',operational+economic,`${operational} operativos · ${economic} económicos/escenario`,operational+economic?'warn':'good')}${metric('Metodológicos',methodological,'Impact Contract',methodological?'warn':'good')}</section><section class="grid two" style="margin-top:14px">${domainSections(result)}</section><section class="card" style="margin-top:14px"><div class="card-body"><div class="section-note"><strong>Frontera de interpretación:</strong> CHANGE ≠ IMPROVEMENT ≠ CAUSALITY ≠ FINANCIAL PERFORMANCE ≠ INVESTMENT SIGNAL. Un aumento de readiness significa únicamente que cambió el expediente/los gates capturados; no demuestra menor riesgo crediticio, mayor retorno ni elegibilidad.</div></div></section>`:'<section class="card" style="margin-top:14px"><div class="card-body"><div class="empty">Selecciona dos snapshots distintos y compatibles con el schema actual.</div></div></section>'}`;
  }
  function insertAfterHead(html,section){const marker='</header>';const at=html.indexOf(marker);return at<0?`${section}${html}`:`${html.slice(0,at+marker.length)}${section}${html.slice(at+marker.length)}`}

  const baseReports=views.reports;
  if(baseReports)views.reports=function reportsWithComparison(){return insertAfterHead(baseReports(),comparePanel())};

  document.addEventListener('change',event=>{
    const base=event.target.closest('[data-snapshot-base]');const target=event.target.closest('[data-snapshot-target]');if(!base&&!target)return;
    const list=snapshots();const current=readSelection(list);const next={base:base?base.value:current.base,target:target?target.value:current.target};
    saveSelection(next);if(typeof render==='function')render();
  });
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-snapshot-swap]'))return;
    const list=snapshots();const current=readSelection(list);saveSelection({base:current.target,target:current.base});if(typeof render==='function')render();
  });

  window.__SANA_SNAPSHOT_COMPARE__=Object.freeze({schema:SCHEMA,snapshots:()=>snapshots().map(s=>({...s,manifest:{...(s.manifest||{})}})),compare,selection:()=>readSelection(snapshots()),integrity:'READ_ONLY_DIFF · CHANGE ≠ IMPROVEMENT ≠ CAUSALITY ≠ INVESTMENT_SIGNAL'});
})();
