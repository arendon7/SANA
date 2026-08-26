from pathlib import Path

ledger = Path('apps/control-web/public/sana-v3-capital-review-ledger.js')
s = ledger.read_text()
loader = r'''

// V160 loader: Capital Human Review internal reference integrity only; no approval, eligibility, credit, investment or execution authority.
(() => {
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function')return;
  const VERSION='V160',SRC='/sana-v3-capital-review-references.js';
  const state={version:VERSION,status:'WAITING',attempts:0,integrity:'CAPITAL_CASE/SNAPSHOT/SUPPORT REFERENCES ONLY · SNAPSHOT_REFERENCE ≠ CONTENT_CORRECTNESS · REVIEWER_REF ≠ VERIFIED_IDENTITY · NO_APPROVAL/ELIGIBILITY/CREDIT/INVESTMENT/EXECUTION_AUTHORITY'};
  function expose(){window.__SANA_CAPITAL_REVIEW_REFERENCES_LOADER__=Object.freeze({...state})}
  function ready(){return window.__SANA_CAPITAL_REVIEW__?.schema==='SANA_CAPITAL_HUMAN_REVIEW_LEDGER_V1'&&window.__SANA_CAPITAL_GOVERNANCE__?.referenceVersion==='V150'&&window.__SANA_DUE_DILIGENCE_SNAPSHOT__?.snapshots}
  function start(){
    state.attempts++;expose();
    if(window.__SANA_CAPITAL_REVIEW__?.referenceVersion===VERSION){state.status='READY';expose();return}
    if(!ready()){if(state.attempts<50){state.status='WAITING_DEPENDENCIES';expose();setTimeout(start,50);return}state.status='BLOCKED_DEPENDENCIES';expose();return}
    if(document.querySelector?.('script[data-sana-capital-review-v160]'))return;
    state.status='LOADING';expose();const el=document.createElement('script');el.src=SRC;el.defer=true;el.dataset.sanaCapitalReviewV160='1';el.onload=()=>{state.status=window.__SANA_CAPITAL_REVIEW__?.referenceVersion===VERSION?'READY':'FAILED_CONTRACT';expose()};el.onerror=()=>{state.status='FAILED';expose()};document.head.appendChild(el);
  }
  expose();if(document.readyState==='complete')queueMicrotask(start);else window.addEventListener('load',start,{once:true});
})();
'''
if '__SANA_CAPITAL_REVIEW_REFERENCES_LOADER__' not in s:
    s += loader
ledger.write_text(s)

sw = Path('apps/control-web/public/sana-v3-sw.js')
s = sw.read_text()
if "const CACHE='sana-v3-demo-shell-v160';" not in s:
    old = "const CACHE='sana-v3-demo-shell-v159';"
    new = "if(false){\nconst CACHE='sana-v3-demo-shell-v159';\n}\nconst CACHE='sana-v3-demo-shell-v160';"
    assert s.count(old) == 1, 'expected exactly one active v159 marker'
    s = s.replace(old, new, 1)
asset = "'/sana-v3-capital-review-references.js'"
if asset not in s:
    anchor = "'/sana-v3-capital-review-ledger.js',"
    assert s.count(anchor) == 1, 'capital review ledger asset anchor missing/duplicated'
    s = s.replace(anchor, anchor + asset + ',', 1)
comment = '// v160 validates Capital Human Review capital-case, snapshot and support references without identity, approval, eligibility, credit, investment or execution authority.'
if comment not in s:
    anchor_comment = '// v159 propagates Impact Source Registry reference integrity through content-minimized Snapshot, Cycle, Due Diligence and Data Room without live fallback, weighting, verification, certification, credit or investment authority.'
    assert s.count(anchor_comment) == 1, 'v159 provenance comment missing/duplicated'
    s = s.replace(anchor_comment, anchor_comment + '\n' + comment, 1)
sw.write_text(s)
