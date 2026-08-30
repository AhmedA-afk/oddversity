---
title: "Matrix–vector multiplication"
track: "maths-foundations"
status: live
summary: "Matrix–vector multiplication turns each matrix row into a weighted sum."
duration: "4 min read"
---

## The short answer

Matrix–vector multiplication turns each matrix row into a weighted sum of the
input coordinates. The same operation can mean a coordinate transformation, a
set of linear scores, or the affine part of a neural layer. Compute it row by
row, track the output shape, and inspect the weights; a shape-correct result can
still be wrong if rows and columns were assigned opposite meanings.

## Why this matters

The dot product is the smallest reusable unit of many models. A linear regressor
scores features, a graph layer aggregates neighbours, and a rotation changes
coordinates—all use `Ax`. Understanding the expansion makes signs, sparsity,
units, and missing bias terms visible.

## How it works

If `A ∈ R^(m×n)` and `x ∈ R^n`, then

```text
Ax = [a_1ᵀx, a_2ᵀx, ..., a_mᵀx]ᵀ,
```

where `a_iᵀ` is row `i`. Each output coordinate is
`y_i=Σ_j A_ij x_j`. The column view is equally useful:

```text
Ax = x_1 A_:1 + x_2 A_:2 + ... + x_n A_:n.
```

The first view explains neurons as weighted sums; the second explains a
transformation as a combination of where basis directions go. A bias makes an
affine layer, `y=Ax+b`, which is not linear unless `b=0`.

> **Illustrative story (not measured evidence).** A scoring service returns the
> right number of outputs after a feature-order change. A basis-vector test then
> shows that the “minutes” coefficient is receiving the “reopened” value. The
> multiplication was correct; the contract around it was not.

## Worked examples and variations

### Case A: two weighted scores

**Input:** `A=[[2,-1],[0.5,3]]`, `x=[4,2]`. **Mechanism:** row sums give
`y_1=2(4)-1(2)=6` and `y_2=.5(4)+3(2)=8`. **Output:** `y=[6,8]`. **Inspect:**
the output has two coordinates because `A` has two rows. **Decision:** read each
row as its own score and check that the coefficient units make sense.

### Case B: a 2-D rotation

**Input:** `R=[[0,-1],[1,0]]`, `x=[1,0]`. **Mechanism:** `Rx=[0,1]`.
**Output:** the unit x-axis vector rotates 90° counter-clockwise. **Inspect:**
`||Rx||=||x||`; the operation changes direction, not length. **Decision:** use
this geometric interpretation only for maps whose coordinates share a compatible
space and unit.

### Case C: one linear model for a ticket

**Input:** feature vector `x=[minutes, reopened] = [20,1]`, weights
`w=[-0.1,2]`, bias `b=0.5`. **Mechanism:** `wᵀx+b=-2+2+0.5=0.5`.
**Output:** score `0.5`. **Inspect:** the second feature contributes `2`, while
the first contributes `-2`; this is a score, not automatically a probability.
**Decision:** apply a separately specified link or threshold policy.

### Boundary case: zero, sparse, and dimension one

**Input:** `x=[0,0,5]`, `A=[[1,2,3],[0,4,-1]]`. **Mechanism:** only the third
column contributes, so `Ax=[15,-5]`. **Output:** zero coordinates erase their
column contributions for this input. **Inspect:** this is an input-specific
effect, not proof that the columns are useless. **Decision:** preserve zeros
unless zero means missing in the data contract.

### Counterexample: row-vector convention mismatch

**Input:** a model stores `x` as a row and calculates `xA` instead of `Ax`.
For `A=[[1,2],[3,4]]`, row `x=[1,0]` gives `xA=[1,2]`, while column
`Ax=[1,3]`. **Output:** both are length-two vectors. **Inspect:** the numbers
select a row in one convention and a column in the other. **Decision:** choose a
single convention and test it with an asymmetric matrix and basis vectors.

## Two ways to see it

### Builder view

Expand one multiplication by hand, then compare it with a library call. Use
`e_j` basis vectors to inspect columns: `A e_j` must equal column `j`. This is a
fast test for transposition and feature-order bugs.

### Systems view

Each output is an explanation-weighted mixture only under appropriate modelling
assumptions. A large weight is not automatically causal importance, and a
negative coefficient may encode correlation, a unit choice, or a confounder. The
linear map is exact; the interpretation of learned weights needs data context.

## Hands-on

Build `matvec(A, x)` twice: once with an explicit row loop and once with a
library operation. Test shape, equality to hand calculations, and the basis-vector
column property. Add a bias only in a separate `affine(A,x,b)` function.

**Designed failure:** swap `A` and `A.T`, or pass a vector with one missing
coordinate. **Test:** an asymmetric matrix plus `e_1,e_2` must catch the swap;
the wrong-length input must fail before computation. **Reset:** restore the
declared column convention and rerun the basis and hand-value tests.

## Checkpoint

- [ ] Compute `[[1,2],[3,4]] [5,6]ᵀ` by row-wise weighted sums.
- [ ] State the output shape of `A x` when `A` is `4×7`.
- [ ] Explain why `Ax+b` is affine rather than linear when `b≠0`.
- [ ] Use basis vectors to explain how a matrix–vector test reveals a transpose bug.

## What this does not solve

Matrix–vector multiplication does not choose features, learn good weights,
calibrate scores, or establish causal effects. It only specifies how a declared
linear or affine calculation combines the coordinates.

## Continue, go deeper, apply it

- Continue: Matrix–matrix multiplication and batching
- Go deeper: Matrix addition, scaling, transpose, and symmetry
- Apply it: Linear algebra for ML
