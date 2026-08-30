---
title: "Graded lab: training loop, optimizer, and checkpoint"
track: "deep-learning"
status: live
order: 407
summary: "Turn an objective into an auditable run"
duration: "18–30 min"
---


## Technical calculation and derivation

For batch losses (l_b) with sizes (n_b), epoch mean is (sum_bn_bl_b/\sum_bn_b), not (B^{-1}\sum_bl_b) when sizes differ. A resume state requires weights, optimizer moments, scheduler, epoch/step, RNG, data cursor, and resolved config.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A final short batch has higher loss; unweighted averaging makes the epoch look worse than the sample-level result.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A preemptible training job resumes at the same epoch but repeats samples because sampler state was omitted.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

Gradient clipping converts an exploding norm from 200 to a configured threshold of 1; log both values.

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

- **Symptom → likely cause → first check:** A preemptible training job resumes at the same epoch but repeats samples because sampler state was omitted. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

A robust loop separates model forward, loss, backward pass, optimizer step, scheduler step, metric accumulation, checkpointing, and evaluation. Log enough state to reproduce the decision: code revision, configuration, data version, seed, optimizer state, and best-validation checkpoint.

## Worked scenario

For a three-class classifier, calculate mean loss weighted by example count—not mean of per-batch means when batch sizes vary. Save checkpoints after validation and resume without resetting the learning-rate schedule.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Implement gradient clipping, compare AdamW against SGD with momentum under a fixed budget, and verify resume-by-interruption produces the same next metric on a deterministic fixture.

## Failure modes to diagnose

Calling `zero_grad` in the wrong place accumulates gradients; stepping a scheduler per batch instead of per epoch changes its meaning. Saving only model weights makes exact resumption impossible.

## Decision standard

Deliver a concise run log, a checkpoint manifest, learning curves, and a resume test.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.


## Assessed deliverable

**Grading (10 points):** 3 for correct loop/state handling, 2 for controlled optimizer comparison, 3 for reproducible resume evidence, 2 for diagnosis of one unstable run.

## Architecture audit

Before a long run, hand-trace one batch through the state machine: load `(x,y)`, set training mode, clear gradients, compute logits and scalar loss, backpropagate, measure/clip gradients, update parameters, advance the scheduler at its declared cadence, and persist state only at a consistent boundary. On resume, compare the next sampled IDs, learning rate, global step, and first post-resume loss with an uninterrupted control. If any differ, the checkpoint is not yet an experiment continuation; it is a new run that needs a separate identifier.
