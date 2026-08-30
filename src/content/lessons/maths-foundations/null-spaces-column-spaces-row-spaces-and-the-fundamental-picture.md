---
title: "Null spaces, column spaces, row spaces, and the fundamental picture"
track: "maths-foundations"
status: live
summary: "The null space contains inputs a matrix sends to zero; the column space contains."
duration: "5 min read"
---

## The short answer

The null space contains inputs a matrix sends to zero; the column space contains
all reachable outputs; the row space contains the independent input directions
that the rows inspect. Together they explain what a linear map preserves,
produces, and destroys. In AI, this is the geometry behind indistinguishable
parameters, representable targets, and projection-based approximation.

## Why this matters

When a model cannot fit a target exactly, ask whether the target lies outside
the column space rather than blaming the optimiser. When two parameter vectors
make identical predictions, their difference lies in the null space. These are
different failure modes: unreachable output versus invisible input variation.

## How it works

For `A ∈ R^(m×n)`:

```text
Null(A) = {x∈R^n : Ax=0}
Col(A)  = {Ax : x∈R^n} ⊆ R^m
Row(A)  = span of the rows of A ⊆ R^n.
```

The column space is the span of the columns; the row space is unchanged by
elimination; and the dimensions obey rank–nullity:

```text
dim(Null(A)) + rank(A) = n.
```

Why? Each pivot variable is determined by the free variables; each free
variable contributes one independent null direction. Also,
`y∈Col(A)` exactly when `Ax=y` is consistent. The orthogonal complement
relationships—`Row(A) = Null(A)ᗮ` and `Col(A)=Null(Aᵀ)ᗮ`—will later explain
least-squares projections.

> **Illustrative story (not measured evidence).** A compressed representation
> gives the same output for two inputs that differ in a sensitive direction. A
> null-space check makes the blind spot explicit before anyone claims that the
> representation preserved all relevant information.

## Worked examples and variations

### Case A: a map that destroys one direction

**Input:** `A=[[1,1]]`. **Mechanism:** `A[x₁,x₂]ᵀ=x₁+x₂`. The vector
`v=[1,-1]` is in the null space. **Output:** two different inputs such as
`[2,3]` and `[3,2]` give the same output `5`. **Inspect:** their difference is
`[1,-1]`, invisible to `A`. **Decision:** no downstream calculation using only
`Ax` can recover the lost distinction.

### Case B: reachable and unreachable targets

**Input:** `A=[[1,0],[0,0]]`. **Mechanism:** `Col(A)` is the x-axis. **Output:**
`y=[4,0]` is reachable with `x=[4,anything]`; `y=[4,1]` is not reachable.
**Inspect:** the second output coordinate is always zero. **Decision:** add a
feature direction, change the target, or approximate—do not demand an exact fit
outside the column space.

### Case C: null directions in redundant model features

**Input:** `X` has columns `[1,x,x]`. **Mechanism:** `v=[0,1,-1]` gives
`Xv=0`. **Output:** changing coefficients by `t v` leaves every prediction
unchanged. **Inspect:** the row space sees only the sum of the duplicate
feature weights. **Decision:** remove the duplicate or report the equivalence
class instead of over-interpreting individual coefficients.

### Case D: row space as the information queried

**Input:** `A=[[1,2,0],[2,4,0]]`. **Mechanism:** both rows inspect the same input
direction `[1,2,0]`; row two adds no new question. **Output:** `Row(A)` is a
line, while `Null(A)` is the plane `x₁+2x₂=0` with free `x₃`. **Inspect:** rank
is 1 and nullity is 2. **Decision:** a parameter change along either null
direction is unobservable through this matrix.

### Boundary/counterexample: zero matrix and zero vector

**Input:** `A=0_(m×n)`. **Mechanism:** every input maps to zero; the null space
is all of `R^n`, but the column space is only `{0}`. **Output:** maximal input
loss and no nonzero reachable output. **Inspect:** “zero output” does not mean
“zero input.” **Decision:** check which space your claim concerns.

## Two ways to see it

### Builder view

Compute a basis for the null space and column space, then verify each basis
vector with multiplication. Label a null vector in feature terms: it is a change
the current model representation cannot see.

### Systems view

The four spaces are an information-flow map. Columns describe possible outputs,
rows describe tested input directions, and the null space describes blind spots.
Changing a model after a blind spot is not evidence that the input was understood;
it may simply be an unobservable change.

## Hands-on

For `A=[[1,1],[2,2]]`, calculate one null-space basis and one column-space basis
by hand, then verify them in NumPy. Solve `Ax=y` for a reachable and an
unreachable `y`, recording the residual or contradiction.

**Designed failure:** use a single particular solution as if it were the only
solution, or claim every two-vector output is reachable from this rank-one map.
**Test:** add a null vector to a solution and check the output is unchanged;
test an unreachable target and require an explicit failure. **Reset:** restore
the original matrix and report the family of solutions plus a column-space test.

## Checkpoint

- [ ] Define `Null(A)` and `Col(A)` in symbols and words.
- [ ] Find a nonzero null vector for `[[1,1]]`.
- [ ] Use rank–nullity to find nullity when `A` has 5 columns and rank 3.
- [ ] Explain why a target outside the column space cannot be fit exactly.

## What this does not solve

The four spaces describe a linear representation, not the quality or meaning of
the original features. Approximation can be useful outside the column space, and
an algebraic blind spot may be harmless or harmful depending on the task.

## Continue, go deeper, apply it

- Continue: Span, linear independence, basis, and dimension
- Go deeper: Rank, pivots, and identifiability
- Apply it: Linear algebra for ML
