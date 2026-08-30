---
title: "Context Window Mechanics and Limits"
track: "llm-foundations"
status: live
summary: "Two mechanisms set the ceiling — how far positional encoding reaches, and how much KV-cache memory a server can afford — and they fail differently."
duration: "8 min read"
---

[Context window mechanics](/learn/llm-foundations/context-window-mechanics) establishes that the window is architectural, not a dial someone forgot to turn up. This lesson is about the two physical mechanisms that actually set where that ceiling sits, and why they don't fail the same way when you hit them.

## What it is

A context window isn't one limit — it's the tighter of two independent constraints that happen to usually get discussed as if they were one number.

**The first constraint is positional encoding range.** Every token needs to know its position in the sequence before attention can use that information, and how that position gets encoded determines what happens past a certain length. A model using learned absolute position embeddings has a literal embedding table with one row per position, sized at training time — position 4,097 in a table built for 4,096 positions simply doesn't exist; there's no row to look up. A model using [rotary position embeddings](/learn/llm-foundations/rotary-position-embeddings) has no such hard table — RoPE computes rotation angles from position mathematically, so there's no index to run out of — but the rotation frequencies were tuned against a training-length distribution, and pushing position far beyond that range produces angles the model never learned to interpret well, a soft degradation rather than a hard wall, one that dedicated frequency-scaling techniques exist specifically to push further out after training.

**The second constraint is KV-cache memory.** Even a model whose positional scheme has no hard ceiling still needs to store a key and value vector for every token in the [KV cache](/learn/llm-foundations/the-kv-cache-what-and-why), and that storage has to fit in the accelerator's physical memory alongside the model's own weights. A server can, in principle, refuse to serve past some context length purely because there isn't enough memory to hold the cache — a constraint that has nothing to do with what the positional encoding can represent and everything to do with hardware budget.

Whichever constraint is tighter for a given model and deployment is the one that actually determines the advertised context window.

## The mental model

Think of positional encoding range as the length of a hallway that was built with a certain number of doors, and KV-cache memory as how much shelf space exists to store what happens behind each door. A hallway built for 4,096 doors physically has no door 4,097 — that's the positional-encoding wall. Separately, even if you could build more doors on demand (as RoPE effectively can, within limits), you might run out of shelf space to store the contents behind them long before you run out of hallway — that's the memory wall. Two different things can stop you from going further, and they don't always hit at the same point.

## Why it works this way

Positional range and cache memory both trace back to the same root cause: attention needs every token to carry both an identity (learned during training, or computed via RoPE) and a stored representation (the K/V pair) that persists for the rest of generation. Neither of those requirements is optional — attention literally cannot compute a relevance score between two tokens without some encoding of their relative or absolute positions, and it cannot attend to a past token without that token's key and value already sitting in memory.

Here's the arithmetic that shows how these two costs scale differently as context grows, using the same style of estimate as [prefill vs decode: why inference is memory-bound](/learn/llm-foundations/prefill-vs-decode-memory-bound):

**KV-cache memory scales linearly with context length.** For a model with `L` layers, `H` attention heads, `head_dim` `d`, running in fp16 (2 bytes per number), the cache cost per token is `2 (K and V) × H × d × 2 bytes`, summed across all `L` layers. Say `L=32`, `H=32`, `d=128`: that's `2 × 32 × 128 × 2 = 16,384` bytes per token per layer, or about 512 KB per token across all 32 layers. At 4,096 tokens of context, the cache is roughly `512 KB × 4,096 ≈ 2 GB`. Double the context to 8,192 tokens and the cache is roughly `512 KB × 8,192 ≈ 4 GB` — exactly double, because cache size is linear in token count by construction: one new row per token, always the same size.

**Attention's own compute during prefill scales quadratically, not linearly.** Every one of `n` tokens attends to all `n` tokens (itself included, under the causal mask, up to its own position) — that's on the order of `n²` pairwise score computations per layer, not `n`. Double `n` and that term roughly quadruples, exactly as [context window mechanics](/learn/llm-foundations/context-window-mechanics) states. So while the *cache you have to store* doubles when context doubles, the *compute needed to build it during prefill* more than doubles — which is why doubling context window size tends to more than double both prefill latency (from the quadratic attention term) and the total memory pressure a server has to plan for once you account for holding that linearly-growing cache across many concurrent long-context requests at once, rather than for a single request in isolation.

## A concrete example (shown)

| Context length | KV-cache memory (this example model) | Attention score pairs per layer (relative) |
|---|---|---|
| 4,096 tokens | ≈ 2 GB | 1x (baseline) |
| 8,192 tokens | ≈ 4 GB (linear: exactly 2x) | ≈ 4x (quadratic: n² term) |
| 16,384 tokens | ≈ 8 GB (linear: exactly 2x again) | ≈ 16x |

The cache column moves in lockstep with token count. The attention-compute column accelerates away from it. Both are real costs of the same context-length increase, and conflating them — assuming "the cache doubled, so that's the whole cost of doubling context" — undercounts the actual latency and compute hit.

## Where it shows up

This is why frontier labs advertising ever-larger context windows is a genuine engineering achievement each time, not a checkbox: it requires either a positional scheme that tolerates extrapolation gracefully, enough accelerator memory to hold the resulting cache at serving scale, or architectural workarounds to sparse or restructure attention that avoid paying the full quadratic and linear costs at once. It's also why the token-in, token-out cost model in [tokens, context, and cost](/learn/ai-foundations/tokens-context-cost) is more than a billing detail — the number of tokens in your context isn't just what you pay for, it's what determines how much memory and compute a request actually consumes on the other end.

## Watch out for

- **Treating "the model supports 128K context" as "128K context is cheap to use."** Supported and affordable are different claims — a request near the top of a model's advertised window can cost meaningfully more in latency and memory than one at a tenth of that length, for the quadratic reasons above.
- **Assuming RoPE means there's no length limit.** RoPE removes the *hard table* limit of learned absolute embeddings, but performance still degrades past the range it was trained or scaled for — different positional schemes handle this differently, and none of them make the limit disappear entirely.
- **Forgetting that a full context window doesn't guarantee even attention across it.** Fitting inside the window is necessary but not sufficient for the model to use everything in it equally well — see [the lost-in-the-middle effect](/learn/llm-foundations/the-lost-in-the-middle-effect) for what happens to content that technically fits but sits in the wrong position.

## Where next

[The lost-in-the-middle effect](/learn/llm-foundations/the-lost-in-the-middle-effect) picks up exactly where this leaves off — what happens to attention quality well inside the window, not at its edge. [Prefill vs decode: why inference is memory-bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) has the fuller arithmetic on why memory-bound decode and compute-bound prefill scale so differently to begin with.

**Related:** [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) · [The KV Cache: What It Is and Why It Exists](/learn/llm-foundations/the-kv-cache-what-and-why) · [Rotary Position Embeddings](/learn/llm-foundations/rotary-position-embeddings) · [Prefill vs Decode: Why Inference Is Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) · [The Lost-in-the-Middle Effect](/learn/llm-foundations/the-lost-in-the-middle-effect) · [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost)
