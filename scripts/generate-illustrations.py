#!/usr/bin/env python3
"""Generate the role-page illustrations through Antigravity, then normalise them.

    python3 scripts/generate-illustrations.py            # missing only
    python3 scripts/generate-illustrations.py --only role-designer
    python3 scripts/generate-illustrations.py --force    # regenerate everything

Rules live in docs/visual-system.md and AGENTS.md. The short version: generated
images may only evoke, never assert, and they are confined to /roles/*.

Three things this script exists to handle:

1. Headless `agy -p` cannot prompt for a `command` permission, so any shell call
   inside the agent turn auto-denies and the whole turn is lost. The prompt
   therefore forbids shell use, and we do the file handling ourselves.

2. Output lands in ~/.gemini/antigravity-cli/brain/<session>/, not in the
   working directory. We diff the tree before and after to find what appeared.

3. A generative model cannot hit an exact hex value — our first test came back
   with an unrequested teal. Every image is quantised onto the seven brand
   colours before it ships, which makes the palette exact by construction.

What this cannot fix is composition. Review every image before shipping.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import shutil
import subprocess
import sys
import time

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts" / "images" / "manifest.json"
PREAMBLE = ROOT / "scripts" / "images" / "preamble.txt"
OUT = ROOT / "public" / "img" / "roles"
BRAIN = pathlib.Path.home() / ".gemini" / "antigravity-cli" / "brain"

# Exactly the site tokens. Nothing else may appear in a shipped image.
PALETTE = [
    (251, 250, 248),  # --bg        paper
    (244, 243, 239),  # --paper     surface
    (228, 226, 220),  # --rule
    (27, 26, 24),     # --text      ink
    (93, 90, 82),     # --muted
    (59, 84, 163),    # --brand-cool   indigo
    (168, 116, 28),   # --brand-warm   brass
]

SIZE = 1024
TIMEOUT = 300


def snapshot() -> set[pathlib.Path]:
    if not BRAIN.exists():
        return set()
    return {
        p for p in BRAIN.rglob("*")
        if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
    }


def run_agent(prompt: str) -> pathlib.Path | None:
    """Run one generation turn and return whatever new image appeared."""
    before = snapshot()
    try:
        subprocess.run(
            ["agy", "-p", prompt],
            cwd=str(pathlib.Path.home()),   # a trusted workspace
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        return None
    time.sleep(1)  # the agent writes the file after the turn reports done
    new = snapshot() - before
    if not new:
        return None
    return max(new, key=lambda p: p.stat().st_mtime)


def normalise(src: pathlib.Path, dest: pathlib.Path) -> None:
    """Square-crop, resize, force onto the brand palette, save as WebP."""
    img = Image.open(src).convert("RGB")

    side = min(img.size)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side)).resize(
        (SIZE, SIZE), Image.LANCZOS
    )

    palette_img = Image.new("P", (1, 1))
    flat = [c for rgb in PALETTE for c in rgb]
    palette_img.putpalette(flat + [0] * (768 - len(flat)))
    # No dithering — on flat art it produces speckle, which is precisely what
    # would make a generated image read as cheap.
    img = img.quantize(palette=palette_img, dither=Image.Dither.NONE).convert("RGB")

    dest.parent.mkdir(parents=True, exist_ok=True)
    # Lossless: the whole point of the quantise step is an exact palette, and
    # lossy WebP smears it straight back into thousands of colours. Flat art
    # compresses extremely well losslessly, so this costs almost nothing.
    img.save(dest, "WEBP", lossless=True, quality=100, method=6)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="generate a single id from the manifest")
    parser.add_argument("--force", action="store_true", help="regenerate existing images")
    args = parser.parse_args()

    if not shutil.which("agy"):
        print("agy not found on PATH — install the Antigravity CLI first.", file=sys.stderr)
        return 1

    preamble = PREAMBLE.read_text().strip()
    images = json.loads(MANIFEST.read_text())["images"]
    if args.only:
        images = [i for i in images if i["id"] == args.only]
        if not images:
            print(f"no manifest entry with id {args.only!r}", file=sys.stderr)
            return 1

    made, skipped, failed = 0, 0, []
    for item in images:
        dest = OUT / f"{item['id']}.webp"
        if dest.exists() and not args.force:
            skipped += 1
            continue

        print(f"  generating {item['id']} …", flush=True)
        prompt = (
            "Use your generate_image tool to create exactly one image. "
            "Do not run any shell commands.\n\n"
            f"{preamble} {item['subject']}"
        )
        produced = run_agent(prompt)
        if not produced:
            failed.append(item["id"])
            print(f"    no image returned for {item['id']}")
            continue

        normalise(produced, dest)
        kb = dest.stat().st_size / 1024
        print(f"    → {dest.relative_to(ROOT)}  ({kb:.0f} KB)")
        made += 1

    print(f"\ngenerated {made}, skipped {skipped}, failed {len(failed)}")
    if failed:
        print("failed:", ", ".join(failed))
    print("\nReview every image before shipping. The palette is guaranteed;")
    print("the composition is not.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
