---
title: "Taylor expansions and approximation error"
track: "maths-foundations"
status: live
summary: "A Taylor polynomial replaces a smooth function near a with derivatives measured at a: f(a+h)≈Σₖ₌₀ⁿ f⁽ᵏ⁾(a)hᵏ/k!."
duration: "3 min read"
---

## The short answer

A Taylor polynomial replaces a smooth function near `a` with derivatives measured at `a`: `f(a+h)≈Σₖ₌₀ⁿ f⁽ᵏ⁾(a)hᵏ/k!`. More terms usually extend local accuracy, but the approximation has a region and an error. In AI, use it to reason about activations, stable computations, and why a local model should not be extrapolated blindly.

## Why this matters

Optimisers, uncertainty approximations, and numerical libraries all replace complicated functions with local polynomials. Knowing the neglected term tells you when a simplification is safe and when a “close near zero” approximation becomes a bad model at production scale.

## How it works

The degree-2 expansion is

```text
f(a+h) = f(a) + f'(a)h + ½f''(a)h² + R₃(h).
```

For `exp(x)` at zero, every derivative is 1, so `exp(h)≈1+h+h²/2`. The next term is approximately `h³/6`; its size gives a practical error estimate near zero. The exact remainder depends on higher derivatives somewhere between `a` and `a+h`.

## Worked examples and variations

### Example A: exponential near zero

**Input:** `exp(0.1)`. **Mechanism:** degree-2 estimate is `1+0.1+0.005=1.105`; adding `0.1³/6` gives `1.1051667`. **Output:** the true value is about `1.1051702`. **Inspect:** the next term explains most of the visible error. **Decision:** degree 2 is adequate for a coarse local estimate, not for arbitrary precision.

### Example B: logarithm near one

**Input:** `log(1+h)` with `h=0.1`. **Mechanism:** `h−h²/2+h³/3=0.095333...`. **Output:** it approximates `log(1.1)≈0.0953102`. **Inspect:** alternating terms shrink while `|h|<1`. **Decision:** state the radius and error goal before truncating.

### Boundary case: sigmoid at zero

**Input:** `σ(h)` near `h=0`. **Mechanism:** `σ(0)=1/2`, `σ'(0)=1/4`, and the quadratic term is zero by symmetry, so `σ(h)≈1/2+h/4`. **Output:** at `h=0.2`, estimate `0.55` versus true `~0.5498`. **Inspect:** the linear approximation is excellent nearby. **Decision:** use it only as a local explanation or check.

### Counterexample: extrapolating a local polynomial

**Input:** degree-2 `exp` approximation at `h=3`: `1+3+4.5=8.5`. **Mechanism:** omitted positive terms are large. **Output:** true `exp(3)≈20.0855`. **Inspect:** the error is larger than the estimate itself. **Decision:** do not use a local Taylor model outside its validated region.

## Two ways to see it

### Builder view

Store the expansion centre, degree, estimated remainder, and valid input interval next to the approximation. Test at the centre, near the boundary, and outside the stated interval.

### Systems or numerical view

Higher degree is not automatically better in floating point: large alternating terms can cancel, and evaluation can become unstable. A library's stable implementation may be preferable to a hand-expanded polynomial.

## Hands-on

Implement degree-1 through degree-4 approximations for `exp(x)`, `log(1+x)`, and `sigmoid(x)`. Plot absolute error over a stated interval.

**Failure state:** evaluate the `log(1+x)` polynomial at `x=−1.1` and the degree-2 exponential at `x=3`. **Test:** reject the log domain and fail the exponential error budget. **Reset:** restore `x>-1` and the validated local interval, then rerun.

## Checkpoint

- [ ] Write the degree-2 Taylor polynomial for `exp(x)` at zero.
- [ ] Explain what the first omitted term says about local error.
- [ ] Derive the linear approximation to sigmoid at zero.
- [ ] Give one reason a higher-degree approximation can still be numerically poor.

## What this does not solve

Taylor expansions do not guarantee convergence over a desired domain or preserve a model's probabilistic meaning. Error must be measured where the approximation will actually be used.

## Continue, go deeper, apply it

- Continue: Integrals, accumulation, and probability mass
- Go deeper: Notation, indices, sums, and products
- Apply it: Floating-point and numerical stability practice
