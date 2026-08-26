import fs from 'node:fs';

const ledgerPath='apps/control-web/public/sana-v3-capital-review-ledger.js';
const swPath='apps/control-web/public/sana-v3-sw.js';
const loaderMarker='// V162 loader: Capital Human Review internal reference integrity only; no approval, eligibility, credit, investment or execution authority.';
const loader=`\n\n${loaderMarker}\n(() => {\n  'use strict';\n  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return;\n  const VERSION='V162',SRC='/sana-v3-capital-review-references.js';\n  const state={version:VERSION,status:'WAITING',attempts:0,integrity:'CAPITAL_CASE/SNAPSHOT/SUPPORT REFERENCES ONLY · SNAPSHOT_REFERENCE ≠ CONTENT_CORRECTNESS · REVIEWER_REF ≠ VERIFIED_IDENTITY · NO_APPROVAL/ELIGIBILITY/CREDIT/INVESTMENT/EXECUTION_AUTHORITY'};\n  function expose(){window.__SANA_CAPITAL_REVIEW_REFERENCES_LOADER__=Object.freeze({...state})}\n  function ready(){return window.__SANA_CAPITAL_REVIEW__?.schema==='SANA_CAPITAL_HUMAN_REVIEW_LEDGER_V1'&&window.__SANA_CAPITAL_GOVERNANCE__?.referenceVersion==='V150'&&window.__SANA_DUE_DILIGENCE_SNAPSHOT__?.snapshots}\n  function start(){\n    state.attempts++;expose();\n    if(window.__SANA_CAPITAL_REVIEW__?.referenceVersion===VERSION){state.status='READY';expose();return}\n    if(!ready()){if(state.attempts<50){state.status='WAITING_DEPENDENCIES';expose();setTimeout(start,50);return}state.status='BLOCKED_DEPENDENCIES';expose();return}\n    if(document.querySelector?.('script[data-sana-capital-review-v162]'))return;\n    state.status='LOADING';expose();const el=document.createElement('script');el.src=SRC;el.defer=true;el.dataset.sanaCapitalReviewV162='1';el.onload=()=>{state.status=window.__SANA_CAPITAL_REVIEW__?.referenceVersion===VERSION?'READY':'FAILED_CONTRACT';expose()};el.onerror=()=>{state.status='FAILED';expose()};document.head.appendChild(el);\n  }\n  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});\n})();\n`;

let ledger=fs.readFileSync(ledgerPath,'utf8');
if(!ledger.includes(loaderMarker))ledger=ledger.trimEnd()+loader;
if((ledger.match(/const VERSION='V162',SRC='\/sana-v3-capital-review-references\.js';/g)||[]).length!==1)throw new Error('V162 loader must occur exactly once');
fs.writeFileSync(ledgerPath,ledger);

let sw=fs.readFileSync(swPath,'utf8');
if(!sw.includes("const CACHE='sana-v3-demo-shell-v162';")){
  const active="const CACHE='sana-v3-demo-shell-v161';";
  if((sw.split(active).length-1)!==1)throw new Error('Expected exactly one active v161 marker');
  sw=sw.replace(active,"if(false){\nconst CACHE='sana-v3-demo-shell-v161';\n}\nconst CACHE='sana-v3-demo-shell-v162';");
}
const reviewAsset="'/sana-v3-capital-review-ledger.js',";
const refsAsset="'/sana-v3-capital-review-references.js',";
if(!sw.includes(refsAsset)){
  if((sw.split(reviewAsset).length-1)!==1)throw new Error('Capital review asset anchor missing or duplicated');
  sw=sw.replace(reviewAsset,reviewAsset+refsAsset);
}
const v162Comment='// v162 validates Capital Human Review capital-case, snapshot and support references without identity, approval, eligibility, credit, investment or execution authority.';
if(!sw.includes(v162Comment)){
  const candidates=[
    '// v161 propagates content-minimized Data Trust reference provenance through Snapshot, Cycle, Due Diligence and Data Room without live fallback, weighting, source/measurement verification, credit, eligibility or investment authority.',
    '// v161 propagates content-minimized Data Trust reference provenance through Snapshot, Cycle, Due Diligence and Data Room without live fallback, weighting, scoring, verification, credit or investment authority.'
  ];
  const anchor=candidates.find(x=>sw.includes(x));
  if(!anchor)throw new Error('V161 comment anchor missing');
  sw=sw.replace(anchor,`${anchor}\n${v162Comment}`);
}
if((sw.match(/const CACHE='sana-v3-demo-shell-v162';/g)||[]).length!==1)throw new Error('v162 active cache marker must occur once');
if(!sw.includes("if(false){\nconst CACHE='sana-v3-demo-shell-v161';\n}"))throw new Error('v161 historical marker missing');
if((sw.split('/sana-v3-capital-review-references.js').length-1)!==1)throw new Error('V162 reference asset must occur once');
fs.writeFileSync(swPath,sw);
console.log('capital review v162 assembly: ok');
