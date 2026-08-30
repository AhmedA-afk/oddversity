---
title: "Exponential families, sufficient statistics, and GLM intuition"
track: "maths-foundations"
status: live
summary: "An exponential-family model has the form p(x|η)=h(x) exp(ηᵀT(x)−A(η)); data enters the parameter-dependent part through sufficient statistic T(x)."
duration: "4 min read"
---

## The short answer

An exponential-family model has the form `p(x|η)=h(x) exp(ηᵀT(x)−A(η))`; data enters the parameter-dependent part through sufficient statistic T(x). Bernoulli, Gaussian, and Poisson models fit this pattern. Generalised linear models choose a distribution plus a link that maps a linear predictor to its mean, connecting probability assumptions to regression outputs without pretending every relationship is linear on the response scale.

## Why this matters

This pattern explains why counts can be summarised by totals, why logistic regression uses a logit link, and why Poisson regression uses a log link. It also shows when a compressed summary preserves information—and when it does not.

**Small incident (illustrative):** a count model used a linear predictor that produced negative expected counts. The issue was not a bad optimiser; the response-scale constraint required a log link or another valid mean parameterisation.

## How it works

In the exponential-family form, T(x) is sufficient for η when the likelihood factorises into a data-only term and a term depending on x through T(x). The log-partition function A(η) normalises the distribution and its derivatives encode moments. In a GLM, `g(E[Y|X]) = Xβ`; g is the link.

### Assumptions and derivation

For Bernoulli data, the sufficient statistic is the success count and the natural parameter is `η=logit(p)`. For Poisson data, T(x)=x and η=log λ. For a Gaussian with unknown mean and known variance, T(x)=x; with both mean and variance unknown, the needed summary includes sum x and sum x². Sufficiency depends on which parameters are unknown.

## AI use

Use GLM structure to choose valid output ranges, interpretable coefficients, and a likelihood aligned with labels or counts. Inspect link-scale residuals, exposure/offsets, overdispersion, and whether the sufficient statistic assumption survives missingness or dependence.

## Worked examples and variations

### Example A — smallest happy path

**Input:** Bernoulli observations `[1,1,0,1]`. **Mechanism:** the likelihood depends on the sequence through s=3 and n=4; `p̂=3/4`. **Output:** counts are sufficient for p under iid Bernoulli sampling. **Inspect:** order carries no extra information under this model. **Next decision:** use counts when the iid assumption is justified.

### Example B — meaningful variation

**Input:** Poisson counts `[2, 3, 1, 4]`. **Mechanism:** the likelihood depends on the observations through total count 10 and exposure. **Output:** λ̂=10/4=2.5 for equal exposures. **Inspect:** check mean/variance and exposure time. **Next decision:** add an offset or reconsider Poisson if exposure differs or overdispersion is visible.

### Example C — boundary case

**Input:** a Gaussian with both unknown μ and σ². **Mechanism:** sum x alone is insufficient; two samples with the same sum can have different squared deviations. **Output:** variance likelihoods differ. **Inspect:** retain sum x² as well. **Next decision:** state which parameters the summary is sufficient for.

### Example D — tempting counterexample

**Input:** Poisson GLM with linear mean `λ=Xβ`. **Mechanism:** some β and X produce λ<0. **Output:** invalid rate and undefined log likelihood. **Inspect:** apply log link so `λ=exp(Xβ)>0`. **Next decision:** use a link that respects the response domain.

### Example E — dependence variation

**Input:** repeated counts from one user are correlated. **Mechanism:** the iid Poisson likelihood treats each as independent, overstating information. **Output:** overly narrow uncertainty. **Inspect:** compare user-level clustering or a negative-binomial/random-effect model. **Next decision:** adapt the likelihood or resampling unit.

## Computation and interpretation

```python
import numpy as np

counts = np.array([2, 3, 1, 4])
rate_mle = counts.sum() / counts.size
linear_predictor = np.array([-2.0, 0.0, 1.0])
positive_rate = np.exp(linear_predictor)
print(rate_mle, positive_rate)
```

The exponential link guarantees positive rates but can grow rapidly. The summary and link are model choices that should be checked against data and residuals.

## Two ways to see it

### Builder view

An exponential-family model is a compact contract: distribution, natural parameter, sufficient statistic, normaliser, and valid mean range. A GLM adds a link between linear predictors and that range.

### Systems view

Sufficiency is conditional compression. If logging, dependence, exposure, or missingness changes the data process, the “sufficient” summary may no longer preserve the information the model needs.

## Hands-on

For Bernoulli and Poisson fixtures, compute the sufficient count/total and fit the corresponding simple rate. **Failure fixture:** fit a Gaussian mean-and-variance model from only the sample sum. **Test:** construct two samples with equal sum but different sum of squares and assert that their Gaussian likelihoods differ. **Reset:** restore both required summaries and compare the likelihoods.

## Checkpoint

- [ ] Recognise the exponential-family form and name T(x).
- [ ] State the Bernoulli and Poisson sufficient statistics in the common parameter settings.
- [ ] Explain why a link function is needed for a positive mean.
- [ ] Give one assumption that can invalidate a sufficient-summary workflow.

## What this does not solve

Exponential-family structure does not make the distribution correct, the link linear, or observations independent. Sufficiency is parameter- and model-specific. A valid range does not guarantee a useful fit or calibrated uncertainty.

## Continue, go deeper, apply it

- Continue: Objectives, losses, empirical risk, and constraints
- Go deeper: Likelihood and log-likelihood
- Apply it: Linear regression
