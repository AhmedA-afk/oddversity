---
title: "Data contracts and schema audits"
track: "deep-learning"
status: live
order: 401
summary: "Define the dataset before the model"
duration: "18–30 min"
---


## Technical calculation and derivation

Let (D_v=(M_v,T_v,L_v)) denote a data version: immutable manifest (M_v), transform (T_v), and labeling policy (L_v). A model claim is conditional on all three. If 3 of 1,000 records fail a required-field check, the missingness rate is (3/1000=0.3\%\); the useful question is whether those three share a device, site, or class, not whether the percentage is small.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A photo source changes its exposure field from milliseconds to seconds; range validation catches a 1,000-fold unit shift before normalization.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

An annotation vendor changes “uncertain” from excluded to negative; the label-policy version changes even if image bytes do not.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A deletion request arrives for one account; lineage identifies raw item, cached crop, training shard, and release affected.

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

- **Symptom → likely cause → first check:** An annotation vendor changes “uncertain” from excluded to negative; the label-policy version changes even if image bytes do not. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

A training dataset is a versioned interface, not a folder of examples. Specify fields, units, allowed ranges, missing-value meaning, label provenance, ownership, and retention. Validate the contract before shuffling or tensorizing; a model cannot repair a target whose collection process is incoherent.

## Worked scenario

For an image triage system, require image bytes, acquisition device, patient-free encounter key, timestamp, annotator policy, label confidence, and split group. A 0/1 label without its review protocol is not enough evidence to train a clinical decision aid.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Test a clean fixture, a missing required field, a unit mismatch, a duplicate entity, and a late-arriving label. Record whether the pipeline rejects, quarantines, or repairs each case.

## Failure modes to diagnose

A schema check that silently fills missing labels changes the learning problem. Keep raw data immutable, emit a validation report, and make every correction explicit.

## Decision standard

Write a contract and an automated audit before selecting an architecture. The report should make an external reviewer able to answer: what is an example, who labeled it, and what can change?

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.
