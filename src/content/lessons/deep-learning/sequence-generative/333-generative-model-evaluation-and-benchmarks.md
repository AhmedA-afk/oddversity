---
title: "Evaluate generative models with fidelity, diversity, and utility"
track: "deep-learning"
status: live
summary: "Generative evaluation requires multiple measures because no single score captures realism, coverage, controllability, and impact."
duration: "18 min read"
order: 333
---

## Why this lesson matters

Precision-like measures ask whether samples look like the data; recall-like measures ask whether modes are covered. Distribution distances depend on representation and estimator choice.

A correct mental model separates the mathematical object, the learning signal, and the deployment constraint. In sequence and generative work, an implementation can produce plausible outputs while violating causality, leaking targets, or misreporting uncertainty. Keep a small held-out diagnostic set that makes the intended dependency observable.

## Derivation and calculation

A generator that outputs one perfect image has high apparent fidelity but zero useful diversity; calculate coverage across known classes or clusters.

Write shapes beside every expression. For a batch-major tensor, use B × T × d; make the direction of each matrix multiplication explicit. Numerical stability is part of the derivation: subtract the maximum logit before softmax, aggregate log-probabilities rather than products, and define exactly how masked terms are excluded.

## Worked examples

### Example 1 — hand calculation

For synthetic tabular data, test downstream utility and privacy attack risk, not only marginal distribution similarity.

Record intermediate values and units. A hand-sized calculation catches transposes, an incorrect softmax axis, and accidental averaging faster than a large training run.

### Example 2 — applied decision

Human preference studies need randomized order, calibrated annotators, uncertainty intervals, and disclosed population limits.

State the decision owner, the loss of an error, and the legal information set at prediction time. A model that has an attractive metric but uses unavailable future data is not a usable model.

### Example 3 — boundary case

Benchmark leakage and prompt overfitting can inflate scores. Keep a locked, provenance-tracked evaluation suite.

Turn this into a regression test: the test should fail if a future token, pad item, duplicated example, or forbidden identifier changes the output.

## Implementation studio

```python
# Pseudocode: make invariants executable.
def step_or_score(inputs, mask, model):
    assert inputs.ndim >= 2
    representation = model(inputs, mask=mask)
    valid = mask.astype(bool)
    assert representation.shape[:2] == inputs.shape[:2]
    return representation[valid]

# Train: forward -> masked loss -> backward -> clip/check gradients -> update.
# Evaluate: freeze preprocessing and report slices, not only one aggregate.
```

Instrument at least four signals: loss by sequence length, gradient norm, fraction of masked positions, and an example-level error table. Seed stochastic decoding and data shuffling when debugging. Before optimizing throughput, verify that a one-example batch matches a padded multi-example batch on the valid positions.

## Debugging clinic

- **Symptom:** training loss is implausibly low. **Check:** target shifts, causal masks, split contamination, and duplicate sequences.
- **Symptom:** loss becomes NaN. **Check:** logits, normalization denominators, mixed-precision overflow, and masked rows with no valid positions.
- **Symptom:** output is fluent but unusable. **Check:** task objective, decoding policy, retrieval evidence, and the deployment feedback loop.
- **Symptom:** validation varies wildly. **Check:** sampling seed, group/time split, rare-slice counts, and whether your metric denominator changed.

## Exercises and mastery check

1. Reproduce the hand calculation with a second numerical setting, then state one invariant the answer must satisfy.
2. Implement the smallest version of the method without a framework helper; compare it with a trusted implementation on a fixed seed.
3. Construct an adversarial or boundary-case sequence that breaks a naïve implementation, and write the test that prevents recurrence.
4. Write a one-page experiment report: data contract, objective, baselines, slice metrics, failures, and the deployment decision you would make.

### Assessment rubric

Full credit requires a correct derivation or calculation (30%), reproducible code and tests (30%), three interpreted examples rather than only outputs (25%), and a specific failure analysis with a mitigation (15%).
+
## Advanced laboratory: generative evaluation

Design a controlled experiment around a class-coverage table, duplicate-neighbor search, and a blinded preference comparison. Do not start with a full-scale model. First make a synthetic fixture where the correct behavior is known, calculate the expected result, and assert it in a test. Then repeat on a small real or realistically noisy slice. Keep the data contract explicit: what one record means, which fields are available at decision time, what constitutes a group or sequence boundary, and what information is forbidden. Save the seed, environment, input fingerprint, configuration, and the exact metric denominator with each result.

Pre-register prompts and random seeds before model comparisons. Report uncertainty and evaluator agreement. Pair automatic scores with a documented human or task-based protocol that measures the intended use.

Use an ablation ledger with one row per comparison: hypothesis, changed factor, fixed factors, result, uncertainty, and interpretation. If a run fails, preserve it. Failed runs often expose a wrong mask, target alignment error, numerical saturation, leakage route, or metric mismatch. Inspect five wins and five losses selected before seeing their predicted score. For every failure, specify whether the remedy belongs in data, objective, architecture, optimization, decoding, retrieval, policy, or human process. Do not solve an evaluation failure by quietly changing the test set.

### Error gallery

Build at least four named cases: a nominal case, a length/scale extreme, a corrupted or missing-input case, and an adversarial information-leakage case. For each, show input, legal context, intermediate diagnostic, prediction or sample, expected behavior, and action. Include a counterfactual: change exactly one relevant input factor and state the direction in which the output should change. If that expectation is not met, investigate before making a capability claim. Treat a system that cannot explain its operating boundary as experimental, not production-ready.

### Graded extension

Submit a reproducible notebook or script, the unit tests, an experiment card, and a two-page technical memo. The memo must derive the key objective, show one numerical calculation, interpret three distinct scenarios, present an ablation, and make a release/no-release recommendation with a rollback condition. Grade derivation and assumptions (25%), correctness of implementation and tests (30%), quality of diagnostics and error analysis (25%), and the decision memo’s evidence, limitations, and safety reasoning (20%).

