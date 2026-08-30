---
title: "Projections and residuals"
track: "maths-foundations"
status: live
summary: "The projection of x onto a nonzero direction u."
duration: "5 min read"
---

## The short answer

The projection of `x` onto a nonzero direction `u` is
`p=((x·u)/(u·u))u`. The residual `r=x−p` is the part left over, and it is
orthogonal to `u`. With an orthonormal basis matrix `Q`, projection onto its
span is `QQᵀx`. In AI, this separates explained signal from error and underlies
least squares, dimensionality reduction, and orthogonal feature components.

## Why this matters

A projection is a controlled approximation: it keeps the component a chosen
subspace can represent and exposes the rest as a residual. This gives a
geometric reason for least-squares equations and a diagnostic that can be tested
without trusting a library result. The direction must be normalised by its own
length; forgetting that denominator produces a vector far beyond the intended
line.

## How it works

Seek `p=αu` such that the residual `r=x−αu` is perpendicular to `u`. Set its
dot product to zero:

```text
u·(x−αu)=0
u·x−α(u·u)=0
α=(u·x)/(u·u).
```

Therefore `p=αu`, and
`u·r=u·x−((u·x)/(u·u))(u·u)=0`. For orthonormal columns in `Q`, sum the
individual projections: `p=Σᵢ(qᵢ·x)qᵢ=QQᵀx`.

## Worked examples and variations

### Example A: projection onto a diagonal line

**Input:** `x=(3,2)`, `u=(1,1)`. **Mechanism:** `x·u=5`, `u·u=2`, so
`p=(5/2)(1,1)=(2.5,2.5)`. **Output:** residual
`r=(0.5,−0.5)`. **Inspect:** `u·r=0`, and the projected point lies on
`y=x`. **Decision:** use `p` as the closest point on that line under Euclidean
distance.

### Example B: projection as a one-feature approximation

**Input:** an embedding `x` and one learned unit direction `q`. **Mechanism:**
retain scalar coordinate `c=q·x`, reconstruct `p=(q·x)q`, and store residual
`r=x−p`. **Output:** one-coordinate summary plus an explicit error vector.
**Inspect:** `||r||²=||x||²−(q·x)²` when `q` is unit. **Decision:** accept the
compression only after checking residual size on representative data.

### Example C: projection onto a two-direction subspace

**Input:** orthonormal `q₁,q₂` and `x`. **Mechanism:**
`p=(q₁·x)q₁+(q₂·x)q₂`. **Output:** the closest point in their plane, with
`r=x−p`. **Inspect:** both `q₁·r=0` and `q₂·r=0`; `r` is orthogonal to the
whole subspace. **Decision:** use the residual to detect information the chosen
representation cannot express.

### Boundary case: a point already on the line

**Input:** `x=(4,4)`, `u=(1,1)`. **Mechanism:** the projection coefficient is
`4`, so `p=x` and `r=(0,0)`. **Output:** zero residual. For `u=(0,0)`, the
denominator is zero and no direction exists. **Inspect:** zero residual is valid
only for a point in the subspace; a zero direction is invalid input. **Decision:**
test both cases separately.

### Counterexample: omitting the denominator for a non-unit direction

**Input:** `x=(3,2)`, `u=(2,2)`. **Mechanism:** the wrong shortcut `p=(x·u)u`
gives `(10)(2,2)=(20,20)`, not the closest point. The correct denominator is
`u·u=8`, giving `p=(2.5,2.5)`. **Output:** the wrong residual is not
orthogonal. **Inspect:** `u·(x−p)≠0` exposes the bug. **Decision:** only use
`(x·u)u` when `u` is already a unit vector.

## Two ways to see it

### Symbolic view

The projection coefficient is the least-squares minimiser of
`||x−αu||²`. Expanding the square and differentiating in `α` leads to the same
normal equation `u·(x−αu)=0`; the geometric and optimisation views agree.

### Geometric view

Drop a perpendicular from `x` to the line or plane. The foot is `p`; the
perpendicular arrow is `r`. The right angle is the invariant to inspect, not
just how close a plot looks.

### Computational view

```python
import numpy as np

x = np.array([3., 2.])
u = np.array([1., 1.])
p = (x @ u) / (u @ u) * u
r = x - p
assert np.allclose(p, [2.5, 2.5])
assert np.isclose(r @ u, 0.)
```

For a subspace, use `Q @ (Q.T @ x)` only after checking that `Q.T@Q` is close
to the identity on its columns.

## Hands-on

Build a projection notebook with one arbitrary point, two directions (one unit,
one non-unit), and an orthonormal two-column subspace. Plot each input,
projection, and residual with a legend.

**Failure fixture:** include `u=(0,0)` and intentionally omit `u@u` for the
non-unit direction. **Test:** reject the zero direction, assert finite output,
and assert `abs(u@r)≤tol` for every accepted projection. **Reset:** restore the
valid directions, recompute, and compare the residual norm against the plotted
perpendicular.

Feedback prompts:

- Retrieve: what equation forces a projection residual to be perpendicular?
- Calculate: project `(5,1)` onto `(1,0)`.
- Compute: replace a unit direction with twice its length and verify the
  correctly normalised projection does not change.
- Diagnose: use the orthogonality test to find a projection implementation bug.

Add the projection and residual evidence to A1, the embedding geometry lab.

## Checkpoint

- [ ] Project `(3,2)` onto `(1,1)` and calculate the residual.
- [ ] Derive the projection coefficient by setting `u·(x−αu)=0`.
- [ ] State the extra condition needed to use `QQᵀx` for a subspace projection.
- [ ] Explain why `u=(0,0)` is not a direction and how the test catches it.

## What this does not solve

A projection is optimal for a selected subspace and norm; it does not prove the
subspace captures task-relevant information. Residuals may contain signal,
protected-group structure, or outliers. An orthogonal residual is a geometric
fact, not evidence that the discarded information is harmless.

## Continue, go deeper, apply it

- Continue: Angles, margins, and separating hyperplanes
- Go deeper: Linear algebra for ML
- Apply it: A1 embedding geometry lab
