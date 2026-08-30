---
title: "Derivatives as rate, slope, and sensitivity"
track: "maths-foundations"
status: live
summary: "The derivative f'(a) is the limiting change in output per unit input near a: limh→0(f(a+h)−f(a))/h."
duration: "4 min read"
---

## The short answer

The derivative `f'(a)` is the limiting change in output per unit input near `a`: `lim[h→0](f(a+h)−f(a))/h`. It is a local slope, rate, and sensitivity measure. In AI, a derivative tells you how a small parameter or feature change affects a score at the current operating point; it is not the whole future response.

## Why this matters

Optimisation uses the sign and size of a derivative to choose a direction and step. Sensitivity analysis uses it to ask which feature or parameter matters locally. A derivative with the wrong units, sign, or scale can move a model toward a worse loss while appearing mathematically tidy.

## How it works

The secant slope over a finite change `h` is `(f(a+h)−f(a))/h`. The derivative is the limit of those slopes as `h` shrinks. For `f(x)=x²`:

```text
[f(a+h)-f(a)]/h
= [(a+h)²-a²]/h
= 2a+h → 2a.
```

Thus `f'(x)=2x`. A first-order local model is `f(a+Δ)≈f(a)+f'(a)Δ`; the omitted terms matter when `Δ` is not small or curvature is high.

## Worked examples and variations

### Example A: first-principles slope

**Input:** `f(x)=x²`, `a=3`. **Mechanism:** the difference quotient is `6+h`, whose limit is 6. **Output:** `f'(3)=6`. **Inspect:** increasing `x` by `0.01` predicts an output increase of about `0.06`. **Decision:** use 6 as a local sensitivity, not as the exact slope everywhere.

### Example B: model parameter sensitivity

**Input:** score `s(w)=2w+1` at `w=4`. **Mechanism:** `s'(w)=2`. **Output:** a `+0.3` parameter change predicts `+0.6` score. **Inspect:** the prediction is exact here because the function is affine. **Decision:** retain the parameter's units: score units per unit of `w`.

### Boundary case: a flat point

**Input:** `f(x)=x³` at `x=0`. **Mechanism:** `f'(0)=0`. **Output:** the first-order change is zero even though nearby outputs are not all zero. **Inspect:** `f(0.1)=0.001` is a second-order-or-higher effect. **Decision:** a zero derivative means locally flat to first order, not “no relationship.”

### Counterexample: derivative is not a finite change

**Input:** `f(x)=x²` at `x=3`, move by `Δ=1`. **Mechanism:** derivative prediction is `f(3)+6(1)=15`; exact value is `16`. **Output:** the derivative gives an approximation, not an identity. **Inspect:** the error is the curvature term `Δ²=1`. **Decision:** use smaller steps or include second-order information when the decision is sensitive.

## Two ways to see it

### Builder view

Treat a derivative as a contract with a base point, direction, and units. Log `(input, output, derivative, perturbation, predicted output, actual output)` so a sensitivity claim is inspectable.

### Systems or numerical view

Large derivatives can mean a real sensitive feature, poor scaling, or a unit mismatch. Small derivatives can mean irrelevance, saturation, or a parameter that is currently inactive. Interpret them with perturbation size and domain context.

## Hands-on

Implement `f(x)=x²` and a finite difference for a chosen `a`. Compare the local prediction with the exact value for `Δ∈{0.1,0.01}`.

**Failure state:** report the derivative at `a=3` as the exact change for `Δ=1`. **Test:** assert that the predicted and exact values differ by `Δ²`. **Reset:** use a smaller `Δ`, rerun, and explain whether the error shrank at the expected rate.

## Checkpoint

- [ ] Derive the derivative of `x²` from the difference quotient.
- [ ] Use `f'(3)` for `f(x)=x²` to predict `f(3.02)−f(3)`.
- [ ] Explain what `f'(0)=0` means for `x³` and what it does not mean.
- [ ] State the input and output units of a derivative in a simple model.

## What this does not solve

A derivative is local and can be undefined at a kink or boundary. It does not establish causality, global monotonicity, or a safe finite update. Finite differences, curvature, and domain checks complete the picture.

## Continue, go deeper, apply it

- Continue: Finite differences and numerical derivative checks
- Go deeper: Differentiation rules
- Apply it: Loss, gradients, and gradient descent
