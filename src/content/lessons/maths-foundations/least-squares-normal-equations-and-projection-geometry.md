---
title: "Least squares, normal equations, and projection geometry"
track: "maths-foundations"
status: live
summary: "Least squares chooses x to minimise the squared residual."
duration: "5 min read"
---

## The short answer

Least squares chooses `x` to minimise the squared residual
`||Ax-b||²` when an exact solution is unavailable or undesirable. Differentiating
gives the normal equations `AᵀAx=Aᵀb`: the residual at the solution is
orthogonal to every column of `A`, so `Ax` is the projection of `b` onto the
column space. Derive the equations for understanding, but prefer a stable
solver such as QR over explicitly forming an inverse of `AᵀA`.

## Why this matters

Real data is usually overdetermined and noisy. Least squares turns incompatible
measurements into a transparent approximation with a residual that can be
inspected. It is the algebra behind ordinary linear regression, but it does not
make the linear model true, remove outliers, or justify using squared error for
every decision.

## How it works

Let `f(x)=||Ax-b||²=(Ax-b)ᵀ(Ax-b)`. Expand:

```text
f(x)=xᵀAᵀAx - 2bᵀAx + bᵀb.
```

Using `∇(xᵀMx)=(M+Mᵀ)x` and `AᵀA` symmetric,

```text
∇f(x)=2AᵀAx-2Aᵀb.
```

At a differentiable minimiser, set the gradient to zero:

```text
Aᵀ(Ax-b)=0.
```

Thus the residual `r=b-Ax` is orthogonal to every column of `A`. If `A` has
full column rank, the minimiser is unique and can be written
`x=(AᵀA)⁻¹Aᵀb`; this is a derivation, not a default implementation. If columns
are dependent, minimisers may not be unique, though all give the same fitted
vector `Ax`.

> **Illustrative story (not measured evidence).** A line is fitted to noisy
> observations that no exact line can pass through. The residual arrows are not
> merely “leftover error”: their orthogonality shows that the fitted line is the
> closest reachable point under the chosen squared-distance rule.

## Worked examples and variations

### Case A: an exact fit is also least squares

**Input:** `A=[[1],[2]]`, `b=[3,6]`. **Mechanism:** `x=3` makes `Ax=b`, so
the residual is zero and `||r||²=0`, the smallest possible value. **Output:**
fitted values `[3,6]`. **Inspect:** `Aᵀr=0`. **Decision:** use the exact fit
when the data is consistent, but keep the residual test in the general code.

### Case B: fit a line to inconsistent observations

**Input:** observations `(0,1)`, `(1,2)`, `(2,2)` with model `y≈b+wx`.
Use `A=[[1,0],[1,1],[1,2]]`, `b=[1,2,2]`. **Mechanism:** solve the normal
equations `AᵀA x=Aᵀb`, giving `b=7/6`, `w=1/2`. **Output:** fitted values
`[7/6,5/3,13/6]`, residuals `[-1/6,1/3,-1/6]`. **Inspect:** residuals sum
to zero here because the intercept column is present, and `Aᵀr=0`.
**Decision:** report both coefficients and residual behaviour, not only a line.

### Case C: projection onto a one-dimensional feature direction

**Input:** `a=[1,2]` and `b=[3,1]`; model outputs must lie on `span(a)`.
**Mechanism:** projection coefficient is `x=(aᵀb)/(aᵀa)=5/5=1`, so
`p=ax=[1,2]`. **Output:** residual `b-p=[2,-1]`. **Inspect:**
`aᵀ(b-p)=0`. **Decision:** interpret least squares as choosing the closest
reachable point, not as discovering the exact target.

### Case D: rank-deficient design

**Input:** `A=[[1,1],[2,2]]`, `b=[2,4]`. **Mechanism:** columns are duplicates;
any `(x₁,x₂)` with `x₁+x₂=2` fits exactly. **Output:** infinitely many
parameter vectors but one fitted vector `[2,4]`. **Inspect:** `AᵀA` is singular.
**Decision:** remove redundancy, add a constraint, or use a stated minimum-norm
convention; do not claim each coefficient is identified.

### Boundary/counterexample: normal equations magnify conditioning

**Input:** a design matrix `A` with condition number `κ(A)` large. **Mechanism:**
forming `AᵀA` roughly squares the condition number, making roundoff more harmful.
**Output:** normal-equation coefficients can be much less accurate than a QR or
SVD solve, even though the algebra is correct. **Inspect:** compare residual and
coefficient error on a nearly dependent fixture. **Decision:** use QR/SVD or a
library least-squares solver for production-sized or ill-conditioned data.

## Two ways to see it

### Builder view

Least squares is an optimisation problem, a normal-equation derivation, and a
projection. Implement all three on a tiny fixture: minimise the squared residual,
solve with a stable routine, and draw the target, fitted point, and orthogonal
residual in 2-D.

### Systems view

The column space is the set of outputs the model can express. Least squares
chooses the closest point in that set under Euclidean distance. The choice of
distance is itself a modelling decision: large outliers receive squared-error
leverage, and another loss or weighting changes the projection geometry.

## Hands-on

Complete a mini regression lab with an intercept and one feature. Compute `AᵀA`
and `Aᵀb` by hand for three rows, solve using a stable least-squares routine,
plot observations and fitted values, and report residual norm plus the orthogonality
check `||Aᵀ(b-Ax)||`.

**Designed failure:** duplicate a feature, implement `inv(A.T @ A) @ A.T @ b`,
and add a nearly dependent column. **Test:** the lab must detect rank deficiency
or instability, compare normal equations with QR/SVD, and reject a large
orthogonality or residual error. **Reset:** remove the duplicate, use a stable
solve, rerun the plot and checks, and record the limitation rather than hiding
the failed case.

## Checkpoint

- [ ] Derive `Aᵀ(Ax-b)=0` from `||Ax-b||²`.
- [ ] Explain why the least-squares residual is orthogonal to every column of `A`.
- [ ] Compute the projection of `[3,1]` onto `span([1,2])`.
- [ ] State why QR/SVD is often preferred to explicitly solving the normal equations.

## What this does not solve

Least squares does not establish causality, handle arbitrary outliers robustly,
guarantee unique coefficients under redundancy, or choose the right features and
loss for a product decision. It minimises one declared geometric error.

## Continue, go deeper, apply it

- Continue: Mathematics Foundations assignments
- Go deeper: Inverses and why solving beats explicit inversion
- Apply it: Linear regression
