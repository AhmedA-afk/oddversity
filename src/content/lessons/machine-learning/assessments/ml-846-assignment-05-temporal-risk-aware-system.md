---
title: "Assignment 5: build a time-aware, risk-aware ML system"
track: "machine-learning"
order: 846
status: live
summary: "Finish the sequence by designing a temporal evaluation, release plan, monitoring, and rollback decision."
duration: "14–20 hours"
updated: "2026-08-30"
---

## Brief

Develop a forecasting, ranking, churn, fraud, or operations model where time matters. Deliver a recommendation for a limited launch, shadow mode, or no-launch decision. A high offline metric is insufficient.

## Required work

Define the prediction horizon, observation cutoff, label delay, retraining cadence, and action latency. Use rolling-origin or otherwise time-respecting evaluation. Benchmark a naive seasonal/persistence baseline and at least two models. Quantify degradation by period and slice. Write a monitoring specification covering data quality, prediction distribution, realised outcome, calibration/decision utility, and human/operator harm. Simulate one drift incident and document detection, triage, rollback, and learning.

## Submission artefacts

Submit reproducible code; temporal data card; backtest table; release checklist; model card; monitoring specification; incident report; and a two-page launch memo. The memo must state who owns alerts, what threshold causes intervention, and why the expected benefit justifies residual risk.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Temporal framing and split correctness | 25 |
| Baselines, backtesting, and uncertainty | 20 |
| Risk-aware decision and subgroup evidence | 15 |
| Monitoring, ownership, and rollback | 20 |
| Drift simulation and incident learning | 10 |
| Reproducibility and communication | 10 |

## Self-check

- Can every feature be computed at the stated cutoff?
- Does the naive baseline win in any period, and what follows from that?
- Are monitoring metrics connected to a specific action owner?
- Would a safe default still exist if the service or data feed fails?

## Common failure modes

Random temporal splitting, using future aggregates, claiming drift from a single noisy chart, and monitoring only latency are major errors. Do not automate a high-impact action without a human escalation path and a documented rollback.
