---
title: "Lab: demand forecasting with delayed labels"
track: "machine-learning"
order: 706
status: live
summary: "Forecast demand honestly when outcomes arrive late and stockouts censor observed sales."
duration: "105 min lab"
updated: "2026-08-30"
---

## The short answer

Forecast each horizon using only information available at forecast creation, backtest with rolling origins, and account for label delay and stockout-censored sales before claiming inventory benefit.

## Why this matters

Demand data looks simple until operational timing intervenes. Future promotions leak easily, recent labels may be incomplete, and observed sales can be lower than demand because stock was unavailable.

## How it works

Define forecast origin, horizon, item-location grain, and the decision it supports. Build seasonal-naive and moving-average baselines before a regression or gradient-boosted model with lagged features. Generate each backtest prediction as if at that historical origin. Use MAE or weighted loss that reflects replenishment decisions, examine bias, and maintain a separate maturity rule for labels that arrive late.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. Weekly forecast for next four weeks uses only data closed by Sunday night.
2. A known, approved promotion can be a future covariate if its plan was fixed at forecast time.
3. Intermittent demand may need a sparse-item baseline instead of a global mean.
4. Boundary case: zero recorded sales during a stockout is not necessarily zero demand.

## Two ways to see it

The supply view asks “how much should we prepare?” The ML view is repeated, horizon-specific prediction under temporal availability constraints.

## Hands-on

Deliver a forecasting calendar, availability table, rolling-backtest function, two naive baselines, one feature model, horizon-wise metric table, and bias plot. Intentionally fail by including future realized sales or a promotion outcome not known at origin; show the unrealistically good backtest, remove it, and reset. Flag stockout periods and report how you handled them rather than imputing demand as fact.

## Checkpoint

You can reconstruct exactly what a model knew at any historical forecast origin and explain why one static train/test split is inadequate.

## What this does not solve

It does not optimize inventory policy, guarantee supplier availability, or identify true lost demand without additional evidence.

## Continue, go deeper, apply it

Pair forecasts with inventory simulation, hierarchical reconciliation, probabilistic forecasts, and post-launch forecast-value tracking.
