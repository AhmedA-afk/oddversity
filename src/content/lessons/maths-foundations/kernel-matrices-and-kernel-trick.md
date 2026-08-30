---
title: "Kernel matrices and the kernel trick"
track: "maths-foundations"
status: live
summary: "A kernel is a similarity function that acts like an inner product in some."
duration: "6 min read"
---

## The short answer

A kernel is a similarity function that acts like an inner product in some
feature space: `k(x,z)=φ(x)ᵀφ(z)` without requiring `φ(x)` to be written down.
For data points `x₁,…,xₙ`, the Gram matrix `Kᵢⱼ=k(xᵢ,xⱼ)` must be symmetric and
positive semidefinite (PSD): `cᵀKc≥0` for every coefficient vector `c`. The
kernel trick lets linear algorithms operate on nonlinear feature relationships,
but a plausible or nonnegative similarity is not automatically a valid kernel.

## Why this matters

Kernels provide a controlled way to add nonlinear geometry to regression,
classification, clustering, and similarity search. The PSD condition is what
allows the matrix to represent inner products and squared norms consistently.
If it fails, an algorithm that assumes a valid Gram matrix may become unstable or
lose its geometric interpretation.

The kernel is also a modelling choice. A mathematically valid kernel can still
be a poor similarity for the task, and a high-dimensional feature map can make
computation expensive through an `n×n` Gram matrix.

## How it works

Suppose `φ(x)` is an explicit feature map. Then for any coefficients `c`,

```text
cᵀKc = ΣᵢΣⱼ cᵢ cⱼ φ(xᵢ)ᵀφ(xⱼ)
       = ||Σᵢ cᵢ φ(xᵢ)||² ≥ 0.
```

That derivation explains PSD. For the polynomial kernel
`k(x,z)=(xz+1)²` in one dimension,

```text
(xz+1)² = x²z² + 2xz + 1
         = [x², √2x, 1]ᵀ [z², √2z, 1].
```

The algorithm can use `k(x,z)` directly rather than constructing the three
features. For a finite dataset, verify `K≈Kᵀ` and that its minimum eigenvalue is
not materially negative; tiny negatives may be floating-point noise, not a free
pass.

## Worked examples and variations

The cases are illustrative. Build the finite Gram matrix and inspect its spectrum
before making a kernel claim.

### Example A: linear Gram matrix

**Input:** scalar points `x=[0,1,2]`, with `k(x,z)=xz`. **Mechanism:**

```text
K = [[0, 0, 0],
     [0, 1, 2],
     [0, 2, 4]].
```

This is `xxᵀ`, so `cᵀKc=(cᵀx)²≥0`. **Output:** a PSD rank-one Gram matrix.
**Inspect:** two eigenvalues are zero because the explicit feature space is one
dimensional. **Decision:** singular is valid; PSD does not mean positive definite.

### Example B: polynomial feature map without explicit expansion

**Input:** `x=1`, `z=2`, `k(x,z)=(xz+1)²`. **Mechanism:** kernel value is
`(2+1)²=9`; explicit features are `[1,√2,1]` and `[4,2√2,1]` whose dot
product is `4+4+1=9`. **Output:** equal inner products. **Inspect:** this is
the kernel trick, not magic new information. **Decision:** use the kernel when
the implicit feature geometry matches the task and memory budget.

### Boundary case: duplicate points and numerical zero eigenvalues

**Input:** two identical observations. **Mechanism:** corresponding Gram rows
and columns are identical, so `K` is singular. **Output:** a zero eigenvalue and
no unique coordinate for the duplicate distinction. **Inspect:** use a tolerance
when checking PSD. **Decision:** retain the duplicate if its multiplicity matters,
but do not expect strict positive definiteness.

### Counterexample: symmetric, positive similarities that are not PSD

**Input:** a three-point chain similarity:

```text
K = [[1, 1, 0],
     [1, 1, 1],
     [0, 1, 1]].
```

**Mechanism:** it is symmetric and all entries are nonnegative, but its smallest
eigenvalue is `1−√2<0`. Equivalently, some coefficient vector has
`cᵀKc<0`. **Output:** it cannot be an inner-product Gram matrix. **Inspect:**
do not certify a kernel from symmetry or pairwise intuition alone. **Decision:**
change the similarity, repair/project the matrix with a documented method, or use
an algorithm that does not require PSD.

### AI application: nonlinear decision boundary

**Input:** points that are hard to separate with a line in raw coordinates.
**Mechanism:** an RBF or polynomial kernel supplies inner products in an implicit
feature space where a linear separator may exist. **Output:** nonlinear boundary
in the original space. **Inspect:** tune bandwidth/degree on training folds,
check Gram conditioning, and evaluate on held-out data. **Decision:** prefer the
simplest representation that meets the task and compute budget; a kernel does
not remove overfitting or data leakage.

## A small story

A similarity matrix looked intuitive in a heatmap, so it was handed to a method
that assumed a Gram matrix. The heatmap showed symmetry and positive entries but
not the negative eigenvalue. A one-line PSD check explained the downstream
instability and prevented a similarity design from being mistaken for a geometry.

## Two ways to see it

### Builder view

Treat a kernel as a function with a finite-set test suite: symmetry, diagonal
meaning, PSD spectrum, conditioning, duplicate behaviour, and task-level
validation. Cache or approximate `K` only after deciding what error and memory
budget are acceptable.

### Visual view

The kernel changes the space in which angles and distances are measured. Points
that form a ring in two dimensions may become separable after a suitable feature
map. The Gram matrix is the table of all pairwise inner products in that hidden
space; its eigenvalues reveal how many independent directions it contains.

### Computational view

```python
import numpy as np

def polynomial_kernel(x, z):
    return (x @ z + 1.0) ** 2

X = np.array([[0.], [1.], [2.]])
K = np.array([[polynomial_kernel(x, z) for z in X] for x in X])
tol = 1e-10
assert np.allclose(K, K.T)
assert np.linalg.eigvalsh(K).min() >= -tol

K_bad = np.array([[1., 1., 0.], [1., 1., 1.], [0., 1., 1.]])
assert np.linalg.eigvalsh(K_bad).min() < 0
```

For large datasets, the `n×n` matrix can dominate memory and runtime even when
each kernel evaluation is cheap. Approximation methods need their own validation.

## Hands-on

Create a kernel audit for linear, polynomial, and RBF kernels on a small dataset.
For each, record the formula, hyperparameters, Gram matrix, symmetry error,
eigenvalue spectrum, condition estimate, memory size, and one downstream metric.

**Failure fixture:** include the three-point chain matrix and certify it using
only symmetry and nonnegative entries. **Tests:** assert the valid kernels pass
the PSD check within tolerance and the chain fails with its negative eigenvalue.
Also test duplicate points and sign/scale conventions. **Reset:** restore a
documented valid kernel and rerun the audit; if projecting an invalid matrix onto
the PSD cone, record that the repaired matrix is a new similarity object.

## Checkpoint

- [ ] Derive `cᵀKc=||Σᵢcᵢφ(xᵢ)||²` for a Gram matrix.
- [ ] Expand `(xz+1)²` into an explicit feature map and verify one kernel value.
- [ ] Explain why a singular PSD matrix is valid but not positive definite.
- [ ] Identify the failure in certifying a kernel from symmetry and nonnegative
  entries alone.

## What this does not solve

PSD validity does not choose a useful similarity, prevent overfitting, remove
feature leakage, or make an `n×n` matrix cheap. Indefinite-kernel workarounds
change algorithmic guarantees. Hyperparameters, scaling, duplicate handling, and
distribution shift still require task-level evaluation.

## Continue, go deeper, apply it

- Continue: Nearest neighbours and kernels
- Go deeper: PCA and dimensionality reduction
- Apply it: Generalisation and evaluation
