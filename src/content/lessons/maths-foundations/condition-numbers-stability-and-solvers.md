---
title: "Condition numbers, stability, and practical solvers"
track: "maths-foundations"
status: live
summary: "The condition number measures how sensitive a mathematical problem is to small."
duration: "6 min read"
---

## The short answer

The condition number measures how sensitive a mathematical problem is to small
input perturbations. For an invertible matrix, `κ₂(A)=σ_max/σ_min`; `κ=1` is
ideal, a large value warns that small data or rounding changes can produce large
solution changes, and a singular matrix has infinite condition number. Separate
three causes: an ill-conditioned problem, poor feature scaling, and a software
bug. Choose `solve`, QR, or SVD from that diagnosis, not from habit.

## Why this matters

A training run can produce different coefficients after a harmless data refresh,
a whitening transform can explode, or a regression can be impossible to
reproduce. The first question is not “which optimiser?” It is whether the input
problem itself magnifies perturbations. A stable algorithm cannot recover
information that nearly parallel columns fail to identify.

Conditioning is a property of the problem and representation; numerical
stability is a property of the algorithm’s error behaviour. Scaling can improve
the representation’s conditioning, while a coding bug can produce wrong answers
even for a perfectly conditioned matrix.

## How it works

For `Ax=b`, let the input become `A+δA` and `b+δb`. A first-order bound has the
shape

```text
relative solution error ≲ κ(A) × relative input perturbation,
```

with constants and separate terms depending on which input changed. In the
2-norm, the singular values give
`κ₂(A)=σ_max(A)/σ_min(A)`. If `σ_min` is tiny, a direction in the input is
almost lost and its recovered coefficient is highly sensitive.

Practical choices follow the structure: use `np.linalg.solve(A,b)` for a regular
square system, QR for full-rank least squares, and SVD/pseudoinverse when rank or
the small singular spectrum is central. Avoid explicitly forming `A⁻¹` unless a
mathematical derivation—not a solve—requires it.

## Worked examples and variations

The numbers are illustrative. Perturb one input at a time and report relative
changes, not only absolute differences.

### Example A: bad scaling with an otherwise simple problem

**Input:** `A=diag(1,1000)`. **Mechanism:** `κ₂(A)=1000`; the second coordinate
is 1,000 times more sensitive in inverse units. **Output:** rescaling the second
column by `1/1000` produces a unit-conditioned diagonal representation. **Inspect:**
transform the solution back to original units before comparing predictions.
**Decision:** scale features when units are arbitrary for the model, but preserve
and document the inverse transform.

### Example B: nearly parallel features

**Input:** `A=[[1,1],[1,1+10⁻⁸]]`. **Mechanism:** the columns are almost the same;
one singular value is about `5×10⁻⁹`, so `κ` is on the order of `10⁸`.
**Output:** a tiny perturbation in `b` can cause a large change in the two
coefficients while `A x` changes little. **Inspect:** compare predictions and
coefficients separately. **Decision:** remove/reparameterise the duplicate,
regularise with a stated bias, or report a non-identifiable coefficient pair.

### Boundary case: orthogonal and singular matrices

**Input:** an orthogonal matrix `Q`, then a matrix with a zero singular value.
**Mechanism:** `κ₂(Q)=1`; the singular matrix has `κ=∞` and loses a direction.
**Output:** the first is maximally well-conditioned, the second cannot have a
unique inverse solution. **Inspect:** singular values and rank. **Decision:** do
not use a giant finite number as if it were a valid condition number for a
singular problem.

### Counterexample: a large residual is not a condition diagnosis

**Input:** `A=I` but a target `b` generated from the wrong labels or wrong units.
**Mechanism:** the system is perfectly conditioned, yet the requested answer is
wrong for the application. **Output:** a large modelling error with `κ=1`.
**Inspect:** validate data and units separately from solver residuals. **Decision:**
do not “fix” a data contract failure by switching numerical algorithms.

### AI application: whitening and retraining drift

**Input:** a feature covariance with a very small eigenvalue. **Mechanism:** the
whitening transform has condition roughly `√(λ_max/λ_min)` and magnifies that
mode. **Output:** coefficients or predictions become unstable after tiny sensor
changes. **Inspect:** monitor singular/eigenvalue spectra and perturbation tests.
**Decision:** regularise, drop the mode, change the representation, or keep the
instability visible; do not only raise optimiser iterations.

## A small story

A solver was blamed for changing coefficients between runs. The residuals and
predictions were stable, but the feature columns were nearly duplicates and the
condition number was enormous. The numerical routine was not inventing the
instability; the problem did not contain enough independent information to
identify both coefficients.

## Two ways to see it

### Builder view

Every numerical result should carry method, dtype, scale convention, rank
tolerance, condition estimate, residual, and—in a sensitive system—a perturbation
test. This turns “it sometimes moves” into a reproducible diagnostic record.

### Visual view

Nearly parallel columns form a very thin parallelogram. Its area is controlled
by the small singular value: inverting the map must stretch the thin direction a
lot. Orthogonal columns make a rounder coordinate system and do not amplify one
direction over another.

### Computational view

```python
import numpy as np

A = np.array([[1., 1.], [1., 1. + 1e-8]])
b = np.array([2., 2. + 1e-8])
x = np.linalg.solve(A, b)
perturbed = b.copy()
perturbed[0] += 1e-10
x2 = np.linalg.solve(A, perturbed)

kappa = np.linalg.cond(A, 2)
relative_input = np.linalg.norm(perturbed - b) / np.linalg.norm(b)
relative_solution = np.linalg.norm(x2 - x) / np.linalg.norm(x)
assert np.allclose(A @ x, b)
assert kappa > 1e6
```

The perturbation experiment illustrates sensitivity; it is not a universal exact
error bound. Compare it with a well-conditioned control matrix.

## Hands-on

Create a solver decision report for an identity matrix, a badly scaled diagonal
matrix, a nearly duplicate-column matrix, and a singular matrix. For each,
record singular values, `cond`, rank, solver choice, residual, and coefficient
sensitivity under a fixed perturbation.

**Failure fixture:** use explicit inverse and normal equations for the nearly
duplicate-column least-squares case, then compare with QR/SVD. **Tests:** assert
residuals, rank detection, scale-aware perturbation measurements, and a clear
route for singular input. Also include a deliberately wrong `b` with `A=I` to
prove that conditioning does not validate data. **Reset:** restore the independent
and correctly scaled fixture, use `solve`/QR/SVD according to the decision rule,
and rerun all residual checks.

## Checkpoint

- [ ] Compute `κ₂(diag(1,1000))` from its singular values.
- [ ] Explain why coefficients can be unstable while predictions remain stable
  for nearly duplicate features.
- [ ] Distinguish ill-conditioning, bad scaling, and a software/data bug.
- [ ] Choose among direct solve, QR, and SVD for three stated matrix conditions.

## What this does not solve

A small condition number does not prove correct labels, a valid model, or a good
business decision. A condition estimate is norm- and scale-dependent, and a
solver can still be unstable or incorrectly implemented. Regularisation improves
stability by changing the problem and therefore introduces bias that must be
evaluated.

## Continue, go deeper, apply it

- Continue: Kernel matrices and the kernel trick
- Go deeper: Optimisation, loss, and gradient descent
- Apply it: ML systems and reproducibility
