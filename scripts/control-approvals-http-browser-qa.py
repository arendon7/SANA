#!/usr/bin/env python3
from pathlib import Path
import json, os, re, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];ev=root/'docs/product/evidence/human-approvals';ev.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=root,env={**os.environ,'PORT':'4273'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
for _ in range(60):
    try:
        with urllib.request.urlopen('http://127.0.0.1:4273/control/approvals',timeout=.5) as r:
            if r.status==200:break
    except Exception:time.sleep(.1)
else:raise SystemExit('SERVER_NOT_READY')
res=[]
def ck(n,v,d=''):res.append({'name':n,'pass':bool(v),'detail':str(d)})
try:
  with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for label,w,h in [('desktop',1440,900),('mobile',390,844)]:
      page=b.new_page(viewport={'width':w,'height':h},locale='es-CO');page.set_default_timeout(6000);errs=[];pageerrs=[]
      page.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);page.on('pageerror',lambda e:pageerrs.append(str(e)))
      response=page.goto('http://127.0.0.1:4273/control/approvals',wait_until='networkidle');ck(f'{label}:http-200',response and response.status==200,response.status if response else None);ck(f'{label}:nosniff',response.headers.get('x-content-type-options')=='nosniff');ck(f'{label}:frame-deny',response.headers.get('x-frame-options')=='DENY');ck(f'{label}:secure-context',page.evaluate('window.isSecureContext'))
      ck(f'{label}:four-proposals',page.locator('.proposal-card').count()==4,page.locator('.proposal-card').count());ck(f'{label}:high-critical-count',page.locator('#criticalCount').inner_text()=='3');ck(f'{label}:approved-zero',page.locator('#approvedCount').inner_text()=='0')
      page.locator('[data-id="ap-impact-yar"]').click();ck(f'{label}:blocked-impact',page.locator('#approveBtn').is_disabled());ck(f'{label}:blocked-precheck','Deterministic precheck: FAIL' in page.locator('.approval-detail').inner_text())
      page.locator('[data-id="ap-invest-yar"]').click();page.locator('#approver').select_option('fin-sb-001');page.locator('#approvalNote').fill('Intento de autoaprobación controlado.');page.locator('#approveBtn').click();page.wait_for_timeout(100);ck(f'{label}:separation-of-duties','HIGH_RISK_SEPARATION_OF_DUTIES_REQUIRED' in page.locator('#toast').inner_text());ck(f'{label}:self-approval-not-recorded',page.locator('.signature').count()==0 and 'PENDING HUMAN REVIEW' in page.locator('.approval-detail').inner_text())
      page.locator('[data-id="ap-agro-431"]').click();ck(f'{label}:ai-draft-origin','DRAFT_SUGGESTION' in page.locator('.approval-detail').inner_text());page.locator('#approver').select_option('actor-director-001');page.locator('#approvalNote').fill('Primera firma humana: evidencia y precheck revisados.');page.locator('#approveBtn').click();page.wait_for_timeout(100);ck(f'{label}:awaiting-second','AWAITING SECOND HUMAN APPROVAL' in page.locator('.approval-detail').inner_text())
      store=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.approvals.v1')||'[]')");ag=next(x for x in store if x['id']=='ap-agro-431');ck(f'{label}:first-human-signature',len(ag['approvalRecords'])==1 and ag['approvalRecords'][0]['approverActorType']=='HUMAN');ck(f'{label}:first-sha256',bool(re.fullmatch(r'[a-f0-9]{64}',ag['approvalRecords'][0]['approvalDigestSha256'])));ck(f'{label}:genesis',ag['approvalRecords'][0]['previousApprovalDigestSha256'] is None);ck(f'{label}:not-executed-after-first',ag['executionState']=='NOT_EXECUTED')
      page.locator('#approver').select_option('agro-jp-001');page.locator('#approvalNote').fill('Segunda firma humana independiente: riesgo crítico revisado.');page.locator('#approveBtn').click();page.wait_for_timeout(100);ck(f'{label}:approved-for-submission','APPROVED FOR SUBMISSION' in page.locator('.approval-detail').inner_text());store=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.approvals.v1')||'[]')");ag=next(x for x in store if x['id']=='ap-agro-431');ck(f'{label}:two-distinct-humans',len(ag['approvalRecords'])==2 and len({x['approverActorId'] for x in ag['approvalRecords']})==2 and all(x['approverActorType']=='HUMAN' for x in ag['approvalRecords']));ck(f'{label}:approval-chain',ag['approvalRecords'][1]['previousApprovalDigestSha256']==ag['approvalRecords'][0]['approvalDigestSha256']);ck(f'{label}:never-executed',ag['executionState']=='NOT_EXECUTED');ck(f'{label}:local-boundary',ag['canonicalMutated'] is False and ag['localOnly'] is True);ck(f'{label}:approved-count',page.locator('#approvedCount').inner_text()=='1')
      sw=page.evaluate("async()=>{if(!('serviceWorker'in navigator))return {ok:false};const r=await navigator.serviceWorker.ready;return {ok:!!r.active,url:r.active?.scriptURL||''}}") ;ck(f'{label}:service-worker',sw.get('ok') and sw.get('url','').endswith('/service-worker.js'),sw)
      page.screenshot(path=str(ev/f'human-approval-http-{w}x{h}.png'),full_page=True)
      evr=page.goto('http://127.0.0.1:4273/control/evidence',wait_until='networkidle');ck(f'{label}:evidence-route-regression',evr and evr.status==200);ck(f'{label}:evidence-six',page.locator('.evidence-row').count()==6,page.locator('.evidence-row').count());ex=page.goto('http://127.0.0.1:4273/control/exceptions',wait_until='networkidle');ck(f'{label}:exceptions-route-regression',ex and ex.status==200);ck(f'{label}:exceptions-five',page.locator('.ex-card').count()==5,page.locator('.ex-card').count())
      page.goto('http://127.0.0.1:4273/control/approvals',wait_until='networkidle');ck(f'{label}:no-overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
      if label=='mobile':
        box=page.locator('.filter').first.bounding_box();ck('mobile:touch-target',box and box['height']>=44,box)
      ck(f'{label}:no-console-errors',not errs,';'.join(errs));ck(f'{label}:no-page-errors',not pageerrs,';'.join(pageerrs));page.close()
    b.close()
finally:
  server.terminate()
  try:server.wait(timeout=2)
  except:server.kill()
failed=[x for x in res if not x['pass']];report={'status':'PASS' if not failed else 'FAIL','checks':len(res),'failed':failed,'results':res,'transport':'HTTP_REAL','trust':'DEMO_RECONSTRUCTED','approvalAuthority':'HUMAN_ONLY','executionState':'NOT_EXECUTED','canonicalMutation':False,'aiAuthority':'ADVISORY_ONLY','d10':'PENDING'}
(ev/'browser-http-qa.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(json.dumps(report,indent=2,ensure_ascii=False));raise SystemExit(1 if failed else 0)
