---
title: "Finite differences and numerical derivative checks"
track: "maths-foundations"
status: live
summary: "Finite differences approximate a derivative using nearby function evaluations."
duration: "4 min read"
---

## The short answer

Finite differences approximate a derivative using nearby function evaluations. Forward `(f(x+h)−f(x))/h` and backward `(f(x)−f(x−h))/h` are first-order accurate; central `(f(x+h)−f(x−h))/(2h)` is usually more accurate for smooth functions. A good gradient check must balance truncation error against floating-point cancellation.

## Why this matters

Hand-derived gradients and autodiff code can be wrong by a sign, factor, axis, or reduction. Finite differences provide an independent check. They are a diagnostic oracle, not a replacement for analytic derivatives in training.

## How it works

Taylor expansions give the error order. Around `x`,

```text
f(x+h) = f(x)+f'(x)h+½f''(x)h²+...
f(x−h) = f(x)−f'(x)h+½f''(x)h²−...
```

Subtracting the first pair leaves an `O(h)` error; subtracting the second pair cancels the even term and leaves `O(h²)`. But when `h` is too small, subtracting nearly equal floating-point numbers loses significant digits.

## Worked examples and variations

### Example A: quadratic comparison

**Input:** `f(x)=x²`, `x=3`, `h=0.1`. **Mechanism:** forward gives `(9.61−9)/0.1=6.1`; backward gives `(9−8.41)/0.1=5.9`; central gives `(9.61−8.41)/0.2=6`. **Output:** exact derivative is 6. **Inspect:** central cancellation of the first curvature error is visible. **Decision:** use central differences for a smooth check when evaluations are affordable.

### Example B: asymmetric domain

**Input:** `f(x)=log(x)` at `x=0.01`. **Mechanism:** a backward step `h=0.02` would evaluate `log(-0.01)`, which is invalid over the reals. **Output:** the naive central check fails for a domain reason. **Inspect:** test `x−h>0` before evaluating. **Decision:** choose a smaller step or a one-sided method and record the asymmetry.

### Boundary case: a kink

**Input:** `f(x)=|x|` at `x=0`. **Mechanism:** forward difference is 1, backward is −1, and central is 0 for every symmetric `h`. **Output:** the central result is not a derivative because no two-sided derivative exists. **Inspect:** disagreement between one-sided slopes exposes the kink. **Decision:** test away from the kink or use a subgradient convention explicitly.

### Counterexample: tiny `h` is not always better

**Input:** `f(x)=exp(x)` near `x=20`, using `h=10⁻¹` down to `10⁻¹⁶`. **Mechanism:** moderate `h` has truncation error; very small `h` subtracts nearly equal large values and suffers cancellation. **Output:** error eventually rises. **Inspect:** plot relative error against `h` on a log scale. **Decision:** choose a middle range, often near a square-root machine-precision scale, and verify empirically.

## Two ways to see it

### Builder view

For each checked coordinate, show analytic value, numerical value, absolute error, and relative error. Use `2|a−n|/(|a|+|n|+ε)` so a near-zero derivative is not judged only by a ratio with a zero denominator.

### Systems or numerical view

A failed check can mean wrong math, a bad step size, nondifferentiability, stochastic noise, or a hidden state mutation. Freeze random seeds and avoid calling a stateful model twice without resetting it.

## Hands-on

Build a derivative-check table for `x²`, `log(x)`, and `|x|`. Sweep six step sizes and plot relative error.

**Failure state:** include `h` that crosses `log`'s domain and a check at the absolute-value kink. **Test:** the harness must label these as `domain-invalid` and `nondifferentiable`, not as ordinary gradient failures. **Reset:** use valid positive inputs away from the kink and rerun the sweep.

## Checkpoint

- [ ] Compute forward, backward, and central differences for `x²` at 3 with `h=0.1`.
- [ ] Explain why central differences have an `O(h²)` truncation term for smooth functions.
- [ ] Identify two different reasons a numerical check can fail.
- [ ] Choose a valid one-sided check for `log(x)` near zero.

## What this does not solve

Finite differences can be expensive, noisy, and misleading near non-smooth points. Agreement only says the implementation matches the chosen local numerical probe; it does not prove the model or objective is correct.

## Continue, go deeper, apply it

- Continue: Differentiation rules
- Go deeper: Gradient checking and debugging
- Apply it: Derivatives as rate, slope, and sensitivity
