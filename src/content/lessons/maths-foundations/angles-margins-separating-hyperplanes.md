---
title: "Angles, margins, and separating hyperplanes"
track: "maths-foundations"
status: live
summary: "A linear classifier scores f(x)=wᵀx+b and separates classes."
duration: "5 min read"
---

## The short answer

A linear classifier scores `f(x)=wᵀx+b` and separates classes at the
hyperplane `wᵀx+b=0`. The vector `w` is normal to that boundary. The signed
distance from `x` to it is `f(x)/||w||`; for a labelled point `y∈{−1,+1}`,
the geometric margin is `y f(x)/||w||`. Divide by `||w||` before comparing
margins, because scaling the equation should not change its geometry.

## Why this matters

The raw score is useful for ranking and thresholding, but it is not a distance
until divided by the normal's length. A model can multiply `w` and `b` by ten,
leaving every prediction unchanged while making raw scores ten times larger.
Confusing score scale with geometric separation breaks comparisons across models
and can create a false sense of confidence.

## How it works

The boundary is the set `H={x:wᵀx+b=0}`. To find the closest point on `H`,
move from `x` along the normal `w`: `x′=x−t w`. Choose `t` so that

```text
wᵀ(x−t w)+b = 0
t = (wᵀx+b)/(wᵀw).
```

The displacement length is `|t| ||w||=|wᵀx+b|/||w||`, giving the signed
distance `f(x)/||w||`. Multiplying both `w` and `b` by a positive constant
multiplies numerator and denominator equally; the boundary and signed distance
stay the same. Multiplying by a negative constant also flips the class-score
orientation, so labels must flip with it.

## Worked examples and variations

### Example A: a vertical boundary

**Input:** `w=(1,0)`, `b=−2`. **Mechanism:** `f(x)=x₁−2`, so the boundary is
the vertical line `x₁=2`. For `x=(5,3)`, the signed distance is
`(5−2)/1=3`. **Output:** the point is three units on the positive side.
**Inspect:** moving only in the x direction reaches the boundary. **Decision:**
use the sign for class side and the divided score for geometric distance.

### Example B: a tilted classifier and labelled margin

**Input:** `w=(3,4)`, `b=−10`, point `x=(2,3)`, label `y=+1`.
**Mechanism:** `f(x)=6+12−10=8`, `||w||=5`, so signed distance and labelled
margin are `8/5=1.6`. **Output:** the point is correctly classified with
positive margin `1.6`. **Inspect:** `w` points perpendicular to the boundary.
**Decision:** compare this margin with another point using the same normalised
definition.

### Example C: the same boundary under rescaling

**Input:** `(w,b)=((3,4),−10)` and scaled parameters
`(w′,b′)=((30,40),−100)`. **Mechanism:** raw scores are `8` and `80`, while
norms are `5` and `50`. **Output:** both signed distances are `1.6`.
**Inspect:** predictions and geometry agree even though the score magnitudes
differ. **Decision:** never compare raw score magnitudes across arbitrary
parameter scalings as if they were distances.

### Boundary case: a point on the boundary and a zero normal

**Input:** `x=(2,7)` under Example A. **Mechanism:** `f(x)=0`, so signed
distance and margin are zero; the point is ambiguous under this boundary. If
`w=(0,0)`, `wᵀx+b=0` describes either every point (`b=0`) or no point
(`b≠0`), not a separating line. **Output:** zero margin is a boundary case;
zero norm is an invalid classifier geometry. **Decision:** route ties and reject
zero normals explicitly.

### Counterexample: using an unnormalised score as a margin

**Input:** two equivalent classifiers from Example C. **Mechanism:** a learner
reports margins `8` and `80` from raw scores. **Output:** the rescaled model
appears ten times more confident even though it makes identical decisions.
**Inspect:** divide by the corresponding norm; both become `1.6`. **Decision:**
normalise margins and treat probability calibration as a separate problem.

## Two ways to see it

### Symbolic view

`wᵀx+b` is a dot product plus an intercept. The hyperplane is a level set, and
`w/||w||` is its unit normal. For labels, `y(wᵀx+b)/||w||` makes “correct side”
positive and measures distance to the boundary.

### Geometric view

Draw the line/plane where the score is zero and arrows parallel to `w`. Equal
scores are parallel hyperplanes; equal signed distances are equally spaced
planes only after normalising by `||w||`.

### Computational view

```python
import numpy as np

w = np.array([3., 4.])
b = -10.
x = np.array([2., 3.])
score = w @ x + b
margin = score / np.linalg.norm(w)
assert np.isclose(score, 8.)
assert np.isclose(margin, 1.6)
```

Test both sides, boundary points, and parameter rescalings. A classifier score
can be monotonic evidence without being a calibrated probability.

## Hands-on

Create a two-dimensional classifier fixture with at least four labelled points.
Plot the boundary, normal vector, raw score, signed distance, and labelled
margin for each point.

**Failure fixture:** multiply `w,b` by ten and report raw scores as margins;
also include a boundary point and `w=(0,0)`. **Test:** assert that positive
rescaling leaves predictions and normalised margins unchanged, that the boundary
point has zero margin, and that a zero normal is rejected. **Reset:** restore the
original parameter scale and remove the invalid classifier before plotting the
final interpretation.

Feedback prompts:

- Retrieve: which vector is normal to `wᵀx+b=0`?
- Calculate: find the signed distance of `(4,1)` under `w=(1,0),b=−2`.
- Compute: rescale a classifier and verify its normalised margins remain fixed.
- Diagnose: explain why a raw score is not automatically a probability or a
  geometric distance.

Record the boundary plot and failed scaling case in A1, the embedding geometry
lab.

## Checkpoint

- [ ] For `w=(2,1), b=−3`, write the separating line and classify `(2,0)` by
  score sign.
- [ ] Derive the signed-distance formula by moving along `w` to the boundary.
- [ ] Explain why multiplying `(w,b)` by a positive constant leaves the
  normalised margin unchanged.
- [ ] State the correct policy for a boundary point and a zero normal.

## What this does not solve

Margins describe a linear boundary; they do not prove linear separability,
calibration, fairness, causal usefulness, or robustness to distribution shift.
A large geometric margin can coexist with poor labels or a poor feature space.
Threshold and probability decisions need their own validation.

## Continue, go deeper, apply it

- Continue: Vector means, centring, and feature standardisation
- Go deeper: Classifiers, thresholds, and calibration
- Apply it: A1 embedding geometry lab
