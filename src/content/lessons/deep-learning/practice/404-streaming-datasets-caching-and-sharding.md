---
title: "Streaming datasets, caching, and sharding"
track: "deep-learning"
status: live
order: 404
summary: "Feed accelerators without changing the experiment"
duration: "18–30 min"
---


## Technical calculation and derivation

Let throughput be (min(r_{decode},r_{host},r_{transfer},r_{device})). Increasing workers only helps until a different term becomes the bottleneck. For (N) examples and (W) ranks, deterministic shard assignment (h(id)\bmod W) yields one owner per sample; verify coverage equals (N).

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A satellite dataset is bottlenecked by compressed-file decode, so extra GPU capacity does nothing until decode is parallelized.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A text corpus has a hot cache on one worker but cold reads on another; step-time variance becomes an experiment confound.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A streaming source emits late records; the manifest freezes membership while a later version captures them.

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

- **Symptom → likely cause → first check:** A text corpus has a hot cache on one worker but cold reads on another; step-time variance becomes an experiment confound. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

Input throughput is part of the model system. A PyTorch-style dataset should make sample decoding, deterministic transforms, caching, sharding, and collation explicit. The aim is to keep devices useful without allowing worker scheduling to alter membership, labels, or reproducibility.

## Worked scenario

For million-image training, cache decoded metadata rather than unbounded tensors; shard files by stable sample id; and make each worker’s random stream a deterministic function of run seed, epoch, and worker id.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Measure samples per second with one worker, many workers, and cache warm/cold states. Verify that two workers never emit the same shard in an epoch and that batch counts match the manifest.

## Failure modes to diagnose

Prefetching is not permission to exhaust host memory. Random augmentations must be seeded per sample, not by ambient global state. Never let a worker silently skip corrupt records without recording them.

## Decision standard

Choose an input budget—decode latency, CPU RAM, I/O, and GPU utilization—and profile it before changing the network.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.
