---
title: "QR factorisation and least-squares solving"
track: "maths-foundations"
status: live
summary: "QR factorisation writes a full-column-rank matrix as A=QR, where Q has."
duration: "5 min read"
---

## The short answer

QR factorisation writes a full-column-rank matrix as `A=QR`, where `Q` has
orthonormal columns and `R` is upper triangular. To solve an overdetermined
least-squares problem, compute `Qᵀb` and solve the triangular system
`R x̂ = Qᵀb`. QR reaches the same projection as the normal equations while
usually avoiding the extra sensitivity caused by forming `AᵀA`.

## Why this matters

Fitting a line to many observations asks for the point `A x` in the column space
of `A` closest to `b`. Normal equations express that geometry as
`AᵀA x̂=Aᵀb`, but forming `AᵀA` squares the 2-norm condition number:
`κ(AᵀA)=κ(A)²` for a full-rank matrix. QR keeps the columns orthogonal before
solving and therefore gives a better default for many small and medium problems.

QR is not a spell that fixes rank deficiency. If a column is dependent, a
diagonal entry of `R` is zero or tiny and the solver must report the rank issue,
use pivoting, or move to an SVD-based decision.

## How it works

From an orthonormalisation, `A=QR`. For any candidate `x`,

```text
||Ax−b||² = ||Qᵀ(Ax−b)||² + ||(I−QQᵀ)b||²
           = ||Rx−Qᵀb||² + constant.
```

The second term cannot be changed by `x`. The first is minimised exactly when
`Rx=Qᵀb`; because `R` is triangular, back substitution solves it without an
explicit inverse. Multiplying the equation by `Q` gives `A x̂=QQᵀb`, the
orthogonal projection of `b` onto `col(A)`.

## Worked examples and variations

The cases are illustrative fixtures. Show intermediate `Q`, `R`, and residuals
when inspecting a result.

### Example A: fit a line with QR

**Input:** `x=[0,1,2]`, `y=[1,2,2]`, with design matrix

```text
A = [[1,0], [1,1], [1,2]],  b=[1,2,2].
```

The orthonormal columns are `q₁=(1,1,1)/√3` and `q₂=(-1,0,1)/√2`, so
`R=[[√3,√3],[0,√2]]`. **Mechanism:**
`Qᵀb=[5/√3,1/√2]`; back substitution gives slope `0.5` and intercept `7/6`.
**Output:** `ŷ=[7/6,13/6,19/6]`. **Inspect:** the residual is orthogonal to
both columns of `A`. **Decision:** use the fitted line, while reporting the
residual rather than implying every observation lies on it.

### Example B: a weighted least-squares variation

**Input:** the same observations, but the middle observation has weight four.
**Mechanism:** multiply each row of `A` and `b` by `√w`, then run QR on the
weighted system. **Output:** a fit that pays more attention to `(x,y)=(1,2)`.
**Inspect:** check orthogonality in the weighted inner product, not the unweighted
one. **Decision:** use row scaling only when the weights represent a defensible
noise or importance model; it is not a free way to improve a metric.

### Boundary case: a square orthogonal matrix

**Input:** `A=I` and any `b`. **Mechanism:** `Q=I`, `R=I`, so `x̂=b` and the
residual is zero. **Output:** an exact solve. **Inspect:** `QᵀQ=I` and
`||Ax̂−b||=0`. **Decision:** least squares includes exact solving as a special
case; do not conclude that all real data will be exactly representable.

### Counterexample: a dependent feature

**Input:**

```text
A = [[1, 2], [2, 4], [3, 6]].
```

The second column is twice the first. **Mechanism:** the second diagonal element
of `R` is zero in exact arithmetic. **Output:** infinitely many coefficient
pairs produce the same fitted vector. **Inspect:** a tiny solver output is not
identifiability; inspect rank and coefficient sensitivity. **Decision:** drop or
reparameterise the duplicate, or use a rank-aware SVD/pseudoinverse with the
choice recorded.

### AI application: fitting a calibration line

**Input:** model scores and observed frequencies. **Mechanism:** fit a simple
line or basis expansion with QR. **Output:** calibration parameters. **Inspect:**
hold out data, compare residuals across score ranges, and test whether weights
changed the estimand. **Decision:** a numerically stable fit still needs a valid
calibration dataset and an evaluation plan.

## A small story

A normal-equation implementation can pass a tidy regression fixture for months.
When two production features become nearly duplicates, coefficients begin to
change wildly between retrains even though predictions barely move. Replacing
the solve with QR makes the sensitivity easier to see, but the real fix is to
ask whether both features are identifiable and needed.

## Two ways to see it

### Builder view

Treat `Q` as a coordinate system for the feature space and `R` as the triangular
conversion from those coordinates back to the original columns. The least-
squares artifact is therefore `Q`, `R`, `Qᵀb`, `x̂`, and the residual—not just a
coefficient vector.

### Visual view

`b` drops a perpendicular shadow onto the tilted column space. QR rotates the
space into perpendicular axes, solves the easy triangular coordinates there,
and rotates the answer back. The part of `b` outside the space is fixed no
matter which coefficients you choose.

### Computational view

```python
import numpy as np

A = np.array([[1., 0.], [1., 1.], [1., 2.]])
b = np.array([1., 2., 2.])
Q, R = np.linalg.qr(A, mode="reduced")
xhat = np.linalg.solve(R, Q.T @ b)
residual = b - A @ xhat

assert np.allclose(Q.T @ Q, np.eye(2))
assert np.allclose(A, Q @ R)
assert np.allclose(A.T @ residual, 0.0)
```

`np.linalg.lstsq` is a useful reference check, but keeping the QR intermediates
visible makes the mechanism and the rank diagnostic inspectable.

## Hands-on

Create a least-squares report for the line fixture and a weighted variation.
Include `rank`, `cond(A)`, `Q`, `R`, coefficients, fitted values, residual norm,
and the orthogonality test.

**Failure fixture:** duplicate one feature column, then compare QR, normal
equations, and `np.linalg.lstsq`. **Tests:** assert reconstruction and residual
orthogonality for the full-rank case; assert that the duplicate case is flagged
by a rank/tolerance check rather than silently presented as two identifiable
coefficients. **Reset:** restore the independent design matrix, rerun with the
documented tolerance, and save both passing and failing outputs.

## Checkpoint

- [ ] Derive why `Rx=Qᵀb` minimises `||Ax−b||` after `A=QR`.
- [ ] Solve the line fixture and explain the meaning of its residual vector.
- [ ] State why forming `AᵀA` can reduce numerical reliability.
- [ ] Distinguish a stable algorithm from an identifiable model with independent
  columns.

## What this does not solve

QR addresses the numerical route to a least-squares solution; it does not choose
features, weights, a causal interpretation, or a useful loss. It can still be
affected by severe scaling, rank deficiency, outliers, a wrong target, or a
misleading evaluation split.

## Continue, go deeper, apply it

- Continue: Eigenvalues and eigenvectors
- Go deeper: Linear regression
- Apply it: Problem framing and baselines
