from pathlib import Path

path=Path('apps/control-web/public/sana-v3-dataroom-entry.js')
text=path.read_text()
replacements=[
    ("function reviewRecoveryPreview(issueKey='ALL',href=location.href){", "function reviewRecoveryPreview(issueKey='ALL',href=''){"),
    ("    try{\n      const keys=issueKey==='ALL'?", "    try{\n      const sourceHref=href||((typeof location!=='undefined'&&location?.href)?location.href:'');\n      const keys=issueKey==='ALL'?"),
    ("      if(!keys.length)return {valid:false", "      if(!sourceHref||!keys.length)return {valid:false"),
    ("      const before=new URL(href),after=new URL(href);", "      const before=new URL(sourceHref),after=new URL(sourceHref);")
]
for old,new in replacements:
    if new in text:
        continue
    if old not in text:
        raise SystemExit(f'V111_NO_LOCATION_FIX_ANCHOR_MISSING:{old[:80]}')
    text=text.replace(old,new,1)
path.write_text(text)
print('V111 preview made safe for non-browser validators')
