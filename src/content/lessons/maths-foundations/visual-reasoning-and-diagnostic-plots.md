---
title: "Visual reasoning and diagnostic plots"
track: "maths-foundations"
status: live
summary: "A diagnostic plot is a measurement instrument, not decoration."
duration: "5 min read"
---

## The short answer

A diagnostic plot is a measurement instrument, not decoration. Choose an axis
scale, aggregation, baseline, and slice that preserve the decision you need to
make; label transformations and uncertainty. Linear axes show additive change,
log axes show multiplicative change, and an average can conceal a failing group.
Always inspect raw points and the boundary where the plot could mislead you.

## Why this matters

Training curves, confusion matrices, residual plots, latency distributions, and
drift charts turn invisible model behaviour into something inspectable. They can
also create false confidence: a truncated y-axis exaggerates a small gain, a
smoothed curve hides instability, and a single average hides a subgroup or tail.

The plot should answer a stated question. If the question is “did the slowest
requests become safe?” a mean-latency line is the wrong instrument even when it is
beautifully labelled.

## How it works

Every chart has at least four choices:

1. **Encoding:** which variable is on each axis and what does each mark mean?
2. **Scale:** linear, log, categorical, or transformed?
3. **Aggregation:** raw observations, mean, median, percentile, or a slice?
4. **Reference:** what baseline, target, zero, or uncertainty band makes the
   decision interpretable?

For positive data spanning orders of magnitude, a log axis turns a multiplicative
relationship into an additive visual distance. It does not make zero or negative
values valid; those need a separate policy. A diagnostic is strongest when the
transformation and omitted cases are visible in the caption or metadata.

## Worked examples and variations

### Example A: linear loss improvement

**Illustrative.** **Input:** losses `[1.0, 0.8, 0.6, 0.4]` over four iterations. **Mechanism:** a
linear y-axis preserves additive drops of `0.2`. **Output:** a line whose equal
vertical steps represent equal loss reductions. **Inspect:** add the baseline and
label iteration, not wall-clock time, if compute cost differs. **Decision:** the
run is improving in this fixture, but inspect validation loss before claiming
generalisation.

### Example B: exponential growth on a log axis

**Illustrative.** **Input:** request volume `[10, 100, 1000, 10000]` over four periods.
**Mechanism:** a log y-axis places equal ratios at equal vertical distances.
**Output:** an approximately straight line, while a linear plot compresses the
first three observations near zero. **Inspect:** include the base or say “log
scale.” **Decision:** use the log view to inspect growth rate, but retain a linear
view when absolute capacity is the decision.

### Boundary case: zero, negative, and missing values

**Illustrative.** **Input:** a latency or count series containing `0`, a negative sentinel, and a
missing value. **Mechanism:** a log transform cannot represent zero or negative
values, and dropping them changes the population. **Output:** an error, omitted
points, or an apparently clean but incomplete chart. **Inspect:** count plotted
and unplotted rows. **Decision:** choose a documented transform or separate panel;
never silently discard invalid values.

### Counterexample: an honest-looking chart that hides a failure

**Illustrative.** **Input:** group A has accuracy `99%` on 990 cases; group B has `70%` on 10
cases. **Mechanism:** a single weighted average gives `98.71%` and a narrow,
truncated chart can make the result look uniformly excellent. **Output:** one
impressive bar. **Inspect:** show group counts, group metrics, and an uncertainty
or sample-size warning. **Decision:** investigate group B before shipping or
reporting the aggregate.

### Variation: smoothing a noisy training curve

**Illustrative.** **Input:** raw validation losses oscillate while a rolling average declines.
**Mechanism:** smoothing reduces visual noise but also delays or hides spikes.
**Output:** a calm trend line. **Inspect:** overlay raw points, window size, and
the unsmoothed maximum. **Decision:** use the smoothed line for trend context,
not as the sole release diagnostic.

## Two ways to see it

### Builder view

Write a plot specification before calling the plotting library: question,
population, x/y variables, scale, aggregation, baseline, missing-value policy,
and required slices. Then make the chart a reproducible artifact rather than a
one-off screenshot.

### Reviewer or adversary view

Ask what a hurried reader would infer and what the chart makes difficult to see.
Try a zero baseline, a full-range axis, raw points, subgroup panels, and alternate
denominators. A chart is a claim with geometry; its omissions are part of the
claim too.

## Hands-on

Create a plot specification for a model run with raw training/validation loss,
one subgroup slice, and a baseline. A minimal record can contain:

```python
plot_spec = {
    "question": "Did validation loss improve without a subgroup regression?",
    "x": "step",
    "y": "loss",
    "scale": "linear",
    "aggregation": "raw_plus_rolling_mean",
    "baseline": 0.5,
    "slices": ["all", "group_b"],
    "missing_policy": "show_count_and_reject_silent_drop",
}
```

**Failure fixture:** set `scale="log"` while the data contains zero, and remove
the subgroup slice while keeping only the aggregate. **Test:** validate that a
log plot has strictly positive plotted values, that every requested slice is
present, and that a bar chart declares its baseline policy. **Reset:** restore a
linear scale for the zero-containing fixture and re-add `group_b`; save both the
specification and the rendered plot so another learner can reproduce the view.

## Checkpoint

- [ ] Choose linear or log axes for `[1, 10, 100, 1000]` and explain the decision.
- [ ] Name one failure caused by plotting only an average.
- [ ] Explain why zero and negative values need an explicit log-scale policy.
- [ ] List the raw data and metadata needed to reproduce one diagnostic plot.

## What this does not solve

A well-labelled plot does not establish causality, statistical significance, or
model safety. Visual patterns are hypotheses to test, and small groups can look
extreme by chance. Keep the underlying data, denominator, uncertainty method,
and transformation available for review.

## Continue, go deeper, apply it

- Continue: Ratios, fractions, percentages, and numerical sanity checks
- Go deeper: Interpretability and error analysis
- Apply it: Drift and monitoring
