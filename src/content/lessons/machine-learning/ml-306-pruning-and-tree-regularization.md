---
title: "Pruning and tree regularization"
track: "machine-learning"
order: 306
status: live
summary: "Tree regularization limits brittle partitions through pre-pruning, post-pruning, leaf support, depth, and validation-selected complexity."
duration: "12 min read"
updated: "2026-08-30"
---

## The short answer

An unconstrained tree can memorize a training set. Regularization controls this by stopping weak splits early or by growing a tree and pruning branches whose validation value does not justify their complexity. The right tree is selected by out-of-sample behavior, not by how readable its training rules are.

## Why this matters

Trees are high-variance estimators: small data changes can alter upper splits and every branch below them. Regularization reduces variance, protects small subgroups, and produces rules that can be audited.

## How it works

Pre-pruning uses maximum depth, maximum leaves, minimum split size, minimum leaf size, or minimum impurity decrease. Cost-complexity post-pruning minimizes training loss plus \(\alpha\times\text{number of leaves}\), then chooses \(\alpha\) using validation. Larger leaves smooth predictions; shallower trees limit interactions.

## Worked examples and variations

1. **Customer support routing:** a depth-3 tree may be explainable and robust enough for human triage.
2. **House prices:** permit deeper interaction structure but enforce a minimum leaf size to avoid pricing a single unusual sale.
3. **Small protected subgroup:** require enough examples per leaf before using group-specific patterns.
4. **Boundary case:** an isolated, well-verified safety rule may deserve a small leaf despite a global minimum-size heuristic.
5. **Counterexample:** pruning by test-set accuracy turns the test set into a tuning set and makes its final score optimistic.

## Two ways to see it

**Bias–variance view:** restrictions increase bias slightly to reduce unstable variance.

**Governance view:** each extra split is an additional operational claim that needs support and monitoring.

## Hands-on

Train trees along a depth and minimum-leaf grid with nested cross-validation. Plot train and validation loss against leaf count. Deliberately grow to pure leaves and compare subgroup calibration; reset by selecting a regularized configuration only on inner folds. Save three bootstrap trees to inspect split instability.

## Checkpoint

- [ ] Complexity is selected without touching the final test set.
- [ ] Leaf sizes are checked for every consequential segment.
- [ ] Interpretability claims include instability caveats.

## What this does not solve

Regularization cannot repair a target defined after the decision or a deployment population that differs from training.

## Continue, go deeper, apply it

Apply this before random forests and gradient boosting, which regularize trees in different ways.
