# Codex workstream — Fieldguide

You are building a parallel workstream on **Fieldguide**, an Astro + MDX learning platform
for the agentic-AI era. A separate agent owns the curriculum/lessons; **you own everything
below.** Work autonomously, keep the build green, and stay additive.

## Context you must respect
- **Stack:** Astro 5 + MDX (`npm run build` must pass; `npm run dev` at :4321). Node/npm installed.
- **Design system:** reuse it, do NOT invent new colors. Tokens are CSS variables in
  `src/styles/global.css` (`--bg --paper --paper-2 --rule --chip-bg --text --muted --faint
  --accent --accent-contrast --code-bg`, light + dark). Fonts: **Source Serif 4** (headings),
  **IBM Plex Sans** (body/UI), **IBM Plex Mono** (mono/code). Import `src/components/Layout.astro`
  for every page; match its type scale, spacing, and the existing pages' feel.
- **Voice:** practitioner, honest, current, warm — no hype, no filler, no fabricated numbers.
- **Scope:** pure curriculum/learning product. There is **no "StillWorks" / freshness-badge**
  concept anywhere — do not add one.

## Ownership rules (critical — a parallel agent is editing this repo)
- **DO NOT EDIT:** `src/data/curriculum.ts`, `src/data/roles.ts`, anything under
  `src/content/lessons/`, and the existing page templates `src/pages/index.astro`,
  `src/pages/learn/**`, `src/pages/roles/**`, and `src/components/SkillTree.astro`. These are owned elsewhere.
- **YOU MAY EDIT:** `src/components/Layout.astro` (SEO head), `src/components/TopBar.astro` &
  `src/components/Footer.astro` (add nav/footer links), `src/content.config.ts` (add collections),
  `src/styles/global.css` (APPEND only — never rewrite existing rules), `astro.config.mjs`,
  `package.json`, and any NEW files/pages/components/content you create.
- **MDX safety:** all code/JSON/braces/angle-brackets go inside fenced code blocks; never a raw
  `{ } < >` in prose. Quote frontmatter strings.
- After each deliverable, run `npm run build` and fix before moving on. Finish with a green build.

## Deliverables (in priority order — do as many as you can, well)

1. **SEO/GEO foundation** (highest leverage). In `Layout.astro`: per-page `<title>`/description,
   canonical, Open Graph + Twitter Card meta, `theme-color`. Add **JSON-LD**: `WebSite` +
   `Organization` sitewide; `LearningResource`/`Article` + `BreadcrumbList` on content pages
   (accept optional props so pages can pass type/breadcrumbs). Create `public/robots.txt`
   (allow all, explicitly welcome `GPTBot`, `Google-Extended`, `PerplexityBot`, `ClaudeBot`,
   `CCBot`; link the sitemap) and `public/llms.txt` (a concise, structured index of the site and
   its tracks for AI engines). Confirm the sitemap builds.

2. **Interview Questions** — a `questions` content collection + `/interview` index and
   per-topic pages. Seed 6–8 topics (LLM basics, prompt engineering, RAG, agents, MCP,
   evals, system design for AI) with 8–12 real, well-answered Q&A each (research-backed).
   Cross-link answers to relevant `/learn/...` lessons where natural.

3. **Hands-on MCQs / quizzes** — an interactive quiz (Astro + a small client-side script, no
   backend): pick an answer → reveal correct + explanation → score. A `/practice` index +
   per-track quiz pages. Seed quizzes for 4–6 tracks (8–10 MCQs each) with explanations.

4. **Scenarios / case studies** — `/scenarios`: 6 realistic "you're building X — what do you
   do?" walkthroughs with guided reasoning. MDX collection.

5. **Blog** — a `blog` MDX collection + `/blog` index + 3–4 genuinely useful posts (e.g. a
   launch note, "how to actually learn AI in 2026", a myth-busting piece). Real content.

6. **Statistics / market pages** — `/stats`: the AI-skills market, demand, and earning data,
   presented honestly with sources. You may read sourced figures from
   `/home/zenith/Personal-Work/get_money_xD/agentic-academy/codex-stats-brief.md` and cite them.
   Frame it as "why learn AI / what you can do & earn," segmented where useful.

7. **Ad layer** — a reusable `<AdSlot>` component (tasteful placeholder labeled "Sponsored",
   using the design tokens, below the fold). Place it ONLY on blog post templates and the stats
   page — **NEVER on lesson/track/learn/role pages** (ad JS must not tax those). Make it trivial
   to swap in a real network later; document placement in a comment.

8. **Nav** — add the new sections to `TopBar.astro` and `Footer.astro` where they fit
   (Interview · Practice · Blog · Stats), matching the existing nav style.

9. **STRATEGY.md** — reason concretely and honestly about how Fieldguide reaches its target
   sooner: the GEO/SEO tactics that compound, which content types drive discovery, distribution
   channels, the realistic revenue path (sponsorship/affiliate/ads at what traffic), and the
   highest-ROI next moves. Grounded, specific, no hype.

End by running `npm run build` (must pass) and printing a short list of everything you created or changed.
