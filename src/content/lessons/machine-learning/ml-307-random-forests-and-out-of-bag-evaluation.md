---
title: "Random forests and out-of-bag evaluation"
track: "machine-learning"
order: 307
status: live
summary: "Random forests average many decorrelated trees to reduce variance, while out-of-bag predictions provide a built-in but not universal validation signal."
duration: "13 min read"
updated: "2026-08-30"
---

## The short answer

Random forests fit trees on bootstrap samples and restrict each split to a random subset of features. Averaging their predictions reduces the variance of individual trees when their errors are not perfectly correlated. Rows omitted from a tree’s bootstrap sample can receive out-of-bag (OOB) predictions.

## Why this matters

Forests are durable tabular baselines: little feature scaling, nonlinear interactions, and reasonable performance with modest tuning. OOB estimates are convenient, but time order, groups, leakage, and hyperparameter selection can make them insufficient.

## How it works

Each tree sees a sample drawn with replacement; about one-third of rows are typically absent from that tree. At a node, consider only a sampled feature subset. Aggregate class probabilities or regression predictions across trees. OOB prediction for a row averages only trees that did not train on it; use it for diagnostics, not as permission to skip a proper test design.

## Worked examples and variations

1. **Claims severity:** average many deep, noisy regression trees to capture interactions without trusting any one tree.
2. **Feature screening:** compare permutation importance with a domain review; correlated features may share or distort importance.
3. **Wide tabular data:** lower `max_features` decorrelates trees but can weaken each split.
4. **Boundary case:** OOB is useful for an IID dataset with fixed hyperparameters and no grouping.
5. **Counterexample:** OOB mixes future and past rows in a forecasting task, producing leakage even though each tree omits some rows.

## Two ways to see it

**Statistics view:** bagging reduces variance through averaging decorrelated estimators.

**Operational view:** a forest is an ensemble artifact; explanations and latency must summarize hundreds of paths.

## Hands-on

Fit a random forest with OOB enabled and compare OOB, cross-validation, and final holdout scores. Vary trees, `max_features`, and minimum leaf size. Deliberately use random OOB-style validation on a grouped dataset, observe leakage, then reset using group-aware cross-validation and report the difference.

## Checkpoint

- [ ] You can explain why random features matter in addition to bootstrapping.
- [ ] OOB is not substituted for a split that respects time or entity groups.
- [ ] Importance is not mistaken for a causal ranking.

## What this does not solve

Forests can still be large, biased by data quality, poorly calibrated, and unable to extrapolate beyond observed targets.

## Continue, go deeper, apply it

Contrast variance-reducing bagging with the sequential error-correction of boosting.
