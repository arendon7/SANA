#!/usr/bin/env python3
from pathlib import Path
import json,os,re,subprocess,time,urllib.request
from playwright.sync_api import sync_playwright
from control_browser_demo_auth import authenticate_demo_admin
root=Path(__file__).resolve().parents[1];ev=root/'docs/product/evidence/submission-handoff';ev.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=root,env={**os.environ,'PORT':'4273'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
for _ in range(60):
  try:
    with urllib.request.urlopen('http://127.0.0.1:4273/control/handoff',timeout=.5) as r:
      if r.status==200:break
  except Exception:time.sleep(.1)
else:raise SystemExit('SERVER_NOT_READY')
res=[]
def ck(n,v,d=''):res.append({'name':n,'pass':bool(v),'detail':str(d)})
try:
  with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for label,w,h in [('desktop',1440,900),('mobile',390,844)]:
      page=b.new_page(viewport={'width':w,'height':h},locale='es-CO',accept_downloads=True);errs=[];pageerrs=[];page.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);page.on('pageerror',lambda e:pageerrs.append(str(e)))
      authenticate_demo_admin(page,'http://127.0.0.1:4273/control/handoff')
      r=page.goto('http://127.0.0.1:4273/control/handoff',wait_until='networkidle');ck(f'{label}:http-200',r and r.status==200);ck(f'{label}:secure',page.evaluate('window.isSecureContext'));ck(f'{label}:two-sources',page.locator('.source-card').count()==2,page.locator('.source-card').count());ck(f'{label}:one-eligible',page.locator('#eligibleCount').inner_text()=='1')
      page.locator('[data-id="ap-impact-yar"]').click();ck(f'{label}:blocked-source',page.locator('#prepareBtn').is_disabled());ck(f'{label}:blocked-message','SUBMISSION_REQUIRES_APPROVED_PROPOSAL' in page.locator('.handoff-detail').inner_text())
      page.locator('[data-id="ap-agro-431"]').click();ck(f'{label}:eligible-source',not page.locator('#prepareBtn').is_disabled());page.locator('#prepareBtn').click();page.wait_for_timeout(100);store=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.handoffs.v1')||'[]')");pkt=store[0];ck(f'{label}:prepared',pkt['state']=='PREPARED');ck(f'{label}:packet-sha',bool(re.fullmatch(r'[a-f0-9]{64}',pkt['packetDigestSha256'])));ck(f'{label}:idempotency',pkt['idempotencyKey'].startswith('handoff:tenant-demo:ap-agro-431:'));ck(f'{label}:human-preparer',pkt['preparedByActorType']=='HUMAN');ck(f'{label}:not-executed-prepared',pkt['executionState']=='NOT_EXECUTED' and pkt['canonicalMutated'] is False and pkt['localOnly'] is True)
      with page.expect_download() as di:page.locator('#exportBtn').click()
      dl=di.value;ck(f'{label}:download-json',dl.suggested_filename.endswith('.json'));store=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.handoffs.v1')||'[]')");pkt=store[0];ck(f'{label}:exported',pkt['state']=='EXPORTED' and pkt['transport']=='LOCAL_EXPORT_ONLY');ck(f'{label}:not-executed-exported',pkt['executionState']=='NOT_EXECUTED')
      page.locator('#ackBtn').click();page.wait_for_timeout(50);store=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.handoffs.v1')||'[]')");pkt=store[0];ck(f'{label}:ack-pending',pkt['state']=='ACK_PENDING');ck(f'{label}:no-fake-ack','acknowledgedAt' not in pkt and pkt['executionState']=='NOT_EXECUTED')
      sw=page.evaluate("async()=>{const r=await navigator.serviceWorker.ready;return {ok:!!r.active,url:r.active?.scriptURL||''}}") ;ck(f'{label}:service-worker',sw['ok'] and sw['url'].endswith('/service-worker.js'));ck(f'{label}:no-overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'));ck(f'{label}:no-console-errors',not errs,';'.join(errs));ck(f'{label}:no-page-errors',not pageerrs,';'.join(pageerrs));page.screenshot(path=str(ev/f'handoff-http-{w}x{h}.png'),full_page=True);page.close()
    b.close()
finally:
  server.terminate()
  try:server.wait(timeout=2)
  except:server.kill()
failed=[x for x in res if not x['pass']];report={'status':'PASS' if not failed else 'FAIL','checks':len(res),'failed':failed,'results':res,'transport':'HTTP_REAL','trust':'DEMO_RECONSTRUCTED','executionState':'NOT_EXECUTED','canonicalMutation':False,'aiAuthority':'ADVISORY_ONLY','d10':'PENDING'};(ev/'browser-http-qa.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));raise SystemExit(1 if failed else 0)
