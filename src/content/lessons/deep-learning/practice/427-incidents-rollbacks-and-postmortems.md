---
title: "Incidents, rollbacks, and postmortems"
track: "deep-learning"
status: live
order: 427
summary: "Recover safely and learn without blame"
duration: "18–30 min"
---


## Technical calculation and derivation

An incident timeline separates detection time, mitigation time, recovery time, and full-resolution time. Mean time to detect and restore are system metrics, but the core test is whether a team can safely reduce harm. Preserve evidence before mutations when privacy and legal rules allow.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A feature unit change raises scores; automation is disabled, then a signed artifact plus compatible transform is restored.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A model endpoint returns stale predictions after cache invalidation; response team chooses bypass versus rollback.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A harmful false negative is reported by an operator; triage protects affected users before model root-cause analysis.

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

- **Symptom → likely cause → first check:** A model endpoint returns stale predictions after cache invalidation; response team chooses bypass versus rollback. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

An ML incident can be a system outage, correctness regression, data integrity failure, safety event, privacy event, or decision-quality degradation. Prepare detection, containment, rollback, communication, evidence preservation, and a blameless learning process before release.

## Worked scenario

A feature pipeline switches from dollars to cents, increasing scores. A deployed tokenizer differs from the evaluated one. A monitoring alert catches it, the team disables automation, restores a signed prior artifact, and preserves logs for diagnosis.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Write a severity matrix and a 30-minute response timeline. Practice rollback with a model registry alias, then create a postmortem separating trigger, contributing factors, detection gap, and concrete follow-ups.

## Failure modes to diagnose

A rollback to the old model may be unsafe if the input schema itself changed. Do not treat an incident as solved by a dashboard green light without checking downstream decisions.

## Decision standard

Every production model needs an on-call owner, safe mode, rollback procedure, stakeholder communication path, and post-incident action tracker.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.
