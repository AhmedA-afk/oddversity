---
title: "Forecast with honest baselines and walk-forward backtests"
track: "machine-learning"
order: 413
status: live
summary: "Evaluate forecasts at multiple historical origins against strong naive baselines and the real decision horizon."
duration: "18 min read"
updated: "2026-08-30"
---

## The short answer

A trustworthy forecast wins against a relevant naive baseline across sequential, walk-forward evaluation windows. Split by time, preserve the horizon and data-availability delay, and report error by period and series rather than one flattering aggregate.

## Why this matters

Random cross-validation lets a model train on tomorrow to predict yesterday. It also hides that a sophisticated model may fail to beat “same as last week,” the baseline a planner already has.

## How it works

At each origin, train only on past data, predict the fixed future horizon, advance the origin, and aggregate errors. Use last-value, seasonal-naive, moving-average, and domain-plan baselines. Select MAE, RMSE, MAPE-like metrics cautiously near zero, or pinball loss for quantiles according to decision cost. Keep an untouched final period.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Weekly retail:** compare a model with last-week and same-week-last-year baselines.
2. **Staffing:** evaluate 1-day and 14-day horizons separately because actions differ.
3. **Inventory:** use quantile forecasts when stockout and waste costs are asymmetric.
4. **Boundary:** a one-time launch has little history; communicate wide uncertainty instead of pretending a stable pattern.
5. **Counterexample:** lower global RMSE can worsen error on high-value stores that drive the decision.

## Two ways to see it

Walk-forward testing is a replay of past deployment dates. Baselines are a counterfactual: what would the organisation have done without this model?

## Hands-on

Implement expanding-window backtests for a seasonal series at horizons 1, 7, and 28. Compare seasonal-naive, a linear lag model, and a tree model. Deliberately tune hyperparameters using the final holdout. Reset by reserving the final period, show error by origin, and write a launch criterion tied to a planner action.

## Checkpoint

- [ ] Origins, horizons, and data delays reflect production.
- [ ] At least one strong naive baseline is reported.
- [ ] Metrics are sliced by series, season, and decision importance.

## What this does not solve

Backtests cannot foresee a regime change or quantify intervention effects when the forecast itself changes behaviour.

## Continue, go deeper, apply it

Continue to monitoring and probabilistic calibration. Apply walk-forward evaluation before any forecasting model promotion.

