---
title: "Quantile and robust regression"
track: "machine-learning"
order: 209
status: live
summary: "Predict useful conditional quantiles and reduce the domination of a few extreme residuals."
duration: "23 min read"
updated: "2026-08-30"
---

## The short answer

Mean regression answers “what is the expected value?” Quantile regression answers “what value is exceeded only this fraction of the time?” Robust regression changes how large residuals are weighted. Choose either because the decision demands it, not because outliers look inconvenient.

## Why this matters

Delivery promises need upper quantiles; staffing may need a 90th-percentile load; fraud amounts and claims can have long tails. A mean can be accurate and operationally useless.

## How it works

Quantile loss is asymmetric: for quantile $q$, underprediction costs $q$ times the error and overprediction costs $(1-q)$ times it. At $q=0.5$, it estimates the conditional median. Huber-style robust losses are quadratic near zero and less aggressive for large residuals. Compare quantile coverage on held-out data and inspect conditional coverage by meaningful slices.

## Worked examples and variations

1. The median delivery time is a better typical experience than the mean under rare disruptions.
2. A 0.9 quantile model can set a conservative inventory buffer.
3. At $q=0.5$, asymmetric loss becomes absolute loss; it is not least squares.
4. One erroneous million-dollar entry can pull OLS strongly but receive limited Huber influence.
5. A nominal 90% interval covering only 60% of winter orders is a counterexample to globally averaged coverage.

## Two ways to see it

Quantiles are service-level promises expressed as a loss function. Robust loss is an influence policy: it decides how loudly a far-away point is allowed to speak during fitting.

## Hands-on

Fit mean, median, and 90th-quantile regressions to skewed delivery times. Add one synthetic extreme target, compare coefficient movement, then remove it. Reset with data-quality investigation and evaluate held-out coverage overall and by region.

## Checkpoint

What conditional event should a well-calibrated 0.9 quantile satisfy? Why is deleting every outlier a bad robustness strategy?

## What this does not solve

Robust fitting cannot distinguish an important rare event from a bad record, and marginal quantile coverage may hide subgroup failure.

## Continue, go deeper, apply it

Continue to prediction intervals. Use quantiles when the user needs a risk level, not merely a point forecast.
