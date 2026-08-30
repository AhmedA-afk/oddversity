---
title: "Scalars, arrays, tensors, axes, shapes, and broadcasting"
track: "maths-foundations"
status: live
summary: "A scalar has no axes, a vector has one, a matrix has two, and a tensor."
duration: "5 min read"
---

## The short answer

A scalar has no axes, a vector has one, a matrix has two, and a tensor is an
array of any rank. A shape records the length of each axis; broadcasting aligns
compatible trailing axes for elementwise operations. Annotate every axis before
coding and choose explicitly between elementwise arithmetic and matrix
multiplication: a shape that runs can still represent the wrong quantity.

## Why this matters

Model inputs are usually batches, not isolated examples. An embedding batch might
have shape `(batch, embedding_dim)`, while a convolution input adds channel and
spatial axes. If those axes are unnamed, a missing batch dimension, a transposed
matrix, or a broadcasted label can produce plausible numbers with the wrong
meaning.

The practical question is not only “does the library accept these arrays?” It is
“which real-world axis does each number stand for, and should this operation
combine or preserve that axis?”

## How it works

The rank is the number of axes. For example, `x.shape == (2, 3)` means two rows
and three columns, but the shape alone does not tell us whether the rows are
examples or features. Write the semantic annotation beside it:

```text
embeddings: (batch=2, feature=3)
bias:       (feature=3)
```

Elementwise addition preserves the output shape. Broadcasting pads the shorter
shape on the left with length-one axes, then permits each aligned pair when the
lengths match or one of them is `1`:

```text
(2, 3) + (3,) -> (2, 3)
(2, 3) + (2, 1) -> (2, 3)
```

These operations are not interchangeable with a matrix product. If `X` has
shape `(batch, features)` and `w` has shape `(features,)`, `X @ w` combines the
feature axis and returns one score per example, with shape `(batch,)`. `X + w`
adds a feature-wise offset and keeps all features.

## Worked examples and variations

### Example A: one feature per example

**Illustrative.** **Input:** `x = [2, 4, 6]`, annotated as `(batch=3,)`, and `w=10`.
**Mechanism:** scalar multiplication applies to every element. **Output:**
`[20, 40, 60]`, still shape `(3,)`. **Inspect:** the batch axis remains; no
examples were combined. **Decision:** use this for a per-example transform, not
for a weighted sum across features.

### Example B: an embedding batch plus a feature bias

**Illustrative.** **Input:** `X` has shape `(2, 3)` and `b=[1, 0, -1]` has shape `(3,)`.
**Mechanism:** the one-dimensional shape aligns with the last axis, so the same
feature bias is added to both rows. **Output:**
`[[x₁₁+1, x₁₂, x₁₃-1], [x₂₁+1, x₂₂, x₂₃-1]]`, shape `(2, 3)`.
**Inspect:** `b` is a feature quantity, not a per-example quantity.
**Decision:** accept the broadcast only after writing the axis annotation.

### Example C: matrix product versus elementwise product

**Illustrative.** **Input:** `X` is `(2, 3)` and `w` is `(3,)`. **Mechanism:** `X @ w` computes
`xᵢ₁w₁+xᵢ₂w₂+xᵢ₃w₃` for each row. **Output:** two scores, shape `(2,)`.
`X * w` instead scales each feature and returns shape `(2, 3)`. **Inspect:**
the first operation reduces the feature axis; the second preserves it.
**Decision:** use `@` for a linear score and `*` for feature-wise scaling.

### Boundary case: a valid empty batch

**Illustrative.** **Input:** `X` has shape `(0, 3)` and `b` has shape `(3,)`. **Mechanism:**
broadcasting is shape-compatible, so addition can produce shape `(0, 3)`.
**Output:** an empty batch, not a batch of zeros. **Inspect:** a later mean over
axis `0` has no observations and is undefined. **Decision:** permit empty
intermediate arrays only when the pipeline has an explicit empty-batch policy;
reject them before a loss reduction.

### Counterexample: labels broadcast across classes

**Illustrative.** **Input:** logits have shape `(2, 3)` and integer labels accidentally have shape
`(2, 1)`, while code subtracts labels from logits. **Mechanism:** broadcasting
repeats each example's label across all three class columns. **Output:** a
shape-valid `(2, 3)` array that is not a classification residual. **Inspect:**
the label axis was invented by broadcasting. **Decision:** assert that class
indices have shape `(batch,)` before selecting or reducing class scores.

## Two ways to see it

### Builder view

Treat shapes as an interface contract. For every tensor, record semantic axis
names, lengths, units, and whether an operation should preserve or reduce an
axis. A small table or assertion is often more useful than inspecting a large
array of values.

### Systems view

Broadcasting is convenient implicit control flow. It can remove an explicit
error boundary, so a refactor can change semantics without changing the output
rank. Shape checks should sit at data, model, and loss boundaries; a passing
runtime check is not proof that the axes mean what the author intended.

## Hands-on

Create a shape ledger for a three-class classifier. Implement or record these
contracts:

```python
logits = ("batch", "class")       # (2, 3)
labels = ("batch",)               # (2,)
bias = ("class",)                 # (3,)
assert logits[1] == len(set([0, 1, 2]))
```

For a NumPy version, test `logits + bias` and a per-example class selection using
`labels`. **Failure fixture:** change `labels` to shape `(2, 1)` and run the
deliberately broad subtraction from the counterexample. **Test:** assert the
declared semantic shape before the operation and report `labels must be
batch-shaped, got (2, 1)` rather than relying on a later numerical check.
**Reset:** restore `labels.reshape(2,)`, rerun the shape assertions, and verify
that the selected output has one value per example.

## Checkpoint

- [ ] Annotate `(32, 768)` as either `(batch, hidden)` or `(sequence, hidden)` and explain what extra fact is needed to choose.
- [ ] Predict the shapes of `(4, 5) + (5,)`, `(4, 5) @ (5,)`, and `(4, 5) * (5,)`.
- [ ] Explain why `(0, 5)` is shape-valid but may be invalid input to a mean loss.
- [ ] Give one shape-valid broadcast that would still be semantically wrong.

## What this does not solve

Shape correctness does not prove that the feature order, units, labels, or model
semantics are correct. A tensor can have exactly the expected shape while its
values are transposed, leaked, stale, or scaled incorrectly. Those require unit
checks, data contracts, and model evaluation.

## Continue, go deeper, apply it

- Continue: Units, scales, normalisation, and dimensionless quantities
- Go deeper: Mathematics Foundations checklist
- Apply it: Linear algebra for ML
