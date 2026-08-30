---
title: "Inverses and why solving beats explicit inversion"
track: "maths-foundations"
status: live
summary: "The inverse A⁻¹ is the map that reverses an invertible square matrix."
duration: "5 min read"
---

## The short answer

The inverse `A⁻¹` is the map that reverses an invertible square matrix, so
`A⁻¹b` is mathematically the solution of `Ax=b`. In code, solve the system
directly instead of forming `A⁻¹`: a factorisation can be reused, it usually
costs less, and it avoids extra rounding and storage. Use an inverse explicitly
only when the inverse itself is the object you need to inspect or apply.

## Why this matters

Writing `w=(XᵀX)⁻¹Xᵀy` is useful for deriving least squares, but it is often a
bad implementation default. Explicit inversion does extra work and can amplify
numerical error. The correct computational question is “what solves this system,
for this right-hand side?” not “how do I manufacture an inverse?”

## How it works

For invertible `A`, `A⁻¹A=I` and `AA⁻¹=I`. To solve `Ax=b`, apply the same
elimination factors used to transform `A` into a triangular matrix, then perform
back-substitution. This avoids computing all columns of `A⁻¹` when there is one
right-hand side. If there are many right-hand sides `B`, factor `A` once and
solve `AX=B` for all columns.

The inverse identity explains the algebra:

```text
Ax=b  ⇒  A⁻¹(Ax)=A⁻¹b  ⇒  x=A⁻¹b.
```

But equal mathematical expressions need not have equal floating-point error or
cost. A direct solver also detects singularity and can use pivoting; an inverse
path may hide the diagnostic behind a failed or unstable matrix construction.

> **Illustrative story (not measured evidence).** A developer writes an inverse
> into a regression helper because it mirrors the textbook formula. A review
> replaces it with a solve call, preserving the residual check and making the
> singular fixture report a named failure instead of a misleading result.

## Worked examples and variations

### Case A: solve a two-by-two system

**Input:** `A=[[2,1],[1,1]]`, `b=[5,3]`. **Mechanism:** solve `2x+y=5` and
`x+y=3`, giving `x=2,y=1`. **Output:** `x=[2,1]`. **Inspect:** residual
`Ax-b=[0,0]`; computing `A⁻¹b` gives the same mathematical answer. **Decision:**
use a direct solve for the implementation and reserve the inverse for a derivation.

### Case B: multiple right-hand sides

**Input:** the same `A` and `B=[[5,1],[3,0]]`. **Mechanism:** solve `AX=B`
column by column after one factorisation. **Output:** two solution columns,
`X=[[2,1],[1,-1]]`. **Inspect:** verify `AX=B` for the whole matrix. **Decision:**
reuse the factorisation when the coefficient matrix stays fixed.

### Case C: singular system

**Input:** `A=[[1,2],[2,4]]`, `b=[3,6]`. **Mechanism:** infinitely many solutions
to `x+2y=3`; no inverse exists. **Output:** a solution family, such as
`x=3-2t,y=t`, not a unique vector. **Inspect:** `A` has zero determinant and
rank 1. **Decision:** classify the system or add a selection rule; do not catch
the exception and pretend an inverse was found.

### Case D: one factorisation, many queries

**Input:** a fixed feature matrix `A` and many target vectors `b₁,…,bₖ`.
**Mechanism:** factor `A` once, then solve for each `bᵢ`; explicit inversion
would compute and store all of `A⁻¹` even if only a few responses are needed.
**Output:** same solutions with less work and a smaller intermediate object.
**Inspect:** compare residuals and runtime on a controlled fixture. **Decision:**
choose solve-and-reuse for repeated inference.

### Boundary/counterexample: a residual can hide parameter error

**Input:** an ill-conditioned `A` and two nearby targets `b` and `b+δ`.
**Mechanism:** both solve paths may report small residuals, while the solutions
differ greatly because the inverse map magnifies `δ`. **Output:** residual
accuracy alone is insufficient. **Inspect:** perturbation sensitivity and
condition estimates. **Decision:** improve scaling, regularise, or reformulate;
switching from inverse to solve does not cure ill-conditioning itself.

## Two ways to see it

### Builder view

`solve(A,b)` is the operation “find `x` such that `Ax≈b`.” It exposes the
right-hand side, supports pivoting, and lets you test the residual. Explicit
inverse is an object-construction operation with a different cost and error
profile.

### Systems view

Factorisation is reusable work; inversion is a full description of a reverse map.
If a system has one query, making the entire reverse map is unnecessary. If the
map is unstable, neither approach fixes sensitivity—the limitation belongs to the
problem geometry.

## Hands-on

Benchmark and compare a direct solver with explicit inverse multiplication for a
small well-conditioned matrix, a matrix with multiple right-hand sides, and a
near-singular matrix. Record residual, solution sensitivity, and any warnings.

**Designed failure:** implement a regression helper as `inv(A) @ b`, skip the
singularity check, and judge success only by a printed vector. **Test:** the
singular fixture must return a named failure or solution family; all successful
cases must pass `norm(A@x-b)` and a perturbation check. **Reset:** replace the
inverse path with a direct solve, preserve the residual assertions, and rerun.

## Checkpoint

- [ ] Derive `x=A⁻¹b` from `Ax=b` and state the invertibility assumption.
- [ ] Explain why one factorisation can serve several right-hand sides.
- [ ] State what a residual checks and what it does not check.
- [ ] Give two reasons to prefer a direct solve over explicit inversion.

## What this does not solve

Direct solving does not fix singular or ill-conditioned data, select a meaningful
solution among infinitely many, or replace a domain decision about constraints.
For overdetermined noisy systems, the next question is approximation by least
squares rather than exact solving.

## Continue, go deeper, apply it

- Continue: Least squares, normal equations, and projection geometry
- Go deeper: Invertibility, determinants, and volume intuition
- Apply it: Linear regression
