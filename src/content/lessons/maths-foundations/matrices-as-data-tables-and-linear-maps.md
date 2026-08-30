---
title: "Matrices as data tables and linear maps"
track: "maths-foundations"
status: live
summary: "A matrix is both a rectangular table of numbers and, when its dimensions fit."
duration: "6 min read"
---

## The short answer

A matrix is both a rectangular table of numbers and, when its dimensions fit, a
rule that maps one vector space to another. In AI, the same array can be a batch
of feature rows, a layer's weights, or a graph's adjacency table. Before doing
arithmetic, name the axes, units, and shape; a numerically valid product can
still represent the wrong system.

## Why this matters

Most model code is matrix code hidden behind a library call. `X @ W.T` may mean
“apply one linear model to every row,” while `A @ x` may mean “transform a
coordinate.” If you do not state whether rows are examples or features, a
transpose can produce plausible-looking predictions with the wrong meaning.

The shape is a small contract. A matrix in `R^(m×n)` has `m` rows and `n`
columns. A data matrix conventionally uses rows for examples and columns for
features, but a library or paper may choose the opposite convention. The
convention must be explicit, not guessed from the variable name.

> **Illustrative story (not measured evidence).** A team labels a spreadsheet
> “features” and “weights,” then transposes both during a refactor. Every array
> still has a legal shape, so the bug survives until someone traces one named
> customer and one named feature through the calculation. The lesson is to test
> meaning, not only dimensions.

## How it works

For `A ∈ R^(m×n)` and `x ∈ R^n`, define

```text
T_A(x) = Ax,       (T_A(x))_i = Σ(j=1..n) A_ij x_j.
```

The output has `m` coordinates. Linearity follows directly from distributing the
sum:

```text
A(u+v) = Au + Av       and       A(cu) = c(Au).
```

The `j`th column of `A` is where the `j`th input basis vector goes. Thus a matrix
is a compact description of a transformation: each output coordinate is a
weighted combination of the inputs. A data table has the same rectangular
syntax, but its entries have a different semantics: `X_ij` is the value of
feature `j` for example `i`.

Common AI meanings:

| Matrix | Shape and interpretation |
|---|---|
| `X` | `n_examples × n_features`; one row per observation |
| `W` | `n_outputs × n_features`; learned coefficients |
| `A` | `n_nodes × n_nodes`; graph edge weights, often with `A_ij` meaning `i` receives from `j` |

## Worked examples and variations

### Case A: a feature table

**Input:**

```text
X = [[2, 10],
     [3,  7],
     [5,  4]]
```

**Mechanism:** rows are three examples; columns are `hours_used` and
`tickets_closed`. **Output:** `X ∈ R^(3×2)`. **Inspect:** `X[1,0]=3` means the
second example has three hours, not that feature one has three examples.
**Decision:** use `X.shape == (3, 2)` as the contract before fitting a model.

### Case B: a learned map to two outputs

**Input:** `x=[2,10]` and
`W=[[1,0.1],[-1,0.2]]`. **Mechanism:**
`Wx=[1(2)+0.1(10), -1(2)+0.2(10)]=[3,0]`. **Output:** a two-coordinate score.
**Inspect:** each row of `W` is one output's feature weights. **Decision:**
interpret the first output and second output separately; do not treat `W` as a
table of examples merely because it is rectangular.

### Case C: adjacency as a matrix

**Input:**

```text
A = [[0, 1, 0],
     [1, 0, 1],
     [0, 1, 0]]
```

**Mechanism:** node two is connected to nodes one and three; for an indicator
vector `x=[1,0,0]`, `Ax=[0,1,0]` under this convention. **Output:** one step
of neighbour aggregation. **Inspect:** `A` is square because input and output
are both node-indexed; directed graphs need not be symmetric. **Decision:**
document whether `A_ij` means edge `i→j` or `j→i` before multiplying.

### Boundary case: one example and a zero feature

**Input:** `X=[[4,0,9]]`. **Mechanism:** it is still a `1×3` matrix, not a
length-two vector; zero is a measured value, not a missing column. **Output:**
one example with three features. **Inspect:** `X.shape`, column names, and the
missingness policy separately. **Decision:** preserve the zero and mark missing
values explicitly if the domain needs that distinction.

### Counterexample: a transpose that still runs

**Input:** three examples, two features, and `W ∈ R^(1×2)`. **Mechanism:** the
correct row-batch score is `XW.T`, shape `3×1`. If someone stores `X.T` and
computes `X.T @ W.T`, the product may be made to run after other reshaping but
the axes no longer mean examples and features. **Output:** plausible numbers
with wrong ownership. **Inspect:** trace one named row and one named feature
through every transpose. **Decision:** reject unexplained reshapes; keep an
axis comment or schema beside the array.

## Two ways to see it

### Builder view

Treat a matrix as a typed object: `(rows, columns, row meaning, column meaning,
units)`. A shape assertion catches many errors; a semantic assertion catches the
rest. For example, `assert X.shape[1] == len(feature_names)` is stronger when
the names are also checked against their units and order.

### Systems view

A matrix is an interface between representations. Data enters as rows, a weight
matrix changes coordinates, and an adjacency matrix mixes information across
nodes. A system can preserve shape while changing orientation, ordering, or
units. Monitoring only the final tensor shape therefore misses semantic drift.

## Hands-on

Create a small NumPy “matrix ledger” with `X`, a two-output `W`, and an adjacency
matrix `A`. For each, record shape, row meaning, column meaning, and units. Add
`assert` statements for the shapes and calculate one output by hand.

**Designed failure:** transpose `X` but leave the feature-name list unchanged,
or change the adjacency convention without changing the aggregation code.
**Test:** a fixture with named rows must either fail the shape/axis assertion or
produce the same hand-checked result after an explicit conversion. **Reset:**
restore the original orientation and feature order, rerun all assertions, and
compare one row and one node output to the ledger.

## Checkpoint

- [ ] State the shape and row/column meaning of a table with 8 examples and 5 features.
- [ ] Explain why an `m×n` matrix maps an `n`-vector to an `m`-vector.
- [ ] Give one case where a square matrix is a data table and one where it is a transformation.
- [ ] Diagnose whether `X @ W.T` or `X.T @ W` is correct for `X: 4×3` and `W: 2×3`, and state the output shape.

## What this does not solve

A shape-correct matrix does not prove that features are ordered correctly, units
are compatible, edges mean what the algorithm assumes, or learned weights are
useful. Those require data contracts, validation, and model evaluation.

## Continue, go deeper, apply it

- Continue: Matrix addition, scaling, transpose, and symmetry
- Go deeper: Linear algebra for ML
- Apply it: Linear regression from scratch
