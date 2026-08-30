---
title: "Stochastic and mini-batch gradient descent"
track: "maths-foundations"
status: live
summary: "Stochastic gradient descent estimates the full-data gradient from one example; mini-batch descent averages a batch."
duration: "4 min read"
---

## The short answer

Stochastic gradient descent estimates the full-data gradient from one example; mini-batch descent averages a batch. Under representative sampling, the estimate is approximately unbiased, but it has variance. Small batches update cheaply and noisily; large batches are smoother and more memory-hungry. Compare methods at equal data exposure, track gradient noise and validation behaviour, and do not treat batch size as a free performance knob.

## Why this matters

Modern training rarely computes a gradient over every example for every update. Mini-batches control memory and throughput, but they also change the stochastic process, number of updates, and effective regularisation. A loss curve’s noise is part signal and part sampling variation.

**Small incident (illustrative):** a run looked unstable because a tiny batch produced a noisy training curve, while validation performance improved. Smoothing the plot hid the useful distinction between harmless noise and exploding updates.

## How it works

If `J(θ)=E[ℓ(θ;Z)]`, a batch gradient is `g_B=(1/|B|) sum_{i∈B} ∇ℓ_i`. Under iid uniform sampling, `E[g_B]=∇J` and variance commonly decreases as batch size grows, though dependence and finite sampling change the details. The update remains `θ←θ−ηg_B`.

### Assumptions and derivation

Unbiasedness requires the batch sampling scheme to represent the objective’s weighting. A class-balanced batch estimates a different gradient unless its weights are corrected. Correlated or curriculum batches can add bias by design. Batch size also changes how many parameter updates occur per epoch and therefore requires a learning-rate comparison that states the schedule.

## AI use

Use mini-batches for scalable training, but log batch size, sampler, effective examples per update, gradient norm, and validation metrics. Stratification, class weights, and distributed sampling are objective choices. Compare runs by examples seen and wall-clock budget, not only step count.

## Worked examples and variations

### Example A — smallest happy path

**Input:** per-example gradients `[2, 4]`, batch of both. **Mechanism:** average gives full gradient 3. **Output:** deterministic batch update. **Inspect:** the batch objective and gradient use the same reduction. **Next decision:** apply the update with a documented learning rate.

### Example B — meaningful variation

**Input:** gradients `[−10, 10]` in a two-example batch. **Mechanism:** average is zero even though individual examples disagree. **Output:** no update for this batch. **Inspect:** keep per-example gradients and labels. **Next decision:** ask whether cancellation reflects a balanced signal or a too-small/biased batch.

### Example C — boundary case

**Input:** batch size equals the entire dataset. **Mechanism:** gradient variance from sampling is zero. **Output:** batch GD. **Inspect:** memory and update frequency differ from a mini-batch run. **Next decision:** compare data exposure and wall-clock cost, not only noise.

### Example D — tempting counterexample

**Input:** batch contains only positive examples while the objective is population average loss. **Mechanism:** the gradient estimates a conditional slice, not the full objective. **Output:** biased update. **Inspect:** class and sampler counts. **Next decision:** reweight, stratify with the intended objective, or define the changed objective.

### Example E — batch-size trade-off

**Input:** increase batch size fourfold without changing learning rate or schedule. **Mechanism:** gradient noise and updates per epoch change. **Output:** different optimisation path and possibly different generalisation. **Inspect:** compare examples seen, update count, and validation curves. **Next decision:** tune the schedule under a stated budget.

## Computation and interpretation

```python
import numpy as np

gradients = np.array([[-2., 1.], [2., 3.], [0., -1.]])
for indices in ([0], [0, 1], [0, 1, 2]):
    g = gradients[list(indices)].mean(axis=0)
    print(indices, g, np.linalg.norm(g))
```

The batch average is the update direction for the selected examples. Repeat with random batches to inspect variability; do not call the sample variance “the generalisation gap.”

## Two ways to see it

### Builder view

SGD is Monte Carlo estimation inside an optimiser. The sampler defines the gradient estimator; its bias, variance, and cost belong in the training report.

### Systems view

Batching couples statistical noise to hardware constraints. Throughput, memory, communication, and update frequency can change the model’s behaviour, not merely its speed.

## Hands-on

Use a fixed table of per-example gradients and compare batch sizes 1, 2, and full. **Failure fixture:** create batches from only one label class while reporting a full-population gradient. **Test:** assert batch label coverage or apply the declared importance weights; report the batch mean and its intended target. **Reset:** restore the sampler and seed that cover the full fixture.

## Checkpoint

- [ ] Derive the mini-batch gradient estimator.
- [ ] Explain why larger batches usually reduce sampling variance.
- [ ] Give one sampling scheme that makes the estimator target a different objective.
- [ ] Compare batch sizes using examples seen and update count.

## What this does not solve

Stochasticity does not guarantee escape from bad regions, good generalisation, or unbiased training under arbitrary samplers. Larger batches are not universally better. A noisy loss curve needs gradient and validation diagnostics before intervention.

## Continue, go deeper, apply it

- Continue: Momentum, Nesterov, RMSProp, and Adam
- Go deeper: Conditioning, scaling, initialisation, and normalisation
- Apply it: Optimisation, loss, and gradient descent
