---
title: "A7 · Likelihood, priors, and sampling"
track: "maths-foundations"
status: live
summary: "This lab fits Bernoulli, Poisson, and Gaussian parameters by maximum likelihood (MLE) and maximum a posteriori estimation (MAP), then estimates."
duration: "9 min read"
---

## The short answer

This lab fits Bernoulli, Poisson, and Gaussian parameters by maximum likelihood (MLE) and maximum a posteriori estimation (MAP), then estimates a known expectation by Monte Carlo. You will compare closed-form answers with code, attach uncertainty and convergence evidence to a simulation, and expose how an invalid prior or biased/incorrect weight can make a precise-looking result wrong.

## Why this matters

Likelihood is the bridge from a probability model to a fitted parameter; a prior makes the extra preference explicit; Monte Carlo turns repeated draws into an estimate with sampling error. In an AI system, these are different uncertainty layers: a model can fit the observed data, a prior can pull the estimate, and a sampler can still be biased.

## How it works

Submit one reproducible notebook or Python script containing:

1. the problem statement in your own words;
2. assumptions and notation for all three likelihoods and priors;
3. hand derivations or annotated code for each MLE and MAP result;
4. an independent Monte Carlo estimate, interval, and convergence diagnostic;
5. one bad-prior or bad-weight failure plus a non-convergence/biased-sampler failure;
6. deterministic test and reset output; and
7. a 150–300 word decision memo explaining which estimates are usable and why.

Use NumPy, `np.float64`, and `np.random.default_rng(20260830)`. Record `np.__version__`. A library distribution or optimiser may verify a result, but it cannot replace the closed-form derivation and diagnostic.

## Fixtures and assumptions

Keep the following fixtures unchanged for the passing run:

```python
import numpy as np

bernoulli_x = np.array([1, 1, 0, 1, 0, 1, 0, 1], dtype=np.float64)
poisson_x = np.array([2, 3, 1, 4, 2, 0], dtype=np.float64)
gaussian_x = np.array([1., 2., 3., 4., 5.], dtype=np.float64)

# Priors use the stated parameterisations:
# Beta(alpha, beta); Gamma(shape=alpha, rate=beta);
# Normal(mu0, tau2) for an unknown Gaussian mean.
alpha, beta = 2., 2.
gamma_alpha, gamma_rate = 2., 1.
mu0, tau2, known_sigma2 = 0., 4., 4.
```

Assume independent observations, the declared supports, and a known Gaussian variance `σ²=4` while estimating `μ`. State that a Poisson Gamma prior uses a **rate**, not a scale. For the Monte Carlo section, draw `X~Uniform(0,1)` and estimate `E[X²]=1/3`.

## Derivations and target answers

### Bernoulli MLE and MAP

For `s` successes in `n` trials, the log-likelihood is

```text
ℓ(p) = s log p + (n−s) log(1−p).
```

Setting its derivative to zero gives `p_MLE=s/n` for an interior fixture. With `p~Beta(α,β)`, the posterior is `Beta(α+s,β+n−s)`. When both posterior shape parameters exceed 1, the MAP mode is

```text
p_MAP = (α+s−1)/(α+β+n−2).
```

For `s=5,n=8`, the expected values are `p_MLE=0.625` and, with `Beta(2,2)`, `p_MAP=0.6`. Also test the all-success boundary fixture: MLE `1.0`, MAP `0.9` under the same prior.

### Poisson MLE and MAP

For counts `xᵢ~Poisson(λ)`,

```text
ℓ(λ) = (Σxᵢ)log λ − nλ + constant,
λ_MLE = mean(x).
```

With `λ~Gamma(α,β)` in the shape/rate convention, the posterior is `Gamma(α+Σx, β+n)` and, for shape greater than 1, the MAP mode is

```text
λ_MAP = (α+Σx−1)/(β+n).
```

For `poisson_x`, `Σx=12,n=6`, so `λ_MLE=2`, while `Gamma(2,1)` gives `λ_MAP=13/7≈1.857143`. An all-zero count fixture has MLE 0 and MAP `1/7`, illustrating prior influence at a boundary.

### Gaussian mean MLE and MAP

For `xᵢ~Normal(μ,σ²)` with known `σ²`, the log-likelihood contains
`−Σ(xᵢ−μ)²/(2σ²)`. Differentiating gives `μ_MLE=x̄`. With prior
`μ~Normal(μ₀,τ²)`, combine precisions:

```text
μ_MAP = [(n/σ²)x̄ + (1/τ²)μ₀] / [(n/σ²)+(1/τ²)].
```

For `gaussian_x`, `x̄=3`, `n=5`, `σ²=4`, `μ₀=0`, and `τ²=4`, so `μ_MLE=3` and `μ_MAP=2.5`. As an additional check, the Gaussian variance MLE with unknown variance would use divisor `n`, not `n−1`; for this fixture it is `2.0`.

## Worked examples and variations

### Case A: interior Bernoulli fit

**Input:** `bernoulli_x` with five successes and `Beta(2,2)`. **Mechanism:** evaluate both the closed-form MLE and posterior mode. **Output:** `0.625` versus `0.6`. **Inspect:** the prior pulls the rate toward 0.5. **Decision:** report the prior and sample size with the estimate; do not call MAP an unqualified truth.

### Case B: Poisson exposure and rate convention

**Input:** six counts with total 12 and a `Gamma(2,1)` shape/rate prior. **Mechanism:** fit the per-exposure rate using the formulas above. **Output:** MLE `2`, MAP `13/7`. **Inspect:** changing the exposure interval changes the rate parameterisation; treating Gamma rate as scale changes the answer. **Decision:** print the convention beside the result.

### Case C: Gaussian shrinkage

**Input:** `[1,2,3,4,5]`, known variance 4, prior mean 0 and variance 4. **Mechanism:** combine data precision `5/4` with prior precision `1/4`. **Output:** MLE `3`, MAP `2.5`. **Inspect:** the MAP shift is larger with less data or a tighter prior. **Decision:** run a prior-sensitivity table rather than reporting one arbitrary hyperparameter.

### Boundary case: data at the likelihood boundary

**Input:** all Bernoulli observations are 1 or all Poisson counts are 0. **Mechanism:** MLE reaches `p=1` or `λ=0`; a proper prior can keep the MAP inside or away from the problematic boundary. **Output:** the two estimators differ most where data alone are least informative. **Inspect:** score an unseen opposite outcome and check for `log(0)`. **Decision:** preserve the raw data and label the smoothing choice.

### Counterexample: more samples do not fix a wrong model or weight

**Input:** sample from `Uniform(0,0.5)` while claiming `Uniform(0,1)`, or use `q/p` instead of `p/q` in a weighted estimate. **Mechanism:** the running estimate converges narrowly to the wrong target. **Output:** a small standard error coexists with persistent bias. **Inspect:** support, density ratio, and a known reference value. **Decision:** validate the target and weight before increasing sample count.

## Monte Carlo estimate, interval, and convergence diagnostic

Use one generator and retain the full draw sequence:

```python
rng = np.random.default_rng(20260830)
x = rng.random(10_000)
g = x * x

for n in (100, 1_000, 10_000):
    estimate = g[:n].mean()
    se = g[:n].std(ddof=1) / np.sqrt(n)
    interval = (estimate - 1.96 * se, estimate + 1.96 * se)
```

The known reference is `1/3≈0.3333333333`. With the stated seed and draw order, the target checkpoints are approximately:

| n | estimate | estimated SE | 95% interval |
|---:|---:|---:|---:|
| 100 | 0.289457 | 0.026579 | [0.237363, 0.341551] |
| 1,000 | 0.329059 | 0.009180 | [0.311065, 0.347052] |
| 10,000 | 0.332693 | 0.002986 | [0.326840, 0.338546] |

Plot the running estimate against `1/3`, with `±1.96·SE` bands, and plot absolute error against `n` on log–log axes. Add a reference slope of `n⁻¹/²`. Repeat the final estimate for at least five seeds or use batch means so one lucky path is not mistaken for a convergence guarantee.

## Bad-prior and bad-weight fixtures

Validate priors before fitting:

```python
if alpha <= 0 or beta <= 0:
    raise ValueError("Beta hyperparameters must be positive")
if gamma_alpha <= 0 or gamma_rate <= 0:
    raise ValueError("Gamma shape and rate must be positive")
```

Run a bad-prior fixture such as `Beta(0,0)` or a negative Gamma rate. It must fail as an invalid prior, not silently produce a “regularised” estimate.

For a weight audit, draw proposal samples `q(x)=2x` on `[0,1]` using `x=sqrt(U)`. The target density is `p(x)=1`, so

```text
E_p[g(X)] = E_q[g(X) p(X)/q(X)]
         = E_q[x²/(2x)] = 1/3.
```

The correct seeded estimate at 10,000 draws is about `0.333255`. Deliberately use `q/p` instead; it produces about `0.798583`, a persistent bias that more samples do not cure. This is an optional extension connected to importance sampling and weighted estimates.

## Two ways to see it

### Builder view

Keep a table with family, data summary, likelihood, prior, parameterisation, MLE, MAP, Monte Carlo estimate, uncertainty, and decision. The table prevents a prior or rate convention from disappearing inside a helper function.

### Systems or numerical view

MLE, MAP, and Monte Carlo answer different questions under different assumptions. A small interval can describe only draw noise; it does not cover misspecified likelihoods, bad priors, biased weights, or data selection.

## Hands-on

1. Print fixture summaries, assumptions, seed, and NumPy version.
2. Derive and implement Bernoulli MLE/MAP, Poisson MLE/MAP, and Gaussian-mean MLE/MAP.
3. Assert the closed-form values and compare likelihood curves around each estimate.
4. Estimate `E[X²]` with the seeded Monte Carlo sequence; report SE and 95% interval at three sample sizes.
5. Plot running convergence and repeated-seed variability.
6. Run the bad-prior fixture and the wrong-weight or biased-sampler fixture.
7. Restore the passing fixtures and rerun from a clean process.

**Failure state:** accept an improper prior, treat Gamma rate as scale, report `s/n` as Monte Carlo SE, or use a sampler restricted to `[0,0.5]`. **Test:** parameter validation, known closed-form answers, the reference `1/3`, and persistent-bias checks must identify the specific failure. **Reset:** restore proper hyperparameters, the rate convention, `s/√n`, and iid `[0,1]` draws.

## Checkpoint

- [ ] Derive the Bernoulli, Poisson, and Gaussian-mean MLEs.
- [ ] Derive the Beta, Gamma, and Normal-prior MAP fixtures with parameterisations stated.
- [ ] Explain why the MAP/MLE gap shrinks as data precision dominates prior precision.
- [ ] Report a Monte Carlo estimate, standard error, interval, reference value, and convergence plot.
- [ ] Diagnose one bad prior or weight and one non-converging/biasing sampler.
- [ ] Attach a 150–300 word decision memo with a limitation.

## Acceptance tests

- [ ] Bernoulli fixture returns MLE `0.625` and MAP `0.6`.
- [ ] Poisson fixture returns MLE `2.0` and MAP `13/7` under a Gamma shape/rate prior.
- [ ] Gaussian fixture returns mean MLE `3.0` and mean MAP `2.5`.
- [ ] Seeded Monte Carlo checkpoints agree with the table within `1e-6`.
- [ ] The interval and convergence diagnostic are labelled as sampling uncertainty.
- [ ] Bad-prior input is rejected before fitting.
- [ ] Wrong-weight or biased-sampler output is flagged against the known reference.
- [ ] Clean reset reproduces the passing values and plots.

## Rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25% | correct MLE/MAP derivations, supports, prior parameterisations, and assumptions |
| Computation | 20% | reproducible NumPy fixtures, stable likelihood calculations, and deterministic checks |
| Interpretation | 20% | estimates connected to AI uncertainty, smoothing, and model-relative decisions |
| Diagnostics | 20% | interval/convergence evidence plus bad-prior, bad-weight, or non-convergence diagnosis |
| Communication | 15% | labelled tables/plots, readable argument, 150–300 word decision memo |

## What this does not solve

MLE and MAP do not prove that a likelihood or prior is appropriate, and a Monte Carlo interval does not cover systematic model or sampler bias. These toy fixtures do not establish calibration, causal validity, or production reliability; those require data-generating-process checks, held-out evaluation, and monitoring.

## Continue, go deeper, apply it

- Continue: Law of large numbers and central limit theorem
- Go deeper: MAP and regularisation
- Apply it: Bootstrap methods
