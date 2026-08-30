---
title: "kNN: distance metrics and feature scaling"
track: "machine-learning"
order: 301
status: live
summary: "k-nearest neighbors is only as sensible as its representation, distance metric, scaling policy, and validation split."
duration: "12 min read"
updated: "2026-08-30"
---

## The short answer

kNN predicts from nearby training rows. “Nearby” is a modeling decision: choose a representation, a metric, a scaling rule fitted only on training data, a neighborhood size, and an aggregation rule. There is no universally correct distance.

## Why this matters

kNN is a useful baseline, retrieval method, and local smoother. It also exposes a recurring ML lesson: an apparently simple algorithm can silently encode a bad notion of similarity. A raw salary column can overwhelm age and tenure; an ID-like feature can manufacture perfect neighbors.

## How it works

For a query \(x\), calculate distances to training observations, retain the closest \(k\), then vote (classification) or average (regression). Euclidean distance rewards straight-line proximity; Manhattan distance is less dominated by one large coordinate; cosine distance compares direction; Mahalanobis distance accounts for covariance. Standardize numeric features using training-set \(\mu,\sigma\). Weighting neighbors by inverse distance reduces the discontinuity of a hard vote, but needs a zero-distance rule.

## Worked examples and variations

1. **Apartment prices:** standardize floor area, bedroom count, and travel time; a distance-weighted mean makes nearby comparable homes matter most.
2. **Text embeddings:** cosine distance is often appropriate because vector direction represents semantic similarity more reliably than magnitude.
3. **Medical triage:** use a domain-reviewed metric; treating a one-unit heart-rate change as equivalent to one unit of an encoded diagnosis is indefensible.
4. **Boundary case:** if the query has no close neighbors, report distance and abstain or widen the review queue rather than returning a confident-looking average.
5. **Counterexample:** one-hot postcode can make “same postcode” dominate all continuous signals, even where adjacent postcodes are more alike geographically.

## Two ways to see it

**Geometry:** kNN tessellates feature space into local voting regions. Scaling reshapes those regions.

**Data-system view:** kNN retains its training set at serving time. Its latency, privacy exposure, duplicate records, and feature pipeline are part of the model.

## Hands-on

Use a customer-churn dataset. Build a pipeline with imputation, one-hot encoding, scaling, and kNN. Compare Euclidean and cosine distance on an embedding-only feature set; sweep \(k\in\{1,3,11,51\}\). Deliberately fit the scaler on train-plus-test, record the misleading score, then reset to train-only fitting. Inspect five worst errors with their neighbors and distances.

## Checkpoint

- [ ] The metric matches the representation and decision context.
- [ ] Scaling and encoding are learned only from training folds.
- [ ] Out-of-support queries and duplicate entities have a policy.

## What this does not solve

Nearness is not causality, fairness, calibration, or uncertainty. kNN also becomes expensive in high dimensions and at large serving scales.

## Continue, go deeper, apply it

Continue with the curse of dimensionality, then compare kNN against a regularized linear baseline on the same split.
