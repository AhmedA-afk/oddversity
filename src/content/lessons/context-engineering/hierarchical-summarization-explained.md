---
title: "Hierarchical Summarization"
track: "context-engineering"
status: live
summary: "Summarize in layers - turn, segment, session - so an agent can zoom into detail on demand instead of living with one flattening summary."
duration: "6 min read"
---

A single rolling summary has a ceiling: keep folding new turns into it and you eventually have to re-summarize the summary, and every re-summarization pass sands a little more detail off whatever came before. Hierarchical summarization avoids that by never touching the same text twice — it builds a small tree of summaries at different zoom levels, and only ever adds a new layer on top of the one below it.

## What it is

Instead of one summary that grows and periodically gets re-compressed, you maintain several tiers, each summarizing the tier directly beneath it rather than the raw transcript:

- **Turn-level.** A single exchange, or a tight cluster of them, gets reduced to a sentence: "user asked for the auth flow to support SSO; agent implemented it via the existing OAuth provider."
- **Segment-level.** Once enough turn-summaries accumulate, they roll up into a paragraph describing what a whole stretch of work accomplished — a coding session's morning, a support ticket's first exchange, a research pass over one source.
- **Session-level.** Across many segments, segment-summaries roll up into a standing account of what the session did overall: the decisions made, the state reached, what's still open.

Each layer is written once and, critically, is never rewritten as new turns arrive — only the layer above it changes. A turn-summary from an hour ago is untouched; the segment-summary above it just adds a new sentence when the next batch of turns rolls up.

## The mental model

Think of it as a pyramid built bottom-up, where each stone is set once and never moved. Naive flat compaction is the opposite: one shrinking summary that gets re-poured every time it grows past budget, meaning yesterday's already-compressed sentence gets folded into an even more compressed sentence today, and the day after that. Information touched twice degrades twice; information touched three times degrades three times. A hierarchy caps every fact's compression at exactly one pass — the pass where it moved from its current layer to the layer above.

This is also why a hierarchy supports variable-resolution recall in a way one flat summary can't. An agent orienting itself at the start of a task can read the session-level digest for the big picture, then selectively expand into segment-level detail for the part that's actually relevant right now, and only pull turn-level (or raw) detail for the last handful of exchanges. That's the same instinct as [structured context injection](/learn/context-engineering/structured-context-injection): load the coarse layer by default, and fetch finer detail only when something specific demands it, rather than carrying maximum resolution everywhere out of habit.

## Why it works this way

The reason layering beats flattening comes back to where value concentrates in a long history. Recent work is disproportionately likely to be referenced precisely — the file just edited, the error just seen — so it should stay closest to verbatim. Older work is disproportionately likely to be needed only as orientation — "what was this session even about" — so a coarser digest genuinely loses little that matters. A hierarchy matches resolution to actual need automatically, as a side effect of its structure: newest material sits at turn-level (or fully raw), a bit older sits at segment-level, oldest sits at session-level, and nothing has to guess in advance exactly how much detail any given fact deserves.

It also changes what "losing a detail" costs. In flat compaction, a detail dropped during re-summarization is gone with no trace of where it went missing. In a hierarchy, if a session-level digest is too coarse for a question that's just come up, the agent (or the harness) can deliberately expand into the segment-summaries beneath it, and from there into turn-summaries, to look for the missing piece — the same detail-on-demand pattern behind [just-in-time context loading](/learn/context-engineering/just-in-time-context-loading).

## A concrete example

Say a coding-agent session ran three segments: setting up a project, implementing an API, and writing tests. The tree looks like this:

```text
SESSION SUMMARY
"Built and tested a REST API for a bookmarking service. Chose Postgres for
storage (transactional guarantees for tag updates). Auth deferred to a
follow-up session."
├── Segment: Setup
│   "Scaffolded FastAPI project, configured Postgres, wrote the schema."
│   ├── Turn 1-4: "Initialized repo, added FastAPI + SQLAlchemy deps."
│   └── Turn 5-9: "Wrote and applied the bookmarks/tags schema migration."
├── Segment: API implementation
│   "Implemented CRUD endpoints for bookmarks and tags."
│   ├── Turn 10-15: "Built POST/GET /bookmarks; validated with Pydantic."
│   └── Turn 16-22: "Built tag endpoints; handled the many-to-many join."
└── Segment: Testing
    "Wrote integration tests for all endpoints; all passing."
    └── Turn 23-28: "Added pytest fixtures for a test-scoped DB."
```

If a new turn asks "why did we end up with a join table for tags instead of an array column," the agent doesn't need the whole raw transcript — it expands one branch, from the session summary down into the "API implementation" segment and, if that's still not specific enough, into turns 16 through 22, where the actual reasoning lives. Everything outside that branch stays collapsed.

## Where it breaks down

The failure mode is a detail that mattered later but looked unimportant at the moment it got compressed into its first summary layer. If a turn-summary drops something because it read as minor at the time, that detail is genuinely gone — there's no raw transcript sitting around to re-derive it from once the underlying turns have rolled out of active memory. Two mitigations are standard: keep the raw log in cold storage (never in the active context, purely so a summary could in principle be regenerated or audited), and bias every layer's summarization prompt toward over-including anything that resembles a decision, constraint, or commitment rather than writing a narrative recap — exactly the survival list from [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep). This also connects to [structured memory stores](/learn/context-engineering/structured-memory-stores-compared): once a fact is important enough to be session-level or project-level, pulling it into a queryable store instead of leaving it as prose means it can be corrected or retired later, instead of being stuck exactly as whichever summarization pass first froze it.

The practical rhythm most agent harnesses converge on: keep the last few turns raw, roll older turns into a segment digest on a threshold trigger (see [building a rolling summarizer](/learn/context-engineering/building-a-rolling-summarizer)), and periodically fold segment digests into a small set of durable session or project facts — the same shape as [memory vs. state](/learn/context-engineering/memory-vs-state-distinction), just applied recursively instead of as one flat compression step.

**Related:** [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction-deep), [Building a Rolling Summarizer](/learn/context-engineering/building-a-rolling-summarizer), [Structured Memory Stores](/learn/context-engineering/structured-memory-stores-compared), [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading)
