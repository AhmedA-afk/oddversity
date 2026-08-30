---
title: "Symmetric matrices, quadratic forms, and positive definiteness"
track: "maths-foundations"
status: live
summary: "A quadratic form is q(x)=xᵀAx; it maps a vector to a scalar and describes."
duration: "5 min read"
---

## The short answer

A quadratic form is `q(x)=xᵀAx`; it maps a vector to a scalar and describes
curvature, energy, squared length, or variance depending on `A`. For a real
symmetric matrix, an orthogonal eigendecomposition gives
`q(x)=Σᵢ λᵢ zᵢ²`. Therefore `A` is positive definite when every eigenvalue is
positive, positive semidefinite when none is negative, and indefinite when signs
mix. These classifications matter for convex losses, Hessians, covariance
matrices, and Gram matrices.

## Why this matters

Optimisers need to know whether a local quadratic model curves upward in every
direction. Covariance matrices must never assign a negative variance. A kernel
Gram matrix must produce a nonnegative squared norm. One negative eigenvalue can
change the decision from “safe curvature” to “saddle/invalid covariance,” even
when all diagonal entries look positive.

Symmetry is not decoration: for real matrices it lets eigenvectors be chosen
orthonormal and makes the eigenvalue test reliable. For any square `A`, the
quadratic form only sees its symmetric part `(A+Aᵀ)/2`, but a nonsymmetric matrix
may still behave differently as a linear transformation.

## How it works

For symmetric `A`, write `A=QΛQᵀ` with orthogonal `Q`. Set `z=Qᵀx`; then

```text
xᵀAx = xᵀQΛQᵀx = zᵀΛz = Σᵢ λᵢ zᵢ².
```

Because each `zᵢ²≥0`, the signs of the eigenvalues determine whether the form
can be negative. Positive definite means `q(x)>0` for every nonzero `x`; positive
semidefinite permits zero along a nonzero null direction. For a quadratic loss
`(1/2)xᵀHx`, positive definite `H` gives a unique upward-curving minimum; an
indefinite `H` has a direction of negative curvature.

## Worked examples and variations

The numeric cases are illustrative. Inspect eigenvalues as well as a few direct
values of `q(x)`.

### Example A: an axis-aligned ellipse

**Input:** `A=diag(2,1)`, `q(x)=2x₁²+x₂²`. **Mechanism:** the eigenvalues are
`2` and `1`, both positive. **Output:** every nonzero vector has positive
quadratic value; the level set `q(x)=1` is an ellipse. **Inspect:** along the
first axis, a unit move costs twice as much as along the second. **Decision:**
use the eigenvalues to choose a conservative step size or interpret anisotropic
feature penalties.

### Example B: a cross-term that is still positive definite

**Input:** `A=[[2,1],[1,2]]`, so `q(x)=2x₁²+2x₁x₂+2x₂²`.
**Mechanism:** eigenvalues are `3` and `1`; rotation removes the cross-term.
**Output:** the form is positive definite. **Inspect:** for `x=(1,−1)`,
`q(x)=2`; for `x=(1,1)`, `q(x)=6`, matching the two modal curvatures.
**Decision:** do not call a cross-term a bug merely because the matrix is not
diagonal in the original coordinates.

### Boundary case: positive semidefinite curvature

**Input:** `A=diag(1,0)`. **Mechanism:** `q(x)=x₁²`; the second direction is a
null direction. **Output:** nonnegative values, but `q(0,1)=0` for a nonzero
vector. **Inspect:** `min(eigenvalues)=0` and `A` is singular. **Decision:**
distinguish a flat direction from positive curvature; an optimiser may need a
constraint, regulariser, or identifiability analysis.

### Counterexample: positive diagonal entries are not enough

**Input:** `A=[[1,2],[2,1]]`. **Mechanism:** eigenvalues are `3` and `−1`.
**Output:** `q(1,−1)=−2`, so the matrix is indefinite. **Inspect:** both
diagonal entries are positive, but the off-diagonal coupling creates negative
curvature. **Decision:** test the spectrum or a valid Cholesky factor, not just
the diagonal.

### AI application: covariance and Hessian checks

**Input:** a sample covariance or an estimated Hessian. **Mechanism:** compute
the symmetric spectrum. **Output:** covariance should be PSD; a Hessian can be
PD, PSD, or indefinite depending on the point. **Inspect:** label small negative
eigenvalues as possible floating-point error only after checking symmetry and
scale. **Decision:** use `eigh` and a tolerance; do not “clip” meaningful
negative curvature without recording the intervention.

## A small story

A matrix with positive diagonals was approved as a covariance estimate until a
downstream sampler failed. The off-diagonal estimates were too large, producing
a negative eigenvalue. The diagonal had passed a superficial review; the
quadratic-form test caught the impossible variance direction.

## Two ways to see it

### Builder view

Represent a quadratic objective by `(A, symmetry_check, eigenvalue_summary,
condition, tolerance)`. The sign pattern is an acceptance criterion, not a
stylistic label. For covariance-like objects, also test the diagonal as variance
and symmetry against the data-generation calculation.

### Visual view

Positive definite level sets are closed ellipses/ellipsoids around a minimum.
Positive semidefinite forms have a flat axis. An indefinite form has hyperbolic
level sets and a saddle: moving one way raises the value while another lowers it.

### Computational view

```python
import numpy as np

A = np.array([[2., 1.], [1., 2.]])
eigenvalues = np.linalg.eigvalsh(A)
assert np.allclose(A, A.T)
assert eigenvalues.min() > 0

def classify_symmetric(A, tol=1e-10):
    values = np.linalg.eigvalsh((A + A.T) / 2)
    if values.min() > tol:
        return "positive definite"
    if values.min() >= -tol:
        return "positive semidefinite"
    return "indefinite"
```

The symmetrisation in this helper should be deliberate and logged; it should
not hide a transpose bug in the code that created `A`.

## Hands-on

Create a quadratic-form notebook for the four matrices above. Plot a contour
grid, report eigenvalues, and evaluate `q(x)` on each eigenvector direction.

**Failure fixture:** classify `[[1,2],[2,1]]` as valid because its diagonal is
positive. **Tests:** assert symmetry, minimum eigenvalue, and a direct negative
quadratic value for the counterexample. A Cholesky attempt should also fail for
the indefinite case. **Reset:** restore the positive-definite matrix, rerun the
contour and spectrum checks, and retain the failed fixture as a regression test.

## Checkpoint

- [ ] Derive `xᵀAx=Σ λᵢzᵢ²` for a symmetric eigendecomposition.
- [ ] Classify `diag(2,1)`, `diag(1,0)`, and `[[1,2],[2,1]]` from their
  eigenvalues.
- [ ] Explain the difference between a flat direction and a negative-curvature
  direction.
- [ ] State why a covariance matrix cannot have a materially negative eigenvalue.

## What this does not solve

Definiteness is a structural property, not proof that an objective matches the
business goal or that a covariance estimate is statistically trustworthy. A
Hessian test is local, and an eigenvalue near zero is sensitive to scale and
noise. Symmetrising a bad matrix can conceal an upstream implementation error.

## Continue, go deeper, apply it

- Continue: Singular value decomposition
- Go deeper: Loss, gradients, and optimisation
- Apply it: PCA and dimensionality reduction
