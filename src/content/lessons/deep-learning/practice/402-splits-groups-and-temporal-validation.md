---
title: "Splits, groups, and temporal validation"
track: "deep-learning"
status: live
order: 402
summary: "Create evidence for generalization"
duration: "18–30 min"
---


## Technical calculation and derivation

For a score (hat m) to estimate deployment performance, test examples must be independent of training conditional on the information available at decision time. For grouped data, no group id may satisfy (g_i=g_j) across train/test. For time, require (t_{train}<t_{validation}<t_{test}). Calculate overlap as (|G_{train}\cap G_{test}|/|G_{test}|), which must be zero for a grouped holdout.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A retinal classifier has both eyes from one patient; random image split leaks person-specific texture.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A demand forecaster is evaluated on January after training through December; testing it on random December rows is future leakage.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A recommender predicts next-week clicks; all impressions from a session must be ordered before held-out outcomes.

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

- **Symptom → likely cause → first check:** A demand forecaster is evaluated on January after training through December; testing it on random December rows is future leakage. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

A validation score estimates performance only for the future population represented by the split. Randomly splitting correlated rows—multiple frames from a video, visits from one person, or transactions from one account—usually creates overly optimistic evidence. Split at the deployment unit and respect time where the decision is temporal.

## Worked scenario

A churn model that has two snapshots per customer must group by customer. A defect detector trained on yesterday and tested on earlier images violates deployment order. A recommender must evaluate future interactions, not held-out events from the same session.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Compare random, group, and temporal splits. For each, list the information allowed at prediction time and estimate the direction of score bias. Keep a fixed untouched test set for a release decision.

## Failure modes to diagnose

Do not tune on the test set through repeated “one last” experiments. Do not stratify by a feature that is unknown at serving time. A split is an experimental design, not a convenience call.

## Decision standard

Choose the split rule before reading model results and version its indices. Report entity overlap, time ranges, class prevalence, and reasons the test set resembles the decision environment.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.
