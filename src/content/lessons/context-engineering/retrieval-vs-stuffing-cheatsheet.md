---
title: "Retrieval vs Stuffing Cheatsheet"
track: "context-engineering"
status: live
summary: "A decision table across corpus size, cross-references, latency, and update frequency, plus a quick chooser flow for stuff / retrieve / JIT."
duration: "6 min read"
---

Pull this up when you're deciding, right now, whether a knowledge source belongs stuffed, retrieved, or loaded just-in-time. It assumes you already know what each strategy is — [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision) and [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) are the explainers; this page is the reference you check mid-build.

## The decision table

| Factor | Favors stuffing | Favors retrieval | Favors JIT loading |
|---|---|---|---|
| Corpus size | Fits comfortably alongside conversation + reasoning room | Too large to fit at all | Large, but structured as discrete addressable items (files, tickets, records) |
| Cross-reference needs | High — answer depends on relating distant parts of the same document | Low — each query is answered by one or two independent chunks | Medium — agent can chase references itself, one fetch at a time |
| Latency budget | Generous, or a one-off deep-analysis call | Tight — needs the smallest possible context per call | Some round-trip tolerance — each fetch costs a turn |
| Update frequency | Rarely changes, or changes wholesale each time | Changes often, piecemeal (some sources update, most don't) | Changes often, and only what's touched needs to be current |
| Call volume against this source | Low — cost of full stuffing is paid rarely | High — full stuffing cost would be paid on every call | Variable — cost scales with what's actually used per task |
| Task shape | Whole-document synthesis, "does X hold across the whole thing" | Point lookups, "what does the policy say about X" | Open-ended exploration, "find what's relevant, however many hops it takes" |

No single row decides it alone — weigh all six against the source you're actually working with. A corpus that's small but changes every call (row 4) can still lean toward stuffing if it fits (row 1); a corpus that fits today but grows fast (row 1 will flip) is worth building for retrieval before it has to.

## Start here, then measure

- **Default for a stable, single-document knowledge source under roughly 20K tokens:** stuff it. No retrieval infrastructure earns its cost at this size — see [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision).
- **Default for a knowledge base of independent, growing records (tickets, articles, catalog entries):** retrieve — embed, index, rank, and inject only the top matches per [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline).
- **Default for an agent exploring a large, structured space it doesn't know the shape of yet (a codebase, a file tree, a document set with unknown cross-links):** JIT — an index in context, a fetch tool, hydrate on demand, per [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader).
- **Default retrieval `top_k`, then measure:** start around 5, rerank before injecting, and raise only if measured answer quality improves past that — not because a bigger number feels safer. [Over-Retrieval and Over-Stuffing](/learn/context-engineering/over-retrieval-and-stuffing-mistakes) covers what happens when this default gets ignored.
- **Default hydration/tool-exposure trigger:** below ~15–20 tools or documents, don't bother phasing — flat registration is cheap enough. Above that, phase it.

## The pointer-not-payload rule

Whichever strategy you pick, the same rule governs how content moves once it's fetched: **pass a reference, not the content, until the content is actually needed.** A plan step, a tool result, or a handoff between agents should carry an ID, a path, or a URL — `artifact://report/3` — rather than the full text it points to. This is true inside a single agent's own reasoning (don't re-paste a document you already have a handle for) and doubly true across a multi-agent handoff, where inlining a full payload multiplies its cost by every agent downstream that touches the plan. See [Pass Pointers, Not Payloads](/learn/context-engineering/reference-by-pointer-not-value) for the full argument and where the pattern breaks (stale or dangling references).

## Quick chooser flow

```text
Does the whole source fit in the window with room to spare
for conversation + reasoning?
│
├─ YES ──▶ Does the task need cross-references or whole-document
│          synthesis (not just point lookups)?
│          │
│          ├─ YES ──▶ STUFF IT — retrieval would break the
│          │          relationships the task actually needs.
│          │
│          └─ NO ───▶ Either works; stuff it for simplicity
│                      unless call volume is high enough that
│                      the flat per-call cost adds up.
│
└─ NO ───▶ Is the source a set of independent, rankable items
           (chunks, tickets, articles) where a query maps to
           a handful of relevant ones?
           │
           ├─ YES ──▶ RETRIEVE — embed, rank, budget-filter,
           │          inject. See the retrieve-then-filter
           │          pipeline for the four stages.
           │
           └─ NO ───▶ Is it a structured space the agent can
                      navigate (files, records, linked docs)
                      rather than a flat rankable list?
                      │
                      ├─ YES ──▶ JIT LOAD — index in context,
                      │          fetch_full on demand, budget
                      │          guard on total hydration.
                      │
                      └─ NO ───▶ Reconsider the corpus shape —
                                 something here likely needs
                                 restructuring before any of
                                 these strategies fits cleanly.
```

Whichever branch you land on, revisit the decision when the source's size, structure, or update frequency changes by an order of magnitude — none of these are permanent verdicts, they're snapshots against the source as it exists today.

**Related:** [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision) · [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) · [Pass Pointers, Not Payloads](/learn/context-engineering/reference-by-pointer-not-value) · [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline) · [Over-Retrieval and Over-Stuffing](/learn/context-engineering/over-retrieval-and-stuffing-mistakes) · [When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag)
