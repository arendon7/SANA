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

BASE_SHA = "12f33aed9b60cfe4a0f97e65a65d35dd665cfa3cfeb9e218934a1b056d943d8d"
PATCH_SHA = "0a57ea26dec7c01dbf54c510563afc1153f8f0e350ef4971b99103fe6187f6c9"
PATCH_ROOT_NAME = "AGROWAY_v0.20.1-rc1_INTEGRATION_HARDENING_PATCH"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def safe_extract(z: zipfile.ZipFile, destination: Path) -> None:
    root = destination.resolve()
    for member in z.infolist():
        target = (destination / member.filename).resolve()
        if target != root and root not in target.parents:
            raise RuntimeError(f"ZIP_SLIP_REJECTED {member.filename}")
    z.extractall(destination)


def require_hash(label: str, path: Path, expected: str) -> None:
    actual = sha256(path)
    if actual != expected:
        raise RuntimeError(f"{label}_SHA_MISMATCH expected={expected} actual={actual}")


def locate_patch_root(extracted: Path) -> Path:
    direct = extracted / PATCH_ROOT_NAME
    if (direct / "apply_patch.py").is_file():
        return direct
    matches = [p.parent for p in extracted.rglob("apply_patch.py") if p.parent.name == PATCH_ROOT_NAME]
    if len(matches) != 1:
        raise RuntimeError("PATCH_ROOT_NOT_UNIQUE")
    return matches[0]


def main() -> int:
    parser = argparse.ArgumentParser(description="Materialize exact AGROWAY v0.20.1 from locked v0.16 base + locked cumulative patch")
    parser.add_argument("base_zip", type=Path)
    parser.add_argument("patch_zip", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("./out-v0201"))
    args = parser.parse_args()

    base = args.base_zip.resolve()
    patch = args.patch_zip.resolve()
    if not base.is_file() or not patch.is_file():
        raise RuntimeError("BASE_OR_PATCH_ARTIFACT_MISSING")

    require_hash("BASE", base, BASE_SHA)
    require_hash("PATCH", patch, PATCH_SHA)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="agroway-v0201-patch-") as tmp:
        extracted = Path(tmp)
        with zipfile.ZipFile(patch) as z:
            bad = z.testzip()
            if bad:
                raise RuntimeError(f"PATCH_ZIP_CORRUPT {bad}")
            safe_extract(z, extracted)
        patch_root = locate_patch_root(extracted)
        apply_script = patch_root / "apply_patch.py"
        subprocess.run(
            [sys.executable, str(apply_script), str(base), "--output-dir", str(args.output_dir.resolve())],
            check=True,
        )

    output_zip = args.output_dir.resolve() / "AGROWAY_REPO_BOOTSTRAP_v0.20.1-rc1.zip"
    if not output_zip.is_file():
        raise RuntimeError("MATERIALIZED_OUTPUT_MISSING")
    result = {
        "status": "PASS",
        "baseSha256": BASE_SHA,
        "patchSha256": PATCH_SHA,
        "output": str(output_zip),
        "outputSha256": sha256(output_zip),
    }
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
