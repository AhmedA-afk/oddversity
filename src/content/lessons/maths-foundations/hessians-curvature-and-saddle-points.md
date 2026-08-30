---
title: "Hessians, curvature, and saddle points"
track: "maths-foundations"
status: live
summary: "The Hessian is the matrix of second partial derivatives, Hᵢⱼ=∂²f/(∂xᵢ∂xⱼ). Near a point, curvature appears as ½ΔᵀHΔ."
duration: "3 min read"
---

## The short answer

The Hessian is the matrix of second partial derivatives, `Hᵢⱼ=∂²f/(∂xᵢ∂xⱼ)`. Near a point, curvature appears as `½ΔᵀHΔ`. At a stationary point, positive-definite curvature indicates a local minimum, negative-definite curvature a local maximum, and mixed signs a saddle. A gradient-only view can miss that mixed behaviour.

## Why this matters

Loss landscapes curve differently along different parameter directions. A Hessian explains sharpness, coupling, and saddle-like regions, and it supplies the local information behind Newton-style updates and curvature diagnostics.

## How it works

For `f(x,y)=x²−y²`,

```text
∇f=(2x,−2y),   H=[[2,0],[0,−2]].
```

At the origin the gradient is zero, but `ΔᵀHΔ=2Δx²−2Δy²` is positive along x and negative along y. Thus every small neighbourhood contains higher and lower values: a saddle.

## Worked examples and variations

### Example A: coupled quadratic

**Input:** `f(x,y)=x²+xy+2y²`. **Mechanism:** `H=[[2,1],[1,4]]`. Its leading principal minors are positive, so it is positive definite. **Output:** the origin is a strict local minimum. **Inspect:** cross terms mean coordinate changes interact. **Decision:** do not infer curvature from diagonal entries alone.

### Example B: saddle behaviour

**Input:** `f(x,y)=x²−y²` at zero. **Mechanism:** x-axis moves increase; y-axis moves decrease. **Output:** stationary saddle. **Inspect:** two one-dimensional slices give opposite classifications. **Decision:** test multiple directions when a gradient is small.

### Boundary case: semidefinite curvature

**Input:** `f(x,y)=x²` at zero. **Mechanism:** `H=diag(2,0)`, with a flat y direction. **Output:** it is a non-strict minimum, but Hessian positivity alone leaves the flat direction unresolved. **Inspect:** higher-order or global terms may decide it. **Decision:** label zero eigenvalues as inconclusive.

### Counterexample: diagonal-only check

**Input:** `H=[[1,2],[2,1]]`. **Mechanism:** both diagonal entries are positive, but eigenvalues are 3 and −1. **Output:** the quadratic is saddle-like. **Inspect:** direction `(1,−1)` has negative curvature. **Decision:** account for off-diagonal coupling or eigen-directions.

## Two ways to see it

### Builder view

Compute directional curvature `uᵀHu` along coordinate axes and selected eigenvectors. Log symmetry error `||H−Hᵀ||` and the smallest/largest eigenvalues.

### Systems or numerical view

Hessian estimates are costly and noisy. “Sharpness” depends on parameterisation, scale, and the neighbourhood used. It is a diagnostic, not a standalone generalisation certificate.

## Hands-on

Plot contours for the coupled quadratic, the saddle, and the semidefinite case. Compute curvature along at least four unit directions.

**Failure state:** classify the matrix with positive diagonals as a minimum and ignore a zero eigenvalue. **Test:** an eigen-direction fixture must fail the diagonal-only classifier. **Reset:** use the full symmetric matrix and report inconclusive semidefinite cases.

## Checkpoint

- [ ] Construct the Hessian of `x²+xy+2y²`.
- [ ] Use two directions to prove `x²−y²` has a saddle at zero.
- [ ] Explain what a zero Hessian eigenvalue means.
- [ ] State why off-diagonal terms matter.

## What this does not solve

The Hessian is local, expensive in large models, and sensitive to parameterisation. It does not prove global optimality, robustness, or generalisation.

## Continue, go deeper, apply it

- Continue: Differentials, trace notation, and matrix-calculus conventions
- Go deeper: Second derivatives, curvature, and local quadratic models
- Apply it: Optimisation, loss, and gradient descent
