from pathlib import Path

FILES = {
    'scripts/control-evidence-http-browser-qa.py': [
        ("from playwright.sync_api import sync_playwright\n", "from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"),
        ("      response=page.goto('http://127.0.0.1:4273/control/evidence',wait_until='networkidle');", "      authenticate_demo_admin(page,'http://127.0.0.1:4273/control/evidence')\n      response=page.goto('http://127.0.0.1:4273/control/evidence',wait_until='networkidle');"),
    ],
    'scripts/control-approvals-http-browser-qa.py': [
        ("from playwright.sync_api import sync_playwright\n", "from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"),
        ("      response=page.goto('http://127.0.0.1:4273/control/approvals',wait_until='networkidle');", "      authenticate_demo_admin(page,'http://127.0.0.1:4273/control/approvals')\n      response=page.goto('http://127.0.0.1:4273/control/approvals',wait_until='networkidle');"),
    ],
    'scripts/control-handoff-http-browser-qa.py': [
        ("from playwright.sync_api import sync_playwright\n", "from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"),
        ("      r=page.goto('http://127.0.0.1:4273/control/handoff',wait_until='networkidle');", "      authenticate_demo_admin(page,'http://127.0.0.1:4273/control/handoff')\n      r=page.goto('http://127.0.0.1:4273/control/handoff',wait_until='networkidle');"),
    ],
    'scripts/control-unified-flow-http-browser-qa.py': [
        ("from playwright.sync_api import sync_playwright\n", "from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"),
        ("      r=page.goto('http://127.0.0.1:4273/control/exceptions',wait_until='networkidle');", "      authenticate_demo_admin(page,'http://127.0.0.1:4273/control/exceptions')\n      r=page.goto('http://127.0.0.1:4273/control/exceptions',wait_until='networkidle');"),
    ],
    'scripts/control-reintegration-http-browser-qa.py': [
        ("from playwright.sync_api import sync_playwright\n", "from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"),
        ("    page.goto(BASE+'/control',wait_until='networkidle')\n", "    authenticate_demo_admin(page,BASE+'/control')\n    page.goto(BASE+'/control',wait_until='networkidle')\n"),
    ],
    'scripts/control-production-authorization-browser-qa.py': [
        ("from playwright.sync_api import sync_playwright\n", "from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"),
        ("            page.goto(BASE+'/control/authorization',wait_until='networkidle');", "            authenticate_demo_admin(page,BASE+'/control/authorization');page.goto(BASE+'/control/authorization',wait_until='networkidle');"),
        ("context=browser.new_context(viewport={'width':1280,'height':800});page=context.new_page();page.goto(BASE+'/control',wait_until='networkidle');", "context=browser.new_context(viewport={'width':1280,'height':800});page=context.new_page();authenticate_demo_admin(page,BASE+'/control');page.goto(BASE+'/control',wait_until='networkidle');"),
    ],
    'scripts/control-canonical-write-browser-qa.py': [
        ("from playwright.sync_api import sync_playwright\n", "from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"),
        ("            response=page.goto(BASE+'/control/write-adapter',wait_until='networkidle');", "            authenticate_demo_admin(page,BASE+'/control/write-adapter');response=page.goto(BASE+'/control/write-adapter',wait_until='networkidle');"),
        ("ctx=browser.new_context(viewport={'width':1280,'height':900});page=ctx.new_page();page.goto(BASE+'/control',wait_until='networkidle');", "ctx=browser.new_context(viewport={'width':1280,'height':900});page=ctx.new_page();authenticate_demo_admin(page,BASE+'/control');page.goto(BASE+'/control',wait_until='networkidle');"),
    ],
    'scripts/control-oidc-session-browser-qa.py': [
        ("from playwright.sync_api import sync_playwright\n", "from playwright.sync_api import sync_playwright\nfrom control_browser_demo_auth import authenticate_demo_admin\n"),
        ("            response=page.goto(BASE+'/control/identity-adapter',wait_until='networkidle');", "            authenticate_demo_admin(page,BASE+'/control/identity-adapter');response=page.goto(BASE+'/control/identity-adapter',wait_until='networkidle');"),
        ("ctx=browser.new_context(viewport={'width':1280,'height':900});page=ctx.new_page();page.goto(BASE+'/control',wait_until='networkidle');", "ctx=browser.new_context(viewport={'width':1280,'height':900});page=ctx.new_page();authenticate_demo_admin(page,BASE+'/control');page.goto(BASE+'/control',wait_until='networkidle');"),
    ],
}

for path_str, replacements in FILES.items():
    path = Path(path_str)
    text = path.read_text()
    original = text
    for old, new in replacements:
        if new in text:
            continue
        if old not in text:
            raise SystemExit(f'PATCH_ANCHOR_MISSING:{path_str}:{old[:90]!r}')
        text = text.replace(old, new, 1)
    if text == original:
        print(f'UNCHANGED {path_str}')
    else:
        path.write_text(text)
        print(f'PATCHED {path_str}')
