---
title: "KV Cache Memory: MHA vs GQA vs MQA"
track: "llm-foundations"
status: live
summary: "A worked gigabyte calculation showing exactly how much memory GQA and MQA save over full attention at 8k context on a 70B-class model."
duration: "7 min read"
---

"GQA shrinks the KV cache" is easy to say and easy to nod along to. Here's what it actually means in gigabytes, for a model you could plausibly deploy.

## The setup

Take a 70B-class dense model with the published architecture of Llama 2's 70B variant as a concrete, realistic stand-in: 80 transformer layers, a hidden size of 8,192 split across 64 query heads of dimension 128 each. We'll compute the KV cache size for a single 8,192-token sequence, stored in fp16 (2 bytes per number), under three attention configurations: full multi-head attention (64 KV heads), GQA with 8 groups (8 KV heads), and MQA (1 KV head).

The general formula, per sequence:

```
KV cache bytes = 2 (for K and V) × num_layers × num_kv_heads × head_dim × seq_len × bytes_per_element
```

## Step by step

**Step 1 — Full multi-head attention (64 KV heads).**

```
elements = 2 × 80 × 64 × 128 × 8192
         = 10,737,418,240
bytes    = 10,737,418,240 × 2   (fp16)
         = 21,474,836,480 bytes
         = 20 GiB
```

> **Why this step?** This is the baseline: every one of the 64 query heads keeps its own private key and value vector, cached at every layer, for every one of the 8,192 tokens. Twenty gibibytes — for one sequence — is already larger than many single-GPU memory budgets, before the model's own weights are even loaded.

**Step 2 — GQA with 8 groups (8 KV heads).**

```
elements = 2 × 80 × 8 × 128 × 8192
         = 1,342,177,280
bytes    = 1,342,177,280 × 2
         = 2,684,354,560 bytes
         = 2.5 GiB
```

> **Why this step?** Only `num_kv_heads` changed — from 64 to 8, an 8x reduction — and the cache shrinks by exactly that factor: 20 GiB / 8 = 2.5 GiB. Nothing else in the formula moved, which is the whole point of [Multi-Query and Grouped-Query Attention](/learn/llm-foundations/multi-query-and-grouped-query-attention): the KV-head count is the only lever you're pulling.

**Step 3 — MQA (1 shared KV head).**

```
elements = 2 × 80 × 1 × 128 × 8192
         = 167,772,160
bytes    = 167,772,160 × 2
         = 335,544,320 bytes
         = 320 MiB
```

> **Why this step?** One shared K/V pair for all 64 query heads is a 64x reduction from full MHA: 20 GiB / 64 = 320 MiB. A single 8k-token sequence now costs less memory than a handful of JPEG photos.

**Step 4 — What this buys you in concurrent requests.**

Suppose your serving setup has 40 GB of memory left over for KV cache after the model's own weights and activation buffers are accounted for. Divide that budget by each configuration's per-sequence cost:

| Configuration | Cache per 8k-token sequence | Concurrent 8k sequences in 40 GB |
|---|---|---|
| Full MHA | 20 GiB | ~2 |
| GQA-8 | 2.5 GiB | ~16 |
| MQA | 320 MiB | ~128 |

> **Why this step?** This is the number that actually matters operationally: not "how much memory does one sequence use" but "how many users can this box serve at once." Moving from full MHA to GQA-8 is an 8x jump in concurrency for the same hardware — which is the real reason GQA became the default rather than a nice-to-have.

## Where it breaks (and the fix)

This math scales *linearly* with sequence length, so it doesn't stay this comfortable forever. Push the same GQA-8 model out to 128k tokens (16x longer than this example) and a single sequence's cache grows to 2.5 GiB × 16 = 40 GiB — the entire budget we just used to serve 16 concurrent 8k-token users, now consumed by *one* long-context request. GQA buys you a constant-factor win; it doesn't change the fact that cache size still grows with context length, which is a different axis from the one this lesson attacks.

The fixes that pick up from here run in a few directions: [FlashAttention](/learn/llm-foundations/flash-attention-intuition-and-tiling) doesn't shrink the cache but makes the attention computation over it far more memory-efficient at long lengths; [Sparse, Sliding-Window, and Linear Attention](/learn/llm-foundations/sparse-sliding-and-linear-attention) can cap how much context each token actually needs to keep around; and lower-precision KV storage (see [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving)) shrinks the same formula's bytes-per-element term further. In production these are typically combined with GQA rather than used instead of it — and the prefill/decode split described in [Prefill vs. Decode: Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) is exactly where this cache gets built and then repeatedly read.

## Takeaways

- KV cache bytes = 2 × layers × KV heads × head dim × sequence length × bytes per element — every term here except KV heads is fixed by the model's architecture and your request; KV heads is the term GQA and MQA let you tune.
- On a realistic 70B-class architecture, GQA-8 cuts an 8k-context cache from 20 GiB to 2.5 GiB per sequence — an 8x concurrency win at the same memory budget, matching the group-count reduction exactly.
- The savings are a constant multiplicative factor; cache size still grows linearly with context length regardless of attention variant, which is why long-context serving stacks GQA with other techniques rather than relying on it alone.

**Related:** [Multi-Query and Grouped-Query Attention](/learn/llm-foundations/multi-query-and-grouped-query-attention), [The KV Cache: How LLMs Avoid Recomputing the Past](/learn/llm-foundations/the-kv-cache), [Prefill vs. Decode: Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound), [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving)
