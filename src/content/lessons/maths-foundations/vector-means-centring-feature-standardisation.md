---
title: "Vector means, centring, and feature standardisation"
track: "maths-foundations"
status: live
summary: "The vector mean μ=(1/n)Σᵢxᵢ is the coordinate-wise centroid."
duration: "5 min read"
---

## The short answer

The vector mean `μ=(1/n)Σᵢxᵢ` is the coordinate-wise centroid. Centring
replaces each row by `xᵢ−μ`, moving the dataset's centroid to the origin.
Standardisation additionally divides each coordinate by a scale such as its
training standard deviation: `zⱼ=(xⱼ−μⱼ)/σⱼ`. Fit `μ` and `σ` on training
data, reuse them unchanged, and treat zero variance as a data condition—not a
reason to invent information.

## Why this matters

Distances, dot products, projections, and PCA are sensitive to location and
scale. A large-unit feature can dominate a smaller-unit feature, and an
uncentred cloud can make a direction look like variance when it is mainly an
offset. Fitting preprocessing separately on test data leaks information and
changes the coordinate system between evaluation and deployment.

## How it works

For rows `x₁,…,xₙ∈Rᵈ`,

```text
μ = (1/n)Σᵢ xᵢ
center(xᵢ) = xᵢ−μ
standardise(xᵢ)ⱼ = (xᵢⱼ−μⱼ)/σⱼ.
```

The centred mean is zero because
`(1/n)Σᵢ(xᵢ−μ)=μ−μ=0`. For a new point, use the training `μ` and `σ`; using
test-specific values makes the test examples define their own representation.
With population standard deviation, `σⱼ²=(1/n)Σᵢ(xᵢⱼ−μⱼ)²`; a sample
estimate may use `n−1`, but the convention must be fixed.

## Worked examples and variations

### Example A: centre a two-dimensional cloud

**Input:** `x₁=(1,2)`, `x₂=(3,4)`, `x₃=(5,6)`. **Mechanism:**
`μ=((1+3+5)/3,(2+4+6)/3)=(3,4)`. **Output:** centred rows
`(−2,−2),(0,0),(2,2)`. **Inspect:** their coordinate-wise mean is `(0,0)`.
**Decision:** centre before interpreting the direction of variation.

### Example B: standardise features with different scales

**Input:** feature A has values `[1,2,3]`, feature B `[100,200,300]`.
**Mechanism:** means are `(2,200)` and population standard deviations are
`(√(2/3),100√(2/3))`. **Output:** both features have mean zero and unit
population variance after standardisation. **Inspect:** a one-unit z-score is
relative to that feature's own spread. **Decision:** use the transformed values
for scale-sensitive geometry when equalised variation is intended.

### Example C: train statistics applied to a new point

**Input:** training feature values `[10,20,30]`, new value `40`.
**Mechanism:** training mean is `20`; using population `σ=√(200/3)`, the new
z-score is `(40−20)/σ≈2.449`. **Output:** the point is above the training
mean by about 2.45 training standard deviations. **Inspect:** do not recompute
the mean as if `40` were part of training. **Decision:** persist preprocessing
parameters with the model.

### Boundary case: constant feature

**Input:** feature values `[7,7,7]`. **Mechanism:** `μ=7`, `σ=0`, so division
is undefined. **Output:** centred values are valid zeros, but standardised
values are not defined. **Inspect:** the feature contains no training variation.
**Decision:** drop it, preserve it as a constant if required by the contract,
or apply an explicit policy; never hide the problem with an unexplained epsilon.

### Counterexample: centring train and test separately

**Input:** training values `[0,2,4]`, test values `[100,102]`.
**Mechanism:** train-centred test values are about `[99,101]`; test-centred
values are `[−1,1]`. **Output:** the same test points acquire radically
different coordinates depending on which mean is used. **Inspect:** the second
version lets the test distribution redefine the representation. **Decision:**
fit only on training data, then apply the frozen transform to validation,
test, and production inputs.

## Two ways to see it

### Symbolic view

For a data matrix `X` with rows as observations, centring is
`X_c=X−1_nμᵀ`. Standardisation is coordinate-wise division after centring. The
mean-zero identity is a useful invariant for tests; it is not a guarantee that
the features are independent.

### Geometric view

Centring translates a point cloud so its centroid sits at the origin.
Standardisation stretches or shrinks axes, turning an elongated cloud into one
whose coordinate spreads are comparable under the selected scale. The shape
changes, so downstream distances and angles can change too.

### Computational view

```python
import numpy as np

train = np.array([[1., 100.], [2., 200.], [3., 300.]])
mu = train.mean(axis=0)
sigma = train.std(axis=0)  # population convention, ddof=0
assert np.all(sigma > 0)
train_z = (train - mu) / sigma
assert np.allclose(train_z.mean(axis=0), 0.)
assert np.allclose(train_z.std(axis=0), 1.)
```

Store `mu`, `sigma`, the axis convention, and the zero-variance policy. A
library scaler is convenient, but the fitting boundary still matters.

## Hands-on

Build a preprocessing artifact with separate train, validation, and test rows.
Plot the raw and centred points, then report the training mean and scale used
for every split.

**Failure fixture:** fit a second scaler on test rows and add a constant
feature. **Test:** assert that validation/test transforms use exactly the saved
training parameters, that centred training means are close to zero, and that a
zero scale raises a named error or follows the documented drop/constant policy.
**Reset:** restore one fitted training transform, remove the accidental test
fit, and rerun the split and variance assertions.

Feedback prompts:

- Retrieve: which data split is allowed to fit `μ` and `σ`?
- Calculate: centre `(2,5)` using mean `(1,3)`.
- Compute: compare a raw-distance ranking with a standardised-distance ranking.
- Diagnose: explain why a constant feature cannot become informative through
  division by a tiny number.

Include the split-safe transform and broken test fit in A1, the embedding
geometry lab.

## Checkpoint

- [ ] Compute the mean and centred rows for `(1,2)`, `(3,4)`, `(5,6)`.
- [ ] State the difference between centring and standardisation.
- [ ] Explain why train statistics must be reused on validation/test data.
- [ ] Give two defensible policies for a zero-variance feature and name the one
  thing neither policy may claim: that the feature gained information.

## What this does not solve

Standardisation does not remove outliers, make distributions Gaussian, or
guarantee fair comparisons. It can amplify noise in a low-variance feature and
can be the wrong transform for sparse counts, bounded proportions, or features
whose absolute scale is meaningful. Validate the choice on the task.

## Continue, go deeper, apply it

- Continue: Geometry in high dimensions
- Go deeper: Linear algebra for ML
- Apply it: A1 embedding geometry lab
