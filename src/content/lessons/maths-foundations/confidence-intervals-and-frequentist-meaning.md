---
title: "Confidence intervals and their frequentist meaning"
track: "maths-foundations"
status: live
summary: "A 95% confidence procedure is designed so that, over repeated samples from its stated model, about 95% of its intervals contain the fixed parameter."
duration: "4 min read"
---

## The short answer

A 95% confidence procedure is designed so that, over repeated samples from its stated model, about 95% of its intervals contain the fixed parameter. After one interval is computed, the parameter is fixed; the procedure, not the parameter, is random. Choose an interval method whose assumptions fit the estimator, sample size, dependence, and boundary, then report the estimate and interval together.

## Why this matters

An estimate without uncertainty invites false precision. A model’s measured lift, error rate, or coefficient can move because the sample moved. Confidence intervals make that sampling variation visible, but only under the coverage conditions of the chosen procedure.

**Small incident (illustrative):** a dashboard showed “95% confidence” beside every metric, including a rate with three observations. The label looked rigorous while the normal approximation was not credible.

## How it works

If a standardised statistic has a known reference distribution, invert an acceptance rule to obtain parameter values compatible with the data. For a mean with known population standard deviation σ and approximately normal sampling distribution, a two-sided 95% interval is `x̄ ± 1.96 σ/√n`. For unknown σ, use a t critical value under the usual normal-model assumptions.

### Assumptions and derivation

The known-σ interval comes from `P(−1.96 ≤ (x̄−μ)/(σ/√n) ≤ 1.96) ≈ .95`. Rearranging the inequality for μ produces the interval. The coverage statement changes with non-iid observations, data-dependent stopping, heavy tails, and a poor approximation. For proportions near 0 or 1, a Wilson or exact method can behave better than the simple Wald interval.

## AI use

Attach intervals to evaluation metrics, experiment effects, data-quality rates, and monitoring estimates. State the population, sampling unit, confidence procedure, and whether the interval covers a mean, difference, or model parameter. Do not translate a confidence interval into a posterior probability without a prior and Bayesian model.

## Worked examples and variations

### Example A — smallest happy path

**Input:** x̄=10, σ=2 known, n=25. **Mechanism:** standard error = 2/5=.4; interval = 10 ± 1.96(.4). **Output:** approximately [9.216, 10.784]. **Inspect:** units remain the original measurement unit. **Next decision:** report the estimate and method, not only the endpoints.

### Example B — meaningful variation

**Input:** a difference in conversion rates estimated as +2 percentage points with interval [−1, +5] points. **Mechanism:** zero is compatible with the procedure’s plausible effects. **Output:** directionally positive estimate but imprecise evidence. **Inspect:** check randomisation and the estimand before saying “no effect.” **Next decision:** collect more data or make a decision using practical cost thresholds.

### Example C — boundary case

**Input:** 0 failures in 5 trials. **Mechanism:** a symmetric normal interval may produce a lower endpoint below 0 or a misleadingly narrow range. **Output:** impossible probabilities or overconfidence. **Inspect:** enforce [0,1] bounds and use a binomial-aware interval. **Next decision:** choose a method designed for a boundary rate.

### Example D — tempting counterexample

**Input:** one computed 95% interval [9.2, 10.8]. **Mechanism:** the frequentist statement refers to repeated operation of the procedure, not a 95% chance assigned to this fixed interval containing μ. **Output:** “μ has a 95% probability of being inside” is not the standard frequentist interpretation. **Inspect:** identify whether a Bayesian posterior interval was intended. **Next decision:** use the vocabulary matching the method.

## Computation and interpretation

```python
import math

x_bar, sigma, n = 10.0, 2.0, 25
half_width = 1.96 * sigma / math.sqrt(n)
print(x_bar - half_width, x_bar + half_width)
```

This is a known-σ normal approximation. If σ was estimated, replace 1.96 with an appropriate t critical value; if the sampling design or outcome is different, use a method designed for that design.

## Two ways to see it

### Builder view

An interval is an estimator plus a calibration procedure. Store method, critical value, sample size, unit, and denominator alongside the number so it can be reproduced.

### Systems view

Coverage is a long-run property. A green interval badge cannot tell whether today’s data was selected, the process drifted, or the metric has a consequential subgroup failure.

## Hands-on

Simulate 2,000 samples of size 25 from a normal population with μ=10 and σ=2; build the known-σ 95% interval for each and count coverage. **Failure fixture:** reuse a single sample for all 2,000 intervals or round the standard error before calculating. **Test:** the simulation must use independent samples and report a coverage proportion with the seed and method. **Reset:** restore the fresh seeded draw and unrounded calculation.

## Checkpoint

- [ ] State the repeated-sampling meaning of 95% confidence.
- [ ] Derive the known-σ interval from a standardised statistic.
- [ ] Explain why a boundary proportion needs a different method.
- [ ] List the sample, population, estimator, and method behind an interval.

## What this does not solve

Confidence intervals do not prove a hypothesis, guarantee future coverage under drift, or correct biased sampling. Multiple intervals and optional stopping alter error properties. The method’s assumptions are part of the result.

## Continue, go deeper, apply it

- Continue: Bootstrap methods
- Go deeper: Hypothesis tests, p-values, and permutation tests
- Apply it: Cross-validation and experimental design
