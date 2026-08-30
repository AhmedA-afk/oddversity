---
title: "PCA from variance maximisation and SVD"
track: "maths-foundations"
status: live
summary: "Principal component analysis (PCA) finds orthogonal directions of greatest."
duration: "6 min read"
---

## The short answer

Principal component analysis (PCA) finds orthogonal directions of greatest
variance after centring the data. The first direction solves
`max ||X_c w||²` subject to `||w||=1`, which leads to the top eigenvector of the
sample covariance `S=X_cᵀX_c/(n−1)`. Equivalently, the right singular vectors of
the centred data matrix are the principal directions. PCA is useful for
visualisation and compression, but variance is not the same as predictive,
causal, or fair importance.

## Why this matters

PCA is often described as a library call, yet three choices determine its result:
whether data was centred, whether features were scaled, and how many components
were retained. A forgotten mean makes the largest direction point toward the
origin of the data cloud. A large measurement unit can make one feature dominate.
Retaining 99% of variance can still remove a low-variance class boundary.

## How it works

Let rows of `X` be observations and define the centred matrix
`X_c = X − 1 μᵀ`, where `μ` is the column mean. For a unit direction `w`, the
projected values are `X_cw`, and their sample variance is

```text
var(X_cw) = (1/(n−1)) ||X_cw||²
           = wᵀ [X_cᵀX_c/(n−1)] w
           = wᵀS w.
```

Using a Lagrange multiplier for `wᵀw=1` gives `Sw=λw`; the maximum is the
largest eigenvalue. If `X_c=UΣVᵀ`, then `S=V(Σ²/(n−1))Vᵀ`, so `V` contains
the same directions and `σᵢ²/(n−1)` are their explained variances. Scores are
`Z=X_cV`; reconstructing `k` components gives `Z[:, :k]V[:, :k]ᵀ+μ`.

## Worked examples and variations

The numeric cases are illustrative. Always record the mean, scale convention,
components, and explained-variance calculation.

### Example A: points on a diagonal line

**Input:** rows `(1,1)`, `(2,2)`, `(3,3)`. **Mechanism:** the mean is `(2,2)`;
centred rows are `(-1,−1)`, `(0,0)`, `(1,1)`. The first direction is
`w₁=(1,1)/√2`; the orthogonal direction has zero variance. **Output:** scores
`(-√2,0,√2)` on PC1 and all-zero PC2 scores. **Inspect:** covariance eigenvalues
are `2` and `0` under the `1/(n−1)` convention. **Decision:** one component is
exact for this data, but do not infer that the original process has only one
causal variable.

### Example B: scaling changes the principal direction

**Input:** two features measured as `height in metres` and `income in rupees`.
**Mechanism:** covariance uses squared units, so income can dominate even when
its relative variation is not the intended signal. **Output:** raw PCA and PCA
on standardised columns can have different first components. **Inspect:** compare
the covariance and correlation matrices plus the units. **Decision:** use raw
PCA when physical variance matters; standardise when features should contribute
on comparable scale, and document the choice.

### Boundary case: one observation or a constant feature

**Input:** `n=1`, or a column with no variation. **Mechanism:** sample covariance
with `1/(n−1)` is undefined for one row; a constant feature has zero variance.
**Output:** no defensible sample PCA for the single row, and a zero eigenvalue
for the constant direction in a larger dataset. **Inspect:** check row count and
column standard deviations before division. **Decision:** reject, collect more
data, or handle the zero-variance feature explicitly.

### Counterexample: uncentred PCA follows the mean

**Input:** points `(10,0)`, `(10,1)`, `(10,2)`. **Mechanism:** uncentred second
moment is dominated by the large x-coordinate; centred variation is entirely in
the y-direction. **Output:** uncentred PCA can report the x-axis as the main
direction, while centred PCA reports the y-axis. **Inspect:** plot the cloud and
draw the mean; compare `X.T@X` with `X_c.T@X_c`. **Decision:** centre unless
there is a stated reason to analyse the origin-anchored second moment instead.

### AI application: reducing an embedding table

**Input:** rows of embeddings. **Mechanism:** centre, compute components, and
project each row. **Output:** a lower-dimensional representation for plotting or
indexing. **Inspect:** evaluate reconstruction, nearest-neighbour changes,
subgroup metrics, and leakage of metadata. **Decision:** treat PCA as a
representation transform with a fit-on-training-only rule; do not fit components
on the test set.

## A small story

A two-dimensional plot looked “cleaner” after PCA, but the first component had
mostly captured a currency unit rather than the behaviour under study. Re-running
with explicit centring, scaling, and a held-out task check changed the chart and
the conclusion. The plot was not wrong; the unstated measurement choice was.

## Two ways to see it

### Builder view

Treat PCA as a fitted object containing training mean `μ`, optional scale `s`,
components `V`, explained variances, and the fit dataset boundary. At inference,
apply exactly `((x−μ)/s) @ V`; never recompute the mean or components per request.

### Visual view

Centre the point cloud at the origin, then rotate axes so PC1 follows the longest
spread, PC2 captures the longest remaining perpendicular spread, and so on. The
new axes are orthogonal; their lengths are the square roots of explained
variances.

### Computational view

```python
import numpy as np

X = np.array([[1., 1.], [2., 2.], [3., 3.]])
mu = X.mean(axis=0)
Xc = X - mu
U, s, Vt = np.linalg.svd(Xc, full_matrices=False)
components = Vt.T
explained = s**2 / (len(X) - 1)
scores = Xc @ components

S = Xc.T @ Xc / (len(X) - 1)
assert np.allclose(components @ np.diag(explained) @ components.T, S)
assert np.allclose(scores @ components.T + mu, X)
```

The sign of a component is arbitrary: `V[:,0]` and `−V[:,0]` describe the same
axis. Compare projections up to sign when writing regression tests.

## Hands-on

Create a PCA report with raw and standardised versions of one small dataset.
Include means, scales, components, scores, explained-variance ratios, a scatter
plot, a reconstruction at two ranks, and one downstream metric.

**Failure fixture:** run PCA on the uncentred matrix and fit components using all
rows before splitting train/test. **Tests:** assert training-centred data has
near-zero means, compare the SVD and covariance-eigenvector directions up to
sign, and assert the test split never changes `μ` or `V`. **Reset:** restore the
training-only fit, rerun the transform, and save the failed uncentred plot as a
regression fixture.

## Checkpoint

- [ ] Derive the PCA variance objective and its eigenvector condition.
- [ ] Explain why centred-data SVD and covariance eigendecomposition agree.
- [ ] Predict what changes when one feature is rescaled by 1,000.
- [ ] State why fitting PCA on the test set is a form of leakage.

## What this does not solve

PCA is unsupervised and linear. It does not preserve every nonlinear manifold,
rare class, causal direction, privacy property, or downstream metric. Explained
variance is a reconstruction summary; it is not evidence of task usefulness.

## Continue, go deeper, apply it

- Continue: Covariance matrices and whitening
- Go deeper: PCA and dimensionality reduction
- Apply it: Generalisation and evaluation
