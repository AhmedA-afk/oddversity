---
title: "Scaling Laws: What They Predict"
track: "llm-foundations"
status: live
summary: "Loss falls as a smooth power law in parameters, data, and compute — a forecast you can compute, with sharp limits on what it tells you."
duration: "6 min read"
---

If someone tells you a model's final training loss before a single GPU spins up, they aren't guessing — they're reading it off a curve. That curve is the scaling law, and it's the closest thing deep learning has to an equation you can trust in advance.

## What it is

A scaling law is an empirical relationship: pretraining loss falls smoothly and predictably as you increase model size (parameters, N), training data (tokens, D), or compute (FLOPs, C), holding the others from becoming the bottleneck. Plot loss against any one of these on log-log axes and, across many orders of magnitude, you get something close to a straight line — a power law of the form `loss ≈ a / X^b + irreducible_floor` for whichever of N, D, C you're varying.

The [cross-track scaling-laws page](/learn/ai-foundations/scaling-laws) covers the headline history: Kaplan et al. (2020) found the power-law shape and initially favored spending compute on parameters; DeepMind's Chinchilla work (2022) corrected that, showing that for a fixed compute budget, loss is minimized when parameters and tokens grow at close to the same rate — a ratio of roughly **20 tokens per parameter**. This page goes one level deeper: what that predictive power actually buys you, and exactly where it stops.

## The mental model

Think of a scaling law as three separate dials, each with its own curve, that combine into one compute budget:

- **Parameters (N) held fixed, more data (D):** loss keeps falling until the model runs out of capacity to absorb what the data teaches it — diminishing returns from a model too small for the corpus.
- **Data (D) held fixed, more parameters (N):** loss keeps falling until the model has memorized everything learnable from that data and starts fitting noise — diminishing returns from a corpus too small for the model.
- **Compute (C) as the real constraint:** because training compute is approximately `C ≈ 6 · N · D` (roughly 2 FLOPs per parameter per token for the forward pass, doubled for backward — see [counting the FLOPs of one token](/learn/llm-foundations/counting-the-flops-of-one-token)), a fixed C forces a trade: spend it on a bigger N or a bigger D, not both freely. The Chinchilla ratio is the answer to "given C, what split minimizes loss" — and it's why frontier labs talk about *compute-optimal* runs, not just *big* ones.

The power law itself comes from a genuinely mundane source: language has a long tail of increasingly rare patterns (rare word combinations, obscure facts, longer-range dependencies), and each additional unit of scale lets the model capture a little more of that tail. Early scale captures the common, high-frequency structure fast; every further unit of scale buys progressively less new structure — that's exactly what a power law's shrinking exponent describes.

## Why it works this way

The predictive reliability comes from what the loss is actually averaging over: cross-entropy loss is a smooth statistic over millions of next-token predictions, most of which are unglamorous and highly regular (grammar, common words, common code patterns). Smooth statistics over huge, regular populations tend to behave smoothly as you scale the population size or the estimator's capacity — that's a general property of averages, not something specific to transformers. This is also exactly why a scaling law can hold rock-steady across four orders of magnitude while individual downstream *capabilities* (a specific benchmark score) can look erratic — see [emergent abilities and the mirage debate](/learn/llm-foundations/emergent-abilities-and-the-mirage-debate) for what happens when you zoom in on one thresholded skill instead of the loss average.

## A concrete example (shown)

Here's the shape of the forecast, using illustrative constants (not fitted to any real model — just enough to show the arithmetic):

```python
def loss(N, D, E=1.7, A=400.0, B=800.0, alpha=0.34, beta=0.28):
    # E: irreducible floor. A, B, alpha, beta: illustrative fit constants.
    return E + A / N**alpha + B / D**beta

# Two runs, same 20:1 Chinchilla-style token:parameter ratio
loss_small = loss(N=1e9,  D=2e10)   # 1B params,  20B tokens
loss_big   = loss(N=1e10, D=2e11)   # 10B params, 200B tokens

print(f"1B/20B tokens:   loss ≈ {loss_small:.3f}")
print(f"10B/200B tokens: loss ≈ {loss_big:.3f}")
```

Running this gives a lower loss for the 10x-larger run — unsurprising — but the *useful* part is that you computed it before training either model. Swap in real fitted constants from your own scaling runs (a handful of small training runs at different N and D, with loss curves fit to this shape) and you can forecast the loss of a run 100x larger than anything you've actually trained, which is precisely how labs decide a training budget is worth spending before they spend it.

## Where it shows up

Every "how big should we train this" conversation starts here. A [real model config](/learn/llm-foundations/reading-a-real-model-config) — its parameter count, layer count, and training token count — is downstream of exactly this arithmetic, whether or not the team that trained it says so explicitly. It's also the reasoning behind [parameters, activations, and data](/learn/llm-foundations/parameters-activations-and-data) as a triangle you manage together rather than three independent choices, and it's the setup for the worked version of this arithmetic in [using a scaling law to plan a training run](/learn/llm-foundations/using-a-scaling-law-to-plan-a-run).

## Watch out for

- **A scaling law predicts *loss*, not *capability*.** A lower cross-entropy number reliably means better next-token prediction on average — it does not tell you whether a specific downstream skill (multi-digit arithmetic, following a five-step instruction) has crossed a usable threshold. Two runs with the smoothly-predicted loss values can differ wildly on a single benchmark.
- **The fitted constants are regime-specific.** Change the data mix, the architecture family, or the tokenizer, and the exponents shift. A scaling law fit on one setup doesn't transfer exactly to another — it has to be re-fit, not assumed.
- **The line eventually bends.** High-quality data is finite, and diminishing returns on data quality (not just quantity) show up as the tail runs out. A scaling law extrapolated far past the data you fit it on is a guess dressed as an equation.

## Where next

The arithmetic behind the Chinchilla ratio, worked by hand and in code for a fixed budget, is in [using a scaling law to plan a training run](/learn/llm-foundations/using-a-scaling-law-to-plan-a-run). For what happens when a specific *capability* — not the loss average — is plotted against the same scale axis, see [emergent abilities and the mirage debate](/learn/llm-foundations/emergent-abilities-and-the-mirage-debate).

**Related:** [Scaling Laws (cross-track)](/learn/ai-foundations/scaling-laws), [Counting the FLOPs of One Token](/learn/llm-foundations/counting-the-flops-of-one-token), [Parameters, Activations, and Data](/learn/llm-foundations/parameters-activations-and-data), [Reading a Real Model Config](/learn/llm-foundations/reading-a-real-model-config)
