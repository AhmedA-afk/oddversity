#!/usr/bin/env python3
"""Generate the favicon and app-icon set from the brand mark.

    python3 scripts/generate-icons.py

The mark is a paper 'O' on the cool indigo, with a band of the warm brass along
the bottom — the same two-tone split as the wordmark's tick. A single round
letter was chosen because it holds its shape at 16px, which is the only size a
favicon is really judged at.

public/favicon.svg is maintained by hand alongside this.
"""
import pathlib

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public"

COOL = (59, 84, 163)        # --brand-cool, ink indigo
WARM = (168, 116, 28)       # --brand-warm, brass
PAPER = (251, 250, 248)     # --bg
SERIF = "/usr/share/fonts/truetype/noto/NotoSerif-Bold.ttf"

BAND = 0.26                 # brass band height, as a fraction of the tile


def mark(size: int, radius_ratio: float = 0.22, bleed: bool = False) -> Image.Image:
    """Render at 8× and downsample, so the serif stems stay clean."""
    scale = 8
    s = size * scale
    radius = 0 if bleed else int(s * radius_ratio)

    tile = Image.new("RGBA", (s, s), (*COOL, 255))
    ImageDraw.Draw(tile).rectangle([0, int(s * (1 - BAND)), s, s], fill=(*WARM, 255))

    # Round the corners by masking, so the band follows the tile's shape.
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=255)
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    img.paste(tile, (0, 0), mask)

    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(SERIF, int(s * 0.60))
    box = d.textbbox((0, 0), "O", font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    # Centre the E in the indigo field, not the whole tile.
    cy = s * (1 - BAND) / 2
    d.text(((s - w) / 2 - box[0], cy - h / 2 - box[1]), "O", font=font, fill=PAPER)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    (OUT / "icons").mkdir(parents=True, exist_ok=True)

    mark(16).save(OUT / "favicon-16.png")
    mark(32).save(OUT / "favicon-32.png")
    mark(32).save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    # iOS masks the corners itself, so ship a square with no transparency.
    mark(180, bleed=True).convert("RGB").save(OUT / "apple-touch-icon.png")

    for n in (192, 512):
        mark(n).save(OUT / "icons" / f"icon-{n}.png")
        mark(n, bleed=True).save(OUT / "icons" / f"maskable-{n}.png")

    print("icons written to public/")


if __name__ == "__main__":
    main()
