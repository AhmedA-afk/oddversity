---
title: "Likelihood and log-likelihood"
track: "maths-foundations"
status: live
summary: "Likelihood measures how compatible fixed observed data is with different parameter values in a model."
duration: "5 min read"
---

## The short answer

Likelihood measures how compatible fixed observed data is with different parameter values in a model. It is the same joint-model formula as a probability mass or density, but the variable being varied changes: data is fixed, parameters move. Take logs to turn products into sums and make optimisation numerically safer. Do not read likelihood as a probability distribution over parameters.

## Why this matters

Training often means selecting parameters that make the observed labels plausible. If the distinction between P(data | θ) and P(θ | data) is lost, a learner can accidentally claim a parameter has a 90% probability without a prior or posterior model.

**Small incident (illustrative):** an analysis said “there is a 95% chance the parameter is in this interval” after maximising a likelihood. The calculation could support a confidence procedure, but not that posterior-probability sentence without additional Bayesian assumptions.

## How it works

For iid data x₁,…,xₙ from mass or density p(x | θ), the likelihood is L(θ; x₁:ₙ) = product of p(xᵢ | θ). The log-likelihood is ℓ(θ) = log L(θ). Since log is strictly increasing, argmax L and argmax ℓ are the same. Independence gives the product; without it, use the joint distribution actually assumed.

### Assumptions and derivation

For four Bernoulli observations with three successes, L(p) = p³(1−p). The log is ℓ(p) = 3 log p + log(1−p), defined for 0 < p < 1. The derivative 3/p − 1/(1−p) = 0 gives p = 3/4, provided the interior stationary point is allowed and the model is correctly specified.

## AI use

Likelihood underlies MLE, logistic regression, language-model next-token loss, generative classifiers, and many uncertainty estimates. It provides a model-relative score, not an absolute truth score. Always ask which data distribution, conditional independence assumption, and parameterisation produced the likelihood.

## Worked examples and variations

### Example A — smallest happy path

**Input:** data `[1, 1, 0, 1]` from Bernoulli(p). **Mechanism:** L(p) = p³(1−p). **Output:** at p = .75, L = .75³ × .25 ≈ .1055. **Inspect:** the same observed sequence gives different likelihood values at other p. **Next decision:** rank plausible parameter values or maximise the function; do not call .1055 the probability that p = .75.

### Example B — meaningful variation

**Input:** candidate values p = .6 and p = .9 for the same data. **Mechanism:** L(.6) = .6³(.4) = .0864, L(.9) = .9³(.1) = .0729. **Output:** the data is more compatible with .6 despite three successes out of four. **Inspect:** sample size is small, so the ranking is weak evidence. **Next decision:** retain uncertainty rather than over-reading a close comparison.

### Example C — boundary case

**Input:** data contains a success and candidate p = 0. **Mechanism:** L(0) = 0, so log L(0) = −infinity. **Output:** the parameter is impossible under this observed model event. **Inspect:** distinguish a mathematical zero from floating-point underflow near zero. **Next decision:** use log-likelihood and check whether the model’s support includes the data.

### Example D — tempting counterexample

**Input:** treat L(θ; x) as a function of θ and normalise it over θ without specifying a prior. **Mechanism:** the result depends on parameterisation and integration measure. **Output:** it is not automatically a posterior distribution. **Inspect:** write Bayes’ rule: posterior is proportional to likelihood times prior. **Next decision:** add a prior for Bayesian inference or use likelihood-based frequentist procedures with their stated interpretation.

## Computation and interpretation

```python
import numpy as np

x = np.array([1, 1, 0, 1])
p = np.linspace(1e-6, 1 - 1e-6, 1_000)
log_likelihood = (x[:, None] * np.log(p) + (1 - x[:, None]) * np.log1p(-p)).sum(axis=0)
print(p[np.argmax(log_likelihood)])  # close to 0.75
```

The grid maximum is approximate; an optimiser or the derivative gives the exact interior MLE for this example. Log-likelihood values are additive across observations, which makes per-example diagnostics possible.

## Two ways to see it

### Builder view

Likelihood is a score function that turns a model and a dataset into a parameter landscape. Inspect its shape, support, and gradients before handing it to an optimiser.

### Systems view

The likelihood encodes what the system calls an independent observation and what outcomes it considers possible. A high likelihood under a misspecified model can still yield poor decisions, especially under shift.

## Hands-on

Build a likelihood table for `x = [1, 1, 0, 1]` over p in [.01, .99], showing both L and log L. **Failure fixture:** compute the product for 10,000 observations directly in ordinary floating point. **Test:** the direct product must underflow or become numerically uninformative while the log-likelihood remains finite and preserves the ordering of candidate parameters. **Reset:** use the four-row fixture and the log formulation, then verify the maximum is near .75.

## Checkpoint

- [ ] State which quantity is fixed and which quantity varies in a likelihood.
- [ ] Derive the Bernoulli log-likelihood for s successes in n trials.
- [ ] Explain why maximising likelihood and log-likelihood gives the same argmax.
- [ ] Correct the sentence: “The likelihood is the probability that the parameter is true.”

## What this does not solve

Likelihood does not choose a correct model, supply a prior, measure causal effect, or guarantee calibrated probabilities. Absolute likelihood values depend on sample size and, for continuous data, on density units. Compare models only with compatible targets and assumptions.

## Continue, go deeper, apply it

- Continue: Maximum likelihood estimation
- Go deeper: Likelihood, cross-entropy, and classification objectives
- Apply it: Linear regression
