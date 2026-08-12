#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, time, urllib.request, os
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];ev=root/'docs/product/evidence/exception-resolution';ev.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=root,env={**os.environ,'PORT':'4273'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
for _ in range(60):
    try:
        with urllib.request.urlopen('http://127.0.0.1:4273/control/exceptions',timeout=.5) as r:
            if r.status==200:break
    except Exception: time.sleep(.1)
else:
    raise SystemExit('SERVER_NOT_READY')
res=[]
def ck(n,v,d=''):res.append({'name':n,'pass':bool(v),'detail':str(d)})
try:
  with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for label,w,h in [('desktop',1440,900),('mobile',390,844)]:
      page=b.new_page(viewport={'width':w,'height':h},locale='es-CO');page.set_default_timeout(5000);errs=[];pageerrs=[]
      page.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);page.on('pageerror',lambda e:pageerrs.append(str(e)))
      response=page.goto('http://127.0.0.1:4273/control/exceptions',wait_until='networkidle');ck(f'{label}:http-200',response and response.status==200,response.status if response else None)
      ck(f'{label}:secure-context',page.evaluate('window.isSecureContext'))
      ck(f'{label}:five-cases',page.locator('.ex-card').count()==5,page.locator('.ex-card').count())
      ck(f'{label}:critical-count',page.locator('#criticalCount').inner_text()=='1')
      ck(f'{label}:open-count',page.locator('#openCount').inner_text()=='4')
      ck(f'{label}:critical-suppress-disabled',page.locator('#suppressBtn').is_disabled())
      ck(f'{label}:ai-boundary','DRAFT_SUGGESTION' in page.locator('.ai-box').inner_text() and 'ADVISORY_ONLY' in page.locator('.ai-box').inner_text())
      page.locator('[data-id="supply"]').click();page.locator('#decisionNote').fill('Cobertura restaurada.');page.locator('#resolveBtn').click();page.wait_for_timeout(30);ck(f'{label}:fail-closed-no-owner','RESOLUTION_OWNER_REQUIRED' in page.locator('#toast').inner_text())
      page.locator('#ownerSelect').select_option('ops-cu-001');page.locator('#assignBtn').click();page.locator('#rootCause').fill('Reposición retrasada por ventana de producción.');page.locator('#evidenceRef').fill(f'supply-proof:{label}:001');page.locator('#evidenceLabel').fill('Confirmación de producción y PO');page.locator('#addEvidenceBtn').click();page.locator('#decisionNote').fill('Producción confirmada y cobertura recuperada.');page.locator('#resolveBtn').click();page.wait_for_timeout(30)
      ck(f'{label}:human-resolve',page.locator('.case-panel .badge').last.inner_text()=='RESOLVED')
      stored=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.exception-cases.v1')||'[]')");supply=next(x for x in stored if x['code']=='SUPPLY_COVERAGE_LOW')
      ck(f'{label}:human-timeline',supply['timeline'][-1]['type']=='HUMAN' and supply['timeline'][-1]['action']=='RESOLVE')
      ck(f'{label}:ai-never-resolves',not any(x.get('type')=='AI' and x.get('action') in ['ACKNOWLEDGE','ASSIGN','RESOLVE','SUPPRESS','REOPEN'] for x in supply['timeline']))
      ck(f'{label}:no-overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
      if label=='mobile':
        box=page.locator('.filter').first.bounding_box();ck('mobile:touch-target',box and box['height']>=44,box)
      page.screenshot(path=str(ev/f'exception-resolution-http-{w}x{h}.png'),full_page=True)
      ck(f'{label}:no-console-errors',not errs,';'.join(errs));ck(f'{label}:no-page-errors',not pageerrs,';'.join(pageerrs));page.close()
    b.close()
finally:
  server.terminate()
  try:server.wait(timeout=2)
  except:server.kill()
failed=[x for x in res if not x['pass']];report={'status':'PASS' if not failed else 'FAIL','checks':len(res),'failed':failed,'results':res,'transport':'HTTP_REAL','trust':'DEMO_RECONSTRUCTED','canonicalMutation':False,'aiAuthority':'ADVISORY_ONLY','d10':'PENDING'}
(ev/'browser-http-qa.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(json.dumps(report,indent=2,ensure_ascii=False));raise SystemExit(1 if failed else 0)
