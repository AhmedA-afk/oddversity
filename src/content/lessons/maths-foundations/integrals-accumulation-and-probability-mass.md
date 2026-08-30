---
title: "Integrals, accumulation, and probability mass"
track: "maths-foundations"
status: live
summary: "An integral adds infinitesimal contributions across an interval: ∫ₐᵇ f(x)dx is signed accumulation, often area."
duration: "3 min read"
---

## The short answer

An integral adds infinitesimal contributions across an interval: `∫ₐᵇ f(x)dx` is signed accumulation, often area. The Fundamental Theorem of Calculus connects accumulation to antiderivatives. A continuous probability density uses an integral for mass, so `∫ f=1` and `P(a≤X≤b)=∫ₐᵇ f(x)dx`; the density value itself is not a probability.

## Why this matters

Integrals appear when turning rates into totals, densities into probabilities, and continuous losses or rewards into aggregate quantities. Confusing density with mass or using a signed integral where total magnitude is needed creates plausible but wrong AI metrics.

## How it works

Approximate the integral with rectangles:

```text
∫ₐᵇ f(x)dx ≈ Σᵢ f(xᵢ) Δx.
```

As the width shrinks, the sum approaches the integral. If `F'(x)=f(x)`, then `∫ₐᵇ f(x)dx=F(b)−F(a)`. For a density `p(x)`, nonnegativity and total integral 1 are required before interpreting an interval integral as probability.

## Worked examples and variations

### Example A: constant rate to total

**Input:** a service receives 4 requests per minute for 3 minutes. **Mechanism:** `∫₀³4 dt=12`. **Output:** expected accumulated requests are 12. **Inspect:** rate units `requests/minute` multiply time units `minute`. **Decision:** keep the time interval and units explicit.

### Example B: triangular accumulation

**Input:** `f(t)=t` over `[0,2]`. **Mechanism:** `∫₀²t dt=[t²/2]₀²=2`. **Output:** the area of the triangle is 2. **Inspect:** a left-rectangle sum underestimates and a right sum overestimates. **Decision:** refine the numerical grid if an exact antiderivative is unavailable.

### Example C: uniform density

**Input:** `X~Uniform(0,10)`, `p(x)=0.1` on that interval. **Mechanism:** `P(2≤X≤5)=∫₂⁵0.1dx=0.3`. **Output:** probability 0.3. **Inspect:** `p(5)=0.1` is a density, not a 10% point probability. **Decision:** integrate over a nonzero interval.

### Boundary case: a point has zero continuous mass

**Input:** the same uniform distribution. **Mechanism:** `P(X=5)=∫₅⁵p(x)dx=0`. **Output:** zero probability for one exact point, despite nonzero density nearby. **Inspect:** an interval such as `[4.99,5.01]` has positive mass. **Decision:** match the question to an interval or a discrete model.

### Counterexample: signed cancellation

**Input:** `f(x)=x` on `[−1,1]`. **Mechanism:** `∫₋¹¹x dx=0` because positive and negative areas cancel. **Output:** net signed accumulation is zero, while total geometric area is 1. **Inspect:** integrate `|f(x)|` for total magnitude. **Decision:** choose signed or absolute accumulation deliberately.

## Two ways to see it

### Builder view

Record integrand, bounds, units, numerical method, and tolerance. Add assertions that a density is nonnegative and integrates approximately to one on its declared support.

### Systems or probabilistic view

Numerical quadrature can miss narrow spikes or tails. A normalised estimate over a truncated range may still omit meaningful probability mass. The integral is only as good as the domain and approximation method.

## Hands-on

Approximate the three integrals above with left, right, and midpoint Riemann sums. Plot error as the number of rectangles grows.

**Failure state:** use a negative “density” on one subinterval and forget the `Δx` factor. **Test:** the density check must reject negativity and the convergence test must fail the missing-width implementation. **Reset:** restore nonnegative values and multiply every sample by its bin width.

## Checkpoint

- [ ] Compute `∫₀³4dt` and state its units.
- [ ] Explain why a continuous density value is not a point probability.
- [ ] Distinguish signed area from total area for `f(x)=x` on `[−1,1]`.
- [ ] Name two checks for a valid numerical density.

## What this does not solve

An integral does not identify a density, causal rate, or correct sampling model. Numerical integration also has discretisation and tail error that require diagnostics.

## Continue, go deeper, apply it

- Continue: One-dimensional optimisation clinic
- Go deeper: Probability and statistics for ML
- Apply it: Curriculum assignments
