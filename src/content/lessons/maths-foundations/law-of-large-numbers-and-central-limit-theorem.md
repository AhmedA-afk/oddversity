---
title: "Law of large numbers and central limit theorem"
track: "maths-foundations"
status: live
summary: "The law of large numbers says averages of suitable repeated observations approach their expected value as sample size grows."
duration: "5 min read"
---

## The short answer

The law of large numbers says averages of suitable repeated observations approach their expected value as sample size grows. The central limit theorem says that, after centring and scaling, many iid finite-variance averages approach a Gaussian shape. Neither says every finite sample is accurate, the raw data are normal, or dependent data behave as if they were independent.

## Why this matters

LLN supports running averages and Monte Carlo; CLT supports approximate standard
errors and intervals. Both are often invoked as “large data makes it true,” which
is too broad. Correlated users, repeated sessions, drift, and heavy tails can
reduce effective information or break the usual limit.

## How it works

For iid `Xᵢ` with finite mean `μ`, the weak LLN states
`P(|\bar X_n−μ|>ε)→0` for every `ε>0`. Under stronger conditions, convergence
is almost sure. The CLT adds finite variance `σ²>0` and gives

`√n(\bar X_n−μ)/σ ⇒ N(0,1)`.

The symbol `⇒` describes convergence in distribution. It concerns the mean’s
sampling distribution, not that observations become Gaussian. Independence,
identical distribution or suitable replacements, finite moments, and a stable
target are the assumptions to examine. Dependence can require a long-run
variance or effective sample size.

**Proof sketch:** the LLN controls the probability of a large average deviation;
the CLT additionally rescales the centred sum by its standard deviation and
identifies its limiting shape. The finite-variance and dependence conditions
are doing the work—neither theorem is a promise from the row count alone.

### Numerical and visual perspective

Simulate coin-toss means for `n=1,10,100,1000`: running means concentrate near
`p`, while histograms of the standardized mean become more bell-shaped. Repeat
with perfectly duplicated observations; the apparent row count grows but the
information does not.

### An illustrative story

A team treated 100 events from one user session as 100 independent confirmations.
The average was stable because the same behaviour was repeated, not because 100
independent units were observed. This is illustrative.

## Worked examples and variations

### Example A: Bernoulli running average

**Input:** iid fair coin indicators, `μ=.5`. **Mechanism:** by LLN, the sample
proportion tends toward .5 as flips grow. **Output:** early proportions jump;
later ones usually wander less. **Inspect:** convergence is probabilistic, not
monotone. **Decision:** use a confidence or error budget, not “it must equal .5
after 100 flips.”

### Example B: CLT for a bounded mean

**Input:** iid Bernoulli `p=.2`, `n=100`. **Mechanism:**
`SE=√(.2·.8/100)=.04`; the standardized sample proportion is approximately
normal for a rough calculation. **Output:** a sampling curve around .2.
**Inspect:** boundary probabilities and sample size affect approximation quality.
**Decision:** use an exact/binomial or better interval when tails matter.

### Example C: non-normal observations, near-normal mean

**Input:** iid exponential waiting times with finite mean and variance.
**Mechanism:** observations are skewed, but standardized averages can approach a
normal shape. **Output:** CLT concerns the mean, not each wait. **Inspect:** plot
both raw and mean histograms. **Decision:** do not Gaussianise individual data
just because an aggregate is approximately normal.

### Boundary case: dependence

**Input:** `X₁=…=X_n=Z`, one random value duplicated. **Mechanism:** the sample
mean equals `Z` for every `n`; no concentration occurs. **Output:** row count
does not increase effective sample size. **Inspect:** group by entity/session.
**Decision:** define the independent unit and account for dependence.

### Counterexample: raw data become normal

**Input:** a heavy-tailed or binary raw variable. **Mechanism:** CLT does not
claim the raw variable’s distribution becomes Gaussian as more observations are
collected; only the standardized mean has an asymptotic result under assumptions.
**Output:** a normal-looking mean histogram can coexist with non-normal raw data.
**Inspect:** label which object is plotted. **Decision:** apply the theorem to
the statistic it actually describes.

## Two ways to see it

### Builder view

Record the sampling unit, dependence, target mean, variance estimate, and the
quantity being approximated. Use simulation as a diagnostic of finite-sample
behaviour, not as a proof of assumptions.

### Systems or reviewer view

Ask what “large” means relative to tail probability, drift, and correlation. A
large log can contain little independent information or a changing population.

## Hands-on

Simulate Bernoulli and exponential samples, plot running means and standardized
mean histograms for growing `n`, and then duplicate each observation five times.
Compare nominal iid standard errors with grouped effective variation.

**Deliberate failure:** treat duplicated rows as independent and divide the SD
by `√(5n)`. **Test:** the grouped simulation must show no corresponding fivefold
information gain. **Reset:** sample independent units or use one row per group,
then rerun. **No-code route:** make a running-mean plot for coin flips and a
second plot where each flip is written five times.

## Checkpoint

- [ ] State the object that converges in LLN and CLT.
- [ ] Explain the difference between raw-data normality and a normal mean approximation.
- [ ] Name iid/finite-variance assumptions behind the standard CLT.
- [ ] Diagnose why duplicated observations do not create independent evidence.

## What this does not solve

The laws do not choose a sample, remove selection bias, guarantee finite-sample
accuracy, or protect against drift and dependence. Convergence in the centre can
still miss rare harms. Concentration bounds and rare-event calculations make that
failure budget explicit.

## Continue, go deeper, apply it

- Continue: Concentration, tail risk, and rare events
- Go deeper: Probability and statistics for ML
- Apply it: Likelihood, priors, and sampling assignment
