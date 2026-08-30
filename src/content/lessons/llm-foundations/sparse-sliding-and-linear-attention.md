---
title: "Sparse, Sliding-Window, and Linear Attention"
track: "llm-foundations"
status: live
summary: "Four ways to make attention sub-quadratic by changing which token pairs get to interact at all, and what each one gives up to get there."
duration: "8 min read"
---

[FlashAttention](/learn/llm-foundations/flash-attention-intuition-and-tiling) makes attention cheaper to *compute* without changing what it computes. This lesson is about the opposite move: change what gets computed at all, by deciding in advance that most token pairs simply won't be allowed to interact.

## Sliding-window attention

**How it works.** Each token attends only to a fixed-size window of the most recent tokens before it — say, the last 4,096 — instead of the entire history. The score matrix shrinks from n × n to roughly n × window_size, which is linear in sequence length once the window is fixed.

**When it wins.** Most useful information in text tends to be local — the words needed to parse the current clause are usually nearby. A sliding window captures that local structure at a fraction of full attention's cost, and stacking several layers of it still lets information propagate further: a signal from 4,096 tokens back can reach a token 4,096 positions later after passing through one more layer, so depth partially compensates for the narrow window.

**Failure mode.** Any information that needs to connect two points in the sequence farther apart than the window, *within a single layer*, is architecturally unreachable — not "harder to learn," but genuinely inaccessible to that layer's attention. Tasks needing exact recall of something far outside the window (a name mentioned once at the very start of a long document) can fail even when the model is otherwise strong.

**Relative cost.** Linear in sequence length; the cheapest option on this list for a given context length, since it doesn't need any global bookkeeping.

## Dilated attention

**How it works.** A variation on the windowed idea: instead of attending to a contiguous block of recent tokens, attend to every k-th token further back — the window "skips" positions the way a dilated convolution does, trading density for reach. A dilation factor of 4 lets a fixed-size window see 4x further back, at the cost of only seeing a quarter of the positions within that reach.

**When it wins.** When you need a cheap way to extend how far back a single layer's attention can reach without paying full attention's cost, and the task tolerates attending to a sparse sample of distant context rather than all of it.

**Failure mode.** The tokens *skipped* by the dilation pattern are invisible to that layer, just like tokens outside a sliding window are — if the one relevant token happens to fall on a skipped position, that layer simply cannot see it. Different layers using different dilation offsets is a common mitigation, but it's a mitigation, not a fix.

**Relative cost.** Similar to sliding-window — linear in sequence length, with a tunable reach-versus-density trade controlled by the dilation factor.

## Global + local attention (Longformer / BigBird style)

**How it works.** Combine a local pattern (most tokens use sliding-window attention) with a small set of designated "global" tokens that attend to, and are attended to by, every other token in the sequence. A classification token, or task-specific markers, act as information hubs that every local window can route through.

**When it wins.** Tasks that need most processing to stay local and cheap, but also need a small number of specific positions (a question, a summary token, document boundaries) to see and be seen by everything. The global tokens act as a low-cost bridge for exactly the kind of long-range fact that pure sliding-window attention can't reach.

**Failure mode.** The benefit depends entirely on picking the right tokens to make global. If the information that needs to travel far doesn't happen to route through a global token, it's stuck in the same local-only limitation as plain sliding-window attention. It also adds architectural complexity: two attention patterns to implement and tune instead of one.

**Relative cost.** Still roughly linear in sequence length — the global tokens add an O(n) term (each attends to all n, and all n attend to them), which stays cheap as long as the number of global tokens is small and fixed.

## Linear / kernelized attention

**How it works.** Standard attention computes softmax(QKᵀ)V, and the softmax is what forces you to materialize the full n × n matrix — you need every score before you can normalize any of them. Linear attention variants replace the softmax with a kernel feature map φ applied to Q and K separately, so the math becomes φ(Q)(φ(K)ᵀV) — and matrix multiplication is associative, so you can compute φ(K)ᵀV first, giving a d × d matrix that never scales with sequence length at all. Cost becomes linear in n instead of quadratic, because you never form the n × n matrix in the first place — not because you compute it faster.

**When it wins.** Very long sequences where even FlashAttention's exact-but-memory-efficient approach is still ultimately doing O(n²) work — linear attention changes the exponent itself, which matters most at the longest lengths.

**Failure mode.** The kernel feature map is an approximation of softmax's sharp, peaked attention distribution — it tends to produce flatter, less selective attention patterns, which has historically cost some quality relative to full softmax attention, especially on tasks that need precise, winner-take-all retrieval of one specific token among many.

**Relative cost.** Linear in sequence length for both compute and the size of the running state — structurally the cheapest option here for very long contexts, at a quality cost that varies by task and kernel choice.

## Decision table

| Approach | Which token pairs can interact | What it saves | Main failure mode |
|---|---|---|---|
| Sliding-window | Only within a fixed local window | Compute + memory, linear in n | Blind beyond the window, in a single layer |
| Dilated | A sparse, spaced-out sample further back | Compute + memory, linear in n | Blind to skipped positions |
| Global + local | Local window, plus all-to-all via global tokens | Compute + memory, linear in n | Only helps if the right tokens are made global |
| Linear / kernelized | All pairs, but through a compressed running state instead of explicit pairwise scores | Compute + memory, linear in n, no explicit n × n matrix ever | Flatter, less selective attention than softmax |

## How to choose

If the task is dominated by local structure (most of natural language, code within a function), sliding-window attention alone is often enough and is the simplest to implement and reason about. If you need a handful of long-range anchors — a question that needs to see a whole document, a summary token — global + local patterns are a targeted fix rather than a blanket one. Dilated patterns are worth reaching for when you want more long-range reach than a sliding window gives without the bookkeeping of designated global tokens. Linear attention is the right tool when sequence lengths are long enough that even sub-quadratic-but-still-quadratic approaches strain, and when the task can tolerate softmax's sharp selectivity being traded for a compressed, additive state — which is also the same trade-off explored from a different angle in [Beyond Attention: State-Space Models and Mamba](/learn/llm-foundations/attention-alternatives-ssms-and-mamba). In practice, none of these fully replace dense attention in frontier models today; they're most often used for specific layers, specific tasks, or specific context-length regimes where the quadratic cost of full attention (see [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck)) is simply not affordable.

**Related:** [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck), [FlashAttention: The Tiling and Online-Softmax Idea](/learn/llm-foundations/flash-attention-intuition-and-tiling), [Beyond Attention: State-Space Models and Mamba](/learn/llm-foundations/attention-alternatives-ssms-and-mamba), [Context Window Mechanics and Limits](/learn/llm-foundations/context-window-mechanics-and-limits)
