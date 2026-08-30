---
title: "Monte Carlo estimation and standard errors"
track: "maths-foundations"
status: live
summary: "Monte Carlo estimates Eg(X) with a sample average ĝₙ=(1/n)Σg(Xᵢ)."
duration: "4 min read"
---

## The short answer

Monte Carlo estimates `E[g(X)]` with a sample average `ĝₙ=(1/n)Σg(Xᵢ)`. For independent draws with finite variance, its standard error is approximately `s_g/√n`. A convergence curve shows random error shrinking; it cannot detect a sampler that is systematically drawing from the wrong distribution. Separate sampling noise from model or implementation bias.

## Why this matters

Many expectations and probabilities are easier to estimate by simulation than by
integration. The `1/√n` rate is slow but predictable, so doubling accuracy can
require about four times as many independent draws. A narrow standard error is
not reassuring if the target, proposal weights, or event definition is wrong.

## How it works

If `Gᵢ=g(Xᵢ)` are iid with mean `μ` and variance `σ²`, then
`E[ĝₙ]=μ` and `Var(ĝₙ)=σ²/n`. Estimate `σ` with the sample standard deviation
`s_g`; the estimated standard error is `s_g/√n`. For a Bernoulli event, this is
`√(p(1-p)/n)` with `p` estimated by the sample proportion.

Plot `ĝₙ` against `n` or `log n`, and add a reference value when known. A
repeated-seed band shows simulation variability better than one lucky trajectory.
When samples are dependent, the iid formula usually understates uncertainty;
effective sample size or a dependence-aware method is needed.

### Numerical and visual perspective

Estimate `π` from points in a unit square: `g=1[x²+y²≤1]` and
`π≈4·mean(g)`. The estimate is a noisy staircase approaching π; the SE is
`4·sqrt(p(1-p)/n)`. Plot several seeds to distinguish a chance fluctuation from
a reproducible offset.

### An illustrative story

A simulation printed six decimal places after a modest run and looked precise.
Repeating with new seeds showed the fourth decimal was unstable. The formatting
was more precise than the standard error. This is illustrative.

## Worked examples and variations

### Example A: estimate an expectation

**Input:** draw `X~Uniform(0,1)` and estimate `E[X]=.5` with `g(X)=X`.
**Mechanism:** average the draws; `SE≈s/√n`. **Output:** an estimate with a
sampling error. **Inspect:** convergence across `n=100,1000,10000`.
**Decision:** report the estimate, sample size, seed, and SE together.

### Example B: estimate π

**Input:** 10,000 uniform points in the unit square. **Mechanism:** count points
inside the quarter-circle and multiply the fraction by four. **Output:** a
value near π, varying by seed. **Inspect:** the indicator variance is largest
near `p=.5`; the result is not exact. **Decision:** increase `n` when the error
budget—not the decimal display—requires it.

### Example C: rare-event probability

**Input:** event probability about `10^-4`; draw `n=10,000` samples.
**Mechanism:** an expected one event makes the relative error large and zero
events possible. **Output:** a noisy estimate, often 0. **Inspect:** absolute
SE can look small while relative uncertainty is huge. **Decision:** use more
samples, importance sampling, or a structural approximation.

### Boundary case: undefined or infinite variance

**Input:** a heavy-tailed `g(X)` with no finite second moment. **Mechanism:**
the sample mean may still be informative under additional conditions, but the
usual `s/√n` standard error is not reliable. **Output:** an apparently stable
SE can be meaningless. **Inspect:** tail sensitivity and repeated runs.
**Decision:** use robust or tail-aware methods and state the assumption.

### Counterexample: systematic sampler bias

**Input:** target `Uniform(0,1)` but code samples only `[0,.5]`.
**Mechanism:** Monte Carlo averages converge to the wrong expectation, such as
`E[X]=.25` instead of `.5`; more samples only narrow around the wrong value.
**Output:** small Monte Carlo noise, large systematic error. **Inspect:** support
and known test expectations. **Decision:** validate the sampler before trusting
the SE.

## Two ways to see it

### Builder view

Keep target, estimator, seed, sample count, standard error, and reference value
in one experiment record. Plot error versus sample size and repeat across seeds.

### Systems or reviewer view

Ask whether the uncertainty covers only random draws or also model, data, and
implementation uncertainty. A simulation can be reproducible and still be
wrong in the same way every time.

## Hands-on

Build a seeded Monte Carlo estimator for `π` and `E[Uniform(0,1)]`. Save
estimates at increasing sample sizes, calculate standard errors, and plot
convergence. Repeat with the intentionally biased `[0,.5]` sampler.

**Deliberate failure:** report `s/n` as the standard error and use the biased
sampler. **Test:** the correct scaling is `s/√n`, and the reference-value plot
must flag the persistent bias. **Reset:** restore iid `[0,1]` draws and the
square-root denominator. **No-code route:** use repeated random tables and
plot running averages on graph paper.

## Checkpoint

- [ ] Derive the variance and standard-error scaling of an iid sample mean.
- [ ] Explain why `1/√n` makes high precision expensive.
- [ ] Distinguish random Monte Carlo noise from systematic sampler bias.
- [ ] State when the iid standard-error formula needs adjustment.

## What this does not solve

Monte Carlo does not validate the target distribution, eliminate rare-event
blindness, or provide causal evidence. Standard errors cover specified sampling
variation, not arbitrary model misspecification. LLN and CLT explain why sample
averages often settle and when a normal approximation is useful.

## Continue, go deeper, apply it

- Continue: Law of large numbers and central limit theorem
- Go deeper: Probability and statistics for ML
- Apply it: Likelihood, priors, and sampling assignment
