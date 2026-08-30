---
title: "Emergent Abilities and the Mirage Debate"
track: "llm-foundations"
status: live
summary: "Sharp capability jumps at scale look real under exact-match scoring and often vanish under a continuous metric on the same data."
duration: "6 min read"
---

Plot the same model checkpoints, on the same task, under two different scoring rules, and you can get a cliff in one plot and a smooth ramp in the other. Neither plot is lying — they're measuring different things, and the disagreement is the whole debate.

## What it is

[Emergent abilities in LLMs](/learn/llm-foundations/emergent-abilities-in-llms) lays out the original claim: some capabilities sit near zero performance across many model scales, then jump sharply once scale crosses some threshold, as if the ability "switches on." The counter-argument, associated with Schaeffer, Miller, and Ré (2023), is that a large share of reported jumps are an artifact of the metric, not evidence of a discontinuity inside the model. This page is about how to tell which one you're looking at.

## The mental model

Picture a task where the model has to get every one of `k` independent sub-decisions right to be scored correct — say, a 20-digit arithmetic answer, or a multi-step instruction with five sub-steps. If the model's *per-digit* (or per-step) accuracy `p` improves smoothly and gradually as scale increases, the probability of getting **all** `k` right is `p^k` — and raising a smoothly increasing number to a fixed power `k` produces a curve that looks flat near zero for a long stretch, then rises steeply, purely from the exponent. Nothing inside the model had to change discontinuously for the *scored* curve to look like a cliff.

That's the core mechanism: **exact-match** (and other all-or-nothing scoring rules) compresses a smooth underlying quantity into a threshold-shaped one before you ever see it plotted. A **continuous** metric — per-token cross-entropy, edit distance, partial credit per digit — skips that compression and shows you the underlying `p` directly.

## Why it works this way

This isn't a claim that every reported emergent ability is fake — it's a claim about what a plot can and can't distinguish. A metric that only rewards perfect completions and a metric that rewards partial correctness are measuring genuinely different things, and they will disagree exactly when the underlying skill is close to continuous but the task requires stacking many correct sub-decisions in a row. The higher `k` is (more digits, more steps, more constraints), the sharper the manufactured cliff, even for identical underlying improvement in `p`.

## A concrete example (shown)

```python
import numpy as np

def per_digit_accuracy(scale_log10):
    # A smooth, gradually-improving accuracy curve vs. log10(model scale).
    # Illustrative sigmoid — not measured from any real model.
    x = scale_log10 - 9.5   # centered around ~3B params
    return 1 / (1 + np.exp(-1.2 * x))

scales = np.array([8, 8.5, 9, 9.5, 10, 10.5, 11])   # log10(params): 100M .. 100B
p = per_digit_accuracy(scales)

for k in [1, 5, 20]:
    exact_match = p ** k
    print(f"k={k:>2}:", " ".join(f"{v:.2f}" for v in exact_match))

print("per-digit p:", " ".join(f"{v:.2f}" for v in p))
```

```
k= 1: 0.14 0.23 0.35 0.50 0.65 0.77 0.86
k= 5: 0.00 0.00 0.01 0.03 0.11 0.27 0.47
k=20: 0.00 0.00 0.00 0.00 0.00 0.01 0.05
per-digit p:  0.14 0.23 0.35 0.50 0.65 0.77 0.86
```

The bottom row (`p`, the continuous metric) rises smoothly across the whole range, roughly doubling between the first and last checkpoint. The `k=20` row looks like nothing is happening across five full scale checkpoints, then only hints at life at the very end — the signature "flat, then a cliff" shape from the original emergence papers, generated here from a curve that never had a discontinuity in it. Push `k` higher (more required digits, more required steps) and that hint of life at the last checkpoint gets pushed later still, purely from the exponent — no change to the underlying `p` required. This is exactly the digit-arithmetic argument Schaeffer et al. made concrete: same underlying trend, different-looking plot, purely from `k`.

## Where it shows up

This matters most for benchmarks that score pass/fail on multi-part answers — code that must pass every test case, math answers that must match exactly, multi-turn instructions with several must-follow constraints. Any leaderboard table reporting a sudden jump between two model generations on one such benchmark, while a near-identical benchmark with partial credit barely moves, is showing you this effect in the wild rather than a mysterious new capability. [Using a scaling law to plan a training run](/learn/llm-foundations/using-a-scaling-law-to-plan-a-run) shows the same point from the other direction: loss falls smoothly and predictably across the identical scale range where a strict pass/fail score can look flat then cliff-like.

## Watch out for

- **"It's an artifact" doesn't mean "ignore it."** A capability that's genuinely near-zero below a threshold behaves like near-zero in production regardless of why the plot looks that way — a model just under the line fails the task, full stop. The debate is about *mechanism*, not about whether the practical cliff is real for your use case.
- **Re-scoring with a continuous metric isn't always possible.** Some tasks are legitimately all-or-nothing at the point of use (a SQL query either runs or it doesn't) — the mirage argument explains the shape of the curve, it doesn't hand you a free continuous substitute for every metric.
- **Don't assume every smooth-looking capability stays smooth at your `k`.** A task with a small number of sub-decisions can look gradual right up until you add one more required step and the exponent bites.

## Where next

[Grokking and double descent mechanics](/learn/llm-foundations/grokking-and-double-descent-mechanics) covers a different, better-mechanistically-understood kind of sudden transition — one that happens over *training time* at fixed scale rather than over *model scale*, worth contrasting against the mirage argument here.

**Related:** [Emergent Abilities in LLMs](/learn/llm-foundations/emergent-abilities-in-llms), [Scaling Laws: What They Predict](/learn/llm-foundations/scaling-laws-what-they-predict), [Using a Scaling Law to Plan a Training Run](/learn/llm-foundations/using-a-scaling-law-to-plan-a-run), [Grokking and Double Descent Mechanics](/learn/llm-foundations/grokking-and-double-descent-mechanics)
