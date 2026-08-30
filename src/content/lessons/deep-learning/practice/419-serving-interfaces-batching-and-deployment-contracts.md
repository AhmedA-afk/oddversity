---
title: "Serving interfaces, batching, and deployment contracts"
track: "deep-learning"
status: live
order: 419
summary: "Ship the exact model you evaluated"
duration: "18–30 min"
---


## Technical calculation and derivation

The serving function should implement (y=f_v(T_v(x))), where both transform and model version are fixed by the release. Microbatching partitions arrival stream into windows ((B,\tau)); choose max batch (B) and wait (	au) against throughput and queue delay evidence.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A camera client sends RGBA while the trained transform expects RGB; contract rejects or explicitly converts.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A text request exceeds the context limit; response exposes truncation policy and model version.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

Low-volume traffic waits indefinitely for a batch until a timeout sends a single item.

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

- **Symptom → likely cause → first check:** A text request exceeds the context limit; response exposes truncation policy and model version. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

A deployment contract defines inputs, preprocessing, outputs, confidence semantics, latency limits, idempotency, and error behavior. The serving path must use the same transforms and vocabulary as evaluation. Dynamic batching improves throughput but needs queue, timeout, and fairness controls.

## Worked scenario

For an image API, reject unsupported color modes rather than silently converting ambiguously. For a text API, return model version and truncation status. For batching, cap wait time so low-volume requests do not starve.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Write an API schema, simulate malformed and oversized inputs, and compare single-request and microbatch output equality. Define a safe fallback for unavailable model or low confidence.

## Failure modes to diagnose

A model endpoint returning HTTP 200 is not necessarily healthy. Silent truncation and inconsistent preprocessing are deployment bugs, not user errors.

## Decision standard

Version the contract with the model and make incompatible changes explicit migrations.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.
