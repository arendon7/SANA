(() => {
  'use strict';

  const base=window.__SANA_COMMERCIAL_LEDGER__;
  if(!base?.cases||base.schema!=='SANA_COMMERCIAL_OFFTAKE_LEDGER_V1')return;

  const VERSION='V147';
  const SEMANTICS_VERSION='V149';
  const ORIGIN_DECLARED='DECLARED_COMMERCIAL_EVENT';
  const ORIGIN_DERIVED='DERIVED_CROSS_DOMAIN_PROJECTION';
  const INTEGRITY='COMMERCIAL_REFERENCE ≠ COMMERCIAL_EXECUTION · DECLARED_COMMERCIAL_REFERENCE ≠ DERIVED_CROSS_DOMAIN_PROJECTION · DERIVED_CROSS_DOMAIN_PROJECTION ≠ COMMERCIAL_DECLARATION · BUYER_REF ≠ BUYER_IDENTITY_VERIFIED · SUPPORT_REFERENCE ≠ EVIDENCE_VERIFIED · DELIVERY_REFERENCE ≠ BUYER_ACCEPTANCE · HARVEST_REFERENCE ≠ COMMERCIAL_SUCCESS · ECONOMIC_REFERENCE ≠ ACCOUNTING_VERIFICATION · AGREEMENT_REFERENCE_DECLARED ≠ VERIFIED_CONTRACT · PRICE_REFERENCE_DECLARED ≠ REALIZED_PRICE · INVOICE_REFERENCE_DECLARED ≠ VERIFIED_INVOICE · PAYMENT_STATUS_DECLARED ≠ PAYMENT_EXECUTED · RECEIPT_REFERENCE_DECLARED ≠ BANK_SETTLEMENT · DERIVED_REFERENCE_HAS_NO_DECLARATION_TIMESTAMP · REFERENCE ≠ GUARANTEED_REVENUE ≠ CREDIT_RISK ≠ ELIGIBILITY ≠ INVESTMENT_SIGNAL';
  const COMMERCIAL_TARGET_KINDS=new Set(['OFFER_REGISTERED','BUYER_INTEREST','NEGOTIATION_NOTE','OFFTAKE_AGREEMENT_REFERENCE','DELIVERY_COMMITMENT','DELIVERY_DECLARATION','BUYER_ACCEPTANCE_DECLARATION','INVOICE_REFERENCE','PAYMENT_STATUS_DECLARED','CASH_RECEIPT_DECLARATION']);

  function metadata(){
    const out=new Map();
    (storage?.records||[])
      .filter(r=>r.type==='commercial-reference-meta'&&r.values?.sourceSchema===base.schema)
      .forEach(r=>{
        const id=r.values?.caseId||'';
        if(id)out.set(id,{referenceVersion:r.values?.referenceVersion||'',recordId:r.id||'',createdAt:r.createdAt||''});
      });
    return out;
  }

  function sameScope(a,b){return !a||!b||a===b}
  function temporal(source,target){
    const a=Date.parse(source?.observedAt||''),b=Date.parse(target?.observedAt||'');
    return Number.isFinite(a)&&Number.isFinite(b)&&b>a?'FORWARD_REFERENCE':null;
  }
  function harvestEvent(ref){
    for(const c of window.__SANA_HARVEST_LEDGER__?.cases?.()||[]){
      const e=(c.events||[]).find(x=>x.id===ref);
      if(e)return {case:c,event:e};
    }
    return null;
  }
  function economicEvent(ref){
    for(const c of window.__SANA_ECONOMIC_RECONCILIATION__?.cases?.()||[]){
      const e=(c.events||[]).find(x=>x.id===ref);
      if(e)return {case:c,event:e};
    }
    return null;
  }

  function supportRef(c,e,ref,all){
    if(!ref)return {status:'MISSING_REFERENCE',domain:'COMMERCIAL_EVENT',target:null};
    let found=null,owner=null;
    for(const x of all){
      const t=(x.events||[]).find(z=>z.id===ref);
      if(t){found=t;owner=x;break}
    }
    if(!found)return {status:'MISSING_TARGET',domain:'COMMERCIAL_EVENT',target:null};
    if(owner?.id!==c.id)return {status:'CROSS_CASE_REFERENCE',domain:'COMMERCIAL_EVENT',target:found};
    if(!COMMERCIAL_TARGET_KINDS.has(found.kind))return {status:'KIND_MISMATCH',domain:'COMMERCIAL_EVENT',target:found};
    const time=temporal(e,found);
    if(time)return {status:time,domain:'COMMERCIAL_EVENT',target:found};
    return {status:'LINKED',domain:'COMMERCIAL_EVENT',target:found};
  }

  function deliveryRef(c,e){
    if(!e.deliveryRef)return {status:'MISSING_REFERENCE',domain:'HARVEST',target:null};
    const t=harvestEvent(e.deliveryRef);
    if(!t)return {status:'MISSING_TARGET',domain:'HARVEST',target:null};
    if(!sameScope(c.lot,t.case?.lot||t.event?.lot))return {status:'CROSS_SCOPE_REFERENCE',domain:'HARVEST',target:t.event};
    if(t.event?.kind!=='HANDOFF')return {status:'KIND_MISMATCH',domain:'HARVEST',target:t.event};
    const time=temporal(e,t.event);
    if(time)return {status:time,domain:'HARVEST',target:t.event};
    return {status:'LINKED',domain:'HARVEST',target:t.event};
  }

  function crossRef(c,x){
    if(!x.sourceRef)return {status:'MISSING_REFERENCE',domain:x.sourceDomain||'',target:null};
    if(x.sourceDomain==='HARVEST'){
      const t=harvestEvent(x.sourceRef);
      if(!t)return {status:'MISSING_TARGET',domain:'HARVEST',target:null};
      if(!sameScope(c.lot,t.case?.lot||t.event?.lot))return {status:'CROSS_SCOPE_REFERENCE',domain:'HARVEST',target:t.event};
      const expected=x.kind==='HARVEST_HANDOFF_REFERENCE'?'HANDOFF':x.kind==='HARVEST_SALE_DECLARATION_REFERENCE'?'SALE_DECLARATION':null;
      if(!expected)return {status:'UNSUPPORTED_REFERENCE_KIND',domain:'HARVEST',target:t.event};
      if(t.event?.kind!==expected)return {status:'KIND_MISMATCH',domain:'HARVEST',target:t.event};
      return {status:'LINKED',domain:'HARVEST',target:t.event};
    }
    if(x.sourceDomain==='ECONOMICS'){
      const t=economicEvent(x.sourceRef);
      if(!t)return {status:'MISSING_TARGET',domain:'ECONOMICS',target:null};
      if(!sameScope(c.lot,t.case?.lot||t.event?.lot))return {status:'CROSS_SCOPE_REFERENCE',domain:'ECONOMICS',target:t.event};
      if(!x.sourceKind)return {status:'MISSING_EXPECTED_KIND',domain:'ECONOMICS',target:t.event};
      if(t.event?.kind!==x.sourceKind)return {status:'KIND_MISMATCH',domain:'ECONOMICS',target:t.event};
      return {status:'LINKED',domain:'ECONOMICS',target:t.event};
    }
    return {status:'UNSUPPORTED_SOURCE_DOMAIN',domain:x.sourceDomain||'',target:null};
  }

  function canonicalRows(c,all){
    if(metadata().get(c.id)?.referenceVersion!==VERSION)return [];
    const rows=[];
    for(const e of c.events||[]){
      if(e.kind==='EVIDENCE'){
        const refs=(e.supports||[]).length?e.supports:[''];
        refs.forEach(ref=>rows.push({
          sourceEventId:e.id,
          sourceKind:e.kind,
          kind:'COMMERCIAL_SUPPORT_REF',
          refId:ref||'',
          origin:ORIGIN_DECLARED,
          temporalPolicy:'ENFORCED_WHEN_COMPARABLE',
          reference:supportRef(c,e,ref,all)
        }));
      }
      if(e.kind==='DELIVERY_DECLARATION')rows.push({
        sourceEventId:e.id,
        sourceKind:e.kind,
        kind:'HARVEST_DELIVERY_REF',
        refId:e.deliveryRef||'',
        origin:ORIGIN_DECLARED,
        temporalPolicy:'ENFORCED_WHEN_COMPARABLE',
        reference:deliveryRef(c,e)
      });
    }
    for(const x of c.crossDomainRefs||[])rows.push({
      sourceEventId:x.id,
      sourceKind:x.kind,
      kind:'CROSS_DOMAIN_REF',
      refId:x.sourceRef||'',
      sourceDomain:x.sourceDomain||'',
      sourceKindExpected:x.sourceKind||'',
      origin:ORIGIN_DERIVED,
      temporalPolicy:'NOT_APPLICABLE_NO_DECLARATION_TIMESTAMP',
      reference:crossRef(c,x)
    });
    return rows;
  }

  function declaredRows(c){
    const out=[];
    for(const e of c.events||[]){
      for(const [field,kind] of [['buyerRef','BUYER_REF_DECLARED'],['agreementRef','AGREEMENT_REF_DECLARED'],['priceRef','PRICE_REF_DECLARED'],['invoiceRef','INVOICE_REF_DECLARED'],['paymentState','PAYMENT_STATE_DECLARED'],['receiptRef','RECEIPT_REF_DECLARED'],['evidenceRef','EVIDENCE_REF_DECLARED']]){
        if(e[field]!==undefined&&e[field]!==null&&e[field]!=='')out.push({sourceEventId:e.id,kind,refId:String(e[field]),status:'DECLARED_NON_CANONICAL_REFERENCE'});
      }
    }
    for(const x of c.crossDomainRefs||[])if(x.commercialRef)out.push({sourceEventId:x.id,kind:'COMMERCIAL_REF_DECLARED',refId:String(x.commercialRef),status:'DECLARED_NON_CANONICAL_REFERENCE'});
    return out;
  }

  function coverage(rows){
    const linked=rows.filter(r=>r.reference?.status==='LINKED').length,total=rows.length;
    return {linked,total,percent:total?Math.round(linked/total*100):null,issues:total-linked};
  }

  function caseFor(id){
    const all=base.cases(),c=all.find(x=>x.id===id);
    if(!c)return null;
    const meta=metadata().get(id)||{},captured=meta.referenceVersion===VERSION,rows=canonicalRows(c,all);
    const declaredCanonicalRows=rows.filter(r=>r.origin===ORIGIN_DECLARED);
    const derivedCrossDomainRows=rows.filter(r=>r.origin===ORIGIN_DERIVED);
    const totalCoverage=coverage(rows),declaredCoverage=coverage(declaredCanonicalRows),derivedCoverage=coverage(derivedCrossDomainRows);
    return {
      ...c,
      referenceVersion:meta.referenceVersion||'',
      referenceSemanticsVersion:SEMANTICS_VERSION,
      referenceState:captured?'CAPTURED_V147':'LEGACY_REFERENCE_NOT_CAPTURED',
      referenceCoverage:{linked:totalCoverage.linked,total:totalCoverage.total,percent:totalCoverage.percent},
      referenceIssues:totalCoverage.issues,
      declaredReferenceCoverage:declaredCoverage,
      derivedCrossDomainCoverage:derivedCoverage,
      referenceRows:rows,
      declaredReferenceRows:declaredRows(c),
      integrity:`${c.integrity} · ${INTEGRITY}`
    };
  }

  function cases(){return base.cases().map(c=>caseFor(c.id)).filter(Boolean)}
  function forLot(lot){return cases().filter(c=>c.lot===lot)}
  function summary(){
    const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V147');
    return {
      ...base.summary(),
      referenceVersion:VERSION,
      referenceSemanticsVersion:SEMANTICS_VERSION,
      referenceCaptured:captured.length,
      referenceLinked:captured.reduce((n,c)=>n+c.referenceCoverage.linked,0),
      referenceExpected:captured.reduce((n,c)=>n+c.referenceCoverage.total,0),
      referenceIssues:captured.reduce((n,c)=>n+c.referenceIssues,0),
      declaredCanonicalLinked:captured.reduce((n,c)=>n+c.declaredReferenceCoverage.linked,0),
      declaredCanonicalExpected:captured.reduce((n,c)=>n+c.declaredReferenceCoverage.total,0),
      declaredCanonicalIssues:captured.reduce((n,c)=>n+c.declaredReferenceCoverage.issues,0),
      derivedCrossDomainLinked:captured.reduce((n,c)=>n+c.derivedCrossDomainCoverage.linked,0),
      derivedCrossDomainExpected:captured.reduce((n,c)=>n+c.derivedCrossDomainCoverage.total,0),
      derivedCrossDomainIssues:captured.reduce((n,c)=>n+c.derivedCrossDomainCoverage.issues,0),
      declaredNonCanonical:captured.reduce((n,c)=>n+c.declaredReferenceRows.length,0),
      legacyReferenceNotCaptured:all.length-captured.length,
      integrity:`${base.summary().integrity} · ${INTEGRITY}`
    };
  }

  function openReference(caseId){
    const c=base.cases().find(x=>x.id===caseId);if(!c)return;
    openModal('COMERCIAL · REFERENCIAS V147/V149','Validar relaciones internas verificables',`<div class="fields"><input type="hidden" name="sourceSchema" value="${base.schema}"><input type="hidden" name="referenceVersion" value="${VERSION}"><input type="hidden" name="caseId" value="${esc(c.id)}"><label>Caso<input value="${esc(c.id)} · ${esc(c.lot)}" readonly></label><label>Responsable humano<input name="reviewer" value="${esc(identity?.displayName||'Responsable DEMO')}" required></label><label class="full">Nota<textarea name="detail" placeholder="Activa validación V147 con semántica V149. Cross-domain es proyección derivada, no declaración comercial."></textarea></label><label class="full">Frontera<input value="DECLARED REF ≠ DERIVED CROSS-DOMAIN VIEW · REFERENCE ≠ VERIFIED CONTRACT/PAYMENT/SALE" readonly></label></div>`,true,'commercial-reference-meta');
  }

  function panel(){
    const all=cases(),captured=all.filter(c=>c.referenceState==='CAPTURED_V147');
    const declaredLinked=captured.reduce((n,c)=>n+c.declaredReferenceCoverage.linked,0),declaredTotal=captured.reduce((n,c)=>n+c.declaredReferenceCoverage.total,0),declaredIssues=captured.reduce((n,c)=>n+c.declaredReferenceCoverage.issues,0);
    const derivedLinked=captured.reduce((n,c)=>n+c.derivedCrossDomainCoverage.linked,0),derivedTotal=captured.reduce((n,c)=>n+c.derivedCrossDomainCoverage.total,0),derivedIssues=captured.reduce((n,c)=>n+c.derivedCrossDomainCoverage.issues,0);
    const issues=declaredIssues+derivedIssues;
    return `<section class="card" style="margin-top:14px"><div class="card-head"><div><p class="kicker">COMMERCIAL · REFERENCIAS V147 · SEMÁNTICA V149</p><h2>Referencias declaradas separadas de proyecciones cross-domain</h2><p>Supports y deliveryRef son relaciones declaradas. Harvest/Economics cross-domain son vistas derivadas del mismo lote y no se presentan como declaraciones comerciales.</p></div><span class="status ${issues?'warn':'teal'}">${issues} ISSUE(S)</span></div><div class="card-body"><div class="grid metrics">${metric('Declaradas',`${declaredLinked}/${declaredTotal||0}`,'supports + deliveryRef')}${metric('Cross-domain derivadas',`${derivedLinked}/${derivedTotal||0}`,'projection only')}${metric('Issues declaradas',declaredIssues,'integridad referencial',declaredIssues?'warn':'good')}${metric('Issues derivadas',derivedIssues,'no ejecución comercial',derivedIssues?'warn':'good')}</div>${all.map(c=>`<div class="gate" style="margin-top:10px"><i class="${c.referenceState==='CAPTURED_V147'?(c.referenceIssues?'warn':'ok'):''}">${c.referenceState==='CAPTURED_V147'?(c.referenceIssues?'!':'✓'):'·'}</i><div><strong>${esc(c.id)} · ${esc(c.lot)}</strong><p>${c.referenceState==='CAPTURED_V147'?`${c.declaredReferenceCoverage.linked}/${c.declaredReferenceCoverage.total} declaradas · ${c.derivedCrossDomainCoverage.linked}/${c.derivedCrossDomainCoverage.total} derivadas · ${c.referenceIssues} issue(s)`:'LEGACY_REFERENCE_NOT_CAPTURED · no inválida'}</p></div><button class="btn secondary" data-commercial-ref="${esc(c.id)}">Validar referencias</button></div>`).join('')}<div class="section-note" style="margin-top:12px">DECLARED_COMMERCIAL_REFERENCE ≠ DERIVED_CROSS_DOMAIN_PROJECTION · DERIVED VIEW HAS NO DECLARATION TIMESTAMP · BUYER/AGREEMENT/PRICE/INVOICE/PAYMENT/RECEIPT REMAIN NON-CANONICAL · NO GUARANTEED REVENUE/CREDIT/INVESTMENT SIGNAL.</div></div></section>`;
  }

  function insert(html,section){
    const markers=['<footer class="footer-note">','<footer class="footer">'];
    for(const m of markers){const i=html.lastIndexOf(m);if(i>=0)return html.slice(0,i)+section+html.slice(i)}
    return html+section;
  }
  const priorResults=views.results;if(priorResults)views.results=()=>insert(priorResults(),panel());
  document.addEventListener('click',e=>{const b=e.target.closest('[data-commercial-ref]');if(b)openReference(b.dataset.commercialRef)});
  window.__SANA_COMMERCIAL_LEDGER__=Object.freeze({...base,referenceVersion:VERSION,referenceSemanticsVersion:SEMANTICS_VERSION,cases,forLot,forCase:caseFor,summary,integrity:`${base.integrity} · ${INTEGRITY}`});
})();
