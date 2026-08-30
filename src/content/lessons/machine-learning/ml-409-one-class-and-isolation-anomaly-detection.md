---
title: "Detect anomalies with one-class and isolation methods"
track: "machine-learning"
order: 409
status: live
summary: "Score unusual observations without assuming labelled fraud, and calibrate triage thresholds against review capacity and harm."
duration: "16 min read"
updated: "2026-08-30"
---

## The short answer

One-class methods learn a region occupied by typical data; isolation methods assign high anomaly scores to points separated with few random partitions. Both rank unusualness, not guilt, defects, or a final business decision.

## Why this matters

Rare-event labels are delayed, selective, and often wrong. Anomaly scoring can focus investigation, but false positives can freeze legitimate payments, burden vulnerable customers, or create unreviewable alert queues.

## How it works

One-class SVM finds a boundary around normal examples in a feature space; its kernel and `nu` control flexibility and expected outlier fraction. Isolation Forest repeatedly chooses a feature and random split: short average path lengths indicate easy isolation. Fit on a carefully defined reference window, score future data, and select thresholds from capacity and observed precision.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Equipment telemetry:** score departures from healthy sensor patterns and inspect before maintenance.
2. **Account activity:** flag unusual combinations of device, pace, and transaction context.
3. **Data quality:** surface malformed records before they contaminate a training table.
4. **Boundary:** a new but legitimate product launch can be anomalous because it is genuinely new.
5. **Counterexample:** a rare protected-language pattern is unusual but not abusive or fraudulent.

## Two ways to see it

One-class learning draws a support boundary. Isolation measures how quickly a random decision tree can separate a point from its peers.

## Hands-on

Train Isolation Forest and one-class SVM on a clean reference sample, then score a later labelled audit sample. Plot precision and review volume across thresholds. Deliberately mix known incidents into the normal training set; inspect degraded ranking. Reset the reference period, add a manual-review outcome field, and choose a threshold that fits weekly capacity.

## Checkpoint

- [ ] “Normal” training data and time window are defensible.
- [ ] Scores are calibrated with audited outcomes and queue capacity.
- [ ] Alerts retain context for a reviewer.

## What this does not solve

Unsupervised scores do not explain root cause, adjudicate fraud, or replace a supervised model once representative labels exist.

## Continue, go deeper, apply it

Compare density-based novelty scoring and build an investigation workflow. Apply anomaly detection as prioritisation with human recourse.

