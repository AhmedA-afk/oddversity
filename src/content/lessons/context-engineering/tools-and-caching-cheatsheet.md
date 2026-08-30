---
title: "Tools and Caching Cheatsheet"
track: "context-engineering"
status: live
summary: "One page: trim-at-boundary, the dedup recipe, the merge/normalize steps, stable-prefix layout, and a cache-friendliness audit."
duration: "6 min read"
---

Everything in this module compressed to what you actually need while writing the code — the reasoning behind each item lives in the linked lesson.

## Start here, then measure

1. **Trim tool output at the boundary**, before it's appended to context — never after. See [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too).
2. **Dedup before injection**: exact hash first, near-duplicate similarity second, only within the same tool/query. See [Deduping Overlapping Tool Results](/learn/context-engineering/deduping-overlapping-tool-results).
3. **Normalize before merge**: one canonical schema, missing fields stay `None`, never guessed. See [Normalizing Sources Before Merge](/learn/context-engineering/normalizing-tool-schemas-for-merge).
4. **Stable content first, volatile content last**, with nothing that varies per call ahead of the last cache breakpoint. See [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits).

## The trim-at-the-boundary rule

If a tool can return more than you need, budget it in tokens, not row count, and cut at the point the result re-enters the harness:

```python
def call_and_trim(tool_fn, query, token_budget=1000):
    raw = tool_fn(query)
    ranked = rank_by_relevance(raw["results"], query)
    kept, used = [], 0
    for r in ranked:
        cost = estimate_tokens(r["content"])
        if used + cost > token_budget:
            break
        kept.append(r); used += cost
    return kept
```

## Dedup recipe

1. Normalize (strip whitespace/casing for text; `sort_keys=True` for JSON).
2. Hash the normalized content; drop exact matches, replace with a short pointer.
3. For structured/paginated results with a stable key (row id, file path), dedup by key — skip similarity math entirely.
4. For free text with no natural key, run a cheap similarity check (`difflib.SequenceMatcher`, Jaccard on shingles) against prior results from the *same* tool only.
5. Reach for embeddings only when wording varies but meaning doesn't — it's the most expensive option, use it last.

| Case | Method | Cost |
|---|---|---|
| Exact repeat | Hash | O(1) per check |
| Paginated/structured overlap | Key-based set | O(1) per check |
| Re-read with wider range | Sequence similarity | Cheap, no threshold tuning needed for obvious cases |
| Paraphrased duplicate | Embedding cosine similarity | One extra API call per candidate |

## Merge/normalize steps

1. Define one canonical schema every source maps into.
2. Write a normalizer per source: fix units, fix date formats, fix field names — leave genuinely missing data as `None`, never a guess.
3. Compare field by field; where sources agree, keep one attributed value; where they disagree, emit an explicit conflict row with both values and both sources — never average discrete/categorical values.
4. Apply a pre-decided source hierarchy (recency, authority, or specificity — pick the axis that matches *why* your sources actually diverge) to say which value the model should prefer, without deleting the losing one.
5. Render as one attributed table, not three concatenated raw payloads. See [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context).

## Stable-prefix layout

```
+-------------------------------+
| system prompt (frozen)        |  <- cache breakpoint 1
| tool schemas (frozen, sorted) |
+-------------------------------+
| long reference doc / corpus   |  <- cache breakpoint 2 (optional,
| (stable within session)       |     if it's large and session-scoped)
+-------------------------------+
| conversation history          |  <- append-only, grows each turn
+-------------------------------+
| current user turn             |  <- always volatile, always last
| (timestamp, session id here)  |
+-------------------------------+
```

Everything above a breakpoint must be byte-identical across calls whenever its own layer hasn't changed — see [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) for why tiering it like this, rather than one flat stable/volatile split, avoids invalidating layers that didn't need to change together.

## Cache-hit checklist

| Check | Pass condition |
|---|---|
| Volatile fields | None appear ahead of the last cache breakpoint |
| Tool list | Frozen constant, sorted once, never rebuilt per request |
| JSON serialization | `sort_keys=True` (or equivalent) everywhere in the stable prefix |
| History edits | Batched, not continuous — each rewrite budgeted as one full-price call |
| Instrumentation | `response.usage` (or equivalent) logged on every call |
| Observed hit rate | Rising toward the ceiling your traffic pattern allows, not flat at zero |

If `cache_read_input_tokens` is flat at zero across calls that look identical to a human, something in the checklist above is failing silently — see [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes) for the full diagnostic table.

## Cache-friendliness audit

Run this against your own request-builder before shipping:

- [ ] Diff the "stable" portion of two consecutive requests, byte for byte — they should be identical whenever nothing meant to change actually changed. (See the diagnostic in [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits).)
- [ ] Confirm no tool result enters context without passing through a trim step first.
- [ ] Confirm no tool result enters context without passing through a dedup check first.
- [ ] Confirm any multi-source merge normalizes before comparing, and labels conflicts rather than silently picking or averaging.
- [ ] Confirm `response.usage.cache_read_input_tokens` is nonzero and growing across a real session, not just theoretically possible.
- [ ] Confirm the last thing added to the request, in render order, is the genuinely volatile part — and nothing volatile sneaks in ahead of it.

**Related:** [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too) · [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) · [How Prompt Caching Works](/learn/context-engineering/prompt-caching-mechanics) · [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) · [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes) · [Tools and Caching Quiz](/learn/context-engineering/tools-caching-quiz)
