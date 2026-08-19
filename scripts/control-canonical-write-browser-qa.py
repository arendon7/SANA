import json, os, pathlib, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright
from control_browser_demo_auth import authenticate_demo_admin
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/product/evidence/canonical-write-adapter';OUT.mkdir(parents=True,exist_ok=True)
PORT=4279;BASE=f'http://127.0.0.1:{PORT}';results=[]
def check(name,ok,detail=''):
    results.append({'name':name,'pass':bool(ok),'detail':detail});print(('PASS' if ok else 'FAIL'),name,detail)
def wait_http():
    for _ in range(50):
        try:
            with urllib.request.urlopen(BASE+'/control/write-adapter',timeout=.4) as r:
                if r.status==200:return
        except Exception:time.sleep(.1)
    raise RuntimeError('CONTROL_SERVER_NOT_READY')
proc=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=ROOT,env={**os.environ,'PORT':str(PORT)},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
try:
    wait_http()
    with sync_playwright() as p:
        browser=p.chromium.launch()
        for label,viewport in [('desktop',{'width':1440,'height':1000}),('mobile',{'width':390,'height':844})]:
            ctx=browser.new_context(viewport=viewport);page=ctx.new_page();console=[];errors=[]
            page.on('console',lambda m,arr=console: arr.append(m.text) if m.type=='error' else None);page.on('pageerror',lambda e,arr=errors: arr.append(str(e)))
            authenticate_demo_admin(page,BASE+'/control/write-adapter');response=page.goto(BASE+'/control/write-adapter',wait_until='networkidle');check(f'{label}:route',response is not None and response.status==200,page.url)
            body=page.locator('body').inner_text()
            for token in ['Canonical Write Adapter','AUTHORIZED_FOR_ADAPTER','DECLARE_CAPITAL_REQUIREMENT','CapitalRequirementDeclared','REVIEW_ONLY','PASS_REVIEW','PRODUCTION_POSTGRES_CONFIGURATION_PENDING','ADVISORY_ONLY','D10=PENDING']:check(f'{label}:token:{token}',token in body)
            state=page.evaluate('globalThis.__AGROWAY_CONTROL_ALPHA12_WRITE__')
            check(f'{label}:review-only',state.get('surface')=='REVIEW_ONLY');check(f'{label}:browser-disabled',state.get('browserCanInvokeAdapter') is False);check(f'{label}:postgres-implemented',state.get('postgresTransactionAdapterImplemented') is True);check(f'{label}:prod-db-pending',state.get('productionDatabaseConfigured') is False);check(f'{label}:no-production-execution',state.get('productionExecutionAvailable') is False)
            check(f'{label}:no-overflow',page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'));check(f'{label}:no-console-errors',not console,json.dumps(console));check(f'{label}:no-page-errors',not errors,json.dumps(errors))
            api=page.evaluate("async()=>{const r=await fetch('/api/control/write');return {status:r.status,body:await r.json()}}")
            check(f'{label}:api-get-forbidden',api['status']==404 and api['body'].get('error')=='CANONICAL_WRITE_BROWSER_ENDPOINT_FORBIDDEN' and api['body'].get('postgresTransactionAdapterImplemented') is True and api['body'].get('productionDatabaseConfigured') is False,json.dumps(api))
            post=page.evaluate("async()=>{const r=await fetch('/api/control/write',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});return {status:r.status,text:await r.text()}}")
            check(f'{label}:api-post-forbidden',post['status']==405,json.dumps(post));page.screenshot(path=str(OUT/f'alpha12-write-{label}.png'),full_page=True);ctx.close()
        ctx=browser.new_context(viewport={'width':1280,'height':900});page=ctx.new_page();authenticate_demo_admin(page,BASE+'/control');page.goto(BASE+'/control',wait_until='networkidle');check('home:write-entry',page.locator('a[href="/control/write-adapter"]').count()>0);page.locator('a[href="/control/write-adapter"]').first.click();page.wait_for_url('**/control/write-adapter');check('home:write-navigation',page.url.endswith('/control/write-adapter'));page.wait_for_timeout(500)
        regs=page.evaluate("async()=> (await navigator.serviceWorker.getRegistrations()).map(r=>r.active?.scriptURL||r.installing?.scriptURL||r.waiting?.scriptURL||'')");check('pwa:single-registration',len(regs)<=1,json.dumps(regs));check('pwa:unified-service-worker',not regs or all(x.endswith('/service-worker.js') for x in regs),json.dumps(regs));check('pwa:historical-project-sw-not-active',all('service-worker-project.js' not in x for x in regs),json.dumps(regs));ctx.close();browser.close()
finally:
    proc.terminate()
    try:proc.wait(timeout=3)
    except subprocess.TimeoutExpired:proc.kill()
failed=[x for x in results if not x['pass']];report={'status':'PASS' if not failed else 'FAIL','checks':len(results),'failed':[x['name'] for x in failed],'results':results,'transport':'HTTP_REAL','boundary':'CANONICAL_POSTGRES_TRANSACTION_ADAPTER','browserCanInvokeAdapter':False,'postgresTransactionAdapterImplemented':True,'productionDatabaseConfigured':False,'productionExecutionAvailable':False,'approvalAuthority':'HUMAN_ONLY','aiAuthority':'ADVISORY_ONLY','d10':'PENDING'}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2));raise SystemExit(1 if failed else 0)
