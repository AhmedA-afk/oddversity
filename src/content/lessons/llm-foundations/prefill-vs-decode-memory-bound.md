---
title: "Prefill vs Decode: Why Inference Is Memory-Bound"
track: "llm-foundations"
status: live
summary: "Decode does almost no compute per byte of weight it loads — arithmetic intensity, worked out from first principles, is why batching is the fix."
duration: "9 min read"
---

*Optional depth: this derives, with real arithmetic, the claim [the KV cache: what it is and why it exists](/learn/llm-foundations/the-kv-cache-what-and-why) states but doesn't prove — that decode is "memory-bound." Worth it once you want to know exactly what that phrase is quantifying.*

"Memory-bound" gets said about LLM decoding constantly, usually without the number that justifies it. Here's that number, derived, and the one lever — batching — that actually moves it.

## The two-phase cost model

Prefill processes the entire input prompt in one parallel pass: every prompt token's query, key, and value get computed in a single batched matrix multiply, exactly as shown in [the KV cache step by step](/learn/llm-foundations/kv-cache-step-by-step-shapes). Decode then generates one token at a time, each step reading the growing cache and computing exactly one new token's worth of work.

These two phases have genuinely different bottlenecks, and the reason comes down to a single ratio: how much computation you get per byte of data you had to move to do it.

## Arithmetic intensity, defined and computed

**Arithmetic intensity** is FLOPs performed divided by bytes moved from memory:

```text
arithmetic intensity = FLOPs / bytes moved
```

A rough, widely-used approximation for a dense transformer's forward pass is about 2 FLOPs per parameter per token processed (see [counting the FLOPs of one token](/learn/llm-foundations/counting-the-flops-of-one-token) for where that factor of 2 comes from). Call the parameter count `P`, and say the model runs in fp16 — 2 bytes per parameter.

**Decode, one token at a time.** To generate a single token, the model has to touch every weight once — there's no way around reading the full parameter set to compute one token's forward pass. That's `2 × P` bytes moved. The compute for that one token is `2 × P` FLOPs (one token, one pass over `P` parameters). So:

```text
AI_decode = (2P FLOPs) / (2P bytes) = 1 FLOP per byte, roughly (exact constant depends on precision and architecture details)
```

That's an extremely low ratio. You loaded the entire weight matrix into the compute units and only asked it to do one multiply-accumulate's worth of work per weight before moving on to the next step and reading it all over again.

**Prefill, `T` tokens at once.** Processing a `T`-token prompt in one batched pass still only requires reading each weight *once* — the same `2P` bytes — but now that single weight-load is reused to compute `T` tokens' worth of output: `2 × P × T` FLOPs.

```text
AI_prefill = (2PT FLOPs) / (2P bytes) = T FLOPs per byte, roughly
```

For a 1,000-token prompt, that's on the order of 1,000 FLOPs per byte moved — a thousand-fold higher arithmetic intensity than a single decode step, purely because the same weight-read is amortized across a thousand tokens' worth of compute instead of one.

## Why this determines the bottleneck

Every accelerator has two separate ceilings: a maximum compute throughput (FLOPs/second) and a maximum memory bandwidth (bytes/second). Divide one by the other and you get the accelerator's own "balance point" — the arithmetic intensity below which you're limited by how fast you can move data, and above which you're limited by how fast you can compute on it. This is the standard roofline model used to reason about hardware utilization.

Real accelerators are built with far more FLOPs/second capacity than bytes/second capacity, so their balance point sits well above 1 FLOP/byte — the exact ratio varies by hardware generation and isn't the point here; what matters is the *direction*. Decode's arithmetic intensity of roughly 1 sits far below essentially any modern accelerator's balance point, meaning decode's compute units spend most of their time idle, waiting for weights to arrive from memory. Prefill's arithmetic intensity, scaling with `T`, tends to sit near or above that balance point for any reasonably long prompt — which is exactly why prefill is described as compute-bound and decode as memory-bound. The compute is being requested at wildly different rates relative to the data it needs, even though both phases run the exact same model.

**One more term belongs in the decode bytes figure.** Beyond the model's own weights, every decode step also has to read the entire KV cache back out of memory to compute attention against it — and that cache grows with every token generated, as [context window mechanics and limits](/learn/llm-foundations/context-window-mechanics-and-limits) covers. Early in a generation the cache is small and weights dominate the bytes-moved figure; deep into a long context, the cache itself can become the larger of the two terms, making decode even more memory-bound than the weights-only estimate above suggests, not less.

## What recovers throughput: batching

The fix follows directly from the formula, not from a separate trick. `AI_decode = 1` came from reading `2P` bytes to do `2P` FLOPs for exactly one token. If instead you serve `B` different requests' decode steps together — each needs the same weights, so one weight-read still costs `2P` bytes, but now that read produces `B` tokens' worth of output instead of one:

```text
AI_batched_decode = (2PB FLOPs) / (2P bytes) = B FLOPs per byte, roughly
```

Batch 32 concurrent decode requests together and arithmetic intensity rises roughly 32-fold, without changing a single weight, changing the model, or touching sampling settings. This is the mechanism underneath [continuous batching](/learn/llm-foundations/quantization-and-inference-serving), which keeps a GPU's decode pipeline full of many different requests' single-token steps precisely so each weight-load is amortized across as many tokens as possible, rather than serving one request's decode loop in isolation and leaving the compute units idle between memory fetches.

## The tradeoff, stated precisely

Batching decode steps together raises throughput (tokens produced per second across all requests) but does nothing for the latency of any individual request — if anything, a very large batch can slightly increase per-token latency for everyone in it, since the batched matmul itself takes marginally longer to execute. Production serving is a genuine tradeoff between the two: batch too little and expensive accelerators sit memory-bound and underutilized; batch too aggressively and individual users notice their tokens arriving slightly slower. This is precisely the tension [quantization and inference serving](/learn/llm-foundations/quantization-and-inference-serving) picks up — continuous batching and paged attention exist specifically to keep batches large and well-packed without letting any one request wait too long for a batch to fill.

**Related:** [The KV Cache: What It Is and Why It Exists](/learn/llm-foundations/the-kv-cache-what-and-why) · [The KV Cache Step by Step](/learn/llm-foundations/kv-cache-step-by-step-shapes) · [Counting the FLOPs of One Token](/learn/llm-foundations/counting-the-flops-of-one-token) · [Context Window Mechanics and Limits](/learn/llm-foundations/context-window-mechanics-and-limits) · [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving) · [Training Time vs Inference Time](/learn/llm-foundations/training-time-vs-inference-time)
