---
title: "Decision-tree splitting criteria"
track: "machine-learning"
order: 305
status: live
summary: "Trees choose questions that reduce impurity or prediction error, but split gain must be validated against selection bias and unstable partitions."
duration: "13 min read"
updated: "2026-08-30"
---

## The short answer

A decision tree recursively asks feature questions that make child groups more homogeneous. Classification commonly uses Gini impurity or entropy; regression uses squared-error reduction. The best training split is not necessarily a reliable or meaningful one.

## Why this matters

Tree logic is easy to present to stakeholders, handles nonlinear interactions, and requires little scaling. Yet greedy splitting can prefer high-cardinality features, overreact to small samples, and convert a data artifact into a persuasive-looking rule.

## How it works

At each node, evaluate candidate thresholds or category partitions. For classification, choose the largest weighted decrease in impurity; for regression, choose the largest decrease in within-node squared error. Splits are greedy: once a root question is selected, later branches cannot revisit that decision. Minimum leaf counts and validation are therefore essential.

## Worked examples and variations

1. **Loan review:** split first on verified affordability, then on recent delinquency; show the leaf default rates and sample sizes.
2. **Demand forecast:** regression trees form piecewise-constant demand estimates across price and season.
3. **High-cardinality merchant ID:** raw information gain may favor it because many tiny leaves look pure.
4. **Boundary case:** a split with a modest impurity decrease may be worthwhile when it creates large, stable child samples.
5. **Counterexample:** entropy reduction does not prove a feature causes the outcome; a post-outcome processing flag may be leakage.

## Two ways to see it

**Information view:** a good question reduces uncertainty about the label.

**Partition view:** the tree tiles feature space into rectangles with local predictions.

## Hands-on

Fit shallow classification and regression trees with a fixed validation set. Calculate child sample counts and impurity change for the root split by hand. Deliberately include a row identifier, observe the selected split, then reset by removing or grouping identifiers and compare stability across bootstrap samples.

## Checkpoint

- [ ] You can state the criterion and its unit of improvement.
- [ ] Every reported leaf includes support, not only a prediction.
- [ ] Identifier-like and post-outcome features are audited.

## What this does not solve

Split criteria do not choose business actions, correct label bias, or guarantee a tree transfers across populations.

## Continue, go deeper, apply it

Continue with pruning and ensemble methods, where instability becomes a source of strength.
