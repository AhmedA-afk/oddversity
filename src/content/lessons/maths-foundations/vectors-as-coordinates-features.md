---
title: "Vectors as coordinates, measurements, and features"
track: "maths-foundations"
status: live
summary: "A vector is an ordered collection of numbers whose positions have stated."
duration: "6 min read"
---

## The short answer

A vector is an ordered collection of numbers whose positions have stated
meanings. The same vector can be written as a column, a row, a table, or an
arrow, but changing the order, units, or shape changes what it represents. In
AI, vectors encode features, observations, parameters, and embeddings; annotate
their coordinates before using a model or similarity operation.

## Why this matters

The list `[4, 12]` is not self-describing. It could mean 4 years and 12
thousand rupees, an arrow to `(4, 12)`, or two token features. A model trained
with `[age, spend]` will interpret `[spend, age]` as a different point while
still receiving the same number of values. Shape and semantic order are part of
the model interface, not cosmetic details.

For an AI feature vector, record at least:

| Property | Example |
|---|---|
| coordinate order | `[age_years, monthly_spend_inr]` |
| shape | `(2,)` for one vector, `(n, 2)` for a batch |
| units and allowed values | years `≥ 0`; spend in INR `≥ 0` |
| role | one observation, a weight vector, or an embedding |

## How it works

An element of `R^d` is an ordered tuple `x=(x₁,…,x_d)`. “Ordered” means that
`(1,2)` and `(2,1)` are different vectors. A column form is

```text
x = [ x₁ ]
    [ x₂ ]  ∈ R²
```

The row form `xᵀ=[x₁ x₂]` contains the same coordinates but has a different
orientation for matrix multiplication. A dataset with `n` observations and `d`
features is commonly a matrix `X∈Rⁿˣᵈ`; row `i` is one observation and column
`j` is one feature. State that convention instead of assuming it.

The geometric arrow view is an interpretation of the coordinate tuple, not a
second object. It starts at the origin and ends at `(x₁,x₂)` in two dimensions.
For `d>3`, the arrow is still algebraically valid even though it cannot be
drawn faithfully on a page.

## Worked examples and variations

### Example A: one point in four equivalent forms

**Input:** a sensor observation with temperature `22°C`, humidity `40%`, and
alarm flag `1`. **Mechanism:** choose the order
`x=[temperature, humidity, alarm]=[22,40,1]`.

```text
column:  [22]       row: [22  40  1]
         [40]
         [ 1]
table:   temperature | humidity | alarm
             22      |    40    |   1
arrow:   from (0,0,0) to (22,40,1)
```

**Output:** one vector in `R³`. **Inspect:** every representation preserves
coordinate order and meaning. **Decision:** a downstream model may consume it
only if its input contract uses the same order and units.

### Example B: an embedding is a vector without human-readable coordinates

**Input:** an encoder returns `e(text)=[0.8,-0.1,0.4]`. **Mechanism:** treat it
as an element of `R³`; coordinate names are latent dimensions, but the position
and dimension remain contractual. **Output:** a three-coordinate representation
that can be compared with other encoder outputs. **Inspect:** `len(e(text))=3`
and the same encoder/version created the indexed vectors. **Decision:** validate
dimension and provenance before inserting it into a vector index.

### Example C: a batch is a matrix of vectors

**Input:** three support tickets represented by `[urgent, billing]`:
`X=[[1,0],[0,1],[1,1]]`. **Mechanism:** rows are tickets, columns are features,
so `X.shape=(3,2)`. **Output:** three vectors in `R²`, stored together in
`R³ˣ²`. **Inspect:** `X[1]=[0,1]` means the second ticket is not urgent and is
about billing. **Decision:** use `axis=0` for a feature-wise operation and
`axis=1` for a row-wise operation only after naming the convention.

### Boundary case: zero is a value, not automatically missingness

**Input:** `[0,0]` for a feature pair `[failed_logins, account_age_years]`.
**Mechanism:** the vector is mathematically valid and points to the origin.
**Output:** a real observation only if zero is allowed for both coordinates.
**Inspect:** `account_age_years=0` may be valid for a new account, while a zero
failed-login count may mean “none observed”; a blank may mean “not collected.”
**Decision:** represent missingness separately rather than using zero as a
silent placeholder.

### Counterexample: swapping columns preserves shape but changes the point

**Input:** a model expects `[age_years, spend_thousands]`, and the row is
`[25,8]`. **Mechanism:** a producer emits `[8,25]`; both arrays have shape
`(2,)`, but the model now sees an eight-year-old spending 25 thousand units.
**Output:** a plausible-looking score with the wrong semantics. **Inspect:**
compare the feature ledger and a named-column serialization at the boundary.
**Decision:** test column order with a sentinel row, not only `shape`.

## Two ways to see it

### Symbolic view

Write `x∈Rᵈ`, `xᵀ∈R¹ˣᵈ`, and a batch `X∈Rⁿˣᵈ`. The superscript `T` changes
orientation; it does not mean “make the numbers bigger.” The coordinate label
`x_j` must carry the feature meaning and units.

### Geometric and measurement view

In two dimensions, draw an arrow from `(0,0)` to `(x₁,x₂)` and label both axes.
The same drawing without units can suggest a false comparison: 25 years and 8
thousand rupees are not interchangeable merely because both are numbers.

### Computational view

```python
import numpy as np

x = np.array([25.0, 8.0])       # one vector, shape (2,)
X = np.array([[25.0, 8.0],
              [31.0, 4.0]])    # batch, shape (2, 2)
assert x.shape == (2,)
assert X.shape == (2, 2)
assert np.array_equal(X[0], x)
```

NumPy will often accept both `(2,)` and `(1,2)`, but they interact differently
with matrix and broadcasting operations. Make the intended batch dimension
explicit at interfaces.

## Hands-on

Create a **feature ledger** for a three-row toy classifier. Include feature
names, order, units, allowed values, missingness representation, and the array
shape. Then write a short NumPy check:

```python
FEATURES = ["age_years", "spend_thousands"]
X = np.array([[25.0, 8.0], [31.0, 4.0], [0.0, 0.0]])
assert X.ndim == 2 and X.shape[1] == len(FEATURES)
assert np.all(X[:, 0] >= 0) and np.all(X[:, 1] >= 0)
```

**Failure fixture:** replace the second row with `[8.0, 25.0]` or transpose
the batch. **Test:** a named-column sentinel test must catch the swapped row or
the shape mismatch; a bare shape check is insufficient. **Reset:** restore the
three valid rows and rerun the feature-order and non-negativity assertions.

Feedback prompts:

- Retrieve: what does the order of coordinates contribute to a vector?
- Calculate: write the column and row forms of `[3,-2,5]` and state their shapes.
- Compute: alter one coordinate and draw the new arrow with labelled axes.
- Diagnose: explain why a zero-valued feature and a missing feature need not be
  the same state.

For the cumulative practice, submit the relevant part of A1, the embedding
geometry lab after recording your own attempt.

## Checkpoint

- [ ] Translate `[temperature, humidity, alarm]=[22,40,1]` into a column vector
  and state its shape.
- [ ] Given `X∈R⁵ˣ³`, say what one row and one column mean under the convention
  used in this lesson.
- [ ] Identify the semantic bug in a producer that emits `[spend, age]` to a
  model expecting `[age, spend]`.
- [ ] State a case where zero is a valid measurement and a case where it should
  not stand in for missingness.

## What this does not solve

A vector representation does not make features comparable, informative, scaled,
or fair. It does not choose a distance, prove an embedding is meaningful, or
detect a unit change unless those checks are made explicit. The next lessons add
operations that are only meaningful after the coordinate contract is sound.

## Continue, go deeper, apply it

- Continue: Vector addition, affine combinations, and centroids
- Go deeper: Linear algebra for ML
- Apply it: A1 embedding geometry lab
