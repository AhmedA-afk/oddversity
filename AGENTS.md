# AGENTS.md — Oddversity

Rules for any agent working in this repository. These are not preferences.

Full design reasoning lives in [`docs/visual-system.md`](./docs/visual-system.md).
This file is the enforceable subset.

---

## Image generation — absolute rules

Applies to every use of `generate_image`.

### Never generate

1. **Anything that asserts a fact.** No pipeline diagrams, no architecture
   diagrams, no flowcharts, no charts, no graphs. Those are hand-authored SVG.
   A generated image may only set a mood.
2. **Text of any kind inside the image.** No labels, no captions, no numbers, no
   code, no formulae, no file names. Text rendering is unreliable and invented
   text is worse than no image.
3. **People, faces or hands.** They date badly and read as stock photography.
4. **Anything a reader could mistake for data.** Our editorial policy forbids
   publishing an unsourced figure. A decorative matrix of made-up numbers
   violates that policy exactly as much as a fabricated statistic in prose.

### Always

5. **Light ground.** Paper `#FBFAF8` background. Indigo `#3B54A3` as the *fill*
   of shapes. Dark-filled shapes snap to black in post-processing and wreck the
   composition.
6. **Two colours plus neutrals.** Indigo `#3B54A3` and brass `#A8741C`. Nothing
   else — no teal, no green, no purple, no accent "for balance".
7. **Flat vector.** No gradients, no shadows, no 3D, no texture, no photorealism,
   no lens effects, no glow.
8. **Generous empty space.** The image sits beside body type and must not
   compete with it.
9. **Square, 1024×1024.**

### Mechanics

10. **Do not run shell commands.** Headless `agy -p` cannot prompt for a
    `command` permission, so any shell call auto-denies and the whole turn is
    lost. Generate the image and stop.
11. Output lands in `~/.gemini/antigravity-cli/brain/<session>/`. The pipeline
    script collects it; do not attempt to move or copy it yourself.

---

## Content rules

12. **Never invent a number, a benchmark, a date or a citation.** If a claim
    needs a source and there isn't one, hedge the sentence or cut it. This is
    the site's single load-bearing editorial commitment.
13. **Lesson `summary` frontmatter is the page's meta description.** One
    complete sentence describing the lesson, in the reader's terms. It is not a
    note about the authoring task — "Wrote the CONCEPT page for…" is a bug.
14. **A lesson file without a node in `src/data/curriculum.ts` is invisible.**
    It builds a route and appears in no navigation. Register every new page.
15. Slug suffixes are load-bearing: `-cheatsheet`, `-compared`,
    `-worked-example`, `-common-mistakes`, `-quiz` are collected automatically
    by `/reference`. Use them deliberately.

---

## Code rules

16. **Astro scoped styles do not reach runtime-created elements.** Anything
    built by JavaScript needs global CSS, or its styling silently does nothing.
17. **Define every colour in all three theme states** — bare `:root`,
    `:root[data-theme="dark"]`, and the `prefers-color-scheme` block. A colour
    defined in only one renders the wrong theme's ink on the other's ground.
18. **`padding: Npx 0`** on an element that also carries `.container` zeroes the
    horizontal gutter, because scoped styles outrank it. Use `padding-block`.
19. `_headers` and `_redirects` are Cloudflare/Netlify conventions. **Vercel
    ignores them** — `vercel.json` is the active config. Keep them in step.
20. Run `npm run check:links` before considering any content change finished.
