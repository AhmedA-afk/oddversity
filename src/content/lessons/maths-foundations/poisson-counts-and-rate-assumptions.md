---
title: "Poisson counts and rate assumptions"
track: "maths-foundations"
status: live
summary: "A Poisson variable counts events in a fixed exposure when events occur independently at a constant rate λ: P(N=k)=e^{-λ}λ^k/k!."
duration: "4 min read"
---

## The short answer

A Poisson variable counts events in a fixed exposure when events occur independently at a constant rate `λ`: `P(N=k)=e^{-λ}λ^k/k!`. Its mean and variance are both `λ`. This equality is a diagnostic, not a law of nature; clustering, heterogeneous rates, or missing events create overdispersion and call for a richer model.

## Why this matters

Requests per minute, tool errors per batch, and incidents per customer are
counts with different exposure lengths. Poisson models are useful baselines
because one rate controls both centre and spread. They become dangerous when a
single average rate hides busy periods, repeated failures, or correlated events.

## How it works

The Poisson PMF is
`P(N=k)=e^{-λ}λ^k/k!`, for `k=0,1,…`. If the rate is `r` per unit exposure
and exposure is `t`, then `λ=rt`. The standard derivation partitions the
interval into many small pieces, assumes at most one event per piece, constant
event chance proportional to its width, and independent increments; the
Binomial limit yields the Poisson formula. Under this process,
`E[N]=Var(N)=λ`.

For rates that vary with time, a non-homogeneous process can use
`λ=∫r(t)dt`, but independent-increment assumptions still need checking. If
variance is substantially larger than the mean after matching exposure, call it
overdispersion and investigate rather than merely increasing `λ`.

### Numerical and visual perspective

Plot count histograms and a mean-versus-variance chart across equal-exposure
groups. A Poisson baseline lies near the diagonal `variance=mean`; points well
above it suggest clustering or rate heterogeneity. Always compare groups at a
common exposure or use an exposure offset.

### An illustrative story

A monitoring team fit one incident rate to quiet nights and traffic spikes
together. The mean looked reasonable, but the observed variance was much larger
than the mean. The discrepancy was a prompt to inspect rate mixtures, not proof
that the Poisson family was useless. This is illustrative.

## Worked examples and variations

### Example A: requests in an hour

**Input:** mean rate 3 requests per minute for 60 minutes, so `λ=180`.
**Mechanism:** `N~Poisson(180)` under constant independent arrivals.
**Output:** expected count 180 and variance 180. **Inspect:** the exposure unit
was converted before fitting. **Decision:** use a count baseline and inspect
residual rate by time bucket.

### Example B: rare tool errors

**Input:** an expected 0.2 errors per batch. **Mechanism:**
`P(N=0)=e^{-0.2}≈.819`; `P(N=1)=.2e^{-0.2}≈.164`. **Output:** most batches
have no errors, but one-error batches are not impossible. **Inspect:** zero
counts do not mean the error process is absent. **Decision:** retain a count
model and sufficient exposure.

### Boundary case: zero rate

**Input:** `λ=0`. **Mechanism:** `P(N=0)=1` and all positive counts have mass
zero. **Output:** a degenerate count. **Inspect:** a numerical implementation
must handle `0^0` through the PMF convention, not a NaN. **Decision:** treat
zero exposure/rate as a separate case.

### Example C: exposure scaling

**Input:** rate `0.1` defects per 100 items; inspect 500 items. **Mechanism:**
five exposure units give `λ=.5`, so `P(N≥1)=1-e^{-.5}≈.393`. **Output:** a
probability of at least one defect. **Inspect:** rates and exposure use the same
unit. **Decision:** compare rates only after normalising exposure.

### Counterexample: overdispersion

**Input:** ten equal-exposure groups have mean count 4 but variance 20.
**Mechanism:** `20>4`, inconsistent with a simple homogeneous Poisson model.
**Output:** the mean alone fits, the spread does not. **Inspect:** plot group
counts, time, and entity-level rates; test for clustering or mixtures.
**Decision:** consider a time-varying rate, random-effects, or another count
model rather than claiming Poisson uncertainty.

## Two ways to see it

### Builder view

Make exposure explicit, estimate mean and variance on equal exposure, and keep a
rate plot beside the count histogram. Use the Poisson PMF as a baseline with a
diagnostic, not as an automatic truth.

### Systems or reviewer view

Ask whether events are independent, whether simultaneous events share a cause,
and whether the rate is stable. A global average can hide bursts that matter for
capacity or safety.

## Hands-on

Generate deterministic Poisson-like counts for equal exposure, calculate mean
and variance, and plot the PMF against the empirical histogram. Add a clustered
fixture by drawing a group-specific rate first.

**Deliberate failure:** pool unequal exposures and compare raw count variance
with the raw mean. **Test:** the equal-exposure diagnostic must be performed
after dividing by exposure; the pooled result should be flagged as confounded by
exposure. **Reset:** stratify or use an exposure offset and rerun. **No-code
route:** make a count/exposure table and compare rates before counts.

## Checkpoint

- [ ] Write a Poisson PMF and state its support.
- [ ] Convert a rate and exposure into `λ` with matching units.
- [ ] Explain why mean equals variance under the simple model.
- [ ] Diagnose overdispersion and list one plausible cause.

## What this does not solve

Mean–variance agreement is not proof of independent constant-rate events. It does
not handle censoring, dependence, zero inflation, or arbitrary time variation.
Gaussian approximations may help for large counts, but they bring their own
support and tail assumptions.

## Continue, go deeper, apply it

- Continue: Gaussian distributions and standardisation
- Go deeper: Anomaly detection
- Apply it: Likelihood, priors, and sampling assignment
