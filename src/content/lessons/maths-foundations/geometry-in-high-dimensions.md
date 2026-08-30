---
title: "Geometry in high dimensions"
track: "maths-foundations"
status: live
summary: "In high-dimensional spaces, distances and angles can concentrate: many random."
duration: "5 min read"
---

## The short answer

In high-dimensional spaces, distances and angles can concentrate: many random
points have similar lengths, pairwise distances, and near-zero cosine. This is
useful for understanding random-feature baselines but dangerous as a universal
claim. Dependence, sparsity, scaling, low-dimensional signal, and the chosen
metric can preserve strong structure. Measure the geometry of the actual data
before choosing a retrieval or anomaly threshold.

## Why this matters

A 2D sketch suggests that “nearest” is visually obvious. In an embedding space
with hundreds of coordinates, a small difference in many coordinates can beat a
large difference in one, and the nearest-neighbour gap can become thin. A model
may still work well—high dimension is not itself a failure—but intuition from a
plot of two selected coordinates is weak evidence.

## How it works

Let `x,y∈[-1,1]^d` have independent coordinates with variance `1/3`. For one
coordinate, independence gives

```text
E[(xⱼ−yⱼ)²] = Var(xⱼ−yⱼ) = 2/3.
```

Summing coordinates,
`E||x−y||²=2d/3`. The expected squared distance grows with `d`, while the
relative fluctuations often shrink under independence because many coordinates
contribute. For independent standard Gaussian vectors, the normalised dot
product has mean zero and a typical scale that decreases roughly as `1/√d`.
These are concentration intuitions, not guarantees for arbitrary embeddings.

## Worked examples and variations

### Example A: Pythagorean growth from repeated coordinates

**Input:** two vectors differ by `1` in every coordinate. **Mechanism:** in
`d=4`, L2 distance is `√4=2`; in `d=100`, it is `√100=10`.
**Output:** many small coordinate changes accumulate. **Inspect:** L∞ remains
`1`, while L1 is `4` or `100`. **Decision:** choose the norm according to
whether total change, energy, or worst coordinate matters.

### Example B: random distance concentration

**Input:** independent uniform points in `[-1,1]^d`. **Mechanism:** sample many
pairs for `d=2`, `32`, and `512`; compute L2 distances and divide each by its
mean. **Output:** the histogram generally becomes narrower around its mean as
dimension grows. **Inspect:** the claim is about a distribution under a stated
sampling model, not a proof about a production embedding space. **Decision:**
measure nearest-neighbour gaps on real, reviewed pairs as well.

### Example C: random directions have near-zero cosine

**Input:** independent Gaussian vectors normalised to unit length.
**Mechanism:** calculate pairwise dot products. Positive and negative alignments
cluster near zero as dimension grows, with typical magnitude shrinking.
**Output:** random directions are mostly nearly orthogonal. **Inspect:** a
meaningful embedding must create structure beyond this random baseline.
**Decision:** compare retrieval against random or shuffled baselines, not just a
single attractive nearest-neighbour example.

### Boundary case: sparse or dependent coordinates

**Input:** vectors have 512 coordinates but only two are nonzero, or 510
coordinates are duplicated copies of the same signal. **Mechanism:** the
effective dimension is much smaller than the raw coordinate count; independence
assumptions behind concentration do not apply directly. **Output:** distances
may not behave like the independent dense example. **Inspect:** sparsity,
correlation, and intrinsic-dimension proxies. **Decision:** diagnose the data
geometry rather than infer it from the array width.

### Counterexample: a 2D projection hides the nearest-neighbour relation

**Input:** points `a=(0,0,100)`, `b=(0,0,101)`, and `c=(1,1,0)` in `R³`.
**Mechanism:** a plot of the first two coordinates makes `a` and `b` coincide,
but their full L2 distance is `1`; `a` to `c` is `√10002`. **Output:** the
projection hides the axis that determines closeness. **Inspect:** compare the
plot with full-dimensional distances. **Decision:** label plots as projections
and never use a 2D visual as the retrieval computation.

## Two ways to see it

### Symbolic view

Squared L2 distance is a sum of coordinate contributions. In independent random
settings, sums of many contributions are more stable relative to their scale.
Cosine is a normalised dot product, so its variation also depends on the number
and dependence of coordinates. The assumptions are part of the derivation.

### Geometric view

High-dimensional spheres have most of their volume in a thin outer shell, and
random directions are almost perpendicular. The picture is a guide to a
distribution, not a literal 3D drawing of a dataset. Projection can discard the
coordinate that carries the decision.

### Computational view

```python
import numpy as np

rng = np.random.default_rng(7)
for d in (2, 32, 512):
    X = rng.uniform(-1, 1, size=(400, d))
    distances = np.linalg.norm(X[1:] - X[:-1], axis=1)
    print(d, distances.mean(), distances.std() / distances.mean())
```

The printed relative spread is an observation from this seed and sample size,
not a universal constant. Repeat with real vectors, scaling policies, and
metric choices before setting thresholds.

## Hands-on

Build a geometry report for the same dataset at dimensions 2, 32, and 512, or
for three controlled projections of one embedding set. Include distance and
cosine histograms, nearest-neighbour gaps, a labelled 2D projection, and a
random/shuffled baseline.

**Failure fixture:** compute distances after accidentally retaining only two
coordinates, or compare raw vectors with mixed feature scales. **Test:** assert
that the metric receives the documented dimension and scaling, compare against a
full-dimensional reference pair, and fail if the projection changes a reviewed
nearest-neighbour decision without being reported. **Reset:** restore all
coordinates and the training scaling parameters, then rerun the report.

Feedback prompts:

- Retrieve: what assumptions support the simple concentration intuition?
- Calculate: compare L2 and L∞ when every one of 100 coordinates differs by one.
- Compute: measure relative distance spread at three dimensions with a fixed
  seed.
- Diagnose: explain why a 2D plot is a projection, not proof of full-space
  neighbourhoods.

Submit the report as the high-dimensional section of A1, the embedding geometry
lab.

## Checkpoint

- [ ] Derive `E||x−y||²=2d/3` for independent uniform coordinates on `[-1,1]`.
- [ ] Explain why random unit vectors tend toward near-zero cosine in high
  dimensions.
- [ ] Give two conditions that break or weaken the independent-dense intuition.
- [ ] State one diagnostic that compares a 2D visual with the full-dimensional
  computation.

## What this does not solve

Concentration does not say that all real embeddings are useless, that dimension
must be reduced, or that one metric is universally best. It does not measure
semantic quality, fairness, or retrieval relevance. Data dependence, learned
structure, sparsity, and task labels decide whether the geometry is useful.

## Continue, go deeper, apply it

- Continue: Similarity-search design clinic
- Go deeper: Linear algebra for ML
- Apply it: A1 embedding geometry lab
