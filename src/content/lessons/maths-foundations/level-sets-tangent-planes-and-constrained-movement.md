---
title: "Level sets, tangent planes, and constrained movement"
track: "maths-foundations"
status: live
summary: "A level set is all inputs with the same scalar value, such as f(x,y)=c."
duration: "3 min read"
---

## The short answer

A level set is all inputs with the same scalar value, such as `f(x,y)=c`. At a regular point, the gradient is perpendicular to that set; a tangent direction `v` therefore satisfies `∇f·v=0`. The tangent plane is the first-order constant-value approximation. Classifier boundaries and feasible surfaces use the same geometry.

## Why this matters

Moving along a level set preserves a score to first order; moving across it changes the score most quickly in the normal direction. This gives a visual and algebraic way to debug decision boundaries, constrained updates, and explanations that claim a change “keeps the output fixed.”

## How it works

For `F(x,y)=c`, a small tangent move `Δ` should satisfy `F(x+Δ,y+Δy)−F(x,y)≈∇F·Δ=0`. Thus the gradient is normal to the tangent. In three dimensions, the tangent plane at `a` is

```text
F(a)+∇F(a)·(x−a)=F(a).
```

For a level set `F=0`, this is the linearised boundary used by local classifiers.

## Worked examples and variations

### Example A: circle level set

**Input:** `F(x,y)=x²+y²`, level `c=1`, point `(1,0)`. **Mechanism:** gradient `(2,0)` is horizontal. **Output:** tangent direction is vertical, for example `(0,1)`, and the tangent line is `x=1`. **Inspect:** the circle's first-order movement at that point is up/down. **Decision:** use the gradient as a normal, not as a tangent arrow.

### Example B: classifier boundary

**Input:** score `s(x,y)=2x−y`, boundary `s=0` at `(1,2)`. **Mechanism:** gradient `(2,−1)` is normal; boundary line is `2x−y=0`. **Output:** a tangent direction `(1,2)` has dot product zero. **Inspect:** moving along it preserves score exactly because the model is affine. **Decision:** separate score contours from threshold policy.

### Boundary case: zero gradient on a level set

**Input:** `F(x,y)=x²+y²`, level `c=0`, point `(0,0)`. **Mechanism:** gradient is zero, so no unique tangent line is supplied by the regular formula. **Output:** the level set is only one point. **Inspect:** the regular-point assumption fails. **Decision:** do not construct a tangent plane from a zero normal.

### Counterexample: tangent means exactly constant

**Input:** circle at `(1,0)`, move to `(1,0.1)`. **Mechanism:** tangent prediction is zero first-order change, but actual `F` changes from 1 to 1.01. **Output:** the move is only locally constant, not exactly constant. **Inspect:** quadratic residual appears. **Decision:** use a projection or constraint solver for exact feasibility.

## Two ways to see it

### Builder view

For a proposed movement, log the score change, `∇F·Δ`, feasibility residual, and step norm. The residual tells you whether a local tangent approximation was good enough.

### Systems or numerical view

A model's boundary can be locally flat but globally curved or disconnected. A tangent explanation can be accurate for tiny perturbations and misleading for a large data shift.

## Hands-on

Plot the unit circle, its gradient normals, and tangent segments. Add a classifier boundary and compute residuals after tangent moves.

**Failure state:** construct a tangent using the gradient itself, and include the zero-gradient point. **Test:** assert `|∇F·v|<ε` for regular tangents and reject zero normals. **Reset:** use a perpendicular direction and a regular point.

## Checkpoint

- [ ] Find a tangent direction to `x²+y²=1` at `(1,0)`.
- [ ] Show why a classifier boundary is a level set of its score.
- [ ] Explain the regular-point condition `∇F≠0`.
- [ ] Distinguish a first-order tangent move from exact constraint satisfaction.

## What this does not solve

Level-set geometry does not prove classifier accuracy, fairness, or global feasibility. It is a local approximation and depends on a differentiable, correctly specified score.

## Continue, go deeper, apply it

- Continue: Jacobians for vector-valued functions
- Go deeper: Constrained optimisation, Lagrange multipliers, and KKT intuition
- Apply it: Classifiers, thresholds, and calibration
