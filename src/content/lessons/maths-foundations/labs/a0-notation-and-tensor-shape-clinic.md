---
title: "A0: Notation and tensor-shape clinic"
track: "maths-foundations"
status: live
summary: "A0 is a notation-and-shape audit, not a memorisation quiz."
duration: "14 min read"
---

## The short answer

A0 is a notation-and-shape audit, not a memorisation quiz. You will translate 20
expressions between prose, symbols, and arrays, then prove with deterministic
tests that five shape-valid broadcasts are semantically wrong. Annotate axes,
predict output shapes, run the fixtures, and repair only the named boundary.
The pass decision is based on an inspectable ledger and tests that fail for the
right reason.

## Why this matters

The M0 lessons build one habit from several angles: name the quantity before
calculating it. Functions define valid inputs and outputs; notation names the
indices and reductions; sets and logic define allowed cases; shapes name axes;
units name scale; plots and sanity checks expose misleading outputs.

In a real model, `batch × class` and `batch × feature` can have the same rank and
even the same lengths. NumPy or another array library may accept both. A shape
clinic makes the hidden contract explicit before a loss, metric, embedding, or
decision is trusted.

## How it works

Use this annotation format for every expression:

```text
name: (axis_name=length, axis_name=length), unit/domain
```

For example, `X` below is a batch of four three-feature rows, while `w` is one
weight per feature:

```text
X: (batch=4, feature=3)
w: (feature=3)
X @ w: (batch=4)
```

The `@` operation contracts the matching feature axis. Elementwise `*`, `+`, and
`-` preserve axes unless broadcasting is involved. Broadcasting aligns trailing
axes and permits equal lengths or a length of `1`:

```text
(4, 3) + (3,)    -> (4, 3)  # one feature bias per row
(4, 3) + (4, 1)  -> (4, 3)  # one row bias per feature
```

Both results run, but they encode different claims. For each row in the clinic,
write the intended axes first, predict the output, then run the expression and
inspect values. If the prediction and execution disagree, record the exact
boundary rather than patching the array until it runs.

## Worked examples and variations

### Example A: a scalar equation becomes a row score

**Illustrative.** **Input:** `ŷᵢ = w₁xᵢ₁ + w₂xᵢ₂ + b`, with `xᵢ` and `w` each
having shape `(2,)`. **Mechanism:** the feature index is summed for one example.
**Output:** one scalar `ŷᵢ`, shape `()`. **Inspect:** the feature axis was
contracted; the example index `i` was not. **Decision:** when batching, stack
rows into `(batch, feature)` and apply the same contraction once per row.

### Example B: a feature bias broadcasts across a batch

**Illustrative.** **Input:** `X` has shape `(4, 3)` and `b` has shape `(3,)`.
**Mechanism:** the trailing feature axis matches, so `b` is reused for all four
rows. **Output:** shape `(4, 3)`. **Inspect:** the three bias values align with
features, not examples. **Decision:** accept this broadcast only with the axis
annotation and a test for `b.shape == (X.shape[1],)`.

### Boundary case: an empty batch is not a zero batch

**Illustrative.** **Input:** `X` has shape `(0, 3)`. **Mechanism:** shape
propagation can still produce `(0, 3)` after adding a feature bias, but a mean
over the batch has no terms. **Output:** an empty intermediate and an undefined
batch reduction. **Inspect:** check both shape and batch length. **Decision:**
reject an empty batch before computing a mean loss unless the workflow has an
explicit empty-input policy.

### Counterexample: compatible shapes can invent an outer product

**Illustrative.** **Input:** `pred` has shape `(4,)`, while `target_column` has
shape `(4, 1)`. **Mechanism:** subtracting them broadcasts both axes and produces
shape `(4, 4)`, comparing every prediction with every target. **Output:** a
shape-valid matrix instead of four residuals. **Inspect:** compare the intended
one-index residual with the executed rank-two result. **Decision:** flatten the
target only when it is contractually a vector, then assert equal shapes.

## Two ways to see it

### Learner and builder view

The ledger is an executable translation table. Each row connects prose, symbols,
axis names, expected shape, actual shape, and a numerical check. It is the small
artifact you can review before converting a derivation into a model layer.

### Reviewer and systems view

Broadcasting is implicit control flow. It can erase the error that would have
forced a developer to state whether a quantity belongs to a sample, token,
feature, class, channel, or spatial position. The reviewer therefore checks
semantic axis names and boundary fixtures, not only whether the runtime avoided
an exception.

## Hands-on

Reserve 60–90 minutes. Use Python 3.11+ with NumPy 2.x, or record the versions of
the environment you use. Save the work as `a0_clinic.py` or a notebook. Work in
this order:

1. Copy the starter fixture without changing values.
2. Complete the 20-row ledger by hand before running each expression.
3. Run the passing baseline tests.
4. Reproduce mistakes 1–5 one at a time and record the observed shape, symptom,
   semantic cause, guard, and repair.
5. Run the full acceptance test after each repair and write the decision memo.

Do not use a library's printed shape as the whole answer. The submission must
name what each axis means and why the operation preserves or contracts it.

### Deliverables

Submit one folder or notebook containing:

1. **Twenty-expression ledger:** all rows below, with prose interpretation,
   symbolic form or code, named axes, predicted shape, actual shape, and one
   numerical or structural inspection.
2. **Starter-fixture artifact:** the unchanged fixture block, your corrected
   expressions, and the deterministic acceptance-test output.
3. **Five-mistake report:** for each mistake, include symptom → mechanism →
   semantic risk → failing guard → repaired expression. Keep the silently
   accepted wrong result as evidence; do not delete it.
4. **Submission note:** state assumptions, notation conventions, library version,
   fixed seed, and one boundary case. Add a 150–300 word decision memo answering
   whether this shape contract is strong enough to protect the next model layer.
5. **Reasonableness check:** hand-calculate at least three small values or shapes
   and compare them with the artifact output.

### Starter fixtures

Copy this block first. The random generator is included to make the fixture
reproducible even if you extend it; the core expressions use the explicit arrays.

```python
import numpy as np

SEED = 20260830
rng = np.random.default_rng(SEED)

X = np.arange(12, dtype=float).reshape(4, 3)
feature_bias = np.array([0.1, 0.2, 0.3])          # (feature=3,)
sample_bias = np.arange(4, dtype=float).reshape(4, 1)  # (batch=4, 1)
w = np.array([0.5, 1.0, -1.0])                   # (feature=3,)

logits = np.array([
    [2.0, 1.0, 0.0],
    [0.0, 3.0, 1.0],
    [1.0, 2.0, 4.0],
    [5.0, 0.0, 1.0],
])                                                   # (batch=4, class=3)
labels = np.array([0, 2, 1, 0])                    # (batch=4,)

pred = np.array([1.5, 1.5, 2.5, 5.0])             # (batch=4,)
target_column = np.array([1.0, 2.0, 3.0, 4.0]).reshape(4, 1)

states = np.arange(32, dtype=float).reshape(2, 4, 4)  # (batch=2, token=4, hidden=4)
position_values = np.array([0.0, 0.1, 0.2, 0.3])       # intended token values

image_nchw = np.arange(72, dtype=float).reshape(2, 3, 4, 3)  # (batch, channel, height, width)
channel_bias = np.array([0.1, 0.2, 0.3])                     # (channel=3,)
```

The equal lengths `token=4` and `hidden=4`, and `channel=3` and `width=3`, are
deliberate. They make two incorrect broadcasts run successfully, so shape-only
testing is not enough.

### Exercise: the 20-expression ledger

For each row, predict before execution. Use `()` for a scalar shape, `(n,)` for
a vector, and explicit axis names for rank-two or higher arrays. In the final
column, record the decision the shape enables or blocks.

| ID | Expression or prompt | Record |
|---:|---|---|
| 1 | `7` | Rank, shape, and whether it can represent a batch. |
| 2 | `v = np.array([2, -1, 4])` | Rank, shape, and one plausible axis annotation. |
| 3 | `A = X[:2]` | Shape and names for both axes. |
| 4 | `X[2, 1]` | Scalar meaning in prose; identify the two selected indices. |
| 5 | `X + feature_bias` | Predicted shape, broadcasted axis, and intended meaning. |
| 6 | `X + sample_bias` | Predicted shape and the different meaning of a row bias. |
| 7 | `X + 5.0` | Predicted shape and what a scalar broadcast preserves. |
| 8 | `X + np.array([1.0, 2.0])` | Expected failure boundary and the incompatible aligned lengths. |
| 9 | `X @ w` | Output shape and the axis contracted by matrix multiplication. |
| 10 | `X * w` | Output shape and why this is not the same as row scoring. |
| 11 | `np.mean(X, axis=0)` | Output shape and whether the batch or feature axis was reduced. |
| 12 | `np.mean(X, axis=1, keepdims=True)` | Output shape and why `keepdims` matters for later broadcasting. |
| 13 | `np.argmax(logits, axis=1)` | Output shape and the semantic type of each result. |
| 14 | `X.T @ X` | Shapes of both factors, output shape, and what it aggregates. |
| 15 | `logits[np.arange(4), labels]` | Output shape and how one class score is selected per example. |
| 16 — mistake 1 | `pred - target_column` | Actual shape, intended shape, and the outer-residual risk. |
| 17 — mistake 2 | `logits - labels[:, None]` | Actual shape, why labels are not logits, and the repair. |
| 18 — mistake 3 | `X + sample_bias` when a feature bias is intended | Actual shape, semantic mismatch, guard, and repair. |
| 19 — mistake 4 | `states + position_values` | Actual shape, hidden-versus-token alignment, guard, and repair. |
| 20 — mistake 5 | `image_nchw + channel_bias` | Actual shape, width-versus-channel alignment, guard, and repair. |

Rows 5–15 establish the normal vocabulary. Rows 16–20 are not “trick
questions”: keep their outputs, because the evidence that they run is part of
the failure report.

### Five broadcasting and shape mistakes

These are the required failure fixtures. Each one is shape-valid or nearly
shape-valid in a way that could survive a superficial runtime check.

| Mistake | Failure state | Correct contract and repair |
|---|---|---|
| 1. Outer residual | `(4,) - (4, 1)` returns `(4, 4)`; every prediction is paired with every target. | Require equal vector shapes, then use `pred - target_column.reshape(-1)` to obtain `(4,)`. |
| 2. Class-label arithmetic | `(4, 3) - (4, 1)` returns `(4, 3)`; one label is repeated over class logits. | Require labels to be `(batch,)` and select `logits[np.arange(4), labels]`; do not subtract class IDs from logits. |
| 3. Sample bias used as feature bias | `(4, 3) + (4, 1)` returns `(4, 3)`; each row gets a different offset when the intended offset is per feature. | Require a feature bias of `(feature=3,)` and use `X + feature_bias`. |
| 4. Token bias used as hidden bias | `(2, 4, 4) + (4,)` returns `(2, 4, 4)`; equal token and hidden lengths hide that the last axis received the values. | Expand to `(1, token=4, 1)` and use `states + position_values[None, :, None]`. |
| 5. Channel bias used as width bias | `(2, 3, 4, 3) + (3,)` returns `(2, 3, 4, 3)`; the last width axis receives the values instead of the channel axis. | For NCHW, expand to `(1, channel=3, 1, 1)` and use `image_nchw + channel_bias[None, :, None, None]`. |

For every row, the failure state must include the wrong output, not only the
corrected code. A test that says “the shapes match” is insufficient for mistakes
3–5 because the wrong and right results have the same outer shape.

### Deterministic acceptance tests

Append this test block after the starter fixtures. It checks the baseline, then
proves that each deliberately wrong result differs from the repaired result or
violates the intended axis contract. A passing test run must end with
`A0 acceptance: PASS`.

```python
def require(condition, message):
    if not condition:
        raise AssertionError(message)


def expect_rejected(name, thunk):
    try:
        thunk()
    except (AssertionError, ValueError):
        return
    raise AssertionError(f"{name}: expected rejection")


def require_same_shape(left, right, name):
    if left.shape != right.shape:
        raise ValueError(f"{name}: {left.shape} != {right.shape}")


def require_vector(array, length, name):
    require(array.ndim == 1 and array.shape == (length,),
            f"{name}: expected vector ({length},), got {array.shape}")


require(X.shape == (4, 3), "fixture X must be (batch=4, feature=3)")
require((X + feature_bias).shape == (4, 3), "feature bias shape changed")
require((X @ w).shape == (4,), "linear score must return one value per example")
require(np.allclose(np.mean(X, axis=0), [4.5, 5.5, 6.5]),
        "column means do not match the hand calculation")
selected = logits[np.arange(logits.shape[0]), labels]
require(selected.shape == (4,), "class selection must return one score per example")

# Mistake 1: an accidental outer residual.
wrong_residual = pred - target_column
fixed_residual = pred - target_column.reshape(-1)
require(wrong_residual.shape == (4, 4), "mistake 1 fixture stopped being outer")
expect_rejected("mistake 1", lambda: require_same_shape(
    pred, target_column, "residual inputs"))
require(fixed_residual.shape == (4,), "mistake 1 repair is not a vector")

# Mistake 2: labels are indices, not a logit tensor.
wrong_class_arithmetic = logits - labels[:, None]
expect_rejected("mistake 2", lambda: require(
    wrong_class_arithmetic.shape == selected.shape,
    "class arithmetic must produce one selected score per example"))
require_vector(labels, logits.shape[0], "class labels")

# Mistake 3: a row-shaped offset is not a feature bias.
wrong_feature_add = X + sample_bias
fixed_feature_add = X + feature_bias
expect_rejected("mistake 3", lambda: require(
    np.allclose(wrong_feature_add, fixed_feature_add),
    "row bias accidentally accepted as feature bias"))
require(fixed_feature_add.shape == (4, 3), "mistake 3 repair changed shape")

# Mistake 4: equal token and hidden lengths hide the aligned axis.
wrong_position_add = states + position_values
fixed_position_add = states + position_values[None, :, None]
require(wrong_position_add.shape == states.shape,
        "mistake 4 should be silently shape-valid")
expect_rejected("mistake 4", lambda: require(
    np.allclose(wrong_position_add, fixed_position_add),
    "position values landed on the hidden axis"))

# Mistake 5: NCHW channel values align with width when both lengths are three.
wrong_channel_add = image_nchw + channel_bias
fixed_channel_add = image_nchw + channel_bias[None, :, None, None]
require(wrong_channel_add.shape == image_nchw.shape,
        "mistake 5 should be silently shape-valid")
expect_rejected("mistake 5", lambda: require(
    np.allclose(wrong_channel_add, fixed_channel_add),
    "channel values landed on the width axis"))

print("A0 acceptance: PASS")
```

The acceptance test is deterministic because the explicit fixtures, seed, and
expected shapes are fixed. If your environment changes a printed float, use a
tolerance for numeric comparisons but do not loosen axis or shape contracts.

### Failure states and diagnosis record

For each of mistakes 1–5, add one row to this report:

| Name | Symptom observed | Mathematical mechanism | Why the output is wrong | Test that catches it | Repair |
|---|---|---|---|---|---|
| Outer residual |  |  |  |  |  |
| Class-label arithmetic |  |  |  |  |  |
| Sample/feature bias |  |  |  |  |  |
| Token/hidden bias |  |  |  |  |  |
| Channel/width bias |  |  |  |  |  |

An acceptable diagnosis names the semantic axis that was lost. “NumPy gave the
wrong answer” is not a diagnosis; the library followed its broadcasting rule.

### Reset / rollback path

Use this path after every intentional failure so one mutation does not contaminate
the next result:

1. Save the clean starter block as `starter_baseline` or a separate notebook
   cell. Never repair the only copy.
2. Restart the Python process or notebook kernel, then rerun the fixture block so
   arrays are recreated rather than modified in place.
3. Reintroduce exactly one named mistake and capture its shape and values.
4. Restore the repaired expression from the table, rerun the acceptance tests,
   and confirm `A0 acceptance: PASS`.
5. Before submission, run from a fresh process with `SEED = 20260830`, record the
   environment version, and confirm the clean fixture and all five failure
   diagnoses are still present in the report.

If a test starts passing without a code change, reset the process and compare the
fixture shapes. A mutated array or stale notebook state is itself a failed reset.

## Checkpoint

- [ ] My ledger contains all 20 expressions, with named axes, predicted shapes, actual shapes, and decisions.
- [ ] I can explain why `X @ w`, `X * w`, and `X + feature_bias` have different meanings even when their inputs share lengths.
- [ ] I reproduced all five mistakes and kept evidence that the silent cases execute.
- [ ] My deterministic tests pass after repair and reject each named failure for a stated reason.
- [ ] My submission includes assumptions, versions, a hand reasonableness check, the reset record, and a 150–300 word decision memo.

## Rubric

Score the submission out of 100 using the A0 assessment weights:

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25 | Correct translations, indices, axis names, reductions, units/domains, and shape derivations for all 20 rows. |
| Computation | 20 | Starter fixture is reproducible; repaired expressions run; acceptance tests pass without hidden library magic. |
| Interpretation | 20 | The memo and ledger connect each shape to a model quantity or AI-system decision. |
| Diagnostics | 20 | All five mistakes include observed failure state, mechanism, deterministic guard, repair, and reset evidence. |
| Communication | 15 | Ledger, report, labels, plots/tables if used, assumptions, version, and decision memo are clear and reviewable. |

Minimum passing evidence is not just a total score: rows 16–20, the acceptance
tests, and the reset path must be present. A perfect-looking shape table without
the five deliberate failures is incomplete.

## What this does not solve

This clinic can show that a particular fixture obeys a stated shape contract. It
cannot prove that a feature order is correct, that labels are valid for the task,
that units were converted correctly, or that a model is accurate, calibrated,
fair, causal, or safe. Those claims need data validation, evaluation, and domain
review after the shape boundary passes.

## Continue, go deeper, apply it

- Continue: Vectors as coordinates and features
- Go deeper: Partial derivatives and coordinate-wise sensitivity
- Apply it: Linear algebra for ML
