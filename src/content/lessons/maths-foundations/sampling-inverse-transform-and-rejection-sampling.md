---
title: "Sampling, inverse transform, and rejection sampling"
track: "maths-foundations"
status: live
summary: "Sampling turns uniform random numbers into draws from a target distribution. Inverse transform sampling sets X=F⁻¹(U) for U~Uniform(0,1)."
duration: "5 min read"
---

## The short answer

Sampling turns uniform random numbers into draws from a target distribution. Inverse transform sampling sets `X=F⁻¹(U)` for `U~Uniform(0,1)`. Rejection sampling draws from an easier proposal `q` and accepts with a probability that corrects it toward target density `f`. Both methods need support, normalisation, and randomness assumptions to be checked.

## Why this matters

Simulation powers uncertainty estimates, synthetic fixtures, Bayesian computation,
and stress tests. A histogram that “looks right” can still come from a biased
sampler, a clipped tail, or a proposal that never visits important states. The
algorithm should expose its acceptance rate and support rather than hiding them.

## How it works

Let `U` be uniform on `(0,1)`. For a continuous CDF `F`,
`P(F⁻¹(U)≤x)=P(U≤F(x))=F(x)`, so the output has CDF `F`. For a discrete CDF,
choose the smallest value whose cumulative mass exceeds `U`.

If `f(x)≤M q(x)` wherever `f(x)>0`, draw `X~q` and `V~Uniform(0,1)`; accept
`X` when `V≤f(X)/(M q(X))`. Conditional on acceptance, the density is
proportional to `q(x)f(x)/(Mq(x))=f(x)/M`, so normalisation produces `f`.
The proposal must cover the target support; the envelope ratio must never exceed
one. A large `M` means many rejected draws.

**Derivation:** for inverse transform, `P(F⁻¹(U)≤x)=P(U≤F(x))=F(x)`.
For rejection, the accepted proposal density is proportional to
`q(x)·f(x)/(Mq(x))=f(x)/M`; normalising over accepted points gives the target.
These equalities are the correctness proofs, and both require the support
conditions stated above.

### Numerical and visual perspective

For inverse transform, plot the CDF and horizontal uniform levels mapping to
quantiles. For rejection, draw proposal points in a rectangle and shade the
accepted region under the target; the acceptance fraction estimates `1/M` when
the envelope is tight and both densities are normalised.

### An illustrative story

A synthetic-data generator matched the centre of a target histogram but almost
never emitted the rare tail because its proposal had no tail coverage. A plot
comparison at ordinary scale missed the problem. This is illustrative; support
and tail tests are the remedy.

## Worked examples and variations

### Example A: inverse-transform exponential

**Input:** `U~Uniform(0,1)` and target Exponential rate `λ`.
**Mechanism:** solve `u=1−e^{-λx}` to get `X=−log(1−U)/λ`.
**Output:** exponential draws. **Inspect:** survival at `t` should be near
`e^{-λt}` with enough samples. **Decision:** use inverse transform when the CDF
is easy to invert.

### Example B: discrete categorical sampling

**Input:** masses `.5,.3,.2`. **Mechanism:** intervals `[0,.5),[.5,.8),[.8,1)`
map a uniform draw to classes. **Output:** empirical frequencies near the
specified vector. **Inspect:** interval boundaries and class order.
**Decision:** preserve the mapping alongside generated labels.

### Example C: rejection for a triangular target

**Input:** target `f(x)=2x` on `[0,1]`, proposal `q(x)=1` there, `M=2`.
**Mechanism:** draw `x~Uniform(0,1)` and accept when `v≤x` because
`f/(Mq)=x`. **Output:** accepted values concentrate near 1 and have target
density `2x`. **Inspect:** expected acceptance is `1/2`. **Decision:** use a
proposal that covers and reasonably resembles the target.

### Boundary case: exact uniform endpoint

**Input:** inverse-transform code receives `U=1`. **Mechanism:** for an
exponential, `−log(1−U)` is infinite. **Output:** an infinite draw outside the
finite operational fixture. **Inspect:** random APIs usually return values in a
half-open interval, but defensive code should define endpoint behaviour.
**Decision:** clip only with a documented tail change, or reject the endpoint.

### Counterexample: proposal misses support

**Input:** target is uniform on `[0,1]`, proposal is uniform on `[0,.5]`.
**Mechanism:** target-positive points above `.5` can never be proposed.
**Output:** accepted samples are biased toward the lower half no matter how many
are drawn. **Inspect:** check `q(x)>0` wherever `f(x)>0`. **Decision:** expand
the proposal or choose a different sampler.

## Two ways to see it

### Builder view

Record target support, proposal support, envelope `M`, seed, acceptance rate,
and validation statistic. Separate sampler correctness from the later use of
the samples.

### Systems or reviewer view

Look at rare regions and rejected work, not just the central histogram. A sampler
can be computationally valid yet operationally too slow or too blind for the
decision it supports.

## Hands-on

Implement inverse-transform exponential sampling and rejection sampling for the
triangular density. With a fixed seed, plot histograms, empirical CDFs, and
acceptance rates. Assert that every accepted sample lies in target support.

**Deliberate failure:** use the `[0,.5]` proposal for the `[0,1]` target, and
set `M=1` for the triangular target. **Test:** support coverage and acceptance
probability checks must fail; an acceptance probability above one is invalid.
**Reset:** restore `[0,1]` and `M=2`, then rerun. **No-code route:** perform
rejection with points on graph paper and colour accepted points.

## Checkpoint

- [ ] Prove the inverse-transform CDF identity in one line.
- [ ] State the rejection-sampling support and envelope conditions.
- [ ] Calculate the triangular acceptance probability.
- [ ] Diagnose an endpoint, support, or acceptance-probability failure.

## What this does not solve

Finite samples can miss tails, and a matching histogram does not prove a target
distribution. Inverse CDFs may be unavailable; rejection can be inefficient in
high dimensions. Monte Carlo estimation turns these samples into estimates with
standard errors and convergence diagnostics.

## Continue, go deeper, apply it

- Continue: Monte Carlo estimation and standard errors
- Go deeper: Probability and statistics for ML
- Apply it: Likelihood, priors, and sampling assignment
