---
title: "Entropy and uncertainty"
track: "maths-foundations"
status: live
summary: "Entropy is the expected self-information of a distribution: H(P)=−sum p(x) log p(x)."
duration: "4 min read"
---

## The short answer

Entropy is the expected self-information of a distribution: `H(P)=−sum p(x) log p(x)`. It is largest when probability mass is spread evenly over the available outcomes and zero when the model is certain. Entropy measures uncertainty under a specified distribution, not dataset quality, fairness, usefulness, or randomness in every informal sense.

## Why this matters

Entropy explains why a classifier’s uncertain predictions cost more information than confident ones, why balanced labels can be harder to predict, and why a probability distribution needs a stated support. It also exposes a common misuse: treating high entropy as “bad data” when it may reflect a genuinely diverse population.

**Small incident (illustrative):** a team filtered out a high-entropy customer segment as noise. The segment was actually a mixture of two real workflows; the filter removed the product problem instead of modelling it.

## How it works

Entropy is the expectation of self-information. For a fair binary distribution, H=.5×1+.5×1=1 bit. For a deterministic binary distribution, H=0. For k equally likely outcomes, H=log₂ k bits. A useful derivation of the maximum uses concavity of log or a Lagrange multiplier under `sum p=1`; symmetry forces the uniform distribution to be the maximum.

### Assumptions and derivation

Use the convention `0 log 0 = 0` because the limit is zero. Entropy’s units follow the log base. The support must be stated: a uniform distribution over 10 possible labels has higher entropy than one over 2 labels partly because it has more possible outcomes. Comparing entropy across different supports or label definitions can mislead.

## AI use

Use entropy for predictive uncertainty, active-learning candidate selection, label-distribution summaries, and information-budget intuition. Calibrate the probabilities first when entropy is interpreted as uncertainty. A high-entropy label distribution can mean ambiguity, mixture, or broad coverage; inspect examples and slices.

## Worked examples and variations

### Example A — smallest happy path

**Input:** P=[.5,.5]. **Mechanism:** H=−.5 log₂.5−.5 log₂.5=1 bit. **Output:** maximum binary uncertainty. **Inspect:** neither outcome is preferred. **Next decision:** a classifier seeing this distribution needs one bit on average under the model.

### Example B — meaningful variation

**Input:** P=[.9,.1]. **Mechanism:** H≈.469 bits. **Output:** less uncertainty than the balanced coin. **Inspect:** entropy is lower because one outcome is predictable, not because the observations are better. **Next decision:** use the lower value to describe distributional concentration.

### Example C — boundary case

**Input:** P=[1,0,0]. **Mechanism:** H=0 using the zero-term limit. **Output:** certainty under the model. **Inspect:** any later positive observation in a zero-probability class exposes a support problem. **Next decision:** distinguish deterministic structure from an overconfident estimate.

### Example D — tempting counterexample

**Input:** a dataset with uniformly distributed labels across 100 valid intents. **Mechanism:** label entropy is high. **Output:** high uncertainty about a random label. **Inspect:** every intent may be well represented and easy to classify from input features. **Next decision:** do not call high label entropy “low quality”; evaluate conditional predictability and coverage.

## Computation and interpretation

```python
import numpy as np

def entropy_bits(p):
    p = np.asarray(p, dtype=float)
    if np.any(p < 0) or not np.isclose(p.sum(), 1):
        raise ValueError("probabilities must be nonnegative and sum to one")
    terms = np.zeros_like(p)
    mask = p > 0
    terms[mask] = p[mask] * np.log2(p[mask])
    return -terms.sum()

for p in ([.5, .5], [.9, .1], [1., 0., 0.]):
    print(entropy_bits(p))
```

`np.where` may still evaluate both branches in some array contexts, so robust production code can mask positive entries before taking logs. The numerical convention and validation are part of the artifact.

## Two ways to see it

### Builder view

Entropy is an aggregate of per-outcome surprises. Keep the probability vector and support with the scalar so a reviewer can reconstruct what uncertainty was measured.

### Systems view

Entropy can guide attention but cannot decide whether uncertainty is acceptable. A high-entropy safety decision may need abstention; a high-entropy content distribution may be exactly the desired diversity.

## Hands-on

Implement `entropy_bits` and compare a balanced, skewed, and deterministic distribution. **Failure fixture:** pass `[.6, .6]` and allow the function to return a plausible scalar. **Test:** assert nonnegativity, total probability within tolerance, and `H([.5,.5]) > H([.9,.1])`. **Reset:** restore normalised vectors and rerun the assertions.

## Checkpoint

- [ ] Derive the entropy of a fair coin.
- [ ] Explain the `0 log 0 = 0` convention.
- [ ] State why uniformity maximises entropy for a fixed finite support.
- [ ] Give a case where high entropy is not poor data quality.

## What this does not solve

Entropy does not measure correctness, label quality, causal relevance, or calibration by itself. It is sensitive to support and representation choices. Comparing entropy requires comparable outcome spaces and a clear question.

## Continue, go deeper, apply it

- Continue: Cross-entropy and negative log-likelihood
- Go deeper: Mutual information and representation relevance
- Apply it: Probability and statistics for ML
