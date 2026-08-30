---
title: "Conditioning, scaling, initialisation, and normalisation"
track: "maths-foundations"
status: live
summary: "Conditioning measures how unevenly an objective responds in different directions."
duration: "4 min read"
---

## The short answer

Conditioning measures how unevenly an objective responds in different directions. Poor conditioning creates narrow valleys: one step size is too large for one direction and too small for another. Feature scaling, sensible initialisation, and normalisation can improve signal and curvature, but they must be fitted on training data only. Track units, norms, and activation/gradient statistics to separate scale problems from model problems.

## Why this matters

An optimiser can be mathematically correct and still crawl or diverge because inputs, parameters, or curvature live on incompatible scales. In deep networks, initialisation and normalisation also affect whether signals and gradients vanish or explode across layers.

**Small incident (illustrative):** standardising a feature using the entire dataset improved a validation curve, but the estimate had leaked future information. The optimisation was easier; the evaluation was no longer honest.

## How it works

For quadratic `J(x)=.5 xᵀH x`, the condition number is the ratio of largest to smallest positive eigenvalue of H. If H=diag(1,100), the y direction is 100 times steeper. Rescaling y by 10 makes the curvature more balanced. Feature standardisation uses training mean and standard deviation; normalisation layers transform intermediate activations using learned or batch statistics under their own contracts.

### Assumptions and derivation

The benefit of scaling assumes the transformation is invertible or its information loss is acceptable, units are comparable after transformation, and statistics come from the training population. A zero-variance feature cannot be standardised without a policy. Initialisation aims to preserve signal variance approximately, but nonlinearities, depth, batch size, and data distribution still matter.

## AI use

Scale numeric features, choose initialisation compatible with the activation, inspect per-layer activation/gradient distributions, and ensure preprocessing is identical at train and inference time. Fit statistics inside the training split or pipeline. Normalisation can stabilise optimisation while changing behaviour between training and evaluation modes.

## Worked examples and variations

### Example A — smallest happy path

**Input:** J(x,y)=.5(x²+100y²), start (10,10). **Mechanism:** gradients are (10,1000); a step safe for x is too large for y. **Output:** zig-zag or divergence. **Inspect:** coordinate gradients and Hessian scales. **Next decision:** rescale y or use preconditioning.

### Example B — meaningful variation

**Input:** feature values `[100, 200, 300]` and `[1, 2, 3]`. **Mechanism:** standardise each using training statistics. **Output:** comparable zero-centred scales. **Inspect:** retain means/scales and apply the same transform at inference. **Next decision:** rerun the controlled objective and compare iterations.

### Example C — boundary case

**Input:** a feature is constant `[4,4,4]`. **Mechanism:** standard deviation is zero, so z-score division is undefined. **Output:** NaN or an arbitrary result. **Inspect:** assert scale>0. **Next decision:** drop the feature or define a documented constant transform.

### Example D — tempting counterexample

**Input:** compute normalisation mean and variance using train plus test rows. **Mechanism:** test distribution influences preprocessing. **Output:** apparent optimisation/evaluation improvement with leakage. **Inspect:** fit-transform boundaries and timestamps. **Next decision:** fit on training only and freeze statistics.

### Example E — exploding/vanishing signal

**Input:** repeated layers multiply activations by factors .5 or 2. **Mechanism:** after 10 layers, magnitudes are .5¹⁰≈.001 or 2¹⁰=1024. **Output:** gradients can vanish or explode. **Inspect:** layerwise norm curves. **Next decision:** revise scale, initialisation, architecture, or normalisation before tuning η.

## Computation and interpretation

```python
import numpy as np

H = np.diag([1., 100.])
x = np.array([10., 10.])
for eta in [.01, .001]:
    g = H @ x
    print(eta, x - eta * g)
```

The same η produces very different coordinate behaviour. A preconditioner or rescaling changes the coordinate system; compare the transformed objective and the recovered predictions, not only iteration counts.

## Two ways to see it

### Builder view

Scaling is a change of coordinates and normalisation is a data-dependent transform. Store the fitted statistics and test shape, unit, and train/inference mode at the boundary.

### Systems view

Conditioning is an interface problem between data, architecture, precision, and optimiser. A workaround that improves a curve may introduce leakage or hide a changing production distribution.

## Hands-on

Run GD on the diagonal quadratic before and after scaling the second coordinate. **Failure fixture:** standardise with a zero-variance feature and fit statistics on the combined train/test fixture. **Test:** reject zero scale and assert that transform statistics are sourced only from train rows. **Reset:** restore separate train/test fixtures and a positive-variance feature.

## Checkpoint

- [ ] Define conditioning using curvature or eigenvalue ratio.
- [ ] Explain why scaling can improve a fixed-step trajectory.
- [ ] State the zero-variance and train-only preprocessing rules.
- [ ] Trace one mechanism for exploding or vanishing signals.

## What this does not solve

Scaling does not fix leakage, wrong labels, non-convexity, or a bad objective. Normalisation can alter semantics and inference behaviour. Better conditioning improves optimisation geometry, not necessarily predictive or causal validity.

## Continue, go deeper, apply it

- Continue: Numerical stability: softmax and log-sum-exp
- Go deeper: Optimisation diagnostics and second-order perspective
- Apply it: Neural networks and representations
