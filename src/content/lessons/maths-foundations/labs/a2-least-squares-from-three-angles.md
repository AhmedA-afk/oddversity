---
title: "A2: Least squares from three angles"
track: "maths-foundations"
status: live
summary: "Least squares finds the line whose predictions are closest to noisy observations."
duration: "12 min read"
---

## The short answer

Least squares finds the line whose predictions are closest to noisy observations
under squared Euclidean error. In this lab you will solve one fixed regression by
centred projection geometry, by hand-built normal equations, and with a stable
numerical solver. The three coefficient vectors and fitted values must agree
within tolerance. A rank-deficient variant must be rejected as non-identifiable,
and submitted code must not form an explicit inverse.

## Why this matters

The formula for linear regression is often presented as a single library call or
as `A⁺b`. That hides three decisions: what outputs the columns of `A` can
express, which point in that column space is closest to the target, and whether
the coefficients are identifiable. The M2 lessons connect these decisions through
matrices, rank, null spaces, inverses, and projection geometry.

This lab makes the connections reviewable. The hand route tests whether the
learner can derive the answer; the normal-equation route tests the algebra; the
solver route tests implementation. Agreement is useful evidence, not permission
to skip residual, rank, conditioning, or limitation checks.

## How it works

Write the intercept-plus-feature model as `y ≈ Aβ`, where each row of `A` is
`[1, xᵢ]` and `β=[b,w]ᵀ`. Least squares minimises

```text
J(β) = ||Aβ-y||².
```

Expanding and differentiating gives the normal equations:

```text
Aᵀ(Aβ-y)=0
⇒ AᵀAβ=Aᵀy.
```

The residual `r=y-Aβ` is therefore orthogonal to every column of `A`. Geometrically,
`Aβ` is the projection of `y` onto the column space of `A`; algebraically, it is
the coefficient vector that satisfies the orthogonality equations. A numerical
least-squares routine reaches the same projection through a factorisation such as
QR or SVD without requiring you to form an inverse of `AᵀA`.

## Worked examples and variations

### Example A: the shared noisy line

**Illustrative.** **Input:** `x=[0,1,2,3,4]` and
`y=[1.0,2.1,2.9,4.2,4.0]`. **Mechanism:** build `A=[1,x]` and minimise the
squared residual. **Output:** `β=[1.22,0.81]`, predictions
`[1.22,2.03,2.84,3.65,4.46]`, and residuals
`[-0.22,0.07,0.06,0.55,-0.46]`. **Inspect:** `Aᵀr≈[0,0]` and
`||r||²=0.571`. **Decision:** report the coefficients together with the
residual and assumptions, not only the fitted line.

### Example B: the same fit as a centred projection

**Illustrative.** **Input:** means `x̄=2` and `ȳ=2.84`, centred vectors
`x_c=[-2,-1,0,1,2]` and `y_c=[-1.84,-0.74,0.06,1.36,1.16]`.
**Mechanism:** project `y_c` onto `x_c`:
`w=(x_cᵀy_c)/(x_cᵀx_c)=8.1/10=0.81`, then recover
`b=ȳ-wx̄=1.22`. **Output:** the same `β` as Example A. **Inspect:** the
centred residual is orthogonal to `x_c`; the intercept restores the means.
**Decision:** use centring to understand the geometry and as a hand-check for
the code path.

### Boundary case: a redundant feature column

**Illustrative.** **Input:** `A_rank=[1,x,2x]`, using the same `x` and `y`.
**Mechanism:** the third column is twice the second, so `rank(A_rank)=2<3`.
**Output:** infinitely many coefficient vectors can produce the same fitted
values; the individual slopes are not identifiable. **Inspect:** a null direction
such as `[0,2,-1]ᵀ` leaves `A_rankβ` unchanged. **Decision:** reject the
full-column-rank requirement, remove the duplicate, or state a selection rule
such as minimum norm before interpreting coefficients.

### Counterexample: explicit inverse as a “solution”

**Illustrative.** **Input:** an implementation that computes a matrix inverse of
`AᵀA` and multiplies it by `Aᵀy`. **Mechanism:** it mirrors the symbolic formula
but adds storage, work, and an avoidable numerical operation; on a nearly
dependent design it can produce a less reliable coefficient vector than QR or
SVD. **Output:** a plausible answer with no guarantee that the design was
identified or well-conditioned. **Inspect:** rank, residual, perturbation
sensitivity, and the source for inverse calls. **Decision:** derive with the
normal equations, implement with a least-squares solver, and fail the submission
if it forms an explicit inverse.

## Two ways to see it

### Geometric view

The columns of `A` span all predictions the model can express. The fitted vector
`Aβ` is the closest reachable point to `y`; the residual is the perpendicular
error. Centring separates the mean direction from the feature direction, making
the slope a one-dimensional projection.

### Numerical-systems view

The same problem is a data contract and a stability decision. Rank says whether
the parameters can be distinguished, residuals say how well the model matches
the fixture, and conditioning says how sensitive the coefficients are to small
data changes. A stable solver improves computation but cannot add information or
make a linear model causally correct.

## Hands-on

### Lab setup

Reserve 75–120 minutes. Use Python 3.11+ with NumPy 2.x, or record the versions
of the environment you use. Save the work as `a2_solution.py` or a notebook.
Do not alter the shared `x` and `y` arrays between lanes.

### Deliverables

Submit one folder or notebook containing:

1. **Fixture and assumptions:** the exact arrays below, model equation, intercept
   convention, loss definition, tolerance, library version, and a statement that
   the five target values are noisy observations rather than an exact line.
2. **Hand/geometric solution:** centroids, centred vectors, dot products, slope,
   intercept, fitted values, and residual norm. Show the projection or
   orthogonality argument in your own notation.
3. **Normal-equation solution:** `AᵀA`, `Aᵀy`, the two scalar equations, and the
   solved coefficient vector. Verify the residual orthogonality by multiplication.
4. **Numerical-solver solution:** use `np.linalg.lstsq(A, y, rcond=None)` or an
   equivalent QR/SVD-based least-squares routine. Record coefficients, rank,
   residual norm, and any singular values returned.
5. **Agreement table:** compare all three coefficient vectors, fitted arrays, SSE,
   and `||Aᵀr||`. Use a declared tolerance rather than exact float equality.
6. **Rank-deficient report:** reproduce the failure fixture, show its rank and
   null direction, and explain why a coefficient-by-coefficient interpretation
   is invalid.
7. **Decision memo:** write 150–300 words answering whether this line is fit for
   the stated use, what evidence supports the answer, and what the lab does not
   establish.

### Shared noisy regression fixture

Copy this unchanged before writing your solution:

```python
import numpy as np

x = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
y = np.array([1.0, 2.1, 2.9, 4.2, 4.0])
A = np.column_stack([np.ones_like(x), x])

beta_reference = np.array([1.22, 0.81])
yhat_reference = np.array([1.22, 2.03, 2.84, 3.65, 4.46])
residual_reference = y - yhat_reference

# Deliberately redundant: the third column is 2 × the second.
A_rank_deficient = np.column_stack([np.ones_like(x), x, 2.0 * x])
```

The hand values are part of the fixture contract. The normal-equation quantities
are `AᵀA=[[5,10],[10,30]]` and `Aᵀy=[14.2,36.5]`. The reference SSE is `0.571`
and the reference residual norm is approximately `0.7556454`.

### Lane 1: hand and geometric solution

Complete this table before running a solver:

| Quantity | Your derivation |
|---|---|
| `x̄`, `ȳ` |  |
| `x_c=x-x̄`, `y_c=y-ȳ` |  |
| `x_cᵀy_c` and `x_cᵀx_c` |  |
| `w=(x_cᵀy_c)/(x_cᵀx_c)` |  |
| `b=ȳ-wx̄` |  |
| `yhat=b+wx` |  |
| `r=y-yhat` and `||r||²` |  |
| `Aᵀr` |  |

Your inspection must explain why `Aᵀr≈0` has two entries: one checks the
intercept column and one checks the feature column.

### Lane 2: normal-equation solution

Form the two equations without a matrix inverse:

```text
5b + 10w = 14.2
10b + 30w = 36.5
```

Solve them by elimination or substitution. Then compute `Aβ`, `r`, `rᵀr`, and
`Aᵀr`. Record each intermediate matrix/vector so a reviewer can distinguish a
wrong transpose, a wrong target, and a wrong reduction.

### Lane 3: numerical-solver solution

Use a direct least-squares routine:

```python
beta_solver, residuals, rank, singular_values = np.linalg.lstsq(
    A, y, rcond=None
)
yhat_solver = A @ beta_solver
r_solver = y - yhat_solver
```

Compare `beta_solver` with `[1.22,0.81]`, then independently recompute the
residual and orthogonality checks. Do not treat the solver's `residuals` return
value as a substitute for calculating `r_solver.T @ r_solver` yourself.

### Rank-deficient failure

Run the solver on `A_rank_deficient` only after predicting what should happen.
The design has three parameter columns but rank two. A correct lab must:

- report `rank(A_rank_deficient) < A_rank_deficient.shape[1]`;
- show that `[0,2,-1]ᵀ` is a null direction, up to numerical tolerance;
- explain that adding any multiple of this direction changes coefficients but not
  predictions; and
- reject a claim that the intercept and two slopes are individually identified.

It is acceptable for `lstsq` to return one convention, such as a minimum-norm
coefficient vector. That convention is not evidence that the data identified
each coefficient.

### No-explicit-inverse rule

The submitted solution may derive the normal equations, but it must not form an
explicit inverse or pseudoinverse. Use `lstsq`, QR, SVD, or a direct solve only
where the matrix is square and the rank/conditioning checks justify it. The
failure demonstration may discuss the inverse path in the report, but the
passing solution file must contain no inverse call.

Before submission, run a source gate against the solution artifact and require no
matches for `inv(`, `pinv(`, or `inverse(`. A convenient shell check is:

```text
rg -n 'inv\\(|pinv\\(|inverse\\(' a2_solution.py
```

The command must return no matches. This gate is separate from the numerical
tests: a solver can return the right fixture answer and still violate the
implementation rule.

## Deterministic acceptance tests

Run this after the three lanes are complete. It checks the shared reference,
agreement, orthogonality, rank failure, null direction, and an example source
string that obeys the no-inverse rule. Adapt the first two lines to your artifact
only if your variable names differ; do not change the reference values.

```python
import numpy as np

TOL = 1e-10

expected_beta = np.array([1.22, 0.81])
expected_yhat = np.array([1.22, 2.03, 2.84, 3.65, 4.46])
expected_residual = np.array([-0.22, 0.07, 0.06, 0.55, -0.46])

def require(condition, message):
    if not condition:
        raise AssertionError(message)

def require_close(actual, expected, message):
    if not np.allclose(actual, expected, rtol=TOL, atol=TOL):
        raise AssertionError(f"{message}: {actual} != {expected}")

require(A.shape == (5, 2), "shared design must be five rows by two columns")
require_close(A.T @ A, np.array([[5.0, 10.0], [10.0, 30.0]]), "A.T @ A")
require_close(A.T @ y, np.array([14.2, 36.5]), "A.T @ y")

beta_hand = np.array([1.22, 0.81])       # replace with your hand result
beta_normal = np.array([1.22, 0.81])    # replace with your normal-equation result
beta_solver, _, solver_rank, _ = np.linalg.lstsq(A, y, rcond=None)

for label, beta in [("hand", beta_hand), ("normal", beta_normal),
                    ("solver", beta_solver)]:
    require_close(beta, expected_beta, f"{label} coefficients")
    require_close(A @ beta, expected_yhat, f"{label} fitted values")
    residual = y - A @ beta
    require_close(residual, expected_residual, f"{label} residual")
    require_close(A.T @ residual, np.zeros(2), f"{label} orthogonality")
    require_close(np.array([residual @ residual]), np.array([0.571]),
                  f"{label} SSE")

require(solver_rank == 2, "full-rank fixture should report rank two")

# The rank-deficient case must be rejected before interpreting coefficients.
rank_deficient_rank = np.linalg.matrix_rank(A_rank_deficient)
require(rank_deficient_rank == 2, "redundant fixture should have rank two")
require(rank_deficient_rank < A_rank_deficient.shape[1],
        "redundant fixture must fail full-column-rank check")
null_direction = np.array([0.0, 2.0, -1.0])
require_close(A_rank_deficient @ null_direction, np.zeros(5),
              "rank-deficient null direction")

def require_full_column_rank(matrix):
    rank = np.linalg.matrix_rank(matrix)
    if rank < matrix.shape[1]:
        raise ValueError(f"rank deficient: rank={rank}, columns={matrix.shape[1]}")

try:
    require_full_column_rank(A_rank_deficient)
except ValueError as error:
    require("rank deficient" in str(error), "failure must name rank deficiency")
else:
    raise AssertionError("rank-deficient fixture was accepted")

def assert_no_explicit_inverse(source):
    forbidden = ("inv(", "pinv(", "inverse(")
    hits = [token for token in forbidden if token in source]
    if hits:
        raise AssertionError(f"explicit inverse rule violated: {hits}")

assert_no_explicit_inverse("beta = np.linalg.lstsq(A, y, rcond=None)[0]")
print("A2 acceptance: PASS")
```

## Reset / rollback path

Keep a clean copy of the fixture and use one process per failure investigation:

1. Save the unchanged fixture as the baseline cell or first section of the
   solution file.
2. Run the baseline tests and save the output before introducing a failure.
3. For the rank-deficient case, recreate `A_rank_deficient` from the baseline;
   do not mutate `A` in place or reuse a cached factorisation.
4. Restore `A`, `y`, and the no-inverse solver path, restart the kernel/process,
   and rerun all three lanes plus the acceptance tests.
5. If a coefficient changes after reset, compare the exact fixture, dtype,
   `rcond`, and source gate before changing the tolerance.

The reset is complete only when the clean fixture again gives `β=[1.22,0.81]`,
SSE `0.571`, orthogonality within tolerance, solver rank `2`, and
`A2 acceptance: PASS`.

## Checkpoint

- [ ] I derived the centred projection and recovered `w=0.81` and `b=1.22` by hand.
- [ ] I formed `AᵀA` and `Aᵀy`, solved the normal equations without an inverse, and checked `Aᵀr≈0`.
- [ ] I solved the same fixture with a numerical least-squares routine and compared coefficients, predictions, residuals, and SSE.
- [ ] I reproduced the redundant-column failure, found a null direction, and did not interpret arbitrary returned coefficients as identified.
- [ ] My solution passes the deterministic tests, the no-explicit-inverse source gate, the reset run, and the decision memo requirement.

## Rubric

Score the submission out of 100 using the A2 assessment weights:

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25 | Correct model matrix, centred projection, normal equations, dimensions, assumptions, and rank interpretation. |
| Computation | 20 | All three paths run on the unchanged fixture; intermediate values are recorded; numerical comparisons use declared tolerances. |
| Interpretation | 20 | The memo explains projection, residuals, coefficient meaning, and whether the fit supports the stated use. |
| Diagnostics | 20 | Orthogonality, SSE, solver rank, rank-deficient null direction, failure guard, no-inverse gate, and reset evidence are present. |
| Communication | 15 | Three paths are easy to compare; tables and plots, if used, have labelled axes; limitations and decisions are explicit. |

Minimum passing evidence is conjunctive: a high score cannot compensate for a
missing rank-deficient failure, an unverified hand path, or an explicit inverse
in the submitted solution.

## What this does not solve

Least squares does not prove that a linear relationship is causal, that the
features are sufficient, that noise is independent or well behaved, or that the
fit will generalise outside this fixture. A small residual can coexist with
outliers, leakage, poor conditioning, or a biased sample. Rank and solver
agreement establish algebraic and computational consistency, not model validity.

## Continue, go deeper, apply it

- Continue: Least squares, normal equations, and projection geometry
- Go deeper: Inverses and why solving beats explicit inversion
- Apply it: Linear regression
