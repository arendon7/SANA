from pathlib import Path
import json, os, subprocess, time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/product/evidence/reintegrated-control'
OUT.mkdir(parents=True,exist_ok=True)
PORT='4275'; BASE=f'http://127.0.0.1:{PORT}'
results=[]
def check(name, ok, detail=''):
    results.append({'name':name,'pass':bool(ok),'detail':str(detail)[:500]})

def run_view(browser,label,viewport):
    ctx=browser.new_context(viewport=viewport,accept_downloads=True)
    page=ctx.new_page(); console=[]; page_errors=[]
    page.on('console',lambda m: console.append(m.text) if m.type=='error' else None)
    page.on('pageerror',lambda e: page_errors.append(str(e)))
    page.goto(BASE+'/control',wait_until='networkidle')
    check(f'{label}:home-route',page.url.rstrip('/')==BASE+'/control')
    check(f'{label}:home-title',page.locator('h1').first.text_content().strip()=='Qué requiere decisión humana ahora')
    check(f'{label}:home-three-exceptions',page.locator('.exception-item').count()==3,page.locator('.exception-item').count())
    check(f'{label}:home-yarumal-project',page.locator('[data-project="yarumal"]').count()==1)
    check(f'{label}:home-unified-nav',page.locator('.rail-nav a[href="/control/exceptions"]').count()==1)
    page.locator('#copilotButton').click();page.locator('#draftButton').click()
    check(f'{label}:home-ai-draft',page.locator('#draftSuggestion .draft-state').text_content().strip()=='DRAFT_SUGGESTION')
    check(f'{label}:home-ai-no-execute', 'No puede cerrar la alerta, ejecutar riego, comprar insumos ni modificar el plan.' in page.locator('#draftSuggestion').text_content())
    page.evaluate("document.querySelector('#copilotDialog').close()")
    page.locator('[data-open-exception="exc-agro-n3"]').click();page.locator('#localReviewButton').click()
    review=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.local-reviews.v1')||'[]').at(-1)")
    check(f'{label}:home-local-review',bool(review))
    check(f'{label}:home-review-local-only',review and review.get('localOnly') is True)
    check(f'{label}:home-review-no-canonical-mutation',review and review.get('canonicalMutated') is False)
    check(f'{label}:home-unified-case-link',page.locator('#unifiedExceptionLink').count()==1)
    page.evaluate("document.querySelector('#exceptionDialog').close()")
    page.locator('[data-project="yarumal"]').click();page.wait_for_url('**/control/projects/inv-yar-001')
    check(f'{label}:project-route',page.url.endswith('/control/projects/inv-yar-001'))
    check(f'{label}:project-title',page.locator('h1').first.text_content().strip()=='Yarumal Circular')
    check(f'{label}:project-capital',all(x in page.locator('.capital-flow').text_content() for x in ['$180 M','$150 M','$97 M','$22 M']))
    check(f'{label}:project-no-financial-mutation','no ejecuta desembolsos ni modifica compromisos' in page.locator('.capital-flow').text_content().lower())
    check(f'{label}:project-context-integration',page.locator('#openCapitalCase').count()==1)
    page.locator('[data-risk="risk-supply"]').click();page.locator('#riskReviewButton').click()
    rreview=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.project-risk-reviews.v1')||'[]').at(-1)")
    check(f'{label}:project-risk-review-local',rreview and rreview.get('localOnly') is True)
    check(f'{label}:project-risk-no-canonical-mutation',rreview and rreview.get('canonicalMutated') is False)
    page.evaluate("document.querySelector('#riskDialog').close()")
    page.locator('#memoButton').click();page.locator('#generateMemoButton').click()
    check(f'{label}:project-ai-draft',page.locator('#memoDraft .draft-state').text_content().strip()=='DRAFT_SUGGESTION')
    check(f'{label}:project-ai-boundary','No puede aprobar presupuesto, desplegar capital, cambiar estado del proyecto ni certificar.' in page.locator('#memoDraft').text_content())
    page.evaluate("document.querySelector('#memoDialog').close()")
    sw=page.evaluate("async()=>{const r=await navigator.serviceWorker.ready;return r.active?.scriptURL||''}")
    check(f'{label}:unified-service-worker',sw.endswith('/service-worker.js'),sw)
    check(f'{label}:historical-project-sw-not-active','service-worker-project.js' not in sw,sw)
    page.locator('#openCapitalCase').click();page.wait_for_url('**/control/exceptions?**')
    check(f'{label}:project-to-exception-route','/control/exceptions?' in page.url,page.url)
    flow=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.flow-context.v1')||'null')")
    check(f'{label}:capital-context',flow and flow.get('exceptionId')=='capital')
    check(f'{label}:capital-proposal',flow and flow.get('proposalId')=='ap-invest-yar')
    check(f'{label}:human-only',flow and flow.get('authority')=='HUMAN_ONLY')
    check(f'{label}:ai-advisory',flow and flow.get('aiAuthority')=='ADVISORY_ONLY')
    check(f'{label}:not-executed',flow and flow.get('executionState')=='NOT_EXECUTED')
    check(f'{label}:no-canonical-mutation',flow and flow.get('canonicalMutated') is False)
    check(f'{label}:exception-page-rendered',page.locator('#exceptionList [data-id]').count()>=1)
    overflow=page.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1")
    check(f'{label}:no-overflow',overflow)
    check(f'{label}:no-console-errors',len(console)==0,console)
    check(f'{label}:no-page-errors',len(page_errors)==0,page_errors)
    page.screenshot(path=str(OUT/f'{label}.png'),full_page=True)
    ctx.close()

server=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=ROOT,env={**os.environ,'PORT':PORT},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
    ready=False
    for _ in range(50):
        try:
            import urllib.request
            with urllib.request.urlopen(BASE+'/control',timeout=.4) as r:
                if r.status==200:ready=True;break
        except Exception:time.sleep(.1)
    if not ready:raise RuntimeError('CONTROL_SERVER_NOT_READY')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        run_view(browser,'desktop',{'width':1440,'height':900})
        run_view(browser,'mobile',{'width':390,'height':844})
        browser.close()
finally:
    server.terminate()
    try:server.wait(timeout=3)
    except:server.kill()
failed=[r for r in results if not r['pass']]
report={'status':'PASS' if not failed else 'FAIL','checks':len(results),'failed':failed,'results':results,'transport':'HTTP_REAL','sourceRecovery':'RECOVERED_EXACT_PR9_BLOBS','sourceCommit':'3d58de6cbbac3946fab1fc255a28d08d61166b59','authority':'HUMAN_ONLY','aiAuthority':'ADVISORY_ONLY','executionState':'NOT_EXECUTED','canonicalMutation':False,'d10':'PENDING'}
(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps(report,indent=2,ensure_ascii=False))
if failed:raise SystemExit(1)
