---
title: "Graded lab: fairness, accessibility, and ethical impact"
track: "deep-learning"
status: live
order: 425
summary: "Evaluate harms beyond the aggregate"
duration: "18–30 min"
---


## Technical calculation and derivation

For a group (g), false-negative rate is (FN_g/(TP_g+FN_g)); comparing it across groups exposes one possible disparity, but equalizing it can conflict with calibration when base rates differ. Metrics must follow the decision and label process, not precede them.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A resume screen has similar accuracy by group but different false-negative rates for qualified applicants.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A speech assistant works well on common accents but has high abstention for a region absent from training.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

An assistive UI uses a small font and times out before a screen-reader workflow completes.

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

- **Symptom → likely cause → first check:** A speech assistant works well on common accents but has high abstention for a region absent from training. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

Fairness metrics formalize different, sometimes incompatible, goals. Their applicability depends on the decision, affected groups, labels, base rates, and intervention. Accessibility and harms to non-measured groups need qualitative investigation as well as metrics.

## Worked scenario

A hiring screen may show equal aggregate accuracy while false-negative rates differ by group. A voice interface may be less usable for accents absent from the training data. A proxy variable can recreate a protected attribute’s disparities.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Choose a decision context, construct a slice plan, calculate two group metrics on a fixture, and explain the trade-off. Interview or simulate impacted-user requirements and propose a human escalation or product change.

## Failure modes to diagnose

Optimizing parity on flawed labels can make a system appear fairer while retaining the underlying injustice. Do not publish sensitive subgroup results without considering privacy and misuse.

## Decision standard

Deliver an impact assessment, slice evidence, known limitations, mitigation plan, and a stop-ship condition.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.


## Assessed deliverable

**Grading (10 points):** 3 for context and affected parties, 3 for correct metric reasoning, 2 for accessibility/qualitative evidence, 2 for accountable mitigation.
