---
title: "Optimisation diagnostics and second-order perspective"
track: "maths-foundations"
status: live
summary: "Optimisation diagnostics explain how loss, gradients, parameters, and validation behaviour change—not merely whether the final loss is lower."
duration: "4 min read"
---

## The short answer

Optimisation diagnostics explain how loss, gradients, parameters, and validation behaviour change—not merely whether the final loss is lower. First classify the symptom: NaN, divergence, flat gradient, train/validation gap, or noisy progress. First-order gradients give slope; the Hessian describes local curvature and Hessian-vector products expose curvature without materialising the full matrix. Use the smallest diagnostic that distinguishes plausible causes.

## Why this matters

A single loss curve cannot tell a data bug from a learning-rate bug. A debugging decision tree prevents random hyperparameter search and makes a training run reproducible enough to compare.

**Small incident (illustrative):** a team lowered the learning rate when validation loss rose. The real issue was label leakage in the training split; the optimiser was doing exactly what the objective asked.

## How it works

Record training/validation loss, gradient norm, parameter norm, update norm, learning rate, batch statistics, finite-value flags, and examples seen. For a twice-differentiable objective, `H v` is the derivative of the gradient in direction v; it can be estimated by finite differences `H v ≈ [∇J(θ+εv)−∇J(θ)]/ε`. Curvature signs and magnitudes guide step and conditioning decisions.

### Assumptions and derivation

The finite-difference Hessian-vector approximation needs a small but not underflowed ε and a reliable gradient. A positive curvature direction behaves locally like a bowl; negative curvature can indicate a saddle or maximum; near-zero curvature can indicate a flat or redundant direction. Local curvature does not describe the whole non-convex landscape.

## AI use

Use diagnostics in training CI, incident response, and model comparison. Add assertions for finite loss and gradients, gradient checks on a tiny fixture, train/validation split checks, and checkpoint rollback. Keep raw and smoothed curves separate so smoothing does not erase a failure.

## Worked examples and variations

### Example A — stalled progress

**Input:** loss is finite, gradient norm is near zero, parameters barely move. **Mechanism:** could be a local stationary point, saturated activation, detached graph, or excessive regularisation. **Output:** no diagnosis from loss alone. **Inspect:** finite-difference gradient and update-to-parameter ratio. **Next decision:** isolate the smallest suspect before tuning η.

### Example B — divergence

**Input:** loss and parameter norms grow every step. **Mechanism:** step is too large, curvature is high, or data contains an extreme scale. **Output:** eventual inf/NaN. **Inspect:** gradient norm, clipping fraction, and input range. **Next decision:** lower η or fix scale; retain the raw failure trace.

### Example C — boundary case

**Input:** exactly zero loss and zero gradient on a one-example fixture. **Mechanism:** the model may fit the fixture or the loss path may be detached. **Output:** apparently perfect optimisation. **Inspect:** perturb the label/input and finite-difference the objective. **Next decision:** use a nontrivial fixture before claiming gradient correctness.

### Example D — tempting counterexample

**Input:** training loss falls while validation loss rises. **Mechanism:** capacity, leakage, shift, or metric mismatch can all explain the gap. **Output:** overfit is plausible, not proven. **Inspect:** split IDs, slices, data timestamps, and regularisation path. **Next decision:** audit data and checkpoint selection before changing the optimiser.

### Example E — second-order clue

**Input:** two directions have Hessian curvature 1 and 100. **Mechanism:** the high-curvature direction limits a fixed step. **Output:** zig-zag trajectory. **Inspect:** Hessian-vector probes or a quadratic fixture. **Next decision:** scale, precondition, schedule, or use a curvature-aware method.

## Computation and interpretation

```python
import numpy as np

def grad(theta):
    return np.array([theta[0], 100.0 * theta[1]])

theta = np.array([1.0, 1.0])
v = np.array([1.0, -1.0])
eps = 1e-5
hv = (grad(theta + eps * v) - grad(theta)) / eps
print("gradient", grad(theta), "Hessian-vector", hv)
```

The expected Hessian-vector product is `[1,−100]` for this quadratic. Use finite differences to test a gradient implementation, not as a free pass to ignore precision and step-size choice.

## Two ways to see it

### Builder view

Diagnostics are an evidence table: symptom, candidate cause, discriminating test, and next action. A good training log makes the decision reproducible.

### Systems view

Training is a stateful production process. Checkpoints, seeds, data versions, optimiser state, and rollback determine whether a failure can be explained or repeated.

## Hands-on

Build a tiny quadratic training log with columns for loss, gradient norm, parameter norm, update norm, and finite flags. **Failure fixture:** provide a detached gradient function that always returns zero. **Test:** a finite-difference check must fail on the detached fixture while passing on the analytic gradient. **Reset:** restore the correct gradient and initial state, then rerun the decision tree.

## Checkpoint

- [ ] Classify four optimisation symptoms and name a discriminating test for each.
- [ ] Explain what a Hessian-vector product measures.
- [ ] State why smoothed curves cannot replace raw diagnostics.
- [ ] Write a minimal rollback/reproducibility record for a training run.

## What this does not solve

Diagnostics narrow causes; they do not prove global optimality, data validity, or production safety. Hessian probes are local and numerically sensitive. A clean training trace can still optimise the wrong target.

## Continue, go deeper, apply it

- Continue: Newton, quasi-Newton, and coordinate-descent methods
- Go deeper: Convex sets, convex functions, and guarantees
- Apply it: Interpretability and error analysis
