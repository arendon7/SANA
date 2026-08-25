from pathlib import Path

sw = Path('apps/control-web/public/sana-v3-sw.js')
s = sw.read_text()

if "const CACHE='sana-v3-demo-shell-v159';" not in s:
    old = "const CACHE='sana-v3-demo-shell-v158';"
    new = "if(false){\nconst CACHE='sana-v3-demo-shell-v158';\n}\nconst CACHE='sana-v3-demo-shell-v159';"
    assert s.count(old) == 1, 'expected exactly one active v158 marker'
    s = s.replace(old, new, 1)

anchor = "'/sana-v3-impact-references.js',"
assets = "'/sana-v3-impact-references.js','/sana-v3-report-snapshot-impact-references.js','/sana-v3-cycle-impact-references.js','/sana-v3-due-diligence-impact-reference-gaps.js','/sana-v3-dataroom-impact-references.js',"
if '/sana-v3-report-snapshot-impact-references.js' not in s:
    assert s.count(anchor) == 1, 'impact references asset anchor missing/duplicated'
    s = s.replace(anchor, assets, 1)

comment = '// v159 propagates Impact Source Registry reference integrity through content-minimized Snapshot, Cycle, Due Diligence and Data Room without live fallback, weighting, verification, certification, credit or investment authority.'
if comment not in s:
    v158 = '// v158 validates explicit Impact Source Registry references without changing methodology, history, verification, certification, credit, eligibility or investment authority.'
    assert s.count(v158) == 1, 'v158 provenance marker missing/duplicated'
    s = s.replace(v158, v158 + '\n' + comment, 1)

sw.write_text(s)
