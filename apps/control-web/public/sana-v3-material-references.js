(() => {
  'use strict';
  const VERSION='V156';
  const SCHEMA='SANA_MATERIAL_CHAIN_V1';
  const INTEGRITY='MATERIAL_REFERENCE ≠ MATERIAL_IDENTITY_VERIFICATION · DESTINATION_REFERENCE ≠ TRANSPLANT_EXECUTION · MATERIAL_EVENT_REFERENCE ≠ COST_OR_INVENTORY_VALIDITY · SOURCE_REFERENCE_DECLARED ≠ ORIGIN_VERIFIED · EVIDENCE_REFERENCE_DECLARED ≠ EVIDENCE_VERIFIED · RESPONSIBLE_DECLARED ≠ IDENTITY_VERIFIED · REFERENCE ≠ GENETIC_QUALITY ≠ PHYTOSANITARY_STATUS ≠ ICA_CERTIFICATION ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL';
  const base=window.__SANA_MATERIAL_CHAIN__;
  if(!base?.all||base.schema!==SCHEMA)return;

  const records=()=>Array.isArray(storage?.records)?storage.records:[];
  const values=r=>r?.values||{};
  const tagged=r=>values(r).referenceVersion===VERSION;
  const materialIds=()=>new Set((DEMO?.material||[]).map(x=>x.id).filter(Boolean));
  const lotIds=()=>new Set((DEMO?.lots||[]).map(x=>x.id).filter(Boolean));
  const chains=()=>base.all();
  const eventIndex=()=>{const m=new Map();for(const c of chains())for(const e of c.events||[])m.set(e.id,{event:e,materialId:c.identity?.id||e.materialId||'',lot:c.target||c.identity?.targetLot||''});return m};
  const time=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:null};
  function ref(source,kind,targetId,status,target=null,extra={}){return {source:{id:source.id||'',type:source.type||'',materialId:source.materialId||'',observedAt:source.observedAt||''},kind,targetId:targetId||'',status,target:target?{id:target.id||'',kind:target.kind||'',materialId:target.materialId||'',lot:target.lot||''}:null,...extra}}
  function nonCanonical(source,kind,value){return {sourceId:source.id||'',sourceType:source.type||'',kind,valueCaptured:Boolean(value),status:'DECLARED_NON_CANONICAL_REFERENCE'}}
  function relationEventRow(r,v,src,events){const target=events.get(v.materialEventId);let status='LINKED';if(!target)status='MISSING_TARGET';else if(v.materialId&&target.materialId!==v.materialId)status='CROSS_MATERIAL_REFERENCE';else{const a=time(src.observedAt),b=time(target.event?.date);if(a!==null&&b!==null&&b>a)status='FORWARD_REFERENCE'}return ref(src,r.type==='economics-cost'?'COST_MATERIAL_EVENT_REF':'INVENTORY_MATERIAL_EVENT_REF',v.materialEventId,status,target?{id:target.event.id,kind:'MATERIAL_EVENT',materialId:target.materialId,lot:target.lot}:null,{sourceMaterialId:v.materialId||'',targetMaterialId:target?.materialId||''})}
  function sourceRowsFor(materialId){
    const mids=materialIds(),lots=lotIds(),events=eventIndex(),rows=[],declared=[];
    const materialEvents=records().filter(r=>r.type==='material-lifecycle-event'&&tagged(r)&&values(r).materialId===materialId);
    for(const r of materialEvents){const v=values(r),src={id:r.id,type:r.type,materialId,observedAt:v.date||r.createdAt||''};if(v.destinationLot){const ok=lots.has(v.destinationLot);rows.push(ref(src,'DESTINATION_LOT_REF',v.destinationLot,ok?'LINKED':'MISSING_TARGET',ok?{id:v.destinationLot,kind:'DEMO_LOT',lot:v.destinationLot}:null))}if(v.sourceRef)declared.push(nonCanonical(src,'SOURCE_REFERENCE_DECLARED',v.sourceRef));if(v.evidenceRef)declared.push(nonCanonical(src,'EVIDENCE_REFERENCE_DECLARED',v.evidenceRef))}
    const rels=records().filter(r=>['economics-cost','inventory-movement'].includes(r.type)&&tagged(r)&&values(r).materialId===materialId);
    for(const r of rels){const v=values(r),src={id:r.id,type:r.type,materialId,observedAt:v.date||r.createdAt||''};if(v.materialId){const ok=mids.has(v.materialId);rows.push(ref(src,'MATERIAL_ID_REF',v.materialId,ok?'LINKED':'MISSING_TARGET',ok?{id:v.materialId,kind:'DEMO_MATERIAL',materialId:v.materialId}:null))}if(v.materialEventId)rows.push(relationEventRow(r,v,src,events))}
    return {taggedCount:materialEvents.length+rels.length,rows,declared};
  }
  function orphanRows(){
    const mids=materialIds(),lots=lotIds(),events=eventIndex(),rows=[],declared=[],sourceIds=new Set();
    const orphan=records().filter(r=>['material-lifecycle-event','economics-cost','inventory-movement'].includes(r.type)&&tagged(r)&&values(r).materialId&&!mids.has(values(r).materialId));
    for(const r of orphan){const v=values(r),src={id:r.id,type:r.type,materialId:v.materialId||'',observedAt:v.date||r.createdAt||''};sourceIds.add(r.id);rows.push(ref(src,'MATERIAL_ID_REF',v.materialId,'MISSING_TARGET',null,{orphanSource:true}));if(r.type==='material-lifecycle-event'){if(v.destinationLot){const ok=lots.has(v.destinationLot);rows.push(ref(src,'DESTINATION_LOT_REF',v.destinationLot,ok?'LINKED':'MISSING_TARGET',ok?{id:v.destinationLot,kind:'DEMO_LOT',lot:v.destinationLot}:null,{orphanSource:true}))}if(v.sourceRef)declared.push(nonCanonical(src,'SOURCE_REFERENCE_DECLARED',v.sourceRef));if(v.evidenceRef)declared.push(nonCanonical(src,'EVIDENCE_REFERENCE_DECLARED',v.evidenceRef))}else if(v.materialEventId){const target=events.get(v.materialEventId);rows.push(ref(src,r.type==='economics-cost'?'COST_MATERIAL_EVENT_REF':'INVENTORY_MATERIAL_EVENT_REF',v.materialEventId,target?'SOURCE_MATERIAL_MISSING':'MISSING_TARGET',target?{id:target.event.id,kind:'MATERIAL_EVENT',materialId:target.materialId,lot:target.lot}:null,{orphanSource:true,sourceMaterialId:v.materialId||'',targetMaterialId:target?.materialId||''}))}}
    return {sourceCount:sourceIds.size,rows,declared};
  }
  function decorate(c){const materialId=c.identity?.id||'',r=sourceRowsFor(materialId),issues=r.rows.filter(x=>x.status!=='LINKED').length,linked=r.rows.length-issues,total=r.rows.length;return {...c,referenceVersion:VERSION,referenceState:r.taggedCount?'CAPTURED':'LEGACY_REFERENCE_NOT_CAPTURED',referenceCoverage:{total,linked,issues,percent:total?Math.round(linked/total*100):100},referenceRows:r.rows,referenceIssues:issues,declaredReferenceRows:r.declared,declaredNonCanonicalReferences:r.declared.length,referenceIntegrity:INTEGRITY}}
  function all(){return base.all().map(decorate)}
  function forMaterial(id){const c=base.forMaterial?.(id);return c?decorate(c):null}
  function forLot(lotId){return all().filter(c=>c.target===lotId||(c.events||[]).some(e=>e.destinationLot===lotId||e.to===lotId))}
  function allReferenceRows(){const a=all(),o=orphanRows();return [...a.flatMap(c=>c.referenceRows||[]),...o.rows]}
  function summary(){const a=all(),o=orphanRows(),chainExpected=a.reduce((n,c)=>n+c.referenceCoverage.total,0),chainLinked=a.reduce((n,c)=>n+c.referenceCoverage.linked,0),chainIssues=a.reduce((n,c)=>n+c.referenceIssues,0),orphanIssues=o.rows.filter(r=>r.status!=='LINKED').length;return {schema:SCHEMA,referenceVersion:VERSION,chains:a.length,referenceCaptured:a.filter(c=>c.referenceState==='CAPTURED').length,legacyReferenceNotCaptured:a.filter(c=>c.referenceState==='LEGACY_REFERENCE_NOT_CAPTURED').length,orphanSourceCount:o.sourceCount,referenceExpected:chainExpected+o.rows.length,referenceLinked:chainLinked+(o.rows.length-orphanIssues),referenceIssues:chainIssues+orphanIssues,declaredNonCanonical:a.reduce((n,c)=>n+c.declaredNonCanonicalReferences,0)+o.declared.length,integrity:INTEGRITY}}
  const wrapped=Object.freeze({...base,referenceVersion:VERSION,all,forMaterial,forLot,summary,allReferenceRows,orphanReferenceRows:()=>orphanRows().rows,integrity:`${base.integrity||'MATERIAL_CHAIN_DEMO'} · ${INTEGRITY}`});
  window.__SANA_MATERIAL_CHAIN__=wrapped;

  if(typeof views!=='undefined'&&views.material){const prior=views.material;views.material=()=>{const html=prior(),s=summary();const panel=`<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">MATERIAL VEGETAL · REFERENCIAS V156</p><h2>Vínculos internos explícitos y verificables</h2><p>Solo capturas V156 entran al denominador. Legacy permanece válido y las referencias externas siguen declarativas.</p></div><span class="status ${s.referenceIssues?'danger':'teal'}">${s.referenceIssues} ISSUE(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Refs. esperadas',s.referenceExpected,'solo vínculos canónicos V156')}${metric('Enlazadas',s.referenceLinked,'existencia + alcance')}${metric('Legacy',s.legacyReferenceNotCaptured,'no retrovalidado')}${metric('Fuentes huérfanas',s.orphanSourceCount,'no se ocultan por quedar fuera de cadena')}</div><div class="section-note">${esc(INTEGRITY)}</div></div></section>`;const marker='<footer class="footer">',at=html.lastIndexOf(marker);return at<0?html+panel:html.slice(0,at)+panel+html.slice(at)}}

  function mark(form){if(!form||form.querySelector('[name="referenceVersion"]'))return;const material=form.querySelector('[name="materialId"]'),event=form.querySelector('[name="materialEventId"]'),dest=form.querySelector('[name="destinationLot"]');if(!material&&!event&&!dest)return;const input=document.createElement('input');input.type='hidden';input.name='referenceVersion';input.value=VERSION;form.appendChild(input)}
  function scheduleMark(){const run=()=>mark(document.getElementById('modal-form'));queueMicrotask(run);setTimeout(run,25)}
  if(typeof document!=='undefined'&&document.addEventListener){document.addEventListener('click',e=>{if(e.target.closest?.('[data-material-chain-event],[data-econ-cost],[data-inventory-movement]'))scheduleMark()},true)}
})();

// V157 loader: minimized historical Material reference provenance only.
(() => {
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return;
  const VERSION='V157';
  const ASSETS=[
    '/sana-v3-report-snapshot-material-references.js',
    '/sana-v3-cycle-material-references.js',
    '/sana-v3-due-diligence-material-reference-gaps.js',
    '/sana-v3-dataroom-material-references.js'
  ];
  const state={version:VERSION,status:'WAITING',attempts:0,loaded:0,integrity:'SNAPSHOT_ONLY_HISTORY · CONTENT_MINIMIZED · NON_WEIGHTED · NO_RETROFILL · NO_CERTIFICATION/CREDIT/INVESTMENT_AUTHORITY'};
  function expose(){window.__SANA_MATERIAL_REFERENCE_HISTORY_LOADER__=Object.freeze({...state})}
  function ready(){return window.__SANA_MATERIAL_CHAIN__?.referenceVersion==='V156'}
  function loadAt(i){
    if(i>=ASSETS.length){state.loaded=ASSETS.length;state.status='READY';expose();return}
    const src=ASSETS[i],key=`materialReferenceHistoryV157${i}`;
    const existing=document.querySelector?.(`script[data-${key.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`)}]`);
    if(existing){state.loaded=Math.max(state.loaded,i+1);loadAt(i+1);return}
    const s=document.createElement('script');s.src=src;s.defer=true;s.dataset[key]='1';
    s.onload=()=>{state.loaded=i+1;expose();loadAt(i+1)};
    s.onerror=()=>{state.status='FAILED';expose()};
    document.head.appendChild(s);
  }
  function start(){
    state.attempts++;expose();
    if(window.__SANA_REPORT_SNAPSHOT_MATERIAL_REFERENCES__&&window.__SANA_CYCLE_MATERIAL_REFERENCES__&&window.__SANA_DD_MATERIAL_REFERENCE_GAPS__&&window.__SANA_DATAROOM_MATERIAL_REFERENCES__){state.loaded=ASSETS.length;state.status='READY';expose();return}
    if(!ready()){if(state.attempts<25){state.status='WAITING_V156';expose();setTimeout(start,40);return}state.status='BLOCKED_V156';expose();return}
    state.status='LOADING';expose();loadAt(0);
  }
  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});
})();
