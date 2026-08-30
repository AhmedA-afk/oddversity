---
title: "KV Cache and Context Prefixes"
track: "context-engineering"
status: live
summary: "Prompt caching's prefix-match rule isn't a business policy — it falls directly out of how causal attention computes the KV cache."
duration: "8 min read"
---

[How Prompt Caching Works](/learn/context-engineering/prompt-caching-mechanics) states the rule: caching is a prefix match, and any change anywhere in that prefix invalidates everything after it. This lesson is about *why* that's true at the mechanical level, not just as an observed API behavior — because the reason is the same reason [the KV cache](/learn/llm-foundations/the-kv-cache) works within a single request in the first place, and understanding it precisely is what stops you from being surprised by which changes are cheap and which are catastrophic.

## What the KV cache actually stores

Recall the core fact from [the KV cache](/learn/llm-foundations/the-kv-cache): in a transformer, every token's key and value vectors at every layer are a function only of that token's own embedding and the layer's weights — computed once, during that token's forward pass, and never touched again. [Causal masking](/learn/llm-foundations/context-window-mechanics) is what makes this true: a token can only attend to tokens at or before its own position, never after, so nothing that happens later in the sequence can ever change a key or value vector that was already computed earlier.

This gives the KV cache a precise invalidation property, not just a general one: **the key/value pair for position i depends only on tokens 1 through i.** Change token i, and the key/value at position i changes — because it depends on itself. Every position j > i that ever attended to position i also changes, because part of what it attended to is now different. Every position before i is completely unaffected, because causal masking means those positions never could have looked at position i in the first place.

## Why this makes caching a strict prefix match

Prompt caching, across requests, is exactly this same fact applied at a coarser grain. If request B shares tokens 1 through k with a previously-processed request A, and then diverges at token k+1, the KV cache built while processing A is valid for positions 1 through k of request B — nothing about those positions depended on anything past position k, so nothing about the divergence at k+1 could have touched them. But position k+1 itself, and everything after it, must be recomputed from scratch, because their correct values depend on what's actually at position k+1 onward in request B, which is different from request A.

This is why a caching provider can describe the behavior as simply "we find the longest matching prefix and reuse it" — that description isn't a simplification of something more complicated underneath, it's the literal, exact consequence of how causal attention works. There's no partial credit for "the rest of the prompt is 95% similar." The match is binary at each position: identical up to the point of divergence, fully invalid from that point on.

## Why prefix stability — not size — is what drives the economics

A natural but wrong intuition is that caching mainly helps with *very long* prompts, since there's more to potentially reuse. Size isn't actually the variable that matters — position of divergence is. Consider two 100,000-token requests:

- **Request pair A**: identical for the first 50,000 tokens, then diverge. Roughly half the prefill work is reusable.
- **Request pair B**: identical for the first 99,900 tokens, with only the very end — the live user turn — differing. Nearly the *entire* prefill is reusable, even though the request is exactly as large as pair A.

Total size was the same in both cases; what determined the outcome was *where* the two requests stopped matching. A modest 5,000-token system prompt with a scrupulously stable layout can achieve a near-total cache hit rate. A 200,000-token request with one badly-placed volatile field near the front achieves close to none, no matter how large the theoretically-cacheable remainder is — because that remainder never gets a chance to be reused; the divergence point is what's checked, and it comes first.

This is the precise reason [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) obsesses over *where* volatile content sits rather than how much of it there is: a single timestamp positioned at token 3 does more damage to a hit rate than a hundred lines of genuinely volatile content positioned at the very end of the request, because the first one moves the divergence point to the front and the second one doesn't move it at all.

## The one thing worth being precise about

It's tempting to describe recomputing "the rest of the prompt after a divergence" as costing the same as recomputing the whole thing, but that's not quite right either, and it matters for intuition: when new tokens are computed against an already-cached prefix, each new token still only needs to attend backward across the full sequence (cached prefix plus whatever's new) — it doesn't redo the internal computation for the cached portion, only the attention computation that reads from it. The exact efficiency gain depends on implementation details specific to each provider and isn't something worth quoting a precise number for. What's safe to say, and what the mechanism above proves rather than merely asserts: everything from the divergence point onward requires new work, and everything strictly before it does not — full stop, with no partial or approximate middle ground.

## What this rules out

Because the invalidation boundary is exact, a few intuitions that sound reasonable are actually wrong:

- **"A small edit should only cost a little."** A one-character edit at the front of a 50,000-token prefix invalidates the same 50,000 tokens of cached computation as deleting the whole thing and starting over — size of the edit and size of the consequence are unrelated once you understand the mechanism is positional, not proportional.
- **"Semantically equivalent content should still hit the cache."** Reordering two independent tool definitions, or reformatting the same JSON with different key order, produces token sequences that are almost certainly different byte-for-byte even though they express the same information — and the match is on tokens, not on meaning, so it misses.
- **"Caching mainly matters for huge prompts."** As shown above, a short, disciplined prefix caches better than a long, careless one. Size isn't the lever; stability of the boundary is.

**Related:** [The KV Cache](/learn/llm-foundations/the-kv-cache) · [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) · [How Prompt Caching Works](/learn/context-engineering/prompt-caching-mechanics) · [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep)
