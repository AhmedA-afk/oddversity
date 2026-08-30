---
title: "Critical points, monotonicity, and extrema"
track: "maths-foundations"
status: live
summary: "A critical point is an interior input where f'(x)=0 or the derivative is undefined."
duration: "3 min read"
---

## The short answer

A critical point is an interior input where `f'(x)=0` or the derivative is undefined. A derivative sign chart says where a function rises or falls; comparing the signs around a critical point and checking endpoints identifies local or global extrema. In AI, this separates a candidate training optimum from a boundary, kink, or flat point that only looks settled.

## Why this matters

An optimiser can stop because the gradient is small, because it hit a constraint, or because a numerical calculation failed. Those states have different meanings. Monotonicity and endpoint checks keep “no visible movement” from being mistaken for “best possible value.”

## How it works

If `f'(x)>0` on an interval, `f` increases there; if `f'(x)<0`, it decreases. A sign change `−→+` suggests a local minimum and `+→−` a local maximum. A zero derivative with no sign change is a flat non-extremum. Global extrema on a closed interval require both interior candidates and endpoints.

For `f(x)=x²−4x+3`, `f'=2x−4`, so the only interior candidate is `x=2`. The derivative is negative before 2 and positive after 2, proving a local minimum; endpoints decide whether it is also global on a stated interval.

## Worked examples and variations

### Example A: a convex quadratic

**Input:** `f(x)=x²−4x+3` on `[0,5]`. **Mechanism:** the derivative changes `−→+` at 2. **Output:** minimum `f(2)=−1`; endpoint values are `3` and `8`. **Inspect:** the candidate beats both endpoints. **Decision:** report a global minimum only because the domain was checked.

### Example B: monotone model score

**Input:** `s(x)=sigmoid(x)`. **Mechanism:** `s'(x)=s(x)(1−s(x))>0` for finite `x`. **Output:** score increases everywhere, with no finite interior maximum or minimum. **Inspect:** it approaches 0 and 1 only as `x` tends to infinities. **Decision:** a threshold or bounded operating range supplies the actual decision domain.

### Boundary case: endpoint optimum

**Input:** `f(x)=x` on `[−2,3]`. **Mechanism:** derivative is 1 everywhere, so there are no interior critical points. **Output:** minimum is at −2 and maximum at 3. **Inspect:** an interior gradient-zero search cannot find either. **Decision:** always include feasible boundaries.

### Counterexample: a flat non-extremum

**Input:** `f(x)=x³` at 0. **Mechanism:** `f'(0)=0`, but `f'` is positive on both sides. **Output:** 0 is neither a local maximum nor a local minimum. **Inspect:** the sign does not change. **Decision:** never classify a point from `f'=0` alone.

## Two ways to see it

### Builder view

Make a table with interval, derivative sign, function direction, critical points, and endpoint values. This is a small executable specification for an optimiser's stopping decision.

### Systems or numerical view

A stationary point can be a desired fit, a saddle-like flat region in a larger problem, a plateau caused by saturation, or a bug. The derivative test is evidence about the local mathematical objective, not a quality guarantee for the trained system.

## Hands-on

Write a one-dimensional classifier that receives a symbolic candidate, sampled derivative signs, and a closed interval, then labels minima, maxima, flat non-extrema, and endpoints.

**Failure state:** classify `x³` at zero as a minimum and omit endpoints for `f(x)=x` on `[−2,3]`. **Test:** fixtures must fail with the reason `no-sign-change` and `endpoint-missing`. **Reset:** restore the sign and endpoint checks and rerun all four examples.

## Checkpoint

- [ ] Make a derivative sign chart for `x²−4x+3`.
- [ ] Explain why a zero derivative is only a candidate.
- [ ] Find the extrema of `x` on `[−2,3]`.
- [ ] Give a reason a small gradient may reflect a boundary rather than an optimum.

## What this does not solve

One-dimensional tests do not classify high-dimensional saddles or prove a global optimum on an unbounded domain. They also assume the derivative and domain have been computed correctly.

## Continue, go deeper, apply it

- Continue: Second derivatives, curvature, and local quadratic models
- Go deeper: One-dimensional optimisation clinic
- Apply it: Optimisation, loss, and gradient descent
