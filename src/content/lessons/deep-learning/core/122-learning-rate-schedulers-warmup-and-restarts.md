---
title: "Learning-Rate Schedulers, Warmup, and Restarts"
track: deep-learning
status: live
order: 122
description: "Design schedules around dynamics and budget, then inspect the actual learning rate applied."
---

# Learning-Rate Schedulers, Warmup, and Restarts

## Why this matters

Design schedules around dynamics and budget, then inspect the actual learning rate applied. Treat this lesson as a working session: calculate on paper first, then make the smallest program that can falsify your reasoning. A deep-learning implementation is credible only when its tensor contracts, objective, and measurements agree.

## Core derivation

Cosine decay can be written η_t=η_min+.5(η_max−η_min)(1+cos(πt/T)). Warmup raises η gradually to prevent unstable early updates, especially with large batches or adaptive states.

Write the dimensions next to every expression. If an expression does not type-check, do not “fix” it by reshaping until you can say what each axis represents.

## Worked examples

1) Calculate cosine η at t=0,T/2,T. 2) Build five-step warmup. 3) Interpret plateau scheduling. 4) Compare step decay and cosine under a fixed budget.

For each example, state the assumption being made, perform the calculation, and name one observation that would tell you the assumption is false in a real training run.

## Implementation studio

```python
# Pseudocode: make invariants executable
assert finite(loss)
assert prediction.shape[0] == target.shape[0]
log({"step": step, "loss": loss, "lr": learning_rate,
     "grad_norm": global_norm(gradients)})
update(parameters, gradients)
```

Implement a scheduler object and unit-test its values. Train the same MLP with constant, cosine, and plateau schedules; report both curves and final checkpoints. Keep one seed-fixed smoke test and one deliberately adversarial test. Inspect one batch end-to-end before launching a long run.

## Practice and assessment

1. Reproduce the central calculation with different values and show units/shapes.
2. Write a minimal test that would catch the most likely implementation error.
3. Run one controlled ablation, changing only the assumption discussed in this lesson.
4. In a short technical memo, report result, failure mode, and next decision—not just the best metric.

## Pitfalls and diagnostic questions

Calling scheduler.step at the wrong frequency; document whether t means batch, epoch, or validation event.

Before moving on, answer: *What is the loss estimating? Which axes are being reduced? What evidence would make this result untrustworthy?*


## Derivation and numerical studio

For ηmax=.01,ηmin=.001,T=100, cosine gives .01 at 0, .0055 at 50, .001 at 100. A five-step warmup is [.002,.004,.006,.008,.01]. Plateau schedules should see validation events, not individual noisy batches. A fixed-token training budget needs update-based time, especially when batch size changes. Debug checkpoint resumes without scheduler state and plot the actual LR trace rather than assuming configuration is applied.

Perform the arithmetic before opening a framework. For each calculation, identify the scalar being differentiated or the axis being reduced, then check that the resulting tensor has the shape demanded by the next operation. This practice separates a valid derivation from code that merely happens to execute.

## Shape-aware implementation

```python
# Every leading axis is an explicit batch axis: B.
# Preserve it even when B == 1; use named local dimensions.
assert finite(loss)
assert outputs.shape[0] == targets.shape[0]
assert all(g.shape == p.shape for g, p in zip(grads, params))
log({"step": step, "loss": loss, "lr": lr,
     "grad_norm": global_norm(grads), "batch": inputs.shape[0]})
```

Implement the operation on a fixed tiny fixture and compare it with a trusted autodiff operation only after your own test passes. Include one ordinary batch, one singleton batch, and one adversarial input (an extreme logit, zero vector, missing class, or boundary value as relevant).

## Debug and error gallery

The recurring failures here are not cosmetic. A silent reduction over the wrong axis changes the objective; a dtype or shape conversion can discard data; an update applied in the wrong training state changes the model being evaluated. Capture the first failing step, sample identifiers, dtypes, named shapes, ranges before and after the operation, configuration, and seed. Reproduce the smallest failing case before changing hyperparameters.

## Practice set and rubric

1. **Derive — 30 points.** Re-derive the central formula or local gradient, including every reduction and tensor shape. A final formula without justified intermediate steps earns at most 15 points.
2. **Calculate — 25 points.** Invent a new numerical case with at least two dimensions or two examples; calculate it by hand and verify it programmatically to a declared tolerance.
3. **Implement — 25 points.** Implement the operation without a high-level black-box equivalent. Submit assertions and tests that fail before the repair.
4. **Diagnose and decide — 20 points.** Reproduce a failure, identify the earliest observable signal, and recommend an action in the stated real-world setting with its trade-off.

A complete solution has shape-consistent algebra, matching numerical evidence, a reproducible fixture, and a decision tied to error cost. A chart or best metric alone cannot satisfy the final criterion.

## Evidence standard and counterfactual check

For **Learning-Rate Schedulers, Warmup, and Restarts**, repeat the numerical studio with three deliberate changes: one change that should preserve the result, one that should change it in a predictable direction, and one boundary case that should trigger an assertion or expose a limitation. State the expected outcome before running the code. Then record the actual value, tensor shape, dtype, and any difference from the prediction.

Treat a disagreement as evidence to investigate, not as a nuisance to tune away. Identify whether its first cause is data, representation, objective, derivative, optimiser state, precision, or evaluation protocol. A reviewer must be able to run the same fixed fixture and see the same pass/fail result. Finally, write one sentence separating what the experiment established from what it merely suggests about a production decision. This disciplined counterfactual check is how local calculations become reliable engineering evidence.
