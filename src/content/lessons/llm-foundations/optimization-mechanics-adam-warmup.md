---
title: "Optimization Mechanics: AdamW, Warmup, and Schedules"
track: "llm-foundations"
status: live
summary: "Inside the training loop: AdamW's moment estimates, warmup-then-decay schedules, gradient clipping, and why batch size is measured in tokens."
duration: "7 min read"
---

The pretraining loss defines what to minimize; it says nothing about how to take a step toward minimizing it. That's the optimizer's job, and a handful of unglamorous choices there determine whether a multi-week training run converges cleanly or spikes into instability.

## What it is

Modern LLM pretraining almost universally uses **AdamW**: Adam's per-parameter adaptive learning rate, via running estimates of the gradient's mean and variance, combined with weight decay applied directly to the weights rather than folded into the gradient. Layered on top: a **learning-rate schedule** (warmup, then decay), **gradient clipping** (cap the gradient norm before applying an update), and a **batch size measured in tokens**, not "examples," because what actually determines how stable a single gradient estimate is happens to be how many token-level loss terms got averaged into it.

## The mental model

Adam keeps, per parameter, a running average of recent gradients (`m`, first moment) and a running average of recent squared gradients (`v`, second moment). The update divides roughly by `sqrt(v)`, so parameters with noisy, large-magnitude gradients get automatically shrunk step sizes, and parameters with small, consistent gradients get relatively larger ones — an adaptive per-parameter learning rate, not a single global one.

```
m = beta1 * m + (1 - beta1) * grad
v = beta2 * v + (1 - beta2) * grad**2
m_hat = m / (1 - beta1**t)
v_hat = v / (1 - beta2**t)
theta = theta - lr * m_hat / (sqrt(v_hat) + eps) - lr * weight_decay * theta
```

The last term is the "W": weight decay applied straight to the parameters, decoupled from the adaptive gradient term, which behaves more predictably alongside Adam's scaling than folding decay into the gradient the classic L2 way.

## Why it works this way

**Warmup.** At step 0 the model is random and gradients are large and directionally unreliable — the loss surface hasn't been "found" yet. A large learning rate applied immediately can push weights into a region deep residual stacks (see [Residual Stream and Layer Norm](/learn/llm-foundations/residual-stream-and-layer-norm)) struggle to recover from. Ramping the learning rate up linearly over the first slice of training lets Adam's moment estimates — which start at zero and are biased low early on — stabilize before the step size is at full strength.

**Cosine decay after warmup.** Gradually reducing the learning rate over the rest of training means late-stage updates are small and refining rather than large and potentially undoing earlier progress: big exploratory steps early, small settling steps late.

**Gradient clipping.** Caps the global gradient norm before the update is applied, so one anomalous batch — one that happens to produce an unusually large loss — can't take a step big enough to destabilize training. Without it, a single bad batch deep into a long run can cause a visible loss spike the run may or may not recover from.

**Batch size in tokens.** Because sequences differ in length and are often packed together (see [Inside the Pretraining Data Pipeline](/learn/llm-foundations/pretraining-data-pipeline)), "batch size = N sequences" doesn't fix how much signal is in the batch. Token count is what actually determines how averaged, and how low-variance, a single gradient estimate is — which is also the unit [scaling laws](/learn/llm-foundations/scaling-laws-what-they-predict) reason about.

## A concrete example (shown)

```python
import math

def lr_schedule(step, warmup_steps, total_steps, lr_max):
    if step < warmup_steps:
        return lr_max * step / warmup_steps
    progress = (step - warmup_steps) / (total_steps - warmup_steps)
    return 0.5 * lr_max * (1 + math.cos(math.pi * progress))
```

Plotted, this traces a straight ramp from 0 up to `lr_max` over the warmup steps, then a smooth cosine curve back down toward zero by the end of training — a shape you'll recognize instantly in almost any published pretraining run's learning-rate chart.

**What goes wrong if warmup is skipped:** large early updates hit randomly-initialized weights at the same moment Adam's moment estimates are least reliable, which is a well-understood source of early loss spikes or outright divergence — especially in deeper, pre-norm models sensitive to early instability. Recovering usually means restarting from an earlier checkpoint with warmup restored, which is exactly why virtually every published training recipe includes it despite the added complexity.

## Where it shows up

Every pretraining and [SFT](/learn/llm-foundations/supervised-fine-tuning-mechanics) run uses these same knobs — fine-tuning typically reuses a smaller-scale version of the same schedule shape rather than reinventing it. Loss spikes visible in public training logs are almost always traced back to some interaction of learning rate, clipping threshold, or a bad data batch — this is the vocabulary for diagnosing them.

## Watch out for

1. Treating batch size and number of optimizer steps as independent: for a fixed token budget, doubling batch size roughly halves the number of steps, which interacts with a warmup schedule measured in steps rather than tokens.
2. Reusing a pretraining-scale learning rate for a small fine-tune — pretraining and fine-tuning learning rates typically differ by an order of magnitude or more, because of how far the weights need to move from their starting point.
3. Ignoring gradient clipping when scaling up model size — instability tends to show up *more*, not less, as depth and width increase, so the safety margin clipping provides matters more at scale (see [Training at Scale](/learn/llm-foundations/training-at-scale-parallelism-precision)).

## Where next

**Related:** [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss), [Inside the Pretraining Data Pipeline](/learn/llm-foundations/pretraining-data-pipeline), [Training at Scale: Parallelism and Precision](/learn/llm-foundations/training-at-scale-parallelism-precision), [Scaling Laws: What They Predict](/learn/llm-foundations/scaling-laws-what-they-predict), [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics)
