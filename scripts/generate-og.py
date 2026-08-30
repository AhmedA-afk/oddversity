#!/usr/bin/env python3
"""Generate a social card per track, guide and article.

    python3 scripts/generate-og.py

Writes public/og/<kind>-<slug>.png and rewrites src/data/og-images.ts with the
set of keys that exist, so Layout can fall back to the generic card for
anything not yet generated rather than emitting a broken image URL.

Re-run after adding a track, guide or post.
"""
import json
import pathlib
import re

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og"
CONTENT = ROOT / "src" / "content"

W, H = 1200, 630
PAPER = "#FBFAF8"
INK = "#1B1A18"
MUTED = "#5D5A52"
COOL = "#3B54A3"      # --brand-cool
WARM = "#A8741C"      # --brand-warm
RULE = "#E4E2DC"

SERIF_BOLD = "/usr/share/fonts/truetype/noto/NotoSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf"
MONO = "/usr/share/fonts/truetype/noto/NotoSansMono-Medium.ttf"

MARGIN = 96


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def wrap(draw, text: str, f, max_width: int, max_lines: int) -> list[str]:
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=f) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = word
        if len(lines) == max_lines:
            break
    if current and len(lines) < max_lines:
        lines.append(current)
    if len(lines) == max_lines and len(" ".join(lines)) < len(text):
        while lines and draw.textlength(lines[-1] + "…", font=f) > max_width:
            lines[-1] = lines[-1].rsplit(" ", 1)[0]
        lines[-1] += "…"
    return lines


def card(eyebrow: str, title: str, meta: str) -> Image.Image:
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle([48, 48, W - 48, H - 48], outline=RULE, width=1)

    # Wordmark: two-tone tick, then the two words in their own colours —
    # the same construction as the site header, so a shared card and the site
    # read as one thing.
    d.rectangle([MARGIN, 100, MARGIN + 8, 119], fill=WARM)
    d.rectangle([MARGIN, 119, MARGIN + 8, 138], fill=COOL)
    wm = font(SERIF_BOLD, 38)
    # One word, two colours — no gap between the halves, so it reads as a
    # single word built from two parts rather than as two words.
    x = MARGIN + 24
    d.text((x, 97), "Odd", font=wm, fill=WARM)
    x += d.textlength("Odd", font=wm)
    d.text((x, 97), "versity", font=wm, fill=COOL)

    d.text((MARGIN, 196), " ".join(eyebrow.upper()), font=font(MONO, 17), fill=MUTED)

    # Title sizes down before it wraps to a fourth line — three lines is the
    # most that stays readable in a timeline preview.
    size = 66
    while size > 40:
        f = font(SERIF_BOLD, size)
        lines = wrap(d, title, f, W - MARGIN * 2, 3)
        if len(lines) <= 2 or size <= 52:
            break
        size -= 4
    f = font(SERIF_BOLD, size)
    lines = wrap(d, title, f, W - MARGIN * 2, 3)

    y = 244
    for line in lines:
        d.text((MARGIN, y), line, font=f, fill=INK)
        y += int(size * 1.16)

    d.line([MARGIN, H - 150, W - MARGIN, H - 150], fill=RULE, width=1)
    if meta:
        d.text((MARGIN, H - 128), meta, font=font(SERIF, 27), fill=MUTED)
    d.text((MARGIN, H - 86), "oddversity.com", font=font(MONO, 22), fill=COOL)
    return img


def frontmatter(path: pathlib.Path) -> dict:
    text = path.read_text()
    match = re.match(r"^---\n(.*?)\n---", text, re.S)
    if not match:
        return {}
    data = {}
    for line in match.group(1).split("\n"):
        kv = re.match(r'^(\w+):\s*"?(.*?)"?\s*$', line)
        if kv:
            data[kv.group(1)] = kv.group(2)
    return data


def load_tracks() -> list[dict]:
    """Read the track list out of curriculum.ts without executing TypeScript."""
    src = (ROOT / "src" / "data" / "curriculum.ts").read_text()
    marker = "const unsortedTracks: Track[] = "
    # Start at the assignment's own bracket, not the one in the `Track[]` type.
    start = src.index("[", src.index(marker) + len(marker))
    depth, i = 0, start
    while i < len(src):
        if src[i] == "[":
            depth += 1
        elif src[i] == "]":
            depth -= 1
            if depth == 0:
                break
        i += 1
    return json.loads(src[start : i + 1])


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.png"):
        old.unlink()

    keys: list[str] = []
    lessons_root = CONTENT / "lessons"

    for track in load_tracks():
        count = len(list((lessons_root / track["id"]).glob("**/*.md*"))) if (lessons_root / track["id"]).exists() else 0
        meta = f"{count} free lessons · {track['group']}" if count else track["group"]
        card("Track", track["name"], meta).save(OUT / f"track-{track['id']}.png", optimize=True)
        keys.append(f"track-{track['id']}")

    for path in sorted((CONTENT / "guides").glob("*.md*")):
        fm = frontmatter(path)
        meta = " · ".join(x for x in [fm.get("duration"), fm.get("level")] if x)
        card("Guide", fm.get("title", path.stem), meta).save(OUT / f"guide-{path.stem}.png", optimize=True)
        keys.append(f"guide-{path.stem}")

    for path in sorted((CONTENT / "blog").glob("*.md*")):
        fm = frontmatter(path)
        card("Article", fm.get("title", path.stem), fm.get("published", "")).save(
            OUT / f"blog-{path.stem}.png", optimize=True
        )
        keys.append(f"blog-{path.stem}")

    for slug, eyebrow, title, meta in [
        ("page-learn", "Curriculum", "Everything, in the order it makes sense.", "Every track, free and open"),
        ("page-guides", "Guides", "One task, start to finish.", "End-to-end walkthroughs with runnable code"),
        ("page-reference", "Reference", "The pages you come back to.", "Cheatsheets, comparisons and clinics"),
        ("page-glossary", "Glossary", "The vocabulary, defined plainly.", "Terms an AI engineer actually uses"),
        ("page-practice", "Practice", "Turn recognition into recall.", "Quizzes that explain the wrong answers"),
        ("page-interview", "Interview", "Questions worth preparing for.", "Worked answers, linked to the lessons"),
    ]:
        card(eyebrow, title, meta).save(OUT / f"{slug}.png", optimize=True)
        keys.append(slug)

    ts = [
        "// Generated by scripts/generate-og.py. Do not edit.",
        "//",
        "// Keys of the social cards that exist on disk. Layout falls back to the",
        "// generic /og.png for anything absent, so a new page never ships a",
        "// broken image URL just because the generator has not been re-run.",
        "export const ogImages = new Set<string>([",
        *[f"  '{k}'," for k in sorted(keys)],
        "]);",
        "",
        "export const ogImage = (key: string) =>",
        "  ogImages.has(key) ? `/og/${key}.png` : '/og.png';",
        "",
    ]
    (ROOT / "src" / "data" / "og-images.ts").write_text("\n".join(ts))

    total = sum(f.stat().st_size for f in OUT.glob("*.png"))
    print(f"{len(keys)} cards, {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
