---
title: "Transformer Block Wiring Bugs"
track: "llm-foundations"
status: live
summary: "Five implementation bugs that break a transformer silently — each still runs, still trains, and quietly produces a worse model."
duration: "7 min read"
---

None of these bugs crash. That's what makes them worth cataloging separately from ordinary errors: a transformer block wired wrong in one of these ways will still run forward and backward passes, still report a loss curve that goes down, and still generate text — just worse than it should, in ways that are easy to blame on hyperparameters instead of the actual cause.

### The mistake: forgetting the causal mask

**Why it's wrong.** Without the triangular mask from [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics), every position can attend to every other position, including ones later in the sequence. During training on the next-token objective, the model can partially "cheat" by attending directly to the token it's supposed to predict.

**Symptom.** Training loss drops unrealistically fast and reaches an implausibly low value early — the model is trivially copying the answer through attention rather than learning to predict it. The giveaway usually isn't visible from the loss curve alone, though: generation at inference time (where there genuinely is no future to peek at) is far worse than the training loss would predict, because the model never learned to do the task without the shortcut it had during training.

**Fix.** Confirm the mask is actually being applied — not just constructed — inside the attention call in every layer, and check it with the sanity test from [Watching the Mask Change the Softmax](/learn/llm-foundations/watching-the-mask-change-the-softmax): the last position's attention weights should be identical whether or not the mask is applied, since it has no future to hide.

### The mistake: masking after softmax instead of before

**Why it's wrong.** Zeroing out already-normalized attention weights for future positions, instead of setting the raw scores to `-inf` *before* softmax, leaves the remaining weights summing to less than 1 — softmax's normalization already happened over the wrong (unmasked) set of scores.

**Symptom.** Attention weight rows don't sum to 1 (`weights.sum(-1)` prints something like 0.7 instead of 1.0 for early positions), which silently shrinks the effective magnitude of attention's contribution to the residual stream at exactly those positions — the least amount of context (early positions) getting an *extra*, unrelated penalty on top.

**Fix.** Always mask by adding `-inf` (or a large negative number) to the raw scores before the softmax call, never by multiplying the post-softmax weights by a 0/1 mask. If you must mask after the fact for some reason, renormalize explicitly by dividing by the new row sum.

### The mistake: adding the residual before the sublayer, or not adding it at all

**Why it's wrong.** The residual connection from [The Residual Stream and Layer Norm](/learn/llm-foundations/residual-stream-and-layer-norm) depends on the specific form `x = x + Sublayer(...)`. Writing `x = Sublayer(x + x)` (doubling the input into the sublayer instead of adding the sublayer's output afterward) or simply `x = Sublayer(x)` (overwriting `x` instead of adding to it) both remove the direct gradient path back to earlier layers.

**Symptom.** Shallow stacks (a handful of blocks) may still train, just more slowly. Deep stacks — the depths transformers are actually built for — train unstably or fail to converge at all, because the gradient highway that residuals provide is gone; gradients have to survive an unbroken chain of sublayer Jacobians instead of a chain of identity additions.

**Fix.** Grep for the literal pattern `x = x + ...` (or your framework's equivalent) at the end of every sublayer, and verify the `x` on the right-hand side is the same tensor that went *into* the sublayer, not some intermediate value.

### The mistake: norm in the wrong place

**Why it's wrong.** Mixing pre-norm and post-norm conventions inconsistently — say, normalizing the input to the sublayer *and* normalizing the sum afterward, or applying norm to the residual path itself instead of only to the sublayer's input branch — breaks the clean gradient-highway property that [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm) derives for pre-norm specifically. If the raw `x` being added at the `+` has already been passed through a norm somewhere upstream, the residual path is no longer normalization-free.

**Symptom.** Training instability that looks like a learning-rate problem — loss spikes or diverges partway through training, or requires a much longer warmup than the model's depth should need — without an obvious single point of failure, because the bug is in *placement*, not in a missing operation.

**Fix.** Write out the exact sequence of operations for one block on paper (as in [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block)) and confirm the tensor added at each `+` is genuinely the unmodified stream value, with `norm()` appearing only inside the branch feeding the sublayer.

### The mistake: head-dimension reshape errors that scramble heads

**Why it's wrong.** Splitting `(seq_len, d_model)` into per-head chunks requires reshaping to `(seq_len, h, head_dim)` and *then* transposing to `(h, seq_len, head_dim)` — in that order. Doing the transpose first, or reshaping directly into `(h, seq_len, head_dim)` without the intermediate step, reinterprets which values belong to which token and which head, because reshape only reinterprets contiguous memory and doesn't know which axis is "supposed to be" which.

**Symptom.** The model still trains — the arithmetic is well-defined, just not attending to what you think it's attending to — but attention weight visualizations look like noise instead of any interpretable pattern, and overall quality is measurably worse than a correctly-wired baseline at the same size, without any obvious error message pointing at the cause.

**Fix.** Use the same reshape-then-transpose order (and its exact reverse on the merge side) as [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention), and add a unit test with a small, hand-constructed input where you know which head *should* end up holding which slice of the original embedding — then confirm it does.

## Pre-flight checklist

Before trusting a new transformer block implementation, check each of these directly:

- [ ] The last position's attention weights are identical with and without the causal mask applied.
- [ ] Every attention weight row sums to 1.0 (`np.allclose(weights.sum(-1), 1.0)`), for every head, at every masked position.
- [ ] `output.shape == input.shape` for one full block, and still holds after stacking `N` blocks in a loop.
- [ ] The tensor added at each residual `+` is the literal, unmodified input to that sublayer — no norm applied to it first.
- [ ] A hand-constructed small input, split into heads and merged back with no attention or FFN in between, round-trips to exactly the original values.

**Related:** [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block), [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics), [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention), [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm)
