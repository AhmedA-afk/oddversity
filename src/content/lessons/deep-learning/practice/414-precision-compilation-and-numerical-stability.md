---
title: "Mixed precision, compilation, and numerical stability"
track: "deep-learning"
status: live
order: 414
summary: "Speed up without losing the objective"
duration: "18–30 min"
---


## Technical calculation and derivation

Stable log-softmax uses (\log\sum_ie^{z_i}=a+\log\sum_ie^{z_i-a}) with (a=\max_i z_i). Mixed precision should keep reductions and vulnerable operations safe; compare a numerical tolerance such as (|m_{fp16}-m_{fp32}|\le\delta) on fixed evaluation.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

Large logits overflow naive exponentials while shifted logits remain finite.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A variance estimate underflows in half precision for nearly identical activations.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A compiled graph assumes static shape; an unexpected sequence length creates recompilation and a tail-latency issue.

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

- **Symptom → likely cause → first check:** A variance estimate underflows in half precision for nearly identical activations. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

Mixed precision trades numerical range for speed and memory. Use autocast for eligible operations, scale losses when appropriate, and retain sensitive reductions or normalizations in safe precision. Compilation can reduce overhead but should be gated by numerical and shape tests.

## Worked scenario

Softmax of large logits should use a stable log-sum-exp formulation. Half-precision variance on nearly identical values can underflow. Dynamic shapes can cause compilation recompiles that erase a claimed speed gain.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Compare fp32 and mixed-precision metrics on a deterministic fixture, inspect non-finite gradients, and test a compiled and eager model across two batch shapes.

## Failure modes to diagnose

Turning on autocast is not a benchmark. If loss scale repeatedly overflows, investigate inputs and objective scale rather than merely retrying.

## Decision standard

Adopt a precision mode only with accuracy tolerance, throughput benefit, and non-finite rate documented.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.

## Architecture audit

Use a numerical acceptance suite rather than a single validation score. It should include extreme logits, all-masked rows when contractually allowed, tiny variances, maximum input length, and a representative slice set. For each test, compare eager fp32, eager mixed precision, and compiled execution using explicit absolute and relative tolerances. When a mismatch appears, reduce to the first divergent operation and keep a regression fixture. This makes performance features reversible engineering choices instead of opaque global toggles.
