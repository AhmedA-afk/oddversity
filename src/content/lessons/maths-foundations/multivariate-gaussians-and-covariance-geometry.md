---
title: "Multivariate Gaussians and covariance geometry"
track: "maths-foundations"
status: live
summary: "A multivariate Gaussian uses a mean vector μ and covariance matrix Σ to describe location, scale, and linear dependence."
duration: "4 min read"
---

## The short answer

A multivariate Gaussian uses a mean vector `μ` and covariance matrix `Σ` to describe location, scale, and linear dependence. Equal-density contours satisfy `(x−μ)ᵀΣ⁻¹(x−μ)=constant`, forming ellipses in two dimensions. Conditioning shifts the mean and reduces covariance using a Schur complement; `Σ` must be positive semidefinite to describe valid variance.

## Why this matters

Features rarely vary independently. Covariance geometry explains elongated
clusters, Mahalanobis distance, Gaussian noise, and why conditioning on one
measurement changes uncertainty in another. A matrix with a negative variance
direction can pass through a numerical pipeline but cannot be a covariance model.

## How it works

For a non-degenerate `d`-vector, the density is

`f(x)=(2π)^{-d/2}|Σ|^{-1/2} exp[−(1/2)(x−μ)ᵀΣ⁻¹(x−μ)]`,

with symmetric positive definite `Σ`. Positive semidefinite matrices are valid
covariances, though singular ones describe a lower-dimensional distribution and
need care because the ordinary density formula uses an inverse and determinant.

Partition `X=(X₁,X₂)` and `Σ` into matching blocks. If `Σ₂₂` is invertible,

`E[X₁|X₂=x₂]=μ₁+Σ₁₂Σ₂₂⁻¹(x₂−μ₂)`

and

`Cov(X₁|X₂)=Σ₁₁−Σ₁₂Σ₂₂⁻¹Σ₂₁`.

The second matrix is no larger in the positive-semidefinite order: observing
`X₂` removes uncertainty under this model.

**Derivation:** complete the square in the joint Gaussian exponent after fixing
`X₂=x₂`. The linear term gives the conditional mean, and the remaining
quadratic term has precision equal to the Schur-complement inverse. Positive
semidefiniteness is required because every variance `vᵀΣv` must be non-negative.

### Numerical and visual perspective

Plot covariance ellipses from eigenvectors and eigenvalues of `Σ`; eigenvectors
give axes and eigenvalues give squared axis scales. Check symmetry, eigenvalues,
and a quadratic form before inverting. A heatmap of `Σ` shows sign and magnitude
but not the full geometry.

### An illustrative story

A two-feature anomaly detector treated correlated dimensions as independent and
flagged ordinary points along the natural diagonal as extreme. The ellipse—not
two separate intervals—was the relevant geometry. This is illustrative.

## Worked examples and variations

### Example A: independent coordinates

**Input:** `μ=(0,0)`, `Σ=diag(1,4)`. **Mechanism:** contours are axis-aligned
ellipses with vertical axis twice the horizontal axis. **Output:** covariance
zero but unequal marginal spreads. **Inspect:** eigenvectors are coordinate
axes. **Decision:** standardise scale, but do not invent correlation.

### Example B: correlated geometry

**Input:** `Σ=[[1,.8],[.8,1]]`. **Mechanism:** positive off-diagonal covariance
rotates the major axis toward `y=x`; eigenvalues are `1.8` and `.2`.
**Output:** narrow uncertainty perpendicular to the diagonal. **Inspect:**
`det(Σ)=.36>0` and both eigenvalues are positive. **Decision:** use a Mahalanobis
distance aligned to the covariance, not an axis-wise Euclidean threshold.

### Example C: conditional Gaussian update

**Input:** `μ=0`, `Σ=[[1,.5],[.5,1]]`, observe `X₂=2`.
**Mechanism:** conditional mean of `X₁` is `.5·2=1`; variance is
`1−.5²=.75`. **Output:** observation shifts the expected first coordinate and
reduces its variance. **Inspect:** the covariance block and units match.
**Decision:** use the conditional only when the joint Gaussian assumption is
reasonable.

### Boundary case: singular covariance

**Input:** `Y=X`, so `Σ=[[1,1],[1,1]]`. **Mechanism:** determinant is zero and
one direction has zero variance. **Output:** all mass lies on a line; the ordinary
2-D density formula is not usable. **Inspect:** eigenvalues include zero.
**Decision:** reduce dimension or use a singular-Gaussian treatment.

### Counterexample: non-PSD covariance

**Input:** `Σ=[[1,2],[2,1]]`. **Mechanism:** eigenvalues are 3 and −1, so some
vector has negative quadratic variance. **Output:** invalid covariance matrix.
**Inspect:** symmetry alone is insufficient; check eigenvalues or principal
minors. **Decision:** repair the estimation procedure, not just the plot.

## Two ways to see it

### Builder view

Use eigendecomposition or a stable factorisation to inspect axes, determinant,
and conditioning. Keep the feature order beside the matrix; swapping columns
silently changes the model.

### Systems or reviewer view

Ask whether covariance comes from the target population and whether tails are
Gaussian. A clean ellipse can be a convenient approximation, not a guarantee
about rare points or causal structure.

## Hands-on

Construct the two 2-D covariance matrices from Examples A and B. Check symmetry
and eigenvalues, draw ellipses, and implement the conditional mean/variance for
Example C.

**Deliberate failure:** replace `.8` with `2` in the correlation matrix and
skip the PSD check. **Test:** the negative eigenvalue must stop ellipse or
inverse calculations with a named error. **Reset:** restore `.8`, rerun, and
compare the empirical covariance of simulated samples. **No-code route:** draw
the principal axes from a covariance table and test `vᵀΣv≥0` for several vectors.

## Checkpoint

- [ ] Read scale and correlation from a 2×2 covariance matrix.
- [ ] Explain ellipse axes using eigenvectors/eigenvalues.
- [ ] Calculate a simple conditional Gaussian mean and variance.
- [ ] Detect singular and non-PSD covariance matrices.

## What this does not solve

Covariance geometry captures second-order structure; it does not make tails
Gaussian, features causal, or a covariance estimate stable in small samples.
Regularisation may be needed for high-dimensional or nearly singular matrices.
Beta and Dirichlet distributions model uncertainty over probabilities instead of
continuous feature vectors.

## Continue, go deeper, apply it

- Continue: Beta and Dirichlet priors
- Go deeper: Linear algebra for ML
- Apply it: Likelihood, priors, and sampling assignment
