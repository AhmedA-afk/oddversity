---
title: "Quiz: The Transformer Block"
track: "llm-foundations"
status: live
summary: "Eight questions on QKV attention, sqrt(d_k) scaling, causal masking, multi-head splitting, the FFN, and residual/norm placement."
duration: "6 min read"
---

Eight questions covering this module end to end, from [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup) through [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block). Work through them before checking each answer.

## 1. Queries, keys, and values

In self-attention, which of the three vectors is used to compute the actual content of the output — the one that's never compared against anything, only blended?

A. Query
B. Key
C. Value
D. The position embedding

<details>
<summary>Answer</summary>

**Correct: C.** The value is what gets weighted-and-summed into the output; it never participates in the similarity comparison.

- **A is incorrect.** The query is compared against keys to produce scores — it never appears in the output itself.
- **B is incorrect.** The key exists purely to be matched against queries; like the query, it never contributes to the output's content directly.
- **C is correct.** `output_i = Σ_j weight(i,j) * V_j` — only `V` appears on the right-hand side of the actual output computation.
- **D is incorrect.** Position embeddings are added to the input before Q/K/V are even computed; they aren't one of the three attention roles. See [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup).

</details>

## 2. Compute the weights

`d_k = 2`. A query `q = [1, 1]` is compared against two keys, `k1 = [1, 0]` and `k2 = [0, 1]`. What are the resulting attention weights over `k1` and `k2` after scaling by `sqrt(d_k)` and applying softmax?

A. `[1.0, 0.0]`
B. `[0.5, 0.5]`
C. `[0.73, 0.27]`
D. It depends on the value vectors, which aren't given

<details>
<summary>Answer</summary>

**Correct: B.** `q · k1 = 1` and `q · k2 = 1` — identical scores, so after scaling and softmax they must come out equal.

- **A is incorrect.** This would require one score to dominate the other; here they're identical before and after scaling.
- **B is correct.** `q · k1 = (1)(1) + (1)(0) = 1`, `q · k2 = (1)(0) + (1)(1) = 1`. Scaling both by `1/sqrt(2)` keeps them equal, and softmax over two equal values always splits 50/50.
- **C is incorrect.** This is a plausible-looking unequal split, but the two raw scores are exactly equal — there's no basis for an uneven weight here.
- **D is incorrect.** The weights come entirely from Q and K; V only determines what those weights get multiplied against afterward, not the weights themselves. See [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy).

</details>

## 3. The sqrt(d_k) scaling

Why does attention divide scores by `sqrt(d_k)` before applying softmax?

A. To force every score to be positive before softmax runs
B. Because dot products of higher-dimensional vectors have larger variance, which pushes softmax toward saturated, near-one-hot outputs with vanishing gradients if left unscaled
C. To make sure the value vectors sum to exactly 1
D. Because softmax requires its inputs to be between -1 and 1

<details>
<summary>Answer</summary>

**Correct: B.** The variance of a dot product of `d_k` independent unit-variance terms grows with `d_k`; dividing by `sqrt(d_k)` cancels that growth and keeps the logit variance at 1 regardless of dimension.

- **A is incorrect.** Softmax handles negative inputs fine — scaling isn't about sign, it's about magnitude and variance.
- **B is correct.** See the full derivation and numeric example in [Why Divide by the Square Root of d_k](/learn/llm-foundations/why-divide-by-sqrt-dk).
- **C is incorrect.** That's confusing the scaling factor with softmax's own normalization (which does make weights sum to 1) — the `sqrt(d_k)` division happens before softmax and serves a different purpose.
- **D is incorrect.** Softmax accepts any real-valued input; there's no such range requirement.

</details>

## 4. Where the mask goes

At which point in the attention pipeline is the causal mask applied?

A. To the raw token embeddings, before they're projected into Q, K, and V
B. To the attention scores, before softmax runs
C. To the attention weights, after softmax has already normalized them
D. To the block's final output, after the feed-forward step

<details>
<summary>Answer</summary>

**Correct: B.** Future positions get set to `-inf` in the score matrix before softmax, so `exp(-inf) = 0` removes them cleanly from both the numerator and the normalizing sum.

- **A is incorrect.** Masking the embeddings would remove information from those tokens entirely, everywhere — not just prevent other tokens from attending to them.
- **B is correct.** See [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics) for exactly where this sits in the pipeline.
- **C is incorrect.** This is a real, distinct bug: masking after softmax leaves rows that don't sum to 1 unless explicitly renormalized. See [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs).
- **D is incorrect.** By the time the block's output is computed, every attention layer inside it already needed its own masked computation — masking can't be deferred to the end.

</details>

## 5. Splitting into heads

With `d_model = 512` and 8 attention heads, what is each head's Q/K dimension, and how does total compute compare to running one attention operation over the full 512 dimensions?

A. 64 per head; roughly the same total compute as one wide head
B. 512 per head; about 8x more total compute
C. 64 per head; about 8x more total compute, since each head redoes the full computation
D. 8 per head; roughly the same total compute as one wide head

<details>
<summary>Answer</summary>

**Correct: A.** `512 / 8 = 64` per head, and because each head does proportionally less work over a proportionally smaller dimension, the total compute across all 8 heads stays close to what one full-width head would cost.

- **A is correct.** See [Multi-Head Attention: Why Many Heads](/learn/llm-foundations/multi-head-attention-why-many-heads) for why splitting doesn't multiply cost the way it multiplies the number of independent attention patterns.
- **B is incorrect.** This mixes up the per-head dimension with the full model dimension — heads operate on slices, not the full width each.
- **C is incorrect.** Each head operates on a smaller slice, not a redundant full copy — the per-head cost shrinks along with the per-head dimension.
- **D is incorrect.** `512 / 8 = 64`, not 8 — 8 is the number of heads, not the per-head dimension.

</details>

## 6. Attention vs. the feed-forward block

What's the key structural difference between the attention sublayer and the feed-forward sublayer in a transformer block?

A. The feed-forward block uses softmax and attention does not
B. Attention mixes information across positions; the feed-forward block processes each position independently, with the same weights applied to every token
C. The feed-forward block only runs during training, not at inference
D. Attention has learned parameters, while the feed-forward block does not

<details>
<summary>Answer</summary>

**Correct: B.** Attention is the only sublayer where one token's output can depend on another token's input; the FFN runs the identical two-layer MLP on every position independently, with zero cross-position mixing.

- **A is incorrect.** It's the reverse — attention uses softmax to turn scores into weights; the standard FFN has no softmax at all.
- **B is correct.** See [The Feed-Forward Block and Its Role](/learn/llm-foundations/the-feed-forward-block-role) for the "attention moves, FFN processes" framing.
- **C is incorrect.** The FFN runs at both training and inference, exactly like attention — every forward pass uses it.
- **D is incorrect.** Both sublayers have learned parameters — attention's Q/K/V/output projections, and the FFN's two (or three, for SwiGLU) weight matrices.

</details>

## 7. Pre-norm residual wiring

In a pre-norm transformer block, what exactly gets added back into the residual stream at `x = x + Sublayer(...)`?

A. `LayerNorm(x)` plus the sublayer's output
B. The raw, un-normalized output of `Sublayer(LayerNorm(x))` — normalization never touches the value being added
C. `LayerNorm(Sublayer(x))` — the sublayer's output, then normalized
D. The sublayer's output multiplied by a learned gate before adding

<details>
<summary>Answer</summary>

**Correct: B.** Pre-norm applies `LayerNorm` only to the copy of `x` feeding *into* the sublayer; what actually gets added back is the sublayer's raw output, keeping the residual path itself completely free of any normalization.

- **A is incorrect.** `LayerNorm(x)` is what feeds *into* the sublayer, not what gets added afterward — the two `x`'s in the formula play different roles.
- **B is correct.** See [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm) for why keeping the residual path normalization-free is exactly what preserves the gradient highway at depth.
- **C is incorrect.** This describes post-norm's shape, `LayerNorm(x + Sublayer(x))`, not pre-norm — and even that isn't quite right, since post-norm normalizes the *sum*, not the sublayer output alone.
- **D is incorrect.** A learned multiplicative gate on the residual branch isn't part of the standard pre-norm formula described in this module.

</details>

## 8. Diagnose the bug

A colleague's transformer shows training loss dropping to near-zero suspiciously fast, but generated text at inference is far worse than that loss would suggest. Which wiring bug best explains this pattern?

A. The feed-forward block's hidden dimension is smaller than `d_model`
B. RMSNorm was used in place of full LayerNorm
C. The causal mask was never applied (or was missing in some layers), letting positions attend to tokens that come after them during training
D. The model uses more attention heads than necessary

<details>
<summary>Answer</summary>

**Correct: C.** A missing causal mask lets the model partly "cheat" during training by attending directly to the token it's supposed to predict, which drives training loss down unrealistically fast — but at inference, with no future tokens available to peek at, the model performs far worse, because it never learned to do the task honestly.

- **A is incorrect.** An undersized FFN would produce a *weaker*, not artificially strong, training loss — it constrains capacity rather than leaking the answer.
- **B is incorrect.** RMSNorm vs. LayerNorm is a stability and efficiency choice, not a source of information leakage from the future.
- **C is correct.** This is exactly the failure mode covered in [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs) and in [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics).
- **D is incorrect.** Extra heads change capacity and cost, not whether future tokens are visible during training.

</details>

**Related:** [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup), [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block), [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs), [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm)
