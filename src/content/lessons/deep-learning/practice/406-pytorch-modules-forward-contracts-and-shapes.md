---
title: "PyTorch modules, forward contracts, and shape discipline"
track: "deep-learning"
status: live
order: 406
summary: "Design models that fail loudly"
duration: "18–30 min"
---


## Technical calculation and derivation

For linear input (X\in\mathbb R^{B\times d}), logits are (Z=XW+\mathbf1b^\top\in\mathbb R^{B\times C}), with (W\in\mathbb R^{d\times C}). Cross-entropy consumes logits: (-\log\frac{e^{z_y}}{\sum_ce^{z_c}}). Adding softmax before a logit loss changes numerical behavior and often the gradient.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

An image module expects NCHW; a camera service sends NHWC, producing plausible but wrong activations.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A language batch contains all padding for one sequence; the forward contract must define a valid masked output.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A multi-label task accidentally uses single-label cross entropy instead of independent sigmoid losses.

Specify the failure boundary: when should the system abstain, quarantine data, block release, or escalate to a person rather than continue automatically?

## Implementation blueprint

```text
resolve immutable configuration and input manifest
validate the lesson-specific invariant on a tiny deterministic fixture
run baseline with metrics, slices, timings, and artifact hashes
run one controlled change under the identical split and budget
assert release or alert conditions; save decision record and failure examples
```

Translate this blueprint into framework code only after its inputs and outputs are unambiguous. In PyTorch-style systems, make device, dtype, random generator, train/eval mode, and masks explicit function arguments or checked state. The “happy path” is insufficient: test empty batches where allowed, boundary shapes, unavailable metadata, interrupted execution, and a result that fails the acceptance target.

## Debug and error gallery

- **Symptom → likely cause → first check:** A language batch contains all padding for one sequence; the forward contract must define a valid masked output. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

A module is a contract from structured tensors to structured outputs. Record shapes, dtypes, masks, normalization assumptions, and training-versus-evaluation behavior at each boundary. A forward pass that accepts any tensor can hide an incorrect channel order or a broadcasted loss.

## Worked scenario

For a classifier, assert `(batch, channels, height, width)` at input and `(batch, classes)` at logits; keep softmax out of a cross-entropy module that already expects logits. For sequences, carry lengths or masks beside embeddings.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Trace one batch through an MLP, a convolutional block, and attention. Write the parameter count and output shape after each block. Test batch size one, an odd image size, and an all-padding sequence.

## Failure modes to diagnose

A shape that broadcasts is not necessarily correct. Calling dropout or batch norm in training mode during evaluation contaminates metrics; calling evaluation mode during training changes optimization.

## Decision standard

Use assertions near interfaces and unit tests for device movement, dtype, masks, and output ranges. Shape algebra is a debugging tool, not bookkeeping.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.
