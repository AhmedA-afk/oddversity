---
title: "Derive LSTM gates and long-term memory"
track: "deep-learning"
status: live
summary: "LSTMs create an additive memory path with gates that control write, erase, and read."
duration: "18 min read"
order: 306
---

## Why this lesson matters

With $c_t=f_t\odot c_{t-1}+i_t\odot\tilde c_t$, the direct derivative $\partial c_t/\partial c_{t-1}=f_t$ explains why forget gates near one preserve credit.

A correct mental model separates the mathematical object, the learning signal, and the deployment constraint. In sequence and generative work, an implementation can produce plausible outputs while violating causality, leaking targets, or misreporting uncertainty. Keep a small held-out diagnostic set that makes the intended dependency observable.

## Derivation and calculation

Gate equations are $f_t=\sigma(W_f[z_t]+b_f)$ and similarly for $i,o$; $h_t=o_t\odot\tanh(c_t)$. Biasing $b_f$ positive initially encourages retention.

Write shapes beside every expression. For a batch-major tensor, use B × T × d; make the direction of each matrix multiplication explicit. Numerical stability is part of the derivation: subtract the maximum logit before softmax, aggregate log-probabilities rather than products, and define exactly how masked terms are excluded.

## Worked examples

### Example 1 — hand calculation

If $f=0.98$ for 50 steps, retained signal is $0.98^{50}\approx0.364$; compare with a recurrent multiplier of 0.8.

Record intermediate values and units. A hand-sized calculation catches transposes, an incorrect softmax axis, and accidental averaging faster than a large training run.

### Example 2 — applied decision

In sentiment, retain a negation cue until its adjective; inspect whether gate activations saturate at zero or one.

State the decision owner, the loss of an error, and the legal information set at prediction time. A model that has an attractive metric but uses unavailable future data is not a usable model.

### Example 3 — boundary case

For event streams, an LSTM can retain a rare prior event, but only if the training distribution rewards that dependency.

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
## Advanced laboratory: LSTM memory gates

Design a controlled experiment around gate trajectories for a deliberately constructed delayed-cue task. Plot input, forget, output, and cell values around the cue. Do not start with a full-scale model. First make a synthetic fixture where the correct behavior is known, calculate the expected result, and assert it in a test. Then repeat on a small real or realistically noisy slice. Keep the data contract explicit: what one record means, which fields are available at decision time, what constitutes a group or sequence boundary, and what information is forbidden. Save the seed, environment, input fingerprint, configuration, and the exact metric denominator with each result.

Ablate forget-bias initialization and compare retention at fixed parameter count. Check that packed sequences reset hidden and cell state exactly where intended. Saturated gates can make gradients sparse even when aggregate loss declines.

Use an ablation ledger with one row per comparison: hypothesis, changed factor, fixed factors, result, uncertainty, and interpretation. If a run fails, preserve it. Failed runs often expose a wrong mask, target alignment error, numerical saturation, leakage route, or metric mismatch. Inspect five wins and five losses selected before seeing their predicted score. For every failure, specify whether the remedy belongs in data, objective, architecture, optimization, decoding, retrieval, policy, or human process. Do not solve an evaluation failure by quietly changing the test set.

### Error gallery

Build at least four named cases: a nominal case, a length/scale extreme, a corrupted or missing-input case, and an adversarial information-leakage case. For each, show input, legal context, intermediate diagnostic, prediction or sample, expected behavior, and action. Include a counterfactual: change exactly one relevant input factor and state the direction in which the output should change. If that expectation is not met, investigate before making a capability claim. Treat a system that cannot explain its operating boundary as experimental, not production-ready.

### Graded extension

Submit a reproducible notebook or script, the unit tests, an experiment card, and a two-page technical memo. The memo must derive the key objective, show one numerical calculation, interpret three distinct scenarios, present an ablation, and make a release/no-release recommendation with a rollback condition. Grade derivation and assumptions (25%), correctness of implementation and tests (30%), quality of diagnostics and error analysis (25%), and the decision memo’s evidence, limitations, and safety reasoning (20%).

