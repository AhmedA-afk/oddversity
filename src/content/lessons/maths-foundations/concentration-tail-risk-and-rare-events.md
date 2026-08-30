---
title: "Concentration, tail risk, and rare events"
track: "maths-foundations"
status: live
summary: "Concentration bounds control how far a random quantity may be from its mean under stated assumptions; tail risk asks about consequential extremes."
duration: "4 min read"
---

## The short answer

Concentration bounds control how far a random quantity may be from its mean under stated assumptions; tail risk asks about consequential extremes, not only average performance. Markov and Chebyshev use moments, while Hoeffding gives a sharper bound for independent bounded observations. Large samples can still miss events whose probability is smaller than the observation budget.

## Why this matters

An average model loss can look safe while a rare failure is severe. A sample
with no incidents does not prove the incident rate is zero. Bounds are often
loose, but they make assumptions and evidence budgets explicit, which is better
than an unqualified “the mean is stable.”

## How it works

For non-negative `X` and `a>0`, Markov’s inequality follows from
`X≥a·1{X≥a}`:
`P(X≥a)≤E[X]/a`. Chebyshev applies Markov to `(X−μ)²`:
`P(|X−μ|≥t)≤σ²/t²`.

If `Xᵢ∈[a,b]` are independent, Hoeffding gives

`P(|\bar X−E\bar X|≥ε)≤2 exp(−2nε²/(b−a)²)`.

It is a bound, not an observed probability, and it can be conservative. For a
rare event with probability `p`, the probability of zero occurrences in `n`
independent trials is `(1-p)^n≈e^{-np}`. To observe a rare event, the exposure
must be large relative to `1/p`, and dependence can change the calculation.

### Numerical and visual perspective

Plot empirical tail probability against threshold on a log scale and overlay a
bound. Plot mean loss beside a high quantile or exceedance rate. The bound may
sit above the empirical curve; its role is a guaranteed ceiling under its
assumptions, not a fitted description.

### An illustrative story

A safety review reported “zero failures in 10,000 tests” without translating
that exposure into a bound or a detectable rate. Zero is evidence, but its
strength depends on the sampling design and the harm’s tail. This is illustrative.

## Worked examples and variations

### Example A: Chebyshev bound

**Input:** `μ=10`, `σ²=4`, ask for a deviation of at least 4.
**Mechanism:** `P(|X−10|≥4)≤4/16=.25`. **Output:** a guaranteed upper bound
under a finite-variance model. **Inspect:** the bound may be much larger than
the actual tail. **Decision:** use it when only moments are trusted, but do not
call .25 the observed risk.

### Example B: Hoeffding for bounded error rate

**Input:** independent indicators in `[0,1]`, `n=1,000`, tolerance `.05`.
**Mechanism:** bound is `2e^{-2·1000·.05²}=2e^{-5}≈.0135`.
**Output:** a distribution-free bound under the stated iid/bounded conditions.
**Inspect:** independence and unit of analysis. **Decision:** compare with a
domain-specific or exact interval when available.

### Example C: missing a rare event

**Input:** `p=.001`, `n=10,000` independent exposures. **Mechanism:**
`P(no event)=.999^10000≈4.5×10^{-5}`; expected events are 10.
**Output:** zero events would be surprising under the simple model, but the
sample still must define exposure and independence. **Inspect:** event labels and
coverage. **Decision:** use a rare-event strategy when `np` is small.

### Boundary case: zero variance or zero rate

**Input:** `X` is constant. **Mechanism:** Chebyshev’s bound is zero for positive
`t`, but this reflects a model with no variation; if the sensor never observed
the relevant regime, it is not evidence about future variation. **Output:**
mathematical concentration can be vacuous operationally. **Inspect:** support and
measurement process. **Decision:** distinguish structural certainty from missing
exposure.

### Counterexample: mean hides tail harm

**Input:** system A has loss 1 on every case; system B has loss 0 on 99% and
loss 100 on 1%. Both have mean loss 1. **Mechanism:** same expectation, very
different exceedance probability and consequence. **Output:** average parity
does not imply risk parity. **Inspect:** quantiles and worst-case slices.
**Decision:** choose a tail metric when rare harm matters.

## Two ways to see it

### Builder view

Record the random unit, bound assumptions, exposure, threshold, and consequence.
Plot empirical tails with a clear sample denominator and label analytic bounds.

### Systems or risk view

Ask who bears the tail, whether events cluster, and whether testing covers the
rare region. Concentration of an average does not guarantee concentration of
harm.

## Hands-on

Simulate bounded Bernoulli losses and a two-regime tail-risk fixture. Compute
mean, empirical exceedance rates, Chebyshev/Hoeffding bounds, and the probability
of observing zero rare events over repeated runs.

**Deliberate failure:** treat `n` duplicated rows as independent exposure and
report a tighter Hoeffding bound. **Test:** grouped exposure must reduce the
effective sample count; the test should reject the unqualified bound. **Reset:**
use independent exposure units and rerun. **No-code route:** compare 100 tokens
drawn independently with 100 copies of one token, then count distinct draws.

## Checkpoint

- [ ] Derive Markov or Chebyshev from a non-negative quantity.
- [ ] State the independence and boundedness assumptions in Hoeffding.
- [ ] Calculate the chance of observing no rare events.
- [ ] Explain why equal means can hide unequal tail risk.

## What this does not solve

Bounds do not estimate the true tail tightly, guarantee independence, or define
which harms matter. Rare-event testing can be expensive and biased by selection.
When outcomes depend on a state that evolves over time, Markov chains provide a
different probability model.

## Continue, go deeper, apply it

- Continue: Markov chains and stationary distributions
- Go deeper: Imbalanced data and metrics
- Apply it: Likelihood, priors, and sampling assignment
