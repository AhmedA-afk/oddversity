---
title: "Orthogonal complements and projection matrices"
track: "maths-foundations"
status: live
summary: "An orthogonal projection keeps the component of a vector that lies in a chosen."
duration: "6 min read"
---

## The short answer

An orthogonal projection keeps the component of a vector that lies in a chosen
subspace and discards the perpendicular component. For a full-column-rank
matrix `A`, the projector onto `col(A)` is `P = A(AᵀA)⁻¹Aᵀ`; it satisfies
`P²=P` and `Pᵀ=P`. In AI, this is the geometry behind least squares, residuals,
feature subspaces, and removing a known direction from a representation.

## Why this matters

Many model calculations ask a vector to live in a restricted space: a regression
prediction must be a linear combination of feature columns, a residual should
be unexplained by those columns, and a representation may need its component
along a nuisance direction removed. Projection makes that restriction explicit.

The orthogonal complement of a subspace `U` is

```text
U⊥ = {z : uᵀz = 0 for every u in U}.
```

Every vector `x` decomposes as `x = Px + (I-P)x`, where `Px ∈ U` and
`(I-P)x ∈ U⊥`. The first term is the closest point in `U` to `x` under Euclidean
distance. A result can have the right shape and still be a wrong projection if
the direction is not normalized or the subspace was encoded incorrectly.

## How it works

For one nonzero direction `u`, write the projection as `αu`. The residual must
be perpendicular to `u`:

```text
uᵀ(x − αu) = 0
α = (uᵀx)/(uᵀu)
proj_u(x) = u(uᵀx)/(uᵀu).
```

Rearranging the last expression gives `P = uuᵀ/(uᵀu)`. For several independent
columns in `A`, the candidate point is `Aβ`; making the residual orthogonal to
every column gives `Aᵀ(x−Aβ)=0`, so `β=(AᵀA)⁻¹Aᵀx` and the matrix formula follows.
This derivation assumes the columns are independent; later lessons replace the
normal-equation route when that assumption is numerically fragile.

## Worked examples and variations

The numeric cases below are illustrative, hand-computable fixtures. In each one,
inspect both the output and the property that should hold.

### Example A: project onto one direction

**Input:** `u=(1,2)` and `x=(3,1)`. **Mechanism:** `uᵀx=5` and `uᵀu=5`, so
`Px=(1,2)`. **Output:** residual `r=x−Px=(2,−1)`. **Inspect:**
`uᵀr=2−2=0`, and the output lies on the line through `u`. **Decision:** use
`Px` when only the component aligned with `u` is meaningful; use `r` when the
question is what remains after removing that component.

### Example B: project onto a plane in three dimensions

**Input:**

```text
A = [[1, 0],
     [0, 1],
     [1, 1]],   x = [1, 2, 0].
```

The columns are independent. Solving `AᵀAβ=Aᵀx` gives `β=(0,1)`, so
`Px=(0,1,1)` and `r=(1,1,−1)`. **Inspect:** both `A[:,0]ᵀr` and `A[:,1]ᵀr`
are zero. **Decision:** the prediction constrained to this feature plane is
`Px`; the residual is evidence outside the plane, not an additional fitted
feature.

### Boundary case: a vector already in the subspace

**Input:** `x=Au` for some coefficient vector `u`. **Mechanism:** the closest
point in `col(A)` is already `x`. **Output:** `Px=x` and `r=0`. **Inspect:**
`||r||` is at floating-point zero. **Decision:** do not interpret a zero residual
as proof that the model is generally correct; it may only mean this fixture was
constructed inside the subspace.

### Counterexample: forgetting the denominator

**Input:** `u=(2,0)` and `x=(1,1)`. The tempting matrix `uuᵀ` produces `(4,0)`.
**Mechanism:** the direction was not normalized: `uᵀu=4`. **Output:** `(4,0)`
is on the right line but is not the closest point to `x`. **Inspect:** the
residual `(-3,1)` is not perpendicular to `u` (`uᵀr=-6`). **Decision:** test
both idempotence and residual orthogonality; a plausible-looking line is not
enough.

### AI application: residualising a known nuisance direction

**Input:** an embedding `x` and a direction `u` representing a measured style
or sensor effect. **Mechanism:** compute `x_clean=(I−P)x`. **Output:** a vector
with zero dot product with `u`. **Inspect:** compare the intended task score
before and after removal, and measure whether the nuisance proxy actually falls.
**Decision:** treat this as a representation intervention to evaluate, not an
automatic fairness or privacy guarantee; removing one linear direction may leave
nonlinear or correlated traces.

## A small story

A regression notebook can report a tiny residual and still conceal a mistake:
someone projected onto a direction that was twice as long as expected and forgot
the normalization. The prediction stayed on the right line, so a plot looked
fine. The perpendicularity assertion exposed the error immediately. The useful
habit is to test the geometric invariant, not just the visual plausibility.

## Two ways to see it

### Builder view

Think of `P` as a reusable typed operator: input shape `n`, output shape `n`,
range `U`, and invariant `P(Px)=Px`. The residual operator `I−P` has the same
shape and removes exactly what `P` keeps. This is a compact way to specify a
feature transform before putting it in a pipeline.

### Visual view

Draw `x`, its shadow `Px` on the line or plane, and the right-angle residual.
The shortest segment from `x` to the subspace is perpendicular to it. Applying
the projector twice cannot move the point again, because the first output is
already in the target space.

### Computational view

```python
import numpy as np

u = np.array([1.0, 2.0])
P = np.outer(u, u) / (u @ u)
x = np.array([3.0, 1.0])
projection = P @ x
residual = x - projection

assert np.allclose(P @ P, P)
assert np.allclose(P.T, P)
assert np.allclose(u @ residual, 0.0)
```

For a matrix `A`, prefer a solver or QR/SVD in production when `AᵀA` may be
ill-conditioned; the displayed formula is the derivation and a small-fixture
reference implementation.

## Hands-on

Create a projection report for two fixtures: one direction `u` and a two-column
matrix `A`. Record `P`, `Px`, the residual, `||r||`, `||P²−P||`, and the dot
products between `r` and each basis column.

**Failure fixture:** implement `P_bad = A @ A.T` or omit the inverse factor in
the one-direction case. Feed it the examples above. **Test:** assert symmetry,
idempotence, and residual orthogonality with a tolerance such as `1e-10` for the
small double-precision fixtures. The test must fail for `P_bad`. **Reset:** restore
`P = A @ np.linalg.solve(A.T @ A, A.T)` for full-rank `A` (or the single-vector
formula), rerun the fixtures, and save the passing report.

## Checkpoint

- [ ] Derive `u(uᵀx)/(uᵀu)` from the condition that the residual is perpendicular.
- [ ] Given a projector `P`, explain why `P²=P` and why `I−P` removes the target
  subspace.
- [ ] Compute the projection and residual for `u=(1,2)`, `x=(3,1)` and verify
  the dot product by hand.
- [ ] State the assumption behind `A(AᵀA)⁻¹Aᵀ` and name a decomposition that can
  avoid relying on explicit normal equations.

## What this does not solve

Projection removes Euclidean, linear components under the chosen features and
metric. It does not prove that the chosen subspace represents a causal factor,
remove nonlinear dependence, improve downstream accuracy, or establish fairness.
It also does not make a rank-deficient or badly scaled matrix safe automatically.

## Continue, go deeper, apply it

- Continue: Gram–Schmidt orthogonalisation
- Go deeper: Linear algebra for ML
- Apply it: Least squares and regression
