---
title: "Quiz: Efficient Architectures"
track: "llm-foundations"
status: live
summary: "Eight questions on the quadratic bottleneck, GQA/MQA memory, FlashAttention's exactness, MoE routing, and sparse attention tradeoffs."
duration: "9 min read"
---

Eight questions covering the ground from [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck) through [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes). Work through them before checking each answer.

## 1. The quadratic bottleneck

You increase context length from 4k to 16k tokens — a 4x increase. By what factor does the raw attention score matrix (per head, per layer) grow?

A) 4x
B) 8x
C) 16x
D) It stays the same, because the KV cache absorbs the extra length

<details><summary>Answer</summary>

**Correct: C.** The score matrix is n × n, so a 4x increase in sequence length produces a 4² = 16x increase in matrix size.

- A) This is the *sequence length's* growth factor, not the score matrix's — it's the mistake of treating attention cost as linear when it's quadratic.
- B) Not derived from anything in the setup — there's no operation here that produces an 8x factor.
- C) Correct — quadratic growth means squaring the growth factor of the input: 4² = 16.
- D) The KV cache is a real, separate structure, but it scales *linearly* with sequence length (4x, not 16x) and doesn't change how the score matrix itself scales — the two are different bottlenecks with different growth rates.

</details>

## 2. GQA memory vs. compute

A model uses grouped-query attention with 32 query heads split into 8 groups. Which statement is correct?

A) There are 8 distinct K/V pairs, each shared by 4 query heads, and attention FLOPs are roughly unchanged from full multi-head attention
B) There are 8 distinct K/V pairs, and the model performs roughly 8x fewer attention FLOPs than full multi-head attention
C) There is only 1 shared K/V pair, used by all 32 query heads
D) GQA reduces the number of query heads from 32 down to 8

<details><summary>Answer</summary>

**Correct: A.** Grouping reduces the number of distinct key/value sets, which shrinks the KV cache and the K/V projection cost — but each of the 32 query heads still computes its own dot products against its group's keys over the full sequence, so the dominant attention FLOPs (the Q·Kᵀ and softmax·V steps) are essentially unaffected by grouping.

- A) Correct — this is the core distinction the whole module draws: GQA is a memory and bandwidth optimization, not primarily a FLOPs optimization.
- B) This is the common misconception the correct answer corrects — fewer distinct K/V sets doesn't mean fewer query-to-key comparisons; there are still 32 query heads each attending over the sequence.
- C) That describes MQA (group count = 1), not GQA with 8 groups.
- D) GQA never changes the number of query heads — it only changes how many distinct key/value heads those query heads share.

</details>

## 3. KV cache memory calculation

A model has 2 layers, 32 query heads but only 4 KV heads (GQA), a head dimension of 8, and is serving a single sequence of 1,024 tokens with the cache stored in fp16 (2 bytes per number). What's the total KV cache size for this sequence?

A) 256 KiB
B) 2 MiB
C) 512 KiB
D) 128 KiB

<details><summary>Answer</summary>

**Correct: A.** `elements = 2 (K and V) × 2 layers × 4 KV heads × 8 head_dim × 1,024 tokens = 131,072`; `bytes = 131,072 × 2 (fp16) = 262,144 bytes = 256 KiB`.

- A) Correct — the formula uses `num_kv_heads` (4), not the query head count.
- B) This is what you get if you mistakenly plug in the 32 query heads instead of the 4 KV heads: `2 × 2 × 32 × 8 × 1,024 × 2 = 2,097,152 bytes = 2 MiB`. It's the exact error tested in Question 2 — conflating query heads with KV heads.
- C) This is what you get by using fp32 (4 bytes) instead of the stated fp16 (2 bytes): `131,072 × 4 = 524,288 bytes = 512 KiB`. Always match the precision given in the problem.
- D) This is what you get by forgetting the factor of 2 for storing both K *and* V: `1 × 2 × 4 × 8 × 1,024 × 2 = 131,072 bytes = 128 KiB` — half the correct answer.

</details>

## 4. FlashAttention's exactness

Which best describes what FlashAttention computes, relative to naive full-matrix attention?

A) An approximation of softmax attention, trading a small accuracy loss for speed
B) The exact same softmax attention output, just computed in blocks with less memory traffic
C) A sparse approximation that skips some token pairs entirely
D) A lower-precision, quantized version of attention

<details><summary>Answer</summary>

**Correct: B.** The online-softmax recurrence produces bit-for-bit-equivalent results (up to floating-point rounding) to the naive computation — it changes how the computation is organized in memory, not what it computes.

- A) This is the most common misconception about FlashAttention — it is exact, not an approximation. Nothing about the math it performs differs from naive attention.
- B) Correct — this is the "IO-aware, not approximate" point stressed throughout [FlashAttention: The Tiling and Online-Softmax Idea](/learn/llm-foundations/flash-attention-intuition-and-tiling).
- C) That describes sliding-window or sparse attention (see [Sparse, Sliding-Window, and Linear Attention](/learn/llm-foundations/sparse-sliding-and-linear-attention)), which is a genuinely different technique that does skip token pairs — FlashAttention computes every pair, just without materializing the full matrix at once.
- D) FlashAttention doesn't require any change in numerical precision — it can be, and is, used with the same precision as any other attention implementation.

</details>

## 5. MoE routing mechanics

A router computes softmax over 4 experts' logits, then keeps only the top-2 weights, discarding the other two. What must happen to the two kept weights before they're used to combine expert outputs?

A) Nothing — use the original softmax values directly
B) Renormalize the two kept weights so they sum to 1
C) Multiply the two kept weights by 2
D) Set both kept weights to 0.5, regardless of their original values

<details><summary>Answer</summary>

**Correct: B.** After discarding two of the four experts' probability mass, the remaining two weights no longer sum to 1 — renormalizing keeps the combination a properly weighted average of just the experts that actually ran.

- A) Using the raw softmax weights without renormalizing would understate the combined output, since roughly half the original probability mass (from the discarded experts) is simply missing.
- B) Correct — this is exactly the renormalization step worked through numerically in [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing) and implemented in [A Toy MoE Router in Numpy](/learn/llm-foundations/toy-moe-router-in-numpy).
- C) There's no principled reason to double the weights — this doesn't correspond to any real routing implementation.
- D) This throws away the actual relative confidence the router computed between the two chosen experts, which is exactly the information renormalization is meant to preserve.

</details>

## 6. Is this parameter comparison correct?

A model card says: "Model X: 8 experts × 7B parameters = 56B total, top-2 routing, so it should cost about the same to run per token as a 14B dense model, since 2 experts of 7B are active." Which statement about this reasoning is correct?

A) Both the 56B total and the ~14B active-compute comparison are correct
B) The 56B total is wrong, because shared attention and embedding layers mean the actual total is lower — but the rough idea of comparing active compute to a similarly-sized dense model is directionally reasonable
C) The 56B total is correct, but active compute has nothing to do with the number of active experts
D) Neither number means anything, because MoE models don't have a well-defined parameter count

<details><summary>Answer</summary>

**Correct: B.** The multiplication error is the one covered in [Misreading Parameter Counts](/learn/llm-foundations/misreading-parameter-counts): attention and embedding layers aren't duplicated per expert, so 8×7B overstates the real total. But the *spirit* of comparing active parameters (roughly 2 experts' worth of FFN, plus shared components) to a dense model of similar active size is a reasonable way to estimate compute cost, even if it's not exact.

- A) The 56B figure is specifically wrong for the reason given in B — it double-counts shared components.
- B) Correct — one part of the claim is a real, identifiable error; the other part is a reasonable practical heuristic, and distinguishing the two is the point of this question.
- C) This gets it backwards — active compute is *precisely* determined by how many experts actually run per token, which is the whole mechanism behind [Why MoE Buys Capacity Without Proportional Compute](/learn/llm-foundations/why-moe-buys-capacity-without-compute).
- D) MoE models absolutely have a well-defined total parameter count — it just requires correctly accounting for shared versus per-expert components, not throwing the concept out entirely.

</details>

## 7. Sparse attention tradeoffs

A model uses a sliding window of 512 tokens — each token attends only to the 512 tokens directly before it — instead of full attention. What's the main risk this introduces?

A) It can no longer directly connect information more than 512 tokens apart, within a single layer
B) It becomes slower than full attention
C) It changes softmax normalization so the attention weights no longer sum to 1
D) It requires the same quadratic memory as full attention

<details><summary>Answer</summary>

**Correct: A.** A sliding window makes information outside the window architecturally unreachable *for that layer* — not harder to learn, but genuinely inaccessible in a single attention step, as covered in [Sparse, Sliding-Window, and Linear Attention](/learn/llm-foundations/sparse-sliding-and-linear-attention).

- A) Correct — this is the real tradeoff: cheaper compute in exchange for a hard limit on single-layer reach.
- B) The entire point of a sliding window is to be *cheaper* than full attention, not slower — cost drops from quadratic to roughly linear in sequence length.
- C) Softmax still normalizes correctly over whatever's inside the window — the weights within that window still sum to 1, they're just computed over fewer candidates.
- D) The opposite is true — sliding-window attention's cost is linear in sequence length, not quadratic, since the window size is fixed regardless of how long the sequence gets.

</details>

## 8. MoE load balancing

Without any auxiliary load-balancing loss, what commonly goes wrong when training a mixture-of-experts model?

A) All experts converge to identical weights, so the model behaves like a dense model
B) The router increasingly concentrates tokens on a small subset of "popular" experts, leaving the rest undertrained and effectively wasted capacity
C) The model's KV cache grows unboundedly
D) Training becomes numerically unstable and the loss immediately diverges to NaN

<details><summary>Answer</summary>

**Correct: B.** This is expert collapse, described in [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes): a rich-get-richer feedback loop where an expert that randomly gets slightly more tokens early on gets more training, gets better, and attracts even more tokens — while other experts sit idle and untrained despite occupying just as much memory.

- A) Collapse concentrates *routing*, not weights — the popular experts don't converge toward looking like each other; they simply receive most of the traffic while others are neglected.
- B) Correct — this is the specific, well-documented failure mode the auxiliary load-balancing loss exists to prevent.
- C) The KV cache is an attention/context-length concept, unrelated to how MoE routing distributes tokens across experts.
- D) Expert collapse is usually a *quiet* degradation of utilization visible in per-expert load statistics, not a dramatic training crash — the aggregate task loss can look perfectly reasonable while collapse is happening, which is exactly what makes it easy to miss.

</details>

**Related:** [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck), [Multi-Query and Grouped-Query Attention](/learn/llm-foundations/multi-query-and-grouped-query-attention), [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing), [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes)
