---
title: "Second derivatives, curvature, and local quadratic models"
track: "maths-foundations"
status: live
summary: "The second derivative f''(x) measures how the slope changes. Near a, a useful local model is f(a+h)≈f(a)+f'(a)h+½f''(a)h²."
duration: "3 min read"
---

## The short answer

The second derivative `f''(x)` measures how the slope changes. Near `a`, a useful local model is `f(a+h)≈f(a)+f'(a)h+½f''(a)h²`. Positive curvature bends upward, negative curvature bends downward, and large magnitude means a step can become unsafe quickly. Use curvature to interpret flatness and choose a cautious update.

## Why this matters

Two losses can have the same gradient at a point but react very differently to the same step. Curvature explains sharp versus flat minima, why learning rates overshoot, and why a zero gradient can hide a non-minimum.

## How it works

Differentiate the derivative once more. At a stationary point `f'(a)=0`, the quadratic model becomes `f(a+h)≈f(a)+½f''(a)h²`. If `f''(a)>0`, nearby nonzero moves increase the model; if `f''(a)<0`, they decrease it. If `f''(a)=0`, the test is inconclusive.

For `f(x)=½kx²`, `f'=kx`, `f''=k`. A gradient step `x⁺=x−ηkx` contracts when `0<ηk<2`; otherwise it can oscillate or diverge. This is a local result for the quadratic, not a universal optimiser theorem.

## Worked examples and variations

### Example A: sharp and flat quadratics

**Input:** `f₁(x)=50x²`, `f₂(x)=0.5x²` at `x=1`. **Mechanism:** gradients are 100 and 1; curvatures are 100 and 1. **Output:** the same learning rate produces a much larger move on `f₁`. **Inspect:** compare predicted quadratic change. **Decision:** scale the step to curvature or use an adaptive strategy.

### Example B: classifying a stationary point

**Input:** `f(x)=x²−4x+3` at 2. **Mechanism:** `f'(2)=0`, `f''(2)=2>0`. **Output:** local minimum. **Inspect:** nearby values exceed `f(2)`. **Decision:** the second-derivative test agrees with the sign chart.

### Boundary case: zero second derivative

**Input:** `f(x)=x⁴` at 0. **Mechanism:** `f'(0)=0` and `f''(0)=0`, yet `f(x)≥0`. **Output:** it is a minimum, but the second-derivative test cannot prove it. **Inspect:** the fourth-order term decides. **Decision:** inspect higher-order behaviour or direct nearby values.

### Counterexample: positive curvature is not global optimality

**Input:** `f(x)=x⁴−x²` at `x=1/√2`. **Mechanism:** `f''>0` there. **Output:** a local minimum, while the function grows without bound and has other structure. **Inspect:** scan a wider interval. **Decision:** distinguish local curvature from global objective behaviour.

## Two ways to see it

### Builder view

At each iteration log `x`, `f`, `f'`, `f''`, step size, and predicted versus actual loss change. A mismatch is a warning about a too-large step, wrong curvature, or a non-quadratic region.

### Systems or numerical view

Curvature depends on parameterisation and units. Rescaling a feature changes the numerical Hessian even when the underlying decision function is equivalent. A “flat” direction may be harmless redundancy or a poorly identified parameter.

## Hands-on

Simulate gradient descent on `½kx²` for `k=1` and `k=50`, using the same three learning rates. Plot loss and distance to zero.

**Failure state:** choose `η=0.05` for `k=50`, which gives `ηk=2.5` and diverges. **Test:** assert that loss is non-increasing only for the stable fixtures and flag the divergent trace. **Reset:** reduce `η` below `2/k`, rerun, and compare convergence.

## Checkpoint

- [ ] Compute the first two derivatives of `½kx²`.
- [ ] Classify `x=2` for `x²−4x+3`.
- [ ] Explain why `f''(0)=0` is inconclusive for `x⁴`.
- [ ] State what curvature changes in a gradient-step decision.

## What this does not solve

One-dimensional curvature does not capture interactions among coordinates, noise, or nonlocal barriers. In multiple dimensions, the Hessian and its eigen-directions are the appropriate extension.

## Continue, go deeper, apply it

- Continue: Taylor expansions and approximation error
- Go deeper: Hessians, curvature, and saddle points
- Apply it: Optimisation, loss, and gradient descent
