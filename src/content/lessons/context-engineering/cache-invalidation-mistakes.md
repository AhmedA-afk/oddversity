---
title: "Cache and Merge Mistakes"
track: "context-engineering"
status: live
summary: "Six real ways teams silently pay full price for caching and get contradictory merged context, with the fix for each."
duration: "8 min read"
---

Most of these mistakes are invisible from the outside — the agent still works, answers still come back, and nothing throws an error. The only symptom is a bill or a hit rate that doesn't move the way it should, or a model that occasionally says something that doesn't match what you know to be true. Here's what to look for.

### The mistake: volatile data baked into the frozen system prompt

A timestamp, session ID, or request nonce gets interpolated directly into the system prompt text because it feels like natural context to include up front — "You are a support agent. Session: abc123. Today is..."

**Why it's wrong:** Prompt caching is a byte-for-byte prefix match, not a semantic one (see [How Prompt Caching Works](/learn/context-engineering/prompt-caching-mechanics)). A field that's different on every call, placed inside the part of the request meant to be reused, means the prefix diverges from the very first token that differs — and per [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes), everything from that point forward has to be recomputed regardless of how much of the rest of the prompt is actually unchanged.

**Symptom:** `cache_read_input_tokens` sits at zero across calls that look, to a human reading the prompt, essentially identical. Cost and latency don't improve no matter how repetitive the traffic pattern is.

**Fix:** Move every field that varies per call — session ID, timestamp, request ID — out of the system prompt entirely and into the final user turn, after the last cache breakpoint. See [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) for the full refactor.

### The mistake: a per-turn timestamp placed ahead of the stable content in render order

This is a more subtle variant of the first: the volatile field isn't inside the system *prompt text* at all — it's a separate message or metadata block, but it's positioned *before* the tool definitions and instructions in the request's overall structure, rather than after them.

**Why it's wrong:** Cache matching runs over the request's full render order, not just the system prompt field in isolation. If a provider serializes as tools, then system, then messages, and something inserts volatile content ahead of the tool list, the tool definitions — which might otherwise be perfectly cacheable — never get the chance, because the divergence point now sits before them.

**Symptom:** Similar to the first mistake, but often harder to spot in code review, because the system prompt text itself looks clean — the problem is in the assembly order of the request as a whole, not in any one string.

**Fix:** Audit the entire request shape, not just the system prompt: confirm nothing volatile is ever assembled ahead of tool schemas or static instructions, regardless of which top-level field it technically lives in. [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) covers laying this out in explicit tiers so the ordering is enforced by structure, not by convention.

### The mistake: un-normalized, non-deterministic serialization

Tool definitions get rebuilt from a dict or set each request, and the resulting JSON doesn't guarantee the same key order or float formatting from call to call, even though the underlying tools haven't changed at all.

**Why it's wrong:** Two requests can carry semantically identical tool definitions and still fail to hash to the same cache entry, because the cache match is on literal bytes. `{"a": 1, "b": 2}` and `{"b": 2, "a": 1}` mean the same thing to a person and nothing alike to a byte-level prefix match.

**Symptom:** Unlike the first two mistakes, this one produces a *flaky* hit rate rather than a reliably flat zero — sometimes the iteration order happens to match the previous call, sometimes it doesn't. Flakiness that doesn't correlate with any obvious change in the request is the tell.

**Fix:** Serialize with `sort_keys=True` (or your language's equivalent) everywhere a stable structure gets converted to text, and compute tool definitions once, as a frozen constant, rather than rebuilding them per request.

### The mistake: merging differently-shaped sources without normalizing first

Results from multiple tools get concatenated or compared while still in their original, mismatched shapes — one source's `"$240.00"` next to another's `24000`, one's `PRO_MONTHLY` next to another's `Pro`.

**Why it's wrong:** Dedup and conflict-detection logic both depend on being able to tell whether two values represent the same fact. If the same underlying value never string-matches itself across sources because of a unit or format difference, two things go wrong at once: genuine duplicates get treated as new, independent information, and genuine conflicts go undetected because the comparison never even recognizes the two values as describing the same field.

**Symptom:** A merged context block appears to contain the same fact stated multiple times, in different words or formats, with no clear signal about whether that's confirmation from independent sources or the same value simply expressed twice — and separately, real discrepancies between sources become indistinguishable from mere formatting drift, because both symptoms look identical (two different-looking values for "the same" field) until you know which is which.

**Fix:** Normalize every source into one canonical schema — consistent field names, units, and formats — before any comparison, dedup, or merge logic runs. [Normalizing Sources Before Merge](/learn/context-engineering/normalizing-tool-schemas-for-merge) works through this end to end.

### The mistake: skipping dedup on repeated or paginated tool calls

An agent re-searches, re-lists, or re-reads with slightly different arguments across several turns, and every result gets appended to context in full, regardless of how much it overlaps with something already there.

**Why it's wrong:** Because the full conversation gets re-sent on every turn, duplication compounds — a redundant result doesn't cost tokens once, it costs tokens on every subsequent call for the rest of the session. Beyond raw cost, near-identical content repeated across the window is a direct contributor to [context rot](/learn/context-engineering/context-rot): the model has to work out which of several near-identical blocks is authoritative, which is itself a source of degraded output quality.

**Symptom:** Context fills up unusually fast on multi-step, tool-heavy tasks, and the agent sometimes behaves as if it "forgot" something it found several turns earlier — not because the information left the window, but because it got diluted or crowded out by repeats of itself and other content.

**Fix:** Normalize, hash, and check for near-duplicates before any tool result is appended — see [Deduping Overlapping Tool Results](/learn/context-engineering/deduping-overlapping-tool-results) for a complete, wired-in implementation, and [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) for the exact-vs-near-duplicate mechanics behind it.

### The mistake: rewriting or reordering already-cached history "to clean it up"

A team notices the conversation history is getting long and decides to retroactively summarize or delete a turn from the middle of the transcript to save space — a reasonable-sounding instinct that runs headlong into how caching actually works.

**Why it's wrong:** Any edit to content that sits earlier in the prefix than the point being edited invalidates every cache entry built on top of the old version, no matter how small the edit is — this is the direct, unavoidable consequence of the prefix-match mechanics in [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes). A one-line summary swapped in for a 500-token turn from three exchanges ago doesn't save 500 tokens of cache — it costs the entire cache built on everything after that point, recomputed once, immediately.

**Symptom:** Cache hit rate craters and cost spikes right after a "helpful" compaction or cleanup pass — the opposite of the intended effect, and confusing precisely because the change looked like it should have reduced spend.

**Fix:** Do history rewrites in deliberate, infrequent batches rather than continuously, and budget for one full-price call immediately following any rewrite — it's an unavoidable cost of the rewrite, not a bug. [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) covers the compaction side of this tradeoff in more depth.

## Pre-flight checklist

- [ ] No timestamp, session ID, or request nonce appears anywhere ahead of the last cache breakpoint.
- [ ] The entire request's render order — not just the system prompt text — has volatile content strictly after stable content.
- [ ] Tool definitions are a frozen, module-level constant, sorted and serialized once, never rebuilt per call.
- [ ] Every JSON structure in the stable prefix uses deterministic serialization (sorted keys, fixed number formatting).
- [ ] Multi-source results are normalized into one canonical schema before any dedup or merge logic runs.
- [ ] Tool results are hashed and near-duplicate-checked before injection, not after.
- [ ] History edits happen in deliberate batches, with the post-rewrite cost accounted for, not treated as a pure savings.
- [ ] `response.usage` (or your provider's equivalent) is actually being logged, so a regression shows up as a number, not a guess.

**Related:** [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) · [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) · [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context) · [Deduping Overlapping Tool Results](/learn/context-engineering/deduping-overlapping-tool-results) · [Context Rot](/learn/context-engineering/context-rot)
