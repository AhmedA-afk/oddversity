---
title: "Strategies for Million-Token Windows"
track: "context-engineering"
status: live
summary: "What actually changes at extreme context sizes — cost, latency, and rot risk that a bigger window doesn't fix by itself."
duration: "8 min read"
---

*This is a deep-dive — it goes past "big windows exist now" to what specifically breaks differently at that scale, and the patterns that keep a huge window actually usable rather than just technically full.*

A million-token window sounds like it should make the stuffing-vs-retrieval question go away — if you can fit almost anything, why retrieve at all? The honest answer is that a bigger container doesn't repeal the problems that were never about container size to begin with.

## What actually changes, and what doesn't

**Cost scales linearly, and linearly gets expensive fast at this size.** Input tokens are billed per token with no discount for "the model didn't need most of them." A single call stuffing 900,000 tokens costs roughly ninety times what a 10,000-token retrieved slice would, every single time that call is made. This is the same arithmetic [When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag) works through at a more moderate scale; at a million tokens the multiplier is simply bigger, and it stays bigger for every repeated call against the same corpus.

**Latency has a floor that grows with input size.** Processing a million tokens of input takes real time before the first output token appears, independent of how simple the eventual answer is. A one-line factual question buried in a million-token document still pays the full processing cost of that document — the window being large doesn't make a short answer arrive quickly.

**Lost-in-the-middle does not go away — it may get worse in absolute terms.** [Lost in the Middle](/learn/context-engineering/lost-in-the-middle) describes a model's tendency to under-attend to content in the middle of a long context relative to its start and end. A bigger window means a bigger "middle" — more absolute tokens sitting in the zone where recall is weakest. Filling a million-token window doesn't mean the model reasons over all million tokens with equal reliability; it means there's more room for the parts that don't get attended to well.

**Context rot compounds at this scale, not just persists.** [Context Rot](/learn/context-engineering/context-rot) covers how irrelevant tokens degrade output quality, not just cost. A million-token window makes it far easier to accumulate irrelevant tokens without noticing — nothing forces you to curate at this size the way a tight 20K-token budget forces you to justify every inclusion. The temptation at extreme scale is to stop being selective *because you can afford not to be*, which is exactly backwards: rot risk tracks how much of what's in the window is irrelevant, not how much room is left over.

## Patterns that keep a huge window usable

**A structured table of contents, injected first.** Rather than relying on the model to build its own mental map of a million-token document by reading linearly, prepend an explicit index: section titles, page or line ranges, one-line summaries of what each section covers. This gives the model something to route by before it commits to reading deeply into any one part — the same index-first move as [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern), applied inside a single stuffed document instead of across a document set.

**Positional anchoring — repeat critical facts near the point of use, not just once at the top.** If a definition established on page 3 is load-bearing for a decision the model has to make near page 400, don't rely on the model recalling page 3 correctly from deep in the middle zone. Restate the critical fact close to where it's needed — a short reminder clause, a footnote, a repeated definition — so the model isn't depending on long-range recall for something you can just place correctly instead. This directly targets the lost-in-the-middle weakness rather than hoping a bigger window makes it irrelevant.

**Chunked internal summarization for navigation, not for injection.** For a document this large, generating a running summary every N sections — purely as a navigation aid layered on top of the full text, not as a replacement for it — lets the model check "am I in the right part of the document" without re-reading from the start. This is a lighter-weight cousin of [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization), used here for orientation within one stuffed document rather than for compacting a conversation.

**Ordering by importance, not just by document order.** [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention) and [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects) both make the case that placement affects attention independent of content. At extreme context sizes, this stops being a nice-to-have — if a document's most decision-relevant sections happen to fall in the statistically weakest attention zone by sheer coincidence of document structure, restructuring what comes first, last, and in the middle is a lever you actually have, even when you can't shrink the total size.

## Deciding whether you need this much window at all

None of these patterns are a reason to reach for a million-token window as a default. They're the cost of admission once a task genuinely requires it — true whole-corpus synthesis, or a document too large to chunk meaningfully without breaking the cross-references that made stuffing worth it in [When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag). For everything short of that, a smaller, curated, retrieved context remains cheaper, faster, and — because there's simply less room for irrelevant tokens to hide in — usually higher quality. Extreme window size is a tool for a specific job, not a universal upgrade over retrieval discipline.

**Related:** [Long Context Strategies](/learn/context-engineering/long-context-strategies) · [When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag) · [Lost in the Middle](/learn/context-engineering/lost-in-the-middle) · [Context Rot](/learn/context-engineering/context-rot) · [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects) · [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization)
