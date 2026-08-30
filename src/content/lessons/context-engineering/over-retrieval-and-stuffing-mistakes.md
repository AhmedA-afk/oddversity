---
title: "Over-Retrieval and Over-Stuffing"
track: "context-engineering"
status: live
summary: "Four ways retrieval and stuffing quietly overreach — too many chunks, too much corpus, too eager a preload, too many tools at once."
duration: "7 min read"
---

Every one of these mistakes looks like generosity — retrieve more, load more, expose more — and every one of them makes the system worse in a way that doesn't show up until you measure it directly.

## Retrieving too many chunks "to be safe"

### The mistake
You set `top_k=20` or `top_k=30` instead of tuning it, on the reasoning that more retrieved context can only help — the model can just ignore what it doesn't need.

**Why it's wrong.** The model can't cleanly ignore irrelevant retrieved content the way a human skims past a bad search result — every injected chunk competes for attention with the chunks that actually matter, which is exactly the dynamic [Context Rot](/learn/context-engineering/context-rot) documents. Past a certain k, additional chunks are net-negative: they add tokens (and cost) without adding signal, and they dilute the model's attention away from the two or three chunks that actually answer the query. A 20-chunk context isn't a safer version of a 5-chunk context — it's a noisier one.

**Symptom.** Answers cite the wrong source, blend details from two unrelated chunks into one incorrect claim, or the model hedges more than the actual source material warrants — all signs it's working across a wider, less relevant surface than it needs.

**Fix.** Tune k against measured answer quality, not intuition — retrieve a candidate set, then apply reranking and a budget-aware cutoff as in [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline), rather than treating a large fixed k as a safety margin. If quality doesn't improve past k=5 on your eval set, k=20 isn't buying you anything except cost and noise.

## Stuffing a corpus that should have been retrieved

### The mistake
A knowledge base starts small enough to stuff whole — a handful of FAQ entries, a short policy doc — and stays stuffed as it grows to hundreds or thousands of entries, because nobody revisited the original decision.

**Why it's wrong.** [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision) frames this as a decision made once against the corpus's *current* size — but corpora grow, and the decision doesn't automatically get revisited. A knowledge base that was 20 FAQ entries at launch and is 2,000 entries a year later is now paying full stuffing cost on every single call, for a document most queries only need one paragraph of.

**Symptom.** Per-call cost climbs steadily over months with no code change to explain it, and eventually someone notices the "small FAQ doc" being stuffed into every prompt is no longer small.

**Fix.** Set an explicit size trigger — a token count, a document count — that flags when a stuffed corpus should be re-evaluated for retrieval, rather than relying on someone happening to notice. Revisiting the decision costs an afternoon; not revisiting it costs a growing multiple on every call indefinitely.

## Eager-loading everything a task might touch

### The mistake
A file-navigation or research agent preloads every file, document, or record that could plausibly be relevant before its first turn, instead of giving it tools to fetch what it actually ends up needing.

**Why it's wrong.** [Lazy vs Eager Loading](/learn/context-engineering/lazy-vs-eager-context-loading) makes the general case: predicting relevance in advance either over-includes (most of what's loaded goes unused) or under-includes (a gap the model has no way to fill). Eager loading defaults to over-inclusion because "might need it" is a much lower bar than "will need it," so the loaded set balloons to cover every plausible branch of a task that will only actually walk down one or two of them.

**Symptom.** A task that touches 3 files out of 200 pays the token cost of all 200 anyway, and the ratio gets worse, not better, as the underlying corpus grows — the ceiling on waste rises with corpus size, not with task complexity.

**Fix.** Give the agent an index (a directory listing, a one-line-summary catalog) and a fetch tool, and let it hydrate content on demand — the pattern built out fully in [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) and [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader). Reserve eager preloading for the working set that's genuinely small and known ahead of time — a short system prompt, a current user's profile — not for "everything that could conceivably matter."

## Handing an agent every tool at once

### The mistake
An agent with 40 or 60 tools registered gets all of them exposed on every single turn, regardless of what the current task or phase actually needs.

**Why it's wrong.** Every registered tool's full schema — name, description, JSON Schema parameters — is re-sent on every turn, whether or not it gets called. Beyond the raw token cost, a long undifferentiated tool list degrades the model's own selection accuracy: more near-duplicate options to disambiguate means more chances to call the wrong one or fill in its arguments wrong. [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure-in-depth) covers the mechanism in depth; the mistake here is simply never applying it once the toolset has grown past the size where flat registration stops being free.

**Symptom.** Rising tool-definition token cost per turn as the toolset grows, paired with an uptick in wrong-tool-called or malformed-arguments errors that doesn't track any change in task difficulty — just in how many tools are competing for the same decision.

**Fix.** Phase tool exposure by category or by task stage — a small always-resident core plus a lookup mechanism for the long tail, as detailed in [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure-in-depth). Below roughly 15–20 tools this isn't worth the added routing step; above that, and especially where most tools are rarely called on any given turn, it usually is.

## Pre-flight checklist

- Retrieval `top_k` is tuned against measured answer quality, not set high "to be safe"
- A reranking or budget-filter stage exists between retrieval and injection, not just a raw top-k cutoff — see [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline)
- Any stuffed corpus has an explicit size trigger that flags when it should be re-evaluated for retrieval instead
- Agents with a large or open-ended working set get an index-plus-fetch pattern, not a full eager preload
- Toolsets past roughly 15–20 tools are phased by category or task stage rather than registered flat on every turn
- You've actually measured token cost and error rate before and after any of the above changes — not assumed the fix worked

**Related:** [Context Rot](/learn/context-engineering/context-rot) · [Stuff It or Retrieve It](/learn/context-engineering/stuffing-vs-retrieval-decision) · [Lazy vs Eager Loading](/learn/context-engineering/lazy-vs-eager-context-loading) · [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) · [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure-in-depth) · [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline)
