---
title: "Case study: demand forecast with uncertainty"
track: "machine-learning"
order: 216
status: live
summary: "Frame demand prediction as a time-aware, uncertainty-aware inventory decision rather than a single regression score."
duration: "50 min case study"
updated: "2026-08-30"
---

## The short answer

The goal is not “predict sales accurately.” It is to choose inventory actions under stock-out and holding costs. Build a chronological baseline, prevent future leakage, forecast a distribution or quantiles, and evaluate the decision policy as well as numeric error.

## Why this matters

Demand data rewards accidental leakage: future promotions, post-period returns, and revised stock records can make offline models look brilliant. Point forecasts also obscure the asymmetric costs that operations actually pays.

## How it works

Define item-location-time grain, forecast horizon, order cutoff, and action owner. Establish seasonal-naive and recent-average baselines. Engineer only features known at the cutoff: lagged sales, planned promotions, calendar, price, and availability history. Use rolling-origin validation. Fit a point model plus quantiles or intervals. Translate forecasts to an inventory rule, then report stock-out, overstock, service-level, and slice performance—not just RMSE.

## Worked examples and variations

1. A seven-day seasonal-naive forecast may beat a complex model for stable weekly demand.
2. A promotion flag is valid only if the promotion was planned and known at order time.
3. Zero sales during stock-out are censored demand, not proof of zero desire.
4. New products lack lags and need a cold-start policy rather than imputed historical sales.
5. A model that improves average RMSE while under-covering holiday peaks is a counterexample to operational success.

## Two ways to see it

Statistically, this is a supervised forecast with temporal dependence. Operationally, it is a newsvendor-like risk decision: choose quantity against asymmetric shortage and holding loss.

## Hands-on

Create a rolling backtest with at least three forecast origins. First run a seasonal-naive baseline and publish its metrics. Intentionally include a feature recorded after the forecast cutoff; observe its unrealistic lift. Reset by enforcing an availability-time audit, then compare point and 90th-quantile policies under a stated inventory-cost scenario. Log errors for new items, stock-outs, holidays, and high-volume locations.

## Checkpoint

What information must be known at the forecast cutoff? Why can observed zero sales be an invalid demand label during a stock-out?

## What this does not solve

This case does not solve supply constraints, price optimization, strategic promotion effects, or demand caused by inventory availability itself.

## Continue, go deeper, apply it

Turn the final notebook into a monitored batch pipeline with retraining triggers, interval coverage checks, and an operations-owned escalation policy.
