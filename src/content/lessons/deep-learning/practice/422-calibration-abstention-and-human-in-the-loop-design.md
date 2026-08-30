---
title: "Calibration, abstention, and human-in-the-loop design"
track: "deep-learning"
status: live
order: 422
summary: "Use uncertainty to route decisions"
duration: "18–30 min"
---


## Technical calculation and derivation

For a bin of predictions near (p), calibration compares (p) with observed frequency (hat p). Brier score is (N^{-1}\sum_i(\hat p_i-y_i)^2). Selective risk evaluates error only on accepted cases, while coverage is the accepted fraction; an abstention threshold trades one for the other.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A medical triage model sends mid-confidence cases to clinicians, but staff capacity limits coverage.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A support model is calibrated overall but overconfident for a low-resource language slice.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A fraud team overturns most high-confidence alerts after a policy change, revealing stale calibration.

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

- **Symptom → likely cause → first check:** A support model is calibrated overall but overconfident for a low-resource language slice. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

A confidence score is useful only when its meaning is checked. Calibration compares predicted probabilities with observed outcomes; selective prediction abstains when expected harm or uncertainty warrants review. Human review is a system component with capacity, disagreement, and feedback-bias properties.

## Worked scenario

At 0.8 calibrated confidence, roughly 80% of comparable predictions should be correct. A triage model might auto-route low-risk cases, request extra information for middle scores, and escalate high-impact uncertain cases.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Plot reliability bins, calculate expected calibration error with caveats, and draw a coverage-risk curve. Compute review volume at two abstention thresholds and verify it fits staffing.

## Failure modes to diagnose

Temperature scaling on the validation set does not guarantee future calibration. Sending all difficult cases to humans without measuring reviewer agreement hides a second model.

## Decision standard

Choose thresholds by utility, harm, and capacity; log whether the human accepted or overturned the recommendation.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.
