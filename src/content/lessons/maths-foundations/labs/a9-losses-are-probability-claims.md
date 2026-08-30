---
title: "A9 · Losses are probability claims lab"
track: "maths-foundations"
status: live
summary: "Cross-entropy is negative log-likelihood written as a per-example probability."
duration: "16 min read"
---

## The short answer

Cross-entropy is negative log-likelihood written as a per-example probability
loss. It rewards probability on the observed class and punishes confident wrong
predictions sharply. Accuracy sees only the final class; calibration checks
whether confidence matches outcomes; the KL calculation in this lab compares
aggregate true and predicted class rates. You will compute all four on a fixed
shifted-data fixture and explain why none replaces the others.

## Why this matters

The line `loss = cross_entropy(logits, labels)` hides a probabilistic contract:
logits need a normalisation, labels need a class order, and the reduction needs
a denominator. A finite loss can still be wrong if labels are shifted, classes
are averaged along the wrong axis, or a second softmax changes the inputs. A
headline accuracy can also hide a model that is dangerously confident when the
data distribution changes.

This is the A9 deliverable from the mathematics assignment
sequence. The fixture is deterministic and small enough to
recalculate by hand; NumPy verifies the derivation rather than replacing it.

## Lab contract and notation

- **Runtime:** Python 3 with NumPy; record exact versions.
- **Log base:** natural logarithm, so losses and KL values are in nats.
- **Binary convention:** `y∈{0,1}`, `p` is the predicted probability of class 1,
  and `p≥0.5` predicts class 1.
- **Multiclass convention:** rows are examples, columns are classes in the
  stated order; labels are zero-based class indices.
- **Reduction:** report per-example losses, their mean, and their sum. Never
  compare a sum from one dataset with a mean from another.
- **Calibration diagnostic:** top-label expected calibration error (ECE) with
  fixed confidence bins `[0.50,0.75)` and `[0.75,1.00]`. This is a diagnostic,
  not a proof of full probabilistic calibration.
- **KL diagnostic:** for a split, let `P=[1−mean(y), mean(y)]` be the empirical
  label distribution and `Q=[1−mean(p), mean(p)]` the mean predicted
  distribution. Report `D_KL(P||Q)`. This is a marginal-distribution check,
  not a replacement for per-example log-loss.

## How it works

The mechanism below moves from likelihood to cross-entropy, then separates
per-example probability claims from aggregate distribution checks.

### Binary derivation

For independent Bernoulli labels `yᵢ` and predicted positive probabilities
`pᵢ`, the likelihood is

```text
L = Πᵢ pᵢʸⁱ (1−pᵢ)^(1−yᵢ).
```

Taking a negative log converts the product into a sum:

```text
−log L = −Σᵢ [yᵢ log pᵢ + (1−yᵢ) log(1−pᵢ)].
```

Dividing by `n` gives mean binary cross-entropy. For one example with `y=1`,
the loss is `−log p`; with `y=0`, it is `−log(1−p)`. The probability support
must be positive for the observed outcome: a prediction of zero for a true
class creates infinite mathematical loss.

### Multiclass derivation

Let `qᵢₖ` be the predicted probability for class `k` on example `i`, and let
`yᵢₖ` be one-hot labels. The categorical likelihood is

```text
L = Πᵢ Πₖ qᵢₖʸⁱᵏ.
```

The mean negative log-likelihood is

```text
CE = −(1/n) Σᵢ Σₖ yᵢₖ log qᵢₖ
   = −(1/n) Σᵢ log qᵢ,true.
```

Only one one-hot term survives per row, but the sum over classes must happen
**before** the mean over examples. Dividing by `n×K` accidentally makes the
reported loss `K` times too small for one-hot labels.

### Cross-entropy, entropy, and KL

For a target distribution `P` and predicted distribution `Q`,

```text
H(P,Q) = −Σₖ Pₖ log Qₖ
       = −Σₖ Pₖ log Pₖ + Σₖ Pₖ log(Pₖ/Qₖ)
       = H(P) + D_KL(P||Q).
```

This decomposition says why cross-entropy includes irreducible target entropy
plus mismatch. In this lab, one-hot per-example targets have zero entropy, but
the aggregate shifted-data KL uses the empirical class distribution and answers
a different marginal question.

## Worked examples and variations

The examples progress from hand-computable likelihoods to shifted data,
numerically stable multiclass computation, and deliberately broken evaluation.

### Part 1 — hand calculations

Write exact products and logs before using a calculator.

### 1. Binary likelihood and per-example loss

Use

```text
y = [1, 0, 1]
p = [0.8, 0.25, 0.6].
```

The likelihood is
`0.8 × (1−0.25) × 0.6 = 0.8×0.75×0.6 = 0.36`.
The mean binary cross-entropy is

```text
−(1/3)[log(0.8) + log(0.75) + log(0.6)]
= −log(0.36)/3 ≈ 0.3406 nats.
```

Record the three individual losses as well. The product and the sum of logs
must produce the same likelihood ordering; the mean is a reporting reduction.

### 2. Multiclass likelihood and cross-entropy

Use class order `[refund, delivery, account]` and

```text
Y = [[1,0,0],
     [0,1,0],
     [0,0,1]]
Q = [[0.7,0.2,0.1],
     [0.1,0.6,0.3],
     [0.1,0.1,0.8]].
```

The likelihood of the observed labels is `0.7×0.6×0.8=0.336`. The mean
cross-entropy is `−log(0.336)/3≈0.3635` nats. The per-example losses are
`−log(0.7)`, `−log(0.6)`, and `−log(0.8)`. Verify that summing one-hot class
terms before averaging gives the same result.

### 3. Confident wrong versus cautious wrong

For `y=0`, compare:

```text
p=0.6:   −log(1−0.6)  ≈ 0.916 nats
p=0.999: −log(1−0.999)≈ 6.908 nats.
```

Both predict class 1 at the `0.5` threshold and therefore have the same
accuracy on this one example: wrong. Log-loss distinguishes the severity of the
probability claim. The large loss is not a moral judgement; it is the cost of
assigning almost all probability to the observed-wrong class.

### Boundary case: zero support

For `y=1,p=0`, the binary loss is `−log(0)=∞`. For multiclass true class `k`
with `qₖ=0`, the same happens. Clipping to `ε` makes the program finite but
changes the reported objective to one with a probability floor. State that floor
and keep the unclipped support violation visible.

### Counterexample: valid numbers, wrong label meaning

With class order `[refund, delivery, account]`, a prediction
`[0.7,0.2,0.1]` and true index `0` contribute `−log(0.7)`. If an evaluator
shifts the label to index `1`, it reports `−log(0.2)`—still finite, but for
the wrong class. The code has not proven the label mapping; the class-order
contract must travel with the model and evaluation fixture.

### Part 2 — deterministic shifted-data comparison

The fixture has eight binary cases. The hard predictions are the same for both
models, but their probability claims differ.

```text
in-domain labels: y_in    = [0,0,0,0,1,1,1,1]
shifted labels:   y_shift = [1,0,1,0,0,1,1,1]

careful model:    p_careful  = [0.20,0.30,0.40,0.45,0.55,0.60,0.70,0.80]
confident model:  p_confident = [0.01,0.05,0.10,0.20,0.99,0.99,0.99,0.99]
```

Both models predict `[0,0,0,0,1,1,1,1]`. On the in-domain split both are
correct on all eight cases. On the shifted split, the hard predictions are
correct on five cases, so both have accuracy `5/8=0.625`.

### Metrics and their questions

Implement these four quantities:

1. **Accuracy:** does the thresholded class match `y`?
2. **Mean log-loss:** how much probability did the model assign to each observed
   label?
3. **Top-label ECE:** within fixed confidence bins, does confidence match the
   fraction correct?
4. **Marginal KL:** how different is the aggregate true label rate from the
   aggregate predicted positive rate?

The shifted split is the important comparison. The careful model is less
confident on wrong cases. The confident model can have a closer aggregate
positive rate while making much more extreme per-example claims. If your report
contains only one score, it has not answered all four questions.

### Deterministic NumPy fixture

```python
import numpy as np

y_in = np.array([0, 0, 0, 0, 1, 1, 1, 1])
y_shift = np.array([1, 0, 1, 0, 0, 1, 1, 1])
p_careful = np.array([.20, .30, .40, .45, .55, .60, .70, .80])
p_confident = np.array([.01, .05, .10, .20, .99, .99, .99, .99])

def binary_losses(y, p):
    y = np.asarray(y, dtype=int)
    p = np.asarray(p, dtype=float)
    if y.shape != p.shape:
        raise ValueError("labels and probabilities must have the same shape")
    if np.any((y != 0) & (y != 1)):
        raise ValueError("binary labels must be 0 or 1")
    if np.any((p <= 0) | (p >= 1)):
        raise ValueError("unclipped probabilities must lie strictly between 0 and 1")
    return -(y * np.log(p) + (1 - y) * np.log1p(-p))

def accuracy(y, p):
    return np.mean((p >= .5) == y)

def top_label_ece(y, p):
    confidence = np.maximum(p, 1 - p)
    correct = ((p >= .5).astype(int) == y).astype(float)
    edges = ((.50, .75), (.75, 1.0000001))
    total = 0.0
    for lower, upper in edges:
        mask = (confidence >= lower) & (confidence < upper)
        if np.any(mask):
            total += mask.mean() * abs(confidence[mask].mean() - correct[mask].mean())
    return total

def marginal_kl(y, p):
    p_true = np.array([1 - y.mean(), y.mean()], dtype=float)
    p_pred = np.array([1 - p.mean(), p.mean()], dtype=float)
    return np.sum(p_true * np.log(p_true / p_pred))

def report(y, p):
    per_example = binary_losses(y, p)
    return {
        "accuracy": accuracy(y, p),
        "log_loss_mean": per_example.mean(),
        "log_loss_sum": per_example.sum(),
        "ece": top_label_ece(y, p),
        "marginal_kl": marginal_kl(y, p),
        "mean_prediction": p.mean(),
    }

for name, p in (("careful", p_careful), ("confident", p_confident)):
    print("in", name, report(y_in, p))
    print("shift", name, report(y_shift, p))

assert np.isclose(accuracy(y_shift, p_careful), 5 / 8)
assert np.isclose(accuracy(y_shift, p_confident), 5 / 8)
assert report(y_shift, p_careful)["log_loss_mean"] < report(y_shift, p_confident)["log_loss_mean"]
assert report(y_shift, p_careful)["ece"] < report(y_shift, p_confident)["ece"]
assert report(y_shift, p_confident)["marginal_kl"] < report(y_shift, p_careful)["marginal_kl"]
```

The last three assertions are the point of the fixture: on shifted data,
accuracy ties, the careful model wins per-example log-loss and top-label ECE,
while the confident model happens to have the closer aggregate class rate. The
metrics disagree because they measure different objects, not because one test
is broken.

### What to record

Make one table with rows `careful/in-domain`, `confident/in-domain`,
`careful/shifted`, and `confident/shifted`; include accuracy, mean and summed
log-loss, ECE, mean prediction, and marginal KL. Add a confidence-bin table
with bin count, mean confidence, and fraction correct. Label the shifted split
and the KL direction `D_KL(P_true||Q_pred)`.

### Part 3 — stable multiclass cross-entropy from logits

The loss API should consume logits and apply a stable log-softmax internally.
For logits `z`, subtracting the row maximum gives the same probabilities while
avoiding avoidable overflow:

```text
log softmax(z)ₖ = zₖ − log(Σⱼ exp(zⱼ))
               = zₖ − [m + log(Σⱼ exp(zⱼ−m))]
```

Use this deterministic three-class fixture:

```python
import numpy as np

logits = np.array([
    [2.0, 1.0, 0.0],
    [0.0, 2.0, 1.0],
    [1.0, 0.0, 2.0],
])
labels = np.array([0, 1, 2])

def log_softmax(z):
    z = np.asarray(z, dtype=float)
    if z.ndim != 2:
        raise ValueError("logits must be a batch-by-class matrix")
    row_max = z.max(axis=1, keepdims=True)
    shifted = z - row_max
    return shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))

def multiclass_losses(z, y):
    z = np.asarray(z, dtype=float)
    y = np.asarray(y, dtype=int)
    if z.ndim != 2 or y.ndim != 1 or z.shape[0] != y.shape[0]:
        raise ValueError("expected batch logits and one label per row")
    if np.any((y < 0) | (y >= z.shape[1])):
        raise ValueError("label index is outside the class range")
    log_probs = log_softmax(z)
    return -log_probs[np.arange(z.shape[0]), y]

per_example = multiclass_losses(logits, labels)
probs = np.exp(log_softmax(logits))
assert np.allclose(probs.sum(axis=1), 1.0)
assert np.all(per_example > 0)
assert np.isclose(per_example.mean(), -np.log(probs[np.arange(3), labels]).mean())
assert np.isclose(multiclass_losses(logits, labels).sum(), per_example.mean() * len(labels))
print("probabilities", probs)
print("per-example CE", per_example)
print("mean CE", per_example.mean())
```

The class order is part of the fixture. Report the probability assigned to the
true class for each row, not only the argmax.

## Two ways to see it

### Builder view

Treat the lab as a typed computation: labels identify classes, logits become a
probability vector, the true class selects one log probability, and the
reduction states what the reported number averages. Keep each intermediate
value visible so a finite result cannot hide a contract error.

### Systems or reviewer view

Treat the metrics as different questions about a changing service. Accuracy
checks decisions, log-loss checks the severity of probability claims, ECE checks
confidence against outcomes, and aggregate KL checks only a marginal rate. A
shifted or subgroup-specific failure can therefore survive any one headline
metric.

## Hands-on

### Failure fixtures, tests, and reset

Run each broken state separately and keep the failing output in the report.

### Failure A — confident-wrong probability

```python
y_bad = np.array([0])
p_bad = np.array([.999])
loss_bad = binary_losses(y_bad, p_bad)[0]
assert loss_bad > 6.0       # high loss exposes the confident wrong claim
```

**Test:** a review threshold should flag a per-example loss above `6` nats for
inspection; it must not be hidden by an otherwise good batch mean. **Reset:**
restore the original split and retain the per-example loss column.

### Failure B — invalid or shifted class labels

```python+try:
    multiclass_losses(logits, np.array([0, 3, 2]))
except ValueError as error:
    assert str(error) == "label index is outside the class range"
else:
    raise AssertionError("out-of-range label was accepted")

shifted_labels = (labels + 1) % logits.shape[1]
correct = multiclass_losses(logits, labels)
wrong_mapping = multiclass_losses(logits, shifted_labels)
assert not np.allclose(correct, wrong_mapping)
```

**Failure fixture:** the out-of-range label must fail loudly; the in-range
permutation is a semantic failure that can remain finite. **Test:** validate
range and compare a class-order sentinel with the expected true-class
probability. **Reset:** restore labels `[0,1,2]` and the documented class order.

### Failure C — wrong reduction axis

```python
one_hot = np.eye(logits.shape[1])[labels]
log_probs = log_softmax(logits)
correct_mean = -np.sum(one_hot * log_probs, axis=1).mean()
wrong_mean_over_examples_and_classes = -np.mean(one_hot * log_probs)

assert np.isclose(wrong_mean_over_examples_and_classes, correct_mean / 3)
assert not np.isclose(wrong_mean_over_examples_and_classes, correct_mean)
```

**Failure fixture:** average one-hot class terms over both examples and classes.
**Test:** require class reduction first and assert the mean/sum relationship.
Also compare a two-example and eight-example batch using mean loss; summed loss
must not be used as though it were size-independent. **Reset:** restore
`axis=1` class reduction, then average the resulting one loss per example.

### Failure D — clipping hides zero support

```python
try:
    binary_losses(np.array([1]), np.array([0.0]))
except ValueError as error:
    assert str(error) == "unclipped probabilities must lie strictly between 0 and 1"
else:
    raise AssertionError("zero support was silently clipped")
```

**Test:** report the mathematical infinity/support violation before applying any
explicit epsilon. **Reset:** replace zero with a documented positive floor only
if the production objective specifies that floor, and label the resulting loss
as clipped.

### Combined reset

Restore `y_in`, `y_shift`, the two probability arrays, the original multiclass
labels, stable log-softmax, and class-first reduction. Rerun every passing
assertion. The reset is complete only when both the valid fixture and the
failure tests pass for the intended reasons.

## Deliverables and feedback

Submit one notebook or report containing:

1. the binary likelihood derivation, per-example losses, mean, and sum;
2. the multiclass one-hot likelihood derivation and stable logit-based loss;
3. the four-row shifted-data metrics table and confidence-bin calibration table;
4. the confident-wrong, label/index, wrong-reduction, and zero-support failures;
5. passing tests, named errors, reset output, Python/NumPy versions, and log
   base/bin/tolerance conventions; and
6. a **150–300 word decision memo**: choose which metric or metric bundle you
   would gate for a stated AI decision under distribution shift, explain what
   the aggregate KL does and does not tell you, and name one calibration or
   support failure you would monitor.

Use these prompts before submitting:

- Retrieve: state the likelihood, binary CE, multiclass CE, calibration, and KL
  definitions in your own words.
- Calculate: reproduce `0.8×0.75×0.6`, the multiclass `0.7×0.6×0.8`, and the
  confident-wrong loss.
- Compute: run both models on in-domain and shifted labels; preserve per-example
  losses and bin assignments.
- Diagnose: explain why accuracy ties while log-loss and ECE disagree, and why
  aggregate KL can favour the worse per-example model in this fixture.
- Review: verify class order, probability support, reduction, shift label, KL
  direction, and threshold are all written beside the result.

## Acceptance rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25% | Correct binary/multiclass likelihood derivations, CE reduction, entropy/KL relationship, and stated conventions. |
| Computation | 20% | Reproducible deterministic NumPy output, stable log-softmax, per-example losses, and tested accuracy/ECE/KL functions. |
| Interpretation | 20% | Correct explanation of metric disagreement on shifted data, confident-wrong cost, and aggregate KL's limited scope. |
| Diagnostics | 20% | Confident-wrong, label/index, reduction-axis, and zero-support failures are exposed, named, tested, and reset. |
| Communication | 15% | Labelled metric/bin tables, versions and directions recorded, plus a 150–300 word decision memo with limitations. |

Pass requires at least 60% overall and no zero in Mathematical model or
Diagnostics. A better accuracy number without probability, calibration, and
failure analysis is incomplete.

## Checkpoint

- [ ] I derived binary and multiclass cross-entropy from likelihood and showed
  the exact reduction denominator.
- [ ] My hand values match the binary likelihood `0.36` and multiclass
  likelihood `0.336` examples.
- [ ] My shifted fixture reports tied accuracy, lower careful-model log-loss and
  ECE, and the aggregate KL comparison with its direction labelled.
- [ ] My multiclass implementation uses stable log-softmax and validates label
  range/class order.
- [ ] My confident-wrong, wrong-label, wrong-reduction, and zero-support tests
  expose named failures rather than silently producing a plausible scalar.
- [ ] My reset returns the valid fixtures and all required assertions to passing.
- [ ] My decision memo names a metric gate, shift policy, monitoring signal, and
  limitation.

## What this does not solve

Cross-entropy does not guarantee calibration, fairness, causal validity, correct
labels, or useful decisions under shift. ECE depends on binning and sample size;
aggregate KL can miss conditional or subgroup failures; accuracy ignores
confidence; and a lower loss on one fixture does not prove deployment quality.
Clipping and label smoothing change the objective. Evaluation still needs
held-out, subgroup-aware, task-specific data and an explicit action policy.

## Continue, go deeper, apply it

- Continue: Likelihood, cross-entropy, and classification objectives
- Go deeper: KL divergence and distribution mismatch
- Apply it: Classifiers, thresholds, and calibration

## M9 reference route

- Self-information and coding intuition
- Entropy and uncertainty
- Cross-entropy and negative log-likelihood
- KL divergence and distribution mismatch
- Mutual information and representation relevance
- Likelihood, cross-entropy, and classification objectives
- Naive Bayes and generative versus discriminative modelling
- Latent variables and ELBO intuition
- Exponential families, sufficient statistics, and GLM intuition
