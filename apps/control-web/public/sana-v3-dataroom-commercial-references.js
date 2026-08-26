(() => {
  'use strict';
  const SCHEMA='SANA_DUE_DILIGENCE_SNAPSHOT_V1',REPORT='RPT-DD';
  const INTEGRITY='SNAPSHOT_COMMERCIAL_REFERENCES_ONLY · CONTENT_MINIMIZED · NO_LIVE_FALLBACK · ROW_LEVEL_STRUCTURAL_DIFF · DECLARED_REFERENCE_DELTA ≠ DERIVED_PROJECTION_DELTA · SEMANTIC_GRANULARITY_CHANGE ≠ REFERENCE_CHANGE · LEGACY_REFERENCE_NOT_CAPTURED ≠ INVALID · REFERENCE_CHANGE ≠ COMMERCIAL_EXECUTION ≠ VERIFIED_CONTRACT ≠ PAYMENT_EXECUTION ≠ GUARANTEED_REVENUE ≠ CREDIT_RISK ≠ INVESTMENT_SIGNAL';
  const LEGACY_ROW_FIELDS=['sourceEventId','sourceKind','kind','refId','sourceDomain','sourceKindExpected','status','domain','targetId','targetKind','targetLot'];
  const V149_ROW_FIELDS=[...LEGACY_ROW_FIELDS.slice(0,6),'origin','temporalPolicy',...LEGACY_ROW_FIELDS.slice(6)];
  const CORE_CASE_FIELDS=['referenceState','referenceVersion','linked','total','issues','declaredNonCanonicalCount'];
  const V149_CASE_FIELDS=['declaredCanonicalLinked','declaredCanonicalTotal','declaredCanonicalIssues','derivedCrossDomainLinked','derivedCrossDomainTotal','derivedCrossDomainIssues'];

  function snapshots(){return (window.__SANA_DUE_DILIGENCE_SNAPSHOT__?.snapshots?.()||[]).filter(s=>s?.manifest?.schema===SCHEMA&&s?.reportType===REPORT).slice().sort((a,b)=>String(b.cutoff||b.createdAt||'').localeCompare(String(a.cutoff||a.createdAt||'')))}
  function data(m){return m?.commercialReferences||null}
  function cases(m){return Array.isArray(data(m)?.cases)?data(m).cases:[]}
  function latestState(){const s=snapshots()[0]||null;if(!s)return {valid:false,state:'NO_SNAPSHOT',snapshot:null,data:null};return {valid:true,state:data(s.manifest)?'CAPTURED':'NOT_CAPTURED_IN_SNAPSHOT',snapshot:s,data:data(s.manifest),integrity:INTEGRITY}}
  function semantics(d){return d?.referenceSemanticsVersion||'LEGACY_SEMANTICS_NOT_CAPTURED'}
  function signature(r,fields=V149_ROW_FIELDS){return JSON.stringify(fields.map(f=>r?.[f]??''))}
  function rowDescriptor(r,fields=V149_ROW_FIELDS){return fields.reduce((o,f)=>(o[f]=r?.[f]??'',o),{})}
  function multiset(rows,fields){const m=new Map();for(const r of rows||[]){const key=signature(r,fields),prev=m.get(key);if(prev)prev.count++;else m.set(key,{count:1,row:rowDescriptor(r,fields)})}return m}
  function deltaKind(action,row,fields){return fields.includes('origin')&&row?.origin==='DERIVED_CROSS_DOMAIN_PROJECTION'?`DERIVED_PROJECTION_ROW_${action}`:`REFERENCE_ROW_${action}`}
  function rowDiff(caseId,left,right,fields=V149_ROW_FIELDS){
    const A=multiset(left,fields),B=multiset(right,fields),changes=[];
    for(const [sig,a] of A){const b=B.get(sig),delta=a.count-(b?.count||0);if(delta>0)changes.push({caseId,field:'referenceRow',changeKind:deltaKind('REMOVED',a.row,fields),count:delta,row:a.row})}
    for(const [sig,b] of B){const a=A.get(sig),delta=b.count-(a?.count||0);if(delta>0)changes.push({caseId,field:'referenceRow',changeKind:deltaKind('ADDED',b.row,fields),count:delta,row:b.row})}
    return changes;
  }
  function diff(a,b){
    if(a?.manifest?.schema!==SCHEMA||b?.manifest?.schema!==SCHEMA)return {valid:false,changes:[]};
    const da=data(a.manifest),db=data(b.manifest);
    if(!da||!db)return {valid:true,state:'PARTIAL_GRANULARITY',changes:[],total:0,rowChanges:0,semanticChanges:0,derivedProjectionChanges:0,integrity:INTEGRITY};
    const sa=semantics(da),sb=semantics(db),bothV149=sa==='V149'&&sb==='V149';
    const rowFields=bothV149?V149_ROW_FIELDS:LEGACY_ROW_FIELDS;
    const A=new Map(cases(a.manifest).map(c=>[c.caseId,c])),B=new Map(cases(b.manifest).map(c=>[c.caseId,c])),keys=new Set([...A.keys(),...B.keys()]),changes=[];
    if(sa!==sb)changes.push({caseId:'__COMMERCIAL_REFERENCES__',field:'referenceSemanticsVersion',before:sa,after:sb,changeKind:'SEMANTIC_GRANULARITY_CHANGED'});
    keys.forEach(id=>{
      const l=A.get(id),r=B.get(id);
      if(!l||!r){changes.push({caseId:id,field:'referenceState',before:l?'PRESENTE':'—',after:r?'PRESENTE':'—',changeKind:l?'CASE_REMOVED':'CASE_ADDED'});return}
      for(const f of CORE_CASE_FIELDS)if(JSON.stringify(l[f]??null)!==JSON.stringify(r[f]??null))changes.push({caseId:id,field:f,before:l[f]??null,after:r[f]??null,changeKind:'CASE_FIELD_CHANGED'});
      if(bothV149)for(const f of V149_CASE_FIELDS)if(JSON.stringify(l[f]??null)!==JSON.stringify(r[f]??null))changes.push({caseId:id,field:f,before:l[f]??null,after:r[f]??null,changeKind:'CASE_FIELD_CHANGED'});
      changes.push(...rowDiff(id,l.rows||[],r.rows||[],rowFields));
    });
    return {valid:true,state:'CAPTURED_BOTH',changes,total:changes.length,rowChanges:changes.filter(c=>c.field==='referenceRow').length,semanticChanges:changes.filter(c=>c.changeKind==='SEMANTIC_GRANULARITY_CHANGED').length,derivedProjectionChanges:changes.filter(c=>String(c.changeKind).startsWith('DERIVED_PROJECTION_ROW_')).length,comparisonFields:rowFields.slice(),integrity:INTEGRITY};
  }
  function panel(){
    const s=latestState();if(!s.valid)return '';
    if(s.state!=='CAPTURED')return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMMERCIAL · REFERENCES SNAPSHOT</p><h2>Granularidad referencial no capturada en este corte</h2><p>El snapshot sigue válido; no se rellena desde Commercial, Harvest o Economics vivos.</p></div><span class="status warn">NO CAPTURADO</span></div></section>`;
    const d=s.data||{};
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMMERCIAL · REFERENCES V149</p><h2>Integridad referencial comercial con historia estructural por fila</h2><p>${esc(s.snapshot.cutoff||'sin corte')} · ${d.capturedCount||0} caso(s) capturados · semántica ${esc(d.referenceSemanticsVersion||'legacy')}.</p></div><span class="status ${(d.issueCount||d.contentLeakCount)?'warn':'teal'}">${d.issueCount||0} ISSUE(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Declaradas',`${d.declaredCanonicalLinked||0}/${d.declaredCanonicalExpected||0}`,'event refs')}${metric('Cross-domain',`${d.derivedCrossDomainLinked||0}/${d.derivedCrossDomainExpected||0}`,'derived view')}${metric('Legacy',d.legacyCount||0,'fuera del denominador')}${metric('No canónicas',d.declaredNonCanonicalCount||0,'solo conteo')}</div><div class="section-note" style="margin-top:12px">ROW-LEVEL STRUCTURAL DIFF · DECLARED REFERENCE DELTA ≠ DERIVED PROJECTION DELTA · V148→V149 SEMANTIC GRANULARITY CHANGE IS SEPARATE FROM REFERENCE CHANGE · NO LIVE FALLBACK · BUYER/AGREEMENT/PRICE/INVOICE/PAYMENT/RECEIPT VALUES ARE NOT DUPLICATED · NO GUARANTEED REVENUE/CREDIT/INVESTMENT AUTHORITY.</div></div></section>`;
  }
  function insert(html,section){for(const m of ['<footer class="footer">','<footer class="footer-note">']){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}return html+section}
  const base=views.dataroom;if(base)views.dataroom=()=>insert(base(),panel());
  window.__SANA_DATAROOM_COMMERCIAL_REFERENCES__=Object.freeze({state:latestState,diff,cases,rowDiff,signature,integrity:INTEGRITY});
})();
