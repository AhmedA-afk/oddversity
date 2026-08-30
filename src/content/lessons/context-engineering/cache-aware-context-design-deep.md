---
title: "Cache-Aware Context Design"
track: "context-engineering"
status: live
summary: "Layer your context by how often each part changes, and place cache breakpoints at the boundaries between layers."
duration: "8 min read"
---

[Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design) establishes the core rule: stable content first, volatile content last. This is the deferred rigor on top of it — how to think in stability *tiers* rather than a single stable/volatile split, where to place more than one cache breakpoint, and the precise costs of getting the layout wrong. Treat it as optional depth on top of that overview.

## Stability isn't binary — it's tiered

The overview's rule works well as a first pass, but real agent context usually has more than two categories of "how often does this change." A useful default is four tiers, ordered from least to most volatile:

```
Tier 0 - system prompt + tool schemas       (changes only on deploy)
Tier 1 - long reference doc / retrieved corpus  (stable within a session)
Tier 2 - conversation history                (append-only, grows every turn)
Tier 3 - the current user turn               (always new)
```

Treating this as one undifferentiated "stable prefix, then everything else" misses an opportunity: Tier 1 might be large (a long reference document) and genuinely stable *within* a session, even though it changes *across* sessions. If it's bundled into the same cache segment as Tier 0, then a new session with a different reference document forces the entire Tier 0 content to be re-cached alongside it — even though the system prompt and tools didn't change at all.

## Multiple breakpoints, not just one

Most providers that support prompt caching let you mark more than one position in a request as a cache boundary — Anthropic's API, for instance, allows up to four `cache_control` breakpoints per request as of this writing. The reason to use more than one is exactly the tiering problem above: a breakpoint after Tier 0 lets the system prompt and tools be reused across *every* session on the deployment, while a second breakpoint after Tier 1 lets the reference document be reused across every turn *within* one session, without either layer forcing a re-cache of the other.

```
[system prompt + tools] --- breakpoint 1 --- [reference doc] --- breakpoint 2 --- [history + current turn]
```

A request that changes only the reference document (a new session, a different corpus) still gets a cache hit on Tier 0 up to breakpoint 1. A request within the same session that only adds a new turn still gets a cache hit on everything up to breakpoint 2. Collapsing this into a single breakpoint after the reference document would still work for the second case, but would waste the reuse opportunity in the first — every new session pays full price for the system prompt and tools too, even though only the corpus actually changed.

## Worked reorder: a hypothetical before-and-after

Consider a hypothetical support agent whose request-builder was written for correctness, not for caching, and interpolates a session ID directly into the system prompt because it seemed like the natural place to put "context about who's asking":

```python
system_prompt = f"You are a support agent. Session: {session_id}. Instructions: ..."
```

Because `session_id` sits at the very front of the request and is different on every session, every single call's prefix diverges from every other call's at essentially token zero. In a hypothetical trace of this pattern across a week of traffic, you'd expect a cache hit rate close to the floor — illustratively, something like 10%, driven only by the rare case where two different sessions happen to share a session ID collision or a retry re-sends the identical request within the TTL window. Nearly every call pays full prefill cost on the entire system prompt, even though the *instructions* portion of it never actually changes.

Moving the session ID to the end of the request — after the stable instructions and tool schemas, alongside the rest of Tier 3 — restores the shared prefix:

```python
system_prompt = STATIC_INSTRUCTIONS  # frozen, identical across every session
user_turn = f"[session:{session_id}] {user_message}"
```

Now every session shares the same Tier 0 prefix. In this hypothetical, that's the difference between a 10% hit rate and something like 80% — most calls landing on a cache hit for everything up to the point where the genuinely session-specific content begins, with only a talkative minority of sessions (the first call of a brand-new session, or a call outside the cache TTL) paying full price. These numbers are illustrative of the *shape* of the effect, not a measured benchmark — the actual hit rate you'd see depends entirely on your own traffic pattern and TTL, which is exactly why [Measuring Cache Savings](/learn/context-engineering/measuring-cache-savings) is about instrumenting your own numbers rather than trusting an example.

## The tradeoffs, precisely

- **More breakpoints cost bookkeeping, not tokens.** Each additional `cache_control` marker is a small addition to the request itself, but it does mean more surface area for a bug — an accidentally-moved breakpoint, or content shifted from one tier to another during a refactor, can silently collapse two previously-independent cache segments into one, or break a segment that used to hit.
- **TTL is a staleness/hit-rate dial, not a free parameter.** A short TTL protects you from a "stable" document that turns out to need occasional updates — if it changes, the next call simply pays full price and re-caches the new version, with no risk of ever serving stale cached content past its expiry. A longer TTL raises hit rate on bursty or sparse traffic (sessions with long gaps between calls) at the cost of a longer window during which a manually-updated "stable" document could go stale in cache. Choose based on how often Tier 0/Tier 1 content is actually allowed to change, not on maximizing hit rate in isolation.
- **Byte-identical means genuinely byte-identical, which costs engineering discipline.** A JSON serializer with nondeterministic key order, a tool list rebuilt from a dict or set each call, a floating-point value formatted with a slightly different precision — any of these silently break what looks like a stable prefix. Canonical serialization, computed once and frozen, is a prerequisite for any of the layout above to actually work — see [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) for the concrete refactor that enforces this.

## What this buys you that a single stable/volatile split doesn't

The payoff of tiering is that it decouples cache invalidation events that don't need to be coupled. A deploy that updates the system prompt only invalidates Tier 0. A new session with a different reference corpus only invalidates from Tier 1 down. A new turn in an existing session invalidates nothing above Tier 2 — the whole point of an append-only history is that each new turn extends a cache-eligible prefix rather than rewriting it. Getting this right is the difference between "caching helps a little" and "caching does almost all the work it's capable of doing" on the same underlying request pattern.

**Related:** [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design) · [How Prompt Caching Works](/learn/context-engineering/prompt-caching-mechanics) · [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) · [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes) · [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes)
