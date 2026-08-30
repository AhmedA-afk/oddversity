---
title: "Counting the FLOPs of One Token"
track: "llm-foundations"
status: live
summary: "Estimating the arithmetic cost of one generated token, and where the 2N-FLOPs shortcut starts to lie."
duration: "8 min read"
---

> **Optional depth.** Everything else in this module gets you a correct mental model of what an LLM computes. This lesson puts real numbers on "how expensive is one token" — useful when you need to reason about cost or latency, skippable if you don't need that yet.

## The rule of thumb

Every parameter in a dense matrix multiply gets used exactly once per token, as one multiply and one accumulate — a MAC, 2 floating-point operations. Sum that over every parameter in the model's linear layers and you get a clean approximation used throughout the scaling-laws literature: a forward pass over one token costs roughly

```text
FLOPs(one token) ≈ 2 × N
```

where `N` is the model's (non-embedding) parameter count — the same `N` hand-computed in [reading a real model's config](/learn/llm-foundations/reading-a-real-model-config). Generating training gradients roughly triples this (forward plus a backward pass that costs about twice the forward), giving the companion rule `≈ 6N` per token during training — but this lesson stays on the inference side: one forward pass, one sampled token, `≈ 2N`.

## Worked example: a 7B model at 2k context

Take a 7B-parameter model architecturally similar to the publicly documented LLaMA-7B config: `n_layer = 32`, `n_embd = 4096`, `n_head = 32`, `N ≈ 7 × 10⁹`.

```text
2N  =  2 × 7×10⁹  =  1.4 × 10¹⁰ FLOPs   (≈ 14 GFLOPs)  per generated token
```

That's the linear-layer cost — every attention projection and every FFN matrix, summed across all 32 blocks, applied once to the newest token.

## What the `2N` rule leaves out

`2N` only accounts for the model's linear layers. It ignores the arithmetic *inside* attention itself — computing attention scores against every previous token and combining them — which scales with the current sequence length, not with `N`:

```text
attention FLOPs (one new token) ≈ 4 × n_layer × seq_len × n_embd
                                 = 4 × 32 × 2048 × 4096
                                 ≈ 1.07 × 10⁹ FLOPs   (≈ 1.07 GFLOPs)
```

At `seq_len = 2048`, that's about **7.6% on top of the `2N` estimate** (1.07 GFLOPs against 14 GFLOPs) — small enough that `2N` alone is a reasonable estimate here, but notice the two terms scale differently: `2N` is flat, independent of how long the sequence has grown, while the attention term grows linearly with `seq_len` for each new token. That difference is exactly [the quadratic attention bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck): as context length grows into the tens or hundreds of thousands of tokens, this "small correction" term stops being small.

## Extending to a full generated sequence

Generating a full `L`-token sequence autoregressively means paying the flat `2N` cost `L` times, plus the attention term summed across every step, where `seq_len` itself grows by 1 each time — a triangular sum, roughly `L²⁄2` instead of `L`:

```text
linear total     ≈ 2N × L               = 1.4×10¹⁰ × 2048  ≈ 2.87 × 10¹³ FLOPs
attention total  ≈ 4 × n_layer × n_embd × (L² / 2)
                 = 4 × 32 × 4096 × (2048² / 2)
                 ≈ 1.10 × 10¹² FLOPs
```

Generating all 2048 tokens costs roughly **28.7 TFLOPs from the linear layers** and about **1.1 TFLOPs from attention** — attention's share (~3.7% of the total here) is actually *smaller* relative to the whole generation than it was for a single token, because the linear cost accumulates at the same flat rate every step while the attention cost is still dominated by the shorter early steps in this triangular sum. That balance flips hard at much longer context lengths — the entire reason context length is treated as a first-class cost variable, not just a memory question, in [prefill vs. decode](/learn/llm-foundations/prefill-vs-decode-memory-bound) and [the KV cache](/learn/llm-foundations/the-kv-cache).

## Where the approximation actually breaks

`2N` is a compute estimate — it says nothing about *time*. In practice, the decode phase of generation (producing one token at a time) is usually bottlenecked by how fast the accelerator can move the growing KV cache through memory, not by how many FLOPs it can execute per second — meaning a GPU sitting well under its peak compute throughput can still be the bottleneck on latency. `2N` tells you the arithmetic cost of one token; it doesn't tell you the wall-clock time to produce it, which depends on hardware, batching, and exactly the memory-bandwidth constraints covered in [prefill vs. decode: compute-bound vs. memory-bound](/learn/llm-foundations/prefill-vs-decode-memory-bound).

## Connecting it to the rest of the track

This is the same `N` computed by hand in [reading a real model's config](/learn/llm-foundations/reading-a-real-model-config) — that lesson gets you the parameter count; this one turns it into a compute cost. And the same `≈2N` (inference) vs. `≈6N` (training) split is the arithmetic underneath [scaling laws](/learn/llm-foundations/scaling-laws-what-they-predict): once you can price one token, you can price an entire training run or an entire day of serving traffic the same way.

**Related:** [Reading a Real Model's Config](/learn/llm-foundations/reading-a-real-model-config), [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck), [Scaling Laws: What They Predict](/learn/llm-foundations/scaling-laws-what-they-predict)
