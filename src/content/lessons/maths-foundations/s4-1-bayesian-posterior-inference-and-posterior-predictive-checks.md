---
title: "Bayesian posterior inference and posterior predictive checks"
track: "maths-foundations"
status: live
summary: "Bayesian inference combines a prior with a likelihood to produce a posterior: p(θ|y) ∝ p(y|θ)p(θ)."
duration: "4 min read"
---

## The short answer

Bayesian inference combines a prior with a likelihood to produce a posterior: `p(θ|y) ∝ p(y|θ)p(θ)`. The posterior represents uncertainty about parameters after seeing data; the posterior predictive checks what data the fitted model would generate. Use both: a narrow posterior can still belong to a model that cannot reproduce important features of the observations.

## Why this matters

AI systems often report a point estimate while hiding uncertainty and model
misspecification. Bayesian updating makes prior assumptions explicit, while
posterior predictive checks ask whether those assumptions plus the fitted
parameters can reproduce relevant patterns. A good-looking parameter posterior
is not sufficient evidence of a good data-generating model.

## How it works

Bayes’ rule is

```text
p(θ|y) = p(y|θ)p(θ) / ∫ p(y|θ')p(θ')dθ'.
```

For a future observation, average over parameter uncertainty:
`p(ỹ|y)=∫p(ỹ|θ)p(θ|y)dθ`. A posterior predictive check samples `θ` from the
posterior, simulates `ỹ`, and compares a preselected statistic or plot of `ỹ`
with the observed `y`. The check is diagnostic; it does not prove the model true.

## Worked examples and variations

### Example A: a Beta–Binomial coin

**Input:** prior `θ~Beta(2,2)`, observe 8 heads of 10. **Mechanism:** posterior
is `Beta(10,4)`. **Output:** updated mass is concentrated above .5 but still
uncertain. **Inspect:** compare prior, posterior, and credible interval.
**Decision:** report a distribution, not only the posterior mean.

### Example B: posterior predictive counts

**Input:** draw `θ` from `Beta(10,4)`, then draw 10 future flips repeatedly.
**Mechanism:** parameter and observation uncertainty are both propagated.
**Output:** a distribution of future head counts. **Inspect:** compare its shape
with the observed count and the intended use. **Decision:** distinguish parameter
uncertainty from irreducible new-data variation.

### Boundary case: no observations

**Input:** the same prior with no data. **Mechanism:** likelihood contributes no
update. **Output:** posterior equals prior. **Inspect:** predictive behavior is
prior-driven. **Decision:** do not present prior assumptions as learned evidence.

### Counterexample: parameter fit passes, predictive check fails

**Input:** fit a Poisson model to counts with more zeros and variance than Poisson
allows. **Mechanism:** a narrow rate posterior can still generate the wrong zero
frequency and tails. **Output:** posterior predictive mismatch. **Inspect:** compare
zero count, variance, and tail statistics. **Decision:** revise the likelihood or
accept the limitation explicitly.

## An illustrative story

An illustrative alert model has a precise posterior for its average rate but
underpredicts bursts. Operators experience the bursts, not the average. A
posterior predictive plot of maximum run length exposes the model gap before the
point estimate is used for staffing.

## Two ways to see it

### Updating view

The prior is a starting distribution, the likelihood reweights parameter values,
and the posterior is the normalized result.

### Model-checking view

Posterior predictive simulation asks whether the fitted story can generate the
patterns that matter. It is a falsification tool, not a proof of correctness.

## Hands-on

Implement Beta–Binomial updating and a posterior predictive simulator. Plot prior,
posterior, predictive head-count histogram, and at least three checks: mean,
variance, and an extreme-count statistic. Repeat with an overdispersed observed
fixture.

**Failure state:** use the posterior mean as if it were a fixed true parameter
and omit parameter uncertainty from simulation. **Test:** posterior predictive
draws must vary in both `θ` and outcomes; the overdispersed fixture must trigger a
model-check warning. **Reset:** sample parameters from the posterior and revise
the likelihood or record the limitation.

## Checkpoint

- [ ] Write Bayes’ rule and identify prior, likelihood, evidence, and posterior.
- [ ] Update `Beta(2,2)` after 8 heads and 2 tails.
- [ ] Explain why posterior prediction samples both parameters and future data.
- [ ] Give one statistic that can reveal a predictive mismatch.

## What this does not solve

Bayesian inference does not make a prior neutral, a likelihood realistic, or a
posterior causal. Computational convergence and predictive agreement on selected
statistics do not guarantee validity on unmeasured or shifted data.

## Continue, go deeper, apply it

- Continue: Conjugacy and exponential-family structure
- Go deeper: Variational inference and the ELBO
- Apply it: Statistical probability and uncertainty for ML
