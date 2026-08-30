---
title: "How Prompt Caching Works"
track: "context-engineering"
status: live
summary: "Providers can skip recomputing a request prefix they have already seen — but only if that prefix shows up byte-identical again."
duration: "7 min read"
---

Every API call re-sends your entire system prompt, tool definitions, and conversation history — the model has no memory between requests. Recomputing all of that from scratch, every single time, is wasted work whenever most of it hasn't changed since the last call. Prompt caching is the mechanism that lets a provider skip that recomputation.

## What it is

Prompt caching lets a provider store the internal computation it did for a stable prefix of your request, so that a later request sharing the same prefix can reuse that stored computation instead of redoing it. It's a server-side optimization you opt into (often by marking a cache breakpoint in the request) and it shows up as two effects: the call gets cheaper, because cached tokens are billed at a steep discount versus fresh ones, and it gets faster, because the provider skips re-running the compute-heavy pass over tokens it has already processed.

## The mental model

[The KV cache](/learn/llm-foundations/the-kv-cache) already solves a version of this problem *within* a single request: once a token's key and value vectors are computed, they never need recomputing for later tokens in the same generation, because causal attention means nothing later can change what came before. Prompt caching takes that same idea and stretches it *across* requests. If two separate API calls happen to share an identical prefix — same system prompt, same tool schemas, byte for byte — the provider can reuse the KV-cache state it already built the first time, instead of starting a cold prefill on that prefix again.

The practical consequence: prompt caching isn't a feature you "turn on" so much as a property your request pattern either has or doesn't. A provider can only reuse what it's seen before, in the exact form it saw it before.

## Why it works this way

Processing a prompt before generating the first token — called prefill — is compute-bound and, critically, deterministic: the exact same input tokens always produce the exact same intermediate computation. If a provider recognizes it has already done that computation for this exact sequence of tokens (typically by keying on a hash of the prefix), there's no reason to redo it. It caches the result for some limited time window and serves it back on a match, charging less for a cache read than a cache write, and far less than a cache miss recomputed from scratch — because a cache read is nearly free compute compared to a full prefill.

This is also why it's a *prefix* match and not a *content* match: the provider isn't checking whether your system prompt "means the same thing" as before, it's checking whether the literal sequence of tokens at the start of the request is identical to a sequence it's already processed. One different token anywhere in that prefix, and the match breaks at that point — see [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes) for exactly why the break is total from that point forward rather than partial.

## A concrete example (shown)

Turn 1 of a session sends a 2,000-token system prompt plus 500 tokens of tool schemas — 2,500 stable tokens — followed by a 50-token user message. Nothing has been cached yet, so the whole request is a cold prefill:

```
Turn 1 usage: cache_creation_input_tokens=2500, cache_read_input_tokens=0, input_tokens=50
```

Turn 2 sends the exact same system prompt and tool schemas (nothing changed) with a new 60-token user message. Because the first 2,500 tokens are byte-identical to what turn 1 already processed, the provider serves them from cache instead of reprocessing:

```
Turn 2 usage: cache_read_input_tokens=2500, cache_creation_input_tokens=0, input_tokens=60
```

As one concrete illustration of what that's worth: Anthropic's published pricing (current as of this writing — check your provider's own numbers, since they do change) prices a cache write at roughly 1.25x the normal input-token rate and a cache read at roughly 0.1x — meaning turn 1 pays a small premium to populate the cache, and every turn after that pays a small fraction of full price for the same stable content. The exact multipliers vary by provider and by model, but the shape — write costs a bit more than normal, reads cost much less — is the general pattern worth expecting from any caching provider.

## Where it shows up

- **Agents with a large, static system prompt and tool list**, re-sent on every single turn of a long-running session.
- **Multi-turn conversations**, where the full history gets replayed into every call — see [stateless model, stateful agent](/learn/context-engineering/stateless-model-stateful-agent) for why that replay is unavoidable in the first place.
- **RAG pipelines** with a large reference document or corpus excerpt that stays constant across many queries in the same session.
- **Batch and eval pipelines** that run the same prompt template against many different inputs, where the template is the stable part and the input is the only thing that varies.

## Watch out for (2-3 pitfalls)

1. **Assuming caching happens automatically regardless of request shape.** It only works if the stable content is actually positioned as a genuine prefix — first, unbroken, byte-identical — which is a design constraint on how you build the request, not something the provider retrofits for you. [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) covers the layout this requires.
2. **Expecting a single call to pay off.** A cache write costs *more* than an uncached call would have, not less — the saving only shows up starting on the second call that reads from it. One-off requests get no benefit and a small penalty; caching is a bet on reuse.
3. **Forgetting the cache has a time-to-live.** Cache entries expire — often on the order of a few minutes by default, sometimes extendable to an hour or more depending on the provider — so a long gap between calls in the same session can mean paying the write cost again. [Measuring Cache Savings](/learn/context-engineering/measuring-cache-savings) walks through instrumenting this directly instead of assuming it.

## Where next

The mechanism connects directly to how the model itself avoids redundant work within a single generation — see [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes) for the underlying reason a single early-token change invalidates everything after it. Once that's clear, [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) covers how to lay out a request to actually earn the hit rate this lesson assumes, and [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) turns that into a concrete refactor.

**Related:** [The KV Cache](/learn/llm-foundations/the-kv-cache) · [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design) · [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes) · [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) · [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies)
