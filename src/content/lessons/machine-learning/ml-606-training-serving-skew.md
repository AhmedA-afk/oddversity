---
title: "Training-serving skew"
track: "machine-learning"
order: 606
status: live
summary: "Detect and prevent differences between offline training features and the values available at real inference time."
duration: "20 min read"
updated: "2026-08-30"
---

## The short answer

Training-serving skew occurs when the model sees a different feature definition, transformation, population, or time cutoff in production than it saw offline. It is a systems bug before it is a modeling problem.

## Why this matters

Offline metrics can look excellent while online predictions fail immediately. Leakage, duplicated transformations, library-version differences, late data, and default values all create silent shifts that ordinary accuracy checks may miss.

## How it works

Build features from shared definitions whenever possible. For a sample of production entities, join the exact online feature vector, offline reconstruction, model version, and prediction timestamp. Compare raw values, transformed values, missingness, and score distributions. Use point-in-time reconstruction and contract tests at the same cutoff used by the serving request.

## Worked examples and variations

1. Training uses a 30-day purchase count ending at label time; serving accidentally includes today’s still-unsettled purchase. That is temporal skew.
2. Offline one-hot encoding learns a category list; online maps a new category to all zeros. The model may treat “new category” as a common baseline.
3. A local timezone conversion turns midnight transactions into the prior day offline but not online, changing daily aggregates.
4. Training imputed missing income with the median; serving replaces missing values with zero because the API client serializes an absent field differently.
5. Boundary case: genuine population drift changes values in both paths; do not label it skew until definitions and reconstruction agree.

## Two ways to see it

Skew is a reproducibility failure: the same entity at the same time cannot be recreated. It is also an online/offline equivalence property that can be continuously tested.

## Hands-on

Select 100 recent predictions and reconstruct their features from historical source data. Calculate per-feature equality, tolerance failures, and score deltas. Deliberate failure: compare today’s offline table to yesterday’s production request without aligning event time. Reset by pinning entity IDs and as-of timestamps, then fail CI when critical features exceed a documented tolerance.

## Checkpoint

What time is each feature allowed to know? How are unseen categories, nulls, and transformations handled in both paths?

## What this does not solve

Eliminating skew does not eliminate concept drift, bad labels, or a model’s statistical limitations. It only establishes that the intended model is actually being served.

## Continue, go deeper, apply it

Next, implement point-in-time correct feature stores, golden-vector tests, and shadow scoring that compares old and candidate feature pipelines.
