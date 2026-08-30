---
title: "From Logits to Probabilities, by Hand"
track: "llm-foundations"
status: live
summary: "A hands-on numpy walkthrough turning six raw logits into ranked, normalized probabilities."
duration: "7 min read"
---

A model's forward pass ends in a pile of raw numbers, not percentages. Here's exactly what turns those numbers into something you can sample from.

## The setup

We have a tiny, made-up vocabulary of six words the model might produce after "The dog started to ___":

```text
vocab  = ["run", "jump", "sit", "fly", "the", "bark"]
logits = [2.1, 0.3, -1.0, 4.5, 0.0, 1.2]
```

These six numbers are invented for this walkthrough, not pulled from a real model — the arithmetic is what matters, not the semantics of a dog flying. A **logit** is just the model's raw, unnormalized score for one token: a real number, can be negative, no upper bound, and on its own tells you nothing about probability except its *rank* relative to the others.

## Step by step

### 1. Exponentiate every logit

```python
import numpy as np

logits = np.array([2.1, 0.3, -1.0, 4.5, 0.0, 1.2])
exp_logits = np.exp(logits)
# array([ 8.166,  1.350,  0.368, 90.017,  1.000,  3.320])
```

> **Why this step?** Exponentiating does two things at once: it makes every value positive (a probability can't be negative), and it exaggerates the *gaps* between scores — a logit that's 2 higher than another becomes roughly `e² ≈ 7.4` times larger after this step, not just 2 units larger.

### 2. Sum them

```python
total = exp_logits.sum()
# 104.221
```

> **Why this step?** You need a denominator that turns these six positive numbers into something that sums to exactly 1 — the definition of a valid probability distribution.

### 3. Divide each by the sum

```python
probs = exp_logits / total
# array([0.0784, 0.0130, 0.0035, 0.8637, 0.0096, 0.0319])
```

> **Why this step?** This is the normalization. Steps 1-3 together are the softmax function: `softmax(x)_i = exp(x_i) / sum(exp(x_j))`. Check it sums to 1 — `probs.sum()` comes out to `0.99997`, off from 1.0 only by float rounding.

### 4. Rank the candidates

```text
fly   86.4%   ← logit 4.5, the largest, wins by a wide margin
run    7.8%
bark   3.2%
jump   1.3%
the    1.0%
sit    0.4%
```

> **Why this step?** This is the number a sampling strategy actually consumes. Greedy decoding would just take "fly"; a looser [sampling temperature](/learn/llm-foundations/sampling-temperature-top-p) would occasionally still produce "run" or "bark," in roughly the proportions shown.

Notice how a **2.4-point gap** in raw logits (4.5 vs. 2.1, the top two) turned into an **11x gap** in probability (86.4% vs. 7.8%). Softmax doesn't preserve linear spacing — it's exponential, so the single largest logit dominates the distribution far more than its raw margin suggests. That's also why a small change to the *biggest* logit swings probabilities much harder than the same change to a small one.

## Where it breaks (+ fix)

Try this with a more extreme logit, say `1000` instead of `4.5`:

```python
np.exp(1000)
# RuntimeWarning: overflow encountered in exp
# inf
```

`e^1000` overflows a standard float before you ever get to divide — softmax computed this naively can silently produce `nan` for every probability. The fix, used in every real implementation, is to subtract the maximum logit from all logits before exponentiating:

```python
shifted = logits - logits.max()
probs = np.exp(shifted) / np.exp(shifted).sum()
```

This is mathematically identical (the max-subtraction cancels out in the division) but keeps every exponent ≤ 0, so `exp()` never overflows. This is exactly the trick a real vocabulary-sized softmax needs, since logits over 50,000 tokens can easily include values large enough to break the naive version.

## Takeaways

- Logits are unnormalized scores — read their *rank*, not their raw value, until you've run softmax.
- Softmax is exponentiate, sum, divide — three lines of numpy, always producing values that are non-negative and sum to 1.
- The gap between the top logit and the rest determines how "confident" (peaked) the resulting distribution is — this is exactly the lever that [temperature](/learn/llm-foundations/sampling-temperature-top-p) manipulates on purpose.
- Always subtract the max logit before exponentiating in real code; it's free correctness.

**Related:** [The Vocabulary and the Unembedding Head](/learn/llm-foundations/the-vocabulary-and-the-unembedding), [Sampling, Temperature, and Top-p](/learn/llm-foundations/sampling-temperature-top-p), [What a Language Model Actually Computes](/learn/llm-foundations/what-a-language-model-actually-computes)
