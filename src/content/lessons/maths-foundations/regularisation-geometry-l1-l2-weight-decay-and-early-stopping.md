---
title: "Regularisation geometry: L1, L2, weight decay, and early stopping"
track: "maths-foundations"
status: live
summary: "Regularisation adds a preference for parameter solutions that generalise or remain stable."
duration: "5 min read"
---

## The short answer

Regularisation adds a preference for parameter solutions that generalise or remain stable. L1 adds `λ||w||₁` and often creates exact zeros; L2 adds `λ||w||²₂` and smoothly shrinks weights. Weight decay explicitly shrinks parameters during an update, which is equivalent to L2 only under some optimiser/update choices. Early stopping uses validation behaviour as a capacity control. Tune and report the mechanism, not just “regularised.”

## Why this matters

A model can fit training data by using unstable, redundant, or overly large parameters. Regularisation changes the feasible trade-off between fit and complexity, but different penalties produce different representations and interact with scaling and the optimiser.

**Small incident (illustrative):** a team saw sparse coefficients and assumed it had found the only important features. L1 had selected one of several correlated predictors; the zero pattern was not a causal discovery.

## How it works

The penalised objective is `J(w)=data_loss(w)+λΩ(w)`. L1 uses `Ω=Σ|wⱼ|`; L2 uses `Ω=Σwⱼ²`. In two dimensions, constant L1 penalty contours are diamonds and L2 contours are circles; the data-loss contours are more likely to touch a diamond corner, producing zeros.

### Assumptions and derivation

L1 and L2 penalties correspond to Laplace and Gaussian parameter priors in a MAP view, with coefficients tied to prior scale and data-loss convention. Weight decay `w←(1−ηλ)w−ηg` is separate shrinkage; adding L2 to the gradient gives `w←w−η(g+λw)`, which matches simple GD but can differ with momentum or adaptive scaling. Early stopping requires an independent validation signal and a predeclared patience rule.

## AI use

Use regularisation to control overfit, improve coefficient stability, and bound model capacity. Standardise features before comparing penalty strength, track train/validation curves, and inspect whether sparsity is stable across resamples. Treat weight-decay settings as part of the optimiser contract.

## Worked examples and variations

### Example A — smallest happy path

**Input:** one weight w=3 and L2 penalty λw² with λ=.1. **Mechanism:** penalty contribution=.9 and gradient contribution=.6. **Output:** the objective prefers a smaller weight than data loss alone. **Inspect:** keep data loss and penalty separate. **Next decision:** tune λ against validation performance.

### Example B — meaningful variation

**Input:** two correlated features with similar predictive value. **Mechanism:** L2 tends to distribute weight; L1 tends to select a sparse corner. **Output:** similar predictions but different coefficients. **Inspect:** coefficient stability under resampling. **Next decision:** choose L1 for a justified sparse representation, not because zeros prove importance.

### Example C — boundary case

**Input:** L1 at w=0. **Mechanism:** absolute value has no ordinary derivative at zero; subgradient ranges from −1 to 1. **Output:** an optimiser can hold the coefficient at zero when data gradient lies inside the penalty’s subgradient. **Inspect:** use a proximal or subgradient-aware update. **Next decision:** do not approximate the kink with an untested derivative.

### Example D — tempting counterexample

**Input:** add L2 to Adam and separately enable decoupled weight decay. **Mechanism:** both shrink or alter parameters, but not through the same adaptive path. **Output:** over-regularisation and a different trajectory. **Inspect:** list each term in the update. **Next decision:** compare one mechanism at a time.

### Example E — early stopping

**Input:** training loss keeps falling while validation loss bottoms out at epoch 12. **Mechanism:** stop near the predeclared best validation point. **Output:** lower effective capacity than the final training iterate. **Inspect:** keep a test set untouched by stopping decisions. **Next decision:** restore the selected checkpoint, not the last checkpoint.

## Computation and interpretation

```python
import numpy as np

w = np.array([3., -1.])
lam = .1
print("L1", lam * np.abs(w).sum(), "L2", lam * (w*w).sum())
for _ in range(3):
    w = (1 - .05 * lam) * w  # decay-only illustration
    print(w)
```

The values are penalty and shrinkage illustrations, not a complete fitted model. Record whether λ multiplies a sum or an average loss; that convention changes the effective strength.

## Two ways to see it

### Builder view

Regularisation is an explicit term or stopping rule. Plot its contribution, the data loss, parameter norms, and validation loss separately.

### Systems view

The penalty encodes a preference for simplicity or stability. It can also suppress rare but important signals, and its effect changes when feature scales or optimiser states change.

## Hands-on

Fit a two-feature least-squares fixture with L1, L2, and no penalty; save coefficients and validation error. **Failure fixture:** run L1 on unstandardised features with one feature measured in thousands and the other in units. **Test:** the report must show feature scales and compare penalty paths after standardisation. **Reset:** restore standardised inputs, clear optimiser state, and rerun each penalty from the same initial point.

## Checkpoint

- [ ] Describe the geometric difference between L1 and L2.
- [ ] Connect Gaussian/Laplace priors to L2/L1 penalties.
- [ ] Explain when weight decay and L2 match or differ.
- [ ] State why early stopping needs validation data and a checkpoint rule.

## What this does not solve

Regularisation does not remove selection bias, guarantee sparsity stability, or identify causal features. It can underfit, distort probabilities, and interact with scaling and optimisation. A selected checkpoint still needs untouched evaluation.

## Continue, go deeper, apply it

- Continue: Learning-rate schedules, warm-up, and gradient clipping
- Go deeper: Conditioning, scaling, initialisation, and normalisation
- Apply it: Regularisation and bias–variance
