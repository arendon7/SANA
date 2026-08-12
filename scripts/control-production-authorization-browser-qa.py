from __future__ import annotations
import json, os, pathlib, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'docs'/'product'/'evidence'/'production-authorization';OUT.mkdir(parents=True,exist_ok=True);PORT=4277;BASE=f'http://127.0.0.1:{PORT}';results=[]
def check(name,condition,detail=''):
    ok=bool(condition);results.append({'name':name,'pass':ok,'detail':str(detail)});print(('PASS' if ok else 'FAIL'),name,detail)
env=os.environ.copy();env['PORT']=str(PORT);server=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
    for _ in range(50):
        try:
            with urllib.request.urlopen(BASE+'/control/authorization',timeout=.4) as r:
                if r.status==200: break
        except Exception: time.sleep(.15)
    else: raise RuntimeError('CONTROL_SERVER_NOT_READY')
    with sync_playwright() as p:
        browser=p.chromium.launch()
        for label,viewport in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            context=browser.new_context(viewport=viewport);page=context.new_page();console_errors=[];page_errors=[]
            page.on('console',lambda msg: console_errors.append(msg.text) if msg.type=='error' else None);page.on('pageerror',lambda exc: page_errors.append(str(exc)))
            page.goto(BASE+'/control/authorization',wait_until='networkidle');check(f'{label}:route',page.url.endswith('/control/authorization'),page.url);check(f'{label}:title',page.locator('h1').inner_text()=='Production Authorization Boundary');body=page.locator('body').inner_text()
            for token in ['REVIEW_GATE','AAL2 + MFA','HUMAN_ONLY','ADVISORY_ONLY','AUTHORIZED_FOR_ADAPTER','canonicalMutated=false','PENDING_PRODUCTION']: check(f'{label}:token:{token}',token in body)
            page.locator('[data-case="valid"]').click();check(f'{label}:valid-fixture','AUTHORIZED_FOR_ADAPTER' in page.locator('#decision').inner_text());check(f'{label}:valid-never-executes','NOT_EXECUTED' in page.locator('#decision').inner_text());page.locator('[data-case="expired"]').click();check(f'{label}:expired-denied','PRODUCTION_SESSION_EXPIRED' in page.locator('#decision').inner_text());page.locator('[data-case="crossTenant"]').click();check(f'{label}:cross-tenant-denied','PRODUCTION_TARGET_TENANT_MISMATCH' in page.locator('#decision').inner_text());page.locator('[data-case="aiApproval"]').click();check(f'{label}:ai-approval-denied','PRODUCTION_AI_APPROVAL_FORBIDDEN' in page.locator('#decision').inner_text());page.locator('[data-case="highRiskOne"]').click();check(f'{label}:high-risk-one-human-denied','PRODUCTION_HUMAN_APPROVAL_COUNT_INSUFFICIENT' in page.locator('#decision').inner_text());check(f'{label}:no-overflow',page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'));check(f'{label}:no-console-errors',not console_errors,console_errors);check(f'{label}:no-page-errors',not page_errors,page_errors);page.screenshot(path=str(OUT/f'alpha9-authorization-{label}.png'),full_page=True);context.close()
        context=browser.new_context(viewport={'width':1280,'height':800});page=context.new_page();page.goto(BASE+'/control',wait_until='networkidle');check('home:authorization-entry',page.locator('a[href="/control/authorization"]').count()>0);page.locator('a[href="/control/authorization"]').first.click();page.wait_for_url('**/control/authorization');check('home:authorization-navigation',page.url.endswith('/control/authorization'));sw_url=page.evaluate("async()=>{if(!('serviceWorker' in navigator))return 'UNSUPPORTED';const r=await navigator.serviceWorker.ready;return r.active?.scriptURL||''}");check('pwa:unified-service-worker',sw_url.endswith('/service-worker.js'),sw_url);check('pwa:historical-project-sw-not-active','service-worker-project.js' not in sw_url,sw_url);context.close();browser.close()
finally:
    server.terminate()
    try: server.wait(timeout=3)
    except subprocess.TimeoutExpired: server.kill()
failed=[r for r in results if not r['pass']];report={'status':'PASS' if not failed else 'FAIL','checks':len(results),'failed':[r['name'] for r in failed],'results':results,'transport':'HTTP_REAL','boundary':'PRODUCTION_AUTHORIZATION','realIdentityProviderConnected':False,'authorizationOutputCeiling':'AUTHORIZED_FOR_ADAPTER','authority':'HUMAN_ONLY','aiAuthority':'ADVISORY_ONLY','executionState':'NOT_EXECUTED','canonicalMutation':False,'d10':'PENDING'};(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2));
if failed: raise SystemExit(1)
