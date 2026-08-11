#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json,subprocess,sys,tempfile,zipfile
from pathlib import Path
BASE_SHA='12f33aed9b60cfe4a0f97e65a65d35dd665cfa3cfeb9e218934a1b056d943d8d'
PATCH_SHA='77d31f8a23b48c0a798e6c56b8cc92caf2a66befd2a9bce42ebea9814176833a'
PATCH_ROOT='AGROWAY_v0.20.2-rc1_DOMAIN_INTEGRITY_CUMULATIVE_PATCH'
def sha256(p:Path)->str:
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1024*1024),b''): h.update(c)
 return h.hexdigest()
def verify(label:str,p:Path,want:str)->None:
 got=sha256(p)
 if got!=want: raise RuntimeError(f'{label}_SHA_MISMATCH expected={want} actual={got}')
def safe_extract(z:zipfile.ZipFile,d:Path)->None:
 root=d.resolve()
 for m in z.infolist():
  target=(d/m.filename).resolve()
  if target!=root and root not in target.parents: raise RuntimeError(f'ZIP_SLIP_REJECTED {m.filename}')
 z.extractall(d)
def main()->int:
 ap=argparse.ArgumentParser();ap.add_argument('base_zip',type=Path);ap.add_argument('patch_zip',type=Path);ap.add_argument('--output-dir',type=Path,default=Path('./out-v0202'));a=ap.parse_args()
 base=a.base_zip.resolve();patch=a.patch_zip.resolve()
 if not base.is_file() or not patch.is_file(): raise RuntimeError('BASE_OR_PATCH_ARTIFACT_MISSING')
 verify('BASE',base,BASE_SHA);verify('PATCH',patch,PATCH_SHA)
 a.output_dir.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory(prefix='agroway-v0202-patch-') as tmp:
  d=Path(tmp)
  with zipfile.ZipFile(patch) as z:
   bad=z.testzip()
   if bad: raise RuntimeError(f'PATCH_ZIP_CORRUPT {bad}')
   safe_extract(z,d)
  root=d/PATCH_ROOT
  if not (root/'apply_patch.py').is_file(): raise RuntimeError('PATCH_ROOT_MISSING')
  subprocess.run([sys.executable,str(root/'apply_patch.py'),str(base),'--output-dir',str(a.output_dir.resolve())],check=True)
 out=a.output_dir.resolve()/'AGROWAY_REPO_BOOTSTRAP_v0.20.2-rc1.zip'
 if not out.is_file(): raise RuntimeError('MATERIALIZED_OUTPUT_MISSING')
 print(json.dumps({'status':'PASS','baseSha256':BASE_SHA,'patchSha256':PATCH_SHA,'output':str(out),'outputSha256':sha256(out)},indent=2));return 0
if __name__=='__main__':
 try: raise SystemExit(main())
 except Exception as e: print(json.dumps({'status':'FAIL','error':str(e)},indent=2),file=sys.stderr);raise SystemExit(1)
