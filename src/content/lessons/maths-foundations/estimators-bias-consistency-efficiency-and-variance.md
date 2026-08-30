---
title: "Estimators, bias, consistency, efficiency, and variance"
track: "maths-foundations"
status: live
summary: "An estimator is a rule that turns data into a guess about an unknown quantity."
duration: "5 min read"
---

## The short answer

An estimator is a rule that turns data into a guess about an unknown quantity. Bias measures systematic offset, variance measures sampling fluctuation, consistency asks whether the estimate approaches the target with more data, and efficiency compares uncertainty under a shared target and assumptions. Choose an estimator by the decision and error costs, not by “unbiased” as a single magic word.

## Why this matters

Two models can produce different parameter estimates from the same rows because they encode different trade-offs. A low-variance shrinkage estimate may predict better than a noisy unbiased estimate; a biased shortcut may be unacceptable for a regulated measurement. Understanding the trade-off prevents a metric from becoming a substitute for a design decision.

**Small incident (illustrative):** a team selected a feature estimator because it was unbiased in a textbook example, then found it unstable across small geographic slices. The expected value was right over repetitions, but individual deployments needed lower variance.

## How it works

For estimator T(X) of parameter θ, bias is E[T] − θ, variance is Var(T), and mean-squared error is MSE(T) = Var(T) + Bias(T)².

### Assumptions and derivation

The MSE identity follows by writing T − θ as (T − E[T]) + (E[T] − θ), squaring, and taking expectations; the cross term is zero because E[T − E[T]] = 0. For iid observations with finite variance, the sample mean is unbiased for the population mean and its variance is σ²/n. Change the dependence, target, or loss and the result can change.

Consistency means Tₙ approaches θ in probability as n grows. An efficient estimator has lower variance among estimators that target the same parameter under the same model; the comparison is conditional on assumptions.

## AI use

Estimator language appears in sample means, class probabilities, regression coefficients, calibration curves, and monitoring rates. When comparing a model or statistic, specify the target, sampling process, bias direction, uncertainty, and the loss that matters in the product. “Lower variance” is useful only relative to a decision and a source of data.

## Worked examples and variations

### Example A — smallest happy path

**Input:** iid observations with mean μ and variance σ²; estimator x̄. **Mechanism:** E[x̄] = μ and Var[x̄] = σ²/n. **Output:** an unbiased estimate whose spread shrinks as n grows. **Inspect:** verify the units and independence assumption. **Next decision:** use x̄ when the population mean is the target and the mean is not dominated by extreme values.

### Example B — meaningful variation

**Input:** estimate a click-through rate from n = 100 Bernoulli trials using p̂ = X/n, or use a smoothed estimate p̃ = (X+1)/(n+2). **Mechanism:** smoothing adds small bias but reduces extreme 0/1 outputs. **Output:** if X = 0, p̂ = 0 while p̃ ≈ .0098. **Inspect:** compare downstream log loss and uncertainty. **Next decision:** prefer the estimator that matches whether unseen events must retain nonzero probability.

### Example C — boundary case

**Input:** n = 1. **Mechanism:** the sample mean exists, but a sample variance estimate with n−1 denominator does not. **Output:** one point cannot reveal within-population variability. **Inspect:** a library may return NaN, zero, or raise depending on its API. **Next decision:** test the sample-size precondition rather than silently treating zero spread as certainty.

### Example D — tempting counterexample

**Input:** T₁ = x̄ and T₂ = .5x̄ + .5μ₀ for a known baseline μ₀. **Mechanism:** T₂ is biased when μ₀ ≠ μ, but has one-quarter the variance of T₁. **Output:** its MSE can be lower when the baseline is informative. **Inspect:** calculate bias, variance, and MSE under several μ. **Next decision:** do not equate unbiasedness with minimum practical error.

## Computation and interpretation

```python
import numpy as np

rng = np.random.default_rng(3)
true_mu = 2.0
estimates = []
for _ in range(5_000):
    x = rng.normal(true_mu, 4.0, size=20)
    estimates.append((x.mean(), 0.5 * x.mean() + 0.5 * 2.0))
estimates = np.asarray(estimates)
for j, name in enumerate(["mean", "shrinkage"]):
    err = estimates[:, j] - true_mu
    print(name, err.mean(), err.var(), np.mean(err**2))
```

Monte Carlo values fluctuate around the theoretical bias, variance, and MSE. Increase repetitions to reduce simulation noise; do not mistake a simulation estimate for a proof about a different data-generating process.

## Two ways to see it

### Builder view

An estimator is a function with an input schema, target quantity, assumptions, and error report. Unit tests should vary sample size and data shape, not only check one expected number.

### Systems view

Bias can be stable and predictable; variance can be noisy and operationally expensive. A model owner needs both the expected direction of error and how much the estimate moves between slices, releases, and time windows.

## Hands-on

Build `estimator_comparison.csv` from 1,000 repeated samples of size 10 from a known normal distribution. Compare the sample mean with a 50% shrinkage estimator toward the known baseline. **Failure fixture:** reuse one random sample 1,000 times; the apparent variance becomes zero. **Test:** assert that repeated estimates are not all identical and report empirical bias, variance, and MSE. **Reset:** restore a fresh seeded draw per repetition and rerun the table.

## Checkpoint

- [ ] Derive MSE = variance + bias² in two lines.
- [ ] Give a case where a biased estimator has lower MSE.
- [ ] Explain consistency without claiming that every finite-sample estimate is close.
- [ ] State which assumptions make Var(x̄) = σ²/n valid.

## What this does not solve

Bias–variance language does not identify the right target, fix selection bias, or guarantee a model’s generalisation. Efficiency comparisons are model- and estimator-class-dependent. A simulation can illustrate a trade-off but cannot replace evidence about the deployment distribution.

## Continue, go deeper, apply it

- Continue: Likelihood and log-likelihood
- Go deeper: Confidence intervals and their frequentist meaning
- Apply it: Probability and statistics for ML
