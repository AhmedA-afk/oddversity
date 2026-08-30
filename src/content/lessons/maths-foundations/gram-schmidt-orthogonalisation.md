---
title: "Gram–Schmidt orthogonalisation"
track: "maths-foundations"
status: live
summary: "Gram–Schmidt turns independent vectors into an orthonormal basis for the same."
duration: "6 min read"
---

## The short answer

Gram–Schmidt turns independent vectors into an orthonormal basis for the same
span. At step `k`, subtract the projections onto earlier unit vectors and then
normalise what remains. The classical formula is easy to derive but can lose
orthogonality for nearly dependent floating-point data; modified Gram–Schmidt
updates the residual one basis vector at a time and is usually the safer teaching
and implementation choice for a QR factorisation.

## Why this matters

Orthogonal coordinates separate contributions: dot products become coefficients,
projections become simple, and least-squares systems become triangular. This is
useful for feature bases, numerical solvers, Krylov methods, and inspecting
whether a data matrix contains genuinely new directions.

The word “independent” is essential. If a new vector is already in the old span,
its residual is zero, so there is no new basis direction to normalise. In exact
arithmetic this is clean; in floating point, “zero” means smaller than a stated
tolerance relative to the scale of the data.

## How it works

Given independent columns `v₁,…,vₖ`, set

```text
u₁ = v₁                 q₁ = u₁ / ||u₁||
uₖ = vₖ − Σⱼ<k (qⱼᵀvₖ)qⱼ   qₖ = uₖ / ||uₖ||.
```

The subtraction removes the component of `vₖ` in the old span. For every earlier
`qᵢ`, the new residual satisfies `qᵢᵀuₖ = 0`, because
`qᵢᵀvₖ − (qᵢᵀvₖ)(qᵢᵀqᵢ)=0`. Normalisation makes `qₖᵀqₖ=1`. Stacking the `q`s as
columns gives `Q` with `QᵀQ=I`.

In classical Gram–Schmidt, all coefficients are computed from the original
`vₖ`. In modified Gram–Schmidt, maintain a working residual `w`, subtract one
projection, and immediately update `w` before subtracting the next. Both agree
in exact arithmetic; the latter limits some cancellation effects.

## Worked examples and variations

All numeric cases are illustrative fixtures. Inspect `QᵀQ`, not only the printed
vectors.

### Example A: two vectors in three dimensions

**Input:** `v₁=(1,1,0)`, `v₂=(1,0,1)`. **Mechanism:**
`q₁=(1,1,0)/√2`. The second residual is
`u₂=v₂−(q₁ᵀv₂)q₁=(1/2,−1/2,1)`, with norm `√6/2`. **Output:**
`q₂=(1,−1,2)/√6`. **Inspect:** `q₁ᵀq₂=0` and both norms are one. **Decision:**
use `q₁,q₂` as stable coordinates for the original two-dimensional span.

### Example B: adding a genuinely new direction

**Input:** add `v₃=(1,1,2)` to Example A. **Mechanism:** remove its components
along `q₁` and `q₂`; the residual is `(-2/3,2/3,2/3)`. **Output:**
`q₃=(-1,1,1)/√3`. **Inspect:** all three pairwise dot products are zero.
**Decision:** the third feature contributes a new dimension rather than a
relabelled copy of the first two.

### Boundary case: a dependent vector

**Input:** `v₃=v₁+v₂`. **Mechanism:** every component is removed by the first two
projections. **Output:** `||u₃||=0` in exact arithmetic. **Inspect:** do not
divide by the norm; report “dependent” or discard the column. **Decision:** a
zero residual is a rank fact, not a failed normalisation to be patched with an
arbitrary epsilon.

### Counterexample: normalising but not removing projections

**Input:** vectors `v₁=(1,0)`, `v₂=(1,1)`. If code merely normalises each vector,
it returns `(1,0)` and `(1,1)/√2`. **Mechanism:** the second vector still contains
the first direction. **Output:** dot product `1/√2`, not zero. **Inspect:** unit
length alone is insufficient. **Decision:** assert both `||qᵢ||=1` and
`|qᵢᵀqⱼ|` below tolerance.

### Numerical variation: nearly dependent columns

**Input:** columns with differences near machine precision. **Mechanism:** large
subtractions can erase significant digits. **Output:** classical and modified
implementations may produce visibly different `||QᵀQ−I||`. **Inspect:** compare
orthogonality, reconstruction, and the condition of the input; do not choose the
implementation from one rounded printout. **Decision:** use modified
Gram–Schmidt, Householder QR, or SVD when the basis feeds a sensitive solver.

## A small story

An engineer once interpreted a nearly zero third residual as a missing feature
and added noise before normalising it. That made the downstream basis look full
rank while its coordinates were mostly numerical noise. Recording the residual
norm and a rank tolerance would have made the “feature” visibly dependent.

## Two ways to see it

### Builder view

The algorithm is a loop over columns with a clear contract: input `V`, output
`Q`, same span, unit columns, pairwise orthogonality, and an explicit dependent
column state. The working residual is an inspectable intermediate, so a test can
show which projection removed which component.

### Visual view

In two dimensions, choose the first arrow, then rotate 90° and keep the part of
the second arrow in that perpendicular direction. In three dimensions, each new
arrow is the part outside the plane already built. The span stays the same; only
the coordinate axes become perpendicular.

### Computational view

```python
import numpy as np

def modified_gram_schmidt(V, tol=1e-12):
    V = np.asarray(V, dtype=float)
    m, n = V.shape
    Q = np.zeros((m, n))
    R = np.zeros((n, n))
    W = V.copy()
    for k in range(n):
        R[k, k] = np.linalg.norm(W[:, k])
        if R[k, k] <= tol:
            raise ValueError(f"column {k} is dependent at tolerance {tol}")
        Q[:, k] = W[:, k] / R[k, k]
        for j in range(k + 1, n):
            R[k, j] = Q[:, k] @ W[:, j]
            W[:, j] -= R[k, j] * Q[:, k]
    return Q, R

Q, R = modified_gram_schmidt(np.array([[1., 1.], [1., 0.], [0., 1.]]))
assert np.allclose(Q.T @ Q, np.eye(2))
```

The `R` output anticipates QR: each original column is reconstructed from the
orthonormal columns with upper-triangular coefficients.

## Hands-on

Build a basis notebook that accepts a small matrix `V`, logs each working
residual norm, and returns `Q`, `R`, and the reconstruction error `||V−QR||`.

**Failure fixture:** add a duplicate column and separately implement a
“normalise-only” version. **Tests:** the duplicate must raise a named dependent
column error; the passing fixture must satisfy `Q.T @ Q ≈ I` and `V ≈ Q @ R`.
Also compare classical and modified algorithms on a deliberately ill-conditioned
matrix, plot heatmaps of `QᵀQ−I`, and record both orthogonality errors. **Reset:**
restore the independent fixture, reset the tolerance to its documented value, and
rerun the assertions.

## Checkpoint

- [ ] Derive why subtracting `(qᵀv)q` removes the component along a unit vector.
- [ ] Produce `q₁` and `q₂` for `(1,1,0)` and `(1,0,1)` and verify their dot
  product.
- [ ] Explain the difference between a dependent residual and a floating-point
  residual that is merely small.
- [ ] Name one reason modified Gram–Schmidt can be preferable to classical
  Gram–Schmidt and one method that is often more stable still.

## What this does not solve

An orthonormal basis does not make the original measurements meaningful, remove
noise, or guarantee that a nearly dependent feature is safe to drop. Stability
depends on scale, conditioning, precision, and the implementation. Orthogonality
also depends on the chosen inner product; changing the metric changes the answer.

## Continue, go deeper, apply it

- Continue: QR factorisation and least-squares solving
- Go deeper: Linear algebra for ML
- Apply it: Linear regression
