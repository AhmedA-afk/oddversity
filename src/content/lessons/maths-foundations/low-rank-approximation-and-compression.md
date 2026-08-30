---
title: "Low-rank approximation and compression"
track: "maths-foundations"
status: live
summary: "Truncating an SVD to the first k singular values gives the best rank-k."
duration: "5 min read"
---

## The short answer

Truncating an SVD to the first `k` singular values gives the best rank-`k`
approximation to a matrix under both Frobenius and spectral norm among all
rank-`k` matrices. The squared Frobenius error is the sum of squared discarded
singular values. Choose `k` from an error or memory budget, then test what the
discarded directions mean for the task: low reconstruction error can still erase
a rare but important feature.

## Why this matters

Compression reduces storage, bandwidth, and sometimes inference cost. It also
forces a representation choice: only `k` independent directions survive. In AI,
the dominant numerical energy may describe background structure while a small
singular mode carries a minority class, a sharp boundary, or a safety signal.
“Keeps 95% of variance” is therefore a reconstruction statement, not a quality
or fairness guarantee.

## How it works

Given `A=UΣVᵀ` with `σ₁≥...≥σᵣ`, define

```text
Aₖ = U[:, :k] diag(σ₁,...,σₖ) V[:k, :]
||A−Aₖ||_F² = Σᵢ>k σᵢ².
```

The Eckart–Young result says no other rank-`k` matrix has smaller Frobenius or
spectral error. A retained-energy rule chooses the smallest `k` such that
`Σᵢ≤k σᵢ² / Σᵢ σᵢ²` exceeds a threshold. A fixed-byte budget may choose `k`
using the factor storage instead. These are different decisions and should not
be conflated.

## Worked examples and variations

The values are illustrative fixtures. Report both numerical error and a task-
relevant inspection.

### Example A: choose a rank from an error budget

**Input:** singular values `(5,2,0.5)`. **Mechanism:** total squared energy is
`25+4+0.25=29.25`. Rank one retains `25/29.25≈85.5%`; its squared error is
`4.25`. Rank two retains `29/29.25≈99.1%`; its squared error is `0.25`.
**Output:** rank one or two depending on the budget. **Inspect:** use the
unsquared error `√4.25≈2.06` if the report is in Frobenius norm. **Decision:**
state the norm and threshold before selecting `k`.

### Example B: a rank-one repeated pattern

**Input:** `A=[[1,1],[1,1]]`. **Mechanism:** the two rows/columns repeat, so one
singular value is `2` and the other is zero. **Output:** rank-one compression is
exact. **Inspect:** reconstruction error is zero even though the matrix has four
entries. **Decision:** count independent structure, not raw element count.

### Boundary case: rank zero and full rank

**Input:** `k=0` or `k=min(m,n)`. **Mechanism:** `A₀=0`; full truncation keeps
every singular mode and returns `A` exactly. **Output:** zero or exact matrix.
**Inspect:** test both ends of the rank slider. **Decision:** reject a negative
or oversized `k` rather than relying on slicing quirks.

### Counterexample: low error erases a task-critical mode

**Input:** a matrix `A=B+εC`, where `B=[[1,1],[1,1]]` is a dominant background
and `C=[[1,−1],[−1,1]]` is a small contrast pattern. **Mechanism:** rank one
keeps `B` and discards most of `C`. **Output:** excellent reconstruction of the
background but no contrast signal. **Inspect:** evaluate a classifier or detector
that depends on the contrast, not only the matrix norm. **Decision:** increase
rank, preserve a task direction explicitly, or do not compress this representation.

### AI application: compressed embedding index

**Input:** an embedding matrix and a chosen rank. **Mechanism:** project/index
using `Aₖ`. **Output:** lower storage and changed distances. **Inspect:** compare
nearest-neighbour recall, subgroup performance, and latency before/after. **Decision:**
ship only if the representation contract includes an error and task regression
gate.

## A small story

A compression report celebrated a tiny reconstruction error until a lookup demo
lost a rare category. The category lived in a low-energy direction, so it was
cheap numerically and expensive semantically. Adding a task-level retrieval test
changed the rank decision more than another decimal place of matrix error did.

## Two ways to see it

### Builder view

Make `k` a versioned configuration with the singular spectrum, retained-energy
percentage, norm, memory estimate, and task metrics attached. The compressed
artifact must be reproducible from the original matrix and the recorded `k`.

### Visual view

For an image-like matrix, the first modes often capture broad smooth structure;
later modes add edges, texture, or fine distinctions. A heatmap of `A−Aₖ` shows
what the error budget actually removed instead of hiding it in one scalar.

### Computational view

```python
import numpy as np

def truncated_svd(A, k):
    if not 0 <= k <= min(A.shape):
        raise ValueError("rank k is outside the matrix bounds")
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return (U[:, :k] * s[:k]) @ Vt[:k, :]

A = np.array([[1., 1.], [1., 1.]])
assert np.allclose(truncated_svd(A, 1), A)
assert np.allclose(truncated_svd(A, 0), np.zeros_like(A))
```

For `k=0`, the empty product returns the correct zero-shaped multiplication in
this implementation; keep the explicit bounds check so API behaviour is clear.

## Hands-on

Create a compression report for a small matrix and three ranks. Include the
singular spectrum, retained energy, Frobenius and spectral reconstruction error,
factor storage estimate, a residual heatmap, and one downstream metric.

**Failure fixture:** choose rank only by retained energy for the background-plus-
contrast matrix. **Tests:** assert the reported norm equals the discarded
singular-value tail and assert a task fixture detects the erased contrast.
**Reset:** restore the original matrix, rerun with a larger rank or an explicit
task-preserving constraint, and record why the new choice is defensible.

## Checkpoint

- [ ] Compute the rank-one and rank-two error budgets for singular values
  `(5,2,0.5)`.
- [ ] Explain why truncated SVD is optimal for a stated matrix norm.
- [ ] Give a concrete reason high retained energy may not preserve model quality.
- [ ] State what must be versioned when a compressed representation is shipped.

## What this does not solve

Low-rank approximation does not preserve every downstream distance, class, rare
event, or semantic feature. The optimality claim is about a matrix norm and a
fixed rank, not about the business objective. Randomised or approximate SVD also
introduces an algorithmic error that must be measured separately.

## Continue, go deeper, apply it

- Continue: PCA from variance maximisation and SVD
- Go deeper: PCA and dimensionality reduction
- Apply it: Generalisation and evaluation
