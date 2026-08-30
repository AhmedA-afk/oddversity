---
title: "Maximum likelihood estimation"
track: "maths-foundations"
status: live
summary: "Maximum likelihood estimation chooses the parameter value that makes the observed data most compatible with a stated probability model."
duration: "5 min read"
---

## The short answer

Maximum likelihood estimation chooses the parameter value that makes the observed data most compatible with a stated probability model. For Bernoulli data, it is the observed success rate; for a Gaussian with known variance, it is the sample mean. MLE is principled but model-relative: small samples, flexible models, and zero counts can produce extreme or degenerate estimates.

## Why this matters

Many familiar training objectives are MLE in disguise. Minimising average cross-entropy maximises the likelihood of the labels under a categorical model. That connection lets you inspect whether an objective matches the data-generating assumptions rather than treating loss as a library default.

**Small incident (illustrative):** a tiny intent dataset gave a categorical model zero probability for an intent that had not appeared in training. The MLE had perfectly fit the observed counts; it had not learned that unseen events could occur later.

## How it works

Given data x₁:ₙ, the MLE is `argmaxθ L(θ; x₁:ₙ)`, or equivalently the argmax of log-likelihood. For Bernoulli observations, `ℓ(p) = s log(p) + (n−s) log(1−p)`. Differentiating and setting the derivative to zero gives p̂=s/n; the second derivative is negative on 0<p<1, so this interior point is a maximum when 0<s<n. At s=0 or s=n, the maximum reaches a boundary.

### Assumptions and derivation

MLE inherits the likelihood’s independence, support, and functional-form assumptions. Under regularity conditions and enough data, MLEs often have useful large-sample properties, but “enough” depends on the model and data. Separation in logistic regression is a concrete case where likelihood keeps improving as coefficients grow instead of settling at a finite estimate.

## AI use

Use MLE to connect labels to probabilistic models, then test for overfit, separation, unseen categories, and calibration. If a model’s likelihood rewards assigning probability 0 or 1, add an explicit smoothing or regularisation decision rather than relying on a hidden numerical clamp.

## Worked examples and variations

### Example A — smallest happy path

**Input:** four Bernoulli outcomes with s=3 successes. **Mechanism:** p̂=s/n. **Output:** p̂=.75. **Inspect:** this is the parameter that maximises p³(1−p), not an assertion that the next trial is guaranteed to succeed with probability .75. **Next decision:** report sample size and uncertainty with the estimate.

### Example B — meaningful variation

**Input:** Gaussian observations `[2, 4, 3, 5]` with known variance. **Mechanism:** differentiating the Gaussian log-likelihood with respect to μ gives the sample mean 3.5. **Output:** μ̂=3.5. **Inspect:** the Gaussian form makes squared residuals the relevant fit measure. **Next decision:** check whether residual shape and units support that model.

### Example C — boundary/degenerate case

**Input:** a categorical label appears 10 times as `refund` and zero times as `delivery`. **Mechanism:** unconstrained MLE sets p(refund)=1 and p(delivery)=0. **Output:** any future delivery has infinite negative log loss. **Inspect:** the zero is a data statement, not proof of impossibility. **Next decision:** use held-out data, smoothing, or a model with shared structure.

### Example D — tempting counterexample

**Input:** a highly flexible model with one parameter per training row. **Mechanism:** choose parameters to assign near-one probability to every observed label. **Output:** training likelihood is excellent, but unseen cases may be arbitrary. **Inspect:** compare held-out likelihood and calibration, not only training likelihood. **Next decision:** constrain capacity, regularise, or collect data.

### Example E — production separation

**Input:** every training example with feature `urgent=1` has label `escalate`. **Mechanism:** a logistic MLE can increase the corresponding coefficient without bound to improve likelihood. **Output:** unstable huge weights and near-1 predictions. **Inspect:** detect separation and inspect future cases where the feature is noisy. **Next decision:** regularise, redesign the feature, or obtain overlapping examples.

## Computation and interpretation

```python
import numpy as np

def bernoulli_mle(x):
    x = np.asarray(x, dtype=float)
    if x.size == 0 or not np.isin(x, [0, 1]).all():
        raise ValueError("need non-empty Bernoulli observations")
    return x.mean()

print(bernoulli_mle([1, 1, 0, 1]))
print(bernoulli_mle([1] * 10))  # boundary estimate: 1.0
```

Interpret 1.0 as “the MLE under this tiny observed sample,” not “the true rate is exactly 1.” The boundary is a prompt to inspect uncertainty, prior information, smoothing, and whether the model’s support matches future use.

## Two ways to see it

### Builder view

MLE is an objective plus a parameter domain. Plot the objective, inspect boundary behaviour, and test with held-out cases before trusting the optimiser’s answer.

### Systems view

MLE rewards the data you chose to show it. Data scarcity and label policy can make a confident model that is locally optimal and globally fragile. The resulting probabilities need calibration and monitoring.

## Hands-on

Build a Bernoulli MLE notebook using two fixtures: `[1, 1, 0, 1]` and `[1] * 10`. **Failure fixture:** fit the second fixture and use the result to score a future `0` with log loss. **Test:** the lab must flag a zero-probability score as invalid for an observed future class, rather than silently returning a finite clipped value. **Reset:** restore the mixed fixture, report the estimate with n, and compare it with a later MAP estimate.

## Checkpoint

- [ ] Derive p̂=s/n from the Bernoulli log-likelihood.
- [ ] Explain why all-success data creates a boundary MLE.
- [ ] Name two diagnostics for MLE overfitting.
- [ ] Connect categorical MLE to average negative log-likelihood.

## What this does not solve

MLE does not protect against a biased sample, misspecified likelihood, overcapacity, or causal misinterpretation. Large-sample guarantees are not small-sample guarantees. Smoothing or regularisation changes the estimator and must be described as a new modelling choice.

## Continue, go deeper, apply it

- Continue: MAP and regularisation
- Go deeper: Naive Bayes and generative versus discriminative modelling
- Apply it: Logistic regression
