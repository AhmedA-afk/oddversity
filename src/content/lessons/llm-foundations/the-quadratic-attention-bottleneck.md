---
title: "The Quadratic Attention Bottleneck"
track: "llm-foundations"
status: live
summary: "Why attention cost grows with the square of sequence length, and why that single fact shapes almost every efficiency trick in modern LLMs."
duration: "6 min read"
---

Double a model's context window and you might expect the cost to double. It doesn't — it roughly quadruples. That gap between intuition and reality is the single fact this whole module exists to work around.

## What it is

[Self-attention](/learn/llm-foundations/attention-mechanism-explained) computes a relevance score between every pair of token positions in a sequence. For a sequence of length n, that means building an n × n matrix of scores — one row per query position, one column per key position. Computing that matrix, running softmax over it, and using it to weight the values all cost work proportional to n². Everything else in a transformer block — the [feed-forward layer](/learn/llm-foundations/the-feed-forward-block), the projections in and out of attention — costs work proportional to n. Attention is the one part of the block whose cost grows faster than the input does.

## The mental model

Picture every token writing a short note to every other token: "here's how relevant I am to you." With n tokens, that's n × n notes — not n notes, n². A sequence of 100 tokens needs 10,000 of these pairwise comparisons per head, per layer. A sequence of 1,000 tokens needs 1,000,000. You haven't added 10x the tokens, you've added 100x the pairwise comparisons.

## Why it works this way

This isn't a bug or an oversight — it's the direct consequence of the thing that makes attention powerful. [The transformer architecture](/learn/llm-foundations/the-transformer-architecture) won over recurrent models precisely because any token can look at any other token directly, regardless of distance, in a single step. That all-pairs comparison is what lets a model connect a pronoun to a noun 200 words back as easily as one three words back. You can't get "every token can directly compare itself to every other token" without paying for every pair — that's what all-pairs means. The quadratic cost is the price of the mechanism, not a flaw in its implementation.

## A concrete example

Take a single attention head with a 128-dimensional head size, and ask how big the raw score matrix gets, stored naively as 32-bit floats, at different context lengths.

| Context length | Score matrix entries (n²) | Size at fp32 (per head, per layer) |
|---|---|---|
| 2,048 | 4,194,304 | 16 MiB |
| 8,192 (4x) | 67,108,864 | 256 MiB |
| 32,768 (16x) | 1,073,741,824 | 4 GiB |
| 131,072 (64x) | 17,179,869,184 | 64 GiB |

Going from a 2k to a 128k context multiplies the sequence length by 64 — but it multiplies the score matrix by 64² = 4,096. Sixteen mebibytes becomes 64 gibibytes, *for one head, in one layer*, if you tried to materialize the whole thing at once. Multiply that by dozens of layers and dozens of heads and you can see why nobody actually does this — which is exactly the problem [FlashAttention](/learn/llm-foundations/flash-attention-intuition-and-tiling) solves.

Contrast this with the [KV cache](/learn/llm-foundations/the-kv-cache), which stores one key and value vector per token — its size grows *linearly* with n. That distinction matters: going 2k → 128k grows the KV cache 64x, but grows the attention score matrix 4,096x. Two different bottlenecks, two different growth rates, and the rest of this module is organized around attacking them separately.

## Where it shows up

This bottleneck is why "just make the context window bigger" isn't free. It shows up as rising per-token latency and memory pressure as conversations, documents, or agent transcripts grow; it's why long-context inference and training runs need dedicated engineering rather than just larger GPUs; and it's the reason [counting the FLOPs of one token](/learn/llm-foundations/counting-the-flops-of-one-token) changes character entirely once n gets large — attention terms that were negligible at short context start to dominate the total.

## Watch out for

- **Confusing FLOPs with memory.** The n² term above is a compute *and* a memory-traffic problem, but it's a different growth curve from the KV cache's memory problem (linear in n). Fixes for one (like GQA, which shrinks the cache) don't fix the other.
- **Assuming this is uniform across the stack.** The quadratic cost is per-layer, per-head. A 32-layer, 32-head model pays this penalty 1,024 times over — small constant-factor improvements compound.
- **Treating "context window" as a single number with one cost.** Doubling context doesn't just cost "more" — it costs a specific, predictable 4x more in attention compute, which is worth doing the arithmetic on before assuming a bigger window is a cheap upgrade.

## Where next

The rest of this module is a tour of ways to dodge this cost: sharing keys and values across heads ([Multi-Query and Grouped-Query Attention](/learn/llm-foundations/multi-query-and-grouped-query-attention)), computing attention exactly but without ever materializing the full matrix ([FlashAttention](/learn/llm-foundations/flash-attention-intuition-and-tiling)), restricting which token pairs can interact at all ([Sparse, Sliding-Window, and Linear Attention](/learn/llm-foundations/sparse-sliding-and-linear-attention)), and replacing attention altogether with a fixed-size recurrent state ([Beyond Attention: State-Space Models and Mamba](/learn/llm-foundations/attention-alternatives-ssms-and-mamba)).

**Related:** [The Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained), [The KV Cache: How LLMs Avoid Recomputing the Past](/learn/llm-foundations/the-kv-cache), [Counting the FLOPs of One Token](/learn/llm-foundations/counting-the-flops-of-one-token), [The Transformer Architecture](/learn/llm-foundations/the-transformer-architecture)
