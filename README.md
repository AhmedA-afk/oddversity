# Oddversity

A free, hands-on learning platform for the agentic-AI era. A complete, structured
path from your first prompt to production agents — plus guides, quizzes, interview
prep, scenarios and a reference layer.

Built with **Astro + MDX**. Content-first, statically rendered, almost no client JS.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static build → dist/
npm run preview    # serve the build locally

npm run prelaunch  # regenerate social cards, build, fail on dead links
```

Asset generators (Python 3 + Pillow; `fontTools` for the font step):

```bash
npm run fonts      # re-download webfonts and recompute fallback metrics
npm run icons      # favicon, apple-touch-icon, PWA icons
npm run og         # per-page social cards
npm run assets     # all three

npm run illustrations   # role-page art via Antigravity (see below)
```

## Images

Two production paths, and the split is a rule rather than a preference —
[`docs/visual-system.md`](./docs/visual-system.md) has the reasoning:

- **Diagrams** are hand-authored inline SVG. They assert facts, so they must be
  exact, theme-aware and incapable of inventing content.
- **Illustrations** are generated through Antigravity and confined to
  `/roles/*`. They evoke, never assert: no text, no numbers, no people.

Generated images are quantised onto the seven brand colours before shipping, so
the palette is exact by construction even though the model cannot hit a hex
value. Composition is not guaranteed — review every image.

The hard rules an agent must follow are in [`AGENTS.md`](./AGENTS.md), which
Antigravity reads from the workspace root.

**Re-run `npm run og` after adding a track, guide or article** so the new page
gets its own social card. Anything missing falls back to the generic card.

Before going live, work through [`LAUNCH.md`](./LAUNCH.md). Everything a human
must supply — byline, social handles, contact address, analytics — lives in
`src/data/site.ts`, and every field left empty is omitted rather than rendered blank.

## Structure

```
src/
  components/
    Layout.astro        SEO + JSON-LD (Article / LearningResource / Course /
                        FAQPage / HowTo / ItemList / BreadcrumbList), OG tags
    TopBar.astro        nav, ⌘K search trigger, theme toggle, mobile menu
    Footer.astro  Quiz.astro  AdSlot.astro
  data/
    curriculum.ts       tracks, nodes, role tracks (AUTO-GENERATED)
    roles.ts            role paths
    quizzes.ts          quiz banks
    glossary.ts         glossary terms
  content/
    lessons/            MDX/MD lessons, grouped by track folder (id = <track>/<slug>)
    guides/             task-shaped end-to-end walkthroughs
    blog/  questions/  scenarios/
    ../content.config.ts   collection schemas
  pages/
    index.astro                    Home
    learn/index.astro              Curriculum catalog (grouped, filterable)
    learn/[track]/index.astro      Track page (contents, progress, Course schema)
    learn/[track]/[...lesson].astro  Lesson (3-column, filterable sidebar, progress)
    guides/                        Guides index + detail (HowTo schema)
    reference/index.astro          Cheatsheets, comparisons, worked examples, clinics
    reference/glossary.astro       Glossary (FAQPage schema)
    interview/  practice/  scenarios/  roles/  blog/
    about.astro  404.astro
    rss.xml.ts                     Feed for blog + guides
    llms.txt.ts                    Generated machine-readable site index
    search-index.json.ts           Static search index for ⌘K
  styles/global.css                design tokens (light + dark) + shared components
public/
  site.js             search, code-copy, progress, filters (no dependencies)
  robots.txt          16 answer-engine and training crawlers allowed explicitly
  _headers            CSP, HSTS, Permissions-Policy, cache policy per asset class
  _redirects          canonical host rule + stable short paths
  site.webmanifest    installability, shortcuts, theme colours
  humans.txt          .well-known/security.txt
  fonts/              self-hosted woff2, latin subsets only
  icons/              PWA icons, including maskable variants
  og/                 47 per-page social cards
scripts/
  fetch-fonts.py      download webfonts from Google and self-host them
  font-fallbacks.py   metric-matched fallback faces (no layout shift on swap)
  generate-icons.py   favicon and app-icon set from the brand mark
  generate-og.py      per-page social cards + availability manifest
  check-links.mjs     fail the build on any dead internal link
```

## Third parties

There are none in the page. Fonts are self-hosted, there is no analytics script
by default, no tag manager, no embeds and no external images. That claim is
load-bearing — `/privacy` states it — so keep it true.

## Add a lesson

1. Create `src/content/lessons/<track>/<slug>.mdx` with frontmatter:
   ```yaml
   ---
   title: Your lesson title
   track: mcp
   status: live
   summary: One complete sentence. This is the page's meta description.
   duration: 12 min read
   updated: 2026-08-30   # optional; emits dateModified
   ---
   ```
2. Add a node in `src/data/curriculum.ts` under that track with a matching `slug`.
   **A file without a node still builds a route but is invisible in navigation.**

Slug suffixes are meaningful — `-cheatsheet`, `-compared`, `-worked-example`,
`-common-mistakes` and `-quiz` are picked up automatically by `/reference`.

## Add a guide

`src/content/guides/<slug>.md`. The `steps` array becomes HowTo structured data and
the "what you'll do" block; `question` becomes the FAQ entry and the italic subtitle;
`related` links to lesson paths.

## Client behaviour

`public/site.js` is the whole runtime, dependency-free: ⌘K search over a build-time
JSON index, copy buttons on code blocks, lesson progress in `localStorage` (per-track
meters and "pick up where you left off"), and the sidebar/catalog filters. Everything
degrades to plain HTML without it.

## Design

Warm-paper palette, ink-indigo accent, Source Serif 4 / IBM Plex Sans / IBM Plex Mono.
Tokens are CSS variables in `src/styles/global.css` (light + dark). Full IA and design
brief live in `../get_money_xD/oddversity/`.

**Scope note:** this is a pure curriculum/learning product. The "StillWorks"
freshness-verification concept is intentionally **not** shipped.
