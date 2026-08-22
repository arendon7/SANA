#!/usr/bin/env python3
from pathlib import Path
import json, os, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright
from control_browser_demo_auth import authenticate_demo_admin
root=Path(__file__).resolve().parents[1]; ev=root/'docs/product/evidence/unified-control-flow'; ev.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['node','apps/control-web/server.mjs'],cwd=root,env={**os.environ,'PORT':'4273'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
for _ in range(80):
    try:
        with urllib.request.urlopen('http://127.0.0.1:4273/control/exceptions',timeout=.5) as r:
            if r.status==200: break
    except Exception: time.sleep(.1)
else: raise SystemExit('SERVER_NOT_READY')
res=[]
def ck(name,value,detail=''): res.append({'name':name,'pass':bool(value),'detail':str(detail)})
def flow(page): return page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.flow-context.v1')||'null')")
try:
  with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for label,w,h in [('desktop',1440,900),('mobile',390,844)]:
      context=browser.new_context(viewport={'width':w,'height':h},locale='es-CO',accept_downloads=True)
      page=context.new_page(); page.set_default_timeout(7000); errors=[]; page_errors=[]
      page.on('console',lambda m: errors.append(m.text) if m.type=='error' else None); page.on('pageerror',lambda e: page_errors.append(str(e)))
      authenticate_demo_admin(page,'http://127.0.0.1:4273/control/exceptions')
      r=page.goto('http://127.0.0.1:4273/control/exceptions',wait_until='networkidle'); ck(f'{label}:exceptions-http',r and r.status==200)
      ck(f'{label}:flow-four-steps',page.locator('.flow-step').count()==4,page.locator('.flow-step').count())
      page.locator('[data-id="agro"]').click(); page.wait_for_timeout(120); ctx=flow(page)
      ck(f'{label}:exception-bound',ctx and ctx['exceptionId']=='agro',ctx); ck(f'{label}:correlation-bound',ctx and ctx['correlationId']=='control-flow:agro:cycle-431'); ck(f'{label}:evidence-bound',ctx and 'ev-agro-431' in ctx['evidenceIds']); ck(f'{label}:proposal-bound',ctx and ctx['proposalId']=='ap-agro-431'); ck(f'{label}:authority-exception',ctx and ctx['authority']=='HUMAN_ONLY' and ctx['aiAuthority']=='ADVISORY_ONLY'); ck(f'{label}:not-executed-exception',ctx and ctx['executionState']=='NOT_EXECUTED' and ctx['canonicalMutated'] is False)
      page.locator('[data-flow-href*="/control/evidence"]').click(); page.wait_for_load_state('networkidle'); ctx=flow(page)
      ck(f'{label}:evidence-route','/control/evidence' in page.url,page.url); ck(f'{label}:context-survives-evidence',ctx and ctx['exceptionId']=='agro' and ctx['proposalId']=='ap-agro-431'); ck(f'{label}:evidence-registry-visible',page.locator('#evidenceList').count()==1); ck(f'{label}:evidence-flow-current',page.locator('.flow-step.current b').inner_text()=='Evidencia')
      page.locator('[data-flow-href*="/control/approvals"]').click(); page.wait_for_load_state('networkidle'); ctx=flow(page)
      ck(f'{label}:approvals-route','/control/approvals' in page.url); ck(f'{label}:context-survives-approvals',ctx and ctx['correlationId']=='control-flow:agro:cycle-431')
      page.locator('[data-id="ap-agro-431"]').click(); page.locator('#approver').select_option('actor-director-001'); page.locator('#approvalNote').fill('Primera firma humana E2E: evidencia y contexto revisados.'); page.locator('#approveBtn').click(); page.wait_for_timeout(120)
      ck(f'{label}:first-approval','AWAITING SECOND HUMAN APPROVAL' in page.locator('.approval-detail').inner_text())
      page.locator('#approver').select_option('agro-jp-001'); page.locator('#approvalNote').fill('Segunda firma humana independiente E2E.'); page.locator('#approveBtn').click(); page.wait_for_timeout(120)
      ck(f'{label}:approved-for-submission','APPROVED FOR SUBMISSION' in page.locator('.approval-detail').inner_text()); approvals=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.approvals.v1')||'[]')"); proposal=next(x for x in approvals if x['id']=='ap-agro-431'); ck(f'{label}:two-humans',len(proposal['approvalRecords'])==2 and len({x['approverActorId'] for x in proposal['approvalRecords']})==2); ck(f'{label}:approval-not-executed',proposal['executionState']=='NOT_EXECUTED' and proposal['canonicalMutated'] is False)
      page.locator('[data-flow-href*="/control/handoff"]').click(); page.wait_for_load_state('networkidle'); ck(f'{label}:handoff-route','/control/handoff' in page.url); ck(f'{label}:eligible-count',page.locator('#eligibleCount').inner_text()=='1')
      page.locator('[data-id="ap-agro-431"]').click(); ck(f'{label}:prepare-enabled',not page.locator('#prepareBtn').is_disabled()); page.locator('#prepareBtn').click(); page.wait_for_timeout(220); packets=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.handoffs.v1')||'[]')"); pkt=packets[0]; ck(f'{label}:prepared',pkt['state']=='PREPARED'); ck(f'{label}:prepared-not-executed',pkt['executionState']=='NOT_EXECUTED' and pkt['canonicalMutated'] is False and pkt['localOnly'] is True)
      with page.expect_download() as di: page.locator('#exportBtn').click()
      ck(f'{label}:export-download',di.value.suggested_filename.endswith('.json')); page.wait_for_timeout(150); page.locator('#ackBtn').click(); page.wait_for_timeout(220); packets=page.evaluate("JSON.parse(localStorage.getItem('agroway.control.demo.handoffs.v1')||'[]')"); pkt=packets[0]; ctx=flow(page)
      ck(f'{label}:ack-pending',pkt['state']=='ACK_PENDING'); ck(f'{label}:no-fake-ack','acknowledgedAt' not in pkt); ck(f'{label}:packet-bound-to-flow',ctx and ctx.get('packetId')==pkt['packetId'],ctx); ck(f'{label}:final-not-executed',ctx and ctx['executionState']=='NOT_EXECUTED' and pkt['executionState']=='NOT_EXECUTED'); ck(f'{label}:final-no-canonical-mutation',ctx and ctx['canonicalMutated'] is False and pkt['canonicalMutated'] is False); ck(f'{label}:no-execute-control',page.get_by_role('button',name='Ejecutar',exact=True).count()==0)
      sw=page.evaluate("async()=>{const r=await navigator.serviceWorker.ready;return {ok:!!r.active,url:r.active?.scriptURL||''}}") ; ck(f'{label}:service-worker',sw['ok'] and sw['url'].endswith('/service-worker.js'),sw); ck(f'{label}:no-overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')); ck(f'{label}:no-console-errors',not errors,';'.join(errors)); ck(f'{label}:no-page-errors',not page_errors,';'.join(page_errors))
      page.screenshot(path=str(ev/f'unified-flow-http-{w}x{h}.png'),full_page=True); context.close()
    browser.close()
finally:
  server.terminate()
  try: server.wait(timeout=2)
  except Exception: server.kill()
failed=[x for x in res if not x['pass']]; report={'status':'PASS' if not failed else 'FAIL','checks':len(res),'failed':failed,'results':res,'transport':'HTTP_REAL','journey':'EXCEPTION_TO_EVIDENCE_TO_HUMAN_APPROVAL_TO_HANDOFF','trust':'DEMO_RECONSTRUCTED','authority':'HUMAN_ONLY','aiAuthority':'ADVISORY_ONLY','executionState':'NOT_EXECUTED','canonicalMutation':False,'d10':'PENDING'}
(ev/'browser-http-qa.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)); print(json.dumps(report,indent=2,ensure_ascii=False)); raise SystemExit(1 if failed else 0)
