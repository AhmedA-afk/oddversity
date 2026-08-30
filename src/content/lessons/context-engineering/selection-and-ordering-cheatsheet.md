---
title: "Selection and Ordering Cheatsheet"
track: "context-engineering"
status: live
summary: "Value-per-token, filter-then-rerank order, head-and-tail placement, delimiter defaults, and a pre-send checklist in one page."
duration: "6 min read"
---

You know the theory from the rest of this module — this page skips it and gives you the working defaults and a fast reference instead.

## Start here, then measure

1. **Score every candidate by value per token**, not raw relevance alone: `relevance_score / token_cost`. See [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut).
2. **Filter before you rerank position, rerank before you cut by budget.** Run: rerank for accurate scores → drop near-duplicates → apply a threshold-based cutoff with a token cap. See [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking).
3. **Place survivors head-and-tail, not in retrieval order.** Highest-value content goes first or last; lowest-value survivors absorb the middle. See [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention).
4. **Label and bound every injected block.** An ID plus an explicit boundary, not a prose blob. See [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns).
5. **Restate critical instructions near the tail on long sessions.** Primacy alone thins out as a transcript grows. See [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects).
6. **Re-test at your actual context lengths.** The U-curve's depth is model- and length-specific — see [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle).

## Filtering defaults

| Decision | Start here, then measure |
|---|---|
| Cutoff rule | Similarity/relevance threshold + a hard max cap, not a fixed top-k |
| Redundancy | Pairwise similarity check (~0.9+ threshold) after ranking; keep the higher-ranked half of each duplicate pair |
| Task-conditioning | Hard exclude by document type/role before scoring; don't rely on similarity alone to catch wrong-category content |
| Order of operations | Rerank → dedup → threshold cutoff with token budget — see [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking) |

## Positional map: where to put each segment

```text
[ HEAD ]                                                          [ TAIL ]
system / constraints   →   highest-value survivor #1   ...   →   most-recent turn
(primacy: stated once,     (best recall position;              (recency: strongest
 reinforced by every        put your best fact here)             pull — restate
 later token)                                                     critical rules here)

                     [        MIDDLE — weakest recall zone        ]
                     lower-value supporting content only;
                     never the one fact the answer depends on
```

- **Head:** foundational framing — system prompt, constraints, task definition. Benefits from primacy.
- **Tail, just before generation:** the current question, and a restated copy of any non-negotiable constraint. Benefits from recency — the strongest lever you have on a long session.
- **Middle:** everything that's in context but not decision-critical. If your most important fact is here by construction, that's a signal to cut something, not just reorder.

## Delimiter defaults

| Situation | Default | Why |
|---|---|---|
| Untrusted or user-supplied content | XML-style tags with an explicit close | Hardest boundary to break by accident; supports attributes/IDs for citation |
| Human-reviewed, trusted, dev-facing prompt | Markdown headers | Cheapest per block, most readable raw |
| Prompt assembled entirely from existing code objects | JSON | Matches the data's native shape; avoids hand-formatting a string |
| Small, trusted, low-stakes sections only | Plain delimiter string | Cheapest overall, weakest boundary — don't use for anything citation-critical |

Full comparison and failure modes: [XML vs. Markdown vs. JSON Delimiters](/learn/context-engineering/xml-vs-markdown-vs-json-delimiting).

## Symptom → fix

| Symptom | Likely cause | Fix |
|---|---|---|
| Answer is subtly wrong or padded on a narrow query | Fixed top-k forced in weak filler | Threshold-based cutoff, not a fixed count — [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut) |
| Right document was retrieved but the fact got missed or garbled | Buried mid-window, raw retrieval order | Head-and-tail placement pass — [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention) |
| Model can't say which source it used, or cites the wrong one | Unlabeled, undelimited context blocks | Bounded, identified blocks — [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns) |
| Context looks well-retrieved but underperforms anyway | Near-duplicate chunks eating slots | Pairwise redundancy pass before insertion — [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth) |
| A rule from early in a long session stops being followed | Primacy outweighed by accumulated recency | Restate near generation, conditioned on relevance — [Placing Instructions So They Stick](/learn/context-engineering/placing-instructions-for-adherence) |
| Well-ordered context that's still mostly noise | Reranked but never filtered | Add a threshold-based cutoff after reranking — [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking) |

## The one-line value-per-token rule

**If two candidates are within a small margin of relevance, keep the shorter one; if one candidate is much more relevant, keep it even if it costs more tokens — but never admit a candidate below your relevance floor purely because it's cheap.** Cheap noise is still noise — see [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context).

## Pre-send ordering checklist

- [ ] Every candidate cleared a relevance threshold, not just a fixed slot count.
- [ ] Near-duplicate chunks were checked and the weaker one dropped.
- [ ] The highest-value surviving content sits at the head or tail — not wherever retrieval happened to rank it.
- [ ] Every injected block has a stable ID and a real boundary, in a format matched to trust level.
- [ ] Any non-negotiable constraint is restated near the point of generation if the session is long or growing.
- [ ] Reranking and filtering both ran, in that order — order alone was not treated as a substitute for a cutoff.
- [ ] If this is a new pipeline or a new context length, you've actually measured the U-curve here — not assumed it from a different setup.

**Related:** [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut), [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention), [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns), [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking), [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects)
