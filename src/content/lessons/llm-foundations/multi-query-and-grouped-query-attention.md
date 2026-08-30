---
title: "Multi-Query and Grouped-Query Attention"
track: "llm-foundations"
status: live
summary: "The spectrum from full multi-head attention to a single shared KV head, and why the middle of that spectrum won."
duration: "6 min read"
---

Once you accept that the [KV cache](/learn/llm-foundations/the-kv-cache) is usually what runs a GPU out of memory first, the next question is obvious: does every attention head really need its own private key and value vectors, or can heads share?

## What it is

In ordinary [multi-head attention](/learn/llm-foundations/multi-head-attention), every one of the h query heads has its own key head and value head — h independent Q/K/V triples. That gives maximum representational flexibility, but it also means the KV cache stores h full sets of keys and values per token, per layer.

Multi-query attention (MQA) is the extreme opposite: keep all h query heads, but collapse the key and value heads down to just one shared pair. Every query head reads from the same K and V. Grouped-query attention (GQA) sits between the two: split the h query heads into g groups, and give each group its own shared K/V pair. Set g = h and you're back to full multi-head attention; set g = 1 and you have MQA. GQA is the tunable dial between "maximum quality, maximum memory" and "minimum memory, some quality cost." The mechanics of that dial, the memory math, and the "uptraining" recipe for retrofitting it onto an existing model are covered in full in [Grouped-Query and Multi-Query Attention](/learn/llm-foundations/grouped-query-attention) — this lesson focuses on why the middle of the spectrum, rather than either end, became the default.

## The mental model

Picture a research team of h analysts (the query heads), each independently deciding what's important, but pulling from a shared set of reference binders (the key/value pairs) instead of each maintaining a private archive. Full MHA gives every analyst their own private archive — thorough, but you're storing h copies of essentially overlapping information. MQA gives the whole team one binder — cheap to store, but if the binder doesn't happen to organize information the way one particular analyst needs, that analyst is stuck. GQA gives each small team of analysts its own binder: most of the storage savings of one shared archive, with enough distinct binders that no single analyst is starved of the right reference material.

## Why it works this way

What actually gives a query head its expressive power is *what it asks for* — the query vector — combined with *what's available to retrieve* — the keys and values. It turns out queries can stay fully diverse (each head still computes its own query projection) even when the pool of things they retrieve from is shared. A head doesn't need its own private key/value space to specialize; it can specialize in *how it weights* a shared pool via softmax. That's why sharing K/V hurts quality much less than you'd naively expect: the diversity that matters most for what a head "notices" lives on the query side, not the key/value side, and GQA only compresses the latter. Push the compression all the way to one shared pair (MQA) and you do start losing something, because now every head in the entire model is limited to the same retrieval pool — hence GQA's middle ground, where a handful of distinct pools is usually enough.

## A concrete example

Take a model with h = 32 query heads and sweep the group count g:

| Groups (g) | Query heads per group | KV cache reduction vs. full MHA |
|---|---|---|
| 32 (full MHA) | 1 | 1x |
| 16 | 2 | 2x |
| 8 | 4 | 4x |
| 4 | 8 | 8x |
| 1 (MQA) | 32 | 32x |

The reduction factor is simply h / g — going from 32 independent KV pairs to 8 shared ones cuts the cache by 4x for a one-time architectural choice, with no change to the model's parameter count elsewhere. [KV Cache Memory: MHA vs GQA vs MQA](/learn/llm-foundations/kv-cache-memory-mha-vs-gqa) works through what that reduction is worth in actual gigabytes for a realistic model.

## Where it shows up

GQA with a modest group count (commonly 8) is the standard choice in most current open-weight model families released at multiple sizes, while MQA remains in use in a handful of architectures optimized aggressively for serving cost. [Dense vs MoE vs GQA: Reading Real Design Choices](/learn/llm-foundations/dense-vs-moe-vs-gqa-design-choices) maps specific released models onto this spectrum.

## Watch out for

- **Confusing head count with KV head count.** A model config typically lists both `num_attention_heads` and `num_key_value_heads` separately — see [Reading a Real Model Config](/learn/llm-foundations/reading-a-real-model-config). If they match, it's full MHA; if `num_key_value_heads` is smaller, you're looking at GQA, and if it's 1, MQA.
- **Assuming GQA cuts attention FLOPs.** It mainly cuts memory footprint and memory-bandwidth cost (fewer distinct K/V tensors to store and stream from memory). The number of query-to-key dot products computed is governed by the number of query heads, which GQA doesn't touch — the savings are almost entirely on the K/V side.
- **Thinking the group boundaries are architecturally fixed forever.** Grouping is a configuration choice made at training time (or retrofitted via uptraining), not something that can be changed per-request at inference.

## Where next

[KV Cache Memory: MHA vs GQA vs MQA](/learn/llm-foundations/kv-cache-memory-mha-vs-gqa) turns this into an actual gigabyte calculation for a large model. From there, [FlashAttention](/learn/llm-foundations/flash-attention-intuition-and-tiling) attacks a different part of the same cost problem — how attention is computed, not how much of it needs to be cached.

**Related:** [Grouped-Query and Multi-Query Attention](/learn/llm-foundations/grouped-query-attention), [The KV Cache: How LLMs Avoid Recomputing the Past](/learn/llm-foundations/the-kv-cache), [Multi-Head Attention: Why One Attention Pattern Isn't Enough](/learn/llm-foundations/multi-head-attention), [Reading a Real Model Config](/learn/llm-foundations/reading-a-real-model-config)
