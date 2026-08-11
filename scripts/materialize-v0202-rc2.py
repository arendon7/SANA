#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

BASE_SHA = "323006fdf3e3b13caaa5594c3be3d50dadac21498f2c26a23b83e2d5d3de09c4"
PATCH_SHA = "0e39e545a27a7595d4cdbbdee46720a3c28129b039a77e37c8eeaf1527ad564f"
PATCH_ROOT_NAME = "AGROWAY_v0.20.2-rc2_REBASED_FROM_V015"
OUTPUT_NAME = "AGROWAY_REPO_BOOTSTRAP_v0.20.2-rc2.zip"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def require_hash(label: str, path: Path, expected: str) -> None:
    actual = sha256(path)
    if actual != expected:
        raise RuntimeError(f"{label}_SHA_MISMATCH expected={expected} actual={actual}")


def safe_extract(z: zipfile.ZipFile, destination: Path) -> None:
    root = destination.resolve()
    for member in z.infolist():
        target = (destination / member.filename).resolve()
        if target != root and root not in target.parents:
            raise RuntimeError(f"ZIP_SLIP_REJECTED {member.filename}")
    z.extractall(destination)


def locate_patch_root(extracted: Path) -> Path:
    direct = extracted / PATCH_ROOT_NAME
    if (direct / "apply_patch.py").is_file():
        return direct
    matches = [p.parent for p in extracted.rglob("apply_patch.py") if p.parent.name == PATCH_ROOT_NAME]
    if len(matches) != 1:
        raise RuntimeError("PATCH_ROOT_NOT_UNIQUE")
    return matches[0]


def main() -> int:
    parser = argparse.ArgumentParser(description="Materialize AGROWAY v0.20.2-rc2 from the real v0.15 base plus the locked v0.16R+ cumulative patch")
    parser.add_argument("base_v015_zip", type=Path)
    parser.add_argument("patch_v0202_rc2_zip", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("./out-v0202-rc2"))
    args = parser.parse_args()

    base = args.base_v015_zip.resolve()
    patch = args.patch_v0202_rc2_zip.resolve()
    if not base.is_file() or not patch.is_file():
        raise RuntimeError("BASE_OR_PATCH_ARTIFACT_MISSING")

    require_hash("BASE_V015", base, BASE_SHA)
    require_hash("PATCH_V0202_RC2", patch, PATCH_SHA)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="agroway-v0202-rc2-") as tmp:
        extracted = Path(tmp)
        with zipfile.ZipFile(patch) as z:
            bad = z.testzip()
            if bad:
                raise RuntimeError(f"PATCH_ZIP_CORRUPT {bad}")
            safe_extract(z, extracted)
        patch_root = locate_patch_root(extracted)
        subprocess.run(
            [sys.executable, str(patch_root / "apply_patch.py"), str(base), "--output-dir", str(args.output_dir.resolve())],
            check=True,
        )

    output_zip = args.output_dir.resolve() / OUTPUT_NAME
    if not output_zip.is_file():
        raise RuntimeError("MATERIALIZED_OUTPUT_MISSING")
    print(json.dumps({
        "status": "PASS",
        "baseVersion": "0.15.0-rc1",
        "intermediateLayer": "0.16R reconstructed",
        "baseSha256": BASE_SHA,
        "patchSha256": PATCH_SHA,
        "output": str(output_zip),
        "outputSha256": sha256(output_zip),
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
