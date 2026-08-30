---
title: "Uniform, geometric, and exponential models"
track: "maths-foundations"
status: live
summary: "Uniform models assign equal density across a stated interval or equal mass across a finite set."
duration: "4 min read"
---

## The short answer

Uniform models assign equal density across a stated interval or equal mass across a finite set. Geometric models count trials until the first success; exponential models measure continuous waiting time under a constant event rate. Geometric and exponential distributions are memoryless, but only when the constant-success or constant-hazard assumption fits the process.

## Why this matters

Randomised tests, retry counts, queue waits, and time-to-event features look like
simple waiting problems. The tempting shortcut is to assume “the next minute is
like the last” without checking whether the process ages, saturates, or follows a
schedule. Memorylessness is a specific mathematical property, not a general
description of uncertainty.

## How it works

For `X~Uniform(a,b)`, the density is `1/(b-a)` on `[a,b]`. A discrete uniform
variable has equal mass on each supported value. If independent trials have
success probability `p`, a Geometric variable `T` for the first success has

`P(T=t)=(1-p)^(t-1)p`, `t=1,2,…`.

An Exponential variable with rate `λ>0` has density `f(t)=λe^{-λt}` for `t≥0`
and survival `P(T>t)=e^{-λt}`. Memorylessness is
`P(T>s+t|T>s)=P(T>t)`, which follows by dividing exponentials (and similarly
for geometric powers). It assumes a constant per-trial or per-time hazard.

### Numerical and visual perspective

Plot the uniform density as a flat rectangle, the geometric PMF as descending
bars, and the exponential density as a smooth decay. On a survival plot,
exponential waiting is a straight line on a log-survival axis. A changing slope
is evidence against a single constant-rate model.

### An illustrative story

A retry policy assumed every attempt had the same chance of success, although
the service was rate-limiting after repeated failures. The geometric tail then
understated long waits. This is an illustrative failure mode, not a measured
service claim.

## Worked examples and variations

### Example A: discrete uniform test choice

**Input:** choose one of eight test buckets with equal probability. **Mechanism:**
each bucket has mass `1/8`. **Output:** a selected bucket is uniform on the
finite set. **Inspect:** all eight labels, not just their numeric codes, are
equally likely. **Decision:** use this only when equal exposure is intended.

### Example B: geometric retry count

**Input:** each independent request attempt succeeds with `p=.25`.
**Mechanism:** `P(T=4)=.75³·.25≈.1055`. **Output:** probability the first
success is on attempt four. **Inspect:** the first three attempts must fail and
the fourth must succeed. **Decision:** use a geometric model when the attempt
rate is stable and attempts are comparable.

### Example C: exponential service wait

**Input:** constant arrival rate `λ=.5` per minute. **Mechanism:**
`P(T>3)=e^{-1.5}≈.223`. **Output:** about 22.3% chance of waiting more than
three minutes under the model. **Inspect:** the unit of `λ` is per minute.
**Decision:** convert rates and thresholds with matching units.

### Boundary case: time zero and the first trial

**Input:** exponential `T` at `t=0`, or geometric `T` at `t=1`.
**Mechanism:** `P(T>0)=1` for continuous waiting and `P(T=1)=p` for a first
success. **Output:** support conventions matter. **Inspect:** a geometric model
starting at zero counts failures, not trials. **Decision:** name the variable
before comparing implementations.

### Counterexample: scheduled events are not memoryless

**Input:** a daily batch job runs once at 02:00; at 01:59 the next event is
almost certain, while at 12:00 it is not. **Mechanism:** the hazard depends on
time since schedule, not a constant rate. **Output:** exponential memorylessness
is invalid. **Inspect:** plot event probability by time-of-day or age.
**Decision:** use a schedule or hazard model rather than forcing an exponential.

## Two ways to see it

### Builder view

Write the support, unit, and hazard assumption beside the distribution. Check
whether repeated trials reset the process and whether old age changes the next
event probability.

### Systems or reviewer view

Memorylessness can be attractive because it simplifies state. Treat that
simplification as a testable claim; queues, users, retries, and hardware often
carry history.

## Hands-on

Simulate 10,000 uniform choices, geometric retries, and exponential waits with
a fixed seed. Plot the PMF/density and empirical survival curve. Compare the
conditional wait after an elapsed time with the unconditional wait.

**Deliberate failure:** simulate retries with success probability increasing
after every failure while still labelling the output Geometric. **Test:** the
conditional survival curves should disagree with the memoryless prediction.
**Reset:** restore a fixed `p` for every attempt and rerun. **No-code route:**
roll a fixed-probability die for retries and draw a piecewise survival sketch.

## Checkpoint

- [ ] State the support and parameter units for all three families.
- [ ] Calculate a geometric point probability and an exponential survival probability.
- [ ] Derive the memoryless identity from the survival function.
- [ ] Name a real process where constant hazard is implausible.

## What this does not solve

These distributions do not account for queues, censoring, changing rates, or
dependent retries. A good histogram fit over one interval does not establish
memorylessness over another. Poisson counts combine constant-rate assumptions
with event counts and provide a related diagnostic.

## Continue, go deeper, apply it

- Continue: Poisson counts and rate assumptions
- Go deeper: Uncertainty and decision
- Apply it: Likelihood, priors, and sampling assignment
