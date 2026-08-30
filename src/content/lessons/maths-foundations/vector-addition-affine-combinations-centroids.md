---
title: "Vector addition, scalar multiplication, affine combinations, and centroids"
track: "maths-foundations"
status: live
summary: "Vector addition combines coordinate-wise effects; scalar multiplication changes."
duration: "6 min read"
---

## The short answer

Vector addition combines coordinate-wise effects; scalar multiplication changes
their magnitude. A weighted sum `Σᵢ wᵢxᵢ` is an affine combination when the
weights sum to one, and it is a convex combination when they are also
non-negative. This distinction makes centroids, interpolation, attention
weights, and weighted features interpretable instead of origin-dependent.

## Why this matters

“Average these embeddings” is not just “add some vectors.” The weights say which
items matter, and their sum says whether the result remains in the same affine
coordinate frame. If weights add to `0.8`, the result is pulled toward the
origin; if a weight is negative, the result may extrapolate outside the span of
the observed points. Those may be intentional choices, but they are not an
ordinary centroid.

## How it works

For `x=(x₁,…,x_d)` and `y=(y₁,…,y_d)`,

```text
x + y = (x₁+y₁, …, x_d+y_d)
a x   = (a x₁, …, a x_d)
c     = Σᵢ wᵢxᵢ
```

The affine condition is `Σᵢwᵢ=1`. To see why it matters, translate every point
by `t`:

```text
Σᵢ wᵢ(xᵢ+t) = Σᵢ wᵢxᵢ + (Σᵢwᵢ)t.
```

When the weights sum to one, the result translates by exactly `t`. If the sum is
`s≠1`, the result moves by `s t`; it depends on the arbitrary choice of origin.
When all weights are non-negative as well, the result lies inside the convex
hull of the points. An equal-weight centroid uses `wᵢ=1/n`.

## Worked examples and variations

### Example A: midpoint by addition and scaling

**Input:** `a=(1,1)` and `b=(5,3)`. **Mechanism:** add first,
`a+b=(6,4)`, then multiply by `1/2`. **Output:** midpoint
`m=(3,2)`. **Inspect:** the point is halfway along the segment; both weights
are non-negative and sum to one. **Decision:** use this for a two-item average,
not for a sum whose magnitude carries meaning.

### Example B: a weighted centroid of ticket representations

**Input:** three vectors `x₁=(1,0)`, `x₂=(0,2)`, `x₃=(2,2)` with weights
`(0.5,0.25,0.25)`. **Mechanism:**
`c=0.5(1,0)+0.25(0,2)+0.25(2,2)=(1,1)`. **Output:** centroid `(1,1)`.
**Inspect:** weights sum to one and are non-negative, so the point lies inside
the triangle formed by the examples. **Decision:** use the centroid as a
summary only if the coordinate meanings can be averaged.

### Example C: interpolation between two embedding states

**Input:** `u=(2,0)` and `v=(0,4)`, with interpolation parameter `α=0.25`.
**Mechanism:** `(1−α)u+αv=0.75u+0.25v=(1.5,1)`. **Output:** a point one
quarter of the way from `u` to `v`. **Inspect:** changing `α` from `0` to `1`
traces the segment. **Decision:** interpolation is meaningful only when the
space has a smooth interpretation; a straight path between arbitrary IDs is
not automatically meaningful.

### Boundary case: affine is not always convex

**Input:** `u=(1,1)`, `v=(3,2)`, weights `(1.5,-0.5)`. **Mechanism:** the sum
is one, so `1.5u−0.5v=(0,0.5)` is affine. **Output:** a point on the line
through `u` and `v`, but outside their segment. **Inspect:** the negative weight
means extrapolation. **Decision:** call this an affine extrapolation, not a
centroid or convex average.

### Counterexample: weights that do not sum to one

**Input:** `u=(2,4)`, `v=(4,8)`, weights `(0.3,0.5)`. **Mechanism:** the sum
is `0.8`, producing `0.3u+0.5v=(2.6,5.2)`. **Output:** a smaller vector than
the comparable normalized combination `0.375u+0.625v=(3.25,6.5)`.
**Inspect:** translate both inputs by `t=(10,0)`; the first result shifts by
`8`, not `10`. **Decision:** either normalise the weights or explicitly model
the scale as meaningful.

## Two ways to see it

### Symbolic view

The coefficients are the explanation: `c=Σwᵢxᵢ`. The constraints
`Σwᵢ=1` and `wᵢ≥0` answer different questions—affine frame preservation and
convex containment. Do not silently add either condition when the application
needs another one.

### Geometric view

Addition places vectors head-to-tail; scalar multiplication stretches or flips
an arrow. A convex combination stays inside the polygon/polytope made by its
inputs. Draw the origin when explaining a non-normalised weighted sum, because
the origin is exactly what changes its meaning.

### Computational view

```python
import numpy as np

points = np.array([[1., 0.], [0., 2.], [2., 2.]])
weights = np.array([.5, .25, .25])
centroid = weights @ points
assert np.isclose(weights.sum(), 1.0)
assert np.allclose(centroid, [1., 1.])
```

The matrix product is a compact weighted sum. Check the weight axis and shape;
`points @ weights` describes a different operation and may fail or silently
produce the wrong orientation.

## Hands-on

Build a centroid notebook with three points, a slider or variable for each
weight, and a plot of the points and weighted result. Record whether the result
is affine, convex, or neither.

**Failure fixture:** use weights `[0.5, 0.2, 0.1]` and then include a negative
weight such as `[1.2, -0.1, -0.1]`. **Test:** assert that the affine checkbox is
true only when `abs(weights.sum()-1)<1e-12`, and that the convex checkbox also
requires all weights to be non-negative. Add a translation test showing that a
valid affine combination shifts by the same translation. **Reset:** restore
`[0.5,0.25,0.25]`, replot, and verify the centroid `(1,1)`.

Feedback prompts:

- Retrieve: what two conditions distinguish a convex combination from an affine
  one?
- Calculate: find `0.7(2,1)+0.3(0,5)` by hand.
- Compute: vary one weight while keeping the sum one and describe the path.
- Diagnose: explain why a non-normalised sum can be a useful accumulator but a
  misleading centroid.

Submit the vector-weighting portion of A1, the embedding geometry lab
after making your own attempt.

## Checkpoint

- [ ] Compute the midpoint of `(−2,4)` and `(6,0)`.
- [ ] Classify weights `(0.2,0.3,0.5)`, `(1.2,−0.2)`, and `(0.4,0.4)` as
  convex, affine-only, or neither.
- [ ] Explain with the translation equation why weights summing to `0.8` are
  origin-dependent.
- [ ] State one AI use where a weighted sum is a summary and one where its scale
  should deliberately be preserved.

## What this does not solve

A centroid can erase clusters, rare cases, or coordinate meanings that should
not be averaged. Weight normalisation does not make embeddings semantically
linear, and convex containment does not guarantee a safe or realistic example.
Inspect the geometry and the application-specific units before interpreting the
result.

## Continue, go deeper, apply it

- Continue: Dot products and bilinear scores
- Go deeper: Vector means, centring, and feature standardisation
- Apply it: A1 embedding geometry lab
