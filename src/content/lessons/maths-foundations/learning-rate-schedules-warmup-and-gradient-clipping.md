---
title: "Learning-rate schedules, warm-up, and gradient clipping"
track: "maths-foundations"
status: live
summary: "A learning-rate schedule changes step size over training; warm-up starts with smaller steps before reaching the target rate; gradient clipping limits."
duration: "4 min read"
---

## The short answer

A learning-rate schedule changes step size over training; warm-up starts with smaller steps before reaching the target rate; gradient clipping limits an update’s magnitude. Schedules encode a time-dependent optimisation policy, while clipping is damage control for unusually large gradients. Choose from logged loss, gradient, and update curves. Neither technique repairs a wrong objective, bad data, or a systematically exploding model.

## Why this matters

One learning rate may be safe after a model settles but unstable at initialisation. A single outlier gradient can also destroy parameters. Schedules and clipping can stabilise a run, but hiding the symptom without finding its cause makes later debugging harder.

**Small incident (illustrative):** a run stopped producing NaNs after global-norm clipping was added. Investigation later found a unit conversion bug in the inputs; clipping limited the blast radius but did not correct the source.

## How it works

Common schedules include step decay, exponential decay, cosine-like decay, and a warm-up followed by decay. For global norm clipping with threshold c, use `g_clip = g * min(1, c/||g||)`; direction is preserved when the norm exceeds c, while magnitude is capped. Value clipping clips coordinates independently and can change direction.

### Assumptions and derivation

Clipping changes the gradient estimator whenever the threshold is active, so it changes the optimisation problem’s trajectory. A useful diagnostic records the fraction of steps clipped and the unclipped norm. Warm-up helps only when early updates need smaller scale; if every step clips, inspect architecture, data, loss, and precision.

## AI use

Use schedules for finite training budgets and changing curvature, and clipping for bounded-update safety in recurrent, generative, or large-batch systems. Report schedule formula, units (steps or epochs), warm-up length, clipping norm/type, and clipping frequency. Pair them with rollback and finite-value checks.

## Worked examples and variations

### Example A — smallest happy path

**Input:** initial η=.1, decay by half after two epochs. **Mechanism:** η=.1 for epochs 1–2, .05 for 3–4. **Output:** smaller later updates. **Inspect:** align the schedule with actual optimiser steps. **Next decision:** use it only if validation and optimisation curves support the change.

### Example B — meaningful variation

**Input:** warm-up from .01 to .1 over five steps. **Mechanism:** linearly increase η before the main schedule. **Output:** gentler initial updates. **Inspect:** compare first-step gradients and parameter norms. **Next decision:** keep warm-up when initial transients are the problem, not as a ritual default.

### Example C — boundary case

**Input:** gradient norm=0 and clip threshold c=1. **Mechanism:** clipping factor is conventionally 1 because no scaling is needed. **Output:** zero remains zero. **Inspect:** do not divide by zero when computing `c/||g||`. **Next decision:** test the zero-gradient branch explicitly.

### Example D — tempting counterexample

**Input:** gradient `[100, 0]`, c=1. **Mechanism:** global clipping gives `[1,0]`; coordinate clipping at 1 gives the same here, but for `[100, .1]` the direction differs. **Output:** different updates for the two methods. **Inspect:** compare norms and angles. **Next decision:** name the clipping type.

### Example E — clipping hides a bug

**Input:** every step has norm 10,000 and is clipped to 1. **Mechanism:** updates remain finite. **Output:** a seemingly stable but persistently clipped run. **Inspect:** clipping fraction and raw norm. **Next decision:** diagnose scale, loss, or gradient flow instead of increasing the threshold blindly.

## Computation and interpretation

```python
import numpy as np

def clip_by_global_norm(g, max_norm):
    g = np.asarray(g, dtype=float)
    norm = np.linalg.norm(g)
    factor = 1.0 if norm == 0 else min(1.0, max_norm / norm)
    return g * factor, norm, factor

print(clip_by_global_norm([3., 4.], 2.0))
```

The returned factor tells you whether clipping was active. Log the unclipped norm; only the clipped update is insufficient for diagnosis.

## Two ways to see it

### Builder view

A schedule is a function of training progress; clipping is a projection onto an update ball. Both should be unit-tested at boundaries and logged as state.

### Systems view

Stability controls can trade speed and signal for survivability. Persistent intervention is evidence that the upstream system is outside its intended operating envelope.

## Hands-on

Create a schedule table for 12 steps and run a fixed gradient fixture through no clipping, global clipping, and coordinate clipping. **Failure fixture:** use an all-zero gradient with a division-based clip implementation. **Test:** no NaN is allowed, and the zero vector must remain zero; assert and report the fraction of clipped steps. **Reset:** restore the nonzero fixture and the documented threshold.

## Checkpoint

- [ ] Write the global-norm clipping formula.
- [ ] Explain one reason for warm-up and one reason it may be inappropriate.
- [ ] Distinguish global-norm from coordinate clipping.
- [ ] Name the diagnostic that reveals clipping is masking a gradient problem.

## What this does not solve

Schedules and clipping do not make a model’s objective correct, data representative, or gradients meaningful. Clipping changes updates and can slow learning or bias estimates. A finite loss after clipping is not proof of healthy optimisation.

## Continue, go deeper, apply it

- Continue: Conditioning, scaling, initialisation, and normalisation
- Go deeper: Numerical stability: softmax and log-sum-exp
- Apply it: Optimisation, loss, and gradient descent
