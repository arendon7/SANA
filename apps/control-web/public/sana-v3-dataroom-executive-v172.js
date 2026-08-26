(() => {
  'use strict';

  const VERSION='V172';
  const SCHEMA='SANA_DATAROOM_EXECUTIVE_LOCATOR_V1';
  const PARENT='V171';
  const PARENT_SHA='979e7de4981acff4f1c45cd5032a8cda53a0a3e7';
  const KINDS=Object.freeze(['SNAPSHOT_REF','CASE_REF','EVENT_REF','ENTITY_REF','SOURCE_ONLY']);
  const COLLECTIONS=Object.freeze(['rows','lots','cases','gaps','indicators']);
  const AUTHORITY=Object.freeze({canonicalMutationAvailable:false,financialMutationAvailable:false,locatorChangesAuthority:false,aiAuthority:'ADVISORY_ONLY',verificationAuthority:false,offerAuthority:false,solicitationAuthority:false,brokerageAuthority:false,custodyAuthority:false,paymentAuthority:false,disbursementAuthority:false});
  const INTEGRITY='LOCATOR ≠ EVIDENCE_VERIFICATION · SOURCE_REFERENCE ≠ VERIFIED_FACT · CASE_OR_EVENT_ID ≠ VERIFIED_IDENTITY · SNAPSHOT ≠ LIVE_STATE · RECORD_PRESENCE ≠ COMPLETENESS · EVIDENCE_COUNT ≠ ASSURANCE · REVIEW_EVENT ≠ APPROVAL · CAPITAL_READY ≠ FINANCING_APPROVAL · NO_RECURSIVE_CRAWLER · NO_SCORE · NO_MUTATION · READ_ONLY';

  function deepFreeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);for(const k of Object.getOwnPropertyNames(value))deepFreeze(value[k],seen);return Object.freeze(value);
  }
  function safe(fn){try{return {ok:true,value:fn()}}catch(error){return {ok:false,error:String(error?.message||error)}}}
  function arr(v){return Array.isArray(v)?v:[]}
  function text(v){return v===undefined||v===null?'':String(v)}
  function lotOf(v){return text(v?.lot||v?.lotId||v?.plot||v?.plotId||v?.scope?.lot)}
  function timeOf(v){return text(v?.observedAt||v?.capturedAt||v?.cutoff||v?.createdAt||v?.reviewedAt)||null}
  function explicitId(v){return text(v?.id||v?.caseId||v?.eventId||v?.lotId||v?.materialId||v?.planId||v?.findingRef||v?.reviewRef||v?.gapId)}
  function locatorKey(sourceId,kind,parentRef,referenceId){return `${sourceId}::${kind}::${parentRef||'-'}::${referenceId||'-'}`}
  function base(def,source,kind,referenceId,parentRef='',extra={}){
    return {
      schema:SCHEMA,version:VERSION,sectionId:def.section,sourceId:def.id,sourceGlobal:def.globalName,sourceFile:def.file,sourceView:def.view,
      strategy:def.strategy,scopeQuality:source?.scopeQuality||def.scopeCapability||'UNAVAILABLE',scopeMatch:source?.scopeMatch||'UNAVAILABLE',
      kind,referenceId:text(referenceId),parentRef:text(parentRef),declaredLot:text(extra.declaredLot),observedAt:extra.observedAt||null,
      locatorStatus:extra.locatorStatus||'REFERENCE_ONLY',limitations:Object.freeze([...(source?.limitations||[]),...(extra.limitations||[])]),
      referenceOnly:true,verificationState:'NOT_VERIFIED_BY_LOCATOR',authority:AUTHORITY,
      locatorKey:locatorKey(def.id,kind,parentRef,referenceId),integrity:INTEGRITY
    };
  }
  function sourceOnly(def,source,reason){
    return deepFreeze(base(def,source,'SOURCE_ONLY',def.globalName,'',{locatorStatus:source?.status||'UNAVAILABLE',limitations:[reason]}));
  }
  function snapshotLocator(def,source,snapshot){
    const id=explicitId(snapshot);if(!id)return null;
    return deepFreeze(base(def,source,'SNAPSHOT_REF',id,'',{declaredLot:lotOf(snapshot),observedAt:timeOf(snapshot),limitations:['SNAPSHOT_REFERENCE_ONLY']}));
  }
  function entityLocator(def,source,row,collection,snapshotRef,lotLens){
    const id=explicitId(row);if(!id)return null;
    const declaredLot=lotOf(row);
    if(lotLens&&declaredLot&&declaredLot!==lotLens)return null;
    return deepFreeze(base(def,source,'ENTITY_REF',id,snapshotRef||'',{declaredLot,observedAt:timeOf(row),limitations:[`TOP_LEVEL_COLLECTION:${collection}`,lotLens&&source.scopeQuality==='SNAPSHOT_GLOBAL'?'DECLARED_ENTITY_LOT_FILTER_WITHIN_SNAPSHOT_NOT_LOT_EXACT':'']}));
  }
  function caseLocators(def,source,cases,lotLens,referenceCase=false){
    const out=[];
    for(const c of arr(cases)){
      const caseId=explicitId(c);if(!caseId)continue;
      const declaredLot=lotOf(c);if(lotLens&&declaredLot&&declaredLot!==lotLens)continue;
      out.push(deepFreeze(base(def,source,'CASE_REF',caseId,'',{declaredLot,observedAt:timeOf(c),limitations:[referenceCase?'DECLARED_CASE_REFERENCE_ONLY':'OFFICIAL_CASE_REFERENCE']})));
      for(const e of arr(c?.events)){
        const eventId=explicitId(e);if(!eventId)continue;
        const eventLot=lotOf(e)||declaredLot;if(lotLens&&eventLot&&eventLot!==lotLens)continue;
        out.push(deepFreeze(base(def,source,'EVENT_REF',eventId,caseId,{declaredLot:eventLot,observedAt:timeOf(e),limitations:[referenceCase?'REFERENCE_CASE_EVENT_NOT_VERIFIED':'OFFICIAL_CASE_EVENT_REFERENCE']})));
      }
    }
    return out;
  }
  function extractState(def,source,api,lotLens,method){
    if(typeof api?.[method]!=='function')return [sourceOnly(def,source,`EXPECTED_ACCESSOR_MISSING:${method}`)];
    const r=safe(()=>api[method]());if(!r.ok)return [sourceOnly(def,source,'SOURCE_READ_FAILED')];
    const value=r.value||{};const out=[];const snapshot=value.snapshot||value.latest||null;const snap=snapshotLocator(def,source,snapshot);if(snap)out.push(snap);const parentRef=snap?.referenceId||'';
    for(const collection of COLLECTIONS){
      for(const row of arr(value?.[collection])){const loc=entityLocator(def,source,row,collection,parentRef,lotLens);if(loc)out.push(loc)}
    }
    if(!out.length)out.push(sourceOnly(def,source,'NO_BOUNDED_EXPLICIT_REFERENCE_IN_STATE'));
    return out;
  }
  function extractSnapshots(def,source,api,lotLens){
    if(typeof api?.snapshots!=='function')return [sourceOnly(def,source,'EXPECTED_ACCESSOR_MISSING:snapshots')];
    const r=safe(()=>api.snapshots());if(!r.ok)return [sourceOnly(def,source,'SOURCE_READ_FAILED')];
    const out=arr(r.value).map(s=>snapshotLocator(def,source,s)).filter(Boolean);
    return out.length?out:[sourceOnly(def,source,'NO_SNAPSHOT_WITH_EXPLICIT_ID')];
  }
  function extractCases(def,source,api,lotLens,referenceCase){
    let r;
    if(def.strategy==='FOR_LOT_CASES'&&lotLens){if(typeof api?.forLot!=='function')return [sourceOnly(def,source,'EXPECTED_ACCESSOR_MISSING:forLot')];r=safe(()=>api.forLot(lotLens));}
    else {if(typeof api?.cases!=='function')return [sourceOnly(def,source,'EXPECTED_ACCESSOR_MISSING:cases')];r=safe(()=>api.cases());}
    if(!r.ok)return [sourceOnly(def,source,'SOURCE_READ_FAILED')];
    const out=caseLocators(def,source,r.value,lotLens,referenceCase);return out.length?out:[sourceOnly(def,source,lotLens?'NO_REFERENCE_FOR_SELECTED_LOT':'NO_EXPLICIT_CASE_REFERENCE')];
  }
  function extractForSource(host,def,source,lotLens){
    if(!def.materialized||source?.status==='UNAVAILABLE')return [sourceOnly(def,source,'SOURCE_UNAVAILABLE')];
    const api=host?.[def.globalName];if(!api)return [sourceOnly(def,source,'SOURCE_API_NOT_AVAILABLE')];
    if(def.strategy==='SNAPSHOTS')return extractSnapshots(def,source,api,lotLens);
    if(def.strategy==='STATE')return extractState(def,source,api,lotLens,'state');
    if(def.strategy==='CURRENT')return extractState(def,source,api,lotLens,'current');
    if(def.strategy==='FOR_LOT_CASES')return extractCases(def,source,api,lotLens,false);
    if(def.strategy==='CASES_EVENTS')return extractCases(def,source,api,lotLens,true);
    return [sourceOnly(def,source,'NO_LOCATOR_STRATEGY')];
  }
  function summarize(locators){
    const kinds=Object.fromEntries(KINDS.map(k=>[k,0]));for(const l of locators)kinds[l.kind]=(kinds[l.kind]||0)+1;
    return deepFreeze({total:locators.length,kinds,referenceOnly:locators.filter(l=>l.referenceOnly).length,verifiedByLocator:0,semantics:'LOCATOR_COUNTS_ONLY · NOT_SCORE · NOT_ASSURANCE'});
  }
  function build(host,options={}){
    const parentFactory=globalThis.__SANA_DATAROOM_EXECUTIVE_V171_FACTORY__||host?.__SANA_DATAROOM_EXECUTIVE_V171_FACTORY__;
    if(!parentFactory?.create)throw new Error('V171_FACTORY_REQUIRED');
    const v171=parentFactory.create(host);const lot=options.lot?String(options.lot):null;const dossier=v171.compose({lot});const sourceMap=new Map(dossier.sections.flatMap(s=>s.sources).map(s=>[s.id,s]));
    const locators=[];for(const def of v171.registry){const source=sourceMap.get(def.id)||null;locators.push(...extractForSource(host,def,source,lot));}
    const ordered=locators.slice().sort((a,b)=>String(a.sectionId).localeCompare(String(b.sectionId))||String(a.sourceId).localeCompare(String(b.sourceId))||String(a.observedAt||'').localeCompare(String(b.observedAt||''))||String(a.locatorKey).localeCompare(String(b.locatorKey)));
    return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,parentSha:PARENT_SHA,scope:{lot,mode:lot?'LOT_LENS':'GLOBAL_OR_SNAPSHOT'},locators:ordered,summary:summarize(ordered),authority:AUTHORITY,provenance:{parent:PARENT,parentSha:PARENT_SHA,sourceRegistry:'V171_TYPED_REGISTRY',extraction:'BOUNDED_EXPLICIT_FIELDS_ONLY'},integrity:INTEGRITY});
  }
  function forSection(host,sectionId,options={}){const result=build(host,options);return deepFreeze({...result,sectionId,locators:result.locators.filter(l=>l.sectionId===sectionId),summary:summarize(result.locators.filter(l=>l.sectionId===sectionId))});}
  function forSource(host,sourceId,options={}){const result=build(host,options);return deepFreeze({...result,sourceId,locators:result.locators.filter(l=>l.sourceId===sourceId),summary:summarize(result.locators.filter(l=>l.sourceId===sourceId))});}
  function create(host){const target=host||globalThis;return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,kinds:KINDS,authority:AUTHORITY,build:o=>build(target,o),forSection:(id,o)=>forSection(target,id,o),forSource:(id,o)=>forSource(target,id,o),integrity:INTEGRITY});}

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,create,integrity:INTEGRITY});
  if(typeof window!=='undefined'){window.__SANA_DATAROOM_EXECUTIVE_V172_FACTORY__=factory;}
  if(typeof globalThis!=='undefined')globalThis.__SANA_DATAROOM_EXECUTIVE_V172_FACTORY__=factory;
})();
