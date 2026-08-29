# Fieldguide

A free, hands-on learning platform for the agentic-AI era. A complete, structured
path from your first prompt to production agents — built to be studied end to end.

Built with **Astro + MDX**. Content-first, fast, server-rendered.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static build → dist/
npm run preview    # serve the build locally
```

## Structure

```
src/
  components/      Layout, TopBar, Footer, SkillTree
  data/
    curriculum.ts  the track/lesson MAP + node states (live/curated/coming) + role tracks
  content/
    lessons/       MDX lessons, grouped by track folder (id = <track>/<slug>)
  content.config.ts   lesson collection schema
  pages/
    index.astro                    Home
    learn/index.astro              The Skill Tree (the whole map)
    learn/[track]/index.astro      Track page (lesson list)
    learn/[track]/[lesson].astro   Lesson page (3-column: nav · content · TOC)
  styles/global.css                design tokens (light + dark) + base
```

## Add a lesson

1. Create `src/content/lessons/<track>/<slug>.mdx` with frontmatter:
   ```yaml
   ---
   title: Your lesson title
   track: mcp
   status: live        # live | curated | coming
   summary: One-line summary.
   duration: 12 min read
   ---
   ```
2. Add a node in `src/data/curriculum.ts` under that track with a matching `slug`.
   Nodes without a `slug` render on the tree/track page but don't link anywhere yet.

## Design

The visual system (warm-paper palette, ink-indigo accent, Source Serif 4 / IBM Plex
Sans / IBM Plex Mono, the Skill Tree, node states) is lifted from the approved Claude
Design handoff. Full IA and the design brief live in
`../get_money_xD/fieldguide/` (`IA-and-UI-plan.md`, `claude-design-prompt.md`).

**Scope note:** this is a pure curriculum/learning product. The "StillWorks"
freshness-verification concept is intentionally **not** shipped — node states here
mean curriculum *availability*, not code freshness.

## Status

First navigable skeleton: Home · Skill Tree · Track pages · Lesson pages, with real
sample lessons in AI Foundations, Prompt Engineering, and MCP. Search, accounts,
hands-on labs, role/reference/benchmark/stats pages, and full content are next.
