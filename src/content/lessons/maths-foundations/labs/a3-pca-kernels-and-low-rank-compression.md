---
title: "A3 · PCA, kernels, and low-rank compression lab"
track: "maths-foundations"
status: live
summary: "This lab turns the M3 decomposition toolkit into a checked representation."
duration: "13 min read"
---

## The short answer

This lab turns the M3 decomposition toolkit into a checked representation
decision. You will centre data, derive and compute PCA through SVD, reconstruct
it at ranks 0, 1, and 2, report explained variance and reconstruction error,
test a valid kernel Gram matrix against a deliberately indefinite matrix, and
show how unscaled features can rotate PCA toward the largest unit. The final
artifact is a reproducible report with tests, a failure fixture, reset evidence,
and a short decision memo.

## Why this matters

PCA and low-rank compression optimise a stated matrix criterion; they do not
automatically preserve a downstream class, rare signal, or semantic feature.
Likewise, a symmetric similarity table is not automatically a valid kernel:
positive semidefiniteness is the geometric condition that makes it an inner
product table. The lab makes those assumptions visible before a library call or
compressed representation is used in an AI system.

The lab is the concrete A3 deliverable in the mathematics assignment
sequence. NumPy verifies the hand work, but the report must
retain the equations, intermediate values, tolerances, and interpretation.

## Lab contract

- **Runtime:** Python 3 with NumPy; record exact versions.
- **Data:** the fixed fixtures below; no random seed is needed for the required
  path.
- **Convention:** rows are observations, columns are features; PCA covariance
  uses the sample denominator `n−1`.
- **Tolerance:** start with `1e−10` for this small well-conditioned fixture and
  state any change.
- **Required output:** hand calculations, tables, code output, labelled plots or
  matrix displays, failure/reset evidence, and a 150–300 word decision memo.

## How it works

Use this five-observation matrix:

```text
X = [(-2, -1),
     (-1, -2),
     ( 0,  0),
     ( 1,  2),
     ( 2,  1)]
```

The column mean is `μ=(0,0)`, so this fixture is already centred. In a general
dataset, compute `X_c=X−1μᵀ` first. PCA finds unit directions `w` that maximise
the variance of the projected scores `X_cw`:

```text
var(X_cw) = (1/(n−1)) ||X_cw||²
           = wᵀ [X_cᵀX_c/(n−1)] w.
```

The Lagrange multiplier condition for `||w||=1` gives
`S w=λw`, where `S=X_cᵀX_c/(n−1)`. If `X_c=UΣVᵀ`, then
`S=V(Σ²/(n−1))Vᵀ`: the right singular vectors are PCA directions and
`σᵢ²/(n−1)` are their explained variances.

For a rank-`k` reconstruction of centred data, use
`X̂_c,k=U[:, :k]Σ[:k, :k]V[:k, :]ᵀ`; add `μ` back when reconstructing the
original coordinate system. The squared Frobenius error is the discarded
singular-value energy:

```text
||X_c−X̂_c,k||_F² = Σᵢ>k σᵢ².
```

For a kernel `k(x,z)`, build `Kᵢⱼ=k(xᵢ,xⱼ)`. A valid finite Gram matrix is
symmetric PSD, meaning `cᵀKc≥0` for every coefficient vector `c`.

## Worked examples and variations

Write exact forms before decimals. Keep the sample denominator visible.

### 1. Centre and compute covariance

Show that `μ=(0,0)` and therefore `X_c=X`. Compute

```text
X_cᵀX_c = [[10,  8],
           [ 8, 10]]
S = X_cᵀX_c/(5−1)
  = [[2.5, 2.0],
     [2.0, 2.5]].
```

Explain what the positive off-diagonal covariance says about these two columns,
and what it does not say about causality.

### 2. Eigenvectors, singular values, and explained variance

For a matrix of the form `[[a,b],[b,a]]`, test the two directions

```text
v₁ = (1, 1)/√2
v₂ = (1,−1)/√2.
```

Show that `S v₁=4.5v₁` and `S v₂=0.5v₂`. Then derive the SVD singular values
from `σᵢ²=(n−1)λᵢ`:

```text
σ₁ = √18,  σ₂ = √2
total explained variance = 4.5+0.5 = 5
ratios = [4.5/5, 0.5/5] = [0.90, 0.10].
```

The signs of singular vectors may flip in a library output; compare directions
up to sign, reconstruction, and eigenvalues.

### 3. Reconstruct at three ranks

Use `v₁` for the rank-one reconstruction. The rank-one projection of the first
row is

```text
((-2,−1)·v₁)v₁ = (−3/√2)v₁ = (−1.5,−1.5).
```

Complete the analogous reconstruction for every row. Your report must contain
this table:

| Rank `k` | Retained variance | Squared discarded energy | Frobenius error | What survives |
|---:|---:|---:|---:|---|
| 0 | 0% | 20 | `√20 ≈ 4.472` | only the mean after adding `μ` back |
| 1 | 90% | 2 | `√2 ≈ 1.414` | diagonal direction `(1,1)` |
| 2 | 100% | 0 | 0 | all centred variation |

Explain why rank one is numerically good here but is not automatically the
right rank for a downstream task.

### 4. Kernel Gram matrices by hand

For scalar points `[0,1,2]`, first use the linear kernel `k(x,z)=xz`:

```text
K_linear = [[0, 0, 0],
            [0, 1, 2],
            [0, 2, 4]].
```

Show that `K_linear=xxᵀ` and therefore
`cᵀK_linear c=(cᵀx)²≥0`. Then use the polynomial kernel
`k(x,z)=(xz+1)²` and verify one entry, such as
`k(1,2)=(2+1)²=9`.

Finally, inspect the tempting but invalid matrix

```text
K_bad = [[1, 1, 0],
         [1, 1, 1],
         [0, 1, 1]].
```

It is symmetric and all entries are non-negative. Test it with
`c=(1,−1,1)`: `cᵀK_bad c=−1`. One negative quadratic form is enough to disprove
PSD.

## Two ways to see it

### Geometric view

The hand calculation treats the dataset as a centred point cloud: covariance
sets its axes, eigenvectors rotate the axes, and singular values measure the
spread that each axis captures. Rank truncation keeps a subspace and displays
the discarded variation as a residual matrix.

### Computational view

The NumPy sections below turn the same claims into executable invariants:
centred means, covariance/eigenvalue agreement, reconstruction error, kernel
PSD, and sensitivity to feature units. Use the plots or matrix displays to
inspect what a scalar explained-variance number hides.

## Part 2 — deterministic NumPy PCA/SVD fixture

Run this cell and keep the printed arrays in your report. The `reconstruct`
function works for all three ranks, including the zero matrix at `k=0`.

```python
import numpy as np

X = np.array([
    [-2.0, -1.0],
    [-1.0, -2.0],
    [ 0.0,  0.0],
    [ 1.0,  2.0],
    [ 2.0,  1.0],
])
n = X.shape[0]
mu = X.mean(axis=0)
Xc = X - mu
U, s, Vt = np.linalg.svd(Xc, full_matrices=False)

explained = s**2 / (n - 1)
ratios = explained / explained.sum()

def reconstruct(k):
    if not 0 <= k <= min(Xc.shape):
        raise ValueError("rank is outside the matrix bounds")
    return (U[:, :k] * s[:k]) @ Vt[:k, :]

assert np.allclose(mu, [0.0, 0.0])
assert np.allclose(Xc.mean(axis=0), [0.0, 0.0])
assert np.allclose(Xc.T @ Xc / (n - 1), [[2.5, 2.0], [2.0, 2.5]])
assert np.allclose(explained, [4.5, 0.5])
assert np.allclose(ratios, [0.9, 0.1])
assert np.allclose(reconstruct(0), np.zeros_like(Xc))
assert np.isclose(np.linalg.norm(Xc - reconstruct(1))**2, 2.0)
assert np.allclose(reconstruct(2), Xc)

for k in (0, 1, 2):
    residual = Xc - reconstruct(k)
    retained = ratios[:k].sum()
    print(k, retained, np.linalg.norm(residual), reconstruct(k))
```

Expected retained variance is `0.0`, `0.9`, and `1.0`; expected Frobenius error
is `√20`, `√2`, and `0`. Your `Vt[0]` may be either
`[1/√2,1/√2]` or its negative. Use `abs` or an outer product in direction
checks instead of assuming a sign.

### Add-back check for a nonzero mean

The required fixture has zero mean, so add one test that proves your report did
not forget the general case:

```python
shift = np.array([10.0, -3.0])
X_shifted = X + shift
shifted_mu = X_shifted.mean(axis=0)
shifted_U, shifted_s, shifted_Vt = np.linalg.svd(
    X_shifted - shifted_mu, full_matrices=False
)
rank2_centered = (shifted_U * shifted_s) @ shifted_Vt
assert np.allclose(rank2_centered + shifted_mu, X_shifted)
```

This is the reconstruction of the original data. Reconstructing centred values
without adding the fitted mean back would move every observation to the wrong
origin.

## Part 3 — PSD kernel test

Build and test two valid kernels and the deliberate invalid similarity matrix.
The quadratic-form check complements the eigenvalue check.

```python
def polynomial_kernel(x, z):
    return (x @ z + 1.0) ** 2

def rbf_kernel(x, z, gamma=1.0):
    difference = x - z
    return np.exp(-gamma * (difference @ difference))

Z = np.array([[0.0], [1.0], [2.0]])
K_poly = np.array([[polynomial_kernel(x, z) for z in Z] for x in Z])
K_rbf = np.array([[rbf_kernel(x, z) for z in Z] for x in Z])
tol = 1e-10

for K in (K_poly, K_rbf):
    assert np.allclose(K, K.T, atol=tol)
    assert np.linalg.eigvalsh(K).min() >= -tol

c = np.array([1.0, -1.0, 1.0])
K_bad = np.array([[1.0, 1.0, 0.0],
                  [1.0, 1.0, 1.0],
                  [0.0, 1.0, 1.0]])
assert np.allclose(K_bad, K_bad.T)
assert c @ K_bad @ c < 0.0
assert np.linalg.eigvalsh(K_bad).min() < -tol

print("poly eigenvalues", np.linalg.eigvalsh(K_poly))
print("rbf eigenvalues", np.linalg.eigvalsh(K_rbf))
print("bad quadratic form", c @ K_bad @ c)
```

The invalid matrix is not rescued by symmetry, positive entries, or a pleasing
heatmap. If you project it onto the PSD cone as an extension, label the result a
new repaired similarity object and report the change; do not silently certify
the original matrix.

## Part 4 — unscaled-feature failure

The centred fixture gives both columns comparable numerical spread. Simulate a
unit mismatch by multiplying only the second feature by 100. This should change
the raw PCA direction even though the underlying pattern has not changed.

```python
X_unscaled = Xc * np.array([1.0, 100.0])
_, s_unscaled, Vt_unscaled = np.linalg.svd(X_unscaled, full_matrices=False)
raw_direction = np.abs(Vt_unscaled[0])

X_standardised = X_unscaled / X_unscaled.std(axis=0, ddof=0)
_, _, Vt_standardised = np.linalg.svd(X_standardised, full_matrices=False)
standardised_direction = np.abs(Vt_standardised[0])

assert raw_direction[1] > 0.99       # raw PCA follows the large-unit feature
assert np.allclose(
    standardised_direction,
    [1.0 / np.sqrt(2), 1.0 / np.sqrt(2)],
    atol=1e-10,
)
print("raw top direction", raw_direction)
print("standardised top direction", standardised_direction)
```

**Failure interpretation:** raw PCA answers “which direction has the largest
numeric variance in these units?” Standardised PCA answers a different question:
which direction has the largest variance after each feature is given comparable
spread. Neither is universally correct. Choose from units, task semantics, and
the downstream metric, then record the choice.

## Failure fixture, tests, and reset

Run the failures as separate cells so each cause has one diagnosis.

**Failure fixture:** the intentionally broken state combines an uncentred
matrix, an invalid rank request or mismatched SVD slice, the symmetric but
indefinite `K_bad`, and the 100× unscaled feature. **Tests:** the assertions
below must expose each failure by name rather than allowing a plausible plot or
single variance percentage to pass. **Reset:** restore the centred fixture,
aligned SVD slices, a valid kernel, and the documented scale policy before
rerunning the full suite.

1. **Uncentred PCA:** replace `Xc` with `X_shifted` in the SVD. **Test:** the
   reported mean must be nonzero and the reconstruction pipeline must subtract
   it before SVD; a check on `np.allclose(Xc.mean(axis=0), 0)` should fail before
   fitting components.
2. **Rank mismatch:** call `reconstruct(3)` on this 5×2 fixture or slice `U`
   and `Vt` at different ranks. **Test:** the function must raise the named
   bounds error or a shape assertion must fail; never silently report a rank
   outside `min(n,d)`.
3. **False kernel certification:** run only symmetry and nonnegative-entry checks
   on `K_bad`. **Test:** the negative quadratic form and eigenvalue assertion
   must reject it.
4. **Unit mismatch:** use `X_unscaled` while interpreting the raw top direction
   as a semantic feature. **Test:** the report must show the direction change and
   compare against the standardised control.

**Reset:** restore the original `X`, refit `mu`, compute `Xc`, use aligned SVD
 slices, rerun the valid kernel tests, and state whether scaling is retained or
 removed. A passing reset includes `rank2 reconstruction == Xc`, valid-kernel
 PSD, invalid-kernel rejection, and the documented preprocessing policy.

## Hands-on

Submit one notebook or report containing:

1. the centred matrix, covariance derivation, eigenpairs, singular values, and
   explained-variance ratios;
2. rank-0, rank-1, and rank-2 reconstructions with retained variance and
   Frobenius error;
3. the add-back-mean check on the shifted fixture;
4. valid polynomial/RBF Gram-matrix tests plus the invalid `K_bad` failure;
5. the unscaled-feature failure, standardised control, and metric interpretation;
6. deterministic code output, assertions, failure evidence, and reset evidence;
7. a 150–300 word decision memo: choose a preprocessing policy, rank, and
   kernel/feature representation for a stated AI task, then name one metric
   regression and one rare-signal failure you would monitor.

Use these prompts before submitting:

- Retrieve: state what `U`, `Σ`, `Vᵀ`, covariance eigenvalues, and explained
  variance mean in this fixture.
- Calculate: reproduce `S`, its two eigenpairs, and the rank-one first-row
  reconstruction by hand.
- Compute: alter `k` and inspect the residual matrix, not only its norm.
- Diagnose: explain why a symmetric nonnegative matrix can fail the PSD test.
- Review: compare raw and standardised PCA in terms of units and downstream
  meaning, not just the top direction.

## Acceptance rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25% | Correct centring/covariance derivation, SVD–PCA connection, rank reconstruction equation, and PSD condition. |
| Computation | 20% | Reproducible NumPy output, aligned slices, explained-variance/error checks, and deterministic kernel tests. |
| Interpretation | 20% | Correct rank trade-off, kernel meaning, and unscaled-feature decision tied to a stated AI task. |
| Diagnostics | 20% | Uncentred/rank/indefinite-kernel/unit failures are exposed, tested, reset, and explained with tolerances. |
| Communication | 15% | Labelled tables or plots, readable output, version/tolerance record, and a 150–300 word decision memo with limitations. |

Pass requires at least 60% overall and no zero in Mathematical model or
Diagnostics. A high retained-variance percentage without the unscaled-feature
and task-level discussion is incomplete.

## Checkpoint

- [ ] I computed and checked the mean, covariance, eigenpairs, singular values,
  and explained-variance ratios.
- [ ] My rank-0/1/2 reconstructions and Frobenius errors match the expected
  `0%/90%/100%` retained-variance pattern.
- [ ] I showed that centred SVD reconstruction plus the fitted mean recovers a
  shifted dataset.
- [ ] My valid kernel Gram matrices pass symmetry/PSD tests and `K_bad` fails a
  quadratic-form and eigenvalue test.
- [ ] My unscaled-feature fixture changes the raw top direction, and my report
  explains whether standardisation is defensible for the chosen task.
- [ ] My failure tests fail for the intended reasons, and the reset returns all
  required assertions to passing.
- [ ] My decision memo names rank, preprocessing, representation, acceptance
  metrics, and limitations.

## What this does not solve

PCA variance is not predictive, causal, semantic, or fairness importance. Low
reconstruction error does not guarantee retrieval or classification quality;
compression can erase a low-energy rare signal. PSD validity does not make a
kernel useful, well-conditioned, or cheap at scale. Fitting means, scales,
components, or kernel hyperparameters outside the training boundary can leak
information. Those claims require held-out, task-specific and subgroup-aware
evaluation.

## Continue, go deeper, apply it

- Continue: PCA from variance maximisation and SVD
- Go deeper: Kernel matrices and the kernel trick
- Apply it: PCA and dimensionality reduction in ML

## M3 reference route

- SVD
- Low-rank approximation and compression
- PCA from variance and SVD
- Covariance and whitening
- Condition numbers, stability, and practical solvers
- Kernel matrices and the kernel trick
- A3 assignment specification
