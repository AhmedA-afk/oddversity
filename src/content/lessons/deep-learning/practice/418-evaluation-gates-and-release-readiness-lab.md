---
title: "Graded lab: evaluate a release candidate"
track: "deep-learning"
status: live
order: 418
summary: "Translate metrics into a release decision"
duration: "18–30 min"
---


## Technical calculation and derivation

A gate is a boolean conjunction over precommitted constraints: (G=G_{quality}\land G_{slice}\land G_{robustness}\land G_{latency}\land G_{safety}\). A high aggregate metric cannot compensate for a failed non-negotiable harm or operational condition. Use intervals where sampling uncertainty matters.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A fraud candidate improves AUROC but produces 4× the review queue at its threshold.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A vision release passes clean accuracy but misses a low-light slice required by contract.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A summarizer has high quality but violates p99 latency for a real customer payload distribution.

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

- **Symptom → likely cause → first check:** A vision release passes clean accuracy but misses a low-light slice required by contract. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

A release gate combines task quality, robustness, safety, fairness, latency, cost, and operational readiness. Predefine thresholds and escalation paths; do not negotiate them after seeing a favorable headline metric. Evaluate slices that correspond to affected users and known hard regimes.

## Worked scenario

A fraud model can improve overall AUROC while missing a protected subgroup or exceeding review capacity at its chosen threshold. A vision model can pass clean accuracy while failing a harmless lighting shift.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Define a gate table with minimum metrics, confidence intervals, slice requirements, performance SLO, rollback criterion, and named owner. Evaluate a candidate on fixed test, stress, and canary fixtures.

## Failure modes to diagnose

A single aggregate score is not release readiness. Do not substitute a training curve for an independent evaluation. Threshold changes require downstream capacity analysis.

## Decision standard

Deliver the gate table, an evidence bundle, and a signed decision: ship, canary, retrain, or block.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.


## Assessed deliverable

**Grading (10 points):** 3 for relevant gates, 3 for slice/robustness evidence, 2 for operational criteria, 2 for defensible decision.
