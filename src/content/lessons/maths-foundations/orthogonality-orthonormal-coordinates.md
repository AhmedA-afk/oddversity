---
title: "Orthogonality and orthonormal coordinates"
track: "maths-foundations"
status: live
summary: "Two vectors are orthogonal when their dot product is zero."
duration: "5 min read"
---

## The short answer

Two vectors are orthogonal when their dot product is zero. An orthonormal set
has mutually orthogonal unit vectors. If an orthonormal basis spans a space,
the coordinate of `x` along basis vector `qᵢ` is simply `qᵢ·x`, and
`x=Σᵢ(qᵢ·x)qᵢ`. This makes projections, energy checks, PCA directions, and
feature transformations easier to derive and test.

## Why this matters

Coordinates in the standard x/y axes are not the only coordinates available. A
rotated orthonormal basis can separate a signal into meaningful directions, and
orthogonal residuals make approximation error inspectable. If the basis vectors
are not unit length or not mutually orthogonal, the convenient dot-product
coefficient formula no longer works without solving a system.

## How it works

Vectors `qᵢ` are orthonormal when

```text
qᵢ·qⱼ = 1  if i=j,
          0  if i≠j.
```

For a complete orthonormal basis, expand `x` as `x=Σᵢcᵢqᵢ`. Dot both sides
with `qⱼ`:

```text
qⱼ·x = Σᵢ cᵢ(qⱼ·qᵢ) = cⱼ.
```

The cross terms disappear and the unit diagonal leaves the desired coefficient.
For a partial orthonormal set, the same formula gives the coefficient of the
projection onto its span, not necessarily all of `x`.

## Worked examples and variations

### Example A: standard basis

**Input:** `e₁=(1,0)`, `e₂=(0,1)`, and `x=(3,−2)`. **Mechanism:**
`e₁·e₂=0`, both norms are one, and coefficients are `e₁·x=3`, `e₂·x=−2`.
**Output:** `x=3e₁−2e₂`. **Inspect:** reconstruction is exact and the squared
length check is `||x||²=3²+(−2)²=13`. **Decision:** use this coordinate
extraction only because the basis is orthonormal.

### Example B: a rotated basis

**Input:** `q₁=(3/5,4/5)`, `q₂=(−4/5,3/5)`, `x=(2,1)`.
**Mechanism:** both vectors have norm one and dot product zero;
`c₁=q₁·x=2`, `c₂=q₂·x=−1`. **Output:** `x=2q₁−q₂=(2,1)`.
**Inspect:** the coordinates changed from `(2,1)` in the standard basis to
`(2,−1)` in the rotated basis, while the point did not. **Decision:** a basis
change can simplify a representation without changing the underlying vector.

### Example C: energy preservation

**Input:** the rotated basis above and `x=(2,1)`. **Mechanism:**
`||x||²=5` and `c₁²+c₂²=2²+(−1)²=5`. **Output:** equal squared lengths.
**Inspect:** this is the finite-dimensional Pythagorean/Parseval check for an
orthonormal expansion. **Decision:** use an energy check to catch a bad basis
or a reconstruction bug.

### Boundary case: zero and nearly orthogonal vectors

**Input:** `z=(0,0)` and `v=(7,−3)`. **Mechanism:** `z·v=0`, but zero has no
direction and cannot be normalised into a unit basis vector. For floating-point
vectors with dot product `1e−14`, exact equality is too strict. **Output:**
zero is algebraically orthogonal but not a usable direction; near-zero needs a
tolerance. **Decision:** distinguish `norm≈0` from `abs(dot)≤tol`.

### Counterexample: non-orthogonal basis with naive dot coefficients

**Input:** `b₁=(1,0)`, `b₂=(1,1)`, and `x=(2,1)`. **Mechanism:** the vectors
are independent but not orthogonal. Naive dot coefficients are `x·b₁=2` and
`x·b₂=3`; reconstructing `2b₁+3b₂=(5,3)`, not `x`. **Output:** a wrong point
despite independent basis vectors. **Inspect:** the missing cross terms are the
cause. **Decision:** orthogonalise the basis or solve for coefficients directly.

## Two ways to see it

### Symbolic view

An orthonormal basis turns a coordinate problem into dot products and gives
`QᵀQ=I`. For a matrix whose columns are basis vectors, this identity is the
test to run; for a partial basis it still holds on its columns.

### Geometric view

Orthogonal directions meet at a right angle. A point decomposes into independent
right-angle components, so squared lengths add. A rotated grid preserves
distances; a skew grid does not let you read off coefficients by perpendicular
shadows.

### Computational view

```python
import numpy as np

Q = np.array([[3/5, -4/5], [4/5, 3/5]])
x = np.array([2., 1.])
assert np.allclose(Q.T @ Q, np.eye(2))
coords = Q.T @ x
assert np.allclose(coords, [2., -1.])
assert np.allclose(Q @ coords, x)
```

Use tolerances such as `np.allclose`, not exact equality, for floating-point
orthogonality.

## Hands-on

Implement a basis checker that reports each vector's norm, each pairwise dot
product, and whether the set is orthonormal. Use it to reconstruct points from
standard and rotated coordinates.

**Failure fixture:** replace the second column of `Q` with `(1,1)` or use a
zero column. **Test:** the checker must identify the non-unit/non-orthogonal or
zero direction and refuse to use `Q.T @ x` as exact coordinates. **Reset:**
restore the rotated `Q`, rerun `Q.T@Q≈I`, and compare reconstruction and energy.

Feedback prompts:

- Retrieve: what two numerical conditions define an orthonormal set?
- Calculate: test whether `(2,1)` and `(−1,2)` are orthogonal and unit length.
- Compute: rotate a point with `Q`, recover its coordinates with `Q.T`, and
  verify the round trip.
- Diagnose: identify the cross term that breaks naive coordinates in a skew
  basis.

Include the checker and its broken fixture in A1, the embedding geometry lab.

## Checkpoint

- [ ] Decide whether `(1,2)` and `(2,−1)` are orthogonal; state whether either
  is unit length.
- [ ] Find the coordinates of `(2,1)` in the rotated basis from Example B.
- [ ] Explain why `QᵀQ=I` enables `Qᵀx` to recover coordinates.
- [ ] State why a zero vector cannot be one member of an orthonormal basis.

## What this does not solve

Orthogonality is coordinate- and inner-product-dependent; it does not mean two
features are statistically independent or semantically unrelated. A numerically
near-orthogonal basis may still be unstable if its construction loses precision,
and a complete basis does not make the representation useful for a task.

## Continue, go deeper, apply it

- Continue: Projections and residuals
- Go deeper: Linear algebra for ML
- Apply it: A1 embedding geometry lab
