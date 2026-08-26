(() => {
  'use strict';

  const VERSION='V170';
  const SCHEMA='SANA_DATAROOM_EXECUTIVE_360_V1';
  const BASE_SHA='00e6a04693dad2e19cfd53a7c61ff3fc8c1b0136';
  const STATES=Object.freeze(['AVAILABLE','PARTIAL','UNAVAILABLE','SCOPE_MISMATCH','SCHEMA_MISMATCH','STALE_REFERENCE']);
  const CANONICAL_ORDER=Object.freeze([
    'IDENTITY_SCOPE','PLAN_EXECUTION','CROP_HEALTH_NUTRITION','PRODUCTION_HARVEST','COMMERCIAL_ECONOMIC',
    'TRACEABILITY_DATA_TRUST','CIRCULARITY_IMPACT','CAPITAL_READINESS','EXCEPTIONS_GAPS','DECISION_TIMELINE'
  ]);
  const TITLES=Object.freeze({
    IDENTITY_SCOPE:'Identidad y alcance',PLAN_EXECUTION:'Plan y ejecución',CROP_HEALTH_NUTRITION:'Sanidad, nutrición y fenología',
    PRODUCTION_HARVEST:'Producción, cosecha y recursos',COMMERCIAL_ECONOMIC:'Comercial y economía',
    TRACEABILITY_DATA_TRUST:'Trazabilidad y Data Trust',CIRCULARITY_IMPACT:'Circularidad, material e impacto',
    CAPITAL_READINESS:'Capital y readiness documental',EXCEPTIONS_GAPS:'Brechas e integridad',DECISION_TIMELINE:'Circuito humano de revisión'
  });
  const LENSES=Object.freeze({
    EXECUTIVE:Object.freeze(['CAPITAL_READINESS','EXCEPTIONS_GAPS','COMMERCIAL_ECONOMIC','PRODUCTION_HARVEST','CIRCULARITY_IMPACT','TRACEABILITY_DATA_TRUST','CROP_HEALTH_NUTRITION','PLAN_EXECUTION','IDENTITY_SCOPE','DECISION_TIMELINE']),
    PRODUCER:Object.freeze(['PLAN_EXECUTION','CROP_HEALTH_NUTRITION','PRODUCTION_HARVEST','TRACEABILITY_DATA_TRUST','COMMERCIAL_ECONOMIC','CIRCULARITY_IMPACT','IDENTITY_SCOPE','EXCEPTIONS_GAPS','CAPITAL_READINESS','DECISION_TIMELINE']),
    AGRONOMIST:Object.freeze(['CROP_HEALTH_NUTRITION','PLAN_EXECUTION','TRACEABILITY_DATA_TRUST','PRODUCTION_HARVEST','CIRCULARITY_IMPACT','EXCEPTIONS_GAPS','COMMERCIAL_ECONOMIC','IDENTITY_SCOPE','CAPITAL_READINESS','DECISION_TIMELINE']),
    CAPITAL_REVIEWER:Object.freeze(['IDENTITY_SCOPE','CAPITAL_READINESS','EXCEPTIONS_GAPS','TRACEABILITY_DATA_TRUST','COMMERCIAL_ECONOMIC','CIRCULARITY_IMPACT','DECISION_TIMELINE','PRODUCTION_HARVEST','PLAN_EXECUTION','CROP_HEALTH_NUTRITION']),
    AUDITOR:CANONICAL_ORDER
  });
  const AUTHORITY=Object.freeze({canonicalMutationAvailable:false,financialMutationAvailable:false,lensChangesAuthority:false,aiAuthority:'ADVISORY_ONLY',offerAuthority:false,solicitationAuthority:false,brokerageAuthority:false,custodyAuthority:false,disbursementAuthority:false});
  const INTEGRITY='EXECUTIVE_DOSSIER ≠ CANONICAL_STATE · ROLE_LENS ≠ ACCESS_CONTROL · SNAPSHOT ≠ LIVE_STATE · REFERENCE ≠ VERIFIED_FACT · TRACEABILITY ≠ GUARANTEE · FORECAST ≠ REALIZED_OUTCOME · REVIEW ≠ APPROVAL · CAPITAL_READY ≠ FINANCING_APPROVAL · IMPACT_ESTIMATE ≠ VERIFIED_IMPACT_OR_CARBON_CREDIT · NO_SCORE · NO_OFFER · NO_SOLICITATION · NO_BROKERAGE · NO_CUSTODY · NO_DISBURSEMENT · READ_ONLY';

  const SOURCE_GROUPS=Object.freeze({
    IDENTITY_SCOPE:Object.freeze([
      ['DATAROOM_360','__SANA_DATAROOM_360__'],['DUE_DILIGENCE_SNAPSHOT','__SANA_DUE_DILIGENCE_SNAPSHOT__'],['CAPITAL_REVIEW','__SANA_CAPITAL_REVIEW__']
    ]),
    PLAN_EXECUTION:Object.freeze([
      ['DATAROOM_360','__SANA_DATAROOM_360__'],['PHENOLOGY_HISTORY','__SANA_DATAROOM_PHENOLOGY_HISTORY__'],['LABOR_HISTORY','__SANA_DATAROOM_LABOR_HISTORY__']
    ]),
    CROP_HEALTH_NUTRITION:Object.freeze([
      ['HEALTH_HISTORY','__SANA_DATAROOM_HEALTH_HISTORY__'],['HEALTH_LIFECYCLE','__SANA_DATAROOM_HEALTH_LIFECYCLE__'],['NUTRITION_HISTORY','__SANA_DATAROOM_NUTRITION_HISTORY__'],['NUTRITION_V2_HISTORY','__SANA_DATAROOM_NUTRITION_V2_HISTORY__'],['PHENOLOGY_HISTORY','__SANA_DATAROOM_PHENOLOGY_HISTORY__']
    ]),
    PRODUCTION_HARVEST:Object.freeze([
      ['FORECAST_HISTORY','__SANA_DATAROOM_FORECAST_HISTORY__'],['HARVEST_HISTORY','__SANA_DATAROOM_HARVEST_HISTORY__'],['INVENTORY_HISTORY','__SANA_DATAROOM_INVENTORY_HISTORY__'],['LABOR_HISTORY','__SANA_DATAROOM_LABOR_HISTORY__']
    ]),
    COMMERCIAL_ECONOMIC:Object.freeze([
      ['ECONOMIC_RECONCILIATION_HISTORY','__SANA_DATAROOM_ECONOMIC_RECONCILIATION_HISTORY__'],['COMMERCIAL_HISTORY','__SANA_DATAROOM_COMMERCIAL_HISTORY__'],['HARVEST_HISTORY','__SANA_DATAROOM_HARVEST_HISTORY__']
    ]),
    TRACEABILITY_DATA_TRUST:Object.freeze([
      ['DATA_TRUST_HISTORY','__SANA_DATAROOM_DATA_TRUST_HISTORY__'],['CAPTURE_SYNC_HISTORY','__SANA_DATAROOM_CAPTURE_SYNC_HISTORY__'],['SOURCE_EVIDENCE_HISTORY','__SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__']
    ]),
    CIRCULARITY_IMPACT:Object.freeze([
      ['CIRCULARITY_HISTORY','__SANA_DATAROOM_CIRCULARITY_HISTORY__'],['MATERIAL_HISTORY','__SANA_DATAROOM_MATERIAL_HISTORY__'],['IMPACT_HISTORY','__SANA_DATAROOM_IMPACT_HISTORY__']
    ]),
    CAPITAL_READINESS:Object.freeze([
      ['CAPITAL_GOVERNANCE_HISTORY','__SANA_DATAROOM_CAPITAL_GOVERNANCE_HISTORY__'],['CAPITAL_REVIEW_HISTORY','__SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__'],['CAPITAL_GOVERNANCE','__SANA_CAPITAL_GOVERNANCE__'],['CAPITAL_REVIEW','__SANA_CAPITAL_REVIEW__'],['REVIEW_GOVERNANCE','__SANA_DATAROOM_REVIEW_GOVERNANCE__']
    ]),
    EXCEPTIONS_GAPS:Object.freeze([
      ['DUE_DILIGENCE_GAPS','__SANA_DUE_DILIGENCE_GAPS__'],['DATAROOM_FINDINGS','__SANA_DATAROOM_FINDINGS__'],['FINDINGS_HISTORY','__SANA_DATAROOM_FINDINGS_HISTORY__'],['DATAROOM_360','__SANA_DATAROOM_360__']
    ]),
    DECISION_TIMELINE:Object.freeze([
      ['CAPITAL_REVIEW','__SANA_CAPITAL_REVIEW__'],['REVIEW_CASE','__SANA_DATAROOM_REVIEW_CASE__'],['REVIEW_HANDOFF','__SANA_DATAROOM_REVIEW_HANDOFF__'],['REVIEW_FEEDBACK','__SANA_DATAROOM_REVIEW_FEEDBACK__'],['REVIEW_RESPONSE','__SANA_DATAROOM_REVIEW_RESPONSE__'],['REVIEW_DISPOSITION','__SANA_DATAROOM_REVIEW_DISPOSITION__'],['REVIEW_ROUND','__SANA_DATAROOM_REVIEW_ROUND__']
    ])
  });

  function freeze(value,seen=new WeakSet()){
    if(!value||typeof value!=='object'||seen.has(value))return value;
    seen.add(value);Object.getOwnPropertyNames(value).forEach(k=>freeze(value[k],seen));return Object.freeze(value);
  }
  function clone(value){
    if(value===undefined)return undefined;
    try{return structuredClone(value)}catch{try{return JSON.parse(JSON.stringify(value))}catch{return value}}
  }
  function safeCall(fn,...args){try{return {ok:true,value:fn(...args)}}catch(error){return {ok:false,error:String(error?.message||error)}}}
  function asArray(v){return Array.isArray(v)?v:[]}
  function lotOf(v){return String(v?.lot||v?.lotId||v?.plot||v?.plotId||v?.scope?.lot||'')}
  function timeOf(v){return String(v?.observedAt||v?.createdAt||v?.cutoff||v?.capturedAt||v?.reviewedAt||'')}
  function sourceState(raw){
    const s=String(raw?.state||'').toUpperCase();
    if(raw?.valid===false&&s.includes('SCHEMA'))return 'SCHEMA_MISMATCH';
    if(raw?.valid===false&&s.includes('STALE'))return 'STALE_REFERENCE';
    if(raw?.valid===false)return 'UNAVAILABLE';
    if(s.includes('NOT_CAPTURED')||s.includes('PARTIAL')||s.includes('INDETERMINATE'))return 'PARTIAL';
    return 'AVAILABLE';
  }
  function summarizePayload(v){
    if(v===null||v===undefined)return {kind:'EMPTY',count:0};
    if(Array.isArray(v))return {kind:'ARRAY',count:v.length};
    if(typeof v!=='object')return {kind:typeof v.toUpperCase(),count:1};
    const keys=Object.keys(v);return {kind:'OBJECT',count:keys.length,keys:keys.slice(0,16)};
  }
  function readApi(host,label,globalName,scope){
    const api=host?.[globalName];
    if(!api)return freeze({label,globalName,status:'UNAVAILABLE',scope:'NONE',asOf:null,summary:{kind:'MISSING',count:0},records:[],limitations:['SOURCE_API_NOT_AVAILABLE'],integrity:null});
    let mode='API_PRESENT',result={ok:true,value:null},all=[];
    if(scope?.lot&&typeof api.forLot==='function'){
      mode='FOR_LOT';result=safeCall(api.forLot.bind(api),scope.lot);all=asArray(result.value);
    }else if(typeof api.state==='function'){
      mode='STATE';result=safeCall(api.state.bind(api));
    }else if(typeof api.summary==='function'){
      mode='SUMMARY';result=safeCall(api.summary.bind(api));
    }else if(typeof api.cases==='function'){
      mode='CASES';result=safeCall(api.cases.bind(api));all=asArray(result.value);if(scope?.lot)all=all.filter(x=>lotOf(x)===scope.lot);
    }else if(typeof api.events==='function'){
      mode='EVENTS';result=safeCall(api.events.bind(api));all=asArray(result.value);if(scope?.lot)all=all.filter(x=>lotOf(x)===scope.lot);
    }
    if(!result.ok)return freeze({label,globalName,status:'PARTIAL',scope:mode,asOf:null,summary:{kind:'ERROR',count:0},records:[],limitations:['SOURCE_API_READ_FAILED',result.error],integrity:String(api.integrity||'')});
    let value=result.value;
    if(mode==='CASES'||mode==='EVENTS'||mode==='FOR_LOT')value=all;
    const status=mode==='STATE'?sourceState(value):'AVAILABLE';
    const limitations=[];
    if(mode==='API_PRESENT')limitations.push('API_PRESENT_WITHOUT_READ_ACCESSOR');
    if(scope?.lot&&mode!=='FOR_LOT'&&mode!=='CASES'&&mode!=='EVENTS')limitations.push('GLOBAL_OR_SNAPSHOT_SCOPE_NOT_LOT_FILTERED');
    if(scope?.lot&&(mode==='CASES'||mode==='EVENTS'||mode==='FOR_LOT')&&all.length===0)limitations.push('NO_RECORD_FOR_SELECTED_LOT');
    const snapshot=value?.snapshot||value?.latest||null;
    const records=mode==='CASES'||mode==='EVENTS'||mode==='FOR_LOT'?clone(all):[];
    return freeze({label,globalName,status,scope:mode,asOf:timeOf(snapshot)||timeOf(value)||null,summary:summarizePayload(value),records,limitations,integrity:String(value?.integrity||api.integrity||'')});
  }
  function sectionStatus(sources){
    if(!sources.length||sources.every(s=>s.status==='UNAVAILABLE'))return 'UNAVAILABLE';
    if(sources.some(s=>s.status==='SCHEMA_MISMATCH'))return 'SCHEMA_MISMATCH';
    if(sources.some(s=>s.status==='STALE_REFERENCE'))return 'STALE_REFERENCE';
    if(sources.some(s=>s.status==='SCOPE_MISMATCH'))return 'SCOPE_MISMATCH';
    if(sources.some(s=>s.status==='PARTIAL'||s.status==='UNAVAILABLE'))return 'PARTIAL';
    return 'AVAILABLE';
  }
  function section(host,id,scope){
    const sources=(SOURCE_GROUPS[id]||[]).map(([label,name])=>readApi(host,label,name,scope));
    const limitations=[...new Set(sources.flatMap(s=>s.limitations||[]))];
    return freeze({id,title:TITLES[id],status:sectionStatus(sources),sources,limitations,authority:AUTHORITY});
  }
  function reviewTimeline(host,scope){
    const names=['__SANA_CAPITAL_REVIEW__','__SANA_DATAROOM_REVIEW_CASE__','__SANA_DATAROOM_REVIEW_HANDOFF__','__SANA_DATAROOM_REVIEW_FEEDBACK__','__SANA_DATAROOM_REVIEW_RESPONSE__','__SANA_DATAROOM_REVIEW_DISPOSITION__','__SANA_DATAROOM_REVIEW_ROUND__'];
    const rows=[];
    for(const name of names){const api=host?.[name];if(!api)continue;let r=null;if(typeof api.events==='function')r=safeCall(api.events.bind(api));else if(typeof api.cases==='function')r=safeCall(api.cases.bind(api));if(!r?.ok)continue;for(const item of asArray(r.value)){if(scope?.lot&&lotOf(item)&&lotOf(item)!==scope.lot)continue;if(Array.isArray(item?.events)){for(const e of item.events){if(scope?.lot&&lotOf(e)&&lotOf(e)!==scope.lot)continue;rows.push({source:name,id:e.id||item.id||'',kind:e.kind||'CASE_EVENT',lot:lotOf(e)||lotOf(item),observedAt:timeOf(e),referenceOnly:true})}}else rows.push({source:name,id:item.id||'',kind:item.kind||'CASE',lot:lotOf(item),observedAt:timeOf(item),referenceOnly:true})}}
    rows.sort((a,b)=>String(a.observedAt).localeCompare(String(b.observedAt))||String(a.id).localeCompare(String(b.id)));
    return freeze(rows);
  }
  function lots(host){
    const out=new Set();
    for(const l of asArray(host?.DEMO?.lots))if(l?.id)out.add(String(l.id));
    for(const name of ['__SANA_CAPITAL_REVIEW__','__SANA_DATAROOM_REVIEW_ROUND__','__SANA_DATAROOM_REVIEW_CASE__']){const api=host?.[name];if(!api?.cases)continue;const r=safeCall(api.cases.bind(api));if(!r.ok)continue;for(const c of asArray(r.value)){const lot=lotOf(c);if(lot)out.add(lot)}}
    return Object.freeze([...out].sort());
  }
  function compose(host,options={}){
    const scope=freeze({lot:options.lot?String(options.lot):null,scopeType:options.lot?'LOT':'SNAPSHOT_OR_AVAILABLE_SCOPE'});
    const sections=CANONICAL_ORDER.map(id=>section(host,id,scope));
    const timeline=reviewTimeline(host,scope);
    const snapshot=safeCall(()=>host?.__SANA_DATAROOM_360__?.state?.()).value||null;
    const latest=snapshot?.latest||null;
    const counts=STATES.reduce((acc,s)=>(acc[s]=sections.filter(x=>x.status===s).length,acc),{});
    return freeze({
      schema:SCHEMA,version:VERSION,scope,canonicalOrder:CANONICAL_ORDER,sections,timeline,
      counts,latestSnapshot:latest?{id:latest.id||'',cutoff:latest.cutoff||latest.createdAt||'',schema:latest.manifest?.schema||''}:null,
      authority:AUTHORITY,
      provenance:{sourceBranch:'demo/sana-capital-review-v163',sourceCommit:BASE_SHA,materializedSemanticHead:'V162',conversationContinuity:'V169_NOT_GIT_MATERIALIZED',gitContinuityGap:Object.freeze(['V164','V165','V166','V167','V168','V169']),policy:'DO_NOT_RECONSTRUCT_MISSING_HISTORY'},
      integrity:INTEGRITY
    });
  }
  function forLens(host,lens='EXECUTIVE',options={}){
    const name=String(lens||'EXECUTIVE').toUpperCase();const order=LENSES[name]||LENSES.EXECUTIVE;const dossier=compose(host,options);const map=new Map(dossier.sections.map(s=>[s.id,s]));
    return freeze({...dossier,lens:name,lensOrder:order,sections:order.map(id=>map.get(id)).filter(Boolean),authority:AUTHORITY,integrity:`${dossier.integrity} · SAME_FACT_SET_ACROSS_LENSES`});
  }
  function create(host){
    const target=host||globalThis;
    return freeze({schema:SCHEMA,version:VERSION,states:STATES,canonicalOrder:CANONICAL_ORDER,lenses:Object.keys(LENSES),authority:AUTHORITY,compose:options=>compose(target,options),forLens:(lens,options)=>forLens(target,lens,options),lots:()=>lots(target),integrity:INTEGRITY,provenance:Object.freeze({sourceCommit:BASE_SHA,sourceBranch:'demo/sana-capital-review-v163'})});
  }

  const factory=freeze({schema:SCHEMA,version:VERSION,create,integrity:INTEGRITY});
  if(typeof window!=='undefined'){
    window.__SANA_DATAROOM_EXECUTIVE_V170_FACTORY__=factory;
    window.__SANA_DATAROOM_EXECUTIVE_V170__=create(window);
  }
  if(typeof globalThis!=='undefined')globalThis.__SANA_DATAROOM_EXECUTIVE_V170_FACTORY__=factory;
})();
