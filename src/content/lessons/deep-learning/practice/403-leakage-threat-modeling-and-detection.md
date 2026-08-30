---
title: "Leakage threat modelling and detection"
track: "deep-learning"
status: live
order: 403
summary: "Find forbidden paths to the label"
duration: "18–30 min"
---


## Technical calculation and derivation

For every feature (x_j), define availability (a_j) as the latest time it can be known and outcome time (t_y). A feature is forbidden when (a_j>t_{predict}), even if correlation is real. An adversarial single-feature model with unexpectedly high AUC is a test signal, not proof by itself.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A fraud system uses chargeback outcome codes written days after the authorization prediction.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A ticket classifier gets the answer from a resolution macro inserted after an agent finishes work.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A camera classifier reads class names embedded in storage paths rather than visual signal.

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

- **Symptom → likely cause → first check:** A ticket classifier gets the answer from a resolution macro inserted after an agent finishes work. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

Leakage is information available in training but unavailable, delayed, or causally downstream at inference. It can enter through features, preprocessing fit on all rows, duplicate examples, target encoding, labels embedded in filenames, or human workflow artifacts. Treat leakage as a threat model with concrete attack paths.

## Worked scenario

A hospital discharge code predicts a condition perfectly because it is assigned after diagnosis. A text classifier learns the label from an annotation template. Scaling all data before splitting lets the validation distribution influence the training transform.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Draw a data-flow diagram from source to prediction. For every column, name its event time and owner. Run adversarial baselines: identifier-only, timestamp-only, and suspicious-feature-only models; implausibly strong results are investigation triggers.

## Failure modes to diagnose

Feature importance is not a leakage proof, and a weak correlation is not automatically safe. Inspect the production timestamp and business process, then test the feature’s availability with a replay.

## Decision standard

A release should include a leakage register: suspected channel, test, result, mitigation, and reviewer. Re-run it whenever the upstream process changes.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.
