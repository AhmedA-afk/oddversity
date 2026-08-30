---
title: "Notation, indices, sums, and products"
track: "maths-foundations"
status: live
summary: "Indices say which item or coordinate you mean; summation and product notation."
duration: "4 min read"
---

## The short answer

Indices say which item or coordinate you mean; summation and product notation
compress repeated operations without changing them. They are the grammar of
datasets, batches, vectors, matrices, likelihoods, and losses. Expand a compact
formula once by hand before coding it: you will catch off-by-one, wrong-axis, and
wrong-normalisation errors that look mathematically sophisticated but are only
index mistakes.

## Why this matters

The expression `Σᵢ ℓᵢ` could mean a total over examples, labels, tokens, or
features. `1/n` may average the batch, while `1/(nk)` averages batch and output
coordinates. A framework may make either reduction easy; neither is automatically
the objective you intended. Notation makes the data axis and the operation
explicit.

## How it works

For values `x₁, x₂, …, xₙ`,

```text
Σᵢ₌₁ⁿ xᵢ = x₁ + x₂ + ... + xₙ
Πᵢ₌₁ⁿ xᵢ = x₁ × x₂ × ... × xₙ
```

An index is a position, not a value. In mathematical notation, a dataset might
be `{(xᵢ, yᵢ)}ᵢ₌₁ⁿ`; `i` chooses one example. In zero-indexed Python, the same
rows are typically `0` through `n-1`. State the convention once and keep it.

For a batch mean-squared error with scalar targets:

`L = (1/n) Σᵢ₌₁ⁿ (ŷᵢ − yᵢ)²`.

The outer sum is over examples. If each target has `k` dimensions, the full mean
over all values is `(1/(nk)) Σᵢ₌₁ⁿ Σⱼ₌₁ᵏ (ŷᵢⱼ−yᵢⱼ)²`.

## Worked examples and variations

### Example A: expand a batch loss

**Input:** predictions `[2, 4, 3]`, targets `[1, 5, 3]`. **Mechanism:** squared
errors are `[1,1,0]`; `L=(1/3)(1+1+0)=2/3`. **Output:** batch MSE `2/3`.
**Inspect:** there are three terms and one batch divisor. **Decision:** the loss
is a mean per example, not a sum.

### Example B: two output coordinates

**Input:** two examples, each with two errors: `[[1,-1],[2,0]]`. **Mechanism:**
sum of squares is `1+1+4+0=6`. Divide by `n=2` gives `3` per example; divide by
`nk=4` gives `1.5` per coordinate. **Output:** both are valid but different.
**Inspect:** gradient magnitude changes with the reduction. **Decision:** choose
the reduction that matches the intended metric and document it.

### Example C: likelihood product

**Input:** independent coin outcomes with probabilities `pᵢ`. **Mechanism:**
`Πᵢ pᵢ` multiplies one probability per observation. **Output:** a likelihood.
**Inspect:** one zero factor makes the product zero; log form becomes a sum only
when the probabilities are positive. **Decision:** use product notation to show
the independence assumption, not to hide it.

### Boundary case: empty batch

`(1/n)Σᵢ₌₁ⁿ` is undefined for `n=0`. Some software returns `NaN`; others throw
an error. **Inspect:** treating that result as a zero loss tells the system that
no data was perfect. **Decision:** reject empty batches before reduction.

### Counterexample: wrong-axis averaging

For a `batch × class` probability array, averaging across the class axis before
selecting the correct label destroys the classification meaning. **Inspect:**
write `i` for example and `c` for class; select `pᵢ,yᵢ` before summing over `i`.
**Decision:** name axes in comments, tests, and plots.

## Two ways to see it

### Builder view

Translate every compact equation into a small table: each row is an index tuple,
each column is an intermediate value, and the final row is the reduction. This
turns a formula into code you can unit-test with a three-row fixture.

### Statistical view

A sum is often an accumulated quantity and a mean is often an estimate per
observation. Changing sum to mean can preserve the minimiser in some cases but
changes scale, gradient size, comparison across batch sizes, and sometimes the
meaning of a reported metric.

## Hands-on

Write a 15-line NumPy or spreadsheet calculation for scalar and two-coordinate
MSE. Include columns/arrays for prediction, target, residual, square, and the
two reductions.

**Failure state:** run it on an empty batch and on a `2×2` target while using a
scalar-target reduction. **Tests:** assert the expected scalar result (`2/3`)
for Example A and raise a named error for the empty batch. **Reset:** restore the
fixture and state whether your reported loss is per-example or per-coordinate.

## Checkpoint

- [ ] Expand `Σᵢ₌₁⁴ (2i−1)` without using a calculator.
- [ ] Explain the difference between `xᵢ` and `xᵢⱼ`.
- [ ] Write a formula for the mean absolute error of `n` examples with `k`
  output coordinates.
- [ ] Identify the invalid operation in an average over an empty dataset.

## What this does not solve

Correct notation does not choose a loss function or establish that examples are
independent. It makes those choices inspectable and prevents accidental changes
to axes and scale.

## Continue, go deeper, apply it

- Continue: Sets, logic, and proof habits
- Go deeper: Mathematics Foundations checklist
- Apply it: Linear regression from scratch
