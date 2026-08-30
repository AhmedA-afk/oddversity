---
title: "The KV Cache: What It Is and Why It Exists"
track: "llm-foundations"
status: live
summary: "Precisely what gets stored between decode steps, what doesn't, and why causal masking is the fact that makes caching safe in the first place."
duration: "7 min read"
---

[The KV cache, introduced elsewhere in this track](/learn/llm-foundations/the-kv-cache), covers the headline story: cache keys and values, skip recomputing the past, turn per-token cost from growing to roughly constant. This lesson stays on one narrower question that story leaves implicit — exactly which tensors get cached, which don't, and why the ones that do are safe to freeze forever.

## What it is

At every layer of a transformer, every token's hidden state gets projected three ways: into a query vector, a key vector, and a value vector, via [attention](/learn/llm-foundations/attention-mechanism-explained). The KV cache is a per-layer, per-token store of exactly two of those three projections — keys and values — kept in memory across decode steps so they never have to be recomputed.

Concretely, after processing token `t` at layer `l`, the cache holds `K[l][t]` and `V[l][t]` — two vectors, one per attention head (or per head-group, if the model uses [grouped-query attention](/learn/llm-foundations/grouped-query-attention)). When token `t+1` arrives, the model computes only its own `Q[l][t+1]`, `K[l][t+1]`, and `V[l][t+1]`, appends the new `K` and `V` to the cache, and lets the new query attend over the entire cached set. Nothing from token `t` gets touched again.

## The mental model

Picture a courtroom stenographer who never re-reads the transcript. Every time a new statement is made, the stenographer writes it down once and files it. When a lawyer later needs to reference "what was said in paragraph 12," nobody re-transcribes the whole session up to that point — they pull the filed page. The keys and values are the filed pages: written once, referenced by every later query, never rewritten. The query, by contrast, is like the lawyer's question itself — a fresh thing computed only at the moment it's needed, never stored for later, because a new question is asked at every single step and the old ones are never asked again.

## Why it works this way

The reason this caching is *safe*, not just convenient, comes down to [causal masking](/learn/llm-foundations/causal-masking): a token's key and value are computed purely from that token's own hidden state, which itself only ever depends on tokens at or before its position. Nothing that happens later in the sequence can reach backward and change what token 12's key or value should have been. Once `K[l][12]` and `V[l][12]` are computed, they are fixed for the rest of the generation, at that layer, forever — there's no future information that could invalidate them. That invariant is precisely what makes "compute once, read many times" a correct strategy rather than a lossy approximation. If attention weren't causally masked — if a token's representation could depend on tokens after it, the way it can in an encoder — caching past keys and values the same way wouldn't be sound, because a later token's arrival could retroactively change an earlier token's correct key or value.

## A concrete example (shown)

For one transformer layer, here's what's in the cache after processing a 3-token prompt, versus what exists only transiently during the forward pass and is never stored for reuse:

| Tensor | Cached across steps? | Why |
|---|---|---|
| Key vectors `K[1..3]` | Yes | Fixed forever once computed — causal masking guarantees no future token can change them |
| Value vectors `V[1..3]` | Yes | Same guarantee as keys |
| Query vectors `Q[1..3]` | No | Only ever used once, at the exact step that produced them, to compute that step's attention output — never referenced again afterward |
| Attention weights (softmax output) | No | Recomputed fresh every step from the current query against all cached keys — the *keys* are reused, not the resulting weights, since a new query produces new weights even against the same keys |
| Feed-forward activations | No | The feed-forward block runs independently per token, per step, with no cross-token state to cache — there's nothing analogous to attention's "look back at earlier tokens" here |
| Final logits per step | No | Consumed immediately to pick the next token, then discarded |

The pattern: only the two projections that later tokens need to *read* get cached. Everything computed purely to produce this step's own output — including the query that read the cache in the first place — is thrown away the moment it's used.

## Where it shows up

Every production LLM API relies on this to serve chat at usable latency — without it, a 2,000-token conversation would mean recomputing keys and values for all 2,000 prior tokens on every single new token generated. It's also the reason multi-turn conversations can be served efficiently: a well-designed serving stack keeps a session's cache alive across turns rather than reprocessing the entire history from scratch each time a user sends a new message, at least until context runs out or the cache is evicted. And it's the direct target of memory-saving architecture choices — [grouped-query attention](/learn/llm-foundations/grouped-query-attention) exists specifically to shrink how much K/V data has to be stored per token, since it's the K/V side (not Q) that accumulates across the whole sequence.

## Watch out for

- **Assuming the cache is free.** It grows with every token generated and never shrinks during a generation — for long contexts or many concurrent requests, the cache's memory footprint can exceed the model's own weights. [Prefill vs decode: why inference is memory-bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) covers what this costs in practice.
- **Assuming a changed system prompt is a cheap edit.** Because keys and values are computed from a token's full leftward context, changing anything early in the prompt invalidates the cache for every token after that point — there's no way to patch just the changed part; everything downstream of the edit has to be recomputed.
- **Confusing "cached" with "compressed."** The cache stores full-precision (or whatever precision the model runs in) K/V vectors for every token — it's a complete record, not a summary. Nothing about caching reduces how much the model has "seen"; it only avoids recomputing what it's already seen.

## Where next

[The KV cache, step by step](/learn/llm-foundations/kv-cache-step-by-step-shapes) traces the cache tensor growing across four literal decode steps with real shapes. [Prefill vs decode: why inference is memory-bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) explains the cost structure this caching strategy creates, including what happens once the cache grows as large as the context window allows.

**Related:** [The KV Cache: How LLMs Avoid Recomputing the Past](/learn/llm-foundations/the-kv-cache) · [Causal Masking](/learn/llm-foundations/causal-masking) · [Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained) · [Grouped-Query Attention](/learn/llm-foundations/grouped-query-attention) · [KV Cache Step by Step](/learn/llm-foundations/kv-cache-step-by-step-shapes) · [Prefill vs Decode: Why Inference Is Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound)
