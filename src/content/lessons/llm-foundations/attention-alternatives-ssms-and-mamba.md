---
title: "Beyond Attention: State-Space Models and Mamba"
track: "llm-foundations"
status: live
summary: "State-space models trade attention's growing KV cache for a fixed-size recurrent state, at the cost of exact long-range recall."
duration: "8 min read"
---

Every technique so far in this module has been a way of making attention cheaper without giving it up. This lesson asks the more radical question: what if you replaced attention's core mechanism entirely with something that costs linear, not quadratic, time by construction?

## Full self-attention (the baseline)

**How it works.** Recap from [The Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained): every token computes a relevance score against every earlier token and pulls in a weighted combination of their values, with the full history available at every step via the [KV cache](/learn/llm-foundations/the-kv-cache).

**When it wins.** Whenever the task needs precise, arbitrary long-range recall — pulling one exact detail (a name, an ID, a specific line) from anywhere in a long context, regardless of how far back it is. Attention keeps every token's key and value explicitly, so nothing is lost to compression.

**Failure mode.** The cost problem this whole module exists to address: O(n²) compute described in [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck), and a KV cache that grows linearly forever and never shrinks back down.

**Relative cost.** Highest asymptotic cost of anything on this list, in exchange for the most flexible, least lossy access to context.

## S4 (Structured State Space Sequence models)

**How it works.** Borrowed from control theory: treat the sequence as observations of a continuous-time linear dynamical system, discretized into a recurrence `h_t = A h_{t-1} + B x_t`, `y_t = C h_t`. The hidden state `h_t` is a fixed-size vector — it doesn't grow as the sequence gets longer. A carefully structured, input-independent parameterization of `A` (initialized so the state naturally retains a useful decaying memory of the past, an approach known as HiPPO) makes this recurrence trainable at scale. Because the recurrence is linear, it can also be unrolled as a global convolution and computed efficiently via FFT during training, while inference just runs the step-by-step recurrence.

**When it wins.** Very long sequences — audio, long time series, anything where the relevant signal is more about accumulated or gradually decaying context than about pinpointing one exact distant token.

**Failure mode.** The state is a fixed-size *compressed* summary of everything seen so far. Compression is lossy by nature — S4 can struggle with tasks that need to recall one specific, exact piece of information from far back, precisely the kind of task where explicit per-token attention has an advantage.

**Relative cost.** Linear compute in sequence length, and — the headline benefit — a fixed-size state at inference time. No KV cache that grows with context; generating token 100,000 costs the same per-step work as generating token 100.

## Mamba (selective state-space models)

**How it works.** Mamba's departure from S4 is making the `A`, `B`, and `C` matrices depend on the current input token, rather than being fixed for the whole sequence — a mechanism called **selectivity**. This lets the model decide, token by token, what's worth keeping in its fixed-size state and what to let decay or forget, based on the actual content it's seeing — something S4's input-independent dynamics couldn't do. This is the change that made SSMs competitive with attention on language modeling rather than mainly on continuous signals like audio. Selectivity breaks the trick that let S4 be computed as a single global convolution, so Mamba instead relies on a hardware-aware parallel scan to keep training efficient despite the added input-dependence.

**When it wins.** Long-context language modeling where a growing KV cache is the dominant serving cost — streaming applications, very long documents, or any setting where constant-size memory during generation matters more than exact recall of an arbitrary distant token.

**Failure mode.** Still a fixed-size state, so precise, needle-in-a-haystack-style retrieval from deep in a long context can be weaker than a model that keeps every token's key and value explicitly. It's also architecturally newer and less extensively battle-tested at the largest scales than attention.

**Relative cost.** Linear compute and memory in sequence length, with a constant-size state during generation — the state doesn't grow as more tokens are produced, which is the direct alternative to the linearly-growing KV cache described in [The KV Cache: How LLMs Avoid Recomputing the Past](/learn/llm-foundations/the-kv-cache).

## Hybrid attention + SSM architectures

**How it works.** Interleave a minority of full or local attention layers among a majority of SSM (typically Mamba-style) layers in the same stack. The SSM layers handle the bulk of sequence processing cheaply; the occasional attention layer provides precise long-range retrieval where the SSM's compressed state would fall short.

**When it wins.** When you want most of the cost benefit of a linear-time architecture but aren't willing to give up attention's precise recall entirely — a middle ground rather than a full commitment to either mechanism.

**Failure mode.** More architectural complexity: deciding how many layers should be attention versus SSM, and where, is an additional design surface with no single settled answer. It also doesn't fully eliminate the KV cache problem — whichever layers keep attention still keep a cache that grows with context, just for a fraction of the stack instead of all of it.

**Relative cost.** Between pure-SSM and pure-attention on every axis — most of the stack scales linearly, with the remaining quadratic cost and cache growth concentrated in the minority of attention layers.

## Decision table

| Approach | Per-step inference cost | State/cache growth with context | Exact long-range recall | Maturity |
|---|---|---|---|---|
| Full attention | Grows with context (attends to everything cached) | Linear (KV cache) | Strongest | Most established |
| S4 | Constant | None (fixed-size state) | Weakest | Mostly audio/signal domains |
| Mamba | Constant | None (fixed-size state) | Weaker than attention | Newer, growing language use |
| Hybrid attention + SSM | Mostly constant, occasional attention layers | Partial (only attention layers cache) | Better than pure SSM | Emerging |

## How to choose

If a task's success depends on retrieving one specific fact verbatim from anywhere in a very long context, full attention's explicit per-token memory is hard to beat — that's exactly the case [sparse and linear attention variants](/learn/llm-foundations/sparse-sliding-and-linear-attention) also have to reckon with when they compress or restrict what a layer can see. If the dominant cost concern is serving very long contexts or long streaming generations where a growing KV cache is the actual bottleneck (see [Context Window Mechanics and Limits](/learn/llm-foundations/context-window-mechanics-and-limits)), a pure SSM or a hybrid design trades some of that precise recall for a memory footprint that simply doesn't grow. This is one more axis in the same design space covered in [Dense vs MoE vs GQA: Reading Real Design Choices](/learn/llm-foundations/dense-vs-moe-vs-gqa-design-choices) — attention-versus-SSM is an architectural choice made at training time, not something switched per request.

**Related:** [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck), [The KV Cache: How LLMs Avoid Recomputing the Past](/learn/llm-foundations/the-kv-cache), [Sparse, Sliding-Window, and Linear Attention](/learn/llm-foundations/sparse-sliding-and-linear-attention), [Context Window Mechanics and Limits](/learn/llm-foundations/context-window-mechanics-and-limits)
