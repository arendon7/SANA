(() => {
  'use strict';

  const VERSION='V171';
  const SCHEMA='SANA_DATAROOM_EXECUTIVE_SOURCE_COVERAGE_V1';
  const PARENT='V170';
  const PARENT_SHA='755ac2500cdb1038eda526f29f277de708875632';
  const SECTION_ORDER=Object.freeze(['IDENTITY_SCOPE','PLAN_EXECUTION','CROP_HEALTH_NUTRITION','PRODUCTION_HARVEST','COMMERCIAL_ECONOMIC','TRACEABILITY_DATA_TRUST','CIRCULARITY_IMPACT','CAPITAL_READINESS','EXCEPTIONS_GAPS','DECISION_TIMELINE']);
  const TITLES=Object.freeze({IDENTITY_SCOPE:'Identidad y alcance',PLAN_EXECUTION:'Plan y ejecución',CROP_HEALTH_NUTRITION:'Sanidad, nutrición y fenología',PRODUCTION_HARVEST:'Producción, cosecha y recursos',COMMERCIAL_ECONOMIC:'Comercial y economía',TRACEABILITY_DATA_TRUST:'Trazabilidad y Data Trust',CIRCULARITY_IMPACT:'Circularidad, material e impacto',CAPITAL_READINESS:'Capital y readiness documental',EXCEPTIONS_GAPS:'Brechas e integridad',DECISION_TIMELINE:'Circuito humano de revisión'});
  const LENSES=Object.freeze({EXECUTIVE:Object.freeze(['CAPITAL_READINESS','EXCEPTIONS_GAPS','COMMERCIAL_ECONOMIC','PRODUCTION_HARVEST','CIRCULARITY_IMPACT','TRACEABILITY_DATA_TRUST','CROP_HEALTH_NUTRITION','PLAN_EXECUTION','IDENTITY_SCOPE','DECISION_TIMELINE']),PRODUCER:Object.freeze(['PLAN_EXECUTION','CROP_HEALTH_NUTRITION','PRODUCTION_HARVEST','TRACEABILITY_DATA_TRUST','COMMERCIAL_ECONOMIC','CIRCULARITY_IMPACT','IDENTITY_SCOPE','EXCEPTIONS_GAPS','CAPITAL_READINESS','DECISION_TIMELINE']),AGRONOMIST:Object.freeze(['CROP_HEALTH_NUTRITION','PLAN_EXECUTION','TRACEABILITY_DATA_TRUST','PRODUCTION_HARVEST','CIRCULARITY_IMPACT','EXCEPTIONS_GAPS','COMMERCIAL_ECONOMIC','IDENTITY_SCOPE','CAPITAL_READINESS','DECISION_TIMELINE']),CAPITAL_REVIEWER:Object.freeze(['IDENTITY_SCOPE','CAPITAL_READINESS','EXCEPTIONS_GAPS','TRACEABILITY_DATA_TRUST','COMMERCIAL_ECONOMIC','CIRCULARITY_IMPACT','DECISION_TIMELINE','PRODUCTION_HARVEST','PLAN_EXECUTION','CROP_HEALTH_NUTRITION']),AUDITOR:SECTION_ORDER});
  const AUTHORITY=Object.freeze({canonicalMutationAvailable:false,financialMutationAvailable:false,lensChangesAuthority:false,aiAuthority:'ADVISORY_ONLY',offerAuthority:false,solicitationAuthority:false,brokerageAuthority:false,custodyAuthority:false,disbursementAuthority:false});
  const SCOPE_QUALITY=Object.freeze(['LOT_EXACT','SNAPSHOT_GLOBAL','GLOBAL','REFERENCE_CASE','UNAVAILABLE']);
  const SOURCE_STATES=Object.freeze(['AVAILABLE','PARTIAL','UNAVAILABLE','ADAPTER_MISMATCH','READ_ERROR']);
  const INTEGRITY='TYPED_SOURCE_REGISTRY · SOURCE_AVAILABILITY ≠ DATA_QUALITY ≠ RISK ≠ READINESS ≠ SCORE · LOT_LENS ≠ LOT_EXACT_UNLESS_ADAPTER_SUPPORTS_IT · SNAPSHOT_GLOBAL ≠ LOT_EXACT · REFERENCE_CASE ≠ VERIFIED_FACT · API_PRESENT_WITHOUT_EXPECTED_ACCESSOR = PARTIAL · ROLE_LENS ≠ ACCESS_CONTROL · NO_WEIGHTING · NO_SCORE · NO_MUTATION · NO_FINANCIAL_AUTHORITY';

  const R=Object.freeze([
    ['DATAROOM_360','IDENTITY_SCOPE','__SANA_DATAROOM_360__','apps/control-web/public/sana-v3-dataroom-360.js','dataroom','STATE','SNAPSHOT_GLOBAL',true],
    ['DUE_DILIGENCE_SNAPSHOT','IDENTITY_SCOPE','__SANA_DUE_DILIGENCE_SNAPSHOT__','apps/control-web/public/sana-v3-report-snapshot-sync.js','reports','SNAPSHOTS','SNAPSHOT_GLOBAL',true],
    ['CAPITAL_REVIEW_IDENTITY','IDENTITY_SCOPE','__SANA_CAPITAL_REVIEW__','apps/control-web/public/sana-v3-capital-review-ledger.js','capital','FOR_LOT_CASES','LOT_EXACT',true],

    ['DATAROOM_360_PLAN','PLAN_EXECUTION','__SANA_DATAROOM_360__','apps/control-web/public/sana-v3-dataroom-360.js','dataroom','STATE','SNAPSHOT_GLOBAL',true],
    ['PHENOLOGY_HISTORY_PLAN','PLAN_EXECUTION','__SANA_DATAROOM_PHENOLOGY_HISTORY__','apps/control-web/public/sana-v3-dataroom-phenology-history.js','phenology','STATE','SNAPSHOT_GLOBAL',true],
    ['LABOR_HISTORY_PLAN','PLAN_EXECUTION','__SANA_DATAROOM_LABOR_HISTORY__','apps/control-web/public/sana-v3-dataroom-labor-history.js','team','STATE','SNAPSHOT_GLOBAL',true],

    ['HEALTH_HISTORY','CROP_HEALTH_NUTRITION','__SANA_DATAROOM_HEALTH_HISTORY__','apps/control-web/public/sana-v3-dataroom-health-history.js','health','STATE','SNAPSHOT_GLOBAL',true],
    ['HEALTH_LIFECYCLE','CROP_HEALTH_NUTRITION','__SANA_DATAROOM_HEALTH_LIFECYCLE__','apps/control-web/public/sana-v3-dataroom-health-lifecycle.js','health','STATE','SNAPSHOT_GLOBAL',true],
    ['NUTRITION_HISTORY','CROP_HEALTH_NUTRITION','__SANA_DATAROOM_NUTRITION_HISTORY__','apps/control-web/public/sana-v3-dataroom-nutrition-history.js','nutrition','STATE','SNAPSHOT_GLOBAL',true],
    ['NUTRITION_V2_HISTORY_EXPECTED','CROP_HEALTH_NUTRITION','__SANA_DATAROOM_NUTRITION_V2_HISTORY__',null,'nutrition','NONE','UNAVAILABLE',false],
    ['PHENOLOGY_HISTORY','CROP_HEALTH_NUTRITION','__SANA_DATAROOM_PHENOLOGY_HISTORY__','apps/control-web/public/sana-v3-dataroom-phenology-history.js','phenology','STATE','SNAPSHOT_GLOBAL',true],

    ['FORECAST_HISTORY','PRODUCTION_HARVEST','__SANA_DATAROOM_FORECAST_HISTORY__','apps/control-web/public/sana-v3-dataroom-forecast-history.js','forecast','STATE','SNAPSHOT_GLOBAL',true],
    ['HARVEST_HISTORY','PRODUCTION_HARVEST','__SANA_DATAROOM_HARVEST_HISTORY__','apps/control-web/public/sana-v3-dataroom-harvest-history.js','results','STATE','SNAPSHOT_GLOBAL',true],
    ['INVENTORY_HISTORY','PRODUCTION_HARVEST','__SANA_DATAROOM_INVENTORY_HISTORY__','apps/control-web/public/sana-v3-dataroom-inventory-history.js','inventory','STATE','SNAPSHOT_GLOBAL',true],
    ['LABOR_HISTORY','PRODUCTION_HARVEST','__SANA_DATAROOM_LABOR_HISTORY__','apps/control-web/public/sana-v3-dataroom-labor-history.js','team','STATE','SNAPSHOT_GLOBAL',true],

    ['ECONOMIC_RECONCILIATION_HISTORY','COMMERCIAL_ECONOMIC','__SANA_DATAROOM_ECONOMIC_RECONCILIATION_HISTORY__','apps/control-web/public/sana-v3-dataroom-economic-reconciliation-history.js','economics','STATE','SNAPSHOT_GLOBAL',true],
    ['COMMERCIAL_HISTORY','COMMERCIAL_ECONOMIC','__SANA_DATAROOM_COMMERCIAL_HISTORY__','apps/control-web/public/sana-v3-dataroom-commercial-history.js','economics','STATE','SNAPSHOT_GLOBAL',true],
    ['HARVEST_HISTORY_COMMERCIAL','COMMERCIAL_ECONOMIC','__SANA_DATAROOM_HARVEST_HISTORY__','apps/control-web/public/sana-v3-dataroom-harvest-history.js','results','STATE','SNAPSHOT_GLOBAL',true],

    ['DATA_TRUST_HISTORY','TRACEABILITY_DATA_TRUST','__SANA_DATAROOM_DATA_TRUST_HISTORY__','apps/control-web/public/sana-v3-dataroom-data-trust-history.js','passport','STATE','SNAPSHOT_GLOBAL',true],
    ['CAPTURE_SYNC_HISTORY','TRACEABILITY_DATA_TRUST','__SANA_DATAROOM_CAPTURE_SYNC_HISTORY__','apps/control-web/public/sana-v3-dataroom-capture-sync-history.js','iot','STATE','SNAPSHOT_GLOBAL',true],
    ['SOURCE_EVIDENCE_HISTORY','TRACEABILITY_DATA_TRUST','__SANA_DATAROOM_SOURCE_EVIDENCE_HISTORY__','apps/control-web/public/sana-v3-dataroom-source-evidence-history.js','sources','STATE','SNAPSHOT_GLOBAL',true],

    ['CIRCULARITY_HISTORY','CIRCULARITY_IMPACT','__SANA_DATAROOM_CIRCULARITY_HISTORY__','apps/control-web/public/sana-v3-dataroom-circularity-history.js','circularity','STATE','SNAPSHOT_GLOBAL',true],
    ['MATERIAL_HISTORY','CIRCULARITY_IMPACT','__SANA_DATAROOM_MATERIAL_HISTORY__','apps/control-web/public/sana-v3-dataroom-material-history.js','material','STATE','SNAPSHOT_GLOBAL',true],
    ['IMPACT_HISTORY','CIRCULARITY_IMPACT','__SANA_DATAROOM_IMPACT_HISTORY__','apps/control-web/public/sana-v3-dataroom-impact-history.js','impact','STATE','SNAPSHOT_GLOBAL',true],

    ['CAPITAL_GOVERNANCE_HISTORY','CAPITAL_READINESS','__SANA_DATAROOM_CAPITAL_GOVERNANCE_HISTORY__','apps/control-web/public/sana-v3-dataroom-capital-governance-history.js','capital','STATE','SNAPSHOT_GLOBAL',true],
    ['CAPITAL_REVIEW_HISTORY','CAPITAL_READINESS','__SANA_DATAROOM_CAPITAL_REVIEW_HISTORY__','apps/control-web/public/sana-v3-dataroom-capital-review-history.js','capital','STATE','SNAPSHOT_GLOBAL',true],
    ['CAPITAL_GOVERNANCE','CAPITAL_READINESS','__SANA_CAPITAL_GOVERNANCE__','apps/control-web/public/sana-v3-capital-governance.js','capital','FOR_LOT_CASES','LOT_EXACT',true],
    ['CAPITAL_REVIEW','CAPITAL_READINESS','__SANA_CAPITAL_REVIEW__','apps/control-web/public/sana-v3-capital-review-ledger.js','capital','FOR_LOT_CASES','LOT_EXACT',true],
    ['REVIEW_GOVERNANCE','CAPITAL_READINESS','__SANA_DATAROOM_REVIEW_GOVERNANCE__','apps/control-web/public/sana-v3-dataroom-review-governance.js','dataroom','CASES_EVENTS','REFERENCE_CASE',true],

    ['DUE_DILIGENCE_GAPS','EXCEPTIONS_GAPS','__SANA_DUE_DILIGENCE_GAPS__','apps/control-web/public/sana-v3-due-diligence-gaps.js','reports','CURRENT','SNAPSHOT_GLOBAL',true],
    ['DATAROOM_FINDINGS','EXCEPTIONS_GAPS','__SANA_DATAROOM_FINDINGS__','apps/control-web/public/sana-v3-dataroom-findings-ledger.js','dataroom','FOR_LOT_CASES','LOT_EXACT',true],
    ['FINDINGS_HISTORY','EXCEPTIONS_GAPS','__SANA_DATAROOM_FINDINGS_HISTORY__','apps/control-web/public/sana-v3-dataroom-findings-history.js','dataroom','STATE','SNAPSHOT_GLOBAL',true],
    ['DATAROOM_360_GAPS','EXCEPTIONS_GAPS','__SANA_DATAROOM_360__','apps/control-web/public/sana-v3-dataroom-360.js','dataroom','STATE','SNAPSHOT_GLOBAL',true],

    ['CAPITAL_REVIEW_TIMELINE','DECISION_TIMELINE','__SANA_CAPITAL_REVIEW__','apps/control-web/public/sana-v3-capital-review-ledger.js','capital','FOR_LOT_CASES','LOT_EXACT',true],
    ['REVIEW_CASE','DECISION_TIMELINE','__SANA_DATAROOM_REVIEW_CASE__','apps/control-web/public/sana-v3-dataroom-review-case.js','dataroom','CASES_EVENTS','REFERENCE_CASE',true],
    ['REVIEW_HANDOFF','DECISION_TIMELINE','__SANA_DATAROOM_REVIEW_HANDOFF__','apps/control-web/public/sana-v3-dataroom-review-handoff.js','dataroom','CASES_EVENTS','REFERENCE_CASE',true],
    ['REVIEW_FEEDBACK','DECISION_TIMELINE','__SANA_DATAROOM_REVIEW_FEEDBACK__','apps/control-web/public/sana-v3-dataroom-review-feedback.js','dataroom','CASES_EVENTS','REFERENCE_CASE',true],
    ['REVIEW_RESPONSE','DECISION_TIMELINE','__SANA_DATAROOM_REVIEW_RESPONSE__','apps/control-web/public/sana-v3-dataroom-review-response.js','dataroom','CASES_EVENTS','REFERENCE_CASE',true],
    ['REVIEW_DISPOSITION','DECISION_TIMELINE','__SANA_DATAROOM_REVIEW_DISPOSITION__','apps/control-web/public/sana-v3-dataroom-review-disposition.js','dataroom','CASES_EVENTS','REFERENCE_CASE',true],
    ['REVIEW_ROUND','DECISION_TIMELINE','__SANA_DATAROOM_REVIEW_ROUND__','apps/control-web/public/sana-v3-dataroom-review-round.js','dataroom','CASES_EVENTS','REFERENCE_CASE',true]
  ].map(([id,section,globalName,file,view,strategy,scopeCapability,materialized])=>Object.freeze({id,section,globalName,file,view,strategy,scopeCapability,materialized})));

  function deepFreeze(v,seen=new WeakSet()){if(!v||typeof v!=='object'||seen.has(v))return v;seen.add(v);for(const k of Object.getOwnPropertyNames(v))deepFreeze(v[k],seen);return Object.freeze(v)}
  function clone(v){if(v===undefined)return undefined;try{return structuredClone(v)}catch{try{return JSON.parse(JSON.stringify(v))}catch{return v}}}
  function safe(fn){try{return {ok:true,value:fn()}}catch(e){return {ok:false,error:String(e?.message||e)}}}
  function arr(v){return Array.isArray(v)?v:[]}
  function lotOf(v){return String(v?.lot||v?.lotId||v?.plot||v?.plotId||v?.scope?.lot||'')}
  function timeOf(v){return String(v?.cutoff||v?.createdAt||v?.capturedAt||v?.observedAt||v?.reviewedAt||'')||null}
  function stateFrom(v){const s=String(v?.state||'').toUpperCase();if(v?.valid===false)return s.includes('SCHEMA')?'ADAPTER_MISMATCH':'UNAVAILABLE';if(s.includes('NOT_CAPTURED')||s.includes('PARTIAL')||s.includes('INDETERMINATE'))return 'PARTIAL';return 'AVAILABLE'}
  function summary(v){if(v===null||v===undefined)return {kind:'EMPTY',count:0};if(Array.isArray(v))return {kind:'ARRAY',count:v.length};if(typeof v!=='object')return {kind:typeof v.toUpperCase(),count:1};const keys=Object.keys(v);return {kind:'OBJECT',count:keys.length,keys:keys.slice(0,14)}}
  function filteredCases(cases,lot){return !lot?cases:cases.filter(c=>lotOf(c)===lot)}

  function readSource(host,def,lot){
    const base={id:def.id,section:def.section,globalName:def.globalName,file:def.file,view:def.view,strategy:def.strategy,scopeCapability:def.scopeCapability,materialized:def.materialized,authority:AUTHORITY};
    if(!def.materialized)return deepFreeze({...base,status:'UNAVAILABLE',scopeQuality:'UNAVAILABLE',scopeMatch:'NOT_MATERIALIZED',asOf:null,records:[],payloadSummary:{kind:'MISSING',count:0},limitations:['REGISTRY_DECLARED_SOURCE_NOT_MATERIALIZED'],integrity:null});
    const api=host?.[def.globalName];
    if(!api)return deepFreeze({...base,status:'UNAVAILABLE',scopeQuality:'UNAVAILABLE',scopeMatch:'API_MISSING',asOf:null,records:[],payloadSummary:{kind:'MISSING',count:0},limitations:['MATERIALIZED_MODULE_API_NOT_AVAILABLE'],integrity:null});
    let r={ok:false,error:'UNREAD'},value=null,records=[],scopeQuality=def.scopeCapability,scopeMatch=lot?'NOT_EVALUATED':'GLOBAL_READING',limitations=[];
    if(def.strategy==='STATE')r=safe(()=>api.state());
    else if(def.strategy==='SNAPSHOTS')r=safe(()=>api.snapshots());
    else if(def.strategy==='CURRENT')r=safe(()=>api.current());
    else if(def.strategy==='FOR_LOT_CASES'){
      if(lot){if(typeof api.forLot!=='function')return deepFreeze({...base,status:'PARTIAL',scopeQuality:'REFERENCE_CASE',scopeMatch:'EXPECTED_FOR_LOT_MISSING',asOf:null,records:[],payloadSummary:{kind:'MISSING_ACCESSOR',count:0},limitations:['EXPECTED_ACCESSOR_MISSING:forLot'],integrity:String(api.integrity||'')});r=safe(()=>api.forLot(lot));scopeQuality='LOT_EXACT';scopeMatch='OFFICIAL_FOR_LOT';}
      else {if(typeof api.cases!=='function')return deepFreeze({...base,status:'PARTIAL',scopeQuality:'REFERENCE_CASE',scopeMatch:'EXPECTED_CASES_MISSING',asOf:null,records:[],payloadSummary:{kind:'MISSING_ACCESSOR',count:0},limitations:['EXPECTED_ACCESSOR_MISSING:cases'],integrity:String(api.integrity||'')});r=safe(()=>api.cases());scopeQuality='GLOBAL';scopeMatch='ALL_CASES';}
    } else if(def.strategy==='CASES_EVENTS'){
      if(typeof api.cases!=='function')return deepFreeze({...base,status:'PARTIAL',scopeQuality:'REFERENCE_CASE',scopeMatch:'EXPECTED_CASES_MISSING',asOf:null,records:[],payloadSummary:{kind:'MISSING_ACCESSOR',count:0},limitations:['EXPECTED_ACCESSOR_MISSING:cases'],integrity:String(api.integrity||'')});
      r=safe(()=>api.cases());scopeQuality='REFERENCE_CASE';scopeMatch=lot?'FILTERED_BY_DECLARED_CASE_LOT':'ALL_REFERENCE_CASES';
    } else return deepFreeze({...base,status:'PARTIAL',scopeQuality:'UNAVAILABLE',scopeMatch:'NO_READ_STRATEGY',asOf:null,records:[],payloadSummary:{kind:'NO_STRATEGY',count:0},limitations:['API_PRESENT_WITHOUT_EXPECTED_ACCESSOR'],integrity:String(api.integrity||'')});
    if(!r.ok)return deepFreeze({...base,status:'READ_ERROR',scopeQuality,scopeMatch,asOf:null,records:[],payloadSummary:{kind:'ERROR',count:0},limitations:['SOURCE_READ_FAILED',r.error],integrity:String(api.integrity||'')});
    value=r.value;
    if(def.strategy==='FOR_LOT_CASES')records=arr(value);
    if(def.strategy==='CASES_EVENTS'){records=filteredCases(arr(value),lot);value=records;}
    if(def.strategy==='SNAPSHOTS'){const list=arr(value).slice().sort((a,b)=>String(b.cutoff||b.createdAt||'').localeCompare(String(a.cutoff||a.createdAt||'')));value={count:list.length,latest:list[0]||null};}
    const status=def.strategy==='STATE'||def.strategy==='CURRENT'?stateFrom(value):(def.strategy==='SNAPSHOTS'&&Number(value?.count||0)===0?'UNAVAILABLE':'AVAILABLE');
    if(lot&&scopeQuality==='SNAPSHOT_GLOBAL'){scopeMatch='SNAPSHOT_GLOBAL_NOT_LOT_EXACT';limitations.push('LOT_LENS_DOES_NOT_CHANGE_SNAPSHOT_SCOPE');}
    if(lot&&scopeQuality==='REFERENCE_CASE'&&records.length===0)limitations.push('NO_DECLARED_CASE_FOR_SELECTED_LOT');
    if(lot&&scopeQuality==='LOT_EXACT'&&records.length===0)limitations.push('NO_OFFICIAL_FOR_LOT_RECORD');
    const snap=value?.snapshot||value?.latest||null;
    return deepFreeze({...base,status,scopeQuality,scopeMatch,asOf:timeOf(snap)||timeOf(value),records:clone(records),payloadSummary:summary(value),limitations,integrity:String(value?.integrity||api.integrity||'')});
  }

  function sectionStatus(sources){if(!sources.length||sources.every(s=>s.status==='UNAVAILABLE'))return 'UNAVAILABLE';if(sources.some(s=>s.status==='ADAPTER_MISMATCH'||s.status==='READ_ERROR'))return 'PARTIAL';if(sources.some(s=>s.status==='PARTIAL'||s.status==='UNAVAILABLE'))return 'PARTIAL';return 'AVAILABLE'}
  function scopeCounts(sources){const out={LOT_EXACT:0,SNAPSHOT_GLOBAL:0,GLOBAL:0,REFERENCE_CASE:0,UNAVAILABLE:0};for(const s of sources)out[s.scopeQuality]=(out[s.scopeQuality]||0)+1;return Object.freeze(out)}
  function section(host,id,lot){const sources=R.filter(x=>x.section===id).map(x=>readSource(host,x,lot));return deepFreeze({id,title:TITLES[id],status:sectionStatus(sources),scopeCoverage:scopeCounts(sources),sources,limitations:[...new Set(sources.flatMap(s=>s.limitations))],authority:AUTHORITY,integrity:'SECTION_COVERAGE_COUNTS_ONLY · COVERAGE ≠ SCORE'});}
  function timeline(sections){const source=sections.find(s=>s.id==='DECISION_TIMELINE');const rows=[];for(const s of source?.sources||[])for(const c of s.records||[]){if(Array.isArray(c?.events))for(const e of c.events)rows.push({source:s.id,caseId:c.id||'',id:e.id||'',lot:lotOf(e)||lotOf(c),kind:e.kind||'EVENT',observedAt:timeOf(e),scopeQuality:s.scopeQuality,referenceOnly:true});else rows.push({source:s.id,caseId:c.id||'',id:c.id||'',lot:lotOf(c),kind:c.kind||'CASE',observedAt:timeOf(c),scopeQuality:s.scopeQuality,referenceOnly:true});}return deepFreeze(rows.sort((a,b)=>String(a.observedAt||'').localeCompare(String(b.observedAt||''))||String(a.id).localeCompare(String(b.id))));}
  function totals(sections){const sources=sections.flatMap(s=>s.sources);const statuses={AVAILABLE:0,PARTIAL:0,UNAVAILABLE:0,ADAPTER_MISMATCH:0,READ_ERROR:0};const scopes={LOT_EXACT:0,SNAPSHOT_GLOBAL:0,GLOBAL:0,REFERENCE_CASE:0,UNAVAILABLE:0};for(const s of sources){statuses[s.status]=(statuses[s.status]||0)+1;scopes[s.scopeQuality]=(scopes[s.scopeQuality]||0)+1;}return deepFreeze({sourceCount:sources.length,statuses,scopes,sectionAvailable:sections.filter(s=>s.status==='AVAILABLE').length,sectionPartial:sections.filter(s=>s.status==='PARTIAL').length,sectionUnavailable:sections.filter(s=>s.status==='UNAVAILABLE').length,semantics:'COUNTS_ONLY · NOT_WEIGHTED · NOT_SCORE'});}
  function lots(host){const out=new Set();for(const l of arr(host?.DEMO?.lots))if(l?.id)out.add(String(l.id));for(const name of ['__SANA_CAPITAL_REVIEW__','__SANA_CAPITAL_GOVERNANCE__','__SANA_DATAROOM_FINDINGS__']){const api=host?.[name];if(typeof api?.cases!=='function')continue;const r=safe(()=>api.cases());if(r.ok)for(const c of arr(r.value)){const lot=lotOf(c);if(lot)out.add(lot)}}return Object.freeze([...out].sort())}
  function compose(host,options={}){const lot=options.lot?String(options.lot):null;const sections=SECTION_ORDER.map(id=>section(host,id,lot));return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,parentSha:PARENT_SHA,scope:{lot,mode:lot?'LOT_LENS':'GLOBAL_OR_SNAPSHOT'},sections,timeline:timeline(sections),coverage:totals(sections),registry:R,authority:AUTHORITY,provenance:{parent:PARENT,parentSha:PARENT_SHA,sourceBase:'00e6a04693dad2e19cfd53a7c61ff3fc8c1b0136',materializedSemanticHead:'V162',gitContinuityGap:['V164','V165','V166','V167','V168','V169'],nutritionV2History:'EXPECTED_NOT_MATERIALIZED'},integrity:INTEGRITY});}
  function forLens(host,lens='EXECUTIVE',options={}){const name=String(lens||'EXECUTIVE').toUpperCase();const order=LENSES[name]||LENSES.EXECUTIVE;const d=compose(host,options);const map=new Map(d.sections.map(s=>[s.id,s]));return deepFreeze({...d,lens:name,lensOrder:order,sections:order.map(id=>map.get(id)),authority:AUTHORITY,integrity:`${INTEGRITY} · SAME_FACT_SET_ACROSS_LENSES`});}
  function create(host){const target=host||globalThis;return deepFreeze({schema:SCHEMA,version:VERSION,parent:PARENT,registry:R,scopeQualities:SCOPE_QUALITY,sourceStates:SOURCE_STATES,lenses:Object.keys(LENSES),authority:AUTHORITY,compose:o=>compose(target,o),forLens:(l,o)=>forLens(target,l,o),lots:()=>lots(target),integrity:INTEGRITY});}

  const factory=deepFreeze({schema:SCHEMA,version:VERSION,create,registry:R,integrity:INTEGRITY});
  if(typeof window!=='undefined'){window.__SANA_DATAROOM_EXECUTIVE_V171_FACTORY__=factory;window.__SANA_DATAROOM_EXECUTIVE_V171__=create(window);}
  if(typeof globalThis!=='undefined')globalThis.__SANA_DATAROOM_EXECUTIVE_V171_FACTORY__=factory;
})();
