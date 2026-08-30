---
title: "Batching, collation, masking, and token budgets"
track: "deep-learning"
status: live
order: 408
summary: "Ensure padding cannot become signal"
duration: "18–30 min"
---


## Technical calculation and derivation

Masked token loss is (L=-\frac{1}{\sum_{bt}m_{bt}}\sum_{bt}m_{bt}\log p(y_{bt}|x)). Padding must have (m_{bt}=0); otherwise length distribution becomes an accidental objective. For dense attention, memory scales roughly with (B L^2), so token budget is often more stable than fixed batch count.

Do the arithmetic on a small fixture before trusting framework output. Write down the tensor or record shape at every operation, the denominator used by every average, and the exact event time at which each signal exists. Those three details catch a surprising fraction of apparently sophisticated deep-learning failures. In a production review, numerical correctness also means that a metric corresponds to a decision: name the denominator, the slice, and the threshold or action it informs.

## Three distinct worked scenarios

### Scenario 1

A chatbot batch mixes 20-token and 2,000-token requests; bucketing reduces waste but must not alter evaluation membership.

State what is observable at train time, validation time, and prediction time. Then identify one artifact that would let another engineer verify the claim.

### Scenario 2

A speech batch pads silence; an incorrect mask treats silence as a highly frequent phoneme.

Compare a baseline that ignores this concern with a controlled intervention. Preserve both results; an intervention without its baseline cannot establish benefit.

### Scenario 3

A decoder has teacher-forced targets shifted one step incorrectly, so it can see the token it is asked to predict.

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

- **Symptom → likely cause → first check:** A speech batch pads silence; an incorrect mask treats silence as a highly frequent phoneme. Inspect the smallest deterministic fixture before changing hyperparameters.
- **Symptom → likely cause → first check:** undefined Save the exact configuration and manifest so the comparison is replayable.
- **Symptom → likely cause → first check:** undefined If the error affects safety, privacy, or a release gate, contain impact before optimizing the model.

A useful debug log includes run id, data/split id, model artifact id, host/device facts, first failing sample identifiers when permitted, stack trace, measured invariant, mitigation, and follow-up owner. Never “fix” an error by filtering inconvenient examples without documenting the policy change and measuring which population was removed.

## Graded practice and rubric

**Prompt.** Build a minimal reproducible exercise for this lesson using a deterministic fixture. Include the calculation above, three scenario decisions, implementation or pseudocode with assertions, one baseline/control comparison, and an error gallery with at least three cases. Conclude with a ship, block, or investigate decision and the evidence needed to change it.

**Rubric (20 points).** 5 points for technically correct calculation and assumptions; 4 for three genuinely distinct scenarios and decision boundaries; 4 for executable or precise pseudocode with meaningful assertions; 3 for a controlled comparison and preserved artifacts; 2 for diagnostic quality; 2 for a bounded, evidence-backed conclusion. A missing provenance record or a concealed failure caps the score at 12.

## Why this matters

Variable-size examples require a collation contract. Pad only where required, carry an attention or loss mask, and normalize losses by valid tokens or examples. Batch composition also determines memory, gradient noise, and which length regimes receive optimization attention.

## Worked scenario

In language modelling, a causal mask prevents access to future tokens; a padding mask prevents padded positions contributing attention or loss. In speech, bucketing by length increases throughput but can correlate batch order with the target.

## Practical method

1. State the prediction-time boundary and the artifact you will inspect.
2. Make the relevant invariant executable before running a long experiment.
3. Compare a baseline and one controlled change under the same data and budget.
4. Preserve the configuration, measurements, and decision—not just the best metric.

## Hands-on protocol

Compute a masked cross-entropy by hand for two sequences of different lengths. Compare naive mean loss to valid-token mean. Test that changing padded token ids leaves metrics unchanged.

## Failure modes to diagnose

Mask polarity mistakes are common: one API uses `True` for keep, another for ignore. Padding with a meaningful token without masking creates a synthetic frequent pattern.

## Decision standard

Set a maximum token budget, document truncation policy, and report how many examples are truncated or discarded.

## Evidence checklist

- [ ] Dataset, split, code, configuration, and environment are identifiable.
- [ ] The reported metric has an evaluation population and a decision threshold.
- [ ] At least one failure case and one non-metric constraint were examined.
- [ ] A teammate could reproduce the conclusion from the saved artifacts.

## Further challenge

Change one assumption in the scenario (time window, cost of a false positive, hardware budget, or user population). Predict which part of the system must change, then test that prediction with a small controlled run.

## Architecture audit

Write a batch manifest containing original lengths, truncated lengths, padding count, attention-mask polarity, loss-mask polarity, and device dtype. Unit-test a metamorphic property: append extra padding to an example while preserving its valid tokens, then assert identical valid-token logits and loss within tolerance. For a causal decoder, additionally assert position `t` cannot change when only a future input token is modified. These tests turn masking from a visual code review concern into an enforceable architecture contract.
