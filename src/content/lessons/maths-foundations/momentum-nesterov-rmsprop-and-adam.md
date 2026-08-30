---
title: "Momentum, Nesterov intuition, RMSProp, and Adam"
track: "maths-foundations"
status: live
summary: "Momentum accumulates a velocity so consistent gradients keep moving and noisy reversals are damped. Nesterov evaluates a look-ahead gradient."
duration: "4 min read"
---

## The short answer

Momentum accumulates a velocity so consistent gradients keep moving and noisy reversals are damped. Nesterov evaluates a look-ahead gradient. RMSProp scales coordinates by a moving average of squared gradients. Adam combines momentum-like first moments with adaptive second moments and bias correction. These methods can improve optimisation, but they do not fix a wrong gradient, bad data, or a learning-rate mismatch.

## Why this matters

Optimiser names often become cargo cults. Each adds state, assumptions, and hyperparameters. A controlled comparison on the same objective reveals whether an apparent gain comes from better conditioning, a different effective step, or a hidden data/gradient problem.

**Small incident (illustrative):** Adam reached low training loss quickly while a feature-scale bug remained. The adaptive denominator softened the symptom; a later distribution change exposed the uncorrected representation problem.

## How it works

Momentum uses `v_t=βv_{t−1}+g_t` and `θ_t=θ_{t−1}−ηv_t`. RMSProp uses `s_t=ρs_{t−1}+(1−ρ)g_t²` and divides the gradient by `sqrt(s_t)+ε`. Adam maintains both moments, bias-corrects them as `m̂_t=m_t/(1−β₁ᵗ)` and `v̂_t=v_t/(1−β₂ᵗ)`, then updates `θ←θ−η m̂/(sqrt(v̂)+ε)`.

### Assumptions and derivation

The state starts at zero, so early moment estimates are biased toward zero; bias correction compensates for this initialisation under the stated recurrences. Nesterov’s look-ahead intuition depends on the specific variant and indexing. Epsilon, decay, parameter groups, and weight-decay coupling can change the actual algorithm.

## AI use

Use the simplest optimiser that meets the objective and reproducibility needs, then compare on fixed seeds, data exposure, validation metrics, and wall-clock budget. Inspect per-parameter update norms and gradient norms. If Adam hides a scale or gradient issue, fixing the data/architecture is better than tuning around it.

## Worked examples and variations

### Example A — smallest happy path

**Input:** constant gradient g=1 over three steps. **Mechanism:** momentum velocity grows toward a steady value while plain GD repeats the same direction. **Output:** faster movement for a compatible η. **Inspect:** compare parameter distance and objective, not speed alone. **Next decision:** keep momentum only if it improves the controlled task.

### Example B — meaningful variation

**Input:** gradients alternate +1,−1,+1,−1. **Mechanism:** momentum carries stale direction and can overshoot before damping. **Output:** less direct cancellation but possible oscillation. **Inspect:** velocity and loss together. **Next decision:** lower η or β when history is misleading.

### Example C — boundary case

**Input:** gradient is identically zero. **Mechanism:** all moment states remain zero. **Output:** no optimiser can move parameters. **Inspect:** distinguish a true optimum from a detached graph or zeroed gradient. **Next decision:** finite-difference check the gradient before changing optimisers.

### Example D — tempting counterexample

**Input:** one coordinate has gradient 1000 and another .001 because features are badly scaled. **Mechanism:** RMSProp/Adam normalise recent magnitudes. **Output:** progress may look balanced. **Inspect:** raw gradients, units, and update-to-parameter ratios. **Next decision:** fix scaling or architecture; do not treat adaptation as validation.

### Example E — decay distinction

**Input:** Adam plus an L2 term versus decoupled weight decay. **Mechanism:** adding L2 changes the gradient; decoupled decay separately shrinks parameters. **Output:** different trajectories, especially with adaptive scaling. **Inspect:** record the exact update rule and library option. **Next decision:** compare like-for-like and state the version/implementation.

## Computation and interpretation

```python
import numpy as np

g = np.array([1., -1., 2.])
beta1, beta2, eps = .9, .999, 1e-8
m = (1 - beta1) * g
v = (1 - beta2) * (g * g)
m_hat = m / (1 - beta1)
v_hat = v / (1 - beta2)
update = m_hat / (np.sqrt(v_hat) + eps)
print(update)
```

The first-step bias correction returns the sign-normalised direction for this fixture. Later steps depend on history; retain states when reproducing a run.

## Two ways to see it

### Builder view

An optimiser is a state machine, not just a formula for the current gradient. Serialize or reset state deliberately when comparing runs.

### Systems view

Adaptive updates can redistribute attention across coordinates but can also make a broken scale look healthy. Observability must include raw gradients, moments, parameters, and effective updates.

## Hands-on

Implement one controlled quadratic and run GD, momentum, RMSProp, and Adam with the same initial point and seed. **Failure fixture:** carry Adam’s moment state from one run into another with a different objective. **Test:** each comparison must start from zero state and report the same objective, data order, and budget. **Reset:** clear all state and rerun the controlled fixture.

## Checkpoint

- [ ] Write the momentum and Adam state updates.
- [ ] Explain why Adam uses bias correction.
- [ ] Diagnose alternating gradients using velocity and loss.
- [ ] State why an adaptive optimiser cannot substitute for feature-scale validation.

## What this does not solve

These optimisers do not guarantee convergence on arbitrary non-convex objectives, calibration, generalisation, or correct gradients. Defaults are implementation-specific and can change behaviour. A faster training curve is not automatically a better model.

## Continue, go deeper, apply it

- Continue: Regularisation geometry: L1, L2, weight decay, and early stopping
- Go deeper: Optimisation diagnostics and second-order perspective
- Apply it: Loss, gradients, and optimisation
