#!/usr/bin/env python3
import json, os, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
PORT=43174
BASE=f"http://127.0.0.1:{PORT}"

def wait_ready():
    for _ in range(60):
        try:
            with urllib.request.urlopen(f"{BASE}/api/dev/status", timeout=0.5) as r:
                if r.status == 200:
                    return json.loads(r.read().decode())
        except Exception:
            time.sleep(0.1)
    raise RuntimeError("LOCAL_DEV_BACKEND_START_TIMEOUT")

with tempfile.TemporaryDirectory(prefix="agroway-browser-backend-") as runtime:
    env={**os.environ,"PORT":str(PORT),"AGROWAY_RUNTIME_DIR":runtime,"AGROWAY_DEV_ALLOW_RESET":"1"}
    proc=subprocess.Popen(["node","apps/field-web/server.mjs"],cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        status=wait_ready()
        assert status.get("trust")=="LOCAL_DEV_BACKEND_NOT_PRODUCTION"
        checks=[]
        with sync_playwright() as p:
            browser=p.chromium.launch()
            for name,viewport in [("desktop",{"width":1440,"height":900}),("mobile",{"width":390,"height":844})]:
                page=browser.new_page(viewport=viewport)
                console_errors=[];page_errors=[]
                page.on("console",lambda msg, bucket=console_errors: bucket.append(msg.text) if msg.type=="error" else None)
                page.on("pageerror",lambda exc, bucket=page_errors: bucket.append(str(exc)))
                response=page.goto(BASE,wait_until="networkidle")
                assert response and response.status==200
                assert page.locator("body").count()==1
                overflow=page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
                assert not overflow
                api=page.evaluate("fetch('/api/dev/status').then(r=>r.json())")
                assert api.get("trust")=="LOCAL_DEV_BACKEND_NOT_PRODUCTION"
                assert not console_errors and not page_errors
                checks.extend([f"{name}:http-200",f"{name}:body",f"{name}:no-overflow",f"{name}:trust",f"{name}:no-browser-errors"])
                page.close()
            browser.close()
        print(json.dumps({"status":"PASS","checks":len(checks),"checksRun":checks,"trust":status["trust"]},indent=2))
    finally:
        proc.terminate()
        try: proc.wait(timeout=2)
        except subprocess.TimeoutExpired: proc.kill()
