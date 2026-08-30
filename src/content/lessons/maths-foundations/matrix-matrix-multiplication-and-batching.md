---
title: "Matrix–matrix multiplication and batching"
track: "maths-foundations"
status: live
summary: "The product AB is defined when the columns of A equal the rows of B."
duration: "5 min read"
---

## The short answer

The product `AB` is defined when the columns of `A` equal the rows of `B`, and
its entry `(i,j)` is the dot product of row `i` of `A` with column `j` of `B`.
It composes transformations and applies one weight matrix to a whole batch. The
order matters: `AB` and `BA` usually mean different maps, even when both happen
to be defined.

## Why this matters

Batch inference is matrix multiplication: a batch `X` can pass through a layer
without a Python loop. But two conventions are common. With examples as rows,
`XWᵀ` is typical; with examples as columns, `WX` is typical. Mixing conventions
is one of the easiest ways to get a fast, consistently wrong model.

## How it works

For `A ∈ R^(m×k)` and `B ∈ R^(k×n)`,

```text
(AB)_ij = Σ(r=1..k) A_ir B_rj,
shape(AB) = m×n.
```

For a vector `x`, associativity follows by rearranging finite sums:

```text
A(Bx) = (AB)x.
```

This is composition: apply `B` first, then `A`. Commutativity does not follow
because changing order changes the intermediate coordinates. A batch of row
vectors `X ∈ R^(n_examples×n_features)` and a weight matrix
`W ∈ R^(n_outputs×n_features)` produces `Y=XWᵀ`, shape
`n_examples×n_outputs`.

> **Illustrative story (not measured evidence).** A batch endpoint is made ten
> times faster by replacing a loop with one matrix product. A reviewer compares
> one row against the old loop and discovers that a square weight matrix had been
> transposed. Speed and shape were real; the model semantics were not.

## Worked examples and variations

### Case A: a small product by rows and columns

**Input:** `A=[[1,2,3],[0,1,4]]` and `B=[[1,0],[2,1],[3,2]]`.
**Mechanism:** `(AB)_11=1(1)+2(2)+3(3)=14`; the full product is
`[[14,8],[14,9]]`. **Output:** a `2×2` matrix. **Inspect:** the shared inner
dimension is 3. **Decision:** compute one entry manually whenever a product is
first introduced or a shape convention changes.

### Case B: a batched linear layer

**Input:** `X` is `3×2`,
`X=[[1,10],[2,20],[3,30]]`, and `W=[[1,0.1],[-1,0.2]]` is `2×2`.
**Mechanism:** `Y=XWᵀ`; each row receives the same two-output map. **Output:**
`Y=[[2,1],[4,2],[6,3]]`. **Inspect:** output row `i` depends only on input row
`i`; no examples were mixed. **Decision:** use this form for row-major batches
and assert `Y.shape==(3,2)`.

### Case C: composition order

**Input:** scale `S=[[2,0],[0,1]]` and swap `P=[[0,1],[1,0]]`.
**Mechanism:** `PS` scales the original x-coordinate before swapping, while
`SP` swaps first and then scales the coordinate that was originally y. **Output:**
`PS=[[0,1],[2,0]]`, `SP=[[0,2],[1,0]]`. **Inspect:** apply each product to
`[1,3]` and compare. **Decision:** write the operation order in words before
choosing a product order.

### Boundary case: identity, zero, and empty batch

**Input:** `I_k` and `0` with compatible shapes; `X` has shape `0×d`.
**Mechanism:** `AI=A`, `A0=0`, and an empty batch can produce a `0×p` output
without inventing predictions. **Output:** identities or an empty result.
**Inspect:** preserve the batch axis and distinguish “no examples” from a
single all-zero example. **Decision:** add a non-empty-data check when a metric
or optimiser requires observations.

### Counterexample: dimensions fit, model meaning does not

**Input:** `X` is `3×2`, `W` is `2×2`; both `XW` and `XWᵀ` are defined because
`W` is square. **Mechanism:** the two products use different weight rows and
columns. **Output:** both are `3×2` matrices, but one may apply the intended
output weights and the other may silently swap them. **Inspect:** compare one
named example with a hand-calculated score. **Decision:** use a non-square
fixture in tests when possible and name the weight axes.

## Two ways to see it

### Builder view

Treat `AB` as a typed composition: the inner `k` labels must be the same
coordinate system, and the outer labels become the result. For a batch, assert
that the number of examples is preserved and output columns match output names.

### Systems view

Matrix products can mix information across axes. `XWᵀ` mixes features within
each example; an attention or graph product may also mix examples or nodes. The
operation is not “just faster loops”: it defines which entities are allowed to
influence which outputs.

## Hands-on

Implement a batched layer using both an explicit loop over rows and `X @ W.T`.
Record shapes and compare all outputs. Add a second composition using two small
transformation matrices and test both orders on a named vector.

**Designed failure:** use a square `W` and transpose it, or accidentally multiply
`X.T @ W`. **Test:** a hand fixture with named features and outputs must catch
the wrong contribution; an empty batch must preserve a `0×outputs` result.
**Reset:** restore row-major `X`, the declared `W` orientation, and rerun the
loop-vs-product comparison.

## Checkpoint

- [ ] State the shape rule for `A_(m×k)B_(k×n)` and the result shape.
- [ ] Explain why `A(Bx)=(AB)x` but `AB` need not equal `BA`.
- [ ] For `X: 5×4` and `W: 3×4`, write the row-batch product and its output shape.
- [ ] Give one example where both product orders are shape-valid but semantically different.

## What this does not solve

Correct batching does not validate feature order, learned parameters, data
quality, or the choice to mix entities. Matrix multiplication also does not make
a nonlinear model linear; activations and other operations may sit between
products.

## Continue, go deeper, apply it

- Continue: Linear systems and augmented matrices
- Go deeper: Matrix–vector multiplication
- Apply it: Linear regression
