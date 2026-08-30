---
title: "Graded staged capstone and technical defense"
track: "deep-learning"
status: live
order: 430
summary: "Defend an end-to-end deep learning system"
duration: "18–30 min"
---


## Technical calculation and derivation

A defensible capstone connects claim to evidence chain: (problem\rightarrow data\rightarrow split\rightarrow implementation\rightarrow experiments\rightarrow evaluation\rightarrow release\rightarrow monitoring). Each arrow has an artifact. During defense, calculations such as threshold capacity (N_{alerts}=N\times P(score\ge\tau)) make trade-offs inspectable.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A health-routing project must justify why no patient-level information crosses splits.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A visual defect project must defend a low-light slice and review capacity at the chosen threshold.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A language project must explain feedback eligibility and privacy retention before proposing retraining.

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

- **Symptom → likely cause → first check:** A visual defect project must defend a low-light slice and review capacity at the chosen threshold. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

The capstone asks for a bounded decision problem, not a leaderboard project. Build a reproducible deep learning system with governed data, a justified architecture, controlled experiments, independent evaluation, deployment design, and operations plan. Every claim must be traceable to an artifact.

## Worked scenario

Stage 1: problem statement, stakeholders, data contract, harm analysis, and split plan. Stage 2: baseline, training configuration, experiment table, and error analysis. Stage 3: release gate, model card, deployment/monitoring plan, and incident/rollback drill.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

During defense, explain why your split prevents the most plausible leakage, reproduce one run from configuration, justify a threshold against capacity, interpret one failure slice, and name the evidence that would block shipping.

## Failure modes to diagnose

A polished demo does not pass without provenance, reproducibility, and explicit limitations. Do not hide a failed experiment or a dataset exclusion that changes the claim.

## Decision standard

Submit the repository, artifact manifest, report, model card, monitoring mock-up, and a ten-minute oral defense.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.


## Assessed deliverable

**Grading (100 points):** 15 problem/data contract; 15 leakage/split evidence; 15 implementation and reproducibility; 15 experimental rigor; 15 evaluation/slices; 10 safety/privacy/fairness; 10 deployment/monitoring/incident plan; 5 clarity and evidence-bound defense.
