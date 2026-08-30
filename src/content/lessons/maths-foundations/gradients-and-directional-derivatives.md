---
title: "Gradients and directional derivatives"
track: "maths-foundations"
status: live
summary: "The gradient collects partial derivatives, ∇f=(∂f/∂x₁,…,∂f/∂xₙ). The directional derivative along a unit vector u is Dᵤf=∇f·u."
duration: "3 min read"
---

## The short answer

The gradient collects partial derivatives, `∇f=(∂f/∂x₁,…,∂f/∂xₙ)`. The directional derivative along a unit vector `u` is `Dᵤf=∇f·u`. By Cauchy–Schwarz, the gradient points in the direction of steepest ascent and `−∇f` in steepest descent. The gradient is not itself “the change” until a direction and step are supplied.

## Why this matters

Training updates, sensitivity reports, and adversarial perturbation analyses all need a direction. A gradient is a local coordinate representation of a linear approximation; confusing it with a scalar change leads to wrong step sizes and misleading explanations.

## How it works

For a small vector move `Δx`, `f(x+Δx)≈f(x)+∇f(x)·Δx`. Set `Δx=tu`, with `||u||=1`, to obtain `Dᵤf=∇f·u`. Cauchy–Schwarz gives `∇f·u≤||∇f||`, with equality when `u` points along `∇f`; equality in the negative direction gives steepest descent.

## Worked examples and variations

### Example A: coordinate gradient

**Input:** `f(x,y)=x²+3y²` at `(1,2)`. **Mechanism:** `∇f=(2x,6y)=(2,12)`. **Output:** steepest ascent rate is `√148`; steepest descent direction is `−(2,12)/√148`. **Inspect:** the y-coordinate dominates because the local slope is larger. **Decision:** use a unit direction when comparing rates.

### Example B: a chosen direction

**Input:** same function and `u=(3/5,4/5)`. **Mechanism:** `Dᵤf=(2,12)·(3/5,4/5)=10.8`. **Output:** the function rises at 10.8 units per unit distance along `u`. **Inspect:** this is below `||∇f||≈12.17`. **Decision:** distinguish a chosen movement from the steepest one.

### Boundary case: zero gradient

**Input:** `f(x,y)=x²+y²` at `(0,0)`. **Mechanism:** gradient is zero, so every directional derivative is zero. **Output:** first-order analysis sees no preferred direction. **Inspect:** second-order terms still show a minimum. **Decision:** use curvature or nearby values when the gradient vanishes.

### Counterexample: gradient magnitude is not output change

**Input:** `f(x,y)=x+y` at `(0,0)`, move `Δ=(0.1,0.1)`. **Mechanism:** `∇f=(1,1)` has norm `√2`, but actual change is `0.2`; the first-order formula uses the dot product. **Output:** reporting `√2` as the change is wrong. **Inspect:** include direction and step length. **Decision:** report `∇f·Δ` or a directional rate, not the vector alone.

## Two ways to see it

### Builder view

Store gradient, proposed direction, step norm, predicted change, and actual change. Normalise only when a direction—not a parameter update magnitude—is required.

### Systems or numerical view

The steepest direction depends on the chosen norm and coordinates. Euclidean steepest descent may be poorly scaled for a model whose parameters have different units.

## Hands-on

Plot contours of `x²+3y²`, the gradient arrows, and three unit-direction rates. Add a check comparing the maximum sampled rate with `||∇f||`.

**Failure state:** use the raw gradient as a unit direction and report its norm as the change. **Test:** assert unit length for direction vectors and compare changes using a dot product. **Reset:** restore normalisation and a stated step size.

## Checkpoint

- [ ] Compute `∇(x²+3y²)` at `(1,2)`.
- [ ] Derive `Dᵤf=∇f·u` for a unit vector.
- [ ] Explain why `−∇f` is steepest descent under the Euclidean norm.
- [ ] Give the missing information needed to turn a gradient into a change.

## What this does not solve

The gradient is local, coordinate-dependent, and blind to higher-order effects. It does not guarantee a good finite step or a global optimum.

## Continue, go deeper, apply it

- Continue: Level sets, tangent planes, and constrained movement
- Go deeper: Reverse-mode autodiff and backpropagation
- Apply it: Loss, gradients, and gradient descent
