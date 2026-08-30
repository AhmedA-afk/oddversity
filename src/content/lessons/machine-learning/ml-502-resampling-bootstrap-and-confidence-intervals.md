---
title: "Resampling, bootstrap, and confidence intervals"
track: "machine-learning"
order: 502
status: live
summary: "Use resampling to describe how much a reported metric could vary, while preserving the data dependencies your deployment actually has."
duration: "15 min read"
updated: "2026-08-30"
---

## The short answer

A single validation score is an estimate with sampling noise. Bootstrap resampling and repeated valid splits approximate how a metric varies under a specified sampling scheme. Report an interval and the resampling unit, not only a point estimate. Do not bootstrap individual rows when rows within a person, session, or time series are dependent.

## Why this matters

A 0.3-point lift can be either valuable signal or ordinary split noise. Teams that report only the best score often select fragile models and create certainty that the evidence does not support. Intervals make tradeoffs between accuracy, latency, cost, and safety discussable.

## How it works

For a bootstrap, sample evaluation units with replacement, compute the metric, and repeat many times. Quantiles of the resulting values form a percentile interval. Paired bootstrap comparisons resample the same cases for two models and examine the distribution of their difference. Repeated cross-validation is another way to see split sensitivity, but its folds are correlated and should not be treated as independent experiments.

Choose units before resampling: users for user-level decisions, stores for store-level rollout, blocks for time series. Preserve class balance or temporal order only when the resampling design requires it. An interval describes variation conditional on the observed data and protocol; it does not cover every source of real-world change.

## Worked examples and variations

### Example 1: accuracy interval

Resample 5,000 independent labeled items and calculate accuracy each time. If the middle 95 percent of bootstrap scores spans 0.81 to 0.84, report both the score and that range.

### Example 2: paired model comparison

For every bootstrap draw, score baseline and candidate on exactly the same resampled cases. The interval for candidate minus baseline is more informative than two separate intervals because case difficulty cancels.

### Example 3: user-level bootstrap

For a recommender with many events per user, resample users and retain their events. Row-level resampling would pretend thousands of correlated clicks were independent evidence.

### Example 4: blocked time bootstrap

For daily demand, resample contiguous time blocks rather than isolated days to retain seasonal and autocorrelated structure. State the block length and why it matches the business horizon.

### Boundary case: rare positive class

If a resample has no positives, precision or recall may be undefined. Record the event, use a stratified design where defensible, and seek more labeled positives rather than concealing failures.

### Counterexample: interval after model hunting

Bootstrapping only the winning model after trying fifty variants ignores selection uncertainty. The interval may be narrow while the chosen score is still optimistically biased.

## Two ways to see it

The statistical view treats the observed dataset as a stand-in for a population and asks how estimates vary under resampling. The engineering view asks whether a claimed improvement survives plausible redraws of the customers or days that matter.

## Hands-on

Take a fixed test set and compute a paired bootstrap interval for F1 or mean absolute error between two pipelines. Deliberately resample rows in a repeated-user dataset, compare it with a user-level bootstrap, then reset to the user-level result for your report. Include the metric, unit, repeats, seed, and interval method in a results table.

## Checkpoint

- [ ] The resampling unit matches the independent deployment unit.
- [ ] Model comparisons use paired draws when evaluated on the same cases.
- [ ] The interval is reported with its assumptions and selection history.

## What this does not solve

Resampling cannot repair leakage, label error, distribution shift, or an irrelevant metric. It quantifies only some uncertainty around the protocol you ran.

## Continue, go deeper, apply it

Continue with hypothesis tests and effect sizes. Go deeper with hierarchical and Bayesian uncertainty models. Apply this by requiring intervals for every model-change proposal.
