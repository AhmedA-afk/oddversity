---
title: "Diagonalisation and powers of a transformation"
track: "maths-foundations"
status: live
summary: "If a matrix A has a basis of independent eigenvectors, write."
duration: "6 min read"
---

## The short answer

If a matrix `A` has a basis of independent eigenvectors, write
`A=SΛS⁻¹`, where `Λ` is diagonal. Then repeated application is
`Aᵏ=SΛᵏS⁻¹`: each eigen-coordinate is multiplied by `λᵏ`. This turns a costly
or opaque repeated transformation into a mode-by-mode calculation, but it only
works when the eigenvectors span the space and when numerical conditioning is
acceptable. A defective matrix needs another representation.

## Why this matters

Iterative algorithms, discrete dynamical systems, Markov-style updates, graph
propagation, and recurrent linear layers all apply an operator repeatedly. The
long-run result depends on its modes: magnitudes `|λ|<1` decay, `|λ|>1` grow,
and negative or complex eigenvalues can alternate or rotate. Diagonalisation
exposes this mechanism rather than asking a black-box matrix-power call to hide it.

It is also a good warning about assumptions. A formula that is mathematically
valid for a diagonalizable matrix can silently fail when eigenvectors are
dependent or when `S` is badly conditioned.

## How it works

Let the columns of `S` be eigenvectors `vᵢ`. The matrix equation
`AS=SΛ` says that `A` acts as diagonal scaling in the eigenvector coordinates.
If `S` is invertible, multiply on the right by `S⁻¹`:

```text
A = SΛS⁻¹
Aᵏ = (SΛS⁻¹)(SΛS⁻¹)... = SΛᵏS⁻¹
Λᵏ = diag(λ₁ᵏ, ..., λₙᵏ).
```

For `k=0`, define `A⁰=I`. For a defective matrix, one can use a Jordan form in
exact theory, but Jordan bases can be numerically fragile; repeated squaring,
Schur methods, or an application-specific recurrence is often the better
computational choice.

## Worked examples and variations

The cases are illustrative fixtures. Inspect reconstruction and compare powers
against a trusted direct computation.

### Example A: a symmetric matrix in its eigenbasis

**Input:** `A=[[2,1],[1,2]]`, whose eigenvalues are `3` and `1`. **Mechanism:**
with the orthonormal eigenvector matrix
`S=(1/√2)[[1,1],[1,−1]]`, compute `Λ³=diag(27,1)`. **Output:**

```text
A³ = [[14, 13],
      [13, 14]].
```

**Inspect:** direct multiplication gives the same matrix, and a vector aligned
with `(1,1)` is multiplied by `27`. **Decision:** use the modal form when many
powers or long-run growth questions are required.

### Example B: decay, growth, and sign change

**Input:** `Λ=diag(0.8,−1.1)` and a state with coordinates `(5,2)` in that basis.
**Mechanism:** after `k` steps the coordinates are `(5·0.8ᵏ, 2·(−1.1)ᵏ)`.
**Output:** the first mode decays; the second grows in magnitude and alternates
sign. **Inspect:** plot each coordinate separately instead of looking only at
the total norm. **Decision:** a stable-looking average can hide one unstable
mode that eventually dominates.

### Boundary case: the zeroth and first powers

**Input:** any square `A`. **Mechanism:** `A⁰=I` and `A¹=A`; diagonalisation
must reproduce these identities. **Output:** no transformation at step zero,
the original transformation at step one. **Inspect:** an implementation that
returns zeros for `k=0` or rejects a zero exponent has an API/definition bug.
**Decision:** include `k=0` in tests before trusting a recurrence.

### Counterexample: a matrix without an eigenbasis

**Input:** `J=[[1,1],[0,1]]`. **Mechanism:** only one independent eigenvector
exists, so no invertible `S` made of eigenvectors exists. **Output:** the
diagonalisation formula is unavailable, although direct powers satisfy
`Jᵏ=[[1,k],[0,1]]`. **Inspect:** the off-diagonal grows linearly even though
the only eigenvalue is one. **Decision:** do not infer all repeated behaviour
from eigenvalue magnitudes when the matrix is defective.

### AI application: repeated message propagation

**Input:** a graph or feature-propagation operator `A` applied to a state `h`.
**Mechanism:** repeated multiplication amplifies or damps spectral modes.
**Output:** a smooth dominant mode may remain while distinctions in other modes
vanish. **Inspect:** track singular/eigen components and task performance by
depth, not only the aggregate norm. **Decision:** introduce residual paths,
normalisation, or a shallower operator only after measuring which mode is lost.

## A small story

A repeated-update demo appeared stable for the first ten steps because a decaying
mode dominated its initial state. A small component along an eigenvalue just above
one eventually took over. Decomposing the state by eigenmode made the delayed
failure predictable; a single plot of the total norm did not.

## Two ways to see it

### Builder view

Record `S`, `Λ`, `S⁻¹`, the condition number of `S`, exponent `k`, and the
reconstruction error. The diagonal representation is an optimisation with a
precondition: `rank(S)=n`. If that assertion fails, route to a direct or
Schur/SVD-based method instead of forcing an inverse.

### Visual view

In the eigenbasis, a square becomes a rectangle after one application and each
axis is scaled independently at every step. Transforming back tilts the picture,
but the mode-by-mode scaling is still what drives the shape.

### Computational view

```python
import numpy as np

A = np.array([[2., 1.], [1., 2.]])
values, S = np.linalg.eigh(A)
power = 3
modal = S @ np.diag(values ** power) @ S.T  # S is orthogonal here
direct = np.linalg.matrix_power(A, power)

assert np.allclose(modal, direct)
assert np.allclose(S.T @ S, np.eye(2))
```

For a general diagonalizable matrix, use `S @ np.diag(values**k) @ inv(S)`
only after checking `S` is full rank and not dangerously ill-conditioned.

## Hands-on

Create a mode report for the symmetric matrix and for a diagonal matrix with one
decaying and one growing eigenvalue. Plot each modal coordinate over ten steps,
then compare the diagonalised power with `np.linalg.matrix_power`.

**Failure fixture:** send the Jordan block through a helper that blindly inverts
its eigenvector matrix. **Tests:** assert full rank for `S`, verify
`A @ S ≈ S @ Λ`, and compare `Aᵏ` with the chosen implementation. The defective
fixture must route to direct powers and show the linear off-diagonal term.
**Reset:** restore the symmetric fixture, use its orthogonal eigensystem, and
rerun the `k=0`, `k=1`, and `k=3` assertions.

## Checkpoint

- [ ] Derive `Aᵏ=SΛᵏS⁻¹` from `A=SΛS⁻¹`.
- [ ] Compute the third power of `[[2,1],[1,2]]` using its eigenvalues.
- [ ] Explain what eigenvalues below, above, and equal to one do to a mode.
- [ ] State why the Jordan block is a counterexample to “every matrix can be
  diagonalised.”

## What this does not solve

Diagonalisation does not guarantee a stable numerical basis, a good long-run
model, or a meaningful interpretation of each mode. Non-normal matrices can
show transient growth even when eigenvalue magnitudes look benign. A spectral
description also does not replace task-level evaluation of an AI system.

## Continue, go deeper, apply it

- Continue: Symmetric matrices, quadratic forms, and definiteness
- Go deeper: Time-series and temporal validation
- Apply it: Neural networks and representations
