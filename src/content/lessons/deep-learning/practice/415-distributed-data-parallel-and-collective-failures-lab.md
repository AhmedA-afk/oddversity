---
title: "Graded lab: distributed data parallel design"
track: "deep-learning"
status: live
order: 415
summary: "Scale the experiment, not the bugs"
duration: "18–30 min"
---


## Technical calculation and derivation

For rank-local counts (n_r) and correct (c_r), global accuracy is (sum_rc_r/\sum_rn_r), not (R^{-1}\sum_r c_r/n_r). With world size (W), each sampler must partition one epoch's manifest; rank assignment is a correctness property before it is a speed property.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

Thirteen examples over two ranks require an explicit drop/pad policy for the final shard.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

One rank has no positives; averaging per-rank F1 is undefined or misleading without global aggregation.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A worker fails during all-reduce; elastic restart must know which checkpoint and data cursor are valid.

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

- **Symptom → likely cause → first check:** One rank has no positives; averaging per-rank F1 is undefined or misleading without global aggregation. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

Distributed data parallelism replicates a model and partitions data, then all-reduces gradients. Correctness requires one global view of the data manifest, sampler epoch setting, metric reduction, checkpoint ownership, and failure handling. Scaling can alter batch size and optimizer dynamics.

## Worked scenario

With four workers, each must receive disjoint examples for an epoch. Validation metrics must aggregate numerators and denominators, not average already-averaged worker scores. Only a designated rank should write shared artifacts.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Sketch a two-worker sampler for a 13-example dataset, calculate each rank’s assignment, and design a resume protocol after one rank fails. Explain how you will keep a global batch-size comparison fair.

## Failure modes to diagnose

Calling collective operations in different orders causes a hang. Letting every rank write the same checkpoint corrupts artifacts. An unseeded distributed sampler can duplicate or omit data.

## Decision standard

Deliver a launch plan, sharding proof, metric-reduction calculation, and failure/restart runbook.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.


## Assessed deliverable

**Grading (10 points):** 3 for correct data/metric logic, 3 for failure handling, 2 for scaling experiment design, 2 for artifact ownership.

## Architecture audit

Run a two-rank equivalence test on a fixed manifest: compare one-process and distributed updates after the same effective global batch, including reduced metrics and checkpoint contents. Add a timeout and structured rank-local logs around collectives so a hang has evidence rather than silence. Simulate rank-zero restart and a nonzero-rank failure, then verify that only approved artifacts survive and resumed sampling neither duplicates nor omits examples beyond the declared sampler policy. Scaling is ready only after this correctness harness passes.
