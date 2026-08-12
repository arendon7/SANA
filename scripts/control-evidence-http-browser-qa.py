#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, time, urllib.request, os, re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];ev=root/'docs/product/evidence/evidence-ledger';ev.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=root,env={**os.environ,'PORT':'4273'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
for _ in range(60):
    try:
        with urllib.request.urlopen('http://127.0.0.1:4273/control/evidence',timeout=.5) as r:
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
      response=page.goto('http://127.0.0.1:4273/control/evidence',wait_until='networkidle');ck(f'{label}:http-200',response and response.status==200,response.status if response else None)
      ck(f'{label}:nosniff',response.headers.get('x-content-type-options')=='nosniff');ck(f'{label}:frame-deny',response.headers.get('x-frame-options')=='DENY');ck(f'{label}:secure-context',page.evaluate('window.isSecureContext'))
      ck(f'{label}:six-evidence',page.locator('.evidence-row').count()==6,page.locator('.evidence-row').count());ck(f'{label}:accepted-count',page.locator('#acceptedCount').inner_text()=='2');ck(f'{label}:stale-unknown-count',page.locator('#staleCount').inner_text()=='3')
      page.locator('[data-id="ev-impact-yar"]').click();ck(f'{label}:rejected-ai-zero-citations','0 citations' in page.locator('.ai-synthesis').inner_text());ck(f'{label}:rejected-accept-disabled',page.locator('#acceptBtn').is_disabled())
      page.locator('[data-id="ev-weather-uraba"]').click();ck(f'{label}:unknown-accept-disabled',page.locator('#acceptBtn').is_disabled())
      page.locator('[data-id="ev-control-001"]').click();page.locator('#humanNote').fill('Validado contra snapshot de Control Tower y provenance registrada.');page.locator('#acceptBtn').click();page.wait_for_timeout(100);ck(f'{label}:human-accept','ACCEPTED_FOR_REVIEW' in page.locator('.evidence-detail').inner_text())
      ledger=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.decision-ledger.v1')||'[]')");ck(f'{label}:ledger-entry-created',len(ledger)==1,len(ledger));ck(f'{label}:ledger-human',ledger[0]['actorType']=='HUMAN');ck(f'{label}:ledger-sha256',bool(re.fullmatch(r'[a-f0-9]{64}',ledger[0]['entryDigestSha256'])));ck(f'{label}:ledger-genesis',ledger[0]['previousDigestSha256'] is None)
      page.locator('#humanNote').fill('Vincular al caso crítico agronómico para revisión transversal.');page.locator('#linkBtn').click();page.wait_for_timeout(100);ledger=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.decision-ledger.v1')||'[]')");ck(f'{label}:hash-chain-second',len(ledger)==2 and ledger[1]['previousDigestSha256']==ledger[0]['entryDigestSha256']);ck(f'{label}:local-boundary',all(x['canonicalMutated'] is False and x['localOnly'] is True for x in ledger))
      ck(f'{label}:service-worker',page.evaluate("navigator.serviceWorker&&navigator.serviceWorker.controller!==null"))
      page.screenshot(path=str(ev/f'evidence-ledger-http-{w}x{h}.png'),full_page=True)
      ex=page.goto('http://127.0.0.1:4273/control/exceptions',wait_until='networkidle');ck(f'{label}:exception-route-regression',ex and ex.status==200);ck(f'{label}:exception-five-cases',page.locator('.ex-card').count()==5,page.locator('.ex-card').count())
      ck(f'{label}:no-overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
      if label=='mobile':
        page.goto('http://127.0.0.1:4273/control/evidence',wait_until='networkidle');box=page.locator('.filter').first.bounding_box();ck('mobile:touch-target',box and box['height']>=44,box)
      ck(f'{label}:no-console-errors',not errs,';'.join(errs));ck(f'{label}:no-page-errors',not pageerrs,';'.join(pageerrs));page.close()
    b.close()
finally:
  server.terminate()
  try:server.wait(timeout=2)
  except:server.kill()
failed=[x for x in res if not x['pass']];report={'status':'PASS' if not failed else 'FAIL','checks':len(res),'failed':failed,'results':res,'transport':'HTTP_REAL','trust':'DEMO_RECONSTRUCTED','canonicalMutation':False,'aiAuthority':'ADVISORY_ONLY','ledgerAuthority':'HUMAN_ONLY','d10':'PENDING'}
(ev/'browser-http-qa.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(json.dumps(report,indent=2,ensure_ascii=False));raise SystemExit(1 if failed else 0)
