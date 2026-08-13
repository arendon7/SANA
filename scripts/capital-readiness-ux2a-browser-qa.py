from pathlib import Path
import json, os, subprocess, time, urllib.request, urllib.error
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/product/evidence/capital-readiness-ux2a'
OUT.mkdir(parents=True,exist_ok=True)
PORT='4277'; BASE=f'http://127.0.0.1:{PORT}'
results=[]
def check(name,ok,detail=''):
    results.append({'name':name,'pass':bool(ok),'detail':str(detail)[:500]})

def run_view(browser,label,viewport):
    ctx=browser.new_context(viewport=viewport)
    page=ctx.new_page(); console=[]; errors=[]
    page.on('console',lambda m: console.append(m.text) if m.type=='error' else None)
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(BASE+'/control/capital/projects/hass-san-miguel',wait_until='networkidle')
    check(f'{label}:project-link',page.locator('a.producer-task-link[href="/control/capital/projects/hass-san-miguel/tasks"]').count()==1)
    page.locator('a.producer-task-link').click();page.wait_for_url('**/control/capital/projects/hass-san-miguel/tasks')
    check(f'{label}:tasks-route',page.url.endswith('/control/capital/projects/hass-san-miguel/tasks'))
    check(f'{label}:simple-title',page.locator('.producer-hero h2').text_content().strip()=='Completemos tu proyecto')
    check(f'{label}:three-tasks',page.locator('.producer-task').count()==3,page.locator('.producer-task').count())
    check(f'{label}:two-producer-tasks',page.locator('.producer-task.producer-owned').count()==2,page.locator('.producer-task.producer-owned').count())
    check(f'{label}:one-technical-task',page.locator('.producer-task.technical-owned').count()==1,page.locator('.producer-task.technical-owned').count())
    copy=page.locator('#producerTasks').text_content()
    for text in ['Costo de cosecha','Comprador y venta','Actualizar información del lote']:
        check(f'{label}:copy:{text}',text in copy)
    trust=page.locator('.producer-trust').text_content()
    check(f'{label}:canonical-gap-truth','ReadinessGap' in trust)
    check(f'{label}:no-auto-resolution','no puede hacer waiver' in trust.lower() and 'finalizar readiness' in trust.lower())
    check(f'{label}:no-financing-decision','no decide financiación' in page.locator('.producer-trust h2').text_content().lower())
    check(f'{label}:no-form',page.locator('form').count()==0)
    check(f'{label}:no-input',page.locator('input,textarea,select').count()==0)
    check(f'{label}:no-button',page.locator('button').count()==0)
    check(f'{label}:no-overflow',page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'))
    check(f'{label}:no-console-errors',len(console)==0,console)
    check(f'{label}:no-page-errors',len(errors)==0,errors)
    page.screenshot(path=str(OUT/f'{label}-tasks.png'),full_page=True)
    ctx.close()

server=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=ROOT,env={**os.environ,'PORT':PORT},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
    ready=False
    for _ in range(50):
        try:
            with urllib.request.urlopen(BASE+'/control/capital',timeout=.4) as response:
                if response.status==200:ready=True;break
        except Exception:time.sleep(.1)
    if not ready:raise RuntimeError('CAPITAL_UX2A_SERVER_NOT_READY')
    try:
        urllib.request.urlopen(BASE+'/control/capital/projects/unknown/tasks',timeout=.5)
        unknown_status=200
    except urllib.error.HTTPError as error:
        unknown_status=error.code
    check('server:unknown-project-fails-closed',unknown_status==404,unknown_status)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        run_view(browser,'desktop',{'width':1440,'height':900})
        run_view(browser,'mobile',{'width':390,'height':844})
        browser.close()
finally:
    server.terminate()
    try:server.wait(timeout=3)
    except:server.kill()
failed=[item for item in results if not item['pass']]
report={'status':'PASS' if not failed else 'FAIL','checks':len(results),'failed':failed,'results':results,'transport':'HTTP_REAL','fixture':'FIXTURE_SYNTHETIC','readinessTruth':'READINESS_GAP','projection':'PRODUCER_REMEDIATION_TASK','browserMutation':False,'financingApproval':False,'d10':'PENDING'}
(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps(report,indent=2,ensure_ascii=False))
if failed:raise SystemExit(1)
