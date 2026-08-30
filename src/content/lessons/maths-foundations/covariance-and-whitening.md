---
title: "Covariance matrices and whitening"
track: "maths-foundations"
status: live
summary: "For centred observations, the sample covariance is."
duration: "5 min read"
---

## The short answer

For centred observations, the sample covariance is
`S=X_cᵀX_c/(n−1)`. Diagonal entries measure individual variance; off-diagonal
entries measure whether two features move together. Whitening rotates into the
covariance eigenbasis and scales each nonzero-variance direction to unit
variance: `Z=X_cQΛ⁻¹ᐟ²`. It can simplify some optimisation and distance models,
but it amplifies noise in small-variance directions and is not automatically a
better representation.

## Why this matters

Covariance is the bridge between data geometry and probabilistic assumptions.
Its ellipses show correlated directions; its eigenvalues show principal spread.
Whitening removes linear scale and correlation, which can make a downstream
algorithm’s geometry easier to control. But a direction with tiny variance may
be mostly measurement noise, and multiplying it by `1/√λ` makes that noise loud.

Always state whether covariance uses `1/n` or `1/(n−1)`, whether data was
centred, and whether the transform is PCA whitening or ZCA whitening.

## How it works

Let `S=QΛQᵀ`, with nonnegative eigenvalues `λᵢ`. PCA coordinates are
`Y=X_cQ`, whose covariance is `Λ`. Scale them with `Λ⁻¹ᐟ²`:

```text
Z = X_c Q Λ⁻¹ᐟ²
Cov(Z) = Λ⁻¹ᐟ² Qᵀ S Q Λ⁻¹ᐟ² = I.
```

For zero or tiny `λᵢ`, the inverse square root is undefined or huge. A practical
implementation uses a pseudoinverse threshold or regularisation
`Λ+εI`, but that changes the exact whitening claim. ZCA maps back to the original
coordinate orientation with `X_zca = ZQᵀ`; PCA-whitened coordinates remain in
the rotated basis.

## Worked examples and variations

The cases are illustrative. Inspect covariance under the stated denominator and
measure the post-transform covariance rather than assuming it is identity.

### Example A: correlated two-feature data

**Input:** centred rows `(-1,−1)`, `(0,1)`, `(1,0)`, `(0,0)`. **Mechanism:**

```text
S = [[2/3, 1/3],
     [1/3, 2/3]].
```

The eigenvalues are `1` and `1/3`, with directions `(1,1)/√2` and
`(1,−1)/√2`. **Output:** whitening leaves the first mode unchanged and scales
the contrast mode by `√3`. **Inspect:** transformed covariance is approximately
`I`. **Decision:** the correlation has been removed, but the contrast has been
amplified because its original variance was smaller.

### Example B: covariance versus correlation

**Input:** temperature in degrees and energy use in kilowatt-hours. **Mechanism:**
covariance retains units, while the correlation matrix standardises each feature
first. **Output:** the off-diagonal value and eigenvectors can change after
standardisation. **Inspect:** report units and standard deviations beside the
matrix. **Decision:** use covariance when scale is meaningful; use correlation or
standardised whitening when the features should be compared dimensionlessly.

### Boundary case: a zero-variance direction

**Input:** two identical columns. **Mechanism:** one eigenvalue is zero, so
`1/√λ` does not exist. **Output:** exact whitening cannot invert that direction.
**Inspect:** rank and the minimum eigenvalue before constructing `W`. **Decision:**
drop the constant/redundant direction, use a pseudoinverse, or collect data with
variation; do not hide the issue with an unexplained epsilon.

### Counterexample: whitening a noisy tiny mode

**Input:** a signal with variance `1` in one direction and sensor noise with
variance `10⁻⁶` in another. **Mechanism:** whitening multiplies the second mode
by `1,000`. **Output:** equalised variance but potentially a noise-dominated
feature. **Inspect:** compare signal-to-noise ratio and downstream stability
before and after. **Decision:** regularise or retain the original scale if the
noise amplification harms the task.

### AI application: preprocessing a linear model

**Input:** training features with correlated scales. **Mechanism:** fit whitening
on training data, then apply the frozen mean and transform to validation/test.
**Output:** decorrelated unit-variance training coordinates. **Inspect:** compare
optimisation trajectory, coefficient stability, and held-out performance.
**Decision:** keep whitening only if its benefits survive the task and monitoring
checks; the identity covariance is a training-data property, not a universal
guarantee under drift.

## A small story

Whitening made a scatterplot look beautifully circular, so a pipeline was
declared improved. A later sensor revision added tiny noise in one direction and
the whitening step magnified it. The circle was mathematically correct on the
fit data; it was not evidence that the new representation was robust.

## Two ways to see it

### Builder view

Version the fitted mean, eigenvectors, eigenvalues, denominator, threshold, and
regularisation. At inference, reject or route rows with non-finite values and
record whether the covariance drifted outside the training envelope.

### Visual view

Covariance turns a unit circle into an ellipse: eigenvectors set its axes and
eigenvalues set squared axis lengths. Whitening rotates the ellipse upright and
rescales it to a circle; a tiny original axis is stretched the most.

### Computational view

The following code uses ZCA whitening: it returns to the original coordinate
orientation after decorrelation.

```python
import numpy as np

Xc = np.array([[-1., -1.], [0., 1.], [1., 0.], [0., 0.]])
S = Xc.T @ Xc / (len(Xc) - 1)
lam, Q = np.linalg.eigh(S)
eps = 1e-12
W_zca = Q @ np.diag(1.0 / np.sqrt(np.maximum(lam, eps))) @ Q.T
Z_zca = Xc @ W_zca

cov_zca = Z_zca.T @ Z_zca / (len(Z_zca) - 1)
assert np.allclose(cov_zca, np.eye(2), atol=1e-10)
```

The `maximum` is safe only when the threshold policy is explicit. For a truly
singular direction, it produces a regularised/pseudoinverse-like transform, not
exact whitening.

## Hands-on

Create a covariance-and-whitening report for the correlated fixture, a scaled
version, and a fixture with a tiny noise mode. Include means, covariance,
eigenpairs, condition estimate, whitening matrix, post-transform covariance, and
a signal-to-noise or downstream comparison.

**Failure fixture:** whiten with `X.T @ X` without centring, or invert a zero
eigenvalue directly. **Tests:** assert the input is centred, covariance is
symmetric PSD within tolerance, and the passing transform has post-covariance
near identity. **Reset:** restore the training mean and a documented eigenvalue
threshold, rerun, and label any regularised mode in the report.

## Checkpoint

- [ ] Compute the covariance of the four centred rows in Example A.
- [ ] Explain what a positive off-diagonal covariance says and does not say.
- [ ] Derive why `QΛ⁻¹ᐟ²` produces identity covariance when all eigenvalues are
  positive.
- [ ] Explain why whitening can amplify a small-variance noise direction.

## What this does not solve

Whitening does not make features independent in a nonlinear sense, remove drift,
preserve causal meaning, or guarantee fair performance. It can erase useful
scale, amplify noise, and leak information if fitted outside the training split.
An identity sample covariance is not proof of a good probabilistic model.

## Continue, go deeper, apply it

- Continue: Condition numbers, stability, and practical solvers
- Go deeper: Probability and statistics for ML
- Apply it: Features, leakage, and missingness
