from pathlib import Path

path=Path('scripts/control-exception-http-browser-qa.py')
text=path.read_text()
old_import="from playwright.sync_api import sync_playwright\n"
new_import="from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"
if new_import not in text:
    if old_import not in text: raise SystemExit('ALPHA3_IMPORT_ANCHOR_MISSING')
    text=text.replace(old_import,new_import,1)
old_nav="      response=page.goto('http://127.0.0.1:4273/control/exceptions',wait_until='networkidle');"
new_nav="      authenticate_demo_admin(page,'http://127.0.0.1:4273/control/exceptions')\n      response=page.goto('http://127.0.0.1:4273/control/exceptions',wait_until='networkidle');"
if new_nav not in text:
    if old_nav not in text: raise SystemExit('ALPHA3_NAV_ANCHOR_MISSING')
    text=text.replace(old_nav,new_nav,1)
path.write_text(text)
print('alpha3 Browser QA patched through DEMO auth UI')
