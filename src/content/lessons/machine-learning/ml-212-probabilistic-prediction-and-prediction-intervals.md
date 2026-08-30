---
title: "Probabilistic prediction and prediction intervals"
track: "machine-learning"
order: 212
status: live
summary: "Give decisions a distribution or interval, and distinguish uncertainty about a new outcome from uncertainty about a mean."
duration: "25 min read"
updated: "2026-08-30"
---

## The short answer

A point prediction hides uncertainty. Probabilistic prediction estimates a distribution, quantiles, or interval for a future outcome. A prediction interval for one new observation is generally wider than a confidence interval for the average response.

## Why this matters

Inventory, staffing, and safety decisions require a range and risk level. A forecast of 100 orders is incomplete if 60–160 is plausible and stock-outs are expensive.

## How it works

Distributional models predict parameters, quantile models predict selected percentiles, and conformal methods use held-out residual information to construct intervals under stated exchangeability conditions. Evaluate sharpness *and* coverage: a 100%-wide interval is safe but useless. Check conditional coverage by time, region, or forecast horizon because average coverage can conceal failure where risk matters.

## Worked examples and variations

1. A 95% prediction interval for tomorrow's sales concerns one outcome, not the mean of many tomorrows.
2. A confidence interval around average demand can be narrow while individual daily demand is volatile.
3. Wider intervals for a new store with little history are appropriate epistemic caution.
4. A constant-width interval can under-cover high-volume stores when residual variance grows with scale.
5. An interval that includes every outcome by spanning the full possible range is a counterexample to useful uncertainty.

## Two ways to see it

An interval is a contract about repeated coverage under assumptions. Decision-theoretically, it is an input to asymmetric costs: choose stock or review capacity for a chosen risk tolerance.

## Hands-on

Produce 50%, 80%, and 95% intervals for held-out demand and calculate empirical coverage and average width. Intentionally evaluate intervals on training rows and note the inflated result. Reset on untouched chronological test data and slice coverage by volume band.

## Checkpoint

Why is a prediction interval wider than a mean-response confidence interval? What two properties should interval evaluation report?

## What this does not solve

Intervals do not guarantee correct coverage after distribution shift or determine the business cost of being wrong.

## Continue, go deeper, apply it

Continue to calibration and operational thresholds. Add interval coverage monitoring to every consequential regression deployment.
