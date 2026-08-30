---
title: "Decompose time series and engineer leakage-safe features"
track: "machine-learning"
order: 412
status: live
summary: "Separate level, trend, seasonality and residuals, then construct only features that would have existed at prediction time."
duration: "17 min read"
updated: "2026-08-30"
---

## The short answer

Time-series decomposition separates observed values into level, trend, seasonality, and remainder. Forecasting features such as lags and rolling windows are powerful only when calculated with information available at the decision timestamp.

## Why this matters

Temporal leakage routinely produces dazzling offline results that vanish on Monday morning. A rolling average that includes the target period, a late-corrected label, or a future aggregate invalidates the evaluation.

## How it works

An additive model writes `y = trend + seasonality + residual`; a multiplicative one suits variance that grows with level. STL estimates smooth trend and seasonal components robustly. Build lagged values, differences, rolling summaries, calendars, known-future covariates, and entity-level aggregates with an explicit cutoff. Missing timestamps, time zones, and revisions are part of the data model.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Daily demand:** weekly seasonality and holiday flags improve a baseline.
2. **Subscription churn:** lagged usage and a trailing 28-day trend preserve account history.
3. **Energy load:** weather forecasts are allowed; realised tomorrow temperature is not.
4. **Boundary:** an intermittent series with mostly zeros may make seasonal decomposition unstable.
5. **Counterexample:** computing a customer's monthly total before predicting mid-month leaks later activity.

## Two ways to see it

Decomposition explains recurring signal components. Feature engineering turns a timestamped event stream into snapshots a model could have seen then.

## Hands-on

Create a daily series with trend, weekly seasonality, and a shock. Compare seasonal-naive forecasting with lag and rolling features. Deliberately use a centred rolling mean and measure the false gain. Reset with trailing windows only, build a feature-availability table, and test the shock period separately.

## Checkpoint

- [ ] Every feature has an availability timestamp.
- [ ] Calendar, time zone, and revision conventions are documented.
- [ ] Trend/seasonal residual behaviour was inspected.

## What this does not solve

Decomposition does not make a nonstationary system predictable or establish that a calendar correlation causes demand.

## Continue, go deeper, apply it

Use walk-forward backtests before selecting models. Apply a feature-availability contract to every time-dependent pipeline.

