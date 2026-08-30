---
title: "Norms and distances"
track: "maths-foundations"
status: live
summary: "A norm measures vector size; a distance measures separation, commonly."
duration: "6 min read"
---

## The short answer

A norm measures vector size; a distance measures separation, commonly as the
norm of a difference. `L1` adds absolute coordinate changes, `L2` measures
straight-line length, and `L∞` keeps only the largest coordinate change. `L0`
counts nonzero entries and is a sparsity measure rather than a true norm. The
right choice depends on feature semantics, outliers, and what a “large error”
should mean.

## Why this matters

Nearest-neighbour retrieval, anomaly detection, regularisation, and clustering
can change substantially when the metric changes. L2 lets one large coordinate
dominate; L1 is often less sensitive to that coordinate; L∞ encodes a worst-case
per-coordinate limit. Choosing a metric because a library defaults to it hides a
modeling decision.

## How it works

For `x∈Rᵈ` and `p≥1`,

```text
||x||ₚ = (Σᵢ |xᵢ|ᵖ)^(1/p)
||x||₁ = Σᵢ |xᵢ|
||x||₂ = (Σᵢ xᵢ²)^(1/2)
||x||∞ = maxᵢ |xᵢ|
```

Define `d(x,y)=||x−y||`. For a genuine norm, non-negativity, identity of
indiscernibles, homogeneity, and the triangle inequality hold. The first three
are easy to inspect from absolute values and scaling; the triangle inequality
is the geometric statement that a direct path is no longer than a detour. The
`L0` count fails homogeneity: scaling a nonzero vector by any nonzero scalar
does not change its count, so it is not a norm.

Units matter. If one coordinate is rupees and another is years, adding their
raw absolute differences is a choice of scale, not a law of geometry.

For the induced distance, the basic checks follow from the norm properties:
`d(x,y)=||x−y||≥0`, `d(x,y)=0` only when `x=y`, and
`d(x,y)=||−(y−x)||=d(y,x)`. For three points, write
`x−z=(x−y)+(y−z)`; the norm triangle inequality gives
`d(x,z)≤d(x,y)+d(y,z)`. This is the proof sketch for why a norm can define a
distance, while the chosen norm still determines the shape and sensitivity.

## Worked examples and variations

### Example A: the same vector under four measurements

**Input:** `x=(3,-4)`. **Mechanism:** count nonzeros, add absolute values,
take the square root of squares, and take the maximum absolute coordinate.
**Output:** `L0=2`, `L1=7`, `L2=5`, `L∞=4`. **Inspect:** L2 is the usual
Euclidean length; each other number answers a different question. **Decision:**
choose the metric before comparing it to a threshold.

### Example B: distance with an outlier coordinate

**Input:** `x=(0,0)`, `y=(3,4)`. **Mechanism:** difference `(−3,−4)` gives
`d₁=7`, `d₂=5`, and `d∞=4`. **Output:** the metrics rank this pair according to
different aggregations. **Inspect:** L2 spreads the effect across both
coordinates; L∞ reports the worst coordinate. **Decision:** use L∞ when a
single coordinate violation controls acceptability.

### Example C: sparse changes

**Input:** `x=(0,0,0,0)` and `y=(0,0,0,7)`. **Mechanism:** one coordinate is
nonzero, so `d₀=1`, `d₁=7`, `d₂=7`, `d∞=7`. **Output:** L0 says “one feature
changed,” while the other metrics say how much it changed. **Inspect:** a sparse
text representation may care about count; a dosage measurement may care about
magnitude. **Decision:** do not substitute L0 for a magnitude-based distance.

### Boundary case: identical vectors and zero vectors

**Input:** `x=y=(2,−1)`. **Mechanism:** `x−y=(0,0)`, so every listed distance
is zero and the L2 norm is valid. For an angle or cosine, however, a zero vector
has no direction. **Output:** distance zero is defined; direction is not.
**Inspect:** separate distance checks from angle checks. **Decision:** use a
named zero-vector policy instead of adding an arbitrary epsilon invisibly.

### Counterexample: raw mixed units create a misleading nearest neighbour

**Input:** a query `(age=30, spend=1000)` and candidates differing by
`(1 year, 10 currency units)` or `(10 years, 1 currency unit)`. **Mechanism:**
raw L2 treats the spend coordinate as dominant because its numeric scale is
larger. **Output:** the first candidate may be judged closer even when age is the
important feature. **Inspect:** compute the metric after a stated scaling policy.
**Decision:** standardise, use meaningful weights, or use a unit-aware metric;
never call the raw result neutral.

## Two ways to see it

### Symbolic view

All these distances share `d(x,y)=measure(x−y)`. The difference vector makes
the comparison translation-invariant; the selected norm determines how
coordinate changes aggregate. L1 balls are diamond-shaped in 2D, L2 balls are
circles, and L∞ balls are squares.

### Geometric view

Draw equal-distance contours around a point. A square contour means “no
coordinate may exceed this limit”; a diamond means total absolute deviation is
bounded; a circle means Euclidean energy is bounded. In high dimensions these
shapes remain valid even when they cannot be visualised directly.

### Computational view

```python
import numpy as np

x = np.array([3., -4.])
assert np.count_nonzero(x) == 2                 # L0
assert np.isclose(np.linalg.norm(x, 1), 7.)
assert np.isclose(np.linalg.norm(x, 2), 5.)
assert np.isclose(np.linalg.norm(x, np.inf), 4.)
```

For a batch, specify the axis. `np.linalg.norm(X, axis=1)` measures one norm
per row; omitting the axis may collapse the entire batch into one number.

## Hands-on

Make a metric comparison table for at least five pairs of feature vectors. Plot
the 2D equal-distance contours for L1, L2, and L∞, and write one sentence about
the business meaning of a unit change in each coordinate.

**Failure fixture:** include one pair with a `NaN`, an empty vector, and a batch
where the code accidentally uses `axis=0` instead of `axis=1`. **Test:** assert
matching shapes, finite inputs, one output per row, `d(x,x)=0`, and symmetry
`d(x,y)=d(y,x)`. **Reset:** restore finite equal-length rows and rerun the
invariant checks before interpreting rankings.

Feedback prompts:

- Retrieve: what does L∞ retain that L1 and L2 combine?
- Calculate: find all four measurements for `(−2,0,5)`.
- Compute: change one coordinate by 10 and observe each metric's response.
- Diagnose: state why a norm choice cannot repair an unexamined unit mismatch.

Include the table and failed fixture in A1, the embedding geometry lab.

## Checkpoint

- [ ] Compute L0, L1, L2, and L∞ for `(−6,8)`.
- [ ] Give the 2D shape of an L1 ball and an L∞ ball and explain the different
  constraints they represent.
- [ ] Explain why `d(x,y)=||x−y||` is translation-invariant.
- [ ] Choose a defensible metric for a representation with one critical
  worst-case feature and justify the choice.

## What this does not solve

A mathematically valid norm does not make raw features comparable, robust to
adversarial inputs, or semantically meaningful. Metrics can still fail under
missingness, drift, correlated coordinates, or a poor representation. Scaling,
validation data, and the decision cost must be inspected with the distance.

## Continue, go deeper, apply it

- Continue: Cosine similarity, angular distance, and embedding retrieval
- Go deeper: Linear algebra for ML
- Apply it: A1 embedding geometry lab
