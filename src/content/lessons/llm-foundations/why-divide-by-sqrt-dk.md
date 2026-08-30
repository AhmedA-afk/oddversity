---
title: "Why Divide by the Square Root of d_k"
track: "llm-foundations"
status: live
summary: "The variance argument for scaling attention logits by sqrt(d_k), with numbers showing what breaks if you skip it."
duration: "8 min read"
---

*This is a deep-dive: the derivation behind a line of code you'd otherwise just take on faith. It's optional depth — skip ahead to [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics) if you just need the practical takeaway from [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy).*

The formula for attention has exactly one constant in it: `sqrt(d_k)`. It looks like it could have been `d_k`, or `log(d_k)`, or nothing at all. It's specifically the square root, and the reason is a variance calculation that's worth doing once by hand.

## The claim, precisely

Assume each component of a query vector `q` and a key vector `k` is drawn independently from a distribution with mean 0 and variance 1 — a reasonable approximation for freshly-initialized (or well-trained, well-normalized) projections. The dot product is a sum over `d_k` terms:

```
q · k = q_1*k_1 + q_2*k_2 + ... + q_dk*k_dk
```

Each term `q_i * k_i` is a product of two independent, zero-mean, unit-variance random variables, so it has mean `E[q_i]*E[k_i] = 0` and variance `E[q_i^2]*E[k_i^2] = 1 * 1 = 1`. Summing `d_k` independent terms adds their variances:

```
Var(q · k) = d_k * 1 = d_k
std(q · k) = sqrt(d_k)
```

The dot product's spread grows with the *square root* of the dimension, not the dimension itself. Dividing the raw score by `sqrt(d_k)` divides its standard deviation by the same factor, bringing the variance back down to exactly 1, regardless of how large `d_k` is:

```
Var(q · k / sqrt(d_k)) = Var(q · k) / d_k = d_k / d_k = 1
```

That's the entire justification — the scaling factor is chosen to cancel a specific, derivable growth rate, not tuned by trial and error. (This is the same argument the original "Attention Is All You Need" paper gives for the choice.)

## What happens if you skip it

Here's the concrete failure mode, using illustrative numbers consistent with `d_k = 64` — a realistic per-head dimension — where `std(q · k) ≈ sqrt(64) = 8`.

Suppose one query's raw, unscaled scores against three candidate keys come out around `[14, 2, -9]` — magnitudes you'd expect to see occasionally once the standard deviation is 8. Run softmax directly on that:

```python
import numpy as np
raw = np.array([14.0, 2.0, -9.0])
print(np.exp(raw) / np.exp(raw).sum())
# [~0.999992, ~0.0000061, ~0.0000000001]
```

The distribution is, for all practical purposes, one-hot on the first key. That might sound fine — confident predictions! — but it's poison for training. The gradient of softmax output `p_i` with respect to its own logit is `p_i * (1 - p_i)`, which is maximized at `p_i = 0.5` and collapses toward zero as `p_i` approaches 0 or 1. At `p_1 ≈ 0.999992`, that gradient is on the order of `0.999992 * 0.000008 ≈ 0.000008` — vanishingly small. The other two logits are stuck near-zero probability with equally starved gradients. Backpropagation has almost nothing to work with: the model can't learn to adjust *which* key should have won, because the loss surface near this point is nearly flat.

Now scale the same three raw scores by `1/sqrt(64) = 1/8` before the softmax:

```python
scaled = raw / 8   # [1.75, 0.25, -1.125]
print(np.exp(scaled) / np.exp(scaled).sum())
# [~0.7815, ~0.1744, ~0.0441]
```

Same relative ordering, same "first key wins" conclusion — but now the top probability is a survivable 0.78 instead of an immovable 0.999992. The gradient at `p_1 = 0.78` is `0.78 * 0.22 ≈ 0.17`, roughly 20,000 times larger than the unscaled case. The model can still express confidence, but training signal keeps flowing.

## Why this specifically hits larger heads harder

The failure mode above gets *worse*, not better, as `d_k` grows, because the standard deviation of the raw dot product grows with `sqrt(d_k)`. A head dimension of 16 gives `sqrt(16) = 4` — noticeable but survivable without scaling. A head dimension of 128 gives `sqrt(128) ≈ 11.3` — raw logits routinely swinging past ±30, deep into softmax's saturated, zero-gradient regions. This is exactly why the fix has to be a function of `d_k` rather than a fixed constant tuned once: as architectures use larger per-head dimensions, an unscaled dot product would only get worse, while `sqrt(d_k)` scaling keeps the logit variance pinned at 1 no matter what head size you pick.

## What training without it actually looks like

Practically, a transformer built without this scaling term doesn't necessarily fail to run — matrix multiplies and softmax accept any input. What you'd see instead is a network that trains far more slowly, or plateaus early, because the attention layers spend most of training stuck in the saturated regime described above, with gradients too small to meaningfully update the Q and K projections. It's the kind of bug that doesn't crash anything, which is exactly what makes it dangerous — see [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs) for other failures in the same "runs fine, learns badly" category.

## Where this leaves you

`sqrt(d_k)` isn't a magic number — it's the standard deviation of a sum of `d_k` independent unit-variance products, derived directly from how the dot product is built. Once attention logits are stabilized this way, the next place logits get manipulated is [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics), which pushes a different set of entries to negative infinity *before* this same softmax runs — a deliberate saturation, rather than the accidental kind covered here.

**Related:** [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy), [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics), [Probability Basics for AI](/learn/maths-foundations/probability-basics-for-ai)
