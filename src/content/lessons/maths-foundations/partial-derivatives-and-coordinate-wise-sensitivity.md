---
title: "Partial derivatives and coordinate-wise sensitivity"
track: "maths-foundations"
status: live
summary: "A partial derivative changes one coordinate while holding the others fixed: ∂f/∂xⱼ."
duration: "3 min read"
---

## The short answer

A partial derivative changes one coordinate while holding the others fixed: `∂f/∂xⱼ`. It is a local, coordinate-wise sensitivity, not the output change for an arbitrary move involving every feature. In AI, partials explain how a score or loss responds to one feature or parameter under a stated representation and fixed context.

## Why this matters

A feature-importance statement often quietly means “change this feature while everything else stays fixed.” That may be useful for debugging a model but impossible or misleading for correlated real-world features. Partial derivatives make the intervention assumption visible.

## How it works

For `f(x,y)=3x+2y²`, freeze `y` while differentiating by `x`, giving `∂f/∂x=3`; freeze `x` while differentiating by `y`, giving `∂f/∂y=4y`. Formally, use the one-variable limit in one coordinate:

```text
∂f/∂x(a,b) = lim[h→0] [f(a+h,b)-f(a,b)]/h.
```

The total change needs both partials and a direction; partials are its coordinate pieces.

## Worked examples and variations

### Example A: two-feature score

**Input:** `s(x,y)=2x−y²`, at `(3,2)`. **Mechanism:** `∂s/∂x=2`, `∂s/∂y=−2y=−4`. **Output:** increasing `x` locally raises the score by 2 per unit; increasing `y` lowers it by 4 per unit. **Inspect:** each derivative holds the other feature fixed. **Decision:** report the context point with any sensitivity.

### Example B: interaction term

**Input:** `f(x,y)=xy`, at `(2,5)`. **Mechanism:** `∂f/∂x=y=5`, `∂f/∂y=x=2`. **Output:** the same coordinate has different sensitivity under different context values. **Inspect:** the “importance of x” is not one global number. **Decision:** sample the operating region before ranking features.

### Boundary case: a feature constraint

**Input:** age `x` and dependent count `y`, with `y≤x` in a toy domain. **Mechanism:** a partial derivative may ask for a change in `y` that violates the domain while `x` is fixed. **Output:** the algebraic partial exists, but the proposed intervention is infeasible. **Inspect:** check the allowed set. **Decision:** use a directional or constrained analysis when coordinates cannot vary independently.

### Counterexample: partials are not total change

**Input:** `f(x,y)=x+y` at `(1,1)`, move to `(2,2)`. **Mechanism:** each partial is 1, but both coordinates changed, so `Δf=2`, not 1. **Output:** using only `∂f/∂x` undercounts the move. **Inspect:** sum the coordinate contributions for this linear example. **Decision:** use a gradient or differential for joint movement.

## Two ways to see it

### Builder view

Write the coordinate being perturbed, the coordinates held fixed, the units, and whether the point remains feasible. A finite-difference fixture should change one array entry at a time.

### Systems or numerical view

Partials depend on scale and parameterisation. A large partial may be a unit artifact, while a small one may reflect saturation or a restricted data manifold. Do not turn coordinate-wise sensitivity into causal importance without assumptions.

## Hands-on

Implement coordinate-wise central differences for a two-feature score and compare them with hand derivatives at three points.

**Failure state:** perturb both coordinates while labeling the result as `∂f/∂x`, and include a move outside a declared domain. **Test:** the harness must reject multi-coordinate perturbations and mark infeasible points. **Reset:** perturb one coordinate at a time inside the fixture domain.

## Checkpoint

- [ ] Compute both partials of `2x−y²` at `(3,2)`.
- [ ] State exactly what is held fixed in `∂f/∂x`.
- [ ] Explain why an interaction makes sensitivity context-dependent.
- [ ] Give one case where a coordinate-wise perturbation is infeasible.

## What this does not solve

Partials do not measure joint movement, causal effect, or global feature importance. Correlation, constraints, scale, and non-smoothness need additional analysis.

## Continue, go deeper, apply it

- Continue: Gradients and directional derivatives
- Go deeper: Derivatives of affine layers and elementwise activations
- Apply it: Features, leakage, and missingness
