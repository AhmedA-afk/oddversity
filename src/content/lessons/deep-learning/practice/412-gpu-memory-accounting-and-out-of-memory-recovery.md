---
title: "GPU memory accounting and OOM recovery"
track: "deep-learning"
status: live
order: 412
summary: "Budget parameters, activations, and optimizer state"
duration: "18–30 min"
---


## Technical calculation and derivation

A rough fp32 AdamW parameter-state budget for (P) parameters is weights (4P), gradients (4P), moments (8P): (16P) bytes before activations. If activation tensor has shape (B\times L\times d), one saved copy costs (4BLd) bytes in fp32; attention maps add terms proportional to (BL^2).

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A transformer doubles sequence length and OOMs although parameter count is unchanged.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A vision model increases crop resolution; feature maps in early layers dominate memory.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A batch with one exceptionally long document triggers OOM; token-based batching prevents it.

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

- **Symptom → likely cause → first check:** A vision model increases crop resolution; feature maps in early layers dominate memory. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

GPU memory is consumed by parameters, gradients, optimizer states, activations, temporary kernels, and fragmentation. Activations usually dominate during training; batch size, sequence length, and feature maps can grow memory much faster than parameter count.

## Worked scenario

Estimate memory for a 100M-parameter AdamW model: weights, gradients, and two moment tensors already require several gigabytes in fp32 before activations. Doubling sequence length makes attention intermediates grow roughly quadratically in dense attention.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Profile allocated versus reserved memory, reduce one dimension at a time, and compare gradient accumulation with a smaller batch. Capture the exact batch shape that triggered an out-of-memory error.

## Failure modes to diagnose

Emptying a cache may reduce fragmentation but cannot fix a genuine budget violation. Gradient accumulation changes batch statistics and scheduler semantics; it is not identical to a larger physical batch.

## Decision standard

Write a memory budget before a scale-up and store profiler snapshots with the configuration.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.

## Architecture audit

Construct a memory worksheet for three candidate shapes and separate persistent from peak allocations. Then run a controlled recovery ladder: remove anomalous long examples; reduce sequence or image dimension; use a smaller physical batch with documented accumulation; enable memory-saving techniques; and finally reconsider architecture. After each change, recheck numerical equivalence and throughput. Record the maximum safe shape with a safety margin; planning exactly to the observed peak leaves no room for allocator behavior, evaluation, or operational variability.
