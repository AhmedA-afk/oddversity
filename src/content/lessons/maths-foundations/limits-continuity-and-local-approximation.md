---
title: "Limits, continuity, and local approximation"
track: "maths-foundations"
status: live
summary: "A limit describes the value a function approaches as its input approaches a point; continuity says that approach agrees with the function's actual."
duration: "4 min read"
---

## The short answer

A limit describes the value a function approaches as its input approaches a point; continuity says that approach agrees with the function's actual value. This is the small amount of machinery needed to make derivative and approximation claims precise. In AI, inspect continuity at clipping, missing-value, and loss boundaries before trusting a local update.

## Why this matters

Gradient methods assume that a small parameter move produces a predictable small change in the objective. A hard threshold, divide-by-zero, or unhandled missing value can break that assumption. The code may still return a number, but a plot or a finite-difference test can reveal a jump.

## How it works

Write

```text
lim[x→a] f(x) = L
```

when values of `f(x)` can be made arbitrarily close to `L` by taking `x` sufficiently close to `a` (without requiring `x=a`). A function is continuous at `a` when `f(a)` is defined and `lim[x→a] f(x)=f(a)`.

For a differentiable-looking local approximation, continuity is the first gate:

```text
f(a+h) ≈ f(a)       when h is small.
```

The approximation becomes a line only after we establish a derivative: `f(a+h) ≈ f(a)+f'(a)h`.

### A compact derivation

For `f(x)=x²`, factor the difference:

```text
f(a+h)-f(a) = (a+h)²-a² = 2ah+h².
```

As `h→0`, both `2ah` and `h²` approach zero, so the change approaches zero and the function is continuous. Dividing by `h` later leaves `2a+h`, whose limit is `2a`; that is the derivative preview.

## Worked examples and variations

### Example A: a polynomial near a point

**Input:** `f(x)=x²+1`, `a=2`, `x=2.01`. **Mechanism:** `f(2)=5` and `f(2.01)=5.0401`. **Output:** the output is close to 5 for a small input change. **Inspect:** the difference is `0.0401` and shrinks as `x` approaches 2. **Decision:** a local linear model is plausible, but its slope still needs calculation.

### Example B: a removable discontinuity

**Input:** `g(x)=(x²−1)/(x−1)` near `a=1`. **Mechanism:** for `x≠1`, cancel to `x+1`, so the limit is 2; the original expression is undefined at 1. **Output:** `lim[x→1]g(x)=2`, but `g(1)` does not exist. **Inspect:** a plotted gap may be invisible at ordinary resolution. **Decision:** either define the missing point deliberately or reject it; do not call the raw function continuous there.

### Boundary case: a ReLU kink

**Input:** `r(x)=max(0,x)` near 0. **Mechanism:** both one-sided limits are 0 and `r(0)=0`. **Output:** ReLU is continuous at 0, even though its slope changes. **Inspect:** continuity does not imply differentiability. **Decision:** later choose a convention for the derivative at the kink.

### Counterexample: a hard decision jump

**Input:** `d(x)=1` when `x≥0.5`, otherwise `0`. **Mechanism:** approaching 0.5 from below gives 0; from above gives 1. **Output:** the two-sided limit does not exist. **Inspect:** an input perturbation of `0.49→0.51` flips the action. **Decision:** do not apply a smooth local update to the decision itself; optimise a score upstream and threshold separately.

## Two ways to see it

### Builder view

Probe `f(a−h)`, `f(a)`, and `f(a+h)` for a decreasing sequence of `h`. Record the input contract, output, and whether the one-sided values agree. This catches clipping and missing-data branches before a derivative check.

### Systems or numerical view

Continuity is a local reliability property, not a promise of global accuracy. A model can be continuous but badly calibrated, or discontinuous only on a rare production path that the training set misses.

## Hands-on

Create a small table or notebook for `x²`, `max(0,x)`, and the threshold `1[x≥0.5]`. For `h∈{10⁻¹,10⁻²,10⁻³}`, compute left and right values around each chosen point.

**Failure state:** pass a missing value into a function that treats it as zero, and probe the threshold on both sides. **Test:** assert that missing input is rejected and that the threshold's left/right values are reported as unequal. **Reset:** restore a numeric fixture and rerun the table, preserving the chosen `h` values.

## Checkpoint

- [ ] Explain why `lim[x→1](x²−1)/(x−1)=2` does not make the original expression defined at 1.
- [ ] Distinguish continuity from differentiability using ReLU at zero.
- [ ] Identify whether the two-sided limit of a threshold at its cutoff exists.
- [ ] Use three shrinking `h` values to test whether a local approximation is becoming stable.

## What this does not solve

A limit does not estimate how quickly an approximation becomes good, and continuity does not imply a useful gradient, good conditioning, or a correct model. Those require derivatives, numerical checks, and empirical evaluation.

## Continue, go deeper, apply it

- Continue: Derivatives as rate, slope, and sensitivity
- Go deeper: Mathematics Foundations checklist
- Apply it: Loss, gradients, and gradient descent
