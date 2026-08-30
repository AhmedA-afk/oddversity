---
title: "Matrix addition, scaling, transpose, and symmetry"
track: "maths-foundations"
status: live
summary: "Matrix addition combines entries only when the tables have the same shape."
duration: "5 min read"
---

## The short answer

Matrix addition combines entries only when the tables have the same shape;
scaling multiplies every entry by one scalar; transposition swaps row and column
indices. A matrix is symmetric when `A=Aᵀ`. These simple operations appear in
residual updates, feature scaling, covariance, and attention-like score tables,
so make the shape rule explicit and never confuse a convenient broadcast with
valid mathematics.

## Why this matters

An invalid matrix expression is often caught by a type checker, but silent
broadcasting can create a different expression that still runs. Likewise,
`AᵀA` is always symmetric, while `AB` generally is not. Recognising these facts
lets you inspect a numerical pipeline instead of trusting a printed array.

## How it works

For `A,B ∈ R^(m×n)`,

```text
(A+B)_ij = A_ij + B_ij,       (cA)_ij = c A_ij,
(Aᵀ)_ij = A_ji.
```

Addition is defined because corresponding entries have the same index and
meaning. Transposition changes the coordinate description, not the underlying
numbers. Applying it twice returns the original matrix:

```text
((Aᵀ)ᵀ)_ij = (Aᵀ)_ji = A_ij.
```

Symmetry means `A_ij=A_ji` for every pair of indices. A covariance matrix is
expected to be symmetric because covariance between feature `i` and feature `j`
does not depend on which one is named first. Symmetry alone does not mean
positive values or positive definiteness.

> **Illustrative story (not measured evidence).** A pipeline averages two
> feature summaries and quietly broadcasts one row vector across every example.
> The output looks tidy, but the operation added a per-feature offset rather than
> two aligned tables. An asymmetric test matrix makes the mistaken axis visible.

## Worked examples and variations

### Case A: adding two same-shaped updates

**Input:** `A=[[1,2],[3,4]]`, `B=[[10,20],[30,40]]`. **Mechanism:** add by
position. **Output:** `A+B=[[11,22],[33,44]]`. **Inspect:** entry `(2,1)` is
`3+30=33`; no row is paired with a column. **Decision:** use addition for a
residual or parameter update only when the two arrays share shape and semantics.

### Case B: scaling with a unit change

**Input:** feature values in metres `x=[2,5]`, scale `c=100`. **Mechanism:**
`cx=[200,500]`, now centimetres. **Output:** the same coordinates expressed in a
new unit. **Inspect:** scaling every entry preserves ratios but changes magnitude.
**Decision:** scale the matching parameters or document the unit conversion;
scaling only one side of an equation changes its meaning.

### Case C: transpose turns samples into feature columns

**Input:** `X=[[1,2,3],[4,5,6]]`, where rows are examples. **Mechanism:**
`Xᵀ=[[1,4],[2,5],[3,6]]`. **Output:** three feature rows, two example columns.
**Inspect:** `Xᵀ[0,1]=X[1,0]=4`. **Decision:** transpose deliberately when a
solver expects one feature per row; carry the axis labels with it.

### Boundary case: the zero and one-by-one matrices

**Input:** `0_(2×3)` and `A_(2×3)`, or a scalar-shaped `[[7]]`. **Mechanism:**
`A+0=A`, and `[[7]]ᵀ=[[7]]`. **Output:** valid identities at the smallest
shapes. **Inspect:** a zero matrix has the same shape as its operand; the scalar
case does not justify dropping dimensions in a batch pipeline. **Decision:** keep
singleton axes when they carry “one output” or “one batch” semantics.

### Counterexample: accidental broadcast and false commutation

**Input:** `A` is `2×3`, `b=[10,20,30]`. A programming library may compute
`A+b` by adding `b` to every row. **Mechanism:** that is row broadcasting, not
general matrix addition with another unspecified matrix. Also, for
`P=[[1,1],[0,1]]` and `Q=[[1,0],[1,1]]`, `PQ=[[2,1],[1,1]]` but
`QP=[[1,1],[1,2]]`. **Output:** two different products. **Inspect:** write the
expanded indices and compare axes. **Decision:** permit broadcasting only when it
is an explicit feature-wise operation; never assume multiplication commutes.

## Two ways to see it

### Builder view

Addition is aligned merging, scaling is unit/magnitude change, and transpose is
an axis permutation. In code, put shape assertions before each operation and
test an asymmetric fixture so a mistaken transpose cannot hide behind symmetry.

### Systems view

Symmetry is often a diagnostic invariant. If a covariance table drifts away from
`A=Aᵀ` because of a bug or inconsistent accumulation, downstream eigensolvers may
behave unexpectedly. But “make it symmetric by averaging `(A+Aᵀ)/2`” repairs the
representation only if the asymmetry is numerical noise, not a real directional
quantity such as a transition matrix.

## Hands-on

Implement a small operation audit for `A`, `B`, a scale `c`, and `X`. Report
shapes before and after addition, scaling, and transpose, and check symmetry with
`max(abs(A-A.T))` for a square fixture.

**Designed failure:** add a `2×3` array to a length-2 vector, then use a
non-symmetric `2×2` pair to test `AB==BA`. **Test:** the audit must distinguish
“invalid addition,” “valid broadcast by explicit policy,” and “non-commuting
product.” **Reset:** remove the ambiguous broadcast, restore same-shaped
operands, and rerun with the asymmetric fixtures.

## Checkpoint

- [ ] Compute the transpose and `2A` for `A=[[1,2,3],[4,5,6]]`.
- [ ] State why `A+B` requires matching shapes in ordinary matrix algebra.
- [ ] Test whether `[[2,1],[1,2]]` and `[[2,0],[0,3]]` are symmetric.
- [ ] Give a numerical counterexample to `AB=BA` and explain why broadcasting is a separate rule.

## What this does not solve

These operations do not tell you whether a matrix represents the right feature
order, whether a covariance estimate is statistically reliable, or whether a
symmetrisation preserves the intended system. They expose structure; they do not
validate the model or data-generating process.

## Continue, go deeper, apply it

- Continue: Matrix–vector multiplication
- Go deeper: Matrices as data tables and linear maps
- Apply it: Linear algebra for ML
