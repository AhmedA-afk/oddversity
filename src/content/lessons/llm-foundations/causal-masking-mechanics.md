---
title: "Causal Masking Mechanics"
track: "llm-foundations"
status: live
summary: "The exact arithmetic of setting future scores to negative infinity before softmax, and why that's what makes generation autoregressive."
duration: "6 min read"
---

Attention as built so far will happily let any token look at any other token — including ones that come after it. For a model whose entire job is predicting what comes next, that's not a minor oversight, it's a way to make the training objective trivial and useless. Causal masking is the one-line fix, and this lesson walks through exactly where it sits in the computation.

## The mask itself

Recall the pipeline from [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy): raw scores, scale by `sqrt(d_k)`, softmax, multiply by `V`. Causal masking inserts one step between scaling and softmax: every score at position `(i, j)` where `j > i` — a query attending to a key that comes later in the sequence — gets overwritten with negative infinity.

```python
import numpy as np

def causal_mask(seq_len):
    # upper triangle (excluding diagonal) is True wherever j > i
    mask = np.triu(np.ones((seq_len, seq_len), dtype=bool), k=1)
    return mask

mask = causal_mask(4)
scaled_scores = np.where(mask, -np.inf, scaled_scores)
```

Visually, for 4 tokens, the additive mask being applied looks like this:

```
attend to →     1     2     3     4
position 1  [  0.0  -inf  -inf  -inf ]
position 2  [  0.0   0.0  -inf  -inf ]
position 3  [  0.0   0.0   0.0  -inf ]
position 4  [  0.0   0.0   0.0   0.0 ]
```

Position 3 can attend to 1, 2, and 3, but never 4. That's the whole mechanism: a fixed, position-dependent pattern of `-inf` added to the scores, applied identically in every layer and every head, before softmax ever runs.

## Why negative infinity, specifically

Softmax is `exp(x_i) / sum(exp(x_j))`. `exp(-inf)` is exactly `0.0` in floating point, and `0.0` in both the numerator (for a masked entry) and every masked term in the denominator's sum means those positions contribute nothing to the resulting distribution — not "almost nothing," exactly zero probability. In practice, implementations use a very large negative finite number (like `-1e9`) instead of literal infinity to avoid `nan` from `-inf` arithmetic edge cases, but the effect after softmax is the same: those weights round to zero.

This is worth contrasting with masking *after* softmax — zeroing out the already-normalized weights for future positions. That's a different, buggier operation: the remaining weights no longer sum to 1, so unless you renormalize by hand, the output is a systematically shrunk mixture rather than a valid weighted average. Masking before softmax sidesteps this entirely, because the normalization (the softmax's sum in the denominator) happens *after* the masked entries are already zeroed by `exp(-inf)`, so what remains sums to exactly 1 automatically.

## Why this is what makes generation autoregressive

[Next-Token Prediction](/learn/llm-foundations/next-token-prediction) trains the model on one objective: given tokens `1` through `n`, predict token `n+1`. Without the mask, the prediction computed *at* position `n` could attend directly to position `n+1` — the very token it's supposed to predict — and the loss would collapse toward zero almost immediately, because the model would learn to copy the answer through the attention weights rather than actually predict it from context. Causal masking is what forces every position's prediction to be an honest function of only the past.

That same restriction is what makes text generation autoregressive at inference time. A causally-trained model was never shown a version of the task where future tokens exist yet, so at inference it doesn't need them: it looks only at what's already been generated and emits one token, then repeats, always reading left to right. [The Autoregressive Generation Loop](/learn/llm-foundations/the-autoregressive-generation-loop) covers what that loop looks like once you're past a single forward pass.

## Not the only option

Causal masking is a design choice tied to the *generation* objective, not a universal law of attention. Encoder models like BERT use full, unmasked (bidirectional) attention on purpose, because their training task — filling in masked-out words using context from both sides — benefits from seeing the future. That makes them strong at understanding a fixed piece of text but unsuited to generating one token at a time. Every major current LLM (GPT-family, Claude, Llama) is decoder-only and applies causal masking throughout, because the product is generation, and the mask is what guarantees the training objective matches that use.

## Watch out for

- **Applying the mask after softmax instead of before.** As covered above, this leaves rows that don't sum to 1 unless you explicitly renormalize — a subtle, easy-to-miss bug covered further in [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs).
- **Forgetting the mask needs to be applied in every layer, every head.** It's not something set once at the input — every attention operation in the stack needs the same triangular pattern reapplied to its own score matrix.
- **Assuming masking makes attention "smarter."** It doesn't add any intelligence — it's a static, content-independent pattern. All the actual judgment about *which* allowed positions matter still comes from the learned Q and K projections in [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup); the mask only decides which positions are even eligible to be judged.

The next lesson takes one concrete score matrix and runs softmax on it twice — once masked, once not — so you can see the redistribution in actual numbers rather than as a description.

**Related:** [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup), [Watching the Mask Change the Softmax](/learn/llm-foundations/watching-the-mask-change-the-softmax), [Next-Token Prediction](/learn/llm-foundations/next-token-prediction), [The Autoregressive Generation Loop](/learn/llm-foundations/the-autoregressive-generation-loop)
