# Visual system

How anything visual on Oddversity is made, and by which of the two production
paths. Read this before generating a single image.

---

## 1. The one rule that decides everything

**A diagram asserts something. An illustration evokes something.**

If a picture makes a claim a reader could act on — a pipeline order, a failure
path, an architecture — it is a **diagram** and it is hand-authored SVG.

If a picture only sets a mood at the top of a page, it is an **illustration**
and it may be generated.

This split is not stylistic. A generative model invents plausible detail: our
one test image came back with a decorative numeric matrix inside a box labelled
EMBED. Those numbers mean nothing. On a site whose stated editorial policy is
that no unsourced figure gets published, a diagram containing invented data is a
liability dressed as an asset.

Generated images therefore **never** contain: numbers, axis labels, code,
formulae, file names, arrows implying a specific order, or any word a reader
might take as a technical claim.

---

## 2. Palette

Identical to the site tokens. Nothing else is permitted.

| Role | Hex | Token |
|---|---|---|
| Paper | `#FBFAF8` | `--bg` |
| Surface | `#F4F3EF` | `--paper` |
| Rule | `#E4E2DC` | `--rule` |
| Ink | `#1B1A18` | `--text` |
| Muted | `#5D5A52` | `--muted` |
| **Indigo** | `#3B54A3` | `--brand-cool` |
| **Brass** | `#A8741C` | `--brand-warm` |

### The two brand colours carry meaning, not decoration

- **Indigo is what happens.** Components, the working path, normal flow.
- **Brass is what breaks, or what you must notice.** Failure paths, the boundary
  that matters, the step people get wrong.

This is the identity. It maps the palette onto the site's editorial voice, which
leads with the failure rather than the happy path. A reader who has seen three
diagrams knows without being told that the brass element is the one to look at.

Never use brass as an accent "for balance". If nothing in the diagram can fail,
nothing in it is brass.

---

## 3. Diagram grammar

Every diagram, without exception.

**Form**
- Flat. No gradients, no shadows, no 3D, no texture, no perspective.
- Rectangles, `6px` corner radius, `1.5px` stroke.
- Orthogonal layout — horizontal flow or vertical stack. No diagonals, no radial.

**Density**
- **Seven primary elements maximum.** If it needs more, it is two diagrams.
- One idea per diagram. A diagram that needs a paragraph to introduce it is
  doing the paragraph's job badly.

**Labels**
- Component names: IBM Plex Mono, uppercase, `+0.08em` tracking.
- Annotations: IBM Plex Sans, sentence case.
- **One to three words per label.** Never a sentence inside a shape.
- No icons inside shapes. Words only. An icon is a second thing to decode.

**Lines**
- Solid `1.5px` — the working path.
- Dashed `1.5px 4px` — a failure path, or an optional step.
- Arrowheads only where direction is genuinely load-bearing.

**Caption**
- Every diagram carries one sentence beneath it saying what it shows.
- The diagram never carries information that is not also in the prose. It is a
  second way in, never the only way in.

**Honesty**
- Nothing invented. No placeholder numbers, no fake data, no decorative code.

---

## 4. Theme

Diagrams are inline SVG and read the site's CSS custom properties:

```svg
<rect fill="var(--paper)" stroke="var(--rule)" />
<text fill="var(--text)">CHUNK</text>
<path stroke="var(--brand-warm)" stroke-dasharray="1.5 4" />
```

They adapt to light and dark automatically. **This is the strongest single
argument for SVG over generated raster**: every other visual on this site
responds to the reader's theme, and a JPEG cannot. A diagram that looks correct
on paper-white sits in a bright rectangle on the dark theme.

Accessibility: every SVG carries `<title>` and, where the diagram is non-obvious,
`<desc>`. `role="img"` on the root.

---

## 5. Where illustration is allowed

The site's identity is typographic restraint. Decorative imagery is not free —
it costs the thing that makes the design distinctive. Illustration is permitted
in exactly one place today:

| Surface | Why it earns its place |
|---|---|
| **Role landing pages** (`/roles/*`) | A non-technical reader arriving at "AI for designers" gets a warm human signal that type alone does not carry. Eleven pages, one image each. |

Explicitly **not** used: lesson bodies, track pages, guides, the home page,
reference pages. Those are type-led and stay that way.

Social cards are generated programmatically by `scripts/generate-og.py` and stay
that way — deterministic, exact, and regenerated from content on every change.

---

## 6. Illustration grammar

For the generated set only.

- **Light ground.** Paper background, indigo as the *fill*, ink used sparingly.
  Dark-filled shapes snap to black in post-processing and change the composition.
- Flat vector, editorial, geometric. Two colours plus neutrals.
- Abstract or object-based. **No people, no faces, no hands** — they date badly,
  raise representation questions nobody asked for, and read as stock.
- No text of any kind inside the image.
- Generous empty space. The image sits beside type and must not shout over it.
- Square, 1024×1024, delivered as WebP.

Every generated image is forced onto the palette in post
(`scripts/generate-illustrations.py`). That guarantees the colour is exact even
though the model cannot hit a hex value — but it does not guarantee the
composition, so images are reviewed before they ship.

---

## 7. Production paths

| | Diagram | Illustration |
|---|---|---|
| Made by | Hand-authored SVG | Antigravity `generate_image`, then post-processed |
| Lives in | Inline in the lesson, or `src/components/diagrams/` | `public/img/` |
| Format | SVG | WebP |
| Theme-aware | Yes | No — so light-ground only |
| May assert a fact | Yes | **Never** |
| Reviewed | On authoring | Before shipping, every time |
