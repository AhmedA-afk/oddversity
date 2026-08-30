---
title: "Graded lab: experiment tracking and ablations"
track: "deep-learning"
status: live
order: 410
summary: "Learn from comparisons instead of dashboards"
duration: "18–30 min"
---


## Technical calculation and derivation

For an ablation contrast, estimate (Delta=m_{treatment}-m_{baseline}) under matched split, seed policy, budget, and stopping rule. If five variants are tried, the largest (Delta) is selection-biased; preserve every run and report uncertainty or repeated seeds.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

Weight decay improves a vision model only when augmentation is fixed; changing both makes attribution impossible.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A new tokenizer raises accuracy but doubles p95 latency; the decision record weighs service cost against gain.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A better overall score hides a regression on short, noisy inputs discovered in an error gallery.

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

- **Symptom → likely cause → first check:** A new tokenizer raises accuracy but doubles p95 latency; the decision record weighs service cost against gain. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

Experiment tracking is structured scientific bookkeeping. Give each run a question, fixed budget, configuration, data identity, metrics, artifacts, and conclusion. Ablations remove or change one mechanism so a performance difference has an interpretable cause.

## Worked scenario

For a CNN, compare baseline, augmentation, weight decay, and both. If two changes occur together, the result answers only whether the bundle helped. Track wall-clock cost and confidence intervals, not a single best number.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Create a four-run ablation matrix, capture a confusion matrix and error gallery for each, then write a decision record that says which change will be retained and which uncertainty remains.

## Failure modes to diagnose

Selecting the best of many noisy validation runs inflates confidence. A dashboard is not an analysis; write the decision that follows from the evidence.

## Decision standard

Deliver a versioned experiment table, artifacts for the winning and baseline runs, and a one-page decision record.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.


## Assessed deliverable

**Grading (10 points):** 3 for controlled design, 2 for complete provenance, 3 for evidence-based conclusion, 2 for uncertainty/cost reporting.
